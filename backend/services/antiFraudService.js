const crypto = require('crypto');
const { pool } = require('../config/db');

// ============================================================================
// PRODUCTION-GRADE FRAUD CONFIGURATION
// ============================================================================
const FRAUD_CONFIG = {
// Time windows (in minutes)
SIGNUP_RATE_WINDOW_MINUTES: 60,
SIGNUP_BURST_WINDOW_MINUTES: 10,
MAX_SIGNUPS_PER_IP: 3,
MAX_SIGNUPS_PER_FINGERPRINT: 2,
MAX_SIGNUPS_BURST_PER_IP: 2,

// Referral restrictions
SAME_IP_REFERRAL_BLOCK: true,
SAME_FINGERPRINT_REFERRAL_BLOCK: true,
REFERRAL_COOLDOWN_DAYS: 30,
REFERRAL_SAME_IP_RANGE_BLOCK: true,

// VPN/Proxy detection
BLOCK_VPN_SIGNUPS: true,
BLOCK_PROXY_SIGNUPS: true,
BLOCK_DATACENTER_SIGNUPS: true,
VPN_CHECK_TIMEOUT_MS: 3000,

// Fraud scoring (weighted system)
FRAUD_SCORE_THRESHOLD: 50,
SCORE_TIER_SAFE: 20,
SCORE_TIER_SUSPICIOUS: 49,
SCORE_TIER_HIGH_RISK: 79,

// Weighted scores (replaces flat increments)
WEIGHT_SELF_REFERRAL: 100,
WEIGHT_VPN_SIGNUP: 45,
WEIGHT_PROXY_SIGNUP: 35,
WEIGHT_DATACENTER_SIGNUP: 30,
WEIGHT_RAPID_SIGNUP_IP: 25,
WEIGHT_RAPID_SIGNUP_FP: 20,
WEIGHT_BURST_SIGNUP: 35,
WEIGHT_MULTI_ACCOUNT_IP: 20,
WEIGHT_MULTI_ACCOUNT_FP: 35,
WEIGHT_SAME_IP_MULTIPLE: 15,
WEIGHT_SAME_FP_MULTIPLE: 30,
WEIGHT_ACCOUNT_CLUSTERING: 25,

// Multi-account detection thresholds
MULTI_ACCOUNT_IP_THRESHOLD: 3,
MULTI_ACCOUNT_FP_THRESHOLD: 2,
ACCOUNT_CLUSTER_HOURS: 24,
};

// Risk tier enum
const RISK_TIER = {
SAFE: 'SAFE',
SUSPICIOUS: 'SUSPICIOUS',
HIGH_RISK: 'HIGH_RISK',
BLOCK: 'BLOCK'
};

// ============================================================================
// HARDENED FINGERPRINT GENERATION (SPOOF-RESISTANT)
// ============================================================================
const generateFingerprint = (req) => {
// Priority: custom device ID header > composite fingerprint
const deviceId = req.headers['x-device-id'] || req.headers['x-client-fingerprint'];
if (deviceId && deviceId.length >= 32) {
return crypto.createHash('sha256').update(device:${deviceId}).digest('hex');
}

// Build hardened fingerprint from stable components
const components = [
// Browser/OS fingerprint (stable)
req.headers['user-agent'] || '',
req.headers['accept-language']?.split(',')[0] || '',

];

// Filter out empty values and join
const fingerprintString = components.filter(c => c).join('|');

return crypto.createHash('sha256').update(fingerprintString).digest('hex');
};

// Normalize IP for fingerprinting (use /24 for IPv4, /64 for IPv6)
const normalizeIPForFingerprint = (ip) => {
if (!ip || ip === '::1' || ip === '127.0.0.1') return 'localhost';

if (ip.includes(':')) {
// IPv6: keep first 64 bits (4 segments)
const segments = ip.split(':');
return segments.slice(0, 4).join(':') + '::/64';
}

// IPv4: keep /24 (first 3 octets)
const octets = ip.split('.');
if (octets.length === 4) {
return octets.slice(0, 3).join('.') + '.0/24';
}

return ip;
};

