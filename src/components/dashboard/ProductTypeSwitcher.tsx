import { Package, FileCode, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useProductType, ProductType } from "@/contexts/ProductTypeContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const ProductTypeSwitcher = () => {
  const { productType, setProductType } = useProductType();

  const types: { id: ProductType; label: string; shortLabel: string; icon: typeof Package }[] = [
    {
      id: "physical",
      label: "Physical Products",
      shortLabel: "Physical",
      icon: Package,
    },
    {
      id: "digital",
      label: "Digital Products",
      shortLabel: "Digital",
      icon: FileCode,
    },
  ];

  return (
    <TooltipProvider>
      <div className="inline-flex items-center p-1 rounded-xl bg-muted/60 border border-border/40 shadow-inner">
        {types.map((type) => {
          const isActive = productType === type.id;
          const Icon = type.icon;
          const isDigital = type.id === "digital";
          
          return (
            <Tooltip key={type.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setProductType(type.id)}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300",
                    isActive
                      ? "text-white shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {/* Background */}
                  {isActive && (
                    <motion.div
                      layoutId="productTypeBgMobile"
                      className={cn(
                        "absolute inset-0 rounded-lg",
                        isDigital
                          ? "bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 shadow-purple-500/30"
                          : "bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 shadow-blue-500/30"
                      )}
                      initial={false}
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  
                  {/* Icon */}
                  <motion.div
                    className="relative z-10"
                    animate={isActive && isDigital ? { 
                      rotate: [0, -5, 5, 0],
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Icon className={cn(
                      "w-3.5 h-3.5 transition-all",
                      isActive && "drop-shadow-sm"
                    )} />
                  </motion.div>
                  
                  {/* Label */}
                  <span className="relative z-10">
                    {type.shortLabel}
                  </span>
                  
                  {/* Sparkle for digital */}
                  <AnimatePresence>
                    {isActive && isDigital && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0, rotate: -30 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0, rotate: 30 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="relative z-10"
                      >
                        <Sparkles className="w-3 h-3 text-yellow-300 drop-shadow-[0_0_3px_rgba(253,224,71,0.8)]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </TooltipTrigger>
              <TooltipContent 
                side="bottom" 
                className={cn(
                  "border font-medium",
                  isDigital 
                    ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-purple-400/50" 
                    : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-blue-400/50"
                )}
              >
                <p className="text-xs">{type.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};