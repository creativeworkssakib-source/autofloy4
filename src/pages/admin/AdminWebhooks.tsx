import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Webhook, 
  Copy, 
  Check, 
  Facebook, 
  Mail, 
  ShoppingCart, 
  Instagram,
  Globe,
  MessageCircle,
  CreditCard,
  UserPlus,
  UserCheck,
  Bell,
  RefreshCw,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Settings2,
  Link2,
  Loader2,
  Save,
  AlertCircle,
  Play
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WebhookConfig {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  category: string;
  icon: string | null;
  is_active: boolean;
  is_coming_soon: boolean;
  created_at: string | null;
  updated_at: string | null;
}

interface OutgoingEvent {
  id: string;
  user_id: string | null;
  account_id: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  status: "pending" | "sent" | "error";
  last_error: string | null;
  retry_count: number;
  sent_at: string | null;
  created_at: string;
}

const iconMap: Record<string, React.ReactNode> = {
  Facebook: <Facebook className="h-5 w-5 text-blue-600" />,
  MessageCircle: <MessageCircle className="h-5 w-5 text-green-500" />,
  Instagram: <Instagram className="h-5 w-5 text-pink-500" />,
  Mail: <Mail className="h-5 w-5 text-orange-500" />,
  ShoppingCart: <ShoppingCart className="h-5 w-5 text-purple-500" />,
  Globe: <Globe className="h-5 w-5 text-cyan-500" />,
  CreditCard: <CreditCard className="h-5 w-5 text-emerald-500" />,
  AlertCircle: <AlertCircle className="h-5 w-5 text-red-500" />,
  CheckCircle: <CheckCircle className="h-5 w-5 text-green-500" />,
  XCircle: <XCircle className="h-5 w-5 text-red-500" />,
  UserPlus: <UserPlus className="h-5 w-5 text-blue-500" />,
  UserCheck: <UserCheck className="h-5 w-5 text-green-500" />,
  Webhook: <Webhook className="h-5 w-5 text-orange-600" />,
};

