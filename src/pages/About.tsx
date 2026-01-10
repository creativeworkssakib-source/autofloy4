import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { Users, Target, Lightbulb, Award, MessageSquare, Store, Zap, Shield } from "lucide-react";
import { motion } from "framer-motion";

const About = () => {
  const { settings } = useSiteSettings();

  const values = [
    {
      icon: Target,
      title: "Mission-Driven",
      description: "Empowering Bangladeshi businesses with AI automation to compete in the digital age."
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "Building Bengali-first AI solutions that understand local language and culture."
    },
    {
      icon: Users,
      title: "Customer-First",
      description: "Designed for real shop owners - from Facebook sellers to physical store managers."
    },
    {
      icon: Award,
      title: "Excellence",
      description: "Reliable, fast, and professional tools that businesses can depend on every day."
    }
  ];

  const stats = [
    { value: "500+", label: "Active Businesses" },
    { value: "1M+", label: "Messages Handled" },
    { value: "24/7", label: "AI Support" },
    { value: "99%", label: "Uptime" }
  ];

  const services = [
    {
      icon: MessageSquare,
      title: "Online Business Automation",
      description: "AI-powered auto-reply for Facebook and WhatsApp, image recognition, voice message support, and comment management."
    },
    {
      icon: Store,
      title: "Offline Shop Management",
      description: "Complete POS system with inventory tracking, sales management, expense recording, and professional invoicing."
    },
    {
      icon: Zap,
      title: "Online-Offline Sync",
      description: "Unified inventory and sales tracking across your Facebook shop and physical store."
    },
    {
      icon: Shield,
      title: "Business Analytics",
      description: "Comprehensive reports and insights to help you make data-driven decisions."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                About Us
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Empowering <span className="gradient-text">Bangladeshi Businesses</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {settings.company_name} is a complete business automation platform built for Bangladeshi entrepreneurs. We help you manage both online shops and physical stores with AI-powered tools.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 px-4 border-b border-border">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">{stat.value}</div>
                  <div className="text-muted-foreground text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold mb-6 text-center">Our Story</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
                <p>
                  {settings.company_name} was born from a real problem: Bangladeshi online sellers were losing customers because they couldn't respond to messages fast enough. At the same time, physical shop owners were struggling with manual bookkeeping and inventory management.
                </p>
                <p>
                  We built a solution that addresses both challenges. Our AI understands Bengali naturally - including slang, Banglish, and regional variations. It can respond to customer messages, recognize products from photos, and even understand voice messages.
                </p>
                <p>
                  For physical stores, we created a complete shop management system that works offline. Track inventory, record sales, manage expenses, and generate professional invoices - all from your phone or computer.
                </p>
                <p>
                  The real magic? You can connect both systems. Your online and offline inventory stays in sync, and you get unified reports across all sales channels. No more overselling or stock confusion.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* What We Offer */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4">What We Offer</h2>
              <p className="text-muted-foreground">Complete business solutions for modern entrepreneurs</p>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-8">
              {services.map((service, index) => (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-card rounded-2xl p-6 border border-border"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <service.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                  <p className="text-muted-foreground">{service.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join hundreds of Bangladeshi businesses already saving time and increasing sales with {settings.company_name}. 
                Start with a free trial - no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/signup"
                  className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  Start Free Trial
                </a>
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-3 rounded-lg border border-border font-medium hover:bg-muted transition-colors"
                >
                  Contact Sales
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
