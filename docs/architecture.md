# Healthcare Risk Triage AI - Technical Architecture

## System Architecture Deep Dive

### Overview

This document provides detailed technical documentation for the Healthcare Risk Triage AI system, a Clinical Decision Support System (CDSS) for patient prioritization at Primary Healthcare Centers.

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|----------|
| **Frontend** | React 18 + Vite + Tailwind CSS | Modern, fast user interface |
| **Backend API** | Express.js + MongoDB + Mongoose | REST API + Data persistence |
| **ML Service** | FastAPI + Scikit-learn | Risk assessment engine |
| **State Management** | Zustand | Lightweight React state |
| **Authentication** | JWT + bcrypt | Secure user auth |
| **Charts** | Chart.js + react-chartjs-2 | Analytics visualization |

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                       │
│                    http://localhost:3000                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Node.js Backend (Express)                      │
│                    http://localhost:5000                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Auth API   │  │  Queue API   │  │  Analytics API       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                              ▼
┌─────────────────────────┐    ┌─────────────────────────────────┐
│       MongoDB           │    │   Python ML Service (FastAPI)   │
│   (User/Patient Data)   │    │      http://localhost:8000      │
└─────────────────────────┘    │  ┌───────────────────────────┐  │
                               │  │   Risk Assessment Engine  │  │
                               │  │   (Random Forest + Rules) │  │
                               │  └───────────────────────────┘  │
                               └─────────────────────────────────┘
```

---

## Core Components

### 1. Risk Assessment Engine (`model/risk_engine.py`)

The heart of the system uses a **hybrid approach**:

#### Rule-Based Component (60% weight)
- Uses WHO/standard clinical guidelines for vital sign evaluation
- Completely transparent and auditable
- No black-box decision making

```
Urgency Score Calculation:
- Low SpO2 (<90%): +30 points
- Abnormal BP (>180 or <80 systolic): +25 points
- Abnormal Heart Rate (>120 or <50): +15 points
- High Fever (>39°C): +15 points
- High Pain (7+): +15 points
- Extreme Age (<2 or >80): +10 points
```

#### ML Component (40% weight)
- Random Forest Classifier
- 100 trees, max depth 10 (prevents overfitting)
- Class-balanced training
- Provides probability estimates for risk categories

#### Why This Hybrid?

| Pure Rule-Based | Pure ML | Our Hybrid |
|-----------------|---------|------------|
| Fully transparent | Potentially more accurate | Best of both |
| Misses patterns | Black-box concerns | Transparent + adaptive |
| No learning | Requires large data | Works with limited data |

### 2. Node.js Backend API (`server/`)

Express.js-based REST API with:

- **MongoDB Integration**: Mongoose ODM for data persistence
- **JWT Authentication**: Secure user authentication
- **Role-Based Access**: Admin, Doctor, Nurse, Staff roles
- **Rate Limiting**: Protection against abuse
- **Validation Middleware**: Input sanitization and validation
- **Queue Management**: Patient queue with priority ordering
- **Healthcare Chatbot**: OpenAI-powered assistant (healthcare-only)

### 3. Python ML Service (`backend/app.py`)

FastAPI-based ML API with:

- **Input Validation**: Pydantic models ensure data integrity
- **Type Safety**: All inputs/outputs are strongly typed
- **Auto-documentation**: Swagger UI at `/docs`
- **Risk Engine**: Rule-based + ML hybrid assessment
- **CORS Support**: Configurable for production deployment

### 4. React Frontend (`client/`)

Modern React 18 application with:
- **Vite**: Fast development and build tool
- **Tailwind CSS**: Utility-first styling
- **Zustand**: Lightweight state management
- **React Router**: Client-side routing
- **Chart.js**: Analytics visualizations
- **Responsive Design**: Mobile and desktop support
- **Protected Routes**: Authentication-based access control

---

## Data Flow

```
1. Healthcare Worker Input
   └── Patient vitals entered via web form
   
2. Frontend Validation
   └── Client-side range checking
   
3. API Request
   └── POST /assess with JSON payload
   
4. Backend Validation
   └── Pydantic model validation
   └── Clinical plausibility checks
   
5. Risk Engine Processing
   ├── Calculate vital deviations from normal
   ├── Rule-based urgency scoring
   ├── ML probability estimation (if trained)
   └── Combine scores (60/40 weighted)
   
6. Response Generation
   ├── Risk level (LOW/MEDIUM/HIGH)
   ├── Urgency score (0-100)
   ├── Contributing factors
   ├── Recommendations
   └── Mandatory disclaimer
   
7. Frontend Display
   └── Visual risk card with explanations
