import React from 'react';
import { AlertTriangle, Brain, Truck, Shield, Settings, CheckCircle } from 'lucide-react';
import './ActivityFeed.css';

export default function ActivityFeed({ logs }) {
  const eventConfig = {
    alert: { icon: AlertTriangle, color: 'event-red' },
    decision: { icon: Brain, color: 'event-cyan' },
    dispatch: { icon: Truck, color: 'event-green' },
    override: { icon: Shield, color: 'event-orange' },
    system: { icon: Settings, color: 'event-gray' },
    scenario: { icon: CheckCircle, color: 'event-purple' },
    auth: { icon: Shield, color: 'event-green' }
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!logs.length) {
    return (
      <div className="activity-empty">
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div className="activity-feed">
      {logs.map((log, index) => {
        const config = eventConfig[log.event_type] || eventConfig.system;
        const Icon = config.icon;

        return (
          <div key={log.id} className="activity-item">
            <div className={`activity-icon ${config.color}`}>
              <Icon size={16} />
            </div>
            <div className="activity-content">
              <p className="activity-message">{log.description}</p>
              <span className="activity-time">{formatTime(log.timestamp)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

