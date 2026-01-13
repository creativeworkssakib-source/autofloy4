/**
 * Offline Ready Indicator Component
 * 
 * Shows a toast when the app becomes ready for offline use
 * Also shows current online/offline status
 */

import { useEffect, useState } from "react";
import { useIsOnline } from "@/hooks/useOnlineStatus";
import { Wifi, WifiOff, Download, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function OfflineReadyIndicator() {
  const isOnline = useIsOnline();
  const { toast } = useToast();
  const [wasOffline, setWasOffline] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Track online/offline transitions
    if (!isOnline && !wasOffline) {
      setWasOffline(true);
      setShowStatus(true);
      toast({
        title: "অফলাইন মোড",
        description: "আপনি এখন অফলাইনে কাজ করছেন। ডাটা স্বয়ংক্রিয়ভাবে সিঙ্ক হবে।",
        duration: 3000,
      });
    } else if (isOnline && wasOffline) {
      setWasOffline(false);
      setShowStatus(true);
      toast({
        title: "অনলাইনে ফিরে এসেছেন",
        description: "ডাটা সিঙ্ক হচ্ছে...",
        duration: 2000,
      });
      // Hide status after 3 seconds
      setTimeout(() => setShowStatus(false), 3000);
    }
  }, [isOnline, wasOffline, toast]);

  // Only show persistent indicator when offline
  if (isOnline && !showStatus) return null;

  return (
    <div 
      className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
        isOnline 
          ? "bg-green-500/10 text-green-500 border border-green-500/20" 
          : "bg-orange-500/10 text-orange-500 border border-orange-500/20"
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>অনলাইন</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>অফলাইন</span>
        </>
      )}
    </div>
  );
}

/**
 * Install PWA Prompt Component
 * 
 * Shows an install prompt for PWA on supported browsers
 * Only shows ONCE - saves state to localStorage
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWA_INSTALL_DISMISSED_KEY = 'pwa_install_dismissed';
const PWA_INSTALL_COMPLETED_KEY = 'pwa_install_completed';

export function InstallPWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      localStorage.setItem(PWA_INSTALL_COMPLETED_KEY, 'true');
      return;
    }

    // Check if user already dismissed or installed
    const wasDismissed = localStorage.getItem(PWA_INSTALL_DISMISSED_KEY) === 'true';
    const wasInstalled = localStorage.getItem(PWA_INSTALL_COMPLETED_KEY) === 'true';
    
    if (wasDismissed || wasInstalled) {
      return; // Don't show prompt ever again
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a delay
      setTimeout(() => setShowPrompt(true), 3000);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem(PWA_INSTALL_COMPLETED_KEY, 'true');
      toast({
        title: "অ্যাপ ইনস্টল হয়েছে!",
        description: "এখন অফলাইনেও ব্যবহার করতে পারবেন।",
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      localStorage.setItem(PWA_INSTALL_COMPLETED_KEY, 'true');
      console.log('User accepted the install prompt');
    } else {
      // User dismissed the browser prompt, mark as dismissed
      localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, 'true');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Mark as dismissed permanently
    localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, 'true');
  };

  if (isInstalled || !showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-card border border-border rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <Download className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">অ্যাপ ইনস্টল করুন</h3>
          <p className="text-sm text-muted-foreground mt-1">
            হোম স্ক্রিনে যোগ করলে অফলাইনেও কাজ করবে
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90"
            >
              ইনস্টল
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              পরে
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
