import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StepIndicator, Step } from "@/components/ui/step-indicator";
import { ProgressRing } from "@/components/ui/progress-ring";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Phone, FileText, MapPin, User, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { validateCPF, formatCPF } from "@/lib/cpf-validator";

const steps: Step[] = [
  { id: "type", label: "Tipo", description: "Escolha seu perfil" },
  { id: "contact", label: "Contato", description: "Telefone e CPF" },
  { id: "address", label: "Endereço", description: "Localização" },
  { id: "done", label: "Pronto!", description: "Finalizar" },
];

export default function ProfileSetupWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    userType: "" as "client" | "professional" | "",
    phone: "",
    cpf: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "Uberlândia",
    state: "MG",
  });
  const [cpfValid, setCpfValid] = useState<boolean | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (profile?.phone && profile?.cpf && profile?.user_type) {
      navigate("/");
    }
  }, [user, profile, navigate]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{0,5})(\d{0,4})/, (_, area, first, second) => {
        let formatted = `(${area}`;
        if (first) formatted += `) ${first}`;
        if (second) formatted += `-${second}`;
        return formatted;
      });
    }
    return value;
  };

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, phone: formatPhone(value) });
  };

  const handleCpfChange = (value: string) => {
    const formatted = formatCPF(value);
    setFormData({ ...formData, cpf: formatted });
    
    const cleanCPF = formatted.replace(/\D/g, '');
    if (cleanCPF.length === 11) {
      setCpfValid(validateCPF(formatted));
    } else if (cleanCPF.length === 0) {
      setCpfValid(null);
    } else {
      setCpfValid(false);
    }
  };

  const calculateProgress = () => {
    let progress = 0;
    if (formData.userType) progress += 25;
    if (formData.phone && formData.cpf && cpfValid) progress += 35;
    if (formData.userType === "professional") {
      if (formData.street && formData.number && formData.neighborhood) progress += 40;
    } else {
      progress += 40;
    }
    return Math.min(progress, 100);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!formData.userType;
      case 1:
        return formData.phone && formData.cpf && cpfValid;
      case 2:
        if (formData.userType === "professional") {
          return formData.street && formData.number && formData.neighborhood;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;
    
    // Skip address step for clients
    if (currentStep === 1 && formData.userType === "client") {
      setCurrentStep(3);
    } else {
      setCurrentStep(Math.min(currentStep + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    // Skip address step for clients when going back
    if (currentStep === 3 && formData.userType === "client") {
      setCurrentStep(1);
    } else {
      setCurrentStep(Math.max(currentStep - 1, 0));
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      const cleanCpf = formData.cpf.replace(/\D/g, '');
      
      const updateData: any = {
        user_type: formData.userType,
        phone: cleanPhone,
        cpf: cleanCpf,
        updated_at: new Date().toISOString(),
      };

      if (formData.userType === "professional") {
        updateData.street = formData.street;
        updateData.number = formData.number;
        updateData.neighborhood = formData.neighborhood;
        updateData.city = formData.city;
        updateData.state = formData.state;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user?.id);

      if (error) throw error;

      toast({
        title: "🎉 Perfil completado!",
        description: "Suas informações foram salvas com sucesso.",
      });

      await refreshProfile();
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Erro ao completar perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Vamos começar! 👋</h2>
              <p className="text-muted-foreground">
                Como você pretende usar o Me Ajuda AI?
              </p>
            </div>

            <RadioGroup
              value={formData.userType}
              onValueChange={(value) => setFormData({ ...formData, userType: value as "client" | "professional" })}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="client" id="client" className="peer sr-only" />
                <Label
                  htmlFor="client"
                  className="flex flex-col items-center justify-between rounded-xl border-2 border-border bg-card p-6 hover:bg-accent/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all hover-lift"
                >
                  <User className="mb-4 h-12 w-12 text-primary" />
                  <div className="text-center space-y-2">
                    <div className="font-semibold text-lg">Cliente</div>
                    <div className="text-sm text-muted-foreground">
                      Busco profissionais para resolver meus problemas
                    </div>
                  </div>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="professional" id="professional" className="peer sr-only" />
                <Label
                  htmlFor="professional"
                  className="flex flex-col items-center justify-between rounded-xl border-2 border-border bg-card p-6 hover:bg-accent/5 peer-data-[state=checked]:border-accent peer-data-[state=checked]:bg-accent/5 cursor-pointer transition-all hover-lift"
                >
                  <Sparkles className="mb-4 h-12 w-12 text-accent" />
                  <div className="text-center space-y-2">
                    <div className="font-semibold text-lg">Profissional</div>
                    <div className="text-sm text-muted-foreground">
                      Ofereço serviços e quero encontrar clientes
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-primary flex items-start gap-2">
                <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Dica:</strong> Profissionais verificados recebem até 3x mais solicitações!
                </span>
              </p>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Informações de Contato 📱</h2>
              <p className="text-muted-foreground">
                Precisamos desses dados para sua segurança
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="pl-11 h-12 text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => handleCpfChange(e.target.value)}
                    className={`pl-11 pr-11 h-12 text-base ${
                      cpfValid === true ? 'border-primary focus:border-primary' : 
                      cpfValid === false ? 'border-destructive focus:border-destructive' : ''
                    }`}
                    maxLength={14}
                  />
                  {cpfValid === true && (
                    <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary w-5 h-5" />
                  )}
                  {cpfValid === false && (
                    <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-destructive w-5 h-5" />
                  )}
                </div>
                {cpfValid === false && formData.cpf.replace(/\D/g, '').length === 11 && (
                  <p className="text-sm text-destructive">CPF inválido</p>
                )}
              </div>
            </div>

            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
              <p className="text-sm text-accent-foreground flex items-start gap-2">
                <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Seus dados são protegidos e nunca serão compartilhados
                </span>
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Endereço Profissional 📍</h2>
              <p className="text-muted-foreground">
                Onde você atende seus clientes?
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">Rua *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    id="street"
                    type="text"
                    placeholder="Nome da rua"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    className="pl-11 h-12 text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number">Número *</Label>
                  <Input
                    id="number"
                    type="text"
                    placeholder="123"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro *</Label>
                  <Input
                    id="neighborhood"
                    type="text"
                    placeholder="Seu bairro"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    className="h-12 text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Select value={formData.state} onValueChange={(value) => setFormData({ ...formData, state: value })}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MG">MG</SelectItem>
                      <SelectItem value="SP">SP</SelectItem>
                      <SelectItem value="RJ">RJ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8 animate-fade-in text-center">
            <div className="flex justify-center">
              <ProgressRing progress={calculateProgress()} size={160} />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Tudo pronto! 🎉</h2>
              <p className="text-muted-foreground text-lg">
                Seu perfil está {calculateProgress()}% completo
              </p>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-6 space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                <p className="text-left">
                  <strong>Tipo de conta:</strong> {formData.userType === "client" ? "Cliente" : "Profissional"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                <p className="text-left">
                  <strong>Contato:</strong> {formData.phone}
                </p>
              </div>
              {formData.userType === "professional" && (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                  <p className="text-left">
                    <strong>Endereço:</strong> {formData.street}, {formData.number}
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              size="lg"
              className="w-full h-14 text-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              {isLoading ? "Finalizando..." : "Finalizar Cadastro"}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-3xl p-8 shadow-2xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <img
              src="/lovable-uploads/c8434d06-8f8c-46d0-bbd2-778de3b8f219.png"
              alt="Me Ajuda AI"
              className="w-16 h-16 mx-auto animate-bounce-in"
            />
            <h1 className="text-3xl font-display font-black bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto]">
              ME AJUDA AI!
            </h1>
          </div>

          {/* Step Indicator */}
          <StepIndicator steps={steps} currentStep={currentStep} />

          {/* Content */}
          <div className="min-h-[400px]">{renderStepContent()}</div>

          {/* Navigation */}
          {currentStep < 3 && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="flex-1 h-12"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 h-12 bg-gradient-to-r from-primary to-accent"
              >
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
