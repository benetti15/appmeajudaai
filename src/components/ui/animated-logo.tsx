import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface AnimatedLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showIcon?: boolean;
  variant?: "default" | "white" | "minimal";
  className?: string;
  animated?: boolean;
}

export function AnimatedLogo({ 
  size = "md", 
  showIcon = true, 
  variant = "default",
  className,
  animated = true
}: AnimatedLogoProps) {
  const [scanIndex, setScanIndex] = useState(-1);
  const [glowPulse, setGlowPulse] = useState(false);
  
  const letters = "ME AJUDA".split("");
  
  useEffect(() => {
    if (!animated) return;
    
    // Letter scan animation every 4 seconds
    const scanInterval = setInterval(() => {
      let index = 0;
      const letterInterval = setInterval(() => {
        setScanIndex(index);
        index++;
        if (index > letters.length) {
          clearInterval(letterInterval);
          setScanIndex(-1);
        }
      }, 80);
    }, 4000);
    
    // AI glow pulse
    const glowInterval = setInterval(() => {
      setGlowPulse(true);
      setTimeout(() => setGlowPulse(false), 1500);
    }, 3000);
    
    // Initial animation
    setTimeout(() => {
      let index = 0;
      const letterInterval = setInterval(() => {
        setScanIndex(index);
        index++;
        if (index > letters.length) {
          clearInterval(letterInterval);
          setScanIndex(-1);
        }
      }, 80);
    }, 500);
    
    return () => {
      clearInterval(scanInterval);
      clearInterval(glowInterval);
    };
  }, [animated, letters.length]);
  
  const sizeClasses = {
    sm: {
      icon: "w-6 h-6",
      text: "text-base",
      ai: "text-base",
      gap: "gap-1.5",
    },
    md: {
      icon: "w-8 h-8",
      text: "text-xl",
      ai: "text-xl",
      gap: "gap-2",
    },
    lg: {
      icon: "w-10 h-10",
      text: "text-2xl md:text-3xl",
      ai: "text-2xl md:text-3xl",
      gap: "gap-2.5",
    },
    xl: {
      icon: "w-14 h-14",
      text: "text-3xl md:text-4xl lg:text-5xl",
      ai: "text-3xl md:text-4xl lg:text-5xl",
      gap: "gap-3",
    },
  };
  
  const variantClasses = {
    default: {
      meAjuda: "text-foreground",
      ai: "bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent",
    },
    white: {
      meAjuda: "text-white",
      ai: "bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 bg-clip-text text-transparent",
    },
    minimal: {
      meAjuda: "text-foreground",
      ai: "text-primary",
    },
  };
  
  const currentSize = sizeClasses[size];
  const currentVariant = variantClasses[variant];
  
  return (
    <div className={cn("flex items-center", currentSize.gap, className)}>
      {showIcon && (
        <div className="relative">
          <img 
            src="/toninho-logo.png" 
            alt="Me Ajuda AI" 
            className={cn(
              currentSize.icon,
              "rounded-xl transition-transform duration-300 hover:scale-105",
              animated && "animate-float"
            )}
          />
          {animated && (
            <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl animate-pulse opacity-50" />
          )}
        </div>
      )}
      
      <div className={cn("font-black tracking-tight flex items-baseline", currentSize.text)}>
        {/* ME AJUDA - with scan effect */}
        <span className="relative inline-flex">
          {letters.map((letter, index) => (
            <span
              key={index}
              className={cn(
                "transition-all duration-150 relative",
                currentVariant.meAjuda,
                letter === " " && "w-[0.25em]",
                scanIndex === index && animated && "text-primary scale-110"
              )}
              style={{
                textShadow: scanIndex === index && animated 
                  ? "0 0 20px hsl(var(--primary)), 0 0 40px hsl(var(--primary) / 0.5)" 
                  : "none",
              }}
            >
              {letter !== " " ? letter : "\u00A0"}
              {scanIndex === index && animated && (
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-scan-line" />
              )}
            </span>
          ))}
        </span>
        
        {/* Space between */}
        <span className="w-[0.3em]" />
        
        {/* AI - with glow effect */}
        <span 
          className={cn(
            "relative font-black transition-all duration-500",
            currentVariant.ai,
            glowPulse && animated && "scale-105"
          )}
          style={{
            filter: glowPulse && animated 
              ? "drop-shadow(0 0 15px rgba(59, 130, 246, 0.8)) drop-shadow(0 0 30px rgba(139, 92, 246, 0.6))" 
              : "none",
          }}
        >
          AI!
          {animated && (
            <span 
              className={cn(
                "absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent blur-sm opacity-0 transition-opacity duration-500",
                glowPulse && "opacity-70"
              )}
              aria-hidden="true"
            >
              AI!
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

// Compact version for headers
export function LogoCompact({ 
  className,
  variant = "default" 
}: { 
  className?: string;
  variant?: "default" | "white" | "minimal";
}) {
  return (
    <AnimatedLogo 
      size="md" 
      showIcon={true} 
      variant={variant}
      className={className}
      animated={true}
    />
  );
}

// Large version for hero sections
export function LogoHero({ 
  className,
  variant = "default",
  showIcon = true
}: { 
  className?: string;
  variant?: "default" | "white";
  showIcon?: boolean;
}) {
  return (
    <AnimatedLogo 
      size="xl" 
      showIcon={showIcon}
      variant={variant}
      className={className}
      animated={true}
    />
  );
}
