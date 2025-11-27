import React from 'react';
import { Warehouse, Package, Droplets, Heart, Home, Truck, Ship, Plane } from 'lucide-react';
import './InventoryPanel.css';

export default function InventoryPanel({ inventory }) {
  const resourceIcons = {
    medical_kits: Heart,
    food_packets: Package,
    water_liters: Droplets,
    shelter_kits: Home,
    oxygen_cylinders: Heart,
    vaccines: Heart,
    surgical_kits: Heart,
    trucks: Truck,
    boats: Ship,
    drones: Plane,
    helicopters: Plane
  };

  const formatValue = (key, value) => {
    if (key === 'water_liters') {
      return `${(value / 1000).toFixed(0)}K L`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  if (!inventory.length) {
    return (
      <div className="inventory-empty">
        <Warehouse size={32} />
        <p>No inventory data available</p>
      </div>
    );
  }

  return (
    <div className="inventory-grid">
      {inventory.map((depot) => (
        <div key={depot.id} className="depot-card">
          <div className="depot-header">
            <Warehouse size={20} />
            <div>
              <h4>{depot.depot_name}</h4>
              <span>{depot.location}</span>
            </div>
          </div>
          
          <div className="depot-resources">
            {Object.entries(depot.resources).slice(0, 6).map(([key, value]) => {
              const Icon = resourceIcons[key] || Package;
              const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              
              return (
                <div key={key} className="resource-item">
                  <Icon size={14} />
                  <span className="resource-label">{label}</span>
                  <span className="resource-value">{formatValue(key, value)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

