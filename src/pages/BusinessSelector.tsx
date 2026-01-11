import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, Store, ArrowRight, Sparkles, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DynamicDocumentTitle } from "@/components/DynamicDocumentTitle";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { Badge } from "@/components/ui/badge";

const BusinessSelector = () => {
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const businessTypes = [
    {
      id: "online",
      title: "Online Business",
      subtitle: "AI Automation & Social Media",
      description: "Facebook, WhatsApp automation, AI responses, social media management, and order tracking.",
      icon: Globe,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      path: "/dashboard",
      features: ["AI Automation", "Message Replies", "Comment Management", "Analytics"],
      enabled: settings.online_business_enabled !== false,
    },
    {
      id: "offline",
      title: "Offline Shop Business",
      subtitle: "Complete Shop Management",
      description: "Inventory management, sales tracking, expense logging, invoice generation, and comprehensive reports.",
      icon: Store,
      color: "from-emerald-500 to-green-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      path: "/offline-shop",
      features: ["Inventory Management", "Sales Tracking", "Invoice Printing", "Download Reports"],
      enabled: settings.offline_shop_enabled !== false,
    },
  ];

  const handleCardClick = (business: typeof businessTypes[0]) => {
    if (business.enabled) {
      navigate(business.path);
    }
  };

  return (
    <>
      <DynamicDocumentTitle />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Select Your Business
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Which service would you like to use?
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the section based on your needs. You can use both sections together.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {businessTypes.map((business, index) => (
              <motion.div
                key={business.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredCard(business.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <Card 
                  className={`relative overflow-hidden transition-all duration-300 ${business.borderColor} border-2 ${
                    business.enabled 
                      ? `cursor-pointer hover:shadow-2xl hover:-translate-y-1 ${hoveredCard === business.id ? 'shadow-xl' : ''}`
                      : 'opacity-60 cursor-not-allowed'
                  }`}
                  onClick={() => handleCardClick(business)}
                >
                  {/* Disabled overlay */}
                  {!business.enabled && (
                    <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center">
                      <Badge variant="destructive" className="text-sm flex items-center gap-2 px-4 py-2">
                        <Lock className="h-4 w-4" />
                        Disabled by Admin
                      </Badge>
                    </div>
                  )}

                  <div className={`absolute inset-0 bg-gradient-to-br ${business.color} opacity-0 transition-opacity duration-300 ${
                    hoveredCard === business.id && business.enabled ? 'opacity-5' : ''
                  }`} />
                  
                  <CardHeader className="pb-4">
                    <div className={`w-16 h-16 rounded-2xl ${business.bgColor} flex items-center justify-center mb-4`}>
                      <business.icon className={`h-8 w-8`} style={{ 
                        background: `linear-gradient(to bottom right, ${business.id === 'online' ? '#3b82f6, #06b6d4' : '#10b981, #22c55e'})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      } as React.CSSProperties} />
                    </div>
                    <CardTitle className="text-2xl font-bold">{business.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{business.subtitle}</p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <CardDescription className="text-base">
                      {business.description}
                    </CardDescription>
                    
                    <div className="flex flex-wrap gap-2">
                      {business.features.map((feature) => (
                        <span
                          key={feature}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${business.bgColor} text-foreground`}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                    
                    <Button 
                      className={`w-full mt-4 ${business.enabled 
                        ? `bg-gradient-to-r ${business.color} hover:opacity-90 text-white`
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                      }`}
                      disabled={!business.enabled}
                    >
                      {business.enabled ? (
                        <>
                          Enter
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Unavailable
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm text-muted-foreground mt-8"
          >
            Tip: You can switch between sections anytime from the sidebar menu
          </motion.p>
        </div>
      </div>
    </>
  );
};

export default BusinessSelector;
