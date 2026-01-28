import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import Logo from "@/components/ui/Logo";

const PrivacyPolicy = () => {
  const { settings } = useSiteSettings();
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
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Your privacy is important to us. This policy explains how {settings.company_name} collects, uses, and protects your information.
          </p>

          {/* 1. Information We Collect */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            
            <h3 className="text-xl font-medium mb-3">Account Information</h3>
            <p className="text-muted-foreground mb-4">
              When you create a {settings.company_name} account, we collect:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number (optional)</li>
              <li>Password (stored securely using industry-standard hashing)</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">Subscription & Billing Information</h3>
            <p className="text-muted-foreground mb-4">
              To process payments and manage your subscription, we collect:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>Subscription plan and status</li>
              <li>Trial period information</li>
              <li>Payment method details (processed securely via our payment provider)</li>
              <li>Billing history and invoices</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">Connected Account Data (Facebook & WhatsApp)</h3>
            <p className="text-muted-foreground mb-4">
              When you connect your Facebook Page or WhatsApp Business account, we collect:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>Page/account IDs and names</li>
              <li>Page access tokens (stored securely with encryption)</li>
              <li>Basic page profile information (name, category, profile picture)</li>
              <li>Inbox messages and comments (for automation purposes only)</li>
              <li>Analytics and engagement statistics</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">Usage Data</h3>
            <p className="text-muted-foreground mb-4">
              We automatically collect certain information when you use our service:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Log data (IP address, browser type, pages visited)</li>
              <li>Feature usage and interaction patterns</li>
              <li>Automation performance metrics</li>
              <li>Error logs for troubleshooting</li>
            </ul>
          </section>

          {/* 2. How We Use Your Information */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Provide automation services:</strong> Automate inbox replies, comments, and posting on your connected Facebook Pages and WhatsApp accounts</li>
              <li><strong>Analytics and insights:</strong> Generate reports and analytics to help you understand your audience engagement</li>
              <li><strong>Account management:</strong> Manage your subscription, process payments, and maintain your account</li>
              <li><strong>Customer support:</strong> Respond to your inquiries and provide technical assistance</li>
              <li><strong>Service improvement:</strong> Analyze usage patterns to improve our features and user experience</li>
              <li><strong>Security:</strong> Detect, prevent, and address technical issues and security threats</li>
              <li><strong>Communications:</strong> Send service-related announcements, updates, and promotional materials (with your consent)</li>
            </ul>
          </section>

          {/* 3. Legal Basis for Processing */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">3. Legal Basis for Processing</h2>
            <p className="text-muted-foreground mb-4">
              We process your personal data based on the following legal grounds:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Contract performance:</strong> Processing necessary to provide our services as outlined in our Terms of Service</li>
              <li><strong>Consent:</strong> Where you have given explicit consent, such as connecting your Facebook/WhatsApp accounts or opting into marketing communications</li>
              <li><strong>Legitimate interests:</strong> For service improvement, security, and analytics purposes where these interests do not override your rights</li>
              <li><strong>Legal obligations:</strong> Where required to comply with applicable laws and regulations</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              You may withdraw your consent at any time by disconnecting your accounts or updating your communication preferences in your account settings.
            </p>
          </section>

          {/* 4. Third-Party Services */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">4. Third-Party Services</h2>
            <p className="text-muted-foreground mb-4">
              We work with trusted third-party service providers to deliver our services:
            </p>
            
            <h3 className="text-xl font-medium mb-3">Meta (Facebook & WhatsApp)</h3>
            <p className="text-muted-foreground mb-4">
              When you connect your Facebook Page or WhatsApp Business account, we access data through Meta's official APIs. Your use of these integrations is also subject to Meta's Privacy Policy and Terms of Service.
            </p>

            <h3 className="text-xl font-medium mb-3">Payment Processors</h3>
            <p className="text-muted-foreground mb-4">
              We use Stripe and similar payment processors to handle billing. These providers have their own privacy policies and security measures. We do not store your full credit card details on our servers.
            </p>

            <h3 className="text-xl font-medium mb-3">Cloud Infrastructure</h3>
            <p className="text-muted-foreground mb-4">
              Our application is hosted on secure cloud infrastructure providers that maintain industry-standard security certifications and practices.
            </p>

            <p className="text-muted-foreground">
              <strong>We do not sell, rent, or trade your personal information to third parties for marketing purposes.</strong>
            </p>
          </section>

          {/* 5. Cookies and Tracking */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">5. Cookies and Tracking Technologies</h2>
            <p className="text-muted-foreground mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li><strong>Essential cookies:</strong> Required for the service to function (authentication, security)</li>
              <li><strong>Functional cookies:</strong> Remember your preferences and settings</li>
              <li><strong>Analytics cookies:</strong> Help us understand how you use our service to improve it</li>
            </ul>
            <p className="text-muted-foreground">
              You can control cookie preferences through your browser settings. Note that disabling certain cookies may affect the functionality of our service.
            </p>
          </section>

          {/* 6. Data Retention and Deletion */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention and Deletion</h2>
            
            <h3 className="text-xl font-medium mb-3">Retention Period</h3>
            <p className="text-muted-foreground mb-4">
              We retain your personal data for as long as your account is active or as needed to provide you with our services. After account deletion:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>Account data is deleted within 30 days</li>
              <li>Connected account tokens are immediately revoked and deleted</li>
              <li>Billing records may be retained longer as required by law</li>
              <li>Anonymized analytics data may be retained for service improvement</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">Your Rights</h3>
            <p className="text-muted-foreground mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Update or correct inaccurate data</li>
              <li><strong>Erasure:</strong> Request deletion of your account and data</li>
              <li><strong>Portability:</strong> Receive your data in a structured format</li>
              <li><strong>Disconnect:</strong> Remove connected Facebook/WhatsApp accounts at any time</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">How to Request Deletion</h3>
            <p className="text-muted-foreground">
              To delete your account or disconnect integrations, you can:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Use the account settings page to disconnect pages or delete your account</li>
              <li>Contact our support team at the email address below</li>
              <li>Revoke {settings.company_name}'s access directly from your Facebook/WhatsApp settings</li>
            </ul>
          </section>

          {/* 7. Security Measures */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">7. Security Measures</h2>
            <p className="text-muted-foreground mb-4">
              We implement appropriate technical and organizational measures to protect your data:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Encryption in transit:</strong> All data is transmitted over HTTPS/TLS</li>
              <li><strong>Encryption at rest:</strong> Sensitive data like access tokens are encrypted in our database</li>
              <li><strong>Secure authentication:</strong> Passwords are hashed using industry-standard algorithms</li>
              <li><strong>Access controls:</strong> Strict access controls limit who can access your data</li>
              <li><strong>Regular security audits:</strong> We regularly review and update our security practices</li>
              <li><strong>Incident response:</strong> Procedures in place to handle potential security breaches</li>
            </ul>
          </section>

          {/* 8. International Data Transfers */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">8. International Data Transfers</h2>
            <p className="text-muted-foreground mb-4">
              Your data may be processed in countries other than your country of residence. When we transfer data internationally, we ensure appropriate safeguards are in place:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Standard contractual clauses approved by relevant authorities</li>
              <li>Data processing agreements with our service providers</li>
              <li>Compliance with applicable data protection laws</li>
            </ul>
          </section>

          {/* 9. Children's Privacy */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
            <p className="text-muted-foreground">
              {settings.company_name} is not intended for use by children under the age of 16. We do not knowingly collect personal information from children. If you believe we have inadvertently collected data from a child, please contact us immediately.
            </p>
          </section>

          {/* 10. Changes to This Policy */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.
            </p>
          </section>

          {/* 11. Contact Us */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-muted/50 rounded-lg p-6 border border-border">
              <p className="text-muted-foreground mb-2">
                <strong>Company Name:</strong> {settings.company_name}
              </p>
              <p className="text-muted-foreground mb-2">
                <strong>Email:</strong> {settings.legal_contact_email || settings.support_email}
              </p>
              <p className="text-muted-foreground mb-2">
                <strong>Address:</strong> {[settings.company_address, settings.city, settings.country].filter(Boolean).join(', ')}
              </p>
              <p className="text-muted-foreground">
                <strong>Phone:</strong> {settings.phone_number}
              </p>
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

      {/* Simple Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>{settings.copyright_text}</p>
          <div className="mt-2 space-x-4">
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <span>·</span>
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
