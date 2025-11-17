import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles, Lightbulb, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormAssistantProps {
  fieldName: string;
  value: string;
  context?: Record<string, any>;
}

export function FormAssistant({ fieldName, value, context }: FormAssistantProps) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [type, setType] = useState<'tip' | 'warning'>('tip');

  useEffect(() => {
    // Simple validation and suggestions logic
    if (fieldName === 'description' && value.length < 20 && value.length > 0) {
      setSuggestion('Adicione mais detalhes para profissionais enviarem orçamentos mais precisos');
      setType('tip');
    } else if (fieldName === 'urgency' && context?.urgency === 'high' && !value) {
      setSuggestion('Você marcou como urgente. Descreva bem o problema para obter respostas rápidas.');
      setType('warning');
    } else if (fieldName === 'title' && value.length < 10 && value.length > 0) {
      setSuggestion('Dica: Títulos descritivos atraem mais profissionais. Ex: "Vazamento na torneira da cozinha"');
      setType('tip');
    } else {
      setSuggestion(null);
    }
  }, [fieldName, value, context]);

  if (!suggestion) return null;

  return (
    <Card className={cn(
      "p-3 border-l-4",
      type === 'warning' ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20" : "border-primary bg-primary/5"
    )}>
      <div className="flex items-start gap-2">
        {type === 'warning' ? (
          <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        ) : (
          <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-1">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-xs font-semibold">Toninho sugere:</span>
          </div>
          <p className="text-xs text-muted-foreground">{suggestion}</p>
        </div>
      </div>
    </Card>
  );
}