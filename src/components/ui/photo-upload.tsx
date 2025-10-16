import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface PhotoUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  maxImages?: number;
  existingImages?: string[];
}

export function PhotoUpload({ onImageUploaded, maxImages = 5, existingImages = [] }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>(existingImages);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast({
        title: "Limite excedido",
        description: `Você pode anexar no máximo ${maxImages} imagens.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}_${Date.now()}.${fileExt}`;
        const filePath = `chat-images/${fileName}`;

        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(data.path);

        setImages(prev => [...prev, publicUrl]);
        onImageUploaded(publicUrl);
      }

      toast({
        title: "Imagens enviadas",
        description: "As imagens foram anexadas com sucesso.",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar as imagens.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (imageUrl: string) => {
    setImages(prev => prev.filter(img => img !== imageUrl));
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= maxImages}
          className="gap-2"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              Anexar Imagem
            </>
          )}
        </Button>
        
        {images.length > 0 && (
          <span className="text-sm text-muted-foreground self-center">
            {images.length}/{maxImages} imagens
          </span>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image}
                alt={`Anexo ${index + 1}`}
                className="w-full h-20 object-cover rounded-md border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(image)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}