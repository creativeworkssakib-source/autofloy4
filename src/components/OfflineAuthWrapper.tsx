/**
 * Offline Auth Wrapper
 * 
 * Handles authentication for offline mode.
 * Users who logged in within the last 7 days can use the app offline.
 * Logout requires internet to log back in.
 */

import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, WifiOff, LogIn, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { hasValidOfflineAuth, getOfflineAuthRemainingDays } from "@/lib/offlineAuth";

interface OfflineAuthWrapperProps {
  children: ReactNode;
}

export function OfflineAuthWrapper({ children }: OfflineAuthWrapperProps) {
  const { user, isLoading, isOfflineMode, offlineAuthDaysRemaining } = useAuth();
  const navigate = useNavigate();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">লোড হচ্ছে...</p>
      </div>
    );
  }

  // If user is authenticated (online or offline), allow access
  if (user) {
    return <>{children}</>;
  }

  // Check if there's valid offline auth but user object is not set yet
  if (hasValidOfflineAuth()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">অফলাইন সেশন লোড হচ্ছে...</p>
      </div>
    );
  }

  // If offline and no valid auth, show offline message
  if (isOfflineMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <WifiOff className="w-10 h-10 text-muted-foreground" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-3">
            আপনি অফলাইনে আছেন
          </h1>
          
          <p className="text-muted-foreground mb-6">
            লগইন করতে ইন্টারনেট সংযোগ প্রয়োজন। একবার লগইন করলে ৭ দিন পর্যন্ত অফলাইনে ব্যবহার করতে পারবেন।
          </p>
          
          <div className="flex items-center justify-center gap-2 p-4 bg-muted/50 rounded-lg mb-6">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-sm">
              অফলাইন সেশন মেয়াদ: <strong>৭ দিন</strong>
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            ইন্টারনেট সংযোগ হলে স্বয়ংক্রিয়ভাবে লগইন পেজ দেখাবে।
          </p>
        </div>
      </div>
    );
  }

  // Online but not authenticated - show login prompt
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <LogIn className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-3">
          লগইন করুন
        </h1>
        
        <p className="text-muted-foreground mb-6">
          অ্যাপ ব্যবহার করতে প্রথমে লগইন করুন। একবার লগইন করলে ৭ দিন পর্যন্ত অফলাইনেও ব্যবহার করতে পারবেন।
        </p>
        
        <Button onClick={() => navigate("/login")} size="lg" className="w-full">
          <LogIn className="w-5 h-5 mr-2" />
          লগইন করুন
        </Button>
        
        <p className="text-sm text-muted-foreground mt-4">
          অ্যাকাউন্ট নেই? <button onClick={() => navigate("/signup")} className="text-primary hover:underline">সাইন আপ করুন</button>
        </p>
      </div>
    </div>
  );
}

/**
 * Hook to check offline auth status
 */
export function useOfflineAuthStatus() {
  const { isOfflineMode, offlineAuthDaysRemaining } = useAuth();
  
  return {
    isOffline: isOfflineMode,
    daysRemaining: offlineAuthDaysRemaining,
    hasValidAuth: hasValidOfflineAuth(),
  };
}