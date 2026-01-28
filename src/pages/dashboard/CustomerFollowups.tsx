import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Users, 
  ShoppingBag, 
  MessageSquare, 
  RefreshCw, 
  Send, 
  Sparkles, 
  Phone,
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Facebook,
  Loader2,
  Package
} from "lucide-react";
import { format } from "date-fns";

const SUPABASE_URL = "https://klkrzfwvrmffqkmkyqrh.supabase.co";

function getAuthToken(): string | null {
  return localStorage.getItem("autofloy_token");
}

async function callEdgeFunction(path: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }
  
  return response.json();
}

interface CustomerFollowup {
  id: string;
  customer_fb_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  platform: string;
  has_purchased: boolean;
  total_messages: number;
  last_message_at: string | null;
  last_products_discussed: string[] | null;
  conversation_summary: string | null;
  followup_count: number;
  last_followup_at: string | null;
  status: string;
}

export default function CustomerFollowups() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [customers, setCustomers] = useState<CustomerFollowup[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  
  // Follow-up modal state
  const [followupModal, setFollowupModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerFollowup | null>(null);
  const [messageType, setMessageType] = useState("re-engage");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [newProductInfo, setNewProductInfo] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Conversation modal
  const [conversationModal, setConversationModal] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);

  // Bulk follow-up modal
  const [bulkModal, setBulkModal] = useState(false);

  const t = {
    title: language === "bn" ? "কাস্টমার ফলো-আপ" : "Customer Follow-ups",
    subtitle: language === "bn" ? "AI কাস্টমারদের সাথে ফলো-আপ করুন" : "Follow up with AI customers",
    sync: language === "bn" ? "সিঙ্ক করুন" : "Sync Customers",
    syncing: language === "bn" ? "সিঙ্ক হচ্ছে..." : "Syncing...",
    all: language === "bn" ? "সব কাস্টমার" : "All Customers",
    purchased: language === "bn" ? "কিনেছে" : "Purchased",
    notPurchased: language === "bn" ? "কেনেনি" : "Not Purchased",
    search: language === "bn" ? "নাম বা ফোন খুঁজুন..." : "Search name or phone...",
    noCustomers: language === "bn" ? "কোনো কাস্টমার পাওয়া যায়নি" : "No customers found",
    followUp: language === "bn" ? "ফলো-আপ" : "Follow Up",
    viewConversation: language === "bn" ? "কথোপকথন দেখুন" : "View Conversation",
    messages: language === "bn" ? "মেসেজ" : "messages",
    lastMessage: language === "bn" ? "শেষ মেসেজ" : "Last message",
    products: language === "bn" ? "আলোচিত প্রোডাক্ট" : "Discussed Products",
    generateMessage: language === "bn" ? "AI মেসেজ তৈরি করুন" : "Generate AI Message",
    sendSms: language === "bn" ? "SMS পাঠান" : "Send SMS",
    messageType: language === "bn" ? "মেসেজের ধরন" : "Message Type",
    reEngage: language === "bn" ? "পুনরায় যোগাযোগ" : "Re-engage",
    newProduct: language === "bn" ? "নতুন প্রোডাক্ট" : "New Product",
    thankYou: language === "bn" ? "ধন্যবাদ" : "Thank You",
    custom: language === "bn" ? "কাস্টম" : "Custom",
    newProductInfoLabel: language === "bn" ? "নতুন প্রোডাক্টের তথ্য" : "New Product Info",
    customPromptLabel: language === "bn" ? "কাস্টম প্রম্পট" : "Custom Prompt",
    generatedMessageLabel: language === "bn" ? "তৈরি মেসেজ" : "Generated Message",
    bulkFollowUp: language === "bn" ? "বাল্ক ফলো-আপ" : "Bulk Follow-up",
    selectedCount: language === "bn" ? "নির্বাচিত" : "Selected",
    noPhone: language === "bn" ? "ফোন নেই" : "No phone",
    followupsSent: language === "bn" ? "ফলো-আপ পাঠানো হয়েছে" : "Follow-ups sent",
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await callEdgeFunction("customer-followups", {
        method: "GET",
      });
      
      if (response.customers) {
        setCustomers(response.customers);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error(language === "bn" ? "কাস্টমার লোড করতে সমস্যা" : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const syncCustomers = async () => {
    setSyncing(true);
    try {
      const response = await callEdgeFunction("customer-followups/sync", {
        method: "POST",
      });
      
      toast.success(
        language === "bn" 
          ? `${response.synced} কাস্টমার সিঙ্ক হয়েছে` 
          : `${response.synced} customers synced`
      );
      
      await fetchCustomers();
    } catch (error) {
      console.error("Error syncing:", error);
      toast.error(language === "bn" ? "সিঙ্ক করতে সমস্যা" : "Failed to sync");
    } finally {
      setSyncing(false);
    }
  };

  const generateAIMessage = async () => {
    if (!selectedCustomer) return;
    setGenerating(true);
    try {
      const response = await callEdgeFunction("customer-followups/generate-message", {
        method: "POST",
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          messageType,
          newProductInfo: messageType === "new-product" ? newProductInfo : undefined,
          customPrompt: messageType === "custom" ? customPrompt : undefined,
        }),
      });
      
      setGeneratedMessage(response.message);
      toast.success(language === "bn" ? "মেসেজ তৈরি হয়েছে!" : "Message generated!");
    } catch (error) {
      console.error("Error generating message:", error);
      toast.error(language === "bn" ? "মেসেজ তৈরি করতে সমস্যা" : "Failed to generate message");
    } finally {
      setGenerating(false);
    }
  };

  const sendFollowupSms = async () => {
    if (!selectedCustomer || !generatedMessage) return;
    
    if (!selectedCustomer.customer_phone) {
      toast.error(language === "bn" ? "এই কাস্টমারের ফোন নম্বর নেই" : "This customer has no phone number");
      return;
    }

    setSending(true);
    try {
      // Use existing send-followup-sms function
      const response = await callEdgeFunction("send-followup-sms", {
        method: "POST",
        body: JSON.stringify({
          customers: [{
            customerName: selectedCustomer.customer_name || "Customer",
            customerPhone: selectedCustomer.customer_phone,
            message: generatedMessage,
          }]
        }),
      });
      
      if (response.success) {
        toast.success(language === "bn" ? "SMS পাঠানো হয়েছে!" : "SMS sent successfully!");
        setFollowupModal(false);
        setGeneratedMessage("");
        fetchCustomers(); // Refresh to update followup count
      } else {
        throw new Error(response.message || "Failed to send");
      }
    } catch (error: any) {
      console.error("Error sending SMS:", error);
      toast.error(error.message || (language === "bn" ? "SMS পাঠাতে সমস্যা" : "Failed to send SMS"));
    } finally {
      setSending(false);
    }
  };

  const viewConversation = async (customer: CustomerFollowup) => {
    setSelectedCustomer(customer);
    setConversationModal(true);
    setLoadingConversation(true);
    
    try {
      const response = await callEdgeFunction("customer-followups/conversation", {
        method: "POST",
        body: JSON.stringify({ customerFbId: customer.customer_fb_id }),
      });
      
      setConversationHistory(response.conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      toast.error(language === "bn" ? "কথোপকথন লোড করতে সমস্যা" : "Failed to load conversation");
    } finally {
      setLoadingConversation(false);
    }
  };

  const openFollowupModal = (customer: CustomerFollowup) => {
    setSelectedCustomer(customer);
    setFollowupModal(true);
    setGeneratedMessage("");
    setMessageType(customer.has_purchased ? "thank-you" : "re-engage");
  };

  const toggleCustomerSelection = (id: string) => {
    setSelectedCustomers(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = filteredCustomers.filter(c => c.customer_phone).map(c => c.id);
    setSelectedCustomers(visibleIds);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      (customer.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (customer.customer_phone?.includes(searchTerm) || false);
    
    const matchesTab = 
      activeTab === "all" ||
      (activeTab === "purchased" && customer.has_purchased) ||
      (activeTab === "not-purchased" && !customer.has_purchased);
    
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: customers.length,
    purchased: customers.filter(c => c.has_purchased).length,
    notPurchased: customers.filter(c => !c.has_purchased).length,
    withPhone: customers.filter(c => c.customer_phone).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t.title}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={syncCustomers} 
              disabled={syncing}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? t.syncing : t.sync}
            </Button>
            {selectedCustomers.length > 0 && (
              <Button onClick={() => setBulkModal(true)}>
                <Send className="h-4 w-4 mr-2" />
                {t.bulkFollowUp} ({selectedCustomers.length})
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">{t.all}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <ShoppingBag className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.purchased}</p>
                  <p className="text-xs text-muted-foreground">{t.purchased}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.notPurchased}</p>
                  <p className="text-xs text-muted-foreground">{t.notPurchased}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.withPhone}</p>
                  <p className="text-xs text-muted-foreground">{language === "bn" ? "ফোন আছে" : "Have Phone"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                <TabsList>
                  <TabsTrigger value="all">{t.all}</TabsTrigger>
                  <TabsTrigger value="purchased" className="text-green-600 dark:text-green-400">{t.purchased}</TabsTrigger>
                  <TabsTrigger value="not-purchased" className="text-orange-600 dark:text-orange-400">{t.notPurchased}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Customer List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              {language === "bn" ? "কাস্টমার তালিকা" : "Customer List"} 
              <span className="text-muted-foreground ml-2">({filteredCustomers.length})</span>
            </CardTitle>
            {filteredCustomers.some(c => c.customer_phone) && (
              <Button variant="ghost" size="sm" onClick={selectAllVisible}>
                {language === "bn" ? "সব সিলেক্ট করুন" : "Select All"}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t.noCustomers}</p>
                <Button onClick={syncCustomers} variant="outline" className="mt-4">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t.sync}
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      {customer.customer_phone && (
                        <Checkbox
                          checked={selectedCustomers.includes(customer.id)}
                          onCheckedChange={() => toggleCustomerSelection(customer.id)}
                        />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium truncate">
                            {customer.customer_name || "Unknown Customer"}
                          </h4>
                          <Badge variant={customer.has_purchased ? "default" : "secondary"}>
                            {customer.has_purchased ? (
                              <><CheckCircle2 className="h-3 w-3 mr-1" /> {t.purchased}</>
                            ) : (
                              <><Clock className="h-3 w-3 mr-1" /> {t.notPurchased}</>
                            )}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Facebook className="h-3 w-3 mr-1" />
                            {customer.platform}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                          {customer.customer_phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {customer.customer_phone}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                              <XCircle className="h-3 w-3" />
                              {t.noPhone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {customer.total_messages} {t.messages}
                          </span>
                          {customer.last_message_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(customer.last_message_at), "dd MMM yyyy")}
                            </span>
                          )}
                        </div>
                        
                        {customer.last_products_discussed && customer.last_products_discussed.length > 0 && (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Package className="h-3 w-3 text-muted-foreground" />
                            {customer.last_products_discussed.slice(0, 3).map((product, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {product}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {customer.followup_count > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {t.followupsSent}: {customer.followup_count}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewConversation(customer)}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openFollowupModal(customer)}
                          disabled={!customer.customer_phone}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          {t.followUp}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Follow-up Modal */}
        <Dialog open={followupModal} onOpenChange={setFollowupModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {t.followUp}: {selectedCustomer?.customer_name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t.messageType}</label>
                <Select value={messageType} onValueChange={setMessageType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="re-engage">{t.reEngage}</SelectItem>
                    <SelectItem value="new-product">{t.newProduct}</SelectItem>
                    <SelectItem value="thank-you">{t.thankYou}</SelectItem>
                    <SelectItem value="custom">{t.custom}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {messageType === "new-product" && (
                <div>
                  <label className="text-sm font-medium">{t.newProductInfoLabel}</label>
                  <Textarea
                    value={newProductInfo}
                    onChange={(e) => setNewProductInfo(e.target.value)}
                    placeholder={language === "bn" ? "নতুন প্রোডাক্টের বিবরণ লিখুন..." : "Describe the new product..."}
                    rows={2}
                  />
                </div>
              )}
              
              {messageType === "custom" && (
                <div>
                  <label className="text-sm font-medium">{t.customPromptLabel}</label>
                  <Textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={language === "bn" ? "কি ধরনের মেসেজ চান লিখুন..." : "Describe what kind of message you want..."}
                    rows={2}
                  />
                </div>
              )}
              
              <Button 
                onClick={generateAIMessage} 
                disabled={generating}
                className="w-full"
                variant="outline"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {t.generateMessage}
              </Button>
              
              {generatedMessage && (
                <div>
                  <label className="text-sm font-medium">{t.generatedMessageLabel}</label>
                  <Textarea
                    value={generatedMessage}
                    onChange={(e) => setGeneratedMessage(e.target.value)}
                    rows={4}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setFollowupModal(false)}>
                {language === "bn" ? "বাতিল" : "Cancel"}
              </Button>
              <Button 
                onClick={sendFollowupSms}
                disabled={!generatedMessage || sending}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {t.sendSms}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Conversation Modal */}
        <Dialog open={conversationModal} onOpenChange={setConversationModal}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                {t.viewConversation}: {selectedCustomer?.customer_name}
              </DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="h-[400px]">
              {loadingConversation ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : conversationHistory ? (
                <div className="space-y-4">
                  {conversationHistory.customer_summary && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">
                        {language === "bn" ? "কাস্টমার সারাংশ" : "Customer Summary"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {conversationHistory.customer_summary}
                      </p>
                    </div>
                  )}
                  
                  {conversationHistory.message_history && (
                    <div className="space-y-2">
                      <h4 className="font-medium">
                        {language === "bn" ? "মেসেজ হিস্ট্রি" : "Message History"}
                      </h4>
                      {(conversationHistory.message_history as any[]).slice(-20).map((msg: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg max-w-[80%] ${
                            msg.role === "assistant"
                              ? "bg-primary/10 ml-auto"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {msg.role === "assistant" ? "AI" : "Customer"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  {language === "bn" ? "কোনো কথোপকথন পাওয়া যায়নি" : "No conversation found"}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Bulk Follow-up Modal */}
        <Dialog open={bulkModal} onOpenChange={setBulkModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t.bulkFollowUp} ({selectedCustomers.length} {t.selectedCount})
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {language === "bn" 
                  ? `${selectedCustomers.length} জন কাস্টমারকে ফলো-আপ SMS পাঠাতে চান?`
                  : `Send follow-up SMS to ${selectedCustomers.length} customers?`
                }
              </p>
              
              <div>
                <label className="text-sm font-medium">{t.messageType}</label>
                <Select value={messageType} onValueChange={setMessageType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="re-engage">{t.reEngage}</SelectItem>
                    <SelectItem value="new-product">{t.newProduct}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {messageType === "new-product" && (
                <div>
                  <label className="text-sm font-medium">{t.newProductInfoLabel}</label>
                  <Textarea
                    value={newProductInfo}
                    onChange={(e) => setNewProductInfo(e.target.value)}
                    placeholder={language === "bn" ? "নতুন প্রোডাক্টের বিবরণ..." : "New product description..."}
                    rows={3}
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkModal(false)}>
                {language === "bn" ? "বাতিল" : "Cancel"}
              </Button>
              <Button onClick={() => {
                toast.info(language === "bn" ? "বাল্ক ফলো-আপ শীঘ্রই আসছে!" : "Bulk follow-up coming soon!");
                setBulkModal(false);
              }}>
                <Send className="h-4 w-4 mr-2" />
                {t.sendSms}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
