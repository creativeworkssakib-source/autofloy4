import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PlatformAutomationsGrid from "@/components/automations/PlatformAutomationsGrid";
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
} from "lucide-react";
import {
  fetchAutomationsWithAccess,
  fetchConnectedAccounts,
  ConnectedAccount,
} from "@/services/apiService";

interface ConnectedPage {
  id: string;
  name: string;
  accountId?: string;
}

const Automations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [connectedPages, setConnectedPages] = useState<ConnectedPage[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  
  // Trial/Access state
  const [hasAccess, setHasAccess] = useState(true);
  const [accessDeniedReason, setAccessDeniedReason] = useState<string | undefined>();

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
      fetchConnectedAccounts("facebook").then((accounts) => {
        const connected = accounts.filter((a: ConnectedAccount) => a.is_connected);
        setConnectedAccounts(connected);
        setConnectedPages(connected.map((a: ConnectedAccount) => ({
          id: a.external_id,
          name: a.name || "Facebook Page",
          accountId: a.id,
        })));
      });
    }
  }, [searchParams, setSearchParams, toast]);

  // Load connected accounts
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [automationsResponse, accountsData] = await Promise.all([
          fetchAutomationsWithAccess(),
          fetchConnectedAccounts("facebook"),
        ]);

        setHasAccess(automationsResponse.hasAccess);
        setAccessDeniedReason(automationsResponse.accessDeniedReason);
        setConnectedAccounts(accountsData.filter((a: ConnectedAccount) => a.is_connected));
        setConnectedPages(
          accountsData
            .filter((a: ConnectedAccount) => a.is_connected)
            .map((a: ConnectedAccount) => ({
              id: a.external_id,
              name: a.name || "Facebook Page",
              accountId: a.id,
            }))
        );
      } catch (error) {
        console.error("Failed to load data:", error);
        toast({
          title: "Error",
          description: "Failed to load automations.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/connect-facebook")}
                  >
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
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
