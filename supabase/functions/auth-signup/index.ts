import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { create } from "https://deno.land/x/djwt@v3.0.2/mod.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getOTPEmailTemplate } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

// Rate limiting constants
const MAX_SIGNUPS_PER_IP_HOUR = 5;
const MAX_SIGNUPS_PER_IP_DAY = 10;

// Password hashing using PBKDF2 (Web Crypto API - Edge Runtime compatible)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  
  const hashArray = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  
  return btoa(String.fromCharCode(...combined));
}

// Function to send verification OTP email
async function sendVerificationEmail(
  supabase: any,
  userId: string,
  email: string,
  displayName?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Delete any existing email OTPs for this user
    await supabase
      .from("verification_otps")
      .delete()
      .eq("user_id", userId)
      .eq("type", "email");

    // Insert new OTP (expires in 10 minutes by default from table trigger)
    const { error: insertError } = await supabase
      .from("verification_otps")
      .insert({
        user_id: userId,
        type: "email",
        email_otp: otp,
      });

    if (insertError) {
      console.error("Failed to insert OTP:", insertError);
      return { success: false, error: "Failed to generate OTP" };
    }

    // Send email via Resend
    const resend = new Resend(resendApiKey);
    const emailHtml = getOTPEmailTemplate(otp, displayName || undefined);

    const { error: emailError } = await resend.emails.send({
      from: "AutoFloy <noreply@fileforge.site>",
      to: [email],
      subject: "🔐 Your AutoFloy Verification Code",
      html: emailHtml,
    });

    if (emailError) {
      console.error("Resend API error during signup:", JSON.stringify(emailError, null, 2));
      return { success: false, error: emailError.message };
    }

    console.log(`Verification email sent to ${email} during signup`);
    return { success: true };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return { success: false, error: String(error) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, phone, password, display_name } = await req.json();

    // Validation
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Password length validation
    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Phone format validation (if provided)
    if (phone) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phone.replace(/[\s-]/g, ""))) {
        return new Response(JSON.stringify({ error: "Invalid phone format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if this email has already used trial (prevent trial abuse)
    const { data: trialCheck } = await supabase
      .rpc("can_email_use_trial", { p_email: email });

    const canUseTrial = trialCheck?.can_use_trial !== false;
    const isReturningUser = trialCheck?.is_returning_user === true;
    const lastPlan = trialCheck?.last_plan || "free";
    
    console.log(`Email ${email} trial check: canUseTrial=${canUseTrial}, isReturning=${isReturningUser}`);
    
    // Get client IP for rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    // Check hourly signup rate limit
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: hourlyCount } = await supabase
      .from("auth_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("identifier", clientIp)
      .eq("endpoint", "signup")
      .gte("created_at", hourAgo);

    if (hourlyCount !== null && hourlyCount >= MAX_SIGNUPS_PER_IP_HOUR) {
      console.warn(`[RATE LIMIT] Signup blocked - hourly limit`);
      return new Response(JSON.stringify({ 
        error: "Too many signup attempts. Please try again in an hour." 
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check daily signup rate limit
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: dailyCount } = await supabase
      .from("auth_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("identifier", clientIp)
      .eq("endpoint", "signup")
      .gte("created_at", dayAgo);

    if (dailyCount !== null && dailyCount >= MAX_SIGNUPS_PER_IP_DAY) {
      console.warn(`[RATE LIMIT] Signup blocked - daily limit`);
      return new Response(JSON.stringify({ 
        error: "Daily signup limit reached. Please try again tomorrow." 
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingEmail) {
      // Record attempt to prevent enumeration via timing
      await supabase.from("auth_rate_limits").insert({
        identifier: clientIp,
        endpoint: "signup",
        attempt_count: 1,
        window_start: new Date().toISOString(),
      });
      return new Response(JSON.stringify({ error: "Email already registered" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if phone already exists (if provided)
    if (phone) {
      const { data: existingPhone } = await supabase
        .from("users")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();

      if (existingPhone) {
        await supabase.from("auth_rate_limits").insert({
          identifier: clientIp,
          endpoint: "signup",
          attempt_count: 1,
          window_start: new Date().toISOString(),
        });
        return new Response(JSON.stringify({ error: "Phone number already registered" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Hash password using PBKDF2
    const passwordHash = await hashPassword(password);

    // Calculate trial timestamps (24 hours from now) - but only for new users
    const now = new Date();
    const trialStartedAt = now.toISOString();
    const trialEndDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    // Determine subscription plan based on trial eligibility
    let subscriptionPlan = "trial";
    let isTrialActive = true;
    let userTrialEndDate: string | null = trialEndDate.toISOString();

    if (!canUseTrial) {
      // Returning user - restore to their last plan status (without trial)
      subscriptionPlan = lastPlan === "trial" ? "free" : lastPlan;
      isTrialActive = false;
      userTrialEndDate = null;
      console.log(`Returning user ${email}: assigning plan=${subscriptionPlan}, no trial`);
    }

    // Insert user with appropriate trial status
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        email,
        phone: phone || null,
        display_name: display_name || null,
        password_hash: passwordHash,
        subscription_plan: subscriptionPlan,
        is_trial_active: isTrialActive,
        trial_started_at: canUseTrial ? trialStartedAt : null,
        trial_end_date: userTrialEndDate,
        email_verified: false,
        has_used_trial: true, // Mark that user has used their one-time trial
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create user" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Record email in usage history for first-time users
    if (canUseTrial && !isReturningUser) {
      await supabase
        .from("email_usage_history")
        .insert({
          email: email.toLowerCase(),
          trial_used: true,
          last_plan: subscriptionPlan,
        })
        .single();
    }

    // Record signup for rate limiting
    await supabase.from("auth_rate_limits").insert({
      identifier: clientIp,
      endpoint: "signup",
      attempt_count: 1,
      window_start: new Date().toISOString(),
    });

    // Create JWT token
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    const token = await create(
      { alg: "HS256", typ: "JWT" },
      {
        sub: newUser.id,
        email: newUser.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours (1 day)
      },
      key
    );

    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      phone: newUser.phone,
      display_name: newUser.display_name,
      subscription_plan: newUser.subscription_plan,
      trial_end_date: newUser.trial_end_date,
      is_trial_active: newUser.is_trial_active,
      email_verified: newUser.email_verified,
    };

    console.log(`User created: ${newUser.id.substring(0, 8)}...`);

    // ===== AUTOMATICALLY SEND VERIFICATION EMAIL =====
    // This ensures the user gets the verification code immediately upon signup
    const emailResult = await sendVerificationEmail(
      supabase,
      newUser.id,
      newUser.email,
      newUser.display_name
    );
    
    if (!emailResult.success) {
      console.warn(`Failed to send verification email during signup: ${emailResult.error}`);
      // Don't fail signup, user can request resend from verify page
    } else {
      console.log(`Verification email auto-sent to ${newUser.email}`);
    }

    // Emit user.created and trial.started events to n8n webhook
    try {
      await supabase.from("outgoing_events").insert([
        {
          event_type: "user.created",
          user_id: newUser.id,
          payload: {
            user: {
              id: newUser.id,
              email: newUser.email,
              display_name: newUser.display_name,
              phone: newUser.phone,
            },
            subscription: {
              plan: newUser.subscription_plan,
              is_trial_active: newUser.is_trial_active,
              trial_end_date: newUser.trial_end_date,
            },
            plan_limits: {
              maxFacebookPages: 10,
              maxWhatsappAccounts: 5,
              maxAutomationsPerMonth: null,
            },
            created_at: new Date().toISOString(),
          },
          status: "pending",
        },
        {
          event_type: "trial.started",
          user_id: newUser.id,
          payload: {
            user_id: newUser.id,
            trial_start: trialStartedAt,
            trial_end: trialEndDate.toISOString(),
            duration_hours: 24,
          },
          status: "pending",
        }
      ]);
      console.log(`[EventEmitter] Events queued for user ${newUser.id.substring(0, 8)}...`);
    } catch (eventError) {
      console.warn("Failed to emit signup events:", eventError);
      // Don't fail signup if event emission fails
    }

    return new Response(JSON.stringify({ 
      token, 
      user: userResponse,
      verification_email_sent: emailResult.success 
    }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
