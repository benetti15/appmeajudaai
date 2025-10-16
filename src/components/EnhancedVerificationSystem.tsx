import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Camera, 
  FileText, 
  Star,
  Award,
  Verified,
  AlertTriangle,
  Lock,
  Eye,
  Ban
} from "lucide-react";
import { VerificationSystem } from "./VerificationSystem";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface VerificationRestriction {
  feature: string;
  description: string;
  requires: string[];
  impact: 'low' | 'medium' | 'high';
}

interface EnhancedVerificationSystemProps {
  userId?: string;
  showRestrictions?: boolean;
  showUploadForm?: boolean;
  compact?: boolean;
  enforceRestrictions?: boolean;
}

export function EnhancedVerificationSystem({ 
  userId, 
  showRestrictions = true,
  showUploadForm = true, 
  compact = false,
  enforceRestrictions = false
}: EnhancedVerificationSystemProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [verificationStatus, setVerificationStatus] = useState({
    identity_verified: false,
    professional_verified: false,
    address_verified: false,
    certification_verified: false,
    overall_level: 0,
  });

  const [restrictions] = useState<VerificationRestriction[]>([
    {
      feature: 'Enviar Propostas para Clientes',
      description: 'Verificação de identidade é obrigatória para enviar propostas',
      requires: ['Identidade'],
      impact: 'high'
    },
    {
      feature: 'Receber Solicitações de Serviço',
      description: 'Você precisa verificar sua identidade para receber solicitações',
      requires: ['Identidade'],
      impact: 'high'
    },
    {
      feature: 'Avaliar Clientes',
      description: 'Identidade verificada é necessária para avaliar outros usuários',
      requires: ['Identidade'],
      impact: 'low'
    }
  ]);

  // Simular dados de verificação
  useEffect(() => {
    // Em uma implementação real, buscar do banco de dados
    setVerificationStatus({
      identity_verified: true,
      professional_verified: false,
      address_verified: false,
      certification_verified: false,
      overall_level: 25,
    });
  }, [userId]);

  const getVerificationLevel = () => {
    // Apenas identidade é obrigatória (100%)
    return verificationStatus.identity_verified ? 100 : 0;
  };

  const getRestrictedFeatures = () => {
    return restrictions.filter(restriction => {
      return restriction.requires.some(requirement => {
        switch (requirement) {
          case 'Identidade':
            return !verificationStatus.identity_verified;
          case 'Registro Profissional':
            return !verificationStatus.professional_verified;
          case 'Endereço':
            return !verificationStatus.address_verified;
          case 'Certificações':
            return !verificationStatus.certification_verified;
          default:
            return false;
        }
      });
    });
  };

  const getImpactColor = (impact: VerificationRestriction['impact']) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getImpactIcon = (impact: VerificationRestriction['impact']) => {
    switch (impact) {
      case 'high': return <Ban className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'low': return <Lock className="h-4 w-4" />;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Shield className={`h-4 w-4 ${verificationStatus.identity_verified ? 'text-green-500' : 'text-gray-400'}`} />
          <span className="text-xs">
            {getVerificationLevel()}% verificado
          </span>
        </div>
        
        {verificationStatus.identity_verified && (
          <Badge variant="default" className="gap-1 bg-green-100 text-green-700 border-green-200">
            <Verified className="h-3 w-3" />
            Verificado
          </Badge>
        )}
      </div>
    );
  }

  const restrictedFeatures = getRestrictedFeatures();

  return (
    <div className="space-y-6">
      {/* Verification Level Overview */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Status de Verificação
            </div>
            <Badge variant={getVerificationLevel() === 100 ? "default" : "secondary"}>
              {getVerificationLevel()}% Completo
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={getVerificationLevel()} className="h-3" />
          
          <div className="grid grid-cols-1 gap-4">
            <div className={`p-3 rounded-lg border ${verificationStatus.identity_verified ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                {verificationStatus.identity_verified ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm font-medium">Identidade (Obrigatório)</span>
              </div>
              <p className="text-xs text-muted-foreground">RG, CNH - Documento de identidade obrigatório</p>
            </div>
          </div>

          {getVerificationLevel() < 100 && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Complete sua verificação para ter acesso a todas as funcionalidades da plataforma.
                Profissionais verificados recebem até 3x mais solicitações.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Restricted Features */}
      {showRestrictions && restrictedFeatures.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Lock className="h-5 w-5" />
              Funcionalidades Restritas ({restrictedFeatures.length})
            </CardTitle>
            <p className="text-sm text-orange-700">
              Complete sua verificação para desbloquear estas funcionalidades
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {restrictedFeatures.map((restriction, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getImpactColor(restriction.impact)}`}
              >
                <div className="flex items-start gap-3">
                  {getImpactIcon(restriction.impact)}
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{restriction.feature}</h4>
                    <p className="text-sm mb-2">{restriction.description}</p>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs">Requer:</span>
                      {restriction.requires.map((req, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Benefits of Verification */}
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Award className="h-5 w-5" />
            Benefícios da Verificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Aparecer primeiro nos resultados</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Badge "Verificado" no perfil</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Cobrar preços premium</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Maior confiança dos clientes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Acesso a projetos exclusivos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Pagamentos facilitados</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification System */}
      {showUploadForm && (
        <VerificationSystem 
          userId={userId} 
          showUploadForm={showUploadForm}
          compact={false}
        />
      )}

      {/* Warning for Non-Verified Professionals */}
      {enforceRestrictions && getVerificationLevel() < 100 && profile?.user_type === 'professional' && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Atenção:</strong> A verificação de identidade é obrigatória para profissionais.
            Complete sua verificação para ter acesso completo à plataforma.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}