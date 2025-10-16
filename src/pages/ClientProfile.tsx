import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, MapPin, Phone, Mail } from "lucide-react";
import { PhotoUpload } from "@/components/PhotoUpload";

export default function ClientProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    city: profile?.city || "",
    state: profile?.state || "",
    document_number: profile?.document_number || "",
    postal_code: profile?.postal_code || "",
  });

  const [profilePhoto, setProfilePhoto] = useState<string | null>(profile?.avatar_url || null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (profile?.user_type !== "client") {
      toast({
        title: "Acesso negado",
        description: "Esta página é apenas para clientes.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
        document_number: profile.document_number || "",
        postal_code: profile.postal_code || "",
      });
      setProfilePhoto(profile.avatar_url || null);
    }
  }, [user, profile, navigate, toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          document_number: formData.document_number,
          postal_code: formData.postal_code,
          avatar_url: profilePhoto,
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
              Meu Perfil
            </h1>
            <p className="text-sm text-muted-foreground">
              Configure suas informações pessoais
            </p>
          </div>
        </div>

        <div className="space-y-6">
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
                <Label htmlFor="document_number">CPF</Label>
                <Input
                  id="document_number"
                  value={formData.document_number}
                  onChange={(e) => handleInputChange("document_number", e.target.value)}
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
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Rua, número, complemento"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Sua cidade"
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">CEP</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange("postal_code", e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
              </div>
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