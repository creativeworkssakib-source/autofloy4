import { useQuery } from "@tanstack/react-query";
import { fetchAdminOverview } from "@/services/adminService";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  UserCheck,
  UserX,
  Facebook,
  TrendingUp,
  Activity,
  Package,
  ShoppingCart,
  FileText,
  Bot,
  Zap,
  Store,
  MessageSquare,
  Star,
  Truck,
  UserPlus,
  Bell,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const AdminDashboard = () => {
  const { data: overview, isLoading, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: fetchAdminOverview,
  });

  // User stats
  const userStats = [
    {
      title: "Total Users",
      value: overview?.totalUsers || 0,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active Users",
      value: overview?.activeUsers || 0,
      icon: UserCheck,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Suspended Users",
      value: overview?.suspendedUsers || 0,
      icon: UserX,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Facebook Connected",
      value: overview?.usersWithFacebook || 0,
      icon: Facebook,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  ];

  // Platform stats
  const platformStats = [
    {
      title: "Total Automations",
      value: overview?.totalAutomations || 0,
      icon: Bot,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Automation Runs",
      value: overview?.totalExecutionLogs || 0,
      icon: Zap,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Online Products",
      value: overview?.totalProducts || 0,
      icon: Package,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    {
      title: "Online Orders",
      value: overview?.totalOrders || 0,
      icon: ShoppingCart,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ];

  // Shop stats
  const shopStats = [
    {
      title: "Shop Products",
      value: overview?.totalShopProducts || 0,
      icon: Store,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
    {
      title: "Shop Sales",
      value: overview?.totalShopSales || 0,
      icon: ShoppingCart,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Shop Customers",
      value: overview?.totalShopCustomers || 0,
      icon: UserPlus,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Shop Suppliers",
      value: overview?.totalShopSuppliers || 0,
      icon: Truck,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  // Content stats
  const contentStats = [
    {
      title: "Blog Posts",
      value: overview?.totalBlogPosts || 0,
      subtitle: `${overview?.publishedBlogPosts || 0} published`,
      icon: FileText,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
    {
      title: "CMS Pages",
      value: overview?.totalCMSPages || 0,
      icon: FileText,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
    {
      title: "Reviews",
      value: overview?.totalReviews || 0,
      icon: Star,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Notifications",
      value: overview?.totalNotifications || 0,
      icon: Bell,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
    },
  ];

  const planLabels: Record<string, string> = {
    none: "No Plan",
    trial: "Trial",
    starter: "Starter",
    professional: "Professional",
    business: "Business",
    lifetime: "Lifetime",
  };

  const planColors: Record<string, string> = {
    none: "bg-muted text-muted-foreground",
    trial: "bg-yellow-500/10 text-yellow-600",
    starter: "bg-blue-500/10 text-blue-600",
    professional: "bg-purple-500/10 text-purple-600",
    business: "bg-emerald-500/10 text-emerald-600",
    lifetime: "bg-primary/10 text-primary",
  };

  const StatCard = ({ stat, isLoading }: { stat: { title: string; value: number; subtitle?: string; icon: React.ElementType; color: string; bgColor: string }; isLoading: boolean }) => (
    <Card>
      <CardContent className="pt-6">
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.bgColor}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Complete platform overview and statistics</p>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Failed to load overview data. Please try again.</p>
            </CardContent>
          </Card>
        )}

        {/* User Stats */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            User Statistics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {userStats.map((stat) => (
              <StatCard key={stat.title} stat={stat} isLoading={isLoading} />
            ))}
          </div>
        </div>

        {/* Platform Stats */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-500" />
            Automation & Online Store
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {platformStats.map((stat) => (
              <StatCard key={stat.title} stat={stat} isLoading={isLoading} />
            ))}
          </div>
        </div>

        {/* Shop Stats */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Store className="w-5 h-5 text-indigo-500" />
            Offline Shop
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {shopStats.map((stat) => (
              <StatCard key={stat.title} stat={stat} isLoading={isLoading} />
            ))}
          </div>
        </div>

        {/* Content Stats */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-pink-500" />
            Content & Engagement
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {contentStats.map((stat) => (
              <StatCard key={stat.title} stat={stat} isLoading={isLoading} />
            ))}
          </div>
        </div>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Users by Plan
            </CardTitle>
            <CardDescription>Distribution of users across subscription plans</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="flex flex-wrap gap-4">
                {Object.entries(overview?.planCounts || {}).map(([plan, count]) => (
                  <div key={plan} className="flex items-center gap-2">
                    <Badge variant="outline" className={planColors[plan] || "bg-muted"}>
                      {planLabels[plan] || plan}
                    </Badge>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Signups Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                New Signups (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={overview?.signupsPerDay || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                      className="text-muted-foreground"
                    />
                    <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top Active Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Top Active Users
              </CardTitle>
              <CardDescription>Most active users by automation runs</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : overview?.topActiveUsers && overview.topActiveUsers.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {overview.topActiveUsers.map((user, index) => (
                    <Link
                      key={user.id}
                      to={`/admin/users/${user.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{user.display_name || "Unnamed"}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{user.automation_runs}</p>
                        <p className="text-xs text-muted-foreground">automations</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No activity data yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;