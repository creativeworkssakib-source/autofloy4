import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Facebook,
  MessageCircle as WhatsApp,
  ShoppingBag,
  MessageCircle,
  MessageSquare,
  Image,
  Mic,
  Sparkles,
  Play,
  Save,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Loader2,
  Lock,
  Crown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePlanLimits } from "@/hooks/usePlanLimits";

interface AutomationBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (automation: any) => void;
  editingAutomation?: any;
}

const steps = [
  { id: 1, title: "Choose Service", icon: Facebook },
  { id: 2, title: "Automation Type", icon: MessageCircle },
  { id: 3, title: "Configure", icon: Sparkles },
  { id: 4, title: "Test", icon: Play },
  { id: 5, title: "Save", icon: Save },
];

const services = [
  { id: "facebook", name: "Facebook", icon: Facebook, available: true, color: "#1877F2", featureKey: null },
  { id: "whatsapp", name: "WhatsApp", icon: WhatsApp, available: true, color: "#25D366", featureKey: "whatsappEnabled" as const },
  { id: "ecommerce", name: "E-commerce", icon: ShoppingBag, available: false, color: "#FF6B35", featureKey: "ecommerceIntegration" as const },
];

const automationTypes = [
  { id: "message", name: "Message Reply", icon: MessageCircle, description: "Auto-reply to customer messages", featureKey: "messageAutoReply" as const },
  { id: "comment", name: "Comment Reply", icon: MessageSquare, description: "Respond to post comments", featureKey: "commentAutoReply" as const },
  { id: "image", name: "Image Recognition", icon: Image, description: "Identify products from images", featureKey: "imageAutoReply" as const },
  { id: "voice", name: "Voice Response", icon: Mic, description: "Transcribe and respond to voice", featureKey: "voiceAutoReply" as const },
];

const tones = [
  { id: "friendly", label: "😊 Friendly", description: "Warm and welcoming" },
  { id: "professional", label: "💼 Professional", description: "Formal and business-like" },
  { id: "casual", label: "😎 Casual", description: "Relaxed and conversational" },
];

