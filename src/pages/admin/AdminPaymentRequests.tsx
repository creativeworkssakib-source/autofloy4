import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  CreditCard, 
  Check, 
  X, 
  Clock, 
  Eye,
  Search,
  Filter,
  Download,
  AlertCircle,
  ExternalLink,
  User,
  Phone,
  Mail,
  Receipt,
  Image as ImageIcon
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  fetchPaymentRequests, 
  approvePaymentRequest, 
  rejectPaymentRequest,
  type PaymentRequest 
} from "@/services/adminService";

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200" },
  approved: { label: "Approved", color: "bg-green-500/10 text-green-600 border-green-200" },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-600 border-red-200" },
};

const AdminPaymentRequests = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-payment-requests", statusFilter],
    queryFn: () => fetchPaymentRequests(statusFilter === "all" ? undefined : statusFilter),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approvePaymentRequest(id),
    onSuccess: () => {
      toast.success("Payment approved successfully! User's plan has been activated.");
      queryClient.invalidateQueries({ queryKey: ["admin-payment-requests"] });
      setShowApproveDialog(false);
      setSelectedRequest(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to approve payment");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => rejectPaymentRequest(id, notes),
    onSuccess: () => {
      toast.success("Payment request rejected.");
      queryClient.invalidateQueries({ queryKey: ["admin-payment-requests"] });
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectNotes("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reject payment");
    },
  });

  const filteredRequests = data?.requests?.filter((req) =>
    req.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.plan_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const pendingCount = data?.requests?.filter((r) => r.status === "pending").length || 0;
  const approvedCount = data?.requests?.filter((r) => r.status === "approved").length || 0;
  const rejectedCount = data?.requests?.filter((r) => r.status === "rejected").length || 0;

  const handleApprove = (request: PaymentRequest) => {
    setSelectedRequest(request);
    setShowApproveDialog(true);
  };

  const handleReject = (request: PaymentRequest) => {
    setSelectedRequest(request);
    setShowRejectDialog(true);
  };

  const handleViewDetails = (request: PaymentRequest) => {
    setSelectedRequest(request);
    setShowDetailDialog(true);
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">Failed to load payment requests</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Payment Requests</h1>
            <p className="text-muted-foreground">Manage and approve user payment requests</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">{approvedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <X className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold">{rejectedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, transaction ID, plan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Requests
            </CardTitle>
            <CardDescription>
              {filteredRequests.length} request(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No payment requests found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{request.user_name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{request.user_email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{request.plan_name}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          ৳{request.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{request.payment_method}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {request.transaction_id || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[request.status as keyof typeof statusConfig]?.color}>
                            {statusConfig[request.status as keyof typeof statusConfig]?.label || request.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(request.created_at), "dd MMM yyyy, hh:mm a")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(request)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {request.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-100"
                                  onClick={() => handleApprove(request)}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-100"
                                  onClick={() => handleReject(request)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">User</Label>
                  <p className="font-medium">{selectedRequest.user_name || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.user_email}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Plan</Label>
                  <p className="font-medium">{selectedRequest.plan_name}</p>
                  <p className="text-sm text-muted-foreground">৳{selectedRequest.amount.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Payment Method</Label>
                  <p className="font-medium">{selectedRequest.payment_method}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Transaction ID</Label>
                  <p className="font-mono text-sm">{selectedRequest.transaction_id || "-"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <Badge className={statusConfig[selectedRequest.status as keyof typeof statusConfig]?.color}>
                    {statusConfig[selectedRequest.status as keyof typeof statusConfig]?.label}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Submitted</Label>
                  <p className="text-sm">{format(new Date(selectedRequest.created_at), "PPpp")}</p>
                </div>
              </div>
              
              {selectedRequest.screenshot_url && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Payment Screenshot</Label>
                  <a 
                    href={selectedRequest.screenshot_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">View Screenshot</span>
                    <ExternalLink className="w-4 h-4 ml-auto" />
                  </a>
                </div>
              )}

              {selectedRequest.admin_notes && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Admin Notes</Label>
                  <p className="text-sm p-3 bg-muted rounded-lg">{selectedRequest.admin_notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedRequest?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowDetailDialog(false);
                    handleReject(selectedRequest);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setShowDetailDialog(false);
                    handleApprove(selectedRequest);
                  }}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this payment? The user's plan will be activated immediately.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User:</span>
                <span className="font-medium">{selectedRequest.user_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-medium">{selectedRequest.plan_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">৳{selectedRequest.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID:</span>
                <span className="font-mono">{selectedRequest.transaction_id || "-"}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => selectedRequest && approveMutation.mutate(selectedRequest.id)}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? "Approving..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this payment request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="e.g., Transaction ID not found, Invalid screenshot, Amount mismatch..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRequest && rejectMutation.mutate({ id: selectedRequest.id, notes: rejectNotes })}
              disabled={rejectMutation.isPending || !rejectNotes.trim()}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPaymentRequests;
