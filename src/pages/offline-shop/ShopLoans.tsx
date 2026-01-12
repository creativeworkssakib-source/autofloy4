import React, { useState, useEffect } from "react";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useShop } from "@/contexts/ShopContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOfflineLoans } from "@/hooks/useOfflineShopData";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { bn, enUS } from "date-fns/locale";
import {
  Plus,
  Banknote,
  Building2,
  Users,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit,
  Eye,
  CreditCard,
  Receipt,
  Bell,
  Search,
  WifiOff,
  Cloud,
} from "lucide-react";

interface Loan {
  id: string;
  lender_name: string;
  lender_type: string;
  loan_amount: number;
  interest_rate: number;
  total_installments: number;
  installment_amount: number;
  start_date: string;
  next_payment_date: string | null;
  payment_day: number;
  total_paid: number;
  remaining_amount: number;
  paid_installments: number;
  status: string;
  notes: string | null;
  created_at: string;
}

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  installment_number: number;
  late_fee: number;
  notes: string | null;
}

interface LoanStats {
  totalLoans: number;
  totalPaid: number;
  totalRemaining: number;
  monthlyEmi: number;
  upcomingCount: number;
  overdueCount: number;
  activeCount: number;
  completedCount: number;
}

const ShopLoans = () => {
  const { currentShop: selectedShop } = useShop();
  const { user } = useAuth();
  const { language } = useLanguage();
  const token = localStorage.getItem("autofloy_token");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleting, setDeleting] = useState(false);

  // Use offline-first hook
  const {
    loans,
    stats,
    upcomingLoans,
    overdueLoans,
    loading,
    fromCache,
    isOnline,
    refetch: fetchLoans,
    createLoan,
    deleteLoan: deleteLoanOffline,
    addPayment,
  } = useOfflineLoans(statusFilter);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loanPayments, setLoanPayments] = useState<Payment[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Translations
  const t = {
    title: language === "bn" ? "লোন / কিস্তি ম্যানেজমেন্ট" : "Loan / EMI Management",
    totalLoan: language === "bn" ? "মোট লোন" : "Total Loan",
    paid: language === "bn" ? "পরিশোধ" : "Paid",
    remaining: language === "bn" ? "বাকি" : "Remaining",
    monthlyEmi: language === "bn" ? "মাসিক কিস্তি" : "Monthly EMI",
    overdueAlert: language === "bn" ? "টি কিস্তি বাকি পড়েছে!" : "installments overdue!",
    upcomingAlert: language === "bn" ? "টি কিস্তি আসছে ৭ দিনের মধ্যে" : "installments due within 7 days",
    loanList: language === "bn" ? "লোন তালিকা" : "Loan List",
    newLoan: language === "bn" ? "নতুন লোন" : "New Loan",
    editLoan: language === "bn" ? "লোন এডিট করুন" : "Edit Loan",
    addLoan: language === "bn" ? "নতুন লোন যোগ করুন" : "Add New Loan",
    lenderName: language === "bn" ? "ঋণদাতার নাম" : "Lender Name",
    lenderType: language === "bn" ? "ঋণদাতার ধরন" : "Lender Type",
    bank: language === "bn" ? "ব্যাংক" : "Bank",
    ngo: language === "bn" ? "এনজিও" : "NGO",
    personal: language === "bn" ? "ব্যক্তিগত" : "Personal",
    other: language === "bn" ? "অন্যান্য" : "Other",
    loanAmount: language === "bn" ? "লোনের পরিমাণ (৳)" : "Loan Amount (৳)",
    interestRate: language === "bn" ? "সুদের হার (%)" : "Interest Rate (%)",
    totalInstallments: language === "bn" ? "মোট কিস্তি সংখ্যা" : "Total Installments",
    installmentAmount: language === "bn" ? "প্রতি কিস্তি (৳)" : "Per Installment (৳)",
    autoCalculate: language === "bn" ? "অটো ক্যালকুলেট" : "Auto Calculate",
    startDate: language === "bn" ? "শুরুর তারিখ" : "Start Date",
    paymentDay: language === "bn" ? "পেমেন্ট দিন (মাসের)" : "Payment Day (of month)",
    dayOfMonth: language === "bn" ? "তারিখ" : "day",
    notes: language === "bn" ? "নোট" : "Notes",
    additionalInfo: language === "bn" ? "অতিরিক্ত তথ্য..." : "Additional info...",
    update: language === "bn" ? "আপডেট করুন" : "Update",
    addLoanBtn: language === "bn" ? "লোন যোগ করুন" : "Add Loan",
    searchLender: language === "bn" ? "ঋণদাতার নাম খুঁজুন..." : "Search lender name...",
    status: language === "bn" ? "স্ট্যাটাস" : "Status",
    all: language === "bn" ? "সব" : "All",
    active: language === "bn" ? "সক্রিয়" : "Active",
    completed: language === "bn" ? "সম্পন্ন" : "Completed",
    defaulted: language === "bn" ? "বাকি" : "Defaulted",
    loading: language === "bn" ? "লোড হচ্ছে..." : "Loading...",
    noLoans: language === "bn" ? "কোন লোন নেই। নতুন লোন যোগ করুন।" : "No loans found. Add a new loan.",
    lender: language === "bn" ? "ঋণদাতা" : "Lender",
    loan: language === "bn" ? "লোন" : "Loan",
    installment: language === "bn" ? "কিস্তি" : "Installment",
    progress: language === "bn" ? "অগ্রগতি" : "Progress",
    nextPayment: language === "bn" ? "পরের পেমেন্ট" : "Next Payment",
    action: language === "bn" ? "অ্যাকশন" : "Action",
    interest: language === "bn" ? "সুদ" : "Interest",
    remainingAmount: language === "bn" ? "বাকি" : "Remaining",
    daysOverdue: language === "bn" ? "দিন বাকি" : "days overdue",
    daysLeft: language === "bn" ? "দিন বাকি" : "days left",
    today: language === "bn" ? "আজকে" : "Today",
    loanDetails: language === "bn" ? "লোনের বিস্তারিত" : "Loan Details",
    paidAmount: language === "bn" ? "পরিশোধ করেছেন" : "Paid Amount",
    perInstallment: language === "bn" ? "প্রতি কিস্তি" : "Per Installment",
    installmentsDone: language === "bn" ? "কিস্তি সম্পন্ন" : "installments done",
    paymentHistory: language === "bn" ? "পেমেন্ট হিস্টোরি" : "Payment History",
    noPayments: language === "bn" ? "কোন পেমেন্ট নেই" : "No payments yet",
    payInstallment: language === "bn" ? "কিস্তি পে করুন" : "Pay Installment",
    installmentPayment: language === "bn" ? "কিস্তি পেমেন্ট" : "Installment Payment",
    paymentAmount: language === "bn" ? "পেমেন্ট পরিমাণ (৳)" : "Payment Amount (৳)",
    paymentDate: language === "bn" ? "পেমেন্ট তারিখ" : "Payment Date",
    paymentMethod: language === "bn" ? "পেমেন্ট মাধ্যম" : "Payment Method",
    cash: language === "bn" ? "নগদ" : "Cash",
    bkash: language === "bn" ? "বিকাশ" : "bKash",
    nagad: language === "bn" ? "নগদ মোবাইল" : "Nagad",
    lateFee: language === "bn" ? "লেট ফি (৳)" : "Late Fee (৳)",
    completePayment: language === "bn" ? "পেমেন্ট সম্পন্ন করুন" : "Complete Payment",
    deleteLoan: language === "bn" ? "লোন ডিলিট করবেন?" : "Delete Loan?",
    deleteConfirm: language === "bn" 
      ? "এর লোন এবং সব পেমেন্ট হিস্টোরি মুছে যাবে। এই কাজটি ফেরত নেওয়া যাবে না।" 
      : "'s loan and all payment history will be deleted. This action cannot be undone.",
    cancel: language === "bn" ? "বাতিল" : "Cancel",
    delete: language === "bn" ? "ডিলিট করুন" : "Delete",
    loanUpdated: language === "bn" ? "লোন আপডেট হয়েছে" : "Loan updated",
    loanAdded: language === "bn" ? "নতুন লোন যোগ হয়েছে" : "New loan added",
    loanDeleted: language === "bn" ? "লোন ডিলিট হয়েছে" : "Loan deleted",
    paymentSuccess: language === "bn" ? "পেমেন্ট সফল হয়েছে" : "Payment successful",
    loanCompleted: language === "bn" ? "🎉 লোন সম্পূর্ণ পরিশোধ হয়েছে!" : "🎉 Loan fully paid!",
    loadError: language === "bn" ? "লোন লোড করতে সমস্যা হয়েছে" : "Failed to load loans",
    of: language === "bn" ? "/" : "of",
  };

  // Form states
  const [formData, setFormData] = useState({
    lender_name: "",
    lender_type: "bank",
    loan_amount: "",
    interest_rate: "",
    total_installments: "",
    installment_amount: "",
    start_date: new Date().toISOString().split("T")[0],
    payment_day: "1",
    notes: "",
  });

  const [paymentData, setPaymentData] = useState({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "cash",
    late_fee: "",
    notes: "",
  });

  // fetchLoanDetails for viewing payment history (still uses API when online, or local data when offline)
  const API_BASE = import.meta.env.VITE_SUPABASE_URL;
  
  const fetchLoanDetails = async (loanId: string) => {
    if (!token || !isOnline) {
      // Use local data
      const loan = loans.find((l: any) => l.id === loanId);
      if (loan) {
        setSelectedLoan(loan);
        setLoanPayments([]); // Payments are not stored locally currently
      }
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/functions/v1/shop-loans/${loanId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSelectedLoan(data.loan);
      setLoanPayments(data.payments || []);
    } catch (error: any) {
      // Fallback to local
      const loan = loans.find((l: any) => l.id === loanId);
      if (loan) {
        setSelectedLoan(loan);
        setLoanPayments([]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing && selectedLoan) {
        // For editing, use API if online (offline editing not fully supported yet)
        if (isOnline) {
          const res = await fetch(`${API_BASE}/functions/v1/shop-loans/${selectedLoan.id}`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...formData,
              shop_id: selectedShop?.id,
              loan_amount: parseFloat(formData.loan_amount),
              interest_rate: parseFloat(formData.interest_rate) || 0,
              total_installments: parseInt(formData.total_installments),
              installment_amount: parseFloat(formData.installment_amount) || undefined,
              payment_day: parseInt(formData.payment_day),
            }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          toast.success(t.loanUpdated);
        } else {
          toast.error(language === "bn" ? "এডিট করতে ইন্টারনেট প্রয়োজন" : "Internet required to edit");
          return;
        }
      } else {
        // Create new loan using offline-first hook
        await createLoan({
          customer_name: formData.lender_name,
          loan_type: 'taken',
          principal_amount: parseFloat(formData.loan_amount),
          interest_rate: parseFloat(formData.interest_rate) || 0,
          total_amount: parseFloat(formData.loan_amount) * (1 + (parseFloat(formData.interest_rate) || 0) / 100),
          paid_amount: 0,
          remaining_amount: parseFloat(formData.loan_amount) * (1 + (parseFloat(formData.interest_rate) || 0) / 100),
          status: 'active',
          loan_date: formData.start_date,
          notes: formData.notes,
        });
        toast.success(t.loanAdded);
      }

      setIsAddModalOpen(false);
      resetForm();
      fetchLoans();
    } catch (error: any) {
      toast.error(error.message);
    }
  };
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    try {
      const result = await addPayment(selectedLoan.id, {
        amount: parseFloat(paymentData.amount),
        payment_date: paymentData.payment_date,
        payment_method: paymentData.payment_method,
        late_fee: parseFloat(paymentData.late_fee) || 0,
        notes: paymentData.notes,
      });

      toast.success(result.isCompleted ? t.loanCompleted : t.paymentSuccess);
      setIsPaymentModalOpen(false);
      setPaymentData({
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "cash",
        late_fee: "",
        notes: "",
      });
      if (isViewModalOpen && selectedLoan) {
        fetchLoanDetails(selectedLoan.id);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedLoan) return;
    setDeleting(true);

    try {
      await deleteLoanOffline(selectedLoan.id);
      toast.success(t.loanDeleted);
      setIsDeleteDialogOpen(false);
      setSelectedLoan(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      lender_name: "",
      lender_type: "bank",
      loan_amount: "",
      interest_rate: "",
      total_installments: "",
      installment_amount: "",
      start_date: new Date().toISOString().split("T")[0],
      payment_day: "1",
      notes: "",
    });
    setIsEditing(false);
    setSelectedLoan(null);
  };

  const openEditModal = (loan: Loan) => {
    setSelectedLoan(loan);
    setFormData({
      lender_name: loan.lender_name,
      lender_type: loan.lender_type,
      loan_amount: loan.loan_amount.toString(),
      interest_rate: loan.interest_rate.toString(),
      total_installments: loan.total_installments.toString(),
      installment_amount: loan.installment_amount.toString(),
      start_date: loan.start_date,
      payment_day: loan.payment_day.toString(),
      notes: loan.notes || "",
    });
    setIsEditing(true);
    setIsAddModalOpen(true);
  };

  const openViewModal = (loan: Loan) => {
    setSelectedLoan(loan);
    fetchLoanDetails(loan.id);
    setIsViewModalOpen(true);
  };

  const openPaymentModal = (loan: Loan) => {
    setSelectedLoan(loan);
    setPaymentData({
      amount: loan.installment_amount.toString(),
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: "cash",
      late_fee: "",
      notes: "",
    });
    setIsPaymentModalOpen(true);
  };

  const getLenderIcon = (type: string) => {
    switch (type) {
      case "bank":
        return <Building2 className="h-4 w-4" />;
      case "ngo":
        return <Users className="h-4 w-4" />;
      case "personal":
        return <Banknote className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-blue-500">{t.active}</Badge>;
      case "completed":
        return <Badge className="bg-green-500">{t.completed}</Badge>;
      case "defaulted":
        return <Badge variant="destructive">{t.defaulted}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDaysUntilPayment = (date: string | null) => {
    if (!date) return null;
    const days = differenceInDays(new Date(date), new Date());
    if (days < 0) return { days: Math.abs(days), overdue: true };
    return { days, overdue: false };
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "d MMM", { locale: language === "bn" ? bn : enUS });
  };

  const formatDateFull = (date: string) => {
    return format(new Date(date), "d MMM yyyy", { locale: language === "bn" ? bn : enUS });
  };

  const filteredLoans = loans.filter((loan) =>
    loan.lender_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ShopLayout>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Banknote className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.totalLoan}</p>
                <p className="text-lg font-bold">
                  ৳{stats?.totalLoans.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.paid}</p>
                <p className="text-lg font-bold">
                  ৳{stats?.totalPaid.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Receipt className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.remaining}</p>
                <p className="text-lg font-bold">
                  ৳{stats?.totalRemaining.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <CreditCard className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.monthlyEmi}</p>
                <p className="text-lg font-bold">
                  ৳{stats?.monthlyEmi.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {overdueLoans.length > 0 && (
        <Card className="mb-4 border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">
                  {overdueLoans.length}{t.overdueAlert}
                </p>
                <p className="text-sm text-muted-foreground">
                  {overdueLoans.map((l) => l.lender_name).join(", ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {upcomingLoans.length > 0 && (
        <Card className="mb-4 border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-medium text-yellow-600 dark:text-yellow-400">
                  {upcomingLoans.length}{t.upcomingAlert}
                </p>
                <p className="text-sm text-muted-foreground">
                  {upcomingLoans.map((l) => l.lender_name).join(", ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t.loanList}</CardTitle>
          <Dialog open={isAddModalOpen} onOpenChange={(open) => {
            setIsAddModalOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t.newLoan}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? t.editLoan : t.addLoan}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>{t.lenderName} *</Label>
                    <Input
                      value={formData.lender_name}
                      onChange={(e) =>
                        setFormData({ ...formData, lender_name: e.target.value })
                      }
                      placeholder="BRAC, Grameen Bank..."
                      required
                    />
                  </div>
                  <div>
                    <Label>{t.lenderType}</Label>
                    <Select
                      value={formData.lender_type}
                      onValueChange={(v) =>
                        setFormData({ ...formData, lender_type: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank">{t.bank}</SelectItem>
                        <SelectItem value="ngo">{t.ngo}</SelectItem>
                        <SelectItem value="personal">{t.personal}</SelectItem>
                        <SelectItem value="other">{t.other}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t.loanAmount} *</Label>
                    <Input
                      type="number"
                      value={formData.loan_amount}
                      onChange={(e) =>
                        setFormData({ ...formData, loan_amount: e.target.value })
                      }
                      placeholder="50000"
                      required
                    />
                  </div>
                  <div>
                    <Label>{t.interestRate}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.interest_rate}
                      onChange={(e) =>
                        setFormData({ ...formData, interest_rate: e.target.value })
                      }
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <Label>{t.totalInstallments} *</Label>
                    <Input
                      type="number"
                      value={formData.total_installments}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          total_installments: e.target.value,
                        })
                      }
                      placeholder="12"
                      required
                    />
                  </div>
                  <div>
                    <Label>{t.installmentAmount}</Label>
                    <Input
                      type="number"
                      value={formData.installment_amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          installment_amount: e.target.value,
                        })
                      }
                      placeholder={t.autoCalculate}
                    />
                  </div>
                  <div>
                    <Label>{t.startDate}</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, start_date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>{t.paymentDay}</Label>
                    <Select
                      value={formData.payment_day}
                      onValueChange={(v) =>
                        setFormData({ ...formData, payment_day: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {i + 1} {t.dayOfMonth}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>{t.notes}</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder={t.additionalInfo}
                      rows={2}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  {isEditing ? t.update : t.addLoanBtn}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.searchLender}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.all}</SelectItem>
                <SelectItem value="active">{t.active}</SelectItem>
                <SelectItem value="completed">{t.completed}</SelectItem>
                <SelectItem value="defaulted">{t.defaulted}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loans Table */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">{t.loading}</div>
          ) : filteredLoans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t.noLoans}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.lender}</TableHead>
                    <TableHead className="text-right">{t.loan}</TableHead>
                    <TableHead className="text-right">{t.installment}</TableHead>
                    <TableHead className="text-center">{t.progress}</TableHead>
                    <TableHead>{t.nextPayment}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead className="text-right">{t.action}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoans.map((loan) => {
                    const paymentInfo = getDaysUntilPayment(loan.next_payment_date);
                    const progress =
                      (loan.paid_installments / loan.total_installments) * 100;

                    return (
                      <TableRow key={loan.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-muted rounded">
                              {getLenderIcon(loan.lender_type)}
                            </div>
                            <div>
                              <p className="font-medium">{loan.lender_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {loan.interest_rate}% {t.interest}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="font-medium">
                            ৳{loan.loan_amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t.remainingAmount}: ৳{loan.remaining_amount.toLocaleString()}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="font-medium">
                            ৳{loan.installment_amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {loan.paid_installments}/{loan.total_installments}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="w-24">
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-center mt-1">
                              {Math.round(progress)}%
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {loan.next_payment_date ? (
                            <div>
                              <p className="text-sm">
                                {formatDate(loan.next_payment_date)}
                              </p>
                              {paymentInfo && (
                                <p
                                  className={`text-xs ${
                                    paymentInfo.overdue
                                      ? "text-destructive"
                                      : paymentInfo.days <= 3
                                      ? "text-yellow-500"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {paymentInfo.overdue
                                    ? `${paymentInfo.days} ${t.daysOverdue}`
                                    : paymentInfo.days === 0
                                    ? t.today
                                    : `${paymentInfo.days} ${t.daysLeft}`}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(loan.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openViewModal(loan)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {loan.status === "active" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openPaymentModal(loan)}
                                className="text-green-500 hover:text-green-600"
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditModal(loan)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedLoan(loan);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Loan Details Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.loanDetails}</DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="p-3 bg-primary/10 rounded-lg">
                  {getLenderIcon(selectedLoan.lender_type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{selectedLoan.lender_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedLoan.interest_rate}% {t.interest} - {selectedLoan.total_installments} {t.installment}
                  </p>
                </div>
                {getStatusBadge(selectedLoan.status)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">{t.totalLoan}</p>
                  <p className="font-semibold">
                    ৳{selectedLoan.loan_amount.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">{t.remaining}</p>
                  <p className="font-semibold text-orange-500">
                    ৳{selectedLoan.remaining_amount.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">{t.paidAmount}</p>
                  <p className="font-semibold text-green-500">
                    ৳{selectedLoan.total_paid.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">{t.perInstallment}</p>
                  <p className="font-semibold">
                    ৳{selectedLoan.installment_amount.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <Progress
                  value={
                    (selectedLoan.paid_installments / selectedLoan.total_installments) *
                    100
                  }
                  className="h-3"
                />
                <p className="text-sm text-center mt-2">
                  {selectedLoan.paid_installments}{t.of}{selectedLoan.total_installments} {t.installmentsDone}
                </p>
              </div>

              {/* Payment History */}
              <div>
                <h4 className="font-medium mb-2">{t.paymentHistory}</h4>
                {loanPayments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t.noPayments}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {loanPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-500/10 rounded-full">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium">
                              ৳{payment.amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t.installment} #{payment.installment_number}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">
                            {formatDateFull(payment.payment_date)}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {payment.payment_method}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedLoan.status === "active" && (
                <Button
                  className="w-full"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openPaymentModal(selectedLoan);
                  }}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {t.payInstallment}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.installmentPayment}</DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{selectedLoan.lender_name}</p>
                <p className="text-sm text-muted-foreground">
                  {t.installment} #{selectedLoan.paid_installments + 1} {t.of} {selectedLoan.total_installments}
                </p>
              </div>

              <div>
                <Label>{t.paymentAmount} *</Label>
                <Input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, amount: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label>{t.paymentDate}</Label>
                <Input
                  type="date"
                  value={paymentData.payment_date}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, payment_date: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>{t.paymentMethod}</Label>
                <Select
                  value={paymentData.payment_method}
                  onValueChange={(v) =>
                    setPaymentData({ ...paymentData, payment_method: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t.cash}</SelectItem>
                    <SelectItem value="bank">{t.bank}</SelectItem>
                    <SelectItem value="bkash">{t.bkash}</SelectItem>
                    <SelectItem value="nagad">{t.nagad}</SelectItem>
                    <SelectItem value="other">{t.other}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t.lateFee}</Label>
                <Input
                  type="number"
                  value={paymentData.late_fee}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, late_fee: e.target.value })
                  }
                  placeholder="0"
                />
              </div>

              <div>
                <Label>{t.notes}</Label>
                <Textarea
                  value={paymentData.notes}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, notes: e.target.value })
                  }
                  placeholder={t.additionalInfo}
                  rows={2}
                />
              </div>

              <Button type="submit" className="w-full">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {t.completePayment}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteLoan}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedLoan?.lender_name} {t.deleteConfirm}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? t.loading : t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ShopLayout>
  );
};

export default ShopLoans;
