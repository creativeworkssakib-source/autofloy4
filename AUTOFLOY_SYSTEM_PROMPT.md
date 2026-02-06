# 🚀 AUTOFLOY - Complete System Recreation Prompt (A-Z)

> এই prompt টি ব্যবহার করে আপনি Lovable অথবা অন্য কোনো AI tool এ পুরো Autofloy সিস্টেম recreate করতে পারবেন।

---

## 📋 PROJECT OVERVIEW

```
Project Name: Autofloy
Description: A complete business automation platform for Bangladeshi e-commerce sellers
Target Users: Facebook Page sellers, Physical shop owners, Online-Offline hybrid businesses
Languages: Bengali (Primary), English
Currency: BDT (৳)
```

---

## 🛠️ TECH STACK

```yaml
Frontend:
  - Framework: React 18 + TypeScript + Vite
  - Styling: Tailwind CSS 3.4+ with shadcn/ui components
  - Animations: Framer Motion 12+
  - Routing: React Router DOM 6
  - State: React Query (TanStack Query 5)
  - Forms: React Hook Form + Zod validation
  - Icons: Lucide React

Backend:
  - Platform: Supabase (Lovable Cloud)
  - Database: PostgreSQL
  - Auth: Supabase Auth (Email, Phone, Google)
  - Edge Functions: Deno Runtime
  - AI: OpenAI GPT-4 / Google Gemini / Lovable AI Gateway
  - Storage: Supabase Storage

Mobile/Desktop:
  - Capacitor (iOS/Android)
  - Electron (Desktop)
  - PWA Support with vite-plugin-pwa
```

---

## 🎨 DESIGN SYSTEM

### Color Palette (HSL Format)
```css
/* Light Mode */
:root {
  --primary: 217 100% 50%;           /* Blue #0066FF */
  --primary-glow: 217 100% 60%;
  --secondary: 262 100% 63%;         /* Purple #8B5CF6 */
  --accent: 18 100% 60%;             /* Orange #FF6B35 */
  --success: 160 84% 29%;            /* Green */
  --warning: 38 92% 50%;             /* Amber */
  --destructive: 0 84% 60%;          /* Red */
  --background: 230 100% 99%;        /* Off-white */
  --foreground: 240 24% 14%;         /* Dark blue-gray */
  --card: 0 0% 100%;                 /* White */
  --muted: 220 14% 96%;
  --border: 220 13% 91%;
  --radius: 0.75rem;
}

/* Dark Mode */
.dark {
  --primary: 217 100% 60%;
  --secondary: 262 100% 70%;
  --background: 240 10% 6%;
  --foreground: 0 0% 98%;
  --card: 240 10% 10%;
  --muted: 240 5% 18%;
  --border: 240 5% 18%;
}
```

### Typography
```css
Font Family: "Outfit" (Google Fonts)
Heading: font-outfit font-bold tracking-tight
Body: font-outfit antialiased
```

### Premium CSS Classes
```css
/* Glassmorphism */
.glass-premium {
  background: hsl(var(--card) / 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid hsl(var(--border) / 0.3);
}

/* Gradient Text */
.text-gradient-premium {
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--accent)));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Glow Effects */
.glow-primary {
  box-shadow: 0 0 40px hsl(var(--primary) / 0.3), 
              0 0 80px hsl(var(--primary) / 0.15);
}

/* Card Lift Animation */
.card-lift:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px -15px hsl(var(--primary) / 0.25);
}

/* Premium Shimmer */
.shimmer-premium {
  background: linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.1) 25%, hsl(var(--secondary) / 0.15) 50%, transparent 100%);
  animation: shimmer-premium 3s linear infinite;
}
```

