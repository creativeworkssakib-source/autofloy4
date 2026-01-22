import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/UserAvatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { authService } from "@/services/authService";
import { fetchUserSettings, updateUserSettings, UserSettings, fetchConnectedAccounts, disconnectAccount, ConnectedAccount, fetchDashboardStats, DashboardStats } from "@/services/apiService";
import { getPlanCapabilities, planDisplayNames, PlanId } from "@/data/planCapabilities";
import { plans, getPlanById } from "@/data/plans";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { DeleteAccountDialog } from "@/components/settings/DeleteAccountDialog";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { VerificationBadge } from "@/components/settings/VerificationBadge";
import { PlanComparisonModal } from "@/components/upgrade/PlanComparisonModal";
import {
  User,
  Mail,
  Phone,
  Lock,
  Trash2,
  Camera,
  Save,
  Bot,
  Globe,
  Bell,
  BellRing,
  Volume2,
  CreditCard,
  Calendar,
  TrendingUp,
  Receipt,
  Crown,
  Facebook,
  MessageCircle,
  Mail as MailIcon,
  Link2,
  Unlink,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const { updateSoundEnabled } = useNotificationContext();
  const { language, setLanguage, t } = useLanguage();
  const { hasFeature, planName, capabilities } = usePlanLimits();
  const [activeTab, setActiveTab] = useState("account");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingAutomation, setIsSavingAutomation] = useState(false);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  const [isLoadingBillingStats, setIsLoadingBillingStats] = useState(true);
  const [billingStats, setBillingStats] = useState<{
    automationsUsed: number;
    maxAutomations: number | null;
    messagesHandled: number;
    connectedPages: number;
    maxPages: number;
  }>({
    automationsUsed: 0,
    maxAutomations: null,
    messagesHandled: 0,
    connectedPages: 0,
    maxPages: 1,
  });

  // Account state - initialized from user context
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Update profile when user changes
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  // Automation settings state
  const [automationSettings, setAutomationSettings] = useState<{
    defaultTone: "friendly" | "professional" | "casual";
    language: "bengali" | "english" | "mixed";
    emailNotifications: boolean;
    pushNotifications: boolean;
    soundAlerts: boolean;
    dailyDigest: boolean;
  }>({
    defaultTone: "friendly",
    language: "bengali",
    emailNotifications: true,
    pushNotifications: true,
    soundAlerts: false,
    dailyDigest: true,
  });

  // Load user settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoadingSettings(true);
      try {
        const settings = await fetchUserSettings();
        if (settings) {
          setAutomationSettings({
            defaultTone: settings.default_tone,
            language: settings.response_language,
            emailNotifications: settings.email_notifications,
            pushNotifications: settings.push_notifications,
            soundAlerts: settings.sound_alerts,
            dailyDigest: settings.daily_digest,
          });
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    loadSettings();
  }, []);

  // Connected services state - real data from API
  const [connectedServices, setConnectedServices] = useState<{
    facebook: { connected: boolean; pages: number; lastSync: string; accounts: ConnectedAccount[] };
    instagram: { connected: boolean; comingSoon: boolean };
    whatsapp: { connected: boolean; comingSoon: boolean };
    email: { connected: boolean; comingSoon: boolean };
  }>({
    facebook: { connected: false, pages: 0, lastSync: "", accounts: [] },
    instagram: { connected: false, comingSoon: true },
    whatsapp: { connected: false, comingSoon: true },
    email: { connected: false, comingSoon: true },
  });

  // Load connected accounts from API
  useEffect(() => {
    const loadConnectedAccounts = async () => {
      setIsLoadingConnections(true);
      try {
        const accounts = await fetchConnectedAccounts("facebook");
        const connectedAccounts = accounts.filter((a) => a.is_connected);
        
        setConnectedServices((prev) => ({
          ...prev,
          facebook: {
            connected: connectedAccounts.length > 0,
            pages: connectedAccounts.length,
            lastSync: connectedAccounts.length > 0 
              ? formatLastSync(connectedAccounts[0].created_at) 
              : "",
            accounts: connectedAccounts,
          },
        }));
      } catch (error) {
        console.error("Failed to load connected accounts:", error);
      } finally {
        setIsLoadingConnections(false);
      }
    };
    
    loadConnectedAccounts();
  }, []);

  // Helper function to format last sync time
  const formatLastSync = (dateStr: string | null): string => {
    if (!dateStr) return "Unknown";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await authService.updateProfile({
        display_name: profile.name,
        phone: profile.phone,
      });
      await refreshUser();
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Failed to Update",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // This is called AFTER successful 2FA verification in DeleteAccountDialog
  const handleDeleteAccount = async () => {
    // Account is already deleted via 2FA in the dialog
    // Just cleanup local state and redirect
    toast({
      title: "Account Deleted",
      description: "Your account has been permanently deleted.",
    });
    logout();
    navigate("/");
  };

  const handleVerifyEmail = async () => {
    await authService.requestEmailOtp();
    navigate("/verify-email");
  };

  const handleVerifyPhone = async () => {
    await authService.requestPhoneOtp();
    // Navigate to phone verification page or show OTP modal
    toast({
      title: "Verification Code Sent",
      description: "Please check your phone for the verification code.",
    });
  };

  const handleSaveAutomation = async () => {
    setIsSavingAutomation(true);
    try {
      const result = await updateUserSettings({
        default_tone: automationSettings.defaultTone,
        response_language: automationSettings.language,
      });
      if (result) {
        toast({
          title: "Settings Saved",
          description: "Automation preferences updated and synced.",
        });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast({
        title: "Failed to Save",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSavingAutomation(false);
    }
  };

  const handleNotificationToggle = async (
    key: "email_notifications" | "push_notifications" | "sound_alerts" | "daily_digest",
    value: boolean
  ) => {
    // Map settings key to state key
    const stateKeyMap: Record<string, keyof typeof automationSettings> = {
      email_notifications: "emailNotifications",
      push_notifications: "pushNotifications",
      sound_alerts: "soundAlerts",
      daily_digest: "dailyDigest",
    };
    const stateKey = stateKeyMap[key];
    
    // Optimistically update UI
    setAutomationSettings(s => ({ ...s, [stateKey]: value }));
    
    // Update sound setting in notification context immediately
    if (key === "sound_alerts") {
      updateSoundEnabled(value);
    }
    
    try {
      const result = await updateUserSettings({ [key]: value });
      if (!result) {
        // Revert on failure
        setAutomationSettings(s => ({ ...s, [stateKey]: !value }));
        if (key === "sound_alerts") {
          updateSoundEnabled(!value);
        }
        toast({
          title: "Failed to Update",
          description: "Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Settings Updated",
          description: `${key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())} ${value ? "enabled" : "disabled"}.`,
        });
      }
    } catch (error) {
      // Revert on error
      setAutomationSettings(s => ({ ...s, [stateKey]: !value }));
      if (key === "sound_alerts") {
        updateSoundEnabled(!value);
      }
      toast({
        title: "Failed to Update",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null);

  const handleDisconnectPlatform = async (platform: string) => {
    const accounts = platform === "facebook" ? connectedServices.facebook.accounts : [];
    
    if (accounts.length === 0) {
      toast({
        title: "No accounts to disconnect",
        description: `No ${platform} accounts are connected.`,
        variant: "destructive",
      });
      return;
    }

    setIsDisconnecting(platform);
    
    try {
      // Disconnect all accounts for this platform
      const disconnectPromises = accounts.map((account) => disconnectAccount(account.id));
      const results = await Promise.all(disconnectPromises);
      
      const allSuccessful = results.every((result) => result.success === true);
      
      if (allSuccessful) {
        // Update local state
        if (platform === "facebook") {
          setConnectedServices((prev) => ({
            ...prev,
            facebook: { connected: false, pages: 0, lastSync: "", accounts: [] },
          }));
        }
        
        toast({
          title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Disconnected`,
          description: `Your ${platform} accounts have been disconnected successfully.`,
        });
      } else {
        toast({
          title: "Partial Disconnect",
          description: "Some accounts may not have been disconnected. Please try again.",
          variant: "destructive",
        });
        
        // Reload connection status
        const updatedAccounts = await fetchConnectedAccounts(platform);
        const connectedAccounts = updatedAccounts.filter((a) => a.is_connected);
        
        if (platform === "facebook") {
          setConnectedServices((prev) => ({
            ...prev,
            facebook: {
              connected: connectedAccounts.length > 0,
              pages: connectedAccounts.length,
              lastSync: connectedAccounts.length > 0 
                ? formatLastSync(connectedAccounts[0].created_at) 
                : "",
              accounts: connectedAccounts,
            },
          }));
        }
      }
    } catch (error) {
      console.error(`Failed to disconnect ${platform}:`, error);
      toast({
        title: "Disconnect Failed",
        description: `Failed to disconnect ${platform}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsDisconnecting(null);
    }
  };

  const handleConnectPlatform = (platform: string) => {
    // Navigate to automations page for connection
    navigate("/dashboard/automations");
  };

  // Load billing stats from API
  useEffect(() => {
    const loadBillingStats = async () => {
      setIsLoadingBillingStats(true);
      try {
        const stats = await fetchDashboardStats();
        const planId = (user?.subscriptionPlan || 'none') as PlanId;
        const capabilities = getPlanCapabilities(planId);
        
        if (stats) {
          setBillingStats({
            automationsUsed: stats.activeAutomations,
            maxAutomations: capabilities.maxAutomationsPerMonth,
            messagesHandled: stats.messagesHandled,
            connectedPages: stats.connectedPages,
            maxPages: capabilities.maxFacebookPages,
          });
        }
      } catch (error) {
        console.error("Failed to load billing stats:", error);
      } finally {
        setIsLoadingBillingStats(false);
      }
    };
    
    if (user) {
      loadBillingStats();
    }
  }, [user]);

  const getPlanDisplayName = (plan: string): string => {
    const planNames: Record<string, string> = {
      trial: "Free Trial",
      starter: "Starter Plan",
      professional: "Professional Plan",
      business: "Business Plan",
      lifetime: "Lifetime Access",
      none: "No Plan",
    };
    return planNames[plan] || `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`;
  };

  const getPlanPrice = (plan: string): string => {
    const planData = getPlanById(plan === 'trial' ? 'free-trial' : plan);
    return planData?.price || '৳0';
  };

  const getSubscriptionStatus = (): { status: string; color: string } => {
    if (!user) return { status: 'Inactive', color: 'destructive' };
    
    const plan = user.subscriptionPlan;
    if (plan === 'none') return { status: 'Inactive', color: 'destructive' };
    if (plan === 'lifetime') return { status: 'Active', color: 'success' };
    if (plan === 'trial') {
      if (user.isTrialActive) return { status: 'Active', color: 'success' };
      return { status: 'Expired', color: 'destructive' };
    }
    
    // Check if subscription is active
    if (user.subscriptionEndsAt) {
      const endsAt = new Date(user.subscriptionEndsAt);
      if (endsAt > new Date()) return { status: 'Active', color: 'success' };
      return { status: 'Expired', color: 'destructive' };
    }
    
    return { status: 'Active', color: 'success' };
  };

  const getSubscriptionDescription = (): string => {
    if (!user) return 'No active subscription';
    
    const plan = user.subscriptionPlan;
    if (plan === 'lifetime') return 'Lifetime access - No renewal needed';
    if (plan === 'trial') {
      if (user.trialEndDate) {
        const endDate = new Date(user.trialEndDate);
        const now = new Date();
        if (endDate > now) {
          const hoursLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60));
          if (hoursLeft <= 24) return `Trial ends in ${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}`;
          return `Trial ends ${endDate.toLocaleDateString()}`;
        }
        return 'Trial expired';
      }
      return 'Trial active';
    }
    if (plan === 'none') return 'No active subscription';
    
    // Paid subscription
    if (user.subscriptionEndsAt) {
      const endsAt = new Date(user.subscriptionEndsAt);
      if (endsAt > new Date()) {
        return `Renews on ${endsAt.toLocaleDateString()}`;
      }
      return 'Subscription expired';
    }
    
    return 'Active subscription';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Settings Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid bg-muted/50 p-1 h-auto">
              <TabsTrigger value="account" className="gap-2 px-3 py-2.5">
                <User className="h-4 w-4 shrink-0" />
                <span className="text-xs sm:text-sm">{t("settings.account")}</span>
              </TabsTrigger>
              <TabsTrigger value="automations" className="gap-2 px-3 py-2.5">
                <Bot className="h-4 w-4 shrink-0" />
                <span className="text-xs sm:text-sm">{t("settings.automations")}</span>
              </TabsTrigger>
              <TabsTrigger value="billing" className="gap-2 px-3 py-2.5">
                <CreditCard className="h-4 w-4 shrink-0" />
                <span className="text-xs sm:text-sm">{t("settings.billing")}</span>
              </TabsTrigger>
              <TabsTrigger value="services" className="gap-2 px-3 py-2.5">
                <Link2 className="h-4 w-4 shrink-0" />
                <span className="text-xs sm:text-sm">{t("settings.services")}</span>
              </TabsTrigger>
            </TabsList>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-6">
              {/* Profile Section */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal details and profile picture
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    <div className="relative group">
                      <UserAvatar 
                        name={profile.name} 
                        avatarUrl={user?.avatarUrl} 
                        size="xl" 
                        className="border-4 border-primary/20"
                      />
                      <button className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-6 w-6 text-white" />
                      </button>
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="font-semibold text-lg">{profile.name || 'User'}</h3>
                      <p className="text-sm text-muted-foreground truncate max-w-[250px]">{profile.email}</p>
                      <Badge variant="secondary" className="mt-2">
                        <Crown className="h-3 w-3 mr-1" />
                        {getPlanDisplayName(user?.subscriptionPlan || 'none')}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Form Fields */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        Email Address
                        <VerificationBadge
                          isVerified={user?.emailVerified ?? false}
                          type="email"
                          onVerify={handleVerifyEmail}
                        />
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        disabled
                        className="bg-background/50 opacity-60"
                      />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        Phone Number
                        <VerificationBadge
                          isVerified={user?.phoneVerified ?? false}
                          type="phone"
                          onVerify={handleVerifyPhone}
                        />
                      </Label>
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                        className="bg-background/50"
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile} className="gap-2" disabled={isSavingProfile}>
                    {isSavingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </CardContent>
              </Card>

              {/* Security Section */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    Security
                  </CardTitle>
                  <CardDescription>
                    Manage your password and account security
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChangePasswordForm />
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Irreversible actions that affect your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    className="gap-2"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    This will permanently delete your account and all associated data.
                  </p>
                </CardContent>
              </Card>

              {/* Language Section */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    {t("settings.language")}
                  </CardTitle>
                  <CardDescription>
                    {t("settings.languageDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setLanguage("en")}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        language === "en" 
                          ? "border-primary bg-primary/10" 
                          : "border-border hover:border-primary/50 bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🇺🇸</span>
                        <div>
                          <p className="font-medium">{t("settings.english")}</p>
                          <p className="text-sm text-muted-foreground">English</p>
                        </div>
                        {language === "en" && (
                          <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />
                        )}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage("bn")}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        language === "bn" 
                          ? "border-primary bg-primary/10" 
                          : "border-border hover:border-primary/50 bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🇧🇩</span>
                        <div>
                          <p className="font-medium">{t("settings.bengali")}</p>
                          <p className="text-sm text-muted-foreground">বাংলা</p>
                        </div>
                        {language === "bn" && (
                          <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />
                        )}
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Automations Tab */}
            <TabsContent value="automations" className="space-y-6">
              {/* Default Settings */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    Default Automation Settings
                  </CardTitle>
                  <CardDescription>
                    Configure default behavior for new automations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                        Default Tone
                      </Label>
                      <Select
                        value={automationSettings.defaultTone}
                        onValueChange={(value: "friendly" | "professional" | "casual") => setAutomationSettings(s => ({ ...s, defaultTone: value }))}
                      >
                        <SelectTrigger className="bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="friendly">😊 Friendly</SelectItem>
                          <SelectItem value="professional">💼 Professional</SelectItem>
                          <SelectItem value="casual">😎 Casual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        Response Language
                      </Label>
                      <Select
                        value={automationSettings.language}
                        onValueChange={(value: "bengali" | "english" | "mixed") => setAutomationSettings(s => ({ ...s, language: value }))}
                      >
                        <SelectTrigger className="bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bengali">🇧🇩 Bengali (বাংলা)</SelectItem>
                          <SelectItem value="english">🇺🇸 English</SelectItem>
                          <SelectItem value="mixed">🔄 Mixed (Bengali + English)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleSaveAutomation} className="gap-2" disabled={isSavingAutomation || isLoadingSettings}>
                    {isSavingAutomation ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to be notified about automation events
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive updates via email</p>
                        </div>
                      </div>
                      <Switch
                        checked={automationSettings.emailNotifications}
                        onCheckedChange={(checked) => handleNotificationToggle("email_notifications", checked)}
                        disabled={isLoadingSettings}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <BellRing className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Push Notifications</p>
                          <p className="text-sm text-muted-foreground">Browser push notifications</p>
                        </div>
                      </div>
                      <Switch
                        checked={automationSettings.pushNotifications}
                        onCheckedChange={(checked) => handleNotificationToggle("push_notifications", checked)}
                        disabled={isLoadingSettings}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Volume2 className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Sound Alerts</p>
                          <p className="text-sm text-muted-foreground">Play sound for new events</p>
                        </div>
                      </div>
                      <Switch
                        checked={automationSettings.soundAlerts}
                        onCheckedChange={(checked) => handleNotificationToggle("sound_alerts", checked)}
                        disabled={isLoadingSettings}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Receipt className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Daily Digest</p>
                          <p className="text-sm text-muted-foreground">Summary of daily automation activity</p>
                        </div>
                      </div>
                      <Switch
                        checked={automationSettings.dailyDigest}
                        onCheckedChange={(checked) => handleNotificationToggle("daily_digest", checked)}
                        disabled={isLoadingSettings}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="space-y-6">
              {/* Current Plan */}
              <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    Current Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl sm:text-2xl font-bold">{getPlanDisplayName(user?.subscriptionPlan || 'none')}</h3>
                        <Badge className={`${getSubscriptionStatus().color === 'success' ? 'bg-success/20 text-success border-success/30' : 'bg-destructive/20 text-destructive border-destructive/30'}`}>
                          {getSubscriptionStatus().status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                        {getSubscriptionDescription()}
                      </p>
                      {user?.subscriptionPlan && user.subscriptionPlan !== 'none' && user.subscriptionPlan !== 'trial' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {getPlanPrice(user.subscriptionPlan)}/month
                        </p>
                      )}
                    </div>
                    {user?.subscriptionPlan !== 'lifetime' && (
                      <Button 
                        variant="gradient" 
                        className="gap-2"
                        onClick={() => setShowUpgradeModal(true)}
                      >
                        <TrendingUp className="h-4 w-4" />
                        Upgrade Plan
                      </Button>
                    )}
                  </div>

                  <Separator />

                  {/* Usage Stats */}
                  {isLoadingBillingStats ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">Loading usage stats...</span>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Automations Active</span>
                          <span className="font-medium">
                            {billingStats.automationsUsed}
                            {billingStats.maxAutomations !== null ? `/${billingStats.maxAutomations}` : ''}
                          </span>
                        </div>
                        <Progress 
                          value={billingStats.maxAutomations !== null 
                            ? (billingStats.automationsUsed / billingStats.maxAutomations) * 100 
                            : 50} 
                          className="h-2" 
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Messages Handled</span>
                          <span className="font-medium">{billingStats.messagesHandled.toLocaleString()}</span>
                        </div>
                        <Progress value={Math.min((billingStats.messagesHandled / 100) * 100, 100)} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Connected Pages</span>
                          <span className="font-medium">{billingStats.connectedPages}/{billingStats.maxPages}</span>
                        </div>
                        <Progress 
                          value={billingStats.maxPages > 0 ? (billingStats.connectedPages / billingStats.maxPages) * 100 : 0} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Method - Only show for paid plans */}
              {user?.subscriptionPlan && !['none', 'trial'].includes(user.subscriptionPlan) && (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg border border-border/50 bg-muted/20">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-primary/10 shrink-0">
                          <CreditCard className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm sm:text-base">Payment managed by provider</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">Contact support to update payment details</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                        <Link to="/contact">Contact Support</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Subscription Info */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    Subscription Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {user?.subscriptionStartedAt && (
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-success/10 shrink-0">
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          </div>
                          <div>
                            <p className="font-medium text-sm sm:text-base">Subscription Started</p>
                            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {new Date(user.subscriptionStartedAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs text-success border-success/30 shrink-0">
                          Active
                        </Badge>
                      </div>
                    )}
                    
                    {user?.subscriptionEndsAt && user.subscriptionPlan !== 'lifetime' && (
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                            <Clock className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm sm:text-base">Next Renewal</p>
                            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {new Date(user.subscriptionEndsAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-sm sm:text-base">{getPlanPrice(user.subscriptionPlan)}</p>
                        </div>
                      </div>
                    )}
                    
                    {user?.subscriptionPlan === 'lifetime' && (
                      <div className="flex items-center justify-between p-4 rounded-lg border border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                            <Crown className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm sm:text-base">Lifetime Access</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">No renewal needed - Access forever!</p>
                          </div>
                        </div>
                        <Badge className="bg-gradient-to-r from-primary to-secondary text-primary-foreground shrink-0">
                          Forever
                        </Badge>
                      </div>
                    )}
                    
                    {(!user?.subscriptionStartedAt && user?.subscriptionPlan === 'trial') && (
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/20">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-warning/10 shrink-0">
                            <AlertCircle className="h-5 w-5 text-warning" />
                          </div>
                          <div>
                            <p className="font-medium text-sm sm:text-base">Free Trial</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {user?.trialEndDate 
                                ? `Ends ${new Date(user.trialEndDate).toLocaleDateString()}`
                                : 'Trial active'}
                            </p>
                          </div>
                        </div>
                        <Button variant="gradient" size="sm" onClick={() => setShowUpgradeModal(true)}>
                          Upgrade Now
                        </Button>
                      </div>
                    )}
                    
                    {user?.subscriptionPlan === 'none' && (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h4 className="font-semibold mb-2">No Active Subscription</h4>
                        <p className="text-muted-foreground text-sm mb-4">Choose a plan to get started with AutoFloy</p>
                        <Button variant="gradient" onClick={() => setShowUpgradeModal(true)}>
                          View Plans
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Connected Services Tab */}
            <TabsContent value="services" className="space-y-6">
              {/* Intro Card */}
              <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Link2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Platform Connections</p>
                      <p className="text-sm text-muted-foreground">
                        Manage all your connected platforms from here. Visit Automations to connect new platforms.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Facebook */}
              <Card className={`border-border/50 bg-card/50 backdrop-blur-sm ${connectedServices.facebook.connected ? 'border-l-4 border-l-[#1877F2]' : ''}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Facebook className="h-5 w-5 text-[#1877F2]" />
                    Facebook
                    {isLoadingConnections && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    Auto-reply to inbox messages, comments, and FAQs with AI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingConnections ? (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Checking connection status...</span>
                    </div>
                  ) : connectedServices.facebook.connected ? (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-[#1877F2]/10 border border-[#1877F2]/20">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="p-2 sm:p-3 rounded-full bg-[#1877F2]/20 shrink-0">
                            <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-[#1877F2]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-[#1877F2]">Connected</p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              {connectedServices.facebook.pages} page{connectedServices.facebook.pages !== 1 ? 's' : ''} connected
                              {connectedServices.facebook.lastSync && ` • Last sync: ${connectedServices.facebook.lastSync}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button variant="outline" size="sm" className="gap-1.5 text-xs sm:text-sm" asChild>
                            <Link to="/dashboard/automations">
                              <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              Manage
                            </Link>
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="gap-1.5 text-xs sm:text-sm" 
                            onClick={() => handleDisconnectPlatform("facebook")}
                            disabled={isDisconnecting === "facebook"}
                          >
                            {isDisconnecting === "facebook" ? (
                              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                            ) : (
                              <Unlink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            )}
                            <span className="hidden xs:inline">{isDisconnecting === "facebook" ? "Disconnecting..." : "Disconnect"}</span>
                            <span className="xs:hidden">X</span>
                          </Button>
                        </div>
                      </div>
                      {/* Show connected page names */}
                      {connectedServices.facebook.accounts.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {connectedServices.facebook.accounts.map((account) => (
                            <Badge key={account.id} variant="secondary" className="text-xs">
                              {account.name || "Facebook Page"}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border">
                        <div className="p-2 rounded-full bg-muted">
                          <Facebook className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Not Connected</p>
                          <p className="text-sm text-muted-foreground">Connect your Facebook pages to enable AI automation</p>
                        </div>
                      </div>
                      <Button className="gap-2 bg-[#1877F2] hover:bg-[#1877F2]/90" onClick={() => handleConnectPlatform("facebook")}>
                        <Facebook className="h-4 w-4" />
                        Connect Facebook
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Instagram */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm opacity-75">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] flex items-center justify-center">
                      <span className="text-white text-xs font-bold">IG</span>
                    </div>
                    Instagram
                    <Badge variant="secondary" className="ml-2">
                      <Clock className="h-3 w-3 mr-1" />
                      Coming Soon
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Automate DM replies, story mentions, and comment responses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button disabled className="gap-2">
                    Connect Instagram
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Instagram integration will be available soon
                  </p>
                </CardContent>
              </Card>

              {/* WhatsApp */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm opacity-75">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-[#25D366]" />
                    WhatsApp Business
                    <Badge variant="secondary" className="ml-2">
                      <Clock className="h-3 w-3 mr-1" />
                      Coming Soon
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    AI-powered customer support and automated business messaging
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button disabled className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Connect WhatsApp
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    WhatsApp integration will be available soon
                  </p>
                </CardContent>
              </Card>

              {/* Email */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm opacity-75">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MailIcon className="h-5 w-5 text-primary" />
                    Email Integration
                    <Badge variant="secondary" className="ml-2">
                      <Clock className="h-3 w-3 mr-1" />
                      Coming Soon
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    AI-powered email responses and automated follow-ups
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button disabled className="gap-2">
                    <MailIcon className="h-4 w-4" />
                    Connect Email
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Email integration will be available soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteAccount}
        isLoading={isDeletingAccount}
      />

      {/* Plan Comparison Modal */}
      <PlanComparisonModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentPlan={user?.subscriptionPlan || "none"}
      />
    </DashboardLayout>
  );
};

export default Settings;
