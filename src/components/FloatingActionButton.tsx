import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MessageCircle, Heart, BarChart3 } from "lucide-react";

interface FloatingActionButtonProps {
  userType: "client" | "professional";
}

export const FloatingActionButton = ({ userType }: FloatingActionButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  
  const actions = userType === 'client' 
    ? [
        { icon: Plus, label: 'Nova Solicitação', path: '/categories' },
        { icon: MessageCircle, label: 'Mensagens', path: '/conversations' },
        { icon: Heart, label: 'Favoritos', path: '/favorites' }
      ]
    : [
        { icon: Search, label: 'Oportunidades', path: '/available-requests' },
        { icon: MessageCircle, label: 'Mensagens', path: '/conversations' },
        { icon: BarChart3, label: 'Dashboard', path: '/professional-dashboard' }
      ];
  
  return (
    <div className="fixed bottom-20 md:bottom-8 right-8 z-40">
      {/* Menu expansível */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 flex flex-col gap-3 mb-2 animate-slide-up">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsOpen(false);
                navigate(action.path);
              }}
              className="group flex items-center gap-3 bg-white/95 backdrop-blur-xl 
                         rounded-full px-4 py-3 shadow-xl hover:shadow-2xl
                         transition-all duration-300 hover:scale-105
                         border border-border/50 animate-bounce-in"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent 
                              flex items-center justify-center group-hover:rotate-12 transition-transform">
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium text-sm whitespace-nowrap pr-2 text-foreground">{action.label}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* Botão principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-accent
                   shadow-2xl hover:shadow-primary/50 
                   flex items-center justify-center
                   transition-all duration-300 hover:scale-110 active:scale-95
                   group relative overflow-hidden"
      >
        {/* Ripple effect */}
        <div className="absolute inset-0 bg-white/20 rounded-full scale-0 
                        group-active:scale-100 transition-transform duration-500"></div>
        
        <Plus className={`w-8 h-8 text-white transition-transform duration-300 
                         ${isOpen ? 'rotate-45' : 'rotate-0'}`} />
      </button>
      
      {/* Pulse ring */}
      {!isOpen && (
        <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping"></div>
      )}
    </div>
  );
};
