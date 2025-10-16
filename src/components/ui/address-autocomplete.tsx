import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { MapPin, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddressSuggestion {
  display_name: string;
  address: {
    road?: string;
    house_number?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  lat: string;
  lon: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onCityChange?: (city: string) => void;
  onStateChange?: (state: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function AddressAutocomplete({ 
  value, 
  onChange, 
  onCityChange,
  onStateChange,
  placeholder = "Digite o endereço...",
  required = false 
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeout = setTimeout(async () => {
      await searchAddresses(value);
    }, 300);

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [value]);

  // Close suggestions when clicking outside
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

  const searchAddresses = async (query: string) => {
    setIsLoading(true);
    console.log("🔍 Buscando endereços para:", query);
    
    try {
      // Using Nominatim (OpenStreetMap) for free geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=5&` +
        `countrycodes=BR&` +
        `q=${encodeURIComponent(query + ", Brasil")}`
      );
      
      console.log("📡 API Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        const filteredData = data.filter((item: any) => 
          item.address && (item.address.city || item.address.town || item.address.village)
        );
        
        console.log("📍 Endereços encontrados:", filteredData.length);
        setSuggestions(filteredData);
        setShowSuggestions(true);
      } else {
        console.error("❌ Erro na API:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("❌ Error searching addresses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectSuggestion = (suggestion: AddressSuggestion) => {
    const { address } = suggestion;
    
    // Build the address string
    let addressString = "";
    if (address.road) {
      addressString += address.road;
      if (address.house_number) {
        addressString += `, ${address.house_number}`;
      }
    }
    if (address.neighbourhood || address.suburb) {
      const neighborhood = address.neighbourhood || address.suburb;
      addressString += addressString ? `, ${neighborhood}` : neighborhood;
    }

    onChange(addressString || suggestion.display_name);
    
    // Update city and state if callbacks are provided
    if (onCityChange && address.city) {
      onCityChange(address.city);
    }
    if (onStateChange && address.state) {
      onStateChange(address.state);
    }

    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <div className="space-y-2">
        <Label htmlFor="address" className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Endereço {required && <span className="text-red-500">*</span>}
        </Label>
        <div className="relative">
          <Input
            ref={inputRef}
            id="address"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className="pr-10"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          💡 Digite o endereço para ver sugestões automáticas
          {isLoading && " • Buscando..."}
        </p>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto shadow-lg border bg-white"
        >
          <div className="p-2">
            <p className="text-xs text-muted-foreground mb-2 px-2">
              Sugestões de endereço:
            </p>
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start h-auto p-3 text-left"
                onClick={() => selectSuggestion(suggestion)}
              >
                <div className="flex items-start gap-2 w-full">
                  <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {suggestion.address.road && suggestion.address.house_number ? 
                        `${suggestion.address.road}, ${suggestion.address.house_number}` :
                        suggestion.address.road || 'Endereço'
                      }
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {[
                        suggestion.address.neighbourhood || suggestion.address.suburb,
                        suggestion.address.city,
                        suggestion.address.state
                      ].filter(Boolean).join(', ')}
                    </div>
                  </div>
                  <Check className="h-4 w-4 text-green-600 opacity-0 group-hover:opacity-100" />
                </div>
              </Button>
            ))}
          </div>
        </Card>
      )}

      {showSuggestions && suggestions.length === 0 && !isLoading && value.length >= 3 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg border bg-white">
          <div className="p-4 text-center text-muted-foreground text-sm">
            Nenhum endereço encontrado. Digite mais detalhes.
          </div>
        </Card>
      )}
    </div>
  );
}