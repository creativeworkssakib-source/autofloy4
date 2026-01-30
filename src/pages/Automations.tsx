import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PlatformAutomationsGrid from "@/components/automations/PlatformAutomationsGrid";
import GlobalAutomationSettings from "@/components/automations/GlobalAutomationSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Facebook,
  Loader2,
  AlertTriangle,
  Crown,
  Activity,
} from "lucide-react";
import { useAutomationsData } from "@/hooks/useAutomationsData";

interface ConnectedPage {
  id: string;
  name: string;
  accountId?: string;
}

const Automations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Use optimized hook with caching & realtime
  const { 
    automationsResponse, 
    accountsResponse, 
    isLoading, 
    refresh 
  } = useAutomationsData();

  // Derive state from hook data
  const hasAccess = automationsResponse?.hasAccess ?? true;
  const accessDeniedReason = automationsResponse?.accessDeniedReason;
  const connectedAccounts = accountsResponse?.accounts?.filter(a => a.is_connected) || [];
  const connectedPages: ConnectedPage[] = connectedAccounts.map(a => ({
    id: a.external_id,
    name: a.name || "Facebook Page",
    accountId: a.id,
  }));

  // Handle Facebook OAuth callback success
  useEffect(() => {
    const fbConnected = searchParams.get("fb_connected");
    const pagesCount = searchParams.get("pages");

    if (fbConnected === "true") {
      toast({
        title: "Facebook Connected!",
        description: `Successfully connected ${pagesCount || ""} page(s).`,
      });
      setSearchParams({});
      refresh(); // Refresh to get new data
    }
  }, [searchParams, setSearchParams, toast, refresh]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Trial Expired Banner */}
        {!hasAccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="font-semibold">Trial Expired</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-3">
                  {accessDeniedReason || "Your 24-hour free trial has ended. Please upgrade to continue using automations."}
                </p>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => navigate("/pricing")}
                  className="gap-2"
                >
                  <Crown className="h-4 w-4" />
                  Upgrade Now
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Connected Pages Banner - Only show if pages are connected */}
        {connectedPages.length > 0 && hasAccess && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-[#1877F2]/30 bg-[#1877F2]/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#1877F2]/10">
                      <Facebook className="h-5 w-5 text-[#1877F2]" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Facebook Pages Connected</p>
                      <div className="flex items-center gap-2 mt-1">
                        {connectedPages.slice(0, 3).map((page) => (
                          <Badge key={page.id} variant="secondary" className="text-xs">
                            {page.name}
                          </Badge>
                        ))}
                        {connectedPages.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{connectedPages.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/dashboard/automation-status")}
                      className="gap-1.5"
                    >
                      <Activity className="h-4 w-4" />
                      Status
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/connect-facebook")}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Global AI Settings - Always visible for all platforms */}
        {hasAccess && (
          <GlobalAutomationSettings />
        )}

        {/* Platform Automations Grid */}
        {hasAccess && (
          <PlatformAutomationsGrid
            connectedFacebookPages={connectedPages}
            onConnectFacebook={() => navigate("/connect-facebook")}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Automations;
