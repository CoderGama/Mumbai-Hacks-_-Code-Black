import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import { Warehouse, MapPin, Truck, Navigation, AlertTriangle, Layers } from 'lucide-react';
import { api } from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// Custom icons
const createIcon = (color, type = 'default') => {
  const iconHtml = type === 'depot' 
    ? `<div style="background: ${color}; width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
       </div>`
    : type === 'zone'
    ? `<div style="background: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`
    : `<div style="background: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const depotIcon = createIcon('#00d4ff', 'depot');
const zoneIcon = createIcon('#ff4757', 'zone');

// Map center adjuster
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 12, { duration: 1 });
    }
  }, [center, map]);
  return null;
}

export default function MapView() {
  const [mapData, setMapData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showDepots, setShowDepots] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  // Chennai center coordinates
  const defaultCenter = [13.0827, 80.2707];

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    try {
      const data = await api.getMapRoutes();
      setMapData(data);
    } catch (error) {
      console.error('Failed to fetch map data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRouteColor = (status) => {
    switch (status) {
      case 'on_time': return '#00d4ff';
      case 'delayed': return '#ff6b35';
      case 'completed': return '#2ed573';
      default: return '#00d4ff';
    }
  };

  if (isLoading) {
    return (
      <div className="map-loading">
        <Navigation className="spin" size={32} />
        <p>Loading map data...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="map-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Map Controls */}
      <div className="map-controls">
        <div className="control-group">
          <Layers size={18} />
          <span>Layers</span>
        </div>
        <label className="control-item">
          <input 
            type="checkbox" 
            checked={showDepots} 
            onChange={(e) => setShowDepots(e.target.checked)} 
          />
          <Warehouse size={16} />
          <span>Depots</span>
        </label>
        <label className="control-item">
          <input 
            type="checkbox" 
            checked={showZones} 
            onChange={(e) => setShowZones(e.target.checked)} 
          />
          <AlertTriangle size={16} />
          <span>Zones</span>
        </label>
        <label className="control-item">
          <input 
            type="checkbox" 
            checked={showRoutes} 
            onChange={(e) => setShowRoutes(e.target.checked)} 
          />
          <Navigation size={16} />
          <span>Routes</span>
        </label>
      </div>

      {/* Route Legend */}
      <div className="map-legend">
        <h4>Route Status</h4>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#00d4ff' }}></span>
          <span>On Time</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#ff6b35' }}></span>
          <span>Delayed</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#2ed573' }}></span>
          <span>Completed</span>
        </div>
      </div>

      {/* Selected Route Info */}
      {selectedRoute && (
        <motion.div 
          className="route-info-panel"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h4><Truck size={18} /> {selectedRoute.vehicle_id}</h4>
          <div className="route-details">
            <div className="detail-row">
              <span>Type:</span>
              <span>{selectedRoute.vehicle_type}</span>
            </div>
            <div className="detail-row">
              <span>From:</span>
              <span>{selectedRoute.from_location}</span>
            </div>
            <div className="detail-row">
              <span>To:</span>
              <span>{selectedRoute.to_location}</span>
            </div>
            <div className="detail-row">
              <span>ETA:</span>
              <span className="text-cyan">{selectedRoute.eta}</span>
            </div>
            <div className="detail-row">
              <span>Status:</span>
              <span className={selectedRoute.status === 'on_time' ? 'text-green' : 'text-orange'}>
                {selectedRoute.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          <button 
            className="btn btn-ghost btn-sm w-full"
            onClick={() => setSelectedRoute(null)}
          >
            Close
          </button>
        </motion.div>
      )}

      {/* Map Container */}
      <MapContainer
        center={defaultCenter}
        zoom={11}
        className="leaflet-map"
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        <MapController center={defaultCenter} />

        {/* Depots */}
        {showDepots && mapData?.depots?.map((depot) => (
          <Marker
            key={depot.id}
            position={depot.coordinates}
            icon={depotIcon}
          >
            <Popup>
              <div className="popup-content">
                <h4>{depot.name}</h4>
                <p>Supply Depot</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Zones */}
        {showZones && mapData?.zones?.map((zone) => (
          <React.Fragment key={zone.name}>
            <Marker
              position={zone.coordinates}
              icon={zoneIcon}
            >
              <Popup>
                <div className="popup-content">
                  <h4>{zone.name} Zone</h4>
                  <p>Affected Area</p>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={zone.coordinates}
              radius={3000}
              pathOptions={{
                color: '#ff4757',
                fillColor: '#ff4757',
                fillOpacity: 0.1,
                weight: 1
              }}
            />
          </React.Fragment>
        ))}

        {/* Routes */}
        {showRoutes && mapData?.routes?.map((route) => (
          route.path_coordinates?.length > 1 && (
            <Polyline
              key={route.id}
              positions={route.path_coordinates}
              pathOptions={{
                color: getRouteColor(route.status),
                weight: 4,
                opacity: 0.8,
                dashArray: route.status === 'delayed' ? '10, 10' : undefined
              }}
              eventHandlers={{
                click: () => setSelectedRoute(route)
              }}
            />
          )
        ))}
      </MapContainer>
    </motion.div>
  );
}

