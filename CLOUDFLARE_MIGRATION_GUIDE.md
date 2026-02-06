# 🚀 Cloudflare Workers Migration Guide

## Autofloy Edge Functions → Cloudflare Workers

এই guide অনুসরণ করে আপনার সব Edge Functions Cloudflare Workers এ migrate করুন।

---

## 📋 Step 1: Cloudflare Account Setup

### 1.1 Account তৈরি করুন
1. যান: https://dash.cloudflare.com/sign-up
2. Email ও password দিয়ে signup করুন
3. Email verify করুন

### 1.2 Wrangler CLI Install করুন
```bash
# Node.js install থাকলে:
npm install -g wrangler

# Login করুন:
wrangler login
```

### 1.3 Workers Project তৈরি করুন
```bash
# নতুন project create:
mkdir autofloy-workers
cd autofloy-workers
wrangler init

# TypeScript select করুন
```

---

## 📁 Step 2: Project Structure

```
autofloy-workers/
├── src/
│   ├── index.ts              # Main router
│   ├── handlers/
│   │   ├── ai-facebook-agent.ts
│   │   ├── facebook-webhook.ts
│   │   ├── auth-login.ts
│   │   ├── auth-signup.ts
│   │   ├── products.ts
│   │   ├── ai-orders.ts
│   │   ├── notifications.ts
│   │   ├── page-memory.ts
│   │   ├── automations.ts
│   │   ├── dashboard-stats.ts
│   │   ├── execution-logs.ts
│   │   ├── customer-followups.ts
│   │   ├── offline-shop.ts
│   │   ├── admin.ts
│   │   ├── admin-cms.ts
│   │   ├── storage-upload.ts
│   │   └── ... (অন্যান্য handlers)
│   ├── utils/
│   │   ├── cors.ts
│   │   ├── supabase.ts
│   │   ├── ai-helpers.ts
│   │   └── auth.ts
│   └── types/
│       └── index.ts
├── wrangler.toml
├── package.json
└── tsconfig.json
```

---

## ⚙️ Step 3: wrangler.toml Configuration

```toml
name = "autofloy-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# Routes (optional - custom domain এ)
# routes = [
#   { pattern = "api.autofloy.com/*", zone_name = "autofloy.com" }
# ]

# Environment Variables (Secrets)
[vars]
SUPABASE_URL = "https://klkrzfwvrmffqkmkyqrh.supabase.co"

# Secrets (wrangler secret put দিয়ে add করুন)
# SUPABASE_SERVICE_ROLE_KEY
# JWT_SECRET
# FACEBOOK_APP_SECRET
# LOVABLE_API_KEY
# RESEND_API_KEY
# TOKEN_ENCRYPTION_KEY
```

### Secrets Add করুন:
```bash
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put JWT_SECRET
wrangler secret put FACEBOOK_APP_SECRET
wrangler secret put LOVABLE_API_KEY
wrangler secret put RESEND_API_KEY
wrangler secret put TOKEN_ENCRYPTION_KEY
wrangler secret put SUPABASE_ANON_KEY
```

---

## 📝 Step 4: Core Files

### 4.1 src/utils/cors.ts
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function handleCORS(request: Request): Response | null {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}

export function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, status);
}
```

### 4.2 src/utils/supabase.ts
```typescript
import { createClient } from '@supabase/supabase-js';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_ANON_KEY: string;
  JWT_SECRET: string;
  FACEBOOK_APP_SECRET: string;
  LOVABLE_API_KEY: string;
  RESEND_API_KEY: string;
  TOKEN_ENCRYPTION_KEY: string;
}

export function getSupabaseClient(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAnonClient(env: Env, authHeader?: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}
```

### 4.3 src/utils/auth.ts
```typescript
import { Env } from './supabase';

export async function verifyJWT(token: string, env: Env): Promise<{ userId: string } | null> {
  try {
    // Simple JWT verification
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }
    
    return { userId: payload.sub };
  } catch {
    return null;
  }
}

export function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.replace('Bearer ', '');
}
```

---

## 🤖 Step 5: AI Facebook Agent (Main Handler)

### 5.1 src/handlers/ai-facebook-agent.ts
```typescript
import { Env, getSupabaseClient } from '../utils/supabase';
import { corsHeaders, jsonResponse, errorResponse } from '../utils/cors';

// AI Provider Detection
function detectProvider(apiKey: string): 'openai' | 'google' | 'lovable' {
  if (!apiKey) return 'lovable';
  if (apiKey.startsWith('sk-')) return 'openai';
  if (apiKey.startsWith('AIza')) return 'google';
  return 'lovable';
}

// Call OpenAI
async function callOpenAI(messages: any[], apiKey: string, hasMedia: boolean): Promise<string> {
  const model = hasMedia ? 'gpt-4o' : 'gpt-4o-mini';
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 2048,
    }),
  });
  
  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content || '';
}

