import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Shield,
  ShieldOff,
  UserX,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  Package,
  Bot,
  MessageSquare,
  Facebook,
  CreditCard,
  Loader2,
  CheckCircle,
  XCircle,
  Unlock,
  Link2,
  Globe,
  Store,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { fetchUserDetails, updateUserRole, updateUserStatus, unlockUser, updateUserSyncPermission, updateUser } from "@/services/adminService";

const AdminUserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: () => fetchUserDetails(id!),
    enabled: !!id,
  });

  const rolesMutation = useMutation({
    mutationFn: ({ role }: { role: "admin" | "user" }) =>
      updateUserRole(id!, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ status }: { status: "active" | "suspended" }) =>
      updateUserStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Status updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const unlockMutation = useMutation({
    mutationFn: () => unlockUser(id!),
    onSuccess: () => {
      toast.success("User unlocked successfully - rate limits cleared");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const syncPermissionMutation = useMutation({
    mutationFn: ({ canSync }: { canSync: boolean }) =>
      updateUserSyncPermission(id!, canSync),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", id] });
      toast.success("Sync permission updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const subscriptionTypeMutation = useMutation({
    mutationFn: ({ subscriptionType }: { subscriptionType: 'online' | 'offline' | 'both' }) =>
      updateUser(id!, { subscription_type: subscriptionType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Subscription type updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-destructive">Error loading user: {(error as Error)?.message || "User not found"}</p>
          <Link to="/admin/users" className="text-primary hover:underline mt-4 inline-block">
            Back to Users
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const { user, connectedAccounts, stats, subscription } = data;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{user.display_name || "Unnamed User"}</h2>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => unlockMutation.mutate()}
              disabled={unlockMutation.isPending}
            >
              {unlockMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Unlock className="w-4 h-4 mr-2" />
              )}
              Unlock Account
            </Button>
            {user.role === "admin" ? (
              <Button
                variant="outline"
                onClick={() => rolesMutation.mutate({ role: "user" })}
                disabled={rolesMutation.isPending}
              >
                <ShieldOff className="w-4 h-4 mr-2" />
                Remove Admin
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => rolesMutation.mutate({ role: "admin" })}
                disabled={rolesMutation.isPending}
              >
                <Shield className="w-4 h-4 mr-2" />
                Make Admin
              </Button>
            )}
            {user.status === "active" ? (
              <Button
                variant="destructive"
                onClick={() => statusMutation.mutate({ status: "suspended" })}
                disabled={statusMutation.isPending}
              >
                <UserX className="w-4 h-4 mr-2" />
                Suspend
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={() => statusMutation.mutate({ status: "active" })}
                disabled={statusMutation.isPending}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Activate
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {user.email_verified ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          <span className="text-xs text-emerald-500">Verified</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-destructive" />
                          <span className="text-xs text-destructive">Not verified</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{user.phone || "Not provided"}</p>
                    {user.phone && (
                      <div className="flex items-center gap-1 mt-1">
                        {user.phone_verified ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            <span className="text-xs text-emerald-500">Verified</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-destructive" />
                            <span className="text-xs text-destructive">Not verified</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-medium">
                      {format(new Date(user.created_at), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Role & Status</p>
                    <div className="flex gap-2 mt-1">
                      <Badge className={user.role === "admin" ? "bg-primary/10 text-primary" : ""}>
                        {user.role}
                      </Badge>
                      <Badge
                        className={
                          user.status === "active"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-destructive/10 text-destructive"
                        }
                      >
                        {user.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Orders</span>
                </div>
                <span className="font-bold">{stats.ordersCount}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Automations</span>
                </div>
                <span className="font-bold">{stats.automationsCount}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Messages Handled</span>
                </div>
                <span className="font-bold">{stats.messagesHandled}</span>
              </div>
            </CardContent>
          </Card>

          {/* Business Sync Permission */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Business Sync
              </CardTitle>
              <CardDescription>
                Allow user to sync offline and online business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Sync Feature</p>
                  <p className="text-sm text-muted-foreground">
                    User can connect and sync offline shop with online business
                  </p>
                </div>
                <Switch
                  checked={user.can_sync_business || false}
                  onCheckedChange={(checked) => 
                    syncPermissionMutation.mutate({ canSync: checked })
                  }
                  disabled={syncPermissionMutation.isPending}
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge className={user.can_sync_business ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}>
                  {user.can_sync_business ? "Sync Enabled" : "Sync Disabled"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <Badge className="mt-1 text-sm">{user.subscription_plan}</Badge>
              </div>
              {user.is_trial_active && user.trial_end_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Trial Ends</p>
                  <p className="font-medium text-amber-500">
                    {format(new Date(user.trial_end_date), "MMMM d, yyyy")}
                  </p>
                </div>
              )}
              {subscription && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Subscription Status</p>
                    <Badge
                      className={
                        subscription.status === "active"
                          ? "bg-success/10 text-success mt-1"
                          : "mt-1"
                      }
                    >
                      {subscription.status}
                    </Badge>
                  </div>
                  {subscription.amount && (
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-bold">৳{subscription.amount}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Subscription Type / Access Control */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Access Control
              </CardTitle>
              <CardDescription>
                Control which features this user can access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Subscription Type</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={(user as any).subscription_type === 'online' ? 'default' : 'outline'}
                    size="sm"
                    className="gap-1"
                    onClick={() => subscriptionTypeMutation.mutate({ subscriptionType: 'online' })}
                    disabled={subscriptionTypeMutation.isPending}
                  >
                    <Globe className="w-3 h-3" />
                    Online
                  </Button>
                  <Button
                    variant={(user as any).subscription_type === 'offline' ? 'default' : 'outline'}
                    size="sm"
                    className="gap-1"
                    onClick={() => subscriptionTypeMutation.mutate({ subscriptionType: 'offline' })}
                    disabled={subscriptionTypeMutation.isPending}
                  >
                    <Store className="w-3 h-3" />
                    Offline
                  </Button>
                  <Button
                    variant={(user as any).subscription_type === 'both' ? 'default' : 'outline'}
                    size="sm"
                    className="gap-1"
                    onClick={() => subscriptionTypeMutation.mutate({ subscriptionType: 'both' })}
                    disabled={subscriptionTypeMutation.isPending}
                  >
                    <Layers className="w-3 h-3" />
                    Both
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-xs">
                <p className="font-medium">Access Summary:</p>
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3" />
                  <span className={(user as any).subscription_type === 'online' || (user as any).subscription_type === 'both' ? 'text-success' : 'text-muted-foreground line-through'}>
                    Facebook/WhatsApp Automation
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Store className="w-3 h-3" />
                  <span className={(user as any).subscription_type === 'offline' || (user as any).subscription_type === 'both' ? 'text-success' : 'text-muted-foreground line-through'}>
                    Offline Shop POS
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connected Accounts */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Facebook className="w-5 h-5" />
                Connected Accounts
              </CardTitle>
              <CardDescription>
                Facebook pages connected to this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connectedAccounts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No connected accounts
                </p>
              ) : (
                <div className="space-y-3">
                  {connectedAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center">
                          <Facebook className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{account.name || "Unnamed Page"}</p>
                          <p className="text-xs text-muted-foreground">
                            ID: {account.external_id}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={
                          account.is_connected
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-destructive/10 text-destructive"
                        }
                      >
                        {account.is_connected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUserDetail;
