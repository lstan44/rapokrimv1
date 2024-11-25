import React, { createContext, useContext, useState, useCallback } from 'react';

interface MapPosition {
  center: [number, number];
  zoom: number;
}

interface MapContextType {
  lastPosition: MapPosition | null;
  setLastPosition: (position: MapPosition) => void;
}

const MapContext = createContext<MapContextType | null>(null);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [lastPosition, setLastPosition] = useState<MapPosition | null>(null);

  const handleSetLastPosition = useCallback((position: MapPosition) => {
    setLastPosition(position);
  }, []);

  return (
    <MapContext.Provider value={{ lastPosition, setLastPosition: handleSetLastPosition }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapPosition() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapPosition must be used within a MapProvider');
  }
  return context;
}