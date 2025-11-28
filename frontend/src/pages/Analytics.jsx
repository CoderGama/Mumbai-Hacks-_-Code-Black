import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Activity, TrendingUp, TrendingDown, AlertTriangle,
  Package, Truck, Cloud, ThermometerSun, Droplets, Wind,
  RefreshCw, Calendar, Filter, Brain
} from 'lucide-react';
import { api } from '../services/api';
import { useSync } from '../context/SyncContext';
import './Analytics.css';

// Simple bar chart component
function BarChart({ data, maxValue, color = '#00d4ff' }) {
  return (
    <div className="bar-chart">
      {data.map((item, idx) => (
        <div key={idx} className="bar-item">
          <div className="bar-label">{item.label}</div>
          <div className="bar-container">
            <div 
              className="bar-fill"
              style={{ 
                width: `${(item.value / maxValue) * 100}%`,
                background: color
              }}
            />
            <span className="bar-value">{item.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Donut chart component
function DonutChart({ value, total, color = '#00d4ff', label }) {
  const percentage = Math.round((value / total) * 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="donut-chart">
      <svg viewBox="0 0 100 100" className="donut-svg">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="var(--bg-tertiary)"
          strokeWidth="10"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="donut-center">
        <span className="donut-value">{percentage}%</span>
        <span className="donut-label">{label}</span>
      </div>
    </div>
  );
}

// Timeline chart for activity
function ActivityTimeline({ data }) {
  const maxValue = Math.max(...data.map(d => d.decisions + d.overrides));
  
  return (
    <div className="activity-timeline">
      {data.map((item, idx) => (
        <div key={idx} className="timeline-item">
          <div className="timeline-bar-group">
            <div 
              className="timeline-bar decisions"
              style={{ height: `${(item.decisions / maxValue) * 100}%` }}
              title={`Decisions: ${item.decisions}`}
            />
            <div 
              className="timeline-bar overrides"
              style={{ height: `${(item.overrides / maxValue) * 100}%` }}
              title={`Overrides: ${item.overrides}`}
            />
          </div>
          <span className="timeline-label">{item.hour}</span>
        </div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const { lastSync } = useSync();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    fetchAnalytics();
  }, [lastSync, timeRange]);

  const fetchAnalytics = async () => {
    try {
      const [statsData, decisions] = await Promise.all([
        api.getDashboardStats(),
        api.getDecisions()
      ]);

      // Generate analytics data
      const resourceGap = [
        { label: 'Medical Kits', value: 2500, demand: 3200 },
        { label: 'Food Packets', value: 15000, demand: 18000 },
        { label: 'Water (L)', value: 45000, demand: 50000 },
        { label: 'Shelter Kits', value: 800, demand: 1200 },
        { label: 'Oxygen', value: 150, demand: 200 },
      ];

      const hospitalStress = [
        { hour: '00:00', load: 65 },
        { hour: '04:00', load: 58 },
        { hour: '08:00', load: 72 },
        { hour: '12:00', load: 85 },
        { hour: '16:00', load: 78 },
        { hour: '20:00', load: 70 },
      ];

      const activityData = Array.from({ length: 12 }, (_, i) => ({
        hour: `${(i * 2).toString().padStart(2, '0')}:00`,
        decisions: Math.floor(Math.random() * 10) + 2,
        overrides: Math.floor(Math.random() * 3),
      }));

      const predictions = {
        highRiskZones: ['East Zone', 'South Zone'],
        weatherAlerts: [
          { type: 'rain', severity: 'high', message: 'Heavy rainfall expected in 24hrs' },
          { type: 'wind', severity: 'medium', message: 'Strong winds forecasted' },
        ],
        shortages: [
          { resource: 'Medical Kits', eta: '18 hours', deficit: 700 },
          { resource: 'Shelter Kits', eta: '36 hours', deficit: 400 },
        ],
      };

      setStats({
        resourceGap,
        hospitalStress,
        activityData,
        predictions,
        totalDecisions: decisions.length,
        overrideRate: Math.round((decisions.filter(d => d.status === 'overridden').length / Math.max(decisions.length, 1)) * 100),
        avgConfidence: 87,
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="analytics-loading">
        <RefreshCw className="spinner" size={32} />
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="analytics-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="analytics-header">
        <div className="header-left">
          <h1><BarChart3 size={28} /> Analytics Dashboard</h1>
          <p>Real-time insights and predictive analytics</p>
        </div>
        <div className="header-right">
          <div className="time-range-selector">
            {['6h', '24h', '7d', '30d'].map(range => (
              <button
                key={range}
                className={`range-btn ${timeRange === range ? 'active' : ''}`}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resource Gap Analysis */}
      <section className="analytics-section">
        <h2><Package size={20} /> Resource Gap Analysis</h2>
        <div className="resource-gap-grid">
          {stats?.resourceGap.map((item, idx) => (
            <div key={idx} className="resource-gap-card">
              <div className="gap-header">
                <span className="gap-label">{item.label}</span>
                <span className={`gap-status ${item.value >= item.demand ? 'sufficient' : 'deficit'}`}>
                  {item.value >= item.demand ? 'Sufficient' : 'Deficit'}
                </span>
              </div>
              <div className="gap-bars">
                <div className="gap-bar-group">
                  <span>Available</span>
                  <div className="gap-bar">
                    <div 
                      className="gap-bar-fill available"
                      style={{ width: `${(item.value / item.demand) * 100}%` }}
                    />
                  </div>
                  <span>{item.value.toLocaleString()}</span>
                </div>
                <div className="gap-bar-group">
                  <span>Demand</span>
                  <div className="gap-bar">
                    <div className="gap-bar-fill demand" style={{ width: '100%' }} />
                  </div>
                  <span>{item.demand.toLocaleString()}</span>
                </div>
              </div>
              {item.value < item.demand && (
                <div className="gap-deficit">
                  <AlertTriangle size={14} />
                  <span>Deficit: {(item.demand - item.value).toLocaleString()}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Hospital Stress & AI Activity */}
      <div className="analytics-row">
        <section className="analytics-section">
          <h2><Activity size={20} /> Hospital Load (Hourly)</h2>
          <div className="stress-chart">
            {stats?.hospitalStress.map((item, idx) => (
              <div key={idx} className="stress-bar-container">
                <div 
                  className="stress-bar"
                  style={{ 
                    height: `${item.load}%`,
                    background: item.load > 80 ? 'var(--accent-red)' : 
                               item.load > 60 ? 'var(--accent-orange)' : 'var(--accent-green)'
                  }}
                >
                  <span className="stress-value">{item.load}%</span>
                </div>
                <span className="stress-label">{item.hour}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="analytics-section">
          <h2><Brain size={20} /> AI Decision Activity</h2>
          <div className="activity-stats">
            <div className="activity-stat">
              <DonutChart 
                value={stats?.totalDecisions || 0} 
                total={50} 
                color="#00d4ff"
                label="Decisions"
              />
              <span>Total Decisions</span>
            </div>
            <div className="activity-stat">
              <DonutChart 
                value={100 - (stats?.overrideRate || 0)} 
                total={100} 
                color="#2ed573"
                label="Approved"
              />
              <span>Approval Rate</span>
            </div>
            <div className="activity-stat">
              <DonutChart 
                value={stats?.avgConfidence || 0} 
                total={100} 
                color="#9b59b6"
                label="Conf."
              />
              <span>Avg Confidence</span>
            </div>
          </div>
          <div className="activity-timeline-container">
            <ActivityTimeline data={stats?.activityData || []} />
            <div className="timeline-legend">
              <span><i className="legend-dot decisions" /> Decisions</span>
              <span><i className="legend-dot overrides" /> Overrides</span>
            </div>
          </div>
        </section>
      </div>

      {/* Risk & Forecasting */}
      <section className="analytics-section predictions-section">
        <h2><TrendingUp size={20} /> Risk & Forecasting</h2>
        <div className="predictions-grid">
          <div className="prediction-card high-risk">
            <h3><AlertTriangle size={18} /> High-Risk Zones</h3>
            <ul>
              {stats?.predictions.highRiskZones.map((zone, idx) => (
                <li key={idx}>
                  <span className="risk-indicator critical" />
                  {zone}
                </li>
              ))}
            </ul>
          </div>

          <div className="prediction-card weather">
            <h3><Cloud size={18} /> Weather Alerts</h3>
            <ul>
              {stats?.predictions.weatherAlerts.map((alert, idx) => (
                <li key={idx} className={alert.severity}>
                  {alert.type === 'rain' && <Droplets size={14} />}
                  {alert.type === 'wind' && <Wind size={14} />}
                  {alert.type === 'heat' && <ThermometerSun size={14} />}
                  <span>{alert.message}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="prediction-card shortages">
            <h3><Package size={18} /> Predicted Shortages</h3>
            <ul>
              {stats?.predictions.shortages.map((shortage, idx) => (
                <li key={idx}>
                  <div className="shortage-info">
                    <span className="shortage-name">{shortage.resource}</span>
                    <span className="shortage-eta">in {shortage.eta}</span>
                  </div>
                  <span className="shortage-deficit">-{shortage.deficit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

