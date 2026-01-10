import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SUPABASE_URL = "https://xvwsqxfydvagfhfkwxdm.supabase.co";

const AuthFacebookCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      // Get OAuth params from URL
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const errorParam = searchParams.get("error");
      const errorReason = searchParams.get("error_reason");
      const errorDescription = searchParams.get("error_description");

      // If Facebook returned an error, redirect to connect page with error
      if (errorParam) {
        const message = errorDescription || errorReason || "Facebook connection was cancelled or denied.";
        navigate(`/connect-facebook?error=${encodeURIComponent(errorParam)}&message=${encodeURIComponent(message)}`);
        return;
      }

      // If no code, show error
      if (!code || !state) {
        setError("Missing authorization code. Please try connecting again.");
        setIsProcessing(false);
        return;
      }

      try {
        // Forward to edge function callback
        const callbackUrl = new URL(`${SUPABASE_URL}/functions/v1/facebook-oauth`);
        callbackUrl.searchParams.set("action", "callback");
        callbackUrl.searchParams.set("code", code);
        callbackUrl.searchParams.set("state", state);

        // Redirect to edge function which will handle the OAuth exchange
        window.location.href = callbackUrl.toString();
      } catch (err) {
        console.error("Failed to process callback:", err);
        setError("Failed to process Facebook connection. Please try again.");
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">Connection Failed</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate("/connect-facebook")} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Processing Facebook Connection...</h2>
        <p className="text-muted-foreground">Please wait while we complete the authorization.</p>
      </div>
    </div>
  );
};

export default AuthFacebookCallback;