### Animation Keyframes
```css
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
@keyframes float-slow { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.2; } 50% { transform: translateY(-20px) scale(1.05); opacity: 0.3; } }
@keyframes float-3d { 0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); } 50% { transform: translateY(-20px) translateX(0) rotate(0deg); } }
@keyframes cube-3d { 0%, 100% { transform: translate3d(0, 0, 0) rotateX(18deg) rotateY(26deg); } 50% { transform: translate3d(0, -18px, 0) rotateX(24deg) rotateY(58deg) rotateZ(10deg); } }
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
@keyframes glow-breathe { 0%, 100% { box-shadow: 0 0 20px hsl(var(--primary) / 0.2); } 50% { box-shadow: 0 0 40px hsl(var(--primary) / 0.4); } }
@keyframes reveal-up { 0% { opacity: 0; transform: translateY(40px) scale(0.95); filter: blur(10px); } 100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } }
@keyframes heartbeat { 0%, 100% { transform: scale(1); } 14% { transform: scale(1.15); } 28% { transform: scale(1); } }
```

---

## 📄 PAGE STRUCTURE

### Landing Page (/)
```
Components:
1. Header - Sticky navbar with logo, navigation, language toggle, theme toggle
2. HeroSection - Main headline, subheadline, CTA buttons, 3D AI visualization
3. FeaturesSection - 21 features grid (9 online + 12 offline)
4. BenefitsSection - Stats counters, customer reviews carousel
5. FAQSection - Accordion with 8 questions
6. CTASection - Final call-to-action with gradient background
7. Footer - Links, social media, copyright
```

### Hero 3D Visualization
```
Structure:
- Left: 3 Input Nodes (Messages, Customers, Orders)
- Center: AI Core with animated tech rings, orbiting dots, premium glass card
- Right: 3 Output Nodes (Auto Reply, Order Created, Analytics)
- Flow Lines: Animated particle effects connecting nodes
- Floating Badges: "24/7 Active", "Smart AI", "10x Faster"
```

### Other Pages
```
Auth Pages: /login, /signup, /forgot-password, /reset-password, /verify-email
Dashboard: /dashboard, /dashboard/orders, /dashboard/products, /dashboard/marketing
Offline Shop: /offline-shop/dashboard, /products, /sales, /customers, /reports
Admin: /admin/dashboard, /admin/users, /admin/api-integrations, /admin/appearance
Static: /about, /contact, /pricing, /help, /privacy-policy, /terms, /blog
```

---

## 🗄️ DATABASE SCHEMA

### Core Tables
```sql
-- Users (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  subscription_plan TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Connected Facebook Pages
CREATE TABLE connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  platform TEXT DEFAULT 'facebook',
  external_id TEXT NOT NULL,
  name TEXT,
  access_token_encrypted TEXT,
  is_connected BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Products (for AI to sell)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  price DECIMAL NOT NULL,
  description TEXT,
  image_url TEXT,
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Conversations
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  page_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT,
  conversation_state TEXT DEFAULT 'greeting',
  current_product_id UUID,
  current_product_price DECIMAL,
  collected_name TEXT,
  collected_phone TEXT,
  collected_address TEXT,
  message_history JSONB DEFAULT '[]',
  last_message_at TIMESTAMPTZ DEFAULT now()
);

-- AI Orders (created by AI agent)
CREATE TABLE ai_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  page_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  products JSONB,
  subtotal DECIMAL,
  total DECIMAL,
  order_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Page Memory (AI agent settings per page)
CREATE TABLE page_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users,
  business_description TEXT,
  products_summary TEXT,
  detected_language TEXT DEFAULT 'bangla',
  preferred_tone TEXT DEFAULT 'friendly',
  selling_rules JSONB DEFAULT '{"allowDiscount": false, "bargainingEnabled": false}',
  payment_rules JSONB DEFAULT '{"codAvailable": true}',
  support_whatsapp_number TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- API Integrations (admin-managed)
CREATE TABLE api_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- 'openai', 'google', 'apify', etc.
  api_key TEXT,
  is_enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shops (for offline shop module)
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shop Products
CREATE TABLE shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops,
  name TEXT NOT NULL,
  barcode TEXT,
  purchase_price DECIMAL,
  selling_price DECIMAL,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_alert INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shop Sales
CREATE TABLE shop_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops,
  customer_id UUID,
  items JSONB NOT NULL,
  subtotal DECIMAL,
  discount DECIMAL DEFAULT 0,
  total DECIMAL,
  payment_method TEXT DEFAULT 'cash',
  paid_amount DECIMAL,
  due_amount DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## ⚡ EDGE FUNCTIONS

### ai-facebook-agent (Main AI Handler)
```typescript
// Purpose: Handle Facebook Messenger & Comment automation
// Trigger: Facebook Webhook events

