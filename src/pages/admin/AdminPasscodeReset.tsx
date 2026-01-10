import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, KeyRound, Loader2, User, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { searchUserPasscode, resetTrashPasscode, UserPasscodeInfo } from "@/services/adminService";

const AdminPasscodeReset = () => {
  const [searchEmail, setSearchEmail] = useState("");
  const [users, setUsers] = useState<UserPasscodeInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserPasscodeInfo | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      toast.error("Please enter an email to search");
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchUserPasscode(searchEmail.trim());
      setUsers(result.users);
      if (result.users.length === 0) {
        toast.info("No users found with this email");
      }
    } catch (error: any) {
      toast.error(error.message || "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const resetMutation = useMutation({
    mutationFn: (email: string) => resetTrashPasscode(email),
    onSuccess: (data) => {
      toast.success(data.message || "Passcode reset successfully");
      setShowResetDialog(false);
      setSelectedUser(null);
      // Update the list
      setUsers(prev => prev.map(u => 
        u.email === data.user?.email ? { ...u, has_trash_passcode: false } : u
      ));
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleResetClick = (user: UserPasscodeInfo) => {
    setSelectedUser(user);
    setShowResetDialog(true);
  };

  const handleConfirmReset = () => {
    if (selectedUser) {
      resetMutation.mutate(selectedUser.email);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Trash Passcode Reset</h2>
          <p className="text-muted-foreground">
            Search for users and reset their trash bin passcode if they forgot it.
          </p>
        </div>

        {/* Search Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search User
            </CardTitle>
            <CardDescription>
              Enter the user's email address to find their account and reset their passcode.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  placeholder="Enter user email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {users.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>
                Found {users.length} user(s) matching your search.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{user.display_name || "Unnamed User"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {user.has_trash_passcode ? (
                        <>
                          <Badge variant="outline" className="gap-1 text-amber-600 border-amber-600">
                            <KeyRound className="h-3 w-3" />
                            Passcode Set
                          </Badge>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleResetClick(user)}
                            disabled={resetMutation.isPending}
                          >
                            {resetMutation.isPending && selectedUser?.id === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Reset Passcode
                          </Button>
                        </>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          No Passcode
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Users can set a passcode in their Trash Bin settings for instant deletion.</li>
              <li>Once set, the passcode cannot be changed by the user themselves.</li>
              <li>If a user forgets their passcode, they must contact admin to reset it.</li>
              <li>Resetting the passcode allows the user to set a new one.</li>
              <li>This is a security feature to prevent accidental data loss.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Trash Passcode?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the trash bin passcode for:
              <br />
              <strong className="text-foreground">
                {selectedUser?.display_name || "Unnamed User"} ({selectedUser?.email})
              </strong>
              <br /><br />
              The user will be able to set a new passcode. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Reset Passcode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminPasscodeReset;
