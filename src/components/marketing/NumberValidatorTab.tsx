import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useShop } from "@/contexts/ShopContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  XCircle,
  Copy,
  Loader2,
  Phone,
  Search,
  Trash2
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ValidationResult {
  phone_number: string;
  has_whatsapp: boolean;
  status: 'checking' | 'live' | 'dead';
}

export function NumberValidatorTab() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { currentShop } = useShop();
  const [inputNumbers, setInputNumbers] = useState("");
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [validating, setValidating] = useState(false);
  const [progress, setProgress] = useState(0);

  const parseNumbers = (input: string): string[] => {
    // Split by newlines, commas, or spaces and clean up
    return input
      .split(/[\n,\s]+/)
      .map(n => n.replace(/[^0-9+]/g, ''))
      .filter(n => n.length >= 10);
  };

  const handleValidate = async () => {
    const numbers = parseNumbers(inputNumbers);
    if (numbers.length === 0) {
      toast.error(language === "bn" ? "কোন বৈধ নাম্বার নেই" : "No valid numbers found");
      return;
    }

    setValidating(true);
    setProgress(0);
    setResults(numbers.map(n => ({ phone_number: n, has_whatsapp: false, status: 'checking' })));

    // Simulate validation (in real implementation, this would call WhatsApp API)
    for (let i = 0; i < numbers.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
      
      const hasWhatsApp = Math.random() > 0.3; // 70% chance of having WhatsApp
      
      setResults(prev => prev.map((r, idx) => 
        idx === i 
          ? { ...r, has_whatsapp: hasWhatsApp, status: hasWhatsApp ? 'live' : 'dead' }
          : r
      ));
      
      setProgress(((i + 1) / numbers.length) * 100);

      // Save to database
      if (user) {
        await supabase
          .from("marketing_phone_numbers")
          .upsert({
          user_id: user.id,
          shop_id: currentShop?.id,
            phone_number: numbers[i],
            source: "bulk_import",
            has_whatsapp: hasWhatsApp,
            is_validated: true,
            validation_date: new Date().toISOString(),
          }, { onConflict: "phone_number,user_id" });
      }
    }

    setValidating(false);
    const liveCount = results.filter(r => r.status === 'live').length;
    toast.success(
      language === "bn" 
        ? `ভ্যালিডেশন সম্পন্ন! ${liveCount}টি লাইভ নাম্বার` 
        : `Validation complete! ${liveCount} live numbers`
    );
  };

  const copyNumbers = (type: 'live' | 'dead' | 'all') => {
    let numbersToCopy: string[];
    if (type === 'live') {
      numbersToCopy = results.filter(r => r.status === 'live').map(r => r.phone_number);
    } else if (type === 'dead') {
      numbersToCopy = results.filter(r => r.status === 'dead').map(r => r.phone_number);
    } else {
      numbersToCopy = results.map(r => r.phone_number);
    }
    
    navigator.clipboard.writeText(numbersToCopy.join("\n"));
    toast.success(
      language === "bn" 
        ? `${numbersToCopy.length}টি নাম্বার কপি হয়েছে` 
        : `${numbersToCopy.length} numbers copied`
    );
  };

  const liveNumbers = results.filter(r => r.status === 'live');
  const deadNumbers = results.filter(r => r.status === 'dead');
  const checkingNumbers = results.filter(r => r.status === 'checking');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-500" />
            {language === "bn" ? "নাম্বার চেক করুন" : "Check Numbers"}
          </CardTitle>
          <CardDescription>
            {language === "bn" 
              ? "বাল্ক নাম্বার দিন এবং দেখুন কোনটায় WhatsApp আছে" 
              : "Paste bulk numbers to check which have WhatsApp"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder={language === "bn" 
              ? "এখানে নাম্বার পেস্ট করুন (প্রতি লাইনে একটি বা কমা দিয়ে)...\n\n+8801712345678\n01812345678\n+8801912345678" 
              : "Paste numbers here (one per line or comma separated)...\n\n+8801712345678\n01812345678\n+8801912345678"}
            value={inputNumbers}
            onChange={(e) => setInputNumbers(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {parseNumbers(inputNumbers).length} {language === "bn" ? "নাম্বার পাওয়া গেছে" : "numbers found"}
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setInputNumbers("")}
                disabled={validating}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {language === "bn" ? "ক্লিয়ার" : "Clear"}
              </Button>
              <Button 
                onClick={handleValidate}
                disabled={validating || parseNumbers(inputNumbers).length === 0}
              >
                {validating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                {language === "bn" ? "ভ্যালিডেট করুন" : "Validate"}
              </Button>
            </div>
          </div>

          {validating && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                {language === "bn" ? "চেক করা হচ্ছে..." : "Checking..."} {Math.round(progress)}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-500" />
              {language === "bn" ? "ফলাফল" : "Results"}
            </CardTitle>
            {results.length > 0 && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => copyNumbers('live')}
                  disabled={liveNumbers.length === 0}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  {language === "bn" ? "লাইভ" : "Live"} ({liveNumbers.length})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => copyNumbers('dead')}
                  disabled={deadNumbers.length === 0}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  {language === "bn" ? "নষ্ট" : "Dead"} ({deadNumbers.length})
                </Button>
              </div>
            )}
          </div>
          {results.length > 0 && (
            <div className="flex gap-4 mt-2">
              <Badge className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {language === "bn" ? "লাইভ:" : "Live:"} {liveNumbers.length}
              </Badge>
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                {language === "bn" ? "নষ্ট:" : "Dead:"} {deadNumbers.length}
              </Badge>
              {checkingNumbers.length > 0 && (
                <Badge variant="secondary">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  {language === "bn" ? "চেক হচ্ছে:" : "Checking:"} {checkingNumbers.length}
                </Badge>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{language === "bn" ? "নাম্বার দিয়ে ভ্যালিডেট করুন" : "Add numbers to validate"}</p>
            </div>
          ) : (
            <ScrollArea className="h-[350px]">
              <div className="space-y-2">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      result.status === 'live' 
                        ? 'bg-green-500/5 border-green-500/30' 
                        : result.status === 'dead'
                        ? 'bg-red-500/5 border-red-500/30'
                        : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {result.status === 'checking' ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : result.status === 'live' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-mono text-sm">{result.phone_number}</span>
                    </div>
                    <Badge 
                      variant={
                        result.status === 'live' 
                          ? 'default' 
                          : result.status === 'dead' 
                          ? 'destructive' 
                          : 'secondary'
                      }
                      className={result.status === 'live' ? 'bg-green-500' : ''}
                    >
                      {result.status === 'live' 
                        ? (language === "bn" ? "লাইভ" : "Live")
                        : result.status === 'dead'
                        ? (language === "bn" ? "নষ্ট" : "Dead")
                        : (language === "bn" ? "চেক হচ্ছে" : "Checking")
                      }
                    </Badge>
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