const AutomationBuilderModal = ({
  isOpen,
  onClose,
  onSave,
  editingAutomation,
}: AutomationBuilderModalProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { hasFeature, getUpgradeMessage, nextUpgradePlanName, planName } = usePlanLimits();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    service: "facebook",
    type: "message",
    keywords: "",
    response: "",
    tone: "friendly",
    name: "",
    testInput: "",
  });

  const handleNext = () => {
    // Check if selected automation type is allowed
    if (currentStep === 2) {
      const selectedType = automationTypes.find(t => t.id === formData.type);
      if (selectedType && !hasFeature(selectedType.featureKey)) {
        toast({
          title: "Feature Not Available",
          description: getUpgradeMessage(selectedType.name),
          variant: "destructive",
        });
        return;
      }
    }
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    // Simulate AI generation
    await new Promise((r) => setTimeout(r, 1500));
    setFormData((prev) => ({
      ...prev,
      response: "আসসালামু আলাইকুম! 👋 আমাদের পেজে স্বাগতম। আপনার প্রশ্নের জন্য ধন্যবাদ। আমরা শীঘ্রই আপনাকে সাহায্য করব। অনুগ্রহ করে অপেক্ষা করুন। 🙏",
    }));
    setIsGenerating(false);
    toast({ title: "AI Generated!", description: "Response has been generated in Bengali." });
  };

  const handleTest = async () => {
    if (!formData.testInput) {
      toast({ title: "Enter test message", variant: "destructive" });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    await new Promise((r) => setTimeout(r, 1000));
    setTestResult(formData.response || "আসসালামু আলাইকুম! আপনার বার্তার জন্য ধন্যবাদ।");
    setIsTesting(false);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast({ title: "Please enter a name", variant: "destructive" });
      return;
    }
    onSave({
      id: editingAutomation?.id || crypto.randomUUID(),
      name: formData.name,
      type: formData.type,
      triggerKeywords: formData.keywords.split(",").map((k) => k.trim()).filter(Boolean),
      responsePreview: formData.response,
      isEnabled: true,
      lastRun: "Just now",
      runsToday: 0,
    });
    toast({ title: "Automation Saved!", description: "Your automation is now active." });
    handleClose();
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData({
      service: "facebook",
      type: "message",
      keywords: "",
      response: "",
      tone: "friendly",
      name: "",
      testInput: "",
    });
    setTestResult(null);
    onClose();
  };

  const handleUpgradeClick = () => {
    handleClose();
    navigate("/pricing");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Select the platform where you want to set up automation
            </p>
            <div className="grid gap-3">
              {services.map((service) => {
                const isFeatureLocked = service.featureKey && !hasFeature(service.featureKey);
                const isUnavailable = !service.available || isFeatureLocked;
                
                return (
                  <TooltipProvider key={service.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Card
                          className={`p-4 transition-all ${
                            formData.service === service.id && !isUnavailable
                              ? "border-primary bg-primary/5 cursor-pointer"
                              : !isUnavailable
                              ? "hover:border-primary/50 cursor-pointer"
                              : "opacity-60 cursor-not-allowed"
                          }`}
                          onClick={() => !isUnavailable && setFormData((p) => ({ ...p, service: service.id }))}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="p-2 rounded-lg"
                                style={{ backgroundColor: `${service.color}20` }}
                              >
                                <service.icon className="h-5 w-5" style={{ color: service.color }} />
                              </div>
                              <span className="font-medium">{service.name}</span>
                            </div>
                            {!service.available && (
                              <Badge variant="secondary">Coming Soon</Badge>
                            )}
                            {isFeatureLocked && service.available && (
                              <div className="flex items-center gap-2">
                                <Lock className="h-4 w-4 text-muted-foreground" />
                                <Badge variant="outline" className="text-xs">
                                  {nextUpgradePlanName}+
                                </Badge>
                              </div>
                            )}
                            {formData.service === service.id && !isUnavailable && (
                              <Check className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </Card>
                      </TooltipTrigger>
                      {isFeatureLocked && (
                        <TooltipContent>
                          <p>{getUpgradeMessage(service.name + " automation")}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              What type of automation do you want to create?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {automationTypes.map((type) => {
                const isLocked = !hasFeature(type.featureKey);
                
                return (
                  <TooltipProvider key={type.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Card
                          className={`p-4 transition-all relative ${
                            formData.type === type.id && !isLocked
                              ? "border-primary bg-primary/5 cursor-pointer"
                              : !isLocked
                              ? "hover:border-primary/50 cursor-pointer"
                              : "opacity-60 cursor-not-allowed"
                          }`}
                          onClick={() => {
                            if (isLocked) {
                              toast({
                                title: "Feature Locked",
                                description: getUpgradeMessage(type.name),
                                variant: "destructive",
                              });
                            } else {
                              setFormData((p) => ({ ...p, type: type.id }));
                            }
                          }}
                        >
                          {isLocked && (
                            <div className="absolute top-2 right-2 p-1.5 rounded-full bg-muted">
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            </div>
                          )}
                          <div className="text-center space-y-2">
                            <div className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center ${
                              isLocked ? "bg-muted" : "bg-primary/10"
                            }`}>
                              <type.icon className={`h-6 w-6 ${isLocked ? "text-muted-foreground" : "text-primary"}`} />
                            </div>
                            <p className="font-medium text-sm">{type.name}</p>
                            <p className="text-xs text-muted-foreground">{type.description}</p>
                            {isLocked && (
                              <Badge variant="outline" className="text-[10px]">
                                {nextUpgradePlanName}+
                              </Badge>
                            )}
                          </div>
                        </Card>
                      </TooltipTrigger>
                      {isLocked && (
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-2">
                            <p className="font-medium">{type.name} is locked</p>
                            <p className="text-xs text-muted-foreground">
                              {getUpgradeMessage(type.name)}
                            </p>
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="w-full gap-1.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpgradeClick();
                              }}
                            >
                              <Crown className="h-3 w-3" />
                              Upgrade
                            </Button>
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
            
            {/* Upgrade prompt if any type is locked */}
            {automationTypes.some(t => !hasFeature(t.featureKey)) && (
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Crown className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Unlock All Automation Types</p>
                    <p className="text-xs text-muted-foreground">
                      Your {planName} plan has limited automation types. Upgrade to access all features.
                    </p>
                  </div>
                  <Button size="sm" variant="default" onClick={handleUpgradeClick}>
                    Upgrade
                  </Button>
                </div>
              </Card>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Trigger Keywords</Label>
              <Input
                placeholder="price, দাম, কত, order (comma separated)"
                value={formData.keywords}
                onChange={(e) => setFormData((p) => ({ ...p, keywords: e.target.value }))}
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground">
                Enter keywords that will trigger this automation
              </p>
            </div>

            <div className="space-y-2">
              <Label>Response Tone</Label>
              <Select
                value={formData.tone}
                onValueChange={(v) => setFormData((p) => ({ ...p, tone: v }))}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tones.map((tone) => (
                    <SelectItem key={tone.id} value={tone.id}>
                      {tone.label} - {tone.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Response Message</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {isGenerating ? "Generating..." : "Let AI Generate"}
                </Button>
              </div>
              <Textarea
                placeholder="Type your response message here... (supports Bengali)"
                value={formData.response}
                onChange={(e) => setFormData((p) => ({ ...p, response: e.target.value }))}
                className="min-h-[120px] bg-background/50"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <p className="text-muted-foreground text-sm">
              Test your automation with a sample message
            </p>

            <div className="space-y-2">
              <Label>Test Message</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Type a test message (e.g., দাম কত?)"
                  value={formData.testInput}
                  onChange={(e) => setFormData((p) => ({ ...p, testInput: e.target.value }))}
                  className="bg-background/50"
                />
                <Button onClick={handleTest} disabled={isTesting} className="gap-2">
                  {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Test
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {testResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  <Label>AI Response</Label>
                  <Card className="p-4 bg-success/5 border-success/30">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-success/20">
                        <Check className="h-4 w-4 text-success" />
                      </div>
                      <p className="text-sm">{testResult}</p>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );

      case 5:
        return (
          <div className="space-y-5">
            <p className="text-muted-foreground text-sm">
              Give your automation a name and save it
            </p>

            <div className="space-y-2">
              <Label>Automation Name</Label>
              <Input
                placeholder="e.g., Price Inquiry Response"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                className="bg-background/50"
              />
            </div>

            {/* Summary */}
            <Card className="p-4 bg-muted/30">
              <h4 className="font-medium mb-3">Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service:</span>
                  <span className="font-medium capitalize">{formData.service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium capitalize">{formData.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Keywords:</span>
                  <span className="font-medium">{formData.keywords || "None"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tone:</span>
                  <span className="font-medium capitalize">{formData.tone}</span>
                </div>
              </div>
            </Card>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {editingAutomation ? "Edit Automation" : "Create New Automation"}
          </DialogTitle>
        </DialogHeader>

        {/* Steps Indicator */}
        <div className="flex items-center justify-between px-2 py-4 border-b border-border/50">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center gap-2 ${
                  currentStep === step.id
                    ? "text-primary"
                    : currentStep > step.id
                    ? "text-success"
                    : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : currentStep > step.id
                      ? "bg-success text-white"
                      : "bg-muted"
                  }`}
                >
                  {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span className="text-xs hidden sm:inline">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 h-0.5 mx-2 ${
                    currentStep > step.id ? "bg-success" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto py-4 px-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <Button variant="ghost" onClick={handleClose} className="gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            {currentStep < 5 ? (
              <Button onClick={handleNext} className="gap-2">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="gradient" onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save Automation
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AutomationBuilderModal;
