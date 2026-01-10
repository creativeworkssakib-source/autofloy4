import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  MessageSquare, 
  Users, 
  CheckCircle2, 
  MapPin, 
  Send, 
  Shield, 
  ShoppingCart,
  QrCode
} from "lucide-react";
import { WhatsAppConnectTab } from "@/components/marketing/WhatsAppConnectTab";
import { GroupNumbersTab } from "@/components/marketing/GroupNumbersTab";
import { NumberValidatorTab } from "@/components/marketing/NumberValidatorTab";
import { LeadScraperTab } from "@/components/marketing/LeadScraperTab";
import { BulkMessagingTab } from "@/components/marketing/BulkMessagingTab";
import { FraudDetectionTab } from "@/components/marketing/FraudDetectionTab";
import { IncompleteOrdersTab } from "@/components/marketing/IncompleteOrdersTab";

export default function Marketing() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState("whatsapp-connect");

  const tabs = [
    {
      id: "whatsapp-connect",
      label: language === "bn" ? "হোয়াটসঅ্যাপ কানেক্ট" : "WhatsApp Connect",
      icon: QrCode,
    },
    {
      id: "group-numbers",
      label: language === "bn" ? "গ্রুপ নাম্বার" : "Group Numbers",
      icon: Users,
    },
    {
      id: "number-validator",
      label: language === "bn" ? "নাম্বার ভ্যালিডেটর" : "Number Validator",
      icon: CheckCircle2,
    },
    {
      id: "lead-scraper",
      label: language === "bn" ? "লিড স্ক্র্যাপার" : "Lead Scraper",
      icon: MapPin,
    },
    {
      id: "bulk-messaging",
      label: language === "bn" ? "বাল্ক মেসেজিং" : "Bulk Messaging",
      icon: Send,
    },
    {
      id: "fraud-detection",
      label: language === "bn" ? "ফ্রড ডিটেকশন" : "Fraud Detection",
      icon: Shield,
    },
    {
      id: "incomplete-orders",
      label: language === "bn" ? "অসম্পূর্ণ অর্ডার" : "Incomplete Orders",
      icon: ShoppingCart,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <MessageSquare className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {language === "bn" ? "মার্কেটিং টুলস" : "Marketing Tools"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {language === "bn" 
                ? "হোয়াটসঅ্যাপ মার্কেটিং, লিড জেনারেশন এবং ফ্রড প্রতিরোধ" 
                : "WhatsApp marketing, lead generation, and fraud prevention"}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-1 h-auto p-1">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm whitespace-nowrap"
              >
                <tab.icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="whatsapp-connect" className="mt-0">
              <WhatsAppConnectTab />
            </TabsContent>
            
            <TabsContent value="group-numbers" className="mt-0">
              <GroupNumbersTab />
            </TabsContent>
            
            <TabsContent value="number-validator" className="mt-0">
              <NumberValidatorTab />
            </TabsContent>
            
            <TabsContent value="lead-scraper" className="mt-0">
              <LeadScraperTab />
            </TabsContent>
            
            <TabsContent value="bulk-messaging" className="mt-0">
              <BulkMessagingTab />
            </TabsContent>
            
            <TabsContent value="fraud-detection" className="mt-0">
              <FraudDetectionTab />
            </TabsContent>
            
            <TabsContent value="incomplete-orders" className="mt-0">
              <IncompleteOrdersTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
