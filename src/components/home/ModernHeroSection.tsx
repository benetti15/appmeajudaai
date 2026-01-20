import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, Star, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

// Import hero background images
import professional1 from "@/assets/hero/professional-1.jpg";
import professional2 from "@/assets/hero/professional-2.jpg";
import professional3 from "@/assets/hero/professional-3.jpg";
import professional4 from "@/assets/hero/professional-4.jpg";

const heroImages = [professional1, professional2, professional3, professional4];

export function ModernHeroSection() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [animatedStats, setAnimatedStats] = useState({ professionals: 0, services: 0, rating: 0 });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-rotate images every 20 seconds
  useEffect(() => {
    const imageTimer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 20000);
    
    return () => clearInterval(imageTimer);
  }, []);

  useEffect(() => {
    // Animate stats on mount
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setAnimatedStats({
        professionals: Math.floor(1250 * easeOut),
        services: Math.floor(8500 * easeOut),
        rating: Math.round(49 * easeOut) / 10
      });
      
      if (step >= steps) clearInterval(timer);
    }, interval);
    
    return () => clearInterval(timer);
  }, []);

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
    <section className="relative overflow-hidden py-16 md:py-24 min-h-[90vh] flex items-center">
      {/* Background Image Carousel */}
      <div className="absolute inset-0">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: currentImageIndex === index ? 1 : 0 }}
          >
            <img
              src={image}
              alt={`Profissional Me Ajuda AI ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        
        {/* Dark overlay for readability - reduced opacity for better image visibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/60 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-background/30" />
      </div>

      {/* Image indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentImageIndex === index 
                ? 'w-8 bg-primary' 
                : 'bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Top badge with gamification */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-background/80 backdrop-blur-xl border border-primary/20 shadow-lg animate-fade-in group hover:border-primary/40 transition-all cursor-default">
              <div className="relative">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                <div className="absolute inset-0 bg-primary/50 rounded-full blur-md animate-ping" />
              </div>
              <span className="text-sm font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Assistente Toninho IA • Disponível 24/7
              </span>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-green-600">Online</span>
              </div>
            </div>
          </div>

          {/* Main heading with modern typography */}
          <div className="text-center space-y-6 mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <span className="block text-foreground mb-2">
                Encontre o profissional
              </span>
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  perfeito para você
                </span>
                {/* Underline decoration */}
                <svg className="absolute -bottom-2 left-0 w-full h-3" viewBox="0 0 300 12" preserveAspectRatio="none">
                  <path 
                    d="M0 6 Q75 12, 150 6 T300 6" 
                    fill="none" 
                    stroke="url(#gradient)" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                    className="animate-draw"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(var(--accent))" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Conectamos você com profissionais verificados de forma <span className="font-semibold text-foreground">rápida</span> e <span className="font-semibold text-foreground">segura</span>. 
              Receba orçamentos, acompanhe em tempo real.
            </p>
          </div>

          {/* CTA Buttons with modern styling */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button 
              size="lg"
              onClick={handleGetStarted}
              className="group relative overflow-hidden bg-gradient-to-r from-primary to-accent text-white border-0 shadow-[0_8px_30px_hsl(var(--primary)/0.4)] hover:shadow-[0_12px_40px_hsl(var(--primary)/0.5)] transition-all duration-300 hover:-translate-y-1 px-8 py-6 text-lg rounded-2xl"
            >
              <span className="relative z-10 flex items-center gap-2 font-semibold">
                Encontrar Serviços
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/categories')}
              className="px-8 py-6 text-lg rounded-2xl border-2 border-border bg-background/80 backdrop-blur-sm hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
            >
              Ver Categorias
            </Button>
          </div>

          {/* Animated stats with gamification */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex flex-col items-center gap-3 p-6 rounded-2xl bg-background/80 backdrop-blur-xl border border-border/50 hover:border-primary/30 transition-all hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground tabular-nums">
                    {animatedStats.professionals.toLocaleString()}+
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">Profissionais</p>
                </div>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex flex-col items-center gap-3 p-6 rounded-2xl bg-background/80 backdrop-blur-xl border border-border/50 hover:border-accent/30 transition-all hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground tabular-nums">
                    {animatedStats.services.toLocaleString()}+
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">Serviços realizados</p>
                </div>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex flex-col items-center gap-3 p-6 rounded-2xl bg-background/80 backdrop-blur-xl border border-border/50 hover:border-yellow-500/30 transition-all hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Star className="w-7 h-7 text-white fill-white" />
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-3xl font-bold text-foreground tabular-nums">
                      {animatedStats.rating.toFixed(1)}
                    </p>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Avaliação média</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
