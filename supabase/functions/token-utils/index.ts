import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { encode as base64Encode, decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { verify } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const encryptionKey = Deno.env.get("TOKEN_ENCRYPTION_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET")!;

// JWT token verification
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
      ["verify"]
    );
    const payload = await verify(token, key);
    return payload.sub as string;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

// AES-GCM encryption using Web Crypto API
async function encrypt(plaintext: string): Promise<string> {
  if (!plaintext || !encryptionKey) return plaintext;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  // Import encryption key for PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(encryptionKey),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Derive key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  
  // Generate random IV (12 bytes for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt with AES-GCM (includes authentication tag)
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    data
  );
  
  // Return version:salt:iv:ciphertext (all base64)
  return `v2:${base64Encode(salt.buffer)}:${base64Encode(iv.buffer)}:${base64Encode(encrypted)}`;
}

// AES-GCM decryption using Web Crypto API
async function decrypt(ciphertext: string): Promise<string> {
  if (!ciphertext || !encryptionKey) return ciphertext;
  
  const encoder = new TextEncoder();
  
  // Handle v1 (legacy XOR) for migration - decrypt and re-encrypt with v2
  if (ciphertext.startsWith("v1:")) {
    return decryptV1(ciphertext);
  }
  
  // Handle v2 (AES-GCM)
  if (!ciphertext.startsWith("v2:")) {
    return ciphertext; // Return as-is if not encrypted
  }
  
  const parts = ciphertext.split(":");
  if (parts.length !== 4) return ciphertext;
  
  const [, saltBase64, ivBase64, dataBase64] = parts;
  
  // Decode components
  const salt = new Uint8Array(base64Decode(saltBase64));
  const iv = new Uint8Array(base64Decode(ivBase64));
  const encryptedData = new Uint8Array(base64Decode(dataBase64));
  
  // Import encryption key for PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(encryptionKey),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  
  // Derive key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  
  // Decrypt with AES-GCM
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encryptedData.buffer
  );
  
  return new TextDecoder().decode(decrypted);
}

