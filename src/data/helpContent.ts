import { Zap, MessageSquare, Settings, Shield } from "lucide-react";

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

This guide will help you get started with AutoFloy in just a few minutes.

### Step 1: Create Your Account

1. Visit the signup page and enter your email address
2. Choose a strong password
3. Verify your email address through the confirmation link

### Step 2: Connect Your First Page

After logging in, navigate to the Dashboard and click "Connect Page" to link your Facebook Page or WhatsApp Business account.

### Step 3: Create Your First Automation

1. Go to the Automations section
2. Click "Create New Automation"
3. Select a trigger type (message, comment, etc.)
4. Define your keywords and response template
5. Save and enable your automation

### What's Next?

- Explore different automation types
- Set up response templates
- Monitor your automation performance in the dashboard
        `,
        relatedArticles: ["account-setup", "connecting-first-page", "creating-first-automation"]
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

### Notification Preferences

Control how and when you receive notifications:

- **Email Notifications**: Receive updates via email
- **In-App Notifications**: See alerts within the dashboard
- **Daily Digest**: Get a summary of activity

### Security Settings

Keep your account secure:

- Enable two-factor authentication (2FA)
- Review connected devices
- Set up backup recovery options

### Billing Information

Manage your subscription:

- View current plan details
- Update payment methods
- Download invoices
        `,
        relatedArticles: ["quick-start-guide", "data-security", "access-management"]
      },
      {
        slug: "connecting-first-page",
        title: "Connecting Your First Page",
        description: "Learn how to connect Facebook Pages and WhatsApp Business",
        category: "Getting Started",
        content: `
## Connecting Your First Page

AutoFloy supports Facebook Pages and WhatsApp Business accounts.

### Prerequisites

Before connecting, ensure you have:

- Admin access to the Facebook Page
- A WhatsApp Business account (for WhatsApp integration)
- Facebook Business Manager set up (recommended)

### Connecting a Facebook Page

1. Click **"Connect Page"** in your dashboard
2. Click **"Connect with Facebook"**
3. Log in to your Facebook account
4. Select the page(s) you want to connect
5. Grant the required permissions
6. Click **"Done"** to complete

### Connecting WhatsApp Business

1. Navigate to **Integrations > WhatsApp**
2. Click **"Connect WhatsApp Business"**
3. Follow the WhatsApp Business API setup wizard
4. Verify your business phone number
5. Complete the connection

### Managing Connected Pages

- View all connected pages in **Dashboard > Connected Accounts**
- Disconnect or reconnect pages as needed
- Monitor page-specific analytics
        `,
        relatedArticles: ["facebook-integration", "whatsapp-business", "managing-connected-pages"]
      },
      {
        slug: "creating-first-automation",
        title: "Creating Your First Automation",
        description: "Step-by-step guide to create automated responses",
        category: "Getting Started",
        content: `
## Creating Your First Automation

Automations are the core feature of AutoFloy. Here's how to create one.

### Understanding Automation Components

Every automation has three parts:

1. **Trigger**: What initiates the automation (keywords, events)
2. **Conditions**: Optional filters to refine when it runs
3. **Response**: What action to take (send message, reply, etc.)

### Step-by-Step Creation

#### 1. Access the Automation Builder

- Go to **Dashboard > Automations**
- Click **"Create New Automation"**

#### 2. Choose a Trigger Type

- **Message Trigger**: Responds to direct messages
- **Comment Trigger**: Responds to post comments
- **Keyword Trigger**: Responds to specific words

#### 3. Define Keywords

Enter the keywords that will trigger this automation:

\`\`\`
price, pricing, cost, how much
\`\`\`

#### 4. Create Your Response

Write the message template:

\`\`\`
Hi! Thanks for your interest. Our pricing starts at $29/month. 
Visit our pricing page for more details: {{pricing_link}}
\`\`\`

#### 5. Test and Enable

- Use the preview feature to test
- Enable the automation when ready

### Best Practices

- Start with simple automations
- Use clear, helpful response messages
- Monitor performance and adjust keywords
        `,
        relatedArticles: ["automation-types", "trigger-keywords", "response-templates"]
      }
    ]
  },
  {
    id: "automations",
    icon: MessageSquare,
    title: "Automations",
    description: "Create and manage automated responses",
    articles: [
      {
        slug: "automation-types",
        title: "Automation Types",
        description: "Understanding different automation types in AutoFloy",
        category: "Automations",
        content: `
## Automation Types

AutoFloy offers several automation types to handle different scenarios.

### Message Automations

Respond to direct messages automatically.

**Use cases:**
- Answer frequently asked questions
- Provide business hours information
- Send welcome messages

### Comment Automations

Automatically respond to comments on your posts.

**Use cases:**
- Thank users for engagement
- Answer product questions
- Direct users to DMs for support

### Image Automations

Handle messages that contain images.

**Use cases:**
- Acknowledge receipt of photos
- Request additional information
- Route to appropriate team members

### Voice Message Automations

Process and respond to voice messages.

**Use cases:**
- Acknowledge voice messages
- Request text follow-up
- Transcribe and respond

### Mixed Automations

Combine multiple trigger types in one automation.

**Use cases:**
- Complex customer service flows
- Multi-step conversations
- Conditional responses based on content type
        `,
        relatedArticles: ["trigger-keywords", "response-templates", "advanced-configurations"]
      },
      {
        slug: "trigger-keywords",
        title: "Trigger Keywords",
        description: "How to set up and optimize trigger keywords",
        category: "Automations",
        content: `
## Trigger Keywords

Keywords determine when your automations activate.

### Setting Up Keywords

Enter keywords in the automation builder:

\`\`\`
hello, hi, hey, greetings
\`\`\`

### Keyword Matching Options

#### Exact Match
Triggers only on exact keyword matches.

#### Contains Match
Triggers if the message contains the keyword anywhere.

#### Starts With
Triggers if the message starts with the keyword.

### Keyword Best Practices

1. **Be Specific**: Avoid overly common words
2. **Use Variations**: Include common misspellings
3. **Group Related Keywords**: Combine synonyms in one automation
4. **Test Thoroughly**: Verify keywords work as expected

### Advanced Keyword Patterns

Use patterns for more control:

\`\`\`
price*         → matches "price", "pricing", "prices"
[0-9]+         → matches any number
order #*       → matches "order #123", "order #abc"
\`\`\`

### Excluding Keywords

Prevent triggers on certain keywords:

\`\`\`
Trigger: support
Exclude: already resolved, thank you
\`\`\`
        `,
        relatedArticles: ["automation-types", "response-templates", "advanced-configurations"]
      },
      {
        slug: "response-templates",
        title: "Response Templates",
        description: "Create effective automated response messages",
        category: "Automations",
        content: `
## Response Templates

Create professional, helpful automated responses.

### Template Basics

A response template is the message sent when an automation triggers.

### Using Variables

Personalize responses with variables:

| Variable | Description |
|----------|-------------|
| {{name}} | User's name |
| {{page_name}} | Your page name |
| {{time}} | Current time |
| {{date}} | Current date |

### Example Templates

#### Welcome Message
\`\`\`
Hi {{name}}! 👋 

Welcome to {{page_name}}. How can we help you today?

Our team typically responds within 1 hour during business hours.
\`\`\`

#### FAQ Response
\`\`\`
Thanks for your question about pricing!

Our plans start at $29/month. Here's a quick overview:
• Starter: $29/month - Up to 1,000 messages
• Professional: $79/month - Up to 10,000 messages
• Business: $149/month - Unlimited messages

Visit our pricing page for full details: {{pricing_link}}
\`\`\`

### Formatting Tips

- Keep messages concise
- Use emojis sparingly
- Include clear calls to action
- Provide helpful next steps
        `,
        relatedArticles: ["automation-types", "trigger-keywords", "advanced-configurations"]
      },
      {
        slug: "advanced-configurations",
        title: "Advanced Configurations",
        description: "Power user features for complex automations",
        category: "Automations",
        content: `
## Advanced Configurations

Take your automations to the next level with advanced features.

### Conditional Logic

Add conditions to control when automations run:

\`\`\`javascript
IF message.contains("urgent")
  → Send priority response
ELSE IF message.time.isWeekend()
  → Send weekend response
ELSE
  → Send standard response
\`\`\`

### Delay & Scheduling

Control response timing:

- **Immediate**: Respond instantly
- **Delayed**: Wait X seconds/minutes before responding
- **Scheduled**: Only active during specific hours

### Response Chains

Create multi-message sequences:

1. Initial greeting
2. Wait 5 seconds
3. Send follow-up question
4. Wait for response
5. Provide relevant information

### Webhooks

Connect to external services:

\`\`\`json
{
  "url": "https://your-api.com/webhook",
  "method": "POST",
  "headers": {
    "Authorization": "Bearer {{api_key}}"
  },
  "body": {
    "message": "{{message}}",
    "sender": "{{sender_id}}"
  }
}
\`\`\`

### A/B Testing

Test different response variations:

- Create multiple response versions
- AutoFloy randomly selects one
- Track performance metrics
- Optimize based on results

### Best Practices

1. Start simple, add complexity gradually
2. Test thoroughly before enabling
3. Monitor performance metrics
4. Document your automation logic
        `,
        relatedArticles: ["automation-types", "trigger-keywords", "response-templates"]
      }
    ]
  },
  {
    id: "integrations",
    icon: Settings,
    title: "Integrations",
    description: "Connect with Facebook and WhatsApp",
    articles: [
      {
        slug: "facebook-integration",
        title: "Facebook Integration",
        description: "Complete guide to Facebook Page integration",
        category: "Integrations",
        content: `
## Facebook Integration

Connect your Facebook Pages to AutoFloy for automated messaging.

### Requirements

- Facebook account with admin access to the Page
- Business Manager account (recommended)
- Page published and active

### Connection Steps

1. **Navigate to Integrations**
   - Go to Dashboard > Integrations > Facebook

2. **Initiate Connection**
   - Click "Connect Facebook Page"
   - Log in to Facebook if prompted

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

### Managing Facebook Integration

#### Viewing Connected Pages
See all connected pages in the Integrations dashboard.

#### Refreshing Tokens
Tokens may need refreshing periodically:
- Click "Refresh" next to the page name
- Re-authenticate if required

#### Disconnecting
To disconnect a page:
1. Go to Integrations > Facebook
2. Find the page
3. Click "Disconnect"
4. Confirm the action

### Troubleshooting

**Connection Failed?**
- Verify you have admin access
- Check Facebook permissions
- Try clearing browser cache
        `,
        relatedArticles: ["connecting-first-page", "permissions-scopes", "managing-connected-pages"]
      },
      {
        slug: "whatsapp-business",
        title: "WhatsApp Business",
        description: "Setting up WhatsApp Business integration",
        category: "Integrations",
        content: `
## WhatsApp Business Integration

Connect WhatsApp Business to automate customer conversations.

### Prerequisites

- WhatsApp Business account
- Verified business phone number
- Facebook Business Manager
- WhatsApp Business API access

### Setup Process

#### 1. Create WhatsApp Business Account

If you don't have one:
- Download WhatsApp Business app
- Register your business phone number
- Complete business profile

#### 2. Connect to Facebook Business Manager

- Link your WhatsApp Business to Business Manager
- This enables API access

#### 3. Connect to AutoFloy

1. Go to **Integrations > WhatsApp**
2. Click **"Connect WhatsApp Business"**
3. Follow the authentication flow
4. Select the WhatsApp Business account
5. Complete verification

### Message Templates

WhatsApp requires pre-approved templates for outbound messages:

\`\`\`
Template Name: order_confirmation
Category: Transactional
Content: "Hi {{1}}, your order #{{2}} has been confirmed. 
Expected delivery: {{3}}."
\`\`\`

### Best Practices

- Respond within 24-hour window for free-form messages
- Use templates for proactive outreach
- Keep messages concise and helpful
- Follow WhatsApp Business policies
        `,
        relatedArticles: ["facebook-integration", "managing-connected-pages", "permissions-scopes"]
      },
      {
        slug: "managing-connected-pages",
        title: "Managing Connected Pages",
        description: "Organize and manage your connected accounts",
        category: "Integrations",
        content: `
## Managing Connected Pages

Keep your connected accounts organized and running smoothly.

### Viewing All Connections

Navigate to **Dashboard > Connected Accounts** to see:

- All connected Facebook Pages
- All connected WhatsApp accounts
- Connection status for each
- Last activity timestamp

### Connection Health

#### Status Indicators

| Status | Meaning |
|--------|---------|
| 🟢 Active | Working normally |
| 🟡 Warning | Needs attention |
| 🔴 Error | Connection broken |

#### Common Issues

**Token Expired**
- Click "Refresh" to renew
- May require re-authentication

**Permission Revoked**
- Reconnect the page
- Grant required permissions again

### Organizing Pages

#### Labels
Add labels to group pages:
- By business unit
- By region
- By purpose

#### Notes
Add notes to remember:
- Page purpose
- Special configurations
- Team assignments

### Bulk Operations

Select multiple pages to:
- Enable/disable all automations
- Export configuration
- Disconnect in bulk

### Analytics by Page

View performance metrics per page:
- Messages received/sent
- Automation triggers
- Response rate
- Average response time
        `,
        relatedArticles: ["facebook-integration", "whatsapp-business", "permissions-scopes"]
      },
      {
        slug: "permissions-scopes",
        title: "Permissions & Scopes",
        description: "Understanding required permissions for integrations",
        category: "Integrations",
        content: `
## Permissions & Scopes

Understand what permissions AutoFloy needs and why.

### Facebook Permissions

#### Required Permissions

| Permission | Purpose |
|------------|---------|
| pages_messaging | Send and receive messages |
| pages_read_engagement | Read comments and reactions |
| pages_manage_metadata | Access page information |
| pages_read_user_content | Read user posts and comments |

#### Why We Need These

**pages_messaging**
Required to send automated responses to messages.

**pages_read_engagement**
Required to monitor and respond to comments.

**pages_manage_metadata**
Required to access page settings and configuration.

### WhatsApp Permissions

| Permission | Purpose |
|------------|---------|
| whatsapp_business_messaging | Send/receive messages |
| whatsapp_business_management | Manage business settings |

### Data We Access

AutoFloy only accesses:
- Messages sent to your page
- Comments on your posts
- Basic sender information (name, ID)

We **never** access:
- Personal user data beyond conversations
- Private posts or photos
- User friend lists

### Revoking Permissions

To revoke permissions:

1. **Facebook Settings**
   - Settings > Business Integrations
   - Find AutoFloy
   - Remove access

2. **In AutoFloy**
   - Go to Integrations
   - Disconnect the page

### Security Assurance

- All data encrypted in transit (TLS 1.3)
- Tokens stored encrypted at rest
- Regular security audits
- GDPR compliant data handling
        `,
        relatedArticles: ["facebook-integration", "whatsapp-business", "data-security"]
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
        slug: "data-security",
        title: "Data Security",
        description: "How we protect your data",
        category: "Security & Privacy",
        content: `
## Data Security

AutoFloy takes security seriously. Here's how we protect your data.

### Encryption

#### In Transit
- All connections use TLS 1.3
- Certificate pinning for API calls
- Secure WebSocket connections

#### At Rest
- AES-256 encryption for stored data
- Encrypted database backups
- Secure key management

### Infrastructure Security

- Hosted on enterprise-grade cloud infrastructure
- Regular security patches and updates
- DDoS protection
- Web Application Firewall (WAF)

### Access Controls

- Role-based access control (RBAC)
- Multi-factor authentication (MFA)
- Session management and timeout
- IP allowlisting available

### Token Security

- OAuth tokens encrypted before storage
- Automatic token rotation
- Minimal permission scopes
- Secure token refresh process

### Monitoring & Alerting

- 24/7 security monitoring
- Anomaly detection
- Automated threat response
- Security incident alerts

### Compliance

- GDPR compliant
- Regular security audits
- Penetration testing
- SOC 2 Type II (in progress)

### Reporting Issues

Found a security vulnerability?
- Email: security@autofloy.com
- We have a responsible disclosure program
        `,
        relatedArticles: ["privacy-best-practices", "access-management", "compliance-gdpr"]
      },
      {
        slug: "privacy-best-practices",
        title: "Privacy Best Practices",
        description: "Recommendations for protecting user privacy",
        category: "Security & Privacy",
        content: `
## Privacy Best Practices

Protect your customers' privacy while using AutoFloy.

### Data Minimization

Only collect what you need:

- Don't ask for unnecessary information
- Delete data when no longer needed
- Avoid storing sensitive data in automations

### Consent & Transparency

#### Inform Users
Let users know about automation:
- Mention automated responses in your page description
- Provide clear opt-out instructions
- Link to your privacy policy

#### Get Consent
When required:
- Ask before collecting additional data
- Provide easy opt-out mechanisms
- Honor opt-out requests promptly

### Secure Response Design

#### Do's
✅ Use generic greetings when name unavailable
✅ Keep responses professional
✅ Provide clear next steps

#### Don'ts
❌ Include sensitive data in responses
❌ Ask for passwords or payment info via message
❌ Share user data with unauthorized parties

### Regular Audits

- Review automation responses monthly
- Check for outdated information
- Update privacy notices as needed
- Remove unused automations

### Team Training

Ensure your team understands:
- Data protection responsibilities
- How to handle user data requests
- Privacy incident reporting procedures
        `,
        relatedArticles: ["data-security", "access-management", "compliance-gdpr"]
      },
      {
        slug: "access-management",
        title: "Access Management",
        description: "Control who has access to your account",
        category: "Security & Privacy",
        content: `
## Access Management

Control and monitor access to your AutoFloy account.

### User Roles

#### Administrator
- Full access to all features
- Can manage team members
- Can modify billing
- Can delete account

#### Manager
- Can create/edit automations
- Can view analytics
- Cannot manage billing
- Cannot delete account

#### Viewer
- Read-only access
- Can view dashboards
- Cannot modify settings
- Cannot create automations

### Adding Team Members

1. Go to **Settings > Team**
2. Click **"Invite Member"**
3. Enter email address
4. Select role
5. Send invitation

### Managing Permissions

#### Modify Roles
- Click on team member
- Select new role
- Save changes

#### Remove Access
- Click on team member
- Select "Remove from team"
- Confirm removal

### Security Features

#### Two-Factor Authentication
Enable 2FA for added security:
1. Go to Settings > Security
2. Enable 2FA
3. Scan QR code with authenticator app
4. Enter verification code

#### Session Management
- View active sessions
- Logout from specific devices
- Set session timeout duration

#### Activity Logs
Monitor account activity:
- Login attempts
- Configuration changes
- Team member actions
        `,
        relatedArticles: ["data-security", "privacy-best-practices", "compliance-gdpr"]
      },
      {
        slug: "compliance-gdpr",
        title: "Compliance (GDPR)",
        description: "GDPR compliance information and tools",
        category: "Security & Privacy",
        content: `
## GDPR Compliance

AutoFloy helps you maintain GDPR compliance.

### Your Rights Under GDPR

As a data subject, you have the right to:

| Right | Description |
|-------|-------------|
| Access | Request a copy of your data |
| Rectification | Correct inaccurate data |
| Erasure | Request data deletion |
| Portability | Export your data |
| Restriction | Limit data processing |
| Object | Object to data processing |

### How to Exercise Your Rights

#### Request Data Export
1. Go to Settings > Privacy
2. Click "Export My Data"
3. Choose format (JSON/CSV)
4. Download within 48 hours

#### Request Data Deletion
1. Go to Settings > Privacy
2. Click "Delete My Data"
3. Confirm your identity
4. Data deleted within 30 days

### Data Processing

#### Lawful Basis
We process data based on:
- Contract fulfillment (providing service)
- Legitimate interest (improving service)
- Consent (marketing communications)

#### Data Retention
- Account data: Until account deletion
- Message logs: 90 days
- Analytics: 12 months
- Backups: 30 days after deletion

### For Your Customers

Help your customers exercise their rights:

- Provide clear privacy notices
- Honor data requests promptly
- Maintain data processing records
- Report breaches within 72 hours

### Resources

- [Full Privacy Policy](/privacy)
- [GDPR Information Page](/gdpr)
- [Data Processing Agreement](/contact)
        `,
        relatedArticles: ["data-security", "privacy-best-practices", "access-management"]
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
