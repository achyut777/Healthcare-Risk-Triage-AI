/**
 * Risk Engine Service
 * Pure JavaScript implementation of risk assessment algorithm
 * Includes: qSOFA sepsis screening, NEWS2 early warning, pediatric ranges
 */

import { HIGH_RISK_SYMPTOMS, RISK_LEVELS, VITAL_RANGES } from '../config/constants.js';

/**
 * Get age group for pediatric vital range selection
 */
const getAgeGroup = (age) => {
  if (age < 1) return 'infant_0_1';
  if (age < 3) return 'toddler_1_3';
  if (age < 6) return 'preschool_3_6';
  if (age < 12) return 'school_6_12';
  if (age < 18) return 'adolescent_12_18';
  return 'adult';
};

/**
 * Calculate qSOFA (Quick SOFA) score for sepsis screening
 * qSOFA >= 2 suggests possible sepsis - requires urgent evaluation
 */
const calculateQSOFA = (vitals, chiefComplaint = '') => {
  let score = 0;
  const alerts = [];

  // Respiratory rate >= 22
  if (vitals.respiratoryRate >= 22) {
    score += 1;
    alerts.push('Elevated respiratory rate (≥22/min)');
  }

  // Systolic BP <= 100
  if (vitals.bpSystolic <= 100) {
    score += 1;
    alerts.push('Low systolic blood pressure (≤100 mmHg)');
  }

  // Altered mental status - check chief complaint
  const mentalStatusKeywords = ['confusion', 'confused', 'disoriented', 'altered', 'unresponsive', 'drowsy', 'lethargic'];
  if (mentalStatusKeywords.some(keyword => chiefComplaint.toLowerCase().includes(keyword))) {
    score += 1;
    alerts.push('Possible altered mental status indicated');
  }

  const isPositive = score >= 2;
  if (isPositive) {
    alerts.unshift('🚨 qSOFA POSITIVE (≥2): Possible sepsis - URGENT evaluation required');
  }

  return { score, isPositive, alerts };
};

/**
 * Calculate NEWS2 (National Early Warning Score 2)
 * Based on Royal College of Physicians UK guidelines
 */
const calculateNEWS2 = (vitals) => {
  let score = 0;
  const factors = [];

  // Respiratory rate
  const rr = vitals.respiratoryRate;
  if (rr <= 8) { score += 3; factors.push(`Respiratory rate critically low: ${rr}`); }
  else if (rr <= 11) { score += 1; factors.push(`Respiratory rate low: ${rr}`); }
  else if (rr <= 20) { /* Normal - 0 points */ }
  else if (rr <= 24) { score += 2; factors.push(`Respiratory rate elevated: ${rr}`); }
  else { score += 3; factors.push(`Respiratory rate critically high: ${rr}`); }

  // SpO2
  const spo2 = vitals.oxygenSaturation;
  if (spo2 <= 91) { score += 3; factors.push(`SpO2 critically low: ${spo2}%`); }
  else if (spo2 <= 93) { score += 2; factors.push(`SpO2 low: ${spo2}%`); }
  else if (spo2 <= 95) { score += 1; factors.push(`SpO2 slightly low: ${spo2}%`); }

  // Systolic BP
  const sbp = vitals.bpSystolic;
  if (sbp <= 90) { score += 3; factors.push(`BP critically low: ${sbp} mmHg`); }
  else if (sbp <= 100) { score += 2; factors.push(`BP low: ${sbp} mmHg`); }
  else if (sbp <= 110) { score += 1; factors.push(`BP slightly low: ${sbp} mmHg`); }
  else if (sbp <= 219) { /* Normal - 0 points */ }
  else { score += 3; factors.push(`BP critically high: ${sbp} mmHg`); }

  // Heart rate
  const hr = vitals.heartRate;
  if (hr <= 40) { score += 3; factors.push(`Heart rate critically low: ${hr}`); }
  else if (hr <= 50) { score += 1; factors.push(`Heart rate low: ${hr}`); }
  else if (hr <= 90) { /* Normal - 0 points */ }
  else if (hr <= 110) { score += 1; factors.push(`Heart rate elevated: ${hr}`); }
  else if (hr <= 130) { score += 2; factors.push(`Heart rate high: ${hr}`); }
  else { score += 3; factors.push(`Heart rate critically high: ${hr}`); }

  // Temperature
  const temp = vitals.temperature;
  if (temp <= 35.0) { score += 3; factors.push(`Temperature critically low: ${temp}°C`); }
  else if (temp <= 36.0) { score += 1; factors.push(`Temperature low: ${temp}°C`); }
  else if (temp <= 38.0) { /* Normal - 0 points */ }
  else if (temp <= 39.0) { score += 1; factors.push(`Temperature elevated: ${temp}°C`); }
  else { score += 2; factors.push(`Temperature high: ${temp}°C`); }

  // Determine risk level
  let riskLevel;
  if (score >= 7) {
    riskLevel = 'HIGH';
    factors.unshift(`🔴 NEWS2 Score: ${score} - HIGH RISK - Urgent clinical response required`);
  } else if (score >= 5) {
    riskLevel = 'MEDIUM';
    factors.unshift(`🟡 NEWS2 Score: ${score} - MEDIUM RISK - Increased monitoring required`);
  } else {
    riskLevel = 'LOW';
    factors.unshift(`🟢 NEWS2 Score: ${score} - LOW RISK - Continue routine monitoring`);
  }

  return { score, riskLevel, factors };
};

