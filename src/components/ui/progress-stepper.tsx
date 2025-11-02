import { CheckCircle, Circle } from "lucide-react";
import { Progress } from "./progress";

interface Step {
  id: string;
  label: string;
  completed: boolean;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function ProgressStepper({ steps, currentStep, className = "" }: ProgressStepperProps) {
  const progress = (currentStep / steps.length) * 100;
  const completedSteps = steps.filter(s => s.completed).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            Progresso do Perfil
          </span>
          <span className="text-muted-foreground">
            {completedSteps} de {steps.length} etapas
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Steps Indicators - Hidden on mobile, visible on desktop */}
      <div className="hidden md:flex items-center justify-between gap-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-2 flex-1">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`
                  flex items-center justify-center rounded-full transition-all
                  ${step.completed 
                    ? 'bg-primary text-primary-foreground' 
                    : index === currentStep 
                    ? 'bg-primary/20 text-primary border-2 border-primary' 
                    : 'bg-muted text-muted-foreground'
                  }
                  w-8 h-8
                `}
              >
                {step.completed ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </div>
              <span
                className={`
                  text-xs text-center
                  ${step.completed || index === currentStep 
                    ? 'text-foreground font-medium' 
                    : 'text-muted-foreground'
                  }
                `}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`
                  h-0.5 flex-1 transition-colors
                  ${step.completed ? 'bg-primary' : 'bg-muted'}
                `}
              />
            )}
          </div>
        ))}
      </div>

      {/* Mobile: Simple Progress Text */}
      <div className="md:hidden text-center">
        <p className="text-sm text-muted-foreground">
          Etapa {currentStep + 1}: <span className="font-medium text-foreground">{steps[currentStep]?.label}</span>
        </p>
      </div>
    </div>
  );
}
