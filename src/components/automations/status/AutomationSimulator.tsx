import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  MessageSquare, 
  Inbox, 
  Image, 
  Mic, 
  Video,
  Sparkles,
  ShoppingCart,
  DollarSign,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SimulationResult {
  intent: "inquiry" | "order" | "price" | "confusion" | "greeting" | "complaint";
  confidence: number;
  wouldReply: boolean;
  reason: string;
  suggestedAction: string;
}

interface AutomationSimulatorProps {
  isAutomationReady: boolean;
  automationSettings?: {
    autoCommentReply?: boolean;
    autoInboxReply?: boolean;
    orderTaking?: boolean;
  };
}

const AutomationSimulator = ({
  isAutomationReady,
  automationSettings,
}: AutomationSimulatorProps) => {
  const [messageType, setMessageType] = useState<"comment" | "inbox" | "image" | "voice" | "video">("comment");
  const [testMessage, setTestMessage] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const intentConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    inquiry: { icon: HelpCircle, color: "text-blue-500 bg-blue-500/10", label: "Information Inquiry" },
    order: { icon: ShoppingCart, color: "text-green-500 bg-green-500/10", label: "Order Request" },
    price: { icon: DollarSign, color: "text-orange-500 bg-orange-500/10", label: "Price Inquiry" },
    confusion: { icon: AlertCircle, color: "text-yellow-500 bg-yellow-500/10", label: "Unclear Message" },
    greeting: { icon: MessageSquare, color: "text-purple-500 bg-purple-500/10", label: "Greeting" },
    complaint: { icon: AlertCircle, color: "text-red-500 bg-red-500/10", label: "Complaint/Issue" },
  };

  const detectIntent = (message: string): SimulationResult => {
    const lowerMessage = message.toLowerCase();
    
    // Price related keywords (Bengali + English)
    const priceKeywords = ["price", "daam", "dam", "koto", "কত", "দাম", "rate", "cost", "how much"];
    // Order related keywords
    const orderKeywords = ["order", "buy", "nibo", "নিব", "চাই", "chai", "lagbe", "লাগবে", "confirm", "book"];
    // Inquiry keywords
    const inquiryKeywords = ["available", "ache", "আছে", "stock", "size", "color", "details", "info"];
    // Greeting keywords
    const greetingKeywords = ["hi", "hello", "সালাম", "assalamu", "hey", "ভাই", "bhai", "apu"];
    // Complaint keywords
    const complaintKeywords = ["problem", "issue", "broken", "wrong", "damaged", "সমস্যা", "খারাপ"];

    let intent: SimulationResult["intent"] = "confusion";
    let confidence = 0.5;

    if (orderKeywords.some(k => lowerMessage.includes(k))) {
      intent = "order";
      confidence = 0.85;
    } else if (priceKeywords.some(k => lowerMessage.includes(k))) {
      intent = "price";
      confidence = 0.9;
    } else if (inquiryKeywords.some(k => lowerMessage.includes(k))) {
      intent = "inquiry";
      confidence = 0.8;
    } else if (greetingKeywords.some(k => lowerMessage.includes(k))) {
      intent = "greeting";
      confidence = 0.95;
    } else if (complaintKeywords.some(k => lowerMessage.includes(k))) {
      intent = "complaint";
      confidence = 0.75;
    } else if (message.length < 10) {
      intent = "confusion";
      confidence = 0.6;
    }

    // Determine if AI would reply based on settings
    let wouldReply = false;
    let reason = "";
    let suggestedAction = "";

    if (!isAutomationReady) {
      reason = "Automation is not fully configured";
      suggestedAction = "Complete the automation checklist";
    } else if (messageType === "comment" && !automationSettings?.autoCommentReply) {
      reason = "Comment auto-reply is disabled";
      suggestedAction = "Enable 'Auto Comment Reply' in settings";
    } else if (messageType === "inbox" && !automationSettings?.autoInboxReply) {
      reason = "Inbox auto-reply is disabled";
      suggestedAction = "Enable 'Auto Inbox Reply' in settings";
    } else if (intent === "order" && !automationSettings?.orderTaking) {
      wouldReply = true;
      reason = "AI would reply but cannot take orders (order taking disabled)";
      suggestedAction = "AI will provide info but redirect to manual ordering";
    } else {
      wouldReply = true;
      reason = "AI is ready to respond to this message";
      suggestedAction = intent === "order" 
        ? "AI will start order collection process" 
        : intent === "price"
        ? "AI will provide pricing from product catalog"
        : "AI will provide helpful response";
    }

    return { intent, confidence, wouldReply, reason, suggestedAction };
  };

  const handleSimulate = () => {
    if (!testMessage.trim()) return;
    
    setIsSimulating(true);
    
    // Simulate processing delay
    setTimeout(() => {
      const detectedResult = detectIntent(testMessage);
      setResult(detectedResult);
      setIsSimulating(false);
    }, 800);
  };

  const placeholders: Record<string, string> = {
    comment: "e.g., 'এই প্রোডাক্টের দাম কত?' or 'Is this available?'",
    inbox: "e.g., 'I want to order this product' or 'ভাই এটা নিব'",
    image: "📷 AI will analyze the image using Vision API and respond in Bengali",
    voice: "🎤 Voice messages will be acknowledged - AI will ask customer to type their request",
    video: "🎬 AI will analyze video content using Vision API and respond helpfully",
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Test Automation
        </CardTitle>
        <CardDescription>
          Simulate messages to see how AI would handle them (no real replies sent)
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Message Type Tabs */}
        <Tabs value={messageType} onValueChange={(v) => setMessageType(v as typeof messageType)}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="comment" className="gap-1 text-xs px-1">
              <MessageSquare className="h-3 w-3" />
              <span className="hidden sm:inline">Comment</span>
            </TabsTrigger>
            <TabsTrigger value="inbox" className="gap-1 text-xs px-1">
              <Inbox className="h-3 w-3" />
              <span className="hidden sm:inline">Inbox</span>
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-1 text-xs px-1">
              <Image className="h-3 w-3" />
              <span className="hidden sm:inline">Image</span>
            </TabsTrigger>
            <TabsTrigger value="video" className="gap-1 text-xs px-1">
              <Video className="h-3 w-3" />
              <span className="hidden sm:inline">Video</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="gap-1 text-xs px-1">
              <Mic className="h-3 w-3" />
              <span className="hidden sm:inline">Voice</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Test Input */}
        <div className="space-y-2">
          <Textarea
            placeholder={placeholders[messageType]}
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <Button 
            onClick={handleSimulate} 
            disabled={!testMessage.trim() || isSimulating}
            className="w-full gap-2"
          >
            {isSimulating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Bot className="h-4 w-4" />
                </motion.div>
                Analyzing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Simulate Response
              </>
            )}
          </Button>
        </div>

        {/* Simulation Result */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3 pt-2"
            >
              {/* Intent Detection */}
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Detected Intent</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(result.confidence * 100)}% confidence
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const config = intentConfig[result.intent];
                    const IconComponent = config.icon;
                    return (
                      <>
                        <div className={cn("p-2 rounded-lg", config.color.split(" ")[1])}>
                          <IconComponent className={cn("h-4 w-4", config.color.split(" ")[0])} />
                        </div>
                        <span className="font-medium">{config.label}</span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Would Reply */}
              <div className={cn(
                "p-3 rounded-lg border",
                result.wouldReply 
                  ? "bg-success/5 border-success/30" 
                  : "bg-warning/5 border-warning/30"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  {result.wouldReply ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-warning" />
                  )}
                  <span className={cn(
                    "font-medium text-sm",
                    result.wouldReply ? "text-success" : "text-warning"
                  )}>
                    {result.wouldReply 
                      ? "This message WOULD be replied by AI" 
                      : "AI will NOT reply to this message"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground ml-6">{result.reason}</p>
              </div>

              {/* Suggested Action */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-xs font-medium text-primary">Suggested Action:</span>
                <p className="text-sm mt-0.5">{result.suggestedAction}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default AutomationSimulator;
