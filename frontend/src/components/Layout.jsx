import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Compass,
  LayoutDashboard,
  Map,
  Brain,
  Search,
  Bell,
  LogOut,
  User,
  Truck,
  ChevronDown,
  MapPin,
  Warehouse,
  AlertTriangle,
  X,
  Check,
  Settings,
  BarChart3
} from 'lucide-react';
import DispatchModal from './DispatchModal';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'alert', message: 'Flood warning issued for East Zone', time: '5 min ago', read: false },
    { id: 2, type: 'decision', message: 'New AI decision pending approval', time: '12 min ago', read: false },
    { id: 3, type: 'dispatch', message: 'TRK-001 arrived at destination', time: '25 min ago', read: false },
  ]);
  const profileDropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);
  const searchRef = useRef(null);

  const handleLogout = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowProfileMenu(false);
    logout();
    window.location.href = '/login';
  };

  // Toggle sidebar on logo click
  const handleLogoClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Search functionality
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const [zones, routes, decisions] = await Promise.all([
        api.getZones(),
        api.getRoutes(),
        api.getDecisions()
      ]);

      const results = [];
      const lowerQuery = query.toLowerCase();

      // Search zones
      zones.forEach(zone => {
        if (zone.name?.toLowerCase().includes(lowerQuery) || 
            zone.disaster_type?.toLowerCase().includes(lowerQuery)) {
          results.push({
            type: 'zone',
            icon: AlertTriangle,
            title: zone.name,
            subtitle: `${zone.disaster_type} - ${zone.severity}`,
            action: () => navigate('/map')
          });
        }
      });

      // Search vehicles/routes
      routes.forEach(route => {
        if (route.vehicle_id?.toLowerCase().includes(lowerQuery) ||
            route.to_location?.toLowerCase().includes(lowerQuery) ||
            route.from_location?.toLowerCase().includes(lowerQuery)) {
          results.push({
            type: 'vehicle',
            icon: Truck,
            title: route.vehicle_id,
            subtitle: `${route.from_location} → ${route.to_location}`,
            action: () => navigate('/map')
          });
        }
      });

      // Search decisions
      decisions.forEach(decision => {
        if (decision.disaster_type?.toLowerCase().includes(lowerQuery) ||
            decision.risk_level?.toLowerCase().includes(lowerQuery)) {
          results.push({
            type: 'decision',
            icon: Brain,
            title: `Decision: ${decision.risk_level}`,
            subtitle: decision.disaster_type,
            action: () => navigate('/decisions')
          });
        }
      });

      // Add depot results (static)
      const depots = ['Central Depot', 'North Depot', 'South Depot'];
      depots.forEach(depot => {
        if (depot.toLowerCase().includes(lowerQuery)) {
          results.push({
            type: 'depot',
            icon: Warehouse,
            title: depot,
            subtitle: 'Supply Depot',
            action: () => navigate('/map')
          });
        }
      });

      setSearchResults(results.slice(0, 8)); // Limit to 8 results
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, [navigate]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu && profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        if (!event.target.closest('.profile-btn')) {
          setShowProfileMenu(false);
        }
      }
      
      if (showNotifications && notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        if (!event.target.closest('.notification-btn')) {
          setShowNotifications(false);
        }
      }

      if (showSearchResults && searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu, showNotifications, showSearchResults]);

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Clear notification
  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/map', icon: Map, label: 'Map View' },
    { path: '/decisions', icon: Brain, label: 'Decisions' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <button className="logo-btn" onClick={handleLogoClick} title={sidebarOpen ? 'Collapse' : 'Expand'}>
            <Compass className="logo-icon" />
            {sidebarOpen && <span className="logo-text">ReliefRoute</span>}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="sidebar-stats">
              <div className="stat">
                <span className="stat-label">System Status</span>
                <span className="stat-value online">● Online</span>
              </div>
              <div className="stat">
                <span className="stat-label">AI Agent</span>
                <span className="stat-value active">Active</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-wrapper">
        {/* Top Navigation */}
        <header className="topnav">
          <div className="topnav-left">
            <div className="search-bar" ref={searchRef}>
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search zones, routes, vehicles..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowSearchResults(true)}
              />
              {searchQuery && (
                <button className="search-clear" onClick={() => { setSearchQuery(''); setSearchResults([]); }}>
                  <X size={14} />
                </button>
              )}
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((result, idx) => (
                    <button 
                      key={idx} 
                      className="search-result-item"
                      onClick={() => {
                        result.action();
                        setShowSearchResults(false);
                        setSearchQuery('');
                      }}
                    >
                      <result.icon size={16} className={`result-icon ${result.type}`} />
                      <div className="result-content">
                        <span className="result-title">{result.title}</span>
                        <span className="result-subtitle">{result.subtitle}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {showSearchResults && searchQuery && searchResults.length === 0 && (
                <div className="search-results">
                  <div className="search-no-results">No results found</div>
                </div>
              )}
            </div>
          </div>

          <div className="topnav-right">
            <button 
              className="btn btn-primary dispatch-btn"
              onClick={() => setShowDispatchModal(true)}
            >
              <Truck size={18} />
              <span>Dispatch Vehicle</span>
            </button>

            <div className="notification-wrapper">
              <button 
                className="icon-btn notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>
              
              {showNotifications && (
                <div 
                  ref={notificationDropdownRef}
                  className="dropdown notification-dropdown"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="dropdown-header">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      <button className="text-cyan text-sm" onClick={markAllAsRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="notification-empty">No notifications</div>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className={`notification-item ${notif.read ? 'read' : ''}`}>
                        <div className={`notification-dot ${notif.type}`} />
                        <div className="notification-content">
                          <p>{notif.message}</p>
                          <span>{notif.time}</span>
                        </div>
                        <div className="notification-actions">
                          {!notif.read && (
                            <button onClick={() => markAsRead(notif.id)} title="Mark as read">
                              <Check size={14} />
                            </button>
                          )}
                          <button onClick={() => clearNotification(notif.id)} title="Dismiss">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="profile-wrapper">
              <button 
                className="profile-btn"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="avatar">
                  <User size={18} />
                </div>
                <div className="profile-info">
                  <span className="profile-name">{user?.name || 'Admin User'}</span>
                  <span className="profile-role">Administrator</span>
                </div>
                <ChevronDown size={16} />
              </button>

              {showProfileMenu && (
                <div 
                  ref={profileDropdownRef}
                  className="dropdown profile-dropdown"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    type="button"
                    className="dropdown-item logout-item" 
                    onClick={handleLogout}
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      {/* Dispatch Modal */}
      {showDispatchModal && (
        <DispatchModal onClose={() => setShowDispatchModal(false)} />
      )}
    </div>
  );
}
