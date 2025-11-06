import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MapPin, 
  Search, 
  Loader2, 
  CheckCircle2, 
  Navigation,
  AlertCircle 
} from "lucide-react";
import { AddressData, formatCEP, isValidCEP, formatAddress } from "@/lib/address-utils";
import { useAddressGeocoding } from "@/hooks/useAddressGeocoding";
import { useGeolocation } from "@/hooks/useGeolocation";

interface EnhancedAddressInputProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  required?: boolean;
  showMap?: boolean;
  allowCurrentLocation?: boolean;
}

export function EnhancedAddressInput({
  value,
  onChange,
  required = false,
  allowCurrentLocation = true
}: EnhancedAddressInputProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const { geocodeAddress, geocodeByCEP, reverseGeocode, isGeocoding, error } = useAddressGeocoding();
  const { getCurrentPosition, latitude, longitude, loading: geoLoading } = useGeolocation();

  // Debounced search
  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);

    if (searchQuery.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeout = setTimeout(async () => {
      // Verificar se é CEP
      const cleanQuery = searchQuery.replace(/\D/g, '');
      if (cleanQuery.length === 8) {
        const result = await geocodeByCEP(searchQuery);
        if (result) {
          handleSelectAddress(result);
        }
      } else {
        // Buscar endereço
        const results = await geocodeAddress(searchQuery);
        if (results) {
          setSuggestions(results);
          setShowSuggestions(true);
        }
      }
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [searchQuery]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectAddress = (result: Partial<AddressData>) => {
    const newAddress: AddressData = {
      street: result.street || value.street || "",
      number: result.number || value.number || "",
      complement: value.complement || "",
      neighborhood: result.neighborhood || value.neighborhood || "",
      city: result.city || value.city || "",
      state: result.state || value.state || "",
      postal_code: result.postal_code || value.postal_code || "",
      latitude: result.latitude || null,
      longitude: result.longitude || null,
      formatted_address: result.formatted_address || formatAddress(result)
    };

    onChange(newAddress);
    setIsValidated(true);
    setShowSuggestions(false);
    setSuggestions([]);
    setSearchQuery("");
  };

  const handleUseCurrentLocation = async () => {
    getCurrentPosition();
  };

  // Quando geolocalização retornar coordenadas
  useEffect(() => {
    if (latitude && longitude) {
      reverseGeocode(latitude, longitude).then((result) => {
        if (result) {
          handleSelectAddress(result);
        }
      });
    }
  }, [latitude, longitude]);

  const handleInputChange = (field: keyof AddressData, newValue: string) => {
    const updatedAddress = { ...value, [field]: newValue };
    
    // Auto-formatar CEP
    if (field === 'postal_code') {
      updatedAddress.postal_code = formatCEP(newValue);
    }
    
    // Atualizar formatted_address
    updatedAddress.formatted_address = formatAddress(updatedAddress);
    
    onChange(updatedAddress);
    
    // Marcar como não validado se usuário modificar manualmente
    if (isValidated) setIsValidated(false);
  };

  const hasCoordinates = value.latitude !== null && value.longitude !== null;

  return (
    <div className="space-y-4">
      {/* Busca de Endereço */}
      <div className="space-y-2">
        <Label htmlFor="address-search" className="flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          Buscar Endereço {required && <span className="text-destructive">*</span>}
        </Label>
        <div className="relative">
          <Input
            ref={inputRef}
            id="address-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Digite endereço ou CEP..."
            className="pr-20"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isGeocoding && (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            )}
            {allowCurrentLocation && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleUseCurrentLocation}
                disabled={geoLoading}
                className="h-8 w-8 p-0"
              >
                {geoLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          💡 Digite um endereço completo ou CEP para buscar
        </p>
      </div>

      {/* Sugestões */}
      {showSuggestions && suggestions.length > 0 && (
        <Card 
          ref={suggestionsRef}
          className="absolute z-50 w-full max-h-60 overflow-y-auto shadow-lg"
        >
          <CardContent className="p-2">
            <p className="text-xs text-muted-foreground mb-2 px-2">
              Selecione um endereço:
            </p>
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start h-auto p-3 text-left"
                onClick={() => handleSelectAddress(suggestion)}
              >
                <div className="flex items-start gap-2 w-full">
                  <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {suggestion.street && suggestion.number
                        ? `${suggestion.street}, ${suggestion.number}`
                        : suggestion.street || suggestion.formatted_address}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {[suggestion.neighborhood, suggestion.city, suggestion.state]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Campos do Endereço */}
      {value.street && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-4">
            {hasCoordinates && isValidated ? (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Endereço validado e geocodificado</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span>Preencha todos os campos</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <Label htmlFor="street">Rua/Avenida {required && <span className="text-destructive">*</span>}</Label>
              <Input
                id="street"
                value={value.street}
                onChange={(e) => handleInputChange('street', e.target.value)}
                required={required}
              />
            </div>
            <div>
              <Label htmlFor="number">Número {required && <span className="text-destructive">*</span>}</Label>
              <Input
                id="number"
                value={value.number}
                onChange={(e) => handleInputChange('number', e.target.value)}
                required={required}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="complement">Complemento</Label>
            <Input
              id="complement"
              value={value.complement || ""}
              onChange={(e) => handleInputChange('complement', e.target.value)}
              placeholder="Apto, bloco, etc."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="neighborhood">Bairro {required && <span className="text-destructive">*</span>}</Label>
              <Input
                id="neighborhood"
                value={value.neighborhood}
                onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                required={required}
              />
            </div>
            <div>
              <Label htmlFor="city">Cidade {required && <span className="text-destructive">*</span>}</Label>
              <Input
                id="city"
                value={value.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                required={required}
              />
            </div>
            <div>
              <Label htmlFor="state">Estado {required && <span className="text-destructive">*</span>}</Label>
              <Input
                id="state"
                value={value.state}
                onChange={(e) => handleInputChange('state', e.target.value.toUpperCase())}
                maxLength={2}
                required={required}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="postal_code">CEP {required && <span className="text-destructive">*</span>}</Label>
            <Input
              id="postal_code"
              value={value.postal_code}
              onChange={(e) => handleInputChange('postal_code', e.target.value)}
              placeholder="00000-000"
              maxLength={9}
              required={required}
            />
            {value.postal_code && !isValidCEP(value.postal_code) && (
              <p className="text-xs text-destructive mt-1">CEP inválido</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
