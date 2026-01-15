/**
 * Simplified Auth Wrapper
 * 
 * Just checks if user is authenticated.
 * All data is live from Supabase - no offline mode.
 */

import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface OfflineAuthWrapperProps {
  children: ReactNode;
}

export function OfflineAuthWrapper({ children }: OfflineAuthWrapperProps) {
  const { user, isLoading } = useAuth();
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

  // If user is authenticated, allow access
  if (user) {
    return <>{children}</>;
  }

  // Not authenticated - show login prompt
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
          অ্যাপ ব্যবহার করতে প্রথমে লগইন করুন।
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
 * Simple hook to check auth status
 */
export function useOfflineAuthStatus() {
  const { user, isLoading } = useAuth();
  
  return {
    isAuthenticated: !!user,
    isLoading,
  };
}
