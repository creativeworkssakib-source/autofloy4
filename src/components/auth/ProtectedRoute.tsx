import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { hasValidOfflineAuth, getCachedAuth, getOfflineAuthRemainingDays } from "@/lib/offlineAuth";
import { Loader2, WifiOff, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: ReactNode;
  requireEmailVerification?: boolean;
}

const ProtectedRoute = ({ children, requireEmailVerification = true }: ProtectedRouteProps) => {
  const { user, isLoading, isOfflineMode } = useAuth();
  const location = useLocation();
  const isOnline = useOnlineStatus();
  const [offlineAuthValid, setOfflineAuthValid] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check for valid offline auth (7-day cache)
    const checkOfflineAuth = () => {
      const hasValidAuth = hasValidOfflineAuth();
      setOfflineAuthValid(hasValidAuth);
      setCheckingAuth(false);
    };
    
    checkOfflineAuth();
  }, []);

  // Loading state
  if (isLoading || checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ONLINE MODE - use normal auth
  if (isOnline) {
    if (!user) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireEmailVerification && !user.emailVerified) {
      return <Navigate to="/verify-email" replace />;
    }

    return <>{children}</>;
  }

  // OFFLINE MODE - check for valid offline auth (7-day cache)
  if (!isOnline) {
    // If user is authenticated from context (loaded from cache)
    if (user) {
      return <>{children}</>;
    }
    
    // If we have valid offline auth cache
    if (offlineAuthValid) {
      return <>{children}</>;
    }

    // No valid offline auth - show offline login required message
    const daysRemaining = getOfflineAuthRemainingDays();
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <WifiOff className="w-10 h-10 text-muted-foreground" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-3">
            অফলাইন মোড
          </h1>
          
          <p className="text-muted-foreground mb-6">
            {daysRemaining > 0 
              ? `আপনার অফলাইন সেশন ${daysRemaining} দিন পরে শেষ হবে।`
              : "লগইন করতে ইন্টারনেট সংযোগ প্রয়োজন। একবার লগইন করলে ৭ দিন পর্যন্ত অফলাইনে ব্যবহার করতে পারবেন।"
            }
          </p>
          
          <div className="flex items-center justify-center gap-2 p-4 bg-muted/50 rounded-lg mb-6">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-sm">
              অফলাইন সেশন মেয়াদ: <strong>৭ দিন</strong>
            </span>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="w-full"
          >
            পুনরায় চেষ্টা করুন
          </Button>
          
          <p className="text-sm text-muted-foreground mt-4">
            ইন্টারনেট সংযোগ হলে স্বয়ংক্রিয়ভাবে লগইন পেজ দেখাবে।
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;