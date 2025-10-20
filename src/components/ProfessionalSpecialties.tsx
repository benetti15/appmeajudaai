import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Save, Zap, Wrench, Snowflake, Home, Paintbrush, HardHat, Sparkles, Leaf, Plus, Pencil, Trash2, Award } from "lucide-react";

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string | null;
}

interface Specialty {
  id: string;
  category_id: string;
  category_name: string;
  experience_years: number | null;
  description: string | null;
  certifications: string | null;
  hourly_rate: number | null;
}

const categoryIcons: Record<string, React.ComponentType<any>> = {
  "Elétrica": Zap,
  "Encanamento": Wrench,
  "Ar Condicionado": Snowflake,
  "Pequenos Reparos": Home,
  "Pintura": Paintbrush,
  "Marcenaria": HardHat,
  "Limpeza": Sparkles,
  "Jardinagem": Leaf,
};

export function ProfessionalSpecialties() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  
  const [formData, setFormData] = useState({
    category_id: "",
    experience_years: "",
    description: "",
    certifications: "",
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // Buscar todas as categorias
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("service_categories")
        .select("*")
        .order("name");

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Buscar especialidades do profissional
      const { data: specialtiesData, error: specialtiesError } = await supabase
        .from("professional_specialties")
        .select(`
          id,
          category_id,
          experience_years,
          description,
          certifications,
          hourly_rate,
          service_categories!professional_specialties_category_id_fkey(name)
        `)
        .eq("professional_id", user?.id)
        .order("created_at");

      if (specialtiesError) throw specialtiesError;
      
      const formattedSpecialties = specialtiesData?.map((item: any) => ({
        id: item.id,
        category_id: item.category_id,
        category_name: item.service_categories?.name || "",
        experience_years: item.experience_years,
        description: item.description,
        certifications: item.certifications,
        hourly_rate: item.hourly_rate,
      })) || [];
      
      setSpecialties(formattedSpecialties);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar especialidades");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category_id: "",
      experience_years: "",
      description: "",
      certifications: "",
    });
    setEditingSpecialty(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
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

  const handleSaveSpecialty = async () => {
    if (!formData.category_id) {
      toast.error("Selecione uma categoria");
      return;
    }

    if (!formData.experience_years || parseInt(formData.experience_years) <= 0) {
      toast.error("Informe os anos de experiência");
      return;
    }

    if (!formData.description || formData.description.trim() === "") {
      toast.error("Informe uma descrição da sua experiência");
      return;
    }

    setSaving(true);
    try {
      const specialtyData = {
        professional_id: user?.id,
        category_id: formData.category_id,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        description: formData.description || null,
        certifications: formData.certifications || null,
      };

      if (editingSpecialty) {
        // Atualizar especialidade existente
        const { error } = await supabase
          .from("professional_specialties")
          .update(specialtyData)
          .eq("id", editingSpecialty.id);

        if (error) throw error;
        toast.success("Especialidade atualizada com sucesso!");
      } else {
        // Criar nova especialidade
        const { error } = await supabase
          .from("professional_specialties")
          .insert(specialtyData);

        if (error) throw error;
        toast.success("Especialidade adicionada com sucesso!");
      }

      setIsDialogOpen(false);
      resetForm();
      await fetchData();
    } catch (error) {
      console.error("Error saving specialty:", error);
      toast.error("Erro ao salvar especialidade");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSpecialty = async (id: string) => {
    try {
      const { error } = await supabase
        .from("professional_specialties")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Especialidade removida com sucesso!");
      await fetchData();
    } catch (error) {
      console.error("Error deleting specialty:", error);
      toast.error("Erro ao remover especialidade");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const availableCategories = categories.filter(
    cat => !specialties.some(spec => spec.category_id === cat.id)
  );

  return (
    <Card className="border-0 shadow-glow bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Minhas Especialidades</CardTitle>
            <CardDescription>
              Adicione suas especialidades com detalhes sobre sua experiência
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={openAddDialog}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Especialidade
              </Button>
            </DialogTrigger>
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
                    {(editingSpecialty ? categories : availableCategories).map((cat) => (
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
                    placeholder="Descreva sua experiência, tipos de serviços que realiza, projetos anteriores..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certifications">Certificações e Qualificações</Label>
                  <Textarea
                    id="certifications"
                    placeholder="Liste suas certificações, cursos, diplomas relevantes..."
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
                    resetForm();
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
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {specialties.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma especialidade cadastrada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione suas especialidades para que os clientes conheçam sua experiência
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {specialties.map((specialty) => {
              const category = categories.find(c => c.id === specialty.category_id);
              const IconComponent = categoryIcons[category?.name || ""] || Home;

              return (
                <Card key={specialty.id} className="border-2 hover:border-primary/50 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{specialty.category_name}</h4>
                          <div className="flex gap-2 mt-1">
                            {specialty.experience_years && (
                              <Badge variant="secondary">
                                {specialty.experience_years} {specialty.experience_years === 1 ? "ano" : "anos"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(specialty)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSpecialty(specialty.id)}
                          className="text-destructive hover:text-destructive/90"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {specialty.description && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium mb-1">Experiência:</h5>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {specialty.description}
                        </p>
                      </div>
                    )}

                    {specialty.certifications && (
                      <div>
                        <h5 className="text-sm font-medium mb-1">Certificações:</h5>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {specialty.certifications}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
