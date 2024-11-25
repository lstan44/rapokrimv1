import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '../lib/logger';

interface GeolocationState {
  coordinates: { lat: number; lng: number } | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  error: GeolocationPositionError | null;
  loading: boolean;
  timestamp: number | null;
  permissionStatus: PermissionState | null;
}

const HIGH_ACCURACY_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
};

const LOW_ACCURACY_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10000,
  maximumAge: 1000
};

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    accuracy: null,
    heading: null,
    speed: null,
    error: null,
    loading: true,
    timestamp: null,
    permissionStatus: null
  });

  const watchIdRef = useRef<number>();
  const mountedRef = useRef(true);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const accuracyModeRef = useRef<'high' | 'low'>('high');

  const updatePosition = useCallback((position: GeolocationPosition) => {
    if (!mountedRef.current) return;

    setState(prev => {
      const newCoordinates = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      // Skip update if position hasn't significantly changed
      if (prev.coordinates && prev.accuracy) {
        const minAccuracyChange = 10; // meters
        const minDistanceChange = 5; // meters
        
        if (
          Math.abs(position.coords.accuracy - prev.accuracy) < minAccuracyChange &&
          calculateDistance(prev.coordinates, newCoordinates) < minDistanceChange
        ) {
          return prev;
        }
      }

      return {
        coordinates: newCoordinates,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        error: null,
        loading: false,
        timestamp: position.timestamp,
        permissionStatus: prev.permissionStatus
      };
    });

    // If we got a good position with high accuracy, reset accuracy mode
    if (position.coords.accuracy < 20) {
      accuracyModeRef.current = 'high';
    }
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    if (!mountedRef.current) return;

    logger.error(error, 'geolocation_error');

    // If high accuracy fails, try low accuracy
    if (accuracyModeRef.current === 'high' && error.code === error.TIMEOUT) {
      accuracyModeRef.current = 'low';
      startWatching();
      return;
    }

    setState(prev => ({
      ...prev,
      error,
      loading: false
    }));

    // Retry after error with exponential backoff
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    retryTimeoutRef.current = setTimeout(() => {
      startWatching();
    }, 5000);
  }, []);

  const startWatching = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    const options = accuracyModeRef.current === 'high' 
      ? HIGH_ACCURACY_OPTIONS 
      : LOW_ACCURACY_OPTIONS;

    watchIdRef.current = navigator.geolocation.watchPosition(
      updatePosition,
      handleError,
      options
    );
  }, [updatePosition, handleError]);

  const requestHighAccuracy = useCallback(() => {
    accuracyModeRef.current = 'high';
    startWatching();
  }, [startWatching]);

  const refresh = useCallback(() => {
    // Get immediate position update
    navigator.geolocation.getCurrentPosition(
      updatePosition,
      handleError,
      HIGH_ACCURACY_OPTIONS
    );
    // Restart watching with current accuracy mode
    startWatching();
  }, [updatePosition, handleError, startWatching]);

  useEffect(() => {
    if (!navigator.geolocation) {
      handleError({
        code: 0,
        message: 'Geolocation is not supported',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError);
      return;
    }

    // Check permission status
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(permission => {
          setState(prev => ({ ...prev, permissionStatus: permission.state }));
          permission.addEventListener('change', () => {
            setState(prev => ({ ...prev, permissionStatus: permission.state }));
          });
        });
    }

    mountedRef.current = true;
    startWatching();

    return () => {
      mountedRef.current = false;
      if (watchIdRef.current !== undefined) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [startWatching, handleError]);

  return {
    ...state,
    requestHighAccuracy,
    refresh
  };
}

// Helper function to calculate distance between coordinates in meters
function calculateDistance(
  coord1: { lat: number; lng: number }, 
  coord2: { lat: number; lng: number }
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
