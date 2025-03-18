import React from 'react';
import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';

export interface StepProps {
  label: string;
  optional?: boolean;
  completed?: boolean;
  icon?: React.ReactNode;
}

export interface StepperProps {
  activeStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
  children: React.ReactElement<StepProps>[];
}

export const Step: React.FC<StepProps> = ({ 
  label, 
  optional = false, 
  _completed = false, 
  icon 
}) => {
  // This component doesn't render anything on its own
  // It's just used to provide props to the Stepper component
  return null;
};

export const Stepper: React.FC<StepperProps> = ({ 
  activeStep, 
  onStepClick, 
  className,
  children 
}) => {
  return (
    <div className={cn("flex w-full", className)}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) {
          return null;
        }

        const { label, optional, icon } = child.props;
        const isCompleted = index < activeStep;
        const isCurrent = index === activeStep;
        const isLast = index === children.length - 1;

        return (
          <div className="flex-1 relative" key={index}>
            <div className="flex items-center">
              {/* Step Circle */}
              <button
                type="button"
                className={cn(
                  "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-colors",
                  isCompleted ? "bg-primary border-primary text-primary-foreground" :
                  isCurrent ? "border-primary text-primary" :
                  "border-muted-foreground text-muted-foreground"
                )}
                onClick={() => onStepClick && onStepClick(index)}
                disabled={!onStepClick}
              >
                {isCompleted ? (
                  <CheckIcon className="h-4 w-4" />
                ) : icon || <span>{index + 1}</span>}
              </button>
              
              {/* Connector Line */}
              {!isLast && (
                <div 
                  className={cn(
                    "flex-1 h-0.5 mx-2", 
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
            
            {/* Step Label */}
            <div className="mt-2 text-center text-xs">
              <div 
                className={cn(
                  "font-medium",
                  isCurrent ? "text-primary" : 
                  isCompleted ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </div>
              {optional && (
                <div className="text-muted-foreground text-[10px]">
                  Optional
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}; 