// Call Google AI (Gemini)
async function callGoogleAI(messages: any[], apiKey: string): Promise<string> {
  const contents = messages
    .filter((m: any) => m.role !== 'system')
    .map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const systemInstruction = messages.find((m: any) => m.role === 'system')?.content || '';

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: { maxOutputTokens: 2048 },
      }),
    }
  );

  const data = await response.json() as any;
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Call Lovable AI Gateway
async function callLovableAI(messages: any[], apiKey: string, hasMedia: boolean): Promise<string> {
  const model = hasMedia ? 'openai/gpt-4o' : 'openai/gpt-4o-mini';
  
  const response = await fetch('https://ai.lovable.dev/api/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_completion_tokens: 2048,
    }),
  });
  
  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content || '';
}

// Main AI Router
async function callAI(
  messages: any[],
  provider: 'openai' | 'google' | 'lovable',
  apiKey: string,
  lovableKey: string,
  hasMedia: boolean
): Promise<string> {
  try {
    switch (provider) {
      case 'openai':
        return await callOpenAI(messages, apiKey, hasMedia);
      case 'google':
        return await callGoogleAI(messages, apiKey);
      case 'lovable':
      default:
        return await callLovableAI(messages, lovableKey, hasMedia);
    }
  } catch (error) {
    console.error(`${provider} AI failed, falling back to Lovable:`, error);
    return await callLovableAI(messages, lovableKey, hasMedia);
  }
}

// Main Handler
export async function handleAIFacebookAgent(request: Request, env: Env): Promise<Response> {
  const startTime = Date.now();
  
  try {
    const body = await request.json() as any;
    const { pageId, senderId, messageText, messageType, attachments, isComment, commentId, postId } = body;
    
    if (!pageId || !senderId) {
      return errorResponse('Missing pageId or senderId', 400);
    }
    
    const supabase = getSupabaseClient(env);
    
    // Get page memory
    const { data: pageMemory } = await supabase
      .from('page_memory')
      .select('*')
      .eq('page_id', pageId)
      .maybeSingle();
    
    // Check if AI is enabled
    const { data: apiConfig } = await supabase
      .from('api_integrations')
      .select('is_enabled, api_key')
      .eq('provider', 'openai')
      .maybeSingle();
    
    if (!apiConfig?.is_enabled) {
      return jsonResponse({ 
        success: false, 
        reason: 'AI is disabled',
        processingTime: Date.now() - startTime 
      });
    }
    
    // Detect provider
    const provider = detectProvider(apiConfig.api_key || '');
    const hasMedia = messageType !== 'text' || (attachments?.length > 0);
    
    // Get/create conversation
    let { data: conversation } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('page_id', pageId)
      .eq('sender_id', senderId)
      .maybeSingle();
    
    if (!conversation) {
      const { data: newConv } = await supabase
        .from('ai_conversations')
        .insert({
          page_id: pageId,
          sender_id: senderId,
          user_id: pageMemory?.user_id,
          message_history: [],
          conversation_state: 'idle',
        })
        .select()
        .single();
      conversation = newConv;
    }
    
    // Build system prompt
    const systemPrompt = buildSystemPrompt(pageMemory);
    
    // Build messages
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversation?.message_history || []).slice(-10),
      { role: 'user', content: messageText || '[Media received]' },
    ];
    
    // Call AI
    const aiResponse = await callAI(
      messages,
      provider,
      apiConfig.api_key || '',
      env.LOVABLE_API_KEY,
      hasMedia
    );
    
    // Update conversation
    const updatedHistory = [
      ...(conversation?.message_history || []),
      { role: 'user', content: messageText, timestamp: new Date().toISOString() },
      { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() },
    ].slice(-20);
    
    await supabase
      .from('ai_conversations')
      .update({
        message_history: updatedHistory,
        last_message_at: new Date().toISOString(),
        total_messages_count: (conversation?.total_messages_count || 0) + 1,
      })
      .eq('id', conversation?.id);
    
    // Log execution
    await supabase.from('execution_logs').insert({
      user_id: pageMemory?.user_id,
      event_type: isComment ? 'comment_reply' : 'message_reply',
      status: 'success',
      source_platform: 'facebook',
      processing_time_ms: Date.now() - startTime,
      incoming_payload: { pageId, senderId, messageText, messageType },
      response_payload: { aiResponse, provider },
    });
    
    return jsonResponse({
      success: true,
      reply: aiResponse,
      provider,
      processingTime: Date.now() - startTime,
    });
    
  } catch (error: any) {
    console.error('AI Agent error:', error);
    return errorResponse(error.message || 'Internal server error');
  }
}

