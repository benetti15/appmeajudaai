import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
  question: string;
  completed: boolean;
  answer?: string;
}

interface AssistedRequestModeProps {
  onComplete: (data: Record<string, any>) => void;
  onCancel: () => void;
  categoryName?: string;
}

export function AssistedRequestMode({ 
  onComplete, 
  onCancel,
  categoryName 
}: AssistedRequestModeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<Step[]>([
    {
      id: 'problem',
      label: 'Problema',
      question: `Qual é o problema que você precisa resolver${categoryName ? ` com ${categoryName}` : ''}?`,
      completed: false
    },
    {
      id: 'urgency',
      label: 'Urgência',
      question: 'Qual é a urgência deste serviço?',
      completed: false
    },
    {
      id: 'location',
      label: 'Local',
      question: 'Confirme o endereço onde o serviço será realizado',
      completed: false
    },
    {
      id: 'date',
      label: 'Data',
      question: 'Quando você precisa deste serviço?',
      completed: false
    }
  ]);

  const currentStepData = steps[currentStep];
  const progress = (steps.filter(s => s.completed).length / steps.length) * 100;

  const handleAnswer = (answer: string) => {
    const updatedSteps = [...steps];
    updatedSteps[currentStep] = {
      ...updatedSteps[currentStep],
      completed: true,
      answer
    };
    setSteps(updatedSteps);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // All steps completed
      const formData = steps.reduce((acc, step) => ({
        ...acc,
        [step.id]: step.answer
      }), {});
      onComplete(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Passo {currentStep + 1} de {steps.length}
          </span>
          <span className="font-medium">{Math.round(progress)}% completo</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
              step.completed 
                ? "bg-primary border-primary text-white"
                : index === currentStep
                  ? "border-primary text-primary"
                  : "border-muted text-muted-foreground"
            )}>
              {step.completed ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className="text-sm font-semibold">{index + 1}</span>
              )}
            </div>
            <span className={cn(
              "ml-2 text-xs font-medium hidden sm:block",
              step.completed || index === currentStep
                ? "text-foreground"
                : "text-muted-foreground"
            )}>
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className={cn(
                "w-12 h-0.5 mx-2",
                step.completed ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Current question card */}
      <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">Toninho pergunta:</h3>
            <p className="text-foreground">{currentStepData.question}</p>
          </div>
        </div>

        {/* Quick answer options based on step */}
        <div className="space-y-2">
          {currentStepData.id === 'urgency' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { value: 'low', label: 'Pode esperar', desc: 'Próximos 7 dias' },
                { value: 'medium', label: 'Normal', desc: '2-3 dias' },
                { value: 'high', label: 'Urgente', desc: 'Hoje ou amanhã' }
              ].map(option => (
                <Button
                  key={option.value}
                  variant="outline"
                  className="h-auto flex-col items-start p-4 hover:border-primary hover:bg-primary/5"
                  onClick={() => handleAnswer(option.value)}
                >
                  <span className="font-semibold">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.desc}</span>
                </Button>
              ))}
            </div>
          )}

          {currentStepData.id === 'date' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                'Hoje',
                'Amanhã',
                'Esta semana',
                'Próxima semana'
              ].map(option => (
                <Button
                  key={option}
                  variant="outline"
                  onClick={() => handleAnswer(option)}
                  className="hover:border-primary hover:bg-primary/5"
                >
                  {option}
                </Button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={currentStep === 0 ? onCancel : handleBack}
        >
          {currentStep === 0 ? 'Cancelar' : 'Voltar'}
        </Button>

        {currentStepData.id === 'problem' && (
          <Button
            onClick={() => handleAnswer('placeholder')}
            className="bg-gradient-to-r from-primary to-accent"
          >
            Continuar
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
