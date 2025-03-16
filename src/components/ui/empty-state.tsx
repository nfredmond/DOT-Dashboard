import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  children?: ReactNode;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  secondaryAction,
  children
}: EmptyStateProps) {
  return (
    <Card className="border border-dashed">
      <CardContent className="pt-6 px-6 pb-8 flex flex-col items-center text-center">
        <div className="bg-primary/10 p-3 rounded-full mb-4">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          {description}
        </p>
        
        {children}
        
        {action && (
          <div className="flex flex-col md:flex-row gap-4">
            <Button 
              size="lg" 
              onClick={action.onClick}
            >
              {action.icon && (
                <action.icon className="h-4 w-4 mr-2" />
              )}
              {action.label}
            </Button>
            
            {secondaryAction && (
              <Button 
                size="lg"
                variant="outline"
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.icon && (
                  <secondaryAction.icon className="h-4 w-4 mr-2" />
                )}
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 