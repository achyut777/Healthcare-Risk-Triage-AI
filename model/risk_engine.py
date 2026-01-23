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
    disclaimer: str = (
        "⚠️ IMPORTANT: This is a preliminary risk assessment tool for patient prioritization only. "
        "It is NOT a medical diagnosis. All results must be reviewed and validated by a licensed "
        "healthcare professional before any medical decisions are made."
    )


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
        Main risk assessment function.
        
        IMPORTANT: This function provides RISK INDICATORS for patient prioritization.
        It does NOT diagnose any disease or medical condition.
        
        Args:
            patient_data: Dictionary containing patient vitals and symptoms
            
        Returns:
            RiskAssessmentResult with risk level, urgency score, and recommendations
        """
        # Validate input
        is_valid, errors = self._validate_input(patient_data)
        if not is_valid:
            raise ValueError(f"Invalid input data: {', '.join(errors)}")
        
        # Calculate deviation scores for explainability
        deviations = self._calculate_vital_deviation_score(patient_data)
        
        # Rule-based urgency calculation (transparent, auditable)
        urgency_score = self._rule_based_urgency(patient_data, deviations)
        
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
            urgency_score = min(100, max(0, urgency_score))
            
            confidence = max(ml_proba)
        else:
            confidence = 0.7  # Rule-based confidence
        
        # Determine risk level
        risk_level = self._determine_risk_level(urgency_score)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(risk_level, deviations, patient_data)
        
        # Filter contributing factors (show significant ones)
        significant_factors = {k: round(v, 3) for k, v in deviations.items() if v > 0.1}
        
        return RiskAssessmentResult(
            risk_level=risk_level,
            urgency_score=urgency_score,
            contributing_factors=significant_factors,
            recommendations=recommendations,
            confidence=round(confidence, 3)
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
