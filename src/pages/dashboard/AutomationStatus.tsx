import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchConnectedAccounts, 
  fetchProducts,
  ConnectedAccount,
  PageMemory 
} from "@/services/apiService";
import { supabase } from "@/integrations/supabase/client";
import {
  AutomationChecklist,
  AutomationSimulator,
  AutomationControlSummary,
  AutomationWarnings,
  PageStatusBadge,
  getAutomationStatus,
} from "@/components/automations/status";
import { 
  Activity, 
  Facebook, 
  RefreshCw,
  ArrowLeft,
  Settings,
  ExternalLink
} from "lucide-react";

interface PageStatusData {
  page: ConnectedAccount;
  memory: PageMemory | null;
  hasProducts: boolean;
}

const AutomationStatus = () => {
  const navigate = useNavigate();
  const { pageId: urlPageId } = useParams<{ pageId?: string }>();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectedPages, setConnectedPages] = useState<ConnectedAccount[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [pageStatusData, setPageStatusData] = useState<PageStatusData | null>(null);
  const [productCount, setProductCount] = useState(0);

  // Load page memory for a specific page with retry
  const loadPageMemory = async (pageId: string, pages: ConnectedAccount[], prodCount: number, retryCount = 0) => {
    const MAX_RETRIES = 3;
    
    try {
      const page = pages.find(p => p.external_id === pageId);
      if (!page) {
        console.log("[AutomationStatus] Page not found:", pageId);
        return;
      }

      console.log("[AutomationStatus] Loading page memory for:", pageId, "attempt:", retryCount + 1);
      
      const token = localStorage.getItem("autofloy_token");
      const response = await fetch(
        `https://klkrzfwvrmffqkmkyqrh.supabase.co/functions/v1/page-memory?page_id=${pageId}&_t=${Date.now()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );
      
      if (!response.ok) {
        console.error("[AutomationStatus] Fetch failed:", response.status);
        if (retryCount < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
          return loadPageMemory(pageId, pages, prodCount, retryCount + 1);
        }
        return;
      }
      
      const data = await response.json();
      console.log("[AutomationStatus] Raw response:", data);
      
      // Handle both array and object response from edge function
      const memories = data?.memories;
      const memory = Array.isArray(memories) 
        ? memories.find((m: { page_id: string }) => m.page_id === pageId)
        : memories;
      
      console.log("[AutomationStatus] Parsed memory:", {
        hasMemory: !!memory,
        businessDescription: memory?.business_description,
        automationSettings: memory?.automation_settings,
        sellingRules: memory?.selling_rules,
        paymentRules: memory?.payment_rules,
      });
      
      setPageStatusData({
        page,
        memory: memory || null,
        hasProducts: prodCount > 0,
      });
    } catch (error) {
      console.error("Failed to load page memory:", error);
      // Retry on network error
      if (retryCount < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
        return loadPageMemory(pageId, pages, prodCount, retryCount + 1);
      }
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [accounts, productsData] = await Promise.all([
        fetchConnectedAccounts("facebook"),
        fetchProducts(),
      ]);

      const enabledPages = accounts.filter(a => a.is_connected);
      const prodCount = productsData.products?.length || 0;
      
      setConnectedPages(enabledPages);
      setProductCount(prodCount);

      // Determine which page to load
      let pageIdToLoad: string | null = null;
      if (urlPageId && enabledPages.some(p => p.external_id === urlPageId)) {
        pageIdToLoad = urlPageId;
      } else if (enabledPages.length > 0) {
        pageIdToLoad = enabledPages[0].external_id;
      }
      
      if (pageIdToLoad) {
        setSelectedPageId(pageIdToLoad);
        // Load page memory with current values directly
        await loadPageMemory(pageIdToLoad, enabledPages, prodCount);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error",
        description: "Failed to load automation data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // When page selection changes manually (user clicks dropdown), reload page memory
  useEffect(() => {
    if (selectedPageId && connectedPages.length > 0 && !isLoading) {
      loadPageMemory(selectedPageId, connectedPages, productCount);
    }
  }, [selectedPageId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Automation status updated",
    });
  };

  // Derive status from data
  const deriveChecklistStatus = () => {
    if (!pageStatusData) {
      return {
        isConnected: connectedPages.length > 0,
        isPageSelected: false,
        hasBusinessInfo: false,
        hasAutomationsEnabled: false,
        hasPricingRules: false,
      };
    }

    const { page, memory } = pageStatusData;
    const settings = memory?.automation_settings as Record<string, boolean> || {};
    const hasAnyToggle = Object.values(settings).some(v => v === true);

    return {
      isConnected: true,
      isPageSelected: page.is_connected,
      hasBusinessInfo: !!(memory?.business_description && memory.business_description.length > 10),
      hasAutomationsEnabled: hasAnyToggle,
      hasPricingRules: !!(memory?.selling_rules || memory?.payment_rules),
    };
  };

  const checklistStatus = deriveChecklistStatus();
  const allChecksComplete = Object.values(checklistStatus).every(v => v);

  // Get automation settings for simulator
  const automationSettings = pageStatusData?.memory?.automation_settings as Record<string, boolean> || {};

  // Get page status
  const pageStatus = pageStatusData 
    ? getAutomationStatus(
        checklistStatus.isConnected,
        checklistStatus.hasBusinessInfo,
        checklistStatus.hasAutomationsEnabled
      )
    : "not_connected";

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container max-w-5xl py-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[300px]" />
          </div>
          <Skeleton className="h-[200px]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-5xl py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center gap-4"
        >
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard/automations")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary" />
                Automation Status
              </h1>
              <p className="text-sm text-muted-foreground">
                Verify your automation setup and test AI responses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Page Selector */}
        {connectedPages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-[#1877F2]/10">
                      <Facebook className="h-5 w-5 text-[#1877F2]" />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium">Select Page</label>
                    <Select value={selectedPageId} onValueChange={setSelectedPageId}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose a page" />
                        </SelectTrigger>
                        <SelectContent>
                          {connectedPages.map((page) => (
                            <SelectItem 
                              key={page.external_id} 
                              value={page.external_id}
                            >
                              {page.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {pageStatusData && (
                    <div className="flex items-center gap-3">
                      <PageStatusBadge status={pageStatus} size="lg" />
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => navigate(`/dashboard/facebook-settings/${pageStatusData.page.external_id}/${pageStatusData.page.id}`)}
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* No Pages Connected */}
        {connectedPages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Facebook className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Facebook Pages Connected</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Connect your Facebook pages to enable AI automation
                </p>
                <Button onClick={() => navigate("/connect-facebook")} className="gap-2">
                  <Facebook className="h-4 w-4" />
                  Connect Facebook
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Content Grid */}
        {connectedPages.length > 0 && pageStatusData && (
          <>
            {/* Warnings Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <AutomationWarnings
                isConnected={checklistStatus.isConnected}
                hasBusinessDescription={checklistStatus.hasBusinessInfo}
                hasProducts={productCount > 0}
                hasAutomationsEnabled={checklistStatus.hasAutomationsEnabled}
                onNavigate={(path) => {
                  // Handle relative paths for page settings
                  if (path.includes("facebook-settings") && pageStatusData) {
                    navigate(`/dashboard/facebook-settings/${pageStatusData.page.external_id}/${pageStatusData.page.id}`);
                  } else {
                    navigate(path);
                  }
                }}
              />
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Checklist */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <AutomationChecklist
                  {...checklistStatus}
                  onItemClick={(itemId) => {
                    // Navigate to relevant settings
                    if (itemId === "facebook_connected") {
                      navigate("/connect-facebook");
                    } else if (itemId === "page_selected") {
                      navigate("/connect-facebook");
                    } else if (pageStatusData) {
                      navigate(`/dashboard/facebook-settings/${pageStatusData.page.external_id}/${pageStatusData.page.id}`);
                    }
                  }}
                />
              </motion.div>

              {/* Simulator */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <AutomationSimulator
                  isAutomationReady={allChecksComplete}
                  automationSettings={{
                    autoCommentReply: automationSettings.autoCommentReply,
                    autoInboxReply: automationSettings.autoInboxReply,
                    orderTaking: automationSettings.orderTaking,
                  }}
                />
              </motion.div>
            </div>

            {/* Control Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <AutomationControlSummary
                language={pageStatusData.memory?.detected_language || "mixed"}
                tone={pageStatusData.memory?.preferred_tone || "friendly"}
                orderTaking={automationSettings.orderTaking || false}
                commentAutomation={automationSettings.autoCommentReply || false}
                inboxAutomation={automationSettings.autoInboxReply || false}
                discountAllowed={pageStatusData.memory?.selling_rules?.allowDiscount || false}
                maxDiscountPercent={pageStatusData.memory?.selling_rules?.maxDiscountPercent || 0}
              />
            </motion.div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AutomationStatus;
