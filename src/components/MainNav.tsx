import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Mic,
} from "lucide-react";

export function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <Link
        href="/dashboard"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        <Button variant="ghost" className="h-8 w-8 p-0 mr-2">
          <LayoutDashboard className="h-4 w-4" />
        </Button>
        Dashboard
      </Link>
      
      <Link
        href="/voice-demo"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        <Button variant="ghost" className="h-8 w-8 p-0 mr-2">
          <Mic className="h-4 w-4" />
        </Button>
        Voice Demo
      </Link>
    </nav>
  );
} 