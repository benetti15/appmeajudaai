import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PhotoUploadProps {
  currentPhoto?: string | null;
  onPhotoChange: (photoUrl: string | null) => void;
  required?: boolean;
  className?: string;
}

export const PhotoUpload = ({ currentPhoto, onPhotoChange, required = false, className = "" }: PhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentPhoto);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho do arquivo (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Criar preview local
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);

      // Converter para base64 como fallback
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        try {
          // Tentar fazer upload para Supabase Storage primeiro
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `profile-photos/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('public-uploads')
            .upload(filePath, file);

          if (!uploadError) {
            // Upload bem-sucedido, usar URL pública
            const { data } = supabase.storage
              .from('public-uploads')
              .getPublicUrl(filePath);
            
            onPhotoChange(data.publicUrl);
            toast({
              title: "Sucesso",
              description: "Foto enviada com sucesso!",
            });
          } else {
            // Fallback: usar base64
            console.warn('Storage upload failed, using base64 fallback:', uploadError);
            onPhotoChange(base64);
            toast({
              title: "Foto atualizada",
              description: "Foto atualizada localmente (modo offline).",
            });
          }
        } catch (error) {
          // Fallback: usar base64
          console.warn('Storage not available, using base64 fallback:', error);
          onPhotoChange(base64);
          toast({
            title: "Foto atualizada",
            description: "Foto atualizada localmente (modo offline).",
          });
        }
      };
      
      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Error processing photo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar a foto. Tente novamente.",
        variant: "destructive",
      });
      setPreviewUrl(currentPhoto);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPreviewUrl(null);
    onPhotoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        {/* Preview da foto */}
        <div className="relative">
          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Foto de perfil"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
              {!required && (
                <button
                  onClick={handleRemovePhoto}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
              <Camera className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Enviando..." : previewUrl ? "Alterar Foto" : "Adicionar Foto"}
          </Button>
        </div>

        {/* Input de arquivo oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Texto informativo */}
        <div className="text-center text-sm text-gray-600">
          {required && (
            <p className="text-red-600 font-medium mb-1">* Foto de perfil obrigatória</p>
          )}
          <p>Recomendado: 400x400px, máximo 5MB</p>
          <p className="text-xs">JPG, PNG ou GIF</p>
        </div>
      </div>
    </div>
  );
};