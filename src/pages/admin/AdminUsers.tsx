import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  Search,
  Eye,
  Shield,
  ShieldOff,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Pencil,
  Trash2,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  fetchAdminUsers,
  updateUserRole,
  updateUserStatus,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  AdminUser,
  CreateUserData,
  UpdateUserData,
} from "@/services/adminService";

const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const queryClient = useQueryClient();

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateUserData & { subscription_type?: 'online' | 'offline' | 'both' }>({
    email: "",
    password: "",
    display_name: "",
    role: "user",
    subscription_plan: "trial",
    status: "active",
    subscription_type: "online",
  });
  const [editForm, setEditForm] = useState<UpdateUserData & { email?: string }>({});
  const [newPassword, setNewPassword] = useState("");

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users", page, debouncedSearch],
    queryFn: () => fetchAdminUsers(page, 20, debouncedSearch),
  });

  const rolesMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "admin" | "user" }) =>
      updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: "active" | "suspended" }) =>
      updateUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Status updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateUserData) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User created successfully");
      setCreateModalOpen(false);
      setCreateForm({
        email: "",
        password: "",
        display_name: "",
        role: "user",
        subscription_plan: "trial",
        status: "active",
        subscription_type: "online",
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserData }) =>
      updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User updated successfully");
      setEditModalOpen(false);
      setSelectedUser(null);
      setNewPassword("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update user");
    },
  });

  const passwordResetMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      resetUserPassword(userId, password),
    onSuccess: () => {
      toast.success("Password reset successfully");
      setNewPassword("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reset password");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const openEditModal = (user: AdminUser) => {
    setSelectedUser(user);
    setEditForm({
      display_name: user.display_name || "",
      email: user.email,
      subscription_plan: user.subscription_plan,
      subscription_type: user.subscription_type || "online",
      status: user.status as "active" | "suspended",
      trial_end_date: user.trial_end_date,
      is_trial_active: user.is_trial_active,
    });
    setNewPassword("");
    setEditModalOpen(true);
  };

  const openDeleteDialog = (user: AdminUser) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Active</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Admin</Badge>;
      default:
        return <Badge variant="outline">User</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      none: "bg-gray-500/10 text-gray-500 border-gray-500/20",
      trial: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      starter: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      professional: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      business: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      lifetime: "bg-primary/10 text-primary border-primary/20",
    };
    return <Badge className={colors[plan] || ""}>{plan}</Badge>;
  };

  const getAccessBadge = (accessType?: string) => {
    const colors: Record<string, string> = {
      online: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      offline: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      both: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    };
    const labels: Record<string, string> = {
      online: "Online",
      offline: "Offline",
      both: "Both",
    };
    const type = accessType || "online";
    return <Badge className={colors[type] || colors.online}>{labels[type] || "Online"}</Badge>;
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-destructive">Error loading users: {(error as Error).message}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">User Management</h2>
            <p className="text-muted-foreground">
              {data?.total || 0} total users
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Users Table */}
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
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.users.map((user: AdminUser) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.display_name || "Unnamed"}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>{getPlanBadge(user.subscription_plan)}</TableCell>
                    <TableCell>{getAccessBadge(user.subscription_type)}</TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/users/${user.id}`} className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openEditModal(user)}
                            className="flex items-center gap-2"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.role === "admin" ? (
                            <DropdownMenuItem
                              onClick={() => rolesMutation.mutate({ userId: user.id, role: "user" })}
                              className="flex items-center gap-2"
                            >
                              <ShieldOff className="w-4 h-4" />
                              Remove Admin
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => rolesMutation.mutate({ userId: user.id, role: "admin" })}
                              className="flex items-center gap-2"
                            >
                              <Shield className="w-4 h-4" />
                              Make Admin
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {user.status === "active" ? (
                            <DropdownMenuItem
                              onClick={() => statusMutation.mutate({ userId: user.id, status: "suspended" })}
                              className="flex items-center gap-2 text-amber-500"
                            >
                              <UserX className="w-4 h-4" />
                              Suspend User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => statusMutation.mutate({ userId: user.id, status: "active" })}
                              className="flex items-center gap-2 text-emerald-500"
                            >
                              <UserCheck className="w-4 h-4" />
                              Activate User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(user)}
                            className="flex items-center gap-2 text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {data?.users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found
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

      {/* Create User Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Add a new user to the platform.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-email">Email *</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Password *</Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-name">Display Name</Label>
              <Input
                id="create-name"
                value={createForm.display_name}
                onChange={(e) => setCreateForm({ ...createForm, display_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(v) => setCreateForm({ ...createForm, role: v as "admin" | "user" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={createForm.status}
                  onValueChange={(v) => setCreateForm({ ...createForm, status: v as "active" | "suspended" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subscription Plan</Label>
                <Select
                  value={createForm.subscription_plan}
                  onValueChange={(v) => setCreateForm({ ...createForm, subscription_plan: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="lifetime">Lifetime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Access Type</Label>
                <Select
                  value={createForm.subscription_type || "online"}
                  onValueChange={(v) => setCreateForm({ ...createForm, subscription_type: v as 'online' | 'offline' | 'both' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online (Facebook/WhatsApp)</SelectItem>
                    <SelectItem value="offline">Offline (POS/Shop)</SelectItem>
                    <SelectItem value="both">Both (Full Access)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(createForm)}
              disabled={!createForm.email || !createForm.password || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Account Info Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Account Information</h4>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Display Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.display_name || ""}
                  onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Status & Plan Section */}
            <div className="space-y-4 pt-2 border-t border-border">
              <h4 className="text-sm font-medium text-muted-foreground pt-2">Status & Subscription</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(v) => setEditForm({ ...editForm, status: v as "active" | "suspended" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Trial Active</Label>
                  <Select
                    value={editForm.is_trial_active ? "true" : "false"}
                    onValueChange={(v) => setEditForm({ ...editForm, is_trial_active: v === "true" })}
                    disabled={editForm.subscription_plan !== "trial"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Subscription Plan</Label>
                <Select
                  value={editForm.subscription_plan}
                  onValueChange={(v) => {
                    // Auto-set trial fields based on plan
                    if (v === "trial") {
                      const defaultTrialEnd = new Date();
                      defaultTrialEnd.setDate(defaultTrialEnd.getDate() + 7);
                      setEditForm({ 
                        ...editForm, 
                        subscription_plan: v,
                        is_trial_active: true,
                        trial_end_date: editForm.trial_end_date || defaultTrialEnd.toISOString()
                      });
                    } else {
                      setEditForm({ 
                        ...editForm, 
                        subscription_plan: v,
                        is_trial_active: false,
                        trial_end_date: null
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="lifetime">Lifetime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-trial-end">Trial End Date {editForm.subscription_plan === "trial" && <span className="text-destructive">*</span>}</Label>
                <Input
                  id="edit-trial-end"
                  type="date"
                  value={editForm.trial_end_date ? editForm.trial_end_date.split("T")[0] : ""}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      trial_end_date: e.target.value ? new Date(e.target.value).toISOString() : null,
                    })
                  }
                  disabled={editForm.subscription_plan !== "trial"}
                />
                {editForm.subscription_plan !== "trial" && (
                  <p className="text-xs text-muted-foreground">Only available for trial plan</p>
                )}
              </div>
            </div>

            {/* Access Control Section */}
            <div className="space-y-4 pt-2 border-t border-border">
              <h4 className="text-sm font-medium text-muted-foreground pt-2">Access Control</h4>
              <div className="space-y-2">
                <Label>Feature Access</Label>
                <Select
                  value={editForm.subscription_type || "online"}
                  onValueChange={(v) => setEditForm({ ...editForm, subscription_type: v as 'online' | 'offline' | 'both' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online (Facebook/WhatsApp Automation)</SelectItem>
                    <SelectItem value="offline">Offline (POS/Shop Management)</SelectItem>
                    <SelectItem value="both">Both (Full Access)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Controls which features the user can access based on their subscription type.
                </p>
              </div>
            </div>

            {/* Password Reset Section */}
            <div className="space-y-4 pt-2 border-t border-border">
              <h4 className="text-sm font-medium text-muted-foreground pt-2">Reset Password</h4>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Enter new password (min 8 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedUser && newPassword.length >= 8) {
                      passwordResetMutation.mutate({ userId: selectedUser.id, password: newPassword });
                    } else if (newPassword.length < 8) {
                      toast.error("Password must be at least 8 characters");
                    }
                  }}
                  disabled={passwordResetMutation.isPending || newPassword.length < 8}
                >
                  {passwordResetMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Reset"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This will immediately change the user's password.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedUser) return;
                
                // Validate trial plan requires trial_end_date
                if (editForm.subscription_plan === "trial" && !editForm.trial_end_date) {
                  toast.error("Trial plan requires a trial end date");
                  return;
                }
                
                // Build update data with only changed fields
                const updateData: UpdateUserData = {
                  display_name: editForm.display_name,
                  status: editForm.status,
                  subscription_plan: editForm.subscription_plan,
                  subscription_type: editForm.subscription_type,
                  is_trial_active: editForm.is_trial_active,
                  trial_end_date: editForm.trial_end_date,
                };
                
                // Only include email if changed
                if (editForm.email && editForm.email !== selectedUser.email) {
                  updateData.email = editForm.email;
                }
                
                updateMutation.mutate({ userId: selectedUser.id, data: updateData });
              }}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUser?.email}? This action cannot be undone.
              All user data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && deleteMutation.mutate(selectedUser.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminUsers;
