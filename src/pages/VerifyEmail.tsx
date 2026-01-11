import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, RefreshCw, Shield, CheckCircle2, Sparkles, Zap, Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import confetti from "canvas-confetti";

const VerifyEmail = () => {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [step, setStep] = useState(1); // 1: waiting, 2: entering code, 3: verified
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const { settings } = useSiteSettings();

  useEffect(() => {
    // If no user or already verified, redirect
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.emailVerified) {
      navigate("/dashboard");
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto advance to step 2 when user starts typing
  useEffect(() => {
    if (otp.length > 0 && step === 1) {
      setStep(2);
    }
  }, [otp, step]);

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#00D4FF', '#7C3AED', '#10B981', '#F59E0B'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  const handleSendOtp = async () => {
    setIsResending(true);
    try {
      await authService.requestEmailOtp();
      toast({
        title: "✉️ Verification Code Sent!",
        description: "Please check your inbox and spam folder.",
      });
      setCountdown(60);
    } catch (error: any) {
      const errorMsg = error?.message || "Failed to send OTP";
      
      if (errorMsg.includes("testing mode") || errorMsg.includes("verify a domain") || errorMsg.includes("DOMAIN_NOT_VERIFIED")) {
        toast({
          title: "Email Service Not Configured",
          description: "Email service is in testing mode. Please contact support.",
          variant: "destructive",
        });
      } else if (errorMsg.includes("configuration error") || errorMsg.includes("INVALID_API_KEY")) {
        toast({
          title: "Configuration Error",
          description: "Email service is not configured correctly. Please contact support.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async () => {
    console.log("handleVerify called, OTP:", otp, "Length:", otp.length);
    
    if (otp.length !== 6) {
      console.log("OTP length validation failed");
      toast({
        title: "Invalid Code",
        description: "Please enter the complete 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log("Calling verifyEmailOtp...");
    try {
      const result = await authService.verifyEmailOtp(otp);
      console.log("verifyEmailOtp result:", result);
      await refreshUser();
      setIsVerified(true);
      setStep(3);
      triggerConfetti();
      
      toast({
        title: "🎉 Email Verified Successfully!",
        description: "Welcome to your account. Redirecting...",
      });
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 2500);
    } catch (error) {
      console.error("verifyEmailOtp error:", error);
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Invalid or expired code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Send OTP on first mount
  useEffect(() => {
    if (user && !user.emailVerified && countdown === 0) {
      handleSendOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;

  const securityFeatures = [
    { icon: Shield, text: "256-bit SSL encryption" },
    { icon: Lock, text: "Your data is secure" },
    { icon: Clock, text: "Code expires in 10 minutes" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Premium Gradient */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        
        {/* Animated Floating Elements */}
        <motion.div 
          className="absolute top-20 left-20 w-20 h-20 rounded-full bg-primary-foreground/10 backdrop-blur-sm"
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-40 left-40 w-14 h-14 rounded-xl bg-secondary/30"
          animate={{ 
            y: [0, 30, 0],
            rotate: [0, -90, 0]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-1/3 right-20 w-10 h-10 rounded-full bg-primary-glow/40"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16 text-primary-foreground">
          <Link to="/" className="flex items-center gap-2 mb-12">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt={settings.company_name} className="w-8 h-8 rounded object-contain" />
              ) : (
                <Zap className="w-6 h-6 text-primary-foreground" />
              )}
            </div>
            <span className="text-2xl font-bold">{settings.company_name}</span>
          </Link>
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-secondary" />
              <span className="text-secondary font-medium">Almost There!</span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Just one more step to unlock your account
            </h1>
            <p className="text-lg text-primary-foreground/80 mb-10">
              We need to verify your email to ensure your account is secure and protected.
            </p>
            
            {/* Security Features */}
            <div className="space-y-4">
              {securityFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3 text-primary-foreground/90"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <span>{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/30 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-glow/30 rounded-full blur-3xl" />
      </div>

      {/* Right Side - Verification Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-background via-background to-muted/30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">
              {settings.company_name}
            </span>
          </Link>

          <AnimatePresence mode="wait">
            {!isVerified ? (
              <motion.div
                key="verify-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border border-border rounded-3xl p-8 shadow-2xl shadow-primary/5"
              >
                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                  {[1, 2, 3].map((s) => (
                    <motion.div
                      key={s}
                      className={`h-2 rounded-full transition-all duration-500 ${
                        s <= step 
                          ? 'bg-gradient-to-r from-primary to-secondary w-10' 
                          : 'bg-muted w-6'
                      }`}
                      animate={s === step ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.5 }}
                    />
                  ))}
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div 
                    className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mb-6 relative"
                    animate={{ 
                      boxShadow: ['0 0 0 0 rgba(0, 212, 255, 0)', '0 0 0 15px rgba(0, 212, 255, 0)', '0 0 0 0 rgba(0, 212, 255, 0)']
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Mail className="w-10 h-10 text-primary" />
                    <motion.div
                      className="absolute -top-1 -right-1 w-6 h-6 bg-secondary rounded-full flex items-center justify-center"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Sparkles className="w-3 h-3 text-secondary-foreground" />
                    </motion.div>
                  </motion.div>
                  
                  <h1 className="text-2xl font-bold mb-2">Verify Your Email</h1>
                  <p className="text-muted-foreground">
                    We've sent a 6-digit verification code to
                  </p>
                  <p className="font-semibold text-foreground mt-1 bg-muted/50 py-2 px-4 rounded-lg inline-block">
                    {user.email}
                  </p>
                </div>

                <div className="space-y-6">
                  {/* OTP Input */}
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={setOtp}
                      className="gap-2"
                    >
                      <InputOTPGroup className="gap-2">
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <InputOTPSlot 
                            key={index}
                            index={index} 
                            className="w-12 h-14 text-xl font-bold border-2 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  {/* Countdown Timer */}
                  {countdown > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center"
                    >
                      <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        Code expires in {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                      </div>
                    </motion.div>
                  )}

                  {/* Verify Button */}
                  <Button
                    onClick={handleVerify}
                    variant="gradient"
                    size="lg"
                    className="w-full h-14 text-lg font-semibold rounded-xl"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Verifying...
                      </div>
                    ) : (
                      <>
                        Verify & Continue
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>

                  {/* Resend Code */}
                  <div className="text-center pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-3">
                      Didn't receive the code? Check your spam folder or
                    </p>
                    <Button
                      variant="ghost"
                      onClick={handleSendOtp}
                      disabled={isResending || countdown > 0}
                      className="font-semibold hover:bg-primary/10"
                    >
                      {isResending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : countdown > 0 ? (
                        `Resend in ${countdown}s`
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Resend Code
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="bg-card border border-border rounded-3xl p-8 shadow-2xl shadow-primary/5 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2, duration: 0.8 }}
                  className="mx-auto w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mb-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </motion.div>
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-3xl font-bold mb-3"
                >
                  Email Verified! 🎉
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-muted-foreground mb-6"
                >
                  Welcome to {settings.company_name}! Your account is now fully activated.
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                >
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  Redirecting to dashboard...
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Help Text */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center text-sm text-muted-foreground"
          >
            Having trouble?{" "}
            <Link to="/contact" className="text-primary hover:underline font-medium">
              Contact Support
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifyEmail;