// ============================================================================
// ROBUST IP EXTRACTION (PROXY-AWARE)
// ============================================================================
const getClientIP = (req) => {
// Check trusted proxy headers in order of reliability
const forwarded = req.headers['x-forwarded-for'];
if (forwarded) {
// X-Forwarded-For: client, proxy1, proxy2
const ips = forwarded.split(',').map(ip => ip.trim());

}

// Check other proxy headers
const realIP = req.headers['x-real-ip'] || 
req.headers['cf-connecting-ip'] ||  // Cloudflare
req.headers['true-client-ip'] ||    // Akamai
req.headers['x-cluster-client-ip'];

if (realIP) {
return normalizeIP(realIP);
}

// Fallback to connection IP
return normalizeIP(req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '0.0.0.0');
};

const isPrivateIP = (ip) => {
if (!ip) return true;

// IPv4 private ranges
if (ip.match(/^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/)) return true;
if (ip === '127.0.0.1' || ip.startsWith('127.')) return true;

// IPv6 loopback/private
if (ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')) return true;

return false;
};

const normalizeIP = (ip) => {
if (!ip || ip === '::1') return '127.0.0.1';
if (ip === '::ffff:127.0.0.1') return '127.0.0.1';

// Strip IPv6 prefix if present
if (ip.startsWith('::ffff:')) {
return ip.substring(7);
}

return ip.trim();
};

// ============================================================================
// VPN/PROXY DETECTION (PRODUCTION-READY)
// ============================================================================
const isVPNorProxy = async (ip) => {
// Skip check for localhost
if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
return { isVpn: false, isProxy: false, isDatacenter: false, confidence: 0 };
}

try {
// Use ipapi.co (1000 free/day)
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), FRAUD_CONFIG.VPN_CHECK_TIMEOUT_MS);

} catch (error) {
console.error('VPN check failed:', error.message);
// Fallback to safe default on error
return { isVpn: false, isProxy: false, isDatacenter: false, confidence: 0 };
}
};

// ============================================================================
// ENHANCED RATE LIMITING WITH BURST DETECTION
// ============================================================================
const checkSignupRateLimit = async (ip, fingerprint) => {
const windowMinutes = FRAUD_CONFIG.SIGNUP_RATE_WINDOW_MINUTES;
const burstMinutes = FRAUD_CONFIG.SIGNUP_BURST_WINDOW_MINUTES;

// Combined query for better performance
const result = await pool.query(
WITH ip_stats AS (
       SELECT 
         COUNT(*) as total_count,
         COUNT(CASE WHEN created_at > NOW() - INTERVAL '${burstMinutes} minutes' THEN 1 END) as burst_count
       FROM users 
       WHERE signup_ip = $1::inet 
       AND created_at > NOW() - INTERVAL '${windowMinutes} minutes'
     ),
     fp_stats AS (
       SELECT 
         COUNT(*) as total_count,
         COUNT(CASE WHEN created_at > NOW() - INTERVAL '${burstMinutes} minutes' THEN 1 END) as burst_count
       FROM users 
       WHERE signup_fingerprint = $2 
       AND created_at > NOW() - INTERVAL '${windowMinutes} minutes'
     )
     SELECT 
       ip_stats.total_count as ip_count,
       ip_stats.burst_count as ip_burst_count,
       fp_stats.total_count as fp_count,
       fp_stats.burst_count as fp_burst_count
     FROM ip_stats, fp_stats,
[ip, fingerprint]
);

const stats = result.rows[0] || { ip_count: 0, ip_burst_count: 0, fp_count: 0, fp_burst_count: 0 };

const ipCount = parseInt(stats.ip_count);
const fpCount = parseInt(stats.fp_count);
const ipBurstCount = parseInt(stats.ip_burst_count);
const fpBurstCount = parseInt(stats.fp_burst_count);

return {
ipExceeded: ipCount >= FRAUD_CONFIG.MAX_SIGNUPS_PER_IP,
fingerprintExceeded: fpCount >= FRAUD_CONFIG.MAX_SIGNUPS_PER_FINGERPRINT,
burstExceeded: ipBurstCount >= FRAUD_CONFIG.MAX_SIGNUPS_BURST_PER_IP,
ipCount,
fpCount,
ipBurstCount,
fpBurstCount,
windowMinutes,
};
};

