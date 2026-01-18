import { Sparkles } from "lucide-react";
import { ValueComparison } from "@/data/plans";
import { useLanguage } from "@/contexts/LanguageContext";

interface ValueComparisonBoxProps {
  comparison: ValueComparison;
  compact?: boolean;
}

const ValueComparisonBox = ({ comparison, compact = false }: ValueComparisonBoxProps) => {
  const { language } = useLanguage();
  const isBn = language === "bn";

  return (
    <div className={`rounded-xl bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-yellow-950/30 border border-amber-200/50 dark:border-amber-700/30 ${compact ? 'p-3 mt-3' : 'p-4 mt-4'}`}>
      {/* Large Icon Row */}
      <div className="flex items-center justify-center gap-3 mb-2">
        {comparison.items.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <span className={`${compact ? 'text-2xl' : 'text-3xl'}`}>{item.icon}</span>
            {index < comparison.items.length - 1 && (
              <span className="text-amber-400 dark:text-amber-500 font-bold mx-1">=</span>
            )}
          </div>
        ))}
      </div>
      
      {/* Single Line Highlight */}
      <div className="text-center">
        <p className={`font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 dark:from-amber-400 dark:via-orange-400 dark:to-amber-400 bg-clip-text text-transparent ${compact ? 'text-xs' : 'text-sm'}`}>
          {isBn ? comparison.highlightBn : comparison.highlight}
        </p>
      </div>
      
      {/* Sparkle accent */}
      <div className="flex justify-center mt-1.5">
        <Sparkles className={`text-amber-500 ${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
      </div>
    </div>
  );
};

export default ValueComparisonBox;
