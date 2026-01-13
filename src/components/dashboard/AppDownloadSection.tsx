import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Smartphone, Monitor, Apple, Chrome, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWA_INSTALL_COMPLETED_KEY = 'pwa_install_completed';

export function AppDownloadSection() {
  const { t, language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }
    
    // Check localStorage
    if (localStorage.getItem(PWA_INSTALL_COMPLETED_KEY) === 'true') {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      localStorage.setItem(PWA_INSTALL_COMPLETED_KEY, 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    setIsInstalling(true);
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      localStorage.setItem(PWA_INSTALL_COMPLETED_KEY, 'true');
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
    setIsInstalling(false);
  };

  const features = language === 'bn' ? [
    "অফলাইনে কাজ করুন",
    "দ্রুত লোড হয়",
    "পুশ নোটিফিকেশন",
    "ফুল স্ক্রিন মোড",
  ] : [
    "Work Offline",
    "Faster Loading",
    "Push Notifications",
    "Full Screen Mode",
  ];

  if (isInstalled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-teal-500/10 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {language === 'bn' ? 'অ্যাপ ইনস্টল হয়েছে!' : 'App Installed!'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'bn' 
                    ? 'এখন অফলাইনেও ব্যবহার করতে পারবেন'
                    : 'You can now use the app offline'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row items-stretch">
            {/* Left Section - Info */}
            <div className="flex-1 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30">
                  <Download className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {language === 'bn' ? 'অ্যাপ ডাউনলোড করুন' : 'Download App'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'bn' 
                      ? 'সব ডিভাইসে ব্যবহার করুন'
                      : 'Use on all devices'
                    }
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground mb-4">
                {language === 'bn'
                  ? 'আমাদের অ্যাপ ইনস্টল করুন এবং যেকোনো সময়, যেকোনো জায়গা থেকে আপনার ব্যবসা পরিচালনা করুন - এমনকি ইন্টারনেট ছাড়াই।'
                  : 'Install our app and manage your business anytime, anywhere - even without internet.'
                }
              </p>

              {/* Features */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* Install Button */}
              {deferredPrompt ? (
                <Button 
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="w-full md:w-auto gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  size="lg"
                >
                  <Download className="w-5 h-5" />
                  {isInstalling 
                    ? (language === 'bn' ? 'ইনস্টল হচ্ছে...' : 'Installing...')
                    : (language === 'bn' ? 'এখনই ইনস্টল করুন' : 'Install Now')
                  }
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {language === 'bn'
                    ? 'ইনস্টল করতে Chrome বা Edge ব্রাউজার ব্যবহার করুন'
                    : 'Use Chrome or Edge browser to install'
                  }
                </p>
              )}
            </div>

            {/* Right Section - Platform Icons */}
            <div className="hidden lg:flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-l border-border/50">
              <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">
                {language === 'bn' ? 'সব প্ল্যাটফর্মে' : 'Available On'}
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 bg-background/50 backdrop-blur-sm rounded-xl px-4 py-3">
                  <Chrome className="w-6 h-6 text-primary" />
                  <span className="text-sm font-medium">Web Browser</span>
                </div>
                <div className="flex items-center gap-3 bg-background/50 backdrop-blur-sm rounded-xl px-4 py-3">
                  <Smartphone className="w-6 h-6 text-primary" />
                  <span className="text-sm font-medium">Android</span>
                </div>
                <div className="flex items-center gap-3 bg-background/50 backdrop-blur-sm rounded-xl px-4 py-3">
                  <Monitor className="w-6 h-6 text-primary" />
                  <span className="text-sm font-medium">Windows</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
