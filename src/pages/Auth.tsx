import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, UserPlus, Wrench, Mail, Phone, Eye, EyeOff, MapPin, FileText } from "lucide-react";
import heroImage from "/lovable-uploads/bcdf9267-23f4-43c5-9f60-203b73298aa4.png";
// Using the new logo directly from public uploads

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState<"client" | "professional" | "">("");
  const [showPassword, setShowPassword] = useState(false);
  const [cpf, setCpf] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Uberlândia");
  const [state, setState] = useState("MG");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate]);

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

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, (_, first, second, third, fourth) => {
        let formatted = first;
        if (second) formatted += `.${second}`;
        if (third) formatted += `.${third}`;
        if (fourth) formatted += `-${fourth}`;
        return formatted;
      });
    }
    return value;
  };

  const handleCpfChange = (value: string) => {
    setCpf(formatCPF(value));
  };

  const detectInputType = (input: string) => {
    // Remove all non-numeric characters to check if it's a phone
    const numbers = input.replace(/\D/g, '');
    // If input has @ symbol, it's email
    if (input.includes('@')) {
      return 'email';
    }
    // If input has only numbers (and parentheses/dashes), it's phone
    if (numbers.length >= 10 && input.replace(/[\d\s\(\)\-]/g, '').length === 0) {
      return 'phone';
    }
    // Default to email if unclear
    return 'email';
  };

  const handleInputChange = (value: string) => {
    const inputType = detectInputType(value);
    if (inputType === 'phone') {
      setLoginInput(formatPhone(value));
    } else {
      setLoginInput(value);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast({
          title: "Erro ao entrar com Google",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
      }
      // Don't set loading to false here - user is being redirected
    } catch (error: any) {
      toast({
        title: "Erro ao entrar com Google",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const inputType = detectInputType(loginInput);
      let loginCredential = "";
      
      if (inputType === "email") {
        loginCredential = loginInput;
      } else {
        // Convert phone number to email format for Supabase
        const cleanPhone = loginInput.replace(/\D/g, '');
        loginCredential = `${cleanPhone}@phone.temp`;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginCredential,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Erro no login",
            description: `${inputType === 'email' ? 'Email' : 'Telefone'} ou senha incorretos. Verifique suas credenciais.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro no login",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      if (data.user) {
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para o dashboard...",
        });
        window.location.href = "/";
      }
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userType) {
      toast({
        title: "Tipo de conta obrigatório",
        description: "Por favor, selecione se você é cliente ou profissional para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (!email) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, informe seu email.",
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

    if (userType === "professional" && !address) {
      toast({
        title: "Endereço obrigatório",
        description: "Para profissionais, o endereço é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      const cleanPhone = phone.replace(/\D/g, '');
      
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            user_type: userType,
            phone: cleanPhone,
            email: email,
            cpf: cpf.replace(/\D/g, ''),
            address: userType === "professional" ? address : null,
            city: userType === "professional" ? city : null,
            state: userType === "professional" ? state : null,
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast({
            title: "Usuário já cadastrado",
            description: "Este email já está cadastrado. Faça login ou use outro email.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro no cadastro",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      if (data.user) {
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Verifique seu email para confirmar a conta antes de fazer login.",
        });
        // Reset form
        setFullName("");
        setEmail("");
        setPhone("");
        setCpf("");
        setAddress("");
        setUserType("");
        setPassword("");
      }
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-primary/5 to-accent/10">
      {/* Left Side - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-accent/90"></div>
        <img 
          src={heroImage} 
          alt="Professional Services Platform" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <img src="/lovable-uploads/c8434d06-8f8c-46d0-bbd2-778de3b8f219.png" alt="Me Ajuda ai" className="w-20 h-20 mb-8 animate-float" />
          <h1 className="text-5xl font-display font-bold mb-6 text-center">
            Me Ajuda ai!
          </h1>
          <p className="text-xl text-center opacity-90 max-w-md">
            Conectando você aos melhores profissionais da sua região. 
            Solicite serviços ou ofereça seus talentos.
          </p>
          <div className="mt-8 flex items-center gap-4 opacity-80">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm">Mais de 1000+ profissionais</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-xl border-0 shadow-2xl">
          <CardHeader className="space-y-3 text-center pb-6">
            <div className="lg:hidden flex justify-center mb-4">
              <img src="/lovable-uploads/c8434d06-8f8c-46d0-bbd2-778de3b8f219.png" alt="Me Ajuda ai" className="w-16 h-16" />
            </div>
            <CardTitle className="text-3xl font-display font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Me Ajuda ai
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              Conecte-se com profissionais qualificados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1">
                <TabsTrigger value="signin" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <User className="w-4 h-4" />
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <UserPlus className="w-4 h-4" />
                  Cadastrar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-6">
                {/* Google Sign In Button */}
                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full h-12 border-2 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continuar com Google
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Ou</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-input">Email ou Telefone</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="signin-input"
                        type="text"
                        placeholder="seu@email.com ou (11) 99999-9999"
                        value={loginInput}
                        onChange={(e) => handleInputChange(e.target.value)}
                        className="pl-10 h-12"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Sua senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10 h-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg font-medium" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-6">
                {/* Google Sign Up Button */}
                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full h-12 border-2 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continuar com Google
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Ou</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullname">Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="fullname"
                        type="text"
                        placeholder="Seu nome completo"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 h-12"
                        required
                      />
                    </div>
                  </div>
                  
                   <div className="space-y-2">
                     <Label htmlFor="signup-email">Email <span className="text-red-500">*</span></Label>
                     <div className="relative">
                       <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                       <Input
                         id="signup-email"
                         type="email"
                         placeholder="seu@email.com"
                         value={email}
                         onChange={(e) => setEmail(e.target.value)}
                         className="pl-10 h-12"
                         required
                       />
                     </div>
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="signup-phone">Telefone <span className="text-red-500">*</span></Label>
                     <div className="relative">
                       <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                       <Input
                         id="signup-phone"
                         type="tel"
                         placeholder="(11) 99999-9999"
                         value={phone}
                         onChange={(e) => handlePhoneChange(e.target.value)}
                         className="pl-10 h-12"
                         required
                       />
                     </div>
                   </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10 h-12"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                   <div className="space-y-2">
                     <Label htmlFor="cpf">CPF <span className="text-red-500">*</span></Label>
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

                   <div className="space-y-3">
                     <Label>Tipo de conta <span className="text-red-500">*</span></Label>
                     <RadioGroup value={userType} onValueChange={(value) => setUserType(value as "client" | "professional")}>
                       <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                         <RadioGroupItem value="client" id="client" />
                         <Label htmlFor="client" className="flex items-center gap-3 cursor-pointer flex-1">
                           <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                             <User className="w-4 h-4 text-blue-600" />
                           </div>
                           <div>
                             <div className="font-medium">Cliente</div>
                             <div className="text-sm text-gray-500">Preciso de serviços</div>
                           </div>
                         </Label>
                       </div>
                       <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                         <RadioGroupItem value="professional" id="professional" />
                         <Label htmlFor="professional" className="flex items-center gap-3 cursor-pointer flex-1">
                           <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                             <Wrench className="w-4 h-4 text-green-600" />
                           </div>
                           <div>
                             <div className="font-medium">Profissional</div>
                             <div className="text-sm text-gray-500">Ofereço serviços</div>
                           </div>
                         </Label>
                       </div>
                     </RadioGroup>
                   </div>

                   {userType === "professional" && (
                     <>
                       <div className="space-y-2">
                         <Label htmlFor="address">Endereço <span className="text-red-500">*</span></Label>
                         <div className="relative">
                           <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                           <Input
                             id="address"
                             type="text"
                             placeholder="Rua, número, bairro"
                             value={address}
                             onChange={(e) => setAddress(e.target.value)}
                             className="pl-10 h-12"
                             required
                           />
                         </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                           <Label htmlFor="city">Cidade</Label>
                           <Select value={city} onValueChange={setCity}>
                             <SelectTrigger className="h-12">
                               <SelectValue placeholder="Selecione a cidade" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="Uberlândia">Uberlândia</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
                         
                         <div className="space-y-2">
                           <Label htmlFor="state">Estado</Label>
                           <Select value={state} onValueChange={setState}>
                             <SelectTrigger className="h-12">
                               <SelectValue placeholder="Estado" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="MG">Minas Gerais</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
                       </div>

                       <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                         <p className="text-sm text-amber-800">
                           📍 <strong>Para profissionais:</strong> Endereço obrigatório para verificação e segurança dos clientes.
                         </p>
                       </div>
                     </>
                   )}
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg font-medium" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Cadastrando..." : "Criar conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;