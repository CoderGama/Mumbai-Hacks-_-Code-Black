import React, { useState, useMemo } from 'react';
import { Truck, Ship, Plane, CheckCircle, AlertTriangle, Clock, Navigation, Info, Filter, ChevronLeft, ChevronRight, List, Grid, ChevronDown, ChevronUp } from 'lucide-react';
import './RouteTable.css';

export default function RouteTable({ routes }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'compact'
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [filters, setFilters] = useState({
    status: 'all',
    vehicleType: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);

  const vehicleIcons = {
    truck: Truck,
    boat: Ship,
    drone: Plane,
    helicopter: Plane
  };

  const statusConfig = {
    on_time: { icon: CheckCircle, label: 'On Time', class: 'status-success' },
    delayed: { icon: AlertTriangle, label: 'Delayed', class: 'status-warning' },
    completed: { icon: CheckCircle, label: 'Completed', class: 'status-info' },
    cancelled: { icon: AlertTriangle, label: 'Cancelled', class: 'status-error' }
  };

  const getDelayReason = (route) => {
    const reasons = [
      'Traffic congestion on primary route',
      'Road blocked due to flooding',
      'Vehicle maintenance required',
      'Weather conditions causing slowdown',
      'Checkpoint delay at district border'
    ];
    const idx = parseInt(route.id?.replace(/\D/g, '') || '0', 10) % reasons.length;
    return route.delay_reason || reasons[idx];
  };

  // Filter routes
  const filteredRoutes = useMemo(() => {
    return routes.filter(route => {
      if (filters.status !== 'all' && route.status !== filters.status) return false;
      if (filters.vehicleType !== 'all' && route.vehicle_type !== filters.vehicleType) return false;
      return true;
    });
  }, [routes, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredRoutes.length / pageSize);
  const paginatedRoutes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRoutes.slice(start, start + pageSize);
  }, [filteredRoutes, currentPage, pageSize]);

  // Reset to page 1 when filters change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const toggleRowExpand = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!routes.length) {
    return (
      <div className="empty-state">
        <Truck size={32} />
        <p>No active routes</p>
      </div>
    );
  }

  return (
    <div className="route-table-container">
      {/* Toolbar */}
      <div className="route-toolbar">
        <div className="toolbar-left">
          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
            {(filters.status !== 'all' || filters.vehicleType !== 'all') && (
              <span className="filter-badge" />
            )}
          </button>
          <span className="route-count">{filteredRoutes.length} routes</span>
        </div>
        <div className="toolbar-right">
          <div className="view-toggle">
            <button 
              className={viewMode === 'table' ? 'active' : ''}
              onClick={() => setViewMode('table')}
              title="Table view"
            >
              <List size={16} />
            </button>
            <button 
              className={viewMode === 'compact' ? 'active' : ''}
              onClick={() => setViewMode('compact')}
              title="Compact view"
            >
              <Grid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Status</label>
            <select 
              value={filters.status} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="on_time">On Time</option>
              <option value="delayed">Delayed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Vehicle Type</label>
            <select 
              value={filters.vehicleType} 
              onChange={(e) => handleFilterChange('vehicleType', e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="truck">Truck</option>
              <option value="boat">Boat</option>
              <option value="drone">Drone</option>
              <option value="helicopter">Helicopter</option>
            </select>
          </div>
          <button 
            className="clear-filters"
            onClick={() => setFilters({ status: 'all', vehicleType: 'all' })}
          >
            Clear
          </button>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="route-table-wrapper">
          <table className="route-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>From</th>
                <th>To</th>
                <th>ETA</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRoutes.map((route) => {
                const VehicleIcon = vehicleIcons[route.vehicle_type] || Truck;
                const status = statusConfig[route.status] || statusConfig.on_time;
                const StatusIcon = status.icon;
                const isDelayed = route.status === 'delayed';
                const isExpanded = expandedRows.has(route.id);

                return (
                  <React.Fragment key={route.id}>
                    <tr 
                      className={`${isDelayed ? 'delayed-row' : ''} ${isExpanded ? 'expanded' : ''}`}
                      onClick={() => isDelayed && toggleRowExpand(route.id)}
                      style={{ cursor: isDelayed ? 'pointer' : 'default' }}
                    >
                      <td>
                        <div className="vehicle-cell">
                          <div className={`vehicle-icon ${isDelayed ? 'delayed' : ''}`}>
                            <VehicleIcon size={18} />
                          </div>
                          <div>
                            <span className="vehicle-id">{route.vehicle_id}</span>
                            <span className="vehicle-type">{route.vehicle_type}</span>
                          </div>
                        </div>
                      </td>
                      <td>{route.from_location}</td>
                      <td>{route.to_location}</td>
                      <td>
                        <div className="eta-cell">
                          <Clock size={14} />
                          <span>{route.eta}</span>
                        </div>
                      </td>
                      <td>
                        <div className="status-cell">
                          <span className={`status-badge ${status.class}`}>
                            <StatusIcon size={14} />
                            {status.label}
                          </span>
                          {isDelayed && (
                            <span className="expand-icon">
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isDelayed && isExpanded && (
                      <tr className="delay-info-row">
                        <td colSpan={5}>
                          <div className="delay-info">
                            <div className="delay-reason">
                              <Info size={14} />
                              <span><strong>Delay Reason:</strong> {getDelayReason(route)}</span>
                            </div>
                            <div className="alternative-suggestion">
                              <Navigation size={14} />
                              <span><strong>Action:</strong> Alternative route being calculated. Check Map View for details.</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Compact View */}
      {viewMode === 'compact' && (
        <div className="route-compact-list">
          {paginatedRoutes.map((route) => {
            const VehicleIcon = vehicleIcons[route.vehicle_type] || Truck;
            const status = statusConfig[route.status] || statusConfig.on_time;
            const isDelayed = route.status === 'delayed';

            return (
              <div key={route.id} className={`compact-route-card ${isDelayed ? 'delayed' : ''}`}>
                <div className="compact-header">
                  <div className={`vehicle-icon ${isDelayed ? 'delayed' : ''}`}>
                    <VehicleIcon size={16} />
                  </div>
                  <span className="vehicle-id">{route.vehicle_id}</span>
                  <span className={`status-badge small ${status.class}`}>
                    {status.label}
                  </span>
                </div>
                <div className="compact-route">
                  {route.from_location} → {route.to_location}
                </div>
                <div className="compact-footer">
                  <span className="eta"><Clock size={12} /> {route.eta}</span>
                  {isDelayed && (
                    <span className="delay-indicator">⚠ {getDelayReason(route).substring(0, 30)}...</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <div className="pagination-info">
            Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredRoutes.length)} of {filteredRoutes.length}
          </div>
          <div className="pagination-controls">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
              Math.max(0, currentPage - 3),
              Math.min(totalPages, currentPage + 2)
            ).map(page => (
              <button
                key={page}
                className={currentPage === page ? 'active' : ''}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <select 
            value={pageSize} 
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="page-size-select"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
          </select>
        </div>
      )}
    </div>
  );
}
