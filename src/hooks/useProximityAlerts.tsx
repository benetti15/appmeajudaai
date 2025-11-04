import { useEffect, useState } from 'react';

interface ProximityAlert {
  threshold: number;
  key: string;
  message: string;
}

export function useProximityAlerts(
  distance: number | null,
  eta: number | null,
  onAlert: (message: string) => void
) {
  const [alertsShown, setAlertsShown] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!distance || !eta) return;

    const alerts: ProximityAlert[] = [
      { threshold: 2, key: '2km', message: '🚗 Profissional está a 2km de você!' },
      { threshold: 1, key: '1km', message: '📍 Profissional está próximo! (~1km)' },
      { threshold: 0.5, key: '500m', message: '🎯 Profissional está quase chegando!' },
      { threshold: 0.2, key: '200m', message: '👋 Profissional está chegando! (~200m)' },
    ];

    alerts.forEach(alert => {
      if (distance <= alert.threshold && !alertsShown.has(alert.key)) {
        onAlert(alert.message);
        setAlertsShown(prev => new Set(prev).add(alert.key));
      }
    });
  }, [distance, eta, alertsShown, onAlert]);

  const resetAlerts = () => {
    setAlertsShown(new Set());
  };

  return { resetAlerts };
}
