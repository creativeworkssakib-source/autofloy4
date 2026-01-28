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
import { Progress } from "@/components/ui/progress";
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
  Package,
  Instagram,
  MessageCircle,
  Filter
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

interface BulkFollowupResult {
  customerId: string;
  customerFbId: string;
  customerName: string;
  message: string;
  platform: string;
  status: 'pending' | 'generating' | 'generated' | 'sending' | 'sent' | 'error';
  error?: string;
}

// Platform icon component
const PlatformIcon = ({ platform, className = "h-4 w-4" }: { platform: string; className?: string }) => {
  switch (platform.toLowerCase()) {
    case 'facebook':
      return <Facebook className={`${className} text-blue-600`} />;
    case 'instagram':
      return <Instagram className={`${className} text-pink-600`} />;
    case 'whatsapp':
      return <MessageCircle className={`${className} text-green-600`} />;
    default:
      return <MessageSquare className={`${className} text-muted-foreground`} />;
  }
};

// Platform badge colors
const getPlatformBadgeClass = (platform: string): string => {
  switch (platform.toLowerCase()) {
    case 'facebook':
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    case 'instagram':
      return 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800';
    case 'whatsapp':
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function CustomerFollowups() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [customers, setCustomers] = useState<CustomerFollowup[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [purchaseFilter, setPurchaseFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
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
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkFollowupResult[]>([]);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkStep, setBulkStep] = useState<'config' | 'generating' | 'review' | 'sending' | 'done'>('config');

  const t = {
    title: language === "bn" ? "কাস্টমার ফলো-আপ" : "Customer Follow-ups",
    subtitle: language === "bn" ? "AI কাস্টমারদের সাথে ফলো-আপ করুন - সব প্ল্যাটফর্ম" : "Follow up with AI customers - All Platforms",
    sync: language === "bn" ? "সিঙ্ক করুন" : "Sync Customers",
    syncing: language === "bn" ? "সিঙ্ক হচ্ছে..." : "Syncing...",
    all: language === "bn" ? "সব" : "All",
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
    bulkFollowUp: language === "bn" ? "ইনবক্সে মেসেজ পাঠান" : "Send to Inbox",
    selectedCount: language === "bn" ? "নির্বাচিত" : "Selected",
    noPhone: language === "bn" ? "ফোন নেই" : "No phone",
    followupsSent: language === "bn" ? "ফলো-আপ পাঠানো হয়েছে" : "Follow-ups sent",
    facebook: "Facebook",
    instagram: "Instagram",
    whatsapp: "WhatsApp",
    allPlatforms: language === "bn" ? "সব প্ল্যাটফর্ম" : "All Platforms",
    generatingMessages: language === "bn" ? "AI মেসেজ তৈরি হচ্ছে..." : "Generating AI messages...",
    reviewMessages: language === "bn" ? "মেসেজ রিভিউ করুন" : "Review Messages",
    sendAll: language === "bn" ? "সব ইনবক্সে পাঠান" : "Send All to Inbox",
    generating: language === "bn" ? "তৈরি হচ্ছে" : "Generating",
    generated: language === "bn" ? "তৈরি" : "Generated",
    pending: language === "bn" ? "অপেক্ষায়" : "Pending",
    error: language === "bn" ? "ত্রুটি" : "Error",
    sent: language === "bn" ? "পাঠানো হয়েছে" : "Sent",
    startBulkAI: language === "bn" ? "AI মেসেজ তৈরি করুন" : "Generate AI Messages",
    aiWillRead: language === "bn" ? "AI প্রতিটি কাস্টমারের কথোপকথন পড়ে পার্সোনালাইজড মেসেজ তৈরি করবে এবং তাদের ইনবক্সে পাঠাবে (ফোন নম্বর লাগবে না)" : "AI will read each customer's conversation, create personalized messages, and send directly to their inbox (no phone number needed)",
    selectPlatform: language === "bn" ? "প্ল্যাটফর্ম সিলেক্ট করুন" : "Select Platform",
    sendToInbox: language === "bn" ? "ইনবক্সে পাঠান" : "Send to Inbox",
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

  const sendFollowupToInbox = async () => {
    if (!selectedCustomer || !generatedMessage) return;

    setSending(true);
    try {
      const response = await callEdgeFunction("send-inbox-message", {
        method: "POST",
        body: JSON.stringify({
          customers: [{
            customerId: selectedCustomer.id,
            customerFbId: selectedCustomer.customer_fb_id,
            customerName: selectedCustomer.customer_name || "Customer",
            message: generatedMessage,
            platform: selectedCustomer.platform
          }]
        }),
      });
      
      if (response.success && response.totalSent > 0) {
        toast.success(language === "bn" ? "মেসেজ ইনবক্সে পাঠানো হয়েছে!" : "Message sent to inbox!");
        setFollowupModal(false);
        setGeneratedMessage("");
        fetchCustomers();
      } else {
        const errorMsg = response.results?.[0]?.error || response.message || "Failed to send";
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error("Error sending to inbox:", error);
      toast.error(error.message || (language === "bn" ? "মেসেজ পাঠাতে সমস্যা" : "Failed to send message"));
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
    // Select all visible customers regardless of phone number (since we send to inbox now)
    const visibleIds = filteredCustomers.map(c => c.id);
    const allSelected = visibleIds.every(id => selectedCustomers.includes(id));
    
    if (allSelected) {
      setSelectedCustomers(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedCustomers(prev => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const selectByPlatform = (platform: string) => {
    // Select all customers of this platform regardless of phone number
    const platformIds = customers
      .filter(c => c.platform.toLowerCase() === platform.toLowerCase())
      .map(c => c.id);
    
    const allSelected = platformIds.every(id => selectedCustomers.includes(id));
    
    if (allSelected) {
      setSelectedCustomers(prev => prev.filter(id => !platformIds.includes(id)));
    } else {
      setSelectedCustomers(prev => [...new Set([...prev, ...platformIds])]);
    }
  };

  // Bulk AI follow-up handler
  const startBulkAIFollowup = async () => {
    setBulkStep('generating');
    setBulkProcessing(true);
    setBulkProgress(0);
    
    const selectedCustomersList = customers.filter(c => selectedCustomers.includes(c.id));
    const results: BulkFollowupResult[] = selectedCustomersList.map(c => ({
      customerId: c.id,
      customerFbId: c.customer_fb_id,
      customerName: c.customer_name || 'Unknown',
      message: '',
      platform: c.platform,
      status: 'pending'
    }));
    setBulkResults(results);
    
    // Generate messages one by one with progress
    for (let i = 0; i < selectedCustomersList.length; i++) {
      const customer = selectedCustomersList[i];
      
      setBulkResults(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: 'generating' } : r
      ));
      
      try {
        const response = await callEdgeFunction("customer-followups/generate-message", {
          method: "POST",
          body: JSON.stringify({
            customerId: customer.id,
            messageType: customer.has_purchased ? "thank-you" : "re-engage",
            newProductInfo: messageType === "new-product" ? newProductInfo : undefined,
          }),
        });
        
        setBulkResults(prev => prev.map((r, idx) => 
          idx === i ? { ...r, status: 'generated', message: response.message } : r
        ));
      } catch (error: any) {
        setBulkResults(prev => prev.map((r, idx) => 
          idx === i ? { ...r, status: 'error', error: error.message } : r
        ));
      }
      
      setBulkProgress(((i + 1) / selectedCustomersList.length) * 100);
    }
    
    setBulkProcessing(false);
    setBulkStep('review');
  };

  const sendBulkMessages = async () => {
    setBulkStep('sending');
    setBulkProcessing(true);
    setBulkProgress(0);
    
    const toSend = bulkResults.filter(r => r.status === 'generated' && r.message);
    
    // Prepare all customers for sending to inbox
    const customersToSend = toSend.map(result => ({
      customerId: result.customerId,
      customerFbId: result.customerFbId,
      customerName: result.customerName,
      message: result.message,
      platform: result.platform
    }));

    try {
      // Send all messages via inbox API
      const response = await callEdgeFunction("send-inbox-message", {
        method: "POST",
        body: JSON.stringify({ customers: customersToSend }),
      });

      // Update results based on API response
      if (response.results) {
        setBulkResults(prev => prev.map(r => {
          const apiResult = response.results.find((ar: any) => ar.customerId === r.customerId);
          if (apiResult) {
            return {
              ...r,
              status: apiResult.success ? 'sent' : 'error',
              error: apiResult.error
            };
          }
          return r;
        }));
      }

      setBulkProgress(100);
      toast.success(
        language === "bn" 
          ? `${response.totalSent} মেসেজ ইনবক্সে পাঠানো হয়েছে!` 
          : `${response.totalSent} messages sent to inbox!`
      );
    } catch (error: any) {
      console.error("Error sending bulk messages:", error);
      toast.error(error.message || (language === "bn" ? "মেসেজ পাঠাতে সমস্যা" : "Failed to send messages"));
      
      // Mark all as error
      setBulkResults(prev => prev.map(r => 
        r.status === 'generated' ? { ...r, status: 'error', error: error.message } : r
      ));
    }
    
    setBulkProcessing(false);
    setBulkStep('done');
    fetchCustomers();
  };

  const closeBulkModal = () => {
    setBulkModal(false);
    setBulkStep('config');
    setBulkResults([]);
    setBulkProgress(0);
    setSelectedCustomers([]);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer => {
    // If no search term, match all. Otherwise check name/phone/fb_id
    const matchesSearch = searchTerm.trim() === "" || 
      (customer.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (customer.customer_phone?.includes(searchTerm) ?? false) ||
      (customer.customer_fb_id?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesPurchase = 
      purchaseFilter === "all" ||
      (purchaseFilter === "purchased" && customer.has_purchased) ||
      (purchaseFilter === "not-purchased" && !customer.has_purchased);
    
    const matchesPlatform = 
      platformFilter === "all" ||
      customer.platform.toLowerCase() === platformFilter.toLowerCase();
    
    return matchesSearch && matchesPurchase && matchesPlatform;
  });

  // Platform stats - count from filtered customers to match visible list
  const platformStats = {
    facebook: filteredCustomers.filter(c => c.platform.toLowerCase() === 'facebook').length,
    instagram: filteredCustomers.filter(c => c.platform.toLowerCase() === 'instagram').length,
    whatsapp: filteredCustomers.filter(c => c.platform.toLowerCase() === 'whatsapp').length,
  };

  // Total platform stats (unfiltered) for quick select buttons
  const totalPlatformStats = {
    facebook: customers.filter(c => c.platform.toLowerCase() === 'facebook').length,
    instagram: customers.filter(c => c.platform.toLowerCase() === 'instagram').length,
    whatsapp: customers.filter(c => c.platform.toLowerCase() === 'whatsapp').length,
  };

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
              <Button onClick={() => setBulkModal(true)} className="bg-gradient-to-r from-primary to-blue-600">
                <Sparkles className="h-4 w-4 mr-2" />
                {t.bulkFollowUp} ({selectedCustomers.length})
              </Button>
            )}
          </div>
        </div>

        {/* Platform Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
          <Card className="col-span-1">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg shrink-0">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t.all}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${platformFilter === 'facebook' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setPlatformFilter(platformFilter === 'facebook' ? 'all' : 'facebook')}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg shrink-0">
                  <Facebook className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold">{platformStats.facebook}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Facebook</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${platformFilter === 'instagram' ? 'ring-2 ring-pink-500' : ''}`}
            onClick={() => setPlatformFilter(platformFilter === 'instagram' ? 'all' : 'instagram')}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-pink-500/10 rounded-lg shrink-0">
                  <Instagram className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold">{platformStats.instagram}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Instagram</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${platformFilter === 'whatsapp' ? 'ring-2 ring-green-500' : ''}`}
            onClick={() => setPlatformFilter(platformFilter === 'whatsapp' ? 'all' : 'whatsapp')}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-green-500/10 rounded-lg shrink-0">
                  <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold">{platformStats.whatsapp}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">WhatsApp</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-green-500/10 rounded-lg shrink-0">
                  <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold">{stats.purchased}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t.purchased}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-orange-500/10 rounded-lg shrink-0">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold">{stats.notPurchased}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{t.notPurchased}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg shrink-0">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold">{stats.withPhone}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{language === "bn" ? "ফোন আছে" : "Have Phone"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {/* Purchase Filter */}
                <Tabs value={purchaseFilter} onValueChange={setPurchaseFilter}>
                  <TabsList>
                    <TabsTrigger value="all">{t.all}</TabsTrigger>
                    <TabsTrigger value="purchased" className="text-green-600">{t.purchased}</TabsTrigger>
                    <TabsTrigger value="not-purchased" className="text-orange-600">{t.notPurchased}</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {/* Platform Filter Dropdown */}
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="w-[160px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder={t.selectPlatform} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> {t.allPlatforms}
                      </span>
                    </SelectItem>
                    <SelectItem value="facebook">
                      <span className="flex items-center gap-2">
                        <Facebook className="h-4 w-4 text-blue-600" /> Facebook
                      </span>
                    </SelectItem>
                    <SelectItem value="instagram">
                      <span className="flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-pink-600" /> Instagram
                      </span>
                    </SelectItem>
                    <SelectItem value="whatsapp">
                      <span className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-green-600" /> WhatsApp
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Quick Select Buttons */}
            {customers.length > 0 && (
              <div className="flex gap-2 mt-4 flex-wrap">
                <Button variant="outline" size="sm" onClick={selectAllVisible}>
                  {language === "bn" ? "সব সিলেক্ট করুন" : "Select All"}
                </Button>
                {totalPlatformStats.facebook > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => selectByPlatform('facebook')}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Facebook className="h-3 w-3 mr-1" />
                    Facebook ({totalPlatformStats.facebook})
                  </Button>
                )}
                {totalPlatformStats.instagram > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => selectByPlatform('instagram')}
                    className="text-pink-600 border-pink-200 hover:bg-pink-50"
                  >
                    <Instagram className="h-3 w-3 mr-1" />
                    Instagram ({totalPlatformStats.instagram})
                  </Button>
                )}
                {totalPlatformStats.whatsapp > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => selectByPlatform('whatsapp')}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    WhatsApp ({totalPlatformStats.whatsapp})
                  </Button>
                )}
                {selectedCustomers.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedCustomers([])}
                    className="text-destructive"
                  >
                    {language === "bn" ? "সব বাতিল করুন" : "Clear Selection"}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              {language === "bn" ? "কাস্টমার তালিকা" : "Customer List"} 
              <span className="text-muted-foreground ml-2">({filteredCustomers.length})</span>
              {selectedCustomers.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedCustomers.length} {t.selectedCount}
                </Badge>
              )}
            </CardTitle>
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
                      className={`p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors ${
                        selectedCustomers.includes(customer.id) ? 'ring-2 ring-primary bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Checkbox
                          checked={selectedCustomers.includes(customer.id)}
                          onCheckedChange={() => toggleCustomerSelection(customer.id)}
                          className="mt-1 shrink-0"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start sm:items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-sm sm:text-base truncate">
                                {customer.customer_name || "Unknown Customer"}
                              </h4>
                              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                <Badge 
                                  variant={customer.has_purchased ? "default" : "secondary"}
                                  className="text-[10px] sm:text-xs px-1.5 py-0"
                                >
                                  {customer.has_purchased ? (
                                    <><CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5" /> {t.purchased}</>
                                  ) : (
                                    <><Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5" /> {t.notPurchased}</>
                                  )}
                                </Badge>
                                <Badge variant="outline" className={`text-[10px] sm:text-xs px-1.5 py-0 ${getPlatformBadgeClass(customer.platform)}`}>
                                  <PlatformIcon platform={customer.platform} className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5" />
                                  {customer.platform}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Action buttons - visible on larger screens */}
                            <div className="hidden sm:flex gap-2 shrink-0">
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
                              >
                                <Send className="h-4 w-4 mr-1" />
                                {t.sendToInbox}
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                            {customer.customer_phone ? (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3 shrink-0" />
                                <span className="truncate max-w-[100px] sm:max-w-none">{customer.customer_phone}</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-orange-600">
                                <XCircle className="h-3 w-3 shrink-0" />
                                {t.noPhone}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3 shrink-0" />
                              {customer.total_messages} {t.messages}
                            </span>
                            {customer.last_message_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 shrink-0" />
                                {format(new Date(customer.last_message_at), "dd MMM yyyy")}
                              </span>
                            )}
                          </div>
                          
                          {customer.last_products_discussed && customer.last_products_discussed.length > 0 && (
                            <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
                              <Package className="h-3 w-3 text-muted-foreground shrink-0" />
                              {customer.last_products_discussed.slice(0, 2).map((product, idx) => (
                                <Badge key={idx} variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0 truncate max-w-[80px] sm:max-w-none">
                                  {product}
                                </Badge>
                              ))}
                              {customer.last_products_discussed.length > 2 && (
                                <span className="text-[10px] sm:text-xs text-muted-foreground">
                                  +{customer.last_products_discussed.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {customer.followup_count > 0 && (
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                              {t.followupsSent}: {customer.followup_count}
                            </p>
                          )}
                          
                          {/* Action buttons - Mobile only */}
                          <div className="flex sm:hidden gap-2 mt-3 pt-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewConversation(customer)}
                              className="flex-1 h-8 text-xs"
                            >
                              <MessageSquare className="h-3.5 w-3.5 mr-1" />
                              {language === "bn" ? "কথোপকথন" : "Chat"}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => openFollowupModal(customer)}
                              className="flex-1 h-8 text-xs"
                            >
                              <Send className="h-3.5 w-3.5 mr-1" />
                              {t.sendToInbox}
                              {t.followUp}
                            </Button>
                          </div>
                        </div>
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
                onClick={sendFollowupToInbox}
                disabled={!generatedMessage || sending}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {t.sendToInbox}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Conversation Modal */}
        <Dialog open={conversationModal} onOpenChange={setConversationModal}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedCustomer && (
                  <PlatformIcon platform={selectedCustomer.platform} className="h-5 w-5" />
                )}
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

        {/* Bulk AI Follow-up Modal */}
        <Dialog open={bulkModal} onOpenChange={closeBulkModal}>
          <DialogContent className="max-w-3xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {t.bulkFollowUp} ({selectedCustomers.length} {t.selectedCount})
              </DialogTitle>
            </DialogHeader>
            
            {bulkStep === 'config' && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {t.aiWillRead}
                  </p>
                </div>
                
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
                
                {/* Selected customers preview */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {language === "bn" ? "নির্বাচিত কাস্টমার" : "Selected Customers"}
                  </label>
                  <ScrollArea className="h-[150px] border rounded-lg p-2">
                    <div className="space-y-1">
                      {customers.filter(c => selectedCustomers.includes(c.id)).map(c => (
                        <div key={c.id} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50">
                          <PlatformIcon platform={c.platform} className="h-4 w-4" />
                          <span className="flex-1 truncate">{c.customer_name || 'Unknown'}</span>
                          <span className="text-muted-foreground">{c.customer_phone}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
            
            {(bulkStep === 'generating' || bulkStep === 'sending') && (
              <div className="space-y-4 py-8">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium">
                    {bulkStep === 'generating' ? t.generatingMessages : (language === "bn" ? "SMS পাঠানো হচ্ছে..." : "Sending SMS...")}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {Math.round(bulkProgress)}% ({language === "bn" ? "সম্পন্ন" : "complete"})
                  </p>
                </div>
                <Progress value={bulkProgress} className="h-2" />
              </div>
            )}
            
            {(bulkStep === 'review' || bulkStep === 'done') && (
              <div className="space-y-4">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {bulkResults.map((result, idx) => {
                      const customer = customers.find(c => c.id === result.customerId);
                      return (
                        <div key={result.customerId} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {customer && <PlatformIcon platform={customer.platform} className="h-4 w-4" />}
                              <span className="font-medium">{result.customerName}</span>
                            </div>
                            <Badge variant={
                              result.status === 'sent' ? 'default' :
                              result.status === 'generated' ? 'secondary' :
                              result.status === 'error' ? 'destructive' : 'outline'
                            }>
                              {result.status === 'generated' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              {result.status === 'sent' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                              {result.status === 'error' && <XCircle className="h-3 w-3 mr-1" />}
                              {result.status === 'generating' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                              {result.status}
                            </Badge>
                          </div>
                          {result.message && (
                            <Textarea
                              value={result.message}
                              onChange={(e) => {
                                setBulkResults(prev => prev.map((r, i) => 
                                  i === idx ? { ...r, message: e.target.value } : r
                                ));
                              }}
                              rows={3}
                              disabled={bulkStep === 'done'}
                              className="text-sm"
                            />
                          )}
                          {result.error && (
                            <p className="text-sm text-destructive mt-1">{result.error}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={closeBulkModal}>
                {bulkStep === 'done' ? (language === "bn" ? "বন্ধ করুন" : "Close") : (language === "bn" ? "বাতিল" : "Cancel")}
              </Button>
              
              {bulkStep === 'config' && (
                <Button onClick={startBulkAIFollowup} disabled={bulkProcessing}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t.startBulkAI}
                </Button>
              )}
              
              {bulkStep === 'review' && (
                <Button onClick={sendBulkMessages} disabled={bulkProcessing || bulkResults.filter(r => r.status === 'generated').length === 0}>
                  <Send className="h-4 w-4 mr-2" />
                  {t.sendAll} ({bulkResults.filter(r => r.status === 'generated').length})
                </Button>
              )}
              
              {bulkStep === 'done' && (
                <Badge variant="default" className="text-sm py-2 px-4">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {bulkResults.filter(r => r.status === 'sent').length} {t.sent}
                </Badge>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
