import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { logger } from '../../lib/logger';

interface MapUpdaterProps {
  center: [number, number];
  zoom: number;
}

export default function MapUpdater({ center, zoom }: MapUpdaterProps) {
  const map = useMap();
  const hasSetInitialView = useRef(false);
  
  useEffect(() => {
    if (!hasSetInitialView.current && map) {
      const timer = setTimeout(() => {
        try {
          map.setView(center, zoom, { animate: false });
          hasSetInitialView.current = true;
        } catch (error) {
          logger.error(error, 'map_set_view');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [map, center, zoom]);

  return null;
}