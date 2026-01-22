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
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden px-3 pb-3">
      <div className="bg-background border border-border rounded-2xl shadow-lg overflow-hidden">
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
                  "relative flex flex-col items-center gap-1 py-2.5 px-4 rounded-xl transition-all duration-200",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Active indicator background */}
                {isActive && (
                  <div className="absolute inset-0 bg-secondary rounded-xl" />
                )}
                
                {/* Icon */}
                <div className="relative z-10">
                  <Icon className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                </div>
                
                {/* Label */}
                <span className={cn(
                  "relative z-10 text-[10px] font-medium transition-all duration-200",
                  isActive && "font-semibold"
                )}>
                  {label}
                </span>
                
                {/* Badge */}
                {badge && badge > 0 && (
                  <div className="absolute -top-0.5 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full shadow-sm">
                    {badge > 99 ? '99+' : badge}
                  </div>
                )}
                
                {/* Active dot indicator */}
                {isActive && (
                  <div className="absolute -bottom-0.5 w-1 h-1 bg-primary rounded-full z-10" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}