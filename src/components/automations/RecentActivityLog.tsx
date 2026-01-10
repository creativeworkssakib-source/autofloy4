import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  MessageSquare,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react";

interface ActivityLogEntry {
  id: string;
  type: "message" | "comment";
  preview: string;
  timestamp: string;
  status: "success" | "pending";
  senderName?: string;
}

interface RecentActivityLogProps {
  pageId: string;
  maxItems?: number;
}

// Mock data - in production this would come from an API
const generateMockActivities = (pageId: string): ActivityLogEntry[] => {
  const storedLogs = localStorage.getItem(`fb_activity_logs_${pageId}`);
  if (storedLogs) {
    try {
      return JSON.parse(storedLogs);
    } catch {
      return [];
    }
  }
  return [];
};

const RecentActivityLog = ({ pageId, maxItems = 10 }: RecentActivityLogProps) => {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);

  useEffect(() => {
    setActivities(generateMockActivities(pageId));
  }, [pageId]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const typeConfig = {
    message: {
      icon: MessageCircle,
      label: "Message",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    comment: {
      icon: MessageSquare,
      label: "Comment",
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              Last {maxItems} entries
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <div className="p-4 rounded-full bg-muted/50 inline-block mb-3">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No activity yet. Logs will appear here when AI replies are sent.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {activities.slice(0, maxItems).map((activity, index) => {
                  const config = typeConfig[activity.type];
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                    >
                      <div className={`p-2 rounded-lg ${config.bg} shrink-0`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`text-xs ${config.color}`}>
                            {config.label}
                          </Badge>
                          {activity.senderName && (
                            <span className="text-xs text-muted-foreground truncate">
                              from {activity.senderName}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground line-clamp-2">
                          {activity.preview}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(activity.timestamp)}
                        </span>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-success" />
                          <span className="text-xs text-success">Success</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecentActivityLog;
