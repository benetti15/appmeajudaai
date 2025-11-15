import { useRef, useEffect } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useImageUpload, UploadedImage } from '@/hooks/useImageUpload';

interface ImageUploadAreaProps {
  onImagesChange: (images: UploadedImage[]) => void;
  className?: string;
}

export const ImageUploadArea = ({ onImagesChange, className }: ImageUploadAreaProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { images, uploading, handleFiles, removeImage } = useImageUpload();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleRemove = (index: number) => {
    removeImage(index);
    const updatedImages = images.filter((_, i) => i !== index);
    onImagesChange(updatedImages);
  };

  // Notify parent of changes
  useEffect(() => {
    onImagesChange(images);
  }, [images, onImagesChange]);

  return (
    <div className={cn("space-y-2", className)}>
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
              <img
                src={img.preview}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < 5 && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Enviando...' : 'Selecionar'}
            </Button>

            {/* Camera button (primarily for mobile) */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = "image/*";
                  fileInputRef.current.capture = "environment" as any;
                  fileInputRef.current.click();
                }
              }}
              disabled={uploading}
              className="gap-2 md:hidden"
            >
              <Camera className="w-4 h-4" />
              Câmera
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-2">
            Arraste imagens ou clique para selecionar (máx. 5)
          </p>
        </div>
      )}
    </div>
  );
};
