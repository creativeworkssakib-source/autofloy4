import { Sparkles, TrendingUp, ArrowRight, User, Bot, Users, Laptop, Infinity, Rocket, Zap } from "lucide-react";
import { ValueComparison } from "@/data/plans";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface ValueComparisonBoxProps {
  comparison: ValueComparison;
  compact?: boolean;
}

// Map icon types to Lucide components with styling
const getIconComponent = (iconType: string, size: string) => {
  const iconMap: Record<string, { icon: React.ReactNode; gradient: string; glow: string }> = {
    "👨‍💼": { 
      icon: <User className={size} />, 
      gradient: "from-blue-500 to-cyan-400",
      glow: "shadow-blue-500/50"
    },
    "👥": { 
      icon: <Users className={size} />, 
      gradient: "from-indigo-500 to-purple-400",
      glow: "shadow-indigo-500/50"
    },
    "🤖": { 
      icon: <Bot className={size} />, 
      gradient: "from-emerald-500 to-teal-400",
      glow: "shadow-emerald-500/50"
    },
    "💻": { 
      icon: <Laptop className={size} />, 
      gradient: "from-slate-600 to-slate-400",
      glow: "shadow-slate-500/50"
    },
    "♾️": { 
      icon: <Infinity className={size} />, 
      gradient: "from-amber-500 to-orange-400",
      glow: "shadow-amber-500/50"
    },
    "🚀": { 
      icon: <Rocket className={size} />, 
      gradient: "from-rose-500 to-pink-400",
      glow: "shadow-rose-500/50"
    },
  };
  return iconMap[iconType] || { 
    icon: <Zap className={size} />, 
    gradient: "from-yellow-500 to-amber-400",
    glow: "shadow-yellow-500/50"
  };
};

const ValueComparisonBox = ({ comparison, compact = false }: ValueComparisonBoxProps) => {
  const { language } = useLanguage();
  const isBn = language === "bn";

  const iconSize = compact ? "w-6 h-6" : "w-8 h-8";
  const boxSize = compact ? "w-16 h-16" : "w-20 h-20";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`relative overflow-hidden rounded-3xl ${compact ? 'p-4 mt-4' : 'p-6 mt-6'}`}
    >
      {/* Animated Premium Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950/90 via-orange-950/80 to-rose-950/90 dark:from-amber-950 dark:via-orange-950 dark:to-rose-950" />
      
      {/* Animated Mesh Gradient Overlay */}
      <div className="absolute inset-0 opacity-60">
        <div className="absolute top-0 left-1/4 w-40 h-40 bg-amber-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-rose-500/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-24 bg-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>
      
      {/* Animated Border */}
      <div className="absolute inset-0 rounded-3xl border border-amber-400/40 dark:border-amber-400/30" />
      <div className="absolute inset-[1px] rounded-3xl border border-white/10" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header Badge */}
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="flex justify-center mb-4"
        >
          <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-bold shadow-lg shadow-orange-500/40 ${compact ? 'text-xs' : 'text-sm'}`}>
            <TrendingUp className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
            {isBn ? comparison.titleBn : comparison.title}
            <Sparkles className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} animate-pulse`} />
          </span>
        </motion.div>
        
        {/* Premium Icon Comparison */}
        <div className="flex items-center justify-center gap-3 mb-5">
          {comparison.items.map((item, index) => {
            const iconData = getIconComponent(item.icon, iconSize);
            return (
              <div key={index} className="flex items-center gap-3">
                {/* Premium Icon Card */}
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.15 }}
                  whileHover={{ scale: 1.08, y: -4 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className={`relative ${boxSize} rounded-2xl bg-gradient-to-br ${iconData.gradient} p-0.5 shadow-xl ${iconData.glow}`}>
                    <div className="w-full h-full rounded-2xl bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-white">
                        {iconData.icon}
                      </div>
                    </div>
                    {/* Shine effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 via-transparent to-transparent" />
                  </div>
                  <span className={`text-white/90 font-semibold ${compact ? 'text-[10px]' : 'text-xs'}`}>
                    {isBn ? item.textBn : item.text}
                  </span>
                </motion.div>
                
                {/* Animated Arrow/Equals */}
                {index < comparison.items.length - 1 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-dashed border-amber-400/50 flex items-center justify-center`}>
                      <ArrowRight className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} text-amber-400 animate-pulse`} />
                    </div>
                    <span className={`text-amber-400 font-bold ${compact ? 'text-[10px]' : 'text-xs'}`}>=</span>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Premium Highlight Message */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="text-center space-y-3"
        >
          {/* Main highlight with glow */}
          <div className="relative inline-block">
            <p className={`font-black leading-tight ${compact ? 'text-base' : 'text-lg'}`}>
              <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 bg-clip-text text-transparent drop-shadow-lg">
                {isBn ? comparison.highlightBn : comparison.highlight}
              </span>
            </p>
            {/* Text glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 blur-xl -z-10" />
          </div>
          
          {/* Decorative sparkle line */}
          <div className="flex justify-center items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
            </motion.div>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
            <Zap className="w-4 h-4 text-orange-400 fill-orange-400/50" />
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-orange-400/60 to-transparent" />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-rose-400" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ValueComparisonBox;
