import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Facebook,
  Zap,
  Check,
  ArrowRight,
  ArrowLeft,
  Shield,
  Lock,
  MessageSquare,
  Users,
  AlertCircle,
  Loader2,
  RefreshCw,
  XCircle,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getFacebookOAuthUrl, fetchConnectedAccounts, disconnectAccount, ConnectedAccount } from "@/services/apiService";
import { Skeleton } from "@/components/ui/skeleton";
import confetti from "canvas-confetti";

type ConnectionState = "idle" | "connecting" | "redirecting" | "success" | "error";

const ConnectFacebook = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [connectedPages, setConnectedPages] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [newPagesCount, setNewPagesCount] = useState(0);

  // Trigger confetti celebration
  const triggerCelebration = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#1877F2', '#42b72a', '#f7b928', '#f02849'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#1877F2', '#42b72a', '#f7b928', '#f02849'],
      });
    }, 250);
  }, []);

  // Check URL params for OAuth callback results
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const message = searchParams.get("message");
    const pagesCount = searchParams.get("pages");

    if (success === "true") {
      setConnectionState("success");
      setShowSuccessAnimation(true);
      setNewPagesCount(parseInt(pagesCount || "1", 10));
      triggerCelebration();
      
      toast({
        title: "🎉 Facebook Connected!",
        description: `Successfully connected ${pagesCount || ""} page(s).`,
      });
      
      setSearchParams({});
      loadConnectedPages();
      
      // Redirect to automations after showing success
      setTimeout(() => {
        navigate("/dashboard/automations");
      }, 3000);
    } else if (error) {
      setConnectionState("error");
      setErrorCode(error);
      
      let errorMessage = "Failed to connect Facebook.";
      if (error === "no_pages") {
        errorMessage = message || "No Facebook Pages found. Make sure you have admin access to at least one Facebook Page.";
      } else if (error === "access_denied") {
        errorMessage = "You denied access to your Facebook account.";
      } else if (error === "token_exchange_failed") {
        errorMessage = "Failed to verify your Facebook account. Please try again.";
      } else if (error === "network_error") {
        errorMessage = "Network error occurred. Please check your connection and try again.";
      } else if (message) {
        errorMessage = decodeURIComponent(message);
      }
      
      setOauthError(errorMessage);
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, toast, navigate, triggerCelebration]);

  // Load already connected pages
  const loadConnectedPages = async () => {
    setIsLoading(true);
    try {
      const accounts = await fetchConnectedAccounts("facebook");
      setConnectedPages(accounts.filter(a => a.is_connected));
    } catch (error) {
      console.error("Failed to load pages:", error);
      toast({
        title: "Failed to load pages",
        description: "Could not retrieve your connected pages. Please refresh.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConnectedPages();
  }, []);

  const handleConnectFacebook = async () => {
    setConnectionState("connecting");
    setOauthError(null);
    setErrorCode(null);

    try {
      const result = await getFacebookOAuthUrl();
      
      if (!result.configured) {
        setConnectionState("error");
        setErrorCode("not_configured");
        setOauthError(result.error || "Facebook OAuth is not configured. Please contact support.");
        toast({
          title: "OAuth Not Configured",
          description: result.error || "Facebook OAuth is not set up yet. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      if (result.url) {
        setConnectionState("redirecting");
        
        // Small delay to show redirecting state
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (window.top && window.top !== window.self) {
          window.open(result.url, '_blank');
          // Reset state after opening new tab since we can't track it
          setTimeout(() => setConnectionState("idle"), 2000);
        } else {
          window.location.href = result.url;
        }
      } else {
        throw new Error("No OAuth URL returned");
      }
    } catch (error) {
      console.error("Failed to start OAuth:", error);
      setConnectionState("error");
      setErrorCode("start_failed");
      setOauthError("Failed to start Facebook connection. Please check your internet and try again.");
      toast({
        title: "Connection Failed",
        description: "Failed to start Facebook connection. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRetry = () => {
    setConnectionState("idle");
    setOauthError(null);
    setErrorCode(null);
  };

  const handleDisconnect = async (accountId: string) => {
    const success = await disconnectAccount(accountId);
    if (success) {
      setConnectedPages(prev => prev.filter(p => p.id !== accountId));
      toast({
        title: "Page Disconnected",
        description: "The Facebook page has been disconnected.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to disconnect the page.",
        variant: "destructive",
      });
    }
  };

  const handleContinue = () => {
    if (connectedPages.length === 0) {
      toast({
        title: "No Pages Connected",
        description: "Please connect at least one Facebook page to continue.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Setup Complete!",
      description: `${connectedPages.length} page(s) ready for automation.`,
    });

    navigate("/dashboard/automations");
  };

  const features = [
    {
      icon: MessageSquare,
      title: "Auto-reply to messages",
      description: "Respond instantly 24/7",
    },
    {
      icon: Users,
      title: "Comment management",
      description: "Engage with your audience",
    },
    {
      icon: Shield,
      title: "Spam protection",
      description: "Block unwanted content",
    },
  ];

  const hasConnectedPages = connectedPages.length > 0;

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="p-8">
            <Skeleton className="w-20 h-20 rounded-full mx-auto mb-6" />
            <Skeleton className="h-6 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto mb-6" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </CardContent>
        </Card>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="w-10 h-10 rounded-lg mx-auto mb-3" />
              <Skeleton className="h-4 w-24 mx-auto mb-1" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Success animation overlay
  const SuccessOverlay = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="text-center p-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1877F2] to-[#42b72a] flex items-center justify-center mx-auto mb-6 shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
          >
            <Check className="w-12 h-12 text-white" />
          </motion.div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <PartyPopper className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Connection Successful!</h2>
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <p className="text-muted-foreground mb-4">
            {newPagesCount} Facebook page{newPagesCount > 1 ? 's' : ''} connected successfully
          </p>
          <p className="text-sm text-muted-foreground animate-pulse">
            Redirecting to automations...
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );

  // Error state with retry
  const ErrorState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="max-w-md mx-auto border-destructive/50">
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
            className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6"
          >
            <XCircle className="w-10 h-10 text-destructive" />
          </motion.div>

          <h2 className="text-xl font-bold mb-2 text-destructive">
            Connection Failed
          </h2>
          
          <div className="mb-6 p-4 bg-destructive/10 rounded-lg text-left">
            <div className="flex items-start gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">
                  {errorCode === "no_pages" && "No Facebook Pages Found"}
                  {errorCode === "access_denied" && "Access Denied"}
                  {errorCode === "not_configured" && "OAuth Not Configured"}
                  {errorCode === "token_exchange_failed" && "Verification Failed"}
                  {errorCode === "network_error" && "Network Error"}
                  {errorCode === "start_failed" && "Connection Failed"}
                  {!errorCode && "Unknown Error"}
                </p>
                <p className="text-destructive/80">{oauthError}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="gradient"
              size="lg"
              className="w-full"
              onClick={handleRetry}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </div>

          {errorCode === "no_pages" && (
            <p className="mt-4 text-xs text-muted-foreground">
              Make sure you have admin access to at least one Facebook Page, 
              then try connecting again.
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  // Connecting/Redirecting state
  const ConnectingState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: connectionState === "redirecting" ? 360 : 0 
            }}
            transition={{ 
              scale: { repeat: Infinity, duration: 1.5 },
              rotate: { duration: 1, ease: "easeInOut" }
            }}
            className="w-20 h-20 rounded-full bg-[#1877F2] flex items-center justify-center mx-auto mb-6"
          >
            {connectionState === "redirecting" ? (
              <ArrowRight className="w-10 h-10 text-white" />
            ) : (
              <Facebook className="w-10 h-10 text-white" />
            )}
          </motion.div>

          <h2 className="text-xl font-bold mb-2">
            {connectionState === "redirecting" 
              ? "Redirecting to Facebook..." 
              : "Connecting to Facebook..."}
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            {connectionState === "redirecting"
              ? "You'll be redirected to Facebook to authorize access."
              : "Please wait while we prepare the connection..."}
          </p>

          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              {connectionState === "redirecting" ? "Opening Facebook..." : "Initializing..."}
            </span>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            Secure OAuth 2.0 connection
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(217,100%,50%,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(262,100%,63%,0.1),transparent_50%)] pointer-events-none" />

      {/* Success Animation Overlay */}
      <AnimatePresence>
        {showSuccessAnimation && <SuccessOverlay />}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">
              Auto<span className="gradient-text">Flow</span>
            </span>
          </Link>
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            {hasConnectedPages ? `${connectedPages.length} Page${connectedPages.length > 1 ? 's' : ''} Connected` : "Step 1 of 3"}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {hasConnectedPages ? "Your Connected Pages" : "Connect Your Facebook Page"}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {hasConnectedPages
              ? "Manage your connected Facebook pages or add more."
              : "Link your Facebook business page to start automating customer conversations and boost your sales."}
          </p>
        </motion.div>

        {/* Content based on state */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : connectionState === "error" ? (
          <ErrorState />
        ) : connectionState === "connecting" || connectionState === "redirecting" ? (
          <ConnectingState />
        ) : !hasConnectedPages ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8 text-center">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-20 h-20 rounded-full bg-[#1877F2] flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <Facebook className="w-10 h-10 text-white" />
                </motion.div>

                <h2 className="text-xl font-bold mb-2">
                  Connect with Facebook
                </h2>
                <p className="text-muted-foreground text-sm mb-6">
                  We'll only request access to your page's messages and
                  comments. Your personal data stays private.
                </p>

                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full mb-4"
                  onClick={handleConnectFacebook}
                >
                  <Facebook className="w-5 h-5 mr-2" />
                  Connect Facebook Page
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-4">
                  <Lock className="w-3 h-3" />
                  Secure OAuth 2.0 connection
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/dashboard/automations")}
                  className="text-sm text-muted-foreground hover:text-primary underline cursor-pointer transition-colors"
                >
                  Skip for now
                </button>
              </CardContent>
            </Card>

            {/* Features */}
            <div className="grid sm:grid-cols-3 gap-4 mt-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Card className="h-full hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 text-center">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-medium text-sm mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Success Message */}
            <Card className="bg-success/10 border-success/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                    className="w-10 h-10 rounded-full bg-success flex items-center justify-center"
                  >
                    <Check className="w-5 h-5 text-white" />
                  </motion.div>
                  <div>
                    <p className="font-medium text-success">
                      Facebook Connected Successfully!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {connectedPages.length} page(s) connected
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadConnectedPages}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Connected Pages List */}
            <div className="space-y-3">
              <h3 className="font-medium">Connected Pages</h3>
              {connectedPages.map((page, index) => (
                <motion.div
                  key={page.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-primary/30">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center">
                          <Facebook className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{page.name || "Facebook Page"}</p>
                          <p className="text-sm text-muted-foreground">
                            ID: {page.external_id}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDisconnect(page.id)}
                        >
                          Disconnect
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Add More Pages */}
            <Card className="border-dashed">
              <CardContent className="p-4">
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleConnectFacebook}
                >
                  <Facebook className="w-4 h-4 mr-2" />
                  Connect More Pages
                </Button>
              </CardContent>
            </Card>

            {/* Continue Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
              <Button variant="gradient" onClick={handleContinue}>
                Continue to Automations
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ConnectFacebook;
