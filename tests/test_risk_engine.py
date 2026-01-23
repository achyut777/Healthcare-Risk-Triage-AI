"""
Unit Tests for Healthcare Risk Triage Engine
=============================================
Tests for risk categorization (NOT diagnosis validation)

DISCLAIMER: These tests validate system functionality,
not medical accuracy. The system is for patient prioritization only.
"""

import pytest
import numpy as np
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'model'))
from risk_engine import (
    HealthcareRiskTriageEngine,
    RiskLevel,
    RiskAssessmentResult,
    generate_synthetic_training_data
)


class TestHealthcareRiskTriageEngine:
    """Test suite for the risk triage engine"""
    
    @pytest.fixture
    def engine(self):
        """Create and train a test engine"""
        engine = HealthcareRiskTriageEngine()
        X, y = generate_synthetic_training_data(500)
        engine.train(X, y)
        return engine
    
    @pytest.fixture
    def normal_patient(self):
        """Patient with all normal vitals"""
        return {
            'age': 35,
            'gender': 0,
            'heart_rate': 72,
            'bp_systolic': 120,
            'bp_diastolic': 80,
            'temperature': 36.6,
            'oxygen_saturation': 98,
            'respiratory_rate': 16,
            'symptom_duration_days': 2,
            'pain_level': 2
        }
    
    @pytest.fixture
    def high_risk_patient(self):
        """Patient with critical vitals"""
        return {
            'age': 75,
            'gender': 1,
            'heart_rate': 125,
            'bp_systolic': 185,
            'bp_diastolic': 110,
            'temperature': 39.2,
            'oxygen_saturation': 88,
            'respiratory_rate': 28,
            'symptom_duration_days': 1,
            'pain_level': 8
        }
    
    # ============================================
    # Input Validation Tests
    # ============================================
    
    def test_valid_input_accepted(self, engine, normal_patient):
        """Test that valid input is accepted"""
        result = engine.assess_risk(normal_patient)
        assert isinstance(result, RiskAssessmentResult)
    
    def test_missing_field_rejected(self, engine, normal_patient):
        """Test that missing required fields raise ValueError"""
        del normal_patient['heart_rate']
        with pytest.raises(ValueError):
            engine.assess_risk(normal_patient)
    
    def test_invalid_age_rejected(self, engine, normal_patient):
        """Test that invalid age is rejected"""
        normal_patient['age'] = 150
        with pytest.raises(ValueError):
            engine.assess_risk(normal_patient)
    
    def test_invalid_oxygen_saturation_rejected(self, engine, normal_patient):
        """Test that invalid SpO2 is rejected"""
        normal_patient['oxygen_saturation'] = 105
        with pytest.raises(ValueError):
            engine.assess_risk(normal_patient)
    
    def test_invalid_pain_level_rejected(self, engine, normal_patient):
        """Test that invalid pain level is rejected"""
        normal_patient['pain_level'] = 15
        with pytest.raises(ValueError):
            engine.assess_risk(normal_patient)
    
    # ============================================
    # Risk Assessment Output Tests
    # ============================================
    
    def test_result_has_required_fields(self, engine, normal_patient):
        """Test that result contains all required fields"""
        result = engine.assess_risk(normal_patient)
        
        assert hasattr(result, 'risk_level')
        assert hasattr(result, 'urgency_score')
        assert hasattr(result, 'contributing_factors')
        assert hasattr(result, 'recommendations')
        assert hasattr(result, 'confidence')
        assert hasattr(result, 'disclaimer')
    
    def test_urgency_score_in_range(self, engine, normal_patient):
        """Test that urgency score is within 0-100"""
        result = engine.assess_risk(normal_patient)
        assert 0 <= result.urgency_score <= 100
    
    def test_risk_level_is_valid_enum(self, engine, normal_patient):
        """Test that risk level is a valid RiskLevel enum"""
        result = engine.assess_risk(normal_patient)
        assert result.risk_level in [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH]
    
    def test_confidence_in_range(self, engine, normal_patient):
        """Test that confidence is between 0 and 1"""
        result = engine.assess_risk(normal_patient)
        assert 0 <= result.confidence <= 1
    
    def test_disclaimer_always_present(self, engine, normal_patient):
        """Test that disclaimer is always included"""
        result = engine.assess_risk(normal_patient)
        assert len(result.disclaimer) > 50
        assert 'NOT' in result.disclaimer or 'not' in result.disclaimer
    
    # ============================================
    # Risk Categorization Tests
    # ============================================
    
    def test_normal_vitals_low_risk(self, engine, normal_patient):
        """Test that normal vitals result in LOW risk"""
        result = engine.assess_risk(normal_patient)
        assert result.risk_level == RiskLevel.LOW
        assert result.urgency_score < 30
    
    def test_critical_vitals_high_risk(self, engine, high_risk_patient):
        """Test that critical vitals result in HIGH risk"""
        result = engine.assess_risk(high_risk_patient)
        assert result.risk_level == RiskLevel.HIGH
        assert result.urgency_score >= 60
    
    def test_low_oxygen_increases_risk(self, engine, normal_patient):
        """Test that low oxygen saturation increases risk"""
        normal_patient['oxygen_saturation'] = 89
        result = engine.assess_risk(normal_patient)
        assert result.urgency_score >= 30
    
    def test_high_fever_increases_risk(self, engine, normal_patient):
        """Test that high fever increases risk"""
        normal_patient['temperature'] = 39.5
        result = engine.assess_risk(normal_patient)
        assert result.urgency_score >= 15
    
    def test_extreme_age_increases_risk(self, engine, normal_patient):
        """Test that extreme age (very young or old) increases risk"""
        normal_patient['age'] = 85
        result = engine.assess_risk(normal_patient)
        assert result.urgency_score >= 10
    
    # ============================================
    # Explainability Tests
    # ============================================
    
    def test_contributing_factors_returned(self, engine, high_risk_patient):
        """Test that contributing factors are returned"""
        result = engine.assess_risk(high_risk_patient)
        assert len(result.contributing_factors) > 0
    
    def test_low_spo2_flagged_as_factor(self, engine, normal_patient):
        """Test that low SpO2 appears in contributing factors"""
        normal_patient['oxygen_saturation'] = 88
        result = engine.assess_risk(normal_patient)
        assert 'oxygen_saturation' in result.contributing_factors
    
    def test_recommendations_provided(self, engine, normal_patient):
        """Test that recommendations are provided"""
        result = engine.assess_risk(normal_patient)
        assert len(result.recommendations) > 0
    
    # ============================================
    # Model Training Tests
    # ============================================
    
    def test_model_trains_successfully(self):
        """Test that model trains without errors"""
        engine = HealthcareRiskTriageEngine()
        X, y = generate_synthetic_training_data(200)
        metrics = engine.train(X, y)
        
        assert 'train_accuracy' in metrics
        assert 'validation_accuracy' in metrics
        assert engine.is_trained is True
    
    def test_feature_importance_calculated(self):
        """Test that feature importance is calculated after training"""
        engine = HealthcareRiskTriageEngine()
        X, y = generate_synthetic_training_data(200)
        engine.train(X, y)
        
        assert len(engine.feature_importance) > 0
        assert all(0 <= v <= 1 for v in engine.feature_importance.values())
    
    def test_cross_validation_reasonable(self):
        """Test that cross-validation scores are reasonable"""
        engine = HealthcareRiskTriageEngine()
        X, y = generate_synthetic_training_data(500)
        metrics = engine.train(X, y)
        
        # Should have reasonable accuracy (not perfect, not terrible)
        assert 0.5 < metrics['cv_mean'] < 1.0
    
    # ============================================
    # Ethical Compliance Tests
    # ============================================
    
    def test_output_is_risk_not_diagnosis(self, engine, normal_patient):
        """Test that output is labeled as risk, not diagnosis"""
        result = engine.assess_risk(normal_patient)
        
        # Check recommendations don't claim diagnosis
        for rec in result.recommendations:
            assert 'diagnos' not in rec.lower()
            assert 'you have' not in rec.lower()
    
    def test_disclaimer_mentions_not_diagnosis(self, engine, normal_patient):
        """Test that disclaimer explicitly states not a diagnosis"""
        result = engine.assess_risk(normal_patient)
        disclaimer_lower = result.disclaimer.lower()
        
        assert 'not' in disclaimer_lower
        assert ('diagnosis' in disclaimer_lower or 'diagnose' in disclaimer_lower)
    
    def test_recommendations_suggest_validation(self, engine, normal_patient):
        """Test that recommendations include validation requirement"""
        result = engine.assess_risk(normal_patient)
        
        # At least one recommendation should mention verification/validation
        all_recs = ' '.join(result.recommendations).lower()
        assert any(word in all_recs for word in ['verify', 'validate', 'profession', 'doctor', 'healthcare'])


class TestSyntheticDataGeneration:
    """Tests for synthetic data generation"""
    
    def test_generates_correct_shape(self):
        """Test that generated data has correct shape"""
        X, y = generate_synthetic_training_data(100)
        assert X.shape == (100, 10)
        assert y.shape == (100,)
    
    def test_generates_all_classes(self):
        """Test that all risk classes are represented"""
        X, y = generate_synthetic_training_data(500)
        unique_classes = set(y)
        assert 0 in unique_classes  # Low
        assert 1 in unique_classes  # Medium
        assert 2 in unique_classes  # High
    
    def test_values_in_valid_ranges(self):
        """Test that generated values are clinically plausible"""
        X, y = generate_synthetic_training_data(100)
        
        # Age (column 0)
        assert all(0 <= age <= 120 for age in X[:, 0])
        # Heart rate (column 2)
        assert all(30 <= hr <= 200 for hr in X[:, 2])
        # SpO2 (column 6)
        assert all(70 <= spo2 <= 100 for spo2 in X[:, 6])


# ============================================
# Run tests
# ============================================
if __name__ == "__main__":
    pytest.main([__file__, '-v'])
