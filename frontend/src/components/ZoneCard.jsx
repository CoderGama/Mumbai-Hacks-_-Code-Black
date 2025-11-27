import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Clock, Droplets, Package, Heart, Home } from 'lucide-react';
import './ZoneCard.css';

export default function ZoneCard({ zone, delay = 0 }) {
  const severityColors = {
    critical: 'badge-critical',
    high: 'badge-high',
    moderate: 'badge-moderate',
    low: 'badge-low'
  };

  const disasterIcons = {
    flood: '🌊',
    cyclone: '🌀',
    earthquake: '🔴',
    heatwave: '🔥',
    hurricane: '🌪️',
    landslide: '⛰️',
    wildfire: '🔥',
    medical_emergency: '🏥'
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  const supplies = [
    { key: 'food', label: 'Food', icon: Package, value: zone.supply_coverage?.food || 0 },
    { key: 'water', label: 'Water', icon: Droplets, value: zone.supply_coverage?.water || 0 },
    { key: 'medical', label: 'Medical', icon: Heart, value: zone.supply_coverage?.medical || 0 },
    { key: 'shelter', label: 'Shelter', icon: Home, value: zone.supply_coverage?.shelter || 0 }
  ];

  const getProgressColor = (value) => {
    if (value >= 70) return 'progress-bar-green';
    if (value >= 40) return 'progress-bar-orange';
    return 'progress-bar-red';
  };

  return (
    <motion.div 
      className="zone-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div className="zone-header">
        <div className="zone-title">
          <span className="zone-icon">{disasterIcons[zone.disaster_type] || '⚠️'}</span>
          <div>
            <h3>{zone.name}</h3>
            <span className="zone-type">{zone.disaster_type}</span>
          </div>
        </div>
        <span className={`badge ${severityColors[zone.severity]}`}>
          {zone.severity}
        </span>
      </div>

      <div className="zone-stats">
        <div className="zone-stat">
          <Users size={16} />
          <span>{zone.population_affected?.toLocaleString()}</span>
          <span className="stat-label">affected</span>
        </div>
        <div className="zone-stat">
          <Clock size={16} />
          <span>{formatTime(zone.updated_at)}</span>
        </div>
      </div>

      <div className="zone-supplies">
        <h4>Supply Coverage</h4>
        <div className="supply-bars">
          {supplies.map((supply) => (
            <div key={supply.key} className="supply-row">
              <div className="supply-label">
                <supply.icon size={14} />
                <span>{supply.label}</span>
              </div>
              <div className="supply-progress">
                <div className="progress">
                  <div 
                    className={`progress-bar ${getProgressColor(supply.value)}`}
                    style={{ width: `${supply.value}%` }}
                  />
                </div>
                <span className="supply-value">{supply.value}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

