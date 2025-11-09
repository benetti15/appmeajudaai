import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Phone, FileText, MapPin, User } from "lucide-react";
import { validateCPF, formatCPF } from "@/lib/cpf-validator";

const CompleteProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [userType, setUserType] = useState<"client" | "professional" | "">("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("Uberlândia");
  const [state, setState] = useState("MG");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useAuth();

  useEffect(() => {
    // Se não estiver logado, redirecionar para auth
    if (!user) {
      navigate("/auth");
      return;
    }

    // Se o perfil já estiver completo, redirecionar para home
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
    setPhone(formatPhone(value));
  };

  const handleCpfChange = (value: string) => {
    setCpf(formatCPF(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userType) {
      toast({
        title: "Tipo de conta obrigatório",
        description: "Por favor, selecione se você é cliente ou profissional.",
        variant: "destructive",
      });
      return;
    }

    if (!phone) {
      toast({
        title: "Telefone obrigatório",
        description: "Por favor, informe seu telefone.",
        variant: "destructive",
      });
      return;
    }

    if (!cpf) {
      toast({
        title: "CPF obrigatório",
        description: "Por favor, informe seu CPF.",
        variant: "destructive",
      });
      return;
    }

    if (!validateCPF(cpf)) {
      toast({
        title: "CPF inválido",
        description: "O CPF informado não é válido. Verifique os números digitados.",
        variant: "destructive",
      });
      return;
    }

    if (userType === "professional" && (!street || !number || !neighborhood)) {
      toast({
        title: "Endereço obrigatório",
        description: "Para profissionais, o endereço completo é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const cleanCpf = cpf.replace(/\D/g, '');
      
      const updateData: any = {
        user_type: userType,
        phone: cleanPhone,
        cpf: cleanCpf,
        updated_at: new Date().toISOString(),
      };

      if (userType === "professional") {
        updateData.street = street;
        updateData.number = number;
        updateData.neighborhood = neighborhood;
        updateData.city = city;
        updateData.state = state;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user?.id);

      if (error) {
        toast({
          title: "Erro ao atualizar perfil",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Perfil completado!",
        description: "Suas informações foram salvas com sucesso.",
      });

      // Atualizar o perfil no contexto
      await refreshProfile();
      
      // Redirecionar para home
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Erro ao completar perfil",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10 p-6">
      <Card className="w-full max-w-2xl bg-white/90 backdrop-blur-xl border-0 shadow-2xl">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="flex justify-center mb-4">
            <img 
              src="/lovable-uploads/c8434d06-8f8c-46d0-bbd2-778de3b8f219.png" 
              alt="Me Ajuda ai" 
              className="w-16 h-16" 
            />
          </div>
          <CardTitle className="text-3xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Complete seu Perfil
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            Precisamos de mais algumas informações para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Usuário */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Você é: <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                value={userType}
                onValueChange={(value) => setUserType(value as "client" | "professional")}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="client"
                    id="client"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="client"
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                  >
                    <User className="mb-3 h-8 w-8 text-primary" />
                    <div className="text-center">
                      <div className="font-semibold">Cliente</div>
                      <div className="text-sm text-gray-500">Busco serviços</div>
                    </div>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="professional"
                    id="professional"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="professional"
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-accent peer-data-[state=checked]:bg-accent/5 cursor-pointer transition-all"
                  >
                    <User className="mb-3 h-8 w-8 text-accent" />
                    <div className="text-center">
                      <div className="font-semibold">Profissional</div>
                      <div className="text-sm text-gray-500">Ofereço serviços</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                Telefone <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            {/* CPF */}
            <div className="space-y-2">
              <Label htmlFor="cpf">
                CPF <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => handleCpfChange(e.target.value)}
                  className="pl-10 h-12"
                  required
                  maxLength={14}
                />
              </div>
            </div>

            {/* Endereço - Somente para profissionais */}
            {userType === "professional" && (
              <div className="space-y-4 p-4 bg-accent/5 rounded-lg border-2 border-accent/20">
                <div className="flex items-center gap-2 text-accent font-semibold mb-2">
                  <MapPin className="w-5 h-5" />
                  <span>Endereço Profissional</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="street">
                      Rua <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="street"
                      type="text"
                      placeholder="Nome da rua"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="h-12"
                      required={userType === "professional"}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="number">
                      Número <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="number"
                      type="text"
                      placeholder="123"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="h-12"
                      required={userType === "professional"}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">
                      Bairro <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="neighborhood"
                      type="text"
                      placeholder="Seu bairro"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="h-12"
                      required={userType === "professional"}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="Uberlândia"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Select value={state} onValueChange={setState}>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MG">MG</SelectItem>
                        <SelectItem value="SP">SP</SelectItem>
                        <SelectItem value="RJ">RJ</SelectItem>
                        <SelectItem value="ES">ES</SelectItem>
                        <SelectItem value="BA">BA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg font-medium" 
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Completar Perfil"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;
