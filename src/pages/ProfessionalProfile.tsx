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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MapPin, Award, User, Plus, Loader2, Save } from "lucide-react";
import { PhotoUpload } from "@/components/PhotoUpload";
import { EnhancedVerificationSystem } from "@/components/EnhancedVerificationSystem";
import { SpecialtiesReorder } from "@/components/professional/SpecialtiesReorder";
import { ProgressStepper } from "@/components/ui/progress-stepper";

interface ServiceCategory {
  id: string;
  name: string;
}

interface Specialty {
  id: string;
  category_id: string;
  category_name: string;
  experience_years: number | null;
  description: string | null;
  certifications: string | null;
  display_order: number;
}


export default function ProfessionalProfile() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  const [formData, setFormData] = useState({
    category_id: "",
    experience_years: "",
    description: "",
    certifications: "",
  });
  
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

    fetchData();
  }, [user, profile]);

  const fetchData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("service_categories")
        .select("*")
        .order("name");

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch specialties with display_order
      const { data: specialtiesData, error: specialtiesError } = await supabase
        .from("professional_specialties")
        .select(`
          id,
          category_id,
          experience_years,
          description,
          certifications,
          display_order,
          service_categories!professional_specialties_category_id_fkey(name)
        `)
        .eq("professional_id", user?.id)
        .order("display_order");

      if (specialtiesError) throw specialtiesError;
      
      const formattedSpecialties = specialtiesData?.map((item: any) => ({
        id: item.id,
        category_id: item.category_id,
        category_name: item.service_categories?.name || "",
        experience_years: item.experience_years,
        description: item.description,
        certifications: item.certifications,
        display_order: item.display_order || 0,
      })) || [];
      
      setSpecialties(formattedSpecialties);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
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

  const handleReorder = (reorderedSpecialties: Specialty[]) => {
    setSpecialties(reorderedSpecialties);
  };

  const openEditDialog = (specialty: Specialty) => {
    setEditingSpecialty(specialty);
    setFormData({
      category_id: specialty.category_id,
      experience_years: specialty.experience_years?.toString() || "",
      description: specialty.description || "",
      certifications: specialty.certifications || "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteSpecialty = async (id: string) => {
    try {
      const { error } = await supabase
        .from("professional_specialties")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Especialidade removida com sucesso!",
      });
      await fetchData();
    } catch (error) {
      console.error("Error deleting specialty:", error);
      toast({
        title: "Erro",
        description: "Erro ao remover especialidade",
        variant: "destructive",
      });
    }
  };

  const handleSaveSpecialty = async () => {
    if (!formData.category_id || !formData.experience_years || !formData.description) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const specialtyData = {
        professional_id: user?.id,
        category_id: formData.category_id,
        experience_years: parseInt(formData.experience_years),
        description: formData.description,
        certifications: formData.certifications || null,
      };

      if (editingSpecialty) {
        const { error } = await supabase
          .from("professional_specialties")
          .update(specialtyData)
          .eq("id", editingSpecialty.id);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Especialidade atualizada!",
        });
      } else {
        const { error } = await supabase
          .from("professional_specialties")
          .insert(specialtyData);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Especialidade adicionada!",
        });
      }

      setIsDialogOpen(false);
      setEditingSpecialty(null);
      setFormData({
        category_id: "",
        experience_years: "",
        description: "",
        certifications: "",
      });
      await fetchData();
    } catch (error) {
      console.error("Error saving specialty:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar especialidade",
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
            <Card className="border-0 shadow-glow bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Minhas Especialidades</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Adicione e organize suas especialidades
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingSpecialty(null);
                      setFormData({
                        category_id: "",
                        experience_years: "",
                        description: "",
                        certifications: "",
                      });
                      setIsDialogOpen(true);
                    }}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {specialties.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma especialidade cadastrada</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Adicione suas especialidades para que os clientes conheçam sua experiência
                    </p>
                  </div>
                ) : (
                  <SpecialtiesReorder
                    specialties={specialties}
                    onReorder={handleReorder}
                    onEdit={openEditDialog}
                    onDelete={handleDeleteSpecialty}
                  />
                )}
              </CardContent>
            </Card>

            {/* Dialog for Add/Edit Specialty */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingSpecialty ? "Editar Especialidade" : "Nova Especialidade"}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes sobre sua experiência nesta área
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria *</Label>
                    <select
                      id="category"
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full p-2 border border-input rounded-md bg-background text-foreground"
                      disabled={!!editingSpecialty}
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Anos de Experiência *</Label>
                    <Input
                      id="experience"
                      type="number"
                      min="1"
                      placeholder="Ex: 5"
                      value={formData.experience_years}
                      onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição da Experiência *</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva sua experiência, tipos de serviços que realiza..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="certifications">Certificações</Label>
                    <Textarea
                      id="certifications"
                      placeholder="Liste suas certificações, cursos..."
                      rows={3}
                      value={formData.certifications}
                      onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingSpecialty(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveSpecialty}
                    disabled={saving || !formData.category_id || !formData.experience_years || !formData.description}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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