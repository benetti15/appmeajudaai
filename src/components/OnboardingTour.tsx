import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface OnboardingStep {
  title: string;
  description: string;
  action?: string;
  actionLabel?: string;
}

export function OnboardingTour() {
  const { profile } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const clientSteps: OnboardingStep[] = [
    {
      title: "Bem-vindo ao Me Ajuda ai! 👋",
      description: "Aqui você encontra profissionais qualificados para qualquer serviço. Vamos fazer um tour rápido?",
    },
    {
      title: "1. Crie uma Solicitação",
      description: "Descreva o serviço que você precisa, adicione fotos se quiser, e aguarde orçamentos de profissionais qualificados.",
      action: "/categories",
      actionLabel: "Ver Categorias"
    },
    {
      title: "2. Compare Orçamentos",
      description: "Você receberá vários orçamentos. Compare preços, avaliações e escolha o melhor profissional para você.",
    },
    {
      title: "3. Acompanhe Tudo",
      description: "Após aceitar um orçamento, acompanhe o progresso do serviço em tempo real e comunique-se com o profissional.",
      action: "/track-requests",
      actionLabel: "Ver Acompanhamento"
    },
  ];

  const professionalSteps: OnboardingStep[] = [
    {
      title: "Bem-vindo ao Me Ajuda ai! 👋",
      description: "Conecte-se com clientes que precisam dos seus serviços. Vamos fazer um tour rápido?",
    },
    {
      title: "1. Configure seu Perfil",
      description: "Complete seu perfil com suas especialidades, experiência e portfólio para atrair mais clientes.",
      action: "/professional-profile",
      actionLabel: "Ir para Perfil"
    },
    {
      title: "2. Encontre Oportunidades",
      description: "Veja solicitações de serviço na sua área e envie orçamentos competitivos para conseguir novos trabalhos.",
      action: "/available-requests",
      actionLabel: "Ver Oportunidades"
    },
    {
      title: "3. Gerencie Seus Serviços",
      description: "Acompanhe todos os serviços aceitos, atualize o status e comunique-se com os clientes.",
      action: "/my-services-new",
      actionLabel: "Ver Meus Serviços"
    },
  ];

  const steps = profile?.user_type === "professional" ? professionalSteps : clientSteps;

  useEffect(() => {
    // Check if user has seen the onboarding
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeenOnboarding) {
      setIsVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setIsVisible(false);
  };

  const handleComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <Card className="max-w-md w-full animate-scale-in shadow-2xl">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentStep
                      ? "w-8 bg-primary"
                      : index < currentStep
                      ? "w-4 bg-primary/50"
                      : "w-4 bg-muted"
                  }`}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4 mb-6">
            <h3 className="text-2xl font-bold">{step.title}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1"
              >
                Voltar
              </Button>
            )}
            
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext} className="flex-1 gap-2">
                Próximo
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} className="flex-1 gap-2">
                <Check className="h-4 w-4" />
                Começar
              </Button>
            )}
          </div>

          {currentStep === 0 && (
            <button
              onClick={handleSkip}
              className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pular tutorial
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
