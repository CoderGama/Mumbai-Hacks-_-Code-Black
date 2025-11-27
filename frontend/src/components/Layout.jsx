import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  Compass,
  LayoutDashboard,
  Map,
  GitBranch,
  Package,
  Activity,
  Brain,
  Search,
  Bell,
  LogOut,
  User,
  Truck,
  ChevronDown,
  Menu,
  X
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
  const profileDropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);

  const handleLogout = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Close profile menu
    setShowProfileMenu(false);
    
    // Clear user state and localStorage
    logout();
    
    // Force redirect to login page
    window.location.href = '/login';
  };

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside profile dropdown
      if (showProfileMenu && profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        // Check if click is not on the profile button
        if (!event.target.closest('.profile-btn')) {
          setShowProfileMenu(false);
        }
      }
      
      // Check if click is outside notification dropdown
      if (showNotifications && notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        // Check if click is not on the notification button
        if (!event.target.closest('.icon-btn')) {
          setShowNotifications(false);
        }
      }
    };

    if (showProfileMenu || showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showProfileMenu, showNotifications]);

  const notifications = [
    { id: 1, type: 'alert', message: 'Flood warning issued for East Zone', time: '5 min ago' },
    { id: 2, type: 'decision', message: 'New AI decision pending approval', time: '12 min ago' },
    { id: 3, type: 'dispatch', message: 'TRK-001 arrived at destination', time: '25 min ago' },
  ];

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/map', icon: Map, label: 'Map View' },
    { path: '/decisions', icon: Brain, label: 'Decisions' },
  ];

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <Compass className="logo-icon" />
            {sidebarOpen && <span className="logo-text">ReliefRoute</span>}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
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
            <div className="search-bar">
              <Search size={18} />
              <input type="text" placeholder="Search zones, routes, vehicles..." />
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
                className="icon-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                <span className="notification-badge">3</span>
              </button>
              
              {showNotifications && (
                <div 
                  ref={notificationDropdownRef}
                  className="dropdown notification-dropdown"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div className="dropdown-header">
                    <h4>Notifications</h4>
                    <button className="text-cyan text-sm">Mark all read</button>
                  </div>
                  {notifications.map((notif) => (
                    <div key={notif.id} className="notification-item">
                      <div className={`notification-dot ${notif.type}`} />
                      <div className="notification-content">
                        <p>{notif.message}</p>
                        <span>{notif.time}</span>
                      </div>
                    </div>
                  ))}
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
                  <span className="profile-name">{user?.name || 'User'}</span>
                  <span className="profile-role">{user?.role || 'Coordinator'}</span>
                </div>
                <ChevronDown size={16} />
              </button>

              {showProfileMenu && (
                <div 
                  ref={profileDropdownRef}
                  className="dropdown profile-dropdown"
                  onClick={(e) => {
                    // Prevent clicks inside dropdown from bubbling
                    e.stopPropagation();
                  }}
                >
                  <button 
                    type="button"
                    className="dropdown-item" 
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

