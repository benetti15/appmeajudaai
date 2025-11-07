import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedAddressInput } from "@/components/address/EnhancedAddressInput";
import { FileUpload } from "@/components/ui/file-upload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Calendar, Clock, User } from "lucide-react";
import { AddressData, formatAddress } from "@/lib/address-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Nova Solicitação de Serviço
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Serviço *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Ex: Conserto de torneira, Limpeza de casa..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição Detalhada *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descreva com detalhes o serviço que precisa..."
              rows={4}
              required
            />
          </div>

          {/* Opção de usar endereço do perfil */}
          {showProfileAddressOption && !addressData.street && (
            <Alert className="border-primary/30 bg-primary/5">
              <User className="h-4 w-4 text-primary" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-sm">
                  Usar endereço cadastrado no perfil?
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  onClick={handleUseProfileAddress}
                  className="ml-2"
                >
                  Usar endereço do perfil
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Campo de Endereço Aprimorado */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Endereço
              <span className="text-destructive">*</span>
            </Label>
            <EnhancedAddressInput
              value={addressData}
              onChange={setAddressData}
              required
              allowCurrentLocation
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferred_time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Melhor Horário para Atendimento
              </Label>
              <Select value={formData.preferred_time} onValueChange={(value) => handleInputChange("preferred_time", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manha">Manhã (08:00 - 12:00)</SelectItem>
                  <SelectItem value="tarde">Tarde (12:00 - 18:00)</SelectItem>
                  <SelectItem value="noite">Noite (18:00 - 22:00)</SelectItem>
                  <SelectItem value="flexivel">Flexível</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preferred_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data Preferida (opcional)
              </Label>
              <Input
                id="preferred_date"
                type="date"
                value={formData.preferred_date}
                onChange={(e) => handleInputChange("preferred_date", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="urgency_level">Nível de Urgência</Label>
            <Select value={formData.urgency_level} onValueChange={(value) => handleInputChange("urgency_level", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Baixa - Posso aguardar alguns dias</SelectItem>
                <SelectItem value="2">Média - Preciso em alguns dias</SelectItem>
                <SelectItem value="3">Alta - Preciso urgentemente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Upload Section */}
          <FileUpload
            onFilesUploaded={setAttachedFiles}
            maxFiles={3}
            maxSizePerFile={5}
            acceptedFileTypes={['image/*', 'application/pdf']}
            existingFiles={attachedFiles}
          />

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/categories")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Solicitação"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}