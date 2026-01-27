/**
 * Validation Middleware
 */
import { body, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Vitals validation rules
export const validateVitals = [
  body('age').isInt({ min: 0, max: 120 }).withMessage('Age must be between 0 and 120'),
  body('gender').isIn([0, 1]).withMessage('Gender must be 0 (Female) or 1 (Male)'),
  body('heartRate').isFloat({ min: 20, max: 250 }).withMessage('Heart rate must be between 20 and 250 bpm'),
  body('bpSystolic').isFloat({ min: 40, max: 250 }).withMessage('Systolic BP must be between 40 and 250 mmHg'),
  body('bpDiastolic').isFloat({ min: 20, max: 150 }).withMessage('Diastolic BP must be between 20 and 150 mmHg'),
  body('temperature').optional().isFloat({ min: 30, max: 45 }).withMessage('Temperature must be between 30 and 45 °C'),
  body('oxygenSaturation').optional().isFloat({ min: 50, max: 100 }).withMessage('SpO2 must be between 50 and 100%'),
  body('respiratoryRate').optional().isFloat({ min: 4, max: 60 }).withMessage('Respiratory rate must be between 4 and 60'),
  body('symptomDurationDays').optional().isInt({ min: 0, max: 365 }).withMessage('Symptom duration must be between 0 and 365 days'),
  body('painLevel').optional().isInt({ min: 0, max: 10 }).withMessage('Pain level must be between 0 and 10'),
  handleValidationErrors
];

// User registration validation
export const validateUserRegistration = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('facilityId').trim().notEmpty().withMessage('Facility ID is required'),
  handleValidationErrors
];

// Login validation
export const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];
