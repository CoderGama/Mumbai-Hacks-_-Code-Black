import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Send, ChevronDown, ChevronUp, AlertTriangle, 
  CheckCircle, Route, Package, Cloud, Brain
} from 'lucide-react';
import { api } from '../services/api';
import './ScenarioPanel.css';

export default function ScenarioPanel({ onResult, lastDecision }) {
  const [presets, setPresets] = useState([]);
  const [isManualOpen, setIsManualOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    disaster_type: 'flood',
    severity: 3,
    population_affected: 17850,
    zones_affected: ['East', 'West'],
    hospital_load: 71,
    blocked_roads: ['OMR']
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
    setFormData(preset.config);
    await runScenario(preset.config);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'zones_affected') {
      const zones = value.split(',').map(z => z.trim()).filter(z => z);
      setFormData(prev => ({ ...prev, zones_affected: zones }));
    } else if (name === 'blocked_roads') {
      const roads = value.split(',').map(r => r.trim()).filter(r => r && r.toLowerCase() !== 'none');
      setFormData(prev => ({ ...prev, blocked_roads: roads }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const runScenario = async (data = formData) => {
    setIsLoading(true);
    try {
      const result = await api.runAgent({
        ...data,
        severity: parseInt(data.severity),
        population_affected: parseInt(data.population_affected),
        hospital_load: parseFloat(data.hospital_load)
      });
      onResult?.(result);
    } catch (error) {
      console.error('Agent run failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runScenario();
  };

  const disasterTypes = [
    { value: 'flood', label: 'Flood' },
    { value: 'cyclone', label: 'Cyclone' },
    { value: 'earthquake', label: 'Earthquake' },
    { value: 'heatwave', label: 'Heatwave' },
    { value: 'hurricane', label: 'Hurricane' },
    { value: 'landslide', label: 'Landslide' },
    { value: 'wildfire', label: 'Wildfire' },
    { value: 'medical_emergency', label: 'Medical Emergency' }
  ];

  const severityLevels = [
    { value: 1, label: 'Low', color: 'green' },
    { value: 2, label: 'Moderate', color: 'yellow' },
    { value: 3, label: 'High', color: 'orange' },
    { value: 4, label: 'Critical', color: 'red' },
    { value: 5, label: 'Catastrophic', color: 'red' }
  ];

  return (
    <div className="scenario-panel">
      {/* Quick Presets */}
      <div className="presets-section">
        <h3><Zap size={18} /> Quick Scenarios</h3>
        <div className="preset-chips">
          {presets.map((preset) => (
            <button
              key={preset.id}
              className="preset-chip"
              onClick={() => handlePresetClick(preset)}
              disabled={isLoading}
            >
              <span className="preset-icon">{preset.icon}</span>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

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
              <div className="form-row">
                <div className="form-group">
                  <label>Disaster Type</label>
                  <select
                    name="disaster_type"
                    className="select"
                    value={formData.disaster_type}
                    onChange={handleChange}
                  >
                    {disasterTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Severity (1-5)</label>
                  <select
                    name="severity"
                    className="select"
                    value={formData.severity}
                    onChange={handleChange}
                  >
                    {severityLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.value} - {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Affected Population</label>
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
                <label>Impacted Zones (comma-separated)</label>
                <input
                  type="text"
                  name="zones_affected"
                  className="input"
                  value={formData.zones_affected.join(', ')}
                  onChange={handleChange}
                  placeholder="North, South, East, West, Central"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Hospital Load (%)</label>
                  <input
                    type="number"
                    name="hospital_load"
                    className="input"
                    value={formData.hospital_load}
                    onChange={handleChange}
                    min="0"
                    max="100"
                  />
                </div>

                <div className="form-group">
                  <label>Blocked Roads</label>
                  <input
                    type="text"
                    name="blocked_roads"
                    className="input"
                    value={formData.blocked_roads.join(', ')}
                    onChange={handleChange}
                    placeholder="OMR, Anna_Salai or 'none'"
                  />
                </div>
              </div>

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
            <span className={`risk-badge risk-${lastDecision.risk_level.toLowerCase()}`}>
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
                  <span className="text-muted">(dist={s.distance}, sev={s.severity})</span>
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
              {lastDecision.recommended_actions.slice(0, 5).map((action, i) => (
                <li key={i}>{action}</li>
              ))}
            </ol>
          </div>

          {/* Routes */}
          {lastDecision.selected_routes?.length > 0 && (
            <div className="result-routes">
              <h4><Route size={16} /> Primary Route:</h4>
              <div className="route-path">
                {lastDecision.selected_routes[0].path.join(' → ')}
              </div>
              <div className="route-info">
                <span>ETA: ~{lastDecision.selected_routes[0].time_min} minutes</span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