export default function AdminWebhooks() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [events, setEvents] = useState<OutgoingEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<OutgoingEvent | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("endpoints");
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [editUrl, setEditUrl] = useState("");

  const SUPABASE_URL = "https://klkrzfwvrmffqkmkyqrh.supabase.co";
  const functionsUrl = `${SUPABASE_URL}/functions/v1`;

  // Fetch webhooks from admin API
  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("autofloy_token");
      const response = await fetch(`${functionsUrl}/admin/webhooks`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch webhooks");
      }

      const data = await response.json();
      setWebhooks(data.webhooks || []);
    } catch (error) {
      console.error("Failed to fetch webhooks:", error);
      toast.error("Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  // Update webhook URL
  const handleSaveUrl = async (webhook: WebhookConfig, newUrl: string) => {
    setSaving(webhook.id);
    try {
      const token = localStorage.getItem("autofloy_token");
      const response = await fetch(`${functionsUrl}/admin/webhooks/${webhook.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: newUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to update webhook");
      }

      setWebhooks(prev => prev.map(w => 
        w.id === webhook.id ? { ...w, url: newUrl } : w
      ));
      setEditingWebhook(null);
      
      // Clear webhook cache so other parts of the app get the new URL
      import("@/services/webhookService").then(({ clearWebhookCache }) => {
        clearWebhookCache();
      });
      
      toast.success(`${webhook.name} URL updated! সব জায়গায় এই URL ব্যবহার হবে।`);
    } catch (error) {
      console.error("Failed to update webhook:", error);
      toast.error("Failed to update webhook URL");
    } finally {
      setSaving(null);
    }
  };

  // Toggle webhook active status
  const handleToggleActive = async (webhook: WebhookConfig) => {
    const newIsActive = !webhook.is_active;
    const newIsComingSoon = newIsActive ? false : webhook.is_coming_soon;
    
    try {
      const token = localStorage.getItem("autofloy_token");
      const response = await fetch(`${functionsUrl}/admin/webhooks/${webhook.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          is_active: newIsActive,
          is_coming_soon: newIsComingSoon
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update webhook");
      }

      setWebhooks(prev => prev.map(w => 
        w.id === webhook.id ? { ...w, is_active: newIsActive, is_coming_soon: newIsComingSoon } : w
      ));
      
      // Clear webhook cache so status changes reflect everywhere
      import("@/services/webhookService").then(({ clearWebhookCache }) => {
        clearWebhookCache();
      });
      
      toast.success(`${webhook.name} ${newIsActive ? 'activated - এখন থেকে কাজ করবে' : 'deactivated - বন্ধ হয়ে গেছে'}!`);
    } catch (error) {
      console.error("Failed to toggle webhook:", error);
      toast.error("Failed to update webhook status");
    }
  };

  // Toggle coming soon status
  const handleToggleComingSoon = async (webhook: WebhookConfig) => {
    const newIsComingSoon = !webhook.is_coming_soon;
    const newIsActive = newIsComingSoon ? false : webhook.is_active;
    
    try {
      const token = localStorage.getItem("autofloy_token");
      const response = await fetch(`${functionsUrl}/admin/webhooks/${webhook.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          is_coming_soon: newIsComingSoon,
          is_active: newIsActive
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update webhook");
      }

      setWebhooks(prev => prev.map(w => 
        w.id === webhook.id ? { ...w, is_coming_soon: newIsComingSoon, is_active: newIsActive } : w
      ));
      toast.success(`${webhook.name} ${newIsComingSoon ? 'set to Coming Soon' : 'removed from Coming Soon'}!`);
    } catch (error) {
      console.error("Failed to toggle webhook:", error);
      toast.error("Failed to update webhook status");
    }
  };

  // Test webhook connection
  const [testing, setTesting] = useState<string | null>(null);
  
  const handleTestWebhook = async (webhook: WebhookConfig) => {
    if (!webhook.url) {
      toast.error("No URL configured for this webhook");
      return;
    }
    
    setTesting(webhook.id);
    try {
      const token = localStorage.getItem("autofloy_token");
      const response = await fetch(`${functionsUrl}/webhook-events?action=test`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ webhook_id: webhook.id }),
      });

      const data = await response.json();
      
      if (response.ok && data.results) {
        const result = data.results[0];
        if (result?.success) {
          toast.success(`${webhook.name} test successful! Connection working.`);
        } else {
          toast.error(`${webhook.name} test failed: ${result?.error || 'Unknown error'}`);
        }
      } else {
        toast.error("Test failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Failed to test webhook:", error);
      toast.error("Failed to test webhook connection");
    } finally {
      setTesting(null);
    }
  };

  const handleCopy = async (webhook: WebhookConfig) => {
    if (!webhook.url) {
      toast.error("No URL configured for this webhook");
      return;
    }
    try {
      await navigator.clipboard.writeText(webhook.url);
      setCopiedId(webhook.id);
      toast.success(`${webhook.name} URL copied!`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error("Failed to copy URL");
    }
  };

  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const token = localStorage.getItem("autofloy_token");
      const params = new URLSearchParams({ action: "list", limit: "50" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter) params.set("event_type", typeFilter);

      const response = await fetch(
        `${functionsUrl}/webhook-events?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
      toast.error("Failed to load webhook events");
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "events") {
      fetchEvents();
    }
  }, [statusFilter, typeFilter, activeTab]);

  const handleRetry = async (eventId: string) => {
    setRetrying(eventId);
    try {
      const token = localStorage.getItem("autofloy_token");
      const response = await fetch(
        `${functionsUrl}/webhook-events?action=retry`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ event_id: eventId }),
        }
      );

      if (response.ok) {
        toast.success("Event queued for retry");
        fetchEvents();
      } else {
        toast.error("Failed to retry event");
      }
    } catch (error) {
      toast.error("Failed to retry event");
    } finally {
      setRetrying(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Sent</Badge>;
      case "error":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "platform": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "system": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "automation": return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const groupedWebhooks = {
    platform: webhooks.filter(w => w.category === "platform"),
    system: webhooks.filter(w => w.category === "system"),
    automation: webhooks.filter(w => w.category === "automation"),
  };

  const renderWebhookCard = (webhook: WebhookConfig) => (
    <div 
      key={webhook.id}
      className={`p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors space-y-4 ${
        webhook.is_coming_soon ? 'opacity-60' : ''
      }`}
    >
      {/* Header Row */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
          {iconMap[webhook.icon || "Webhook"] || <Webhook className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{webhook.name}</span>
            {webhook.is_active && !webhook.is_coming_soon && (
              <Badge className="bg-green-500 text-xs">Active</Badge>
            )}
            {webhook.is_coming_soon && (
              <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
            )}
            {!webhook.is_active && !webhook.is_coming_soon && (
              <Badge variant="outline" className="text-xs">Inactive</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{webhook.description}</p>
        </div>
      </div>

      {/* URL Section */}
      <div className="space-y-2">
        {editingWebhook?.id === webhook.id ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <Input 
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              placeholder="Enter webhook URL..."
              className="flex-1 text-xs font-mono"
            />
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => handleSaveUrl(webhook, editUrl)}
                disabled={saving === webhook.id}
                className="flex-1 sm:flex-none"
              >
                {saving === webhook.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span className="ml-1 sm:hidden">Save</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingWebhook(null)}
                className="flex-1 sm:flex-none"
              >
                <XCircle className="h-4 w-4" />
                <span className="ml-1 sm:hidden">Cancel</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <Input 
              value={webhook.url || "Not configured"} 
              readOnly 
              className="flex-1 text-xs font-mono bg-muted"
            />
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => {
                  setEditingWebhook(webhook);
                  setEditUrl(webhook.url || "");
                }}
                title="Edit URL"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => handleCopy(webhook)}
                disabled={!webhook.url}
                title="Copy URL"
              >
                {copiedId === webhook.id ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => handleTestWebhook(webhook)}
                disabled={!webhook.url || !webhook.is_active || testing === webhook.id}
                title="Test Webhook"
              >
                {testing === webhook.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Toggle Section */}
      <div className="flex flex-wrap items-center gap-4 pt-2 border-t">
        <div className="flex items-center gap-2">
          <Switch
            id={`active-${webhook.id}`}
            checked={webhook.is_active}
            onCheckedChange={() => handleToggleActive(webhook)}
            disabled={webhook.is_coming_soon}
          />
          <Label htmlFor={`active-${webhook.id}`} className="text-xs">
            Active
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id={`coming-${webhook.id}`}
            checked={webhook.is_coming_soon}
            onCheckedChange={() => handleToggleComingSoon(webhook)}
          />
          <Label htmlFor={`coming-${webhook.id}`} className="text-xs">
            Coming Soon
          </Label>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Webhook className="h-5 w-5 sm:h-6 sm:w-6" />
              Webhook System
            </h1>
            <p className="text-sm text-muted-foreground">Manage webhook URLs for n8n integrations</p>
          </div>
          <Button onClick={fetchWebhooks} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* n8n Connection Info */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Link2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              n8n Integration
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Webhook URLs connect করে activity পাঠান
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-background border">
                <div className="font-medium mb-1 text-xs sm:text-sm">1. Webhook Create</div>
                <p className="text-muted-foreground text-xs">
                  n8n এ Webhook node add করে URL copy করুন
                </p>
              </div>
              <div className="p-3 rounded-lg bg-background border">
                <div className="font-medium mb-1 text-xs sm:text-sm">2. URL Paste</div>
                <p className="text-muted-foreground text-xs">
                  Edit button এ n8n URL paste করুন
                </p>
              </div>
              <div className="p-3 rounded-lg bg-background border">
                <div className="font-medium mb-1 text-xs sm:text-sm">3. Active করুন</div>
                <p className="text-muted-foreground text-xs">
                  Toggle on করলে events শুরু হবে
                </p>
              </div>
              <div className="p-3 rounded-lg bg-background border">
                <div className="font-medium mb-1 text-xs sm:text-sm">4. Test করুন</div>
                <p className="text-muted-foreground text-xs">
                  Play button এ test event পাঠান
                </p>
              </div>
              <div className="p-3 rounded-lg bg-background border">
                <div className="font-medium mb-1 text-xs sm:text-sm">5. Real Data</div>
                <p className="text-muted-foreground text-xs">
                  Activity automatically যাবে
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="endpoints" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <Settings2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Webhook</span> Endpoints
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
              Event Logs
            </TabsTrigger>
          </TabsList>

          {/* Webhook Endpoints Tab */}
          <TabsContent value="endpoints" className="space-y-6">
            {loading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : webhooks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Webhooks Configured</h3>
                  <p className="text-muted-foreground">
                    Webhook configurations will appear here once they are added to the database.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Platform Automation Webhooks */}
                {groupedWebhooks.platform.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Badge className={getCategoryColor("platform")}>Platform</Badge>
                        Platform Automation Webhooks
                      </CardTitle>
                      <CardDescription>
                        Webhooks for social media and messaging platform automations (Facebook, WhatsApp, Instagram, etc.)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {groupedWebhooks.platform.map(renderWebhookCard)}
                    </CardContent>
                  </Card>
                )}

                {/* System Event Webhooks */}
                {groupedWebhooks.system.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Badge className={getCategoryColor("system")}>System</Badge>
                        System Event Webhooks
                      </CardTitle>
                      <CardDescription>
                        Webhooks for payments, subscriptions, user registrations, and notifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {groupedWebhooks.system.map(renderWebhookCard)}
                    </CardContent>
                  </Card>
                )}

                {/* n8n Automation Webhooks */}
                {groupedWebhooks.automation.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Badge className={getCategoryColor("automation")}>Automation</Badge>
                        n8n Automation Webhooks
                      </CardTitle>
                      <CardDescription>
                        General automation triggers for n8n workflows
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {groupedWebhooks.automation.map(renderWebhookCard)}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Event Logs Tab */}
          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Webhook Event Logs</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchEvents}
                    disabled={eventsLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${eventsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </CardTitle>
                <CardDescription>
                  View and manage outgoing webhook events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="w-48">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input 
                    placeholder="Filter by event type..."
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-64"
                  />
                </div>

                {eventsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No webhook events found
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Retries</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Sent</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {events.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell className="font-mono text-sm">{event.event_type}</TableCell>
                            <TableCell>{getStatusBadge(event.status)}</TableCell>
                            <TableCell>{event.retry_count}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(event.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {event.sent_at ? new Date(event.sent_at).toLocaleString() : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedEvent(event)}
                                >
                                  View
                                </Button>
                                {event.status === "error" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRetry(event.id)}
                                    disabled={retrying === event.id}
                                  >
                                    {retrying === event.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      "Retry"
                                    )}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Event Detail Modal */}
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Event Details</DialogTitle>
              <DialogDescription>
                {selectedEvent?.event_type}
              </DialogDescription>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedEvent.status)}</div>
                  </div>
                  <div>
                    <Label>Retry Count</Label>
                    <p className="text-sm mt-1">{selectedEvent.retry_count}</p>
                  </div>
                  <div>
                    <Label>Created At</Label>
                    <p className="text-sm mt-1">{new Date(selectedEvent.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>Sent At</Label>
                    <p className="text-sm mt-1">{selectedEvent.sent_at ? new Date(selectedEvent.sent_at).toLocaleString() : "Not sent"}</p>
                  </div>
                </div>
                
                {selectedEvent.last_error && (
                  <div>
                    <Label>Last Error</Label>
                    <p className="text-sm mt-1 text-destructive bg-destructive/10 p-2 rounded">
                      {selectedEvent.last_error}
                    </p>
                  </div>
                )}

                <div>
                  <Label>Payload</Label>
                  <Textarea 
                    value={JSON.stringify(selectedEvent.payload, null, 2)}
                    readOnly
                    className="mt-1 font-mono text-xs h-48"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
              {selectedEvent?.status === "error" && (
                <Button 
                  onClick={() => {
                    handleRetry(selectedEvent.id);
                    setSelectedEvent(null);
                  }}
                >
                  Retry Event
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
