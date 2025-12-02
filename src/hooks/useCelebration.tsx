import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { Confetti, ConfettiBurst } from "@/components/ui/confetti";
import { AchievementToast, useAchievementToast } from "@/components/ui/achievement-toast";

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

interface CelebrationContextType {
  celebrate: (achievement: AchievementType, options?: CelebrationOptions) => void;
  celebrateBurst: (x: number, y: number) => void;
  showConfetti: () => void;
}

interface CelebrationOptions {
  withConfetti?: boolean;
  customTitle?: string;
  customDescription?: string;
}

const CelebrationContext = createContext<CelebrationContextType | null>(null);

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [showingConfetti, setShowingConfetti] = useState(false);
  const [burstPosition, setBurstPosition] = useState<{ x: number; y: number; active: boolean }>({
    x: 50,
    y: 50,
    active: false,
  });
  const { toast, showAchievement, hideAchievement } = useAchievementToast();

  const showConfetti = useCallback(() => {
    setShowingConfetti(true);
    setTimeout(() => setShowingConfetti(false), 3500);
  }, []);

  const celebrate = useCallback((
    achievement: AchievementType, 
    options?: CelebrationOptions
  ) => {
    showAchievement(achievement, options?.customTitle, options?.customDescription);
    
    // Show confetti for major achievements
    const majorAchievements: AchievementType[] = [
      "bronze_level",
      "silver_level", 
      "gold_level",
      "profile_complete",
      "document_approved",
      "first_specialty"
    ];
    
    if (options?.withConfetti || majorAchievements.includes(achievement)) {
      showConfetti();
    }
  }, [showAchievement, showConfetti]);

  const celebrateBurst = useCallback((x: number, y: number) => {
    setBurstPosition({ x, y, active: true });
    setTimeout(() => setBurstPosition(prev => ({ ...prev, active: false })), 2500);
  }, []);

  return (
    <CelebrationContext.Provider value={{ celebrate, celebrateBurst, showConfetti }}>
      {children}
      
      {/* Global confetti */}
      <Confetti 
        isActive={showingConfetti} 
        onComplete={() => setShowingConfetti(false)} 
      />
      
      {/* Burst confetti */}
      <ConfettiBurst
        isActive={burstPosition.active}
        x={burstPosition.x}
        y={burstPosition.y}
        onComplete={() => setBurstPosition(prev => ({ ...prev, active: false }))}
      />
      
      {/* Achievement toast */}
      {toast && (
        <AchievementToast
          type={toast.type}
          isVisible={!!toast}
          onClose={hideAchievement}
          customTitle={toast.customTitle}
          customDescription={toast.customDescription}
        />
      )}
    </CelebrationContext.Provider>
  );
}

export function useCelebration() {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error("useCelebration must be used within CelebrationProvider");
  }
  return context;
}
