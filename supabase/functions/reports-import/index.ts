import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET")!;

async function verifyToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
    const payload = await verify(token, key);
    return payload.sub as string;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  
  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Handle quoted values with commas inside
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }
  
  return rows;
}

function normalizeStatus(status: string): string {
  const s = status.toLowerCase().trim();
  if (s === 'delivered' || s === 'complete' || s === 'completed') return 'delivered';
  if (s === 'pending' || s === 'processing') return 'pending';
  if (s === 'confirmed' || s === 'approved') return 'confirmed';
  if (s === 'shipped' || s === 'in_transit') return 'shipped';
  if (s === 'cancelled' || s === 'canceled') return 'cancelled';
  if (s === 'returned' || s === 'return') return 'returned';
  if (s === 'damaged' || s === 'damage') return 'damaged';
  if (s === 'expired' || s === 'expire') return 'expired';
  return 'pending';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = await verifyToken(req.headers.get("Authorization"));
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);

    // Read file content
    const content = await file.text();
    
    // Parse CSV (Excel files saved as CSV work the same)
    const rows = parseCSV(content);
    
    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: "No valid data rows found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Parsed ${rows.length} rows from file`);

    // Group rows by invoice_id to create orders
    const ordersByInvoice = new Map<string, typeof rows>();
    
    for (const row of rows) {
      const invoiceId = row.invoice_id || row.invoiceid || row.order_id || row.orderid || `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (!ordersByInvoice.has(invoiceId)) {
        ordersByInvoice.set(invoiceId, []);
      }
      ordersByInvoice.get(invoiceId)!.push(row);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Prepare batch insert
    const ordersToInsert = [];
    const BATCH_SIZE = 500;
    
    for (const [invoiceId, invoiceRows] of ordersByInvoice) {
      const firstRow = invoiceRows[0];
      
      // Build items array
      const items = invoiceRows.map(row => ({
        sku: row.product_sku || row.sku || '',
        name: row.product_name || row.productname || row.name || '',
        quantity: parseInt(row.qty || row.quantity || '1', 10) || 1,
        buy_price: parseFloat(row.buy_price || row.buyprice || row.cost || '0') || 0,
        sell_price: parseFloat(row.sell_price || row.sellprice || row.price || '0') || 0,
      }));
      
      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.sell_price * item.quantity), 0);
      const total = subtotal;
      
      // Parse date
      let orderDate = null;
      const dateStr = firstRow.date || firstRow.order_date || firstRow.orderdate;
      if (dateStr) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          orderDate = parsed.toISOString().split('T')[0];
        }
      }
      
      ordersToInsert.push({
        user_id: userId,
        external_id: invoiceId,
        order_date: orderDate,
        status: normalizeStatus(firstRow.status || 'pending'),
        items: items,
        subtotal: subtotal,
        total: total,
        discount: 0,
        currency: 'BDT',
        customer_name: firstRow.customer_name || firstRow.customername || null,
        customer_phone: firstRow.customer_phone || firstRow.customerphone || null,
        customer_address: firstRow.customer_address || firstRow.customeraddress || null,
        created_at: orderDate ? new Date(orderDate).toISOString() : new Date().toISOString(),
      });
    }

    // Batch insert orders
    let insertedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < ordersToInsert.length; i += BATCH_SIZE) {
      const batch = ordersToInsert.slice(i, i + BATCH_SIZE);
      
      const { data, error } = await supabase
        .from("orders")
        .insert(batch)
        .select("id");
      
      if (error) {
        console.error(`Batch insert error at ${i}:`, error);
        errorCount += batch.length;
      } else {
        insertedCount += data?.length || 0;
      }
    }

    console.log(`Import complete: ${insertedCount} orders inserted, ${errorCount} errors`);

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully imported ${insertedCount} orders from ${rows.length} rows`,
      inserted: insertedCount,
      errors: errorCount,
      totalRows: rows.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Import error:", error);
    return new Response(JSON.stringify({ error: "Failed to import file: " + (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
