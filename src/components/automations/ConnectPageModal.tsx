import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Facebook,
  Shield,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getFacebookOAuthUrl } from "@/services/apiService";

interface ConnectPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

const ConnectPageModal = ({
  isOpen,
  onClose,
  onConnected,
}: ConnectPageModalProps) => {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleOAuth = async () => {
    setIsConnecting(true);
    setOauthError(null);
    setOauthUrl(null);

    try {
      const result = await getFacebookOAuthUrl();
      
      if (!result.configured) {
        setOauthError(result.error || "Facebook OAuth is not configured.");
        toast({
          title: "OAuth Not Configured",
          description: result.error || "Facebook OAuth is not set up yet. Please contact support.",
          variant: "destructive",
        });
        setIsConnecting(false);
        return;
      }

      if (result.url) {
        // Store the URL for manual opening
        setOauthUrl(result.url);
        
        // Try to open in new window - works outside iframe
        const newWindow = window.open(result.url, '_blank', 'noopener,noreferrer,width=600,height=700');
        
        if (newWindow) {
          toast({
            title: "Facebook window opened",
            description: "Complete the authorization in the new tab, then return here.",
          });
          setIsConnecting(false);
          onClose();
        } else {
          // Popup was blocked - show manual URL
          toast({
            title: "Popup blocked",
            description: "Click the link below to open Facebook authorization.",
            variant: "default",
          });
          setIsConnecting(false);
        }
      } else {
        throw new Error("No OAuth URL returned");
      }
    } catch (error) {
      console.error("Failed to start OAuth:", error);
      setOauthError("Failed to start Facebook connection.");
      toast({
        title: "Connection Failed",
        description: "Failed to start Facebook connection. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleCopyUrl = async () => {
    if (oauthUrl) {
      try {
        await navigator.clipboard.writeText(oauthUrl);
        setCopied(true);
        toast({
          title: "Link copied!",
          description: "Paste this link in a new browser tab to authorize.",
        });
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = oauthUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleOpenDirectly = () => {
    if (oauthUrl) {
      // Force open in top-level window (escapes iframe)
      if (window.top) {
        window.top.location.href = oauthUrl;
      } else {
        window.location.href = oauthUrl;
      }
    }
  };

  const handleClose = () => {
    setIsConnecting(false);
    setOauthError(null);
    setOauthUrl(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-[#1877F2]" />
            Connect Facebook Page
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <p className="text-muted-foreground text-sm">
              Connect your Facebook Page securely using OAuth
            </p>
            
            <div className="text-center py-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-[#1877F2]/10 flex items-center justify-center mb-4">
                <Facebook className="h-10 w-10 text-[#1877F2]" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Connect with Facebook</h3>
              <p className="text-muted-foreground text-sm mb-4">
                You'll be redirected to Facebook to authorize access to your pages.
                Your credentials are never stored by us.
              </p>

              {oauthError && (
                <div className="mb-4 p-3 bg-destructive/10 rounded-lg flex items-start gap-2 text-destructive text-sm text-left">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{oauthError}</span>
                </div>
              )}

              {/* Show URL options if popup was blocked */}
              {oauthUrl && !oauthError && (
                <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Popup blocked? Use one of these options:
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleOpenDirectly}
                      className="gap-2 bg-[#1877F2] hover:bg-[#1877F2]/90"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Facebook Login
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyUrl}
                      className="gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Link to Clipboard
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {!oauthUrl && (
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleOAuth}
                  disabled={isConnecting}
                  className="gap-2 bg-[#1877F2] hover:bg-[#1877F2]/90 w-full"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Facebook className="h-5 w-5" />
                      Continue with Facebook
                      <ExternalLink className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
              <Shield className="h-4 w-4" />
              <span>Secure OAuth 2.0 connection - no password stored</span>
            </div>

            <Card className="p-4 bg-muted/50 border border-border/50">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Why connect your page?</p>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Auto-reply to messages and comments</li>
                    <li>• AI-powered product recognition</li>
                    <li>• 24/7 automated customer support</li>
                  </ul>
                </div>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectPageModal;
