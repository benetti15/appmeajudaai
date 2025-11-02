import { CheckCircle, Circle, ArrowRight } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Progress } from "./progress";
import { useNavigate } from "react-router-dom";

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  action?: () => void;
  actionLabel?: string;
}

interface ProfileCompletionChecklistProps {
  items: ChecklistItem[];
  title?: string;
  description?: string;
}

export function ProfileCompletionChecklist({
  items,
  title = "Complete seu Perfil",
  description = "Complete as etapas abaixo para aumentar suas oportunidades"
}: ProfileCompletionChecklistProps) {
  const navigate = useNavigate();
  const completedCount = items.filter(item => item.completed).length;
  const progress = (completedCount / items.length) * 100;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {completedCount}/{items.length}
          </span>
        </CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />
        
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`
                flex items-center justify-between p-3 rounded-lg border-2 transition-all
                ${item.completed 
                  ? 'bg-primary/5 border-primary/20' 
                  : 'bg-muted/30 border-muted hover:border-primary/30'
                }
              `}
            >
              <div className="flex items-center gap-3">
                {item.completed ? (
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    item.completed ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </span>
              </div>
              
              {!item.completed && item.action && item.actionLabel && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={item.action}
                  className="gap-1 text-xs"
                >
                  {item.actionLabel}
                  <ArrowRight className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {progress === 100 && (
          <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-primary">
              🎉 Parabéns! Seu perfil está completo!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
