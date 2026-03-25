import React, { useMemo } from "react";
import L from "leaflet";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { Incident, IncidentPriority } from "../../types";
import { DEFAULT_STATIONS } from "../../types";

/**
 * CommandMap component
 * Renders Leaflet map with station and incident markers and supports incident focus/selection.
 */
interface CommandMapProps {
  incidents: Incident[];
  selectedIncidentId?: string | null;
  onSelectIncident?: (incidentId: string) => void;
}

const PRIORITY_COLORS: Record<IncidentPriority, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

function buildIncidentIcon(priority: IncidentPriority): L.DivIcon {
  return L.divIcon({
    className: "incident-marker",
    html: `<div style="
      width:16px;
      height:16px;
      border:2px solid #0b1220;
      background:${PRIORITY_COLORS[priority]};
      box-shadow:0 0 0 5px ${PRIORITY_COLORS[priority]}33;
      border-radius:999px;
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function buildStationIcon(): L.DivIcon {
  return L.divIcon({
    className: "station-marker",
    html: `<div style="
      width:12px;
      height:12px;
      border:2px solid #0a0f1a;
      background:#60a5fa;
      box-shadow:0 0 0 4px rgba(96,165,250,0.25);
      border-radius:2px;
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

const stationIcon = buildStationIcon();

const FocusIncident: React.FC<{ incident?: Incident }> = ({ incident }) => {
  const map = useMap();

  React.useEffect(() => {
    if (!incident) return;
    map.flyTo([incident.location.lat, incident.location.lng], 12, { duration: 0.8 });
  }, [incident, map]);

  return null;
};

export const CommandMap: React.FC<CommandMapProps> = ({ incidents, selectedIncidentId, onSelectIncident }) => {
  const selectedIncident = incidents.find((incident) => incident.id === selectedIncidentId);

  const mapCenter = useMemo<[number, number]>(() => {
    if (selectedIncident) {
      return [selectedIncident.location.lat, selectedIncident.location.lng];
    }
    if (incidents.length > 0) {
      return [incidents[0].location.lat, incidents[0].location.lng];
    }
    return [39.8283, -98.5795];
  }, [selectedIncident, incidents]);

  return (
    <div className="h-full w-full border border-[#243248] bg-[#050b14]">
      <MapContainer center={mapCenter} zoom={5} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FocusIncident incident={selectedIncident} />

        {DEFAULT_STATIONS.map((station) => (
          <Marker key={station.id} position={[station.location.lat, station.location.lng]} icon={stationIcon}>
            <Popup>
              <p><strong>{station.name}</strong></p>
              <p>Station Marker</p>
            </Popup>
          </Marker>
        ))}

        {incidents.map((incident) => (
          <React.Fragment key={incident.id}>
            <Marker
              position={[incident.location.lat, incident.location.lng]}
              icon={buildIncidentIcon(incident.priority)}
              eventHandlers={{
                click: () => onSelectIncident?.(incident.id),
              }}
            >
              <Popup>
                <p><strong>{incident.title}</strong></p>
                <p>{incident.address}</p>
                <p>Priority: {incident.priority.toUpperCase()}</p>
              </Popup>
            </Marker>

            {incident.priority === "critical" && (
              <Circle
                center={[incident.location.lat, incident.location.lng]}
                radius={900}
                pathOptions={{
                  color: PRIORITY_COLORS[incident.priority],
                  weight: 1,
                  fillColor: PRIORITY_COLORS[incident.priority],
                  fillOpacity: 0.12,
                }}
              />
            )}
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
};
