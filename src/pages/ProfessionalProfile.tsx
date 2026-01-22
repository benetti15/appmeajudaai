import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, User, MapPin, Award, Settings, Shield, 
  Briefcase, Bell, Save, Loader2, ChevronRight
} from "lucide-react";
import { PhotoUpload } from "@/components/PhotoUpload";
import { EnhancedVerificationSystem } from "@/components/EnhancedVerificationSystem";
import { ModernSpecialtiesGrid } from "@/components/professional/ModernSpecialtiesGrid";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileAchievements } from "@/components/profile/ProfileAchievements";
import { ProfileCompletionCard } from "@/components/profile/ProfileCompletionCard";
import { ProfileSettingsSection } from "@/components/profile/ProfileSettingsSection";
import { EnhancedAddressInput } from "@/components/address/EnhancedAddressInput";
import { AddressData } from "@/lib/address-utils";
import { Badge } from "@/components/ui/badge";

export default function ProfessionalProfile() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Form states
  const [profileData, setProfileData] = useState({
    full_name: "",
    phone: "",
  });

  const [addressData, setAddressData] = useState<AddressData>({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    postal_code: "",
    latitude: null,
    longitude: null,
    formatted_address: ""
  });

  // Fetch professional stats
  const { data: stats } = useQuery({
    queryKey: ['professional-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const [quotesResult, reviewsResult, servicesResult] = await Promise.all([
        supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('professional_id', user.id),
        supabase.from('reviews').select('rating').eq('professional_id', user.id),
        supabase.from('service_requests').select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
      ]);

      const reviews = reviewsResult.data || [];
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;

      return {
        quotesSent: quotesResult.count || 0,
        reviewsReceived: reviews.length,
        averageRating: avgRating,
        servicesCompleted: servicesResult.count || 0
      };
    },
    enabled: !!user
  });

  // Fetch verification status
  const { data: verificationStatus } = useQuery({
    queryKey: ['verification-status', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('professional_verification_status')
        .select('*')
        .eq('professional_id', user.id)
        .single();
      return data;
    },
    enabled: !!user
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (profile?.user_type !== "professional") {
      navigate("/");
      return;
    }

    if (profile) {
      setProfileData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
      });
      setAddressData({
        street: profile.street || "",
        number: profile.number || "",
        complement: profile.complement || "",
        neighborhood: profile.neighborhood || "",
        city: profile.city || "",
        state: profile.state || "",
        postal_code: profile.postal_code || "",
        latitude: profile.latitude || null,
        longitude: profile.longitude || null,
        formatted_address: profile.formatted_address || ""
      });
      setProfilePhoto(profile.avatar_url || null);
    }
  }, [user, profile, navigate]);

  // Calculate profile completion
  const completionSteps = useMemo(() => [
    {
      id: 'photo',
      label: 'Adicionar foto',
      description: 'Clientes confiam mais em profissionais com foto',
      completed: !!profilePhoto,
      xpReward: 20,
      action: () => setActiveTab('profile'),
      actionLabel: 'Adicionar'
    },
    {
      id: 'name',
      label: 'Nome completo',
      description: 'Seu nome aparece nos orçamentos',
      completed: !!profileData.full_name,
      xpReward: 10,
      action: () => setActiveTab('profile'),
      actionLabel: 'Preencher'
    },
    {
      id: 'phone',
      label: 'Telefone',
      description: 'Para contato direto com clientes',
      completed: !!profileData.phone,
      xpReward: 10,
      action: () => setActiveTab('profile'),
      actionLabel: 'Adicionar'
    },
    {
      id: 'address',
      label: 'Endereço completo',
      description: 'Apareça nas buscas por localização',
      completed: !!(addressData.latitude && addressData.longitude),
      xpReward: 15,
      action: () => setActiveTab('profile'),
      actionLabel: 'Configurar'
    },
    {
      id: 'verification',
      label: 'Verificação de documentos',
      description: 'Selo de profissional verificado',
      completed: verificationStatus?.is_verified || false,
      xpReward: 50,
      action: () => setActiveTab('verification'),
      actionLabel: 'Verificar'
    }
  ], [profilePhoto, profileData, addressData, verificationStatus]);

  const completionPercentage = Math.round(
    (completionSteps.filter(s => s.completed).length / completionSteps.length) * 100
  );

  // Calculate XP and level
  const totalXp = useMemo(() => {
    let xp = completionSteps.filter(s => s.completed).reduce((sum, s) => sum + s.xpReward, 0);
    xp += (stats?.quotesSent || 0) * 5;
    xp += (stats?.servicesCompleted || 0) * 25;
    xp += (stats?.reviewsReceived || 0) * 10;
    return xp;
  }, [completionSteps, stats]);

  const level = Math.floor(totalXp / 100) + 1;
  const xpInCurrentLevel = totalXp % 100;

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
          avatar_url: profilePhoto,
          street: addressData.street,
          number: addressData.number,
          complement: addressData.complement,
          neighborhood: addressData.neighborhood,
          city: addressData.city,
          state: addressData.state,
          postal_code: addressData.postal_code,
          latitude: addressData.latitude,
          longitude: addressData.longitude,
          formatted_address: addressData.formatted_address
        })
        .eq("id", user?.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: "✅ Perfil salvo!",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const settingsGroups = [
    {
      title: "Notificações",
      items: [
        {
          id: 'push-notifications',
          icon: Bell,
          label: 'Notificações push',
          description: 'Receber alertas de novas solicitações',
          toggle: true,
          toggled: notificationsEnabled,
          onToggle: setNotificationsEnabled
        }
      ]
    },
    {
      title: "Segurança",
      items: [
        {
          id: 'change-password',
          icon: Shield,
          label: 'Alterar senha',
          onClick: () => navigate('/reset-password')
        }
      ]
    },
    {
      title: "Suporte",
      items: [
        {
          id: 'help',
          icon: Award,
          label: 'Central de ajuda',
          onClick: () => navigate('/about-toninho')
        }
      ]
    }
  ];

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-24 md:pb-8">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="h-9 w-9 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              Meu Perfil
            </h1>
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            size="sm"
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar
          </Button>
        </div>

        {/* Profile Header with Gamification */}
        <ProfileHeader
          name={profileData.full_name}
          avatarUrl={profilePhoto}
          userType="professional"
          isVerified={verificationStatus?.is_verified || false}
          level={level}
          xp={xpInCurrentLevel}
          xpToNextLevel={100}
          completionPercentage={completionPercentage}
          stats={{
            servicesCompleted: stats?.servicesCompleted,
            totalReviews: stats?.reviewsReceived,
            averageRating: stats?.averageRating
          }}
          onAvatarChange={setProfilePhoto}
        />

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-5 h-12 p-1 bg-muted/50 rounded-2xl">
            <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs md:text-sm">
              <User className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs md:text-sm">
              <Settings className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Dados</span>
            </TabsTrigger>
            <TabsTrigger value="specialties" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs md:text-sm">
              <Briefcase className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Especialidades</span>
            </TabsTrigger>
            <TabsTrigger value="verification" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs md:text-sm relative">
              <Shield className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Verificação</span>
              {!verificationStatus?.is_verified && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs md:text-sm">
              <Bell className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <ProfileCompletionCard steps={completionSteps} />
            
            <ProfileAchievements 
              userType="professional"
              stats={{
                quotesSent: stats?.quotesSent,
                servicesCompleted: stats?.servicesCompleted,
                reviewsReceived: stats?.reviewsReceived,
                isVerified: verificationStatus?.is_verified,
                profileComplete: completionPercentage === 100
              }}
            />

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => navigate('/available-requests')}
                >
                  <Briefcase className="w-5 h-5 text-primary" />
                  <span className="text-sm">Ver Solicitações</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => navigate('/my-services')}
                >
                  <Award className="w-5 h-5 text-primary" />
                  <span className="text-sm">Meus Serviços</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6 space-y-5">
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5 text-primary" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo *</Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      placeholder="(34) 99999-9999"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5 text-primary" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedAddressInput
                  value={addressData}
                  onChange={setAddressData}
                  required={true}
                  showMap={false}
                  allowCurrentLocation={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Specialties Tab */}
          <TabsContent value="specialties" className="mt-6">
            <ModernSpecialtiesGrid />
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification" className="mt-6">
            <EnhancedVerificationSystem 
              userId={user?.id}
              showRestrictions={false}
              showUploadForm={true}
              compact={false}
              enforceRestrictions={false}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <ProfileSettingsSection 
              groups={settingsGroups}
              onSignOut={signOut}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
