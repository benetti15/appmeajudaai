import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, MapPin } from "lucide-react";
import { PhotoUpload } from "@/components/PhotoUpload";
import { ProgressStepper } from "@/components/ui/progress-stepper";
import { EnhancedAddressInput } from "@/components/address/EnhancedAddressInput";
import { AddressData } from "@/lib/address-utils";

export default function ClientProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    cpf: profile?.cpf || "",
  });

  const [addressData, setAddressData] = useState<AddressData>({
    street: profile?.street || "",
    number: profile?.number || "",
    complement: profile?.complement || "",
    neighborhood: profile?.neighborhood || "",
    city: profile?.city || "",
    state: profile?.state || "",
    postal_code: profile?.postal_code || "",
    latitude: profile?.latitude || null,
    longitude: profile?.longitude || null,
    formatted_address: profile?.formatted_address || ""
  });

  const [profilePhoto, setProfilePhoto] = useState<string | null>(profile?.avatar_url || null);

  useEffect(() => {
    // Guard de tipo removido - agora é controlado pelo ClientRoute no App.tsx
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/5 pb-24 md:pb-0">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-6 max-w-4xl">
        <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="p-2 h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Meu Perfil
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Suas informações pessoais
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <ProgressStepper
          steps={[
            { id: 'photo', label: 'Foto', completed: !!profilePhoto },
            { id: 'personal', label: 'Dados', completed: !!(formData.full_name && formData.phone) },
            { id: 'address', label: 'Endereço', completed: !!(addressData.latitude && addressData.longitude) }
          ]}
          currentStep={profilePhoto ? (formData.full_name && formData.phone ? 2 : 1) : 0}
          className="mb-4 md:mb-6"
        />

        <div className="space-y-4 md:space-y-6">
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
                currentPhoto={profilePhoto}
                onPhotoChange={setProfilePhoto}
                required={false}
              />
            </CardContent>
          </Card>

          {/* Informações Pessoais */}
          <Card className="border-0 shadow-glow bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange("full_name", e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="(34) 99999-9999"
                  />
                </div>
              </div>

              <div>
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

          {/* Endereço */}
          <Card className="border-0 shadow-glow bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
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

          {/* Botão Salvar */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 px-8"
            >
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}