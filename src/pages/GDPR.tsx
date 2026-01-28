import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Mail, Download, Trash2, Edit, Ban, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import Logo from "@/components/ui/Logo";

const GDPR = () => {
  const { settings } = useSiteSettings();
  const rights = [
    {
      icon: FileText,
      title: "Right to Access",
      description: "You can request a copy of all personal data we hold about you.",
      howTo: "Submit a data access request via email or your account settings.",
    },
    {
      icon: Edit,
      title: "Right to Rectification",
      description: "You can request corrections to inaccurate or incomplete personal data.",
      howTo: "Update your information in account settings or contact us for assistance.",
    },
    {
      icon: Trash2,
      title: "Right to Erasure",
      description: "You can request deletion of your personal data (\"right to be forgotten\").",
      howTo: "Use the account deletion option in settings or submit a deletion request.",
    },
    {
      icon: Ban,
      title: "Right to Restrict Processing",
      description: "You can request that we limit how we use your data in certain circumstances.",
      howTo: "Contact our data protection team with your specific restriction request.",
    },
    {
      icon: Download,
      title: "Right to Data Portability",
      description: "You can receive your data in a structured, machine-readable format.",
      howTo: "Request a data export through your account settings or by email.",
    },
    {
      icon: Shield,
      title: "Right to Object",
      description: "You can object to processing based on legitimate interests or for direct marketing.",
      howTo: "Update marketing preferences in settings or contact us to object to other processing.",
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
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">GDPR Compliance</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {settings.company_name} is committed to protecting your privacy and ensuring compliance with the 
              General Data Protection Regulation (GDPR). Learn about your rights and how to exercise them.
            </p>
          </div>

          {/* What is GDPR */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">What is GDPR?</h2>
            <p className="text-muted-foreground mb-4">
              The General Data Protection Regulation (GDPR) is a comprehensive data protection law that 
              came into effect on May 25, 2018. It applies to organizations that process personal data 
              of individuals in the European Union (EU) and European Economic Area (EEA), regardless of 
              where the organization is located.
            </p>
            <p className="text-muted-foreground">
              GDPR gives individuals greater control over their personal data and imposes strict 
              requirements on how organizations collect, store, process, and protect that data.
            </p>
          </section>

          {/* Our Commitment */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Commitment</h2>
            <p className="text-muted-foreground mb-4">
              At {settings.company_name}, we take data protection seriously. We are committed to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Transparency:</strong> Being clear about what data we collect and why</li>
              <li><strong>Lawful Processing:</strong> Only processing data with a valid legal basis</li>
              <li><strong>Data Minimization:</strong> Collecting only the data necessary to provide our services</li>
              <li><strong>Security:</strong> Implementing appropriate technical and organizational measures to protect your data</li>
              <li><strong>Accountability:</strong> Taking responsibility for our data processing activities</li>
              <li><strong>Rights Facilitation:</strong> Making it easy for you to exercise your data protection rights</li>
            </ul>
          </section>

          {/* Legal Basis */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Legal Basis for Processing</h2>
            <p className="text-muted-foreground mb-4">
              Under GDPR, we must have a valid legal basis for processing your personal data. 
              We rely on the following bases:
            </p>
            
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <h4 className="font-medium mb-2">Contract Performance</h4>
                <p className="text-sm text-muted-foreground">
                  Processing necessary to provide the {settings.company_name} service, manage your account,
                  process payments, and deliver automation features.
                </p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <h4 className="font-medium mb-2">Consent</h4>
                <p className="text-sm text-muted-foreground">
                  When you explicitly agree to specific processing, such as connecting your 
                  Facebook/WhatsApp accounts, receiving marketing communications, or enabling 
                  optional analytics cookies.
                </p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <h4 className="font-medium mb-2">Legitimate Interests</h4>
                <p className="text-sm text-muted-foreground">
                  For improving our services, ensuring security, preventing fraud, and conducting 
                  internal analytics—where these interests do not override your fundamental rights.
                </p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <h4 className="font-medium mb-2">Legal Obligations</h4>
                <p className="text-sm text-muted-foreground">
                  When required to comply with applicable laws, such as tax regulations, 
                  fraud prevention, or legal proceedings.
                </p>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Your Data Subject Rights</h2>
            <p className="text-muted-foreground mb-6">
              Under GDPR, you have the following rights regarding your personal data:
            </p>
            
            <div className="grid gap-4 md:grid-cols-2">
              {rights.map((right) => (
                <div 
                  key={right.title}
                  className="bg-card rounded-xl p-5 border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <right.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{right.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{right.description}</p>
                      <p className="text-xs text-primary">{right.howTo}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* How to Exercise Your Rights */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">How to Exercise Your Rights</h2>
            
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 border border-primary/20 mb-6">
              <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Submit a Request
              </h3>
              <p className="text-muted-foreground mb-4">
                You can exercise any of your rights by:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                <li><strong>Email:</strong> Send your request to {settings.legal_contact_email || settings.support_email}</li>
                <li><strong>Account Settings:</strong> Use self-service options for data export and deletion</li>
                <li><strong>Contact Form:</strong> Submit a request through our <Link to="/contact" className="text-primary hover:underline">contact page</Link></li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Please include your full name, email address associated with your account, and a 
                clear description of your request. We may need to verify your identity before 
                processing your request.
              </p>
            </div>

            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg border border-border">
              <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="font-medium mb-1">Response Time</h4>
                <p className="text-sm text-muted-foreground">
                  We will respond to your request within <strong>30 days</strong> as required by GDPR. 
                  In complex cases, this may be extended by an additional 60 days, and we will notify 
                  you if this is necessary.
                </p>
              </div>
            </div>
          </section>

          {/* Data Transfers */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">International Data Transfers</h2>
            <p className="text-muted-foreground mb-4">
              Your data may be transferred to and processed in countries outside the EU/EEA. 
              When this happens, we ensure appropriate safeguards are in place:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
              <li>Adequacy decisions where the destination country provides adequate protection</li>
              <li>Binding Corporate Rules for transfers within corporate groups</li>
              <li>Your explicit consent for specific transfers</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
            <p className="text-muted-foreground mb-4">
              We retain your personal data only for as long as necessary to fulfill the purposes 
              for which it was collected:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Account Data:</strong> Retained while your account is active and for 30 days after deletion</li>
              <li><strong>Billing Records:</strong> Retained for 7 years as required by tax laws</li>
              <li><strong>Connected Account Tokens:</strong> Deleted immediately upon disconnection</li>
              <li><strong>Usage Analytics:</strong> Retained in anonymized form for service improvement</li>
              <li><strong>Support Communications:</strong> Retained for 3 years after resolution</li>
            </ul>
          </section>

          {/* Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Cookies and Tracking</h2>
            <p className="text-muted-foreground mb-4">
              We use cookies and similar technologies on our website. You can manage your cookie 
              preferences at any time through our cookie consent banner or by adjusting your 
              browser settings.
            </p>
            <p className="text-muted-foreground">
              For detailed information about our cookie practices, please see our{" "}
              <Link to="/privacy#cookies" className="text-primary hover:underline">
                Cookie Policy
              </Link>.
            </p>
          </section>

          {/* Complaints */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Right to Lodge a Complaint</h2>
            <p className="text-muted-foreground mb-4">
              If you believe that our processing of your personal data violates GDPR, you have the 
              right to lodge a complaint with a supervisory authority. You can do this in:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>The EU/EEA country where you live</li>
              <li>The country where you work</li>
              <li>The country where the alleged violation occurred</li>
            </ul>
            <p className="text-muted-foreground">
              However, we encourage you to contact us first so we can address your concerns directly.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Data Protection Contact</h2>
            <p className="text-muted-foreground mb-4">
              For any questions about GDPR compliance or to exercise your rights:
            </p>
            <div className="bg-muted/50 rounded-lg p-6 border border-border">
              <p className="text-muted-foreground mb-2">
                <strong>Email:</strong> {settings.legal_contact_email || settings.support_email}
              </p>
              <p className="text-muted-foreground mb-2">
                <strong>Address:</strong> {[settings.company_address, settings.city, settings.country].filter(Boolean).join(', ')}
              </p>
              <p className="text-muted-foreground mb-2">
                <strong>Phone:</strong> {settings.phone_number}
              </p>
              <p className="text-muted-foreground">
                <strong>Company:</strong> {settings.company_name}
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
                <Link to="/contact">Contact Us</Link>
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
          <p>{settings.copyright_text}</p>
          <div className="mt-2 space-x-4">
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <span>·</span>
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link to="/gdpr" className="hover:text-primary transition-colors">GDPR</Link>
            <span>·</span>
            <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GDPR;
