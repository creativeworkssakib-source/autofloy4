import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

export type DateRangeOption = 'today' | 'yesterday' | 'this_week' | 'last_7_days' | 'this_month' | 'this_year' | 'custom';

interface DateRangeSelectorProps {
  selectedRange: DateRangeOption;
  onRangeChange: (range: DateRangeOption, customDates?: { from: Date; to: Date }) => void;
  customDateRange?: { from: Date; to: Date };
}

const rangeOptions: { value: DateRangeOption; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

const DateRangeSelector = ({ selectedRange, onRangeChange, customDateRange }: DateRangeSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [tempFrom, setTempFrom] = useState<Date | undefined>(customDateRange?.from);
  const [tempTo, setTempTo] = useState<Date | undefined>(customDateRange?.to);

  const selectedLabel = rangeOptions.find(opt => opt.value === selectedRange)?.label || 'Select Range';

  const handleSelect = (value: DateRangeOption) => {
    if (value === 'custom') {
      setShowCalendar(true);
    } else {
      onRangeChange(value);
      setIsOpen(false);
      setShowCalendar(false);
    }
  };

  const handleApplyCustom = () => {
    if (tempFrom && tempTo) {
      onRangeChange('custom', { from: tempFrom, to: tempTo });
      setIsOpen(false);
      setShowCalendar(false);
    }
  };

  const getDisplayText = () => {
    if (selectedRange === 'custom' && customDateRange) {
      return `${format(customDateRange.from, 'MMM d')} - ${format(customDateRange.to, 'MMM d, yyyy')}`;
    }
    return selectedLabel;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 bg-background border-border hover:bg-muted/50"
        >
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-medium">{getDisplayText()}</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-background border-border" align="start">
        <AnimatePresence mode="wait">
          {!showCalendar ? (
            <motion.div
              key="options"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="p-2 min-w-[160px]"
            >
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
                  {option.label}
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="p-3"
            >
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setShowCalendar(false)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Back
                </button>
                <span className="text-sm font-medium">Select Date Range</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">From</label>
                  <CalendarComponent
                    mode="single"
                    selected={tempFrom}
                    onSelect={setTempFrom}
                    className="rounded-md border pointer-events-auto"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">To</label>
                  <CalendarComponent
                    mode="single"
                    selected={tempTo}
                    onSelect={setTempTo}
                    disabled={(date) => tempFrom ? date < tempFrom : false}
                    className="rounded-md border pointer-events-auto"
                  />
                </div>
                <Button
                  onClick={handleApplyCustom}
                  disabled={!tempFrom || !tempTo}
                  className="w-full"
                >
                  Apply Range
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangeSelector;