```

---

## Feature Engineering

### Input Features (10 total)

| # | Feature | Type | Range | Clinical Rationale |
|---|---------|------|-------|-------------------|
| 1 | Age | int | 0-120 | Vulnerability factor |
| 2 | Gender | int | 0/1 | Clinical baseline differences |
| 3 | Heart Rate | float | 20-250 | Cardiac function indicator |
| 4 | BP Systolic | float | 40-250 | Cardiovascular status |
| 5 | BP Diastolic | float | 20-150 | Cardiovascular status |
| 6 | Temperature | float | 30-45 | Infection/inflammation indicator |
| 7 | SpO2 | float | 50-100 | Respiratory function |
| 8 | Respiratory Rate | float | 4-60 | Respiratory distress indicator |
| 9 | Symptom Duration | int | 0-365 | Acute vs chronic presentation |
| 10 | Pain Level | int | 0-10 | Patient-reported severity |

### Why NOT Included

| Feature | Reason Excluded |
|---------|-----------------|
| Blood tests | Invasive, not available at all PHCs |
| ECG | Requires trained interpretation |
| Medical history | Too complex for quick triage |
| Diagnosis codes | Would imply diagnostic capability |

---

## Model Specifications

### Algorithm: Random Forest Classifier

```python
RandomForestClassifier(
    n_estimators=100,      # 100 trees
    max_depth=10,          # Prevent overfitting
    min_samples_split=5,   # Minimum samples to split
    min_samples_leaf=2,    # Minimum samples per leaf
    class_weight='balanced', # Handle class imbalance
    random_state=42        # Reproducibility
)
```

### Why Random Forest?

1. **Interpretable**: Built-in feature importance
2. **Robust**: Handles outliers well
3. **No overfitting**: Ensemble averaging
4. **No scaling needed**: Tree-based (though we scale for consistency)
5. **Works with small data**: Doesn't need millions of samples

### Evaluation Metrics

We report:
- **Validation Accuracy**: Holdout set performance
- **Cross-Validation Mean ± Std**: 5-fold CV for robustness

We explicitly do NOT report:
- "Disease detection accuracy" (we don't detect diseases)
- "Diagnostic precision" (we don't diagnose)
- Misleading metrics that imply medical accuracy

---

## API Schema Reference

### POST /assess

**Request:**
```json
{
  "age": 45,
  "gender": 1,
  "heart_rate": 88,
  "bp_systolic": 135,
  "bp_diastolic": 85,
  "temperature": 37.2,
  "oxygen_saturation": 96,
  "respiratory_rate": 18,
  "symptom_duration_days": 3,
  "pain_level": 5,
  "patient_id": "PHC-001",
  "chief_complaint": "Persistent cough"
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-01-23T10:30:00.000Z",
  "patient_id": "PHC-001",
  "risk_level": "MEDIUM",
  "urgency_score": 42,
  "confidence": 0.78,
  "contributing_factors": {
    "bp_systolic": 0.35,
    "age_risk": 0.15
  },
  "recommendations": [
    "🟡 ELEVATED PRIORITY: Patient should be seen within 30 minutes",
    "Document vital signs and prepare patient history"
  ],
  "disclaimer": "⚠️ IMPORTANT: This is a preliminary risk assessment...",
  "system_info": {
    "system_type": "Clinical Decision Support System (CDSS)",
    "purpose": "Patient prioritization assistance",
    "not_intended_for": ["Disease diagnosis", "Treatment prescription"]
  }
}
```

---

## Deployment Considerations

### Minimum Requirements

- Python 3.9+
- 512MB RAM
- Any modern browser
- No GPU required

### Production Checklist

- [ ] Configure CORS properly (not `*`)
- [ ] Add authentication for API access
- [ ] Set up HTTPS
- [ ] Configure proper logging
- [ ] Add rate limiting
- [ ] Replace synthetic data with validated clinical data
- [ ] Obtain necessary medical device certifications (if applicable)

---

## Testing Strategy

### Unit Tests (`tests/test_risk_engine.py`)

- Input validation
- Output structure
- Risk categorization logic
- Ethical compliance (no diagnosis language)

### Integration Tests (Manual)

1. Start backend: `python backend/app.py`
2. Open frontend: `frontend/index.html`
3. Test scenarios:
   - Normal patient → LOW risk
   - Elevated vitals → MEDIUM risk
   - Critical vitals → HIGH risk

---

## Limitations & Future Work

### Current Limitations

1. Synthetic training data (demo only)
2. No persistent storage
3. Single-center deployment
4. No multi-language support

### Future Enhancements

1. Real clinical data integration (with IRB approval)
2. Multi-center aggregation
3. Mobile-responsive PWA
4. Offline-first architecture
5. Integration with existing PHC software

---

## References

- WHO Guidelines for Vital Signs
- National Early Warning Score (NEWS)
- Modified Early Warning Score (MEWS)
- Indian Public Health Standards (IPHS)
