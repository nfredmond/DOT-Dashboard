import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export default function Loading({ size = "md", text, className }: LoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <RefreshCw className={cn("animate-spin mr-2", sizeClasses[size])} />
      {text && <span>{text}</span>}
    </div>
  );
} 