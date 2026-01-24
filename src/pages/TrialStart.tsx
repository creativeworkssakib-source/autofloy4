import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Check, 
  Facebook, 
  Play, 
  Zap, 
  ArrowRight, 
  Clock,
  Sparkles,
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

const TrialStart = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 24,
    minutes: 0,
    seconds: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Fire confetti
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.4 },
      colors: ["#0066FF", "#7B42FF", "#FF6B35", "#10B981"],
    });
  }, []);

  useEffect(() => {
    // Countdown timer (24 hours from now)
    const endDate = new Date();
    endDate.setTime(endDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endDate.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const steps = [
    {
      number: 1,
      title: "Connect Facebook",
      description: "Link your Facebook page with one click",
      icon: Facebook,
      color: "from-primary to-primary-glow",
      action: "Connect Now",
      route: "/connect-facebook",
    },
    {
      number: 2,
      title: "Create Automation",
      description: "Set up your first auto-reply in 60 seconds",
      icon: MessageSquare,
      color: "from-secondary to-primary",
      action: "Create",
      route: "/dashboard/automations",
    },
    {
      number: 3,
      title: "Let AI Handle It",
      description: "Sit back and watch the magic happen",
      icon: Sparkles,
      color: "from-success to-primary",
      action: "Done!",
      route: "/dashboard",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(217,100%,50%,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(262,100%,63%,0.1),transparent_50%)] pointer-events-none" />

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-12"
        >
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">
              Auto<span className="gradient-text">Floy</span>
            </span>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="cursor-pointer"
          >
            Skip to Dashboard
          </Button>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          {/* Success Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-medium mb-6">
            <Check className="w-4 h-4" />
            Account Created Successfully!
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4">
            Your 24-Hour Free Trial{" "}
            <span className="gradient-text">Starts Now!</span> 🎉
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            You have full access to all features. Let's get you set up 
            and automating your Facebook shop in minutes.
          </p>

          {/* Countdown Timer */}
          <div className="inline-flex items-center gap-6 p-6 rounded-2xl bg-card border border-border shadow-card mb-12">
            <Clock className="w-8 h-8 text-primary" />
            <div className="flex gap-4">
              {[
                { value: timeLeft.days, label: "Days" },
                { value: timeLeft.hours, label: "Hours" },
                { value: timeLeft.minutes, label: "Min" },
                { value: timeLeft.seconds, label: "Sec" },
              ].map((item, index) => (
                <div key={item.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold tabular-nums gradient-text">
                    {item.value.toString().padStart(2, "0")}
                  </div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Setup Steps */}
        <div className="max-w-4xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-center mb-8"
          >
            Get Started in 3 Easy Steps
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="relative bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-card group"
              >
                {/* Step Number */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <step.icon className="w-6 h-6 text-primary-foreground" />
                </div>

                <div className="text-sm text-muted-foreground mb-2">
                  Step {step.number}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {step.description}
                </p>

                <Button
                  variant={index === 0 ? "gradient" : "outline"}
                  size="sm"
                  className="w-full"
                  onClick={() => navigate(step.route)}
                >
                  {step.action}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-border" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Video Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-2xl font-bold mb-6">
            Watch: How to Connect Facebook (60 seconds)
          </h2>
          
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted border border-border group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-primary-foreground flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-primary ml-1" />
              </div>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-primary-foreground">
              <span className="text-sm font-medium">How to Connect Your Facebook Page</span>
              <span className="text-sm">1:00</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" asChild>
              <Link to="/dashboard">
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TrialStart;