// ============================================================================
// SELF-REFERRAL DETECTION (ENHANCED)
// ============================================================================
const detectSelfReferral = async (referralCode, currentIP, currentFingerprint) => {
if (!referralCode) return { isSelfReferral: false, riskScore: 0 };

const referrerResult = await pool.query(
SELECT id, signup_ip, signup_fingerprint, email, phone, created_at 
     FROM users WHERE referral_code = $1 AND is_active = true,
[referralCode]
);

if (referrerResult.rows.length === 0) {
return { isSelfReferral: false, invalidCode: true, riskScore: 0 };
}

const referrer = referrerResult.rows[0];
const normalizedCurrentIP = normalizeIPForFingerprint(currentIP);
const normalizedReferrerIP = normalizeIPForFingerprint(referrer.signup_ip);

const checks = {
sameExactIP: referrer.signup_ip === currentIP,
sameIPRange: FRAUD_CONFIG.REFERRAL_SAME_IP_RANGE_BLOCK && 
normalizedReferrerIP === normalizedCurrentIP,
sameFingerprint: FRAUD_CONFIG.SAME_FINGERPRINT_REFERRAL_BLOCK && 
referrer.signup_fingerprint === currentFingerprint,
};

const isSelfReferral = checks.sameExactIP || checks.sameIPRange || checks.sameFingerprint;

return {
isSelfReferral,
referrerId: referrer.id,
riskScore: isSelfReferral ? FRAUD_CONFIG.WEIGHT_SELF_REFERRAL : 0,
checks,
invalidCode: false,
};
};

// ============================================================================
// MULTI-ACCOUNT DETECTION (ENHANCED WITH CLUSTERING - FIXED JSON PARSING)
// ============================================================================
const detectMultiAccounting = async (ip, fingerprint) => {
const normalizedIP = normalizeIPForFingerprint(ip);
const clusterHours = FRAUD_CONFIG.ACCOUNT_CLUSTER_HOURS;

// Get IP-based accounts
const ipAccountsResult = await pool.query(
SELECT id, email, created_at, fraud_score 
     FROM users 
     WHERE signup_ip = $1::inet
     ORDER BY created_at DESC
     LIMIT 10,
[ip]
);

// Get fingerprint-based accounts
const fpAccountsResult = await pool.query(
SELECT id, email, created_at, fraud_score 
     FROM users 
     WHERE signup_fingerprint = $1
     ORDER BY created_at DESC
     LIMIT 10,
[fingerprint]
);

// Get counts and clustering stats
const countResult = await pool.query(
SELECT 
       (SELECT COUNT(*) FROM users WHERE signup_ip = $1::inet) as ip_total,
       (SELECT COUNT(*) FROM users WHERE signup_fingerprint = $2) as fp_total,
       (SELECT COUNT(*) FROM users WHERE signup_ip::text LIKE $3) as ip_range_total,
       (SELECT COUNT(*) FROM users WHERE signup_ip = $1::inet 
        AND created_at > NOW() - INTERVAL '${clusterHours} hours') as ip_clustered,
       (SELECT COUNT(*) FROM users WHERE signup_fingerprint = $2
        AND created_at > NOW() - INTERVAL '${clusterHours} hours') as fp_clustered
    ,
[ip, fingerprint, normalizedIP.replace('/24', '.%')]
);

const stats = countResult.rows[0] || {};
const ipTotal = parseInt(stats.ip_total) || 0;
const fpTotal = parseInt(stats.fp_total) || 0;
const ipRangeTotal = parseInt(stats.ip_range_total) || 0;
const ipClustered = parseInt(stats.ip_clustered) || 0;
const fpClustered = parseInt(stats.fp_clustered) || 0;

const isMultiAccount = ipTotal >= FRAUD_CONFIG.MULTI_ACCOUNT_IP_THRESHOLD || 
fpTotal >= FRAUD_CONFIG.MULTI_ACCOUNT_FP_THRESHOLD;

// Calculate risk score based on findings
let riskScore = 0;
if (ipTotal >= FRAUD_CONFIG.MULTI_ACCOUNT_IP_THRESHOLD) riskScore += FRAUD_CONFIG.WEIGHT_MULTI_ACCOUNT_IP;
if (fpTotal >= FRAUD_CONFIG.MULTI_ACCOUNT_FP_THRESHOLD) riskScore += FRAUD_CONFIG.WEIGHT_MULTI_ACCOUNT_FP;
if (ipRangeTotal > ipTotal) riskScore += FRAUD_CONFIG.WEIGHT_SAME_IP_MULTIPLE;
if (ipClustered > 1 || fpClustered > 1) riskScore += FRAUD_CONFIG.WEIGHT_ACCOUNT_CLUSTERING;

return {
isMultiAccount,
ipAccounts: ipTotal,
fpAccounts: fpTotal,
ipRangeAccounts: ipRangeTotal,
clusteredAccounts: ipClustered + fpClustered,
riskScore,
accounts: {
byIP: ipAccountsResult.rows,
byFingerprint: fpAccountsResult.rows,
},
};
};

