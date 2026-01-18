import { motion } from "framer-motion";
import { Target, TrendingUp, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";

interface PremiumTargetCardProps {
  monthSales: number;
  salesTarget: number;
  targetProgress: number;
  isTargetAchieved: boolean;
  isLoading: boolean;
  formatCurrency: (amount: number) => string;
  language: string;
}

export const PremiumTargetCard = ({
  monthSales,
  salesTarget,
  targetProgress,
  isTargetAchieved,
  isLoading,
  formatCurrency,
  language,
}: PremiumTargetCardProps) => {
  const animatedProgress = useAnimatedCounter(Math.min(targetProgress, 100), { duration: 1800 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <Card className={`
        relative overflow-hidden border-0
        ${isTargetAchieved 
          ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-400/5 to-teal-500/10' 
          : 'bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10'
        }
        backdrop-blur-xl shadow-lg
        dark:from-primary/20 dark:via-transparent dark:to-secondary/20
      `}>
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating orbs */}
          <motion.div
            className={`absolute w-24 sm:w-40 h-24 sm:h-40 rounded-full blur-3xl ${isTargetAchieved ? 'bg-emerald-500/20' : 'bg-primary/20'}`}
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            style={{ top: "-30%", right: "10%" }}
          />
          <motion.div
            className={`absolute w-16 sm:w-24 h-16 sm:h-24 rounded-full blur-2xl ${isTargetAchieved ? 'bg-teal-500/15' : 'bg-secondary/15'}`}
            animate={{
              x: [0, -20, 0],
              y: [0, 10, 0],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            style={{ bottom: "-20%", left: "20%" }}
          />
          
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
        </div>

        <CardContent className="relative p-3 sm:p-5 lg:p-6">
          <div className="flex items-start gap-3 sm:gap-5">
            {/* Premium Icon */}
            <motion.div 
              className={`
                relative p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shrink-0
                ${isTargetAchieved ? 'bg-emerald-500/20' : 'bg-primary/20'}
                shadow-inner
              `}
              animate={isTargetAchieved ? { 
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Target className={`h-5 w-5 sm:h-7 sm:w-7 ${isTargetAchieved ? 'text-emerald-500' : 'text-primary'}`} />
              
              {isTargetAchieved && (
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                </motion.div>
              )}
            </motion.div>
            
            {/* Content */}
            <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
              {/* Header */}
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="flex items-start sm:items-center gap-1.5 sm:gap-2 flex-col sm:flex-row">
                  <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground leading-tight">
                    {language === "bn" ? "মাসিক বিক্রয় লক্ষ্য" : "Monthly Sales Target"}
                  </h3>
                  {isTargetAchieved && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5">
                        <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                        {language === "bn" ? "অর্জিত!" : "Achieved!"}
                      </Badge>
                    </motion.div>
                  )}
                </div>
                
                {/* Percentage */}
                {isLoading ? (
                  <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
                ) : (
                  <motion.span 
                    className={`text-xl sm:text-2xl lg:text-3xl font-bold ${isTargetAchieved ? 'text-emerald-500' : 'text-primary'}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    {animatedProgress}%
                  </motion.span>
                )}
              </div>
              
              {/* Premium Progress Bar */}
              {isLoading ? (
                <Skeleton className="h-2 sm:h-3 w-full rounded-full" />
              ) : (
                <div className="relative h-2 sm:h-3 bg-muted/50 rounded-full overflow-hidden backdrop-blur-sm">
                  <motion.div
                    className={`
                      absolute inset-y-0 left-0 rounded-full
                      ${isTargetAchieved 
                        ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500' 
                        : 'bg-gradient-to-r from-primary via-primary to-secondary'
                      }
                    `}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(targetProgress, 100)}%` }}
                    transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
                  />
                  
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  />
                </div>
              )}
              
              {/* Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2 text-[10px] sm:text-xs lg:text-sm">
                {isLoading ? (
                  <Skeleton className="h-3 sm:h-4 w-32 sm:w-40" />
                ) : (
                  <>
                    <span className="text-muted-foreground">
                      <span className="font-semibold text-foreground">{formatCurrency(monthSales)}</span>
                      {" / "}
                      <span className="font-medium">{formatCurrency(salesTarget)}</span>
                    </span>
                    <span className="text-muted-foreground/70 text-[9px] sm:text-xs">
                      {language === "bn" ? "স্টক মূল্য ÷ ১২" : "Stock Value ÷ 12"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
