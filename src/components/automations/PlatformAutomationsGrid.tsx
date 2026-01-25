import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PlatformAutomationCard, { PlatformConfig } from "./PlatformAutomationCard";
import PlatformAutomationSection from "./PlatformAutomationSection";
import FacebookAutomationSection from "./FacebookAutomationSection";
import { 
  Facebook, 
  Instagram, 
  MessageCircle,
  Mail,
  ShoppingCart,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ConnectedPage {
  id: string;
  name: string;
  accountId?: string;
}

interface PlatformAutomationsGridProps {
  connectedFacebookPages: ConnectedPage[];
  onConnectFacebook: () => void;
}

interface WebhookConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
  is_coming_soon: boolean;
  category: string;
}

// Icon mapping from string to component
const iconMap: Record<string, React.ReactNode> = {
  Facebook: <Facebook className="h-6 w-6 text-[#1877F2]" />,
  Instagram: <Instagram className="h-6 w-6 text-[#E4405F]" />,
  MessageCircle: <MessageCircle className="h-6 w-6 text-[#25D366]" />,
  Mail: <Mail className="h-6 w-6 text-primary" />,
  ShoppingCart: <ShoppingCart className="h-6 w-6 text-orange-500" />,
};

// Color mapping for platforms
const colorMap: Record<string, { color: string; bgColor: string; borderColor: string }> = {
  facebook: { color: "text-[#1877F2]", bgColor: "bg-[#1877F2]/10", borderColor: "border-[#1877F2]/30" },
  instagram: { color: "text-[#E4405F]", bgColor: "bg-[#E4405F]/10", borderColor: "border-[#E4405F]/30" },
  whatsapp: { color: "text-[#25D366]", bgColor: "bg-[#25D366]/10", borderColor: "border-[#25D366]/30" },
  email: { color: "text-primary", bgColor: "bg-primary/10", borderColor: "border-primary/30" },
  ecommerce: { color: "text-orange-500", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/30" },
};

const PlatformAutomationsGrid = ({
  connectedFacebookPages,
  onConnectFacebook,
}: PlatformAutomationsGridProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [webhookConfigs, setWebhookConfigs] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch webhook configs from database with real-time updates
  useEffect(() => {
    const fetchConfigs = async () => {
      const { data } = await supabase
        .from('webhook_configs')
        .select('id, name, description, icon, is_active, is_coming_soon, category')
        .eq('category', 'platform')
        .order('name');
      
      if (data) {
        setWebhookConfigs(data);
      }
      setLoading(false);
    };
    fetchConfigs();

    // Real-time subscription
    const channel = supabase
      .channel('webhook-configs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'webhook_configs'
        },
        () => {
          fetchConfigs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Convert webhook configs to platform configs
  const platforms: PlatformConfig[] = webhookConfigs.map(config => {
    const colors = colorMap[config.id] || { color: "text-muted-foreground", bgColor: "bg-muted", borderColor: "border-border" };
    const isFacebookConnected = config.id === 'facebook' && connectedFacebookPages.length > 0;
    // Platform is available if not coming soon AND is active
    const isAvailable = !config.is_coming_soon && config.is_active;
    
    return {
      id: config.id,
      name: config.name,
      icon: iconMap[config.icon] || <Mail className="h-6 w-6" />,
      color: colors.color,
      bgColor: colors.bgColor,
      borderColor: colors.borderColor,
      description: config.description,
      isConnected: isAvailable && (config.id === 'facebook' ? isFacebookConnected : true),
      isActive: isAvailable && (config.id === 'facebook' ? isFacebookConnected : true),
      stats: {
        repliesToday: 0,
        automationsEnabled: 0,
        totalAutomations: 0,
      },
      comingSoon: config.is_coming_soon,
    };
  });

  const handleManage = (platformId: string) => {
    setSelectedPlatform(platformId);
  };

  const handleConnect = (platformId: string) => {
    if (platformId === "facebook") {
      onConnectFacebook();
    } else {
      // For other platforms, just open the automation section
      setSelectedPlatform(platformId);
    }
  };

  // Get selected platform config
  const selectedConfig = webhookConfigs.find(c => c.id === selectedPlatform);
  const isSelectedAvailable = selectedConfig && !selectedConfig.is_coming_soon && selectedConfig.is_active;

  // Show platform-specific section if selected and available
  if (selectedPlatform && isSelectedAvailable) {
    const selectedPage = selectedPlatform === 'facebook' ? connectedFacebookPages[0] : null;
    
    // Use FacebookAutomationSection for Facebook
    if (selectedPlatform === 'facebook' && selectedPage) {
      return (
        <FacebookAutomationSection
          pageId={selectedPage.id}
          pageName={selectedPage.name}
          accountId={selectedPage.accountId || selectedPage.id}
          onBack={() => setSelectedPlatform(null)}
        />
      );
    }
    
    // Use generic PlatformAutomationSection for other platforms
    return (
      <PlatformAutomationSection
        platformId={selectedPlatform}
        platformName={selectedConfig?.name || selectedPlatform}
        accountId={selectedPage?.accountId || selectedPage?.id}
        accountName={selectedPage?.name}
        onBack={() => setSelectedPlatform(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-xl font-semibold mb-1">Platform Automations</h2>
        <p className="text-sm text-muted-foreground">
          Connect your social platforms and enable AI-powered automations
        </p>
      </motion.div>

      {/* Platform Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map((platform, index) => (
          <PlatformAutomationCard
            key={platform.id}
            platform={platform}
            index={index}
            onConnect={() => handleConnect(platform.id)}
            onManage={() => handleManage(platform.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default PlatformAutomationsGrid;
