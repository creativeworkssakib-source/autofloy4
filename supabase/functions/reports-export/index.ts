import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

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

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
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
    const url = new URL(req.url);
    const fromDate = url.searchParams.get("from");
    const toDate = url.searchParams.get("to");
    const format = url.searchParams.get("format") || "csv"; // csv or xlsx
    
    if (!fromDate || !toDate) {
      return new Response(JSON.stringify({ error: "Missing 'from' or 'to' date parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Exporting orders for user ${userId} from ${fromDate} to ${toDate} as ${format}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch orders with pagination to handle large datasets
    let allOrders: any[] = [];
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", `${fromDate}T00:00:00.000Z`)
        .lte("created_at", `${toDate}T23:59:59.999Z`)
        .order("created_at", { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        console.error("Error fetching orders:", error);
        throw error;
      }

      if (!orders || orders.length === 0) break;
      
      allOrders = allOrders.concat(orders);
      page++;
      
      if (orders.length < pageSize) break;
    }

    console.log(`Found ${allOrders.length} orders to export`);

    // Build data rows
    const headers = [
      'date',
      'invoice_id',
      'product_sku',
      'product_name',
      'qty',
      'buy_price',
      'sell_price',
      'status',
      'line_revenue',
      'line_cost',
      'line_profit',
      'customer_name',
      'customer_phone'
    ];

    const dataRows: any[][] = [];

    for (const order of allOrders) {
      const items = Array.isArray(order.items) ? order.items : [];
      const orderDate = order.order_date || order.created_at?.split('T')[0] || '';
      
      if (items.length === 0) {
        dataRows.push([
          orderDate,
          order.external_id || order.id,
          '',
          '',
          1,
          0,
          order.total,
          order.status,
          order.total,
          0,
          order.total,
          order.customer_name || '',
          order.customer_phone || '',
        ]);
      } else {
        for (const item of items) {
          const qty = item.quantity || item.qty || 1;
          const buyPrice = item.buy_price || item.cost || 0;
          const sellPrice = item.sell_price || item.price || 0;
          const lineRevenue = sellPrice * qty;
          const lineCost = buyPrice * qty;
          const lineProfit = lineRevenue - lineCost;

          dataRows.push([
            orderDate,
            order.external_id || order.id,
            item.sku || '',
            item.name || '',
            qty,
            buyPrice,
            sellPrice,
            order.status,
            lineRevenue,
            lineCost,
            lineProfit,
            order.customer_name || '',
            order.customer_phone || '',
          ]);
        }
      }
    }

    if (format === "xlsx") {
      // Create Excel workbook
      const wb = XLSX.utils.book_new();
      const wsData = [headers, ...dataRows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 12 }, // date
        { wch: 20 }, // invoice_id
        { wch: 15 }, // sku
        { wch: 25 }, // name
        { wch: 8 },  // qty
        { wch: 12 }, // buy_price
        { wch: 12 }, // sell_price
        { wch: 12 }, // status
        { wch: 12 }, // revenue
        { wch: 12 }, // cost
        { wch: 12 }, // profit
        { wch: 20 }, // customer_name
        { wch: 15 }, // customer_phone
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
      
      const xlsxBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      const filename = `sales_report_${fromDate}_to_${toDate}.xlsx`;

      return new Response(xlsxBuffer, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } else {
      // CSV format
      const csvRows: string[] = [headers.join(',')];
      for (const row of dataRows) {
        csvRows.push(row.map(escapeCSV).join(','));
      }
      
      const csvContent = csvRows.join('\n');
      const filename = `sales_report_${fromDate}_to_${toDate}.csv`;

      return new Response(csvContent, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }
  } catch (error) {
    console.error("Export error:", error);
    return new Response(JSON.stringify({ error: "Failed to export data" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
