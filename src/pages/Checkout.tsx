import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Check, Copy, ChevronDown, ChevronUp, Smartphone, 
  Building2, CreditCard, Loader2, ArrowRight, Shield, Clock, Upload
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

type PaymentMethodId = "bkash" | "nagad" | "rocket" | "upay" | "bank" | "card";

interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const paymentMethods: PaymentMethod[] = [
  { id: "bkash", name: "bKash", icon: Smartphone, color: "#E2136E" },
  { id: "nagad", name: "Nagad", icon: Smartphone, color: "#F6921E" },
  { id: "rocket", name: "Rocket", icon: Smartphone, color: "#8E44AD" },
  { id: "upay", name: "Upay", icon: Smartphone, color: "#00A651" },
  { id: "bank", name: "Bank Transfer", icon: Building2, color: "#1E40AF" },
  { id: "card", name: "Card", icon: CreditCard, color: "#6366F1" },
];

const paymentInstructions: Record<PaymentMethodId, { 
  title: string; 
  subtitle: string;
  steps: string[]; 
  accountNumber?: string;
  accountLabel?: string;
  bankDetails?: { label: string; value: string }[];
  showFileUpload?: boolean;
  isCard?: boolean;
}> = {
  bkash: {
    title: "bKash Payment Instructions",
    subtitle: "Follow these steps",
    steps: [
      "Go to your bKash app or Dial *247#",
      'Choose "Send Money"',
      "Enter our bKash Account Number",
      "Enter total amount",
      "Confirm with your PIN",
      "Copy Transaction ID and paste below",
    ],
    accountNumber: "+8801401918624",
    accountLabel: "Account Number",
  },
  nagad: {
    title: "Nagad Payment Instructions",
    subtitle: "Follow these steps",
    steps: [
      "Go to your Nagad app or Dial *167#",
      'Choose "Send Money"',
      "Enter our Nagad Account Number",
      "Enter total amount",
      "Confirm with your PIN",
      "Copy Transaction ID and paste below",
    ],
    accountNumber: "+8801401918624",
    accountLabel: "Account Number",
  },
  rocket: {
    title: "Rocket Payment Instructions",
    subtitle: "Follow these steps",
    steps: [
      "Go to your Rocket app or Dial *322#",
      'Choose "Send Money"',
      "Enter our Rocket Account Number",
      "Enter total amount",
      "Confirm with your PIN",
      "Copy Transaction ID and paste below",
    ],
    accountNumber: "+8801401918624",
    accountLabel: "Account Number",
  },
  upay: {
    title: "Upay Payment Instructions",
    subtitle: "Follow these steps",
    steps: [
      "Go to your Upay app",
      'Choose "Send Money"',
      "Enter our Upay Account Number",
      "Enter total amount",
      "Confirm with your PIN",
      "Copy Transaction ID and paste below",
    ],
    accountNumber: "+8801401918624",
    accountLabel: "Account Number",
  },
  bank: {
    title: "Bank Transfer Instructions",
    subtitle: "Transfer to our bank account",
    steps: [
      "Transfer the amount to the bank account above",
      "Take a payment screenshot",
      "Upload payment screenshot below",
      "Enter transaction/reference number",
    ],
    bankDetails: [
      { label: "Bank Name", value: "Dutch-Bangla Bank Ltd." },
      { label: "Account Holder", value: "AutoFloy Technologies" },
      { label: "Account Number", value: "1234567890123" },
      { label: "Branch Name", value: "Dhaka Main Branch" },
    ],
    showFileUpload: true,
  },
  card: {
    title: "Card Payment Instructions",
    subtitle: "Secure payment gateway",
    steps: [
      'Click "Proceed to Card Payment"',
      "Enter card details securely",
      "Complete payment",
      "Return automatically after success",
    ],
    isCard: true,
  },
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
  const planId = searchParams.get("plan") || "starter";
  const plan = getPlanById(planId);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    community: "none",
    paymentMethod: "bkash" as PaymentMethodId,
    transactionId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const currentInstructions = paymentInstructions[formData.paymentMethod];

  const handleCopyNumber = () => {
    if (currentInstructions.accountNumber) {
      navigator.clipboard.writeText(currentInstructions.accountNumber);
      toast({ title: "Copied!", description: "Account number copied to clipboard" });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toast({ title: "File uploaded!", description: file.name });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (plan && plan.priceNumeric > 0 && formData.paymentMethod !== "card" && !formData.transactionId) {
      toast({ title: "Please enter Transaction ID", variant: "destructive" });
      return;
    }

    if (formData.paymentMethod === "bank" && !uploadedFile) {
      toast({ title: "Please upload payment screenshot", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 2000));
    
    toast({ 
      title: "Purchase Successful! 🎉", 
      description: "Your order has been placed. Check your email for details." 
    });
    
    setIsSubmitting(false);
    navigate("/dashboard");
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
                  <span>Instant Activation</span>
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
              {plan.priceNumeric > 0 && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={formData.paymentMethod}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <Card className="border-border/50 overflow-hidden">
                      <CardContent className="p-6">
                        {/* Header with Icon */}
                        <div className="flex items-center gap-3 mb-4">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ 
                              backgroundColor: `${paymentMethods.find(m => m.id === formData.paymentMethod)?.color}15`,
                            }}
                          >
                            <Smartphone 
                              className="w-5 h-5" 
                              style={{ color: paymentMethods.find(m => m.id === formData.paymentMethod)?.color }}
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold">{currentInstructions.title}</h3>
                            <p className="text-sm text-muted-foreground">{currentInstructions.subtitle}</p>
                          </div>
                        </div>

                        {/* Bank Details for Bank Transfer */}
                        {currentInstructions.bankDetails && (
                          <div className="mb-4 p-4 rounded-xl bg-muted/50 border border-border space-y-2">
                            {currentInstructions.bankDetails.map((detail, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{detail.label}:</span>
                                <span className="font-medium">
                                  {detail.label === "Account Holder" ? `${settings.company_name} Technologies` : detail.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Card Info */}
                        {currentInstructions.isCard && (
                          <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
                            <p className="text-sm mb-2">
                              You will be redirected to a secure payment gateway.
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Supports Visa, MasterCard, and AMEX
                            </p>
                          </div>
                        )}
                        
                        {/* Steps */}
                        <ol className="space-y-3 text-sm">
                          {currentInstructions.steps.map((step, index) => (
                            <motion.li 
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex gap-3"
                            >
                              <span 
                                className="flex-shrink-0 w-5 h-5 rounded-full text-xs flex items-center justify-center font-medium text-primary-foreground"
                                style={{ 
                                  background: `linear-gradient(135deg, ${paymentMethods.find(m => m.id === formData.paymentMethod)?.color}, ${paymentMethods.find(m => m.id === formData.paymentMethod)?.color}99)`,
                                }}
                              >
                                {index + 1}
                              </span>
                              <span>{step}</span>
                            </motion.li>
                          ))}
                        </ol>

                        {/* Account Number Box */}
                        {currentInstructions.accountNumber && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mt-4 p-4 rounded-xl bg-muted/50 border border-border"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  {currentInstructions.accountLabel}
                                </p>
                                <p 
                                  className="font-bold text-lg"
                                  style={{ color: paymentMethods.find(m => m.id === formData.paymentMethod)?.color }}
                                >
                                  {currentInstructions.accountNumber}
                                </p>
                              </div>
                              <Button variant="outline" size="sm" onClick={handleCopyNumber} className="gap-2">
                                <Copy className="h-4 w-4" />
                                Copy
                              </Button>
                            </div>
                          </motion.div>
                        )}

                        {/* File Upload for Bank Transfer */}
                        {currentInstructions.showFileUpload && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mt-4"
                          >
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
                          </motion.div>
                        )}

                        {/* Proceed to Card Payment Button */}
                        {currentInstructions.isCard && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mt-4"
                          >
                            <Button variant="gradient" className="w-full" size="lg">
                              Proceed to Card Payment
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </motion.div>
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

                    {/* Payment Method */}
                    {plan.priceNumeric > 0 && (
                      <div className="space-y-3">
                        <Label>
                          Payment Method <span className="text-destructive">*</span>
                        </Label>
                        <RadioGroup
                          value={formData.paymentMethod}
                          onValueChange={(value) => setFormData({ ...formData, paymentMethod: value as PaymentMethodId })}
                          className="grid grid-cols-3 gap-3"
                        >
                          {paymentMethods.map((method) => (
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
                                <method.icon className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium text-sm text-center">{method.name}</span>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    )}

                    {/* Transaction ID (not for Card payments) */}
                    {plan.priceNumeric > 0 && formData.paymentMethod !== "card" && (
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
                          Find this in your payment confirmation SMS
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
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Complete Purchase — ৳{plan.priceNumeric.toLocaleString()}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
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
