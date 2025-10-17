import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Save, Zap, Wrench, Snowflake, Home, Paintbrush, HardHat, Sparkles, Leaf } from "lucide-react";

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string | null;
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        .select("category_id")
        .eq("professional_id", user?.id);

      if (specialtiesError) throw specialtiesError;
      
      const selectedIds = specialtiesData?.map(s => s.category_id) || [];
      setSelectedCategories(selectedIds);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar especialidades");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Deletar todas as especialidades antigas
      const { error: deleteError } = await supabase
        .from("professional_specialties")
        .delete()
        .eq("professional_id", user?.id);

      if (deleteError) throw deleteError;

      // Inserir novas especialidades
      if (selectedCategories.length > 0) {
        const specialties = selectedCategories.map(categoryId => ({
          professional_id: user?.id,
          category_id: categoryId,
        }));

        const { error: insertError } = await supabase
          .from("professional_specialties")
          .insert(specialties);

        if (insertError) throw insertError;
      }

      toast.success("Especialidades atualizadas com sucesso!");
    } catch (error) {
      console.error("Error saving specialties:", error);
      toast.error("Erro ao salvar especialidades");
    } finally {
      setSaving(false);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Minhas Especialidades</CardTitle>
        <CardDescription>
          Selecione as categorias de serviço que você atende
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category) => {
            const IconComponent = categoryIcons[category.name] || Home;
            const isSelected = selectedCategories.includes(category.id);

            return (
              <div
                key={category.id}
                onClick={() => handleToggleCategory(category.id)}
                className={`
                  flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleToggleCategory(category.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <IconComponent className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold">{category.name}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedCategories.length} {selectedCategories.length === 1 ? 'especialidade selecionada' : 'especialidades selecionadas'}
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Especialidades
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
