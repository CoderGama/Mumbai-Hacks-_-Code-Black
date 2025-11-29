# ML Models for ReliefRoute

## Overview

ReliefRoute uses machine learning models to improve demand prediction and risk assessment:

1. **LightGBM Model** - Predicts resource demand (medical kits, food, water, shelter)
2. **TF-IDF + Logistic Regression** - Classifies scenario risk levels from text features

## Models

### 1. Demand Prediction Model (LightGBM)

**Purpose**: Predict resource requirements based on scenario features

**Features Used**:
- Severity level (normalized)
- Log of population affected
- Hospital load percentage
- Number of zones impacted
- Number of blocked roads
- Disaster type (one-hot encoded)
- Disaster-specific features (water level, wind speed, magnitude, temperature, etc.)

**Output**: Predicted demand for:
- Medical kits
- Food packets
- Water (liters)
- Shelter kits

**Interpretability**: Feature importance scores available via API

### 2. Risk Classifier (TF-IDF + Logistic Regression)

**Purpose**: Classify scenario risk level from text features

**Features Used**:
- Disaster type
- Notes/description
- Zone names
- Blocked road names

**Output**: Risk level classification (LOW, MODERATE, HIGH, CRITICAL)

**Interpretability**: TF-IDF feature weights and logistic regression coefficients

## Training

### Automatic Training

Models are automatically trained when:
1. Agent starts and finds >= 5 historical scenarios
2. Training data is in `backend/app/data/scenarios/*.json`

### Manual Training

```bash
cd backend
python train_models.py
```

### Training Data Format

Historical scenarios should be JSON files in `backend/app/data/scenarios/` with:
- `disaster_type`
- `severity_level` or `severity`
- `population_affected`
- `hospital_load_pct` or `hospital_load`
- `zones_impacted` or `zones_affected`
- `blocked_roads`
- `disaster_specific` (optional)
- `resources_deployed` (for training targets)

## Model Integration

### Hybrid Approach

The agent uses a **hybrid ML + rule-based** approach:

1. **ML Prediction** (70% weight) - If models are trained and loaded
2. **Rule-based Fallback** (30% weight) - Safety-critical deterministic logic
3. **Historical Similarity** (additional adjustment) - Based on similar past scenarios

### Safety Fallbacks

- If ML models fail → Use rule-based logic
- If ML prediction is unsafe → Use higher (safer) risk level
- If insufficient training data → Use rule-based logic

## API Endpoints

### Train Models
```bash
POST /api/ml/train
```

### Get Model Interpretability
```bash
GET /api/ml/interpretability/{decision_id}
```

Returns feature importance for a specific decision.

## Feature Importance Interpretation

Top features for demand prediction typically include:
1. **Population affected** (log-transformed)
2. **Severity level**
3. **Hospital load**
4. **Disaster-specific features** (water level, wind speed, etc.)
5. **Number of zones**

## Model Performance

Models are evaluated using:
- **R² Score** - Coefficient of determination (target: >0.7)
- **MAE** - Mean Absolute Error
- **Accuracy** - For risk classifier (target: >0.8)

## Requirements

```txt
scikit-learn>=1.3.0
lightgbm>=4.0.0
numpy>=1.24.0
```

## Model Storage

Trained models are saved to:
```
backend/app/models/
├── medical_kits_model.txt
├── food_packets_model.txt
├── water_liters_model.txt
├── shelter_kits_model.txt
└── model_metadata.pkl
```

## Decision Rationale

Each decision includes:
- `ml_interpretability` field with:
  - Feature importance for each resource type
  - Risk classification feature weights
  - Prediction method used (ml_hybrid or rule_based)

This enables:
- **Explainability** - Why did the model predict this?
- **Debugging** - Which features drove the decision?
- **Compliance** - Audit trail for regulatory requirements

