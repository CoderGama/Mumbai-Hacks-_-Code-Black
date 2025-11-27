const API_BASE = '/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Auth
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(name, email, password, role = 'coordinator') {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  async getZones() {
    return this.request('/zones');
  }

  async getRoutes() {
    return this.request('/routes');
  }

  async getInventory() {
    return this.request('/inventory');
  }

  async getActivityLogs(limit = 20) {
    return this.request(`/activity-logs?limit=${limit}`);
  }

  // Agent
  async runAgent(scenario) {
    return this.request('/agent/run', {
      method: 'POST',
      body: JSON.stringify(scenario),
    });
  }

  async getDecisions() {
    return this.request('/decisions');
  }

  async decisionAction(decisionId, action) {
    return this.request(`/decisions/${decisionId}/action`, {
      method: 'POST',
      body: JSON.stringify({ decision_id: decisionId, action }),
    });
  }

  // Dispatch
  async dispatchVehicle(dispatch) {
    return this.request('/dispatch', {
      method: 'POST',
      body: JSON.stringify(dispatch),
    });
  }

  // Map
  async getMapRoutes() {
    return this.request('/map/routes');
  }

  async calculateRoute(start, end, blocked = '') {
    return this.request(`/map/calculate-route?start=${start}&end=${end}&blocked=${blocked}`);
  }

  // Presets
  async getScenarioPresets() {
    return this.request('/scenarios/presets');
  }
}

export const api = new ApiService();

