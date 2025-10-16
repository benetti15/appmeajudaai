import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Paperclip, Upload, X, Eye, Download, FileText, Image, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { uploadFile } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // in MB
  acceptedFileTypes?: string[];
  existingFiles?: UploadedFile[];
}

export function FileUpload({ 
  onFilesUploaded, 
  maxFiles = 3, 
  maxSizePerFile = 5,
  acceptedFileTypes = ['image/*', 'application/pdf'],
  existingFiles = [] 
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>(existingFiles);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = async (selectedFiles: FileList) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    if (files.length + selectedFiles.length > maxFiles) {
      toast({
        title: "Limite excedido",
        description: `Você pode anexar no máximo ${maxFiles} arquivos.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const newFiles: UploadedFile[] = [];

    try {
      for (const file of Array.from(selectedFiles)) {
        // Check file size
        if (file.size > maxSizePerFile * 1024 * 1024) {
          toast({
            title: "Arquivo muito grande",
            description: `O arquivo "${file.name}" excede o limite de ${maxSizePerFile}MB.`,
            variant: "destructive",
          });
          continue;
        }

        // Check file type
        const isValidType = acceptedFileTypes.some(type => {
          if (type.includes('*')) {
            return file.type.startsWith(type.replace('*', ''));
          }
          return file.type === type;
        });

        if (!isValidType) {
          toast({
            title: "Tipo de arquivo não suportado",
            description: `O arquivo "${file.name}" não é um tipo suportado.`,
            variant: "destructive",
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `request-attachments/${fileName}`;

        const uploadResult = await uploadFile(file, filePath);
        
        if (uploadResult.success && uploadResult.url) {
          const uploadedFile: UploadedFile = {
            id: fileName,
            name: file.name,
            type: file.type.startsWith('image/') ? 'image' : 'document',
            url: uploadResult.url,
            size: file.size
          };
          
          newFiles.push(uploadedFile);
        } else {
          toast({
            title: "Erro no upload",
            description: `Não foi possível enviar o arquivo "${file.name}".`,
            variant: "destructive",
          });
        }
      }

      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onFilesUploaded(updatedFiles);

      if (newFiles.length > 0) {
        toast({
          title: "Arquivos enviados!",
          description: `${newFiles.length} arquivo(s) anexado(s) com sucesso.`,
        });
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar os arquivos.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(file => file.id !== fileId);
    setFiles(updatedFiles);
    onFilesUploaded(updatedFiles);
    
    toast({
      title: "Arquivo removido",
      description: "O arquivo foi removido com sucesso.",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    return type === 'image' ? Image : FileText;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-2 text-base font-medium">
        <Paperclip className="h-4 w-4 text-primary" />
        Anexar Arquivos
      </Label>
      
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes.join(',')}
        multiple
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        className="hidden"
      />
      
      {/* Upload Area */}
      <Card 
        className={`transition-colors cursor-pointer ${
          dragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-dashed border-muted-foreground/25 hover:border-primary/50'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              {uploading ? (
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-6 h-6 text-primary" />
              )}
            </div>
            
            <div className="space-y-1">
              <p className="font-medium text-sm">
                {uploading ? "Enviando arquivos..." : "Clique ou arraste arquivos aqui"}
              </p>
              <p className="text-xs text-muted-foreground">
                Imagens (JPG, PNG) ou PDFs até {maxSizePerFile}MB • Máximo {maxFiles} arquivos
              </p>
            </div>
            
            {!uploading && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={files.length >= maxFiles}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Selecionar Arquivos
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File counter */}
      {files.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{files.length}/{maxFiles} arquivo(s) anexado(s)</span>
          {files.length >= maxFiles && (
            <span className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="h-3 w-3" />
              Limite atingido
            </span>
          )}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => {
            const FileIcon = getFileIcon(file.type);
            
            return (
              <Card key={file.id}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileIcon className="w-5 h-5 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)} • {file.type === 'image' ? 'Imagem' : 'Documento'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {file.type === 'image' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(file.url, '_blank')}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 w-8 p-0"
                      >
                        <a href={file.url} download={file.name}>
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p><strong>💡 Dica:</strong> Anexe fotos ou documentos que ajudem a descrever o problema ou serviço necessário.</p>
      </div>
    </div>
  );
}