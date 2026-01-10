import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { differenceInSeconds } from "date-fns";

interface TrialCountdownProps {
  trialEndDate: string;
}

const TrialCountdown = ({ trialEndDate }: TrialCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const endDate = new Date(trialEndDate);
      const now = new Date();
      const totalSeconds = differenceInSeconds(endDate, now);

      if (totalSeconds <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, expired: true };
      }

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return { hours, minutes, seconds, expired: false };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [trialEndDate]);

  if (timeLeft.expired) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
        <Clock className="w-4 h-4 text-destructive" />
        <span className="text-sm font-medium text-destructive">Trial Expired</span>
      </div>
    );
  }

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        <span>Trial ends in:</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="flex flex-col items-center px-2 py-1.5 rounded-md bg-primary/10 min-w-[40px]">
          <span className="text-lg font-bold text-primary leading-none">{formatNumber(timeLeft.hours)}</span>
          <span className="text-[9px] text-muted-foreground uppercase">hrs</span>
        </div>
        <span className="text-primary font-bold">:</span>
        <div className="flex flex-col items-center px-2 py-1.5 rounded-md bg-primary/10 min-w-[40px]">
          <span className="text-lg font-bold text-primary leading-none">{formatNumber(timeLeft.minutes)}</span>
          <span className="text-[9px] text-muted-foreground uppercase">min</span>
        </div>
        <span className="text-primary font-bold">:</span>
        <div className="flex flex-col items-center px-2 py-1.5 rounded-md bg-primary/10 min-w-[40px]">
          <span className="text-lg font-bold text-primary leading-none">{formatNumber(timeLeft.seconds)}</span>
          <span className="text-[9px] text-muted-foreground uppercase">sec</span>
        </div>
      </div>
    </div>
  );
};

export default TrialCountdown;
