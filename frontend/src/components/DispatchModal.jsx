import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Truck, Ship, Plane, Send } from 'lucide-react';
import { api } from '../services/api';
import './Modal.css';

export default function DispatchModal({ onClose }) {
  const [formData, setFormData] = useState({
    vehicle_type: 'truck',
    destination_zone: 'East',
    cargo_description: '',
    supply_items: {
      medical_kits: 0,
      food_packets: 0,
      water_liters: 0
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const vehicleTypes = [
    { value: 'truck', label: 'Truck', icon: Truck, desc: 'Ground logistics' },
    { value: 'boat', label: 'Boat', icon: Ship, desc: 'Water routes' },
    { value: 'drone', label: 'Drone', icon: Plane, desc: 'Aerial delivery' },
  ];

  const zones = ['North', 'South', 'East', 'West', 'Central'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSupplyChange = (item, value) => {
    setFormData(prev => ({
      ...prev,
      supply_items: {
        ...prev.supply_items,
        [item]: parseInt(value) || 0
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await api.dispatchVehicle(formData);
      setResult(result);
    } catch (error) {
      console.error('Dispatch failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div 
          className="modal"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          <div className="modal-header">
            <h2>Dispatch Vehicle</h2>
            <button className="modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {!result ? (
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Vehicle Type</label>
                <div className="vehicle-options">
                  {vehicleTypes.map((vehicle) => (
                    <label 
                      key={vehicle.value}
                      className={`vehicle-option ${formData.vehicle_type === vehicle.value ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="vehicle_type"
                        value={vehicle.value}
                        checked={formData.vehicle_type === vehicle.value}
                        onChange={handleChange}
                      />
                      <vehicle.icon size={24} />
                      <span className="vehicle-label">{vehicle.label}</span>
                      <span className="vehicle-desc">{vehicle.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="destination_zone">Destination Zone</label>
                <select
                  id="destination_zone"
                  name="destination_zone"
                  className="select"
                  value={formData.destination_zone}
                  onChange={handleChange}
                >
                  {zones.map(zone => (
                    <option key={zone} value={zone}>{zone} Zone</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Cargo Contents</label>
                <div className="cargo-inputs">
                  <div className="cargo-input">
                    <span>Medical Kits</span>
                    <input
                      type="number"
                      className="input"
                      min="0"
                      value={formData.supply_items.medical_kits}
                      onChange={(e) => handleSupplyChange('medical_kits', e.target.value)}
                    />
                  </div>
                  <div className="cargo-input">
                    <span>Food Packets</span>
                    <input
                      type="number"
                      className="input"
                      min="0"
                      value={formData.supply_items.food_packets}
                      onChange={(e) => handleSupplyChange('food_packets', e.target.value)}
                    />
                  </div>
                  <div className="cargo-input">
                    <span>Water (Liters)</span>
                    <input
                      type="number"
                      className="input"
                      min="0"
                      value={formData.supply_items.water_liters}
                      onChange={(e) => handleSupplyChange('water_liters', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="cargo_description">Additional Notes</label>
                <textarea
                  id="cargo_description"
                  name="cargo_description"
                  className="input"
                  rows={3}
                  placeholder="Special instructions or cargo details..."
                  value={formData.cargo_description}
                  onChange={handleChange}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  <Send size={18} />
                  {isLoading ? 'Dispatching...' : 'Dispatch Vehicle'}
                </button>
              </div>
            </form>
          ) : (
            <div className="modal-body dispatch-result">
              <div className="result-success">
                <div className="result-icon">✓</div>
                <h3>Vehicle Dispatched!</h3>
                <p className="result-vehicle">{result.vehicle_id}</p>
              </div>
              
              <div className="result-details">
                <div className="result-row">
                  <span>Route</span>
                  <span className="mono">{result.route?.path?.join(' → ')}</span>
                </div>
                <div className="result-row">
                  <span>Distance</span>
                  <span>{result.route?.total_distance_km} km</span>
                </div>
                <div className="result-row">
                  <span>ETA</span>
                  <span className="text-cyan">{result.eta}</span>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-primary w-full" onClick={onClose}>
                  Done
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

