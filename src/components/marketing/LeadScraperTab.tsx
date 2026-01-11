import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useShop } from "@/contexts/ShopContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  MapPin, 
  Search,
  Copy,
  Loader2,
  Phone,
  Building2,
  Download,
  CheckCircle2,
  Globe
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Lead {
  id: string;
  phone_number: string;
  business_name: string | null;
  category: string | null;
  address: string | null;
  has_whatsapp: boolean | null;
}

const categories = [
  { value: "restaurant", label: { en: "Restaurants", bn: "রেস্টুরেন্ট" } },
  { value: "shop", label: { en: "Shops", bn: "দোকান" } },
  { value: "salon", label: { en: "Salons & Beauty", bn: "সেলুন ও বিউটি" } },
  { value: "pharmacy", label: { en: "Pharmacies", bn: "ফার্মেসি" } },
  { value: "clinic", label: { en: "Clinics & Hospitals", bn: "ক্লিনিক ও হাসপাতাল" } },
  { value: "electronics", label: { en: "Electronics", bn: "ইলেকট্রনিক্স" } },
  { value: "clothing", label: { en: "Clothing & Fashion", bn: "পোশাক ও ফ্যাশন" } },
  { value: "grocery", label: { en: "Grocery", bn: "মুদি দোকান" } },
  { value: "hotel", label: { en: "Hotels", bn: "হোটেল" } },
  { value: "gym", label: { en: "Gyms & Fitness", bn: "জিম ও ফিটনেস" } },
];

const cities = [
  { value: "dhaka", label: { en: "Dhaka", bn: "ঢাকা" } },
  { value: "chittagong", label: { en: "Chittagong", bn: "চট্টগ্রাম" } },
  { value: "sylhet", label: { en: "Sylhet", bn: "সিলেট" } },
  { value: "rajshahi", label: { en: "Rajshahi", bn: "রাজশাহী" } },
  { value: "khulna", label: { en: "Khulna", bn: "খুলনা" } },
  { value: "barishal", label: { en: "Barishal", bn: "বরিশাল" } },
  { value: "rangpur", label: { en: "Rangpur", bn: "রংপুর" } },
  { value: "mymensingh", label: { en: "Mymensingh", bn: "ময়মনসিংহ" } },
];

