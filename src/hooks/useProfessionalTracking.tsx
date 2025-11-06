import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TrackingState {
  isTracking: boolean;
  error: string | null;
}

interface UseProfessionalTrackingOptions {
  autoStart?: boolean;
  silentMode?: boolean;
}

export function useProfessionalTracking(
  requestId: string, 
  professionalId: string,
  options: UseProfessionalTrackingOptions = {}
) {
  const { autoStart = false, silentMode = false } = options;
  const [state, setState] = useState<TrackingState>({
    isTracking: false,
    error: null,
  });
  const { toast } = useToast();
  const watchIdRef = useRef<number | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoStartedRef = useRef(false);

  const updateLocation = useCallback(async (latitude: number, longitude: number, heading?: number, speed?: number) => {
    try {
      // Check if location already exists for this request
      const { data: existing } = await supabase
        .from('professional_live_location')
        .select('id')
        .eq('request_id', requestId)
        .eq('professional_id', professionalId)
        .single();

      if (existing) {
        // Update existing location
        const { error } = await supabase
          .from('professional_live_location')
          .update({
            latitude,
            longitude,
            heading: heading || null,
            speed: speed || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new location
        const { error } = await supabase
          .from('professional_live_location')
          .insert({
            request_id: requestId,
            professional_id: professionalId,
            latitude,
            longitude,
            heading: heading || null,
            speed: speed || null,
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating location:', error);
      setState(prev => ({ ...prev, error: 'Erro ao atualizar localização' }));
    }
  }, [requestId, professionalId]);

  const startTracking = useCallback(async (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) {
        toast({
          title: "Erro",
          description: "Geolocalização não suportada pelo navegador",
          variant: "destructive",
        });
      }
      return;
    }

    setState({ isTracking: true, error: null });

    // Watch position with high accuracy
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading, speed } = position.coords;
        updateLocation(latitude, longitude, heading || undefined, speed || undefined);
      },
      (error) => {
        let errorMessage = "Erro ao obter localização";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permissão de localização negada";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Localização indisponível";
            break;
          case error.TIMEOUT:
            errorMessage = "Tempo esgotado ao buscar localização";
            break;
        }
        
        toast({
          title: "Erro de localização",
          description: errorMessage,
          variant: "destructive",
        });
        
        setState({ isTracking: false, error: errorMessage });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Notify client that tracking has started
    try {
      const { data: request } = await supabase
        .from('service_requests')
        .select('client_id')
        .eq('id', requestId)
        .single();

      if (request) {
        await supabase.from('notifications').insert({
          user_id: request.client_id,
          type: 'tracking_started',
          title: 'Profissional a caminho',
          message: 'O profissional iniciou o compartilhamento de localização. Você pode acompanhar em tempo real!',
          related_id: requestId,
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }

    if (!silent && !silentMode) {
      toast({
        title: "Rastreamento iniciado",
        description: "Sua localização está sendo compartilhada com o cliente",
      });
    }
  }, [updateLocation, toast, requestId, silentMode]);

  const stopTracking = useCallback(async (silent = false) => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    // Remove location from database
    try {
      await supabase
        .from('professional_live_location')
        .delete()
        .eq('request_id', requestId)
        .eq('professional_id', professionalId);
    } catch (error) {
      console.error('Error removing location:', error);
    }

    setState({ isTracking: false, error: null });

    if (!silent && !silentMode) {
      toast({
        title: "Rastreamento parado",
        description: "Localização não está mais sendo compartilhada",
      });
    }
  }, [requestId, professionalId, toast, silentMode]);

  // Auto-start tracking when enabled
  useEffect(() => {
    if (autoStart && !hasAutoStartedRef.current && !state.isTracking) {
      hasAutoStartedRef.current = true;
      startTracking(true);
    }
  }, [autoStart, startTracking, state.isTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startTracking,
    stopTracking,
  };
}
