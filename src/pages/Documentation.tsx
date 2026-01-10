import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { Book, HelpCircle, ArrowRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { helpCategories, getAllArticles } from "@/data/helpContent";
import LiveChatWidget from "@/components/help/LiveChatWidget";

const Documentation = () => {
  const { settings } = useSiteSettings();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter articles based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return helpCategories;
    
    const query = searchQuery.toLowerCase();
    return helpCategories
      .map(category => ({
        ...category,
        articles: category.articles.filter(article =>
          article.title.toLowerCase().includes(query) ||
          article.description.toLowerCase().includes(query)
        )
      }))
      .filter(category => category.articles.length > 0);
  }, [searchQuery]);

  const allArticles = getAllArticles();
  const totalArticles = allArticles.length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Book className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Documentation
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Everything you need to know about using {settings.company_name} to automate your business.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              />
            </div>
            
            <p className="mt-4 text-sm text-muted-foreground">
              {totalArticles} articles across {helpCategories.length} categories
            </p>
          </div>
        </section>

        {/* Documentation Categories */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search query or browse all categories below.
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 px-4 py-2 text-primary hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {filteredCategories.map((category) => (
                  <div 
                    key={category.id} 
                    className="p-6 bg-card border border-border rounded-2xl hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <category.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold mb-1">{category.title}</h2>
                        <p className="text-muted-foreground text-sm">{category.description}</p>
                      </div>
                    </div>
                    <ul className="space-y-1">
                      {category.articles.map((article) => (
                        <li key={article.slug}>
                          <Link 
                            to={`/help/${article.slug}`}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-all group"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="font-medium group-hover:text-primary transition-colors">
                                {article.title}
                              </span>
                              <p className="text-sm text-muted-foreground truncate">
                                {article.description}
                              </p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Popular Articles</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { slug: "quick-start-guide", title: "Quick Start Guide" },
                { slug: "creating-first-automation", title: "Creating Your First Automation" },
                { slug: "facebook-integration", title: "Facebook Integration" },
                { slug: "data-security", title: "Data Security" }
              ].map((item) => (
                <Link
                  key={item.slug}
                  to={`/help/${item.slug}`}
                  className="p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-card/80 transition-all group text-center"
                >
                  <span className="font-medium group-hover:text-primary transition-colors">
                    {item.title}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary mx-auto mt-2 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Help Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Need More Help?</h2>
            <p className="text-muted-foreground mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/contact" 
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Contact Support
              </Link>
              <Link 
                to="/help"
                className="inline-flex items-center justify-center px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Visit Help Center
              </Link>
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

export default Documentation;