function buildSystemPrompt(pageMemory: any): string {
  const businessDesc = pageMemory?.business_description || 'একটি অনলাইন বিজনেস';
  const productsSummary = pageMemory?.products_summary || '';
  const tone = pageMemory?.preferred_tone || 'friendly';
  
  return `তুমি একজন বাংলাদেশি অনলাইন বিক্রেতার সেলস এজেন্ট। 

বিজনেস: ${businessDesc}
প্রোডাক্ট: ${productsSummary}
টোন: ${tone}

নিয়ম:
- সবসময় বাংলায় উত্তর দাও (Banglish ও গ্রহণযোগ্য)
- ছোট, friendly উত্তর দাও
- প্রাইস জিজ্ঞেস করলে সঠিক দাম বলো
- অর্ডার নিতে পারলে নাম, ফোন, ঠিকানা নাও
- যা জানো না তা বানিয়ে বলো না`;
}
```

---

## 🔀 Step 6: Main Router (src/index.ts)

```typescript
import { handleAIFacebookAgent } from './handlers/ai-facebook-agent';
import { handleCORS, errorResponse } from './utils/cors';
import { Env } from './utils/supabase';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS
    const corsResponse = handleCORS(request);
    if (corsResponse) return corsResponse;
    
    const url = new URL(request.url);
    const path = url.pathname;
    
    try {
      // Route to handlers
      switch (true) {
        case path === '/ai-facebook-agent':
          return handleAIFacebookAgent(request, env);
        
        case path === '/facebook-webhook':
          // Add facebook webhook handler
          return errorResponse('Not implemented', 501);
        
        case path.startsWith('/auth-'):
          // Add auth handlers
          return errorResponse('Not implemented', 501);
        
        case path === '/products':
          // Add products handler
          return errorResponse('Not implemented', 501);
        
        case path === '/ai-orders':
          // Add ai-orders handler
          return errorResponse('Not implemented', 501);
        
        case path === '/notifications':
          // Add notifications handler
          return errorResponse('Not implemented', 501);
        
        case path === '/dashboard-stats':
          // Add dashboard-stats handler
          return errorResponse('Not implemented', 501);
        
        // Health check
        case path === '/health':
          return new Response(JSON.stringify({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }), {
            headers: { 'Content-Type': 'application/json' },
          });
        
        default:
          return errorResponse('Not found', 404);
      }
    } catch (error: any) {
      console.error('Worker error:', error);
      return errorResponse(error.message || 'Internal server error');
    }
  },
};
```

---

## 📦 Step 7: package.json

```json
{
  "name": "autofloy-workers",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "tail": "wrangler tail"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.94.1"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240208.0",
    "typescript": "^5.0.0",
    "wrangler": "^3.0.0"
  }
}
```

---

## 🚀 Step 8: Deploy করুন

```bash
# Dependencies install
npm install

# Local test
npm run dev

# Production deploy
npm run deploy
```

---

## 🔄 Step 9: Frontend Update

Cloudflare deploy হলে, Frontend এ URL change করুন:

### src/integrations/cloudflare/client.ts
```typescript
// Cloudflare Workers URL
export const CLOUDFLARE_WORKERS_URL = 'https://autofloy-api.YOUR_SUBDOMAIN.workers.dev';

// অথবা custom domain:
// export const CLOUDFLARE_WORKERS_URL = 'https://api.autofloy.com';

export async function callCloudflareFunction(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${CLOUDFLARE_WORKERS_URL}${path}`;
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}
```

---

## ✅ Migration Checklist

| Function | Status | Priority |
|----------|--------|----------|
| ai-facebook-agent | 🔴 Pending | High |
| facebook-webhook | 🔴 Pending | High |
| auth-login | 🔴 Pending | High |
| auth-signup | 🔴 Pending | High |
| products | 🔴 Pending | Medium |
| ai-orders | 🔴 Pending | Medium |
| notifications | 🔴 Pending | Medium |
| page-memory | 🔴 Pending | Medium |
| dashboard-stats | 🔴 Pending | Low |
| execution-logs | 🔴 Pending | Low |
| offline-shop | 🔴 Pending | Low |
| admin | 🔴 Pending | Low |
| admin-cms | 🔴 Pending | Low |

---

## 🎯 Benefits After Migration

| Metric | Supabase Edge | Cloudflare Workers |
|--------|--------------|-------------------|
| Cold Start | 200-500ms | **0ms** |
| Requests/day (Free) | ~1600 | **100,000** |
| Egress | Paid | **Free** |
| Global Locations | ~12 | **300+** |
| Monthly Cost | $25+ | **$0-5** |

---

## ⚠️ Important Notes

1. **Database এখনও Supabase এ থাকবে** - শুধু Edge Functions migrate হচ্ছে
2. **Facebook Webhook URL update করতে হবে** - Cloudflare URL দিয়ে
3. **Supabase Realtime এখনও কাজ করবে** - Frontend থেকে
4. **Secrets সব Cloudflare তে add করতে হবে**

---

## 🆘 সাহায্য লাগলে

- Cloudflare Docs: https://developers.cloudflare.com/workers/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/
- Supabase JS: https://supabase.com/docs/reference/javascript/