// Legacy v1 decryption (XOR) - only for migration purposes
function decryptV1(ciphertext: string): string {
  if (!ciphertext.startsWith("v1:")) return ciphertext;
  
  const parts = ciphertext.split(":");
  if (parts.length !== 3) return ciphertext;
  
  const [, ivBase64, dataBase64] = parts;
  
  // Old key derivation
  function deriveKeyV1(key: string, salt: string): Uint8Array {
    const combined = key + salt;
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const derived = new Uint8Array(32);
    for (let i = 0; i < data.length; i++) {
      derived[i % 32] ^= data[i];
    }
    return derived;
  }
  
  const derivedKey = deriveKeyV1(encryptionKey, ivBase64);
  const encrypted = new Uint8Array(base64Decode(dataBase64));
  
  const decrypted = new Uint8Array(encrypted.length);
  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ derivedKey[i % derivedKey.length];
  }
  
  return new TextDecoder().decode(decrypted);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // CRITICAL: Verify JWT authentication
    const userId = await verifyToken(req.headers.get("Authorization"));
    if (!userId) {
      console.warn("Unauthorized access attempt to token-utils");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, account_id, access_token, refresh_token } = await req.json();
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // For account-specific actions, verify the user owns the account
    if (action === "encrypt_and_store" || action === "get_decrypted") {
      if (!account_id) {
        return new Response(JSON.stringify({ error: "account_id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify ownership: the account must belong to the authenticated user
      const { data: account, error: ownershipError } = await supabase
        .from("connected_accounts")
        .select("user_id")
        .eq("id", account_id)
        .single();

      if (ownershipError || !account) {
        console.warn(`Account ${account_id} not found for user ${userId}`);
        return new Response(JSON.stringify({ error: "Account not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (account.user_id !== userId) {
        console.warn(`User ${userId} attempted to access account ${account_id} owned by ${account.user_id}`);
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "encrypt_and_store") {
      // Encrypt tokens with AES-GCM and store them
      const encryptedAccess = await encrypt(access_token);
      const encryptedRefresh = refresh_token ? await encrypt(refresh_token) : null;

      const { error } = await supabase
        .from("connected_accounts")
        .update({
          access_token_encrypted: encryptedAccess,
          refresh_token_encrypted: encryptedRefresh,
          access_token: "***ENCRYPTED***",
          refresh_token: refresh_token ? "***ENCRYPTED***" : null,
          encryption_version: 2,
        })
        .eq("id", account_id);

      if (error) {
        console.error("Error storing encrypted tokens:", error);
        return new Response(JSON.stringify({ error: "Failed to store tokens" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[Token Utils] User ${userId} encrypted tokens for account ${account_id}`);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_decrypted") {
      // Fetch and decrypt tokens for an account (ownership already verified above)
      const { data: account, error } = await supabase
        .from("connected_accounts")
        .select("*")
        .eq("id", account_id)
        .single();

      if (error || !account) {
        console.error("Error fetching account:", error);
        return new Response(JSON.stringify({ error: "Account not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Decrypt tokens
      const decryptedAccount = {
        ...account,
        access_token: account.access_token_encrypted 
          ? await decrypt(account.access_token_encrypted) 
          : account.access_token,
        refresh_token: account.refresh_token_encrypted 
          ? await decrypt(account.refresh_token_encrypted) 
          : account.refresh_token,
      };

      // Remove encrypted fields from response
      delete decryptedAccount.access_token_encrypted;
      delete decryptedAccount.refresh_token_encrypted;

      console.log(`[Token Utils] User ${userId} retrieved decrypted tokens for account ${account_id}`);
      return new Response(JSON.stringify({ account: decryptedAccount }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "migrate_existing") {
      // CRITICAL: Require admin role for migration
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (roleData?.role !== "admin") {
        console.warn(`User ${userId} attempted admin-only migration without admin role`);
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Migrate existing tokens (both unencrypted and v1) to v2 AES-GCM
      const { data: accounts, error: fetchError } = await supabase
        .from("connected_accounts")
        .select("*")
        .or("encryption_version.is.null,encryption_version.lt.2");

      if (fetchError) {
        console.error("Error fetching accounts for migration:", fetchError);
        return new Response(JSON.stringify({ error: "Migration failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let migrated = 0;
      let errors = 0;
      
      for (const account of accounts || []) {
        try {
          let plainAccessToken: string;
          let plainRefreshToken: string | null = null;
          
          // Get plaintext tokens
          if (account.access_token_encrypted) {
            // Decrypt v1 encrypted tokens
            plainAccessToken = await decrypt(account.access_token_encrypted);
          } else if (account.access_token !== "***ENCRYPTED***") {
            // Unencrypted tokens
            plainAccessToken = account.access_token;
          } else {
            // Skip already migrated tokens
            continue;
          }
          
          if (account.refresh_token_encrypted) {
            plainRefreshToken = await decrypt(account.refresh_token_encrypted);
          } else if (account.refresh_token && account.refresh_token !== "***ENCRYPTED***") {
            plainRefreshToken = account.refresh_token;
          }
          
          // Re-encrypt with v2 AES-GCM
          const encryptedAccess = await encrypt(plainAccessToken);
          const encryptedRefresh = plainRefreshToken ? await encrypt(plainRefreshToken) : null;

          const { error: updateError } = await supabase
            .from("connected_accounts")
            .update({
              access_token_encrypted: encryptedAccess,
              refresh_token_encrypted: encryptedRefresh,
              access_token: "***ENCRYPTED***",
              refresh_token: plainRefreshToken ? "***ENCRYPTED***" : null,
              encryption_version: 2,
            })
            .eq("id", account.id);

          if (!updateError) {
            migrated++;
          } else {
            errors++;
            console.error(`Error migrating account ${account.id}:`, updateError);
          }
        } catch (err) {
          errors++;
          console.error(`Error processing account ${account.id}:`, err);
        }
      }

      console.log(`[Token Utils] Admin ${userId} completed migration: ${migrated} migrated, ${errors} errors`);
      return new Response(JSON.stringify({ success: true, migrated, errors }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Token utils error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
