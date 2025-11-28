import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import { Warehouse, Truck, Navigation, AlertTriangle, Layers, Ship, Plane, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';
import { useSync } from '../context/SyncContext';

// Custom icons for markers
const createIcon = (color, type = 'default', size = 24) => {
  let iconHtml = '';
  
  if (type === 'depot') {
    iconHtml = `<div style="background: ${color}; width: ${size}px; height: ${size}px; border-radius: 4px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
      <svg width="${size * 0.6}" height="${size * 0.6}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    </div>`;
  } else if (type === 'zone') {
    iconHtml = `<div style="background: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
      <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    </div>`;
  } else if (type === 'truck') {
    iconHtml = `<div style="background: ${color}; width: ${size}px; height: ${size}px; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.4); border: 2px solid white;">
      <svg width="${size * 0.6}" height="${size * 0.6}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <rect x="1" y="3" width="15" height="13"></rect>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
        <circle cx="5.5" cy="18.5" r="2.5"></circle>
        <circle cx="18.5" cy="18.5" r="2.5"></circle>
      </svg>
    </div>`;
  } else if (type === 'boat') {
    iconHtml = `<div style="background: ${color}; width: ${size}px; height: ${size}px; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.4); border: 2px solid white;">
      <svg width="${size * 0.6}" height="${size * 0.6}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path>
        <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"></path>
        <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"></path>
        <path d="M12 10V2"></path>
      </svg>
    </div>`;
  } else if (type === 'drone') {
    iconHtml = `<div style="background: ${color}; width: ${size}px; height: ${size}px; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.4); border: 2px solid white;">
      <svg width="${size * 0.6}" height="${size * 0.6}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path>
      </svg>
    </div>`;
  } else if (type === 'arrow') {
    iconHtml = `<div style="width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${color}" stroke-width="1">
        <polygon points="12,2 22,12 12,22 12,15 2,15 2,9 12,9"></polygon>
      </svg>
    </div>`;
  } else {
    iconHtml = `<div style="background: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`;
  }

  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

// Pre-create icons
const depotIcon = createIcon('#00d4ff', 'depot', 28);
const zoneIcon = createIcon('#ff4757', 'zone', 26);

// Vehicle icons by type
const vehicleIcons = {
  truck: createIcon('#00d4ff', 'truck', 28),
  truck_delayed: createIcon('#ff6b35', 'truck', 28),
  boat: createIcon('#9b59b6', 'boat', 28),
  boat_delayed: createIcon('#ff6b35', 'boat', 28),
  drone: createIcon('#2ed573', 'drone', 24),
  drone_delayed: createIcon('#ff6b35', 'drone', 24),
};

// Calculate direction angle between two points
const calculateBearing = (start, end) => {
  const lat1 = start[0] * Math.PI / 180;
  const lat2 = end[0] * Math.PI / 180;
  const dLon = (end[1] - start[1]) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
};

// Create rotated arrow icon
const createArrowIcon = (color, rotation) => {
  return L.divIcon({
    html: `<div style="transform: rotate(${rotation - 90}deg); width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="${color}" stroke="none">
        <polygon points="12,2 20,20 12,16 4,20"></polygon>
      </svg>
    </div>`,
    className: 'arrow-marker',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

// Map center adjuster
function MapController({ center, mapData }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, 12, { duration: 1 });
    }
  }, [center, map]);
  
  // Auto-fit bounds when data changes
  useEffect(() => {
    if (mapData?.routes?.length > 0 || mapData?.zones?.length > 0) {
      const bounds = [];
      mapData.routes?.forEach(route => {
        route.path_coordinates?.forEach(coord => bounds.push(coord));
      });
      mapData.zones?.forEach(zone => {
        if (zone.coordinates) bounds.push(zone.coordinates);
      });
      mapData.depots?.forEach(depot => {
        if (depot.coordinates) bounds.push(depot.coordinates);
      });
      
      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      }
    }
  }, [mapData, map]);
  
  return null;
}

// Direction arrows along route
function RouteArrows({ positions, color }) {
  const arrows = useMemo(() => {
    if (!positions || positions.length < 2) return [];
    
    const arrowPositions = [];
    // Add arrow every 3rd segment for visibility
    for (let i = 0; i < positions.length - 1; i += 3) {
      const midLat = (positions[i][0] + positions[i + 1][0]) / 2;
      const midLng = (positions[i][1] + positions[i + 1][1]) / 2;
      const bearing = calculateBearing(positions[i], positions[i + 1]);
      arrowPositions.push({ position: [midLat, midLng], bearing, color });
    }
    return arrowPositions;
  }, [positions, color]);

  return (
    <>
      {arrows.map((arrow, idx) => (
        <Marker
          key={`arrow-${idx}`}
          position={arrow.position}
          icon={createArrowIcon(arrow.color, arrow.bearing)}
          interactive={false}
        />
      ))}
    </>
  );
}

