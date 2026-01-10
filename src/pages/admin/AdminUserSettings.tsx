import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Settings, Store, MessageSquare, KeyRound, Bell, Loader2, Save, RefreshCw, Bot } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { fetchAdminUsers, AdminUser } from "@/services/adminService";

const SUPABASE_URL = "https://xvwsqxfydvagfhfkwxdm.supabase.co";

function getAuthHeaders() {
  const token = localStorage.getItem("autofloy_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

interface ShopSettings {
  id?: string;
  user_id?: string;
  shop_name: string;
  shop_phone: string | null;
  shop_email: string | null;
  shop_address: string | null;
  currency: string | null;
  tax_rate: number | null;
  invoice_prefix: string | null;
  invoice_footer: string | null;
  terms_and_conditions: string | null;
  logo_url: string | null;
  sms_api_key: string | null;
  sms_sender_id: string | null;
  use_platform_sms: boolean | null;
  due_reminder_sms_template: string | null;
  trash_passcode_hash: string | null;
  enable_online_sync: boolean | null;
  data_retention_days: number | null;
}

interface UserSettings {
  id?: string;
  user_id?: string;
  default_tone: string | null;
  response_language: string | null;
  email_notifications: boolean | null;
  push_notifications: boolean | null;
  sound_alerts: boolean | null;
  daily_digest: boolean | null;
}

interface UserSettingsData {
  user: { id: string; display_name: string | null; email: string };
  shopSettings: ShopSettings | null;
  userSettings: UserSettings | null;
  notificationsCount: number;
}

async function fetchUserSettings(userId: string): Promise<UserSettingsData> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/${userId}/settings`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch user settings");
  }
  return response.json();
}

async function updateUserSettings(userId: string, data: { shopSettings?: Partial<ShopSettings>; userSettings?: Partial<UserSettings>; resetPasscode?: boolean }): Promise<{ success: boolean; shopSettings: ShopSettings; userSettings: UserSettings }> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin/${userId}/settings`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update user settings");
  }
  return response.json();
}

const VALID_TONES = ["friendly", "professional", "casual", "formal"];
const VALID_LANGUAGES = ["en", "bn", "auto"];

