import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { IdCard, MapPin, Award, Shield, Upload } from "lucide-react";
import { toast } from "sonner";
import { useCelebration } from "@/hooks/useCelebration";

interface DocumentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

const documentTypes = [
  {
    type: 'id',
    icon: IdCard,
    title: 'RG/CNH',
    description: 'Documento de identidade',
  },
  {
    type: 'address',
    icon: MapPin,
    title: 'Comprovante',
    description: 'Comprovante de residência',
  },
  {
    type: 'professional',
    icon: Award,
    title: 'Certificado',
    description: 'Certificado profissional',
  },
  {
    type: 'background',
    icon: Shield,
    title: 'Antecedentes',
    description: 'Certidão de antecedentes',
  },
];

export function DocumentUploadDialog({ isOpen, onClose, onUploadSuccess }: DocumentUploadDialogProps) {
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { celebrate } = useCelebration();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Arquivo muito grande! Máximo 5MB.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType) {
      toast.error("Selecione o tipo de documento");
      return;
    }

    if (!selectedFile) {
      toast.error("Selecione um arquivo");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Progress animation
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const { useVerificationDocuments } = await import('@/hooks/useVerificationDocuments');
      const { uploadDocument } = useVerificationDocuments();
      
      const result = await uploadDocument(selectedFile, selectedType);
      
      if (result) {
        clearInterval(interval);
        setUploadProgress(100);
        
        // Celebrate document upload
        celebrate("document_uploaded");
        
        toast.success("Documento enviado para análise!");
        
        setTimeout(() => {
          onUploadSuccess();
          handleReset();
          onClose();
        }, 500);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Erro ao enviar documento");
    } finally {
      clearInterval(interval);
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedType('');
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar Documento para Verificação</DialogTitle>
          <DialogDescription>
            Escolha o tipo de documento e faça o upload. Analisaremos em até 24h.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Document Type Selector */}
          <div>
            <h4 className="text-sm font-medium mb-3">Selecione o tipo de documento</h4>
            <div className="grid grid-cols-2 gap-3">
              {documentTypes.map((docType) => {
                const Icon = docType.icon;
                return (
                  <Card 
                    key={docType.type}
                    className={`cursor-pointer transition-all hover:border-primary/50 ${
                      selectedType === docType.type ? 'border-primary border-2 bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedType(docType.type)}
                  >
                    <CardContent className="p-4">
                      <Icon className="w-8 h-8 mb-2 text-primary" />
                      <p className="font-medium text-sm">{docType.title}</p>
                      <p className="text-xs text-muted-foreground">{docType.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
          
          {/* File Upload Area */}
          {selectedType && (
            <div>
              <h4 className="text-sm font-medium mb-3">Selecione o arquivo</h4>
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <input 
                  type="file" 
                  id="file-upload"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label 
                  htmlFor="file-upload"
                  className="cursor-pointer"
                >
                  <p className="text-sm font-medium mb-1">
                    {selectedFile ? selectedFile.name : "Clique para selecionar"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF ou imagem • Máximo 5MB
                  </p>
                </label>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                Enviando... {uploadProgress}%
              </p>
            </div>
          )}
          
          {/* Submit Button */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                handleReset();
                onClose();
              }}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!selectedType || !selectedFile || isUploading}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
            >
              {isUploading ? "Enviando..." : "Enviar para Análise"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}