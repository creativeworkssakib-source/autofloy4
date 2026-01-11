import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Check, Copy, ChevronDown, ChevronUp, Smartphone, 
  Building2, CreditCard, Loader2, ArrowRight, Shield, Clock, Upload,
  Wallet, Bitcoin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getPlanById } from "@/data/plans";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface DbPaymentMethod {
  id: string;
  name: string;
  type: string;
  account_number: string | null;
  account_name: string | null;
  instructions: string | null;
  icon: string;
  is_active: boolean;
  display_order: number;
  gateway_url: string | null;
  api_key: string | null;
  api_secret: string | null;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  smartphone: Smartphone,
  landmark: Building2,
  "credit-card": CreditCard,
  wallet: Wallet,
  bitcoin: Bitcoin,
  globe: CreditCard, // Use CreditCard as fallback for globe
};

const communities = [
  { id: "none", name: "Select an option" },
  { id: "facebook-group", name: "Facebook Group" },
  { id: "telegram", name: "Telegram Community" },
  { id: "whatsapp", name: "WhatsApp Group" },
  { id: "other", name: "Other" },
];

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings } = useSiteSettings();
  const { user } = useAuth();
  const planId = searchParams.get("plan") || "starter";
  const plan = getPlanById(planId);

  const [paymentMethods, setPaymentMethods] = useState<DbPaymentMethod[]>([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    community: "none",
    paymentMethodId: "",
    transactionId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  // Load payment methods from database with real-time updates
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const { data, error } = await supabase
          .from("payment_methods")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (error) throw error;
        
        setPaymentMethods((data as DbPaymentMethod[]) || []);
        if (data && data.length > 0 && !formData.paymentMethodId) {
          setFormData(prev => ({ ...prev, paymentMethodId: data[0].id }));
        }
      } catch (error) {
        console.error("Error loading payment methods:", error);
        toast({
          title: "Error",
          description: "Failed to load payment methods",
          variant: "destructive",
        });
      } finally {
        setIsLoadingMethods(false);
      }
    };

    loadPaymentMethods();

    // Real-time subscription for payment methods
    const channel = supabase
      .channel("checkout-payment-methods-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payment_methods" },
        () => {
          loadPaymentMethods();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  const selectedMethod = paymentMethods.find(m => m.id === formData.paymentMethodId);

  const handleCopyNumber = () => {
    if (selectedMethod?.account_number) {
      navigator.clipboard.writeText(selectedMethod.account_number);
      toast({ title: "Copied!", description: "Account number copied to clipboard" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    toast({ title: "File selected!", description: file.name });

    // Upload to storage
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `payment-screenshots/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from("uploads")
        .upload(fileName, file);

      if (error) {
        console.error("Upload error:", error);
        // If bucket doesn't exist, we'll still proceed but without screenshot
      } else if (data) {
        const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(fileName);
        setScreenshotUrl(urlData.publicUrl);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ 
        title: "Please login first", 
        description: "You need to be logged in to make a purchase",
        variant: "destructive" 
      });
      navigate("/login?redirect=/checkout?plan=" + planId);
      return;
    }

    if (plan && plan.priceNumeric > 0) {
      if (!formData.transactionId) {
        toast({ title: "Please enter Transaction ID", variant: "destructive" });
        return;
      }

      if (selectedMethod?.type === "bank" && !uploadedFile) {
        toast({ title: "Please upload payment screenshot", variant: "destructive" });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Create payment request in database
      const { error } = await supabase
        .from("payment_requests")
        .insert({
          user_id: user.id,
          plan_id: planId,
          plan_name: plan?.name || planId,
          amount: plan?.priceNumeric || 0,
          currency: "BDT",
          payment_method: selectedMethod?.name || "Unknown",
          transaction_id: formData.transactionId || null,
          screenshot_url: screenshotUrl,
          status: "pending",
        });

      if (error) throw error;

      toast({ 
        title: "Payment Request Submitted! 🎉", 
        description: "Your request is being reviewed. You'll be notified once approved." 
      });
      
      navigate("/dashboard");
    } catch (error) {
      console.error("Error submitting payment request:", error);
      toast({ 
        title: "Submission Failed", 
        description: "Please try again or contact support",
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Wallet;
    return IconComponent;
  };

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Plan not found</h1>
          <Button asChild>
            <Link to="/pricing">Back to Pricing</Link>
          </Button>
        </div>
      </div>
    );
  }

  const visibleFeatures = showAllFeatures ? plan.features : plan.features.slice(0, 4);
  const hasMoreFeatures = plan.features.length > 4;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Button variant="ghost" asChild className="gap-2">
              <Link to="/pricing">
                <ArrowLeft className="h-4 w-4" />
                Back to Pricing
              </Link>
            </Button>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Order Summary - Left Side */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Order Summary Card */}
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                  
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-medium">{plan.name} Plan</span>
                    <span className="font-bold">BDT {plan.priceNumeric.toLocaleString()}</span>
                  </div>

                  {plan.originalPriceNumeric && (
                    <>
                      <div className="flex justify-between items-center text-sm mb-1">
                        <span className="text-muted-foreground">Regular Price</span>
                        <span className="text-muted-foreground line-through">
                          BDT {plan.originalPriceNumeric.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm mb-4">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="text-success font-medium">
                          {plan.discountPercent || 75}% OFF
                        </span>
                      </div>
                    </>
                  )}

                  <div className="border-t border-border my-4" />

                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      BDT {plan.priceNumeric.toLocaleString()}
                    </span>
                  </div>
                  {plan.savings && (
                    <p className="text-right text-sm text-success font-medium">
                      You save {plan.savings.replace("Save ", "")}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Secure Payment & Instant Activation */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-success" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Quick Activation</span>
                </div>
              </div>

              {/* What You Get Card */}
              <Card className="border-border/50 bg-muted/30">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-primary mb-4">What You Get:</h3>
                  <ul className="space-y-2">
                    {visibleFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {hasMoreFeatures && (
                    <button
                      onClick={() => setShowAllFeatures(!showAllFeatures)}
                      className="flex items-center gap-1 text-sm text-primary mt-3 hover:underline"
                    >
                      {showAllFeatures ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          + {plan.features.length - 4} more items
                        </>
                      )}
                    </button>
                  )}
                </CardContent>
              </Card>

              {/* Dynamic Payment Instructions */}
              {plan.priceNumeric > 0 && selectedMethod && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedMethod.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <Card className="border-border/50 overflow-hidden">
                      <CardContent className="p-6">
                        {/* Header with Icon */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            {(() => {
                              const IconComp = getIcon(selectedMethod.icon);
                              return <IconComp className="w-5 h-5 text-primary" />;
                            })()}
                          </div>
                          <div>
                            <h3 className="font-semibold">{selectedMethod.name} Payment</h3>
                            <p className="text-sm text-muted-foreground">Follow the instructions below</p>
                          </div>
                        </div>

                        {/* Instructions */}
                        {selectedMethod.instructions && (
                          <p className="text-sm text-muted-foreground mb-4">
                            {selectedMethod.instructions}
                          </p>
                        )}

                        {/* Account Details */}
                        {selectedMethod.account_number && (
                          <div className="p-4 rounded-xl bg-muted/50 border border-border mb-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  {selectedMethod.type === "bank" ? "Account Number" : "Send Money To"}
                                </p>
                                <p className="font-bold text-lg text-primary">
                                  {selectedMethod.account_number}
                                </p>
                                {selectedMethod.account_name && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {selectedMethod.account_name}
                                  </p>
                                )}
                              </div>
                              <Button variant="outline" size="sm" onClick={handleCopyNumber} className="gap-2">
                                <Copy className="h-4 w-4" />
                                Copy
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* File Upload for Bank Transfer */}
                        {selectedMethod.type === "bank" && (
                          <div className="mt-4">
                            <Label className="text-sm font-medium mb-2 block">
                              Upload Payment Screenshot <span className="text-destructive">*</span>
                            </Label>
                            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                              />
                              <label htmlFor="file-upload" className="cursor-pointer">
                                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                {uploadedFile ? (
                                  <p className="text-sm text-success font-medium">{uploadedFile.name}</p>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    Click to upload or drag and drop
                                  </p>
                                )}
                              </label>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </AnimatePresence>
              )}
            </motion.div>

            {/* Checkout Form - Right Side */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-3"
            >
              <Card className="border-border/50">
                <CardContent className="p-6 lg:p-8">
                  <h2 className="text-2xl font-bold mb-6">Complete Your Purchase</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label htmlFor="fullName">
                        Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="bg-background/50"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email Address <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-background/50"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        Phone Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="01XXXXXXXXX"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="bg-background/50"
                      />
                    </div>

                    {/* Community */}
                    <div className="space-y-2">
                      <Label>How did you find us?</Label>
                      <Select
                        value={formData.community}
                        onValueChange={(value) => setFormData({ ...formData, community: value })}
                      >
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {communities.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Payment Method - Dynamic from Database */}
                    {plan.priceNumeric > 0 && (
                      <div className="space-y-3">
                        <Label>
                          Payment Method <span className="text-destructive">*</span>
                        </Label>
                        {isLoadingMethods ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          </div>
                        ) : paymentMethods.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No payment methods available. Please contact support.
                          </p>
                        ) : (
                          <RadioGroup
                            value={formData.paymentMethodId}
                            onValueChange={(value) => setFormData({ ...formData, paymentMethodId: value })}
                            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                          >
                            {paymentMethods.map((method) => {
                              const IconComp = getIcon(method.icon);
                              return (
                                <div key={method.id}>
                                  <RadioGroupItem
                                    value={method.id}
                                    id={method.id}
                                    className="peer sr-only"
                                  />
                                  <Label
                                    htmlFor={method.id}
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:border-primary/50"
                                  >
                                    <IconComp className="h-5 w-5 text-muted-foreground" />
                                    <span className="font-medium text-sm text-center">{method.name}</span>
                                  </Label>
                                </div>
                              );
                            })}
                          </RadioGroup>
                        )}
                      </div>
                    )}

                    {/* Transaction ID */}
                    {plan.priceNumeric > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="transactionId">
                          Transaction ID <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="transactionId"
                          placeholder="Enter your transaction ID"
                          value={formData.transactionId}
                          onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                          className="bg-background/50"
                        />
                        <p className="text-xs text-muted-foreground">
                          Find this in your payment confirmation SMS or receipt
                        </p>
                      </div>
                    )}

                    {/* Terms */}
                    <p className="text-sm text-muted-foreground text-center">
                      By completing this purchase, you agree to our{" "}
                      <Link to="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </p>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      variant="gradient"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting || (plan.priceNumeric > 0 && paymentMethods.length === 0)}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit Payment Request — ৳{plan.priceNumeric.toLocaleString()}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Your plan will be activated after admin approval (usually within 1-2 hours)
                    </p>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
