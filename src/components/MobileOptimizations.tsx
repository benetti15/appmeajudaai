import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu, ArrowLeft, Home, MessageCircle, User, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Mobile Navigation Component
interface MobileNavProps {
  children: React.ReactNode;
}

export const MobileNav = ({ children }: MobileNavProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Mobile Bottom Navigation
interface BottomNavItem {
  icon: React.ComponentType<any>;
  label: string;
  path: string;
  badge?: number;
}

interface MobileBottomNavProps {
  items: BottomNavItem[];
}

export const MobileBottomNav = ({ items }: MobileBottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-border z-50 md:hidden">
      <div className="flex items-center justify-around py-2">
        {items.map(({ icon: Icon, label, path, badge }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors relative",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
              {badge && badge > 0 && (
                <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {badge > 99 ? '99+' : badge}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Mobile Header with back button
interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export const MobileHeader = ({ title, showBack = true, rightAction }: MobileHeaderProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-border md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>
        {rightAction && (
          <div className="flex items-center gap-2">
            {rightAction}
          </div>
        )}
      </div>
    </div>
  );
};

// Touch gesture hook
interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export const useSwipeGesture = (options: UseSwipeGestureOptions) => {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const threshold = options.threshold || 50;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (Math.max(absDeltaX, absDeltaY) < threshold) return;

    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (deltaX > 0) {
        options.onSwipeRight?.();
      } else {
        options.onSwipeLeft?.();
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        options.onSwipeDown?.();
      } else {
        options.onSwipeUp?.();
      }
    }

    touchStartRef.current = null;
  }, [options, threshold]);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
};

// Pull to refresh component
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
}

export const PullToRefresh = ({ onRefresh, children, disabled = false }: PullToRefreshProps) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef<number>(0);
  const isMobile = useIsMobile();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || !isMobile) return;
    touchStartY.current = e.touches[0].clientY;
  }, [disabled, isMobile]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || !isMobile || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStartY.current;
    
    if (distance > 0 && window.scrollY === 0) {
      setIsPulling(true);
      setPullDistance(Math.min(distance * 0.5, 100));
    }
  }, [disabled, isMobile, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || !isMobile || isRefreshing) return;
    
    if (pullDistance > 60) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setIsPulling(false);
    setPullDistance(0);
  }, [disabled, isMobile, isRefreshing, pullDistance, onRefresh]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {(isPulling || isRefreshing) && (
        <div 
          className="absolute top-0 left-0 right-0 bg-primary/10 flex items-center justify-center transition-all duration-200 z-10"
          style={{ 
            height: `${pullDistance}px`,
            transform: `translateY(-${Math.max(0, pullDistance - 60)}px)`
          }}
        >
          <div className="text-primary text-sm font-medium">
            {isRefreshing ? 'Atualizando...' : pullDistance > 60 ? 'Solte para atualizar' : 'Puxe para atualizar'}
          </div>
        </div>
      )}
      <div style={{ transform: `translateY(${Math.max(0, pullDistance * 0.3)}px)` }}>
        {children}
      </div>
    </div>
  );
};

// Mobile-optimized card component
interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  touchable?: boolean;
  onClick?: () => void;
}

export const MobileCard = ({ children, className, touchable = false, onClick }: MobileCardProps) => {
  const isMobile = useIsMobile();

  return (
    <Card 
      className={cn(
        "transition-all duration-200",
        isMobile && touchable && "active:scale-95 active:bg-muted/50",
        touchable && "cursor-pointer hover:shadow-md",
        className
      )}
      onClick={onClick}
    >
      {children}
    </Card>
  );
};

// Responsive grid component
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  className?: string;
}

export const ResponsiveGrid = ({ 
  children, 
  cols = { xs: 1, sm: 2, md: 3, lg: 4 }, 
  className 
}: ResponsiveGridProps) => {
  const gridClasses = [
    cols.xs && `grid-cols-${cols.xs}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ].filter(Boolean).join(' ');

  return (
    <div className={cn("grid gap-4", gridClasses, className)}>
      {children}
    </div>
  );
};