/**
 * PWA Install Button Component
 * 
 * Shows an install button when the app is installable
 */

import { Download, Smartphone, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePWAStatus } from '@/hooks/usePWAStatus';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface PWAInstallButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  className?: string;
}

export function PWAInstallButton({ 
  variant = 'outline', 
  size = 'sm',
  showLabel = true,
  className = ''
}: PWAInstallButtonProps) {
  const { language } = useLanguage();
  const { isInstalled, isInstallable, install, isOfflineReady } = usePWAStatus();

  const handleInstall = async () => {
    const success = await install();
    
    if (success) {
      toast.success(
        language === 'bn'
          ? 'অ্যাপ ইনস্টল হয়েছে!'
          : 'App installed successfully!'
      );
    }
  };

  // Already installed
  if (isInstalled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={size}
              className={`text-green-600 ${className}`}
              disabled
            >
              <Check className="h-4 w-4" />
              {showLabel && (
                <span className="ml-2">
                  {language === 'bn' ? 'ইনস্টল করা হয়েছে' : 'Installed'}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {language === 'bn'
                ? 'অ্যাপ ইতিমধ্যে ইনস্টল করা আছে'
                : 'App is already installed'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Not installable (already installed via other means or not PWA capable)
  if (!isInstallable) {
    // If offline ready but not installable, show a hint
    if (isOfflineReady) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={size}
                className={`text-muted-foreground ${className}`}
                disabled
              >
                <Smartphone className="h-4 w-4" />
                {showLabel && (
                  <span className="ml-2">
                    {language === 'bn' ? 'অফলাইন রেডি' : 'Offline Ready'}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {language === 'bn'
                  ? 'ব্রাউজার মেনু থেকে "Add to Home Screen" সিলেক্ট করুন'
                  : 'Select "Add to Home Screen" from browser menu'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return null;
  }

  // Can be installed
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleInstall}
            className={className}
          >
            <Download className="h-4 w-4" />
            {showLabel && (
              <span className="ml-2">
                {language === 'bn' ? 'অ্যাপ ইনস্টল করুন' : 'Install App'}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {language === 'bn'
              ? 'হোম স্ক্রিনে অ্যাপ ইনস্টল করুন - অফলাইনে কাজ করবে'
              : 'Install to home screen - works offline'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default PWAInstallButton;
