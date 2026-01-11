import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CreditCard,
  Clock,
  Check,
  X,
  Receipt,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ShopLayout from "@/components/offline-shop/ShopLayout";
import { fetchUserPaymentHistory, type UserPaymentHistory } from "@/services/paymentService";

const statusConfig = {
  pending: { 
    label: "Pending", 
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    icon: Clock,
    description: "Waiting for verification"
  },
  approved: { 
    label: "Approved", 
    color: "bg-green-500/10 text-green-600 border-green-200",
    icon: Check,
    description: "Payment verified and plan activated"
  },
  rejected: { 
    label: "Rejected", 
    color: "bg-red-500/10 text-red-600 border-red-200",
    icon: X,
    description: "Payment was not verified"
  },
};

const PaymentHistory = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["user-payment-history"],
    queryFn: fetchUserPaymentHistory,
  });

  if (error) {
    return (
      <ShopLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">Failed to load payment history</p>
          </div>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Receipt className="w-6 h-6" />
              Payment History
            </h1>
            <p className="text-muted-foreground">View all your payment requests and their status</p>
          </div>
          <Button asChild>
            <Link to="/upgrade">
              <CreditCard className="w-4 h-4 mr-2" />
              Upgrade Plan
            </Link>
          </Button>
        </div>

        {/* Payment List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Payments</CardTitle>
            <CardDescription>
              {data?.payments?.length || 0} payment request(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : !data?.payments?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No payment history yet</p>
                <Button asChild className="mt-4">
                  <Link to="/upgrade">Make Your First Payment</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {data.payments.map((payment) => {
                  const status = statusConfig[payment.status as keyof typeof statusConfig];
                  const StatusIcon = status?.icon || Clock;
                  
                  return (
                    <div
                      key={payment.id}
                      className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${status?.color || "bg-muted"}`}>
                            <StatusIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">{payment.plan_name} Plan</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(payment.created_at), "dd MMM yyyy, hh:mm a")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">৳{payment.amount.toLocaleString()}</p>
                          <Badge className={status?.color}>
                            {status?.label || payment.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Payment Method</p>
                          <p className="font-medium capitalize">{payment.payment_method}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Transaction ID</p>
                          <p className="font-mono">{payment.transaction_id || "-"}</p>
                        </div>
                        {payment.approved_at && (
                          <div>
                            <p className="text-muted-foreground">Approved On</p>
                            <p>{format(new Date(payment.approved_at), "dd MMM yyyy")}</p>
                          </div>
                        )}
                      </div>

                      {payment.admin_notes && payment.status === "rejected" && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="text-sm text-red-800 dark:text-red-200">
                            <strong>Reason:</strong> {payment.admin_notes}
                          </p>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        {status?.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back Link */}
        <div className="flex justify-center">
          <Button variant="ghost" asChild>
            <Link to="/offline-shop">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </ShopLayout>
  );
};

export default PaymentHistory;
