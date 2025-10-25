import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface AddressSuggestion {
  place_name: string;
  center: [number, number]; // [longitude, latitude]
  text: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, coordinates?: { latitude: number; longitude: number }) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Digite o endereço",
  className = "" 
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Get Mapbox token from environment
      const mapboxToken = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
      
      if (!mapboxToken) {
        console.warn("Mapbox token not configured");
        return;
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${mapboxToken}&` +
        `country=BR&` +
        `language=pt&` +
        `limit=5&` +
        `types=address,place`
      );

      if (!response.ok) throw new Error("Failed to fetch suggestions");

      const data = await response.json();
      setSuggestions(data.features || []);
      setOpen(true);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);

    // Debounce API calls
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 500);
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    const [longitude, latitude] = suggestion.center;
    setInputValue(suggestion.place_name);
    onChange(suggestion.place_name, { latitude, longitude });
    setSuggestions([]);
    setOpen(false);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const mapboxToken = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?` +
            `access_token=${mapboxToken}&language=pt`
          );

          const data = await response.json();
          if (data.features && data.features.length > 0) {
            const address = data.features[0].place_name;
            setInputValue(address);
            onChange(address, { latitude, longitude });
          }
        } catch (error) {
          console.error("Error reverse geocoding:", error);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        setLoading(false);
      }
    );
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative flex-1">
            <Input
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={placeholder}
              className="pr-10"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {!loading && <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandList>
              <CommandEmpty>Nenhum endereço encontrado.</CommandEmpty>
              <CommandGroup>
                {suggestions.map((suggestion, index) => (
                  <CommandItem
                    key={index}
                    onSelect={() => handleSelectSuggestion(suggestion)}
                    className="cursor-pointer"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>{suggestion.place_name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={getCurrentLocation}
        disabled={loading}
        title="Usar localização atual"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
