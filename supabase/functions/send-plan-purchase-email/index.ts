import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getPlanPurchaseEmailTemplate } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

// Plan display names
const planDisplayNames: Record<string, string> = {
  starter: "Starter",
  professional: "Professional",
  business: "Business",
  lifetime: "Lifetime",
};

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
  } catch {
    return null;
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userId = await verifyToken(req.headers.get("Authorization"));
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { planId, amount, currency, startDate, endDate, invoiceNumber } = await req.json();

    if (!planId || !amount) {
      return new Response(JSON.stringify({ error: "Plan and amount are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user details
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("email, display_name")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      console.error("User fetch error:", userError);
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send plan purchase confirmation email
    const resend = new Resend(resendApiKey);
    const userName = user.display_name || user.email.split("@")[0];
    const planName = planDisplayNames[planId] || planId;
    
    const emailHtml = getPlanPurchaseEmailTemplate(
      userName,
      planName,
      amount.toString(),
      currency || "BDT",
      formatDate(startDate || new Date().toISOString()),
      formatDate(endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()),
      invoiceNumber
    );

    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "AutoFloy <noreply@autofloy.online>",
        to: [user.email],
        subject: `✅ Payment Confirmed - ${planName} Plan Activated!`,
        html: emailHtml,
      });

      if (emailError) {
        console.error("Resend API error:", JSON.stringify(emailError, null, 2));
        return new Response(JSON.stringify({ 
          error: "Failed to send confirmation email",
          code: "EMAIL_SEND_FAILED"
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Plan purchase email sent successfully:", emailData);
      
      return new Response(JSON.stringify({ 
        message: "Confirmation email sent successfully" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (emailErr: any) {
      console.error("Email send exception:", emailErr);
      return new Response(JSON.stringify({ 
        error: "Failed to send confirmation email",
        code: "EMAIL_SEND_FAILED"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Send plan purchase email error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
