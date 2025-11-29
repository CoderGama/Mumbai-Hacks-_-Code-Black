import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Activity, TrendingUp, TrendingDown, AlertTriangle,
  Package, Truck, Cloud, ThermometerSun, Droplets, Wind,
  RefreshCw, Calendar, Filter, Brain
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot
} from 'recharts';
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
  const { dashboardTimestamp } = useSync();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    fetchAnalytics();
  }, [dashboardTimestamp, timeRange]);

  const fetchAnalytics = async () => {
    try {
      const [statsData, decisions, zones, inventory] = await Promise.all([
        api.getDashboardStats(),
        api.getDecisions(),
        api.getZones(),
        api.getInventory()
      ]);

      // Calculate Resource Gap from inventory and decisions
      const calculateResourceGap = () => {
        // Get total available from inventory
        const totalInventory = inventory.reduce((acc, depot) => {
          const resources = depot.resources || {};
          return {
            medical_kits: (acc.medical_kits || 0) + (resources.medical_kits || 0),
            food_packets: (acc.food_packets || 0) + (resources.food_packets || 0),
            water_liters: (acc.water_liters || 0) + (resources.water_liters || 0),
            shelter_kits: (acc.shelter_kits || 0) + (resources.shelter_kits || 0),
            oxygen: (acc.oxygen || 0) + (resources.oxygen || 0),
          };
        }, {});

        // Calculate demand from active zones and decisions
        const totalPopulation = zones.reduce((sum, zone) => sum + (zone.population_affected || 0), 0);
        const activeDisasters = zones.length;
        
        // Demand calculation based on population and active disasters
        const medicalDemand = Math.max(1000, totalPopulation * 0.15 + activeDisasters * 500);
        const foodDemand = Math.max(5000, totalPopulation * 2);
        const waterDemand = Math.max(20000, totalPopulation * 5);
        const shelterDemand = Math.max(500, totalPopulation * 0.1);
        const oxygenDemand = Math.max(50, activeDisasters * 20);

        return [
          { 
            label: 'Medical Kits', 
            value: totalInventory.medical_kits || 0, 
            demand: Math.round(medicalDemand) 
          },
          { 
            label: 'Food Packets', 
            value: totalInventory.food_packets || 0, 
            demand: Math.round(foodDemand) 
          },
          { 
            label: 'Water (L)', 
            value: totalInventory.water_liters || 0, 
            demand: Math.round(waterDemand) 
          },
          { 
            label: 'Shelter Kits', 
            value: totalInventory.shelter_kits || 0, 
            demand: Math.round(shelterDemand) 
          },
          { 
            label: 'Oxygen', 
            value: totalInventory.oxygen || 0, 
            demand: Math.round(oxygenDemand) 
          },
        ];
      };

      // Calculate Hospital Load from decisions and zones
      const calculateHospitalLoad = () => {
        // Get hospital load from recent decisions
        const recentDecisions = decisions.slice(0, 6);
        const baseLoads = recentDecisions.map((d, idx) => {
          // Extract hospital load from decision or use default
          const load = d.estimated_coverage ? (100 - d.estimated_coverage) : 
                      (d.supply_gap > 0 ? 60 + (d.supply_gap / 100) : 50);
          return {
            hour: `${(idx * 4).toString().padStart(2, '0')}:00`,
            load: Math.min(100, Math.max(20, Math.round(load + (Math.random() * 10 - 5))))
          };
        });

        // If no decisions, generate based on zones
        if (baseLoads.length === 0) {
          const zoneLoad = zones.length > 0 ? 
            zones.reduce((sum, z) => sum + (z.supply_coverage?.medical || 50), 0) / zones.length : 50;
          return Array.from({ length: 6 }, (_, i) => ({
            hour: `${(i * 4).toString().padStart(2, '0')}:00`,
            load: Math.round(zoneLoad + (Math.random() * 15 - 7.5))
          }));
        }

        return baseLoads;
      };

      // Calculate Risk & Forecasting from zones and decisions
      const calculatePredictions = () => {
        // High-risk zones based on severity
        const highRiskZones = zones
          .filter(z => z.severity === 'critical' || z.severity === 'high')
          .map(z => z.name)
          .slice(0, 5);

        // Weather alerts from recent decisions
        const weatherAlerts = [];
        decisions.slice(0, 3).forEach(d => {
          if (d.weather_snapshot) {
            const weather = d.weather_snapshot;
            if (weather.rainfall_mm && weather.rainfall_mm > 200) {
              weatherAlerts.push({
                type: 'rain',
                severity: 'high',
                message: `Heavy rainfall: ${weather.rainfall_mm}mm expected`
              });
            }
            if (weather.wind_speed_kmph && weather.wind_speed_kmph > 100) {
              weatherAlerts.push({
                type: 'wind',
                severity: 'medium',
                message: `Strong winds: ${weather.wind_speed_kmph} km/h forecasted`
              });
            }
            if (weather.temperature_c && weather.temperature_c > 45) {
              weatherAlerts.push({
                type: 'heat',
                severity: 'high',
                message: `Extreme heat: ${weather.temperature_c}°C expected`
              });
            }
          }
        });

        // Predicted shortages from resource gap
        const resourceGap = calculateResourceGap();
        const shortages = resourceGap
          .filter(r => r.value < r.demand)
          .map(r => ({
            resource: r.label,
            eta: `${Math.round((r.demand - r.value) / (r.demand * 0.1))} hours`,
            deficit: r.demand - r.value
          }))
          .slice(0, 3);

        return {
          highRiskZones: highRiskZones.length > 0 ? highRiskZones : ['No high-risk zones currently'],
          weatherAlerts: weatherAlerts.length > 0 ? weatherAlerts : [
            { type: 'info', severity: 'low', message: 'No active weather alerts' }
          ],
          shortages: shortages.length > 0 ? shortages : [
            { resource: 'All resources', eta: 'N/A', deficit: 0 }
          ]
        };
      };

      // Generate activity data from decisions
      const generateActivityData = () => {
        const now = new Date();
        return Array.from({ length: 12 }, (_, i) => {
          const hour = new Date(now.getTime() - (11 - i) * 2 * 60 * 60 * 1000);
          const hourStr = hour.getHours().toString().padStart(2, '0') + ':00';
          
          // Count decisions in this time window
          const decisionsInWindow = decisions.filter(d => {
            const decisionTime = new Date(d.timestamp);
            const timeDiff = (now - decisionTime) / (1000 * 60 * 60); // hours
            return timeDiff >= (11 - i) * 2 && timeDiff < (12 - i) * 2;
          }).length;

          return {
            hour: hourStr,
            decisions: Math.max(0, decisionsInWindow),
            overrides: Math.floor(Math.random() * 2)
          };
        });
      };

      const resourceGap = calculateResourceGap();
      const hospitalStress = calculateHospitalLoad();
      const activityData = generateActivityData();
      const predictions = calculatePredictions();

      setStats({
        resourceGap,
        hospitalStress,
        activityData,
        predictions,
        totalDecisions: decisions.length,
        overrideRate: Math.round((decisions.filter(d => d.status === 'overridden').length / Math.max(decisions.length, 1)) * 100),
        avgConfidence: decisions.length > 0 ? 
          Math.round(decisions.reduce((sum, d) => sum + (d.estimated_coverage || 0), 0) / decisions.length) : 87,
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
          <div className="hospital-load-chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={stats?.hospitalStress || []}
                margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dim)" opacity={0.3} />
                <XAxis
                  dataKey="hour"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}
                  tickLine={{ stroke: 'var(--border-dim)' }}
                  axisLine={{ stroke: 'var(--border-dim)' }}
                  height={40}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  tickLine={{ stroke: 'var(--border-dim)' }}
                  axisLine={{ stroke: 'var(--border-dim)' }}
                  label={{ value: 'Load %', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    padding: '0.75rem'
                  }}
                  labelStyle={{ 
                    color: 'var(--text-primary)', 
                    fontWeight: 600,
                    marginBottom: '0.5rem'
                  }}
                  formatter={(value) => [`${value}%`, 'Load']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="load"
                  stroke="#00d4ff"
                  strokeWidth={3}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    let fillColor = '#2ecc71'; // green for <60%
                    if (payload.load >= 80) {
                      fillColor = '#ff4d6d'; // red for >=80%
                    } else if (payload.load >= 60) {
                      fillColor = '#ff8a4c'; // orange for 60-80%
                    }
                    return <Dot cx={cx} cy={cy} r={6} fill={fillColor} stroke="#fff" strokeWidth={2} />;
                  }}
                  activeDot={{ r: 8, fill: '#00d4ff' }}
                  label={(props) => {
                    const { x, y, value } = props;
                    return (
                      <text
                        x={x}
                        y={y - 10}
                        fill="white"
                        fontSize="12"
                        fontWeight="700"
                        textAnchor="middle"
                        style={{ textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}
                      >
                        {value}%
                      </text>
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
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

