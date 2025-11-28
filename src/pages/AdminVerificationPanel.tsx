import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText, Shield, Eye, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoCard } from "@/components/ui/info-card";

interface VerificationDocument {
  id: string;
  professional_id: string;
  document_type: string;
  file_url: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  professional?: {
    full_name: string;
    email: string;
  };
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export default function AdminVerificationPanel() {
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<VerificationDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      
      // Fetch documents with professional info
      const { data: docs, error } = await supabase
        .from("verification_documents")
        .select(`
          *,
          professional:profiles!verification_documents_professional_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data structure
      const transformedDocs = docs?.map(doc => ({
        ...doc,
        professional: Array.isArray(doc.professional) ? doc.professional[0] : doc.professional
      })) || [];

      setDocuments(transformedDocs);

      // Calculate stats
      const pending = transformedDocs.filter(d => d.status === "pending").length;
      const approved = transformedDocs.filter(d => d.status === "approved").length;
      const rejected = transformedDocs.filter(d => d.status === "rejected").length;
      
      setStats({
        pending,
        approved,
        rejected,
        total: transformedDocs.length
      });
    } catch (error: any) {
      toast({
        title: "Erro ao carregar documentos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (docId: string) => {
    try {
      setProcessing(true);

      const { error: updateError } = await supabase
        .from("verification_documents")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", docId);

      if (updateError) throw updateError;

      // Log the action
      await supabase.from("verification_audit_logs").insert({
        document_id: docId,
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        action: "approved",
        previous_status: "pending",
        new_status: "approved",
      });

      toast({
        title: "Documento aprovado",
        description: "O documento foi aprovado com sucesso.",
      });

      setSelectedDoc(null);
      loadDocuments();
    } catch (error: any) {
      toast({
        title: "Erro ao aprovar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (docId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Por favor, informe o motivo da rejeição.",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessing(true);

      const { error: updateError } = await supabase
        .from("verification_documents")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq("id", docId);

      if (updateError) throw updateError;

      // Log the action
      await supabase.from("verification_audit_logs").insert({
        document_id: docId,
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        action: "rejected",
        previous_status: "pending",
        new_status: "rejected",
        rejection_reason: rejectionReason,
      });

      toast({
        title: "Documento rejeitado",
        description: "O documento foi rejeitado e o profissional será notificado.",
      });

      setSelectedDoc(null);
      setRejectionReason("");
      loadDocuments();
    } catch (error: any) {
      toast({
        title: "Erro ao rejeitar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      id: "Documento de Identidade",
      address: "Comprovante de Residência",
      professional: "Certificado Profissional",
      background: "Certidão de Antecedentes",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: "Pendente", variant: "secondary" as const, icon: Clock },
      approved: { label: "Aprovado", variant: "default" as const, icon: CheckCircle },
      rejected: { label: "Rejeitado", variant: "destructive" as const, icon: XCircle },
    };
    const { label, variant, icon: Icon } = config[status as keyof typeof config] || config.pending;
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const filteredDocuments = documents.filter(doc => 
    filter === "all" ? true : doc.status === filter
  );

  if (loading) {
    return <LoadingSpinner message="Carregando documentos..." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/5">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Painel Administrativo
            </h1>
            <p className="text-muted-foreground">
              Gerenciamento de verificações de documentos
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <InfoCard
            icon={FileText}
            label="Total de Documentos"
            value={stats.total}
            iconColor="text-primary"
          />
          <InfoCard
            icon={Clock}
            label="Pendentes"
            value={stats.pending}
            iconColor="text-orange-500"
          />
          <InfoCard
            icon={CheckCircle}
            label="Aprovados"
            value={stats.approved}
            iconColor="text-green-500"
          />
          <InfoCard
            icon={XCircle}
            label="Rejeitados"
            value={stats.rejected}
            iconColor="text-red-500"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
          >
            Pendentes ({stats.pending})
          </Button>
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            Todos ({stats.total})
          </Button>
          <Button
            variant={filter === "approved" ? "default" : "outline"}
            onClick={() => setFilter("approved")}
          >
            Aprovados ({stats.approved})
          </Button>
          <Button
            variant={filter === "rejected" ? "default" : "outline"}
            onClick={() => setFilter("rejected")}
          >
            Rejeitados ({stats.rejected})
          </Button>
        </div>

        {/* Documents List */}
        {filteredDocuments.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum documento encontrado"
            description={`Não há documentos ${filter !== "all" ? filter === "pending" ? "pendentes" : filter === "approved" ? "aprovados" : "rejeitados" : ""} no momento.`}
          />
        ) : (
          <div className="grid gap-4">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {getDocumentTypeLabel(doc.document_type)}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {doc.professional?.full_name || "Profissional"}
                        {doc.professional?.email && (
                          <span className="text-xs">({doc.professional.email})</span>
                        )}
                      </CardDescription>
                    </div>
                    {getStatusBadge(doc.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Enviado em: {new Date(doc.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Revisar
                    </Button>
                  </div>
                  {doc.rejection_reason && (
                    <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm font-medium text-destructive">Motivo da rejeição:</p>
                      <p className="text-sm text-muted-foreground mt-1">{doc.rejection_reason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Document Review Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Revisar Documento
            </DialogTitle>
            <DialogDescription>
              {selectedDoc?.professional?.full_name} • {selectedDoc && getDocumentTypeLabel(selectedDoc.document_type)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Document Preview */}
            <div className="border rounded-lg overflow-hidden bg-muted/30">
              <img
                src={selectedDoc?.file_url}
                alt="Documento"
                className="w-full h-auto"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
            </div>

            {/* Rejection Reason Input */}
            {selectedDoc?.status === "pending" && (
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">
                  Motivo da Rejeição (obrigatório se rejeitar)
                </Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Descreva o motivo da rejeição..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            {selectedDoc?.status === "pending" ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedDoc(null);
                    setRejectionReason("");
                  }}
                  disabled={processing}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => selectedDoc && handleReject(selectedDoc.id)}
                  disabled={processing}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
                <Button
                  onClick={() => selectedDoc && handleApprove(selectedDoc.id)}
                  disabled={processing}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
              </>
            ) : (
              <Button onClick={() => setSelectedDoc(null)}>
                Fechar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
