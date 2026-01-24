import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Settings2, 
  Languages, 
  MessageSquare, 
  ShoppingCart, 
  Percent,
  Inbox
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AutomationControlSummaryProps {
  language: "bangla" | "english" | "mixed" | string;
  tone: "friendly" | "professional" | string;
  orderTaking: boolean;
  commentAutomation: boolean;
  inboxAutomation: boolean;
  discountAllowed: boolean;
  maxDiscountPercent?: number;
}

const AutomationControlSummary = ({
  language,
  tone,
  orderTaking,
  commentAutomation,
  inboxAutomation,
  discountAllowed,
  maxDiscountPercent = 0,
}: AutomationControlSummaryProps) => {
  const languageLabels: Record<string, string> = {
    bangla: "বাংলা (Bangla)",
    english: "English",
    mixed: "Mixed (Banglish)",
  };

  const toneLabels: Record<string, { label: string; emoji: string }> = {
    friendly: { label: "Friendly", emoji: "😊" },
    professional: { label: "Professional", emoji: "💼" },
  };

  const summaryItems = [
    {
      icon: Languages,
      label: "Language",
      value: languageLabels[language] || language,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      icon: MessageSquare,
      label: "Tone",
      value: `${toneLabels[tone]?.emoji || ""} ${toneLabels[tone]?.label || tone}`,
      color: "text-purple-500 bg-purple-500/10",
    },
    {
      icon: ShoppingCart,
      label: "Order Taking",
      value: orderTaking ? "ON" : "OFF",
      isStatus: true,
      isOn: orderTaking,
      color: orderTaking ? "text-success bg-success/10" : "text-muted-foreground bg-muted",
    },
    {
      icon: MessageSquare,
      label: "Comment Automation",
      value: commentAutomation ? "ON" : "OFF",
      isStatus: true,
      isOn: commentAutomation,
      color: commentAutomation ? "text-success bg-success/10" : "text-muted-foreground bg-muted",
    },
    {
      icon: Inbox,
      label: "Inbox Automation",
      value: inboxAutomation ? "ON" : "OFF",
      isStatus: true,
      isOn: inboxAutomation,
      color: inboxAutomation ? "text-success bg-success/10" : "text-muted-foreground bg-muted",
    },
    {
      icon: Percent,
      label: "Discount Allowed",
      value: discountAllowed ? `Yes (max ${maxDiscountPercent}%)` : "No",
      isStatus: true,
      isOn: discountAllowed,
      color: discountAllowed ? "text-orange-500 bg-orange-500/10" : "text-muted-foreground bg-muted",
    },
  ];

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          Control Summary
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {summaryItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 rounded-xl bg-muted/30 border border-border/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("p-1.5 rounded-lg", item.color.split(" ")[1])}>
                  <item.icon className={cn("h-3.5 w-3.5", item.color.split(" ")[0])} />
                </div>
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
              {item.isStatus ? (
                <Badge 
                  variant={item.isOn ? "default" : "secondary"}
                  className={cn(
                    "text-xs",
                    item.isOn ? "bg-success/20 text-success hover:bg-success/30" : ""
                  )}
                >
                  {item.value}
                </Badge>
              ) : (
                <p className="font-medium text-sm truncate" title={item.value}>
                  {item.value}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AutomationControlSummary;
