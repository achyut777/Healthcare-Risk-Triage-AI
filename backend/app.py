"""
Healthcare Risk Triage API
===========================
FastAPI Backend for Clinical Decision Support System

LEGAL DISCLAIMER:
-----------------
This API provides risk INDICATORS for patient prioritization ONLY.
It does NOT diagnose diseases, prescribe treatments, or replace medical professionals.
All outputs must be validated by licensed healthcare providers.
Final medical decisions are ALWAYS made by qualified doctors.

This is a Clinical Decision Support System (CDSS), NOT a diagnostic tool.
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, List
from datetime import datetime
import sys
import os

# Add model path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'model'))
from risk_engine import (
    HealthcareRiskTriageEngine, 
    generate_synthetic_training_data,
    RiskAssessmentResult
)

# ============================================
# API Disclaimers (Embedded at API level)
# ============================================
API_DISCLAIMER = """
⚠️ IMPORTANT LEGAL NOTICE:

This Healthcare Risk Triage API is a Clinical Decision Support System (CDSS) designed 
ONLY to assist healthcare workers in patient prioritization at primary healthcare centers.

THIS SYSTEM:
❌ Does NOT diagnose diseases
❌ Does NOT prescribe treatments  
❌ Does NOT replace medical professionals
❌ Does NOT provide medical advice to patients

THIS SYSTEM ONLY:
✅ Provides risk INDICATORS for triage prioritization
✅ Assists healthcare workers in queue management
✅ Flags potentially urgent cases for faster attention
✅ Supports (not replaces) clinical decision-making

All outputs MUST be validated by licensed healthcare professionals.
Final medical decisions are ALWAYS made by qualified doctors.

