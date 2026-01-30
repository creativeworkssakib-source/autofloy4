import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as djwt from "https://deno.land/x/djwt@v2.8/mod.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getWelcomeEmailTemplate } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const JWT_SECRET = Deno.env.get("JWT_SECRET")!;
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

// Generate a random password for Google users
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 24; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Hash password using PBKDF2
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
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if Google OAuth is configured
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: "Google OAuth is not configured. Please contact admin." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, code, redirect_uri } = await req.json();

    // Action 1: Get OAuth URL
    if (action === "get_auth_url") {
      const state = crypto.randomUUID();
      const scope = encodeURIComponent("openid email profile");
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirect_uri)}&` +
        `response_type=code&` +
        `scope=${scope}&` +
        `state=${state}&` +
        `access_type=offline&` +
        `prompt=consent`;

      return new Response(
        JSON.stringify({ auth_url: authUrl, state }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action 2: Exchange code for tokens and login/signup user
    if (action === "callback") {
      if (!code || !redirect_uri) {
        return new Response(
          JSON.stringify({ error: "Missing code or redirect_uri" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error("Token exchange failed:", errorData);
        return new Response(
          JSON.stringify({ error: "Failed to exchange code for tokens" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokens: GoogleTokenResponse = await tokenResponse.json();

      // Get user info from Google
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!userInfoResponse.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to get user info from Google" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const googleUser: GoogleUserInfo = await userInfoResponse.json();

      // Connect to Supabase
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

      // Check if this email has already used trial (prevent trial abuse)
      const { data: trialCheck } = await supabase
        .rpc("can_email_use_trial", { p_email: googleUser.email.toLowerCase() });

      const canUseTrial = trialCheck?.can_use_trial !== false;
      const isReturningUser = trialCheck?.is_returning_user === true;
      
      console.log(`Google user ${googleUser.email} trial check: canUseTrial=${canUseTrial}, isReturning=${isReturningUser}`);

      // Check if user exists by email
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("email", googleUser.email.toLowerCase())
        .single();

      let userId: string;
      let isNewUser = false;

      if (existingUser) {
        // User exists - update their Google info if needed
        userId = existingUser.id;
        
        // Update avatar and google_id if not set
        const updateData: Record<string, unknown> = {
          email_verified: true // Google emails are verified
        };
        
        if (!existingUser.avatar_url && googleUser.picture) {
          updateData.avatar_url = googleUser.picture;
        }
        if (!existingUser.google_id) {
          updateData.google_id = googleUser.id;
          updateData.auth_provider = "google";
        }
        
        await supabase
          .from("users")
          .update(updateData)
          .eq("id", userId);
      } else {
        // Create new user
        isNewUser = true;
        const randomPassword = generateRandomPassword();
        const passwordHash = await hashPassword(randomPassword);
        
        // Calculate trial end date (24 hours from now for new users - consistent with email signup)
        const now = new Date();
        const trialEndDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

        // Determine subscription based on trial eligibility
        let subscriptionPlan = "trial";
        let isTrialActive = true;
        let userTrialEndDate: string = trialEndDate.toISOString();
        let subscriptionStartedAt: string = now.toISOString();
        let subscriptionEndsAt: string = trialEndDate.toISOString();

        if (!canUseTrial) {
          // Returning user - expired trial, no free access
          subscriptionPlan = "trial";
          isTrialActive = false;
          userTrialEndDate = now.toISOString(); // Already expired
          subscriptionEndsAt = now.toISOString(); // Already expired
          console.log(`Returning Google user ${googleUser.email}: expired trial assigned`);
        }

        // Trial users get 'both' access (online + offline) to test all features
        const subscriptionType = canUseTrial ? 'both' : 'online';
        
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({
            email: googleUser.email.toLowerCase(),
            password_hash: passwordHash,
            display_name: googleUser.name,
            avatar_url: googleUser.picture,
            email_verified: true, // Google emails are verified
            is_active: true,
            subscription_plan: subscriptionPlan,
            subscription_type: subscriptionType, // IMPORTANT: Set subscription_type for access control
            is_trial_active: isTrialActive,
            trial_end_date: userTrialEndDate,
            trial_started_at: canUseTrial ? now.toISOString() : null,
            subscription_started_at: subscriptionStartedAt,
            subscription_ends_at: subscriptionEndsAt,
            auth_provider: "google",
            google_id: googleUser.id,
            has_used_trial: true,
          })
          .select()
          .single();

        if (insertError) {
          console.error("User creation failed:", insertError);
          return new Response(
            JSON.stringify({ error: "Failed to create user account" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        userId = newUser.id;

        // Track email usage for first-time users
        if (canUseTrial && !isReturningUser) {
          await supabase
            .from("email_usage_history")
            .insert({
              email: googleUser.email.toLowerCase(),
              total_signups: 1,
              first_signup_at: new Date().toISOString(),
              trial_used: true,
              last_plan: "trial",
            });
        } else {
          // Update existing email history
          await supabase
            .from("email_usage_history")
            .upsert({
              email: googleUser.email.toLowerCase(),
              total_signups: 1,
              trial_used: true,
              last_plan: "trial",
            }, { onConflict: "email" });
        }

        // Send welcome email to new Google users
        if (RESEND_API_KEY) {
          try {
            const resend = new Resend(RESEND_API_KEY);
            const userName = googleUser.name || googleUser.email.split("@")[0];
            const emailHtml = getWelcomeEmailTemplate(userName, googleUser.email);

            const { error: emailError } = await resend.emails.send({
              from: "AutoFloy <noreply@autofloy.online>",
              to: [googleUser.email],
              subject: "🎉 Welcome to AutoFloy - Your Account is Ready!",
              html: emailHtml,
            });

            if (emailError) {
              console.error("Welcome email error for Google user:", emailError);
            } else {
              console.log("Welcome email sent to Google user:", googleUser.email);
            }
          } catch (emailErr) {
            console.error("Welcome email exception:", emailErr);
          }
        } else {
          console.warn("RESEND_API_KEY not configured, skipping welcome email");
        }
      }

      // Generate JWT token
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(JWT_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
      );

      const now = Math.floor(Date.now() / 1000);
      const token = await djwt.create(
        { alg: "HS256", typ: "JWT" },
        {
          sub: userId,
          email: googleUser.email.toLowerCase(),
          iat: now,
          exp: now + 7 * 24 * 60 * 60, // 7 days
        },
        key
      );

      // Fetch full user data
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      // Calculate remaining trial days
      let remainingTrialDays = null;
      if (userData?.is_trial_active && userData?.trial_end_date) {
        const trialEnd = new Date(userData.trial_end_date);
        const now = new Date();
        remainingTrialDays = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (remainingTrialDays < 0) remainingTrialDays = 0;
      }

      return new Response(
        JSON.stringify({
          token,
          user: {
            id: userData.id,
            email: userData.email,
            phone: userData.phone,
            display_name: userData.display_name,
            avatar_url: userData.avatar_url,
            subscription_plan: userData.subscription_plan,
            subscription_type: userData.subscription_type || (userData.subscription_plan === 'trial' ? 'both' : 'online'), // Include subscription_type
            trial_end_date: userData.trial_end_date,
            is_trial_active: userData.is_trial_active,
            subscription_started_at: userData.subscription_started_at,
            subscription_ends_at: userData.subscription_ends_at,
            email_verified: userData.email_verified,
            phone_verified: userData.phone_verified,
            is_active: userData.is_active,
            remaining_trial_days: remainingTrialDays,
          },
          is_new_user: isNewUser,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Google auth error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
