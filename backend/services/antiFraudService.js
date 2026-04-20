const crypto = require('crypto');
const { pool } = require('../config/db');

// ============================================================================
// CONFIGURATION
// ============================================================================
const FRAUD_CONFIG = {
  // Time windows
  SIGNUP_RATE_WINDOW_MINUTES: 60,
  MAX_SIGNUPS_PER_IP: 3,
  MAX_SIGNUPS_PER_FINGERPRINT: 2,
  
  // Referral restrictions
  SAME_IP_REFERRAL_BLOCK: true,
  SAME_FINGERPRINT_REFERRAL_BLOCK: true,
  REFERRAL_COOLDOWN_DAYS: 30,  // Referrer must be registered for 30 days to earn
  
  // VPN/Proxy detection
  BLOCK_VPN_SIGNUPS: true,
  BLOCK_PROXY_SIGNUPS: true,
  BLOCK_DATACENTER_SIGNUPS: true,
  
  // Fraud scores (cumulative)
  FRAUD_SCORE_THRESHOLD: 50,
  SELF_REFERRAL_SCORE: 100,
  VPN_SIGNUP_SCORE: 40,
  RAPID_SIGNUP_SCORE: 30,
  SAME_DEVICE_MULTIPLE_ACCOUNTS_SCORE: 60,
};

// ============================================================================
// FINGERPRINT GENERATION
// ============================================================================
const generateFingerprint = (req) => {
  const components = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    req.headers['sec-ch-ua'] || '',
    req.headers['sec-ch-ua-platform'] || '',
    req.ip || req.connection.remoteAddress || '',
  ];
  
  return crypto.createHash('sha256').update(components.join('|')).digest('hex');
};

// ============================================================================
// IP AND GEO LOCATION
// ============================================================================
const getClientIP = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  return forwarded ? forwarded.split(',')[0].trim() : req.ip || req.connection.remoteAddress;
};

const isVPNorProxy = async (ip) => {
  // In production, integrate with ipapi.co, ipinfo.io, or maxmind
  // For now, check against known patterns
  const vpnIndicators = [
    'vpn', 'proxy', 'hosting', 'server', 'datacenter',
    'digitalocean', 'aws', 'azure', 'google cloud', 'vultr', 'linode',
    'ovh', 'hetzner', 'contabo', 'netcup'
  ];
  
  // This is a simplified check - integrate with a real API in production
  try {
    // Example: Use ipapi.co (free tier: 1000 requests/day)
    // const response = await fetch(`https://ipapi.co/${ip}/json/`);
    // const data = await response.json();
    // return data.hosting === true || data.proxy === true || data.vpn === true;
    
    return false; // Placeholder
  } catch (error) {
    console.error('VPN check error:', error);
    return false;
  }
};

// ============================================================================
// RATE LIMITING
// ============================================================================
const checkSignupRateLimit = async (ip, fingerprint) => {
  const windowMinutes = FRAUD_CONFIG.SIGNUP_RATE_WINDOW_MINUTES;
  
  // Check IP-based rate limit
  const ipResult = await pool.query(
    `SELECT COUNT(*) as count FROM users 
     WHERE signup_ip = $1::inet 
     AND created_at > NOW() - INTERVAL '${windowMinutes} minutes'`,
    [ip]
  );
  
  const ipCount = parseInt(ipResult.rows[0].count);
  
  // Check fingerprint-based rate limit
  const fpResult = await pool.query(
    `SELECT COUNT(*) as count FROM users 
     WHERE signup_fingerprint = $1 
     AND created_at > NOW() - INTERVAL '${windowMinutes} minutes'`,
    [fingerprint]
  );
  
  const fpCount = parseInt(fpResult.rows[0].count);
  
  return {
    ipExceeded: ipCount >= FRAUD_CONFIG.MAX_SIGNUPS_PER_IP,
    fingerprintExceeded: fpCount >= FRAUD_CONFIG.MAX_SIGNUPS_PER_FINGERPRINT,
    ipCount,
    fpCount,
  };
};

// ============================================================================
// SELF-REFERRAL DETECTION
// ============================================================================
const detectSelfReferral = async (referralCode, currentIP, currentFingerprint) => {
  if (!referralCode) return { isSelfReferral: false };
  
  // Find referrer by referral code
  const referrerResult = await pool.query(
    `SELECT id, signup_ip, signup_fingerprint, email, phone 
     FROM users WHERE referral_code = $1`,
    [referralCode]
  );
  
  if (referrerResult.rows.length === 0) {
    return { isSelfReferral: false, invalidCode: true };
  }
  
  const referrer = referrerResult.rows[0];
  
  const checks = {
    sameIP: FRAUD_CONFIG.SAME_IP_REFERRAL_BLOCK && referrer.signup_ip === currentIP,
    sameFingerprint: FRAUD_CONFIG.SAME_FINGERPRINT_REFERRAL_BLOCK && 
                     referrer.signup_fingerprint === currentFingerprint,
  };
  
  return {
    isSelfReferral: checks.sameIP || checks.sameFingerprint,
    referrerId: referrer.id,
    checks,
  };
};

