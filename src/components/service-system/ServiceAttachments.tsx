import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Calendar, 
  Clock, 
  Paperclip, 
  Eye, 
  Download, 
  FileText, 
  Image,
  AlertCircle,
  MapPin,
  CheckCircle
} from "lucide-react";
import { UrgencyBadge } from "./UrgencyBadge";

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document';
  url: string;
  size?: string;
  uploadedAt: string;
}

interface ServiceAttachmentsProps {
  title: string;
  description: string;
  preferredDate?: string;
  preferredTime?: string;
  hasTimeFlexibility?: boolean;
  attachments?: Attachment[];
  // Additional unified info
  category?: string;
  address?: string;
  city?: string;
  state?: string;
  budgetEstimate?: number;
  urgencyLevel: number;
}

export function ServiceAttachments({ 
  title,
  description,
  preferredDate,
  preferredTime,
  hasTimeFlexibility = false,
  attachments = [],
  category,
  address,
  city,
  state,
  budgetEstimate,
  urgencyLevel
}: ServiceAttachmentsProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return Image;
      case 'document':
        return FileText;
      default:
        return Paperclip;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-3">
              {title}
              <UrgencyBadge level={urgencyLevel} size="lg" />
            </CardTitle>
            {category && (
              <Badge variant="outline">{category}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Service Info Grid */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 text-sm">
          {address && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span className="break-words">{address}, {city} - {state}</span>
            </div>
          )}
          
          {budgetEstimate && (
            <div className="flex items-start gap-2">
              <span className="text-green-600 flex-shrink-0">💰</span>
              <span className="break-words">Orçamento estimado: R$ {budgetEstimate.toLocaleString('pt-BR')}</span>
            </div>
          )}
        </div>

        {/* Descrição do serviço */}
        <div>
          <h4 className="font-medium mb-2">Descrição Detalhada</h4>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>

        {/* Horário preferido com flexibilidade */}
        {(preferredDate || preferredTime) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="truncate">Horário Preferido</span>
            </h4>
            <div className="space-y-2">
              {preferredDate && (
                <div className="flex items-start gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="break-words"><strong>Data:</strong> {preferredDate}</span>
                </div>
              )}
              {preferredTime && (
                <div className="flex items-start gap-2 text-sm">
                  <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="break-words"><strong>Horário:</strong> {preferredTime}</span>
                </div>
              )}
              <div className="flex items-start gap-2 text-sm">
                {hasTimeFlexibility ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-green-700 break-words"><strong>Flexibilidade:</strong> Cliente tem flexibilidade de horário</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="text-amber-700 break-words"><strong>Flexibilidade:</strong> Horário específico solicitado</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Anexos enviados pelo cliente */}
        {attachments.length > 0 ? (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Paperclip className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Anexos do Cliente ({attachments.length})</span>
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {attachments.map((attachment) => {
                const FileIcon = getFileIcon(attachment.type);
                
                return (
                  <div 
                    key={attachment.id}
                    className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {attachment.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {attachment.size && <span>{attachment.size}</span>}
                          <span>•</span>
                          <span>{attachment.uploadedAt}</span>
                        </div>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {attachment.type === 'image' ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="gap-1 text-xs h-8"
                                  onClick={() => setSelectedImage(attachment.url)}
                                >
                                  <Eye className="w-3 h-3 flex-shrink-0" />
                                  <span className="hidden sm:inline">Ver</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh]">
                                <DialogHeader>
                                  <DialogTitle className="truncate">{attachment.name}</DialogTitle>
                                </DialogHeader>
                                <div className="mt-4 overflow-auto">
                                  <img 
                                    src={attachment.url} 
                                    alt={attachment.name}
                                    className="w-full h-auto rounded-lg max-h-[70vh] object-contain"
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-1 text-xs h-8"
                              asChild
                            >
                              <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                                <Eye className="w-3 h-3 flex-shrink-0" />
                                <span className="hidden sm:inline">Ver</span>
                              </a>
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-1 text-xs h-8"
                            asChild
                          >
                            <a href={attachment.url} download={attachment.name}>
                              <Download className="w-3 h-3 flex-shrink-0" />
                              <span className="hidden sm:inline">Baixar</span>
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 border-2 border-dashed border-muted rounded-lg">
            <Paperclip className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum anexo foi enviado pelo cliente
            </p>
          </div>
        )}

        {/* Informações extras sobre horário */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
          <p><strong>Dica para profissionais:</strong> Sempre confirme a disponibilidade de horário com o cliente antes de se deslocar ao local.</p>
        </div>
      </CardContent>
    </Card>
  );
}