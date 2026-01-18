import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";

interface AnimatedStatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  gradientFrom: string;
  gradientTo: string;
  delay?: number;
  isLoading?: boolean;
  formatValue: (value: number) => string;
  badge?: string;
  badgeVariant?: "default" | "destructive" | "outline" | "secondary";
  isClickable?: boolean;
}

export const AnimatedStatCard = ({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  gradientFrom,
  gradientTo,
  delay = 0,
  isLoading = false,
  formatValue,
  badge,
  badgeVariant = "default",
  isClickable = false,
}: AnimatedStatCardProps) => {
  const animatedValue = useAnimatedCounter(value, { duration: 1500, decimals: 0 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: delay, 
        duration: 0.5, 
        ease: [0.25, 0.46, 0.45, 0.94] 
      }}
      whileHover={{ 
        scale: 1.02, 
        y: -4,
        transition: { duration: 0.2 } 
      }}
      className="group"
    >
      <Card className={`
        relative overflow-hidden border-0 
        bg-gradient-to-br ${gradientFrom} ${gradientTo}
        backdrop-blur-xl shadow-lg
        ${isClickable ? "cursor-pointer" : ""}
        transition-all duration-300
        hover:shadow-xl hover:shadow-primary/10
        dark:bg-gradient-to-br dark:from-card/80 dark:to-card/40
      `}>
        {/* Animated background glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className={`absolute -inset-1 bg-gradient-to-r ${gradientFrom} ${gradientTo} blur-xl opacity-20`} />
        </div>
        
        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className={`absolute w-32 h-32 rounded-full ${bgColor} blur-3xl opacity-30`}
            animate={{
              x: [0, 20, 0],
              y: [0, -10, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ top: "-20%", right: "-10%" }}
          />
        </div>

        <CardContent className="relative p-2 sm:p-3 lg:p-5">
          <div className="flex flex-col items-center text-center gap-1 sm:gap-2">
            {/* Animated Icon Container */}
            <motion.div 
              className={`
                relative p-1.5 sm:p-2 lg:p-3 rounded-lg sm:rounded-xl lg:rounded-2xl shrink-0
                ${bgColor} 
                shadow-inner backdrop-blur-sm
                group-hover:scale-110 transition-transform duration-300
              `}
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Icon className={`h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 ${color} drop-shadow-sm`} />
              
              {/* Pulse ring effect */}
              <motion.div
                className={`absolute inset-0 rounded-lg sm:rounded-xl lg:rounded-2xl ${bgColor} opacity-50`}
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            
            <div className="min-w-0 w-full space-y-0.5 sm:space-y-1">
              <div className="flex items-center justify-center gap-1 flex-wrap">
                <p className="text-[8px] sm:text-[10px] lg:text-sm font-medium text-muted-foreground/80 leading-tight line-clamp-2">
                  {title}
                </p>
              </div>
              
              {badge && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: delay + 0.3, type: "spring" }}
                  className="flex justify-center"
                >
                  <Badge 
                    variant={badgeVariant} 
                    className="text-[6px] sm:text-[8px] lg:text-[10px] px-1 sm:px-1.5 py-0 shadow-sm"
                  >
                    {badge}
                  </Badge>
                </motion.div>
              )}
              
              {isLoading ? (
                <Skeleton className="h-4 sm:h-6 lg:h-9 w-12 sm:w-20 lg:w-32 mx-auto" />
              ) : (
                <motion.p 
                  className={`text-[10px] sm:text-sm lg:text-2xl font-bold tracking-tight leading-tight ${badge ? color : 'text-foreground'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: delay + 0.2 }}
                >
                  {formatValue(animatedValue)}
                </motion.p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
