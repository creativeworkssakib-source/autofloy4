import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, cache-control, pragma",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET")!;

async function verifyToken(authHeader: string | null): Promise<string | null> {
  console.log("[products] verifyToken called, hasAuthHeader:", !!authHeader);
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("[products] No valid auth header found");
    return null;
  }
  
  const token = authHeader.substring(7);
  console.log("[products] Token length:", token.length);
  
  if (!jwtSecret) {
    console.error("[products] JWT_SECRET not configured!");
    return null;
  }
  
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
    const payload = await verify(token, key);
    console.log("[products] Token verified successfully, userId:", payload.sub);
    return payload.sub as string;
  } catch (error) {
    console.error("[products] Token verification failed:", error);
    return null;
  }
}

serve(async (req) => {
  console.log("[products]", req.method, req.url);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const userId = await verifyToken(req.headers.get("Authorization"));
  if (!userId) {
    console.log("[products] Unauthorized - returning 401");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  console.log("[products] Authenticated user:", userId);

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const url = new URL(req.url);

  try {
    // GET - List products or categories
    if (req.method === "GET") {
      const action = url.searchParams.get("action");
      
      // Get categories
      if (action === "categories") {
        const { data: categories, error } = await supabase
          .from("product_categories")
          .select("*")
          .eq("user_id", userId)
          .order("name");

        if (error) {
          console.error("Error fetching categories:", error);
          return new Response(JSON.stringify({ error: "Failed to fetch categories" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ categories: categories || [] }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Export products as CSV (with variants)
      if (action === "export") {
        const includeVariants = url.searchParams.get("include_variants") === "true";
        
        const { data: products, error } = await supabase
          .from("products")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error exporting products:", error);
          return new Response(JSON.stringify({ error: "Failed to export products" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (includeVariants) {
          // Export with variants
          const { data: variants } = await supabase
            .from("product_variants")
            .select("*")
            .eq("user_id", userId);

          const variantMap = new Map<string, typeof variants>();
          for (const v of variants || []) {
            const list = variantMap.get(v.product_id) || [];
            list.push(v);
            variantMap.set(v.product_id, list);
          }

          const headers = ["product_name", "product_sku", "category", "base_price", "currency", "product_stock", "product_status", "description", "image_url", "variant_name", "variant_sku", "size", "color", "price_adjustment", "variant_stock", "variant_status"];
          const csvRows = [headers.join(",")];
          
          for (const p of products || []) {
            const productVariants = variantMap.get(p.id) || [];
            if (productVariants.length === 0) {
              // Product without variants
              const row = [
                `"${(p.name || "").replace(/"/g, '""')}"`,
                `"${(p.sku || "").replace(/"/g, '""')}"`,
                `"${(p.category || "").replace(/"/g, '""')}"`,
                p.price || 0,
                p.currency || "BDT",
                p.stock_quantity ?? "",
                p.is_active ? "active" : "inactive",
                `"${(p.description || "").replace(/"/g, '""')}"`,
                `"${(p.image_url || "").replace(/"/g, '""')}"`,
                "", "", "", "", "", "", ""
              ];
              csvRows.push(row.join(","));
            } else {
              // Product with variants
              for (const v of productVariants) {
                const row = [
                  `"${(p.name || "").replace(/"/g, '""')}"`,
                  `"${(p.sku || "").replace(/"/g, '""')}"`,
                  `"${(p.category || "").replace(/"/g, '""')}"`,
                  p.price || 0,
                  p.currency || "BDT",
                  p.stock_quantity ?? "",
                  p.is_active ? "active" : "inactive",
                  `"${(p.description || "").replace(/"/g, '""')}"`,
                  `"${(p.image_url || "").replace(/"/g, '""')}"`,
                  `"${(v.name || "").replace(/"/g, '""')}"`,
                  `"${(v.sku || "").replace(/"/g, '""')}"`,
                  `"${(v.size || "").replace(/"/g, '""')}"`,
                  `"${(v.color || "").replace(/"/g, '""')}"`,
                  v.price_adjustment || 0,
                  v.stock_quantity ?? "",
                  v.is_active ? "active" : "inactive"
                ];
                csvRows.push(row.join(","));
              }
            }
          }

          return new Response(csvRows.join("\n"), {
            status: 200,
            headers: { 
              ...corsHeaders, 
              "Content-Type": "text/csv",
              "Content-Disposition": "attachment; filename=products_with_variants_export.csv"
            },
          });
        }

        // Standard export without variants
        const headers = ["name", "sku", "category", "price", "currency", "stock_quantity", "status", "description", "image_url"];
        const csvRows = [headers.join(",")];
        
        for (const p of products || []) {
          const row = [
            `"${(p.name || "").replace(/"/g, '""')}"`,
            `"${(p.sku || "").replace(/"/g, '""')}"`,
            `"${(p.category || "").replace(/"/g, '""')}"`,
            p.price || 0,
            p.currency || "BDT",
            p.stock_quantity ?? "",
            p.is_active ? "active" : "inactive",
            `"${(p.description || "").replace(/"/g, '""')}"`,
            `"${(p.image_url || "").replace(/"/g, '""')}"`,
          ];
          csvRows.push(row.join(","));
        }

        return new Response(csvRows.join("\n"), {
          status: 200,
          headers: { 
            ...corsHeaders, 
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=products_export.csv"
          },
        });
      }

      // Get variants for a product
      if (action === "variants") {
        const productId = url.searchParams.get("product_id");
        if (!productId) {
          return new Response(JSON.stringify({ error: "Product ID required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: variants, error } = await supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", productId)
          .eq("user_id", userId)
          .order("name");

        if (error) {
          console.error("Error fetching variants:", error);
          return new Response(JSON.stringify({ error: "Failed to fetch variants" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ variants: variants || [] }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const productId = url.searchParams.get("id");

      if (productId) {
        // Get single product with variants
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .eq("user_id", userId)
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: "Product not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Also fetch variants
        const { data: variants } = await supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", productId)
          .eq("user_id", userId)
          .order("name");

        return new Response(JSON.stringify({ product: data, variants: variants || [] }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // List all products with variant stock calculation
      const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching products:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch products" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch all variants for this user to calculate stock
      const { data: allVariants } = await supabase
        .from("product_variants")
        .select("product_id, stock_quantity, is_active")
        .eq("user_id", userId);

      // Calculate variant stock for each product
      const variantStockMap = new Map<string, number>();
      const variantCountMap = new Map<string, number>();
      for (const v of allVariants || []) {
        const count = variantCountMap.get(v.product_id) || 0;
        variantCountMap.set(v.product_id, count + 1);
        if (v.is_active && v.stock_quantity !== null) {
          const current = variantStockMap.get(v.product_id) || 0;
          variantStockMap.set(v.product_id, current + v.stock_quantity);
        }
      }

      // Add variantStock and hasVariants to products
      const productsWithVariantStock = (products || []).map(p => ({
        ...p,
        variantStock: variantCountMap.has(p.id) ? (variantStockMap.get(p.id) || 0) : null,
        hasVariants: variantCountMap.has(p.id) && (variantCountMap.get(p.id) || 0) > 0,
      }));

      // Also get distinct categories and brands from products
      const categories = [...new Set((products || []).map(p => p.category).filter(Boolean))];
      const brands = [...new Set((products || []).map(p => p.brand).filter(Boolean))];

      return new Response(JSON.stringify({ products: productsWithVariantStock, categories, brands }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST - Create product or bulk operations
    if (req.method === "POST") {
      const body = await req.json();
      const action = body.action;

      // Bulk delete
      if (action === "bulk_delete") {
        const { ids } = body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
          return new Response(JSON.stringify({ error: "No product IDs provided" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check if sync is enabled
        const { data: syncSettings } = await supabase
          .from("sync_settings")
          .select("sync_enabled")
          .eq("user_id", userId)
          .maybeSingle();

        if (syncSettings?.sync_enabled) {
          // If sync is ON, move to trash instead of permanent delete
          for (const productId of ids) {
            const { data: product } = await supabase
              .from("products")
              .select("*")
              .eq("id", productId)
              .eq("user_id", userId)
              .single();

            if (product) {
              // Save to offline shop trash
              await supabase.from("shop_trash").insert({
                user_id: userId,
                original_table: "products",
                original_id: productId,
                data: product,
              });

              // Also delete from linked offline product if exists
              if (product.sku) {
                await supabase
                  .from("shop_products")
                  .delete()
                  .eq("user_id", userId)
                  .eq("online_sku", product.sku);
              }

              // Delete the online product
              await supabase
                .from("products")
                .delete()
                .eq("id", productId)
                .eq("user_id", userId);
            }
          }

          console.log(`Bulk deleted ${ids.length} synced products for user ${userId} (moved to trash)`);
        } else {
          // Normal delete if sync is off
          const { error } = await supabase
            .from("products")
            .delete()
            .in("id", ids)
            .eq("user_id", userId);

          if (error) {
            console.error("Error bulk deleting products:", error);
            return new Response(JSON.stringify({ error: "Failed to delete products" }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          console.log(`Bulk deleted ${ids.length} products for user ${userId}`);
        }

        return new Response(JSON.stringify({ success: true, deleted: ids.length }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Bulk update
      if (action === "bulk_update") {
        const { ids, updates } = body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
          return new Response(JSON.stringify({ error: "No product IDs provided" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const updateData: Record<string, unknown> = {};
        if (updates.category !== undefined) updateData.category = updates.category;
        if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
        if (updates.stock_quantity !== undefined) updateData.stock_quantity = updates.stock_quantity;

        const { error } = await supabase
          .from("products")
          .update(updateData)
          .in("id", ids)
          .eq("user_id", userId);

        if (error) {
          console.error("Error bulk updating products:", error);
          return new Response(JSON.stringify({ error: "Failed to update products" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log(`Bulk updated ${ids.length} products for user ${userId}`);

        return new Response(JSON.stringify({ success: true, updated: ids.length }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create category
      if (action === "create_category") {
        const { name } = body;
        if (!name) {
          return new Response(JSON.stringify({ error: "Category name is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: category, error } = await supabase
          .from("product_categories")
          .insert({ user_id: userId, name })
          .select()
          .single();

        if (error) {
          if (error.code === "23505") {
            return new Response(JSON.stringify({ error: "Category already exists" }), {
              status: 409,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          console.error("Error creating category:", error);
          return new Response(JSON.stringify({ error: "Failed to create category" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ category }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create variant
      if (action === "create_variant") {
        const { product_id, name, sku, price_adjustment, stock_quantity, is_active, size, color } = body;
        
        if (!product_id || !name) {
          return new Response(JSON.stringify({ error: "Product ID and variant name are required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verify product belongs to user
        const { data: productCheck } = await supabase
          .from("products")
          .select("id")
          .eq("id", product_id)
          .eq("user_id", userId)
          .single();

        if (!productCheck) {
          return new Response(JSON.stringify({ error: "Product not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: variant, error } = await supabase
          .from("product_variants")
          .insert({
            user_id: userId,
            product_id,
            name,
            sku: sku || null,
            price_adjustment: price_adjustment || 0,
            stock_quantity: stock_quantity ?? null,
            is_active: is_active ?? true,
            size: size || null,
            color: color || null,
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating variant:", error);
          return new Response(JSON.stringify({ error: "Failed to create variant" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log(`Created variant ${variant.id} for product ${product_id}`);

        return new Response(JSON.stringify({ variant }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update variant
      if (action === "update_variant") {
        const { id, name, sku, price_adjustment, stock_quantity, is_active, size, color } = body;
        
        if (!id) {
          return new Response(JSON.stringify({ error: "Variant ID is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const updates: Record<string, unknown> = {};
        if (name !== undefined) updates.name = name;
        if (sku !== undefined) updates.sku = sku;
        if (price_adjustment !== undefined) updates.price_adjustment = price_adjustment;
        if (stock_quantity !== undefined) updates.stock_quantity = stock_quantity;
        if (is_active !== undefined) updates.is_active = is_active;
        if (size !== undefined) updates.size = size;
        if (color !== undefined) updates.color = color;

        const { data: variant, error } = await supabase
          .from("product_variants")
          .update(updates)
          .eq("id", id)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) {
          console.error("Error updating variant:", error);
          return new Response(JSON.stringify({ error: "Failed to update variant" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log(`Updated variant ${id}`);

        return new Response(JSON.stringify({ variant }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete variant
      if (action === "delete_variant") {
        const { id } = body;
        
        if (!id) {
          return new Response(JSON.stringify({ error: "Variant ID is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error } = await supabase
          .from("product_variants")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        if (error) {
          console.error("Error deleting variant:", error);
          return new Response(JSON.stringify({ error: "Failed to delete variant" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log(`Deleted variant ${id}`);

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Bulk import products
      if (action === "bulk_import") {
        const { products: productsToImport } = body;
        
        if (!productsToImport || !Array.isArray(productsToImport) || productsToImport.length === 0) {
          return new Response(JSON.stringify({ error: "No products provided", success: false, inserted: 0, errors: 0 }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        let inserted = 0;
        let errors = 0;
        const categories = new Set<string>();

        // Process products in batch
        for (const prod of productsToImport) {
          if (!prod.name) {
            errors++;
            continue;
          }

          try {
            const { error: insertError } = await supabase
              .from("products")
              .insert({
                user_id: userId,
                name: prod.name,
                sku: prod.sku || null,
                price: prod.price || 0,
                purchase_price: prod.purchase_price || 0,
                currency: prod.currency || "BDT",
                description: prod.description || null,
                image_url: prod.image_url || null,
                is_active: prod.is_active ?? true,
                category: prod.category || null,
                stock_quantity: prod.stock_quantity ?? null,
                min_stock_alert: prod.min_stock_alert ?? 5,
                unit: prod.unit || "pcs",
                barcode: prod.barcode || null,
                expiry_date: prod.expiry_date || null,
                supplier_name: prod.supplier_name || null,
                brand: prod.brand || null,
              });

            if (insertError) {
              console.error("Error inserting product:", prod.name, insertError);
              errors++;
            } else {
              inserted++;
              if (prod.category) {
                categories.add(prod.category);
              }
            }
          } catch (e) {
            console.error("Exception inserting product:", prod.name, e);
            errors++;
          }
        }

        // Auto-create categories
        for (const catName of categories) {
          await supabase
            .from("product_categories")
            .upsert({ user_id: userId, name: catName }, { onConflict: "user_id,name" });
        }

        console.log(`Bulk imported ${inserted} products, ${errors} errors for user ${userId}`);

        return new Response(JSON.stringify({ 
          success: true, 
          inserted, 
          errors,
          totalRows: productsToImport.length 
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create product
      const { 
        name, sku, price, currency, description, image_url, is_active, category, stock_quantity,
        purchase_price, min_stock_alert, unit, barcode, expiry_date, supplier_name, brand
      } = body;

      if (!name) {
        return new Response(JSON.stringify({ error: "Product name is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: product, error } = await supabase
        .from("products")
        .insert({
          user_id: userId,
          name,
          sku: sku || null,
          price: price || 0,
          purchase_price: purchase_price || 0,
          currency: currency || "BDT",
          description: description || null,
          image_url: image_url || null,
          is_active: is_active ?? true,
          category: category || null,
          stock_quantity: stock_quantity ?? null,
          min_stock_alert: min_stock_alert ?? 5,
          unit: unit || "pcs",
          barcode: barcode || null,
          expiry_date: expiry_date || null,
          supplier_name: supplier_name || null,
          brand: brand || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating product:", error);
        return new Response(JSON.stringify({ error: "Failed to create product" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Auto-create category if new
      if (category) {
        await supabase
          .from("product_categories")
          .upsert({ user_id: userId, name: category }, { onConflict: "user_id,name" });
      }

      console.log(`Created product ${product.id} for user ${userId}`);

      return new Response(JSON.stringify({ product }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PUT - Update product
    if (req.method === "PUT") {
      const body = await req.json();
      const { 
        id, name, sku, price, currency, description, image_url, is_active, category, stock_quantity,
        purchase_price, min_stock_alert, unit, barcode, expiry_date, supplier_name, brand
      } = body;

      if (!id) {
        return new Response(JSON.stringify({ error: "Product ID is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (sku !== undefined) updates.sku = sku;
      if (price !== undefined) updates.price = price;
      if (purchase_price !== undefined) updates.purchase_price = purchase_price;
      if (currency !== undefined) updates.currency = currency;
      if (description !== undefined) updates.description = description;
      if (image_url !== undefined) updates.image_url = image_url;
      if (is_active !== undefined) updates.is_active = is_active;
      if (category !== undefined) updates.category = category;
      if (stock_quantity !== undefined) updates.stock_quantity = stock_quantity;
      if (min_stock_alert !== undefined) updates.min_stock_alert = min_stock_alert;
      if (unit !== undefined) updates.unit = unit;
      if (barcode !== undefined) updates.barcode = barcode;
      if (expiry_date !== undefined) updates.expiry_date = expiry_date;
      if (supplier_name !== undefined) updates.supplier_name = supplier_name;
      if (brand !== undefined) updates.brand = brand;

      const { data: product, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error updating product:", error);
        return new Response(JSON.stringify({ error: "Failed to update product" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Auto-create category if new
      if (category) {
        await supabase
          .from("product_categories")
          .upsert({ user_id: userId, name: category }, { onConflict: "user_id,name" });
      }

      console.log(`Updated product ${id} for user ${userId}`);

      return new Response(JSON.stringify({ product }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE - Delete product
    if (req.method === "DELETE") {
      const id = url.searchParams.get("id");

      if (!id) {
        return new Response(JSON.stringify({ error: "Product ID is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if sync is enabled
      const { data: syncSettings } = await supabase
        .from("sync_settings")
        .select("sync_enabled")
        .eq("user_id", userId)
        .maybeSingle();

      if (syncSettings?.sync_enabled) {
        // If sync is ON, move to trash instead of permanent delete
        const { data: product } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .eq("user_id", userId)
          .single();

        if (product) {
          // Save to offline shop trash
          await supabase.from("shop_trash").insert({
            user_id: userId,
            original_table: "products",
            original_id: id,
            data: product,
          });

          // Also delete linked offline product if exists
          if (product.sku) {
            await supabase
              .from("shop_products")
              .delete()
              .eq("user_id", userId)
              .eq("online_sku", product.sku);
          }

          // Delete the online product
          await supabase
            .from("products")
            .delete()
            .eq("id", id)
            .eq("user_id", userId);

          console.log(`Deleted synced product ${id} for user ${userId} (moved to trash)`);
        }
      } else {
        // Normal delete if sync is off
        const { error } = await supabase
          .from("products")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        if (error) {
          console.error("Error deleting product:", error);
          return new Response(JSON.stringify({ error: "Failed to delete product" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log(`Deleted product ${id} for user ${userId}`);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Products error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
