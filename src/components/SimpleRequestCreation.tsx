import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedAddressInput } from "@/components/address/EnhancedAddressInput";
import { FileUpload } from "@/components/ui/file-upload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Calendar, Clock, User, FileText, AlertCircle, Send, Loader2, ArrowLeft } from "lucide-react";
import { AddressData, formatAddress } from "@/lib/address-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

interface SimpleRequestCreationProps {
  categoryId?: string;
}

export function SimpleRequestCreation({ categoryId }: SimpleRequestCreationProps) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    preferred_time: "",
    urgency_level: "1",
    preferred_date: ""
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
  
  const [loading, setLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [showProfileAddressOption, setShowProfileAddressOption] = useState(false);

  // Verificar se usuário tem endereço no perfil
  useEffect(() => {
    if (profile?.street && profile?.city && profile?.state) {
      setShowProfileAddressOption(true);
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUseProfileAddress = () => {
    if (!profile) return;

    setAddressData({
      street: profile.street || "",
      number: profile.number || "",
      complement: profile.complement || "",
      neighborhood: profile.neighborhood || "",
      city: profile.city || "",
      state: profile.state || "",
      postal_code: profile.postal_code || "",
      latitude: profile.latitude ? Number(profile.latitude) : null,
      longitude: profile.longitude ? Number(profile.longitude) : null,
      formatted_address: profile.formatted_address || formatAddress({
        street: profile.street,
        number: profile.number,
        neighborhood: profile.neighborhood,
        city: profile.city,
        state: profile.state
      })
    });

    toast({
      title: "Endereço carregado",
      description: "Endereço do seu perfil foi carregado com sucesso"
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar uma solicitação",
        variant: "destructive"
      });
      return;
    }

    if (!formData.title || !formData.description || !addressData.street) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Validar se o endereço está geocodificado
    if (!addressData.latitude || !addressData.longitude) {
      toast({
        title: "Endereço não validado",
        description: "Por favor, use a busca de endereço para garantir uma localização precisa",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {

      // Adicionar informação do horário preferido na descrição se selecionado
      let fullDescription = formData.description;
      if (formData.preferred_time) {
        const timeLabels = {
          manha: "Manhã (08:00 - 12:00)",
          tarde: "Tarde (12:00 - 18:00)", 
          noite: "Noite (18:00 - 22:00)",
          flexivel: "Flexível"
        };
        fullDescription += `\n\nHorário preferido: ${timeLabels[formData.preferred_time as keyof typeof timeLabels]}`;
      }

      const { data, error } = await supabase
        .from("service_requests")
        .insert({
          client_id: user.id,
          category_id: categoryId,
          title: formData.title,
          description: fullDescription,
          street: addressData.street,
          number: addressData.number,
          complement: addressData.complement || null,
          neighborhood: addressData.neighborhood,
          city: addressData.city,
          state: addressData.state,
          postal_code: addressData.postal_code,
          address: addressData.formatted_address,
          formatted_address: addressData.formatted_address,
          latitude: addressData.latitude,
          longitude: addressData.longitude,
          urgency_level: parseInt(formData.urgency_level),
          preferred_date: formData.preferred_date || null,
          status: "pending",
          attachments: attachedFiles.length > 0 ? attachedFiles.map(f => ({
            name: f.name,
            type: f.type,
            url: f.url,
            size: f.size
          })) : null
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Sua solicitação foi criada com sucesso",
      });

      // Pequeno delay para garantir que o módulo seja carregado corretamente
      setTimeout(() => {
        navigate("/my-requests");
      }, 100);
    } catch (error) {
      console.error("Erro ao criar solicitação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a solicitação",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-2xl border-2 border-border/50
                   bg-gradient-to-br from-card via-card to-primary/5
                   animate-fade-in">
      <CardHeader className="space-y-2 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 
                           border-b border-border/50">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/30 to-accent/20 shadow-lg">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          Detalhes da Solicitação
        </CardTitle>
        <CardDescription className="text-base">
          Preencha as informações para receber orçamentos de profissionais qualificados
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Seção 1: Informações Básicas */}
          <div className="space-y-5 p-5 rounded-xl bg-muted/30 border border-border/50">
            <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
              <FileText className="h-5 w-5 text-primary" />
              Informações do Serviço
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-medium">
                Título do Serviço <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Ex: Conserto de torneira, Limpeza de casa..."
                className="h-12 text-base border-2 focus:border-primary transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-medium">
                Descrição Detalhada <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Descreva com detalhes o serviço que precisa..."
                rows={5}
                className="text-base border-2 focus:border-primary transition-colors resize-none"
                required
              />
              <p className="text-xs text-muted-foreground">
                Quanto mais detalhes, mais precisos serão os orçamentos
              </p>
            </div>
          </div>

          {/* Seção 2: Localização */}
          <div className="space-y-5 p-5 rounded-xl bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 
                        border border-primary/20">
            <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
              <MapPin className="h-5 w-5 text-primary" />
              Onde será realizado o serviço?
            </h3>

            {/* Opção de usar endereço do perfil */}
            {showProfileAddressOption && !addressData.street && (
              <Alert className="border-primary/30 bg-primary/10 animate-fade-in">
                <User className="h-4 w-4 text-primary" />
                <AlertDescription className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Usar endereço cadastrado no perfil?
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleUseProfileAddress}
                    className="ml-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  >
                    Usar endereço do perfil
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-base font-medium">
                <MapPin className="h-4 w-4 text-primary" />
                Endereço Completo
                <span className="text-destructive">*</span>
              </Label>
              <EnhancedAddressInput
                value={addressData}
                onChange={setAddressData}
                required
                allowCurrentLocation
              />
            </div>
          </div>

          {/* Seção 3: Agendamento e Preferências */}
          <div className="space-y-5 p-5 rounded-xl bg-muted/30 border border-border/50">
            <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
              <Clock className="h-5 w-5 text-primary" />
              Preferências de Agendamento
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="preferred_time" className="flex items-center gap-2 text-base font-medium">
                  <Clock className="h-4 w-4" />
                  Melhor Horário
                </Label>
                <Select value={formData.preferred_time} onValueChange={(value) => handleInputChange("preferred_time", value)}>
                  <SelectTrigger className="h-12 text-base border-2 focus:border-primary transition-colors">
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manha" className="text-base py-3">
                      ☀️ Manhã (08:00 - 12:00)
                    </SelectItem>
                    <SelectItem value="tarde" className="text-base py-3">
                      🌤️ Tarde (12:00 - 18:00)
                    </SelectItem>
                    <SelectItem value="noite" className="text-base py-3">
                      🌙 Noite (18:00 - 22:00)
                    </SelectItem>
                    <SelectItem value="flexivel" className="text-base py-3">
                      ⏰ Flexível
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="preferred_date" className="flex items-center gap-2 text-base font-medium">
                  <Calendar className="h-4 w-4" />
                  Data Preferida
                </Label>
                <Input
                  id="preferred_date"
                  type="date"
                  value={formData.preferred_date}
                  onChange={(e) => handleInputChange("preferred_date", e.target.value)}
                  className="h-12 text-base border-2 focus:border-primary transition-colors"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Campo de Urgência com Visual Aprimorado */}
            <div className="space-y-3">
              <Label htmlFor="urgency_level" className="text-base font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Nível de Urgência
              </Label>
              <Select value={formData.urgency_level} onValueChange={(value) => handleInputChange("urgency_level", value)}>
                <SelectTrigger className="h-14 text-base border-2 focus:border-primary transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1" className="text-base py-4 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30 px-3 py-1">
                        <Clock className="h-3 w-3 mr-1" />
                        Baixa
                      </Badge>
                      <span>Posso aguardar alguns dias</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="2" className="text-base py-4 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 px-3 py-1">
                        <Clock className="h-3 w-3 mr-1" />
                        Média
                      </Badge>
                      <span>Preciso em alguns dias</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="3" className="text-base py-4 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30 px-3 py-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Alta
                      </Badge>
                      <span>Preciso urgentemente</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* File Upload Section com Visual Melhorado */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 
                        border border-primary/20">
            <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground mb-4">
              <FileText className="h-5 w-5 text-primary" />
              Fotos e Documentos (Opcional)
            </h3>
            <FileUpload
              onFilesUploaded={setAttachedFiles}
              maxFiles={3}
              maxSizePerFile={5}
              acceptedFileTypes={['image/*', 'application/pdf']}
              existingFiles={attachedFiles}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Adicione fotos ou documentos que ajudem o profissional a entender melhor o serviço
            </p>
          </div>

          {/* Botões de Ação Melhorados */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate("/categories")}
              className="h-12 text-base border-2 hover:bg-muted transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              size="lg"
              className="h-12 text-base bg-gradient-to-r from-primary to-accent 
                       hover:opacity-90 hover:scale-105 transition-all duration-200 
                       shadow-lg hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Criando Solicitação...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Criar Solicitação
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}