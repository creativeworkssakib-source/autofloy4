import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

interface AnimatedStatCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  color: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  delay?: number;
  onClick?: () => void;
}

const AnimatedStatCard = ({
  title,
  value,
  prefix = '',
  suffix = '',
  icon: Icon,
  color,
  trend,
  delay = 0,
  onClick,
}: AnimatedStatCardProps) => {
  const animatedValue = useAnimatedCounter(value, { duration: 2000, decimals: 0 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={`hover:shadow-card transition-all duration-300 hover:-translate-y-1 overflow-hidden relative ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${color}`} />
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.2, type: 'spring', stiffness: 200 }}
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}
            >
              <Icon className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            {trend && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.4 }}
                className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  trend.isPositive
                    ? 'bg-success/10 text-success'
                    : 'bg-destructive/10 text-destructive'
                }`}
              >
                {trend.value}
              </motion.div>
            )}
          </div>
          <div>
            <motion.div
              className="text-3xl font-bold mb-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.3 }}
            >
              {prefix}{animatedValue.toLocaleString()}{suffix}
            </motion.div>
            <div className="text-sm text-muted-foreground font-medium">{title}</div>
          </div>
          
          {/* Click indicator */}
          {onClick && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.5 }}
              className="absolute bottom-3 right-3"
            >
              <span className="text-xs text-muted-foreground/50">Click for details</span>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AnimatedStatCard;
