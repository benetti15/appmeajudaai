import { useState } from "react";
import { Camera, Shield, Star, Award, Zap, Edit2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhotoUpload } from "@/components/PhotoUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ProfileHeaderProps {
  name: string;
  avatarUrl: string | null;
  userType: 'client' | 'professional';
  isVerified?: boolean;
  level?: number;
  xp?: number;
  xpToNextLevel?: number;
  completionPercentage: number;
  stats?: {
    servicesCompleted?: number;
    totalReviews?: number;
    averageRating?: number;
  };
  onAvatarChange?: (url: string | null) => void;
}

export function ProfileHeader({
  name,
  avatarUrl,
  userType,
  isVerified = false,
  level = 1,
  xp = 0,
  xpToNextLevel = 100,
  completionPercentage,
  stats,
  onAvatarChange
}: ProfileHeaderProps) {
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);

  const levelTitles: Record<number, string> = {
    1: 'Iniciante',
    2: 'Aprendiz',
    3: 'Intermediário',
    4: 'Experiente',
    5: 'Especialista',
    6: 'Mestre',
    7: 'Lendário'
  };

  const getLevelColor = (level: number) => {
    if (level <= 2) return 'from-gray-400 to-gray-500';
    if (level <= 4) return 'from-primary to-primary/80';
    if (level <= 6) return 'from-amber-400 to-amber-600';
    return 'from-purple-500 to-pink-500';
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-accent/10 border border-border/50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative p-5 md:p-8">
        <div className="flex flex-col md:flex-row items-center gap-5 md:gap-8">
          {/* Avatar Section */}
          <div className="relative group">
            <div className={cn(
              "relative w-28 h-28 md:w-36 md:h-36 rounded-full",
              "bg-gradient-to-br p-1",
              getLevelColor(level)
            )}>
              <div className="w-full h-full rounded-full overflow-hidden bg-background">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                    <Camera className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Edit Button Overlay */}
              {onAvatarChange && (
                <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit2 className="w-6 h-6 text-white" />
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Alterar foto de perfil</DialogTitle>
                    </DialogHeader>
                    <PhotoUpload
                      currentPhoto={avatarUrl}
                      onPhotoChange={(url) => {
                        onAvatarChange(url);
                        setIsPhotoDialogOpen(false);
                      }}
                      required={false}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Level Badge */}
            <div className={cn(
              "absolute -bottom-1 -right-1 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg",
              "bg-gradient-to-r",
              getLevelColor(level)
            )}>
              Nv. {level}
            </div>

            {/* Verified Badge */}
            {isVerified && (
              <div className="absolute -top-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-background">
                <Shield className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {name || 'Seu Nome'}
                </h1>
                {isVerified && (
                  <CheckCircle className="w-5 h-5 text-primary fill-primary/20" />
                )}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs font-semibold",
                    userType === 'professional' 
                      ? "border-primary/50 text-primary bg-primary/10" 
                      : "border-accent/50 text-accent-foreground bg-accent/10"
                  )}
                >
                  {userType === 'professional' ? '🛠️ Profissional' : '👤 Cliente'}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-gradient-to-r from-primary/10 to-accent/10"
                >
                  <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" />
                  {levelTitles[Math.min(level, 7)]}
                </Badge>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="max-w-xs mx-auto md:mx-0">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  {xp} XP
                </span>
                <span>{xpToNextLevel} XP para Nv. {level + 1}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                  style={{ width: `${Math.min((xp / xpToNextLevel) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Quick Stats */}
            {stats && (
              <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                {stats.servicesCompleted !== undefined && (
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">{stats.servicesCompleted}</div>
                    <div className="text-xs text-muted-foreground">Serviços</div>
                  </div>
                )}
                {stats.totalReviews !== undefined && (
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">{stats.totalReviews}</div>
                    <div className="text-xs text-muted-foreground">Avaliações</div>
                  </div>
                )}
                {stats.averageRating !== undefined && (
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground flex items-center justify-center gap-1">
                      {stats.averageRating.toFixed(1)}
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    </div>
                    <div className="text-xs text-muted-foreground">Média</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile Completion Ring */}
          <div className="hidden md:flex flex-col items-center gap-2">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/30"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${completionPercentage * 2.83} 283`}
                  className="transition-all duration-700"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--accent))" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold">{completionPercentage}%</span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">Perfil Completo</span>
          </div>
        </div>

        {/* Mobile Completion */}
        <div className="md:hidden mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Perfil completo</span>
            <span className="font-bold text-primary">{completionPercentage}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
