import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { LucideIcon } from "lucide-react";

interface BottomNavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  badge?: number;
}

interface ModernBottomNavProps {
  items: BottomNavItem[];
}

export function ModernBottomNav({ items }: ModernBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden p-3">
      <div className="bg-background/80 backdrop-blur-2xl border border-border/50 rounded-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] overflow-hidden">
        <div className="flex items-center justify-around py-2 px-1">
          {items.map(({ icon: Icon, label, path, badge }) => {
            const isActive = location.pathname === path;
            
            return (
              <button
                key={path}
                onClick={() => {
                  if (path === '/available-requests' || path === '/my-requests') {
                    setTimeout(() => navigate(path), 100);
                  } else {
                    navigate(path);
                  }
                }}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 px-4 rounded-xl transition-all duration-300",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Active indicator background */}
                {isActive && (
                  <div className="absolute inset-0 bg-primary/10 rounded-xl animate-scale-in" />
                )}
                
                {/* Icon with glow effect when active */}
                <div className="relative">
                  <Icon className={cn(
                    "h-5 w-5 transition-transform duration-300",
                    isActive && "scale-110"
                  )} />
                  {isActive && (
                    <div className="absolute inset-0 bg-primary/50 rounded-full blur-md animate-pulse" />
                  )}
                </div>
                
                {/* Label */}
                <span className={cn(
                  "text-[10px] font-medium transition-all duration-300",
                  isActive && "font-semibold"
                )}>
                  {label}
                </span>
                
                {/* Badge */}
                {badge && badge > 0 && (
                  <div className="absolute -top-0.5 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-lg animate-bounce-subtle">
                    {badge > 99 ? '99+' : badge}
                  </div>
                )}
                
                {/* Active dot indicator */}
                {isActive && (
                  <div className="absolute -bottom-0.5 w-1 h-1 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}