// ============================================================================
// WEIGHTED FRAUD SCORE CALCULATION (TIERED SYSTEM)
// ============================================================================
const calculateFraudScore = async (req, referralCode) => {
const ip = getClientIP(req);
const fingerprint = generateFingerprint(req);

let fraudScore = 0;
const triggers = [];
const evidence = {};

// 1. Self-referral check (highest weight)
if (referralCode) {
const selfReferral = await detectSelfReferral(referralCode, ip, fingerprint);
evidence.selfReferral = selfReferral;
if (selfReferral.isSelfReferral) {
fraudScore += selfReferral.riskScore;
triggers.push('self_referral');
}
}

// 2. Multi-accounting detection
const multiAccount = await detectMultiAccounting(ip, fingerprint);
evidence.multiAccount = multiAccount;
if (multiAccount.isMultiAccount) {
fraudScore += multiAccount.riskScore;
triggers.push('multi_account');
if (multiAccount.clusteredAccounts > 1) {
triggers.push('account_clustering');
}
}

// 3. VPN/Proxy detection
const vpnResult = await isVPNorProxy(ip);
evidence.vpn = vpnResult;

if (vpnResult.isVpn && FRAUD_CONFIG.BLOCK_VPN_SIGNUPS) {
fraudScore += FRAUD_CONFIG.WEIGHT_VPN_SIGNUP;
triggers.push('vpn_detected');
}
if (vpnResult.isProxy && FRAUD_CONFIG.BLOCK_PROXY_SIGNUPS) {
fraudScore += FRAUD_CONFIG.WEIGHT_PROXY_SIGNUP;
triggers.push('proxy_detected');
}
if (vpnResult.isDatacenter && FRAUD_CONFIG.BLOCK_DATACENTER_SIGNUPS) {
fraudScore += FRAUD_CONFIG.WEIGHT_DATACENTER_SIGNUP;
triggers.push('datacenter_detected');
}

// 4. Rate limiting
const rateLimit = await checkSignupRateLimit(ip, fingerprint);
evidence.rateLimit = rateLimit;

if (rateLimit.ipExceeded) {
fraudScore += FRAUD_CONFIG.WEIGHT_RAPID_SIGNUP_IP;
triggers.push('rapid_signup_ip');
}
if (rateLimit.fingerprintExceeded) {
fraudScore += FRAUD_CONFIG.WEIGHT_RAPID_SIGNUP_FP;
triggers.push('rapid_signup_fingerprint');
}
if (rateLimit.burstExceeded) {
fraudScore += FRAUD_CONFIG.WEIGHT_BURST_SIGNUP;
triggers.push('burst_signup');
}

// Cap score at 100
fraudScore = Math.min(fraudScore, 100);

// Determine risk tier
let riskTier;
if (fraudScore <= FRAUD_CONFIG.SCORE_TIER_SAFE) {
riskTier = RISK_TIER.SAFE;
} else if (fraudScore <= FRAUD_CONFIG.SCORE_TIER_SUSPICIOUS) {
riskTier = RISK_TIER.SUSPICIOUS;
} else if (fraudScore <= FRAUD_CONFIG.SCORE_TIER_HIGH_RISK) {
riskTier = RISK_TIER.HIGH_RISK;
} else {
riskTier = RISK_TIER.BLOCK;
}

return {
fraudScore,
riskTier,
triggers,
isFraudulent: fraudScore >= FRAUD_CONFIG.FRAUD_SCORE_THRESHOLD,
shouldBlock: riskTier === RISK_TIER.BLOCK,
ip,
fingerprint,
vpnDetected: vpnResult.isVpn || vpnResult.isProxy || vpnResult.isDatacenter,
vpnDetails: vpnResult,
rateLimit,
multiAccount,
evidence,
};
};

// ============================================================================
// STRUCTURED FRAUD LOGGING
// ============================================================================
const logFraudEvent = async (userId, triggerType, severity, details, ip, fingerprint) => {
// Validate severity level
const validSeverities = ['low', 'medium', 'high', 'critical'];
const normalizedSeverity = validSeverities.includes(severity) ? severity : 'medium';

// Sanitize details - remove any sensitive information
const sanitizedDetails = sanitizeDetails(details);

await pool.query(
INSERT INTO fraud_logs (user_id, trigger_type, severity, details, ip_address, fingerprint_hash, created_at)
     VALUES ($1, $2, $3, $4, $5::inet, $6, NOW()),
[userId, triggerType, normalizedSeverity, JSON.stringify(sanitizedDetails), ip, fingerprint]
);
};