const AdminUserSettings = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [resetPasscodeOpen, setResetPasscodeOpen] = useState(false);
  const queryClient = useQueryClient();

  // Form state for editing
  const [editForm, setEditForm] = useState<Partial<ShopSettings>>({});
  const [userSettingsForm, setUserSettingsForm] = useState<Partial<UserSettings>>({});

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  };

  // Search users query
  const { data: usersData, isLoading: searchLoading } = useQuery({
    queryKey: ["admin-users-search", debouncedSearch],
    queryFn: () => fetchAdminUsers(1, 10, debouncedSearch),
    enabled: debouncedSearch.length >= 2,
  });

  // Fetch selected user's settings
  const { data: settingsData, isLoading: settingsLoading, refetch: refetchSettings } = useQuery({
    queryKey: ["admin-user-settings", selectedUser?.id],
    queryFn: () => fetchUserSettings(selectedUser!.id),
    enabled: !!selectedUser?.id,
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: (data: { shopSettings?: Partial<ShopSettings>; userSettings?: Partial<UserSettings>; resetPasscode?: boolean }) =>
      updateUserSettings(selectedUser!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-settings", selectedUser?.id] });
      toast.success("Settings updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Handle user selection
  const handleSelectUser = (user: AdminUser) => {
    setSelectedUser(user);
    setEditForm({});
    setUserSettingsForm({});
  };

  // Initialize form when settings load
  const initializeForm = () => {
    if (settingsData?.shopSettings) {
      setEditForm(settingsData.shopSettings);
    } else {
      setEditForm({
        shop_name: "",
        shop_phone: "",
        shop_email: "",
        shop_address: "",
        currency: "BDT",
        tax_rate: 0,
        invoice_prefix: "INV-",
        sms_api_key: "",
        sms_sender_id: "",
        use_platform_sms: false,
        due_reminder_sms_template: "",
        enable_online_sync: false,
        data_retention_days: 30,
      });
    }
    
    if (settingsData?.userSettings) {
      setUserSettingsForm(settingsData.userSettings);
    } else {
      setUserSettingsForm({
        default_tone: "friendly",
        response_language: "auto",
      });
    }
  };

  // Reset form to original values
  const handleReset = () => {
    initializeForm();
  };

  // Save settings
  const handleSave = () => {
    updateMutation.mutate({ shopSettings: editForm, userSettings: userSettingsForm });
  };

  // Reset passcode
  const handleResetPasscode = () => {
    updateMutation.mutate({ resetPasscode: true });
    setResetPasscodeOpen(false);
  };

  const hasPasscode = settingsData?.shopSettings?.trash_passcode_hash;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            User Settings Management
          </h2>
          <p className="text-muted-foreground">
            View and modify shop settings, SMS settings, and passcode for any user
          </p>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Find User</CardTitle>
            <CardDescription>Search by email or name to manage their settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            {searchLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            )}

            {usersData && usersData.users.length > 0 && (
              <div className="mt-4 space-y-2">
                {usersData.users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-muted/50 ${
                      selectedUser?.id === user.id ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-medium">{user.display_name || "Unnamed"}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                    <Badge variant="outline">{user.subscription_plan}</Badge>
                  </button>
                ))}
              </div>
            )}

            {debouncedSearch.length >= 2 && usersData?.users.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No users found</p>
            )}
          </CardContent>
        </Card>

        {/* Selected User Settings */}
        {selectedUser && (
          <div className="space-y-6">
            {/* User Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedUser.display_name || "Unnamed User"}</h3>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetchSettings()}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={initializeForm}>
                      Load Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {settingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Shop Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="w-5 h-5" />
                      Shop Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="shop_name">Shop Name</Label>
                      <Input
                        id="shop_name"
                        value={editForm.shop_name || ""}
                        onChange={(e) => setEditForm({ ...editForm, shop_name: e.target.value })}
                        placeholder="My Shop"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="shop_phone">Phone</Label>
                        <Input
                          id="shop_phone"
                          value={editForm.shop_phone || ""}
                          onChange={(e) => setEditForm({ ...editForm, shop_phone: e.target.value })}
                          placeholder="+880..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Input
                          id="currency"
                          value={editForm.currency || ""}
                          onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                          placeholder="BDT"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shop_email">Email</Label>
                      <Input
                        id="shop_email"
                        type="email"
                        value={editForm.shop_email || ""}
                        onChange={(e) => setEditForm({ ...editForm, shop_email: e.target.value })}
                        placeholder="shop@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shop_address">Address</Label>
                      <Textarea
                        id="shop_address"
                        value={editForm.shop_address || ""}
                        onChange={(e) => setEditForm({ ...editForm, shop_address: e.target.value })}
                        placeholder="Shop address..."
                        rows={2}
                      />
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="invoice_prefix">Invoice Prefix</Label>
                        <Input
                          id="invoice_prefix"
                          value={editForm.invoice_prefix || ""}
                          onChange={(e) => setEditForm({ ...editForm, invoice_prefix: e.target.value })}
                          placeholder="INV-"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                        <Input
                          id="tax_rate"
                          type="number"
                          value={editForm.tax_rate || 0}
                          onChange={(e) => setEditForm({ ...editForm, tax_rate: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enable_online_sync">Enable Online Sync</Label>
                        <p className="text-xs text-muted-foreground">Sync data with online platform</p>
                      </div>
                      <Switch
                        id="enable_online_sync"
                        checked={editForm.enable_online_sync || false}
                        onCheckedChange={(checked) => setEditForm({ ...editForm, enable_online_sync: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* SMS Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      SMS Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="use_platform_sms">Use Platform SMS</Label>
                        <p className="text-xs text-muted-foreground">Use the platform's SMS service</p>
                      </div>
                      <Switch
                        id="use_platform_sms"
                        checked={editForm.use_platform_sms || false}
                        onCheckedChange={(checked) => setEditForm({ ...editForm, use_platform_sms: checked })}
                      />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="sms_api_key">SMS API Key</Label>
                      <Input
                        id="sms_api_key"
                        type="password"
                        value={editForm.sms_api_key || ""}
                        onChange={(e) => setEditForm({ ...editForm, sms_api_key: e.target.value })}
                        placeholder="Enter API key..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sms_sender_id">SMS Sender ID</Label>
                      <Input
                        id="sms_sender_id"
                        value={editForm.sms_sender_id || ""}
                        onChange={(e) => setEditForm({ ...editForm, sms_sender_id: e.target.value })}
                        placeholder="MYSHOP"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="due_reminder_sms_template">Due Reminder SMS Template</Label>
                      <Textarea
                        id="due_reminder_sms_template"
                        value={editForm.due_reminder_sms_template || ""}
                        onChange={(e) => setEditForm({ ...editForm, due_reminder_sms_template: e.target.value })}
                        placeholder="Dear {customer_name}, you have a due amount of {due_amount}..."
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        Variables: {"{customer_name}"}, {"{due_amount}"}, {"{shop_name}"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Passcode & Notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <KeyRound className="w-5 h-5" />
                      Trash Passcode
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">Passcode Status</p>
                        <p className="text-sm text-muted-foreground">
                          {hasPasscode ? "Passcode is set" : "No passcode set"}
                        </p>
                      </div>
                      <Badge variant={hasPasscode ? "default" : "secondary"}>
                        {hasPasscode ? "Active" : "Not Set"}
                      </Badge>
                    </div>
                    {hasPasscode && (
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => setResetPasscodeOpen(true)}
                      >
                        <KeyRound className="w-4 h-4 mr-2" />
                        Reset Passcode
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground text-center">
                      Resetting the passcode will allow the user to set a new one
                    </p>
                  </CardContent>
                </Card>

                {/* Notifications Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Notifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">Total Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Notifications sent to this user
                        </p>
                      </div>
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {settingsData?.notificationsCount || 0}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="data_retention_days">Data Retention (Days)</Label>
                      <Input
                        id="data_retention_days"
                        type="number"
                        value={editForm.data_retention_days || 30}
                        onChange={(e) => setEditForm({ ...editForm, data_retention_days: parseInt(e.target.value) || 30 })}
                        min={1}
                        max={365}
                      />
                      <p className="text-xs text-muted-foreground">
                        How long to keep deleted items in trash
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="w-5 h-5" />
                      AI Settings
                    </CardTitle>
                    <CardDescription>
                      Configure AI automation tone and language for this user
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="default_tone">Default Tone</Label>
                      <Select
                        value={userSettingsForm.default_tone || "friendly"}
                        onValueChange={(value) => setUserSettingsForm({ ...userSettingsForm, default_tone: value })}
                      >
                        <SelectTrigger id="default_tone">
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="formal">Formal</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        How the AI will respond to customers
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="response_language">Response Language</Label>
                      <Select
                        value={userSettingsForm.response_language || "auto"}
                        onValueChange={(value) => setUserSettingsForm({ ...userSettingsForm, response_language: value })}
                      >
                        <SelectTrigger id="response_language">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto Detect</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="bn">Bangla</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Language AI will use to reply
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-sm text-primary">
                        These settings will be synced to n8n webhook when saved
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Action Buttons */}
            {!settingsLoading && Object.keys(editForm).length > 0 && (
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleReset}>
                  Reset Changes
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Settings
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Initial State */}
        {!selectedUser && !debouncedSearch && (
          <Card>
            <CardContent className="py-12 text-center">
              <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a User</h3>
              <p className="text-muted-foreground">
                Search for a user above to view and manage their settings
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reset Passcode Confirmation */}
      {resetPasscodeOpen && (
        <AlertDialog open={resetPasscodeOpen} onOpenChange={setResetPasscodeOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Trash Passcode?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear the user's current trash passcode. They will need to set a new one when accessing the trash section.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetPasscode}>
                Reset Passcode
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AdminLayout>
  );
};

export default AdminUserSettings;