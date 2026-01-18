import { motion } from "framer-motion";
import { Package, ShoppingCart, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";

interface PremiumQuickStatsProps {
  totalProducts: number;
  totalStockItems: number;
  totalStockValue: number;
  isLoading: boolean;
  formatCurrency: (amount: number) => string;
  language: string;
}

export const PremiumQuickStats = ({
  totalProducts,
  totalStockItems,
  totalStockValue,
  isLoading,
  formatCurrency,
  language,
}: PremiumQuickStatsProps) => {
  const animatedProducts = useAnimatedCounter(totalProducts, { duration: 500 });
  const animatedStock = useAnimatedCounter(totalStockItems, { duration: 500 });
  const animatedValue = useAnimatedCounter(totalStockValue, { duration: 500 });

  const stats = [
    {
      title: language === "bn" ? "প্রোডাক্ট টাইপ" : "Product Types",
      value: animatedProducts,
      displayValue: animatedProducts.toString(),
      icon: Package,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      gradientFrom: "from-purple-500/20",
      gradientTo: "to-fuchsia-500/10",
      iconBg: "bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20",
    },
    {
      title: language === "bn" ? "মোট স্টক আইটেম" : "Total Stock Items",
      value: animatedStock,
      displayValue: animatedStock.toString(),
      subtitle: `${language === "bn" ? "মূল্য:" : "Value:"} ${formatCurrency(animatedValue)}`,
      icon: ShoppingCart,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      gradientFrom: "from-cyan-500/20",
      gradientTo: "to-blue-500/10",
      iconBg: "bg-gradient-to-br from-cyan-500/20 to-blue-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map((stat, index) => (
        <div key={stat.title} className="group h-full">
          <Card className={`
            relative overflow-hidden border-0 h-full
            bg-gradient-to-br ${stat.gradientFrom} ${stat.gradientTo}
            backdrop-blur-xl shadow-lg
            transition-all duration-200
            hover:shadow-xl hover:scale-[1.02]
            dark:from-card/80 dark:to-card/40
          `}>
            {/* Static background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                className={`absolute w-24 h-24 rounded-full ${stat.bgColor} blur-2xl opacity-40`}
                style={{ top: "-20%", right: "0%" }}
              />
            </div>

            <CardContent className="relative pt-5 pb-5 px-5 h-full">
              <div className="flex items-center gap-4 h-full">
                {/* Icon */}
                <div 
                  className={`
                    relative p-3.5 rounded-2xl shrink-0 
                    ${stat.iconBg} 
                    shadow-inner backdrop-blur-sm
                    group-hover:scale-110 transition-transform duration-200
                  `}
                >
                  <stat.icon className={`h-6 w-6 ${stat.color} drop-shadow-sm`} />
                </div>
                
                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-muted-foreground/80 mb-1">
                    {stat.title}
                  </p>
                  {isLoading ? (
                    <Skeleton className="h-7 w-20" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      {stat.displayValue}
                    </p>
                  )}
                  {stat.subtitle && (
                    <p className={`text-xs mt-1 ${stat.color} font-medium`}>
                      {isLoading ? <Skeleton className="h-3 w-24" /> : stat.subtitle}
                    </p>
                  )}
                </div>
                
                {/* Decorative layers icon */}
                <div className="absolute bottom-3 right-3 opacity-10">
                  <Layers className="h-16 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};
