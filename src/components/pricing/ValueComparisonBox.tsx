import { Sparkles, TrendingUp, Zap } from "lucide-react";
import { ValueComparison } from "@/data/plans";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface ValueComparisonBoxProps {
  comparison: ValueComparison;
  compact?: boolean;
}

const ValueComparisonBox = ({ comparison, compact = false }: ValueComparisonBoxProps) => {
  const { language } = useLanguage();
  const isBn = language === "bn";

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={`relative overflow-hidden rounded-2xl ${compact ? 'p-4 mt-4' : 'p-5 mt-5'}`}
    >
      {/* Premium Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/15 to-rose-500/10 dark:from-amber-500/20 dark:via-orange-500/25 dark:to-rose-500/20" />
      
      {/* Glass Border Effect */}
      <div className="absolute inset-0 rounded-2xl border-2 border-amber-400/30 dark:border-amber-400/40" />
      
      {/* Animated Glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-orange-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header Badge */}
        <div className="flex justify-center mb-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg shadow-amber-500/30 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            <TrendingUp className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
            {isBn ? comparison.titleBn : comparison.title}
          </span>
        </div>
        
        {/* Large Icon Comparison Row */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {comparison.items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              {/* Icon with glow background */}
              <motion.div 
                whileHover={{ scale: 1.1 }}
                className={`relative flex items-center justify-center rounded-xl bg-white/80 dark:bg-white/10 shadow-lg backdrop-blur-sm border border-white/50 dark:border-white/20 ${compact ? 'w-12 h-12' : 'w-14 h-14'}`}
              >
                <span className={`${compact ? 'text-2xl' : 'text-3xl'}`}>{item.icon}</span>
                {/* Subtle glow under icon */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-amber-200/30 to-transparent dark:from-amber-500/20" />
              </motion.div>
              
              {/* Equals sign between icons */}
              {index < comparison.items.length - 1 && (
                <div className="flex flex-col items-center">
                  <Zap className={`text-amber-500 fill-amber-400 ${compact ? 'w-5 h-5' : 'w-6 h-6'}`} />
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Premium Highlight Message */}
        <div className="text-center space-y-2">
          <p className={`font-extrabold leading-tight ${compact ? 'text-sm' : 'text-base'}`}>
            <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-rose-500 dark:from-amber-400 dark:via-orange-400 dark:to-rose-400 bg-clip-text text-transparent">
              {isBn ? comparison.highlightBn : comparison.highlight}
            </span>
          </p>
          
          {/* Sparkle row */}
          <div className="flex justify-center items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
            <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ValueComparisonBox;
