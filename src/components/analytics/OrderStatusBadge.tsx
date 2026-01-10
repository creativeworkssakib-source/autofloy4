import { cn } from '@/lib/utils';

interface OrderStatusBadgeProps {
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Delivered';
}

const statusStyles = {
  Pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  Confirmed: 'bg-success/10 text-success',
  Cancelled: 'bg-destructive/10 text-destructive',
  Delivered: 'bg-primary/10 text-primary',
};

const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
        statusStyles[status]
      )}
    >
      <span
        className={cn('w-1.5 h-1.5 rounded-full mr-1.5', {
          'bg-amber-500': status === 'Pending',
          'bg-success': status === 'Confirmed',
          'bg-destructive': status === 'Cancelled',
          'bg-primary': status === 'Delivered',
        })}
      />
      {status}
    </span>
  );
};

export default OrderStatusBadge;
