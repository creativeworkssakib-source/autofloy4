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
    const templateData = [
      {
        name: "Canva Pro 1 Month",
        product_type: "subscription",
        price: 150,
        sale_price: 120,
        description: "Premium Canva subscription",
        credential_username: "user@email.com",
        credential_password: "password123",
        credential_email: "recovery@email.com",
        api_endpoint: "",
        api_key: "",
        api_documentation: "",
        access_url: "",
        access_instructions: "",
        file_url: "",
        file_name: "",
        stock_quantity: 10,
        is_unlimited_stock: "no",
        is_active: "yes",
      },
      {
        name: "OpenAI API Credit",
        product_type: "api",
        price: 500,
        sale_price: "",
        description: "GPT-4 API access",
        credential_username: "",
        credential_password: "",
        credential_email: "",
        api_endpoint: "https://api.openai.com/v1",
        api_key: "sk-xxxxx",
        api_documentation: "https://platform.openai.com/docs",
        access_url: "",
        access_instructions: "",
        file_url: "",
        file_name: "",
        stock_quantity: 5,
        is_unlimited_stock: "no",
        is_active: "yes",
      },
      {
        name: "Web Development Course",
        product_type: "course",
        price: 2000,
        sale_price: 1500,
        description: "Complete web dev bootcamp",
        credential_username: "",
        credential_password: "",
        credential_email: "",
        api_endpoint: "",
        api_key: "",
        api_documentation: "",
        access_url: "https://course.example.com",
        access_instructions: "Use the link to access course",
        file_url: "",
        file_name: "",
        stock_quantity: 1,
        is_unlimited_stock: "yes",
        is_active: "yes",
      },
      {
        name: "Premium APK",
        product_type: "software",
        price: 100,
        sale_price: "",
        description: "Modded app",
        credential_username: "",
        credential_password: "",
        credential_email: "",
        api_endpoint: "",
        api_key: "",
        api_documentation: "",
        access_url: "",
        access_instructions: "",
        file_url: "https://drive.google.com/file/xxx",
        file_name: "app-v2.0.apk",
        stock_quantity: 1,
        is_unlimited_stock: "yes",
        is_active: "yes",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Digital Products");
    
    // Set column widths
    ws["!cols"] = [
      { wch: 25 }, // name
      { wch: 15 }, // product_type
      { wch: 10 }, // price
      { wch: 10 }, // sale_price
      { wch: 30 }, // description
      { wch: 25 }, // credential_username
      { wch: 20 }, // credential_password
      { wch: 25 }, // credential_email
      { wch: 30 }, // api_endpoint
      { wch: 25 }, // api_key
      { wch: 30 }, // api_documentation
      { wch: 30 }, // access_url
      { wch: 30 }, // access_instructions
      { wch: 40 }, // file_url
      { wch: 20 }, // file_name
      { wch: 15 }, // stock_quantity
      { wch: 18 }, // is_unlimited_stock
      { wch: 12 }, // is_active
    ];

    XLSX.writeFile(wb, "digital_products_template.xlsx");
    toast.success(language === "bn" ? "টেমপ্লেট ডাউনলোড হয়েছে" : "Template downloaded");
  };

  const parseExcelFile = (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast.error(language === "bn" ? "ফাইলে কোনো ডাটা নেই" : "No data found in file");
          setIsProcessing(false);
          return;
        }

        const parsed: ParsedProduct[] = jsonData.map((row: any, index) => {
          const errors: string[] = [];
          
          // Validate required fields
          if (!row.name || String(row.name).trim() === "") {
            errors.push(language === "bn" ? "নাম আবশ্যক" : "Name is required");
          }
          
          if (!row.product_type || !validProductTypes.includes(String(row.product_type).toLowerCase())) {
            errors.push(language === "bn" ? "সঠিক প্রোডাক্ট টাইপ দিন (subscription/api/course/software/other)" : "Invalid product type");
          }

          const price = parseFloat(row.price) || 0;
          if (price < 0) {
            errors.push(language === "bn" ? "দাম ০ বা তার বেশি হতে হবে" : "Price must be 0 or greater");
          }

          const productData: CreateDigitalProductInput = {
            name: String(row.name || "").trim(),
            description: String(row.description || "").trim(),
            product_type: String(row.product_type || "other").toLowerCase() as any,
            price: price,
            sale_price: row.sale_price ? parseFloat(row.sale_price) : undefined,
            credential_username: String(row.credential_username || "").trim(),
            credential_password: String(row.credential_password || "").trim(),
            credential_email: String(row.credential_email || "").trim(),
            api_endpoint: String(row.api_endpoint || "").trim(),
            api_key: String(row.api_key || "").trim(),
            api_documentation: String(row.api_documentation || "").trim(),
            access_url: String(row.access_url || "").trim(),
            access_instructions: String(row.access_instructions || "").trim(),
            file_url: String(row.file_url || "").trim(),
            file_name: String(row.file_name || "").trim(),
            stock_quantity: parseInt(row.stock_quantity) || 1,
            is_unlimited_stock: String(row.is_unlimited_stock || "").toLowerCase() === "yes",
            is_active: String(row.is_active || "yes").toLowerCase() !== "no",
          };

          return {
            rowNumber: index + 2, // Excel row number (1-indexed + header)
            data: productData,
            isValid: errors.length === 0,
            errors,
          };
        });

        setParsedProducts(parsed);
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
            <Upload className="w-5 h-5 text-purple-600" />
            {language === "bn" ? "বাল্ক প্রোডাক্ট আপলোড" : "Bulk Product Upload"}
          </DialogTitle>
          <DialogDescription>
            {language === "bn"
              ? "Excel/CSV ফাইল থেকে একসাথে অনেক ডিজিটাল প্রোডাক্ট যোগ করুন"
              : "Add multiple digital products at once from Excel/CSV file"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Template Download */}
          <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="font-medium">
                    {language === "bn" ? "টেমপ্লেট ডাউনলোড করুন" : "Download Template"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === "bn"
                      ? "সঠিক ফরম্যাটে ডাটা দিতে টেমপ্লেট ব্যবহার করুন"
                      : "Use the template to format your data correctly"}
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
            <Label>{language === "bn" ? "Excel/CSV ফাইল আপলোড করুন" : "Upload Excel/CSV File"}</Label>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
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
              <Loader2 className="w-6 h-6 animate-spin text-purple-600 mr-2" />
              <span>{language === "bn" ? "ফাইল প্রসেস হচ্ছে..." : "Processing file..."}</span>
            </div>
          )}

          {/* Parsed Products Preview */}
          {parsedProducts.length > 0 && !isProcessing && (
            <>
              {/* Summary */}
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {language === "bn" ? `${validCount}টি বৈধ` : `${validCount} valid`}
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                    <XCircle className="w-3 h-3 mr-1" />
                    {language === "bn" ? `${invalidCount}টি ত্রুটিপূর্ণ` : `${invalidCount} invalid`}
                  </Badge>
                )}
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
                          : "bg-red-500/5 border-red-500/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {product.isValid ? (
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              {getProductTypeIcon(product.data.product_type)}
                              <span className="font-medium">{product.data.name || "(No Name)"}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Row {product.rowNumber} • ৳{product.data.price}
                              {product.data.credential_username && (
                                <span className="ml-2">• {product.data.credential_username}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {product.data.product_type}
                        </Badge>
                      </div>
                      {!product.isValid && (
                        <div className="mt-2 text-xs text-red-600">
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
              className="bg-purple-600 hover:bg-purple-700"
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
