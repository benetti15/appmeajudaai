import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, UserPlus, Wrench, Mail, Phone, Eye, EyeOff, MapPin, FileText, CheckCircle2, XCircle, ArrowRight, Sparkles } from "lucide-react";
import authHeroImage from "@/assets/auth-hero-professional.jpg";
import { validateCPF, formatCPF } from "@/lib/cpf-validator";
import { cn } from "@/lib/utils";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState<"client" | "professional" | "">("");
  const [googleUserType, setGoogleUserType] = useState<"client" | "professional" | "">("");
  const [showPassword, setShowPassword] = useState(false);
  const [cpf, setCpf] = useState("");
  const [cpfValid, setCpfValid] = useState<boolean | null>(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Uberlândia");
  const [state, setState] = useState("MG");
  const [activeTab, setActiveTab] = useState("signin");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if logout was just performed - don't auto-redirect
    const logoutInProgress = sessionStorage.getItem('logout_in_progress');
    if (logoutInProgress) {
      sessionStorage.removeItem('logout_in_progress');
      return; // Don't check auth after logout
    }
    
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if there's a pending user type from Google OAuth
        const pendingGoogleUserType = sessionStorage.getItem('google_user_type');
        if (pendingGoogleUserType) {
          // Update the profile with the selected user type
          await supabase
            .from('profiles')
            .update({ user_type: pendingGoogleUserType })
            .eq('id', session.user.id);
          
          sessionStorage.removeItem('google_user_type');
        }
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone, cpf, user_type')
          .eq('id', session.user.id)
          .single();
        
        if (!profile?.phone || !profile?.cpf || !profile?.user_type) {
          navigate('/complete-profile');
        } else {
          navigate('/');
        }
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

  const handleCpfChange = (value: string) => {
    const formatted = formatCPF(value);
    setCpf(formatted);
    const cleanCPF = formatted.replace(/\D/g, '');
    if (cleanCPF.length === 11) {
      setCpfValid(validateCPF(formatted));
    } else if (cleanCPF.length === 0) {
      setCpfValid(null);
    } else {
      setCpfValid(false);
    }
  };

  const detectInputType = (input: string) => {
    const numbers = input.replace(/\D/g, '');
    if (input.includes('@')) return 'email';
    if (numbers.length >= 10 && input.replace(/[\d\s\(\)\-]/g, '').length === 0) return 'phone';
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

  const handleGoogleSignIn = async (selectedType?: "client" | "professional") => {
    const typeToUse = selectedType || googleUserType;
    
    if (!typeToUse) {
      toast({
        title: "Selecione o tipo de conta",
        description: "Escolha se você é Cliente ou Profissional antes de continuar com Google.",
        variant: "destructive",
      });
      return;
    }
    
    // Store the selected user type in sessionStorage before OAuth redirect
    sessionStorage.setItem('google_user_type', typeToUse);
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        sessionStorage.removeItem('google_user_type');
        toast({
          title: "Erro ao entrar com Google",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch (error: any) {
      sessionStorage.removeItem('google_user_type');
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
            description: `${inputType === 'email' ? 'Email' : 'Telefone'} ou senha incorretos.`,
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
          description: "Redirecionando...",
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
        description: "Selecione se você é cliente ou profissional.",
        variant: "destructive",
      });
      return;
    }

    if (!email || !phone || !cpf) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (!validateCPF(cpf)) {
      toast({
        title: "CPF inválido",
        description: "Informe um CPF válido.",
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
            description: "Este email já está cadastrado. Faça login.",
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
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar a conta.",
        });
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left Side - Hero (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img 
          src={authHeroImage} 
          alt="Profissional Me Ajuda AI" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Dark gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 w-full">
          {/* Logo */}
          <div className="mb-8 relative">
            <div className="absolute -inset-4 bg-white/10 rounded-full blur-xl animate-pulse" />
            <img 
              src="/lovable-uploads/c8434d06-8f8c-46d0-bbd2-778de3b8f219.png" 
              alt="Me Ajuda AI" 
              className="w-24 h-24 relative z-10 drop-shadow-2xl"
            />
          </div>
          
          {/* Title */}
          <h1 className="text-5xl font-display font-black mb-4 text-center">
            <span className="block">ME AJUDA</span>
            <span className="bg-gradient-to-r from-cyan-300 via-blue-200 to-purple-300 bg-clip-text text-transparent">
              AI!
            </span>
          </h1>
          
          <p className="text-xl text-center text-white/80 max-w-md mb-12">
            Conectando você aos melhores profissionais da sua região
          </p>
          
          {/* Features */}
          <div className="space-y-4 w-full max-w-sm">
            {[
              { icon: Sparkles, text: "Profissionais verificados" },
              { icon: CheckCircle2, text: "Orçamentos em minutos" },
              { icon: User, text: "Mais de 1000+ usuários" },
            ].map((feature, i) => (
              <div 
                key={i}
                className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Mobile Header with Background Image */}
        <div className="lg:hidden relative overflow-hidden">
          {/* Background Image */}
          <img 
            src={authHeroImage} 
            alt="Profissional Me Ajuda AI" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Dark gradient overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          
          <div className="relative z-10 flex flex-col items-center text-white p-6 pb-8">
            <img 
              src="/lovable-uploads/c8434d06-8f8c-46d0-bbd2-778de3b8f219.png" 
              alt="Me Ajuda AI" 
              className="w-16 h-16 mb-3 drop-shadow-lg"
            />
            <h1 className="text-2xl font-display font-black">
              ME AJUDA <span className="text-cyan-200">AI!</span>
            </h1>
            <p className="text-white/80 text-sm mt-1">Conecte-se com profissionais</p>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-start lg:items-center justify-center p-4 sm:p-6 lg:p-12 -mt-4 lg:mt-0">
          <div className="w-full max-w-md">
            {/* Card */}
            <div className="bg-card rounded-3xl shadow-xl border border-border/50 overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Tab Headers */}
                <div className="p-4 pb-0 sm:p-6 sm:pb-0">
                  <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50 rounded-2xl">
                    <TabsTrigger 
                      value="signin" 
                      className="rounded-xl font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Entrar
                    </TabsTrigger>
                    <TabsTrigger 
                      value="signup" 
                      className="rounded-xl font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Cadastrar
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Sign In Tab */}
                <TabsContent value="signin" className="p-4 sm:p-6 pt-4 space-y-4 animate-fade-in">
                  {/* User Type Selection for Google */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Eu sou:</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setGoogleUserType("client")}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                          googleUserType === "client" 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
                          googleUserType === "client" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        )}>
                          <User className="w-4 h-4" />
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-sm">Cliente</div>
                          <div className="text-xs text-muted-foreground">Preciso de serviços</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoogleUserType("professional")}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                          googleUserType === "professional" 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
                          googleUserType === "professional" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        )}>
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-sm">Profissional</div>
                          <div className="text-xs text-muted-foreground">Ofereço serviços</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Google Button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleGoogleSignIn()}
                    disabled={isLoading || !googleUserType}
                    className={cn(
                      "w-full h-12 rounded-xl border-2 transition-all group",
                      googleUserType ? "hover:bg-muted/50" : "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="font-medium">Continuar com Google</span>
                  </Button>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card px-3 text-xs text-muted-foreground uppercase tracking-wider">ou</span>
                    </div>
                  </div>

                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-input" className="text-sm font-medium">Email ou Telefone</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signin-input"
                          type="text"
                          placeholder="seu@email.com"
                          value={loginInput}
                          onChange={(e) => handleInputChange(e.target.value)}
                          className="pl-10 h-12 rounded-xl border-2 focus:border-primary transition-colors"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-sm font-medium">Senha</Label>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Sua senha"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pr-10 h-12 rounded-xl border-2 focus:border-primary transition-colors"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold text-base shadow-lg shadow-primary/25 transition-all group"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Entrando...</span>
                        </div>
                      ) : (
                        <span className="flex items-center gap-2">
                          Entrar
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </Button>

                    <Link to="/forgot-password" className="block text-center">
                      <span className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        Esqueci minha senha
                      </span>
                    </Link>
                  </form>
                </TabsContent>

                {/* Sign Up Tab */}
                <TabsContent value="signup" className="p-4 sm:p-6 pt-4 space-y-4 animate-fade-in">
                  {/* Google Button - uses userType from form selection */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleGoogleSignIn(userType as "client" | "professional" || undefined)}
                    disabled={isLoading || !userType}
                    className={cn(
                      "w-full h-12 rounded-xl border-2 transition-all",
                      userType ? "hover:bg-muted/50" : "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="font-medium">Continuar com Google</span>
                  </Button>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card px-3 text-xs text-muted-foreground uppercase tracking-wider">ou</span>
                    </div>
                  </div>

                  <form onSubmit={handleSignUp} className="space-y-3">
                    {/* Account Type Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Tipo de conta <span className="text-destructive">*</span></Label>
                      <RadioGroup value={userType} onValueChange={(value) => setUserType(value as "client" | "professional")}>
                        <div className="grid grid-cols-2 gap-3">
                          <Label 
                            htmlFor="client" 
                            className={cn(
                              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all",
                              userType === "client" 
                                ? "border-primary bg-primary/5" 
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <RadioGroupItem value="client" id="client" className="sr-only" />
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                              userType === "client" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                            )}>
                              <User className="w-5 h-5" />
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-sm">Cliente</div>
                              <div className="text-xs text-muted-foreground">Preciso de serviços</div>
                            </div>
                          </Label>
                          <Label 
                            htmlFor="professional" 
                            className={cn(
                              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all",
                              userType === "professional" 
                                ? "border-primary bg-primary/5" 
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <RadioGroupItem value="professional" id="professional" className="sr-only" />
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                              userType === "professional" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                            )}>
                              <Wrench className="w-5 h-5" />
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-sm">Profissional</div>
                              <div className="text-xs text-muted-foreground">Ofereço serviços</div>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="fullname" className="text-sm font-medium">Nome completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="fullname"
                          type="text"
                          placeholder="Seu nome"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10 h-11 rounded-xl border-2 focus:border-primary transition-colors"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-email" className="text-sm font-medium">Email <span className="text-destructive">*</span></Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-11 rounded-xl border-2 focus:border-primary transition-colors"
                          required
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-phone" className="text-sm font-medium">Telefone <span className="text-destructive">*</span></Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder="(11) 99999-9999"
                          value={phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          className="pl-10 h-11 rounded-xl border-2 focus:border-primary transition-colors"
                          required
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password" className="text-sm font-medium">Senha</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 6 caracteres"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pr-10 h-11 rounded-xl border-2 focus:border-primary transition-colors"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* CPF */}
                    <div className="space-y-1.5">
                      <Label htmlFor="cpf" className="text-sm font-medium">CPF <span className="text-destructive">*</span></Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="cpf"
                          type="text"
                          placeholder="000.000.000-00"
                          value={cpf}
                          onChange={(e) => handleCpfChange(e.target.value)}
                          className={cn(
                            "pl-10 pr-10 h-11 rounded-xl border-2 transition-colors",
                            cpfValid === true && "border-green-500 focus:border-green-500",
                            cpfValid === false && "border-destructive focus:border-destructive"
                          )}
                          required
                          maxLength={14}
                        />
                        {cpfValid === true && (
                          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                        )}
                        {cpfValid === false && cpf.length > 0 && (
                          <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-destructive" />
                        )}
                      </div>
                    </div>

                    {/* Professional Address Fields */}
                    {userType === "professional" && (
                      <div className="space-y-3 pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground">Informações do profissional</p>
                        
                        <div className="space-y-1.5">
                          <Label htmlFor="address" className="text-sm font-medium">Endereço <span className="text-destructive">*</span></Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="address"
                              type="text"
                              placeholder="Rua, número, bairro"
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              className="pl-10 h-11 rounded-xl border-2 focus:border-primary transition-colors"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="city" className="text-sm font-medium">Cidade</Label>
                            <Select value={city} onValueChange={setCity}>
                              <SelectTrigger className="h-11 rounded-xl border-2">
                                <SelectValue placeholder="Cidade" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Uberlândia">Uberlândia</SelectItem>
                                <SelectItem value="Uberaba">Uberaba</SelectItem>
                                <SelectItem value="Araguari">Araguari</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="state" className="text-sm font-medium">Estado</Label>
                            <Select value={state} onValueChange={setState}>
                              <SelectTrigger className="h-11 rounded-xl border-2">
                                <SelectValue placeholder="Estado" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MG">MG</SelectItem>
                                <SelectItem value="SP">SP</SelectItem>
                                <SelectItem value="GO">GO</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold text-base shadow-lg shadow-primary/25 transition-all group mt-4"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Cadastrando...</span>
                        </div>
                      ) : (
                        <span className="flex items-center gap-2">
                          Criar conta
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-muted-foreground mt-6 px-4">
              Ao continuar, você concorda com nossos{" "}
              <Link to="/terms" className="text-primary hover:underline">Termos de Uso</Link>
              {" "}e{" "}
              <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
