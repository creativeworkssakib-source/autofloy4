import { useState } from "react";
import { format, startOfDay, endOfDay, subDays, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export type DateRangePreset = 'today' | 'yesterday' | 'this_week' | 'last_7_days' | 'this_month' | 'this_year' | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeFilterProps {
  selectedRange: DateRangePreset;
  onRangeChange: (range: DateRangePreset, dates: DateRange) => void;
  customDateRange?: DateRange;
  className?: string;
  compact?: boolean;
}

export const getDateRangeFromPreset = (preset: DateRangePreset, customDates?: DateRange): DateRange => {
  const now = new Date();
  const today = startOfDay(now);
  
  switch (preset) {
    case 'today':
      return { from: today, to: endOfDay(now) };
    case 'yesterday':
      const yesterday = subDays(today, 1);
      return { from: yesterday, to: endOfDay(yesterday) };
    case 'this_week':
      return { from: startOfWeek(today, { weekStartsOn: 0 }), to: endOfDay(now) };
    case 'last_7_days':
      return { from: subDays(today, 6), to: endOfDay(now) };
    case 'this_month':
      return { from: startOfMonth(today), to: endOfDay(now) };
    case 'this_year':
      return { from: startOfYear(today), to: endOfDay(now) };
    case 'custom':
      return customDates || { from: today, to: endOfDay(now) };
    default:
      return { from: today, to: endOfDay(now) };
  }
};

const DateRangeFilter = ({ 
  selectedRange, 
  onRangeChange, 
  customDateRange,
  className,
  compact = false 
}: DateRangeFilterProps) => {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [tempFrom, setTempFrom] = useState<Date | undefined>(customDateRange?.from);
  const [tempTo, setTempTo] = useState<Date | undefined>(customDateRange?.to);

  const rangeOptions: { value: DateRangePreset; label_en: string; label_bn: string }[] = [
    { value: 'today', label_en: 'Today', label_bn: 'আজ' },
    { value: 'yesterday', label_en: 'Yesterday', label_bn: 'গতকাল' },
    { value: 'this_week', label_en: 'This Week', label_bn: 'এই সপ্তাহ' },
    { value: 'last_7_days', label_en: 'Last 7 Days', label_bn: 'গত ৭ দিন' },
    { value: 'this_month', label_en: 'This Month', label_bn: 'এই মাস' },
    { value: 'this_year', label_en: 'This Year', label_bn: 'এই বছর' },
    { value: 'custom', label_en: 'Custom Range', label_bn: 'কাস্টম তারিখ' },
  ];

  const getLabel = (value: DateRangePreset) => {
    const option = rangeOptions.find(opt => opt.value === value);
    return option ? (language === 'bn' ? option.label_bn : option.label_en) : '';
  };

  const handleSelect = (value: DateRangePreset) => {
    if (value === 'custom') {
      setShowCalendar(true);
    } else {
      const dates = getDateRangeFromPreset(value);
      onRangeChange(value, dates);
      setIsOpen(false);
      setShowCalendar(false);
    }
  };

  const handleApplyCustom = () => {
    if (tempFrom && tempTo) {
      const dates = { from: startOfDay(tempFrom), to: endOfDay(tempTo) };
      onRangeChange('custom', dates);
      setIsOpen(false);
      setShowCalendar(false);
    }
  };

  const getDisplayText = () => {
    if (selectedRange === 'custom' && customDateRange) {
      return `${format(customDateRange.from, 'dd/MM')} - ${format(customDateRange.to, 'dd/MM/yy')}`;
    }
    return getLabel(selectedRange);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className={cn("gap-1.5 bg-background border-border hover:bg-muted/50", className)}
        >
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span className={cn("font-medium", compact && "text-xs")}>{getDisplayText()}</span>
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 bg-background border-border z-[100] pointer-events-auto max-h-[85vh] overflow-auto" 
        align="end"
        sideOffset={4}
      >
        {!showCalendar ? (
          <div className="p-2 min-w-[160px]">
            {rangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm rounded-md transition-colors",
                  selectedRange === option.value
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {language === 'bn' ? option.label_bn : option.label_en}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-3 pointer-events-auto">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setShowCalendar(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← {language === 'bn' ? 'পিছনে' : 'Back'}
              </button>
              <span className="text-sm font-medium">
                {language === 'bn' ? 'তারিখ নির্বাচন' : 'Select Date Range'}
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pointer-events-auto">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block text-center">
                  {language === 'bn' ? 'শুরু' : 'From'}
                </label>
                <div className="pointer-events-auto">
                  <CalendarComponent
                    mode="single"
                    selected={tempFrom}
                    onSelect={(date) => setTempFrom(date)}
                    className="rounded-md border pointer-events-auto [&_button]:pointer-events-auto"
                    initialFocus
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block text-center">
                  {language === 'bn' ? 'শেষ' : 'To'}
                </label>
                <div className="pointer-events-auto">
                  <CalendarComponent
                    mode="single"
                    selected={tempTo}
                    onSelect={(date) => setTempTo(date)}
                    disabled={(date) => tempFrom ? date < tempFrom : false}
                    className="rounded-md border pointer-events-auto [&_button]:pointer-events-auto"
                  />
                </div>
              </div>
            </div>
            <Button
              onClick={handleApplyCustom}
              disabled={!tempFrom || !tempTo}
              className="w-full mt-3"
              size="sm"
            >
              {language === 'bn' ? 'প্রয়োগ করুন' : 'Apply Range'}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default DateRangeFilter;
