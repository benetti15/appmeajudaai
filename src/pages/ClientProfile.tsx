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
  ArrowLeft, User, MapPin, Settings, Bell, 
  Save, Loader2, FileText, Heart, MessageCircle
} from "lucide-react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileAchievements } from "@/components/profile/ProfileAchievements";
import { ProfileCompletionCard } from "@/components/profile/ProfileCompletionCard";
import { ProfileSettingsSection } from "@/components/profile/ProfileSettingsSection";
import { EnhancedAddressInput } from "@/components/address/EnhancedAddressInput";
import { AddressData } from "@/lib/address-utils";
import { PhotoUpload } from "@/components/PhotoUpload";

export default function ClientProfile() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    cpf: "",
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

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Fetch client stats
  const { data: stats } = useQuery({
    queryKey: ['client-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const [requestsResult, reviewsResult] = await Promise.all([
        supabase.from('service_requests').select('status').eq('client_id', user.id),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('reviewer_id', user.id)
      ]);

      const requests = requestsResult.data || [];
      const completedServices = requests.filter(r => r.status === 'completed').length;
      const pendingRequests = requests.filter(r => r.status === 'pending').length;

      // Count quotes received
      const requestIds = requests.map(r => (r as any).id).filter(Boolean);
      let quotesReceived = 0;
      if (requestIds.length > 0) {
        const { count } = await supabase
          .from('quotes')
          .select('*', { count: 'exact', head: true })
          .in('request_id', requestIds);
        quotesReceived = count || 0;
      }

      return {
        requestsCreated: requests.length,
        pendingRequests,
        servicesCompleted: completedServices,
        quotesReceived,
        reviewsGiven: reviewsResult.count || 0
      };
    },
    enabled: !!user
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        cpf: profile.cpf || "",
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
  }, [profile]);

  // Calculate profile completion
  const completionSteps = useMemo(() => [
    {
      id: 'photo',
      label: 'Adicionar foto',
      description: 'Profissionais confiam mais em clientes com foto',
      completed: !!profilePhoto,
      xpReward: 15,
      action: () => setActiveTab('profile'),
      actionLabel: 'Adicionar'
    },
    {
      id: 'name',
      label: 'Nome completo',
      description: 'Seu nome aparece nas solicitações',
      completed: !!formData.full_name,
      xpReward: 10,
      action: () => setActiveTab('profile'),
      actionLabel: 'Preencher'
    },
    {
      id: 'phone',
      label: 'Telefone',
      description: 'Para contato direto com profissionais',
      completed: !!formData.phone,
      xpReward: 10,
      action: () => setActiveTab('profile'),
      actionLabel: 'Adicionar'
    },
    {
      id: 'address',
      label: 'Endereço completo',
      description: 'Para serviços no local correto',
      completed: !!(addressData.latitude && addressData.longitude),
      xpReward: 15,
      action: () => setActiveTab('profile'),
      actionLabel: 'Configurar'
    }
  ], [profilePhoto, formData, addressData]);

  const completionPercentage = Math.round(
    (completionSteps.filter(s => s.completed).length / completionSteps.length) * 100
  );

  // Calculate XP and level
  const totalXp = useMemo(() => {
    let xp = completionSteps.filter(s => s.completed).reduce((sum, s) => sum + s.xpReward, 0);
    xp += (stats?.requestsCreated || 0) * 10;
    xp += (stats?.servicesCompleted || 0) * 25;
    xp += (stats?.reviewsGiven || 0) * 15;
    return xp;
  }, [completionSteps, stats]);

  const level = Math.floor(totalXp / 100) + 1;
  const xpInCurrentLevel = totalXp % 100;

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          cpf: formData.cpf,
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const settingsGroups = [
    {
      title: "Notificações",
      items: [
        {
          id: 'push-notifications',
          icon: Bell,
          label: 'Notificações push',
          description: 'Receber alertas de novos orçamentos',
          toggle: true,
          toggled: notificationsEnabled,
          onToggle: setNotificationsEnabled
        }
      ]
    },
    {
      title: "Suporte",
      items: [
        {
          id: 'help',
          icon: MessageCircle,
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
            onClick={handleSave}
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
          name={formData.full_name}
          avatarUrl={profilePhoto}
          userType="client"
          level={level}
          xp={xpInCurrentLevel}
          xpToNextLevel={100}
          completionPercentage={completionPercentage}
          stats={{
            servicesCompleted: stats?.servicesCompleted
          }}
          onAvatarChange={setProfilePhoto}
        />

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3 h-12 p-1 bg-muted/50 rounded-2xl">
            <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <User className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Visão Geral</span>
              <span className="sm:hidden">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Settings className="w-4 h-4 mr-2" />
              <span>Dados</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Bell className="w-4 h-4 mr-2" />
              <span>Config</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <ProfileCompletionCard steps={completionSteps} />
            
            <ProfileAchievements 
              userType="client"
              stats={{
                requestsCreated: stats?.requestsCreated,
                quotesReceived: stats?.quotesReceived,
                servicesCompleted: stats?.servicesCompleted,
                reviewsGiven: stats?.reviewsGiven,
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
                  onClick={() => navigate('/categories')}
                >
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-sm">Nova Solicitação</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => navigate('/my-requests')}
                >
                  <Heart className="w-5 h-5 text-primary" />
                  <span className="text-sm">Meus Pedidos</span>
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
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange("full_name", e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="(34) 99999-9999"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange("cpf", e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
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
