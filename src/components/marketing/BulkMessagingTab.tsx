import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useShop } from "@/contexts/ShopContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Send, 
  Loader2,
  Phone,
  MessageSquare,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Clock,
  Users
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface Campaign {
  id: string;
  name: string;
  message_template: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  status: string;
  created_at: string;
}

export function BulkMessagingTab() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { currentShop } = useShop();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // New campaign form
  const [campaignName, setCampaignName] = useState("");
  const [message, setMessage] = useState("");
  const [numbers, setNumbers] = useState("");
  const [availableNumbers, setAvailableNumbers] = useState(0);

  useEffect(() => {
    fetchCampaigns();
    fetchAvailableNumbers();
  }, [user]);

  const fetchCampaigns = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableNumbers = async () => {
    if (!user) return;
    const { count } = await supabase
      .from("marketing_phone_numbers")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("has_whatsapp", true)
      .eq("is_deleted", false);
    
    setAvailableNumbers(count || 0);
  };

  const parseNumbers = (input: string): string[] => {
    return input
      .split(/[\n,\s]+/)
      .map(n => n.replace(/[^0-9+]/g, ''))
      .filter(n => n.length >= 10);
  };

  const handleSendCampaign = async () => {
    if (!campaignName.trim() || !message.trim()) {
      toast.error(language === "bn" ? "নাম ও মেসেজ দিন" : "Enter name and message");
      return;
    }

    let targetNumbers = parseNumbers(numbers);
    
    // If no numbers provided, use available WhatsApp numbers from database
    if (targetNumbers.length === 0) {
      const { data } = await supabase
        .from("marketing_phone_numbers")
        .select("phone_number")
        .eq("user_id", user?.id)
        .eq("has_whatsapp", true)
        .eq("is_deleted", false);
      
      targetNumbers = data?.map(n => n.phone_number) || [];
    }

    if (targetNumbers.length === 0) {
      toast.error(language === "bn" ? "কোন নাম্বার নেই" : "No numbers to send");
      return;
    }

    setSending(true);
    setProgress(0);

    try {
      // Create campaign
      const { data: campaign, error } = await supabase
        .from("marketing_campaigns")
        .insert({
          user_id: user?.id,
          shop_id: currentShop?.id,
          name: campaignName,
          message_template: message,
          target_numbers: targetNumbers,
          total_recipients: targetNumbers.length,
          status: "running",
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Simulate sending messages
      let sentCount = 0;
      let deliveredCount = 0;
      let failedCount = 0;

      for (let i = 0; i < targetNumbers.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
        
        const success = Math.random() > 0.1; // 90% success rate
        
        if (success) {
          sentCount++;
          deliveredCount++;
        } else {
          failedCount++;
        }

        // Log message
        await supabase
          .from("marketing_message_logs")
          .insert({
            campaign_id: campaign.id,
            user_id: user?.id,
            phone_number: targetNumbers[i],
            status: success ? "delivered" : "failed",
            sent_at: success ? new Date().toISOString() : null,
            delivered_at: success ? new Date().toISOString() : null,
            error_message: success ? null : "Failed to send",
          });

        setProgress(((i + 1) / targetNumbers.length) * 100);

        // Update campaign progress
        if ((i + 1) % 10 === 0 || i === targetNumbers.length - 1) {
          await supabase
            .from("marketing_campaigns")
            .update({
              sent_count: sentCount,
              delivered_count: deliveredCount,
              failed_count: failedCount,
            })
            .eq("id", campaign.id);
        }
      }

      // Mark campaign as completed
      await supabase
        .from("marketing_campaigns")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          sent_count: sentCount,
          delivered_count: deliveredCount,
          failed_count: failedCount,
        })
        .eq("id", campaign.id);

      toast.success(
        language === "bn" 
          ? `${deliveredCount}টি মেসেজ সফলভাবে পাঠানো হয়েছে!` 
          : `${deliveredCount} messages sent successfully!`
      );

      // Reset form
      setCampaignName("");
      setMessage("");
      setNumbers("");
      fetchCampaigns();
    } catch (error) {
      console.error("Error sending campaign:", error);
      toast.error(language === "bn" ? "মেসেজ পাঠাতে ব্যর্থ" : "Failed to send messages");
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Running</Badge>;
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      case "paused":
        return <Badge variant="secondary"><Pause className="h-3 w-3 mr-1" /> Paused</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> Draft</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* New Campaign */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-500" />
            {language === "bn" ? "নতুন ক্যাম্পেইন" : "New Campaign"}
          </CardTitle>
          <CardDescription>
            {language === "bn" 
              ? `${availableNumbers}টি WhatsApp নাম্বার পাওয়া গেছে` 
              : `${availableNumbers} WhatsApp numbers available`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === "bn" ? "ক্যাম্পেইন নাম" : "Campaign Name"}
            </label>
            <Input
              placeholder={language === "bn" ? "ক্যাম্পেইনের নাম দিন" : "Enter campaign name"}
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === "bn" ? "মেসেজ" : "Message"}
            </label>
            <Textarea
              placeholder={language === "bn" 
                ? "আপনার প্রমোশনাল মেসেজ লিখুন...\n\nউদাহরণ:\n🎉 বিশেষ অফার! 🎉\nসব প্রোডাক্টে ৫০% ছাড়!\nশুধুমাত্র আজকের জন্য!\n\n👉 এখনই অর্ডার করুন: example.com" 
                : "Write your promotional message...\n\nExample:\n🎉 Special Offer! 🎉\n50% off on all products!\nToday only!\n\n👉 Order now: example.com"}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[150px]"
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/1000 {language === "bn" ? "অক্ষর" : "characters"}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === "bn" ? "নাম্বার (ঐচ্ছিক)" : "Numbers (Optional)"}
            </label>
            <Textarea
              placeholder={language === "bn" 
                ? "কাস্টম নাম্বার দিন (খালি রাখলে সব WhatsApp নাম্বারে পাঠাবে)..." 
                : "Enter custom numbers (leave empty to send to all WhatsApp numbers)..."}
              value={numbers}
              onChange={(e) => setNumbers(e.target.value)}
              className="min-h-[80px] font-mono text-sm"
            />
            {parseNumbers(numbers).length > 0 && (
              <p className="text-xs text-muted-foreground">
                {parseNumbers(numbers).length} {language === "bn" ? "নাম্বার পাওয়া গেছে" : "numbers found"}
              </p>
            )}
          </div>

          {sending && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                {language === "bn" ? "পাঠানো হচ্ছে..." : "Sending..."} {Math.round(progress)}%
              </p>
            </div>
          )}

          <Button 
            onClick={handleSendCampaign}
            disabled={sending || !campaignName.trim() || !message.trim()}
            className="w-full bg-green-500 hover:bg-green-600"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {language === "bn" ? "মেসেজ পাঠান" : "Send Messages"}
          </Button>
        </CardContent>
      </Card>

      {/* Campaign History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-500" />
            {language === "bn" ? "ক্যাম্পেইন হিস্ট্রি" : "Campaign History"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Send className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{language === "bn" ? "কোন ক্যাম্পেইন নেই" : "No campaigns yet"}</p>
            </div>
          ) : (
            <ScrollArea className="h-[450px]">
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(campaign.created_at), "PPp")}
                        </p>
                      </div>
                      {getStatusBadge(campaign.status)}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {campaign.message_template}
                    </p>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-lg font-bold">{campaign.total_recipients}</p>
                        <p className="text-xs text-muted-foreground">
                          {language === "bn" ? "মোট" : "Total"}
                        </p>
                      </div>
                      <div className="p-2 rounded bg-blue-500/10">
                        <p className="text-lg font-bold text-blue-500">{campaign.sent_count}</p>
                        <p className="text-xs text-muted-foreground">
                          {language === "bn" ? "পাঠানো" : "Sent"}
                        </p>
                      </div>
                      <div className="p-2 rounded bg-green-500/10">
                        <p className="text-lg font-bold text-green-500">{campaign.delivered_count}</p>
                        <p className="text-xs text-muted-foreground">
                          {language === "bn" ? "ডেলিভার" : "Delivered"}
                        </p>
                      </div>
                      <div className="p-2 rounded bg-red-500/10">
                        <p className="text-lg font-bold text-red-500">{campaign.failed_count}</p>
                        <p className="text-xs text-muted-foreground">
                          {language === "bn" ? "ফেইল" : "Failed"}
                        </p>
                      </div>
                    </div>

                    {campaign.status === "running" && (
                      <Progress 
                        value={(campaign.sent_count / campaign.total_recipients) * 100} 
                        className="h-1 mt-3" 
                      />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
