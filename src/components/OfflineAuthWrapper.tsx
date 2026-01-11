/**
 * Offline Auth Wrapper
 * 
 * Handles authentication for offline mode
 * When offline, uses cached user data from localStorage
 */

import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Loader2, WifiOff } from "lucide-react";

const CACHED_USER_KEY = "autofloy_current_user";
const CACHED_AUTH_TOKEN_KEY = "autofloy_auth_token";

interface OfflineAuthWrapperProps {
  children: ReactNode;
}

export function OfflineAuthWrapper({ children }: OfflineAuthWrapperProps) {
  const { isLoading } = useAuth();
  const isOnline = useOnlineStatus();
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    // Check if we have cached auth data
    const cachedUser = localStorage.getItem(CACHED_USER_KEY);
    const cachedToken = localStorage.getItem(CACHED_AUTH_TOKEN_KEY);
    
    if (cachedUser && cachedToken) {
      setOfflineReady(true);
    }
  }, []);

  // If online, use normal auth flow
  if (isOnline) {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }
    return <>{children}</>;
  }

  // If offline but we have cached data, proceed
  if (!isOnline && offlineReady) {
    return <>{children}</>;
  }

  // If offline and no cached data, show offline message
  if (!isOnline && !offlineReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <WifiOff className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-xl font-semibold text-foreground mb-2">
          আপনি অফলাইনে আছেন
        </h1>
        <p className="text-muted-foreground text-center max-w-md">
          প্রথমবার ব্যবহার করার জন্য ইন্টারনেট সংযোগ প্রয়োজন। 
          লগইন করার পর অ্যাপ অফলাইনেও কাজ করবে।
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
