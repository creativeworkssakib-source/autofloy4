# 🚀 Autofloy Cloudflare Workers

## Replit এ Setup (5 মিনিট)

### Step 1: Replit এ নতুন Project
1. https://replit.com এ যান
2. "Create Repl" → "Node.js" select করুন
3. Name দিন: `autofloy-workers`

### Step 2: Files Copy করুন
নিচের সব files Replit এ copy-paste করুন:
- `wrangler.toml`
- `package.json`
- `tsconfig.json`
- `src/index.ts`
- `src/handlers/` folder এর সব files
- `src/utils/` folder এর সব files

### Step 3: Terminal এ Commands
```bash
# Dependencies install
npm install

# Cloudflare login (browser খুলবে)
npx wrangler login

# Secrets add করুন (একটা একটা করে)
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put JWT_SECRET
npx wrangler secret put FACEBOOK_APP_SECRET
npx wrangler secret put LOVABLE_API_KEY
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put TOKEN_ENCRYPTION_KEY

# Deploy!
npm run deploy
```

### Step 4: URL Update
Deploy হলে URL পাবেন: `https://autofloy-api.YOUR_NAME.workers.dev`

এই URL টা Facebook App Settings এ Webhook URL হিসেবে দিন।

---

## 📁 File Structure

```
cloudflare-workers/
├── src/
│   ├── index.ts              # Main router
│   ├── handlers/
│   │   ├── ai-facebook-agent.ts
│   │   ├── facebook-webhook.ts
│   │   ├── auth.ts
│   │   ├── products.ts
│   │   ├── ai-orders.ts
│   │   ├── notifications.ts
│   │   ├── page-memory.ts
│   │   ├── automations.ts
│   │   ├── dashboard.ts
│   │   ├── execution-logs.ts
│   │   ├── customer-followups.ts
│   │   ├── offline-shop.ts
│   │   └── admin.ts
│   └── utils/
│       ├── cors.ts
│       ├── supabase.ts
│       ├── auth.ts
│       └── ai-providers.ts
├── wrangler.toml
├── package.json
└── tsconfig.json
```

---

## 🔑 Required Secrets

| Secret Name | কোথা থেকে পাবেন |
|-------------|-----------------|
| SUPABASE_SERVICE_ROLE_KEY | Supabase Dashboard → Settings → API |
| JWT_SECRET | আপনার নিজের secret key |
| FACEBOOK_APP_SECRET | Facebook Developer Console |
| LOVABLE_API_KEY | Lovable Dashboard |
| RESEND_API_KEY | Resend.com Dashboard |
| TOKEN_ENCRYPTION_KEY | আপনার নিজের 32-char key |

---

## ✅ Deployment Checklist

- [ ] Replit এ project create করা হয়েছে
- [ ] সব files copy করা হয়েছে
- [ ] `npm install` করা হয়েছে
- [ ] `npx wrangler login` করা হয়েছে
- [ ] সব secrets add করা হয়েছে
- [ ] `npm run deploy` successful হয়েছে
- [ ] Facebook Webhook URL update করা হয়েছে
