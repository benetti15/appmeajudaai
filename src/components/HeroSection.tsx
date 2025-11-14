import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Shield, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function HeroSection() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const handleGetStarted = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    const userType = profile?.user_type || 'client';
    if (userType === 'client') {
      navigate('/categories');
    } else {
      navigate('/available-requests');
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-accent/5 py-20 md:py-32">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/10 to-accent/10 rounded-full blur-3xl animate-spin-slow"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border-2 border-primary/20 shadow-lg animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Com assistente inteligente Toninho IA
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="block text-foreground mb-2">
              Encontre o profissional
            </span>
            <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              perfeito para você
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Conectamos você com profissionais verificados de forma rápida e segura. 
            Receba orçamentos, acompanhe em tempo real e avalie o serviço.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button 
              size="lg"
              onClick={handleGetStarted}
              className="group relative overflow-hidden bg-gradient-to-r from-primary to-accent text-white border-0 shadow-xl hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1 px-8 py-6 text-lg"
            >
              <span className="relative z-10 flex items-center gap-2">
                Começar Agora
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/categories')}
              className="px-8 py-6 text-lg border-2 hover:border-primary hover:bg-primary/5"
            >
              Ver Categorias
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-12 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Rápido</h3>
              <p className="text-sm text-muted-foreground">Orçamentos em minutos</p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground">Seguro</h3>
              <p className="text-sm text-muted-foreground">Profissionais verificados</p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-info" />
              </div>
              <h3 className="font-semibold text-foreground">Confiável</h3>
              <p className="text-sm text-muted-foreground">Avaliações reais</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
