import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageCircle,
  MessageSquare,
  Image,
  Mic,
  MoreVertical,
  Edit,
  FileText,
  Copy,
  Trash2,
  Clock,
  Zap,
} from "lucide-react";

export interface Automation {
  id: string;
  name: string;
  type: "message" | "comment" | "image" | "voice" | "mixed";
  triggerKeywords: string[];
  responsePreview: string;
  isEnabled: boolean;
  lastRun: string;
  runsToday: number;
}

interface AutomationCardProps {
  automation: Automation;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (automation: Automation) => void;
  onDuplicate: (automation: Automation) => void;
  onDelete: (id: string) => void;
  onViewLogs: (id: string) => void;
}

const typeConfig = {
  message: {
    icon: MessageCircle,
    label: "Message Reply",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  comment: {
    icon: MessageSquare,
    label: "Comment Reply",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  image: {
    icon: Image,
    label: "Image Recognition",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  voice: {
    icon: Mic,
    label: "Voice Response",
    color: "text-success",
    bg: "bg-success/10",
  },
};

const AutomationCard = ({
  automation,
  onToggle,
  onEdit,
  onDuplicate,
  onDelete,
  onViewLogs,
}: AutomationCardProps) => {
  const config = typeConfig[automation.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            {/* Left: Icon & Info */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className={`p-3 rounded-xl ${config.bg}`}>
                <Icon className={`h-6 w-6 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground truncate">
                    {automation.name}
                  </h3>
                  <Badge variant="outline" className={`${config.color} border-current/30 text-xs`}>
                    {config.label}
                  </Badge>
                </div>

                {/* Keywords */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {automation.triggerKeywords.slice(0, 3).map((keyword, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="text-xs bg-muted/50 font-normal"
                    >
                      {keyword}
                    </Badge>
                  ))}
                  {automation.triggerKeywords.length > 3 && (
                    <Badge variant="secondary" className="text-xs bg-muted/50">
                      +{automation.triggerKeywords.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Response Preview */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {automation.responsePreview}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last run: {automation.lastRun}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {automation.runsToday} runs today
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Toggle & Menu */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <Switch
                  checked={automation.isEnabled}
                  onCheckedChange={(checked) => onToggle(automation.id, checked)}
                />
                <span className={`text-xs ${automation.isEnabled ? 'text-success' : 'text-muted-foreground'}`}>
                  {automation.isEnabled ? 'Active' : 'Paused'}
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onEdit(automation)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Automation
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onViewLogs(automation.id)}>
                    <FileText className="h-4 w-4 mr-2" />
                    View Logs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(automation)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(automation.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AutomationCard;