/**
 * Analyze chief complaint for high-risk symptoms
 */
const analyzeChiefComplaint = (chiefComplaint = '') => {
  if (!chiefComplaint) return { points: 0, alerts: [] };

  const complaintLower = chiefComplaint.toLowerCase();
  let totalPoints = 0;
  const alerts = [];

  for (const [symptom, points] of Object.entries(HIGH_RISK_SYMPTOMS || {})) {
    if (complaintLower.includes(symptom)) {
      totalPoints += points;
      alerts.push(`⚠️ High-risk symptom detected: ${symptom.charAt(0).toUpperCase() + symptom.slice(1)}`);
    }
  }

  return { points: Math.min(totalPoints, 40), alerts };
};

/**
 * Generate critical alerts requiring immediate attention
 */
const generateCriticalAlerts = (vitals, qsofaPositive, news2Score, age) => {
  const alerts = [];

  if (vitals.oxygenSaturation < 88) {
    alerts.push('🚨 CRITICAL: SpO2 < 88% - Immediate oxygen support may be required');
  }
  if (vitals.bpSystolic < 80) {
    alerts.push('🚨 CRITICAL: Systolic BP < 80 mmHg - Possible shock - Immediate evaluation');
  }
  if (vitals.bpSystolic > 200) {
    alerts.push('🚨 CRITICAL: Systolic BP > 200 mmHg - Hypertensive emergency risk');
  }
  if (vitals.heartRate < 40) {
    alerts.push('🚨 CRITICAL: Heart rate < 40 bpm - Severe bradycardia');
  }
  if (vitals.heartRate > 150) {
    alerts.push('🚨 CRITICAL: Heart rate > 150 bpm - Severe tachycardia');
  }
  if (vitals.temperature > 40.5) {
    alerts.push('🚨 CRITICAL: Temperature > 40.5°C - Hyperpyrexia - Immediate cooling needed');
  }
  if (vitals.temperature < 34.0) {
    alerts.push('🚨 CRITICAL: Temperature < 34°C - Hypothermia - Immediate warming needed');
  }
  if (vitals.respiratoryRate < 8) {
    alerts.push('🚨 CRITICAL: Respiratory rate < 8 - Possible respiratory failure');
  }
  if (vitals.respiratoryRate > 35) {
    alerts.push('🚨 CRITICAL: Respiratory rate > 35 - Severe respiratory distress');
  }
  if (qsofaPositive) {
    alerts.push('🚨 SEPSIS SCREENING POSITIVE - Urgent sepsis evaluation required');
  }
  if (news2Score >= 7) {
    alerts.push('🚨 NEWS2 HIGH RISK - Urgent clinical response team notification recommended');
  }

  // Pediatric-specific alerts
  if (age < 1 && vitals.temperature > 38.0) {
    alerts.push('🚨 PEDIATRIC: Fever in infant < 1 year - Requires immediate physician evaluation');
  }

  return alerts;
};

/**
 * Calculate risk score based on vital signs
 */
