import { Package, FileCode, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useProductType, ProductType } from "@/contexts/ProductTypeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const ProductTypeSwitcher = () => {
  const { productType, setProductType } = useProductType();
  const { t } = useLanguage();

  const types: { id: ProductType; label: string; labelBn: string; icon: typeof Package; color: string }[] = [
    {
      id: "physical",
      label: "Physical Product",
      labelBn: "ফিজিক্যাল প্রোডাক্ট",
      icon: Package,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "digital",
      label: "Digital Product",
      labelBn: "ডিজিটাল প্রোডাক্ট",
      icon: FileCode,
      color: "from-purple-500 to-pink-500",
    },
  ];

  return (
    <TooltipProvider>
      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border">
        {types.map((type) => {
          const isActive = productType === type.id;
          const Icon = type.icon;
          
          return (
            <Tooltip key={type.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setProductType(type.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? type.id === "physical"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-purple-600 dark:text-purple-400"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="productTypeBg"
                      className={cn(
                        "absolute inset-0 rounded-lg bg-gradient-to-r opacity-10",
                        type.id === "physical"
                          ? "from-blue-500 to-cyan-500"
                          : "from-purple-500 to-pink-500"
                      )}
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10 hidden sm:inline">
                    {type.id === "physical" ? "Physical" : "Digital"}
                  </span>
                  {isActive && type.id === "digital" && (
                    <Sparkles className="w-3 h-3 text-purple-500 animate-pulse relative z-10" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">{type.label}</p>
                <p className="text-xs text-muted-foreground">{type.labelBn}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
