import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Send, ChevronDown, ChevronUp, AlertTriangle, 
  CheckCircle, Route, Package, Cloud, Brain
} from 'lucide-react';
import { api } from '../services/api';
import './ScenarioPanel.css';

const DISASTER_TYPES = [
  { value: 'flood', label: 'Flood' },
  { value: 'cyclone', label: 'Cyclone' },
  { value: 'earthquake', label: 'Earthquake' },
  { value: 'heatwave', label: 'Heatwave' },
];

const SEVERITY_LEVELS = [
  { value: 1, label: 'Low' },
  { value: 2, label: 'Moderate' },
  { value: 3, label: 'High' },
  { value: 4, label: 'Very High' },
  { value: 5, label: 'Critical' },
];

export default function ScenarioPanel({ onResult, lastDecision }) {
  const [presets, setPresets] = useState([]);
  const [isManualOpen, setIsManualOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('common');
  
  // Initialize form data with proper structure
  const [formData, setFormData] = useState({
    // Common fields
    city: 'Chennai',
    disaster_type: 'flood',
    severity_level: 3,
    severity_label: 'High',
    population_affected: 17850,
    zones_impacted: ['East', 'West'],
    hospital_load_pct: 71,
    blocked_roads: ['OMR'],
    available_resources: {
      medical_kits_available: 1500,
      boats_available: 3,
      drones_available: 2,
      trucks_available: 8,
    },
    disaster_specific: {
      flood: {
        water_level_m: 0.9,
        rainfall_mm_24h: 260,
        inland_or_coastal: 'coastal',
      },
    },
    notes: '',
  });

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      const data = await api.getScenarioPresets();
      setPresets(data);
    } catch (error) {
      console.error('Failed to fetch presets:', error);
    }
  };

  const handlePresetClick = async (preset) => {
    // Preset should already be in correct format
    setFormData(preset.config);
    await runScenario(preset.config);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('resource_')) {
      const resourceKey = name.replace('resource_', '');
      setFormData(prev => ({
        ...prev,
        available_resources: {
          ...prev.available_resources,
          [resourceKey]: parseInt(value) || 0,
        },
      }));
    } else if (name.startsWith('disaster_')) {
      const disasterKey = name.replace('disaster_', '');
      const disasterType = formData.disaster_type;
      setFormData(prev => ({
        ...prev,
        disaster_specific: {
          ...prev.disaster_specific,
          [disasterType]: {
            ...prev.disaster_specific?.[disasterType],
            [disasterKey]: type === 'number' ? parseFloat(value) : value,
          },
        },
      }));
    } else if (name === 'zones_impacted') {
      const zones = value.split(',').map(z => z.trim()).filter(z => z);
      setFormData(prev => ({ ...prev, zones_impacted: zones }));
    } else if (name === 'blocked_roads') {
      const roads = value.split(',').map(r => r.trim()).filter(r => r && r.toLowerCase() !== 'none');
      setFormData(prev => ({ ...prev, blocked_roads: roads }));
    } else if (name === 'severity_level') {
      const level = parseInt(value);
      const labels = { 1: 'Low', 2: 'Moderate', 3: 'High', 4: 'Very High', 5: 'Critical' };
      setFormData(prev => ({
        ...prev,
        severity_level: level,
        severity_label: labels[level] || 'Moderate',
      }));
    } else if (name === 'disaster_type') {
      // Reset disaster-specific when type changes
      setFormData(prev => ({
        ...prev,
        disaster_type: value,
        disaster_specific: {
          ...prev.disaster_specific,
          [value]: prev.disaster_specific?.[value] || getDefaultDisasterSpecific(value),
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const getDefaultDisasterSpecific = (type) => {
    switch (type) {
      case 'flood':
        return { water_level_m: 0.5, rainfall_mm_24h: 100, inland_or_coastal: 'inland' };
      case 'cyclone':
        return { max_wind_speed_kmph: 120, cyclone_translation_speed_kmph: 20, cyclone_direction: 'NE' };
      case 'earthquake':
        return { magnitude: 5.0, epicenter_distance_km: 50, building_collapse_ratio: 0.1 };
      case 'heatwave':
        return { max_temp_c: 45, humidity_pct: 30, duration_days: 3 };
      default:
        return {};
    }
  };

  const runScenario = async (data = formData) => {
    setIsLoading(true);
    try {
      // Ensure proper structure
      const payload = {
        city: data.city || 'Chennai',
        disaster_type: data.disaster_type,
        severity_level: parseInt(data.severity_level),
        severity_label: data.severity_label || SEVERITY_LEVELS.find(l => l.value === data.severity_level)?.label || 'Moderate',
        population_affected: parseInt(data.population_affected),
        zones_impacted: Array.isArray(data.zones_impacted) ? data.zones_impacted : [data.zones_impacted],
        hospital_load_pct: parseFloat(data.hospital_load_pct),
        blocked_roads: Array.isArray(data.blocked_roads) ? data.blocked_roads : [],
        available_resources: data.available_resources || {},
        disaster_specific: data.disaster_specific || {},
        notes: data.notes || '',
      };
      
      const result = await api.runAgent(payload);
      onResult?.(result);
    } catch (error) {
      console.error('Agent run failed:', error);
      alert('Failed to run scenario: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runScenario();
  };

  const renderDisasterSpecificInputs = () => {
    const type = formData.disaster_type;
    const specific = formData.disaster_specific?.[type] || {};

    switch (type) {
      case 'flood':
        return (
          <>
            <div className="form-group">
              <label>Water Level (meters)</label>
              <input
                type="number"
                name="disaster_water_level_m"
                className="input"
                value={specific.water_level_m || 0.5}
                onChange={handleChange}
                step="0.1"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Rainfall (mm, last 24h)</label>
              <input
                type="number"
                name="disaster_rainfall_mm_24h"
                className="input"
                value={specific.rainfall_mm_24h || 100}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Location Type</label>
              <select
                name="disaster_inland_or_coastal"
                className="select"
                value={specific.inland_or_coastal || 'inland'}
                onChange={handleChange}
              >
                <option value="inland">Inland</option>
                <option value="coastal">Coastal</option>
              </select>
            </div>
          </>
        );

      case 'cyclone':
        return (
          <>
            <div className="form-group">
              <label>Max Wind Speed (km/h)</label>
              <input
                type="number"
                name="disaster_max_wind_speed_kmph"
                className="input"
                value={specific.max_wind_speed_kmph || 120}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Translation Speed (km/h)</label>
              <input
                type="number"
                name="disaster_cyclone_translation_speed_kmph"
                className="input"
                value={specific.cyclone_translation_speed_kmph || 20}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Direction</label>
              <input
                type="text"
                name="disaster_cyclone_direction"
                className="input"
                value={specific.cyclone_direction || 'NE'}
                onChange={handleChange}
                placeholder="NE, SW, etc."
              />
            </div>
          </>
        );

      case 'earthquake':
        return (
          <>
            <div className="form-group">
              <label>Magnitude (Richter scale)</label>
              <input
                type="number"
                name="disaster_magnitude"
                className="input"
                value={specific.magnitude || 5.0}
                onChange={handleChange}
                step="0.1"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Epicenter Distance (km)</label>
              <input
                type="number"
                name="disaster_epicenter_distance_km"
                className="input"
                value={specific.epicenter_distance_km || 50}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Building Collapse Ratio (0-1)</label>
              <input
                type="number"
                name="disaster_building_collapse_ratio"
                className="input"
                value={specific.building_collapse_ratio || 0.1}
                onChange={handleChange}
                step="0.01"
                min="0"
                max="1"
              />
            </div>
          </>
        );

      case 'heatwave':
        return (
          <>
            <div className="form-group">
              <label>Max Temperature (°C)</label>
              <input
                type="number"
                name="disaster_max_temp_c"
                className="input"
                value={specific.max_temp_c || 45}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Humidity (%)</label>
              <input
                type="number"
                name="disaster_humidity_pct"
                className="input"
                value={specific.humidity_pct || 30}
                onChange={handleChange}
                min="0"
                max="100"
              />
            </div>
            <div className="form-group">
              <label>Duration (days)</label>
              <input
                type="number"
                name="disaster_duration_days"
                className="input"
                value={specific.duration_days || 3}
                onChange={handleChange}
                min="1"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="scenario-panel">
      <div className="scenario-header">
        <h3><Brain size={18} /> AI Scenario Request</h3>
      </div>

      {/* Presets */}
      {presets.length > 0 && (
        <div className="presets-section">
          <h4>Quick Presets</h4>
          <div className="preset-grid">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                className="preset-btn"
                onClick={() => handlePresetClick(preset)}
                disabled={isLoading}
              >
                <Zap size={14} />
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Manual Request Form */}
      <div className="manual-section">
        <button 
          className="section-toggle"
          onClick={() => setIsManualOpen(!isManualOpen)}
        >
          <h3>Manual Help Request</h3>
          {isManualOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        <AnimatePresence>
          {isManualOpen && (
            <motion.form 
              className="manual-form"
              onSubmit={handleSubmit}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              {/* Tab Navigation */}
              <div className="form-tabs">
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'common' ? 'active' : ''}`}
                  onClick={() => setActiveTab('common')}
                >
                  Common
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'disaster' ? 'active' : ''}`}
                  onClick={() => setActiveTab('disaster')}
                >
                  Disaster-Specific
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
                  onClick={() => setActiveTab('resources')}
                >
                  Resources
                </button>
              </div>

              {/* Common Tab */}
              {activeTab === 'common' && (
                <div className="tab-content">
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      className="input"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Chennai"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Disaster Type</label>
                      <select
                        name="disaster_type"
                        className="select"
                        value={formData.disaster_type}
                        onChange={handleChange}
                      >
                        {DISASTER_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Severity Level</label>
                      <select
                        name="severity_level"
                        className="select"
                        value={formData.severity_level}
                        onChange={handleChange}
                      >
                        {SEVERITY_LEVELS.map(level => (
                          <option key={level.value} value={level.value}>
                            {level.value} - {level.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Population Affected</label>
                    <input
                      type="number"
                      name="population_affected"
                      className="input"
                      value={formData.population_affected}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label>Zones Impacted (comma-separated)</label>
                    <input
                      type="text"
                      name="zones_impacted"
                      className="input"
                      value={formData.zones_impacted.join(', ')}
                      onChange={handleChange}
                      placeholder="East, West, North, South, Central"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Hospital Load (%)</label>
                      <input
                        type="number"
                        name="hospital_load_pct"
                        className="input"
                        value={formData.hospital_load_pct}
                        onChange={handleChange}
                        min="0"
                        max="100"
                      />
                    </div>

                    <div className="form-group">
                      <label>Blocked Roads (comma-separated)</label>
                      <input
                        type="text"
                        name="blocked_roads"
                        className="input"
                        value={formData.blocked_roads.join(', ')}
                        onChange={handleChange}
                        placeholder="OMR, Anna Salai or 'none'"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Notes</label>
                    <textarea
                      name="notes"
                      className="input"
                      value={formData.notes}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Additional information..."
                    />
                  </div>
                </div>
              )}

              {/* Disaster-Specific Tab */}
              {activeTab === 'disaster' && (
                <div className="tab-content">
                  <div className="disaster-type-badge">
                    <span>Current Type: <strong>{DISASTER_TYPES.find(t => t.value === formData.disaster_type)?.label}</strong></span>
                  </div>
                  {renderDisasterSpecificInputs()}
                </div>
              )}

              {/* Resources Tab */}
              {activeTab === 'resources' && (
                <div className="tab-content">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Medical Kits Available</label>
                      <input
                        type="number"
                        name="resource_medical_kits_available"
                        className="input"
                        value={formData.available_resources.medical_kits_available}
                        onChange={handleChange}
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Boats Available</label>
                      <input
                        type="number"
                        name="resource_boats_available"
                        className="input"
                        value={formData.available_resources.boats_available}
                        onChange={handleChange}
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Drones Available</label>
                      <input
                        type="number"
                        name="resource_drones_available"
                        className="input"
                        value={formData.available_resources.drones_available}
                        onChange={handleChange}
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Trucks Available</label>
                      <input
                        type="number"
                        name="resource_trucks_available"
                        className="input"
                        value={formData.available_resources.trucks_available}
                        onChange={handleChange}
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary w-full"
                disabled={isLoading}
              >
                <Brain size={18} />
                {isLoading ? 'Processing...' : 'Create Request'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Decision Result */}
      {lastDecision && (
        <motion.div 
          className="decision-result"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="result-header">
            <h3><Brain size={18} /> AI Decision</h3>
            <span className={`risk-badge risk-${lastDecision.risk_level?.toLowerCase()}`}>
              {lastDecision.risk_level}
            </span>
          </div>

          <p className="result-summary">{lastDecision.scenario_summary}</p>

          {/* Weather Snapshot */}
          {lastDecision.weather_snapshot && (
            <div className="weather-snapshot">
              <Cloud size={16} />
              <span>Weather:</span>
              {Object.entries(lastDecision.weather_snapshot).slice(0, 3).map(([key, value]) => (
                <span key={key} className="weather-item">
                  {key.replace(/_/g, ' ')}: {value}
                </span>
              ))}
            </div>
          )}

          {/* Similar Scenarios */}
          {lastDecision.similar_scenarios?.length > 0 && (
            <div className="similar-scenarios">
              <h4>Similar Historical Scenarios:</h4>
              {lastDecision.similar_scenarios.map((s, i) => (
                <div key={i} className="similar-item">
                  <span className="mono">{s.id}</span>
                  <span className="text-muted">(dist={s.distance?.toFixed(2)}, sev={s.severity})</span>
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="result-stats">
            <div className="stat-item">
              <span className="stat-label">Supply Gap</span>
              <span className={`stat-value ${lastDecision.supply_gap > 0 ? 'text-red' : 'text-green'}`}>
                {lastDecision.supply_gap} kits
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Est. Coverage</span>
              <span className="stat-value text-cyan">{lastDecision.estimated_coverage}%</span>
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="result-actions">
            <h4>Recommended Actions:</h4>
            <ol className="action-list">
              {lastDecision.recommended_actions?.slice(0, 5).map((action, i) => (
                <li key={i}>{action}</li>
              ))}
            </ol>
          </div>

          {/* Routes */}
          {lastDecision.selected_routes?.length > 0 && (
            <div className="result-routes">
              <h4><Route size={16} /> Primary Route:</h4>
              <div className="route-path">
                {lastDecision.selected_routes[0].path?.join(' → ')}
              </div>
              <div className="route-info">
                <span>ETA: ~{lastDecision.selected_routes[0].time_min?.toFixed(0)} minutes</span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
