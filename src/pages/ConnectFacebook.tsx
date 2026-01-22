import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Facebook,
  Zap,
  ArrowLeft,
  Shield,
  MessageSquare,
  Users,
  AlertCircle,
  Loader2,
  RefreshCw,
  Plus,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  getFacebookOAuthUrl, 
  fetchConnectedAccounts, 
  togglePageAutomation,
  ConnectedAccount 
} from "@/services/apiService";
import { Skeleton } from "@/components/ui/skeleton";

const ConnectFacebook = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pages, setPages] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [togglingPages, setTogglingPages] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Handle OAuth callback results
  useEffect(() => {
    const success = searchParams.get("success");
    const errorParam = searchParams.get("error");
    const message = searchParams.get("message");
    const pagesCount = searchParams.get("pages");

    if (success === "true") {
      toast({
        title: "Pages Imported!",
        description: `${pagesCount || ""} page(s) imported. Enable automation for pages you want to use.`,
      });
      setSearchParams({});
      loadPages();
    } else if (errorParam) {
      setError(message ? decodeURIComponent(message) : "Failed to connect Facebook.");
      toast({
        title: "Connection Failed",
        description: message ? decodeURIComponent(message) : "Failed to connect.",
        variant: "destructive",
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, toast]);

  // Load pages on mount
  const loadPages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const accounts = await fetchConnectedAccounts("facebook");
      setPages(accounts);
    } catch (err) {
      console.error("Failed to load pages:", err);
      setError("Failed to load pages. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  // Start OAuth flow
  const handleConnectFacebook = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const result = await getFacebookOAuthUrl();
      
      if (!result.configured) {
        setError(result.error || "Facebook OAuth is not configured.");
        setIsConnecting(false);
        return;
      }

      if (result.url) {
        if (window.top && window.top !== window.self) {
          window.open(result.url, '_blank');
          setTimeout(() => setIsConnecting(false), 2000);
        } else {
          window.location.href = result.url;
        }
      } else {
        throw new Error("No OAuth URL returned");
      }
    } catch (err) {
      console.error("Failed to start OAuth:", err);
      setError("Failed to start Facebook connection.");
      setIsConnecting(false);
    }
  };

  // Toggle page automation
  const handleToggle = async (pageId: string, enabled: boolean) => {
    setTogglingPages(prev => new Set(prev).add(pageId));
    
    try {
      const result = await togglePageAutomation(pageId, enabled);
      
      if (result.success) {
        setPages(prev => prev.map(p => 
          p.id === pageId ? { ...p, is_connected: enabled } : p
        ));
        toast({
          title: enabled ? "Automation Enabled" : "Automation Disabled",
          description: result.message,
        });
      } else {
        toast({
          title: "Failed",
          description: result.error || "Could not update page.",
          variant: "destructive",
        });
        
        if (result.upgrade_required) {
          toast({
            title: "Upgrade Required",
            description: result.error,
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTogglingPages(prev => {
        const next = new Set(prev);
        next.delete(pageId);
        return next;
      });
    }
  };

  const handleContinue = () => {
    const enabledPages = pages.filter(p => p.is_connected);
    if (enabledPages.length === 0) {
      toast({
        title: "No Pages Enabled",
        description: "Enable automation for at least one page to continue.",
        variant: "destructive",
      });
      return;
    }
    navigate("/dashboard/automations");
  };

  const enabledCount = pages.filter(p => p.is_connected).length;
  const hasPages = pages.length > 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
          <Skeleton className="h-8 w-64 mx-auto mb-2" />
          <Skeleton className="h-4 w-96 mx-auto mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-40 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-12" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">
              Auto<span className="text-primary">Flow</span>
            </span>
          </Link>
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Connect Facebook Pages</h1>
          <p className="text-muted-foreground">
            {hasPages 
              ? "Toggle ON the pages you want to automate" 
              : "Connect your Facebook account to get started"}
          </p>
        </div>

        {/* Error display */}
        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pages List */}
        {hasPages ? (
          <div className="space-y-3 mb-6">
            {pages.map(page => (
              <Card key={page.id} className={page.is_connected ? "border-primary/50" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Page Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      page.is_connected 
                        ? "bg-[#1877F2]" 
                        : "bg-muted"
                    }`}>
                      <Facebook className={`w-6 h-6 ${
                        page.is_connected ? "text-white" : "text-muted-foreground"
                      }`} />
                    </div>

                    {/* Page Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{page.name || "Unnamed Page"}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {page.category && (
                          <>
                            <Building className="w-3 h-3" />
                            <span className="truncate">{page.category}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    {page.is_connected && (
                      <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}

                    {/* Toggle Switch */}
                    <div className="flex items-center gap-2">
                      {togglingPages.has(page.id) ? (
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      ) : (
                        <Switch
                          checked={page.is_connected || false}
                          onCheckedChange={(checked) => handleToggle(page.id, checked)}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* No pages - Show connect prompt */
          <Card className="mb-6">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-[#1877F2]/10 flex items-center justify-center mx-auto mb-6">
                <Facebook className="w-10 h-10 text-[#1877F2]" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Connect Your Facebook Account</h2>
              <p className="text-muted-foreground mb-6">
                Connect to import your Facebook Pages for automation.
              </p>
              
              {/* Features */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Auto-reply</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Comments</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Spam Block</p>
                </div>
              </div>

              <Button
                size="lg"
                onClick={handleConnectFacebook}
                disabled={isConnecting}
                className="bg-[#1877F2] hover:bg-[#1877F2]/90 w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Facebook className="w-5 h-5 mr-2" />
                    Connect with Facebook
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                Secure OAuth 2.0 - Your password is never stored
              </p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {hasPages && (
          <div className="space-y-3">
            {/* Add more pages button */}
            <Button
              variant="outline"
              onClick={handleConnectFacebook}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Add More Pages
            </Button>

            {/* Continue button */}
            <Button
              size="lg"
              onClick={handleContinue}
              disabled={enabledCount === 0}
              className="w-full"
            >
              Continue to Automations
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            {/* Status indicator */}
            <p className="text-center text-sm text-muted-foreground">
              {enabledCount} of {pages.length} page{pages.length !== 1 ? 's' : ''} enabled
            </p>
          </div>
        )}

        {/* Refresh link */}
        <div className="mt-8 text-center">
          <Button variant="link" onClick={loadPages} className="text-muted-foreground">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Pages
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConnectFacebook;
