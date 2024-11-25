import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import type { MapBounds } from '../../types';

interface BoundsUpdaterProps {
  updateBounds: (bounds: MapBounds) => void;
  onPositionChange: (center: [number, number], zoom: number) => void;
}

export default function BoundsUpdater({ updateBounds, onPositionChange }: BoundsUpdaterProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const handleMoveEnd = () => {
      const bounds = map.getBounds();
      console.log('🗺️ Map moved, new bounds:', bounds);
      
      updateBounds({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest()
      });

      const center = map.getCenter();
      onPositionChange([center.lat, center.lng], map.getZoom());
    };

    map.on('moveend', handleMoveEnd);
    // Trigger initial bounds update
    handleMoveEnd();

    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, updateBounds, onPositionChange]);

  return null;
}