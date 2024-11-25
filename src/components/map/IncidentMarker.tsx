import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useTranslation } from 'react-i18next';
import type { Incident } from '../../types';

interface IncidentMarkerProps {
  incident: Incident;
  isHovered: boolean;
  onClick: (slug: string) => void;
  onMouseOver: () => void;
  onMouseOut: () => void;
}

export default function IncidentMarker({
  incident,
  isHovered,
  onClick,
  onMouseOver,
  onMouseOut
}: IncidentMarkerProps) {
  const { t } = useTranslation();

  const icon = useMemo(() => new Icon({
    iconUrl: isHovered ? '/markers/marker-icon-2x.png' : '/markers/marker-icon.png',
    shadowUrl: '/markers/marker-shadow.png',
    iconSize: isHovered ? [30, 49] : [25, 41],
    iconAnchor: isHovered ? [15, 49] : [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }), [isHovered]);

  if (!incident.location?.coordinates || 
      !Array.isArray(incident.location.coordinates) || 
      incident.location.coordinates.length !== 2) {
    return null;
  }

  return (
    <Marker
      position={[incident.location.coordinates[1], incident.location.coordinates[0]]}
      icon={icon}
      eventHandlers={{
        click: () => onClick(incident.slug),
        mouseover: onMouseOver,
        mouseout: onMouseOut
      }}
    >
      <Popup>
        <div 
          className="p-2 cursor-pointer hover:bg-gray-50"
          onClick={() => onClick(incident.slug)}
        >
          <h3 className="font-semibold text-lg">
            {t(`incident.types.${incident.type}`)}
          </h3>
          <p className="text-sm text-gray-600">{incident.description}</p>
          <div className="mt-2 text-sm text-gray-500">
            {incident.location_zone}
          </div>
          <div className="mt-2 text-sm text-red-600 hover:text-red-700">
            {t('incident.details.clickToView')}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}