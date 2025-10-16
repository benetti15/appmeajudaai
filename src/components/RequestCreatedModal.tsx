import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Clock, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RequestCreatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
}

export function RequestCreatedModal({ isOpen, onClose, requestId }: RequestCreatedModalProps) {
  const navigate = useNavigate();

  const handleTrackProgress = () => {
    onClose();
    navigate(`/track-request/${requestId}`);
  };

  const handleViewDetails = () => {
    onClose();
    navigate(`/request-details/${requestId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Solicitação Criada com Sucesso!
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Sua solicitação foi publicada e profissionais qualificados já podem visualizá-la. 
            Você receberá notificações quando orçamentos chegarem.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={handleTrackProgress}
              className="w-full gap-2"
            >
              <Clock className="w-4 h-4" />
              Acompanhar Progresso
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleViewDetails}
              className="w-full gap-2"
            >
              <FileText className="w-4 h-4" />
              Ver Detalhes
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}