export function LeadScraperTab() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { currentShop } = useShop();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchLeads();
  }, [user]);

  const fetchLeads = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("marketing_phone_numbers")
        .select("*")
        .eq("user_id", user.id)
        .eq("source", "google_maps")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScrape = async () => {
    if (!selectedCategory || !selectedCity) {
      toast.error(language === "bn" ? "ক্যাটাগরি ও শহর সিলেক্ট করুন" : "Select category and city");
      return;
    }

    setScraping(true);
    setProgress(10);

    const categoryLabel = categories.find(c => c.value === selectedCategory)?.label[language === "bn" ? "bn" : "en"] || selectedCategory;
    const cityLabel = cities.find(c => c.value === selectedCity)?.label[language === "bn" ? "bn" : "en"] || selectedCity;

    try {
      setProgress(30);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lead-scraper`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          category: selectedCategory,
          city: selectedCity,
          categoryLabel,
          cityLabel,
          shopId: currentShop?.id,
        }),
      });

      setProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to scrape leads");
      }

      const data = await response.json();
      setProgress(100);

      toast.success(
        language === "bn" 
          ? `${data.count}টি রিয়েল লিড পাওয়া গেছে!` 
          : `Found ${data.count} real leads!`
      );
      
      await fetchLeads();
    } catch (error) {
      console.error("Scrape error:", error);
      toast.error(
        language === "bn" 
          ? "লিড সংগ্রহে সমস্যা হয়েছে" 
          : error instanceof Error ? error.message : "Failed to scrape leads"
      );
    } finally {
      setScraping(false);
      setProgress(0);
    }
  };

  const copyNumber = (number: string, id: string) => {
    navigator.clipboard.writeText(number);
    setCopiedIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      setCopiedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 2000);
  };

  const copyAllNumbers = () => {
    const allNumbers = filteredLeads.map(l => l.phone_number).join("\n");
    navigator.clipboard.writeText(allNumbers);
    toast.success(
      language === "bn" 
        ? `${filteredLeads.length}টি নাম্বার কপি হয়েছে` 
        : `${filteredLeads.length} numbers copied`
    );
  };

  const exportLeads = () => {
    const csv = [
      ["Business Name", "Phone", "Category", "Address", "Has WhatsApp"].join(","),
      ...filteredLeads.map(l => [
        l.business_name || "",
        l.phone_number,
        l.category || "",
        l.address || "",
        l.has_whatsapp ? "Yes" : "No"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    
    toast.success(language === "bn" ? "ডাউনলোড হচ্ছে..." : "Downloading...");
  };

  const filteredLeads = leads.filter(l => 
    l.phone_number.includes(searchQuery) || 
    l.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Scraper Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            {language === "bn" ? "টার্গেটেড লিড স্ক্র্যাপার" : "Targeted Lead Scraper"}
          </CardTitle>
          <CardDescription>
            {language === "bn" 
              ? "Google Maps থেকে টার্গেটেড ক্লায়েন্টের নাম্বার সংগ্রহ করুন" 
              : "Collect targeted client numbers from Google Maps"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === "bn" ? "ক্যাটাগরি" : "Category"}
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={language === "bn" ? "ক্যাটাগরি সিলেক্ট করুন" : "Select category"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {language === "bn" ? cat.label.bn : cat.label.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === "bn" ? "শহর" : "City"}
              </label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder={language === "bn" ? "শহর সিলেক্ট করুন" : "Select city"} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(city => (
                    <SelectItem key={city.value} value={city.value}>
                      {language === "bn" ? city.label.bn : city.label.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2 flex items-end">
              <Button 
                onClick={handleScrape}
                disabled={scraping || !selectedCategory || !selectedCity}
                className="w-full md:w-auto"
              >
                {scraping ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4 mr-2" />
                )}
                {language === "bn" ? "লিড খুঁজুন" : "Find Leads"}
              </Button>
            </div>
          </div>

          {scraping && (
            <div className="mt-4 space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                {language === "bn" ? "স্ক্র্যাপিং চলছে..." : "Scraping..."} {Math.round(progress)}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-green-500" />
                {language === "bn" ? "সংগ্রহিত লিড" : "Collected Leads"}
                <Badge variant="secondary">{filteredLeads.length}</Badge>
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyAllNumbers}
                disabled={filteredLeads.length === 0}
              >
                <Copy className="h-4 w-4 mr-2" />
                {language === "bn" ? "সব কপি" : "Copy All"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportLeads}
                disabled={filteredLeads.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                {language === "bn" ? "এক্সপোর্ট" : "Export"}
              </Button>
            </div>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === "bn" ? "বিজনেস বা নাম্বার খুঁজুন..." : "Search business or number..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{language === "bn" ? "কোন লিড নেই" : "No leads found"}</p>
              <p className="text-sm mt-2">
                {language === "bn" 
                  ? "উপরে ক্যাটাগরি ও শহর সিলেক্ট করে স্ক্র্যাপ করুন" 
                  : "Select category and city above to scrape"}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-full bg-blue-500/10 shrink-0">
                        <Building2 className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{lead.business_name}</p>
                        <p className="font-mono text-sm text-muted-foreground">{lead.phone_number}</p>
                        {lead.address && (
                          <p className="text-xs text-muted-foreground truncate">{lead.address}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {lead.has_whatsapp && (
                        <Badge variant="outline" className="text-green-500 border-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          WhatsApp
                        </Badge>
                      )}
                      {lead.category && (
                        <Badge variant="secondary" className="hidden sm:inline-flex">
                          {categories.find(c => c.value === lead.category)?.label[language === "bn" ? "bn" : "en"]}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyNumber(lead.phone_number, lead.id)}
                      >
                        {copiedIds.has(lead.id) ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
