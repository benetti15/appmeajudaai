import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PaymentPlans } from "@/components/PaymentPlans";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("professional");

  const handlePlanSelect = (planId: string, isYearly: boolean) => {
    toast({
      title: "Plano selecionado",
      description: `Você escolheu o plano ${planId} ${isYearly ? 'anual' : 'mensal'}`,
    });
    
    // Aqui seria integrado com o sistema de pagamento
    console.log("Redirecting to payment for:", { planId, isYearly });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/5">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="p-2"
            >
              <Home className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Planos e Preços
            </h1>
            <p className="text-muted-foreground">
              Escolha o plano ideal para suas necessidades
            </p>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="professional">Para Profissionais</TabsTrigger>
            <TabsTrigger value="client">Para Clientes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="professional">
            <PaymentPlans 
              userType="professional" 
              onPlanSelect={handlePlanSelect}
            />
          </TabsContent>
          
          <TabsContent value="client">
            <PaymentPlans 
              userType="client" 
              onPlanSelect={handlePlanSelect}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}