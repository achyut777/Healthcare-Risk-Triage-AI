# Healthcare Risk Triage AI

## 🏥 AI-Powered Clinical Decision Support System (CDSS)

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-green.svg)](https://mongodb.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-teal.svg)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

<p align="center">
  <img src="https://img.shields.io/badge/Version-2.0-brightgreen?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Type-CDSS-blue?style=for-the-badge" />
</p>

---

## ⚠️ CRITICAL LEGAL & ETHICAL DISCLAIMER

> **THIS SYSTEM IS NOT A DIAGNOSTIC TOOL**
> 
> This Healthcare Risk Triage System is a **Clinical Decision Support System (CDSS)** designed **EXCLUSIVELY** for assisting healthcare workers in patient prioritization at primary healthcare centers.
>
> **THIS SYSTEM:**
> - ❌ Does **NOT** diagnose diseases
> - ❌ Does **NOT** prescribe treatments
> - ❌ Does **NOT** replace medical professionals
> - ❌ Does **NOT** provide medical advice to patients
>
> **THIS SYSTEM ONLY:**
> - ✅ Provides **risk indicators** for triage prioritization
> - ✅ Assists healthcare workers in **queue management**
> - ✅ Flags potentially urgent cases for **faster attention**
> - ✅ **Supports** (not replaces) clinical decision-making
>
> All outputs **MUST** be validated by licensed healthcare professionals.
> Final medical decisions are **ALWAYS** made by qualified doctors.

---

## 🌟 Features

### Core Features
- **🤖 AI Risk Assessment** - Intelligent patient risk scoring based on vital signs
- **💬 Healthcare Chatbot** - AI assistant for healthcare-related questions only
- **📋 Queue Management** - Smart patient queue with priority-based ordering
- **📊 Real-time Analytics** - Dashboard with charts and insights
- **🌐 Patient Portal** - Public portal for patients to check queue status
- **🔐 Role-Based Access** - Secure authentication for staff and doctors
- **📱 Responsive Design** - Works on desktop and mobile devices
- **🌙 Dark Mode** - Full dark mode support across all pages

### Clinical Features (Evidence-Based)
- **🩺 NEWS2 Scoring** - National Early Warning Score 2 (Royal College of Physicians)
  - Respiratory rate, SpO2, temperature, BP, heart rate scoring
  - Risk levels: Low (0-4), Medium (5-6), High (7+)
- **⚠️ qSOFA Sepsis Screening** - Quick Sequential Organ Failure Assessment
  - Checks: RR≥22, SBP≤100, altered mental status
  - Positive if ≥2 criteria met
- **👶 Pediatric Support** - Age-specific vital sign ranges
  - Infant (0-1yr), Toddler (1-3yr), Preschool (3-6yr)
  - School age (6-12yr), Adolescent (12-18yr)
- **🚨 Critical Alerts** - Automatic flagging of life-threatening values
  - SpO2 < 88%, BP < 80 or > 200, HR < 40 or > 150
  - Temperature > 40.5°C, Respiratory rate < 8 or > 35
- **📝 Symptom Analysis** - 23+ high-risk symptom keyword detection
  - Chest pain, difficulty breathing, stroke symptoms
  - Severe pain, bleeding, loss of consciousness

### Security & Compliance
- **📋 Audit Logging** - HIPAA-compliant activity tracking
- **🔒 Rate Limiting** - Protection against abuse
- **🛡️ Role-Based Authorization** - Granular access control

### Internationalization
- **🌍 Multi-language Support** - English, Hindi, Spanish, French
- **🕐 Timezone Support** - IST, EST, GMT, PST
- **📅 Date Format Options** - DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and npm
- **MongoDB** (local or Atlas)
- **Python 3.10+** (for ML service, optional)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/Healthcare-Risk-Triage-AI.git
cd Healthcare-Risk-Triage-AI

# 2. Install all dependencies
npm run install:all

# 3. Configure environment
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and other settings

# 4. Seed the database with demo data
npm run seed

# 5. Start development servers
npm run dev
```

This starts:
- **Backend API**: http://localhost:5000
- **React Frontend**: http://localhost:3000

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `demo@healthtriage.ai` | `demo123` |
| **Doctor** | `doctor@healthtriage.ai` | `doctor123` |
| **Nurse** | `nurse@healthtriage.ai` | `nurse123` |
| **Staff** | `staff@healthtriage.ai` | `staff123` |

---

## 📁 Project Structure

```
healthcare-risk-triage-ai/
├── client/                    # React Frontend (Vite + Tailwind)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API service layer
│   │   └── stores/            # Zustand state management
│   └── package.json
│
├── server/                    # Node.js Backend (Express + MongoDB)
│   ├── config/                # Configuration files
│   ├── middleware/            # Express middleware
│   ├── models/                # Mongoose models
│   ├── routes/                # API routes
│   ├── services/              # Business logic
│   ├── scripts/               # Database seeding
│   └── package.json
│
├── backend/                   # Python ML Service (FastAPI)
│   ├── app.py                 # FastAPI application
│   ├── config.py              # Configuration
│   └── requirements.txt       # Python dependencies
│
├── model/                     # ML Risk Engine
│   └── risk_engine.py         # Core risk assessment algorithm
│
├── tests/                     # Python tests
│   └── test_risk_engine.py    # Risk engine unit tests
│
├── dataset/                   # Sample data
│   └── sample_data.csv        # Demo dataset
│
├── docs/                      # Documentation
│   ├── architecture.md        # System architecture
│   └── ethics.md              # Ethical considerations
│
├── package.json               # Root package.json
├── pyproject.toml             # Python project config
└── README.md
```

---

## 🛠️ Available Scripts

### NPM Scripts (Root)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both server and client in development mode |
| `npm run server` | Start Node.js server only |
| `npm run client` | Start React client only |
| `npm run install:all` | Install all dependencies (root + server + client) |
| `npm run build` | Build React client for production |
| `npm run seed` | Seed MongoDB with demo data |
| `npm run test:python` | Run Python ML model tests |
| `npm run ml:start` | Start Python ML service |

### VS Code Tasks

Press `Ctrl+Shift+P` → "Tasks: Run Task" to access:
- 🚀 Start Full Stack (Dev)
- 🌐 Start Node.js Server
- ⚛️ Start React Client
- 🤖 Start ML Service (FastAPI)
- 🧪 Run Python Tests
- 📦 Install All Dependencies

---

## 🏗️ Architecture

### System Overview

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

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + Vite + Tailwind CSS | Modern, fast UI |
| **Backend** | Express.js + MongoDB + Mongoose | REST API + Data persistence |
| **ML Service** | FastAPI + Scikit-learn | Risk assessment engine |
| **State Management** | Zustand | Lightweight React state |
| **Authentication** | JWT + bcrypt | Secure user auth |
| **Charts** | Chart.js + react-chartjs-2 | Analytics visualization |

---

## 📡 API Endpoints

### Node.js API (Port 5000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User authentication |
| POST | `/api/auth/register` | User registration |
| POST | `/api/assessments` | Create risk assessment |
| GET | `/api/queue/status` | Get queue status |
| POST | `/api/queue/add` | Add patient to queue |
| GET | `/api/analytics/dashboard` | Dashboard statistics |
| POST | `/api/chatbot/message` | Healthcare chatbot |

### Python ML API (Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info and disclaimer |
| GET | `/health` | Health check |
| POST | `/assess` | Risk assessment |
| GET | `/model-info` | Model transparency info |
| GET | `/vital-ranges` | Clinical reference ranges |
| GET | `/docs` | Swagger documentation |

---

## 🔧 Configuration

### Environment Variables (server/.env)

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/healthtriage

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d

# Client URL (CORS)
CLIENT_URL=http://localhost:3000

# OpenAI (for chatbot)
OPENAI_API_KEY=your-openai-key

# Python ML Service
ML_SERVICE_URL=http://localhost:8000
```

---

## 🧪 Testing

### Python Tests

```bash
# Run all tests
npm run test:python

# With coverage
cd backend && python -m pytest ../tests --cov=../model --cov-report=html -v
```

### Test Coverage

The test suite covers:
- Input validation
- Risk level calculation
- Edge cases for vital signs
- Model training and prediction
- API endpoint responses

---

## 📊 Risk Assessment Algorithm

### Features Used (Non-Invasive)

| Feature | Unit | Normal Range |
|---------|------|--------------|
| Age | years | 0-120 |
| Heart Rate | bpm | 60-100 |
| Systolic BP | mmHg | 90-140 |
| Diastolic BP | mmHg | 60-90 |
| Temperature | °C | 36.1-37.2 |
| SpO2 | % | 95-100 |
| Respiratory Rate | /min | 12-20 |
| Symptom Duration | days | 0-365 |
| Pain Level | 0-10 | 0-10 |

### Risk Calculation

```
Risk Score = 60% × Rule-Based Score + 40% × ML Prediction

Rule-Based: Checks vital signs against clinical thresholds
ML Model: Random Forest trained on synthetic clinical data

Output:
- Risk Level: LOW / MEDIUM / HIGH
- Urgency Score: 0-100
- Contributing Factors: Which vitals are abnormal
- Recommendations: Queue priority suggestions
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👥 Team

- **Leader:** Shiv Jani
- **Members:**
  - Achyut Hadavani
  - Rachana Chauhan
  - Harshita Gupta

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- WHO vital sign reference guidelines
- National Health Mission guidelines
- Open-source community
- FastAPI and Scikit-learn teams

---

<p align="center">
  <strong>⚠️ Remember: This system assists healthcare workers in prioritization decisions. It does NOT diagnose diseases or replace medical professionals. Always consult qualified healthcare providers for medical advice.</strong>
</p>
