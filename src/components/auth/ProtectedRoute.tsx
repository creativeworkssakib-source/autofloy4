import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Loader2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: ReactNode;
  requireEmailVerification?: boolean;
}

const CACHED_USER_KEY = "autofloy_current_user";
const CACHED_AUTH_TOKEN_KEY = "autofloy_auth_token";

const ProtectedRoute = ({ children, requireEmailVerification = true }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const isOnline = useOnlineStatus();
  const [cachedUser, setCachedUser] = useState<any>(null);
  const [checkingCache, setCheckingCache] = useState(true);

  useEffect(() => {
    // Check for cached user data for offline support
    try {
      const cached = localStorage.getItem(CACHED_USER_KEY);
      const token = localStorage.getItem(CACHED_AUTH_TOKEN_KEY);
      if (cached && token) {
        setCachedUser(JSON.parse(cached));
      }
    } catch (e) {
      console.error("Failed to parse cached user:", e);
    }
    setCheckingCache(false);
  }, []);

  // Loading state
  if (isLoading || checkingCache) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Online mode - use normal auth
  if (isOnline) {
    if (!user) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireEmailVerification && !user.emailVerified) {
      return <Navigate to="/verify-email" replace />;
    }

    return <>{children}</>;
  }

  // Offline mode - check cached user
  if (!isOnline) {
    // If we have cached user, allow access
    if (cachedUser || user) {
      return <>{children}</>;
    }

    // No cached user in offline mode
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <WifiOff className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-xl font-semibold text-foreground mb-2">
          অফলাইন মোড
        </h1>
        <p className="text-muted-foreground text-center max-w-md mb-4">
          প্রথমবার ব্যবহার করতে ইন্টারনেট সংযোগ প্রয়োজন। 
          লগইন করার পর অ্যাপ অফলাইনেও কাজ করবে।
        </p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          পুনরায় চেষ্টা করুন
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
