import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Settings2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const COOKIE_CONSENT_KEY = 'autofloy_cookie_consent';

interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const defaultPreferences: CookiePreferences = {
  essential: true, // Always required
  functional: true,
  analytics: false,
  marketing: false,
};

export const CookieConsentBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [hasConsent, setHasConsent] = useState(false);
  
  const { user } = useAuth();
  const location = useLocation();
  
  // Check if user is on protected/dashboard routes
  const isProtectedRoute = location.pathname.startsWith('/dashboard') || 
                           location.pathname.startsWith('/offline-shop') ||
                           location.pathname.startsWith('/business-selector') ||
                           location.pathname.startsWith('/settings') ||
                           location.pathname.startsWith('/automations') ||
                           location.pathname.startsWith('/products') ||
                           location.pathname.startsWith('/logs');

  useEffect(() => {
    // Don't show anything if user is logged in
    if (user) {
      setIsVisible(false);
      setHasConsent(true);
      return;
    }
    
    // Don't show on protected routes
    if (isProtectedRoute) {
      return;
    }
    
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      // User has already consented, don't show anything
      setHasConsent(true);
      try {
        const parsed = JSON.parse(consent);
        setPreferences(parsed.preferences);
      } catch {
        // Invalid consent data
      }
    }
  }, [user, isProtectedRoute]);


  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      preferences: prefs,
      timestamp: new Date().toISOString(),
    }));
    setIsVisible(false);
    setShowCustomize(false);
    setHasConsent(true);
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    saveConsent(allAccepted);
  };

  const handleAcceptSelected = () => {
    saveConsent(preferences);
  };

  const handleRejectAll = () => {
    const onlyEssential: CookiePreferences = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    setPreferences(onlyEssential);
    saveConsent(onlyEssential);
  };

  const cookieTypes = [
    {
      key: 'essential' as const,
      name: 'Essential Cookies',
      description: 'Required for the website to function. Cannot be disabled.',
      disabled: true,
    },
    {
      key: 'functional' as const,
      name: 'Functional Cookies',
      description: 'Remember your preferences and settings for a better experience.',
      disabled: false,
    },
    {
      key: 'analytics' as const,
      name: 'Analytics Cookies',
      description: 'Help us understand how visitors interact with our website.',
      disabled: false,
    },
    {
      key: 'marketing' as const,
      name: 'Marketing Cookies',
      description: 'Used to deliver personalized advertisements.',
      disabled: false,
    },
  ];

  // Don't render anything if user is logged in or has already consented
  if (user || hasConsent) {
    return null;
  }

  return (
    <>
      {/* Cookie Consent Banner */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
          >
            <div className="max-w-4xl mx-auto">
              <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
                {/* Main Banner */}
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="hidden sm:flex w-12 h-12 rounded-xl bg-primary/10 items-center justify-center flex-shrink-0">
                      <Cookie className="w-6 h-6 text-primary" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Cookie className="w-5 h-5 sm:hidden text-primary" />
                          {hasConsent ? 'Cookie Preferences' : 'We value your privacy'}
                        </h3>
                        <button
                          onClick={() => {
                            setIsVisible(false);
                            setShowCustomize(false);
                          }}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1"
                          aria-label="Close"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <p className="text-muted-foreground text-sm mb-4">
                        {hasConsent 
                          ? 'Update your cookie preferences below. Changes will take effect immediately.'
                          : (
                            <>
                              We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                              By clicking "Accept All", you consent to our use of cookies. Read our{' '}
                              <Link to="/cookies" className="text-primary hover:underline">
                                Cookie Policy
                              </Link>{' '}
                              to learn more.
                            </>
                          )
                        }
                      </p>

                      {/* Cookie Preferences (Expandable) */}
                      <AnimatePresence>
                        {showCustomize && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-border pt-4 mb-4 space-y-4">
                              {cookieTypes.map((cookie) => (
                                <div
                                  key={cookie.key}
                                  className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50"
                                >
                                  <div className="flex-1">
                                    <Label
                                      htmlFor={cookie.key}
                                      className="text-sm font-medium cursor-pointer"
                                    >
                                      {cookie.name}
                                    </Label>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {cookie.description}
                                    </p>
                                  </div>
                                  <Switch
                                    id={cookie.key}
                                    checked={preferences[cookie.key]}
                                    onCheckedChange={(checked) =>
                                      setPreferences((prev) => ({ ...prev, [cookie.key]: checked }))
                                    }
                                    disabled={cookie.disabled}
                                  />
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCustomize(!showCustomize)}
                          className="gap-2"
                        >
                          <Settings2 className="w-4 h-4" />
                          {showCustomize ? 'Hide Options' : 'Customize'}
                        </Button>
                        
                        <div className="flex-1" />
                        
                        {!hasConsent && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRejectAll}
                          >
                            Reject All
                          </Button>
                        )}
                        
                        {showCustomize && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAcceptSelected}
                          >
                            Save Preferences
                          </Button>
                        )}
                        
                        <Button
                          variant="gradient"
                          size="sm"
                          onClick={handleAcceptAll}
                          className="gap-2"
                        >
                          <Shield className="w-4 h-4" />
                          Accept All
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Hook to get current cookie preferences
export const useCookiePreferences = (): CookiePreferences | null => {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent) {
      try {
        const parsed = JSON.parse(consent);
        setPreferences(parsed.preferences);
      } catch {
        setPreferences(null);
      }
    }
  }, []);

  return preferences;
};
