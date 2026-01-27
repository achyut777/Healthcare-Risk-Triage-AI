"""
Healthcare Risk Triage AI - Backend Configuration
=================================================
Centralized configuration management using environment variables
and sensible defaults for development and production.
"""

import os
from typing import Optional
from dataclasses import dataclass, field
from functools import lru_cache


@dataclass
class Settings:
    """
    Application settings with environment variable support.
    
    Usage:
        from config import get_settings
        settings = get_settings()
        print(settings.API_HOST)
    """
    
    # ============================
    # API Settings
    # ============================
    API_TITLE: str = "Healthcare Risk Triage API"
    API_DESCRIPTION: str = "Clinical Decision Support System (CDSS) for Patient Risk Triage"
    API_VERSION: str = "1.0.0"
    API_HOST: str = field(default_factory=lambda: os.getenv("API_HOST", "0.0.0.0"))
    API_PORT: int = field(default_factory=lambda: int(os.getenv("API_PORT", "8000")))
    DEBUG: bool = field(default_factory=lambda: os.getenv("DEBUG", "false").lower() == "true")
    
    # ============================
    # CORS Settings
    # ============================
    CORS_ORIGINS: list = field(default_factory=lambda: os.getenv(
        "CORS_ORIGINS", 
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5500,http://127.0.0.1:5500"
    ).split(","))
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list = field(default_factory=lambda: ["*"])
    CORS_ALLOW_HEADERS: list = field(default_factory=lambda: ["*"])
    
    # ============================
    # Model Settings
    # ============================
    MODEL_PATH: Optional[str] = field(default_factory=lambda: os.getenv("MODEL_PATH"))
    TRAINING_DATA_SIZE: int = field(default_factory=lambda: int(os.getenv("TRAINING_DATA_SIZE", "1000")))
    MODEL_CONFIDENCE_THRESHOLD: float = field(default_factory=lambda: float(os.getenv("MODEL_CONFIDENCE_THRESHOLD", "0.85")))
    RULE_WEIGHT: float = field(default_factory=lambda: float(os.getenv("RULE_WEIGHT", "0.6")))
    
    # ============================
    # Facility Settings
    # ============================
    FACILITY_NAME: str = field(default_factory=lambda: os.getenv("FACILITY_NAME", "Primary Health Centre"))
    FACILITY_CODE: str = field(default_factory=lambda: os.getenv("FACILITY_CODE", "PHC-001"))
    QUEUE_PREFIX: str = field(default_factory=lambda: os.getenv("QUEUE_PREFIX", "PT-2026-"))
    MAX_QUEUE_SIZE: int = field(default_factory=lambda: int(os.getenv("MAX_QUEUE_SIZE", "100")))
    
    # ============================
    # Session Settings
    # ============================
    SESSION_TIMEOUT_MINUTES: int = field(default_factory=lambda: int(os.getenv("SESSION_TIMEOUT_MINUTES", "30")))
    SECRET_KEY: str = field(default_factory=lambda: os.getenv(
        "SECRET_KEY", 
        "dev-secret-key-change-in-production-please"
    ))
    
    # ============================
    # Logging Settings
    # ============================
    LOG_LEVEL: str = field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO"))
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    def __post_init__(self):
        """Validate settings after initialization."""
        if self.DEBUG:
            print("⚠️  Running in DEBUG mode - not suitable for production!")
        
        if self.SECRET_KEY == "dev-secret-key-change-in-production-please" and not self.DEBUG:
            print("⚠️  WARNING: Using default SECRET_KEY - change this in production!")


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Uses lru_cache to ensure only one settings instance exists.
    """
    return Settings()


# ============================
# Environment Detection
# ============================
def is_production() -> bool:
    """Check if running in production environment."""
    return os.getenv("ENVIRONMENT", "development").lower() == "production"


def is_development() -> bool:
    """Check if running in development environment."""
    return not is_production()


# ============================
# API Disclaimer (Legal)
# ============================
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


# ============================
# Vital Signs Reference Ranges
# ============================
VITAL_RANGES = {
    'heart_rate': {
        'low': 60, 
        'high': 100, 
        'critical_low': 40, 
        'critical_high': 130,
        'unit': 'bpm'
    },
    'bp_systolic': {
        'low': 90, 
        'high': 140, 
        'critical_low': 70, 
        'critical_high': 180,
        'unit': 'mmHg'
    },
    'bp_diastolic': {
        'low': 60, 
        'high': 90, 
        'critical_low': 40, 
        'critical_high': 120,
        'unit': 'mmHg'
    },
    'temperature': {
        'low': 36.1, 
        'high': 37.2, 
        'critical_low': 35.0, 
        'critical_high': 39.5,
        'unit': '°C'
    },
    'oxygen_saturation': {
        'low': 95, 
        'high': 100, 
        'critical_low': 90, 
        'critical_high': 100,
        'unit': '%'
    },
    'respiratory_rate': {
        'low': 12, 
        'high': 20, 
        'critical_low': 8, 
        'critical_high': 30,
        'unit': 'breaths/min'
    }
}
