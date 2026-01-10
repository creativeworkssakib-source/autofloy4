import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET")!;

// Escape ILIKE special characters to prevent pattern injection
function escapeILikePattern(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}

// Verify JWT token and extract user ID
async function verifyToken(token: string): Promise<string | null> {
  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload));
    
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return null;
    }
    
    return decoded.userId || decoded.sub || null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const userId = await verifyToken(token);

    if (!userId) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    const method = req.method;
    const pathParts = url.pathname.split("/").filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    // ===== SUPPLIER RETURNS ENDPOINTS =====
    if (action === "supplier-returns") {
      // GET - List supplier returns
      if (method === "GET") {
        const returnId = url.searchParams.get("id");
        
        let query = supabase
          .from("shop_supplier_returns")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (returnId) {
          query = query.eq("id", returnId);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Fetch supplier returns error:", error);
          return new Response(JSON.stringify({ error: "Failed to fetch supplier returns" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ returns: data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // POST - Create supplier return
      if (method === "POST") {
        const body = await req.json();
        const {
          supplier_id,
          supplier_name,
          purchase_id,
          product_id,
          product_name,
          quantity,
          return_reason,
          return_date,
          refund_amount,
          unit_cost,
          notes,
          photo_url,
          status = "pending",
        } = body;

        if (!product_name || !return_reason) {
          return new Response(
            JSON.stringify({ error: "Product name and return reason are required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { data, error } = await supabase
          .from("shop_supplier_returns")
          .insert({
            user_id: userId,
            supplier_id: supplier_id || null,
            supplier_name: supplier_name || null,
            purchase_id: purchase_id || null,
            product_id: product_id || null,
            product_name,
            quantity: quantity || 1,
            return_reason,
            return_date: return_date || new Date().toISOString().split("T")[0],
            refund_amount: refund_amount || 0,
            unit_cost: unit_cost || 0,
            notes: notes || null,
            photo_url: photo_url || null,
            status,
          })
          .select()
          .single();

        if (error) {
          console.error("Create supplier return error:", error);
          return new Response(JSON.stringify({ error: "Failed to create supplier return" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ return: data }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // PUT - Update supplier return
      if (method === "PUT") {
        const body = await req.json();
        const { id, ...updateData } = body;

        if (!id) {
          return new Response(JSON.stringify({ error: "Return ID is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await supabase
          .from("shop_supplier_returns")
          .update({ ...updateData, updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) {
          console.error("Update supplier return error:", error);
          return new Response(JSON.stringify({ error: "Failed to update supplier return" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ return: data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // DELETE - Soft delete supplier return (move to trash)
      if (method === "DELETE") {
        const id = url.searchParams.get("id");

        if (!id) {
          return new Response(JSON.stringify({ error: "Return ID is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // First, get the return data to store in trash
        const { data: returnData, error: fetchError } = await supabase
          .from("shop_supplier_returns")
          .select("*")
          .eq("id", id)
          .eq("user_id", userId)
          .single();

        if (fetchError || !returnData) {
          console.error("Fetch supplier return for delete error:", fetchError);
          return new Response(JSON.stringify({ error: "Supplier return not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Insert into trash
        const { error: trashError } = await supabase
          .from("shop_trash")
          .insert({
            user_id: userId,
            original_id: id,
            original_table: "shop_supplier_returns",
            data: returnData,
          });

        if (trashError) {
          console.error("Insert supplier return to trash error:", trashError);
          return new Response(JSON.stringify({ error: "Failed to move to trash" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Delete from original table
        const { error } = await supabase
          .from("shop_supplier_returns")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        if (error) {
          console.error("Delete supplier return error:", error);
          return new Response(JSON.stringify({ error: "Failed to delete supplier return" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ message: "Supplier return moved to trash" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ===== CUSTOMER PURCHASE HISTORY SEARCH =====
    if (method === "GET" && action === "customer-history") {
      const searchQuery = url.searchParams.get("search") || "";
      const customerId = url.searchParams.get("customerId");

      if (customerId) {
        // Get specific customer's purchase history
        const { data: customer } = await supabase
          .from("shop_customers")
          .select("*")
          .eq("id", customerId)
          .eq("user_id", userId)
          .single();

        const { data: sales } = await supabase
          .from("shop_sales")
          .select(`
            id, invoice_number, total, sale_date, payment_status,
            items:shop_sale_items(id, product_id, product_name, quantity, unit_price, total)
          `)
          .eq("customer_id", customerId)
          .eq("user_id", userId)
          .order("sale_date", { ascending: false });

        // Get customer's return statistics
        const { data: returnStats } = await supabase
          .from("shop_returns")
          .select("id, refund_amount")
          .eq("customer_id", customerId)
          .eq("user_id", userId);

        const totalReturns = returnStats?.length || 0;
        const totalRefundValue = returnStats?.reduce((sum, r) => sum + (r.refund_amount || 0), 0) || 0;

        return new Response(JSON.stringify({ 
          customer, 
          sales: sales || [],
          return_stats: {
            total_returns: totalReturns,
            total_refund_value: totalRefundValue,
            customer_name: customer?.name || "",
          }
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Search customers by name or phone - ALSO search in sales notes for walk-in customers
      const results: Array<{
        id: string;
        name: string;
        phone: string | null;
        total_purchases?: number;
        is_walk_in?: boolean;
        sale_ids?: string[];
      }> = [];

      // First, search registered customers
      let customerQuery = supabase
        .from("shop_customers")
        .select("id, name, phone, total_purchases")
        .eq("user_id", userId);

      if (searchQuery) {
        const sanitizedSearch = escapeILikePattern(searchQuery);
        customerQuery = customerQuery.or(`name.ilike.%${sanitizedSearch}%,phone.ilike.%${sanitizedSearch}%`);
      }

      const { data: registeredCustomers, error: customerError } = await customerQuery.limit(10);

      if (customerError) {
        console.error("Search customers error:", customerError);
      } else if (registeredCustomers) {
        results.push(...registeredCustomers.map(c => ({ ...c, is_walk_in: false })));
      }

      // Also search in sales for walk-in customers (stored in notes field)
      if (searchQuery) {
        const { data: salesWithWalkIn, error: salesError } = await supabase
          .from("shop_sales")
          .select(`
            id, notes, invoice_number, total, sale_date, payment_status,
            items:shop_sale_items(id, product_id, product_name, quantity, unit_price, total)
          `)
          .eq("user_id", userId)
          .is("customer_id", null) // Only walk-in customers (no linked customer)
          .or(`notes.ilike.%${escapeILikePattern(searchQuery)}%`)
          .order("sale_date", { ascending: false })
          .limit(20);

        if (salesError) {
          console.error("Search walk-in sales error:", salesError);
        } else if (salesWithWalkIn && salesWithWalkIn.length > 0) {
          // Parse customer info from notes and group by customer
          const walkInMap = new Map<string, {
            name: string;
            phone: string | null;
            sales: typeof salesWithWalkIn;
          }>();

          for (const sale of salesWithWalkIn) {
            if (sale.notes) {
              // Parse "Customer: Name (Phone)" format
              const match = sale.notes.match(/Customer:\s*(.+?)(?:\s*\((.+?)\))?$/);
              if (match) {
                const name = match[1].trim();
                const phone = match[2]?.trim() || null;
                const key = `${name.toLowerCase()}-${phone || ""}`;
                
                if (!walkInMap.has(key)) {
                  walkInMap.set(key, { name, phone, sales: [] });
                }
                walkInMap.get(key)!.sales.push(sale);
              }
            }
          }

          // Add walk-in customers to results
          for (const [key, data] of walkInMap) {
            // Check if this walk-in matches the search
            const matchesSearch = 
              data.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (data.phone && data.phone.includes(searchQuery));
            
            if (matchesSearch) {
              results.push({
                id: `walk-in-${key}`, // Special ID for walk-in customers
                name: data.name,
                phone: data.phone,
                total_purchases: data.sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0),
                is_walk_in: true,
                sale_ids: data.sales.map(s => s.id),
              });
            }
          }
        }
      }

      return new Response(JSON.stringify({ customers: results }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== PROCESS RESELLABLE RETURN (restore stock, adjust profit) =====
    if (method === "POST" && action === "process-resellable") {
      const body = await req.json();
      const { return_id, loss_amount, restore_stock } = body;

      if (!return_id) {
        return new Response(JSON.stringify({ error: "Return ID is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get the return record
      const { data: returnRecord, error: returnError } = await supabase
        .from("shop_returns")
        .select("*")
        .eq("id", return_id)
        .eq("user_id", userId)
        .single();

      if (returnError || !returnRecord) {
        return new Response(JSON.stringify({ error: "Return not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If restore_stock is true and product_id exists, add stock back
      if (restore_stock && returnRecord.product_id) {
        const { data: product } = await supabase
          .from("shop_products")
          .select("stock_quantity")
          .eq("id", returnRecord.product_id)
          .eq("user_id", userId)
          .single();

        if (product) {
          await supabase
            .from("shop_products")
            .update({
              stock_quantity: (product.stock_quantity || 0) + returnRecord.quantity,
              updated_at: new Date().toISOString(),
            })
            .eq("id", returnRecord.product_id)
            .eq("user_id", userId);
        }
      }

      // If there's a loss_amount and original_sale_id, adjust the sale's profit
      if (loss_amount > 0 && returnRecord.original_sale_id) {
        const { data: sale } = await supabase
          .from("shop_sales")
          .select("total_profit")
          .eq("id", returnRecord.original_sale_id)
          .eq("user_id", userId)
          .single();

        if (sale) {
          await supabase
            .from("shop_sales")
            .update({
              total_profit: Math.max(0, (sale.total_profit || 0) - loss_amount),
              updated_at: new Date().toISOString(),
            })
            .eq("id", returnRecord.original_sale_id)
            .eq("user_id", userId);
        }
      }

      // Update the return record
      const { data: updatedReturn, error: updateError } = await supabase
        .from("shop_returns")
        .update({
          is_resellable: restore_stock,
          loss_amount: loss_amount || 0,
          stock_restored: restore_stock,
          status: "processed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", return_id)
        .eq("user_id", userId)
        .select()
        .single();

      if (updateError) {
        console.error("Update return error:", updateError);
        return new Response(JSON.stringify({ error: "Failed to process return" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        return: updatedReturn,
        message: restore_stock 
          ? `Stock restored (+${returnRecord.quantity}). Loss: ৳${loss_amount || 0}`
          : `Return processed. Loss: ৳${loss_amount || 0}`,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET - List returns with optional filters
    if (method === "GET") {
      const returnId = url.searchParams.get("id");
      const startDate = url.searchParams.get("startDate");
      const endDate = url.searchParams.get("endDate");
      const reason = url.searchParams.get("reason");
      const status = url.searchParams.get("status");

      let query = supabase
        .from("shop_returns")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (returnId) {
        query = query.eq("id", returnId);
      }

      if (startDate) {
        query = query.gte("return_date", startDate);
      }

      if (endDate) {
        query = query.lte("return_date", endDate);
      }

      if (reason) {
        query = query.ilike("return_reason", `%${escapeILikePattern(reason)}%`);
      }

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Fetch returns error:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch returns" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ returns: data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST - Create new return
    if (method === "POST") {
      const body = await req.json();
      const {
        product_id,
        product_name,
        customer_id,
        customer_name,
        quantity,
        return_reason,
        return_date,
        refund_amount,
        notes,
        photo_url,
        status = "pending",
        original_sale_id,
        original_sale_date,
        original_unit_price,
        is_resellable = false,
        loss_amount = 0,
      } = body;

      if (!product_name || !return_reason) {
        return new Response(
          JSON.stringify({ error: "Product name and return reason are required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Create the return record - handle empty strings for UUIDs
      const { data, error } = await supabase
        .from("shop_returns")
        .insert({
          user_id: userId,
          product_id: product_id || null, // Convert empty string to null
          product_name,
          customer_id: customer_id || null, // Convert empty string to null
          customer_name: customer_name || null,
          quantity: quantity || 1,
          return_reason,
          return_date: return_date || new Date().toISOString().split("T")[0],
          refund_amount: refund_amount || 0,
          notes: notes || null,
          photo_url: photo_url || null,
          status: is_resellable ? "processed" : status, // Auto-process if resellable
          original_sale_id: original_sale_id || null, // Convert empty string to null
          original_sale_date: original_sale_date || null,
          original_unit_price: original_unit_price || 0,
          is_resellable,
          loss_amount: loss_amount || 0,
          stock_restored: is_resellable, // Set to true if resellable
        })
        .select()
        .single();

      if (error) {
        console.error("Create return error:", error);
        return new Response(JSON.stringify({ error: "Failed to create return" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If resellable, add stock back to inventory
      if (is_resellable && product_id) {
        const { data: product } = await supabase
          .from("shop_products")
          .select("stock_quantity")
          .eq("id", product_id)
          .eq("user_id", userId)
          .single();

        if (product) {
          await supabase
            .from("shop_products")
            .update({
              stock_quantity: (product.stock_quantity || 0) + (quantity || 1),
              updated_at: new Date().toISOString(),
            })
            .eq("id", product_id)
            .eq("user_id", userId);
          
          console.log(`Stock restored: +${quantity || 1} for product ${product_id}`);
        }
      }

      // If there's a loss_amount and original_sale_id, adjust the sale's profit
      if (loss_amount > 0 && original_sale_id) {
        const { data: sale } = await supabase
          .from("shop_sales")
          .select("total_profit")
          .eq("id", original_sale_id)
          .eq("user_id", userId)
          .single();

        if (sale) {
          await supabase
            .from("shop_sales")
            .update({
              total_profit: Math.max(0, (sale.total_profit || 0) - loss_amount),
              updated_at: new Date().toISOString(),
            })
            .eq("id", original_sale_id)
            .eq("user_id", userId);
          
          console.log(`Profit adjusted: -${loss_amount} for sale ${original_sale_id}`);
        }
      }

      // If not resellable, deduct the refund amount from sale profit automatically
      if (!is_resellable && original_sale_id && refund_amount > 0) {
        const { data: sale } = await supabase
          .from("shop_sales")
          .select("total_profit")
          .eq("id", original_sale_id)
          .eq("user_id", userId)
          .single();

        if (sale) {
          const deduction = loss_amount > 0 ? loss_amount : refund_amount;
          await supabase
            .from("shop_sales")
            .update({
              total_profit: Math.max(0, (sale.total_profit || 0) - deduction),
              updated_at: new Date().toISOString(),
            })
            .eq("id", original_sale_id)
            .eq("user_id", userId);
          
          console.log(`Profit deducted: -${deduction} for sale ${original_sale_id}`);
        }
      }

      const message = is_resellable 
        ? `Return created. Stock restored (+${quantity || 1})`
        : `Return created. Loss: ৳${loss_amount || refund_amount || 0}`;

      return new Response(JSON.stringify({ return: data, message }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PUT - Update return
    if (method === "PUT") {
      const body = await req.json();
      const { id, ...updateData } = body;

      if (!id) {
        return new Response(JSON.stringify({ error: "Return ID is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabase
        .from("shop_returns")
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("Update return error:", error);
        return new Response(JSON.stringify({ error: "Failed to update return" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ return: data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE - Soft delete return (move to trash)
    if (method === "DELETE") {
      const id = url.searchParams.get("id");

      if (!id) {
        return new Response(JSON.stringify({ error: "Return ID is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // First, get the return data to store in trash
      const { data: returnData, error: fetchError } = await supabase
        .from("shop_returns")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (fetchError || !returnData) {
        console.error("Fetch return for delete error:", fetchError);
        return new Response(JSON.stringify({ error: "Return not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Insert into trash
      const { error: trashError } = await supabase
        .from("shop_trash")
        .insert({
          user_id: userId,
          original_id: id,
          original_table: "shop_returns",
          data: returnData,
        });

      if (trashError) {
        console.error("Insert to trash error:", trashError);
        return new Response(JSON.stringify({ error: "Failed to move to trash" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete from original table
      const { error } = await supabase
        .from("shop_returns")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.error("Delete return error:", error);
        return new Response(JSON.stringify({ error: "Failed to delete return" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ message: "Return moved to trash" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Shop returns error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
