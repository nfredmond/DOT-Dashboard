'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedProgressProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
  showLabel?: boolean;
  animationDuration?: number;
  delay?: number;
}

export function AnimatedProgress({
  value,
  className,
  indicatorClassName,
  showLabel = false,
  animationDuration = 1000,
  delay = 100
}: AnimatedProgressProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    const progressTimer = setTimeout(() => {
      setProgress(Math.min(100, Math.max(0, value)));
    }, delay + 50);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(progressTimer);
    };
  }, [value, delay]);

  const getColorClass = (val: number) => {
    if (val >= 90) return 'bg-gradient-to-r from-green-500 to-green-600';
    if (val >= 70) return 'bg-gradient-to-r from-blue-500 to-blue-600';
    if (val >= 50) return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  };

  return (
    <div className={cn('relative w-full overflow-hidden rounded-full bg-secondary', className)}>
      <div
        className={cn(
          'h-full transition-all ease-out relative overflow-hidden',
          getColorClass(value),
          indicatorClassName,
          isVisible ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          width: `${progress}%`,
          transitionDuration: `${animationDuration}ms`
        }}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>
      
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-foreground/70">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  );
}

// Also create a circular progress variant
export function AnimatedCircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  className,
  showLabel = true,
  animationDuration = 1000,
  delay = 100
}: AnimatedProgressProps & { size?: number; strokeWidth?: number }) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    const progressTimer = setTimeout(() => {
      setProgress(Math.min(100, Math.max(0, value)));
    }, delay + 50);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(progressTimer);
    };
  }, [value, delay]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const getColorClass = (val: number) => {
    if (val >= 90) return 'text-green-500';
    if (val >= 70) return 'text-blue-500';
    if (val >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className={cn('relative inline-flex', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-secondary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            'transition-all ease-out',
            getColorClass(value),
            isVisible ? 'opacity-100' : 'opacity-0'
          )}
          style={{
            transitionDuration: `${animationDuration}ms`
          }}
        />
      </svg>
      
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className={cn('text-2xl font-bold', getColorClass(value))}>
              {Math.round(progress)}
            </span>
            <span className="text-xs text-muted-foreground block">/ 100</span>
          </div>
        </div>
      )}
    </div>
  );
} 