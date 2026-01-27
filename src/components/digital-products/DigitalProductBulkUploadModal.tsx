import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { digitalProductService, CreateDigitalProductInput } from "@/services/digitalProductService";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Table,
  Key,
  Globe,
  BookOpen,
  FileCode,
} from "lucide-react";
import * as XLSX from "xlsx";

interface DigitalProductBulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedProduct {
  rowNumber: number;
  data: CreateDigitalProductInput;
  isValid: boolean;
  errors: string[];
  sheetName?: string;
}

const validProductTypes = ["subscription", "api", "course", "software", "other"];

export const DigitalProductBulkUploadModal = ({
  isOpen,
  onClose,
  onSuccess,
}: DigitalProductBulkUploadModalProps) => {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [fileName, setFileName] = useState("");

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Subscription sheet - for accounts with username/password
    const subscriptionData = [
      {
        name: "Canva Pro 1 Month",
        price: 150,
        sale_price: 120,
        description: "Premium Canva subscription",
        credential_username: "user1@email.com",
        credential_password: "password123",
        credential_email: "recovery@email.com",
        is_active: "yes",
      },
      {
        name: "Canva Pro 1 Month",
        price: 150,
        sale_price: 120,
        description: "Premium Canva subscription",
        credential_username: "user2@email.com",
        credential_password: "pass456",
        credential_email: "recovery2@email.com",
        is_active: "yes",
      },
      {
        name: "Netflix Premium",
        price: 200,
        sale_price: "",
        description: "Netflix Premium Account",
        credential_username: "netflix@email.com",
        credential_password: "netpass123",
        credential_email: "",
        is_active: "yes",
      },
    ];
    const wsSubscription = XLSX.utils.json_to_sheet(subscriptionData);
    wsSubscription["!cols"] = [
      { wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 30 },
      { wch: 25 }, { wch: 20 }, { wch: 25 }, { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSubscription, "Subscriptions");

    // API sheet - for API keys and endpoints
    const apiData = [
      {
        name: "OpenAI API Credit",
        price: 500,
        sale_price: "",
        description: "GPT-4 API access",
        api_endpoint: "https://api.openai.com/v1",
        api_key: "sk-xxxxx1",
        api_documentation: "https://platform.openai.com/docs",
        is_active: "yes",
      },
      {
        name: "OpenAI API Credit",
        price: 500,
        sale_price: "",
        description: "GPT-4 API access",
        api_endpoint: "https://api.openai.com/v1",
        api_key: "sk-xxxxx2",
        api_documentation: "https://platform.openai.com/docs",
        is_active: "yes",
      },
    ];
    const wsApi = XLSX.utils.json_to_sheet(apiData);
    wsApi["!cols"] = [
      { wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 30 },
      { wch: 35 }, { wch: 30 }, { wch: 35 }, { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(wb, wsApi, "APIs");

    // Course sheet - for online courses
    const courseData = [
      {
        name: "Web Development Course",
        price: 2000,
        sale_price: 1500,
        description: "Complete web dev bootcamp",
        access_url: "https://course.example.com/abc123",
        access_instructions: "Use the link to access course",
        is_active: "yes",
      },
      {
        name: "Web Development Course",
        price: 2000,
        sale_price: 1500,
        description: "Complete web dev bootcamp",
        access_url: "https://course.example.com/def456",
        access_instructions: "Use the link to access course",
        is_active: "yes",
      },
    ];
    const wsCourse = XLSX.utils.json_to_sheet(courseData);
    wsCourse["!cols"] = [
      { wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 30 },
      { wch: 40 }, { wch: 35 }, { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(wb, wsCourse, "Courses");

    // Software sheet - for downloadable files/APKs
    const softwareData = [
      {
        name: "Premium APK",
        price: 100,
        sale_price: "",
        description: "Modded app v2.0",
        file_url: "https://drive.google.com/file/xxx1",
        file_name: "app-v2.0.apk",
        is_active: "yes",
      },
      {
        name: "Premium APK",
        price: 100,
        sale_price: "",
        description: "Modded app v2.0",
        file_url: "https://drive.google.com/file/xxx2",
        file_name: "app-v2.0.apk",
        is_active: "yes",
      },
      {
        name: "Windows Software Key",
        price: 500,
        sale_price: 400,
        description: "Windows 11 Pro License",
        file_url: "",
        file_name: "",
        is_active: "yes",
      },
    ];
    const wsSoftware = XLSX.utils.json_to_sheet(softwareData);
    wsSoftware["!cols"] = [
      { wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 30 },
      { wch: 45 }, { wch: 25 }, { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSoftware, "Software");

    // Other sheet - for any other digital products
    const otherData = [
      {
        name: "Custom Digital Service",
        price: 300,
        sale_price: "",
        description: "Custom digital service",
        credential_username: "",
        credential_password: "",
        api_key: "",
        access_url: "https://example.com/service",
        file_url: "",
        notes: "Any additional info here",
        is_active: "yes",
      },
      {
        name: "Game Account",
        price: 1500,
        sale_price: 1200,
        description: "PUBG Account with skins",
        credential_username: "gameuser@email.com",
        credential_password: "gamepass123",
        api_key: "",
        access_url: "",
        file_url: "",
        notes: "Level 50 account",
        is_active: "yes",
      },
    ];
    const wsOther = XLSX.utils.json_to_sheet(otherData);
    wsOther["!cols"] = [
      { wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 30 },
      { wch: 25 }, { wch: 20 }, { wch: 25 }, { wch: 35 },
      { wch: 35 }, { wch: 30 }, { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(wb, wsOther, "Other");

    XLSX.writeFile(wb, "digital_products_template.xlsx");
    toast.success(language === "bn" ? "টেমপ্লেট ডাউনলোড হয়েছে (৫টি শীট)" : "Template downloaded (5 sheets)");
  };

  const parseExcelFile = (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        
        const allParsed: ParsedProduct[] = [];
        let rowCounter = 1;

        // Map sheet names to product types
        const sheetTypeMap: Record<string, string> = {
          "Subscriptions": "subscription",
          "APIs": "api",
          "Courses": "course",
          "Software": "software",
          "Other": "other",
        };

        // Process each sheet
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Determine product type from sheet name
          const productType = sheetTypeMap[sheetName] || "other";

          jsonData.forEach((row: any) => {
            rowCounter++;
            const errors: string[] = [];
            
            // Validate required fields
            if (!row.name || String(row.name).trim() === "") {
              errors.push(language === "bn" ? "নাম আবশ্যক" : "Name is required");
            }

            const price = parseFloat(row.price) || 0;
            if (price < 0) {
              errors.push(language === "bn" ? "দাম ০ বা তার বেশি হতে হবে" : "Price must be 0 or greater");
            }

            const productData: CreateDigitalProductInput = {
              name: String(row.name || "").trim(),
              description: String(row.description || "").trim(),
              product_type: productType as any,
              price: price,
              sale_price: row.sale_price ? parseFloat(row.sale_price) : undefined,
              // Subscription fields
              credential_username: String(row.credential_username || "").trim(),
              credential_password: String(row.credential_password || "").trim(),
              credential_email: String(row.credential_email || "").trim(),
              // API fields
              api_endpoint: String(row.api_endpoint || "").trim(),
              api_key: String(row.api_key || "").trim(),
              api_documentation: String(row.api_documentation || "").trim(),
              // Course fields
              access_url: String(row.access_url || "").trim(),
              access_instructions: String(row.access_instructions || "").trim(),
              // Software fields
              file_url: String(row.file_url || "").trim(),
              file_name: String(row.file_name || "").trim(),
              // Stock - each row is 1 item
              stock_quantity: 1,
              is_unlimited_stock: false,
              is_active: String(row.is_active || "yes").toLowerCase() !== "no",
            };

            allParsed.push({
              rowNumber: rowCounter,
              data: productData,
              isValid: errors.length === 0,
              errors,
              sheetName,
            });
          });
        });

        if (allParsed.length === 0) {
          toast.error(language === "bn" ? "ফাইলে কোনো ডাটা নেই" : "No data found in file");
          setIsProcessing(false);
          return;
        }

        setParsedProducts(allParsed);
        setIsProcessing(false);
      } catch (error) {
        console.error("Error parsing file:", error);
        toast.error(language === "bn" ? "ফাইল পড়তে সমস্যা হয়েছে" : "Error reading file");
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseExcelFile(file);
    }
  };

  const handleUpload = async () => {
    const validProducts = parsedProducts.filter((p) => p.isValid);
    if (validProducts.length === 0) {
      toast.error(language === "bn" ? "কোনো বৈধ প্রোডাক্ট নেই" : "No valid products to upload");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < validProducts.length; i++) {
      try {
        await digitalProductService.createProduct(validProducts[i].data);
        successCount++;
      } catch (error) {
        console.error("Error creating product:", error);
        failCount++;
      }
      setUploadProgress(Math.round(((i + 1) / validProducts.length) * 100));
    }

    setIsUploading(false);

    if (successCount > 0) {
      toast.success(
        language === "bn"
          ? `${successCount}টি প্রোডাক্ট সফলভাবে যোগ হয়েছে`
          : `${successCount} products added successfully`
      );
      onSuccess();
    }

    if (failCount > 0) {
      toast.error(
        language === "bn"
          ? `${failCount}টি প্রোডাক্ট যোগ করতে ব্যর্থ`
          : `${failCount} products failed to add`
      );
    }
  };

  const validCount = parsedProducts.filter((p) => p.isValid).length;
  const invalidCount = parsedProducts.filter((p) => !p.isValid).length;

  const resetModal = () => {
    setParsedProducts([]);
    setFileName("");
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case "subscription":
        return <Key className="w-4 h-4" />;
      case "api":
        return <Globe className="w-4 h-4" />;
      case "course":
        return <BookOpen className="w-4 h-4" />;
      case "software":
        return <FileCode className="w-4 h-4" />;
      default:
        return <FileCode className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            {language === "bn" ? "বাল্ক প্রোডাক্ট আপলোড" : "Bulk Product Upload"}
          </DialogTitle>
          <DialogDescription>
            {language === "bn"
              ? "Excel ফাইল থেকে একসাথে অনেক ডিজিটাল প্রোডাক্ট যোগ করুন। প্রতিটা শীটে আলাদা প্রোডাক্ট টাইপ।"
              : "Add multiple digital products from Excel. Each sheet represents a different product type."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Template Download */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium">
                    {language === "bn" ? "টেমপ্লেট ডাউনলোড করুন" : "Download Template"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === "bn"
                      ? "৫টি শীট: Subscriptions, APIs, Courses, Software, Other"
                      : "5 sheets: Subscriptions, APIs, Courses, Software, Other"}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                {language === "bn" ? "ডাউনলোড" : "Download"}
              </Button>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>{language === "bn" ? "Excel ফাইল আপলোড করুন" : "Upload Excel File"}</Label>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={isProcessing || isUploading}
              />
            </div>
            {fileName && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Table className="w-4 h-4" />
                {fileName}
              </p>
            )}
          </div>

          {/* Processing State */}
          {isProcessing && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
              <span>{language === "bn" ? "ফাইল প্রসেস হচ্ছে..." : "Processing file..."}</span>
            </div>
          )}

          {/* Parsed Products Preview */}
          {parsedProducts.length > 0 && !isProcessing && (
            <>
              {/* Summary */}
              <div className="flex items-center gap-4 flex-wrap">
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {language === "bn" ? `${validCount}টি বৈধ` : `${validCount} valid`}
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                    <XCircle className="w-3 h-3 mr-1" />
                    {language === "bn" ? `${invalidCount}টি ত্রুটিপূর্ণ` : `${invalidCount} invalid`}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {language === "bn" 
                    ? `${new Set(parsedProducts.map(p => p.sheetName)).size}টি শীট থেকে`
                    : `from ${new Set(parsedProducts.map(p => p.sheetName)).size} sheets`}
                </span>
              </div>

              {/* Products List */}
              <ScrollArea className="flex-1 border rounded-lg">
                <div className="p-2 space-y-2">
                  {parsedProducts.map((product, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        product.isValid
                          ? "bg-green-500/5 border-green-500/20"
                          : "bg-destructive/5 border-destructive/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {product.isValid ? (
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              {getProductTypeIcon(product.data.product_type)}
                              <span className="font-medium">{product.data.name || "(No Name)"}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {product.sheetName} • ৳{product.data.price}
                              {product.data.credential_username && (
                                <span className="ml-2">• {product.data.credential_username}</span>
                              )}
                              {product.data.api_key && (
                                <span className="ml-2">• {product.data.api_key.substring(0, 10)}...</span>
                              )}
                              {product.data.access_url && (
                                <span className="ml-2">• URL added</span>
                              )}
                              {product.data.file_url && (
                                <span className="ml-2">• File: {product.data.file_name || "added"}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {product.data.product_type}
                        </Badge>
                      </div>
                      {!product.isValid && (
                        <div className="mt-2 text-xs text-destructive">
                          {product.errors.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{language === "bn" ? "আপলোড হচ্ছে..." : "Uploading..."}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            {language === "bn" ? "বাতিল" : "Cancel"}
          </Button>
          {parsedProducts.length > 0 && (
            <Button
              onClick={handleUpload}
              disabled={isUploading || validCount === 0}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === "bn" ? "আপলোড হচ্ছে..." : "Uploading..."}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {language === "bn" ? `${validCount}টি প্রোডাক্ট যোগ করুন` : `Add ${validCount} Products`}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
