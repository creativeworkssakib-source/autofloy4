import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Users, 
  Download, 
  RefreshCw, 
  Search,
  Copy,
  CheckCircle2,
  Loader2,
  Phone
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WhatsAppGroup {
  id: string;
  group_name: string | null;
  member_count: number;
  numbers_extracted: number;
  last_synced_at: string | null;
}

interface PhoneNumber {
  id: string;
  phone_number: string;
  contact_name: string | null;
  source_name: string | null;
  has_whatsapp: boolean | null;
}

export function GroupNumbersTab() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [copiedNumbers, setCopiedNumbers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchGroups();
    fetchNumbers();
  }, [user]);

  const fetchGroups = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("marketing_whatsapp_groups")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNumbers = async (groupName?: string) => {
    if (!user) return;
    try {
      let query = supabase
        .from("marketing_phone_numbers")
        .select("*")
        .eq("user_id", user.id)
        .eq("source", "whatsapp_group")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (groupName) {
        query = query.eq("source_name", groupName);
      }

      const { data, error } = await query;
      if (error) throw error;
      setNumbers(data || []);
    } catch (error) {
      console.error("Error fetching numbers:", error);
    }
  };

  const handleSyncGroups = async () => {
    if (!user) return;
    setLoading(true);
    
    // Check if user has connected WhatsApp
    const { data: accounts } = await supabase
      .from("marketing_whatsapp_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_connected", true)
      .limit(1);

    if (!accounts || accounts.length === 0) {
      toast.error(
        language === "bn" 
          ? "প্রথমে WhatsApp কানেক্ট করুন" 
          : "Please connect WhatsApp first"
      );
      setLoading(false);
      return;
    }

    // Simulate fetching groups (in real implementation, this would call WhatsApp API)
    const mockGroups = [
      { name: "Business Network BD", members: 256 },
      { name: "E-commerce Sellers", members: 189 },
      { name: "Digital Marketing", members: 342 },
      { name: "Startup Bangladesh", members: 478 },
    ];

    for (const group of mockGroups) {
      const { error } = await supabase
        .from("marketing_whatsapp_groups")
        .upsert({
          user_id: user.id,
          account_id: accounts[0].id,
          group_id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          group_name: group.name,
          member_count: group.members,
          last_synced_at: new Date().toISOString(),
        }, { onConflict: "group_id" });

      if (error) console.error("Error syncing group:", error);
    }

    toast.success(
      language === "bn" 
        ? "গ্রুপ সিঙ্ক সম্পন্ন!" 
        : "Groups synced successfully!"
    );
    fetchGroups();
  };

  const handleExtractNumbers = async (groupId: string, groupName: string) => {
    if (!user) return;
    setExtracting(groupId);

    // Simulate extracting numbers
    const mockNumbers = Array.from({ length: 15 + Math.floor(Math.random() * 20) }, (_, i) => ({
      phone: "+880" + (1700000000 + Math.floor(Math.random() * 99999999)),
      name: `Member ${i + 1}`,
    }));

    for (const num of mockNumbers) {
      await supabase
        .from("marketing_phone_numbers")
        .insert({
          user_id: user.id,
          phone_number: num.phone,
          contact_name: num.name,
          source: "whatsapp_group",
          source_name: groupName,
          has_whatsapp: true,
        });
    }

    // Update group extracted count
    await supabase
      .from("marketing_whatsapp_groups")
      .update({ numbers_extracted: mockNumbers.length })
      .eq("id", groupId);

    toast.success(
      language === "bn" 
        ? `${mockNumbers.length}টি নাম্বার এক্সট্রাক্ট হয়েছে!` 
        : `${mockNumbers.length} numbers extracted!`
    );
    
    setExtracting(null);
    fetchGroups();
    fetchNumbers(groupName);
  };

  const copyNumber = (number: string, id: string) => {
    navigator.clipboard.writeText(number);
    setCopiedNumbers(prev => new Set([...prev, id]));
    setTimeout(() => {
      setCopiedNumbers(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 2000);
  };

  const copyAllNumbers = () => {
    const allNumbers = filteredNumbers.map(n => n.phone_number).join("\n");
    navigator.clipboard.writeText(allNumbers);
    toast.success(
      language === "bn" 
        ? `${filteredNumbers.length}টি নাম্বার কপি হয়েছে` 
        : `${filteredNumbers.length} numbers copied`
    );
  };

  const filteredNumbers = numbers.filter(n => 
    n.phone_number.includes(searchQuery) || 
    n.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.source_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Groups List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                {language === "bn" ? "WhatsApp গ্রুপ" : "WhatsApp Groups"}
              </CardTitle>
              <CardDescription>
                {language === "bn" 
                  ? "আপনার সকল WhatsApp গ্রুপ" 
                  : "All your WhatsApp groups"}
              </CardDescription>
            </div>
            <Button onClick={handleSyncGroups} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {language === "bn" ? "সিঙ্ক" : "Sync"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{language === "bn" ? "কোন গ্রুপ পাওয়া যায়নি" : "No groups found"}</p>
              <p className="text-sm mt-2">
                {language === "bn" 
                  ? "WhatsApp কানেক্ট করে সিঙ্ক করুন" 
                  : "Connect WhatsApp and sync"}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedGroup === group.id 
                        ? 'border-green-500 bg-green-500/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => {
                      setSelectedGroup(group.id);
                      fetchNumbers(group.group_name || undefined);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{group.group_name || "Unknown Group"}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {group.member_count} {language === "bn" ? "সদস্য" : "members"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {group.numbers_extracted} {language === "bn" ? "এক্সট্রাক্টেড" : "extracted"}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExtractNumbers(group.id, group.group_name || "");
                        }}
                        disabled={extracting === group.id}
                      >
                        {extracting === group.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Extracted Numbers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-green-500" />
                {language === "bn" ? "এক্সট্রাক্টেড নাম্বার" : "Extracted Numbers"}
                <Badge variant="secondary">{filteredNumbers.length}</Badge>
              </CardTitle>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyAllNumbers}
              disabled={filteredNumbers.length === 0}
            >
              <Copy className="h-4 w-4 mr-2" />
              {language === "bn" ? "সব কপি" : "Copy All"}
            </Button>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === "bn" ? "নাম্বার বা নাম খুঁজুন..." : "Search number or name..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredNumbers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{language === "bn" ? "কোন নাম্বার নেই" : "No numbers found"}</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredNumbers.map((num) => (
                  <div
                    key={num.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-500/10">
                        <Phone className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="font-mono text-sm">{num.phone_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {num.contact_name || num.source_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {num.has_whatsapp && (
                        <Badge variant="outline" className="text-green-500 border-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          WhatsApp
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyNumber(num.phone_number, num.id)}
                      >
                        {copiedNumbers.has(num.id) ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
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
  );
}