// Create ETA label icon
const createETALabelIcon = (eta, status) => {
  const bgColor = status === 'delayed' ? '#ff6b35' : status === 'completed' ? '#2ed573' : '#00d4ff';
  return L.divIcon({
    html: `<div class="eta-label" style="
      background: ${bgColor};
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.3);
    ">${eta}</div>`,
    className: 'eta-marker',
    iconSize: [60, 20],
    iconAnchor: [30, -5]
  });
};

export default function MapView() {
  const [mapData, setMapData] = useState(null);
  const [alternativeRoutes, setAlternativeRoutes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showDepots, setShowDepots] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);
  const [showArrows, setShowArrows] = useState(true);
  const { timestamp, refresh } = useSync();

  // Chennai center coordinates
  const defaultCenter = [13.0827, 80.2707];

  const fetchMapData = async () => {
    try {
      const data = await api.getMapRoutes();
      setMapData(data);
      
      // Fetch alternative routes for delayed vehicles
      const delayedRoutes = data.routes?.filter(r => r.status === 'delayed') || [];
      const altRoutes = {};
      
      for (const route of delayedRoutes) {
        try {
          // Try to get alternative route avoiding current path
          const altRoute = await api.calculateRoute(
            'Central_Depot',
            route.to_location?.replace(' Zone', '').replace('Zone_', 'Zone_') || 'Zone_East',
            route.path?.slice(1, -1).join(',') || ''
          );
          if (altRoute?.path_coordinates) {
            altRoutes[route.id] = altRoute;
          }
        } catch (e) {
          console.log('No alternative route available for', route.id);
        }
      }
      setAlternativeRoutes(altRoutes);
    } catch (error) {
      console.error('Failed to fetch map data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Unified polling: refetch on every SyncContext timestamp
  useEffect(() => {
    fetchMapData();
    // eslint-disable-next-line
  }, [timestamp]);

  const getRouteColor = (status, isAlternative = false) => {
    if (isAlternative) return '#9b59b6'; // Purple for alternative routes
    switch (status) {
      case 'on_time': return '#00d4ff';
      case 'delayed': return '#ff6b35';
      case 'completed': return '#2ed573';
      default: return '#00d4ff';
    }
  };

  const getVehicleIcon = (vehicleType, status) => {
    const type = vehicleType?.toLowerCase() || 'truck';
    const key = status === 'delayed' ? `${type}_delayed` : type;
    return vehicleIcons[key] || vehicleIcons.truck;
  };

  // Calculate vehicle position (simulated - at midpoint of route for demo)
  const getVehiclePosition = (route) => {
    if (!route.path_coordinates || route.path_coordinates.length < 2) return null;
    
    // For demo: place vehicle at ~40% along the route
    const idx = Math.floor(route.path_coordinates.length * 0.4);
    return route.path_coordinates[idx];
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
          <button className="refresh-btn" onClick={refresh} title="Refresh Now">
            <RefreshCw size={14} />
          </button>
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
        <label className="control-item">
          <input 
            type="checkbox" 
            checked={showVehicles} 
            onChange={(e) => setShowVehicles(e.target.checked)} 
          />
          <Truck size={16} />
          <span>Vehicles</span>
        </label>
        <label className="control-item">
          <input 
            type="checkbox" 
            checked={showArrows} 
            onChange={(e) => setShowArrows(e.target.checked)} 
          />
          <Navigation size={16} />
          <span>Direction</span>
        </label>
      </div>

      {/* Enhanced Map Legend */}
      <div className="map-legend">
        <h4>Legend</h4>
        <div className="legend-section">
          <span className="legend-title">Route Status</span>
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
          <div className="legend-item">
            <span className="legend-color dashed" style={{ background: '#9b59b6' }}></span>
            <span>Alternative</span>
          </div>
        </div>
        <div className="legend-section">
          <span className="legend-title">Markers</span>
          <div className="legend-item">
            <span className="legend-marker depot"></span>
            <span>Depot</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker zone"></span>
            <span>Affected Zone</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker vehicle"></span>
            <span>Vehicle</span>
          </div>
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
              <span className="capitalize">{selectedRoute.vehicle_type}</span>
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
              <span className={selectedRoute.status === 'on_time' ? 'text-green' : selectedRoute.status === 'delayed' ? 'text-orange' : 'text-cyan'}>
                {selectedRoute.status?.replace('_', ' ')}
              </span>
            </div>
            {selectedRoute.status === 'delayed' && (
              <>
                <div className="detail-row delay-reason">
                  <span>Delay Reason:</span>
                  <span className="text-orange">
                    {selectedRoute.delay_reason || 'Traffic congestion / Road blocked'}
                  </span>
                </div>
                {alternativeRoutes[selectedRoute.id] && (
                  <div className="alternative-info">
                    <AlertTriangle size={14} />
                    <span>Alternative route available (purple line)</span>
                  </div>
                )}
              </>
            )}
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
        
        <MapController center={defaultCenter} mapData={mapData} />

        {/* Depots */}
        {showDepots && mapData?.depots?.map((depot) => (
          <Marker
            key={depot.id}
            position={depot.coordinates}
            icon={depotIcon}
          >
            <Popup>
              <div className="popup-content">
                <h4>🏭 {depot.name}</h4>
                <p>Supply Depot</p>
                <p className="popup-status">Status: Active</p>
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
                  <h4>⚠️ {zone.name} Zone</h4>
                  <p>Affected Area</p>
                  <p className="popup-status">Needs Relief</p>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={zone.coordinates}
              radius={3000}
              pathOptions={{
                color: '#ff4757',
                fillColor: '#ff4757',
                fillOpacity: 0.15,
                weight: 2,
                dashArray: '5, 5'
              }}
            />
          </React.Fragment>
        ))}

        {/* Routes with direction arrows */}
        {showRoutes && mapData?.routes?.map((route) => (
          route.path_coordinates?.length > 1 && (
            <React.Fragment key={route.id}>
              {/* Main route polyline */}
              <Polyline
                positions={route.path_coordinates}
                pathOptions={{
                  color: getRouteColor(route.status),
                  weight: 5,
                  opacity: 0.9,
                  dashArray: route.status === 'delayed' ? '10, 10' : undefined
                }}
                eventHandlers={{
                  click: () => setSelectedRoute(route)
                }}
              />
              
              {/* Direction arrows */}
              {showArrows && (
                <RouteArrows 
                  positions={route.path_coordinates} 
                  color={getRouteColor(route.status)}
                />
              )}
              
              {/* Alternative route for delayed vehicles */}
              {route.status === 'delayed' && alternativeRoutes[route.id] && (
                <>
                  <Polyline
                    positions={alternativeRoutes[route.id].path_coordinates}
                    pathOptions={{
                      color: '#9b59b6',
                      weight: 4,
                      opacity: 0.7,
                      dashArray: '15, 10'
                    }}
                  />
                  {showArrows && (
                    <RouteArrows 
                      positions={alternativeRoutes[route.id].path_coordinates} 
                      color="#9b59b6"
                    />
                  )}
                </>
              )}
            </React.Fragment>
          )
        ))}

        {/* Vehicle markers with ETA labels */}
        {showVehicles && mapData?.routes?.map((route) => {
          const vehiclePos = getVehiclePosition(route);
          if (!vehiclePos) return null;
          
          return (
            <React.Fragment key={`vehicle-group-${route.id}`}>
              {/* Vehicle marker */}
              <Marker
                key={`vehicle-${route.id}`}
                position={vehiclePos}
                icon={getVehicleIcon(route.vehicle_type, route.status)}
              >
                <Popup>
                  <div className="popup-content">
                    <h4>🚚 {route.vehicle_id}</h4>
                    <p>Type: {route.vehicle_type}</p>
                    <p>To: {route.to_location}</p>
                    <p className={`popup-status ${route.status === 'delayed' ? 'delayed' : ''}`}>
                      Status: {route.status?.replace('_', ' ')}
                    </p>
                    <p>ETA: {route.eta}</p>
                    {route.status === 'completed' && (
                      <p className="popup-confirmed">✓ Arrived</p>
                    )}
                  </div>
                </Popup>
              </Marker>
              {/* ETA label above vehicle */}
              <Marker
                key={`eta-${route.id}`}
                position={vehiclePos}
                icon={createETALabelIcon(
                  route.status === 'completed' ? '✓ Arrived' : route.eta,
                  route.status
                )}
                interactive={false}
              />
            </React.Fragment>
          );
        })}
      </MapContainer>
    </motion.div>
  );
}
