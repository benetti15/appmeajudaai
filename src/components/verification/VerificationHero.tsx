import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Shield, CheckCircle } from "lucide-react";

interface VerificationHeroProps {
  verificationProgress: number;
}

export function VerificationHero({ verificationProgress }: VerificationHeroProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/30">
      <CardContent className="py-8 text-center">
        <Shield className="w-16 h-16 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold mb-2">Verificação de Identidade</h2>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          Aumente sua credibilidade e receba até 3x mais pedidos com a verificação completa
        </p>
        
        {/* Progress Bar */}
        <div className="max-w-md mx-auto mb-6">
          <Progress value={verificationProgress} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            Verificação: {verificationProgress}% completa
          </p>
        </div>
        
        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm">Ganhe 3x mais confiança dos clientes</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm">Apareça primeiro nos resultados</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm">Receba badge de verificado</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}