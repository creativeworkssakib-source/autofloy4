import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  CreditCard,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  ArrowLeft,
  Settings,
  KeyRound,
  FileText,
  BookOpen,
  DollarSign,
  Palette,
  Search,
  Mail,
  Webhook,
  Zap,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "User Settings", href: "/admin/user-settings", icon: Settings },
  { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { name: "Payment Requests", href: "/admin/payment-requests", icon: DollarSign },
  { name: "Payment Methods", href: "/admin/payment-methods", icon: CreditCard },
  { name: "Content Pages", href: "/admin/content-pages", icon: FileText },
  { name: "Blog Posts", href: "/admin/blog-posts", icon: BookOpen },
  { name: "Pricing Plans", href: "/admin/pricing-plans", icon: DollarSign },
  { name: "Appearance", href: "/admin/appearance", icon: Palette },
  { name: "SEO Settings", href: "/admin/seo", icon: Search },
  { name: "Email Templates", href: "/admin/email-templates", icon: Mail },
  { name: "SMS Settings", href: "/admin/sms-settings", icon: MessageSquare },
  { name: "Webhooks", href: "/admin/webhooks", icon: Webhook },
  { name: "API Integrations", href: "/admin/api-integrations", icon: Zap },
  { name: "Site Settings", href: "/admin/settings", icon: Settings },
  { name: "Passcode Reset", href: "/admin/passcode-reset", icon: KeyRound },
];

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const getCurrentPageTitle = () => {
    if (location.pathname.includes("/admin/users/")) return "User Details";
    const item = navItems.find(item => isActive(item.href));
    return item?.name || "Admin Panel";
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-card border-b border-border flex items-center justify-between px-4">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-destructive to-primary flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold">Admin</span>
        </Link>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-muted rounded-lg"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-card border-r border-border transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-border">
            <Link to="/admin/dashboard" className="flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-destructive to-primary flex items-center justify-center"
              >
                <Shield className="w-5 h-5 text-primary-foreground" />
              </motion.div>
              <span className="text-xl font-bold">
                Admin<span className="text-destructive">Panel</span>
              </span>
            </Link>
          </div>

          {/* Admin Badge */}
          <div className="p-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-destructive/10 to-primary/10 border border-destructive/20">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-destructive" />
                <span className="text-sm font-semibold">Administrator</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Full access to all features
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}

            <div className="pt-4 border-t border-border mt-4">
              <Link
                to="/dashboard"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Dashboard</span>
              </Link>
            </div>
          </nav>

          {/* User Menu */}
          <div className="p-4 border-t border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                  <UserAvatar name={user?.name} avatarUrl={user?.avatarUrl} size="md" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm">{user?.name || "Admin"}</div>
                    <div className="text-xs text-muted-foreground">{user?.email || ""}</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    User Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-destructive cursor-pointer">
                  <LogOut className="w-4 h-4" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 items-center justify-between px-8 border-b border-border bg-card">
          <h1 className="text-xl font-semibold">{getCurrentPageTitle()}</h1>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted transition-colors">
                  <UserAvatar name={user?.name} avatarUrl={user?.avatarUrl} size="sm" />
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    User Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-destructive cursor-pointer">
                  <LogOut className="w-4 h-4" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
