const antiFraudService = require('../services/antiFraudService');
const { pool } = require('../config/db');

// ============================================================================
// PRODUCTION-GRADE ANTI-FRAUD MIDDLEWARE
// ============================================================================
const antiFraudMiddleware = async (req, res, next) => {
  // Extract and normalize client identifiers
  const ip = antiFraudService.getClientIP(req);
  const fingerprint = antiFraudService.generateFingerprint(req);

  // Store in request for downstream handlers
  req.clientIP = ip;
  req.fingerprint = fingerprint;
  req.requestTimestamp = new Date().toISOString();

  // Check if blocked (IP or fingerprint)
  const blockCheck = await antiFraudService.isBlocked(ip, fingerprint);
  if (blockCheck.blocked) {
    // Structured logging for blocked attempts
    console.warn(JSON.stringify({
      event: 'BLOCKED_REQUEST',
      timestamp: req.requestTimestamp,
      ip,
      fingerprint: fingerprint.substring(0, 16) + '...',
      reason: blockCheck.reason,
      source: blockCheck.source,
      blockedUntil: blockCheck.blockedUntil,
      path: req.path,
      method: req.method
    }));

    // Log blocked attempt to fraud_logs (async, non-blocking)
    antiFraudService.logFraudEvent(
      null,
      'blocked_access',
      'high',
      {
        reason: blockCheck.reason,
        source: blockCheck.source,
        blockedUntil: blockCheck.blockedUntil,
        path: req.path,
        method: req.method,
        headers: {
          'user-agent': req.headers['user-agent'],
          'accept-language': req.headers['accept-language']
        }
      },
      ip,
      fingerprint
    ).catch(err => console.error('Failed to log blocked attempt:', err.message));

    return res.status(403).json({ 
      message: 'Access denied. Please contact support.',
      code: 'ACCESS_BLOCKED'
    });
  }

  // Optional: Rate limit check for non-registration endpoints
  if (req.path.includes('/register') || req.path.includes('/login')) {
    await checkEndpointRateLimit(req, ip, fingerprint);
  }

  next();
};

// ============================================================================
// ENDPOINT-SPECIFIC RATE LIMITING
// ============================================================================
const checkEndpointRateLimit = async (req, ip, fingerprint) => {
  try {
    const endpoint = req.path;
    const windowMinutes = endpoint.includes('login') ? 15 : 60;
    const maxAttempts = endpoint.includes('login') ? 10 : 20;

    // Check recent attempts for this endpoint
    const result = await pool.query(
      `SELECT COUNT(*) as count 
       FROM fraud_logs 
       WHERE ip_address = $1::inet 
       AND trigger_type = $2
       AND created_at > NOW() - INTERVAL '${windowMinutes} minutes'`,
      [ip, endpoint.includes('login') ? 'login_attempt' : 'registration_attempt']
    );

    const attemptCount = parseInt(result.rows[0]?.count) || 0;

    if (attemptCount > maxAttempts) {
      console.warn(JSON.stringify({
        event: 'RATE_LIMIT_EXCEEDED',
        ip,
        endpoint,
        attemptCount,
        maxAttempts,
        windowMinutes
      }));
    }

    // Log the attempt for tracking
    await pool.query(
      `INSERT INTO fraud_logs (trigger_type, severity, details, ip_address, fingerprint_hash, created_at)
       VALUES ($1, 'low', $2, $3::inet, $4, NOW())`,
      [
        endpoint.includes('login') ? 'login_attempt' : 'registration_attempt',
        JSON.stringify({ endpoint, method: req.method }),
        ip,
        fingerprint
      ]
    );
  } catch (error) {
    // Non-critical - don't block the request
    console.error('Rate limit check error:', error.message);
  }
};

// ============================================================================
// ENHANCED MIDDLEWARE WITH DEVICE TRACKING
// ============================================================================
const antiFraudMiddlewareWithTracking = async (req, res, next) => {
  const ip = antiFraudService.getClientIP(req);
  const fingerprint = antiFraudService.generateFingerprint(req);

  req.clientIP = ip;
  req.fingerprint = fingerprint;
  req.requestTimestamp = new Date().toISOString();

  // Check blocks
  const blockCheck = await antiFraudService.isBlocked(ip, fingerprint);
  if (blockCheck.blocked) {
    console.warn(JSON.stringify({
      event: 'BLOCKED_REQUEST',
      ip,
      reason: blockCheck.reason,
      source: blockCheck.source
    }));

    return res.status(403).json({ 
      message: 'Access denied. Please contact support.',
      code: 'ACCESS_BLOCKED'
    });
  }

  // If user is authenticated, update device last_seen
  if (req.user?.id) {
    try {
      await pool.query(
        `UPDATE user_devices 
         SET last_seen_at = NOW(),
             ip_address = $1::inet
         WHERE user_id = $2 AND fingerprint_hash = $3`,
        [ip, req.user.id, fingerprint]
      );
    } catch (error) {
      // Non-critical - continue
      console.error('Device tracking update error:', error.message);
    }
  }

  next();
};

// ============================================================================
// LOGIN-SPECIFIC FRAUD CHECK MIDDLEWARE
// ============================================================================
const loginFraudMiddleware = async (req, res, next) => {
  const ip = antiFraudService.getClientIP(req);
  const fingerprint = antiFraudService.generateFingerprint(req);

  req.clientIP = ip;
  req.fingerprint = fingerprint;

  // Check for brute force attempts
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count 
       FROM fraud_logs 
       WHERE ip_address = $1::inet 
       AND trigger_type = 'failed_login'
       AND created_at > NOW() - INTERVAL '15 minutes'`,
      [ip]
    );

    const failedAttempts = parseInt(result.rows[0]?.count) || 0;

    if (failedAttempts >= 5) {
      console.warn(JSON.stringify({
        event: 'BRUTE_FORCE_DETECTED',
        ip,
        failedAttempts,
        window: '15 minutes'
      }));

      return res.status(429).json({ 
        message: 'Too many failed attempts. Please try again later.',
        code: 'LOGIN_RATE_LIMIT'
      });
    }
  } catch (error) {
    console.error('Login fraud check error:', error.message);
  }

  next();
};

// ============================================================================
// EXPORTS
// ============================================================================
module.exports = { 
  antiFraudMiddleware,
  antiFraudMiddlewareWithTracking,
  loginFraudMiddleware
};