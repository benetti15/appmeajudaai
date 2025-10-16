import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code, Eye, EyeOff } from "lucide-react";

export function DebugInfo() {
  const location = useLocation();
  const [showDebug, setShowDebug] = useState(false);
  const [features, setFeatures] = useState({
    addressAutocomplete: false,
    fileUpload: false,
    notifications: false,
    nominatimAPI: false
  });

  useEffect(() => {
    // Verificar se as funcionalidades estão disponíveis
    const checkFeatures = async () => {
      const newFeatures = {
        addressAutocomplete: !!document.querySelector('[placeholder*="Digite o endereço"]'),
        fileUpload: !!document.querySelector('[accept*="image"]'),
        notifications: !!document.querySelector('[class*="notification"]') || !!document.querySelector('[class*="bell"]'),
        nominatimAPI: false
      };

      // Testar API do Nominatim
      try {
        const response = await fetch(
          'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=São Paulo, Brasil'
        );
        newFeatures.nominatimAPI = response.ok;
      } catch (error) {
        console.log('Nominatim API não disponível:', error);
      }

      setFeatures(newFeatures);
    };

    if (showDebug) {
      checkFeatures();
    }
  }, [showDebug, location.pathname]);

  const getRouteInfo = () => {
    const isNewRequestRoute = location.pathname.includes('/new-request/');
    const isIndexPage = location.pathname === '/';
    const categoryId = location.pathname.split('/new-request/')[1];
    
    return {
      currentPath: location.pathname,
      isNewRequestRoute,
      isIndexPage,
      categoryId,
      shouldShowForm: isNewRequestRoute && categoryId
    };
  };

  const routeInfo = getRouteInfo();

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setShowDebug(true)}
          size="sm"
          variant="outline"
          className="bg-white/90 backdrop-blur-sm"
        >
          <Code className="w-4 h-4 mr-2" />
          Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Debug Info</CardTitle>
            <Button
              onClick={() => setShowDebug(false)}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div>
            <p className="font-medium mb-1">Rota Atual:</p>
            <Badge variant="outline" className="text-xs">
              {routeInfo.currentPath}
            </Badge>
          </div>
          
          <div>
            <p className="font-medium mb-1">Status da Rota:</p>
            <div className="space-y-1">
              <Badge variant={routeInfo.isNewRequestRoute ? "default" : "secondary"}>
                Formulário: {routeInfo.shouldShowForm ? "Sim" : "Não"}
              </Badge>
              {routeInfo.categoryId && (
                <Badge variant="outline">
                  ID: {routeInfo.categoryId}
                </Badge>
              )}
            </div>
          </div>

          <div>
            <p className="font-medium mb-1">Funcionalidades:</p>
            <div className="grid grid-cols-2 gap-1">
              <Badge variant={features.addressAutocomplete ? "default" : "destructive"}>
                Endereço: {features.addressAutocomplete ? "✓" : "✗"}
              </Badge>
              <Badge variant={features.fileUpload ? "default" : "destructive"}>
                Upload: {features.fileUpload ? "✓" : "✗"}
              </Badge>
              <Badge variant={features.notifications ? "default" : "destructive"}>
                Notif.: {features.notifications ? "✓" : "✗"}
              </Badge>
              <Badge variant={features.nominatimAPI ? "default" : "destructive"}>
                API: {features.nominatimAPI ? "✓" : "✗"}
              </Badge>
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Para testar as funcionalidades, acesse: 
              <br />
              <code>/new-request/categoria-id</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}