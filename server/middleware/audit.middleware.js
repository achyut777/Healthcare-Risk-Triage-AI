/**
 * Audit Logging Middleware
 * Logs all sensitive operations for HIPAA compliance and security monitoring
 */

// In-memory audit log store (replace with DB in production)
const auditLogs = [];
const MAX_LOGS = 10000;

// Sensitive endpoints that require audit logging
const SENSITIVE_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/register',
  '/api/patients',
  '/api/assessment',
  '/api/queue',
];

// Actions that should be logged
const LOG_ACTIONS = {
  GET: 'VIEW',
  POST: 'CREATE',
  PUT: 'UPDATE',
  PATCH: 'UPDATE',
  DELETE: 'DELETE',
};

/**
 * Create an audit log entry
 */
export const createAuditEntry = (data) => {
  const entry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    ...data,
  };
  
  // Add to in-memory store (FIFO)
  auditLogs.unshift(entry);
  if (auditLogs.length > MAX_LOGS) {
    auditLogs.pop();
  }
  
  // Log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[AUDIT] ${entry.action} | ${entry.resource} | User: ${entry.userId || 'anonymous'} | IP: ${entry.ipAddress}`);
  }
  
  return entry;
};

/**
 * Main audit middleware
 */
export const auditMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const originalPath = req.originalUrl || req.url;
  
  // Check if this endpoint should be audited
  const shouldAudit = SENSITIVE_ENDPOINTS.some(endpoint => originalPath.startsWith(endpoint));
  
  if (!shouldAudit) {
    return next();
  }
  
  // Capture response
  const originalSend = res.send;
  res.send = function(body) {
    const responseTime = Date.now() - startTime;
    
    // Create audit entry
    createAuditEntry({
      action: LOG_ACTIONS[req.method] || req.method,
      resource: originalPath,
      method: req.method,
      userId: req.user?.id || req.user?._id || null,
      userName: req.user?.name || null,
      userRole: req.user?.role || null,
      ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      requestBody: sanitizeRequestBody(req.body),
      success: res.statusCode >= 200 && res.statusCode < 400,
    });
    
    originalSend.call(this, body);
  };
  
  next();
};

/**
 * Sanitize request body to remove sensitive data
 */
const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') return null;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

/**
 * Log authentication events specifically
 */
export const logAuthEvent = (type, userId, userName, success, details = {}) => {
  return createAuditEntry({
    action: `AUTH_${type.toUpperCase()}`,
    resource: '/api/auth',
    method: 'POST',
    userId,
    userName,
    userRole: details.role || null,
    ipAddress: details.ipAddress || 'unknown',
    userAgent: details.userAgent || 'unknown',
    statusCode: success ? 200 : 401,
    success,
    details: details.message || null,
  });
};

/**
 * Log patient data access
 */
export const logPatientAccess = (userId, userName, patientId, action, details = {}) => {
  return createAuditEntry({
    action: `PATIENT_${action.toUpperCase()}`,
    resource: `/api/patients/${patientId}`,
    method: action === 'VIEW' ? 'GET' : 'POST',
    userId,
    userName,
    patientId,
    ipAddress: details.ipAddress || 'unknown',
    userAgent: details.userAgent || 'unknown',
    statusCode: 200,
    success: true,
    details: details.reason || null,
  });
};

/**
 * Log risk assessment
 */
export const logRiskAssessment = (userId, userName, patientId, riskLevel, details = {}) => {
  return createAuditEntry({
    action: 'RISK_ASSESSMENT',
    resource: '/api/assessment/calculate',
    method: 'POST',
    userId,
    userName,
    patientId,
    riskLevel,
    ipAddress: details.ipAddress || 'unknown',
    userAgent: details.userAgent || 'unknown',
    statusCode: 200,
    success: true,
    details: `Risk Level: ${riskLevel}`,
  });
};

/**
 * Log security events
 */
export const logSecurityEvent = (type, details) => {
  return createAuditEntry({
    action: `SECURITY_${type.toUpperCase()}`,
    resource: details.resource || '/security',
    method: 'SYSTEM',
    userId: details.userId || null,
    ipAddress: details.ipAddress || 'unknown',
    userAgent: details.userAgent || 'unknown',
    statusCode: details.statusCode || 403,
    success: false,
    details: details.message,
  });
};

/**
 * Get audit logs (for admin access)
 */
export const getAuditLogs = (filters = {}) => {
  let logs = [...auditLogs];
  
  if (filters.userId) {
    logs = logs.filter(log => log.userId === filters.userId);
  }
  
  if (filters.action) {
    logs = logs.filter(log => log.action === filters.action);
  }
  
  if (filters.resource) {
    logs = logs.filter(log => log.resource.includes(filters.resource));
  }
  
  if (filters.startDate) {
    const start = new Date(filters.startDate);
    logs = logs.filter(log => new Date(log.timestamp) >= start);
  }
  
  if (filters.endDate) {
    const end = new Date(filters.endDate);
    logs = logs.filter(log => new Date(log.timestamp) <= end);
  }
  
  if (filters.success !== undefined) {
    logs = logs.filter(log => log.success === filters.success);
  }
  
  // Pagination
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const startIdx = (page - 1) * limit;
  
  return {
    logs: logs.slice(startIdx, startIdx + limit),
    total: logs.length,
    page,
    totalPages: Math.ceil(logs.length / limit),
  };
};

/**
 * Clear old audit logs
 */
export const clearOldLogs = (daysToKeep = 90) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);
  
  const originalLength = auditLogs.length;
  const remainingLogs = auditLogs.filter(log => new Date(log.timestamp) >= cutoff);
  
  auditLogs.length = 0;
  auditLogs.push(...remainingLogs);
  
  return {
    removed: originalLength - remainingLogs.length,
    remaining: remainingLogs.length,
  };
};

export default {
  auditMiddleware,
  createAuditEntry,
  logAuthEvent,
  logPatientAccess,
  logRiskAssessment,
  logSecurityEvent,
  getAuditLogs,
  clearOldLogs,
};
