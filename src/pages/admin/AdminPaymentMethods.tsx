import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, GripVertical, Smartphone, Landmark, CreditCard, Wallet, Bitcoin, Globe, Eye, EyeOff } from "lucide-react";

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  account_number: string | null;
  account_name: string | null;
  instructions: string | null;
  icon: string;
  is_active: boolean;
  display_order: number;
  gateway_url: string | null;
  api_key: string | null;
  api_secret: string | null;
  created_at: string;
  updated_at: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  smartphone: Smartphone,
  landmark: Landmark,
  "credit-card": CreditCard,
  wallet: Wallet,
  bitcoin: Bitcoin,
  globe: Globe,
};

const typeOptions = [
  { value: "mobile_money", label: "Mobile Money (bKash, Nagad, etc.)" },
  { value: "bank", label: "Bank Transfer" },
  { value: "card", label: "Card Payment" },
  { value: "crypto", label: "Cryptocurrency" },
  { value: "payment_gateway", label: "Payment Gateway (SSLCommerz, MoynaPay, etc.)" },
  { value: "other", label: "Other" },
];

const iconOptions = [
  { value: "smartphone", label: "Smartphone (Mobile Money)" },
  { value: "landmark", label: "Landmark (Bank)" },
  { value: "credit-card", label: "Credit Card" },
  { value: "wallet", label: "Wallet" },
  { value: "bitcoin", label: "Bitcoin (Crypto)" },
  { value: "globe", label: "Globe (Payment Gateway)" },
];

interface PaymentMethodForm {
  name: string;
  type: string;
  account_number: string;
  account_name: string;
  instructions: string;
  icon: string;
  is_active: boolean;
  display_order: number;
  gateway_url: string;
  api_key: string;
  api_secret: string;
}

