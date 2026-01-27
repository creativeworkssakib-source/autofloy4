import { Package, FileCode, Sparkles, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

  const types: { id: ProductType; label: string; labelBn: string; icon: typeof Package }[] = [
    {
      id: "physical",
      label: "Physical Product",
      labelBn: "ফিজিক্যাল প্রোডাক্ট",
      icon: Package,
    },
    {
      id: "digital",
      label: "Digital Product",
      labelBn: "ডিজিটাল প্রোডাক্ট",
      icon: FileCode,
    },
  ];

  return (
    <TooltipProvider>
      <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-gradient-to-r from-muted/80 to-muted/40 border border-border/50 backdrop-blur-sm shadow-sm">
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
                    "relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 overflow-hidden",
                    isActive
                      ? isDigital
                        ? "text-white shadow-lg shadow-purple-500/30"
                        : "text-blue-700 dark:text-blue-300 shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {/* Physical Active Background */}
                  {isActive && !isDigital && (
                    <motion.div
                      layoutId="productTypeBg"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40 border border-blue-200/50 dark:border-blue-700/50"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  
                  {/* Digital Active Background - Premium Gradient */}
                  {isActive && isDigital && (
                    <motion.div
                      layoutId="productTypeBg"
                      className="absolute inset-0 rounded-xl"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    >
                      {/* Main gradient */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600" />
                      
                      {/* Shimmer overlay */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                      
                      {/* Glow effect */}
                      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 opacity-40 blur-lg -z-10" />
                    </motion.div>
                  )}
                  
                  {/* Icon with animation for digital */}
                  <motion.div
                    className="relative z-10"
                    animate={isActive && isDigital ? { 
                      scale: [1, 1.1, 1],
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Icon className={cn(
                      "w-4 h-4",
                      isActive && isDigital && "drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]"
                    )} />
                  </motion.div>
                  
                  {/* Label */}
                  <span className="relative z-10 hidden sm:inline">
                    {isDigital ? "Digital" : "Physical"}
                  </span>
                  
                  {/* Premium sparkle effects for digital */}
                  <AnimatePresence>
                    {isActive && isDigital && (
                      <>
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          className="relative z-10 flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-yellow-300 drop-shadow-[0_0_4px_rgba(253,224,71,0.8)]" />
                        </motion.div>
                        
                        {/* Floating particles */}
                        <motion.div
                          className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {[...Array(3)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-1 h-1 bg-white/60 rounded-full"
                              initial={{ 
                                x: 20 + i * 25, 
                                y: 20,
                                opacity: 0 
                              }}
                              animate={{ 
                                y: [20, -5, 20],
                                opacity: [0, 1, 0],
                              }}
                              transition={{
                                duration: 2,
                                delay: i * 0.4,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            />
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </button>
              </TooltipTrigger>
              <TooltipContent 
                side="bottom" 
                className={cn(
                  "border",
                  isDigital 
                    ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-purple-400/50" 
                    : "bg-card"
                )}
              >
                <p className="font-semibold">{type.label}</p>
                <p className={cn(
                  "text-xs",
                  isDigital ? "text-purple-100" : "text-muted-foreground"
                )}>{type.labelBn}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
