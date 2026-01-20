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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md">
      {/* Floating particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <Card className="max-w-md w-full animate-scale-in relative overflow-hidden border-white/20 bg-background/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        {/* Gradient border effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 via-transparent to-accent/20 pointer-events-none" />
        
        {/* Shine effect */}
        <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_3s_infinite] pointer-events-none" />
        
        <CardContent className="p-6 relative z-10">
          {/* Step indicators with glow */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? "w-10 bg-gradient-to-r from-primary to-accent shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
                      : index < currentStep
                      ? "w-5 bg-primary/60"
                      : "w-5 bg-muted/50"
                  }`}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-white/10 transition-colors"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content with animations */}
          <div className="space-y-4 mb-8">
            <h3 className="text-2xl font-display font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              {step.title}
            </h3>
            <p className="text-muted-foreground leading-relaxed text-base">
              {step.description}
            </p>
          </div>

          {/* Modern buttons */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1 border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all"
              >
                Voltar
              </Button>
            )}
            
            {currentStep < steps.length - 1 ? (
              <Button 
                onClick={handleNext} 
                className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-[0_4px_20px_hsl(var(--primary)/0.4)] transition-all hover:shadow-[0_6px_25px_hsl(var(--primary)/0.5)] hover:scale-[1.02]"
              >
                Próximo
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleComplete} 
                className="flex-1 gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 shadow-[0_4px_20px_rgba(34,197,94,0.4)] transition-all hover:shadow-[0_6px_25px_rgba(34,197,94,0.5)] hover:scale-[1.02]"
              >
                <Check className="h-4 w-4" />
                Começar
              </Button>
            )}
          </div>

          {currentStep === 0 && (
            <button
              onClick={handleSkip}
              className="w-full mt-5 text-sm text-muted-foreground/70 hover:text-foreground transition-all hover:underline underline-offset-4"
            >
              Pular tutorial
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
