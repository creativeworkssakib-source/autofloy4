import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image,
  Video,
  Upload,
  Trash2,
  Search,
  Filter,
  Plus,
  X,
  Check,
  Loader2,
  ImageIcon,
  VideoIcon,
  Package,
  Sparkles,
  Eye,
  Info,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { productMediaService, ProductMedia } from "@/services/productMediaService";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  image_url?: string;
}

const AIMediaLibrary = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [media, setMedia] = useState<ProductMedia[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "image" | "video">("all");
  const [filterProduct, setFilterProduct] = useState<string>("all");
  
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadDescription, setUploadDescription] = useState("");
  
  // Preview modal
  const [previewMedia, setPreviewMedia] = useState<ProductMedia | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    totalMedia: 0,
    totalImages: 0,
    totalVideos: 0,
    productsWithMedia: 0,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Get user ID
      const userStr = localStorage.getItem("autofloy_current_user");
      if (!userStr) return;
      const user = JSON.parse(userStr);

      // Fetch products and media in parallel
      const [mediaData, statsData, productsRes] = await Promise.all([
        productMediaService.getAllMedia(),
        productMediaService.getStats(),
        supabase
          .from("products")
          .select("id, name, image_url")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("name"),
      ]);

      setMedia(mediaData);
      setStats(statsData);
      setProducts((productsRes.data || []) as Product[]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Validate file types
      const validFiles = files.filter(file => {
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");
        if (!isImage && !isVideo) {
          toast({
            title: language === "bn" ? "অবৈধ ফাইল" : "Invalid file",
            description: `${file.name} is not a valid image or video`,
            variant: "destructive",
          });
          return false;
        }
        // Check file size (max 50MB for videos, 10MB for images)
        const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
          toast({
            title: language === "bn" ? "ফাইল অনেক বড়" : "File too large",
            description: `${file.name} exceeds the maximum size`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      });
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedProduct || selectedFiles.length === 0) {
      toast({
        title: language === "bn" ? "প্রোডাক্ট সিলেক্ট করুন" : "Select a product",
        description: language === "bn" ? "এবং কমপক্ষে একটি ফাইল আপলোড করুন" : "And upload at least one file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    let successCount = 0;

    try {
      for (const file of selectedFiles) {
        const uploadResult = await productMediaService.uploadFile(file, selectedProduct);
        if (uploadResult) {
          const mediaType = file.type.startsWith("video/") ? "video" : "image";
          await productMediaService.createMedia({
            product_id: selectedProduct,
            media_type: mediaType,
            file_url: uploadResult.url,
            file_path: uploadResult.path,
            file_name: file.name,
            file_size_bytes: file.size,
            description: uploadDescription,
          });
          successCount++;
        }
      }

      toast({
        title: language === "bn" ? "আপলোড সফল!" : "Upload successful!",
        description: language === "bn" 
          ? `${successCount}টি মিডিয়া আপলোড হয়েছে` 
          : `${successCount} media files uploaded`,
      });

      // Reset and reload
      setShowUploadModal(false);
      setSelectedProduct("");
      setSelectedFiles([]);
      setUploadDescription("");
      loadData();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: language === "bn" ? "আপলোড ব্যর্থ" : "Upload failed",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (mediaItem: ProductMedia) => {
    if (!confirm(language === "bn" ? "এই মিডিয়া মুছে ফেলতে চান?" : "Delete this media?")) return;

    const success = await productMediaService.deleteMedia(mediaItem.id, mediaItem.file_path);
    if (success) {
      toast({
        title: language === "bn" ? "মুছে ফেলা হয়েছে" : "Deleted",
      });
      loadData();
    } else {
      toast({
        title: language === "bn" ? "মুছতে ব্যর্থ" : "Delete failed",
        variant: "destructive",
      });
    }
  };

  // Filter media
  const filteredMedia = media.filter(m => {
    if (filterType !== "all" && m.media_type !== filterType) return false;
    if (filterProduct !== "all" && m.product_id !== filterProduct) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        m.product?.name?.toLowerCase().includes(query) ||
        m.file_name?.toLowerCase().includes(query) ||
        m.description?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Group by product
  const mediaByProduct = filteredMedia.reduce((acc, m) => {
    const productId = m.product_id;
    if (!acc[productId]) {
      acc[productId] = {
        product: m.product,
        items: [],
      };
    }
    acc[productId].items.push(m);
    return acc;
  }, {} as Record<string, { product?: ProductMedia["product"]; items: ProductMedia[] }>);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                <Sparkles className="w-6 h-6" />
              </div>
              {language === "bn" ? "AI মিডিয়া লাইব্রেরি" : "AI Media Library"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === "bn" 
                ? "প্রোডাক্টের ফটো ও ভিডিও রাখুন যা AI কাস্টমারদের দেখাবে"
                : "Store product photos & videos for AI to show customers"}
            </p>
          </div>
          
          <Button
            onClick={() => setShowUploadModal(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Upload className="w-4 h-4 mr-2" />
            {language === "bn" ? "মিডিয়া আপলোড" : "Upload Media"}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Package className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.productsWithMedia}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === "bn" ? "প্রোডাক্ট" : "Products"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <ImageIcon className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalImages}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === "bn" ? "ছবি" : "Images"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/10 border-pink-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/20">
                  <VideoIcon className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalVideos}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === "bn" ? "ভিডিও" : "Videos"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Sparkles className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalMedia}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === "bn" ? "মোট মিডিয়া" : "Total Media"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Banner */}
        <Card className="bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-purple-600 dark:text-purple-400">
                {language === "bn" ? "AI কিভাবে এই মিডিয়া ব্যবহার করবে?" : "How will AI use this media?"}
              </p>
              <p className="text-muted-foreground mt-1">
                {language === "bn" 
                  ? "যখন কাস্টমার কোন প্রোডাক্টের ছবি বা ভিডিও দেখতে চাইবে, AI এখান থেকে সেই প্রোডাক্টের মিডিয়া পাঠাবে। এতে কাস্টমার সন্তুষ্ট হবে এবং অর্ডার করবে।"
                  : "When customers ask to see product photos or videos, AI will send media from here. This helps customers make purchase decisions."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={language === "bn" ? "সার্চ করুন..." : "Search..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "bn" ? "সব টাইপ" : "All Types"}</SelectItem>
              <SelectItem value="image">{language === "bn" ? "ছবি" : "Images"}</SelectItem>
              <SelectItem value="video">{language === "bn" ? "ভিডিও" : "Videos"}</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterProduct} onValueChange={setFilterProduct}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Package className="w-4 h-4 mr-2" />
              <SelectValue placeholder={language === "bn" ? "প্রোডাক্ট" : "Product"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "bn" ? "সব প্রোডাক্ট" : "All Products"}</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Media Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : Object.keys(mediaByProduct).length === 0 ? (
          <Card className="py-16">
            <CardContent className="text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">
                {language === "bn" ? "কোন মিডিয়া নেই" : "No media found"}
              </h3>
              <p className="text-muted-foreground mt-1">
                {language === "bn" 
                  ? "প্রোডাক্টের ফটো বা ভিডিও আপলোড করুন"
                  : "Upload photos or videos for your products"}
              </p>
              <Button
                onClick={() => setShowUploadModal(true)}
                className="mt-4"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                {language === "bn" ? "আপলোড করুন" : "Upload Now"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(mediaByProduct).map(([productId, group]) => (
              <Card key={productId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    {group.product?.image_url ? (
                      <img
                        src={group.product.image_url}
                        alt={group.product.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-base">{group.product?.name || "Unknown Product"}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {group.items.length} {language === "bn" ? "টি মিডিয়া" : "media files"}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {group.items.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group aspect-square rounded-lg overflow-hidden bg-muted"
                      >
                        {item.media_type === "image" ? (
                          <img
                            src={item.file_url}
                            alt={item.description || item.file_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={item.file_url}
                            className="w-full h-full object-cover"
                          />
                        )}
                        
                        {/* Type badge */}
                        <Badge
                          variant="secondary"
                          className="absolute top-2 left-2 text-xs"
                        >
                          {item.media_type === "image" ? (
                            <Image className="w-3 h-3 mr-1" />
                          ) : (
                            <Video className="w-3 h-3 mr-1" />
                          )}
                          {item.media_type === "image" 
                            ? (language === "bn" ? "ছবি" : "Image")
                            : (language === "bn" ? "ভিডিও" : "Video")}
                        </Badge>
                        
                        {/* Overlay actions */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setPreviewMedia(item)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(item)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Add more button */}
                    <button
                      onClick={() => {
                        setSelectedProduct(productId);
                        setShowUploadModal(true);
                      }}
                      className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2"
                    >
                      <Plus className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {language === "bn" ? "আরো যোগ করুন" : "Add More"}
                      </span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                {language === "bn" ? "মিডিয়া আপলোড করুন" : "Upload Media"}
              </DialogTitle>
              <DialogDescription>
                {language === "bn" 
                  ? "প্রোডাক্টের জন্য ফটো বা ভিডিও আপলোড করুন"
                  : "Upload photos or videos for a product"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Product selector */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {language === "bn" ? "প্রোডাক্ট সিলেক্ট করুন" : "Select Product"}
                </label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === "bn" ? "প্রোডাক্ট বাছুন..." : "Choose product..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-6 h-6 rounded object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-muted-foreground" />
                          )}
                          {p.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* File input */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {language === "bn" ? "ফাইল সিলেক্ট করুন" : "Select Files"}
                </label>
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="media-upload"
                  />
                  <label htmlFor="media-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {language === "bn" 
                        ? "ছবি বা ভিডিও সিলেক্ট করুন"
                        : "Select images or videos"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {language === "bn" 
                        ? "সর্বোচ্চ ১০MB ছবি, ৫০MB ভিডিও"
                        : "Max 10MB images, 50MB videos"}
                    </p>
                  </label>
                </div>
              </div>
              
              {/* Selected files */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {language === "bn" ? "সিলেক্টেড ফাইল" : "Selected Files"} ({selectedFiles.length})
                  </label>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {file.type.startsWith("image/") ? (
                            <ImageIcon className="w-4 h-4 text-purple-500 flex-shrink-0" />
                          ) : (
                            <VideoIcon className="w-4 h-4 text-pink-500 flex-shrink-0" />
                          )}
                          <span className="text-sm truncate">{file.name}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeSelectedFile(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Description */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {language === "bn" ? "বর্ণনা (ঐচ্ছিক)" : "Description (optional)"}
                </label>
                <Textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder={language === "bn" ? "এই মিডিয়া সম্পর্কে লিখুন..." : "Describe this media..."}
                  rows={2}
                />
              </div>
              
              {/* Upload button */}
              <Button
                onClick={handleUpload}
                disabled={uploading || !selectedProduct || selectedFiles.length === 0}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {language === "bn" ? "আপলোড হচ্ছে..." : "Uploading..."}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {language === "bn" ? "আপলোড করুন" : "Upload"}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Modal */}
        <Dialog open={!!previewMedia} onOpenChange={() => setPreviewMedia(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{previewMedia?.file_name || "Media Preview"}</DialogTitle>
            </DialogHeader>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {previewMedia?.media_type === "image" ? (
                <img
                  src={previewMedia.file_url}
                  alt={previewMedia.description || previewMedia.file_name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={previewMedia?.file_url}
                  controls
                  autoPlay
                  className="w-full h-full"
                />
              )}
            </div>
            {previewMedia?.description && (
              <p className="text-sm text-muted-foreground">{previewMedia.description}</p>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AIMediaLibrary;