export default function AdminPaymentMethods() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [deleteMethod, setDeleteMethod] = useState<PaymentMethod | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);

  const [formData, setFormData] = useState<PaymentMethodForm>({
    name: "",
    type: "mobile_money",
    account_number: "",
    account_name: "",
    instructions: "",
    icon: "smartphone",
    is_active: true,
    display_order: 0,
    gateway_url: "",
    api_key: "",
    api_secret: "",
  });

  const fetchMethods = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setMethods((data as PaymentMethod[]) || []);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: "Failed to load payment methods",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();

    // Realtime subscription
    const channel = supabase
      .channel("payment-methods-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payment_methods" },
        () => {
          fetchMethods();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      type: "mobile_money",
      account_number: "",
      account_name: "",
      instructions: "",
      icon: "smartphone",
      is_active: true,
      display_order: methods.length,
      gateway_url: "",
      api_key: "",
      api_secret: "",
    });
    setEditingMethod(null);
    setShowApiKey(false);
    setShowApiSecret(false);
  };

  const openEditDialog = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      type: method.type,
      account_number: method.account_number || "",
      account_name: method.account_name || "",
      instructions: method.instructions || "",
      icon: method.icon,
      is_active: method.is_active,
      display_order: method.display_order,
      gateway_url: method.gateway_url || "",
      api_key: method.api_key || "",
      api_secret: method.api_secret || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const submitData = {
      name: formData.name,
      type: formData.type,
      account_number: formData.account_number || null,
      account_name: formData.account_name || null,
      instructions: formData.instructions || null,
      icon: formData.icon,
      is_active: formData.is_active,
      display_order: formData.display_order,
      gateway_url: formData.gateway_url || null,
      api_key: formData.api_key || null,
      api_secret: formData.api_secret || null,
    };

    try {
      if (editingMethod) {
        const { error } = await supabase
          .from("payment_methods")
          .update(submitData)
          .eq("id", editingMethod.id);

        if (error) throw error;

        toast({
          title: language === "bn" ? "আপডেট হয়েছে" : "Updated",
          description: "Payment method updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("payment_methods")
          .insert([{ ...submitData, display_order: methods.length }]);

        if (error) throw error;

        toast({
          title: language === "bn" ? "যোগ হয়েছে" : "Added",
          description: "Payment method added successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving payment method:", error);
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: "Failed to save payment method",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteMethod) return;

    try {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", deleteMethod.id);

      if (error) throw error;

      toast({
        title: language === "bn" ? "মুছে ফেলা হয়েছে" : "Deleted",
        description: "Payment method deleted successfully",
      });

      setDeleteMethod(null);
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: "Failed to delete payment method",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (method: PaymentMethod) => {
    try {
      const { error } = await supabase
        .from("payment_methods")
        .update({ is_active: !method.is_active })
        .eq("id", method.id);

      if (error) throw error;

      toast({
        title: method.is_active 
          ? (language === "bn" ? "নিষ্ক্রিয় করা হয়েছে" : "Deactivated")
          : (language === "bn" ? "সক্রিয় করা হয়েছে" : "Activated"),
      });
    } catch (error) {
      console.error("Error toggling payment method:", error);
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Wallet;
    return <IconComponent className="h-5 w-5" />;
  };

  const isPaymentGateway = formData.type === "payment_gateway";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {language === "bn" ? "পেমেন্ট মেথড" : "Payment Methods"}
            </h1>
            <p className="text-muted-foreground">
              {language === "bn" 
                ? "ইউজাররা যেভাবে পেমেন্ট করবে সেই মেথডগুলো সেটআপ করুন"
                : "Configure payment methods that users will see during checkout"}
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {language === "bn" ? "নতুন মেথড" : "Add Method"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingMethod 
                    ? (language === "bn" ? "মেথড এডিট করুন" : "Edit Payment Method")
                    : (language === "bn" ? "নতুন মেথড যোগ করুন" : "Add Payment Method")}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>{language === "bn" ? "নাম" : "Name"}</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., bKash, SSLCommerz, MoynaPay"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === "bn" ? "টাইপ" : "Type"}</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value, icon: value === "payment_gateway" ? "globe" : formData.icon })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Gateway Fields */}
                {isPaymentGateway && (
                  <>
                    <div className="p-3 bg-muted/50 rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground mb-3">
                        {language === "bn" 
                          ? "পেমেন্ট গেটওয়ে কনফিগারেশন (SSLCommerz, MoynaPay, etc.)"
                          : "Payment Gateway Configuration (SSLCommerz, MoynaPay, etc.)"}
                      </p>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>{language === "bn" ? "গেটওয়ে URL" : "Gateway URL"}</Label>
                          <Input
                            value={formData.gateway_url}
                            onChange={(e) => setFormData({ ...formData, gateway_url: e.target.value })}
                            placeholder="https://sandbox.sslcommerz.com/..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>{language === "bn" ? "API Key / Store ID" : "API Key / Store ID"}</Label>
                          <div className="relative">
                            <Input
                              type={showApiKey ? "text" : "password"}
                              value={formData.api_key}
                              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                              placeholder="Your API key or Store ID"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                              onClick={() => setShowApiKey(!showApiKey)}
                            >
                              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>{language === "bn" ? "API Secret / Password" : "API Secret / Password"}</Label>
                          <div className="relative">
                            <Input
                              type={showApiSecret ? "text" : "password"}
                              value={formData.api_secret}
                              onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                              placeholder="Your API secret or password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                              onClick={() => setShowApiSecret(!showApiSecret)}
                            >
                              {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Standard Fields */}
                {!isPaymentGateway && (
                  <>
                    <div className="space-y-2">
                      <Label>{language === "bn" ? "একাউন্ট নম্বর" : "Account Number"}</Label>
                      <Input
                        value={formData.account_number}
                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                        placeholder="01XXXXXXXXX"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>{language === "bn" ? "একাউন্ট নাম" : "Account Name"}</Label>
                      <Input
                        value={formData.account_name}
                        onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                        placeholder="Your Business Name"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>{language === "bn" ? "নির্দেশনা" : "Instructions"}</Label>
                  <Textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    placeholder={isPaymentGateway ? "User will be redirected to payment gateway..." : "Payment instructions for users..."}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{language === "bn" ? "আইকন" : "Icon"}</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) => setFormData({ ...formData, icon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            {getIcon(opt.value)}
                            <span>{opt.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label>{language === "bn" ? "সক্রিয়" : "Active"}</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    {language === "bn" ? "বাতিল" : "Cancel"}
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting 
                      ? (language === "bn" ? "সেভ হচ্ছে..." : "Saving...")
                      : (language === "bn" ? "সেভ করুন" : "Save")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{language === "bn" ? "সব মেথড" : "All Methods"}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                {language === "bn" ? "লোড হচ্ছে..." : "Loading..."}
              </div>
            ) : methods.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {language === "bn" 
                  ? "কোনো পেমেন্ট মেথড নেই। উপরে বাটনে ক্লিক করে যোগ করুন।"
                  : "No payment methods yet. Click the button above to add one."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>{language === "bn" ? "নাম" : "Name"}</TableHead>
                    <TableHead>{language === "bn" ? "টাইপ" : "Type"}</TableHead>
                    <TableHead>{language === "bn" ? "একাউন্ট/গেটওয়ে" : "Account/Gateway"}</TableHead>
                    <TableHead>{language === "bn" ? "স্ট্যাটাস" : "Status"}</TableHead>
                    <TableHead className="text-right">{language === "bn" ? "অ্যাকশন" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {methods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getIcon(method.icon)}
                          <span className="font-medium">{method.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={method.type === "payment_gateway" ? "default" : "secondary"}>
                          {method.type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {method.type === "payment_gateway" 
                          ? (method.gateway_url ? "Gateway Configured" : "Not configured")
                          : (method.account_number || "-")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={method.is_active ? "default" : "secondary"}>
                          {method.is_active 
                            ? (language === "bn" ? "সক্রিয়" : "Active")
                            : (language === "bn" ? "নিষ্ক্রিয়" : "Inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={method.is_active}
                            onCheckedChange={() => toggleActive(method)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(method)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteMethod(method)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteMethod} onOpenChange={() => setDeleteMethod(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {language === "bn" ? "মুছে ফেলতে চান?" : "Delete Payment Method?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {language === "bn"
                  ? `"${deleteMethod?.name}" মুছে ফেললে এটি ইউজারদের চেকআউটে দেখাবে না।`
                  : `Deleting "${deleteMethod?.name}" will remove it from checkout options.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {language === "bn" ? "বাতিল" : "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                {language === "bn" ? "মুছে ফেলুন" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
