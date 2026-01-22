import { CheckCircle, Circle, ArrowRight, Sparkles, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface CompletionStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  xpReward: number;
  action?: () => void;
  actionLabel?: string;
}

interface ProfileCompletionCardProps {
  steps: CompletionStep[];
  showRewards?: boolean;
}

export function ProfileCompletionCard({ steps, showRewards = true }: ProfileCompletionCardProps) {
  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;
  const earnedXp = steps.filter(s => s.completed).reduce((sum, s) => sum + s.xpReward, 0);
  const totalXp = steps.reduce((sum, s) => sum + s.xpReward, 0);
  const isComplete = completedCount === steps.length;

  return (
    <Card className={cn(
      "border-0 shadow-lg overflow-hidden transition-all",
      isComplete 
        ? "bg-gradient-to-br from-primary/10 via-background to-accent/10" 
        : "bg-card/50 backdrop-blur-sm"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className={cn(
              "w-5 h-5",
              isComplete ? "text-primary animate-pulse" : "text-muted-foreground"
            )} />
            {isComplete ? 'Perfil Completo!' : 'Complete seu Perfil'}
          </CardTitle>
          {showRewards && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Gift className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                {earnedXp}/{totalXp} XP
              </span>
            </div>
          )}
        </div>
        
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completedCount} de {steps.length} etapas
            </span>
            <span className={cn(
              "font-bold",
              progress === 100 ? "text-primary" : "text-foreground"
            )}>
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-700",
                progress === 100 
                  ? "bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient"
                  : "bg-gradient-to-r from-primary to-primary/80"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "group flex items-center gap-3 p-3 rounded-xl border transition-all",
                step.completed 
                  ? "bg-primary/5 border-primary/20" 
                  : "bg-muted/30 border-transparent hover:border-primary/30 hover:bg-muted/50"
              )}
            >
              {/* Step Number/Check */}
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                step.completed 
                  ? "bg-primary text-white" 
                  : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
              )}>
                {step.completed ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-medium",
                    step.completed ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                  {showRewards && !step.completed && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold">
                      +{step.xpReward} XP
                    </span>
                  )}
                </div>
                {!step.completed && (
                  <p className="text-xs text-muted-foreground truncate">
                    {step.description}
                  </p>
                )}
              </div>
              
              {/* Action */}
              {!step.completed && step.action && step.actionLabel && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={step.action}
                  className="flex-shrink-0 gap-1 text-xs text-primary hover:text-primary hover:bg-primary/10"
                >
                  {step.actionLabel}
                  <ArrowRight className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Celebration message */}
        {isComplete && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-2xl">🎉</span>
              <span className="font-bold text-primary">Parabéns!</span>
              <span className="text-2xl">🎉</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Seu perfil está 100% completo. Você está pronto para aproveitar todos os recursos!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