const sanitizeDetails = (details) => {
if (!details) return {};

let sanitized;
try {
sanitized = JSON.parse(JSON.stringify(details));
} catch (e) {
// If cloning fails, use a simple object with error info
return { error: 'Could not serialize details', originalType: typeof details };
}

const sensitiveFields = ['password', 'pin', 'pin_hash', 'password_hash', 'token', 'secret', 'api_key'];

const redact = (obj) => {
if (!obj || typeof obj !== 'object') return;
for (const key of Object.keys(obj)) {
if (sensitiveFields.some(f => key.toLowerCase().includes(f))) {
obj[key] = '[REDACTED]';
} else if (typeof obj[key] === 'object') {
redact(obj[key]);
}
}
};

redact(sanitized);
return sanitized;
};

// ============================================================================
// HARDENED BLOCK DETECTION
// ============================================================================
const isBlocked = async (ip, fingerprint) => {
const now = new Date();

// Check IP blocks (exact match and CIDR range)
const ipBlock = await pool.query(
SELECT id, reason, blocked_until, ip_address, ip_range 
     FROM blocked_ips 
     WHERE (ip_address = $1::inet OR ($2::inet <<= ip_range))
     AND (blocked_until IS NULL OR blocked_until > $3)
     LIMIT 1,
[ip, ip, now]
);

if (ipBlock.rows.length > 0) {
const block = ipBlock.rows[0];
return { 
blocked: true, 
reason: block.reason || 'IP address blocked', 
source: 'ip',
blockedUntil: block.blocked_until,
blockId: block.id
};
}

// Check fingerprint blocks
const fpBlock = await pool.query(
SELECT id, reason, blocked_until 
     FROM blocked_fingerprints 
     WHERE fingerprint_hash = $1
     AND (blocked_until IS NULL OR blocked_until > $2)
     LIMIT 1,
[fingerprint, now]
);

if (fpBlock.rows.length > 0) {
const block = fpBlock.rows[0];
return { 
blocked: true, 
reason: block.reason || 'Device fingerprint blocked', 
source: 'fingerprint',
blockedUntil: block.blocked_until,
blockId: block.id
};
}

return { blocked: false };
};

// ============================================================================
// RECORD DEVICE (ENHANCED)
// ============================================================================
const recordDevice = async (userId, req, fingerprint, ip, vpnDetected) => {
const userAgent = req.headers['user-agent'] || '';
const platform = req.headers['sec-ch-ua-platform']?.replace(/"/g, '') || 
(userAgent.includes('Windows') ? 'Windows' :
userAgent.includes('Mac') ? 'macOS' :
userAgent.includes('Linux') ? 'Linux' :
userAgent.includes('Android') ? 'Android' :
userAgent.includes('iPhone') || userAgent.includes('iPad') ? 'iOS' : 'Unknown');

const browser = req.headers['sec-ch-ua']?.split(';')[0]?.replace(/"/g, '') ||
(userAgent.includes('Chrome') ? 'Chrome' :
userAgent.includes('Firefox') ? 'Firefox' :
userAgent.includes('Safari') ? 'Safari' :
userAgent.includes('Edge') ? 'Edge' : 'Unknown');

const vpnDetails = typeof vpnDetected === 'object' ? vpnDetected : { isVpn: vpnDetected };

await pool.query(
INSERT INTO user_devices (user_id, fingerprint_hash, ip_address, user_agent, 
      platform, browser, is_vpn, is_proxy, is_datacenter, last_seen_at, created_at)
     VALUES ($1, $2, $3::inet, $4, $5, $6, $7, $8, $9, NOW(), NOW())
     ON CONFLICT (fingerprint_hash, user_id) DO UPDATE
     SET last_seen_at = NOW(),
         ip_address = EXCLUDED.ip_address,
         user_agent = EXCLUDED.user_agent,
[
userId, fingerprint, ip, userAgent, platform, browser, 
vpnDetails.isVpn || false, vpnDetails.isProxy || false, vpnDetails.isDatacenter || false
]
);
};

// ============================================================================
// EXPORTS (UNCHANGED SIGNATURES)
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
RISK_TIER,
};