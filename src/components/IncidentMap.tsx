import React, { useState, useCallback, useMemo, memo } from 'react';
import { MapContainer, TileLayer, useMap, ZoomControl } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import type { Incident } from '../types';
import 'leaflet/dist/leaflet.css';
import { useMapBounds } from '../hooks/useMapBounds';
import { useMapPosition } from '../contexts/MapPositionContext';
import { logger } from '../lib/logger';
import MapController from './map/MapController';
import MapUpdater from './map/MapUpdater';
import BoundsUpdater from './map/BoundsUpdater';
import IncidentMarker from './map/IncidentMarker';
import UserLocationMarker from './map/UserLocationMarker';
import RecenterButton from './map/RecenterButton';

interface IncidentMapProps {
  incidents: Incident[];
  userLocation: { lat: number; lng: number } | null;
  focusLocation?: { lat: number; lng: number } | null;
  zoom?: number;
}

export default memo(function IncidentMap({ 
  incidents, 
  userLocation,
  focusLocation,
  zoom = 18
}: IncidentMapProps) {
  const navigate = useNavigate();
  const [hoveredIncidentId, setHoveredIncidentId] = useState<string | null>(null);
  const { updateBounds } = useMapBounds();
  const [map, setMap] = useState<L.Map | null>(null);
  const { lastPosition, setLastPosition } = useMapPosition();
  
  const defaultCenter: [number, number] = useMemo(() => [18.9712, -72.2852], []);
  
  const center: [number, number] = useMemo(() => {
    if (lastPosition?.center) return lastPosition.center;
    if (focusLocation) return [focusLocation.lat, focusLocation.lng];
    if (userLocation) return [userLocation.lat, userLocation.lng];
    return defaultCenter;
  }, [lastPosition?.center, focusLocation, userLocation, defaultCenter]);
  
  const initialZoom = lastPosition?.zoom || zoom;

  const handleMarkerClick = useCallback((slug: string) => {
    navigate(`/incident/${slug}`);
  }, [navigate]);

  const handleMapReady = useCallback((mapInstance: L.Map) => {
    setMap(mapInstance);
  }, []);

  const handlePositionChange = useCallback((center: [number, number], zoom: number) => {
    setLastPosition({ center, zoom });
  }, [setLastPosition]);

  const handleRecenter = useCallback(() => {
    if (map && userLocation) {
      map.setView(
        [userLocation.lat, userLocation.lng],
        initialZoom,
        { animate: true }
      );
    }
  }, [map, userLocation, initialZoom]);

  // Filter out incidents with invalid coordinates
  const validIncidents = useMemo(() => {
    return incidents.filter(incident => {
      if (!incident?.location?.coordinates) return false;
      
      const [lng, lat] = incident.location.coordinates;
      return Array.isArray(incident.location.coordinates) && 
             incident.location.coordinates.length === 2 &&
             !isNaN(lat) && 
             !isNaN(lng);
    });
  }, [incidents]);

  // Memoize all map configuration
  const mapConfig = useMemo(() => ({
    minZoom: 10,
    maxZoom: 18,
    bounceAtZoomLimits: true,
    zoomControl: false,
  }), []);

  // Memoize tile layer config
  const tileLayerConfig = useMemo(() => ({
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    crossOrigin: "anonymous"
  }), []);

  // Optimize marker event handlers
  const markerEventHandlers = useMemo(() => ({
    onMouseOver: (id: string) => () => setHoveredIncidentId(id),
    onMouseOut: () => () => setHoveredIncidentId(null),
  }), []);

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={initialZoom}
        className="h-full w-full"
        {...mapConfig}
        whenReady={useCallback((map) => {
          requestAnimationFrame(() => {
            map.target.invalidateSize();
          });
        }, [])}
      >
        <ZoomControl position="bottomleft" />
        <MapController onMapReady={handleMapReady} />
        <TileLayer
          {...tileLayerConfig}
        />
        
        <MapUpdater center={center} zoom={initialZoom} />
        <BoundsUpdater 
          updateBounds={updateBounds}
          onPositionChange={handlePositionChange}
        />
        
        {userLocation && (
          <UserLocationMarker position={userLocation} />
        )}

        {validIncidents.map((incident) => (
          <IncidentMarker
            key={incident.id}
            incident={incident}
            isHovered={hoveredIncidentId === incident.id}
            onClick={handleMarkerClick}
            {...markerEventHandlers}
          />
        ))}
      </MapContainer>
      <RecenterButton onClick={handleRecenter} />
      {/* {userLocation && (
        <RecenterButton onClick={handleRecenter} />
      )} */}
    </div>
  );
})