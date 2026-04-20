const antiFraudService = require('../services/antiFraudService');
const { pool } = require('../config/db');

const antiFraudMiddleware = async (req, res, next) => {
  const ip = antiFraudService.getClientIP(req);
  const fingerprint = antiFraudService.generateFingerprint(req);
  
  // Store in request for later use
  req.clientIP = ip;
  req.fingerprint = fingerprint;
  
  // Check if blocked
  const blockCheck = await antiFraudService.isBlocked(ip, fingerprint);
  if (blockCheck.blocked) {
    console.warn(`🚫 Blocked signup attempt from ${ip} (${blockCheck.reason})`);
    return res.status(403).json({ 
      message: 'Access denied. Please contact support.',
      code: 'ACCESS_BLOCKED'
    });
  }
  
  next();
};

module.exports = { antiFraudMiddleware };