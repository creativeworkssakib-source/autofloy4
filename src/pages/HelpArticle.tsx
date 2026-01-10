import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getArticleBySlug, getCategoryByArticleSlug, getAllArticles } from "@/data/helpContent";
import { ArrowLeft, ArrowRight, Book, ChevronRight } from "lucide-react";
import { useEffect } from "react";

const HelpArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const article = slug ? getArticleBySlug(slug) : undefined;
  const category = slug ? getCategoryByArticleSlug(slug) : undefined;
  
  // Scroll to top on article change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!article || !category) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <Book className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Article Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The help article you're looking for doesn't exist.
            </p>
            <Link 
              to="/docs" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Documentation
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Get related articles
  const relatedArticles = article.relatedArticles
    ?.map(slug => getAllArticles().find(a => a.slug === slug))
    .filter(Boolean) || [];

  // Convert markdown-like content to HTML
  const formatContent = (content: string) => {
    return content
      .split('\n')
      .map((line, index) => {
        // Headers
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-2xl font-bold mt-8 mb-4">{line.replace('## ', '')}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-semibold mt-6 mb-3">{line.replace('### ', '')}</h3>;
        }
        if (line.startsWith('#### ')) {
          return <h4 key={index} className="text-lg font-medium mt-4 mb-2">{line.replace('#### ', '')}</h4>;
        }
        
        // Code blocks
        if (line.startsWith('```')) {
          return null; // Handle code blocks separately
        }
        
        // List items
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <li key={index} className="ml-4 mb-1 text-muted-foreground">
              {line.replace(/^[-•]\s/, '')}
            </li>
          );
        }
        if (line.match(/^\d+\.\s/)) {
          return (
            <li key={index} className="ml-4 mb-1 text-muted-foreground list-decimal">
              {line.replace(/^\d+\.\s/, '')}
            </li>
          );
        }
        
        // Table rows
        if (line.startsWith('|')) {
          const cells = line.split('|').filter(cell => cell.trim());
          if (line.includes('---')) return null;
          const isHeader = index > 0 && content.split('\n')[index + 1]?.includes('---');
          return (
            <tr key={index} className={isHeader ? 'bg-muted/50' : ''}>
              {cells.map((cell, cellIndex) => (
                isHeader ? (
                  <th key={cellIndex} className="px-4 py-2 text-left font-medium border border-border">
                    {cell.trim()}
                  </th>
                ) : (
                  <td key={cellIndex} className="px-4 py-2 border border-border text-muted-foreground">
                    {cell.trim()}
                  </td>
                )
              ))}
            </tr>
          );
        }
        
        // Do's and Don'ts with checkmarks
        if (line.startsWith('✅') || line.startsWith('❌')) {
          return (
            <p key={index} className="mb-2 text-muted-foreground">
              {line}
            </p>
          );
        }
        
        // Empty lines
        if (line.trim() === '') {
          return <div key={index} className="h-2" />;
        }
        
        // Regular paragraphs
        return (
          <p key={index} className="text-muted-foreground mb-2 leading-relaxed">
            {line}
          </p>
        );
      });
  };

  // Extract code blocks
  const renderCodeBlocks = (content: string) => {
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <div key={`text-${lastIndex}`}>
            {formatContent(content.slice(lastIndex, match.index))}
          </div>
        );
      }
      
      // Add code block
      parts.push(
        <pre key={`code-${match.index}`} className="bg-muted/50 border border-border rounded-lg p-4 overflow-x-auto my-4">
          <code className="text-sm font-mono text-foreground">
            {match[2].trim()}
          </code>
        </pre>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <div key={`text-${lastIndex}`}>
          {formatContent(content.slice(lastIndex))}
        </div>
      );
    }
    
    return parts.length > 0 ? parts : formatContent(content);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 pt-16">

        {/* Article Content */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back button */}
            <Link 
              to="/docs"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Documentation
            </Link>

            {/* Article header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                  {category.title}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>
              <p className="text-lg text-muted-foreground">{article.description}</p>
            </div>

            {/* Article body */}
            <article className="prose prose-neutral dark:prose-invert max-w-none">
              {renderCodeBlocks(article.content)}
            </article>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-12 pt-8 border-t border-border">
                <h3 className="text-lg font-semibold mb-4">Related Articles</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {relatedArticles.map((related) => (
                    related && (
                      <Link
                        key={related.slug}
                        to={`/help/${related.slug}`}
                        className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-muted/50 transition-all group"
                      >
                        <div>
                          <p className="font-medium group-hover:text-primary transition-colors">
                            {related.title}
                          </p>
                          <p className="text-sm text-muted-foreground">{related.category}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </Link>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-12 pt-8 border-t border-border">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <Link
                  to="/docs"
                  className="flex items-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  All Documentation
                </Link>
                <Link
                  to="/help"
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Visit Help Center
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HelpArticle;
