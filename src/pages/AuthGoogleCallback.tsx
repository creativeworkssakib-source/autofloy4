import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const AuthGoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error) {
        setStatus("error");
        setErrorMessage(error === "access_denied" ? "Google login was cancelled" : "Google login failed");
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      if (!code) {
        setStatus("error");
        setErrorMessage("No authorization code received");
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      try {
        const result = await handleGoogleCallback(code);
        
        if (result.success) {
          setStatus("success");
          toast({
            title: result.isNewUser ? "Account created!" : "Welcome back!",
            description: result.isNewUser 
              ? "Your account has been created with Google" 
              : "You've been logged in with Google",
          });
          setTimeout(() => navigate("/dashboard"), 1500);
        } else {
          setStatus("error");
          setErrorMessage(result.error || "Google login failed");
          setTimeout(() => navigate("/login"), 3000);
        }
      } catch (error) {
        setStatus("error");
        setErrorMessage("An unexpected error occurred");
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    processCallback();
  }, [searchParams, handleGoogleCallback, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <h2 className="text-xl font-semibold">Signing in with Google...</h2>
            <p className="text-muted-foreground">Please wait while we complete your login</p>
          </>
        )}
        
        {status === "success" && (
          <>
            <CheckCircle className="w-12 h-12 text-success mx-auto" />
            <h2 className="text-xl font-semibold text-success">Login successful!</h2>
            <p className="text-muted-foreground">Redirecting to dashboard...</p>
          </>
        )}
        
        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold text-destructive">Login failed</h2>
            <p className="text-muted-foreground">{errorMessage}</p>
            <p className="text-sm text-muted-foreground">Redirecting to login page...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthGoogleCallback;
