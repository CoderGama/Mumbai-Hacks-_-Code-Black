import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon, User, Map, RefreshCw, Bell,
  Save, Check, RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

const DEFAULT_SETTINGS = {
  // Profile
  name: 'Admin User',
  email: 'admin@reliefroute.org',
  
  // Map Preferences
  defaultZoom: 12,
  showLabels: true,
  showTraffic: false,
  mapStyle: 'standard',
  
  // Auto-refresh
  dashboardRefresh: 45,
  mapRefresh: 30,
  notificationRefresh: 15,
  
  // Notifications
  emailAlerts: true,
  pushNotifications: true,
  alertSounds: false,
  criticalOnly: false,
};

export default function Settings() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState(() => {
    // Load from localStorage on initial render
    const stored = localStorage.getItem('reliefroute_settings');
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } catch {
        return { ...DEFAULT_SETTINGS, name: user?.name || DEFAULT_SETTINGS.name, email: user?.email || DEFAULT_SETTINGS.email };
      }
    }
    return { ...DEFAULT_SETTINGS, name: user?.name || DEFAULT_SETTINGS.name, email: user?.email || DEFAULT_SETTINGS.email };
  });

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    // Save to localStorage for persistence
    localStorage.setItem('reliefroute_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    const resetSettings = { 
      ...DEFAULT_SETTINGS, 
      name: user?.name || DEFAULT_SETTINGS.name, 
      email: user?.email || DEFAULT_SETTINGS.email 
    };
    setSettings(resetSettings);
    localStorage.setItem('reliefroute_settings', JSON.stringify(resetSettings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <motion.div
      className="settings-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="settings-header">
        <div className="header-left">
          <h1><SettingsIcon size={28} /> Settings</h1>
          <p>Manage your preferences and configurations</p>
        </div>
        <div className="header-actions">
          <button className="reset-btn" onClick={handleReset} title="Reset to defaults">
            <RotateCcw size={18} />
            <span>Reset</span>
          </button>
          <button className={`save-btn ${saved ? 'saved' : ''}`} onClick={handleSave}>
            {saved ? (
              <>
                <Check size={18} />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="settings-grid">
        {/* Profile Section */}
        <section className="settings-section">
          <h2><User size={20} /> Profile</h2>
          <div className="settings-group">
            <label>
              <span>Full Name</span>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </label>
            <div className="role-display">
              <span>Role</span>
              <div className="role-badge">Administrator</div>
            </div>
          </div>
        </section>

        {/* Map Preferences */}
        <section className="settings-section">
          <h2><Map size={20} /> Map Preferences</h2>
          <div className="settings-group">
            <label>
              <span>Default Zoom Level</span>
              <div className="range-input">
                <input
                  type="range"
                  min="8"
                  max="18"
                  value={settings.defaultZoom}
                  onChange={(e) => handleChange('defaultZoom', parseInt(e.target.value))}
                />
                <span className="range-value">{settings.defaultZoom}</span>
              </div>
            </label>
            <label>
              <span>Map Style</span>
              <select
                value={settings.mapStyle}
                onChange={(e) => handleChange('mapStyle', e.target.value)}
              >
                <option value="standard">Standard</option>
                <option value="satellite">Satellite</option>
                <option value="terrain">Terrain</option>
                <option value="dark">Dark Mode</option>
              </select>
            </label>
            <div className="toggle-row">
              <span>Show Labels</span>
              <button
                type="button"
                className={`toggle-btn ${settings.showLabels ? 'active' : ''}`}
                onClick={() => handleChange('showLabels', !settings.showLabels)}
              >
                <span className="toggle-slider" />
              </button>
            </div>
            <div className="toggle-row">
              <span>Show Traffic Layer</span>
              <button
                type="button"
                className={`toggle-btn ${settings.showTraffic ? 'active' : ''}`}
                onClick={() => handleChange('showTraffic', !settings.showTraffic)}
              >
                <span className="toggle-slider" />
              </button>
            </div>
          </div>
        </section>

        {/* Auto-Refresh Settings */}
        <section className="settings-section">
          <h2><RefreshCw size={20} /> Auto-Refresh Interval</h2>
          <div className="settings-group">
            <label>
              <span>Dashboard Refresh</span>
              <select
                value={settings.dashboardRefresh}
                onChange={(e) => handleChange('dashboardRefresh', parseInt(e.target.value))}
              >
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={45}>45 seconds</option>
                <option value={60}>1 minute</option>
                <option value={120}>2 minutes</option>
                <option value={0}>Manual only</option>
              </select>
            </label>
            <label>
              <span>Map Refresh</span>
              <select
                value={settings.mapRefresh}
                onChange={(e) => handleChange('mapRefresh', parseInt(e.target.value))}
              >
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={45}>45 seconds</option>
                <option value={60}>1 minute</option>
                <option value={0}>Manual only</option>
              </select>
            </label>
            <label>
              <span>Notification Check</span>
              <select
                value={settings.notificationRefresh}
                onChange={(e) => handleChange('notificationRefresh', parseInt(e.target.value))}
              >
                <option value={10}>10 seconds</option>
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
              </select>
            </label>
          </div>
        </section>

        {/* Notification Settings */}
        <section className="settings-section">
          <h2><Bell size={20} /> Notifications</h2>
          <div className="settings-group">
            <div className="toggle-row">
              <span>Email Alerts</span>
              <button
                type="button"
                className={`toggle-btn ${settings.emailAlerts ? 'active' : ''}`}
                onClick={() => handleChange('emailAlerts', !settings.emailAlerts)}
              >
                <span className="toggle-slider" />
              </button>
            </div>
            <div className="toggle-row">
              <span>Push Notifications</span>
              <button
                type="button"
                className={`toggle-btn ${settings.pushNotifications ? 'active' : ''}`}
                onClick={() => handleChange('pushNotifications', !settings.pushNotifications)}
              >
                <span className="toggle-slider" />
              </button>
            </div>
            <div className="toggle-row">
              <span>Alert Sounds</span>
              <button
                type="button"
                className={`toggle-btn ${settings.alertSounds ? 'active' : ''}`}
                onClick={() => handleChange('alertSounds', !settings.alertSounds)}
              >
                <span className="toggle-slider" />
              </button>
            </div>
            <div className="toggle-row">
              <span>Critical Alerts Only</span>
              <button
                type="button"
                className={`toggle-btn ${settings.criticalOnly ? 'active' : ''}`}
                onClick={() => handleChange('criticalOnly', !settings.criticalOnly)}
              >
                <span className="toggle-slider" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
