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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const userId = await verifyToken(req.headers.get("Authorization"));
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const loanId = pathParts[2]; // /shop-loans/:id

  try {
    // GET /shop-loans - List all loans
    if (req.method === "GET" && !loanId) {
      const shopId = url.searchParams.get("shop_id");
      const status = url.searchParams.get("status");
      
      let query = supabase
        .from("shop_loans")
        .select("*")
        .eq("user_id", userId)
        .order("next_payment_date", { ascending: true });
      
      if (shopId) {
        query = query.eq("shop_id", shopId);
      }
      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate upcoming payments (within 7 days)
      const today = new Date();
      const upcoming = data?.filter(loan => {
        if (!loan.next_payment_date || loan.status !== 'active') return false;
        const paymentDate = new Date(loan.next_payment_date);
        const diffDays = Math.ceil((paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      }) || [];

      // Calculate overdue payments
      const overdue = data?.filter(loan => {
        if (!loan.next_payment_date || loan.status !== 'active') return false;
        const paymentDate = new Date(loan.next_payment_date);
        return paymentDate < today;
      }) || [];

      // Calculate totals
      const totalLoans = data?.reduce((sum, loan) => sum + Number(loan.loan_amount || 0), 0) || 0;
      const totalPaid = data?.reduce((sum, loan) => sum + Number(loan.total_paid || 0), 0) || 0;
      const totalRemaining = data?.reduce((sum, loan) => sum + Number(loan.remaining_amount || 0), 0) || 0;
      const monthlyEmi = data?.filter(l => l.status === 'active')
        .reduce((sum, loan) => sum + Number(loan.installment_amount || 0), 0) || 0;

      return new Response(JSON.stringify({ 
        loans: data,
        stats: {
          totalLoans,
          totalPaid,
          totalRemaining,
          monthlyEmi,
          upcomingCount: upcoming.length,
          overdueCount: overdue.length,
          activeCount: data?.filter(l => l.status === 'active').length || 0,
          completedCount: data?.filter(l => l.status === 'completed').length || 0,
        },
        upcoming,
        overdue
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /shop-loans/:id - Get single loan with payments
    if (req.method === "GET" && loanId) {
      const { data: loan, error: loanError } = await supabase
        .from("shop_loans")
        .select("*")
        .eq("id", loanId)
        .eq("user_id", userId)
        .single();

      if (loanError) throw loanError;

      const { data: payments, error: paymentsError } = await supabase
        .from("shop_loan_payments")
        .select("*")
        .eq("loan_id", loanId)
        .order("payment_date", { ascending: false });

      if (paymentsError) throw paymentsError;

      return new Response(JSON.stringify({ loan, payments }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /shop-loans - Create new loan
    if (req.method === "POST" && !loanId) {
      const body = await req.json();
      
      // Calculate remaining amount
      const loanAmount = Number(body.loan_amount) || 0;
      const interestRate = Number(body.interest_rate) || 0;
      const totalInstallments = Number(body.total_installments) || 1;
      
      // Simple interest calculation for total amount
      const totalWithInterest = loanAmount + (loanAmount * interestRate * totalInstallments / 12 / 100);
      const installmentAmount = body.installment_amount || (totalWithInterest / totalInstallments);
      
      // Calculate next payment date
      const startDate = new Date(body.start_date || new Date());
      const paymentDay = body.payment_day || startDate.getDate();
      let nextPaymentDate = new Date(startDate);
      nextPaymentDate.setDate(paymentDay);
      if (nextPaymentDate <= new Date()) {
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      }

      const { data, error } = await supabase
        .from("shop_loans")
        .insert({
          user_id: userId,
          shop_id: body.shop_id || null,
          lender_name: body.lender_name,
          lender_type: body.lender_type || 'bank',
          loan_amount: loanAmount,
          interest_rate: interestRate,
          total_installments: totalInstallments,
          installment_amount: installmentAmount,
          start_date: body.start_date || new Date().toISOString().split('T')[0],
          next_payment_date: nextPaymentDate.toISOString().split('T')[0],
          payment_day: paymentDay,
          remaining_amount: totalWithInterest,
          notes: body.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ loan: data }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PUT /shop-loans/:id - Update loan
    if (req.method === "PUT" && loanId) {
      const body = await req.json();
      
      const { data, error } = await supabase
        .from("shop_loans")
        .update({
          lender_name: body.lender_name,
          lender_type: body.lender_type,
          loan_amount: body.loan_amount,
          interest_rate: body.interest_rate,
          total_installments: body.total_installments,
          installment_amount: body.installment_amount,
          payment_day: body.payment_day,
          notes: body.notes,
          status: body.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", loanId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ loan: data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE /shop-loans/:id - Delete loan
    if (req.method === "DELETE" && loanId) {
      const { error } = await supabase
        .from("shop_loans")
        .delete()
        .eq("id", loanId)
        .eq("user_id", userId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /shop-loans/:id/payments - Add payment to loan
    if (req.method === "POST" && loanId && url.pathname.includes("/payments")) {
      const body = await req.json();

      // Get current loan
      const { data: loan, error: loanError } = await supabase
        .from("shop_loans")
        .select("*")
        .eq("id", loanId)
        .eq("user_id", userId)
        .single();

      if (loanError) throw loanError;

      const paymentAmount = Number(body.amount) || 0;
      const newTotalPaid = Number(loan.total_paid) + paymentAmount;
      const newRemaining = Number(loan.remaining_amount) - paymentAmount;
      const newPaidInstallments = loan.paid_installments + 1;

      // Insert payment record
      const { data: payment, error: paymentError } = await supabase
        .from("shop_loan_payments")
        .insert({
          loan_id: loanId,
          user_id: userId,
          amount: paymentAmount,
          payment_date: body.payment_date || new Date().toISOString().split('T')[0],
          payment_method: body.payment_method || 'cash',
          installment_number: newPaidInstallments,
          late_fee: body.late_fee || 0,
          notes: body.notes || null,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Calculate next payment date
      let nextPaymentDate = new Date(loan.next_payment_date);
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

      // Update loan
      const isCompleted = newRemaining <= 0 || newPaidInstallments >= loan.total_installments;
      
      const { error: updateError } = await supabase
        .from("shop_loans")
        .update({
          total_paid: newTotalPaid,
          remaining_amount: Math.max(0, newRemaining),
          paid_installments: newPaidInstallments,
          next_payment_date: isCompleted ? null : nextPaymentDate.toISOString().split('T')[0],
          status: isCompleted ? 'completed' : 'active',
          updated_at: new Date().toISOString(),
        })
        .eq("id", loanId);

      if (updateError) throw updateError;

      // Create notification for payment
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "💰 লোন পেমেন্ট সম্পন্ন",
        body: `${loan.lender_name} - ৳${paymentAmount.toLocaleString()} পেমেন্ট করা হয়েছে।`,
        notification_type: "loan_payment",
        metadata: { loan_id: loanId, payment_id: payment.id }
      });

      return new Response(JSON.stringify({ payment, isCompleted }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Shop loans error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
