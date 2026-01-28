import { Link } from "react-router-dom";
import { ArrowLeft, Cookie, Shield, BarChart3, Megaphone, Settings, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import Logo from "@/components/ui/Logo";

const CookiePolicy = () => {
  const { settings } = useSiteSettings();
  const cookieCategories = [
    {
      icon: Shield,
      name: "Essential Cookies",
      required: true,
      description: "These cookies are strictly necessary for the website to function and cannot be disabled. They are usually set in response to actions you take, such as logging in, filling out forms, or setting privacy preferences.",
      examples: [
        { name: "auth_token", purpose: "Maintains your login session", duration: "Session" },
        { name: "csrf_token", purpose: "Protects against cross-site request forgery", duration: "Session" },
        { name: "cookie_consent", purpose: "Stores your cookie preferences", duration: "1 year" },
      ],
    },
    {
      icon: Settings,
      name: "Functional Cookies",
      required: false,
      description: "These cookies enable enhanced functionality and personalization, such as remembering your preferences, language settings, and customizations. If you disable these cookies, some features may not work properly.",
      examples: [
        { name: "theme_preference", purpose: "Remembers your light/dark mode preference", duration: "1 year" },
        { name: "language", purpose: "Stores your preferred language", duration: "1 year" },
        { name: "sidebar_state", purpose: "Remembers if sidebar is collapsed", duration: "30 days" },
      ],
    },
    {
      icon: BarChart3,
      name: "Analytics Cookies",
      required: false,
      description: "These cookies help us understand how visitors interact with our website by collecting anonymous information. This helps us improve our service and user experience.",
      examples: [
        { name: "_ga", purpose: "Google Analytics - distinguishes users", duration: "2 years" },
        { name: "_gid", purpose: "Google Analytics - distinguishes users", duration: "24 hours" },
        { name: "plausible_user", purpose: "Privacy-friendly analytics", duration: "1 year" },
      ],
    },
    {
      icon: Megaphone,
      name: "Marketing Cookies",
      required: false,
      description: "These cookies are used to deliver advertisements more relevant to you and your interests. They may also be used to limit the number of times you see an advertisement and measure the effectiveness of advertising campaigns.",
      examples: [
        { name: "_fbp", purpose: "Facebook - tracks visits across websites", duration: "3 months" },
        { name: "fr", purpose: "Facebook - delivers advertisements", duration: "3 months" },
        { name: "_gcl_au", purpose: "Google Ads - conversion tracking", duration: "3 months" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="lg" />
            <span className="text-xl font-bold">
              {settings.company_name.split(/(?=[A-Z])/).map((part, i) => 
                i === 1 ? <span key={i} className="gradient-text">{part}</span> : part
              )}
            </span>
          </Link>
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Cookie className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              This policy explains how {settings.company_name} uses cookies and similar technologies to recognize 
              you when you visit our website and use our services.
            </p>
          </div>

          {/* What Are Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">What Are Cookies?</h2>
            <p className="text-muted-foreground mb-4">
              Cookies are small text files that are stored on your device (computer, tablet, or mobile) 
              when you visit a website. They are widely used to make websites work more efficiently, 
              provide a better user experience, and give website owners useful information.
            </p>
            <p className="text-muted-foreground">
              Cookies can be "first-party" (set by us) or "third-party" (set by other companies whose 
              services we use). They can also be "session cookies" (deleted when you close your browser) 
              or "persistent cookies" (remain on your device for a set period or until you delete them).
            </p>
          </section>

          {/* Why We Use Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Why We Use Cookies</h2>
            <p className="text-muted-foreground mb-4">
              We use cookies for several purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Authentication:</strong> To keep you logged in and secure your account</li>
              <li><strong>Preferences:</strong> To remember your settings and personalization choices</li>
              <li><strong>Security:</strong> To protect against fraud and unauthorized access</li>
              <li><strong>Analytics:</strong> To understand how visitors use our website so we can improve it</li>
              <li><strong>Performance:</strong> To ensure the website loads quickly and functions properly</li>
              <li><strong>Marketing:</strong> To deliver relevant advertisements (with your consent)</li>
            </ul>
          </section>

          {/* Cookie Categories */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Types of Cookies We Use</h2>
            
            <div className="space-y-6">
              {cookieCategories.map((category) => (
                <div 
                  key={category.name}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                >
                  {/* Category Header */}
                  <div className="p-5 border-b border-border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <category.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{category.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            category.required 
                              ? 'bg-primary/10 text-primary' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {category.required ? 'Always Active' : 'Optional'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      {category.description}
                    </p>
                  </div>
                  
                  {/* Cookie Examples */}
                  <div className="p-5">
                    <h4 className="text-sm font-medium mb-3 text-muted-foreground">Examples:</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 pr-4 font-medium">Cookie Name</th>
                            <th className="text-left py-2 pr-4 font-medium">Purpose</th>
                            <th className="text-left py-2 font-medium">Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {category.examples.map((cookie) => (
                            <tr key={cookie.name} className="border-b border-border last:border-0">
                              <td className="py-2 pr-4 font-mono text-xs text-primary">{cookie.name}</td>
                              <td className="py-2 pr-4 text-muted-foreground">{cookie.purpose}</td>
                              <td className="py-2 text-muted-foreground">{cookie.duration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Third-Party Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Third-Party Cookies</h2>
            <p className="text-muted-foreground mb-4">
              Some cookies on our website are set by third-party services we use:
            </p>
            
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <h4 className="font-medium mb-2">Google Analytics</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  We use Google Analytics to understand how visitors interact with our website. 
                  This helps us improve the user experience.
                </p>
                <a 
                  href="https://policies.google.com/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Google Privacy Policy →
                </a>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <h4 className="font-medium mb-2">Stripe</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Our payment processor uses cookies to process payments securely and prevent fraud.
                </p>
                <a 
                  href="https://stripe.com/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Stripe Privacy Policy →
                </a>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <h4 className="font-medium mb-2">Meta (Facebook)</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  If you connect your Facebook Page to {settings.company_name}, Meta may set cookies related to 
                  the integration.
                </p>
                <a 
                  href="https://www.facebook.com/privacy/policy/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Meta Privacy Policy →
                </a>
              </div>
            </div>
          </section>

          {/* Managing Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">How to Manage Cookies</h2>
            
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 border border-primary/20 mb-6">
              <h3 className="text-xl font-medium mb-3 flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Cookie Preferences on Our Website
              </h3>
              <p className="text-muted-foreground mb-4">
                When you first visit our website, you will see a cookie consent banner. You can:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li><strong>Accept All:</strong> Enable all cookie categories</li>
                <li><strong>Reject All:</strong> Disable all optional cookies (only essential cookies remain)</li>
                <li><strong>Customize:</strong> Choose which cookie categories to enable</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                You can change your preferences at any time by clicking the cookie icon in the bottom 
                corner of the page or by clearing your browser cookies and revisiting the site.
              </p>
            </div>

            <h3 className="text-xl font-medium mb-3">Browser Settings</h3>
            <p className="text-muted-foreground mb-4">
              Most web browsers allow you to control cookies through their settings. Here's how to 
              manage cookies in popular browsers:
            </p>
            
            <div className="grid gap-3 md:grid-cols-2 mb-6">
              {[
                { name: "Google Chrome", url: "https://support.google.com/chrome/answer/95647" },
                { name: "Mozilla Firefox", url: "https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" },
                { name: "Safari", url: "https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" },
                { name: "Microsoft Edge", url: "https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" },
              ].map((browser) => (
                <a
                  key={browser.name}
                  href={browser.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
                >
                  <Info className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{browser.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">→</span>
                </a>
              ))}
            </div>

            <div className="flex items-start gap-4 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium mb-1 text-amber-900 dark:text-amber-100">Important Note</h4>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Disabling cookies may affect the functionality of our website. Some features, 
                  like staying logged in or remembering your preferences, require cookies to work properly.
                </p>
              </div>
            </div>
          </section>

          {/* Do Not Track */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Do Not Track Signals</h2>
            <p className="text-muted-foreground">
              Some browsers have a "Do Not Track" (DNT) feature that sends a signal to websites 
              requesting that your browsing activity not be tracked. Currently, there is no universal 
              standard for how websites should respond to DNT signals. We do not currently respond 
              to DNT signals, but we respect your cookie preferences set through our consent banner.
            </p>
          </section>

          {/* Updates */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Updates to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Cookie Policy from time to time to reflect changes in technology, 
              legislation, or our business practices. We will notify you of significant changes by 
              updating the "Last updated" date and, where appropriate, through a notice on our website.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Questions?</h2>
            <p className="text-muted-foreground mb-4">
              If you have questions about our use of cookies, please contact us:
            </p>
            <div className="bg-muted/50 rounded-lg p-6 border border-border">
              <p className="text-muted-foreground mb-2">
                <strong>Email:</strong> {settings.legal_contact_email || settings.support_email}
              </p>
              <p className="text-muted-foreground">
                <strong>Address:</strong> {[settings.company_address, settings.city, settings.country].filter(Boolean).join(', ')}
              </p>
            </div>
          </section>

          {/* Related Pages */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Related Documents</h2>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link to="/privacy">Privacy Policy</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/terms">Terms of Service</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/gdpr">GDPR Compliance</Link>
              </Button>
            </div>
          </section>

          {/* Last Updated */}
          <div className="border-t border-border pt-6 mt-12">
            <p className="text-sm text-muted-foreground">
              <strong>Last updated:</strong> December 18, 2024
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>{settings.copyright_text || `© ${new Date().getFullYear()} ${settings.company_name}. All rights reserved.`}</p>
          <div className="mt-2 space-x-4">
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <span>·</span>
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link to="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link>
            <span>·</span>
            <Link to="/gdpr" className="hover:text-primary transition-colors">GDPR</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CookiePolicy;
