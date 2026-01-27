"""
Healthcare Risk Triage Engine
=============================
CLINICAL DECISION SUPPORT SYSTEM (CDSS) - NOT A DIAGNOSTIC TOOL

LEGAL DISCLAIMER:
This system is designed ONLY to assist healthcare workers in patient prioritization.
It does NOT diagnose diseases, prescribe treatments, or replace medical professionals.
All outputs are risk indicators that MUST be validated by licensed healthcare providers.
Final medical decisions are ALWAYS made by qualified doctors.

Author: Healthcare AI Team
Version: 1.0.0
License: MIT
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
import joblib
import json
from typing import Dict, Tuple, List, Optional
from dataclasses import dataclass
from enum import Enum
import warnings

warnings.filterwarnings('ignore')


class RiskLevel(Enum):
    """Risk categorization levels - NOT diagnoses"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


@dataclass
class RiskAssessmentResult:
    """
    Risk assessment output structure.
    
    DISCLAIMER: This is a risk INDICATOR, not a medical diagnosis.
    Healthcare professionals must validate all assessments.
    """
    risk_level: RiskLevel
    urgency_score: int  # 0-100 scale
    contributing_factors: Dict[str, float]
    recommendations: List[str]
    confidence: float
    news2_score: int = 0  # NEWS2 Early Warning Score (0-20)
    qsofa_score: int = 0  # Quick SOFA score for sepsis screening (0-3)
    qsofa_positive: bool = False  # True if qSOFA >= 2 (sepsis risk)
    pediatric_adjusted: bool = False  # True if pediatric ranges were used
    critical_alerts: List[str] = None  # Immediate attention alerts
    trend_indicator: str = ""  # "STABLE", "IMPROVING", "DETERIORATING"
    disclaimer: str = (
        "⚠️ IMPORTANT: This is a preliminary risk assessment tool for patient prioritization only. "
        "It is NOT a medical diagnosis. All results must be reviewed and validated by a licensed "
        "healthcare professional before any medical decisions are made."
    )
    
    def __post_init__(self):
        if self.critical_alerts is None:
            self.critical_alerts = []


