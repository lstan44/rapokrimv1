import { useRef, useEffect } from 'react';
import { Map as LeafletMap } from 'leaflet';
import { logger } from '../lib/logger';

export function useMapInstance() {
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
          mapRef.current = null;
        } catch (error) {
          logger.error(error, 'map_cleanup');
        }
      }
    };
  }, []);

  return mapRef;
}