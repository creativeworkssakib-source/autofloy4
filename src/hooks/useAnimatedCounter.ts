import { useState, useEffect, useRef } from 'react';

interface UseAnimatedCounterOptions {
  duration?: number;
  startValue?: number;
  decimals?: number;
}

export const useAnimatedCounter = (
  targetValue: number,
  options: UseAnimatedCounterOptions = {}
) => {
  const { duration = 2000, startValue = 0, decimals = 0 } = options;
  const [currentValue, setCurrentValue] = useState(startValue);
  const startTime = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTime.current) {
        startTime.current = timestamp;
      }

      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      const value = startValue + (targetValue - startValue) * easeOutQuart;
      setCurrentValue(Number(value.toFixed(decimals)));

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };

    startTime.current = null;
    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [targetValue, duration, startValue, decimals]);

  return currentValue;
};
