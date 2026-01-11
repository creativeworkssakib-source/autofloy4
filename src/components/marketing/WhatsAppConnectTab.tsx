import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useShop } from "@/contexts/ShopContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  QrCode, 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Trash2,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

interface WhatsAppAccount {
  id: string;
  phone_number: string | null;
  is_connected: boolean;
  last_connected_at: string | null;
  created_at: string;
}

export function WhatsAppConnectTab() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { currentShop } = useShop();
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, [user, currentShop]);

  const fetchAccounts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("marketing_whatsapp_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!user) return;
    setConnecting(true);
    setShowQR(true);

    try {
      // Create a pending connection
      const { data, error } = await supabase
        .from("marketing_whatsapp_accounts")
        .insert({
          user_id: user.id,
          shop_id: currentShop?.id,
          is_connected: false,
        })
        .select()
        .single();

      if (error) throw error;

      // In a real implementation, this would connect to WhatsApp Web API
      // For now, we'll simulate the QR code display
      toast.info(
        language === "bn" 
          ? "QR কোড স্ক্যান করুন WhatsApp Web থেকে" 
          : "Scan QR code from WhatsApp Web"
      );

      // Simulate connection after 5 seconds (for demo)
      setTimeout(async () => {
        await supabase
          .from("marketing_whatsapp_accounts")
          .update({
            is_connected: true,
            phone_number: "+880" + Math.floor(1000000000 + Math.random() * 9000000000),
            last_connected_at: new Date().toISOString(),
          })
          .eq("id", data.id);

        toast.success(
          language === "bn" 
            ? "WhatsApp সফলভাবে কানেক্ট হয়েছে!" 
            : "WhatsApp connected successfully!"
        );
        setShowQR(false);
        setConnecting(false);
        fetchAccounts();
      }, 5000);
    } catch (error) {
      console.error("Error connecting:", error);
      toast.error(language === "bn" ? "কানেকশন ব্যর্থ" : "Connection failed");
      setConnecting(false);
      setShowQR(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from("marketing_whatsapp_accounts")
        .update({ is_connected: false })
        .eq("id", accountId);

      if (error) throw error;
      toast.success(language === "bn" ? "ডিসকানেক্ট হয়েছে" : "Disconnected");
      fetchAccounts();
    } catch (error) {
      console.error("Error disconnecting:", error);
      toast.error(language === "bn" ? "ডিসকানেক্ট ব্যর্থ" : "Disconnect failed");
    }
  };

  const handleDelete = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from("marketing_whatsapp_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;
      toast.success(language === "bn" ? "অ্যাকাউন্ট মুছে ফেলা হয়েছে" : "Account deleted");
      fetchAccounts();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error(language === "bn" ? "মুছতে ব্যর্থ" : "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Connect New Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-green-500" />
            {language === "bn" ? "নতুন WhatsApp কানেক্ট করুন" : "Connect New WhatsApp"}
          </CardTitle>
          <CardDescription>
            {language === "bn" 
              ? "QR কোড স্ক্যান করে আপনার WhatsApp অ্যাকাউন্ট কানেক্ট করুন" 
              : "Connect your WhatsApp account by scanning QR code"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showQR ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-green-500/50">
                {connecting ? (
                  <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-green-500 mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      {language === "bn" 
                        ? "WhatsApp Web এ গিয়ে QR স্ক্যান করুন..." 
                        : "Open WhatsApp Web and scan QR..."}
                    </p>
                  </div>
                ) : (
                  <QrCode className="h-32 w-32 text-muted-foreground" />
                )}
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">
                  {language === "bn" ? "ধাপ ১: WhatsApp খুলুন" : "Step 1: Open WhatsApp"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === "bn" 
                    ? "ধাপ ২: Settings > Linked Devices > Link a Device" 
                    : "Step 2: Settings > Linked Devices > Link a Device"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === "bn" ? "ধাপ ৩: এই QR কোড স্ক্যান করুন" : "Step 3: Scan this QR code"}
                </p>
              </div>
              <Button variant="outline" onClick={() => { setShowQR(false); setConnecting(false); }}>
                {language === "bn" ? "বাতিল" : "Cancel"}
              </Button>
            </div>
          ) : (
            <Button onClick={handleConnect} className="bg-green-500 hover:bg-green-600">
              <Smartphone className="h-4 w-4 mr-2" />
              {language === "bn" ? "WhatsApp কানেক্ট করুন" : "Connect WhatsApp"}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {language === "bn" ? "কানেক্টেড অ্যাকাউন্ট" : "Connected Accounts"}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchAccounts}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Smartphone className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{language === "bn" ? "কোন অ্যাকাউন্ট কানেক্ট নেই" : "No accounts connected"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${account.is_connected ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      {account.is_connected ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {account.phone_number || (language === "bn" ? "পেন্ডিং..." : "Pending...")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {account.last_connected_at 
                          ? `${language === "bn" ? "শেষ কানেক্ট:" : "Last connected:"} ${format(new Date(account.last_connected_at), "PPp")}`
                          : (language === "bn" ? "কখনো কানেক্ট হয়নি" : "Never connected")
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={account.is_connected ? "default" : "secondary"}>
                      {account.is_connected 
                        ? (language === "bn" ? "কানেক্টেড" : "Connected")
                        : (language === "bn" ? "ডিসকানেক্টেড" : "Disconnected")
                      }
                    </Badge>
                    {account.is_connected && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDisconnect(account.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDelete(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
