import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Banknote,
  ShoppingCart,
  CheckCircle,
  Clock,
  TrendingUp,
  Package,
  BarChart3,
  AlertTriangle,
  Download,
  DollarSign,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Boxes,
  PackageX,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import AnimatedStatCard from '@/components/analytics/AnimatedStatCard';
import OrdersTable from '@/components/analytics/OrdersTable';
import SalesChart from '@/components/analytics/SalesChart';
import DateRangeSelector, { DateRangeOption } from '@/components/analytics/DateRangeSelector';
import MetricDrilldownModal from '@/components/analytics/MetricDrilldownModal';
import ReturnsLossSection from '@/components/analytics/ReturnsLossSection';
import { fetchBusinessOverview, exportSalesReport, BusinessOverviewStats, DailyStats, Order, LowStockProduct } from '@/services/apiService';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

import { MetricType } from '@/components/analytics/MetricDrilldownModal';

// Transform API order to table format
interface TableOrder {
  id: string;
  customerName: string;
  productName: string;
  amount: number;
  paymentMethod: 'bKash' | 'Nagad' | 'COD' | 'Card' | 'Bank Transfer';
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Delivered';
  dateTime: string;
}

const BusinessOverview = () => {
  // Date range state
  const [dateRange, setDateRange] = useState<DateRangeOption>('this_month');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | undefined>();

  // Data state
  const [stats, setStats] = useState<BusinessOverviewStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [orders, setOrders] = useState<TableOrder[]>([]);
  const [rawOrders, setRawOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const customStart = customDateRange?.from?.toISOString();
      const customEnd = customDateRange?.to?.toISOString();
      
      const data = await fetchBusinessOverview(
        dateRange,
        customStart,
        customEnd
      );
      
      if (data) {
        setStats(data.stats);
        setDailyStats(data.dailyStats || []);
        setRawOrders(data.orders || []);
        
        // Transform orders for table
        const tableOrders: TableOrder[] = (data.orders || []).map((o: Order) => ({
          id: o.id,
          customerName: o.customer_name || 'Unknown Customer',
          productName: Array.isArray(o.items) && o.items.length > 0 
            ? (o.items[0] as { name?: string })?.name || 'Product'
            : 'Product',
          amount: o.total,
          paymentMethod: 'COD' as const,
          status: o.status === 'pending' ? 'Pending' 
            : o.status === 'confirmed' ? 'Confirmed'
            : o.status === 'delivered' ? 'Delivered'
            : o.status === 'cancelled' ? 'Cancelled'
            : 'Pending',
          dateTime: o.created_at || new Date().toISOString(),
        }));
        setOrders(tableOrders);
      }
    } catch (error) {
      console.error('Failed to load business overview:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, customDateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDateRangeChange = (range: DateRangeOption, customDates?: { from: Date; to: Date }) => {
    setDateRange(range);
    if (customDates) {
      setCustomDateRange(customDates);
    } else {
      setCustomDateRange(undefined);
    }
  };

  const handleCardClick = (metricType: MetricType) => {
    setSelectedMetric(metricType);
    setDrilldownOpen(true);
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      let fromDate: string;
      let toDate: string;
      
      if (customDateRange) {
        fromDate = customDateRange.from.toISOString().split('T')[0];
        toDate = customDateRange.to.toISOString().split('T')[0];
      } else {
        const now = new Date();
        toDate = now.toISOString().split('T')[0];
        
        switch (dateRange) {
          case 'today':
            fromDate = toDate;
            break;
          case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            fromDate = toDate = yesterday.toISOString().split('T')[0];
            break;
          case 'this_week':
            const startOfWeek = new Date(now);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            fromDate = startOfWeek.toISOString().split('T')[0];
            break;
          case 'last_7_days':
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            fromDate = sevenDaysAgo.toISOString().split('T')[0];
            break;
          case 'this_month':
          default:
            fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            break;
        }
      }
      
      const blob = await exportSalesReport(fromDate, toDate, format);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales_report_${fromDate}_to_${toDate}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`Report downloaded as ${format.toUpperCase()}`);
      } else {
        toast.error('Failed to export report');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  // Default stats if no data
  const displayStats = stats || {
    todaysSales: 0,
    todaysOrders: 0,
    confirmedOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalOrders: 0,
    messagesHandled: 0,
    autoRepliesSent: 0,
    totalSalesAmount: 0,
    totalBuyCost: 0,
    profit: 0,
    damagedOrLost: 0,
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalStockValue: 0,
    potentialRevenue: 0,
    potentialProfit: 0,
  };

  // Calculate percentage for confirmed/pending
  const confirmRate = displayStats.totalOrders > 0 
    ? Math.round((displayStats.confirmedOrders / displayStats.totalOrders) * 100)
    : 0;
  const pendingRate = displayStats.totalOrders > 0 
    ? Math.round((displayStats.pendingOrders / displayStats.totalOrders) * 100)
    : 0;

  const statCards: {
    title: string;
    value: number;
    prefix?: string;
    icon: any;
    color: string;
    trend?: { value: string; isPositive: boolean };
    metricKey: MetricType;
  }[] = [
    {
      title: "Today's Sales",
      value: displayStats.todaysSales,
      prefix: '৳',
      icon: Banknote,
      color: 'from-primary to-primary-glow',
      metricKey: 'todaysSales',
    },
    {
      title: "Today's Orders",
      value: displayStats.todaysOrders,
      icon: ShoppingCart,
      color: 'from-secondary to-primary',
      metricKey: 'todaysOrders',
    },
    {
      title: 'Confirmed Orders',
      value: displayStats.confirmedOrders,
      icon: CheckCircle,
      color: 'from-success to-primary',
      trend: displayStats.totalOrders > 0 ? { value: `${confirmRate}%`, isPositive: true } : undefined,
      metricKey: 'confirmedOrders',
    },
    {
      title: 'Pending Orders',
      value: displayStats.pendingOrders,
      icon: Clock,
      color: 'from-accent to-secondary',
      trend: displayStats.totalOrders > 0 ? { value: `${pendingRate}%`, isPositive: false } : undefined,
      metricKey: 'pendingOrders',
    },
    {
      title: 'Total Revenue',
      value: displayStats.totalRevenue,
      prefix: '৳',
      icon: TrendingUp,
      color: 'from-primary to-secondary',
      metricKey: 'totalRevenue',
    },
    {
      title: 'Profit',
      value: displayStats.profit,
      prefix: '৳',
      icon: DollarSign,
      color: 'from-success to-primary-glow',
      trend: displayStats.totalSalesAmount > 0 ? { value: `${Math.round((displayStats.profit / displayStats.totalSalesAmount) * 100)}%`, isPositive: displayStats.profit > 0 } : undefined,
      metricKey: 'profit',
    },
    {
      title: 'Total Products',
      value: displayStats.totalProducts || 0,
      icon: Boxes,
      color: 'from-primary to-accent',
      metricKey: 'totalProducts',
    },
    {
      title: 'Low Stock Alert',
      value: displayStats.lowStockCount || 0,
      icon: PackageX,
      color: 'from-warning to-destructive',
      trend: (displayStats.lowStockCount || 0) > 0 ? { value: `${displayStats.outOfStockCount || 0} out`, isPositive: false } : undefined,
      metricKey: 'lowStock',
    },
    {
      title: 'Stock Value',
      value: displayStats.totalStockValue || 0,
      prefix: '৳',
      icon: Package,
      color: 'from-secondary to-accent',
      trend: (displayStats.potentialProfit || 0) > 0 ? { value: `৳${Math.round(displayStats.potentialProfit || 0).toLocaleString()} potential`, isPositive: true } : undefined,
      metricKey: 'stockValue',
    },
    {
      title: 'Damaged/Lost',
      value: displayStats.damagedOrLost,
      icon: AlertTriangle,
      color: 'from-destructive to-accent',
      metricKey: 'damagedOrLost',
    },
  ];

  // For the drilldown modal - need to transform stats
  const modalStats = {
    todaysSales: displayStats.todaysSales,
    todaysOrders: displayStats.todaysOrders,
    confirmedOrders: displayStats.confirmedOrders,
    pendingOrders: displayStats.pendingOrders,
    totalRevenue: displayStats.totalRevenue,
    totalOrders: displayStats.totalOrders,
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-end gap-3"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Download as Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="w-4 h-4 mr-2" />
                Download as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DateRangeSelector
            selectedRange={dateRange}
            onRangeChange={handleDateRangeChange}
            customDateRange={customDateRange}
          />
        </motion.div>

        {/* Stats Grid - Clickable */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((stat, index) => (
              <AnimatedStatCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                prefix={stat.prefix}
                icon={stat.icon}
                color={stat.color}
                trend={stat.trend}
                delay={index * 0.1}
                onClick={() => handleCardClick(stat.metricKey)}
              />
            ))}
          </div>
        )}

        {/* Charts */}
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ) : (
          <SalesChart data={dailyStats} />
        )}

        {/* Returns & Loss Section */}
        <ReturnsLossSection />

        {/* Orders Table */}
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ) : (
          <OrdersTable orders={orders} />
        )}
      </div>

      {/* Metric Drilldown Modal */}
      <MetricDrilldownModal
        open={drilldownOpen}
        onOpenChange={setDrilldownOpen}
        metricType={selectedMetric}
        orders={orders}
        stats={modalStats}
      />
    </DashboardLayout>
  );
};

export default BusinessOverview;
