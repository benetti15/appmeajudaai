import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MapPin, Award, User, Sparkles } from "lucide-react";
import { PhotoUpload } from "@/components/PhotoUpload";
import { EnhancedVerificationSystem } from "@/components/EnhancedVerificationSystem";
import { ModernSpecialtiesGrid } from "@/components/professional/ModernSpecialtiesGrid";
import { ProgressStepper } from "@/components/ui/progress-stepper";

export default function ProfessionalProfile() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  
  // Form states para perfil pessoal
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    city: profile?.city || "",
    state: profile?.state || "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (profile?.user_type !== "professional") {
      toast({
        title: "Acesso negado",
        description: "Esta página é apenas para profissionais.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    if (profile) {
      setProfileData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
      });
      setProfilePhoto(profile.avatar_url || null);
    }

    setLoading(false);
  }, [user, profile]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
          address: profileData.address,
          city: profileData.city,
          state: profileData.state,
          avatar_url: profilePhoto,
        })
        .eq("id", user?.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!",
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



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/5">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Perfil Profissional
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure suas especialidades e áreas de atendimento
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <ProgressStepper
          steps={[
            { id: 'profile', label: 'Perfil', completed: !!(profileData.full_name && profileData.phone && profilePhoto) },
            { id: 'verification', label: 'Verificação', completed: false },
            { id: 'specialties', label: 'Especialidades', completed: false },
            { id: 'areas', label: 'Áreas', completed: !!(profileData.city && profileData.state) }
          ]}
          currentStep={0}
          className="mb-6"
        />

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Verificação</span>
            </TabsTrigger>
            <TabsTrigger value="specialties" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Especialidades</span>
            </TabsTrigger>
            <TabsTrigger value="areas" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Áreas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Foto do Perfil */}
            <Card className="border-0 shadow-glow bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Foto do Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <PhotoUpload
                  currentPhoto={profile?.avatar_url || profilePhoto}
                  onPhotoChange={setProfilePhoto}
                  required={true}
                />
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">📸 Por que a foto é obrigatória?</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Aumenta a confiança dos clientes</li>
                    <li>• Melhora suas chances de ser contratado</li>
                    <li>• Cria uma conexão mais pessoal</li>
                    <li>• Garante transparência e segurança</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Informações Pessoais */}
            <Card className="border-0 shadow-glow bg-card/50 backdrop-blur-sm hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-medium">
                      Nome Completo *
                    </Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                      placeholder="Seu nome completo"
                      className="transition-all focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Telefone *
                    </Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      placeholder="(34) 99999-9999"
                      className="transition-all focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    💡 Mantenha suas informações atualizadas para que os clientes possam entrar em contato facilmente.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Endereço */}
            <Card className="border-0 shadow-glow bg-card/50 backdrop-blur-sm hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">Endereço Completo</Label>
                  <Input
                    id="address"
                    value={profileData.address}
                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    placeholder="Rua, número, complemento"
                    className="transition-all focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium">Cidade *</Label>
                    <Input
                      id="city"
                      value={profileData.city}
                      onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                      placeholder="Sua cidade"
                      className="transition-all focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-medium">Estado *</Label>
                    <Input
                      id="state"
                      value={profileData.state}
                      onChange={(e) => setProfileData({...profileData, state: e.target.value})}
                      placeholder="UF"
                      maxLength={2}
                      className="transition-all focus:ring-2 focus:ring-primary uppercase"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification" className="space-y-6">
            <EnhancedVerificationSystem 
              userId={user?.id}
              showRestrictions={false}
              showUploadForm={true}
              compact={false}
              enforceRestrictions={false}
            />
          </TabsContent>

          <TabsContent value="specialties" className="space-y-6">
            <ModernSpecialtiesGrid />
          </TabsContent>

          <TabsContent value="areas" className="space-y-6">
            <Card className="border-0 shadow-glow bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Área de Atendimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-6 text-center">
                  <MapPin className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-2">Uberlândia, MG</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Atualmente você atende toda a cidade de Uberlândia
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    Cobertura: Toda a cidade
                  </Badge>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Sobre sua área de atendimento
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1.5">
                    <li>• Você atende todas as regiões de Uberlândia</li>
                    <li>• Os clientes podem encontrar você em buscas da cidade</li>
                    <li>• Mantenha seu perfil atualizado para mais visibilidade</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Botão Salvar Fixo */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            size="lg"
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-2xl px-8 py-3 text-lg font-medium"
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>
    </div>
  );
}