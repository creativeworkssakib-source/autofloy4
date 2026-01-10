import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

    console.log(`Processing products file: ${file.name}, size: ${file.size}`);

    // Read file content
    const content = await file.text();
    
    // Parse CSV
    const rows = parseCSV(content);
    
    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: "No valid data rows found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Parsed ${rows.length} product rows from file`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get existing products by SKU for upsert logic
    const skusFromFile = rows.map(r => r.sku || r.product_sku).filter(Boolean);
    const { data: existingProducts } = await supabase
      .from("products")
      .select("id, sku")
      .eq("user_id", userId)
      .in("sku", skusFromFile);

    const existingSkuMap = new Map((existingProducts || []).map(p => [p.sku, p.id]));
    
    const productsToInsert: Record<string, unknown>[] = [];
    const productsToUpdate: { id: string; data: Record<string, unknown> }[] = [];
    const variantsToCreate: { productSku: string; data: Record<string, unknown> }[] = [];
    const errors: string[] = [];
    const categories = new Set<string>();

    // Track products that need to be created from variant rows
    const productsToCreateFromVariants = new Map<string, Record<string, unknown>>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Account for header row and 0-index
      
      // Check if this is a variant row (has variant columns)
      const variantName = row.variant_name || row.variantname;
      const productName = row.name || row.product_name || row.productname;
      const productSku = row.sku || row.product_sku;
      
      // If variant_name exists, this is a variant row
      if (variantName) {
        const variantSku = row.variant_sku || row.variantsku || '';
        const variantSize = row.size || '';
        const variantColor = row.color || '';
        const priceAdjStr = row.price_adjustment || row.priceadjustment || '0';
        const priceAdjustment = parseFloat(priceAdjStr);
        const variantStockStr = row.variant_stock || row.variantstock || '';
        const variantStock = variantStockStr ? parseInt(variantStockStr, 10) : null;
        const variantStatus = (row.variant_status || row.variantstatus || 'active').toLowerCase();
        const variantIsActive = variantStatus === 'active' || variantStatus === 'true' || variantStatus === '1';

        if (!productSku) {
          errors.push(`Row ${rowNum}: product_sku is required for variant rows`);
          continue;
        }

        // Check if the product needs to be created from this row
        // Only create if not already existing and not already queued for creation
        if (!existingSkuMap.has(productSku) && !productsToCreateFromVariants.has(productSku) && productName) {
          const priceStr = row.price || row.base_price || row.sell_price || row.sellprice || '0';
          const price = parseFloat(priceStr) || 0;
          const stockStr = row.stock_quantity || row.product_stock || row.stock || row.quantity || '';
          const stockQuantity = stockStr ? parseInt(stockStr, 10) : null;
          const status = (row.status || row.product_status || row.is_active || 'active').toLowerCase();
          const isActive = status === 'active' || status === 'true' || status === '1';
          const category = row.category || row.section || null;
          if (category) categories.add(category);

          productsToCreateFromVariants.set(productSku, {
            user_id: userId,
            name: productName,
            sku: productSku,
            price,
            currency: row.currency || 'BDT',
            description: row.description || null,
            image_url: row.image_url || row.imageurl || row.image || null,
            is_active: isActive,
            category,
            stock_quantity: stockQuantity,
          });
        }

        variantsToCreate.push({
          productSku,
          data: {
            name: variantName,
            sku: variantSku || null,
            size: variantSize || null,
            color: variantColor || null,
            price_adjustment: priceAdjustment || 0,
            stock_quantity: variantStock,
            is_active: variantIsActive,
          }
        });
        continue;
      }
      
      // Regular product row
      const name = productName;
      const sku = productSku;
      
      // Validate required fields
      if (!name) {
        errors.push(`Row ${rowNum}: name is required`);
        continue;
      }

      const priceStr = row.price || row.base_price || row.sell_price || row.sellprice || '0';
      const price = parseFloat(priceStr);
      if (isNaN(price)) {
        errors.push(`Row ${rowNum}: price must be a number`);
        continue;
      }

      const stockStr = row.stock_quantity || row.product_stock || row.stock || row.quantity || '';
      const stockQuantity = stockStr ? parseInt(stockStr, 10) : null;
      if (stockStr && isNaN(stockQuantity!)) {
        errors.push(`Row ${rowNum}: stock_quantity must be a number`);
        continue;
      }

      const status = (row.status || row.product_status || row.is_active || 'active').toLowerCase();
      const isActive = status === 'active' || status === 'true' || status === '1';

      const category = row.category || row.section || null;
      if (category) categories.add(category);

      const productData = {
        name,
        sku: sku || null,
        price,
        currency: row.currency || 'BDT',
        description: row.description || null,
        image_url: row.image_url || row.imageurl || row.image || null,
        is_active: isActive,
        category,
        stock_quantity: stockQuantity,
      };

      // Check if product with this SKU exists
      if (sku && existingSkuMap.has(sku)) {
        const existingId = existingSkuMap.get(sku)!;
        productsToUpdate.push({ id: existingId, data: productData });
      } else {
        productsToInsert.push({ user_id: userId, ...productData });
      }
    }

    // Add products from variant rows to insert list
    for (const productData of productsToCreateFromVariants.values()) {
      productsToInsert.push(productData);
    }

    // Batch insert new products
    let insertedCount = 0;
    const newProductSkuToId = new Map<string, string>();
    const BATCH_SIZE = 500;
    
    for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
      const batch = productsToInsert.slice(i, i + BATCH_SIZE);
      const { data, error } = await supabase
        .from("products")
        .insert(batch)
        .select("id, sku");
      
      if (error) {
        console.error(`Batch insert error at ${i}:`, error);
        errors.push(`Failed to insert batch starting at row ${i + 2}`);
      } else {
        insertedCount += data?.length || 0;
        // Map SKU to new product ID
        for (const p of data || []) {
          if (p.sku) newProductSkuToId.set(p.sku, p.id);
        }
      }
    }

    // Update existing products
    let updatedCount = 0;
    for (const { id, data } of productsToUpdate) {
      const { error } = await supabase
        .from("products")
        .update(data)
        .eq("id", id)
        .eq("user_id", userId);
      
      if (error) {
        console.error(`Update error for product ${id}:`, error);
      } else {
        updatedCount++;
      }
    }

    // Create variants
    let variantsCreated = 0;
    for (const { productSku, data } of variantsToCreate) {
      // Find product ID by SKU
      let productId = existingSkuMap.get(productSku) || newProductSkuToId.get(productSku);
      
      if (!productId) {
        errors.push(`Variant "${data.name}": Product with SKU "${productSku}" not found`);
        continue;
      }

      const { error } = await supabase
        .from("product_variants")
        .insert({
          user_id: userId,
          product_id: productId,
          ...data,
        });
      
      if (error) {
        console.error(`Error creating variant:`, error);
        errors.push(`Failed to create variant "${data.name}" for product SKU "${productSku}"`);
      } else {
        variantsCreated++;
      }
    }

    // Auto-create categories
    if (categories.size > 0) {
      const categoryInserts = Array.from(categories).map(name => ({
        user_id: userId,
        name,
      }));
      
      await supabase
        .from("product_categories")
        .upsert(categoryInserts, { onConflict: "user_id,name" });
    }

    console.log(`Products import complete: ${insertedCount} inserted, ${updatedCount} updated, ${variantsCreated} variants created, ${errors.length} errors`);

    const message = errors.length > 0
      ? `Imported ${insertedCount} products, updated ${updatedCount} products. ${errors.length} row(s) had errors.`
      : `Successfully imported ${insertedCount} products, updated ${updatedCount} products`;

    return new Response(JSON.stringify({
      success: errors.length === 0 || insertedCount + updatedCount > 0,
      message,
      inserted: insertedCount,
      updated: updatedCount,
      errors: errors.length,
      errorDetails: errors.slice(0, 10), // Return first 10 errors
      totalRows: rows.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Products import error:", error);
    return new Response(JSON.stringify({ error: "Failed to import products: " + (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