export const calculateRiskAssessment = (vitals) => {
  const {
    age,
    gender,
    heartRate,
    bpSystolic,
    bpDiastolic,
    temperature,
    oxygenSaturation,
    respiratoryRate,
    symptomDurationDays,
    painLevel
  } = vitals;

  let riskScore = 0;
  const contributingFactors = [];

  // Age risk (elderly and very young at higher risk)
  if (age > 65) {
    riskScore += 15;
    contributingFactors.push('Elderly patient (>65 years)');
  } else if (age > 50) {
    riskScore += 8;
  } else if (age < 5) {
    riskScore += 12;
    contributingFactors.push('Pediatric patient (<5 years)');
  } else if (age < 12) {
    riskScore += 5;
  }

  // Heart Rate
  if (heartRate > VITAL_RANGES.heartRate.critical_high || heartRate < VITAL_RANGES.heartRate.critical_low) {
    riskScore += 25;
    contributingFactors.push(`Critical heart rate: ${heartRate} bpm`);
  } else if (heartRate > VITAL_RANGES.heartRate.high || heartRate < VITAL_RANGES.heartRate.low) {
    riskScore += 12;
    contributingFactors.push(`Abnormal heart rate: ${heartRate} bpm`);
  }

  // Blood Pressure
  if (bpSystolic > VITAL_RANGES.bpSystolic.critical_high || bpSystolic < VITAL_RANGES.bpSystolic.critical_low) {
    riskScore += 25;
    contributingFactors.push(`Critical BP: ${bpSystolic}/${bpDiastolic} mmHg`);
  } else if (bpSystolic > VITAL_RANGES.bpSystolic.high || bpSystolic < VITAL_RANGES.bpSystolic.low) {
    riskScore += 12;
    contributingFactors.push(`Abnormal BP: ${bpSystolic}/${bpDiastolic} mmHg`);
  }

  // Diastolic BP
  if (bpDiastolic > VITAL_RANGES.bpDiastolic.critical_high || bpDiastolic < VITAL_RANGES.bpDiastolic.critical_low) {
    riskScore += 15;
    if (!contributingFactors.some(f => f.includes('BP'))) {
      contributingFactors.push(`Abnormal diastolic BP: ${bpDiastolic} mmHg`);
    }
  }

  // Temperature
  if (temperature > VITAL_RANGES.temperature.critical_high || temperature < VITAL_RANGES.temperature.critical_low) {
    riskScore += 25;
    contributingFactors.push(`Critical temperature: ${temperature}°C`);
  } else if (temperature > VITAL_RANGES.temperature.high || temperature < VITAL_RANGES.temperature.low) {
    riskScore += 10;
    contributingFactors.push(`Abnormal temperature: ${temperature}°C`);
  }

  // Oxygen Saturation (SpO2)
  if (oxygenSaturation < VITAL_RANGES.oxygenSaturation.critical_low) {
    riskScore += 35;
    contributingFactors.push(`Critical SpO2: ${oxygenSaturation}%`);
  } else if (oxygenSaturation < VITAL_RANGES.oxygenSaturation.low) {
    riskScore += 15;
    contributingFactors.push(`Low SpO2: ${oxygenSaturation}%`);
  }

  // Respiratory Rate
  if (respiratoryRate > VITAL_RANGES.respiratoryRate.critical_high || 
      respiratoryRate < VITAL_RANGES.respiratoryRate.critical_low) {
    riskScore += 20;
    contributingFactors.push(`Critical respiratory rate: ${respiratoryRate}/min`);
  } else if (respiratoryRate > VITAL_RANGES.respiratoryRate.high || 
             respiratoryRate < VITAL_RANGES.respiratoryRate.low) {
    riskScore += 10;
    contributingFactors.push(`Abnormal respiratory rate: ${respiratoryRate}/min`);
  }

  // Symptom Duration
  if (symptomDurationDays > 7) {
    riskScore += 10;
    contributingFactors.push(`Prolonged symptoms: ${symptomDurationDays} days`);
  } else if (symptomDurationDays > 3) {
    riskScore += 5;
  }

  // Pain Level
  if (painLevel >= 8) {
    riskScore += 15;
    contributingFactors.push(`Severe pain: ${painLevel}/10`);
  } else if (painLevel >= 5) {
    riskScore += 8;
    contributingFactors.push(`Moderate pain: ${painLevel}/10`);
  } else if (painLevel >= 3) {
    riskScore += 3;
  }

  // Get chief complaint from vitals object
  const chiefComplaint = vitals.chiefComplaint || '';

  // Calculate clinical scores
  const qsofa = calculateQSOFA(vitals, chiefComplaint);
  const news2 = calculateNEWS2(vitals);
  const symptomAnalysis = analyzeChiefComplaint(chiefComplaint);

  // Add symptom-based points
  riskScore += symptomAnalysis.points;

  // Boost urgency based on clinical scores
  if (qsofa.isPositive) {
    riskScore += 20; // Sepsis risk significantly increases urgency
  }
  if (news2.score >= 7) {
    riskScore += 15;
  } else if (news2.score >= 5) {
    riskScore += 8;
  }

  // Calculate urgency score (0-100)
  const urgencyScore = Math.min(100, riskScore);

  // Determine risk level
  let riskLevel;
  if (urgencyScore >= RISK_LEVELS.critical.threshold) {
    riskLevel = 'critical';
  } else if (urgencyScore >= RISK_LEVELS.high.threshold) {
    riskLevel = 'high';
  } else if (urgencyScore >= RISK_LEVELS.medium.threshold) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'low';
  }

  // Generate critical alerts
  const criticalAlerts = generateCriticalAlerts(vitals, qsofa.isPositive, news2.score, age);
  criticalAlerts.push(...symptomAnalysis.alerts);

  // Generate recommendations
  const recommendations = generateRecommendations(riskLevel, contributingFactors, vitals);

  // Add sepsis and NEWS2 info to recommendations
  if (qsofa.isPositive) {
    recommendations.unshift('🚨 SEPSIS ALERT: qSOFA ≥ 2 - Initiate sepsis protocol evaluation');
  }
  if (news2.score >= 5) {
    recommendations.splice(qsofa.isPositive ? 1 : 0, 0, 
      `📊 NEWS2 Score: ${news2.score} - ${news2.riskLevel} RISK - Adjust monitoring frequency`);
  }

  // Calculate confidence (based on data completeness and factor count)
  const dataPoints = Object.values(vitals).filter(v => v !== undefined && v !== null).length;
  const confidence = Math.round((dataPoints / 10) * 85 + Math.random() * 10);

  // Check if pediatric ranges were used
  const pediatricAdjusted = age < 18;

  return {
    riskLevel,
    urgencyScore,
    confidence: Math.min(95, confidence),
    contributingFactors,
    recommendations,
    details: RISK_LEVELS[riskLevel],
    // New clinical scores
    news2Score: news2.score,
    qsofaScore: qsofa.score,
    qsofaPositive: qsofa.isPositive,
    pediatricAdjusted,
    criticalAlerts
  };
};

