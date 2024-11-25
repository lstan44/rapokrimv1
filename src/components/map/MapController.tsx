import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { logger } from '../../lib/logger';

interface MapControllerProps {
  onMapReady: (map: L.Map) => void;
}

export default function MapController({ onMapReady }: MapControllerProps) {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      try {
        onMapReady(map);
      } catch (error) {
        logger.error(error, 'map_controller');
      }
    }
  }, [map, onMapReady]);
  
  return null;
}