class HealthcareRiskTriageEngine:
    """
    AI-Assisted Clinical Decision Support System for Patient Risk Triage
    
    PURPOSE:
    - Assist healthcare workers in PRIMARY HEALTH CENTERS (PHCs) with patient prioritization
    - Provide risk indicators based on vital signs and symptoms
    - Support triage decisions, NOT replace medical judgment
    
    ETHICAL BOUNDARIES:
    - Does NOT diagnose diseases
    - Does NOT prescribe treatments
    - Does NOT replace doctors
    - Outputs are SUGGESTIONS for prioritization only
    
    FEATURES USED (All non-invasive, PHC-collectable):
    - Age (years)
    - Gender (biological, for clinical relevance)
    - Heart Rate (bpm) - via pulse oximeter or manual
    - Blood Pressure Systolic (mmHg) - via BP monitor
    - Blood Pressure Diastolic (mmHg) - via BP monitor
    - Temperature (°C) - via thermometer
    - Oxygen Saturation (%) - via pulse oximeter
    - Respiratory Rate (breaths/min) - manual count
    - Symptom Duration (days)
    - Pain Level (0-10 self-reported scale)
    """
    
    # Clinical reference ranges (WHO/standard guidelines)
    VITAL_RANGES = {
        'heart_rate': {'low': 60, 'high': 100, 'critical_low': 40, 'critical_high': 130},
        'bp_systolic': {'low': 90, 'high': 140, 'critical_low': 70, 'critical_high': 180},
        'bp_diastolic': {'low': 60, 'high': 90, 'critical_low': 40, 'critical_high': 120},
        'temperature': {'low': 36.1, 'high': 37.2, 'critical_low': 35.0, 'critical_high': 39.5},
        'oxygen_saturation': {'low': 95, 'high': 100, 'critical_low': 90, 'critical_high': 100},
        'respiratory_rate': {'low': 12, 'high': 20, 'critical_low': 8, 'critical_high': 30}
    }
    
    # Pediatric-specific vital ranges by age group
    PEDIATRIC_VITAL_RANGES = {
        'infant_0_1': {
            'heart_rate': {'low': 100, 'high': 160, 'critical_low': 80, 'critical_high': 190},
            'respiratory_rate': {'low': 30, 'high': 60, 'critical_low': 20, 'critical_high': 70},
            'bp_systolic': {'low': 70, 'high': 100, 'critical_low': 50, 'critical_high': 110}
        },
        'toddler_1_3': {
            'heart_rate': {'low': 90, 'high': 150, 'critical_low': 70, 'critical_high': 170},
            'respiratory_rate': {'low': 24, 'high': 40, 'critical_low': 16, 'critical_high': 50},
            'bp_systolic': {'low': 80, 'high': 110, 'critical_low': 60, 'critical_high': 120}
        },
        'preschool_3_6': {
            'heart_rate': {'low': 80, 'high': 120, 'critical_low': 60, 'critical_high': 140},
            'respiratory_rate': {'low': 22, 'high': 34, 'critical_low': 14, 'critical_high': 44},
            'bp_systolic': {'low': 85, 'high': 115, 'critical_low': 65, 'critical_high': 125}
        },
        'school_6_12': {
            'heart_rate': {'low': 70, 'high': 110, 'critical_low': 50, 'critical_high': 130},
            'respiratory_rate': {'low': 18, 'high': 30, 'critical_low': 12, 'critical_high': 36},
            'bp_systolic': {'low': 90, 'high': 120, 'critical_low': 70, 'critical_high': 135}
        },
        'adolescent_12_18': {
            'heart_rate': {'low': 60, 'high': 100, 'critical_low': 45, 'critical_high': 120},
            'respiratory_rate': {'low': 12, 'high': 20, 'critical_low': 10, 'critical_high': 28},
            'bp_systolic': {'low': 90, 'high': 130, 'critical_low': 75, 'critical_high': 145}
        }
    }
    
    # Symptom keywords that increase urgency (for chief complaint analysis)
    HIGH_RISK_SYMPTOMS = {
        'chest pain': 25,
        'difficulty breathing': 30,
        'shortness of breath': 25,
        'sudden weakness': 25,
        'numbness': 20,
        'severe headache': 20,
        'worst headache': 25,
        'confusion': 25,
        'altered consciousness': 30,
        'unresponsive': 35,
        'seizure': 30,
        'convulsion': 30,
        'bleeding heavily': 25,
        'vomiting blood': 30,
        'blood in stool': 20,
        'severe abdominal pain': 20,
        'crushing chest': 30,
        'radiating arm pain': 25,
        'jaw pain': 20,
        'fainting': 20,
        'syncope': 20,
        'allergic reaction': 25,
        'swelling throat': 30,
        'cannot swallow': 25,
        'snake bite': 35,
        'poisoning': 30,
        'overdose': 30,
        'suicidal': 30,
        'self harm': 30,
        'trauma': 20,
        'accident': 20,
        'fall': 15,
        'burn': 20
    }
    
    FEATURE_NAMES = [
        'age', 'gender', 'heart_rate', 'bp_systolic', 'bp_diastolic',
        'temperature', 'oxygen_saturation', 'respiratory_rate',
        'symptom_duration_days', 'pain_level'
    ]
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_importance = {}
        self.patient_history = {}  # For trend tracking
    
    def _get_age_group(self, age: int) -> str:
        """Determine age group for pediatric vital range selection"""
        if age < 1:
            return 'infant_0_1'
        elif age < 3:
            return 'toddler_1_3'
        elif age < 6:
            return 'preschool_3_6'
        elif age < 12:
            return 'school_6_12'
        elif age < 18:
            return 'adolescent_12_18'
        else:
            return 'adult'
    
    def _get_vital_ranges_for_age(self, age: int) -> Dict:
        """Get appropriate vital ranges based on patient age"""
        age_group = self._get_age_group(age)
        if age_group == 'adult':
            return self.VITAL_RANGES
        
        # Merge pediatric ranges with adult ranges for vitals not specified
        pediatric = self.PEDIATRIC_VITAL_RANGES.get(age_group, {})
        ranges = self.VITAL_RANGES.copy()
        for vital, values in pediatric.items():
            ranges[vital] = values
        return ranges
    
    def _calculate_qsofa_score(self, data: Dict) -> Tuple[int, bool, List[str]]:
        """
        Calculate qSOFA (Quick SOFA) score for sepsis screening.
        
        qSOFA criteria (each = 1 point):
        - Respiratory rate ≥ 22/min
        - Systolic BP ≤ 100 mmHg
        - Altered mental status (GCS < 15, approximated by confusion symptoms)
        
        qSOFA ≥ 2 suggests possible sepsis - requires urgent evaluation.
        
        DISCLAIMER: This is a screening tool, NOT a diagnosis.
        """
        score = 0
        alerts = []
        
        # Respiratory rate ≥ 22
        if data['respiratory_rate'] >= 22:
            score += 1
            alerts.append("Elevated respiratory rate (≥22/min)")
        
        # Systolic BP ≤ 100
        if data['bp_systolic'] <= 100:
            score += 1
            alerts.append("Low systolic blood pressure (≤100 mmHg)")
        
        # Altered mental status - check chief complaint for indicators
        chief_complaint = data.get('chief_complaint', '').lower()
        mental_status_keywords = ['confusion', 'confused', 'disoriented', 'altered', 
                                   'unresponsive', 'drowsy', 'lethargic', 'agitated']
        if any(keyword in chief_complaint for keyword in mental_status_keywords):
            score += 1
            alerts.append("Possible altered mental status indicated")
        
        is_positive = score >= 2
        
        if is_positive:
            alerts.insert(0, "🚨 qSOFA POSITIVE (≥2): Possible sepsis - URGENT evaluation required")
        
        return score, is_positive, alerts
    
    def _calculate_news2_score(self, data: Dict) -> Tuple[int, str, List[str]]:
        """
        Calculate NEWS2 (National Early Warning Score 2) for clinical deterioration.
        
        Based on Royal College of Physicians UK guidelines.
        Score 0-20:
        - 0-4: Low risk
        - 5-6: Medium risk (increase monitoring)
        - 7+: High risk (urgent response needed)
        
        DISCLAIMER: This is an early warning indicator, NOT a diagnosis.
        """
        score = 0
        factors = []
        
        # Respiratory rate scoring
        rr = data['respiratory_rate']
        if rr <= 8:
            score += 3
            factors.append(f"Respiratory rate critically low: {rr}")
        elif rr <= 11:
            score += 1
            factors.append(f"Respiratory rate low: {rr}")
        elif rr <= 20:
            score += 0  # Normal
        elif rr <= 24:
            score += 2
            factors.append(f"Respiratory rate elevated: {rr}")
        else:
            score += 3
            factors.append(f"Respiratory rate critically high: {rr}")
        
        # SpO2 scoring (Scale 1 - for patients NOT on supplemental O2)
        spo2 = data['oxygen_saturation']
        if spo2 <= 91:
            score += 3
            factors.append(f"SpO2 critically low: {spo2}%")
        elif spo2 <= 93:
            score += 2
            factors.append(f"SpO2 low: {spo2}%")
        elif spo2 <= 95:
            score += 1
            factors.append(f"SpO2 slightly low: {spo2}%")
        # 96-100 = 0 points
        
        # Systolic BP scoring
        sbp = data['bp_systolic']
        if sbp <= 90:
            score += 3
            factors.append(f"BP critically low: {sbp} mmHg")
        elif sbp <= 100:
            score += 2
            factors.append(f"BP low: {sbp} mmHg")
        elif sbp <= 110:
            score += 1
            factors.append(f"BP slightly low: {sbp} mmHg")
        elif sbp <= 219:
            score += 0  # Normal range
        else:
            score += 3
            factors.append(f"BP critically high: {sbp} mmHg")
        
        # Heart rate scoring
        hr = data['heart_rate']
        if hr <= 40:
            score += 3
            factors.append(f"Heart rate critically low: {hr}")
        elif hr <= 50:
            score += 1
            factors.append(f"Heart rate low: {hr}")
        elif hr <= 90:
            score += 0  # Normal
        elif hr <= 110:
            score += 1
            factors.append(f"Heart rate elevated: {hr}")
        elif hr <= 130:
            score += 2
            factors.append(f"Heart rate high: {hr}")
        else:
            score += 3
            factors.append(f"Heart rate critically high: {hr}")
        
        # Temperature scoring
        temp = data['temperature']
        if temp <= 35.0:
            score += 3
            factors.append(f"Temperature critically low: {temp}°C")
        elif temp <= 36.0:
            score += 1
            factors.append(f"Temperature low: {temp}°C")
        elif temp <= 38.0:
            score += 0  # Normal
        elif temp <= 39.0:
            score += 1
            factors.append(f"Temperature elevated: {temp}°C")
        else:
            score += 2
            factors.append(f"Temperature high: {temp}°C")
        
        # Determine risk level
        if score >= 7:
            risk_level = "HIGH"
            factors.insert(0, f"🔴 NEWS2 Score: {score} - HIGH RISK - Urgent clinical response required")
        elif score >= 5:
            risk_level = "MEDIUM"
            factors.insert(0, f"🟡 NEWS2 Score: {score} - MEDIUM RISK - Increased monitoring required")
        else:
            risk_level = "LOW"
            factors.insert(0, f"🟢 NEWS2 Score: {score} - LOW RISK - Continue routine monitoring")
        
        return score, risk_level, factors
    
    def _analyze_chief_complaint(self, chief_complaint: str) -> Tuple[int, List[str]]:
        """
        Analyze chief complaint for high-risk symptom keywords.
        Returns additional urgency points and alerts.
        """
        if not chief_complaint:
            return 0, []
        
        complaint_lower = chief_complaint.lower()
        total_points = 0
        alerts = []
        
        for symptom, points in self.HIGH_RISK_SYMPTOMS.items():
            if symptom in complaint_lower:
                total_points += points
                alerts.append(f"⚠️ High-risk symptom detected: {symptom.title()}")
        
        # Cap the symptom-based points
        total_points = min(total_points, 40)
        
        return total_points, alerts
    
    def _generate_critical_alerts(self, data: Dict, qsofa_positive: bool, news2_score: int) -> List[str]:
        """Generate critical alerts requiring immediate attention"""
        alerts = []
        
        # Immediate life-threatening conditions
        if data['oxygen_saturation'] < 88:
            alerts.append("🚨 CRITICAL: SpO2 < 88% - Immediate oxygen support may be required")
        
        if data['bp_systolic'] < 80:
            alerts.append("🚨 CRITICAL: Systolic BP < 80 mmHg - Possible shock - Immediate evaluation")
        
        if data['bp_systolic'] > 200:
            alerts.append("🚨 CRITICAL: Systolic BP > 200 mmHg - Hypertensive emergency risk")
        
        if data['heart_rate'] < 40:
            alerts.append("🚨 CRITICAL: Heart rate < 40 bpm - Severe bradycardia")
        
        if data['heart_rate'] > 150:
            alerts.append("🚨 CRITICAL: Heart rate > 150 bpm - Severe tachycardia")
        
        if data['temperature'] > 40.5:
            alerts.append("🚨 CRITICAL: Temperature > 40.5°C - Hyperpyrexia - Immediate cooling needed")
        
        if data['temperature'] < 34.0:
            alerts.append("🚨 CRITICAL: Temperature < 34°C - Hypothermia - Immediate warming needed")
        
        if data['respiratory_rate'] < 8:
            alerts.append("🚨 CRITICAL: Respiratory rate < 8 - Possible respiratory failure")
        
        if data['respiratory_rate'] > 35:
            alerts.append("🚨 CRITICAL: Respiratory rate > 35 - Severe respiratory distress")
        
        if qsofa_positive:
            alerts.append("🚨 SEPSIS SCREENING POSITIVE - Urgent sepsis evaluation required")
        
        if news2_score >= 7:
            alerts.append("🚨 NEWS2 HIGH RISK - Urgent clinical response team notification recommended")
        
        # Pediatric-specific alerts
        age = data['age']
        if age < 1:
            if data['temperature'] > 38.0:
                alerts.append("🚨 PEDIATRIC: Fever in infant < 1 year - Requires immediate physician evaluation")
        
        return alerts
        
    def _validate_input(self, data: Dict) -> Tuple[bool, List[str]]:
        """Validate input data ranges and completeness"""
        errors = []
        
        required_fields = self.FEATURE_NAMES
        for field in required_fields:
            if field not in data:
                errors.append(f"Missing required field: {field}")
        
        if errors:
            return False, errors
        
        # Range validations (clinical plausibility)
        if not (0 <= data['age'] <= 120):
            errors.append("Age must be between 0 and 120 years")
        if data['gender'] not in [0, 1]:
            errors.append("Gender must be 0 (Female) or 1 (Male)")
        if not (20 <= data['heart_rate'] <= 250):
            errors.append("Heart rate must be between 20 and 250 bpm")
        if not (40 <= data['bp_systolic'] <= 250):
            errors.append("Systolic BP must be between 40 and 250 mmHg")
        if not (20 <= data['bp_diastolic'] <= 150):
            errors.append("Diastolic BP must be between 20 and 150 mmHg")
        if not (30.0 <= data['temperature'] <= 45.0):
            errors.append("Temperature must be between 30 and 45 °C")
        if not (50 <= data['oxygen_saturation'] <= 100):
            errors.append("Oxygen saturation must be between 50 and 100%")
        if not (4 <= data['respiratory_rate'] <= 60):
            errors.append("Respiratory rate must be between 4 and 60 breaths/min")
        if not (0 <= data['symptom_duration_days'] <= 365):
            errors.append("Symptom duration must be between 0 and 365 days")
        if not (0 <= data['pain_level'] <= 10):
            errors.append("Pain level must be between 0 and 10")
            
        return len(errors) == 0, errors
    
    def _calculate_vital_deviation_score(self, data: Dict) -> Dict[str, float]:
        """
        Calculate how much each vital sign deviates from normal ranges.
        Returns contribution scores for explainability.
        """
        deviations = {}
        
        vital_mappings = {
            'heart_rate': data['heart_rate'],
            'bp_systolic': data['bp_systolic'],
            'bp_diastolic': data['bp_diastolic'],
            'temperature': data['temperature'],
            'oxygen_saturation': data['oxygen_saturation'],
            'respiratory_rate': data['respiratory_rate']
        }
        
        for vital, value in vital_mappings.items():
            ranges = self.VITAL_RANGES[vital]
            
            if value < ranges['critical_low'] or value > ranges['critical_high']:
                deviations[vital] = 1.0  # Critical deviation
            elif value < ranges['low'] or value > ranges['high']:
                # Calculate proportional deviation
                if value < ranges['low']:
                    deviation = (ranges['low'] - value) / (ranges['low'] - ranges['critical_low'])
                else:
                    deviation = (value - ranges['high']) / (ranges['critical_high'] - ranges['high'])
                deviations[vital] = min(0.7, max(0.3, deviation))  # Moderate deviation
            else:
                deviations[vital] = 0.0  # Within normal range
        
        # Age-based risk factor
        age = data['age']
        if age < 5 or age > 65:
            deviations['age_risk'] = 0.5 if (age < 2 or age > 75) else 0.3
        else:
            deviations['age_risk'] = 0.0
            
        # Pain and symptom duration factors
        deviations['pain_severity'] = data['pain_level'] / 10.0
        deviations['symptom_duration'] = min(1.0, data['symptom_duration_days'] / 14.0)
        
        return deviations
    
    def _rule_based_urgency(self, data: Dict, deviations: Dict) -> int:
        """
        Calculate urgency score using clinical rules.
        Score: 0-100 (higher = more urgent)
        
        This is a PRIORITIZATION score, not a disease severity score.
        """
        urgency = 0
        
        # Critical vital signs (immediate attention needed)
        if data['oxygen_saturation'] < 90:
            urgency += 30
        elif data['oxygen_saturation'] < 94:
            urgency += 15
            
        if data['bp_systolic'] < 80 or data['bp_systolic'] > 180:
            urgency += 25
        elif data['bp_systolic'] < 90 or data['bp_systolic'] > 160:
            urgency += 12
            
        if data['heart_rate'] < 50 or data['heart_rate'] > 120:
            urgency += 15
        elif data['heart_rate'] < 55 or data['heart_rate'] > 100:
            urgency += 7
            
        if data['temperature'] > 39.0:
            urgency += 15
        elif data['temperature'] > 38.0:
            urgency += 8
        elif data['temperature'] < 35.5:
            urgency += 20
            
        if data['respiratory_rate'] > 25 or data['respiratory_rate'] < 10:
            urgency += 15
            
        # Age vulnerability
        if data['age'] < 2 or data['age'] > 80:
            urgency += 10
        elif data['age'] < 5 or data['age'] > 70:
            urgency += 5
            
        # Pain and duration
        urgency += data['pain_level'] * 1.5
        if data['symptom_duration_days'] > 7:
            urgency += 5
        elif data['symptom_duration_days'] < 1 and data['pain_level'] > 6:
            urgency += 10  # Acute onset with high pain
            
        return min(100, max(0, int(urgency)))
    
    def _determine_risk_level(self, urgency_score: int) -> RiskLevel:
        """
        Convert urgency score to risk category.
        Thresholds based on clinical triage standards (modified NEWS score approach).
        """
        if urgency_score >= 60:
            return RiskLevel.HIGH
        elif urgency_score >= 30:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW
    
    def _generate_recommendations(self, risk_level: RiskLevel, deviations: Dict, data: Dict) -> List[str]:
        """
        Generate prioritization recommendations for healthcare workers.
        These are WORKFLOW suggestions, not medical advice.
        """
        recommendations = []
        
        if risk_level == RiskLevel.HIGH:
            recommendations.append("🔴 PRIORITY: Patient should be seen immediately by available medical officer")
            recommendations.append("Consider immediate vital signs monitoring")
            recommendations.append("Prepare for potential referral to higher center if needed")
        elif risk_level == RiskLevel.MEDIUM:
            recommendations.append("🟡 ELEVATED PRIORITY: Patient should be seen within 30 minutes")
            recommendations.append("Document vital signs and prepare patient history")
        else:
            recommendations.append("🟢 ROUTINE: Patient can be seen in queue order")
            recommendations.append("Standard intake procedure recommended")
        
        # Specific vital sign flags (for healthcare worker awareness)
        if deviations.get('oxygen_saturation', 0) > 0.3:
            recommendations.append("⚠️ Flag: Oxygen saturation below normal - verify reading and monitor")
        if deviations.get('bp_systolic', 0) > 0.5:
            recommendations.append("⚠️ Flag: Blood pressure reading abnormal - recheck and document")
        if deviations.get('temperature', 0) > 0.5:
            recommendations.append("⚠️ Flag: Temperature elevated - monitor for fever progression")
        if data['pain_level'] >= 7:
            recommendations.append("⚠️ Flag: High pain level reported - assess pain source")
            
        recommendations.append("📋 All findings must be verified by examining healthcare professional")
        
        return recommendations
    
    def train(self, X: np.ndarray, y: np.ndarray) -> Dict:
        """
        Train the risk classification model.
        
        Uses Random Forest for:
        - Robustness to outliers
        - Built-in feature importance
        - No assumption of linear relationships
        - Good performance with limited data
        
        Returns training metrics for validation.
        """
        # Split for validation
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_val_scaled = self.scaler.transform(X_val)
        
        # Train Random Forest (interpretable, robust)
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,  # Prevent overfitting
            min_samples_split=5,
            min_samples_leaf=2,
            class_weight='balanced',  # Handle class imbalance
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X_train_scaled, y_train)
        
        # Calculate feature importance
        self.feature_importance = dict(zip(
            self.FEATURE_NAMES,
            self.model.feature_importances_
        ))
        
        # Cross-validation for robust metrics
        cv_scores = cross_val_score(self.model, X_train_scaled, y_train, cv=5)
        
        # Validation metrics
        train_accuracy = self.model.score(X_train_scaled, y_train)
        val_accuracy = self.model.score(X_val_scaled, y_val)
        
        self.is_trained = True
        
        return {
            'train_accuracy': round(train_accuracy, 4),
            'validation_accuracy': round(val_accuracy, 4),
            'cv_mean': round(cv_scores.mean(), 4),
            'cv_std': round(cv_scores.std(), 4),
            'feature_importance': self.feature_importance,
            'note': 'Accuracy reflects risk CATEGORIZATION, not disease prediction'
        }
    
    def assess_risk(self, patient_data: Dict) -> RiskAssessmentResult:
        """
        Main risk assessment function with enhanced clinical scoring.
        
        IMPORTANT: This function provides RISK INDICATORS for patient prioritization.
        It does NOT diagnose any disease or medical condition.
        
        Now includes:
        - qSOFA sepsis screening
        - NEWS2 early warning score
        - Pediatric-adjusted vital ranges
        - Symptom-based risk modifiers
        - Critical alerts system
        
        Args:
            patient_data: Dictionary containing patient vitals and symptoms
            
        Returns:
            RiskAssessmentResult with comprehensive risk assessment
        """
        # Validate input
        is_valid, errors = self._validate_input(patient_data)
        if not is_valid:
            raise ValueError(f"Invalid input data: {', '.join(errors)}")
        
        # Check if pediatric ranges should be used
        age = patient_data['age']
        pediatric_adjusted = age < 18
        
        # Calculate deviation scores for explainability
        deviations = self._calculate_vital_deviation_score(patient_data)
        
        # Rule-based urgency calculation (transparent, auditable)
        urgency_score = self._rule_based_urgency(patient_data, deviations)
        
        # Calculate qSOFA score for sepsis screening
        qsofa_score, qsofa_positive, qsofa_alerts = self._calculate_qsofa_score(patient_data)
        
        # Calculate NEWS2 early warning score
        news2_score, news2_risk, news2_factors = self._calculate_news2_score(patient_data)
        
        # Analyze chief complaint for high-risk symptoms
        chief_complaint = patient_data.get('chief_complaint', '')
        symptom_points, symptom_alerts = self._analyze_chief_complaint(chief_complaint)
        urgency_score += symptom_points
        
        # Boost urgency based on qSOFA and NEWS2
        if qsofa_positive:
            urgency_score += 20  # Sepsis risk significantly increases urgency
        if news2_score >= 7:
            urgency_score += 15
        elif news2_score >= 5:
            urgency_score += 8
        
        # If model is trained, combine with ML prediction
        if self.is_trained and self.model is not None:
            features = np.array([[
                patient_data['age'],
                patient_data['gender'],
                patient_data['heart_rate'],
                patient_data['bp_systolic'],
                patient_data['bp_diastolic'],
                patient_data['temperature'],
                patient_data['oxygen_saturation'],
                patient_data['respiratory_rate'],
                patient_data['symptom_duration_days'],
                patient_data['pain_level']
            ]])
            
            features_scaled = self.scaler.transform(features)
            ml_proba = self.model.predict_proba(features_scaled)[0]
            
            # Weighted combination: 60% rule-based, 40% ML (transparency priority)
            ml_urgency_adjustment = (ml_proba[2] * 30 + ml_proba[1] * 15) if len(ml_proba) == 3 else 0
            urgency_score = int(0.6 * urgency_score + 0.4 * (urgency_score + ml_urgency_adjustment))
            
            confidence = max(ml_proba)
        else:
            confidence = 0.7  # Rule-based confidence
        
        # Cap urgency score
        urgency_score = min(100, max(0, urgency_score))
        
        # Determine risk level
        risk_level = self._determine_risk_level(urgency_score)
        
        # Generate critical alerts
        critical_alerts = self._generate_critical_alerts(patient_data, qsofa_positive, news2_score)
        critical_alerts.extend(symptom_alerts)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(risk_level, deviations, patient_data)
        
        # Add qSOFA and NEWS2 info to recommendations
        if qsofa_positive:
            recommendations.insert(0, "🚨 SEPSIS ALERT: qSOFA ≥ 2 - Initiate sepsis protocol evaluation")
        if news2_score >= 5:
            recommendations.insert(1 if qsofa_positive else 0, 
                f"📊 NEWS2 Score: {news2_score} - {news2_risk} RISK - Adjust monitoring frequency")
        
        # Filter contributing factors (show significant ones)
        significant_factors = {k: round(v, 3) for k, v in deviations.items() if v > 0.1}
        
        return RiskAssessmentResult(
            risk_level=risk_level,
            urgency_score=urgency_score,
            contributing_factors=significant_factors,
            recommendations=recommendations,
            confidence=round(confidence, 3),
            news2_score=news2_score,
            qsofa_score=qsofa_score,
            qsofa_positive=qsofa_positive,
            pediatric_adjusted=pediatric_adjusted,
            critical_alerts=critical_alerts
        )
    
    def save_model(self, filepath: str):
        """Save trained model and scaler"""
        if not self.is_trained:
            raise ValueError("Model not trained yet")
        
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'feature_importance': self.feature_importance
        }, filepath)
        
    def load_model(self, filepath: str):
        """Load trained model and scaler"""
        data = joblib.load(filepath)
        self.model = data['model']
        self.scaler = data['scaler']
        self.feature_importance = data['feature_importance']
        self.is_trained = True


