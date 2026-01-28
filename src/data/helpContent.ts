import { Zap, MessageSquare, Settings, Shield, Store, BarChart3, Package, Smartphone } from "lucide-react";

export interface HelpArticle {
  slug: string;
  title: string;
  description: string;
  content: string;
  category: string;
  relatedArticles?: string[];
}

export interface HelpCategory {
  id: string;
  icon: typeof Zap;
  title: string;
  description: string;
  articles: HelpArticle[];
}

export const helpCategories: HelpCategory[] = [
  {
    id: "getting-started",
    icon: Zap,
    title: "Getting Started",
    description: "Learn the basics and set up your account",
    articles: [
      {
        slug: "quick-start-guide",
        title: "Quick Start Guide",
        description: "Get up and running with AutoFloy in minutes",
        category: "Getting Started",
        content: `
## Welcome to AutoFloy

AutoFloy is a complete business automation platform that handles both your **Online Business** (Facebook/WhatsApp automation) and **Offline Shop** (POS and inventory management).

### What You Get

**Online Business Features (9 Features):**
- AI Auto-Reply for Inbox & Comments
- Smart Image Recognition
- Voice Message Processing
- Comment Moderation
- Auto-Invoice Generation
- 24/7 AI Support
- AI Sales Agent with Persuasion Techniques
- AI Bargaining Power for Price Negotiation
- Automatic Order Taking

**Offline Shop Features (12 Features):**
- Complete POS System
- Inventory Control with Expiry Tracking
- Customer & Due Management
- Reports & Analytics
- Expense & Cash Register
- Online-Offline Sync
- Supplier Management
- Loan Tracking
- Barcode Scanner
- Price Calculator
- Returns & Adjustments
- Thermal Receipt Printing

### Step 1: Choose Your Business Type

After signup, select whether you run:
1. **Online Only** - Facebook Page automation
2. **Offline Only** - Physical shop management
3. **Both** - Get the complete package

### Step 2: For Online Business

1. Go to **Dashboard > Connect Page**
2. Click **Connect with Facebook**
3. Select your Facebook Pages
4. Enable automations in **Automation Settings**
5. Configure AI responses and bargaining limits

### Step 3: For Offline Shop

1. Go to **Shop Dashboard**
2. Add your shop details and logo
3. Add products with prices and stock
4. Start making sales!

### Time & Money You Save

| Manual Work | AutoFloy Saves |
|-------------|----------------|
| Replying to 100+ messages daily | 4+ hours/day |
| Stock counting and tracking | 2+ hours/day |
| Invoice creation | 1+ hour/day |
| Report generation | 3+ hours/week |
| **Total Monthly Savings** | **50+ hours & ৳80,000+** |

### What's Next?

- Set up your AI automation settings
- Add your product catalog
- Configure your invoice templates
- Invite team members if needed
        `,
        relatedArticles: ["account-setup", "connecting-first-page", "offline-shop-setup"]
      },
      {
        slug: "account-setup",
        title: "Account Setup",
        description: "Configure your account settings and preferences",
        category: "Getting Started",
        content: `
## Account Setup Guide

Setting up your account properly ensures the best experience with AutoFloy.

### Profile Settings

Navigate to **Settings > Profile** to configure:

- **Display Name**: How your name appears in the dashboard
- **Email Address**: Your primary contact email
- **Phone Number**: For account recovery and notifications
- **Avatar**: Upload a profile picture

### Business Information

Set up your business details:

- **Business Name**: Shown on invoices and communications
- **Business Type**: Online, Offline, or Both
- **Business Address**: For invoices and reports
- **Logo**: Upload for branded invoices

### Notification Preferences

Control how and when you receive notifications:

- **Email Notifications**: Receive updates via email
- **In-App Notifications**: See alerts within the dashboard
- **SMS Alerts**: Get critical alerts via SMS
- **Order Notifications**: Alerts for new AI orders

### Security Settings

Keep your account secure:

- Enable two-factor authentication (2FA)
- Review connected devices
- Set up backup recovery options
- Change password regularly

### Subscription & Plans

- **Starter Plan**: Online OR Offline features
- **Professional Plan**: Both Online + Offline
- **Business Plan**: Everything + Priority Support
        `,
        relatedArticles: ["quick-start-guide", "data-security", "offline-shop-setup"]
      },
      {
        slug: "connecting-first-page",
        title: "Connecting Your Facebook Page",
        description: "Learn how to connect Facebook Pages for automation",
        category: "Getting Started",
        content: `
## Connecting Your Facebook Page

AutoFloy connects to your Facebook Page to automate messages and comments.

### Prerequisites

Before connecting, ensure you have:

- Admin access to the Facebook Page
- A Facebook Business account
- Page published and active

### Connection Steps

1. **Navigate to Dashboard**
   - Click **"Connect Page"** button

2. **Facebook Login**
   - Click **"Connect with Facebook"**
   - Log in if prompted

3. **Select Pages**
   - Choose which pages to connect
   - You can select multiple pages

4. **Grant Permissions**
   - Allow message reading/sending
   - Allow comment access
   - Allow page management

5. **Verify Connection**
   - Check the connection status
   - Test with a sample message

### What Permissions Are Needed?

| Permission | Why It's Needed |
|------------|-----------------|
| pages_messaging | Send/receive inbox messages |
| pages_read_engagement | Read and reply to comments |
| pages_manage_metadata | Access page settings |

### After Connection

Once connected, you can:

1. Enable **AI Auto-Reply** for messages
2. Enable **Comment Auto-Reply**
3. Configure **AI Sales Agent** settings
4. Set up **Bargaining Power** limits
5. View all conversations in dashboard

### Troubleshooting

**Connection Failed?**
- Verify you have admin access
- Check Facebook permissions
- Try clearing browser cache
- Disconnect and reconnect

**Token Expired?**
- Click "Refresh" next to page name
- Re-authenticate if required
        `,
        relatedArticles: ["facebook-automation-setup", "ai-auto-reply", "comment-management"]
      },
      {
        slug: "offline-shop-setup",
        title: "Setting Up Your Offline Shop",
        description: "Complete guide to set up POS and inventory system",
        category: "Getting Started",
        content: `
## Setting Up Your Offline Shop

AutoFloy's Offline Shop is a complete POS (Point of Sale) system for physical stores.

### Initial Setup

1. **Go to Shop Dashboard**
   - Click on "Offline Shop" in navigation

2. **Add Shop Details**
   - Shop name
   - Address
   - Phone number
   - Logo (for invoices)

3. **Configure Invoice Template**
   - Choose layout style
   - Add terms & conditions
   - Set payment methods

### Adding Products

**Single Product:**
1. Go to **Shop Products**
2. Click **Add Product**
3. Enter details:
   - Product name
   - Purchase price (your cost)
   - Selling price
   - Stock quantity
   - Barcode (optional)

**Bulk Import:**
1. Click **Import from Excel**
2. Download template
3. Fill in your products
4. Upload and import

### Product Categories

Organize products by category:
- Create custom categories
- Filter products by category
- Better reporting by category

### Stock Management

- **Add Stock**: When you purchase from supplier
- **Low Stock Alerts**: Get notified when stock is low
- **Expiry Tracking**: Track expiry dates
- **Batch Numbers**: Track product batches

### Making Sales

1. **Quick Sale**: Search or scan products
2. **Add to Cart**: Adjust quantities
3. **Apply Discounts**: Item or cart level
4. **Select Customer**: For due tracking
5. **Choose Payment**: Cash, bKash, Card
6. **Print Invoice**: Thermal or A4

### Features Available

| Feature | Description |
|---------|-------------|
| POS System | Quick sales with barcode scanning |
| Inventory | Stock tracking with alerts |
| Customers | Due management & history |
| Expenses | Track all business expenses |
| Reports | Sales, profit, stock reports |
| Cash Register | Daily opening/closing |
| Suppliers | Purchase management |
| Loans | Business loan tracking |
        `,
        relatedArticles: ["inventory-management", "customer-due-management", "pos-sales"]
      }
    ]
  },
  {
    id: "online-automation",
    icon: MessageSquare,
    title: "Online Business Automation",
    description: "AI-powered Facebook and WhatsApp automation",
    articles: [
      {
        slug: "ai-auto-reply",
        title: "AI Auto-Reply System",
        description: "How AI responds to customer messages automatically",
        category: "Online Automation",
        content: `
## AI Auto-Reply System

AutoFloy's AI doesn't just send template messages - it understands customer intent and responds naturally in Bengali.

### How It Works

1. Customer sends message to your page
2. AI analyzes the message content
3. Checks your product catalog for matches
4. Generates a natural Bengali response
5. Sends reply within seconds

### Capabilities

**Understands Customer Intent:**
- Product inquiries → Shares product details & prices
- Price questions → Provides pricing information
- Stock availability → Checks and confirms stock
- General questions → Answers from your FAQ

**Multi-Language Support:**
- Bengali (বাংলা) - Primary
- Banglish (Bengali in English)
- English

### AI Sales Agent Features

The AI acts like your best salesperson:

1. **Greeting & Welcome**: Warm, professional welcome
2. **Product Recommendations**: Based on customer interest
3. **Objection Handling**: Addresses concerns professionally
4. **Urgency Creation**: Limited stock, special offers
5. **Order Taking**: Collects name, phone, address

### Configuration

Navigate to **Automation Settings** to configure:

- **Enable/Disable** AI Reply
- **Business Hours**: When to use "Away" messages
- **Response Style**: Formal or friendly
- **Product Catalog**: What AI can sell
- **Escalation Rules**: When to notify you

### Best Practices

✅ Keep product catalog updated
✅ Add FAQs for common questions
✅ Set business hours correctly
✅ Monitor conversations regularly
✅ Let AI handle routine, intervene for complex

### Performance

| Metric | Typical Results |
|--------|-----------------|
| Response Time | < 5 seconds |
| Accuracy | 90%+ correct responses |
| Order Conversion | 3-5x improvement |
| Time Saved | 4+ hours daily |
        `,
        relatedArticles: ["ai-bargaining", "order-taking", "facebook-automation-setup"]
      },
      {
        slug: "ai-bargaining",
        title: "AI Bargaining Power",
        description: "Let AI negotiate prices with customers intelligently",
        category: "Online Automation",
        content: `
## AI Bargaining Power

Customers love to bargain - and now AI can handle it professionally while protecting your margins.

### How It Works

1. Customer asks for discount
2. AI uses negotiation strategies based on your settings
3. Gradually offers discounts within your limits
4. Closes the deal at best possible price

### Bargaining Levels

| Level | Behavior |
|-------|----------|
| **Soft** | Quick discounts, customer-friendly |
| **Medium** | Balanced negotiation |
| **Strong** | Holds price, strategic discounts |
| **Aggressive** | Maximum resistance, final offers only |

### Configuration

In **Automation Settings > Bargaining Power**:

1. **Enable Bargaining**: Turn on/off
2. **Select Level**: Soft to Aggressive
3. **Minimum Discount**: Starting discount AI can offer
4. **Maximum Rounds**: How many back-and-forth before final offer

### AI Negotiation Strategies

The AI uses professional techniques:

**Round 1**: Acknowledges request, highlights value
> "ভাই, এই দামে এই quality পাবেন না। আর ১০০ টাকা কমাই দিচ্ছি।"

**Round 2**: Small concession with urgency
> "আচ্ছা ভাই, বিশেষ কাস্টমার হিসেবে আরও একটু কমালাম।"

**Final Round**: Last offer with finality
> "এইটাই শেষ দাম ভাই, এর কম possible না।"

### Techniques Used

1. **Value Highlighting**: Emphasizes product benefits
2. **Scarcity**: "Stock কম আছে"
3. **Social Proof**: "অনেকে নিচ্ছে এই দামে"
4. **Reciprocity**: "আপনার জন্য বিশেষ করছি"
5. **Authority**: Product expertise and confidence

### Example Conversation

**Customer**: দাম কমাও ভাই
**AI**: ভাই, ১০০০ টাকার product ১০% discount দিয়ে ৯০০ টাকায় দিচ্ছি।

**Customer**: ৮০০ করো
**AI**: ভাই ৮৫০ করলাম, এর কম possible না really।

**Customer**: ঠিক আছে নিব
**AI**: বাহ! অর্ডার confirm করছি। Name, Phone, Address দেন ভাই।

### Benefits

- **Protects Margins**: Never goes below your minimum
- **Professional Image**: Consistent negotiation
- **Saves Time**: No manual bargaining
- **Closes More Deals**: Better than ignoring requests
        `,
        relatedArticles: ["ai-auto-reply", "order-taking", "facebook-automation-setup"]
      },
      {
        slug: "order-taking",
        title: "Automatic Order Taking",
        description: "AI collects customer details and creates orders",
        category: "Online Automation",
        content: `
## Automatic Order Taking

AI doesn't just answer questions - it takes complete orders conversationally.

### Order Flow

1. **Product Selection**: Customer shows interest
2. **Price Confirmation**: AI confirms price
3. **Name Collection**: Asks for customer name
4. **Phone Collection**: Gets phone number
5. **Address Collection**: Delivery address
6. **Order Confirmation**: Summarizes and confirms

### What AI Collects

| Field | How AI Asks (Bengali) |
|-------|----------------------|
| Name | "ভাই নাম কি বলবেন?" |
| Phone | "একটা মোবাইল নাম্বার দেন" |
| Address | "কোথায় পাঠাব? এড্রেস দেন" |
| Quantity | "কয়টা লাগবে ভাই?" |

### Order Confirmation Message

After collecting details, AI sends confirmation:

\`\`\`
✅ অর্ডার Confirmed!

📦 Product: Samsung Galaxy S21
💰 Price: ৳45,000
📍 Address: Mirpur 10, Dhaka
📱 Phone: 01712345678

ডেলিভারি হবে 2-3 দিনের মধ্যে।
ধন্যবাদ!
\`\`\`

### Where Orders Go

All AI orders are saved to:
- **AI Orders** section in dashboard
- Includes customer details
- Product information
- Order status tracking
- Invoice generation ready

### Order Management

From the AI Orders page you can:
- View all AI-generated orders
- Update order status
- Generate invoices
- Track delivery
- Contact customers

### Fraud Detection

AI automatically calculates **Fake Order Score** based on:
- Customer history
- Order patterns
- Response behavior
- Address validation

High-risk orders are flagged for manual review.
        `,
        relatedArticles: ["ai-auto-reply", "ai-bargaining", "invoice-generation"]
      },
      {
        slug: "image-recognition",
        title: "Smart Image Recognition",
        description: "AI identifies products from customer photos",
        category: "Online Automation",
        content: `
## Smart Image Recognition

When customers send product images, AI identifies them and provides pricing instantly.

### How It Works

1. Customer sends product image
2. AI analyzes the image
3. Matches with your product catalog
4. Responds with product details and price

### Supported Image Types

- Product photos
- Screenshots from other pages
- Catalog images
- Multiple products in one image

### Response Format

When AI recognizes a product:

\`\`\`
আচ্ছা! এটা তো [Product Name]!

📦 Product: Samsung Galaxy S21
💰 Price: ৳45,000
✅ Stock: Available

অর্ডার করবেন? নাম আর এড্রেস দেন।
\`\`\`

### When AI Can't Identify

If no match found:

\`\`\`
ভাই, এই product টা আমাদের কাছে নেই।
তবে কি খুঁজছেন বলেন, similar কিছু দেখাতে পারি।
\`\`\`

### Improving Recognition

For better accuracy:
- Upload clear product images to catalog
- Add multiple angles per product
- Use consistent image backgrounds
- Include product SKU/codes

### Use Cases

1. **"এটার দাম কত?"** + image → AI identifies and quotes
2. **"এটা আছে?"** + image → AI checks stock and responds
3. **Multiple images** → AI identifies each product
        `,
        relatedArticles: ["ai-auto-reply", "product-catalog", "order-taking"]
      },
      {
        slug: "voice-message-support",
        title: "Voice Message Processing",
        description: "AI transcribes and responds to voice messages",
        category: "Online Automation",
        content: `
## Voice Message Processing

Many customers prefer sending voice messages. AI transcribes and responds automatically.

### How It Works

1. Customer sends voice message
2. AI transcribes audio to text
3. Understands the content/intent
4. Generates appropriate text response

### Supported Languages

- Bengali (বাংলা)
- English
- Mixed Bengali-English

### Processing Speed

- **Transcription**: 2-5 seconds
- **Response Generation**: 2-3 seconds
- **Total Time**: Under 10 seconds

### What AI Can Handle

✅ Product inquiries via voice
✅ Price questions
✅ Order details
✅ General questions
✅ Complaints/feedback

### Response Format

AI always responds with text (not voice):

\`\`\`
[Voice message transcription shown internally]

ভাই, আপনার message শুনলাম।
Samsung S21 এর দাম ৳45,000।
Order করতে চাইলে নাম, ফোন আর এড্রেস দেন।
\`\`\`

### Benefits

- **No Manual Listening**: AI handles all voice messages
- **Faster Responses**: Instant vs listening one by one
- **Nothing Missed**: Every voice message gets answered
- **Time Saved**: 2+ hours daily for busy pages
        `,
        relatedArticles: ["ai-auto-reply", "facebook-automation-setup", "order-taking"]
      },
      {
        slug: "comment-management",
        title: "Comment Management & Auto-Reply",
        description: "Moderate comments and reply automatically",
        category: "Online Automation",
        content: `
## Comment Management

Keep your Facebook posts clean and convert comments into sales.

### Features

1. **Spam Detection**: Auto-identify spam comments
2. **Auto-Delete**: Remove bad comments instantly
3. **User Banning**: Ban abusive users
4. **Auto-Reply**: Reply to product inquiries
5. **Hide Comments**: Hide instead of delete

### Spam Detection

AI detects and removes:
- Promotional links
- Competitor mentions
- Abusive language
- Repetitive spam
- Scam attempts

### Auto-Reply to Comments

When someone comments asking about price or product:

**Customer Comment**: "দাম কত?"

**AI Reply**:
\`\`\`
ভাই, inbox করুন details জানাচ্ছি! ✨
\`\`\`

### Configuration

In **Automation Settings**:

- **Enable Comment Auto-Reply**: On/Off
- **Reply Keywords**: "দাম", "price", "কত"
- **Reply Template**: Customize your reply
- **Hide After Reply**: Optional

### Comment to Inbox Flow

1. Customer comments on post
2. AI replies asking to inbox
3. Customer messages inbox
4. AI takes over with full sales conversation

### Benefits

| Without AutoFloy | With AutoFloy |
|------------------|---------------|
| Spam floods comments | Clean comments |
| Miss comment inquiries | Auto-reply to all |
| Manual moderation | Automatic 24/7 |
| Lost sales | Converted to inbox |
        `,
        relatedArticles: ["ai-auto-reply", "facebook-automation-setup", "order-taking"]
      },
      {
        slug: "invoice-generation",
        title: "Auto-Invoice Generation",
        description: "Generate and send invoices automatically",
        category: "Online Automation",
        content: `
## Auto-Invoice Generation

Professional invoices generated and sent automatically after order confirmation.

### How It Works

1. Order is confirmed (by AI or manually)
2. Invoice generated with all details
3. Sent to customer via Messenger
4. Saved in your records

### Invoice Contents

Every invoice includes:

- **Your Business**: Name, logo, address
- **Customer**: Name, phone, address
- **Products**: Name, quantity, price
- **Totals**: Subtotal, delivery, discount, total
- **Invoice Number**: Auto-sequential
- **Date & Time**: Order timestamp

### Customization

Configure your invoice template:

- **Logo**: Upload your business logo
- **Colors**: Match your brand
- **Terms**: Payment terms, return policy
- **Footer**: Thank you message, social links

### Delivery Options

Invoices can be sent via:
- Facebook Messenger (automatic)
- WhatsApp (if connected)
- Email (if customer provides)
- Print for delivery

### Invoice Types

| Type | Use Case |
|------|----------|
| Online Invoice | AI orders from Facebook |
| POS Invoice | Offline shop sales |
| Thermal Receipt | Quick POS printing |
| Full A4 Invoice | Formal business invoice |

### Record Keeping

All invoices are saved with:
- Invoice number for reference
- Customer details
- Order history
- Export to Excel
        `,
        relatedArticles: ["order-taking", "offline-shop-setup", "pos-sales"]
      }
    ]
  },
  {
    id: "offline-shop",
    icon: Store,
    title: "Offline Shop Management",
    description: "POS, inventory, and complete shop management",
    articles: [
      {
        slug: "pos-sales",
        title: "POS Sales System",
        description: "Quick sales with the Point of Sale system",
        category: "Offline Shop",
        content: `
## POS Sales System

Make sales quickly with the intuitive Point of Sale interface.

### Making a Sale

1. **Search Products**: Type name or scan barcode
2. **Add to Cart**: Click or scan to add
3. **Adjust Quantities**: +/- buttons or type
4. **Apply Discounts**: Item or cart level
5. **Select Customer**: For due tracking (optional)
6. **Choose Payment**: Cash, bKash, Card, Due
7. **Complete Sale**: Generate invoice

### Barcode Scanning

- **USB Scanner**: Plug and play
- **Mobile Camera**: Use phone as scanner
- **Manual Entry**: Type barcode if needed

### Payment Methods

| Method | Description |
|--------|-------------|
| Cash | Physical cash payment |
| bKash | Mobile money |
| Nagad | Mobile money |
| Card | Debit/Credit card |
| Due | Credit sale |

### Discounts

**Item Level Discount:**
- Percentage off specific item
- Fixed amount off

**Cart Level Discount:**
- Percentage off total
- Fixed amount off total

### Due Sales

For credit sales:
1. Select existing customer (or create new)
2. Enter amount paid (can be 0)
3. Remaining becomes "due"
4. Track and collect later

### Quick Actions

- **Hold Sale**: Pause and resume later
- **Recent Sales**: View last 10 sales
- **Quick Customer**: Add new customer inline
- **Calculator**: Built-in calculator

### Printing

- **Thermal Receipt**: 58mm/80mm printers
- **A4 Invoice**: Full page invoice
- **No Print**: Digital only
        `,
        relatedArticles: ["inventory-management", "customer-due-management", "thermal-printing"]
      },
      {
        slug: "inventory-management",
        title: "Inventory Control",
        description: "Track stock levels, expiry, and get alerts",
        category: "Offline Shop",
        content: `
## Inventory Control

Never run out of stock or let products expire with smart inventory tracking.

### Stock Tracking

Every product tracks:
- **Current Stock**: Real-time quantity
- **Low Stock Alert**: Threshold-based alerts
- **Expiry Date**: For perishables
- **Batch Number**: Track product batches
- **Purchase Price**: Your cost
- **Selling Price**: Customer price

### Adding Stock

When you purchase inventory:

1. Go to **Products > Add Stock**
2. Select product
3. Enter quantity
4. Enter purchase price (if different)
5. Add batch/expiry if applicable
6. Link to supplier (optional)

### Low Stock Alerts

Configure alerts:
- Set minimum threshold per product
- Get notifications when stock falls below
- See all low-stock items in one view

### Expiry Tracking

For products with expiry dates:
- Enter expiry when adding stock
- Get alerts before expiry
- Track by batch number
- Generate expiring-soon reports

### Stock Adjustments

Record stock changes:

| Adjustment Type | Use Case |
|-----------------|----------|
| Damage | Product damaged/broken |
| Return | Customer return |
| Theft/Loss | Missing stock |
| Correction | Counting error |

### Stock Reports

Generate reports for:
- Current stock valuation
- Stock movement history
- Low stock items
- Expiring soon
- Dead stock (not selling)

### Offline-First

All inventory works offline:
- Make sales without internet
- Update stock offline
- Sync when connected
        `,
        relatedArticles: ["pos-sales", "supplier-management", "online-offline-sync"]
      },
      {
        slug: "customer-due-management",
        title: "Customer & Due Management",
        description: "Track customer dues and purchase history",
        category: "Offline Shop",
        content: `
## Customer & Due Management

Build customer relationships and manage credit sales professionally.

### Customer Database

Store customer information:
- Name and phone number
- Address
- Opening balance (if any)
- Purchase history
- Total due amount

### Due Tracking

When a customer buys on credit:

1. Sale is linked to customer
2. Unpaid amount becomes "due"
3. Track in customer profile
4. Collect payments over time

### Collecting Payments

Record due collections:

1. Go to **Customers > Due Customers**
2. Select customer
3. Click **Collect Due**
4. Enter amount paid
5. Due automatically updated

### Payment History

Full history shows:
- Date and amount of each payment
- Payment method used
- Remaining balance after each payment
- Complete transparency

### Due Reminders

Send SMS reminders:
- Manual send for specific customers
- Bulk send to all due customers
- Template customization
- Delivery tracking

### Customer Reports

Generate reports:
- All customers with dues
- High-value customers
- Customer-wise sales
- Collection history

### Opening Balance

For existing customers:
- Set opening due amount
- Track from before AutoFloy
- Include in total calculations

### Benefits

| Manual Tracking | With AutoFloy |
|-----------------|---------------|
| Paper ledger gets lost | Digital, always accessible |
| Calculation errors | Automatic calculations |
| Forget to collect | Reminder system |
| No history | Complete history |
        `,
        relatedArticles: ["pos-sales", "sms-reminders", "reports-analytics"]
      },
      {
        slug: "expense-tracking",
        title: "Expense & Cash Register",
        description: "Track expenses and manage daily cash",
        category: "Offline Shop",
        content: `
## Expense & Cash Register

Know exactly where every taka goes with complete expense and cash tracking.

### Expense Categories

Pre-built categories:
- Rent
- Electricity/Utilities
- Staff Salary
- Transport
- Marketing
- Shop Supplies
- Maintenance
- Other

You can add custom categories too.

### Recording Expenses

1. Go to **Shop > Expenses**
2. Click **Add Expense**
3. Select category
4. Enter amount
5. Add description (optional)
6. Choose payment method

### Cash Register

Daily cash management:

**Opening:**
- Enter opening cash balance
- Start of day cash count

**During Day:**
- Cash sales automatically added
- Expenses automatically deducted
- Due collections added

**Closing:**
- View expected cash
- Enter actual cash count
- Record any discrepancy

### Cash Flow Report

Track all money movement:

| In | Out |
|----|-----|
| Cash sales | Expenses |
| Due collections | Owner withdrawals |
| Owner deposits | Supplier payments |

### Owner Drawings

Track personal withdrawals:
- Record as "Owner Withdrawal"
- Separate from business expenses
- Appears in reports clearly

### Daily Summary

End of day shows:
- Total sales (cash + other)
- Total expenses
- Due collected
- Expected cash balance
- Actual cash (you enter)
- Variance (if any)

### Benefits

- **No Missing Money**: Every taka tracked
- **Tax Ready**: All expenses recorded
- **Business Health**: Know your profitability
- **Staff Accountability**: Track register differences
        `,
        relatedArticles: ["pos-sales", "reports-analytics", "supplier-management"]
      },
      {
        slug: "reports-analytics",
        title: "Reports & Analytics",
        description: "Comprehensive business reports and insights",
        category: "Offline Shop",
        content: `
## Reports & Analytics

Make data-driven decisions with comprehensive business reports.

### Available Reports

**Sales Reports:**
- Daily / Weekly / Monthly sales
- Sales by product
- Sales by category
- Sales by payment method
- Sales by customer

**Profit Reports:**
- Gross profit per product
- Daily / Monthly profit
- Profit margins
- Loss-making items

**Inventory Reports:**
- Current stock valuation
- Low stock items
- Expiring soon
- Dead stock
- Stock movement

**Financial Reports:**
- Expense breakdown
- Cash flow
- Dues receivable
- Supplier dues payable

### Filtering Options

All reports can be filtered by:
- Date range (custom or preset)
- Product / Category
- Customer / Supplier
- Payment method

### Charts & Visualizations

Visual representations:
- Sales trend line charts
- Category pie charts
- Payment method breakdown
- Profit vs Expense comparison

### Export Options

Export reports as:
- Excel (.xlsx) - detailed data
- PDF - printable format
- CSV - for analysis

### Insights

AutoFloy provides insights:
- Best selling products
- Peak sales times
- Slow-moving inventory
- High-value customers
- Expense patterns

### Combined Reports

With sync enabled, see:
- Online + Offline sales together
- Unified inventory
- Complete business picture
        `,
        relatedArticles: ["expense-tracking", "pos-sales", "inventory-management"]
      },
      {
        slug: "supplier-management",
        title: "Supplier & Purchase Management",
        description: "Track suppliers, purchases, and dues",
        category: "Offline Shop",
        content: `
## Supplier & Purchase Management

Manage all your suppliers and purchase records in one place.

### Supplier Database

Store supplier information:
- Name and contact details
- Phone and address
- Opening balance
- Payment terms
- Purchase history

### Recording Purchases

When you buy inventory:

1. Go to **Suppliers**
2. Select supplier (or add new)
3. Click **Add Purchase**
4. Enter products and quantities
5. Enter prices
6. Record payment amount

### Supplier Dues

Track what you owe:
- Purchase creates due
- Payments reduce due
- Track by supplier
- Payment history

### Payment Recording

1. Go to **Suppliers > [Supplier Name]**
2. Click **Make Payment**
3. Enter amount
4. Choose method (Cash/bKash/Bank)
5. Due automatically updated

### Purchase History

For each supplier, see:
- All past purchases
- Products bought
- Prices paid
- Payments made
- Current balance

### Supplier Reports

Generate reports:
- All suppliers with dues
- Purchase history
- Payment history
- Top suppliers by value

### Benefits

| Manual | With AutoFloy |
|--------|---------------|
| Forget payments | Track all dues |
| No purchase history | Complete records |
| Price confusion | Historical prices |
| Relationship issues | Professional tracking |
        `,
        relatedArticles: ["inventory-management", "expense-tracking", "reports-analytics"]
      },
      {
        slug: "loan-tracking",
        title: "Business Loan Management",
        description: "Track loans, installments, and payments",
        category: "Offline Shop",
        content: `
## Business Loan Management

Keep track of all business loans with installment scheduling and reminders.

### Adding a Loan

1. Go to **Shop > Loans**
2. Click **Add Loan**
3. Enter details:
   - Loan amount
   - Interest rate
   - Lender name
   - Start date
   - Installment amount
   - Installment frequency

### Loan Types

Track any type of loan:
- Bank loans
- Microfinance (Grameen, BRAC, etc.)
- Personal loans
- Supplier credit

### Installment Tracking

For each loan:
- Total amount
- Paid amount
- Remaining balance
- Next installment date
- Installment amount

### Recording Payments

1. Select loan
2. Click **Record Payment**
3. Enter amount paid
4. Date automatically recorded
5. Remaining balance updated

### Payment Reminders

Get notified before due dates:
- In-app notifications
- SMS reminders (optional)
- Email alerts

### Loan Reports

See at a glance:
- All active loans
- Total debt
- Upcoming payments
- Payment history
- Completed loans

### Benefits

- **Never Miss Payments**: Reminders before due
- **Clear Overview**: All loans in one place
- **Interest Tracking**: Know total cost
- **Payment History**: Complete records
        `,
        relatedArticles: ["expense-tracking", "reports-analytics", "supplier-management"]
      },
      {
        slug: "online-offline-sync",
        title: "Online-Offline Sync",
        description: "Unify inventory across all sales channels",
        category: "Offline Shop",
        content: `
## Online-Offline Sync

Bridge your Facebook sales with your physical store for unified inventory.

### How It Works

1. **Link Products**: Match online products to offline inventory
2. **Enable Sync**: Turn on automatic synchronization
3. **Unified Stock**: One stock pool for all channels
4. **Real-Time Updates**: Stock updates instantly

### Benefits

| Without Sync | With Sync |
|--------------|-----------|
| Overselling risk | Prevents overselling |
| Manual stock updates | Automatic updates |
| Separate reports | Unified reports |
| Double work | Single source of truth |

### Setting Up Sync

1. Go to **Settings > Sync Settings**
2. Enable Online-Offline Sync
3. Link products by SKU or manually
4. Configure sync rules

### Product Linking

Match products automatically:
- By SKU/Barcode
- By product name
- Manual linking

### Sync Rules

Configure how orders affect stock:
- Online order → Reduce offline stock
- Offline sale → Update online availability
- Stock added → Reflect everywhere

### Unified Reports

See combined data:
- Total sales (online + offline)
- Combined revenue
- Stock across channels
- Profit by channel

### Offline-First Design

Even without internet:
- Make offline sales
- Track inventory locally
- Sync when connected
- Never lose data
        `,
        relatedArticles: ["inventory-management", "facebook-automation-setup", "reports-analytics"]
      }
    ]
  },
  {
    id: "settings-security",
    icon: Settings,
    title: "Settings & Configuration",
    description: "Account settings, security, and customization",
    articles: [
      {
        slug: "facebook-automation-setup",
        title: "Automation Settings Guide",
        description: "Complete guide to configure all automation features",
        category: "Settings",
        content: `
## Automation Settings Guide

Configure all your AI automation features in one place.

### Accessing Settings

Go to **Dashboard > Automations > Settings**

### Core Toggles

| Feature | What It Does |
|---------|--------------|
| AI Auto-Reply | Reply to inbox messages |
| Comment Reply | Reply to post comments |
| Order Taking | Collect customer details |
| Voice Processing | Handle voice messages |
| Image Recognition | Identify products from images |

### AI Behavior Settings

**Response Style:**
- Formal (আপনি ব্যবহার করে)
- Friendly (ভাই, আপা ব্যবহার করে)
- Mix (situation-based)

**Business Hours:**
- Set operating hours
- Away message for off-hours

### Bargaining Power Settings

Configure AI negotiation:
- Enable/Disable bargaining
- Select level (Soft to Aggressive)
- Set minimum discount AI can start with
- Maximum negotiation rounds

### Product Knowledge

AI learns from:
- Your product catalog
- FAQs you provide
- Business description
- Common responses

### Updating AI Knowledge

1. Go to **Automations > AI Memory**
2. Add/update business description
3. Add FAQ questions and answers
4. Sync products from catalog
5. Set business hours

### Testing Automations

Before going live:
1. Use the **Simulator** to test
2. Send test message from another account
3. Review AI responses
4. Adjust settings as needed

### Best Practices

✅ Start with friendly style for Bangladesh
✅ Add common Bengali questions to FAQ
✅ Set realistic bargaining limits
✅ Monitor first few days closely
✅ Adjust based on customer feedback
        `,
        relatedArticles: ["ai-auto-reply", "ai-bargaining", "order-taking"]
      },
      {
        slug: "data-security",
        title: "Data Security",
        description: "How we protect your data",
        category: "Security & Privacy",
        content: `
## Data Security

AutoFloy takes security seriously. Here's how we protect your data.

### Encryption

**In Transit:**
- All connections use TLS 1.3
- Secure API endpoints
- Encrypted WebSocket connections

**At Rest:**
- AES-256 encryption for stored data
- Encrypted database backups
- Secure key management

### Access Security

- Role-based access control
- Secure password requirements
- Session management
- Device tracking

### Facebook Token Security

- OAuth tokens encrypted before storage
- Automatic token refresh
- Minimal permission scopes
- Secure connection process

### Offline Data Security

- Data stored locally on your device
- Encrypted local storage
- Secure sync when online

### Your Rights

You can always:
- Export your data
- Delete your account
- Revoke Facebook permissions
- Clear local data

### Best Practices

For maximum security:
- Use strong passwords
- Don't share login credentials
- Log out from shared devices
- Review connected devices regularly
        `,
        relatedArticles: ["account-setup", "facebook-automation-setup"]
      },
      {
        slug: "thermal-printing",
        title: "Thermal Printer Setup",
        description: "Configure thermal printers for receipts",
        category: "Settings",
        content: `
## Thermal Printer Setup

Print professional receipts with thermal printers.

### Supported Printers

Most USB thermal printers work:
- 58mm width (standard)
- 80mm width (wide)
- USB connection
- Bluetooth (mobile)

### Setup Steps

**Desktop/Laptop:**
1. Connect printer via USB
2. Install printer drivers
3. Set as default printer
4. Enable printing in AutoFloy

**Mobile:**
1. Pair Bluetooth printer
2. Enable Bluetooth in app
3. Select printer in settings

### Receipt Customization

Configure your receipt:
- Shop name and logo
- Address and phone
- Thank you message
- Terms and conditions
- QR code (optional)

### Print Settings

- **Auto-Print**: Print on every sale
- **Manual**: Click to print
- **Duplicate**: Print customer copy

### Troubleshooting

**Printer Not Found:**
- Check USB connection
- Reinstall drivers
- Restart browser

**Print Quality Issues:**
- Check paper roll
- Clean print head
- Adjust print density
        `,
        relatedArticles: ["pos-sales", "invoice-generation", "offline-shop-setup"]
      }
    ]
  },
  {
    id: "security-privacy",
    icon: Shield,
    title: "Security & Privacy",
    description: "Keep your data safe and secure",
    articles: [
      {
        slug: "privacy-best-practices",
        title: "Privacy Best Practices",
        description: "Protect customer privacy while using automation",
        category: "Security & Privacy",
        content: `
## Privacy Best Practices

Protect your customers' privacy while using AutoFloy.

### Data Collection

Only collect what you need:
- Name for personalization
- Phone for order delivery
- Address for shipping
- Avoid unnecessary data

### Customer Consent

Be transparent about AI:
- Mention automated responses
- Provide opt-out options
- Link to privacy policy

### Data Handling

**Do:**
✅ Store data securely
✅ Delete when not needed
✅ Honor data requests

**Don't:**
❌ Share data with third parties
❌ Use for unauthorized purposes
❌ Store sensitive data unnecessarily

### AI Conversations

- Conversations stored for service
- Used to improve AI responses
- You can delete history anytime

### Customer Rights

Customers can request:
- View their data
- Delete their data
- Export their data
- Stop automation for them

### Best Practices

1. Add privacy policy to page
2. Inform about AI responses
3. Handle data requests promptly
4. Regular data cleanup
        `,
        relatedArticles: ["data-security", "compliance-gdpr"]
      },
      {
        slug: "compliance-gdpr",
        title: "Compliance (GDPR)",
        description: "GDPR compliance information and tools",
        category: "Security & Privacy",
        content: `
## GDPR Compliance

AutoFloy helps you maintain GDPR compliance for European customers.

### Your Rights

As a data subject, you can:
- Access your data
- Correct inaccurate data
- Request deletion
- Export your data
- Restrict processing

### Data Export

1. Go to **Settings > Privacy**
2. Click **Export My Data**
3. Choose format (JSON/CSV)
4. Download within 48 hours

### Data Deletion

1. Go to **Settings > Privacy**
2. Click **Delete My Data**
3. Confirm deletion
4. Data removed within 30 days

### Data Retention

| Data Type | Retention |
|-----------|-----------|
| Account data | Until deletion |
| Conversations | 90 days |
| Analytics | 12 months |
| Backups | 30 days after deletion |

### For Your Customers

Help customers exercise rights:
- Provide privacy notices
- Honor data requests
- Maintain records
- Report breaches promptly

### Resources

- [Privacy Policy](/privacy)
- [GDPR Page](/gdpr)
- [Contact Support](/contact)
        `,
        relatedArticles: ["data-security", "privacy-best-practices"]
      }
    ]
  }
];

// Helper function to get all articles as a flat array
export const getAllArticles = (): HelpArticle[] => {
  return helpCategories.flatMap(category => category.articles);
};

// Helper function to get article by slug
export const getArticleBySlug = (slug: string): HelpArticle | undefined => {
  return getAllArticles().find(article => article.slug === slug);
};

// Helper function to get category by article slug
export const getCategoryByArticleSlug = (slug: string): HelpCategory | undefined => {
  return helpCategories.find(category => 
    category.articles.some(article => article.slug === slug)
  );
};
