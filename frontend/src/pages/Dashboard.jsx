import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Users, Route, Clock,
  Droplets, Package, Heart, Home,
  RefreshCw, TrendingUp, TrendingDown
} from 'lucide-react';
import { api } from '../services/api';
import ScenarioPanel from '../components/ScenarioPanel';
import ZoneCard from '../components/ZoneCard';
import RouteTable from '../components/RouteTable';
import ActivityFeed from '../components/ActivityFeed';
import InventoryPanel from '../components/InventoryPanel';
import './Dashboard.css';
import { useSync } from '../context/SyncContext';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [zones, setZones] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastDecision, setLastDecision] = useState(null);
  const { dashboardTimestamp, updateLastDecision, refreshDashboard } = useSync();

  const fetchData = async () => {
    try {
      const [statsData, zonesData, routesData, inventoryData, logsData] = await Promise.all([
        api.getDashboardStats(),
        api.getZones(),
        api.getRoutes(),
        api.getInventory(),
        api.getActivityLogs()
      ]);
      setStats(statsData);
      setZones(zonesData);
      setRoutes(routesData);
      setInventory(inventoryData);
      setActivityLogs(logsData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on every dashboardTimestamp change (controlled by SyncContext based on settings)
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [dashboardTimestamp]);

  const handleAgentResult = (result) => {
    setLastDecision(result.decision);
    // Update SyncContext with decision (for map route highlighting)
    if (updateLastDecision) {
      updateLastDecision(result.decision);
    }
    fetchData(); // Fetch immediately on new agent run
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <RefreshCw className="spin" size={32} />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="dashboard"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* KPI Cards */}
      <motion.section className="kpi-section" variants={itemVariants}>
        <div className="kpi-grid">
          <KPICard
            icon={AlertTriangle}
            label="Active Disasters"
            value={stats?.active_disasters || 0}
            trend="up"
            trendValue="+2 today"
            color="red"
          />
          <KPICard
            icon={Users}
            label="Affected Population"
            value={stats?.affected_population?.toLocaleString() || '0'}
            trend="up"
            trendValue="+15K"
            color="orange"
          />
          <KPICard
            icon={Route}
            label="Active Routes"
            value={stats?.active_routes || 0}
            trend="up"
            trendValue="3 new"
            color="cyan"
          />
          <KPICard
            icon={Clock}
            label="Avg Response Time"
            value={stats?.average_response_time || '-- min'}
            trend="down"
            trendValue="-12 min"
            color="green"
          />
        </div>
      </motion.section>

      <div className="dashboard-grid">
        {/* Left Column - Main Content */}
        <div className="dashboard-main">
          {/* Disaster Zones */}
          <motion.section className="section" variants={itemVariants}>
            <div className="section-header">
              <h2>Disaster Zones</h2>
              <span className="section-badge">{zones.length} active</span>
            </div>
            <div className="zones-grid">
              {zones.map((zone, index) => (
                <ZoneCard key={zone.id} zone={zone} delay={index * 0.1} />
              ))}
            </div>
          </motion.section>

          {/* Supply Routes */}
          <motion.section className="section" variants={itemVariants}>
            <div className="section-header">
              <h2>Supply Routes</h2>
              <span className="section-badge">{routes.length} active</span>
            </div>
            <div className="routes-scroll-container">
              <RouteTable routes={routes} />
            </div>
          </motion.section>

          {/* Inventory Overview */}
          <motion.section className="section" variants={itemVariants}>
            <div className="section-header">
              <h2>Inventory Overview</h2>
            </div>
            <InventoryPanel inventory={inventory} />
          </motion.section>
        </div>

        {/* Right Column - Scenario & Activity */}
        <div className="dashboard-sidebar">
          {/* Scenario Panel */}
          <motion.section className="section scenario-section" variants={itemVariants}>
            <ScenarioPanel onResult={handleAgentResult} lastDecision={lastDecision} />
          </motion.section>

          {/* Activity Feed */}
          <motion.section className="section" variants={itemVariants}>
            <div className="section-header">
              <h2>Activity Logs</h2>
            </div>
            <ActivityFeed logs={activityLogs} />
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
}

function KPICard({ icon: Icon, label, value, trend, trendValue, color }) {
  const colorClasses = {
    red: 'kpi-red',
    orange: 'kpi-orange',
    cyan: 'kpi-cyan',
    green: 'kpi-green'
  };

  return (
    <div className={`kpi-card ${colorClasses[color]}`}>
      <div className="kpi-icon">
        <Icon size={24} />
      </div>
      <div className="kpi-content">
        <span className="kpi-label">{label}</span>
        <span className="kpi-value">{value}</span>
        <div className={`kpi-trend ${trend}`}>
          {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{trendValue}</span>
        </div>
      </div>
    </div>
  );
}

