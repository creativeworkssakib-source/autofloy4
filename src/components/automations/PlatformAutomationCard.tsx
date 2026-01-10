import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  Link2, 
  CheckCircle2,
  Clock,
  MessageCircle,
} from "lucide-react";

export interface PlatformConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  isConnected: boolean;
  isActive: boolean;
  stats: {
    repliesToday: number;
    automationsEnabled: number;
    totalAutomations: number;
  };
  comingSoon?: boolean;
}

interface PlatformAutomationCardProps {
  platform: PlatformConfig;
  onConnect: () => void;
  onManage: () => void;
  index: number;
}

const PlatformAutomationCard = ({
  platform,
  onConnect,
  onManage,
  index,
}: PlatformAutomationCardProps) => {
  const isAvailable = !platform.comingSoon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={isAvailable ? { y: -4, scale: 1.02 } : {}}
      className="h-full"
    >
      <Card 
        className={`h-full border-2 transition-all duration-300 ${
          platform.comingSoon 
            ? "opacity-60 border-border/30 bg-muted/20" 
            : platform.isConnected 
              ? `${platform.borderColor} bg-card/80 hover:shadow-lg` 
              : "border-border/50 bg-card/50 hover:border-primary/30"
        }`}
      >
        <CardContent className="p-4 sm:p-6 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className={`p-2 sm:p-3 rounded-xl shrink-0 ${platform.bgColor}`}>
                {platform.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm sm:text-base lg:text-lg leading-tight line-clamp-1">{platform.name}</h3>
                <p className="text-xs text-muted-foreground">Automation</p>
              </div>
            </div>
            <div className="shrink-0">
              {platform.comingSoon ? (
                <Badge variant="secondary" className="text-[10px] sm:text-xs whitespace-nowrap">
                  Coming Soon
                </Badge>
              ) : platform.isConnected ? (
                <Badge 
                  className={`text-[10px] sm:text-xs whitespace-nowrap ${platform.isActive 
                    ? "bg-success text-success-foreground" 
                    : "bg-muted text-muted-foreground"
                  }`}
                >
                  {platform.isActive ? "Active" : "Paused"}
                </Badge>
              ) : (
                <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-muted-foreground/30 bg-muted/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                  <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">Offline</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-muted-foreground mb-4 flex-grow line-clamp-2 sm:line-clamp-none">
            {platform.description}
          </p>

          {/* Stats - Only show if connected */}
          {platform.isConnected && !platform.comingSoon && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-2 rounded-lg bg-muted/50 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MessageCircle className="h-3 w-3 text-primary" />
                </div>
                <p className="text-lg font-bold">{platform.stats.repliesToday}</p>
                <p className="text-[10px] text-muted-foreground">Today</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                </div>
                <p className="text-lg font-bold">{platform.stats.automationsEnabled}</p>
                <p className="text-[10px] text-muted-foreground">Active</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="h-3 w-3 text-accent" />
                </div>
                <p className="text-lg font-bold">{platform.stats.totalAutomations}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
            </div>
          )}

          {/* Action Button */}
          {platform.comingSoon ? (
            <Button variant="secondary" disabled className="w-full gap-2">
              <Clock className="h-4 w-4" />
              Coming Soon
            </Button>
          ) : platform.isConnected ? (
            <Button 
              variant="default" 
              onClick={onManage} 
              className="w-full gap-2 group"
            >
              Manage Automation
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={onConnect} 
              className="w-full gap-2"
            >
              <Link2 className="h-4 w-4" />
              Connect {platform.name}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PlatformAutomationCard;
