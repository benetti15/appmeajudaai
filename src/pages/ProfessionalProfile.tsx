import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MapPin, Award, Plus, X, User } from "lucide-react";
import { PhotoUpload } from "@/components/PhotoUpload";
import { EnhancedVerificationSystem } from "@/components/EnhancedVerificationSystem";

interface ServiceCategory {
  id: string;
  name: string;
}

interface Specialty {
  id: string;
  category_id: string;
  category_name: string;
  hourly_rate?: number;
  experience_years?: number;
  description?: string;
  previous_work?: string;
  certifications?: string;
}

interface ServiceArea {
  id: string;
  city: string;
  state: string;
  radius_km: number;
}


export default function ProfessionalProfile() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  
  // Form states para perfil pessoal
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    city: profile?.city || "",
    state: profile?.state || "",
    postal_code: profile?.postal_code || "",
    
  });

  // Form states para especialidades
  const [newSpecialty, setNewSpecialty] = useState({
    category_id: "",
    experience_years: "",
    description: "",
    previous_work: "",
    certifications: "",
  });
  
  const [newServiceArea, setNewServiceArea] = useState({
    city: "Uberlândia, MG",
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
        postal_code: profile.postal_code || "",
        
      });
      setProfilePhoto(profile.avatar_url || null);
    }

    fetchData();
  }, [user, profile]);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchCategories(),
        fetchSpecialties(),
        fetchServiceAreas(),
        
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("service_categories")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    if (error) throw error;
    setCategories(data || []);
  };

  const fetchSpecialties = async () => {
    const { data, error } = await supabase
      .from("professional_specialties")
      .select(`
        id,
        category_id,
        hourly_rate,
        experience_years,
        description,
        service_categories(name)
      `)
      .eq("professional_id", user?.id)
      .order("created_at");

    if (error) throw error;
    
    const specialtiesWithNames = data?.map(item => ({
      id: item.id,
      category_id: item.category_id,
      category_name: item.service_categories?.name || "",
      hourly_rate: item.hourly_rate,
      experience_years: item.experience_years,
      description: item.description,
      previous_work: "", // Campo temporário até criar no banco
      certifications: "", // Campo temporário até criar no banco
    })) || [];

    setSpecialties(specialtiesWithNames);
  };

  const fetchServiceAreas = async () => {
    const { data, error } = await supabase
      .from("service_areas")
      .select("*")
      .eq("professional_id", user?.id)
      .order("created_at");

    if (error) throw error;
    setServiceAreas(data || []);
  };

  const addSpecialty = async () => {
    if (!newSpecialty.category_id) {
      toast({
        title: "Erro",
        description: "Selecione uma categoria.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("professional_specialties")
        .insert({
          professional_id: user?.id,
          category_id: newSpecialty.category_id,
          experience_years: newSpecialty.experience_years ? parseInt(newSpecialty.experience_years) : null,
          description: `${newSpecialty.description}${newSpecialty.previous_work ? '\n\nTrabalhos Anteriores: ' + newSpecialty.previous_work : ''}${newSpecialty.certifications ? '\n\nCertificações: ' + newSpecialty.certifications : ''}` || null,
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Especialidade adicionada com sucesso!",
      });

      setNewSpecialty({
        category_id: "",
        experience_years: "",
        description: "",
        previous_work: "",
        certifications: "",
      });

      await fetchSpecialties();
    } catch (error) {
      console.error("Error adding specialty:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a especialidade.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const removeSpecialty = async (specialtyId: string) => {
    try {
      const { error } = await supabase
        .from("professional_specialties")
        .delete()
        .eq("id", specialtyId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Especialidade removida com sucesso!",
      });

      await fetchSpecialties();
    } catch (error) {
      console.error("Error removing specialty:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a especialidade.",
        variant: "destructive",
      });
    }
  };

  const addServiceArea = async () => {
    if (!newServiceArea.city) {
      toast({
        title: "Erro",
        description: "Selecione uma cidade.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("service_areas")
        .insert({
          professional_id: user?.id,
          city: "Uberlândia",
          state: "MG",
          radius_km: 50, // Padrão para toda a cidade
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Área de atendimento adicionada com sucesso!",
      });

      setNewServiceArea({
        city: "Uberlândia, MG",
      });

      await fetchServiceAreas();
    } catch (error) {
      console.error("Error adding service area:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a área de atendimento.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const removeServiceArea = async (areaId: string) => {
    try {
      const { error } = await supabase
        .from("service_areas")
        .delete()
        .eq("id", areaId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Área de atendimento removida com sucesso!",
      });

      await fetchServiceAreas();
    } catch (error) {
      console.error("Error removing service area:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a área de atendimento.",
        variant: "destructive",
      });
    }
  };

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
          postal_code: profileData.postal_code,
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

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Verificação
            </TabsTrigger>
            <TabsTrigger value="specialties" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Especialidades
            </TabsTrigger>
            <TabsTrigger value="areas" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Áreas de Atendimento
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
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
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
                    value={profileData.address}
                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    placeholder="Rua, número, complemento"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={profileData.city}
                      onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                      placeholder="Sua cidade"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={profileData.state}
                      onChange={(e) => setProfileData({...profileData, state: e.target.value})}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">CEP</Label>
                    <Input
                      id="postal_code"
                      value={profileData.postal_code}
                      onChange={(e) => setProfileData({...profileData, postal_code: e.target.value})}
                      placeholder="00000-000"
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
            <Card className="border-0 shadow-glow bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Adicionar Especialidade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Categoria de Serviço</Label>
                    <Select
                      value={newSpecialty.category_id}
                      onValueChange={(value) =>
                        setNewSpecialty({ ...newSpecialty, category_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="experience">Anos de Experiência</Label>
                    <Input
                      id="experience"
                      type="number"
                      placeholder="5"
                      value={newSpecialty.experience_years}
                      onChange={(e) =>
                        setNewSpecialty({ ...newSpecialty, experience_years: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição da Experiência</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva sua experiência nesta área..."
                    value={newSpecialty.description}
                    onChange={(e) =>
                      setNewSpecialty({ ...newSpecialty, description: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="previous_work">Trabalhos Anteriores</Label>
                  <Textarea
                    id="previous_work"
                    placeholder="Ex: Trabalhei 3 anos na empresa XYZ fazendo instalações elétricas residenciais..."
                    value={newSpecialty.previous_work}
                    onChange={(e) =>
                      setNewSpecialty({ ...newSpecialty, previous_work: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="certifications">Certificações e Qualificações</Label>
                  <Textarea
                    id="certifications"
                    placeholder="Ex: NR-10, Curso de Soldador certificado pelo SENAI, etc..."
                    value={newSpecialty.certifications}
                    onChange={(e) =>
                      setNewSpecialty({ ...newSpecialty, certifications: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Todas as informações serão combinadas na descrição da especialidade.
                  </p>
                </div>

                <Button
                  onClick={addSpecialty}
                  disabled={saving || !newSpecialty.category_id}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Especialidade
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Suas Especialidades</h3>
              {specialties.length === 0 ? (
                <Card className="border-0 shadow-card bg-card/50 backdrop-blur-sm">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Award className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      Nenhuma especialidade cadastrada ainda.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                specialties.map((specialty) => (
                  <Card key={specialty.id} className="border-0 shadow-card bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">{specialty.category_name}</Badge>
                            {specialty.experience_years && (
                              <Badge variant="outline">
                                {specialty.experience_years} anos
                              </Badge>
                            )}
                          </div>
                           {specialty.description && (
                             <div className="text-sm text-muted-foreground space-y-1">
                               <div className="whitespace-pre-line">{specialty.description}</div>
                             </div>
                           )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSpecialty(specialty.id)}
                          className="text-destructive hover:text-destructive/90"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="areas" className="space-y-6">
            <Card className="border-0 shadow-glow bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Adicionar Área de Atendimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="city">Cidade de Atendimento</Label>
                    <select
                      id="city"
                      value={newServiceArea.city}
                      onChange={(e) =>
                        setNewServiceArea({ city: e.target.value })
                      }
                      className="w-full p-2 border border-input rounded-md bg-background text-foreground"
                    >
                      <option value="Uberlândia, MG">Uberlândia, MG</option>
                    </select>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Atendimento em toda a cidade selecionada
                  </p>
                </div>

                <Button
                  onClick={addServiceArea}
                  disabled={saving || !newServiceArea.city}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Área
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Suas Áreas de Atendimento</h3>
              {serviceAreas.length === 0 ? (
                <Card className="border-0 shadow-card bg-card/50 backdrop-blur-sm">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      Nenhuma área de atendimento cadastrada ainda.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                serviceAreas.map((area) => (
                  <Card key={area.id} className="border-0 shadow-card bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-medium">
                            {area.city}, {area.state}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeServiceArea(area.id)}
                          className="text-destructive hover:text-destructive/90"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
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