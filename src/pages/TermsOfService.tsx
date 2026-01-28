import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import Logo from "@/components/ui/Logo";

const TermsOfService = () => {
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
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Welcome to {settings.company_name}! These terms govern your use of our service. By using {settings.company_name}, you agree to these terms.
          </p>

          {/* 1. Account Creation and Eligibility */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">1. Account Creation and Eligibility</h2>
            
            <h3 className="text-xl font-medium mb-3">Eligibility</h3>
            <p className="text-muted-foreground mb-4">
              To use {settings.company_name}, you must:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>Be at least 18 years old or the age of majority in your jurisdiction</li>
              <li>Have the legal authority to enter into this agreement</li>
              <li>Provide accurate and complete information during registration</li>
              <li>Be authorized to connect and manage the Facebook Pages or WhatsApp accounts you add to {settings.company_name}</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">Account Responsibilities</h3>
            <p className="text-muted-foreground mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Keeping your account credentials secure and confidential</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access or security breach</li>
              <li>Ensuring you have permission to connect any third-party accounts (Facebook Pages, WhatsApp numbers)</li>
            </ul>
          </section>

          {/* 2. Subscription, Billing, and Cancellation */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">2. Subscription, Billing, and Cancellation</h2>
            
            <h3 className="text-xl font-medium mb-3">Free Trial</h3>
            <p className="text-muted-foreground mb-4">
              New users may be eligible for a 24-hour free trial. During the trial, you have access to the full features 
              of your selected plan. No payment is required until the trial ends. If you do not cancel before the trial 
              expires, your subscription will automatically begin and you will be charged.
            </p>

            <h3 className="text-xl font-medium mb-3">Subscription Plans</h3>
            <p className="text-muted-foreground mb-4">
              {settings.company_name} offers several subscription tiers (such as Starter, Professional, Business, and Lifetime plans). 
              Plan details, pricing, and features are available on our pricing page. We reserve the right to modify 
              pricing with reasonable notice to existing subscribers.
            </p>

            <h3 className="text-xl font-medium mb-3">Billing and Renewals</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>Subscriptions are billed in advance on a recurring basis (monthly or annually, depending on your plan)</li>
              <li>Your subscription will automatically renew unless you cancel before the renewal date</li>
              <li>Payments are processed securely through our payment provider (such as Stripe)</li>
              <li>You authorize us to charge your payment method on file for all applicable fees</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">Cancellation</h3>
            <p className="text-muted-foreground mb-4">
              You may cancel your subscription at any time through your account settings. Upon cancellation:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>Your access continues until the end of the current billing period</li>
              <li>No partial refunds are provided for unused time within a billing cycle</li>
              <li>Your data will be retained for 30 days, after which it may be permanently deleted</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">Refunds</h3>
            <p className="text-muted-foreground">
              Generally, payments are non-refundable. However, we may consider refund requests on a case-by-case basis 
              for extenuating circumstances, such as billing errors or service issues. To request a refund, please 
              contact our support team within 14 days of the charge. We reserve the right to approve or deny refund 
              requests at our discretion.
            </p>
          </section>

          {/* 3. Acceptable Use Policy */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">3. Acceptable Use Policy</h2>
            
            <h3 className="text-xl font-medium mb-3">Permitted Use</h3>
            <p className="text-muted-foreground mb-4">
              {settings.company_name} is designed to help businesses automate their social media messaging and engagement. 
              You may use the service to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>Automate replies to messages and comments on your connected Facebook Pages</li>
              <li>Manage and organize customer conversations</li>
              <li>View analytics and performance metrics</li>
              <li>Connect WhatsApp Business accounts for messaging automation (when available)</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">Prohibited Activities</h3>
            <p className="text-muted-foreground mb-4">
              You agree NOT to use {settings.company_name} to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li><strong>Send spam or unsolicited messages</strong> – Do not send bulk, repetitive, or unwanted messages</li>
              <li><strong>Harass or abuse others</strong> – No threatening, abusive, or discriminatory content</li>
              <li><strong>Violate Meta/Facebook or WhatsApp policies</strong> – You must comply with all platform terms and community standards</li>
              <li><strong>Impersonate others</strong> – Do not pretend to be another person, company, or entity</li>
              <li><strong>Distribute illegal content</strong> – No content that violates laws or promotes illegal activities</li>
              <li><strong>Attempt to circumvent security measures</strong> – Do not hack, reverse engineer, or exploit vulnerabilities</li>
              <li><strong>Resell or redistribute the service</strong> – Without our written permission</li>
              <li><strong>Connect accounts you do not own or have permission to manage</strong></li>
            </ul>

            <p className="text-muted-foreground">
              Violation of this policy may result in immediate suspension or termination of your account without refund.
            </p>
          </section>

          {/* 4. Third-Party Services */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">4. Third-Party Services and Dependencies</h2>
            
            <h3 className="text-xl font-medium mb-3">Meta/Facebook and WhatsApp</h3>
            <p className="text-muted-foreground mb-4">
              {settings.company_name} integrates with third-party platforms, including Meta (Facebook) and WhatsApp Cloud API. 
              By using our service, you acknowledge that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>These platforms may change their APIs, terms, or features at any time</li>
              <li>{settings.company_name}'s functionality depends on continued access to these platforms</li>
              <li>If Meta or WhatsApp suspends, revokes, or limits API access, some or all {settings.company_name} features may be affected</li>
              <li>We are not responsible for actions taken by third-party platforms</li>
              <li>You must comply with Meta's and WhatsApp's terms of service while using {settings.company_name}</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">Payment Processor</h3>
            <p className="text-muted-foreground mb-4">
              We use third-party payment processors (such as Stripe) to handle billing. Your payment information 
              is processed securely by these providers and is subject to their terms and privacy policies. 
              We do not store complete credit card details on our servers.
            </p>

            <h3 className="text-xl font-medium mb-3">Service Availability</h3>
            <p className="text-muted-foreground">
              While we strive to maintain high availability, outages or disruptions caused by third-party services 
              are beyond our control. We will make reasonable efforts to notify you of significant service 
              interruptions but are not liable for losses resulting from third-party outages.
            </p>
          </section>

          {/* 5. Data and Privacy */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">5. Data and Privacy</h2>
            <p className="text-muted-foreground mb-4">
              Your privacy is important to us. Our collection, use, and protection of your personal information 
              is governed by our{" "}
              <Link to="/privacy" className="text-primary hover:underline font-medium">
                Privacy Policy
              </Link>, which is incorporated into these Terms by reference.
            </p>
            <p className="text-muted-foreground">
              By using {settings.company_name}, you consent to the data practices described in the Privacy Policy, including 
              the collection of account information, connected page data, and usage analytics necessary to 
              provide and improve our services.
            </p>
          </section>

          {/* 6. Intellectual Property */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property and License</h2>
            
            <h3 className="text-xl font-medium mb-3">Our Intellectual Property</h3>
            <p className="text-muted-foreground mb-4">
              {settings.company_name} and all associated trademarks, logos, software, designs, and content are owned by us 
              or our licensors. All rights not expressly granted are reserved.
            </p>

            <h3 className="text-xl font-medium mb-3">License to Use {settings.company_name}</h3>
            <p className="text-muted-foreground mb-4">
              Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>Access and use {settings.company_name} for your business purposes</li>
              <li>Connect your authorized social media accounts</li>
              <li>Use our automation features as intended</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">Your Content</h3>
            <p className="text-muted-foreground">
              You retain ownership of the content you create or manage through {settings.company_name}. By using our service, 
              you grant us a limited license to process, store, and transmit your content as necessary to 
              provide the service. We will not use your content for marketing or share it with third parties 
              except as required to deliver the service or as described in our Privacy Policy.
            </p>
          </section>

          {/* 7. Limitation of Liability */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability and Disclaimer</h2>
            
            <h3 className="text-xl font-medium mb-3">"As Is" Service</h3>
            <p className="text-muted-foreground mb-4">
              {settings.company_name} is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, express or 
              implied, regarding the service, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>Merchantability or fitness for a particular purpose</li>
              <li>Uninterrupted, error-free, or secure operation</li>
              <li>Accuracy or reliability of any results or data</li>
              <li>Compatibility with third-party platforms indefinitely</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">Limitation of Liability</h3>
            <p className="text-muted-foreground mb-4">
              To the maximum extent permitted by law, {settings.company_name} and its officers, directors, employees, and 
              affiliates shall not be liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>Any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, revenue, data, or business opportunities</li>
              <li>Damages resulting from third-party service disruptions (Meta, WhatsApp, payment processors)</li>
              <li>Unauthorized access to your account due to your failure to secure credentials</li>
            </ul>

            <p className="text-muted-foreground">
              Our total liability for any claim arising from these Terms or your use of {settings.company_name} shall not 
              exceed the amount you paid to us in the twelve (12) months preceding the claim.
            </p>
          </section>

          {/* 8. Termination */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">8. Termination</h2>
            
            <h3 className="text-xl font-medium mb-3">Termination by You</h3>
            <p className="text-muted-foreground mb-4">
              You may terminate your account at any time by cancelling your subscription and requesting account 
              deletion through your settings or by contacting support.
            </p>

            <h3 className="text-xl font-medium mb-3">Termination by Us</h3>
            <p className="text-muted-foreground mb-4">
              We reserve the right to suspend or terminate your account, without prior notice or refund, if:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>You violate these Terms of Service or the Acceptable Use Policy</li>
              <li>You fail to pay applicable fees after reasonable notice</li>
              <li>Your use poses a security risk or legal liability</li>
              <li>We are required to do so by law or a third-party platform (e.g., Meta)</li>
              <li>We discontinue the service (with reasonable notice to active subscribers)</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">Effect of Termination</h3>
            <p className="text-muted-foreground">
              Upon termination, your right to use {settings.company_name} ends immediately. We may delete your data after a 
              reasonable retention period (typically 30 days). Sections of these Terms that by their nature 
              should survive termination (such as liability limitations, intellectual property, and dispute 
              resolution) will remain in effect.
            </p>
          </section>

          {/* 9. Changes to Terms */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">9. Changes to These Terms</h2>
            <p className="text-muted-foreground mb-4">
              We may update these Terms from time to time to reflect changes in our service, legal requirements, 
              or business practices. When we make changes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>We will update the "Last updated" date at the bottom of this page</li>
              <li>For material changes, we will notify you via email or through the service</li>
              <li>Your continued use of {settings.company_name} after changes take effect constitutes acceptance of the new Terms</li>
            </ul>
            <p className="text-muted-foreground">
              If you do not agree with the updated Terms, you may cancel your subscription and stop using the service.
            </p>
          </section>

          {/* 10. Governing Law and Contact */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">10. Governing Law and Disputes</h2>
            
            <h3 className="text-xl font-medium mb-3">Governing Law</h3>
            <p className="text-muted-foreground mb-4">
              These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], 
              without regard to its conflict of law provisions.
            </p>

            <h3 className="text-xl font-medium mb-3">Dispute Resolution</h3>
            <p className="text-muted-foreground mb-4">
              Any disputes arising from these Terms or your use of {settings.company_name} shall first be attempted to be 
              resolved through good-faith negotiation. If a resolution cannot be reached, disputes shall be 
              submitted to the competent courts of the applicable jurisdiction.
            </p>

            <h3 className="text-xl font-medium mb-3">Contact Us</h3>
            <p className="text-muted-foreground mb-4">
              If you have questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-muted/50 rounded-lg p-6 border border-border">
              <p className="text-muted-foreground mb-2">
                <strong>Company Name:</strong> {settings.company_name}
              </p>
              <p className="text-muted-foreground mb-2">
                <strong>Email:</strong> {settings.legal_contact_email || settings.support_email}
              </p>
              <p className="text-muted-foreground">
                <strong>Address:</strong> {[settings.company_address, settings.city, settings.country].filter(Boolean).join(', ')}
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
          <p>{settings.copyright_text || `© ${new Date().getFullYear()} ${settings.company_name}. All rights reserved.`}</p>
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

export default TermsOfService;
