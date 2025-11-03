import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Star,
  Award,
  Verified,
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { VerificationHero } from "@/components/verification/VerificationHero";
import { DocumentUploadDialog } from "@/components/verification/DocumentUploadDialog";

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
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
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

  const verificationProgress = useMemo(() => {
    const totalDocTypes = 4; // id, address, professional, background
    const approvedTypes = new Set(
      allDocuments.filter(d => d.status === 'approved').map(d => d.type)
    ).size;
    
    return Math.round((approvedTypes / totalDocTypes) * 100);
  }, [allDocuments]);

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

  const handleUploadSuccess = () => {
    // Refresh documents after upload
    toast({
      title: "Documento enviado!",
      description: "Seu documento foi enviado para análise.",
    });
  };

  // Group documents by status
  const groupedDocuments = {
    approved: allDocuments.filter(d => d.status === 'approved'),
    pending: allDocuments.filter(d => d.status === 'pending'),
    rejected: allDocuments.filter(d => d.status === 'rejected'),
  };

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
      {/* Hero Section */}
      <VerificationHero verificationProgress={verificationProgress} />

      {/* Badges Earned */}
      {earnedBadges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Badges Conquistadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
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
          </CardContent>
        </Card>
      )}

      {/* Upload Button */}
      {showUploadForm && (
        <div className="text-center">
          <Button
            size="lg"
            onClick={() => setUploadDialogOpen(true)}
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
          >
            <Upload className="w-5 h-5 mr-2" />
            Enviar Documento para Verificação
          </Button>
        </div>
      )}

      {/* Upload Dialog */}
      <DocumentUploadDialog
        isOpen={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Documents List - Grouped by Status */}
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
            <div className="space-y-6">
              {/* Approved Documents */}
              {groupedDocuments.approved.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Aprovados ({groupedDocuments.approved.length})
                  </h4>
                  <div className="space-y-2">
                    {groupedDocuments.approved.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border border-green-200 bg-green-50/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-sm">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Aprovado em {doc.reviewed_at ? new Date(doc.reviewed_at).toLocaleDateString('pt-BR') : '-'}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          Aprovado
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Documents */}
              {groupedDocuments.pending.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    Pendentes ({groupedDocuments.pending.length})
                  </h4>
                  <div className="space-y-2">
                    {groupedDocuments.pending.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border border-yellow-200 bg-yellow-50/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-yellow-600" />
                          <div>
                            <p className="font-medium text-sm">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Enviado em {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                          Pendente
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejected Documents */}
              {groupedDocuments.rejected.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Rejeitados ({groupedDocuments.rejected.length})
                  </h4>
                  <div className="space-y-2">
                    {groupedDocuments.rejected.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border border-red-200 bg-red-50/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <XCircle className="h-5 w-5 text-red-600" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Rejeitado em {doc.reviewed_at ? new Date(doc.reviewed_at).toLocaleDateString('pt-BR') : '-'}
                            </p>
                            {doc.notes && (
                              <p className="text-xs text-red-600 mt-1">Motivo: {doc.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge className="bg-red-100 text-red-700 border-red-200">
                            Rejeitado
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setUploadDialogOpen(true)}
                          >
                            Reenviar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}