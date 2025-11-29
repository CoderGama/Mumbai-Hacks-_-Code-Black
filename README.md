# ReliefRoute - Relief Before the Need

An autonomous disaster-relief supply chain system that transforms reactive emergency response into proactive, AI-driven coordination.

![ReliefRoute](https://img.shields.io/badge/ReliefRoute-Disaster%20Relief%20Logistics-00d4ff)
![Python](https://img.shields.io/badge/Python-3.9+-blue)
![React](https://img.shields.io/badge/React-18-61dafb)

## 🌟 Features

### Agentic AI Core
- **Predictive Analytics**: 48-72 hour disaster forecasting
- **Autonomous Decision-Making**: AI-driven resource allocation and route optimization
- **Similarity Matching**: Learns from historical disaster scenarios
- **A\* Routing Algorithm**: Optimized pathfinding avoiding blocked roads

### Unified Command Dashboard
- Real-time disaster zone monitoring
- Supply route tracking with ETA
- Inventory management across depots
- Activity logs and decision history

### Map Visualization
- Interactive map with Leaflet/OpenStreetMap
- Route visualization with status indicators
- Depot and zone markers
- Layer controls for customization

### Decision Management
- Manual override capabilities (Approve/Abort)
- Detailed decision breakdown
- Weather snapshots and historical scenario matching
- Resource dispatch tracking

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🔐 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@reliefroute.org | admin123 |
| Coordinator | coordinator@reliefroute.org | coord123 |

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ReliefRoute System                        │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + Vite)                                    │
│  ├── Dashboard (KPIs, Zones, Routes, Inventory)            │
│  ├── Map View (Leaflet + OpenStreetMap)                    │
│  ├── Decisions (AI Decision History + Override)            │
│  └── Scenario Panel (Quick Presets + Manual Request)       │
├─────────────────────────────────────────────────────────────┤
│  Backend (FastAPI + Python)                                 │
│  ├── REST API Endpoints                                     │
│  ├── Agentic AI Core                                        │
│  │   ├── Similarity Matching                                │
│  │   ├── Resource Estimation                                │
│  │   ├── A* Route Optimization                              │
│  │   └── Learning Loop                                      │
│  ├── Historical Scenarios (Chennai)                         │
│  └── Road Network Graph                                     │
└─────────────────────────────────────────────────────────────┘
```

## 🗺️ Demo City: Chennai

The prototype focuses on Chennai with:
- **5 Zones**: North, South, East, West, Central
- **3 Depots**: Central, North (Ambattur), South (Tambaram)
- **15 Historical Scenarios**: 5 each for Flood, Cyclone, Heatwave
- **Road Network**: 18 nodes, 28 edges

## 🤖 Agent Logic Flow

1. **Scenario Understanding**: Parse input into structured format
2. **Similarity Matching**: Find top-3 similar historical scenarios
3. **Resource Estimation**: Calculate required supplies based on heuristics
4. **Inventory Check**: Verify availability and identify gaps
5. **Route Optimization**: A\* pathfinding to affected zones
6. **Decision Generation**: Build action plan with recommendations
7. **Learning Loop**: Update weights based on feedback

## 📦 Supported Resources

### Vehicles
- 🚛 Trucks (ground logistics)
- 🚤 Boats (flood/coastal areas)
- 🚁 Drones (last-mile delivery)
- 🚁 Helicopters (emergency evacuation)

### Supplies
- Medical kits, vaccines, oxygen, surgical kits
- Food packets, water
- Shelter kits
- Cooling units (for heatwaves)

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration

### Dashboard
- `GET /api/dashboard/stats` - KPI metrics
- `GET /api/zones` - Active disaster zones
- `GET /api/routes` - Active supply routes
- `GET /api/inventory` - Depot inventory
- `GET /api/activity-logs` - Recent activity

### Agent
- `POST /api/agent/run` - Run AI agent with scenario
- `GET /api/decisions` - List all decisions
- `POST /api/decisions/{id}/action` - Approve/Abort decision

### Dispatch
- `POST /api/dispatch` - Manual vehicle dispatch

### Map
- `GET /api/map/routes` - Route data for visualization
- `GET /api/map/calculate-route` - Calculate specific route

## 🎨 Tech Stack

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Framer Motion** for animations
- **Leaflet** for maps
- **Lucide React** for icons
- Custom CSS with CSS Variables

### Backend
- **FastAPI** for REST API
- **Pydantic** for data validation
- **A\* Algorithm** for routing
- Python standard library (no ML dependencies for prototype)

## 🧪 Testing Scenarios

### Quick Presets
1. **Flash Flood** - Severity 4, East + Central zones
2. **Road Block** - Severity 2, South zone
3. **Medical Emergency** - Severity 5, Central zone
4. **Pre-position Supplies** - Cyclone warning
5. **Cyclone Alert** - Severity 4, coastal zones
6. **Heatwave** - Severity 4, North + Central + West

### Manual Request Fields
- Disaster Type (8 options)
- Severity Level (1-5)
- Affected Population
- Impacted Zones
- Hospital Load (%)
- Blocked Roads

## 📈 Future Enhancements

- [ ] Reinforcement Learning for route optimization
- [ ] Real-time weather API integration
- [ ] Multi-city support
- [ ] Conversational AI interface
- [ ] Mobile app
- [ ] Cross-agency coordination
- [ ] Outcome-based learning from real deployments

## 📄 License

MIT License - See LICENSE file for details.

---

Built with ❤️ for disaster relief coordination by team CODE BLACK


# touch update 11/29/2025 12:45:26
