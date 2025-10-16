import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Check, 
  Star, 
  Crown, 
  Zap, 
  Shield, 
  Headphones,
  TrendingUp,
  Users,
  MapPin,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  popular?: boolean;
  premium?: boolean;
  features: PlanFeature[];
  icon: React.ReactNode;
  buttonText: string;
  buttonVariant: "default" | "secondary" | "premium";
}

interface PaymentPlansProps {
  userType?: 'client' | 'professional';
  onPlanSelect?: (planId: string, isYearly: boolean) => void;
}

export function PaymentPlans({ userType = 'professional', onPlanSelect }: PaymentPlansProps) {
  const [isYearly, setIsYearly] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const professionalPlans: PaymentPlan[] = [
    {
      id: 'basic',
      name: 'Básico',
      description: 'Ideal para começar a oferecer seus serviços',
      monthlyPrice: 0,
      yearlyPrice: 0,
      icon: <Users className="h-6 w-6" />,
      buttonText: 'Começar Grátis',
      buttonVariant: 'secondary',
      features: [
        { text: 'Até 3 serviços cadastrados', included: true },
        { text: 'Perfil básico', included: true },
        { text: 'Chat com clientes', included: true },
        { text: 'Suporte por email', included: true },
        { text: 'Comissão de 15% por serviço', included: true, highlight: true },
        { text: 'Badge de verificação', included: false },
        { text: 'Destaque em buscas', included: false },
        { text: 'Suporte prioritário', included: false },
        { text: 'Analytics avançado', included: false }
      ]
    },
    {
      id: 'pro',
      name: 'Profissional',
      description: 'Para profissionais que querem crescer',
      monthlyPrice: 29.90,
      yearlyPrice: 299.90,
      popular: true,
      icon: <Star className="h-6 w-6" />,
      buttonText: 'Escolher Plano',
      buttonVariant: 'default',
      features: [
        { text: 'Serviços ilimitados', included: true },
        { text: 'Perfil premium', included: true },
        { text: 'Chat com clientes', included: true },
        { text: 'Badge de verificação', included: true },
        { text: 'Comissão de 10% por serviço', included: true, highlight: true },
        { text: 'Destaque em buscas', included: true },
        { text: 'Suporte prioritário', included: true },
        { text: 'Analytics básico', included: true },
        { text: 'Galeria de fotos', included: true }
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Para profissionais estabelecidos',
      monthlyPrice: 59.90,
      yearlyPrice: 599.90,
      premium: true,
      icon: <Crown className="h-6 w-6" />,
      buttonText: 'Escolher Premium',
      buttonVariant: 'premium',
      features: [
        { text: 'Todos os recursos do Profissional', included: true },
        { text: 'Comissão de 7% por serviço', included: true, highlight: true },
        { text: 'Posição prioritária em buscas', included: true },
        { text: 'Analytics avançado', included: true },
        { text: 'Suporte 24/7', included: true },
        { text: 'Badge Premium', included: true },
        { text: 'Agendamento automático', included: true },
        { text: 'Relatórios financeiros', included: true },
        { text: 'API para integração', included: true }
      ]
    }
  ];

  const clientPlans: PaymentPlan[] = [
    {
      id: 'basic',
      name: 'Gratuito',
      description: 'Para uso básico da plataforma',
      monthlyPrice: 0,
      yearlyPrice: 0,
      icon: <Users className="h-6 w-6" />,
      buttonText: 'Usar Grátis',
      buttonVariant: 'secondary',
      features: [
        { text: 'Buscar profissionais', included: true },
        { text: 'Solicitar até 3 orçamentos/mês', included: true },
        { text: 'Chat básico', included: true },
        { text: 'Avaliações e comentários', included: true },
        { text: 'Suporte por email', included: true },
        { text: 'Suporte prioritário', included: false },
        { text: 'Orçamentos ilimitados', included: false },
        { text: 'Filtros avançados', included: false }
      ]
    },
    {
      id: 'plus',
      name: 'Plus',
      description: 'Para quem precisa de mais flexibilidade',
      monthlyPrice: 14.90,
      yearlyPrice: 149.90,
      popular: true,
      icon: <Zap className="h-6 w-6" />,
      buttonText: 'Escolher Plus',
      buttonVariant: 'default',
      features: [
        { text: 'Todos os recursos gratuitos', included: true },
        { text: 'Orçamentos ilimitados', included: true },
        { text: 'Filtros avançados', included: true },
        { text: 'Suporte prioritário', included: true },
        { text: 'Histórico completo', included: true },
        { text: 'Chat premium', included: true },
        { text: 'Notificações em tempo real', included: true },
        { text: 'Badge de cliente verificado', included: true }
      ]
    }
  ];

  const plans = userType === 'professional' ? professionalPlans : clientPlans;

  const handlePlanSelect = (planId: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para escolher um plano.",
        variant: "destructive",
      });
      return;
    }

    if (planId === 'basic') {
      toast({
        title: "Plano ativado",
        description: "Você está usando o plano gratuito!",
      });
      return;
    }

    // Simulate payment process
    toast({
      title: "Redirecionando para pagamento",
      description: "Você será redirecionado para finalizar a assinatura.",
    });

    onPlanSelect?.(planId, isYearly);
  };

  const getButtonClasses = (variant: PaymentPlan['buttonVariant']) => {
    switch (variant) {
      case 'premium':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg';
      case 'default':
        return 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90';
      case 'secondary':
        return 'bg-muted hover:bg-muted/80 text-muted-foreground';
      default:
        return '';
    }
  };

  const getCardClasses = (plan: PaymentPlan) => {
    if (plan.premium) {
      return 'relative border-yellow-500/50 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 shadow-glow';
    }
    if (plan.popular) {
      return 'relative border-primary/50 bg-gradient-to-br from-primary/5 to-accent/5 shadow-glow';
    }
    return 'border-border/50';
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Escolha Seu Plano
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {userType === 'professional' 
            ? 'Encontre o plano ideal para expandir seus negócios e alcançar mais clientes'
            : 'Escolha o plano que melhor atende às suas necessidades de contratação'
          }
        </p>

        <div className="flex items-center justify-center gap-4">
          <span className={`text-sm ${!isYearly ? 'font-medium' : 'text-muted-foreground'}`}>
            Mensal
          </span>
          <Switch
            checked={isYearly}
            onCheckedChange={setIsYearly}
            className="data-[state=checked]:bg-primary"
          />
          <span className={`text-sm ${isYearly ? 'font-medium' : 'text-muted-foreground'}`}>
            Anual
          </span>
          {isYearly && (
            <Badge className="bg-green-100 text-green-700 border-green-200">
              Economize até 17%
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={getCardClasses(plan)}>
            {plan.popular && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  Mais Popular
                </Badge>
              </div>
            )}
            
            {plan.premium && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              </div>
            )}

            <CardHeader className="text-center space-y-4">
              <div className={`mx-auto p-3 rounded-full ${
                plan.premium ? 'bg-gradient-to-br from-yellow-100 to-orange-100' :
                plan.popular ? 'bg-primary/10' : 'bg-muted'
              }`}>
                {plan.icon}
              </div>
              
              <div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold">
                    R$ {isYearly ? plan.yearlyPrice.toFixed(2) : plan.monthlyPrice.toFixed(2)}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className="text-muted-foreground">
                      /{isYearly ? 'ano' : 'mês'}
                    </span>
                  )}
                </div>
                
                {isYearly && plan.monthlyPrice > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {(plan.yearlyPrice / 12).toFixed(2)}/mês quando cobrado anualmente
                  </p>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <Button
                className={`w-full ${getButtonClasses(plan.buttonVariant)}`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.buttonText}
              </Button>

              <div className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <div className="h-4 w-4 border border-muted-foreground/30 rounded-full mt-0.5 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${
                      feature.included ? 'text-foreground' : 'text-muted-foreground'
                    } ${feature.highlight ? 'font-medium text-primary' : ''}`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center p-6">
          <Shield className="h-8 w-8 mx-auto mb-3 text-primary" />
          <h4 className="font-semibold mb-2">Pagamento Seguro</h4>
          <p className="text-sm text-muted-foreground">
            Transações protegidas por criptografia SSL
          </p>
        </Card>
        
        <Card className="text-center p-6">
          <Headphones className="h-8 w-8 mx-auto mb-3 text-primary" />
          <h4 className="font-semibold mb-2">Suporte 24/7</h4>
          <p className="text-sm text-muted-foreground">
            Equipe disponível para ajudar sempre
          </p>
        </Card>
        
        <Card className="text-center p-6">
          <TrendingUp className="h-8 w-8 mx-auto mb-3 text-primary" />
          <h4 className="font-semibold mb-2">Sem Contrato</h4>
          <p className="text-sm text-muted-foreground">
            Cancele ou altere seu plano a qualquer momento
          </p>
        </Card>
        
        <Card className="text-center p-6">
          <Clock className="h-8 w-8 mx-auto mb-3 text-primary" />
          <h4 className="font-semibold mb-2">Teste Grátis</h4>
          <p className="text-sm text-muted-foreground">
            Experimente todos os recursos por 7 dias
          </p>
        </Card>
      </div>
    </div>
  );
}