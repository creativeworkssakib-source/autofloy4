import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Search,
  Eye,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CreditCard,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchPaymentRequests,
  updatePaymentRequest,
  PaymentRequest,
} from "@/services/adminService";

const AdminPaymentRequests = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [adminNotes, setAdminNotes] = useState("");
  const [isLiveUpdating, setIsLiveUpdating] = useState(false);

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-payment-requests", page, debouncedSearch, statusFilter],
    queryFn: () => fetchPaymentRequests(page, 20, debouncedSearch, statusFilter),
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("payment-requests-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment_requests",
        },
        (payload) => {
          console.log("[Realtime] Payment request change:", payload.eventType);
          setIsLiveUpdating(true);
          queryClient.invalidateQueries({ queryKey: ["admin-payment-requests"] });
          
          // Show toast for new requests
          if (payload.eventType === "INSERT") {
            toast.info("New payment request received!", {
              description: `Plan: ${(payload.new as PaymentRequest).plan_name}`,
            });
          }
          
          setTimeout(() => setIsLiveUpdating(false), 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const updateMutation = useMutation({
    mutationFn: ({
      requestId,
      status,
      notes,
    }: {
      requestId: string;
      status: "approved" | "rejected";
      notes?: string;
    }) => updatePaymentRequest(requestId, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payment-requests"] });
      toast.success(
        actionType === "approve"
          ? "Payment approved successfully"
          : "Payment rejected"
      );
      setActionModalOpen(false);
      setSelectedRequest(null);
      setAdminNotes("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const openViewModal = (request: PaymentRequest) => {
    setSelectedRequest(request);
    setViewModalOpen(true);
  };

  const openActionModal = (request: PaymentRequest, type: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(type);
    setAdminNotes(request.admin_notes || "");
    setActionModalOpen(true);
  };

  const handleAction = () => {
    if (!selectedRequest) return;
    updateMutation.mutate({
      requestId: selectedRequest.id,
      status: actionType === "approve" ? "approved" : "rejected",
      notes: adminNotes,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      starter: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      professional: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      business: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      lifetime: "bg-primary/10 text-primary border-primary/20",
    };
    return <Badge className={colors[plan] || ""}>{plan}</Badge>;
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-destructive">Error loading payment requests: {(error as Error).message}</p>
        </div>
      </AdminLayout>
    );
  }

  const pendingCount = data?.requests.filter(r => r.status === "pending").length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Payment Requests</h2>
              {isLiveUpdating && (
                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
              )}
              <Badge variant="outline" className="animate-pulse">
                🔴 Live
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {data?.total || 0} total requests • {pendingCount} pending
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <select
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or transaction ID..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.requests.map((request) => (
                  <TableRow
                    key={request.id}
                    className={request.status === "pending" ? "bg-amber-500/5" : ""}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.user?.display_name || "Unnamed"}</div>
                        <div className="text-sm text-muted-foreground">{request.user?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getPlanBadge(request.plan_name)}</TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {request.currency === "BDT" ? "৳" : "$"}
                        {request.amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{request.payment_method}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {format(new Date(request.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewModal(request)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {request.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                              onClick={() => openActionModal(request, "approve")}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => openActionModal(request, "reject")}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {data?.requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No payment requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {data.page} of {data.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Request Details
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">User</Label>
                  <p className="font-medium">{selectedRequest.user?.display_name || "Unnamed"}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.user?.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Plan</Label>
                  <div className="mt-1">{getPlanBadge(selectedRequest.plan_name)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="font-semibold text-lg">
                    {selectedRequest.currency === "BDT" ? "৳" : "$"}
                    {selectedRequest.amount.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Payment Method</Label>
                  <p className="font-medium">{selectedRequest.payment_method}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Transaction ID</Label>
                  <p className="font-mono text-sm">{selectedRequest.transaction_id || "N/A"}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Submitted</Label>
                <p>{format(new Date(selectedRequest.created_at), "PPpp")}</p>
              </div>
              {selectedRequest.screenshot_url && (
                <div>
                  <Label className="text-muted-foreground">Payment Screenshot</Label>
                  <a
                    href={selectedRequest.screenshot_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline mt-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Screenshot
                  </a>
                </div>
              )}
              {selectedRequest.admin_notes && (
                <div>
                  <Label className="text-muted-foreground">Admin Notes</Label>
                  <p className="text-sm bg-muted p-3 rounded-lg mt-1">
                    {selectedRequest.admin_notes}
                  </p>
                </div>
              )}
              {selectedRequest.approved_at && (
                <div>
                  <Label className="text-muted-foreground">
                    {selectedRequest.status === "approved" ? "Approved" : "Rejected"} At
                  </Label>
                  <p>{format(new Date(selectedRequest.approved_at), "PPpp")}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedRequest?.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewModalOpen(false);
                    openActionModal(selectedRequest, "reject");
                  }}
                  className="text-destructive"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    setViewModalOpen(false);
                    openActionModal(selectedRequest, "approve");
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Modal */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Payment" : "Reject Payment"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "This will activate the user's subscription plan."
                : "This will reject the payment request."}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">User</span>
                  <span className="font-medium">{selectedRequest.user?.email}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-muted-foreground">Plan</span>
                  {getPlanBadge(selectedRequest.plan_name)}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">
                    {selectedRequest.currency === "BDT" ? "৳" : "$"}
                    {selectedRequest.amount.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-notes">Admin Notes (optional)</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes about this decision..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={updateMutation.isPending}
              className={
                actionType === "approve"
                  ? "bg-emerald-500 hover:bg-emerald-600"
                  : "bg-destructive hover:bg-destructive/90"
              }
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : actionType === "approve" ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              {actionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPaymentRequests;
