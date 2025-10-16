import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Send,
  Clock,
  Bell,
  Zap,
  ArrowLeft
} from 'lucide-react';

// Template interfaces
interface ServiceTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: TemplateField[];
  created_by: string;
  is_public: boolean;
  usage_count: number;
  created_at: string;
}

interface TemplateField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'date';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: 'greeting' | 'quote' | 'followup' | 'completion' | 'other';
  variables: string[];
  created_by: string;
  created_at: string;
}

interface AutomationRule {
  id: string;
  name: string;
  trigger: 'new_request' | 'quote_sent' | 'quote_accepted' | 'service_completed' | 'time_based';
  conditions: any;
  actions: AutomationAction[];
  is_active: boolean;
  created_by: string;
}

interface AutomationAction {
  type: 'send_message' | 'send_notification' | 'update_status' | 'create_reminder';
  config: any;
}

// Service Templates Component
export const ServiceTemplatesManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ServiceTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Mock data for template system - in real app these would be database calls
  const mockTemplateData = async () => {
    // Mock implementation
    console.log('Template system would integrate with database');
    return [];
  };

  const fetchTemplates = async () => {
    try {
      // Mock templates data - in real app this would come from database
      const mockTemplates: ServiceTemplate[] = [
        {
          id: '1',
          name: 'Limpeza Residencial',
          description: 'Template para serviços de limpeza residencial',
          category: 'Limpeza',
          fields: [],
          created_by: user?.id || '',
          is_public: true,
          usage_count: 15,
          created_at: new Date().toISOString()
        }
      ];
      
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (templateData: Partial<ServiceTemplate>) => {
    try {
      // Mock create template - in real app this would save to database
      const newTemplate: ServiceTemplate = {
        id: Date.now().toString(),
        name: templateData.name || '',
        description: templateData.description || '',
        category: templateData.category || '',
        fields: templateData.fields || [],
        created_by: user?.id || '',
        is_public: templateData.is_public || false,
        usage_count: 0,
        created_at: new Date().toISOString()
      };

      setTemplates(prev => [newTemplate, ...prev]);
      toast({
        title: "Sucesso",
        description: "Template criado com sucesso!",
      });
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o template",
        variant: "destructive",
      });
    }
  };

  const useTemplate = async (template: ServiceTemplate) => {
    try {
      // Mock increment usage count - in real app this would update database
      toast({
        title: "Template aplicado",
        description: "Template carregado para novo pedido",
      });
    } catch (error) {
      console.error('Error using template:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Templates de Serviço</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Template de Serviço</DialogTitle>
            </DialogHeader>
            <TemplateForm onSubmit={createTemplate} onCancel={() => setIsCreating(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {template.description}
                  </p>
                </div>
                <Badge variant="secondary">{template.category}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {template.fields.length} campos • {template.usage_count} usos
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => useTemplate(template)}
                    className="flex-1"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Usar Template
                  </Button>
                  {template.created_by === user?.id && (
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Message Templates Component
export const MessageTemplatesManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchMessageTemplates();
  }, []);

  const fetchMessageTemplates = async () => {
    try {
      // Mock message templates - in real app this would come from database
      const mockMessageTemplates: MessageTemplate[] = [
        {
          id: '1',
          name: 'Saudação Inicial',
          content: 'Olá {cliente_nome}, obrigado por escolher nossos serviços!',
          category: 'greeting',
          variables: ['cliente_nome'],
          created_by: user?.id || '',
          created_at: new Date().toISOString()
        }
      ];
      
      setTemplates(mockMessageTemplates);
    } catch (error) {
      console.error('Error fetching message templates:', error);
    }
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const categories = [
    { value: 'all', label: 'Todos' },
    { value: 'greeting', label: 'Saudação' },
    { value: 'quote', label: 'Orçamento' },
    { value: 'followup', label: 'Acompanhamento' },
    { value: 'completion', label: 'Finalização' },
    { value: 'other', label: 'Outros' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Templates de Mensagem</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nova Mensagem Template
        </Button>
      </div>

      <div className="flex gap-4">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <Badge>{template.category}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {template.content}
                </p>
                {template.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map(variable => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {`{${variable}}`}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                  <Button size="sm" variant="outline">
                    <Send className="w-4 h-4 mr-2" />
                    Usar
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Automation System Component
export const AutomationManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [automations, setAutomations] = useState<AutomationRule[]>([]);

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      // Mock automations - in real app this would come from database
      const mockAutomations: AutomationRule[] = [
        {
          id: '1',
          name: 'Envio automático de orçamento',
          trigger: 'new_request',
          conditions: {},
          actions: [],
          is_active: true,
          created_by: user?.id || ''
        }
      ];
      
      setAutomations(mockAutomations);
    } catch (error) {
      console.error('Error fetching automations:', error);
    }
  };

  const toggleAutomation = async (id: string, isActive: boolean) => {
    try {
      // Mock toggle automation - in real app this would update database
      setAutomations(prev => 
        prev.map(auto => 
          auto.id === id ? { ...auto, is_active: !isActive } : auto
        )
      );

      toast({
        title: "Automação atualizada",
        description: `Automação ${!isActive ? 'ativada' : 'desativada'} com sucesso`,
      });
    } catch (error) {
      console.error('Error toggling automation:', error);
    }
  };

  const automationTypes = {
    new_request: 'Novo Pedido',
    quote_sent: 'Orçamento Enviado',
    quote_accepted: 'Orçamento Aceito',
    service_completed: 'Serviço Concluído',
    time_based: 'Baseado em Tempo'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Automações</h2>
        <Button>
          <Zap className="w-4 h-4 mr-2" />
          Nova Automação
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {automations.map((automation) => (
          <Card key={automation.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{automation.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={automation.is_active ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => toggleAutomation(automation.id, automation.is_active)}
                  >
                    {automation.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  Trigger: {automationTypes[automation.trigger]}
                </div>
                <div className="text-sm">
                  {automation.actions.length} ação(ões) configurada(s)
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline">
                    <Bell className="w-4 h-4 mr-2" />
                    Histórico
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Template Form Component
interface TemplateFormProps {
  onSubmit: (data: Partial<ServiceTemplate>) => void;
  onCancel: () => void;
  initialData?: ServiceTemplate;
}

const TemplateForm = ({ onSubmit, onCancel, initialData }: TemplateFormProps) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    is_public: initialData?.is_public || false,
    fields: initialData?.fields || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nome do Template</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Limpeza Residencial Completa"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Descrição</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Descreva o que este template inclui..."
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Categoria</label>
        <Input
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          placeholder="Ex: Limpeza, Manutenção, etc."
          required
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {initialData ? 'Atualizar' : 'Criar'} Template
        </Button>
      </div>
    </form>
  );
};

// Main Template System Component
export const TemplateSystem = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-primary">Sistema de Templates</h1>
              <p className="text-sm text-muted-foreground">Gerencie templates e automações</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 max-w-6xl">
        <Tabs defaultValue="service" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="service">Templates de Serviço</TabsTrigger>
            <TabsTrigger value="messages">Templates de Mensagem</TabsTrigger>
            <TabsTrigger value="automation">Automações</TabsTrigger>
          </TabsList>

          <TabsContent value="service">
            <ServiceTemplatesManager />
          </TabsContent>

          <TabsContent value="messages">
            <MessageTemplatesManager />
          </TabsContent>

          <TabsContent value="automation">
            <AutomationManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};