Features:
- Multi-language support (Bangla, English, Mixed)
- Product recognition from images
- Voice message transcription
- Order collection (name, phone, address)
- Smart bargaining with discount rules
- Fake order detection scoring
- Conversation state management

API Flow:
1. Receive webhook from Facebook
2. Identify user's page and fetch page_memory
3. Fetch products for the page
4. Build system prompt using ai-prompt-builder
5. Call AI (OpenAI/Google/Lovable Gateway)
6. Send response via Facebook Graph API
7. Update conversation state in database
```

### facebook-webhook
```typescript
// Purpose: Verify and receive Facebook webhook events
// Handles: Messages, Comments, Reactions
```

### Other Functions
```
auth-login, auth-signup, auth-verify-email-otp, auth-verify-phone-otp
products, products-import
ai-orders
page-memory
dashboard-stats, dashboard-overview
customer-followups
send-welcome-email, send-plan-purchase-email
automations, automations-run-cron
offline-shop (complete POS API)
reports-export, reports-import
```

---

## 🤖 AI PROMPT BUILDER

### Core Personality
```
You are a smart Bangladeshi salesperson AI.
You chat with customers in Facebook Page inbox.
Your goal is to sell products - but naturally, like a human, not a robot.

DO:
- Respond in short 1-3 lines
- Match customer's speaking style
- Use "ভাই" or "আপু" appropriately
- Be friendly but professional

DON'T:
- Say "আমি আপনাকে সাহায্য করতে পেরে আনন্দিত" (robotic)
- Greet with "আসসালামু আলাইকুম" every message
- Repeat customer's name too often
- Write long paragraphs
```

### Language Modes
```
bangla: Pure Bengali script
english: English only
mixed: Banglish (Bengali + English mixed)
```

### Selling Rules
```typescript
interface SellingRules {
  allowDiscount: boolean;
  maxDiscountPercent?: number;
  bargainingEnabled: boolean;
  bargainingLevel?: 'low' | 'medium' | 'high' | 'aggressive';
}
```

### Payment Rules
```typescript
interface PaymentRules {
  codAvailable: boolean;
  advanceRequiredAbove?: number;
  advancePercentage?: number;
}
```

---

## 🏪 OFFLINE SHOP MODULE

### Features
```
1. Complete POS System
2. Inventory Management with barcode
3. Customer Management with due tracking
4. Expense & Cash Register
5. Sales Reports with charts
6. Supplier Management
7. Loan Tracking
8. Thermal Receipt Printing
9. Price Calculator
10. Returns & Adjustments
11. Stock Alerts
12. Offline-first with sync
```

### Offline-First Architecture
```typescript
// IndexedDB for local storage
// Background sync when online
// Conflict resolution strategy
```

---

## 🔐 ADMIN PANEL

### Sections
```
1. Dashboard - Overview stats
2. Users - User management
3. Subscriptions - Plan management
4. API Integrations - AI keys, Firecrawl, Apify
5. Appearance - Colors, logos, hero text
6. Email Templates - Welcome, password reset
7. SMS Settings - Provider config
8. SEO Settings - Meta tags, sitemap
9. Blog Posts - CMS
10. Site Settings - Company name, contact info
```

### AI Power Section
```
Master Toggle: ON/OFF all AI automation
API Key Input: OpenAI or Google API key
Provider Detection: Auto-detect from key prefix
- sk-* = OpenAI
- AIza* = Google Gemini
- Empty = Lovable AI Gateway (built-in)
```

---

## 📱 RESPONSIVE DESIGN

```css
Breakpoints:
xs: 475px
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px