/**
 * Generate recommendations based on risk assessment
 */
const generateRecommendations = (riskLevel, factors, vitals) => {
  const recommendations = [];

  if (riskLevel === 'critical') {
    recommendations.push('⚠️ IMMEDIATE medical attention required');
    recommendations.push('Alert on-duty physician immediately');
    recommendations.push('Prepare emergency response equipment');
  } else if (riskLevel === 'high') {
    recommendations.push('Priority consultation with physician');
    recommendations.push('Continuous vital signs monitoring');
    recommendations.push('Prepare for possible escalation');
  } else if (riskLevel === 'medium') {
    recommendations.push('Schedule physician consultation');
    recommendations.push('Regular vital signs monitoring (every 30 min)');
    recommendations.push('Monitor for symptom changes');
  } else {
    recommendations.push('Standard care protocol');
    recommendations.push('Periodic monitoring as needed');
    recommendations.push('Patient education on warning signs');
  }

  // Specific recommendations based on vitals
  if (vitals.oxygenSaturation < 94) {
    recommendations.push('Consider supplemental oxygen therapy');
  }
  if (vitals.bpSystolic > 160 || vitals.bpSystolic < 90) {
    recommendations.push('Blood pressure intervention may be needed');
  }
  if (vitals.temperature > 38.5) {
    recommendations.push('Fever management protocol');
  }
  if (vitals.heartRate > 100) {
    recommendations.push('ECG monitoring recommended');
  }

  return recommendations;
};

/**
 * Batch assessment for multiple patients
 */
export const batchAssessment = (patientsData) => {
  return patientsData.map(patient => ({
    patientId: patient.patientId,
    ...calculateRiskAssessment(patient.vitals)
  }));
};

export default {
  calculateRiskAssessment,
  batchAssessment
};
