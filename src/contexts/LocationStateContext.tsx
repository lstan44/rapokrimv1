import React, { createContext, useContext, useEffect, useState } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';

interface LocationState {
  currentLocation: { lat: number; lng: number } | null;
  accuracy: number | null;
  lastKnownLocation: { lat: number; lng: number } | null;
  isHighAccuracy: boolean;
  error: GeolocationPositionError | null;
  permissionStatus: PermissionState | null;
}

interface LocationContextValue extends LocationState {
  requestHighAccuracy: () => void;
  refreshLocation: () => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const geolocation = useGeolocation();
  const [lastKnownLocation, setLastKnownLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (geolocation.coordinates) {
      setLastKnownLocation(geolocation.coordinates);
    }
  }, [geolocation.coordinates]);

  const value = {
    currentLocation: geolocation.coordinates,
    accuracy: geolocation.accuracy,
    lastKnownLocation,
    isHighAccuracy: geolocation.accuracy ? geolocation.accuracy < 20 : false,
    error: geolocation.error,
    permissionStatus: geolocation.permissionStatus,
    requestHighAccuracy: () => {
      // Force high accuracy mode in useGeolocation
      geolocation.requestHighAccuracy?.();
    },
    refreshLocation: () => {
      // Trigger a fresh location update
      geolocation.refresh?.();
    }
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationState() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationState must be used within a LocationProvider');
  }
  return context;
}
