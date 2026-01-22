import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExtendedServiceStatus, TIMELINE_STEPS, STATUS_CONFIG } from "./types";

interface ServiceTimelineProps {
  currentStatus: ExtendedServiceStatus;
  userRole: 'client' | 'professional';
  timestamps?: Record<string, string>;
  className?: string;
  compact?: boolean;
}

export function ServiceTimeline({ 
  currentStatus, 
  userRole, 
  timestamps = {},
  className,
  compact = false
}: ServiceTimelineProps) {
  const currentIndex = TIMELINE_STEPS.findIndex(s => s.status === currentStatus);
  
  // Handle exception states - show where we were when exception occurred
  const isExceptionState = currentStatus.includes('cancelled') || 
    currentStatus === 'client_absent' || 
    currentStatus === 'disputed' || 
    currentStatus === 'payment_failed' ||
    currentStatus === 'reschedule_requested';
  
  const getStepStatus = (index: number): 'completed' | 'current' | 'upcoming' => {
    if (currentIndex === -1) {
      // If current status is not in main timeline, we're likely in an exception state
      // Find the closest completed step
      return 'upcoming';
    }
    
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'upcoming';
  };
  
  const formatTimestamp = (status: ExtendedServiceStatus) => {
    const timestamp = timestamps[status];
    if (!timestamp) return null;
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {TIMELINE_STEPS.map((step, index) => {
          const stepStatus = getStepStatus(index);
          return (
            <div 
              key={step.status}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                stepStatus === 'completed' && "bg-green-500",
                stepStatus === 'current' && "bg-primary animate-pulse",
                stepStatus === 'upcoming' && "bg-muted"
              )}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {/* Progress Bar */}
      <div className="flex items-center gap-1 mb-4">
        {TIMELINE_STEPS.map((step, index) => {
          const stepStatus = getStepStatus(index);
          return (
            <div 
              key={step.status}
              className={cn(
                "h-2 flex-1 rounded-full transition-colors",
                stepStatus === 'completed' && "bg-green-500",
                stepStatus === 'current' && "bg-primary",
                stepStatus === 'upcoming' && "bg-muted"
              )}
            />
          );
        })}
      </div>
      
      {/* Exception Banner */}
      {isExceptionState && (
        <div className={cn(
          "p-3 rounded-lg border mb-4",
          STATUS_CONFIG[currentStatus].bgColor
        )}>
          <p className={cn("text-sm font-medium", STATUS_CONFIG[currentStatus].color)}>
            {STATUS_CONFIG[currentStatus].label}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {userRole === 'client' 
              ? STATUS_CONFIG[currentStatus].clientMessage 
              : STATUS_CONFIG[currentStatus].professionalMessage
            }
          </p>
        </div>
      )}
      
      {/* Timeline Steps */}
      <div className="space-y-0">
        {TIMELINE_STEPS.map((step, index) => {
          const stepStatus = getStepStatus(index);
          const time = formatTimestamp(step.status);
          
          return (
            <div key={step.status} className="flex items-start gap-3">
              {/* Line + Icon */}
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors",
                  stepStatus === 'completed' && "bg-green-100 text-green-600",
                  stepStatus === 'current' && "bg-primary text-primary-foreground",
                  stepStatus === 'upcoming' && "bg-muted text-muted-foreground"
                )}>
                  {stepStatus === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                  {stepStatus === 'current' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {stepStatus === 'upcoming' && <Circle className="w-3 h-3" />}
                </div>
                {index < TIMELINE_STEPS.length - 1 && (
                  <div className={cn(
                    "w-0.5 h-8 transition-colors",
                    stepStatus === 'completed' ? "bg-green-300" : "bg-muted"
                  )} />
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0 pb-6">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn(
                    "text-sm font-medium",
                    stepStatus === 'completed' && "text-green-700",
                    stepStatus === 'current' && "text-foreground",
                    stepStatus === 'upcoming' && "text-muted-foreground"
                  )}>
                    {step.label}
                  </p>
                  {time && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {time}
                    </span>
                  )}
                </div>
                {stepStatus === 'current' && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {userRole === 'client' 
                      ? STATUS_CONFIG[step.status].clientMessage 
                      : STATUS_CONFIG[step.status].professionalMessage
                    }
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
