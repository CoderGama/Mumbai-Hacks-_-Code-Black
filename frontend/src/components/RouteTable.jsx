import React from 'react';
import { Truck, Ship, Plane, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import './RouteTable.css';

export default function RouteTable({ routes }) {
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

  if (!routes.length) {
    return (
      <div className="empty-state">
        <Truck size={32} />
        <p>No active routes</p>
      </div>
    );
  }

  return (
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
          {routes.map((route) => {
            const VehicleIcon = vehicleIcons[route.vehicle_type] || Truck;
            const status = statusConfig[route.status] || statusConfig.on_time;
            const StatusIcon = status.icon;

            return (
              <tr key={route.id}>
                <td>
                  <div className="vehicle-cell">
                    <div className="vehicle-icon">
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
                  <span className={`status-badge ${status.class}`}>
                    <StatusIcon size={14} />
                    {status.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

