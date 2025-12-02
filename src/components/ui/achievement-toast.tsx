import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Trophy, 
  Star, 
  Shield, 
  Award, 
  Sparkles, 
  CheckCircle2,
  Camera,
  FileCheck,
  MapPin,
  Phone,
  User,
  Briefcase,
  Medal
} from "lucide-react";

type AchievementType = 
  | "profile_photo"
  | "phone_verified"
  | "cpf_verified"
  | "address_complete"
  | "specialty_added"
  | "first_specialty"
  | "document_uploaded"
  | "document_approved"
  | "bronze_level"
  | "silver_level"
  | "gold_level"
  | "profile_complete"
  | "generic";

interface AchievementConfig {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  bgGradient: string;
  points?: number;
}

const ACHIEVEMENT_CONFIG: Record<AchievementType, AchievementConfig> = {
  profile_photo: {
    icon: Camera,
    title: "Foto Adicionada!",
    description: "Sua foto de perfil aumenta a confiança dos clientes",
    color: "text-blue-500",
    bgGradient: "from-blue-500/20 to-blue-600/10",
    points: 10,
  },
  phone_verified: {
    icon: Phone,
    title: "Telefone Verificado!",
    description: "Os clientes agora podem entrar em contato",
    color: "text-green-500",
    bgGradient: "from-green-500/20 to-green-600/10",
    points: 15,
  },
  cpf_verified: {
    icon: Shield,
    title: "CPF Validado!",
    description: "Sua identidade foi confirmada com sucesso",
    color: "text-purple-500",
    bgGradient: "from-purple-500/20 to-purple-600/10",
    points: 20,
  },
  address_complete: {
    icon: MapPin,
    title: "Endereço Completo!",
    description: "Clientes próximos podem te encontrar agora",
    color: "text-orange-500",
    bgGradient: "from-orange-500/20 to-orange-600/10",
    points: 10,
  },
  specialty_added: {
    icon: Briefcase,
    title: "Especialidade Adicionada!",
    description: "Mais serviços para oferecer aos clientes",
    color: "text-cyan-500",
    bgGradient: "from-cyan-500/20 to-cyan-600/10",
    points: 15,
  },
  first_specialty: {
    icon: Star,
    title: "Primeira Especialidade!",
    description: "Você deu o primeiro passo como profissional",
    color: "text-yellow-500",
    bgGradient: "from-yellow-500/20 to-yellow-600/10",
    points: 25,
  },
  document_uploaded: {
    icon: FileCheck,
    title: "Documento Enviado!",
    description: "Em análise para verificação",
    color: "text-indigo-500",
    bgGradient: "from-indigo-500/20 to-indigo-600/10",
    points: 10,
  },
  document_approved: {
    icon: CheckCircle2,
    title: "Documento Aprovado!",
    description: "Verificação concluída com sucesso",
    color: "text-emerald-500",
    bgGradient: "from-emerald-500/20 to-emerald-600/10",
    points: 30,
  },
  bronze_level: {
    icon: Medal,
    title: "Nível Bronze Alcançado!",
    description: "Você completou o perfil básico",
    color: "text-amber-600",
    bgGradient: "from-amber-600/20 to-amber-700/10",
    points: 50,
  },
  silver_level: {
    icon: Award,
    title: "Nível Prata Desbloqueado!",
    description: "Identidade verificada - mais visibilidade!",
    color: "text-slate-400",
    bgGradient: "from-slate-400/20 to-slate-500/10",
    points: 100,
  },
  gold_level: {
    icon: Trophy,
    title: "Nível Ouro Conquistado!",
    description: "Verificação completa - máxima confiança!",
    color: "text-yellow-500",
    bgGradient: "from-yellow-500/20 to-yellow-600/10",
    points: 200,
  },
  profile_complete: {
    icon: Sparkles,
    title: "Perfil 100% Completo!",
    description: "Você está pronto para receber clientes",
    color: "text-primary",
    bgGradient: "from-primary/20 to-primary/10",
    points: 150,
  },
  generic: {
    icon: CheckCircle2,
    title: "Conquista Desbloqueada!",
    description: "Continue evoluindo seu perfil",
    color: "text-primary",
    bgGradient: "from-primary/20 to-primary/10",
  },
};

interface AchievementToastProps {
  type: AchievementType;
  isVisible: boolean;
  onClose: () => void;
  customTitle?: string;
  customDescription?: string;
}

export function AchievementToast({ 
  type, 
  isVisible, 
  onClose,
  customTitle,
  customDescription 
}: AchievementToastProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const config = ACHIEVEMENT_CONFIG[type];
  const Icon = config.icon;

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(onClose, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible && !isAnimating) return null;

  return (
    <div 
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-[101] transition-all duration-500",
        isAnimating ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full"
      )}
    >
      <div 
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl",
          "min-w-[320px] max-w-[400px]"
        )}
      >
        {/* Background gradient */}
        <div className={cn("absolute inset-0 bg-gradient-to-r opacity-50", config.bgGradient)} />
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        
        <div className="relative p-4 flex items-center gap-4">
          {/* Icon with glow */}
          <div className={cn(
            "relative flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center",
            "bg-gradient-to-br from-background to-muted border border-border/50",
            "animate-bounce-subtle"
          )}>
            <div className={cn("absolute inset-0 rounded-xl blur-lg opacity-50", config.color.replace("text-", "bg-"))} />
            <Icon className={cn("w-7 h-7 relative z-10", config.color)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-foreground truncate">
                {customTitle || config.title}
              </h4>
              {config.points && (
                <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold">
                  +{config.points} pts
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {customDescription || config.description}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div 
            className={cn("h-full bg-gradient-to-r", config.bgGradient.replace("/20", "").replace("/10", ""))}
            style={{
              animation: "shrink 4s linear forwards",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Hook for easy usage
export function useAchievementToast() {
  const [toast, setToast] = useState<{
    type: AchievementType;
    customTitle?: string;
    customDescription?: string;
  } | null>(null);

  const showAchievement = (
    type: AchievementType, 
    customTitle?: string, 
    customDescription?: string
  ) => {
    setToast({ type, customTitle, customDescription });
  };

  const hideAchievement = () => setToast(null);

  return {
    toast,
    showAchievement,
    hideAchievement,
    AchievementToastComponent: toast ? (
      <AchievementToast
        type={toast.type}
        isVisible={!!toast}
        onClose={hideAchievement}
        customTitle={toast.customTitle}
        customDescription={toast.customDescription}
      />
    ) : null,
  };
}
