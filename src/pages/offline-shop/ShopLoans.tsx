import React, { useState, useEffect } from "react";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { bn } from "date-fns/locale";
import {
  Plus,
  Banknote,
  Building2,
  Users,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  Edit,
  Eye,
  CreditCard,
  Percent,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Search,
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

const API_BASE = import.meta.env.VITE_SUPABASE_URL;

const ShopLoans = () => {
  const { currentShop: selectedShop } = useShop();
  const { user } = useAuth();
  const token = localStorage.getItem("autofloy_token");
  const [loans, setLoans] = useState<Loan[]>([]);
  const [stats, setStats] = useState<LoanStats | null>(null);
  const [upcomingLoans, setUpcomingLoans] = useState<Loan[]>([]);
  const [overdueLoans, setOverdueLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loanPayments, setLoanPayments] = useState<Payment[]>([]);
  const [isEditing, setIsEditing] = useState(false);

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

  const fetchLoans = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedShop) params.append("shop_id", selectedShop.id);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(
        `${API_BASE}/functions/v1/shop-loans?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setLoans(data.loans || []);
      setStats(data.stats);
      setUpcomingLoans(data.upcoming || []);
      setOverdueLoans(data.overdue || []);
    } catch (error: any) {
      toast.error(error.message || "লোন লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  const fetchLoanDetails = async (loanId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/functions/v1/shop-loans/${loanId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSelectedLoan(data.loan);
      setLoanPayments(data.payments || []);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [token, selectedShop, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing
        ? `${API_BASE}/functions/v1/shop-loans/${selectedLoan?.id}`
        : `${API_BASE}/functions/v1/shop-loans`;

      const res = await fetch(url, {
        method,
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

      toast.success(isEditing ? "লোন আপডেট হয়েছে" : "নতুন লোন যোগ হয়েছে");
      setIsAddModalOpen(false);
      resetForm();
      fetchLoans();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedLoan) return;

    try {
      const res = await fetch(
        `${API_BASE}/functions/v1/shop-loans/${selectedLoan.id}/payments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: parseFloat(paymentData.amount),
            payment_date: paymentData.payment_date,
            payment_method: paymentData.payment_method,
            late_fee: parseFloat(paymentData.late_fee) || 0,
            notes: paymentData.notes,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(
        data.isCompleted ? "🎉 লোন সম্পূর্ণ পরিশোধ হয়েছে!" : "পেমেন্ট সফল হয়েছে"
      );
      setIsPaymentModalOpen(false);
      setPaymentData({
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "cash",
        late_fee: "",
        notes: "",
      });
      fetchLoans();
      if (isViewModalOpen && selectedLoan) {
        fetchLoanDetails(selectedLoan.id);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    if (!token || !selectedLoan) return;

    try {
      const res = await fetch(
        `${API_BASE}/functions/v1/shop-loans/${selectedLoan.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      toast.success("লোন ডিলিট হয়েছে");
      setIsDeleteDialogOpen(false);
      setSelectedLoan(null);
      fetchLoans();
    } catch (error: any) {
      toast.error(error.message);
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
        return <Badge className="bg-blue-500">সক্রিয়</Badge>;
      case "completed":
        return <Badge className="bg-green-500">সম্পন্ন</Badge>;
      case "defaulted":
        return <Badge variant="destructive">বাকি</Badge>;
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
                <p className="text-xs text-muted-foreground">মোট লোন</p>
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
                <p className="text-xs text-muted-foreground">পরিশোধ</p>
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
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">বাকি</p>
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
                <Receipt className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">মাসিক কিস্তি</p>
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
                  {overdueLoans.length}টি কিস্তি বাকি পড়েছে!
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
                  {upcomingLoans.length}টি কিস্তি আসছে ৭ দিনের মধ্যে
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
          <CardTitle className="text-lg">লোন তালিকা</CardTitle>
          <Dialog open={isAddModalOpen} onOpenChange={(open) => {
            setIsAddModalOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                নতুন লোন
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? "লোন এডিট করুন" : "নতুন লোন যোগ করুন"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>ঋণদাতার নাম *</Label>
                    <Input
                      value={formData.lender_name}
                      onChange={(e) =>
                        setFormData({ ...formData, lender_name: e.target.value })
                      }
                      placeholder="যেমন: BRAC, Grameen Bank"
                      required
                    />
                  </div>
                  <div>
                    <Label>ঋণদাতার ধরন</Label>
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
                        <SelectItem value="bank">ব্যাংক</SelectItem>
                        <SelectItem value="ngo">এনজিও</SelectItem>
                        <SelectItem value="personal">ব্যক্তিগত</SelectItem>
                        <SelectItem value="other">অন্যান্য</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>লোনের পরিমাণ (৳) *</Label>
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
                    <Label>সুদের হার (%)</Label>
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
                    <Label>মোট কিস্তি সংখ্যা *</Label>
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
                    <Label>প্রতি কিস্তি (৳)</Label>
                    <Input
                      type="number"
                      value={formData.installment_amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          installment_amount: e.target.value,
                        })
                      }
                      placeholder="অটো ক্যালকুলেট"
                    />
                  </div>
                  <div>
                    <Label>শুরুর তারিখ</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, start_date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>পেমেন্ট দিন (মাসের)</Label>
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
                            {i + 1} তারিখ
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>নোট</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="অতিরিক্ত তথ্য..."
                      rows={2}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  {isEditing ? "আপডেট করুন" : "লোন যোগ করুন"}
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
                placeholder="ঋণদাতার নাম খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="স্ট্যাটাস" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব</SelectItem>
                <SelectItem value="active">সক্রিয়</SelectItem>
                <SelectItem value="completed">সম্পন্ন</SelectItem>
                <SelectItem value="defaulted">বাকি</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loans Table */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">লোড হচ্ছে...</div>
          ) : filteredLoans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              কোন লোন নেই। নতুন লোন যোগ করুন।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ঋণদাতা</TableHead>
                    <TableHead className="text-right">লোন</TableHead>
                    <TableHead className="text-right">কিস্তি</TableHead>
                    <TableHead className="text-center">অগ্রগতি</TableHead>
                    <TableHead>পরের পেমেন্ট</TableHead>
                    <TableHead>স্ট্যাটাস</TableHead>
                    <TableHead className="text-right">অ্যাকশন</TableHead>
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
                                {loan.interest_rate}% সুদ
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="font-medium">
                            ৳{loan.loan_amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            বাকি: ৳{loan.remaining_amount.toLocaleString()}
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
                                {format(new Date(loan.next_payment_date), "d MMM", {
                                  locale: bn,
                                })}
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
                                    ? `${paymentInfo.days} দিন বাকি`
                                    : paymentInfo.days === 0
                                    ? "আজকে"
                                    : `${paymentInfo.days} দিন বাকি`}
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
            <DialogTitle>লোনের বিস্তারিত</DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="p-3 bg-primary/10 rounded-lg">
                  {getLenderIcon(selectedLoan.lender_type)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedLoan.lender_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedLoan.interest_rate}% সুদে {selectedLoan.total_installments} কিস্তি
                  </p>
                </div>
                {getStatusBadge(selectedLoan.status)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">মোট লোন</p>
                  <p className="font-semibold">
                    ৳{selectedLoan.loan_amount.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">বাকি আছে</p>
                  <p className="font-semibold text-orange-500">
                    ৳{selectedLoan.remaining_amount.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">পরিশোধ করেছেন</p>
                  <p className="font-semibold text-green-500">
                    ৳{selectedLoan.total_paid.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">প্রতি কিস্তি</p>
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
                  {selectedLoan.paid_installments}/{selectedLoan.total_installments} কিস্তি
                  সম্পন্ন
                </p>
              </div>

              {/* Payment History */}
              <div>
                <h4 className="font-medium mb-2">পেমেন্ট হিস্টোরি</h4>
                {loanPayments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    কোন পেমেন্ট নেই
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
                              কিস্তি #{payment.installment_number}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">
                            {format(new Date(payment.payment_date), "d MMM yyyy", {
                              locale: bn,
                            })}
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
                  কিস্তি পে করুন
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
            <DialogTitle>কিস্তি পেমেন্ট</DialogTitle>
          </DialogHeader>
          {selectedLoan && (
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{selectedLoan.lender_name}</p>
                <p className="text-sm text-muted-foreground">
                  কিস্তি #{selectedLoan.paid_installments + 1} of{" "}
                  {selectedLoan.total_installments}
                </p>
              </div>

              <div>
                <Label>পেমেন্ট পরিমাণ (৳) *</Label>
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
                <Label>পেমেন্ট তারিখ</Label>
                <Input
                  type="date"
                  value={paymentData.payment_date}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, payment_date: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>পেমেন্ট মাধ্যম</Label>
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
                    <SelectItem value="cash">নগদ</SelectItem>
                    <SelectItem value="bank">ব্যাংক</SelectItem>
                    <SelectItem value="bkash">বিকাশ</SelectItem>
                    <SelectItem value="nagad">নগদ মোবাইল</SelectItem>
                    <SelectItem value="other">অন্যান্য</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>লেট ফি (৳)</Label>
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
                <Label>নোট</Label>
                <Textarea
                  value={paymentData.notes}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, notes: e.target.value })
                  }
                  placeholder="অতিরিক্ত তথ্য..."
                  rows={2}
                />
              </div>

              <Button type="submit" className="w-full">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                পেমেন্ট সম্পন্ন করুন
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>লোন ডিলিট করবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedLoan?.lender_name} এর লোন এবং সব পেমেন্ট হিস্টোরি মুছে যাবে।
              এই কাজটি ফেরত নেওয়া যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ডিলিট করুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ShopLayout>
  );
};

export default ShopLoans;
