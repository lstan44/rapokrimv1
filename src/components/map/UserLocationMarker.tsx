import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useTranslation } from 'react-i18next';

interface UserLocationMarkerProps {
  position: { lat: number; lng: number };
}

export default function UserLocationMarker({ position }: UserLocationMarkerProps) {
  const { t } = useTranslation();

  const icon = useMemo(() => new Icon({
    iconUrl: '/markers/marker-icon.png',
    iconRetinaUrl: '/markers/marker-icon-2x.png',
    shadowUrl: '/markers/marker-shadow.png',
    iconSize: [27, 44],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: 'user-location-marker'
  }), []);

  return (
    <Marker position={[position.lat, position.lng]} icon={icon}>
      <Popup>
        <div className="text-center">
          <strong>{t('incident.details.yourLocation')}</strong>
        </div>
      </Popup>
    </Marker>
  );
}