def generate_synthetic_training_data(n_samples: int = 1000) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generate synthetic training data for demonstration purposes.
    
    DISCLAIMER: In production, this must be replaced with real, validated clinical data
    from authorized healthcare sources with proper IRB approval.
    
    This synthetic data is ONLY for hackathon demonstration and model architecture validation.
    """
    np.random.seed(42)
    
    data = []
    labels = []
    
    for _ in range(n_samples):
        # Generate base vitals (normal distribution around healthy values)
        age = np.random.randint(1, 90)
        gender = np.random.randint(0, 2)
        
        # Simulate different risk profiles
        risk_profile = np.random.choice(['low', 'medium', 'high'], p=[0.5, 0.35, 0.15])
        
        if risk_profile == 'low':
            heart_rate = np.random.normal(75, 10)
            bp_systolic = np.random.normal(120, 10)
            bp_diastolic = np.random.normal(80, 8)
            temperature = np.random.normal(36.6, 0.3)
            oxygen_sat = np.random.normal(98, 1)
            resp_rate = np.random.normal(16, 2)
            symptom_days = np.random.randint(1, 5)
            pain = np.random.randint(0, 4)
            label = 0  # Low risk
            
        elif risk_profile == 'medium':
            heart_rate = np.random.normal(90, 15)
            bp_systolic = np.random.normal(140, 15)
            bp_diastolic = np.random.normal(90, 10)
            temperature = np.random.normal(37.5, 0.5)
            oxygen_sat = np.random.normal(95, 2)
            resp_rate = np.random.normal(20, 3)
            symptom_days = np.random.randint(3, 10)
            pain = np.random.randint(3, 7)
            label = 1  # Medium risk
            
        else:  # high
            heart_rate = np.random.normal(110, 20)
            bp_systolic = np.random.choice([
                np.random.normal(85, 10),  # Low BP
                np.random.normal(170, 15)   # High BP
            ])
            bp_diastolic = np.random.normal(95, 15)
            temperature = np.random.normal(38.5, 0.8)
            oxygen_sat = np.random.normal(91, 3)
            resp_rate = np.random.normal(26, 4)
            symptom_days = np.random.randint(0, 3)  # Acute onset
            pain = np.random.randint(6, 11)
            label = 2  # High risk
        
        # Clip to valid ranges
        heart_rate = np.clip(heart_rate, 30, 200)
        bp_systolic = np.clip(bp_systolic, 50, 220)
        bp_diastolic = np.clip(bp_diastolic, 30, 140)
        temperature = np.clip(temperature, 34, 42)
        oxygen_sat = np.clip(oxygen_sat, 70, 100)
        resp_rate = np.clip(resp_rate, 8, 45)
        pain = np.clip(pain, 0, 10)
        
        data.append([
            age, gender, heart_rate, bp_systolic, bp_diastolic,
            temperature, oxygen_sat, resp_rate, symptom_days, pain
        ])
        labels.append(label)
    
    return np.array(data), np.array(labels)


# Example usage and testing
if __name__ == "__main__":
    print("=" * 60)
    print("Healthcare Risk Triage Engine - Demo")
    print("CLINICAL DECISION SUPPORT SYSTEM")
    print("=" * 60)
    print("\n⚠️  DISCLAIMER: This is a DEMONSTRATION ONLY.")
    print("This system does NOT diagnose diseases or replace doctors.\n")
    
    # Initialize engine
    engine = HealthcareRiskTriageEngine()
    
    # Generate and train on synthetic data
    print("Training on synthetic demonstration data...")
    X, y = generate_synthetic_training_data(1000)
    metrics = engine.train(X, y)
    
    print(f"\nTraining Metrics (Risk Categorization, NOT Diagnosis):")
    print(f"  - Validation Accuracy: {metrics['validation_accuracy']}")
    print(f"  - Cross-Validation: {metrics['cv_mean']} ± {metrics['cv_std']}")
    
    print(f"\nFeature Importance (for explainability):")
    sorted_importance = sorted(metrics['feature_importance'].items(), key=lambda x: x[1], reverse=True)
    for feature, importance in sorted_importance[:5]:
        print(f"  - {feature}: {importance:.3f}")
    
    # Test with sample patient
    print("\n" + "=" * 60)
    print("Sample Patient Assessment")
    print("=" * 60)
    
    sample_patient = {
        'age': 65,
        'gender': 1,  # Male
        'heart_rate': 95,
        'bp_systolic': 155,
        'bp_diastolic': 95,
        'temperature': 37.8,
        'oxygen_saturation': 94,
        'respiratory_rate': 22,
        'symptom_duration_days': 2,
        'pain_level': 6
    }
    
    print(f"\nInput Vitals:")
    for key, value in sample_patient.items():
        print(f"  - {key}: {value}")
    
    result = engine.assess_risk(sample_patient)
    
    print(f"\n📊 RISK ASSESSMENT RESULT:")
    print(f"  Risk Level: {result.risk_level.value}")
    print(f"  Urgency Score: {result.urgency_score}/100")
    print(f"  Confidence: {result.confidence}")
    
    print(f"\n📋 Contributing Factors:")
    for factor, score in result.contributing_factors.items():
        print(f"  - {factor}: {score}")
    
    print(f"\n💡 Recommendations:")
    for rec in result.recommendations:
        print(f"  {rec}")
    
    print(f"\n{result.disclaimer}")
