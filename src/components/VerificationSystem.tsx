import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Award,
  MapPin,
  ShieldCheck,
  Upload
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { VerificationHero } from "@/components/verification/VerificationHero";
import { DocumentUploadDialog } from "@/components/verification/DocumentUploadDialog";
import { useVerificationDocuments, VerificationDocument as DbVerificationDocument } from "@/hooks/useVerificationDocuments";

interface VerificationDocument {
  id: string;
  type: 'id' | 'address' | 'professional' | 'background';
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

interface VerificationBadge {
  type: 'id' | 'address' | 'professional' | 'background';
  name: string;
  description: string;
  icon: any;
}

interface VerificationSystemProps {
  userId?: string;
  showUploadForm?: boolean;
  compact?: boolean;
}

export function VerificationSystem({ userId, showUploadForm = true, compact = false }: VerificationSystemProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { fetchDocuments, fetchVerificationStatus } = useVerificationDocuments();
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docs, status] = await Promise.all([
        fetchDocuments(),
        fetchVerificationStatus()
      ]);
      
      // Convert to UI format
      const formattedDocs: VerificationDocument[] = docs.map(doc => ({
        id: doc.id,
        type: doc.document_type as any,
        status: doc.status as any,
        uploadedAt: new Date(doc.created_at).toLocaleDateString('pt-BR'),
        reviewedAt: doc.reviewed_at ? new Date(doc.reviewed_at).toLocaleDateString('pt-BR') : undefined,
        rejectionReason: doc.rejection_reason || undefined
      }));
      
      setDocuments(formattedDocs);
      setVerificationStatus(status);
    } catch (error) {
      console.error('Error loading verification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const verificationBadges: VerificationBadge[] = [
    {
      type: 'id',
      name: 'Identidade Verificada',
      description: 'Documento de identidade aprovado',
      icon: ShieldCheck,
    },
    {
      type: 'address',
      name: 'Endereço Verificado',
      description: 'Comprovante de residência aprovado',
      icon: MapPin,
    },
    {
      type: 'professional',
      name: 'Profissional Certificado',
      description: 'Certificados profissionais aprovados',
      icon: Award,
    },
    {
      type: 'background',
      name: 'Background Check',
      description: 'Antecedentes verificados',
      icon: Shield,
    },
  ];

  const verificationProgress = useMemo(() => {
    const totalDocTypes = 4;
    const approvedTypes = new Set(
      documents.filter(d => d.status === 'approved').map(d => d.type)
    ).size;
    
    return Math.round((approvedTypes / totalDocTypes) * 100);
  }, [documents]);

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
    toast.success("Documento enviado com sucesso!");
    loadData();
  };

  // Group documents by status
  const groupedDocuments = {
    approved: documents.filter(d => d.status === 'approved'),
    pending: documents.filter(d => d.status === 'pending'),
    rejected: documents.filter(d => d.status === 'rejected'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Compact view
  if (compact) {
    const earnedBadges = verificationBadges.filter(badge => 
      documents.some(doc => doc.type === badge.type && doc.status === 'approved')
    );

    if (earnedBadges.length === 0) return null;

    return (
      <div className="flex items-center gap-2">
        {earnedBadges.map((badge) => {
          const Icon = badge.icon;
          return (
            <div
              key={badge.type}
              className="bg-primary text-primary-foreground p-1.5 rounded-full"
              title={badge.description}
            >
              <Icon className="h-3 w-3" />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <VerificationHero verificationProgress={verificationProgress} />

      {/* Badges Earned */}
      {groupedDocuments.approved.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Badges Conquistadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {verificationBadges
                .filter(badge => documents.some(doc => doc.type === badge.type && doc.status === 'approved'))
                .map((badge) => {
                  const Icon = badge.icon;
                  return (
                    <div
                      key={badge.type}
                      className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg p-3"
                    >
                      <div className="bg-primary text-primary-foreground p-2 rounded-full">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{badge.name}</p>
                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                      </div>
                    </div>
                  );
                })}
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

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos Enviados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum documento enviado ainda</p>
              <p className="text-sm mt-2">Clique no botão acima para enviar seus documentos</p>
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
                    {groupedDocuments.approved.map((doc) => {
                      const badge = verificationBadges.find(b => b.type === doc.type);
                      return (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 border border-green-200 bg-green-50/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-medium text-sm">{badge?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Aprovado em {doc.reviewedAt || doc.uploadedAt}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(doc.status)}>
                            {getStatusText(doc.status)}
                          </Badge>
                        </div>
                      );
                    })}
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
                    {groupedDocuments.pending.map((doc) => {
                      const badge = verificationBadges.find(b => b.type === doc.type);
                      return (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 border border-yellow-200 bg-yellow-50/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-yellow-600" />
                            <div>
                              <p className="font-medium text-sm">{badge?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Enviado em {doc.uploadedAt}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(doc.status)}>
                            {getStatusText(doc.status)}
                          </Badge>
                        </div>
                      );
                    })}
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
                    {groupedDocuments.rejected.map((doc) => {
                      const badge = verificationBadges.find(b => b.type === doc.type);
                      return (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 border border-red-200 bg-red-50/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <XCircle className="h-5 w-5 text-red-600" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{badge?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Rejeitado em {doc.reviewedAt || doc.uploadedAt}
                              </p>
                              {doc.rejectionReason && (
                                <p className="text-xs text-red-600 mt-1">
                                  Motivo: {doc.rejectionReason}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Badge className={getStatusColor(doc.status)}>
                              {getStatusText(doc.status)}
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
                      );
                    })}
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
