"""
Healthcare Risk Triage AI - Model Package
==========================================

LEGAL DISCLAIMER:
This package provides risk assessment for patient PRIORITIZATION only.
It does NOT diagnose diseases or replace medical professionals.
All outputs must be validated by licensed healthcare providers.
"""

from .risk_engine import (
    HealthcareRiskTriageEngine,
    RiskLevel,
    RiskAssessmentResult,
    generate_synthetic_training_data
)

__version__ = "1.0.0"
__all__ = [
    "HealthcareRiskTriageEngine",
    "RiskLevel", 
    "RiskAssessmentResult",
    "generate_synthetic_training_data"
]
