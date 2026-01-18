import { Sparkles, TrendingUp, ArrowRight, Clock, Briefcase, Users, Monitor, Infinity, Star } from "lucide-react";
import { ValueComparison } from "@/data/plans";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface ValueComparisonBoxProps {
  comparison: ValueComparison;
  compact?: boolean;
}

// Clean icon mapping with simple, elegant styling
const getIconComponent = (iconType: string, size: string) => {
  const iconMap: Record<string, { icon: React.ReactNode; color: string }> = {
    "👨‍💼": { 
      icon: <Clock className={size} />, 
      color: "text-emerald-400"
    },
    "👥": { 
      icon: <Users className={size} />, 
      color: "text-blue-400"
    },
    "🤖": { 
      icon: <Briefcase className={size} />, 
      color: "text-amber-400"
    },
    "💻": { 
      icon: <Monitor className={size} />, 
      color: "text-violet-400"
    },
    "♾️": { 
      icon: <Infinity className={size} />, 
      color: "text-rose-400"
    },
    "🚀": { 
      icon: <Star className={size} />, 
      color: "text-yellow-400"
    },
  };
  return iconMap[iconType] || { 
    icon: <Star className={size} />, 
    color: "text-emerald-400"
  };
};

const ValueComparisonBox = ({ comparison, compact = false }: ValueComparisonBoxProps) => {
  const { language } = useLanguage();
  const isBn = language === "bn";

  const iconSize = compact ? "w-5 h-5" : "w-6 h-6";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={`relative overflow-hidden rounded-2xl ${compact ? 'p-4 mt-4' : 'p-5 mt-5'}`}
    >
      {/* Clean Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 dark:from-emerald-500/15 dark:via-teal-500/10 dark:to-cyan-500/15" />
      
      {/* Subtle Border */}
      <div className="absolute inset-0 rounded-2xl border border-emerald-500/20 dark:border-emerald-400/30" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header Badge */}
        <div className="flex justify-center mb-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-md ${compact ? 'text-[10px]' : 'text-xs'}`}>
            <TrendingUp className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
            {isBn ? comparison.titleBn : comparison.title}
            <Sparkles className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
          </span>
        </div>
        
        {/* Icon Comparison Row */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {comparison.items.map((item, index) => {
            const iconData = getIconComponent(item.icon, iconSize);
            return (
              <div key={index} className="flex items-center gap-2">
                {/* Icon with label */}
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center gap-1"
                >
                  <div className={`${compact ? 'w-12 h-12' : 'w-14 h-14'} rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center shadow-sm`}>
                    <div className={iconData.color}>
                      {iconData.icon}
                    </div>
                  </div>
                  <span className={`text-foreground/80 font-medium ${compact ? 'text-[9px]' : 'text-[10px]'} max-w-[60px] text-center leading-tight`}>
                    {isBn ? item.textBn : item.text}
                  </span>
                </motion.div>
                
                {/* Arrow */}
                {index < comparison.items.length - 1 && (
                  <div className="flex items-center px-1">
                    <div className={`${compact ? 'w-7 h-7' : 'w-8 h-8'} rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center`}>
                      <ArrowRight className={`${compact ? 'w-4 h-4' : 'w-4 h-4'} text-emerald-500`} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Highlight Message */}
        <div className="text-center">
          <p className={`font-bold leading-snug ${compact ? 'text-sm' : 'text-base'}`}>
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
              {isBn ? comparison.highlightBn : comparison.highlight}
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ValueComparisonBox;
