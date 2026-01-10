import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Package, Banknote, ShoppingCart, CheckCircle, Clock, Boxes, PackageX, Warehouse } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import OrderStatusBadge from './OrderStatusBadge';
import { Order } from '@/data/mockOrders';

export type MetricType = 'todaysSales' | 'todaysOrders' | 'confirmedOrders' | 'pendingOrders' | 'totalRevenue' | 'totalOrders' | 'profit' | 'damagedOrLost' | 'totalProducts' | 'lowStock' | 'stockValue';

interface MetricDrilldownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metricType: MetricType | null;
  orders: Order[];
  stats: {
    todaysSales: number;
    todaysOrders: number;
    confirmedOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    totalOrders: number;
  };
}

const metricConfig: Record<MetricType, { title: string; icon: any; color: string; filterFn?: (o: Order) => boolean }> = {
  todaysSales: {
    title: "Today's Sales",
    icon: Banknote,
    color: 'from-primary to-primary-glow',
  },
  todaysOrders: {
    title: "Today's Orders",
    icon: ShoppingCart,
    color: 'from-secondary to-primary',
  },
  confirmedOrders: {
    title: 'Confirmed Orders',
    icon: CheckCircle,
    color: 'from-success to-primary',
    filterFn: (o) => o.status === 'Confirmed',
  },
  pendingOrders: {
    title: 'Pending Orders',
    icon: Clock,
    color: 'from-accent to-secondary',
    filterFn: (o) => o.status === 'Pending',
  },
  totalRevenue: {
    title: 'Total Revenue',
    icon: TrendingUp,
    color: 'from-primary to-secondary',
  },
  totalOrders: {
    title: 'All Orders',
    icon: Package,
    color: 'from-secondary to-accent',
  },
  profit: {
    title: 'Profit',
    icon: TrendingUp,
    color: 'from-success to-primary-glow',
    filterFn: (o) => o.status === 'Delivered',
  },
  damagedOrLost: {
    title: 'Damaged/Lost Orders',
    icon: TrendingDown,
    color: 'from-destructive to-accent',
    filterFn: (o) => o.status === 'Cancelled',
  },
  totalProducts: {
    title: 'Total Products',
    icon: Boxes,
    color: 'from-primary to-accent',
  },
  lowStock: {
    title: 'Low Stock Alert',
    icon: PackageX,
    color: 'from-warning to-destructive',
  },
  stockValue: {
    title: 'Stock Value',
    icon: Warehouse,
    color: 'from-secondary to-primary',
  },
};

const MetricDrilldownModal = ({ open, onOpenChange, metricType, orders, stats }: MetricDrilldownModalProps) => {
  if (!metricType) return null;

  const config = metricConfig[metricType];
  const Icon = config.icon;

  // Filter orders based on metric type
  const filteredOrders = config.filterFn ? orders.filter(config.filterFn) : orders;
  
  // Calculate summary for this metric
  const totalAmount = filteredOrders.reduce((sum, o) => sum + o.amount, 0);
  const orderCount = filteredOrders.length;

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className={`p-2 rounded-xl bg-gradient-to-br ${config.color}`}
            >
              <Icon className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            {config.title} Details
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Banknote className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Value</p>
                        <p className="text-xl font-bold">৳{totalAmount.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card className="bg-secondary/5 border-secondary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary/10">
                        <Package className="w-4 h-4 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Order Count</p>
                        <p className="text-xl font-bold">{orderCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <Separator />

            {/* Orders Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="font-semibold mb-3">Order Details</h3>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order, index) => (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.25 + index * 0.03 }}
                          className="border-b last:border-0 hover:bg-muted/30"
                        >
                          <TableCell className="font-mono text-sm font-medium">
                            {order.id}
                          </TableCell>
                          <TableCell className="font-medium">{order.customerName}</TableCell>
                          <TableCell className="text-muted-foreground">{order.productName}</TableCell>
                          <TableCell className="font-semibold">৳{order.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-md text-xs bg-muted">
                              {order.paymentMethod}
                            </span>
                          </TableCell>
                          <TableCell>
                            <OrderStatusBadge status={order.status} />
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDateTime(order.dateTime)}
                          </TableCell>
                        </motion.tr>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No orders found for this metric
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default MetricDrilldownModal;
