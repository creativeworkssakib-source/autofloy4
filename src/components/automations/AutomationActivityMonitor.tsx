import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle,
  MessageSquare,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Filter,
  User,
  Bot,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  Settings,
  Activity,
  TrendingUp,
  X,
  XCircle,
  Instagram,
  Phone,
} from "lucide-react";
import { fetchExecutionLogs, ExecutionLog } from "@/services/apiService";
import { format, formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

interface ActivityEntry {
  id: string;
  type: "message" | "comment" | "order" | "connection";
  platform: "whatsapp" | "instagram" | "facebook" | "email";
  automationName: string;
  customerName?: string;
  customerPhone?: string;
  incomingMessage?: string;
  aiResponse?: string;
  status: "success" | "pending" | "failed";
  timestamp: string;
  processingTime?: number;
  orderDetails?: {
    orderId: string;
    items: string[];
    total: number;
  };
}

interface AutomationControl {
  id: string;
  name: string;
  platform: "whatsapp" | "instagram" | "facebook";
  isEnabled: boolean;
  repliesCount: number;
  ordersCount: number;
}

interface AutomationActivityMonitorProps {
  platformFilter?: "whatsapp" | "instagram" | "facebook" | "all";
  maxItems?: number;
}

const platformConfig = {
  whatsapp: {
    icon: Phone,
    label: "WhatsApp",
    color: "text-[#25D366]",
    bgColor: "bg-[#25D366]/10",
    borderColor: "border-[#25D366]/30",
  },
  instagram: {
    icon: Instagram,
    label: "Instagram",
    color: "text-[#E4405F]",
    bgColor: "bg-[#E4405F]/10",
    borderColor: "border-[#E4405F]/30",
  },
  facebook: {
    icon: MessageCircle,
    label: "Facebook",
    color: "text-[#1877F2]",
    bgColor: "bg-[#1877F2]/10",
    borderColor: "border-[#1877F2]/30",
  },
  email: {
    icon: MessageSquare,
    label: "Email",
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
  },
};

const typeConfig = {
  message: {
    icon: MessageCircle,
    label: "Message Reply",
    labelBn: "মেসেজ রিপ্লাই",
  },
  comment: {
    icon: MessageSquare,
    label: "Comment Reply",
    labelBn: "কমেন্ট রিপ্লাই",
  },
  order: {
    icon: ShoppingCart,
    label: "Order Taken",
    labelBn: "অর্ডার নেওয়া হয়েছে",
  },
  connection: {
    icon: User,
    label: "Customer Connected",
    labelBn: "কাস্টমার কানেক্ট",
  },
};

const AutomationActivityMonitor = ({
  platformFilter = "all",
  maxItems = 50,
}: AutomationActivityMonitorProps) => {
  const { language } = useLanguage();
  const t = (en: string, bn: string) => (language === "bn" ? bn : en);

  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [controls, setControls] = useState<AutomationControl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>(platformFilter);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("activity");

  // Convert execution logs to activity entries
  const convertLogsToActivities = useCallback((logs: ExecutionLog[]): ActivityEntry[] => {
    return logs.map((log) => {
      const incomingPayload = log.incoming_payload as Record<string, unknown> | null;
      const responsePayload = log.response_payload as Record<string, unknown> | null;
      
      // Determine type from event_type
      let type: ActivityEntry["type"] = "message";
      if (log.event_type?.toLowerCase().includes("comment")) type = "comment";
      else if (log.event_type?.toLowerCase().includes("order")) type = "order";
      else if (log.event_type?.toLowerCase().includes("connect")) type = "connection";

      return {
        id: log.id,
        type,
        platform: (log.source_platform || "facebook") as ActivityEntry["platform"],
        automationName: log.automations?.name || log.event_type || "AI Automation",
        customerName: (incomingPayload?.sender_name as string) || (incomingPayload?.from as string),
        customerPhone: incomingPayload?.phone as string,
        incomingMessage: (incomingPayload?.message as string) || (incomingPayload?.text as string),
        aiResponse: (responsePayload?.reply as string) || (responsePayload?.message as string),
        status: (log.status || "pending") as ActivityEntry["status"],
        timestamp: log.created_at || new Date().toISOString(),
        processingTime: log.processing_time_ms || undefined,
        orderDetails: type === "order" ? {
          orderId: (incomingPayload?.order_id as string) || `ORD-${log.id.slice(0, 6)}`,
          items: (incomingPayload?.items as string[]) || [],
          total: (incomingPayload?.total as number) || 0,
        } : undefined,
      };
    });
  }, []);

  // Load mock controls (in production, fetch from API)
  const loadControls = useCallback(() => {
    const savedControls = localStorage.getItem("automation_controls");
    if (savedControls) {
      try {
        setControls(JSON.parse(savedControls));
      } catch {
        setControls([]);
      }
    } else {
      // Default controls
      const defaultControls: AutomationControl[] = [
        { id: "wa_inbox", name: "WhatsApp Inbox Auto Reply", platform: "whatsapp", isEnabled: false, repliesCount: 0, ordersCount: 0 },
        { id: "wa_order", name: "WhatsApp Order Assistant", platform: "whatsapp", isEnabled: false, repliesCount: 0, ordersCount: 0 },
        { id: "ig_dm", name: "Instagram DM Auto Reply", platform: "instagram", isEnabled: false, repliesCount: 0, ordersCount: 0 },
        { id: "ig_comment", name: "Instagram Comment Reply", platform: "instagram", isEnabled: false, repliesCount: 0, ordersCount: 0 },
        { id: "fb_inbox", name: "Facebook Inbox Auto Reply", platform: "facebook", isEnabled: false, repliesCount: 0, ordersCount: 0 },
        { id: "fb_comment", name: "Facebook Comment Reply", platform: "facebook", isEnabled: false, repliesCount: 0, ordersCount: 0 },
      ];
      setControls(defaultControls);
    }
  }, []);

  // Fetch activities
  const loadActivities = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const logs = await fetchExecutionLogs(maxItems);
      const converted = convertLogsToActivities(logs);
      setActivities(converted);
    } catch (error) {
      console.error("Failed to load activities:", error);
      // Load from localStorage as fallback
      const storedActivities = localStorage.getItem("automation_activities");
      if (storedActivities) {
        try {
          setActivities(JSON.parse(storedActivities));
        } catch {
          setActivities([]);
        }
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [maxItems, convertLogsToActivities]);

  useEffect(() => {
    loadActivities();
    loadControls();
  }, [loadActivities, loadControls]);

  // Toggle automation control
  const handleToggleControl = (controlId: string, enabled: boolean) => {
    const newControls = controls.map((c) =>
      c.id === controlId ? { ...c, isEnabled: enabled } : c
    );
    setControls(newControls);
    localStorage.setItem("automation_controls", JSON.stringify(newControls));
  };

  // Filter activities
  const filteredActivities = activities.filter((activity) => {
    const matchesPlatform = selectedPlatform === "all" || activity.platform === selectedPlatform;
    const matchesStatus = statusFilter === "all" || activity.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      activity.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.incomingMessage?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.automationName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesPlatform && matchesStatus && matchesSearch;
  });

  // Stats
  const stats = {
    total: filteredActivities.length,
    success: filteredActivities.filter((a) => a.status === "success").length,
    failed: filteredActivities.filter((a) => a.status === "failed").length,
    orders: filteredActivities.filter((a) => a.type === "order").length,
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return timestamp;
    }
  };

  const renderActivityCard = (activity: ActivityEntry, index: number) => {
    const pConfig = platformConfig[activity.platform];
    const tConfig = typeConfig[activity.type];
    const PlatformIcon = pConfig.icon;
    const TypeIcon = tConfig.icon;
    const isExpanded = expandedActivity === activity.id;

    return (
      <motion.div
        key={activity.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.02 }}
        className={`p-3 rounded-lg bg-muted/30 border ${pConfig.borderColor} hover:bg-muted/50 transition-colors cursor-pointer`}
        onClick={() => setExpandedActivity(isExpanded ? null : activity.id)}
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${pConfig.bgColor} shrink-0`}>
            <PlatformIcon className={`h-4 w-4 ${pConfig.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="outline" className={`text-xs ${pConfig.color}`}>
                {pConfig.label}
              </Badge>
              <Badge variant="secondary" className="text-xs gap-1">
                <TypeIcon className="h-3 w-3" />
                {language === "bn" ? tConfig.labelBn : tConfig.label}
              </Badge>
              {activity.orderDetails && (
                <Badge className="text-xs bg-success/20 text-success border-0">
                  {t("Order", "অর্ডার")} #{activity.orderDetails.orderId.slice(-6)}
                </Badge>
              )}
            </div>

            {/* Customer Info */}
            {activity.customerName && (
              <p className="text-sm font-medium flex items-center gap-1">
                <User className="h-3 w-3 text-muted-foreground" />
                {activity.customerName}
                {activity.customerPhone && (
                  <span className="text-xs text-muted-foreground">
                    ({activity.customerPhone})
                  </span>
                )}
              </p>
            )}

            {/* Message Preview */}
            {activity.incomingMessage && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                <span className="font-medium text-foreground">{t("Customer", "কাস্টমার")}:</span> {activity.incomingMessage}
              </p>
            )}
          </div>

          {/* Right Side */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-xs text-muted-foreground">
              {formatTime(activity.timestamp)}
            </span>
            <div className="flex items-center gap-1">
              {activity.status === "success" ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  <span className="text-xs text-success">{t("Success", "সফল")}</span>
                </>
              ) : activity.status === "failed" ? (
                <>
                  <XCircle className="h-3 w-3 text-destructive" />
                  <span className="text-xs text-destructive">{t("Failed", "ব্যর্থ")}</span>
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3 text-warning" />
                  <span className="text-xs text-warning">{t("Pending", "পেন্ডিং")}</span>
                </>
              )}
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-border/50 space-y-3"
            >
              {/* Conversation Flow */}
              {activity.incomingMessage && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="p-1.5 rounded bg-muted shrink-0">
                      <User className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="bg-muted rounded-lg p-2 text-sm flex-1">
                      <p className="text-xs text-muted-foreground mb-1">{t("Customer Message", "কাস্টমার মেসেজ")}</p>
                      {activity.incomingMessage}
                    </div>
                  </div>

                  {activity.aiResponse && (
                    <div className="flex gap-2">
                      <div className="p-1.5 rounded bg-primary/10 shrink-0">
                        <Bot className="h-3 w-3 text-primary" />
                      </div>
                      <div className="bg-primary/10 rounded-lg p-2 text-sm flex-1">
                        <p className="text-xs text-primary mb-1">{t("AI Reply", "AI রিপ্লাই")}</p>
                        {activity.aiResponse}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Order Details */}
              {activity.orderDetails && (
                <div className="bg-success/5 rounded-lg p-3 border border-success/20">
                  <p className="text-xs font-medium text-success mb-2 flex items-center gap-1">
                    <ShoppingCart className="h-3 w-3" />
                    {t("Order Details", "অর্ডার ডিটেইলস")}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">{t("Order ID", "অর্ডার আইডি")}</p>
                      <p className="font-medium">{activity.orderDetails.orderId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("Total", "মোট")}</p>
                      <p className="font-medium">৳{activity.orderDetails.total}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Bot className="h-3 w-3" />
                  {activity.automationName}
                </span>
                {activity.processingTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {activity.processingTime}ms
                  </span>
                )}
                <span>
                  {activity.timestamp && format(new Date(activity.timestamp), "dd MMM yyyy, HH:mm")}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">
                {t("Automation Activity Monitor", "অটোমেশন অ্যাক্টিভিটি মনিটর")}
              </CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadActivities(true)}
              disabled={isRefreshing}
              className="gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {t("Refresh", "রিফ্রেশ")}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="activity" className="gap-1">
                <Activity className="h-4 w-4" />
                {t("Activity Log", "অ্যাক্টিভিটি লগ")}
              </TabsTrigger>
              <TabsTrigger value="controls" className="gap-1">
                <Settings className="h-4 w-4" />
                {t("Controls", "কন্ট্রোল")}
              </TabsTrigger>
            </TabsList>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-2">
                <div className="p-2 rounded-lg bg-muted/30 border border-border/50 text-center">
                  <p className="text-lg font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">{t("Total", "মোট")}</p>
                </div>
                <div className="p-2 rounded-lg bg-success/10 border border-success/30 text-center">
                  <p className="text-lg font-bold text-success">{stats.success}</p>
                  <p className="text-xs text-muted-foreground">{t("Success", "সফল")}</p>
                </div>
                <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/30 text-center">
                  <p className="text-lg font-bold text-destructive">{stats.failed}</p>
                  <p className="text-xs text-muted-foreground">{t("Failed", "ব্যর্থ")}</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/30 text-center">
                  <p className="text-lg font-bold text-primary">{stats.orders}</p>
                  <p className="text-xs text-muted-foreground">{t("Orders", "অর্ডার")}</p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[150px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("Search...", "সার্চ করুন...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder={t("Platform", "প্ল্যাটফর্ম")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("All Platforms", "সব প্ল্যাটফর্ম")}</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[110px] h-9">
                    <SelectValue placeholder={t("Status", "স্ট্যাটাস")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("All", "সব")}</SelectItem>
                    <SelectItem value="success">{t("Success", "সফল")}</SelectItem>
                    <SelectItem value="failed">{t("Failed", "ব্যর্থ")}</SelectItem>
                    <SelectItem value="pending">{t("Pending", "পেন্ডিং")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Activity List */}
              {filteredActivities.length === 0 ? (
                <div className="text-center py-8">
                  <div className="p-4 rounded-full bg-muted/50 inline-block mb-3">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "No activity yet. Logs will appear when automations run.",
                      "এখনও কোনো অ্যাক্টিভিটি নেই। অটোমেশন চালু হলে লগ দেখাবে।"
                    )}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-2">
                  <div className="space-y-2">
                    {filteredActivities.map((activity, index) =>
                      renderActivityCard(activity, index)
                    )}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            {/* Controls Tab */}
            <TabsContent value="controls" className="space-y-4">
              <div className="space-y-3">
                {["whatsapp", "instagram", "facebook"].map((platform) => {
                  const pConfig = platformConfig[platform as keyof typeof platformConfig];
                  const platformControls = controls.filter((c) => c.platform === platform);
                  const PlatformIcon = pConfig.icon;

                  return (
                    <div key={platform} className={`rounded-lg border ${pConfig.borderColor} overflow-hidden`}>
                      <div className={`${pConfig.bgColor} px-3 py-2 flex items-center gap-2`}>
                        <PlatformIcon className={`h-4 w-4 ${pConfig.color}`} />
                        <span className={`font-medium text-sm ${pConfig.color}`}>
                          {pConfig.label} {t("Automations", "অটোমেশন")}
                        </span>
                      </div>
                      <div className="p-2 space-y-2">
                        {platformControls.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-2 text-center">
                            {t("No automations configured", "কোনো অটোমেশন কনফিগার করা হয়নি")}
                          </p>
                        ) : (
                          platformControls.map((control) => (
                            <div
                              key={control.id}
                              className="flex items-center justify-between p-2 rounded bg-muted/30"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{control.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {control.repliesCount} {t("replies", "রিপ্লাই")} • {control.ordersCount} {t("orders", "অর্ডার")}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={control.isEnabled}
                                  onCheckedChange={(checked) =>
                                    handleToggleControl(control.id, checked)
                                  }
                                />
                                {control.isEnabled ? (
                                  <Badge className="bg-success/20 text-success border-0 text-xs">
                                    <Play className="h-3 w-3 mr-1" />
                                    {t("On", "চালু")}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    <Pause className="h-3 w-3 mr-1" />
                                    {t("Off", "বন্ধ")}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AutomationActivityMonitor;
