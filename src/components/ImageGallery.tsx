import { useState } from "react";
import { Image, X, ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImageGalleryProps {
  images: string[];
  title?: string;
}

export const ImageGallery = ({ images, title = "Fotos anexadas" }: ImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const openImageModal = (imageUrl: string, index: number) => {
    setSelectedImage(imageUrl);
    setCurrentIndex(index);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    const nextIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(nextIndex);
    setSelectedImage(images[nextIndex]);
  };

  const prevImage = () => {
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(prevIndex);
    setSelectedImage(images[prevIndex]);
  };

  return (
    <>
      <div className="border-t pt-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Image className="h-4 w-4" />
          {title}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((imageUrl: string, index: number) => (
            <div key={index} className="aspect-square relative rounded-lg overflow-hidden border bg-muted group cursor-pointer">
              <img
                src={imageUrl}
                alt={`Foto ${index + 1} do serviço`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onClick={() => openImageModal(imageUrl, index)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="w-full h-full bg-muted flex items-center justify-center">
                        <div class="text-center text-muted-foreground">
                          <Image class="w-8 h-8 mx-auto mb-2" />
                          <p class="text-xs">Erro ao carregar</p>
                        </div>
                      </div>
                    `;
                  }
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Clique nas imagens para visualizar em tamanho maior ({images.length} {images.length === 1 ? 'foto' : 'fotos'})
        </p>
      </div>

      {/* Modal for image preview */}
      <Dialog open={!!selectedImage} onOpenChange={closeModal}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center justify-between">
              <span>Foto {currentIndex + 1} de {images.length}</span>
              <Button variant="ghost" size="sm" onClick={closeModal}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="relative">
            {selectedImage && (
              <img
                src={selectedImage}
                alt={`Foto ${currentIndex + 1} do serviço`}
                className="w-full max-h-[70vh] object-contain"
              />
            )}
            
            {images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2"
                  onClick={prevImage}
                >
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2"
                  onClick={nextImage}
                >
                  →
                </Button>
              </>
            )}
          </div>
          <div className="p-6 pt-2">
            <p className="text-sm text-muted-foreground text-center">
              Use as setas ou clique nos botões para navegar entre as imagens
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};