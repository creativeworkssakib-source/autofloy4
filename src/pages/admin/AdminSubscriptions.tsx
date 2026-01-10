import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Users,
  TrendingUp,
  Clock,
  CreditCard,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminLayout from "@/components/admin/AdminLayout";
import { fetchSubscriptionStats } from "@/services/adminService";

const planColors: Record<string, string> = {
  none: "bg-muted text-muted-foreground",
  trial: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  starter: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  professional: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  business: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  lifetime: "bg-primary/10 text-primary border-primary/20",
};

const AdminSubscriptions = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: fetchSubscriptionStats,
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

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-destructive">Error loading stats: {(error as Error).message}</p>
        </div>
      </AdminLayout>
    );
  }

  const totalUsers = Object.values(data?.planStats || {}).reduce((a, b) => a + b, 0);
  const paidUsers = Object.entries(data?.planStats || {})
    .filter(([plan]) => !["none", "trial"].includes(plan))
    .reduce((acc, [, count]) => acc + count, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Paid Users</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paidUsers}</div>
              <p className="text-xs text-muted-foreground">
                {totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : 0}% conversion
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Trial Users</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.planStats.trial || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Recent Upgrades</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.recentUpgrades.length || 0}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Users by Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Users by Plan</CardTitle>
              <CardDescription>Distribution of users across subscription plans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(data?.planStats || {}).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={planColors[plan] || ""}>{plan}</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${totalUsers > 0 ? (count / totalUsers) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="font-medium w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Trial Expirations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Upcoming Trial Expirations
              </CardTitle>
              <CardDescription>Users whose trials expire within 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.upcomingTrialExpirations.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No upcoming expirations
                </p>
              ) : (
                <div className="space-y-3">
                  {data?.upcomingTrialExpirations.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{user.display_name || "Unnamed"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant="outline" className="text-amber-500 border-amber-500/20">
                        {format(new Date(user.trial_end_date), "MMM d")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Upgrades */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Upgrades</CardTitle>
            <CardDescription>Subscription upgrades in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.recentUpgrades.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No recent upgrades
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.recentUpgrades.map((upgrade) => (
                    <TableRow key={upgrade.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {upgrade.user?.display_name || "Unnamed"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {upgrade.user?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={planColors[upgrade.plan] || ""}>
                          {upgrade.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            upgrade.status === "active"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : ""
                          }
                        >
                          {upgrade.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {upgrade.amount ? `৳${upgrade.amount}` : "-"}
                      </TableCell>
                      <TableCell>
                        {format(new Date(upgrade.started_at), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSubscriptions;