By using this API, you acknowledge these limitations.
"""

# ============================================
# FastAPI App Initialization
# ============================================
app = FastAPI(
    title="Healthcare Risk Triage API",
    description=API_DISCLAIMER,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize and train the risk engine
print("Initializing Healthcare Risk Triage Engine...")
risk_engine = HealthcareRiskTriageEngine()

# Train on synthetic data (for hackathon demo)
print("Training model on demonstration data...")
X, y = generate_synthetic_training_data(1000)
training_metrics = risk_engine.train(X, y)
print(f"Model trained. Validation accuracy: {training_metrics['validation_accuracy']}")
print("⚠️  Note: Using synthetic data for demonstration only.\n")


# ============================================
# Pydantic Models (Input/Output Schemas)
# ============================================
class PatientVitals(BaseModel):
    """
    Patient vital signs input schema.
    All fields are non-invasive measurements available at PHCs.
    """
    age: int = Field(..., ge=0, le=120, description="Patient age in years")
    gender: int = Field(..., ge=0, le=1, description="Biological gender (0=Female, 1=Male)")
    heart_rate: float = Field(..., ge=20, le=250, description="Heart rate in bpm")
    bp_systolic: float = Field(..., ge=40, le=250, description="Systolic blood pressure in mmHg")
    bp_diastolic: float = Field(..., ge=20, le=150, description="Diastolic blood pressure in mmHg")
    temperature: float = Field(..., ge=30.0, le=45.0, description="Body temperature in °C")
    oxygen_saturation: float = Field(..., ge=50, le=100, description="SpO2 percentage")
    respiratory_rate: float = Field(..., ge=4, le=60, description="Respiratory rate per minute")
    symptom_duration_days: int = Field(..., ge=0, le=365, description="Days since symptom onset")
    pain_level: int = Field(..., ge=0, le=10, description="Self-reported pain level (0-10)")
    
    # Optional metadata
    patient_id: Optional[str] = Field(None, description="Optional patient identifier")
    chief_complaint: Optional[str] = Field(None, description="Brief description of main complaint")
    
    @validator('bp_diastolic')
    def diastolic_less_than_systolic(cls, v, values):
        if 'bp_systolic' in values and v >= values['bp_systolic']:
            raise ValueError('Diastolic BP must be less than Systolic BP')
        return v
    
    class Config:
        schema_extra = {
            "example": {
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
                "patient_id": "PHC-2024-001",
                "chief_complaint": "Persistent cough and mild fever"
            }
        }


class RiskAssessmentResponse(BaseModel):
    """
    Risk assessment response schema.
    Contains risk indicators for healthcare worker decision support.
    """
    success: bool
    timestamp: str
    patient_id: Optional[str]
    
    # Risk indicators (NOT diagnoses)
    risk_level: str = Field(..., description="Risk category: LOW, MEDIUM, or HIGH")
    urgency_score: int = Field(..., ge=0, le=100, description="Urgency score (0-100)")
    confidence: float = Field(..., ge=0, le=1, description="Model confidence")
    
    # Clinical Scoring Systems
    news2_score: int = Field(default=0, ge=0, le=20, description="NEWS2 Early Warning Score (0-20)")
    qsofa_score: int = Field(default=0, ge=0, le=3, description="qSOFA sepsis screening score (0-3)")
    qsofa_positive: bool = Field(default=False, description="True if qSOFA >= 2 (sepsis risk)")
    pediatric_adjusted: bool = Field(default=False, description="True if pediatric vital ranges were used")
    
    # Critical Alerts
    critical_alerts: List[str] = Field(default=[], description="Immediate attention alerts")
    
    # Explainability
    contributing_factors: Dict[str, float] = Field(..., description="Factors contributing to risk level")
    recommendations: List[str] = Field(..., description="Triage recommendations for healthcare workers")
    
    # Mandatory disclaimer
    disclaimer: str = Field(
        default="⚠️ IMPORTANT: This is a preliminary risk assessment for patient prioritization only. "
                "It is NOT a medical diagnosis. All results must be reviewed and validated by a "
                "licensed healthcare professional before any medical decisions are made."
    )
    
    # Metadata
    system_info: Dict = Field(default={
        "system_type": "Clinical Decision Support System (CDSS)",
        "purpose": "Patient prioritization assistance",
        "clinical_scores": ["NEWS2 (National Early Warning Score 2)", "qSOFA (Sepsis Screening)"],
        "not_intended_for": ["Disease diagnosis", "Treatment prescription", "Replacing medical professionals"]
    })


class HealthCheckResponse(BaseModel):
    """Health check response schema"""
    status: str
    timestamp: str
    model_loaded: bool
    disclaimer: str


class ErrorResponse(BaseModel):
    """Error response schema"""
    success: bool = False
    error: str
    timestamp: str
    disclaimer: str = "This system is for decision SUPPORT only, not diagnosis."


# ============================================
# API Endpoints
# ============================================

@app.get("/", response_model=Dict)
async def root():
    """
    Root endpoint - Returns API information and disclaimer.
    """
    return {
        "name": "Healthcare Risk Triage API",
        "version": "1.0.0",
        "type": "Clinical Decision Support System (CDSS)",
        "purpose": "Patient risk triage and prioritization assistance",
        "disclaimer": API_DISCLAIMER,
        "endpoints": {
            "/health": "System health check",
            "/assess": "POST - Submit patient vitals for risk assessment",
            "/docs": "API documentation (Swagger UI)",
            "/redoc": "API documentation (ReDoc)"
        },
        "important_notice": "This system does NOT diagnose diseases or replace doctors."
    }


@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """
    Health check endpoint for monitoring.
    """
    return HealthCheckResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        model_loaded=risk_engine.is_trained,
        disclaimer="System operational - For decision SUPPORT only, not diagnosis."
    )


@app.post("/assess", response_model=RiskAssessmentResponse)
async def assess_patient_risk(patient: PatientVitals):
    """
    Main risk assessment endpoint.
    
    Accepts patient vital signs and returns a risk assessment for triage prioritization.
    
    ⚠️ IMPORTANT:
    - This is a PRIORITIZATION tool, not a diagnostic tool
    - Results must be validated by healthcare professionals
    - Does not replace medical judgment
    """
    try:
        # Convert to dictionary for engine
        patient_data = {
            'age': patient.age,
            'gender': patient.gender,
            'heart_rate': patient.heart_rate,
            'bp_systolic': patient.bp_systolic,
            'bp_diastolic': patient.bp_diastolic,
            'temperature': patient.temperature,
            'oxygen_saturation': patient.oxygen_saturation,
            'respiratory_rate': patient.respiratory_rate,
            'symptom_duration_days': patient.symptom_duration_days,
            'pain_level': patient.pain_level,
            'chief_complaint': patient.chief_complaint or ''
        }
        
        # Perform risk assessment
        result = risk_engine.assess_risk(patient_data)
        
        return RiskAssessmentResponse(
            success=True,
            timestamp=datetime.now().isoformat(),
            patient_id=patient.patient_id,
            risk_level=result.risk_level.value,
            urgency_score=result.urgency_score,
            confidence=result.confidence,
            news2_score=result.news2_score,
            qsofa_score=result.qsofa_score,
            qsofa_positive=result.qsofa_positive,
            pediatric_adjusted=result.pediatric_adjusted,
            critical_alerts=result.critical_alerts,
            contributing_factors=result.contributing_factors,
            recommendations=result.recommendations
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail={
                "error": str(e),
                "message": "Invalid input data",
                "disclaimer": "This system is for decision SUPPORT only, not diagnosis."
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Internal server error",
                "message": str(e),
                "disclaimer": "This system is for decision SUPPORT only, not diagnosis."
            }
        )


@app.get("/model-info")
async def get_model_info():
    """
    Returns model information and feature importance for transparency.
    """
    if not risk_engine.is_trained:
        raise HTTPException(status_code=503, detail="Model not trained yet")
    
    return {
        "model_type": "Random Forest Classifier",
        "purpose": "Risk categorization for patient prioritization",
        "not_for": "Disease diagnosis or treatment prescription",
        "features_used": risk_engine.FEATURE_NAMES,
        "feature_importance": risk_engine.feature_importance,
        "risk_levels": ["LOW", "MEDIUM", "HIGH"],
        "disclaimer": "Feature importance shows which factors contribute to RISK CATEGORIZATION, "
                     "not disease prediction. This model assists in patient queue prioritization only.",
        "ethical_note": "All features are non-invasive measurements typically available at "
                       "Primary Healthcare Centers (PHCs) and do not include any invasive tests."
    }


@app.get("/vital-ranges")
async def get_vital_ranges():
    """
    Returns clinical reference ranges for vital signs.
    For educational/transparency purposes.
    """
    return {
        "adult_vital_ranges": risk_engine.VITAL_RANGES,
        "pediatric_vital_ranges": risk_engine.PEDIATRIC_VITAL_RANGES,
        "high_risk_symptoms": list(risk_engine.HIGH_RISK_SYMPTOMS.keys()),
        "note": "These are general reference ranges. Individual patient context matters. "
               "Healthcare professionals should use clinical judgment.",
        "source": "Based on WHO and standard clinical guidelines",
        "disclaimer": "Reference ranges are for educational purposes. "
                     "Clinical interpretation must be done by healthcare professionals."
    }


# ============================================
# Queue Management Endpoints
# ============================================

# In-memory storage for demo (use database in production)
patient_queue: List[Dict] = []
queue_counter: int = 0
staff_members: List[Dict] = [
    {"id": 1, "name": "Dr. Rahul Sharma", "role": "Medical Officer", "status": "active", "patients_seen": 45},
    {"id": 2, "name": "Priya Kumari", "role": "Staff Nurse", "status": "active", "patients_seen": 38},
    {"id": 3, "name": "Amit Patel", "role": "Health Worker", "status": "break", "patients_seen": 22},
]

class QueuePatient(BaseModel):
    """Patient queue entry schema"""
    name: str
    age: int
    gender: str
    priority: str = "medium"  # critical, high, medium, low
    symptoms: Optional[str] = None
    contact: Optional[str] = None

class QueueResponse(BaseModel):
    """Queue operation response"""
    success: bool
    message: str
    token_number: Optional[str] = None
    position: Optional[int] = None
    estimated_wait: Optional[int] = None


@app.post("/queue/add", response_model=QueueResponse)
async def add_to_queue(patient: QueuePatient):
    """Add a patient to the queue"""
    global queue_counter
    queue_counter += 1
    token = f"PT-2026-{queue_counter:04d}"
    
    queue_entry = {
        "token": token,
        "name": patient.name,
        "age": patient.age,
        "gender": patient.gender,
        "priority": patient.priority,
        "symptoms": patient.symptoms,
        "contact": patient.contact,
        "added_at": datetime.now().isoformat(),
        "status": "waiting"
    }
    
    # Insert based on priority
    priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    insert_idx = len(patient_queue)
    for i, p in enumerate(patient_queue):
        if priority_order[patient.priority] < priority_order[p["priority"]]:
            insert_idx = i
            break
    patient_queue.insert(insert_idx, queue_entry)
    
    position = patient_queue.index(queue_entry) + 1
    estimated_wait = position * 8  # 8 minutes per patient average
    
    return QueueResponse(
        success=True,
        message=f"Patient added to queue successfully",
        token_number=token,
        position=position,
        estimated_wait=estimated_wait
    )


@app.get("/queue/status")
async def get_queue_status():
    """Get current queue status"""
    priority_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    for p in patient_queue:
        if p["status"] == "waiting":
            priority_counts[p["priority"]] += 1
    
    waiting = [p for p in patient_queue if p["status"] == "waiting"]
    now_serving = [p for p in patient_queue if p["status"] == "serving"]
    
    return {
        "total_waiting": len(waiting),
        "now_serving": now_serving[0]["token"] if now_serving else None,
        "next_up": waiting[0]["token"] if waiting else None,
        "priority_breakdown": priority_counts,
        "average_wait_time": len(waiting) * 8,
        "queue": waiting[:10]  # Return first 10 in queue
    }


@app.get("/queue/check/{token}")
async def check_queue_position(token: str):
    """Check position in queue by token number"""
    waiting = [p for p in patient_queue if p["status"] == "waiting"]
    
    for i, p in enumerate(waiting):
        if p["token"].upper() == token.upper():
            return {
                "found": True,
                "token": p["token"],
                "name": p["name"],
                "position": i + 1,
                "estimated_wait": (i + 1) * 8,
                "priority": p["priority"]
            }
    
    # Check if already served
    for p in patient_queue:
        if p["token"].upper() == token.upper():
            return {
                "found": True,
                "token": p["token"],
                "status": p["status"],
                "message": "Patient has been served or is currently being served"
            }
    
    return {"found": False, "message": "Token not found in queue"}


@app.post("/queue/call/{token}")
async def call_patient(token: str):
    """Call next patient from queue"""
    for p in patient_queue:
        if p["token"].upper() == token.upper() and p["status"] == "waiting":
            p["status"] = "serving"
            p["called_at"] = datetime.now().isoformat()
            return {"success": True, "message": f"Calling patient {p['name']}", "patient": p}
    
    return {"success": False, "message": "Patient not found or already called"}


@app.post("/queue/complete/{token}")
async def complete_patient(token: str):
    """Mark patient as served"""
    for p in patient_queue:
        if p["token"].upper() == token.upper():
            p["status"] = "completed"
            p["completed_at"] = datetime.now().isoformat()
            return {"success": True, "message": "Patient marked as completed"}
    
    return {"success": False, "message": "Patient not found"}


# ============================================
# Analytics Endpoints
# ============================================

@app.get("/analytics/summary")
async def get_analytics_summary():
    """Get analytics summary for dashboard"""
    import random
    
    # In production, this would query a database
    return {
        "today": {
            "total_assessments": random.randint(45, 65),
            "high_risk": random.randint(8, 15),
            "medium_risk": random.randint(20, 30),
            "low_risk": random.randint(20, 25),
            "average_wait_time": random.randint(12, 18),
            "patients_served": random.randint(40, 55)
        },
        "weekly_trend": [
            {"day": "Mon", "assessments": 52, "high_risk": 10},
            {"day": "Tue", "assessments": 48, "high_risk": 8},
            {"day": "Wed", "assessments": 61, "high_risk": 14},
            {"day": "Thu", "assessments": 55, "high_risk": 11},
            {"day": "Fri", "assessments": 58, "high_risk": 12},
            {"day": "Sat", "assessments": 35, "high_risk": 6},
            {"day": "Sun", "assessments": 0, "high_risk": 0}
        ],
        "risk_distribution": {
            "high": 18,
            "medium": 42,
            "low": 40
        },
        "peak_hours": [
            {"hour": "9-10 AM", "count": 15},
            {"hour": "10-11 AM", "count": 12},
            {"hour": "11-12 PM", "count": 18},
            {"hour": "2-3 PM", "count": 14},
            {"hour": "3-4 PM", "count": 11}
        ],
        "model_accuracy": 99.5,
        "top_risk_factors": [
            {"factor": "Low SpO2", "percentage": 35},
            {"factor": "High Blood Pressure", "percentage": 28},
            {"factor": "Elderly (65+)", "percentage": 22},
            {"factor": "High Fever", "percentage": 15}
        ]
    }


@app.get("/analytics/assessments")
async def get_assessment_history(limit: int = 50):
    """Get recent assessment history"""
    # Demo data
    import random
    
    assessments = []
    for i in range(limit):
        risk = random.choice(["LOW", "MEDIUM", "HIGH"])
        assessments.append({
            "id": f"ASS-{1000+i}",
            "patient_id": f"PT-2026-{random.randint(1, 500):04d}",
            "risk_level": risk,
            "urgency_score": random.randint(20, 95),
            "timestamp": datetime.now().isoformat(),
            "staff": random.choice(["Dr. Rahul Sharma", "Priya Kumari", "Amit Patel"])
        })
    
    return {"assessments": assessments, "total": limit}


# ============================================
# Staff Management Endpoints
# ============================================

@app.get("/staff")
async def get_staff_list():
    """Get list of staff members"""
    return {"staff": staff_members, "total": len(staff_members)}


@app.get("/staff/{staff_id}")
async def get_staff_member(staff_id: int):
    """Get staff member details"""
    for s in staff_members:
        if s["id"] == staff_id:
            return {"success": True, "staff": s}
    return {"success": False, "message": "Staff member not found"}


@app.post("/staff/{staff_id}/status")
async def update_staff_status(staff_id: int, status: str):
    """Update staff member status"""
    valid_statuses = ["active", "break", "offline"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    for s in staff_members:
        if s["id"] == staff_id:
            s["status"] = status
            return {"success": True, "message": f"Status updated to {status}"}
    
    return {"success": False, "message": "Staff member not found"}


# ============================================
# System Settings Endpoints
# ============================================

system_settings = {
    "facility_name": "Primary Health Centre - Sector 12",
    "facility_code": "PHC-GGN-012",
    "queue_prefix": "PT-2026-",
    "max_queue_size": 100,
    "session_timeout": 30,
    "model_confidence_threshold": 85,
    "rule_weight": 60
}


@app.get("/settings")
async def get_settings():
    """Get system settings"""
    return {"settings": system_settings}


@app.put("/settings")
async def update_settings(settings: Dict):
    """Update system settings"""
    global system_settings
    for key, value in settings.items():
        if key in system_settings:
            system_settings[key] = value
    return {"success": True, "settings": system_settings}


# ============================================
# Audit Log Endpoints
# ============================================

audit_logs: List[Dict] = []

def log_action(user: str, action: str, details: str = ""):
    """Log an action to audit trail"""
    audit_logs.append({
        "timestamp": datetime.now().isoformat(),
        "user": user,
        "action": action,
        "details": details
    })


@app.get("/audit-logs")
async def get_audit_logs(limit: int = 100):
    """Get recent audit logs"""
    # Return demo logs
    demo_logs = [
        {"timestamp": datetime.now().isoformat(), "user": "Dr. Rahul Sharma", "action": "Patient Assessment", "details": "Completed risk assessment for PT-2026-0042"},
        {"timestamp": datetime.now().isoformat(), "user": "System", "action": "Model Retrained", "details": "Accuracy: 99.5%"},
        {"timestamp": datetime.now().isoformat(), "user": "Priya Kumari", "action": "Queue Update", "details": "Called patient PT-2026-0041"},
        {"timestamp": datetime.now().isoformat(), "user": "Admin", "action": "Settings Changed", "details": "Updated session timeout to 30 minutes"},
    ]
    return {"logs": demo_logs + audit_logs[-limit:], "total": len(demo_logs) + len(audit_logs)}


# ============================================
# Error Handlers
# ============================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "timestamp": datetime.now().isoformat(),
            "disclaimer": "This system is for decision SUPPORT only, not diagnosis."
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "An unexpected error occurred",
            "timestamp": datetime.now().isoformat(),
            "disclaimer": "This system is for decision SUPPORT only, not diagnosis."
        }
    )


# ============================================
# Run Application
# ============================================
if __name__ == "__main__":
    import uvicorn
    print("\n" + "=" * 60)
    print("Starting Healthcare Risk Triage API")
    print("Clinical Decision Support System (CDSS)")
    print("=" * 60)
    print(API_DISCLAIMER)
    print("=" * 60 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
