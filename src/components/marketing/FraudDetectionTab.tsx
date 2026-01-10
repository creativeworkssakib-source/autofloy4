import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useShop } from "@/contexts/ShopContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Shield, 
  AlertTriangle,
  Ban,
  Search,
  Loader2,
  Phone,
  Globe,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface FraudLog {
  id: string;
  detection_type: string;
  risk_score: number;
  ip_address: string | null;
  phone_number: string | null;
  customer_name: string | null;
  is_blocked: boolean;
  action_taken: string | null;
  created_at: string;
}

interface BlacklistItem {
  id: string;
  type: string;
  value: string;
  reason: string | null;
  blocked_orders_count: number;
  created_at: string;
}

export function FraudDetectionTab() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { currentShop } = useShop();
  const [fraudLogs, setFraudLogs] = useState<FraudLog[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Settings
  const [autoDetectFakeIP, setAutoDetectFakeIP] = useState(true);
  const [autoDetectFakeOrder, setAutoDetectFakeOrder] = useState(true);
  const [autoBlock, setAutoBlock] = useState(false);

  // New blacklist item
  const [newBlockType, setNewBlockType] = useState<"ip" | "phone" | "email">("phone");
  const [newBlockValue, setNewBlockValue] = useState("");
  const [newBlockReason, setNewBlockReason] = useState("");

  useEffect(() => {
    fetchFraudLogs();
    fetchBlacklist();
  }, [user, currentShop]);

  const fetchFraudLogs = async () => {
    if (!user) return;
    try {
      let query = supabase
        .from("fraud_detection_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (currentShop) {
        query = query.eq("shop_id", currentShop.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setFraudLogs(data || []);
    } catch (error) {
      console.error("Error fetching fraud logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlacklist = async () => {
    if (!user) return;
    try {
      let query = supabase
        .from("marketing_blacklist")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (currentShop) {
        query = query.eq("shop_id", currentShop.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setBlacklist(data || []);
    } catch (error) {
      console.error("Error fetching blacklist:", error);
    }
  };

  const handleAddToBlacklist = async () => {
    if (!newBlockValue.trim()) {
      toast.error(language === "bn" ? "ভ্যালু দিন" : "Enter value");
      return;
    }

    try {
      const { error } = await supabase
        .from("marketing_blacklist")
        .insert({
          user_id: user?.id,
          shop_id: currentShop?.id,
          type: newBlockType,
          value: newBlockValue.trim(),
          reason: newBlockReason.trim() || null,
        });

      if (error) throw error;
      
      toast.success(language === "bn" ? "ব্ল্যাকলিস্টে যোগ হয়েছে" : "Added to blacklist");
      setNewBlockValue("");
      setNewBlockReason("");
      fetchBlacklist();
    } catch (error) {
      console.error("Error adding to blacklist:", error);
      toast.error(language === "bn" ? "যোগ করতে ব্যর্থ" : "Failed to add");
    }
  };

  const handleRemoveFromBlacklist = async (id: string) => {
    try {
      const { error } = await supabase
        .from("marketing_blacklist")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success(language === "bn" ? "ব্ল্যাকলিস্ট থেকে সরানো হয়েছে" : "Removed from blacklist");
      fetchBlacklist();
    } catch (error) {
      console.error("Error removing from blacklist:", error);
    }
  };

  const handleBlockFraud = async (log: FraudLog) => {
    try {
      // Add to blacklist
      if (log.ip_address) {
        await supabase
          .from("marketing_blacklist")
          .insert({
            user_id: user?.id,
            shop_id: currentShop?.id,
            type: "ip",
            value: log.ip_address,
            reason: `Fraud detection: ${log.detection_type}`,
          });
      }
      
      if (log.phone_number) {
        await supabase
          .from("marketing_blacklist")
          .insert({
            user_id: user?.id,
            shop_id: currentShop?.id,
            type: "phone",
            value: log.phone_number,
            reason: `Fraud detection: ${log.detection_type}`,
          });
      }

      // Update fraud log
      await supabase
        .from("fraud_detection_logs")
        .update({ is_blocked: true, action_taken: "blocked" })
        .eq("id", log.id);

      toast.success(language === "bn" ? "ব্লক করা হয়েছে" : "Blocked successfully");
      fetchFraudLogs();
      fetchBlacklist();
    } catch (error) {
      console.error("Error blocking:", error);
    }
  };

  const getRiskBadge = (score: number) => {
    if (score >= 80) return <Badge variant="destructive">High Risk ({score})</Badge>;
    if (score >= 50) return <Badge className="bg-orange-500">Medium Risk ({score})</Badge>;
    return <Badge variant="secondary">Low Risk ({score})</Badge>;
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "fake_ip":
        return <Badge variant="outline" className="text-red-500"><Globe className="h-3 w-3 mr-1" /> Fake IP</Badge>;
      case "fake_order":
        return <Badge variant="outline" className="text-orange-500"><AlertTriangle className="h-3 w-3 mr-1" /> Fake Order</Badge>;
      case "suspicious_pattern":
        return <Badge variant="outline" className="text-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" /> Suspicious</Badge>;
      case "blacklisted":
        return <Badge variant="outline" className="text-purple-500"><Ban className="h-3 w-3 mr-1" /> Blacklisted</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const filteredLogs = fraudLogs.filter(log => 
    log.ip_address?.includes(searchQuery) ||
    log.phone_number?.includes(searchQuery) ||
    log.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            {language === "bn" ? "ফ্রড ডিটেকশন সেটিংস" : "Fraud Detection Settings"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">
                  {language === "bn" ? "ফেক IP ডিটেকশন" : "Fake IP Detection"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === "bn" ? "VPN/Proxy IP সনাক্ত করুন" : "Detect VPN/Proxy IPs"}
                </p>
              </div>
              <Switch checked={autoDetectFakeIP} onCheckedChange={setAutoDetectFakeIP} />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">
                  {language === "bn" ? "ফেক অর্ডার ডিটেকশন" : "Fake Order Detection"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === "bn" ? "সন্দেহজনক অর্ডার সনাক্ত করুন" : "Detect suspicious orders"}
                </p>
              </div>
              <Switch checked={autoDetectFakeOrder} onCheckedChange={setAutoDetectFakeOrder} />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">
                  {language === "bn" ? "অটো ব্লক" : "Auto Block"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === "bn" ? "হাই রিস্ক অটো ব্লক করুন" : "Auto block high risk"}
                </p>
              </div>
              <Switch checked={autoBlock} onCheckedChange={setAutoBlock} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fraud Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {language === "bn" ? "সন্দেহজনক কার্যকলাপ" : "Suspicious Activity"}
              <Badge variant="secondary">{filteredLogs.length}</Badge>
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === "bn" ? "IP, ফোন বা নাম খুঁজুন..." : "Search IP, phone or name..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{language === "bn" ? "কোন সন্দেহজনক কার্যকলাপ নেই" : "No suspicious activity"}</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-4 rounded-lg border ${
                        log.is_blocked ? 'bg-muted/50 opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex flex-wrap gap-2">
                          {getTypeBadge(log.detection_type)}
                          {getRiskBadge(log.risk_score)}
                        </div>
                        {log.is_blocked ? (
                          <Badge className="bg-red-500">
                            <Ban className="h-3 w-3 mr-1" /> Blocked
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleBlockFraud(log)}
                          >
                            <Ban className="h-3 w-3 mr-1" />
                            {language === "bn" ? "ব্লক" : "Block"}
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        {log.customer_name && (
                          <p><span className="text-muted-foreground">Name:</span> {log.customer_name}</p>
                        )}
                        {log.phone_number && (
                          <p className="font-mono"><span className="text-muted-foreground">Phone:</span> {log.phone_number}</p>
                        )}
                        {log.ip_address && (
                          <p className="font-mono"><span className="text-muted-foreground">IP:</span> {log.ip_address}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "PPp")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Blacklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-500" />
              {language === "bn" ? "ব্ল্যাকলিস্ট" : "Blacklist"}
              <Badge variant="secondary">{blacklist.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add to blacklist */}
            <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
              <div className="flex gap-2">
                <select
                  value={newBlockType}
                  onChange={(e) => setNewBlockType(e.target.value as "ip" | "phone" | "email")}
                  className="px-3 py-2 rounded-md border bg-background"
                >
                  <option value="phone">{language === "bn" ? "ফোন" : "Phone"}</option>
                  <option value="ip">{language === "bn" ? "IP" : "IP"}</option>
                  <option value="email">{language === "bn" ? "ইমেইল" : "Email"}</option>
                </select>
                <Input
                  placeholder={
                    newBlockType === "phone" ? "+8801712345678" :
                    newBlockType === "ip" ? "192.168.1.1" : "email@example.com"
                  }
                  value={newBlockValue}
                  onChange={(e) => setNewBlockValue(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={language === "bn" ? "কারণ (ঐচ্ছিক)" : "Reason (optional)"}
                  value={newBlockReason}
                  onChange={(e) => setNewBlockReason(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddToBlacklist}>
                  <Plus className="h-4 w-4 mr-1" />
                  {language === "bn" ? "যোগ করুন" : "Add"}
                </Button>
              </div>
            </div>

            {/* Blacklist items */}
            {blacklist.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Ban className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{language === "bn" ? "ব্ল্যাকলিস্ট খালি" : "Blacklist is empty"}</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {blacklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          item.type === "ip" ? "bg-blue-500/10" :
                          item.type === "phone" ? "bg-green-500/10" : "bg-purple-500/10"
                        }`}>
                          {item.type === "ip" ? (
                            <Globe className="h-4 w-4 text-blue-500" />
                          ) : item.type === "phone" ? (
                            <Phone className="h-4 w-4 text-green-500" />
                          ) : (
                            <Globe className="h-4 w-4 text-purple-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-mono text-sm">{item.value}</p>
                          {item.reason && (
                            <p className="text-xs text-muted-foreground">{item.reason}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.blocked_orders_count > 0 && (
                          <Badge variant="secondary">
                            {item.blocked_orders_count} {language === "bn" ? "ব্লক" : "blocked"}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleRemoveFromBlacklist(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