// ============================================================================
// MULTI-ACCOUNT DETECTION
// ============================================================================
const detectMultiAccounting = async (ip, fingerprint) => {
  // Find all accounts using this IP
  const ipAccounts = await pool.query(
    `SELECT id, email, phone, created_at, fraud_score 
     FROM users WHERE signup_ip = $1::inet`,
    [ip]
  );
  
  // Find all accounts using this fingerprint
  const fpAccounts = await pool.query(
    `SELECT id, email, phone, created_at, fraud_score 
     FROM users WHERE signup_fingerprint = $1`,
    [fingerprint]
  );
  
  const uniqueIPAccounts = ipAccounts.rows.length;
  const uniqueFPAccounts = fpAccounts.rows.length;
  
  return {
    isMultiAccount: uniqueIPAccounts > 2 || uniqueFPAccounts > 1,
    ipAccounts: uniqueIPAccounts,
    fpAccounts: uniqueFPAccounts,
    accounts: {
      byIP: ipAccounts.rows,
      byFingerprint: fpAccounts.rows,
    },
  };
};

// ============================================================================
// FRAUD SCORE CALCULATION
// ============================================================================
const calculateFraudScore = async (req, referralCode) => {
  const ip = getClientIP(req);
  const fingerprint = generateFingerprint(req);
  
  let fraudScore = 0;
  const triggers = [];
  
  // Check self-referral
  if (referralCode) {
    const selfReferral = await detectSelfReferral(referralCode, ip, fingerprint);
    if (selfReferral.isSelfReferral) {
      fraudScore += FRAUD_CONFIG.SELF_REFERRAL_SCORE;
      triggers.push('self_referral');
    }
  }
  
  // Check multi-accounting
  const multiAccount = await detectMultiAccounting(ip, fingerprint);
  if (multiAccount.isMultiAccount) {
    fraudScore += FRAUD_CONFIG.SAME_DEVICE_MULTIPLE_ACCOUNTS_SCORE;
    triggers.push('multi_account');
  }
  
  // Check VPN/Proxy (implement with real API in production)
  const isVpn = await isVPNorProxy(ip);
  if (isVpn && FRAUD_CONFIG.BLOCK_VPN_SIGNUPS) {
    fraudScore += FRAUD_CONFIG.VPN_SIGNUP_SCORE;
    triggers.push('vpn_detected');
  }
  
  // Check rate limiting
  const rateLimit = await checkSignupRateLimit(ip, fingerprint);
  if (rateLimit.ipExceeded || rateLimit.fingerprintExceeded) {
    fraudScore += FRAUD_CONFIG.RAPID_SIGNUP_SCORE;
    triggers.push('rapid_signup');
  }
  
  return {
    fraudScore,
    triggers,
    isFraudulent: fraudScore >= FRAUD_CONFIG.FRAUD_SCORE_THRESHOLD,
    ip,
    fingerprint,
    vpnDetected: isVpn,
    rateLimit,
    multiAccount,
  };
};

// ============================================================================
// LOG FRAUD EVENT
// ============================================================================
const logFraudEvent = async (userId, triggerType, severity, details, ip, fingerprint) => {
  await pool.query(
    `INSERT INTO fraud_logs (user_id, trigger_type, severity, details, ip_address, fingerprint_hash)
     VALUES ($1, $2, $3, $4, $5::inet, $6)`,
    [userId, triggerType, severity, JSON.stringify(details), ip, fingerprint]
  );
};

// ============================================================================
// CHECK IF BLOCKED
// ============================================================================
const isBlocked = async (ip, fingerprint) => {
  // Check IP block
  const ipBlock = await pool.query(
    `SELECT * FROM blocked_ips 
     WHERE ($1::inet <<= ip_range OR ip_address = $1::inet)
     AND (blocked_until IS NULL OR blocked_until > NOW())`,
    [ip]
  );
  
  if (ipBlock.rows.length > 0) {
    return { blocked: true, reason: 'IP blocked', source: 'ip' };
  }
  
  // Check fingerprint block
  const fpBlock = await pool.query(
    `SELECT * FROM blocked_fingerprints 
     WHERE fingerprint_hash = $1
     AND (blocked_until IS NULL OR blocked_until > NOW())`,
    [fingerprint]
  );
  
  if (fpBlock.rows.length > 0) {
    return { blocked: true, reason: 'Device blocked', source: 'fingerprint' };
  }
  
  return { blocked: false };
};

// ============================================================================
// RECORD DEVICE
// ============================================================================
const recordDevice = async (userId, req, fingerprint, ip, vpnDetected) => {
  const userAgent = req.headers['user-agent'] || '';
  
  // Parse platform and browser
  const platform = userAgent.includes('Windows') ? 'Windows' :
                   userAgent.includes('Mac') ? 'Mac' :
                   userAgent.includes('Linux') ? 'Linux' :
                   userAgent.includes('Android') ? 'Android' :
                   userAgent.includes('iPhone') ? 'iOS' : 'Unknown';
  
  const browser = userAgent.includes('Chrome') ? 'Chrome' :
                  userAgent.includes('Firefox') ? 'Firefox' :
                  userAgent.includes('Safari') ? 'Safari' :
                  userAgent.includes('Edge') ? 'Edge' : 'Unknown';
  
  await pool.query(
    `INSERT INTO user_devices (user_id, fingerprint_hash, ip_address, user_agent, 
      platform, browser, is_vpn, is_proxy, last_seen_at)
     VALUES ($1, $2, $3::inet, $4, $5, $6, $7, $7, NOW())
     ON CONFLICT DO NOTHING`,
    [userId, fingerprint, ip, userAgent, platform, browser, vpnDetected]
  );
};

// ============================================================================
// EXPORTS
// ============================================================================
module.exports = {
  generateFingerprint,
  getClientIP,
  calculateFraudScore,
  detectSelfReferral,
  detectMultiAccounting,
  checkSignupRateLimit,
  logFraudEvent,
  isBlocked,
  recordDevice,
  FRAUD_CONFIG,
};