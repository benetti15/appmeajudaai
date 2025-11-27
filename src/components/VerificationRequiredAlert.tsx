import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useVerificationDocuments } from '@/hooks/useVerificationDocuments';

interface VerificationRequiredAlertProps {
  feature?: string;
  className?: string;
}

export function VerificationRequiredAlert({ 
  feature = 'este recurso',
  className 
}: VerificationRequiredAlertProps) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { fetchVerificationStatus } = useVerificationDocuments();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    checkVerificationStatus();
  }, [user]);

  const checkVerificationStatus = async () => {
    if (!user || profile?.user_type !== 'professional') {
      setIsVerified(true); // Clients don't need verification
      return;
    }

    const status = await fetchVerificationStatus();
    setIsVerified(status?.is_verified || false);
  };

  // Don't show alert if user is verified or not a professional
  if (isVerified !== false) return null;

  return (
    <Alert className={`border-orange-500/50 bg-orange-500/10 ${className}`}>
      <ShieldAlert className="h-5 w-5 text-orange-500" />
      <AlertTitle className="text-orange-500 font-semibold">
        Verificação de Identidade Necessária
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="text-foreground/80">
          Para acessar {feature}, você precisa completar a verificação da sua identidade. 
          Isso garante a segurança de todos os usuários da plataforma.
        </p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/professional-profile')}
          className="gap-2"
        >
          Iniciar Verificação
          <ArrowRight className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
