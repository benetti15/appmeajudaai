import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EnhancedAddressInput } from "@/components/address/EnhancedAddressInput";
import { FileUpload } from "@/components/ui/file-upload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, Calendar, Clock, FileText, Send, Loader2, 
  CheckCircle2, ChevronRight, ChevronLeft, Sparkles,
  Zap, AlertTriangle, Timer
} from "lucide-react";
import { AddressData, formatAddress } from "@/lib/address-utils";
import { cn } from "@/lib/utils";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

interface ModernRequestFormProps {
  categoryId: string;
  categoryName?: string;
}

const STEPS = [
  { id: 1, title: "Serviço", icon: FileText },
  { id: 2, title: "Local", icon: MapPin },
  { id: 3, title: "Agenda", icon: Calendar },
];

export function ModernRequestForm({ categoryId, categoryName }: ModernRequestFormProps) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
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

  // Auto-fill from profile
  useEffect(() => {
    if (profile?.street && profile?.city && !addressData.street) {
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
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return formData.title.trim().length >= 3 && formData.description.trim().length >= 10;
    }
    if (currentStep === 2) {
      return addressData.street && addressData.city && addressData.latitude;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      let fullDescription = formData.description;
      if (formData.preferred_time) {
        const timeLabels: Record<string, string> = {
          manha: "Manhã (08:00 - 12:00)",
          tarde: "Tarde (12:00 - 18:00)", 
          noite: "Noite (18:00 - 22:00)",
          flexivel: "Flexível"
        };
        fullDescription += `\n\nHorário preferido: ${timeLabels[formData.preferred_time]}`;
      }

      const { error } = await supabase
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
        });

      if (error) throw error;

      toast({
        title: "🎉 Solicitação criada!",
        description: "Profissionais já estão sendo notificados",
      });

      setTimeout(() => navigate("/my-requests"), 100);
    } catch (error) {
      console.error("Erro:", error);
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
    <div className="w-full max-w-2xl mx-auto">
      {/* Stepper Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-10" />
          <div 
            className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-primary to-accent -z-10 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
          />
          
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex flex-col items-center gap-2">
                <button
                  onClick={() => isCompleted && setCurrentStep(step.id)}
                  disabled={!isCompleted && !isActive}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    "border-2 relative",
                    isCompleted && "bg-primary border-primary text-primary-foreground cursor-pointer hover:scale-110",
                    isActive && "bg-background border-primary text-primary ring-4 ring-primary/20",
                    !isActive && !isCompleted && "bg-muted border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </button>
                <span className={cn(
                  "text-xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-card rounded-2xl border shadow-lg overflow-hidden">
        {/* Step 1: Service Info */}
        <div className={cn(
          "transition-all duration-300",
          currentStep === 1 ? "block animate-fade-in" : "hidden"
        )}>
          <div className="p-6 space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-1">O que você precisa?</h2>
              <p className="text-sm text-muted-foreground">
                Descreva o serviço para receber os melhores orçamentos
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Título resumido
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Ex: Conserto de torneira vazando"
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Detalhes do serviço
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Descreva o problema ou o que precisa ser feito..."
                  rows={4}
                  className="text-base resize-none"
                />
              </div>

              {/* Quick Photo Upload */}
              <div className="pt-2">
                <Label className="text-sm font-medium mb-3 block">
                  Fotos (opcional)
                </Label>
                <FileUpload
                  onFilesUploaded={setAttachedFiles}
                  maxFiles={3}
                  maxSizePerFile={5}
                  acceptedFileTypes={['image/*']}
                  existingFiles={attachedFiles}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Location */}
        <div className={cn(
          "transition-all duration-300",
          currentStep === 2 ? "block animate-fade-in" : "hidden"
        )}>
          <div className="p-6 space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-1">Onde será o serviço?</h2>
              <p className="text-sm text-muted-foreground">
                Informe o endereço para encontrar profissionais próximos
              </p>
            </div>

            <EnhancedAddressInput
              value={addressData}
              onChange={setAddressData}
              required
              allowCurrentLocation
            />

            {addressData.formatted_address && (
              <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20 animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-primary">Endereço confirmado</p>
                  <p className="text-sm text-muted-foreground">{addressData.formatted_address}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Schedule & Urgency */}
        <div className={cn(
          "transition-all duration-300",
          currentStep === 3 ? "block animate-fade-in" : "hidden"
        )}>
          <div className="p-6 space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-1">Quando você precisa?</h2>
              <p className="text-sm text-muted-foreground">
                Configure suas preferências de agendamento
              </p>
            </div>

            {/* Urgency Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Urgência</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "1", label: "Tranquilo", icon: Timer, color: "text-green-600", bg: "bg-green-500/10 border-green-500/30 hover:bg-green-500/20" },
                  { value: "2", label: "Médio", icon: Clock, color: "text-yellow-600", bg: "bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20" },
                  { value: "3", label: "Urgente", icon: Zap, color: "text-red-600", bg: "bg-red-500/10 border-red-500/30 hover:bg-red-500/20" },
                ].map((option) => {
                  const Icon = option.icon;
                  const isSelected = formData.urgency_level === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange("urgency_level", option.value)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all duration-200",
                        "flex flex-col items-center gap-2",
                        option.bg,
                        isSelected && "ring-2 ring-offset-2 ring-primary scale-105"
                      )}
                    >
                      <Icon className={cn("w-6 h-6", option.color)} />
                      <span className={cn("text-sm font-medium", option.color)}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data preferida</Label>
                <Input
                  type="date"
                  value={formData.preferred_date}
                  onChange={(e) => handleInputChange("preferred_date", e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="h-12"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Horário</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "manha", label: "Manhã" },
                    { value: "tarde", label: "Tarde" },
                  ].map((time) => (
                    <button
                      key={time.value}
                      type="button"
                      onClick={() => handleInputChange("preferred_time", time.value)}
                      className={cn(
                        "h-12 rounded-lg border-2 text-sm font-medium transition-all",
                        formData.preferred_time === time.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {time.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary Preview */}
            <div className="p-4 bg-muted/50 rounded-xl space-y-2 mt-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Resumo da solicitação
              </h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><span className="font-medium text-foreground">Serviço:</span> {formData.title || "—"}</p>
                <p><span className="font-medium text-foreground">Local:</span> {addressData.city ? `${addressData.neighborhood}, ${addressData.city}` : "—"}</p>
                <p><span className="font-medium text-foreground">Categoria:</span> {categoryName || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-muted/30 border-t flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : navigate("/categories")}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {currentStep > 1 ? "Voltar" : "Cancelar"}
          </Button>

          {currentStep < 3 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              Continuar
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || !canProceed()}
              className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 min-w-[160px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar Pedido
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
