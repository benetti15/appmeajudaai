import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Verified
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface VerificationDocument {
  id: string;
  type: 'identity' | 'professional' | 'address' | 'certification';
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  file_url?: string;
  uploaded_at: string;
  reviewed_at?: string;
  notes?: string;
}

interface VerificationBadge {
  type: 'identity' | 'professional' | 'premium' | 'top_rated';
  name: string;
  description: string;
  earned_at?: string;
  icon: React.ReactNode;
  color: string;
}

interface VerificationSystemProps {
  userId?: string;
  showUploadForm?: boolean;
  compact?: boolean;
}

export function VerificationSystem({ userId, showUploadForm = true, compact = false }: VerificationSystemProps) {
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>('identity');
  const [verificationLevel, setVerificationLevel] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Mock verification data
  const mockDocuments: VerificationDocument[] = [
    {
      id: "1",
      type: 'identity',
      name: "RG - Documento de Identidade",
      status: 'approved',
      uploaded_at: '2024-01-15T10:00:00Z',
      reviewed_at: '2024-01-16T14:30:00Z'
    },
  ];

  const verificationBadges: VerificationBadge[] = [
    {
      type: 'identity',
      name: 'Identidade Verificada',
      description: 'Documento de identidade aprovado',
      earned_at: '2024-01-16T14:30:00Z',
      icon: <Shield className="h-4 w-4" />,
      color: 'bg-blue-500'
    },
    {
      type: 'professional',
      name: 'Profissional Certificado',
      description: 'Registro profissional verificado',
      icon: <Award className="h-4 w-4" />,
      color: 'bg-green-500'
    },
    {
      type: 'premium',
      name: 'Membro Premium',
      description: 'Conta premium ativa',
      earned_at: '2024-01-10T00:00:00Z',
      icon: <Star className="h-4 w-4" />,
      color: 'bg-yellow-500'
    },
    {
      type: 'top_rated',
      name: 'Top Avaliado',
      description: 'Avaliação média acima de 4.8',
      earned_at: '2024-01-25T00:00:00Z',
      icon: <Verified className="h-4 w-4" />,
      color: 'bg-purple-500'
    }
  ];

  const allDocuments = [...documents, ...mockDocuments];
  const earnedBadges = verificationBadges.filter(badge => badge.earned_at);

  const getStatusIcon = (status: VerificationDocument['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: VerificationDocument['status']) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const getStatusText = (status: VerificationDocument['status']) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      case 'pending': return 'Pendente';
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newDocument: VerificationDocument = {
        id: Date.now().toString(),
        type: selectedDocType as any,
        name: file.name,
        status: 'pending',
        uploaded_at: new Date().toISOString(),
      };

      setDocuments(prev => [...prev, newDocument]);

      toast({
        title: "Documento enviado",
        description: "Seu documento foi enviado para análise. O resultado será comunicado em até 24 horas.",
      });

      // Reset form
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar o documento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const calculateVerificationLevel = () => {
    const approvedDocs = allDocuments.filter(doc => doc.status === 'approved').length;
    const totalDocs = 1; // identity (obrigatório apenas)
    return Math.round((approvedDocs / totalDocs) * 100);
  };

  const documentTypes = [
    { value: 'identity', label: 'Documento de Identidade (RG, CNH) - Obrigatório' },
    { value: 'address', label: 'Comprovante de Residência (Opcional)' },
    { value: 'certification', label: 'Certificados Profissionais (Opcional)' },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {earnedBadges.map((badge) => (
          <div
            key={badge.type}
            className={`${badge.color} text-white p-1 rounded-full`}
            title={badge.description}
          >
            {badge.icon}
          </div>
        ))}
        {earnedBadges.length === 0 && (
          <Badge variant="outline" className="text-xs">
            Não verificado
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Sistema de Verificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Nível de Verificação</span>
              <span className="text-sm text-muted-foreground">{calculateVerificationLevel()}%</span>
            </div>
            <Progress value={calculateVerificationLevel()} className="h-2" />
          </div>

          {earnedBadges.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Badges Conquistadas</Label>
              <div className="flex flex-wrap gap-2">
                {earnedBadges.map((badge) => (
                  <div
                    key={badge.type}
                    className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2"
                  >
                    <div className={`${badge.color} text-white p-1 rounded-full`}>
                      {badge.icon}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{badge.name}</p>
                      <p className="text-xs text-muted-foreground">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showUploadForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Enviar Documentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="docType">Tipo de Documento</Label>
              <select
                id="docType"
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
                className="w-full p-2 border border-border rounded-md bg-background"
              >
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Arquivo</Label>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  id="file"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: JPG, PNG, PDF. Tamanho máximo: 5MB
              </p>
            </div>

            {uploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Enviando documento...
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos Enviados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum documento enviado ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(doc.status)}
                    <div>
                      <p className="font-medium text-sm">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Enviado em {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}
                      </p>
                      {doc.notes && (
                        <p className="text-xs text-red-600 mt-1">{doc.notes}</p>
                      )}
                    </div>
                  </div>
                  
                  <Badge variant="outline" className={getStatusColor(doc.status)}>
                    {getStatusText(doc.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}