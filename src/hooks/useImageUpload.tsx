import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UploadedImage {
  url: string;
  file: File;
  preview: string;
}

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const { toast } = useToast();

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file);

      if (error) throw error;

      // Use signed URL for private bucket (1 hour expiry)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('chat-attachments')
        .createSignedUrl(data.path, 3600);

      if (signedUrlError) throw signedUrlError;

      return signedUrlData.signedUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erro ao fazer upload',
        description: 'Não foi possível enviar a imagem. Tente novamente.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione apenas imagens.',
        variant: 'destructive',
      });
      return;
    }

    if (images.length + imageFiles.length > 5) {
      toast({
        title: 'Limite excedido',
        description: 'Você pode enviar no máximo 5 imagens por vez.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    const newImages: UploadedImage[] = [];
    for (const file of imageFiles) {
      const preview = URL.createObjectURL(file);
      const url = await uploadImage(file);
      if (url) {
        newImages.push({ url, file, preview });
      }
    }

    setImages(prev => [...prev, ...newImages]);
    setUploading(false);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const clearImages = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
  };

  return {
    images,
    uploading,
    handleFiles,
    removeImage,
    clearImages,
  };
};
