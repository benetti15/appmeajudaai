import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: string;
  label: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function StepIndicator({ steps, currentStep, className = "" }: StepIndicatorProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Progress bar */}
      <div className="relative flex items-center justify-between mb-8">
        {/* Background line */}
        <div className="absolute top-5 left-0 w-full h-1 bg-muted -z-10" />
        
        {/* Active progress line */}
        <div
          className="absolute top-5 left-0 h-1 bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out -z-10"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />

        {/* Step circles */}
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center relative">
              {/* Circle */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 bg-background",
                  isCompleted && "border-primary bg-primary shadow-glow",
                  isCurrent && "border-accent bg-accent shadow-glow scale-110 animate-pulse-slow",
                  isUpcoming && "border-muted"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-primary-foreground animate-scale-in" />
                ) : (
                  <span
                    className={cn(
                      "text-sm font-bold",
                      isCurrent && "text-accent-foreground",
                      isUpcoming && "text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Label */}
              <div className="absolute top-12 text-center w-24">
                <p
                  className={cn(
                    "text-xs font-medium transition-colors",
                    (isCompleted || isCurrent) && "text-foreground",
                    isUpcoming && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
