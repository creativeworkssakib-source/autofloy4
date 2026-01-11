import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CreditCard,
  Check,
  Upload,
  Smartphone,
  Building2,
  Copy,
  CheckCircle,
  ArrowRight,
  Crown,
  Sparkles,
  Shield,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { plans, type Plan } from "@/data/plans";
import { submitPaymentRequest } from "@/services/paymentService";
import ShopLayout from "@/components/offline-shop/ShopLayout";

type PaymentMethodId = "bkash" | "nagad" | "rocket" | "bank";

interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  icon: React.ReactNode;
  accountNumber: string;
  accountType: string;
  color: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "bkash",
    name: "bKash",
    icon: <Smartphone className="w-5 h-5" />,
    accountNumber: "01712345678",
    accountType: "Personal",
    color: "bg-pink-500",
  },
  {
    id: "nagad",
    name: "Nagad",
    icon: <Smartphone className="w-5 h-5" />,
    accountNumber: "01712345678",
    accountType: "Personal",
    color: "bg-orange-500",
  },
  {
    id: "rocket",
    name: "Rocket",
    icon: <Smartphone className="w-5 h-5" />,
    accountNumber: "01712345678",
    accountType: "Personal",
    color: "bg-purple-500",
  },
  {
    id: "bank",
    name: "Bank Transfer",
    icon: <Building2 className="w-5 h-5" />,
    accountNumber: "1234567890",
    accountType: "Current A/C",
    color: "bg-blue-600",
  },
];

const UpgradePlan = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodId>("bkash");
  const [transactionId, setTransactionId] = useState("");
  const [step, setStep] = useState<"plans" | "payment" | "success">("plans");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: (data: { planId: string; amount: number; paymentMethod: string; transactionId: string }) =>
      submitPaymentRequest(data),
    onSuccess: () => {
      setStep("success");
      toast.success("Payment request submitted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit payment request");
    },
  });

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSelectPlan = (plan: Plan) => {
    if (plan.id === "free-trial" || plan.id === "lifetime") {
      toast.info(plan.id === "lifetime" ? "Please contact us for Lifetime plan" : "You're already on trial!");
      return;
    }
    setSelectedPlan(plan);
    setStep("payment");
  };

  const handleSubmitPayment = () => {
    if (!selectedPlan || !transactionId.trim()) {
      toast.error("Please enter your transaction ID");
      return;
    }

    submitMutation.mutate({
      planId: selectedPlan.id,
      amount: selectedPlan.priceNumeric,
      paymentMethod: selectedPaymentMethod,
      transactionId: transactionId.trim(),
    });
  };

  const currentPaymentMethod = paymentMethods.find((m) => m.id === selectedPaymentMethod);

  // Filter only paid plans
  const paidPlans = plans.filter((p) => p.id !== "free-trial" && p.id !== "lifetime" && p.priceNumeric > 0);

  if (step === "success") {
    return (
      <ShopLayout>
        <div className="max-w-lg mx-auto py-12">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-6"
          >
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold">Payment Request Submitted!</h1>
            <p className="text-muted-foreground">
              Your payment request has been submitted successfully. Our team will verify your payment and
              activate your plan within 1-2 hours.
            </p>
            <div className="p-4 bg-muted rounded-lg space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-medium">{selectedPlan?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">{selectedPlan?.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID:</span>
                <span className="font-mono">{transactionId}</span>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/offline-shop")}>
                Go to Dashboard
              </Button>
              <Button onClick={() => navigate("/payment-history")}>
                View Payment History
              </Button>
            </div>
          </motion.div>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Crown className="w-8 h-8 text-yellow-500" />
            Upgrade Your Plan
          </h1>
          <p className="text-muted-foreground">
            Choose a plan that fits your business needs
          </p>
        </div>

        {step === "plans" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {paidPlans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`relative cursor-pointer transition-all hover:shadow-lg ${
                    plan.popular ? "border-primary shadow-md" : ""
                  } ${user?.subscriptionPlan === plan.id ? "opacity-50" : ""}`}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <Badge className={plan.badgeColor} variant="outline">
                      {plan.badge}
                    </Badge>
                    <CardTitle className="text-xl mt-2">{plan.name}</CardTitle>
                    <div className="mt-3">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    {plan.originalPrice && (
                      <p className="text-sm">
                        <span className="line-through text-muted-foreground">{plan.originalPrice}</span>
                        <Badge variant="secondary" className="ml-2">
                          {plan.savings}
                        </Badge>
                      </p>
                    )}
                    <CardDescription className="mt-2">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.slice(0, 6).map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {plan.features.length > 6 && (
                        <li className="text-sm text-muted-foreground">
                          +{plan.features.length - 6} more features
                        </li>
                      )}
                    </ul>
                    <Button
                      className="w-full mt-4"
                      variant={plan.popular ? "default" : "outline"}
                      disabled={user?.subscriptionPlan === plan.id}
                    >
                      {user?.subscriptionPlan === plan.id ? "Current Plan" : "Select Plan"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {step === "payment" && selectedPlan && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Payment Method Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Method
                </CardTitle>
                <CardDescription>Select your preferred payment method</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={selectedPaymentMethod}
                  onValueChange={(v) => setSelectedPaymentMethod(v as PaymentMethodId)}
                >
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedPaymentMethod === method.id ? "border-primary bg-primary/5" : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                    >
                      <RadioGroupItem value={method.id} id={method.id} />
                      <div className={`p-2 rounded-lg ${method.color} text-white`}>
                        {method.icon}
                      </div>
                      <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                        <span className="font-medium">{method.name}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {currentPaymentMethod && (
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <h4 className="font-medium">Payment Instructions</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        1. Open your {currentPaymentMethod.name} app
                      </p>
                      <p className="text-sm text-muted-foreground">
                        2. Send <span className="font-bold text-foreground">৳{selectedPlan.priceNumeric.toLocaleString()}</span> to:
                      </p>
                      <div className="flex items-center gap-2 p-3 bg-background rounded-lg">
                        <span className="font-mono text-lg flex-1">{currentPaymentMethod.accountNumber}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(currentPaymentMethod.accountNumber, "account")}
                        >
                          {copiedField === "account" ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        3. Copy the Transaction ID and paste below
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Summary & Transaction ID */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Plan</span>
                    <Badge>{selectedPlan.name}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Duration</span>
                    <span>30 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span>{currentPaymentMethod?.name}</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between items-center">
                    <span className="font-medium">Total Amount</span>
                    <span className="text-2xl font-bold">{selectedPlan.price}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transaction Details</CardTitle>
                  <CardDescription>Enter your payment transaction ID</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="transactionId">Transaction ID *</Label>
                    <Input
                      id="transactionId"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="e.g., TRX123456789"
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      You'll find this in your payment confirmation SMS/app
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setStep("plans");
                        setSelectedPlan(null);
                      }}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleSubmitPayment}
                      disabled={!transactionId.trim() || submitMutation.isPending}
                    >
                      {submitMutation.isPending ? "Submitting..." : "Submit Payment"}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-800 dark:text-yellow-200">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <p className="text-xs">
                      Your plan will be activated within 1-2 hours after verification
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Security Note */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <Shield className="w-4 h-4" />
          <span>Secure payment processing</span>
        </div>
      </div>
    </ShopLayout>
  );
};

export default UpgradePlan;
