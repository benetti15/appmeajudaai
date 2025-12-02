import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
}

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  pieceCount?: number;
  onComplete?: () => void;
  className?: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(142 76% 36%)", // green
  "hsl(48 96% 53%)", // yellow/gold
  "hsl(262 83% 58%)", // purple
  "hsl(340 82% 52%)", // pink
];

export function Confetti({ 
  isActive, 
  duration = 3000, 
  pieceCount = 50,
  onComplete,
  className 
}: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (isActive) {
      const newPieces: ConfettiPiece[] = Array.from({ length: pieceCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        size: 6 + Math.random() * 8,
      }));
      setPieces(newPieces);

      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setPieces([]);
    }
  }, [isActive, duration, pieceCount, onComplete]);

  if (!isActive || pieces.length === 0) return null;

  return (
    <div className={cn("fixed inset-0 pointer-events-none z-[100] overflow-hidden", className)}>
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${piece.x}%`,
            top: "-20px",
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}

// Burst confetti from a specific point
interface ConfettiBurstProps {
  isActive: boolean;
  x?: number;
  y?: number;
  pieceCount?: number;
  onComplete?: () => void;
}

export function ConfettiBurst({ 
  isActive, 
  x = 50, 
  y = 50, 
  pieceCount = 30,
  onComplete 
}: ConfettiBurstProps) {
  const [pieces, setPieces] = useState<(ConfettiPiece & { angle: number; distance: number })[]>([]);

  useEffect(() => {
    if (isActive) {
      const newPieces = Array.from({ length: pieceCount }, (_, i) => ({
        id: i,
        x,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: 0,
        duration: 1 + Math.random(),
        size: 4 + Math.random() * 6,
        angle: (i / pieceCount) * 360,
        distance: 50 + Math.random() * 100,
      }));
      setPieces(newPieces);

      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setPieces([]);
    }
  }, [isActive, x, y, pieceCount, onComplete]);

  if (!isActive || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti-burst"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            "--burst-angle": `${piece.angle}deg`,
            "--burst-distance": `${piece.distance}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
