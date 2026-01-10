import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, User, CreditCard, Calendar, Hash, MapPin, Phone, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import OrderStatusBadge from './OrderStatusBadge';
import { Order } from '@/data/mockOrders';

interface OrderDetailModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OrderDetailModal = ({ order, open, onOpenChange }: OrderDetailModalProps) => {
  if (!order) return null;

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-BD', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const DetailRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) => (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 py-3"
    >
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium mt-0.5">{value}</p>
      </div>
    </motion.div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="w-5 h-5 text-primary" />
            </div>
            Order Details
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-1"
          >
            {/* Order Header */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-mono text-lg font-bold">{order.id}</p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            <Separator />

            {/* Order Details */}
            <div className="space-y-1">
              <DetailRow
                icon={User}
                label="Customer Name"
                value={order.customerName}
              />
              
              <DetailRow
                icon={Package}
                label="Product / Service"
                value={order.productName}
              />

              <DetailRow
                icon={CreditCard}
                label="Payment Method"
                value={
                  <span className="px-2 py-1 rounded-md text-xs bg-muted">
                    {order.paymentMethod}
                  </span>
                }
              />

              <DetailRow
                icon={Calendar}
                label="Order Date & Time"
                value={formatDateTime(order.dateTime)}
              />
            </div>

            <Separator />

            {/* Order Amount */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-lg bg-primary/5 border border-primary/20"
            >
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="text-2xl font-bold text-primary">
                  ৳{order.amount.toLocaleString()}
                </span>
              </div>
            </motion.div>

            {/* Mock Additional Info - Ready for API */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="p-3 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Phone className="w-3 h-3" />
                  <span className="text-xs">Phone</span>
                </div>
                <p className="text-sm font-medium">+880 1XXX-XXXXXX</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-3 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <MapPin className="w-3 h-3" />
                  <span className="text-xs">Location</span>
                </div>
                <p className="text-sm font-medium">Dhaka, Bangladesh</p>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailModal;
