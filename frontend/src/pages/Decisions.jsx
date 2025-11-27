import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, CheckCircle, XCircle, Edit3, Clock, 
  AlertTriangle, Route, Package, RefreshCw,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { api } from '../services/api';
import './Decisions.css';

export default function Decisions() {
  const [decisions, setDecisions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchDecisions();
    const interval = setInterval(fetchDecisions, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchDecisions = async () => {
    try {
      const data = await api.getDecisions();
      setDecisions(data);
    } catch (error) {
      console.error('Failed to fetch decisions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (decisionId, action) => {
    setActionLoading(decisionId);
    try {
      await api.decisionAction(decisionId, action);
      await fetchDecisions();
    } catch (error) {
      console.error(`Failed to ${action} decision:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'approved':
        return { icon: CheckCircle, color: 'status-approved', label: 'Approved' };
      case 'aborted':
        return { icon: XCircle, color: 'status-aborted', label: 'Aborted' };
      case 'modified':
        return { icon: Edit3, color: 'status-modified', label: 'Modified' };
      default:
        return { icon: Clock, color: 'status-pending', label: 'Pending' };
    }
  };

  const getRiskConfig = (risk) => {
    switch (risk.toLowerCase()) {
      case 'critical':
        return { class: 'risk-critical', icon: '🔴' };
      case 'high':
        return { class: 'risk-high', icon: '🟠' };
      case 'moderate':
        return { class: 'risk-moderate', icon: '🟡' };
      default:
        return { class: 'risk-low', icon: '🟢' };
    }
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <div className="decisions-loading">
        <RefreshCw className="spin" size={32} />
        <p>Loading decisions...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="decisions-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="decisions-header">
        <div>
          <h1>AI Decisions</h1>
          <p>Review and manage autonomous agent decisions</p>
        </div>
        <button className="btn btn-ghost" onClick={fetchDecisions}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {decisions.length === 0 ? (
        <div className="empty-state">
          <Brain size={48} />
          <h3>No Decisions Yet</h3>
          <p>Run a scenario from the Dashboard to generate AI decisions</p>
        </div>
      ) : (
        <div className="decisions-list">
          {decisions.map((decision, index) => {
            const statusConfig = getStatusConfig(decision.status);
            const riskConfig = getRiskConfig(decision.risk_level);
            const StatusIcon = statusConfig.icon;
            const isExpanded = expandedId === decision.id;

            return (
              <motion.div 
                key={decision.id}
                className={`decision-card ${statusConfig.color}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="decision-main">
                  <div className="decision-info">
                    <div className="decision-header">
                      <span className="decision-id">#{decision.id}</span>
                      <span className={`risk-indicator ${riskConfig.class}`}>
                        {riskConfig.icon} {decision.risk_level}
                      </span>
                      <span className="decision-time">
                        <Clock size={14} />
                        {formatTime(decision.timestamp)}
                      </span>
                    </div>
                    
                    <p className="decision-summary">{decision.scenario_summary}</p>
                    
                    <div className="decision-meta">
                      <span className="meta-item">
                        <Route size={14} />
                        {decision.selected_routes?.length || 0} routes
                      </span>
                      <span className="meta-item">
                        <Package size={14} />
                        {decision.resources_dispatched?.length || 0} resources
                      </span>
                      <span className="meta-item coverage">
                        Coverage: {decision.estimated_coverage}%
                      </span>
                    </div>
                  </div>

                  <div className="decision-actions">
                    <div className={`status-badge ${statusConfig.color}`}>
                      <StatusIcon size={16} />
                      {statusConfig.label}
                    </div>

                    {decision.status === 'pending' && (
                      <div className="action-buttons">
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => handleAction(decision.id, 'approve')}
                          disabled={actionLoading === decision.id}
                        >
                          <CheckCircle size={16} />
                          Approve
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleAction(decision.id, 'abort')}
                          disabled={actionLoading === decision.id}
                        >
                          <XCircle size={16} />
                          Abort
                        </button>
                      </div>
                    )}

                    <button 
                      className="expand-btn"
                      onClick={() => setExpandedId(isExpanded ? null : decision.id)}
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <motion.div 
                    className="decision-details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                  >
                    {/* Weather Snapshot */}
                    {decision.weather_snapshot && (
                      <div className="detail-section">
                        <h4>Weather Snapshot</h4>
                        <div className="weather-grid">
                          {Object.entries(decision.weather_snapshot).map(([key, value]) => (
                            <div key={key} className="weather-item">
                              <span className="weather-label">{key.replace(/_/g, ' ')}</span>
                              <span className="weather-value">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Similar Scenarios */}
                    {decision.similar_scenarios?.length > 0 && (
                      <div className="detail-section">
                        <h4>Similar Historical Scenarios</h4>
                        <div className="scenarios-list">
                          {decision.similar_scenarios.map((s, i) => (
                            <div key={i} className="scenario-item">
                              <span className="scenario-id">{s.id}</span>
                              <span className="scenario-meta">
                                Distance: {s.distance} | Severity: {s.severity} | Load: {s.hospital_load}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommended Actions */}
                    <div className="detail-section">
                      <h4>Recommended Actions</h4>
                      <ol className="actions-list">
                        {decision.recommended_actions.map((action, i) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ol>
                    </div>

                    {/* Routes */}
                    {decision.selected_routes?.length > 0 && (
                      <div className="detail-section">
                        <h4>Selected Routes</h4>
                        <div className="routes-list">
                          {decision.selected_routes.map((route, i) => (
                            <div key={i} className="route-item">
                              <div className="route-header">
                                <span className="route-zone">{route.zone} Zone</span>
                                <span className="route-time">{route.time_min} min • {route.distance_km} km</span>
                              </div>
                              <div className="route-path">
                                {route.path.join(' → ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resources */}
                    {decision.resources_dispatched?.length > 0 && (
                      <div className="detail-section">
                        <h4>Resources Dispatched</h4>
                        <div className="resources-grid">
                          {decision.resources_dispatched.map((resource, i) => (
                            <div key={i} className="resource-item">
                              <span className="resource-type">{resource.type.replace(/_/g, ' ')}</span>
                              <span className="resource-qty">{resource.quantity.toLocaleString()}</span>
                              <span className={`resource-status status-${resource.status}`}>
                                {resource.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

