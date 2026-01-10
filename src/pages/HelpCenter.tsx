import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { Search, MessageCircle, Book, Mail, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { helpCategories, getAllArticles } from "@/data/helpContent";
import LiveChatWidget from "@/components/help/LiveChatWidget";

const HelpCenter = () => {
  const { settings } = useSiteSettings();
  const [searchQuery, setSearchQuery] = useState("");

  const allArticles = getAllArticles();
  
  // Filter articles based on search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allArticles.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.description.toLowerCase().includes(query) ||
      article.category.toLowerCase().includes(query)
    ).slice(0, 6);
  }, [searchQuery, allArticles]);

  const popularTopics = [
    { slug: "quick-start-guide", title: "How to get started with AutoFloy?" },
    { slug: "creating-first-automation", title: "Setting up automated responses" },
    { slug: "managing-connected-pages", title: "Managing multiple pages" },
    { slug: "facebook-integration", title: "How to connect my Facebook page?" },
    { slug: "data-security", title: "Understanding data security" },
    { slug: "compliance-gdpr", title: "GDPR compliance information" }
  ];

  const faqItems = [
    {
      question: "How do I get started with " + settings.company_name + "?",
      answer: "Sign up for a free trial, connect your Facebook page or WhatsApp Business account, and create your first automation. Our quick start guide will walk you through each step.",
      link: "/help/quick-start-guide"
    },
    {
      question: "Can I use " + settings.company_name + " with multiple pages?",
      answer: "Yes! Depending on your subscription plan, you can connect multiple Facebook pages and WhatsApp Business accounts to a single " + settings.company_name + " account.",
      link: "/help/managing-connected-pages"
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use industry-standard encryption and never store your messages. We only use the data necessary to process automations in real-time.",
      link: "/help/data-security"
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can cancel your subscription at any time from your account settings. Your access will continue until the end of your billing period.",
      link: "/help/account-setup"
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes, we offer a 30-day money-back guarantee for all paid plans. Contact our support team if you're not satisfied.",
      link: "/contact"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              How can we help?
            </h1>
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-10">
                  {searchResults.map((article) => (
                    <Link
                      key={article.slug}
                      to={`/help/${article.slug}`}
                      className="flex items-center justify-between p-4 hover:bg-muted transition-colors border-b border-border last:border-b-0"
                      onClick={() => setSearchQuery("")}
                    >
                      <div>
                        <p className="font-medium">{article.title}</p>
                        <p className="text-sm text-muted-foreground">{article.category}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Browse by Category */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {helpCategories.map((category) => (
                <div
                  key={category.id}
                  className="p-5 bg-card border border-border rounded-2xl hover:border-primary/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <category.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{category.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                  <p className="text-xs text-muted-foreground">{category.articles.length} articles</p>
                  <div className="mt-3 pt-3 border-t border-border">
                    {category.articles.slice(0, 2).map((article) => (
                      <Link
                        key={article.slug}
                        to={`/help/${article.slug}`}
                        className="flex items-center gap-2 py-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ChevronRight className="w-3 h-3" />
                        <span className="truncate">{article.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Topics */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Popular Topics</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {popularTopics.map((topic) => (
                <Link 
                  key={topic.slug}
                  to={`/help/${topic.slug}`}
                  className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-card/80 transition-all group"
                >
                  <span className="group-hover:text-primary transition-colors">{topic.title}</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <details 
                  key={index}
                  className="group bg-card border border-border rounded-xl overflow-hidden"
                >
                  <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <span className="font-medium pr-4">{item.question}</span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-open:rotate-90 transition-transform flex-shrink-0" />
                  </summary>
                  <div className="px-4 pb-4">
                    <p className="text-muted-foreground mb-3">{item.answer}</p>
                    <Link 
                      to={item.link}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Learn more <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Options */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">Still Need Help?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Link 
                to="/contact"
                className="p-6 bg-card border border-border rounded-2xl text-center hover:border-primary/50 hover:shadow-lg transition-all group"
              >
                <MessageCircle className="w-10 h-10 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold mb-2">Contact Us</h3>
                <p className="text-sm text-muted-foreground">Send us a message</p>
              </Link>
              <Link 
                to="/docs"
                className="p-6 bg-card border border-border rounded-2xl text-center hover:border-primary/50 hover:shadow-lg transition-all group"
              >
                <Book className="w-10 h-10 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold mb-2">Documentation</h3>
                <p className="text-sm text-muted-foreground">Browse our guides</p>
              </Link>
              <a 
                href={`mailto:${settings.support_email}`}
                className="p-6 bg-card border border-border rounded-2xl text-center hover:border-primary/50 hover:shadow-lg transition-all group"
              >
                <Mail className="w-10 h-10 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold mb-2">Email Support</h3>
                <p className="text-sm text-muted-foreground">{settings.support_email}</p>
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      
      {/* Live Chat Widget */}
      <LiveChatWidget />
    </div>
  );
};

export default HelpCenter;