Mobile-first approach with scale transforms for complex visualizations
```

---

## 🌐 INTERNATIONALIZATION

### Supported Languages
```
en: English
bn: Bengali (বাংলা)
```

### Translation Keys Structure
```typescript
const translations = {
  en: {
    hero: {
      title1: "Automate Your",
      title2: "Business",
      title3: "with AI",
      subtitle: "...",
      cta: "Start Free Trial",
      demo: "Watch Demo"
    },
    // ... more sections
  },
  bn: {
    hero: {
      title1: "AI দিয়ে আপনার",
      title2: "ব্যবসা",
      title3: "অটোমেট করুন",
      // ...
    }
  }
}
```

---

## 📦 KEY DEPENDENCIES

```json
{
  "@radix-ui/*": "UI primitives",
  "framer-motion": "^12.x - Animations",
  "lucide-react": "^0.462.x - Icons",
  "@tanstack/react-query": "^5.x - Data fetching",
  "react-hook-form": "^7.x - Forms",
  "zod": "^3.x - Validation",
  "recharts": "^2.x - Charts",
  "date-fns": "^3.x - Date utilities",
  "sonner": "^1.x - Toast notifications",
  "html5-qrcode": "^2.x - Barcode scanning",
  "xlsx": "^0.18.x - Excel export",
  "idb": "^8.x - IndexedDB wrapper"
}
```

---

## 🚀 GETTING STARTED PROMPT

```
Create a complete business automation platform called "Autofloy" for Bangladeshi e-commerce sellers with:

FRONTEND:
- React + TypeScript + Vite + Tailwind CSS
- Premium UI with shadcn/ui components
- Framer Motion animations (floating, shimmer, glow effects)
- Glassmorphism design with gradient accents
- Dark/Light mode support
- Bengali + English language support

LANDING PAGE:
- Hero section with 3D AI automation visualization showing:
  - Left: Input nodes (Messages, Customers, Orders)
  - Center: Premium AI Core card with animated tech rings
  - Right: Output nodes (Auto Reply, Order Created, Analytics)
  - Animated flow lines connecting them
- Features grid: 9 online automation + 12 offline shop features
- Benefits section with animated counters
- FAQ accordion
- Premium CTA section

BACKEND (Supabase):
- User auth with email, phone, Google OAuth
- Products table for AI to sell
- AI conversations tracking
- Page memory for AI settings per Facebook page
- Orders created by AI
- Complete offline shop tables (products, sales, customers, expenses)

EDGE FUNCTIONS:
- Facebook webhook handler
- AI agent that responds to messages/comments
- Multi-provider AI support (OpenAI, Google Gemini, built-in fallback)
- Human-like Bengali conversation
- Order collection flow
- Smart bargaining with rules

ADMIN PANEL:
- User management
- API integrations with master AI toggle
- Appearance customization
- Email/SMS templates

COLOR SCHEME:
- Primary: Blue (#0066FF)
- Secondary: Purple (#8B5CF6)  
- Accent: Orange (#FF6B35)
- Success: Green
- Use HSL format in CSS variables
```

---

## 📝 NOTES

1. **Animation Performance**: Use `will-change`, `gpu-accelerated` classes
2. **Lazy Loading**: Use React.lazy() for below-fold sections
3. **SEO**: Include meta tags, structured data, sitemap
4. **PWA**: Configure service worker for offline support
5. **Security**: RLS policies on all tables
6. **Error Handling**: Toast notifications with sonner

---

*Generated for Autofloy System Recreation*
*Last Updated: February 2025*
