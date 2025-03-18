import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
  size?: "small" | "default" | "large";
}

export function Spinner({ className, size = "default" }: SpinnerProps) {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-6 w-6",
    large: "h-8 w-8",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClasses[size],
        className
      )}
    />
  );
} 