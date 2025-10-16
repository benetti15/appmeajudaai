import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Move3D, 
  Settings,
  Clock,
  CheckCircle,
  DollarSign,
  Car,
  Play,
  Star,
  Users,
  ArrowRight,
  Save,
  RotateCcw
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Tipos para o editor de fluxo
interface ServiceStep {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  isActive: boolean;
  userRole: 'client' | 'professional' | 'both';
  category?: string;
  estimatedDuration?: number; // em minutos
  autoAdvance?: boolean; // avança automaticamente
  requiresConfirmation?: boolean; // requer confirmação manual
}

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface ServiceFlow {
  id: string;
  categoryId: string;
  categoryName: string;
  steps: ServiceStep[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_ICONS = [
  { name: "Clock", icon: Clock, value: "Clock" },
  { name: "CheckCircle", icon: CheckCircle, value: "CheckCircle" },
  { name: "DollarSign", icon: DollarSign, value: "DollarSign" },
  { name: "Car", icon: Car, value: "Car" },
  { name: "Play", icon: Play, value: "Play" },
  { name: "Star", icon: Star, value: "Star" },
  { name: "Users", icon: Users, value: "Users" }
];

const DEFAULT_COLORS = [
  { name: "Azul", value: "text-blue-600", bg: "bg-blue-50" },
  { name: "Verde", value: "text-green-600", bg: "bg-green-50" },
  { name: "Roxo", value: "text-purple-600", bg: "bg-purple-50" },
  { name: "Laranja", value: "text-orange-600", bg: "bg-orange-50" },
  { name: "Vermelho", value: "text-red-600", bg: "bg-red-50" },
  { name: "Indigo", value: "text-indigo-600", bg: "bg-indigo-50" }
];

export function ServiceFlowEditor() {
  const { user } = useAuth();
  const [flows, setFlows] = useState<ServiceFlow[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<ServiceFlow | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingStep, setEditingStep] = useState<ServiceStep | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Admin • Editor de Fluxos de Atendimento";
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar categorias
      const categoriesData = [
        { id: "limpeza", name: "Limpeza", description: "Serviços de limpeza residencial e comercial", isActive: true },
        { id: "eletrica", name: "Elétrica", description: "Instalações e reparos elétricos", isActive: true },
        { id: "encanamento", name: "Encanamento", description: "Reparos hidráulicos e instalações", isActive: true },
        { id: "jardinagem", name: "Jardinagem", description: "Cuidados com jardins e plantas", isActive: true },
        { id: "pintura", name: "Pintura", description: "Serviços de pintura residencial e comercial", isActive: true }
      ];
      setCategories(categoriesData);

      // Carregar fluxos (por enquanto dados mock)
      const mockFlows = createDefaultFlows(categoriesData);
      setFlows(mockFlows);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do editor');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultFlows = (categories: ServiceCategory[]): ServiceFlow[] => {
    return categories.map(category => ({
      id: `flow-${category.id}`,
      categoryId: category.id,
      categoryName: category.name,
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      steps: getDefaultStepsForCategory(category.id)
    }));
  };

  const getDefaultStepsForCategory = (categoryId: string): ServiceStep[] => {
    const baseSteps: ServiceStep[] = [
      {
        id: "pending",
        name: "Aguardando Orçamentos",
        description: "Cliente criou o pedido e aguarda orçamentos",
        icon: "Clock",
        color: "text-blue-600",
        order: 1,
        isActive: true,
        userRole: "both",
        category: categoryId,
        autoAdvance: false,
        requiresConfirmation: false
      },
      {
        id: "quoted",
        name: "Orçamentos Recebidos",
        description: "Profissionais enviaram orçamentos",
        icon: "DollarSign",
        color: "text-green-600",
        order: 2,
        isActive: true,
        userRole: "client",
        category: categoryId,
        autoAdvance: false,
        requiresConfirmation: true
      },
      {
        id: "accepted",
        name: "Orçamento Aceito",
        description: "Cliente aceitou um orçamento",
        icon: "CheckCircle",
        color: "text-indigo-600",
        order: 3,
        isActive: true,
        userRole: "both",
        category: categoryId,
        autoAdvance: false,
        requiresConfirmation: false
      },
      {
        id: "on_way",
        name: "Profissional a Caminho",
        description: "Profissional está indo para o local",
        icon: "Car",
        color: "text-blue-600",
        order: 4,
        isActive: true,
        userRole: "professional",
        category: categoryId,
        estimatedDuration: 30,
        autoAdvance: false,
        requiresConfirmation: true
      },
      {
        id: "service_started",
        name: "Serviço Iniciado",
        description: "Profissional iniciou a execução",
        icon: "Play",
        color: "text-purple-600",
        order: 5,
        isActive: true,
        userRole: "professional",
        category: categoryId,
        autoAdvance: false,
        requiresConfirmation: true
      },
      {
        id: "in_progress",
        name: "Em Execução",
        description: "Serviço sendo executado",
        icon: "Play",
        color: "text-orange-600",
        order: 6,
        isActive: true,
        userRole: "professional",
        category: categoryId,
        estimatedDuration: getCategoryDuration(categoryId),
        autoAdvance: false,
        requiresConfirmation: false
      },
      {
        id: "awaiting_client",
        name: "Aguardando Cliente",
        description: "Finalizado, aguarda confirmação e pagamento",
        icon: "Clock",
        color: "text-amber-600",
        order: 7,
        isActive: true,
        userRole: "client",
        category: categoryId,
        autoAdvance: false,
        requiresConfirmation: true
      },
      {
        id: "completed",
        name: "Concluído",
        description: "Serviço finalizado com sucesso",
        icon: "Star",
        color: "text-emerald-600",
        order: 8,
        isActive: true,
        userRole: "both",
        category: categoryId,
        autoAdvance: false,
        requiresConfirmation: false
      }
    ];

    return baseSteps;
  };

  const getCategoryDuration = (categoryId: string): number => {
    const durations: Record<string, number> = {
      "limpeza": 120,     // 2 horas
      "eletrica": 90,     // 1.5 horas  
      "encanamento": 60,  // 1 hora
      "jardinagem": 180,  // 3 horas
      "pintura": 240      // 4 horas
    };
    return durations[categoryId] || 90;
  };

  const handleSelectFlow = (flow: ServiceFlow) => {
    setSelectedFlow(flow);
    setSelectedCategory(flow.categoryId);
  };

  const handleAddStep = () => {
    if (!selectedFlow) return;

    const newStep: ServiceStep = {
      id: `step-${Date.now()}`,
      name: "Nova Etapa",
      description: "Descrição da nova etapa",
      icon: "Clock",
      color: "text-blue-600",
      order: selectedFlow.steps.length + 1,
      isActive: true,
      userRole: "both",
      category: selectedFlow.categoryId,
      autoAdvance: false,
      requiresConfirmation: false
    };

    setEditingStep(newStep);
    setIsEditing(true);
  };

  const handleEditStep = (step: ServiceStep) => {
    setEditingStep(step);
    setIsEditing(true);
  };

  const handleSaveStep = () => {
    if (!selectedFlow || !editingStep) return;

    const updatedSteps = selectedFlow.steps.map(step => 
      step.id === editingStep.id ? editingStep : step
    );

    // Se for uma nova etapa, adicionar à lista
    if (!selectedFlow.steps.find(s => s.id === editingStep.id)) {
      updatedSteps.push(editingStep);
    }

    // Reordenar por order
    updatedSteps.sort((a, b) => a.order - b.order);

    const updatedFlow: ServiceFlow = {
      ...selectedFlow,
      steps: updatedSteps,
      updatedAt: new Date().toISOString()
    };

    setSelectedFlow(updatedFlow);
    setFlows(flows.map(f => f.id === updatedFlow.id ? updatedFlow : f));
    setIsEditing(false);
    setEditingStep(null);
    
    toast.success("Etapa salva com sucesso!");
  };

  const handleDeleteStep = (stepId: string) => {
    if (!selectedFlow) return;

    const updatedSteps = selectedFlow.steps.filter(step => step.id !== stepId);
    const updatedFlow: ServiceFlow = {
      ...selectedFlow,
      steps: updatedSteps,
      updatedAt: new Date().toISOString()
    };

    setSelectedFlow(updatedFlow);
    setFlows(flows.map(f => f.id === updatedFlow.id ? updatedFlow : f));
    
    toast.success("Etapa removida com sucesso!");
  };

  const handleSaveFlow = async () => {
    if (!selectedFlow) return;

    setLoading(true);
    try {
      // TODO: Salvar no banco de dados
      // Por enquanto, apenas simula o salvamento
      
      const updatedFlows = flows.map(f => 
        f.id === selectedFlow.id ? selectedFlow : f
      );
      setFlows(updatedFlows);
      
      toast.success("Fluxo salvo com sucesso!");
      
    } catch (error) {
      console.error('Erro ao salvar fluxo:', error);
      toast.error('Erro ao salvar fluxo');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFlow = () => {
    if (!selectedFlow) return;

    const defaultSteps = getDefaultStepsForCategory(selectedFlow.categoryId);
    const resetFlow: ServiceFlow = {
      ...selectedFlow,
      steps: defaultSteps,
      updatedAt: new Date().toISOString()
    };

    setSelectedFlow(resetFlow);
    setFlows(flows.map(f => f.id === resetFlow.id ? resetFlow : f));
    
    toast.success("Fluxo restaurado para o padrão!");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold">Editor de Fluxos de Atendimento</h1>
            </div>
            {selectedFlow && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResetFlow}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restaurar Padrão
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSaveFlow}
                  disabled={loading}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar Fluxo
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Lista de Categorias/Fluxos */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Categorias de Serviço</h2>
              <div className="space-y-3">
                {flows.map((flow) => (
                  <button
                    key={flow.id}
                    onClick={() => handleSelectFlow(flow)}
                    className={`w-full text-left p-3 rounded-lg border transition-all hover:border-primary/50 ${
                      selectedFlow?.id === flow.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{flow.categoryName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {flow.steps.length} etapas
                        </p>
                      </div>
                      <Badge variant={flow.isDefault ? "secondary" : "outline"}>
                        {flow.isDefault ? "Padrão" : "Customizado"}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Editor do Fluxo */}
          <div className="lg:col-span-2">
            {selectedFlow ? (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Fluxo: {selectedFlow.categoryName}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Personalize as etapas do atendimento para esta categoria
                    </p>
                  </div>
                  <Button onClick={handleAddStep} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar Etapa
                  </Button>
                </div>

                <Separator className="mb-6" />

                {/* Lista de Etapas */}
                <div className="space-y-4">
                  {selectedFlow.steps.map((step, index) => {
                    const IconComponent = DEFAULT_ICONS.find(i => i.value === step.icon)?.icon || Clock;
                    
                    return (
                      <div key={step.id} className="border rounded-lg p-4 hover:border-primary/50 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.color} bg-current/10`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{step.name}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {step.order}ª etapa
                                </Badge>
                                <Badge variant={step.userRole === 'both' ? 'default' : 'secondary'} className="text-xs">
                                  {step.userRole === 'both' ? 'Ambos' : 
                                   step.userRole === 'client' ? 'Cliente' : 'Profissional'}
                                </Badge>
                                {step.requiresConfirmation && (
                                  <Badge variant="outline" className="text-xs">
                                    Requer confirmação
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {step.description}
                              </p>
                              {step.estimatedDuration && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Duração estimada: {step.estimatedDuration} minutos
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditStep(step)}
                              className="gap-2"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteStep(step.id)}
                              className="gap-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {index < selectedFlow.steps.length - 1 && (
                          <div className="flex justify-center mt-3">
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecione uma Categoria</h3>
                <p className="text-muted-foreground">
                  Escolha uma categoria à esquerda para começar a editar o fluxo de atendimento.
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Dialog de Edição de Etapa */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingStep?.name === "Nova Etapa" ? "Adicionar" : "Editar"} Etapa
              </DialogTitle>
            </DialogHeader>
            
            {editingStep && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stepName">Nome da Etapa</Label>
                    <Input
                      id="stepName"
                      value={editingStep.name}
                      onChange={(e) => setEditingStep({...editingStep, name: e.target.value})}
                      placeholder="Nome da etapa"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stepOrder">Ordem</Label>
                    <Input
                      id="stepOrder"
                      type="number"
                      value={editingStep.order}
                      onChange={(e) => setEditingStep({...editingStep, order: parseInt(e.target.value)})}
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="stepDescription">Descrição</Label>
                  <Textarea
                    id="stepDescription"
                    value={editingStep.description}
                    onChange={(e) => setEditingStep({...editingStep, description: e.target.value})}
                    placeholder="Descrição da etapa"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Ícone</Label>
                    <Select 
                      value={editingStep.icon} 
                      onValueChange={(value) => setEditingStep({...editingStep, icon: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_ICONS.map((icon) => {
                          const IconComp = icon.icon;
                          return (
                            <SelectItem key={icon.value} value={icon.value}>
                              <div className="flex items-center gap-2">
                                <IconComp className="w-4 h-4" />
                                {icon.name}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Cor</Label>
                    <Select 
                      value={editingStep.color} 
                      onValueChange={(value) => setEditingStep({...editingStep, color: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_COLORS.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full ${color.bg} border`} />
                              {color.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Responsável</Label>
                    <Select 
                      value={editingStep.userRole} 
                      onValueChange={(value: 'client' | 'professional' | 'both') => 
                        setEditingStep({...editingStep, userRole: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">Ambos</SelectItem>
                        <SelectItem value="client">Cliente</SelectItem>
                        <SelectItem value="professional">Profissional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duração Estimada (minutos)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={editingStep.estimatedDuration || ""}
                      onChange={(e) => setEditingStep({
                        ...editingStep, 
                        estimatedDuration: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                      placeholder="Ex: 30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Opções</Label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editingStep.requiresConfirmation}
                          onChange={(e) => setEditingStep({
                            ...editingStep, 
                            requiresConfirmation: e.target.checked
                          })}
                        />
                        Requer confirmação manual
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editingStep.autoAdvance}
                          onChange={(e) => setEditingStep({
                            ...editingStep, 
                            autoAdvance: e.target.checked
                          })}
                        />
                        Avança automaticamente
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveStep}>
                    Salvar Etapa
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}