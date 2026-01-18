import { MessageSquare, Image, Mic, Shield, FileText, Clock, Store, Package, Users, BarChart3, Wallet, RefreshCw, Truck, Landmark, LucideIcon } from "lucide-react";

export interface FeatureDetail {
  slug: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  description: string;
  benefits: string[];
  steps: {
    title: string;
    description: string;
  }[];
  faq: {
    question: string;
    answer: string;
  }[];
}

export const featuresDetails: FeatureDetail[] = [
  // ==================== ONLINE BUSINESS FEATURES ====================
  {
    slug: "message-auto-reply",
    title: "Message Auto-Reply",
    subtitle: "Never miss a customer inquiry again with instant AI-powered responses in Bengali and English",
    icon: MessageSquare,
    color: "from-primary to-primary-glow",
    description: "AutoFloy's Message Auto-Reply feature uses advanced AI to instantly respond to customer messages on your Facebook Page and WhatsApp. Whether customers write in Bengali or English, our system understands their intent and provides helpful, contextual responses that feel natural and human-like.\n\nThis feature dramatically reduces your response time from hours to seconds, ensuring no potential sale slips through the cracks while you're busy or offline.",
    benefits: [
      "Instant responses 24/7 - never keep customers waiting",
      "Supports both Bengali and English languages seamlessly",
      "AI understands customer intent and provides relevant answers",
      "Reduces manual workload by handling repetitive inquiries",
      "Increases conversion rates with faster response times",
      "Customizable response templates for your business tone"
    ],
    steps: [
      {
        title: "Connect Your Page",
        description: "Link your Facebook Page or WhatsApp Business account to AutoFloy in just a few clicks."
      },
      {
        title: "Set Up Keywords",
        description: "Define trigger keywords and phrases that should activate auto-replies."
      },
      {
        title: "Customize Responses",
        description: "Create response templates that match your brand voice and include product information."
      },
      {
        title: "Enable & Monitor",
        description: "Turn on auto-reply and watch your response rate improve while monitoring conversations in real-time."
      }
    ],
    faq: [
      {
        question: "Can I customize the auto-reply messages?",
        answer: "Yes! You have full control over response templates. You can create different responses for different keywords and scenarios, ensuring replies match your brand voice."
      },
      {
        question: "What happens if a customer needs human support?",
        answer: "AutoFloy can detect complex queries and escalate them to you via notifications. You can also set specific keywords that trigger immediate human handoff."
      },
      {
        question: "Does it work with both Facebook Messenger and WhatsApp?",
        answer: "Yes, AutoFloy supports both platforms. You can manage all your conversations from a single dashboard."
      }
    ]
  },
  {
    slug: "image-recognition",
    title: "Image Recognition",
    subtitle: "Let AI identify products from customer photos and provide instant pricing information",
    icon: Image,
    color: "from-secondary to-primary",
    description: "When customers send images of products they're interested in, AutoFloy's Image Recognition feature automatically analyzes the photo, identifies the product from your catalog, and responds with relevant information including pricing, availability, and specifications.\n\nThis powerful feature eliminates the back-and-forth of manual product identification and speeds up the sales process significantly.",
    benefits: [
      "Automatic product identification from customer photos",
      "Instant pricing and availability information",
      "Reduces time spent on manual product lookups",
      "Works with your existing product catalog",
      "Supports multiple image formats",
      "Improves customer experience with instant answers"
    ],
    steps: [
      {
        title: "Upload Your Catalog",
        description: "Import your product catalog with images, prices, and descriptions into AutoFloy."
      },
      {
        title: "Train the AI",
        description: "Our AI learns to recognize your products and associate them with correct information."
      },
      {
        title: "Enable Image Recognition",
        description: "Turn on the feature to start automatically processing customer image messages."
      },
      {
        title: "Review & Refine",
        description: "Monitor recognition accuracy and fine-tune the system for better results over time."
      }
    ],
    faq: [
      {
        question: "How accurate is the image recognition?",
        answer: "Our AI achieves over 90% accuracy for clear product images. The system improves over time as it learns from your specific product catalog."
      },
      {
        question: "What if the AI can't identify a product?",
        answer: "When uncertain, AutoFloy will notify you for manual review and ask the customer for more details, ensuring no inquiry goes unanswered."
      }
    ]
  },
  {
    slug: "voice-support",
    title: "Voice Support",
    subtitle: "Automatically transcribe and respond to voice messages in seconds",
    icon: Mic,
    color: "from-accent to-secondary",
    description: "Many customers prefer sending voice messages, especially in regions where voice communication is more natural. AutoFloy's Voice Support feature automatically transcribes these audio messages, understands the customer's request, and generates an appropriate text response.\n\nThis ensures you never miss important inquiries just because they came as voice messages, and customers get the quick responses they expect.",
    benefits: [
      "Automatic transcription of voice messages",
      "Supports Bengali and English voice messages",
      "AI understands intent from transcribed text",
      "Generates contextual text responses",
      "Saves hours of listening to voice messages manually",
      "Ensures no voice inquiry goes unanswered"
    ],
    steps: [
      {
        title: "Enable Voice Processing",
        description: "Activate voice message handling in your AutoFloy automation settings."
      },
      {
        title: "Configure Language",
        description: "Set your preferred languages for transcription - Bengali, English, or both."
      },
      {
        title: "Set Response Rules",
        description: "Define how the system should respond to different types of voice inquiries."
      },
      {
        title: "Monitor Transcriptions",
        description: "Review transcriptions and responses to ensure accuracy and quality."
      }
    ],
    faq: [
      {
        question: "How fast is the voice transcription?",
        answer: "Voice messages are typically transcribed and responded to within 5-10 seconds, ensuring customers get near-instant replies."
      },
      {
        question: "Can I review transcriptions before responding?",
        answer: "Yes, you can enable a review mode where you approve responses before they're sent, or let the AI handle everything automatically."
      }
    ]
  },
  {
    slug: "comment-management",
    title: "Comment Management",
    subtitle: "Keep your page clean with automated spam detection, comment moderation, and user management",
    icon: Shield,
    color: "from-success to-primary",
    description: "Managing comments on a busy Facebook Page can be overwhelming. AutoFloy's Comment Management feature automatically detects and removes spam, hides inappropriate comments, and can even ban abusive users - all without any manual intervention.\n\nYou can also set up auto-replies to comments containing specific keywords, turning comment sections into another sales channel.",
    benefits: [
      "Automatic spam and inappropriate content detection",
      "Auto-delete or hide offensive comments instantly",
      "Ban abusive users automatically",
      "Keyword-triggered auto-replies to comments",
      "Protect your brand reputation 24/7",
      "Focus on genuine customer interactions"
    ],
    steps: [
      {
        title: "Connect Your Page",
        description: "Link your Facebook Page to grant AutoFloy comment management permissions."
      },
      {
        title: "Set Moderation Rules",
        description: "Define what types of comments should be hidden, deleted, or flagged for review."
      },
      {
        title: "Configure Auto-Replies",
        description: "Set up automatic replies for comments containing specific keywords or questions."
      },
      {
        title: "Monitor Activity",
        description: "Review moderation logs and adjust rules based on your page's specific needs."
      }
    ],
    faq: [
      {
        question: "Will legitimate comments be accidentally removed?",
        answer: "Our AI is trained to distinguish between spam and genuine comments. You can also set sensitivity levels and review flagged comments before action is taken."
      },
      {
        question: "Can I set up auto-replies for product inquiries in comments?",
        answer: "Yes! You can configure keyword-triggered replies that direct customers to DM for more details or provide instant pricing information."
      }
    ]
  },
  {
    slug: "auto-invoice",
    title: "Auto-Invoice",
    subtitle: "Generate and send professional invoices automatically after every confirmed order",
    icon: FileText,
    color: "from-primary to-accent",
    description: "Stop spending time manually creating invoices for every order. AutoFloy's Auto-Invoice feature automatically generates professional, branded invoices the moment an order is confirmed and sends them directly to your customers via their preferred channel.\n\nThis not only saves you time but also creates a more professional image for your business and ensures every transaction is properly documented.",
    benefits: [
      "Automatic invoice generation on order confirmation",
      "Professional, customizable invoice templates",
      "Send invoices via Messenger, WhatsApp, or email",
      "Automatic invoice numbering and tracking",
      "Digital record keeping for tax purposes",
      "Reduces manual accounting workload"
    ],
    steps: [
      {
        title: "Set Up Your Business Info",
        description: "Add your business name, logo, address, and tax information for invoice branding."
      },
      {
        title: "Customize Invoice Template",
        description: "Choose from professional templates and customize colors, layout, and information displayed."
      },
      {
        title: "Configure Delivery",
        description: "Set how and when invoices should be sent - immediately after confirmation or at specific times."
      },
      {
        title: "Track & Export",
        description: "Monitor all generated invoices and export data for accounting purposes."
      }
    ],
    faq: [
      {
        question: "Can I customize the invoice design?",
        answer: "Yes, you can add your logo, choose colors, and customize the layout to match your brand identity."
      },
      {
        question: "Are invoices automatically numbered?",
        answer: "Yes, AutoFloy automatically assigns sequential invoice numbers and maintains a complete record of all generated invoices."
      },
      {
        question: "Can I send invoices in Bengali?",
        answer: "Absolutely! You can create invoice templates in Bengali, English, or both languages."
      }
    ]
  },
  {
    slug: "247-support",
    title: "24/7 AI Support",
    subtitle: "Your business never sleeps - respond to customers anytime, day or night",
    icon: Clock,
    color: "from-secondary to-success",
    description: "Your customers don't stop shopping at 6 PM, so why should your support? AutoFloy's 24/7 Support feature ensures your business is always responsive, handling customer inquiries around the clock even when you're sleeping, on vacation, or simply offline.\n\nThis continuous availability can dramatically increase your sales and customer satisfaction, as buyers can get answers and make purchases at any time.",
    benefits: [
      "Round-the-clock automated customer support",
      "Never lose a sale due to delayed responses",
      "Handle multiple conversations simultaneously",
      "Consistent service quality at all hours",
      "Reduce stress of being always available",
      "Capture international customers in different time zones"
    ],
    steps: [
      {
        title: "Configure Business Hours",
        description: "Set your regular business hours so AutoFloy knows when you're available and when to take over."
      },
      {
        title: "Set Up After-Hours Responses",
        description: "Create specific responses for when customers reach out outside business hours."
      },
      {
        title: "Define Escalation Rules",
        description: "Specify which urgent matters should trigger notifications to you even outside hours."
      },
      {
        title: "Enable Always-On Mode",
        description: "Activate 24/7 support and let AutoFloy handle inquiries while you rest."
      }
    ],
    faq: [
      {
        question: "Will I be notified of urgent messages at night?",
        answer: "You control this! Set up VIP customer lists or urgent keywords that will trigger notifications even outside business hours."
      },
      {
        question: "Can the AI handle order placement at night?",
        answer: "Yes, customers can browse products, get pricing, and even confirm orders through the automated system at any hour."
      }
    ]
  },

  // ==================== OFFLINE SHOP FEATURES ====================
  {
    slug: "offline-shop-management",
    title: "Offline Shop Management",
    subtitle: "Complete POS and inventory management system for your physical store",
    icon: Store,
    color: "from-primary to-secondary",
    description: "AutoFloy's Offline Shop Management transforms your physical store into a fully digital operation. Track every product, sale, and customer from a single dashboard. Generate professional invoices, manage due payments, and get detailed reports - all without needing internet connection for daily operations.\n\nWhether you run a grocery shop, electronics store, or boutique, our system adapts to your needs with customizable categories, units, and pricing.",
    benefits: [
      "Complete Point of Sale (POS) system",
      "Real-time inventory tracking",
      "Professional invoice generation",
      "Customer and due payment management",
      "Works offline - sync when connected",
      "Multiple staff access with permissions"
    ],
    steps: [
      {
        title: "Set Up Your Shop",
        description: "Add your shop details, logo, and configure invoice templates to match your brand."
      },
      {
        title: "Add Products",
        description: "Import your product catalog with purchase prices, selling prices, and stock quantities."
      },
      {
        title: "Start Selling",
        description: "Use the POS system to record sales, apply discounts, and generate invoices instantly."
      },
      {
        title: "Track Everything",
        description: "Monitor sales, profits, expenses, and inventory through detailed reports."
      }
    ],
    faq: [
      {
        question: "Can I use it without internet?",
        answer: "Yes! The core features work offline. Your data syncs automatically when you're connected to the internet."
      },
      {
        question: "Can multiple staff members use it?",
        answer: "Absolutely! Create staff accounts with specific permissions - cashiers, managers, etc. Each can have different access levels."
      },
      {
        question: "Does it track profit per product?",
        answer: "Yes, the system calculates profit automatically based on purchase and selling prices, giving you detailed profit reports."
      }
    ]
  },
  {
    slug: "inventory-management",
    title: "Inventory Management",
    subtitle: "Track stock levels, expiry dates, and get low stock alerts automatically",
    icon: Package,
    color: "from-accent to-primary",
    description: "Never run out of stock or let products expire unnoticed. AutoFloy's Inventory Management keeps track of every product in your store with real-time stock updates, automatic low-stock alerts, and expiry date tracking.\n\nLink your offline products with online inventory for unified stock management across all sales channels.",
    benefits: [
      "Real-time stock level tracking",
      "Automatic low stock alerts",
      "Expiry date monitoring",
      "Barcode and SKU support",
      "Stock adjustment logging",
      "Unified online-offline inventory"
    ],
    steps: [
      {
        title: "Add Products",
        description: "Enter your products with purchase price, selling price, stock quantity, and optional barcode."
      },
      {
        title: "Set Alert Thresholds",
        description: "Define minimum stock levels that trigger low-stock notifications."
      },
      {
        title: "Record Stock Changes",
        description: "Log damage, returns, or manual adjustments with reasons for accurate tracking."
      },
      {
        title: "Link Online Products",
        description: "Connect offline products to online catalog for automatic stock sync."
      }
    ],
    faq: [
      {
        question: "Can I import products from Excel?",
        answer: "Yes! You can import products in bulk from Excel files. We provide templates to make this easy."
      },
      {
        question: "How does stock sync with online sales?",
        answer: "When enabled, orders from your Facebook page or website automatically reduce stock from your offline inventory."
      }
    ]
  },
  {
    slug: "customer-management",
    title: "Customer Management",
    subtitle: "Build customer relationships with due tracking and purchase history",
    icon: Users,
    color: "from-success to-secondary",
    description: "Know your customers better and build lasting relationships. AutoFloy's Customer Management tracks every customer interaction, purchase history, and outstanding dues. Quickly look up what a customer bought last time or how much they owe.\n\nPerfect for businesses that offer credit or want to reward loyal customers.",
    benefits: [
      "Complete customer database",
      "Purchase history tracking",
      "Due amount management",
      "Quick customer lookup",
      "Partial payment recording",
      "Customer-wise profit analysis"
    ],
    steps: [
      {
        title: "Add Customers",
        description: "Create customer profiles with name, phone, address, and opening balance."
      },
      {
        title: "Record Sales",
        description: "Link sales to customers to build their purchase history and track dues."
      },
      {
        title: "Collect Payments",
        description: "Record partial or full payments against customer dues."
      },
      {
        title: "Analyze",
        description: "View customer-wise sales, profits, and due reports."
      }
    ],
    faq: [
      {
        question: "Can I track customer dues?",
        answer: "Yes! When a customer doesn't pay full amount, the due is automatically tracked. You can record payments and see complete due history."
      },
      {
        question: "Can customers have opening balances?",
        answer: "Absolutely! If a customer already owes you money from before using AutoFloy, you can set their opening balance."
      }
    ]
  },
  {
    slug: "reports-analytics",
    title: "Reports & Analytics",
    subtitle: "Make data-driven decisions with comprehensive business reports",
    icon: BarChart3,
    color: "from-primary to-success",
    description: "Get complete visibility into your business performance. AutoFloy generates detailed reports for sales, purchases, expenses, inventory, and profits. Filter by date range, export to Excel, and understand exactly where your money is going.\n\nCombine online and offline data for unified business intelligence.",
    benefits: [
      "Daily, weekly, monthly sales reports",
      "Profit and loss analysis",
      "Expense tracking and categorization",
      "Inventory valuation reports",
      "Customer and supplier due reports",
      "Export to Excel for further analysis"
    ],
    steps: [
      {
        title: "Select Report Type",
        description: "Choose from sales, expenses, inventory, or profit reports."
      },
      {
        title: "Set Date Range",
        description: "Filter data by custom date ranges or use presets like today, this week, this month."
      },
      {
        title: "View Insights",
        description: "Analyze charts, tables, and key metrics to understand your business."
      },
      {
        title: "Export Data",
        description: "Download reports as Excel files for accounting or further analysis."
      }
    ],
    faq: [
      {
        question: "Can I see combined online and offline reports?",
        answer: "Yes! With sync enabled, you get unified reports showing sales from both channels with source labels."
      },
      {
        question: "Can I track profit per product?",
        answer: "Absolutely! The system tracks purchase price and selling price to calculate profit for every sale."
      }
    ]
  },
  {
    slug: "expense-cash-management",
    title: "Expense & Cash Management",
    subtitle: "Track every taka that comes in and goes out of your business",
    icon: Wallet,
    color: "from-secondary to-accent",
    description: "Keep your finances under control with complete cash management. Record all business expenses by category, track cash balance, manage owner deposits and withdrawals, and never lose track of your money.\n\nGet clear visibility into where your money is going and maintain accurate records for tax purposes.",
    benefits: [
      "Complete expense tracking by category",
      "Real-time cash balance",
      "Owner deposit/withdrawal recording",
      "Due collection tracking",
      "Payment method breakdown",
      "Daily cash closing reports"
    ],
    steps: [
      {
        title: "Set Opening Balance",
        description: "Enter your starting cash balance to begin accurate tracking."
      },
      {
        title: "Record Expenses",
        description: "Log expenses with categories like rent, salary, utilities, marketing, etc."
      },
      {
        title: "Track Cash Flow",
        description: "Monitor deposits, withdrawals, and cash from sales in real-time."
      },
      {
        title: "Review Balance",
        description: "Check cash balance anytime and generate cash reports."
      }
    ],
    faq: [
      {
        question: "What expense categories are available?",
        answer: "Pre-built categories include Rent, Electricity, Salary, Marketing, Transport, and more. You can also add custom categories."
      },
      {
        question: "Can I track bKash/Nagad payments?",
        answer: "Yes! Record payments with method (Cash, bKash, Nagad, Card, Bank) for complete payment tracking."
      }
    ]
  },
  {
    slug: "online-offline-sync",
    title: "Online-Offline Sync",
    subtitle: "Unify your online and offline business for seamless inventory management",
    icon: RefreshCw,
    color: "from-success to-primary",
    description: "Bridge the gap between your online presence and physical store. AutoFloy's Sync feature connects your Facebook page sales with your offline inventory, ensuring stock levels are always accurate across all channels.\n\nOrders from online channels automatically reduce offline stock, and unified reports show your complete business picture.",
    benefits: [
      "Automatic stock sync across channels",
      "Prevent overselling",
      "Unified sales reports",
      "Single source of truth for inventory",
      "Link products by SKU",
      "Real-time stock updates"
    ],
    steps: [
      {
        title: "Enable Sync",
        description: "Turn on the sync feature in your settings to connect online and offline systems."
      },
      {
        title: "Link Products",
        description: "Match offline products with online products using SKU or manual linking."
      },
      {
        title: "Configure Rules",
        description: "Set how online orders should affect offline inventory."
      },
      {
        title: "Monitor Sync",
        description: "View sync status and resolve any mismatches through the dashboard."
      }
    ],
    faq: [
      {
        question: "What happens if I sell the same product online and offline?",
        answer: "With sync enabled, both sales reduce from the same stock pool, preventing overselling."
      },
      {
        question: "Can I use only offline features without sync?",
        answer: "Absolutely! Sync is optional. You can use the offline shop completely independently if you prefer."
      }
    ]
  },
  {
    slug: "supplier-management",
    title: "Supplier Management",
    subtitle: "Track supplier purchases, dues, and payment history",
    icon: Truck,
    color: "from-accent to-success",
    description: "Manage all your suppliers in one place. Track purchases, outstanding dues, and payment history. Get insights into your best suppliers and negotiate better deals.\n\nPerfect for shops that regularly buy inventory from multiple suppliers and need to manage credit relationships.",
    benefits: [
      "Complete supplier database",
      "Purchase order tracking",
      "Supplier due management",
      "Payment history records",
      "Supplier-wise purchase reports",
      "Contact information storage"
    ],
    steps: [
      {
        title: "Add Suppliers",
        description: "Create supplier profiles with name, phone, address, and opening balance."
      },
      {
        title: "Record Purchases",
        description: "Log purchases with items, quantities, and payment amounts."
      },
      {
        title: "Track Dues",
        description: "Monitor outstanding dues and record payments."
      },
      {
        title: "Analyze",
        description: "View supplier-wise purchase reports and payment history."
      }
    ],
    faq: [
      {
        question: "Can I track how much I owe suppliers?",
        answer: "Yes! The system tracks all purchases and payments, showing outstanding dues for each supplier."
      },
      {
        question: "Can I see purchase history from a specific supplier?",
        answer: "Absolutely! View complete purchase history, payment records, and current balance for any supplier."
      }
    ]
  },
  {
    slug: "loan-management",
    title: "Loan Management",
    subtitle: "Track business loans with installments and payment reminders",
    icon: Landmark,
    color: "from-primary to-accent",
    description: "Keep track of all your business loans in one place. Record loan details, set up installment schedules, and get payment reminders. Never miss a payment deadline.\n\nPerfect for businesses managing multiple loans from banks, microfinance, or personal lenders.",
    benefits: [
      "Complete loan tracking",
      "Installment scheduling",
      "Payment reminders",
      "Interest calculation",
      "Loan status overview",
      "Payment history records"
    ],
    steps: [
      {
        title: "Add Loan",
        description: "Enter loan details including amount, interest rate, and lender information."
      },
      {
        title: "Set Schedule",
        description: "Define installment amounts and due dates for payments."
      },
      {
        title: "Track Payments",
        description: "Record payments and see remaining balance automatically calculated."
      },
      {
        title: "Get Reminders",
        description: "Receive notifications before payment due dates."
      }
    ],
    faq: [
      {
        question: "Can I track multiple loans?",
        answer: "Yes! Add as many loans as needed - bank loans, microfinance, personal loans, etc."
      },
      {
        question: "Does it send payment reminders?",
        answer: "Yes, you'll receive notifications before each installment due date so you never miss a payment."
      }
    ]
  }
];

export const getFeatureBySlug = (slug: string): FeatureDetail | undefined => {
  return featuresDetails.find(f => f.slug === slug);
};
