/**
 * Application Constants & Configuration
 */

export const RISK_LEVELS = {
  critical: {
    threshold: 70,
    label: 'Critical',
    description: 'Immediate medical attention required',
    color: 'red'
  },
  high: {
    threshold: 50,
    label: 'High',
    description: 'Priority consultation needed',
    color: 'orange'
  },
  medium: {
    threshold: 30,
    label: 'Medium',
    description: 'Scheduled consultation recommended',
    color: 'yellow'
  },
  low: {
    threshold: 0,
    label: 'Low',
    description: 'Standard care protocol',
    color: 'green'
  }
};

export const QUEUE_PRIORITIES = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

export const VITAL_RANGES = {
  heartRate: { low: 60, high: 100, critical_low: 40, critical_high: 130, unit: 'bpm' },
  bpSystolic: { low: 90, high: 140, critical_low: 70, critical_high: 180, unit: 'mmHg' },
  bpDiastolic: { low: 60, high: 90, critical_low: 40, critical_high: 120, unit: 'mmHg' },
  temperature: { low: 36.1, high: 37.2, critical_low: 35.0, critical_high: 39.5, unit: '°C' },
  oxygenSaturation: { low: 95, high: 100, critical_low: 90, critical_high: 100, unit: '%' },
  respiratoryRate: { low: 12, high: 20, critical_low: 8, critical_high: 30, unit: 'breaths/min' }
};

// Pediatric-specific vital ranges by age group
export const PEDIATRIC_VITAL_RANGES = {
  infant_0_1: {
    heartRate: { low: 100, high: 160, critical_low: 80, critical_high: 190 },
    respiratoryRate: { low: 30, high: 60, critical_low: 20, critical_high: 70 },
    bpSystolic: { low: 70, high: 100, critical_low: 50, critical_high: 110 }
  },
  toddler_1_3: {
    heartRate: { low: 90, high: 150, critical_low: 70, critical_high: 170 },
    respiratoryRate: { low: 24, high: 40, critical_low: 16, critical_high: 50 },
    bpSystolic: { low: 80, high: 110, critical_low: 60, critical_high: 120 }
  },
  preschool_3_6: {
    heartRate: { low: 80, high: 120, critical_low: 60, critical_high: 140 },
    respiratoryRate: { low: 22, high: 34, critical_low: 14, critical_high: 44 },
    bpSystolic: { low: 85, high: 115, critical_low: 65, critical_high: 125 }
  },
  school_6_12: {
    heartRate: { low: 70, high: 110, critical_low: 50, critical_high: 130 },
    respiratoryRate: { low: 18, high: 30, critical_low: 12, critical_high: 36 },
    bpSystolic: { low: 90, high: 120, critical_low: 70, critical_high: 135 }
  },
  adolescent_12_18: {
    heartRate: { low: 60, high: 100, critical_low: 45, critical_high: 120 },
    respiratoryRate: { low: 12, high: 20, critical_low: 10, critical_high: 28 },
    bpSystolic: { low: 90, high: 130, critical_low: 75, critical_high: 145 }
  }
};

// High-risk symptom keywords for chief complaint analysis
export const HIGH_RISK_SYMPTOMS = {
  'chest pain': 25,
  'difficulty breathing': 30,
  'shortness of breath': 25,
  'sudden weakness': 25,
  'numbness': 20,
  'severe headache': 20,
  'confusion': 25,
  'altered consciousness': 30,
  'unresponsive': 35,
  'seizure': 30,
  'bleeding heavily': 25,
  'vomiting blood': 30,
  'severe abdominal pain': 20,
  'crushing chest': 30,
  'fainting': 20,
  'allergic reaction': 25,
  'swelling throat': 30,
  'snake bite': 35,
  'poisoning': 30,
  'suicidal': 30,
  'trauma': 20,
  'accident': 20,
  'burn': 20
};

export const API_DISCLAIMER = `
⚠️ IMPORTANT LEGAL NOTICE:

This Healthcare Risk Triage API is a Clinical Decision Support System (CDSS) designed 
ONLY to assist healthcare workers in patient prioritization at primary healthcare centers.

THIS SYSTEM:
❌ Does NOT diagnose diseases
❌ Does NOT prescribe treatments  
❌ Does NOT replace medical professionals
❌ Does NOT provide medical advice to patients

All outputs MUST be validated by licensed healthcare professionals.
Final medical decisions are ALWAYS made by qualified doctors.
`;

export const CHATBOT_SYSTEM_PROMPT = `You are a healthcare information assistant for HealthTriage AI, a Clinical Decision Support System.

IMPORTANT RULES:
1. You ONLY answer questions related to healthcare, medical information, health tips, and wellness.
2. You NEVER diagnose diseases or prescribe treatments.
3. You ALWAYS recommend consulting a healthcare professional for medical concerns.
4. You DO NOT answer questions unrelated to healthcare (politics, entertainment, coding, etc.)
5. If asked non-healthcare questions, politely redirect to healthcare topics.
6. Keep responses concise and helpful.
7. Include disclaimers when discussing symptoms or conditions.

RESPONSE FORMAT:
- Be empathetic and professional
- Use simple language patients can understand
- Always include: "Please consult a healthcare professional for personalized medical advice."
- For emergencies, advise calling emergency services immediately

You are NOT a doctor. You provide general health information only.`;
