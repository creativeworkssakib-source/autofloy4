import { TrendingUp, Sparkles } from "lucide-react";
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
    <div className={`rounded-lg bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 border border-primary/10 ${compact ? 'p-2 mt-3' : 'p-3 mt-4'}`}>
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-2">
        <div className="p-1 rounded-md bg-primary/10">
          <TrendingUp className={`text-primary ${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
        </div>
        <span className={`font-semibold text-primary ${compact ? 'text-[10px]' : 'text-xs'}`}>
          {isBn ? comparison.titleBn : comparison.title}
        </span>
      </div>
      
      {/* Comparison Items */}
      <div className={`space-y-1 ${compact ? 'mb-1.5' : 'mb-2'}`}>
        {comparison.items.map((item, index) => (
          <div 
            key={index} 
            className={`flex items-center gap-2 text-muted-foreground ${compact ? 'text-[10px]' : 'text-xs'}`}
          >
            <span className={compact ? 'text-sm' : 'text-base'}>{item.icon}</span>
            <span className="leading-tight">{isBn ? item.textBn : item.text}</span>
          </div>
        ))}
      </div>
      
      {/* Highlight Message */}
      <div className={`flex items-start gap-1 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
        <Sparkles className={`text-success shrink-0 mt-0.5 ${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
        <span className="font-medium text-success leading-tight">
          {isBn ? comparison.highlightBn : comparison.highlight}
        </span>
      </div>
    </div>
  );
};

export default ValueComparisonBox;
