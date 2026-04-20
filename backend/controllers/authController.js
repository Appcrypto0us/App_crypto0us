const { pool } = require('../config/db');
const { hash, compare } = require('../utils/bcrypt');
const { generateToken } = require('../utils/jwt');
const { sendOTP, sendWelcome } = require('../services/emailService');
const generateCode = require('../utils/generateCode');
const referralService = require('../services/referralService');
const antiFraudService = require('../services/antiFraudService');

// ============================================================================
// REGISTER
// ============================================================================
exports.register = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { email, phone, first_name, password, pin, referral_code } = req.body;
    
    // Get client IP and fingerprint from middleware
    const ip = req.clientIP || antiFraudService.getClientIP(req);
    const fingerprint = req.fingerprint || antiFraudService.generateFingerprint(req);

    // ========================================================================
    // ANTI-FRAUD CHECKS
    // ========================================================================
    
    // Check if IP or fingerprint is blocked
    const blockCheck = await antiFraudService.isBlocked(ip, fingerprint);
    if (blockCheck.blocked) {
      await client.query('ROLLBACK');
      console.warn(`🚫 Blocked registration attempt from ${ip} (${blockCheck.reason})`);
      return res.status(403).json({ 
        message: 'Access denied. Please contact support.',
        code: 'ACCESS_BLOCKED'
      });
    }
    
    // Calculate fraud score
    const fraudCheck = await antiFraudService.calculateFraudScore(req, referral_code);
    
    // Block high-risk signups (fraud score >= 100)
    if (fraudCheck.isFraudulent && fraudCheck.fraudScore >= 100) {
      await client.query('ROLLBACK');
      
      // Log fraud attempt (no user ID yet - log asynchronously after rollback)
      antiFraudService.logFraudEvent(
        null, 'high_fraud_score', 'critical',
        fraudCheck, ip, fingerprint
      ).catch(e => console.error('Failed to log fraud event:', e.message));
      
      console.warn(`🚫 High fraud score (${fraudCheck.fraudScore}) blocked for ${email}`);
      return res.status(403).json({ 
        message: 'Registration blocked due to suspicious activity.',
        code: 'FRAUD_DETECTED'
      });
    }
    
    // Check self-referral
    let validReferralCode = referral_code;
    let referralEligible = true;
    
    if (referral_code) {
      const selfReferral = await antiFraudService.detectSelfReferral(referral_code, ip, fingerprint);
      
      if (selfReferral.isSelfReferral) {
        // Log self-referral attempt
        antiFraudService.logFraudEvent(
          null, 'self_referral', 'high',
          { referral_code, ...selfReferral }, ip, fingerprint
        ).catch(e => console.error('Failed to log self-referral:', e.message));
        
        console.warn(`🚫 Self-referral detected for ${email} using code ${referral_code}`);
        
        // Invalidate referral code for this registration
        validReferralCode = null;
        referralEligible = false;
      }
      
      if (selfReferral.invalidCode) {
        // Referral code doesn't exist - ignore it
        validReferralCode = null;
      }
    }

    // Check existing user
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1 OR phone = $2',
      [email, phone]
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'User with that email or phone already exists' });
    }

    // Hash password and PIN
    const passwordHash = await hash(password);
    const pinHash = await hash(pin);

    // Generate unique referral code
    const refCode = `CL${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Find referrer if valid referral code provided
    let referredBy = null;
    if (validReferralCode) {
      const refResult = await client.query(
        `SELECT id, created_at FROM users 
         WHERE referral_code = $1 AND is_active = true`,
        [validReferralCode]
      );
      
      if (refResult.rows.length > 0) {
        const referrer = refResult.rows[0];
        
        // Check referrer account age (must be at least 30 days old)
        const accountAgeDays = (new Date() - new Date(referrer.created_at)) / (1000 * 60 * 60 * 24);
        
        if (accountAgeDays >= antiFraudService.FRAUD_CONFIG.REFERRAL_COOLDOWN_DAYS) {
          referredBy = referrer.id;
        } else {
          referralEligible = false;
          console.log(`⚠️ Referrer account too new (${accountAgeDays.toFixed(1)} days) for ${email}`);
        }
      }
    }

    // Create user (inactive until OTP verified)
    const userResult = await client.query(
      `INSERT INTO users (email, phone, first_name, password_hash, pin_hash, 
        referral_code, referred_by, is_active, email_verified, 
        signup_ip, signup_fingerprint, fraud_score, referral_eligible)
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, FALSE, $8::inet, $9, $10, $11)
       RETURNING id, email, phone, first_name, referral_code`,
      [email, phone, first_name, passwordHash, pinHash, refCode, referredBy, 
       ip, fingerprint, fraudCheck.fraudScore, referralEligible]
    );
    const user = userResult.rows[0];

    // Create wallet
    await client.query(
      'INSERT INTO wallets (user_id, balance, available_balance) VALUES ($1, 0, 0)',
      [user.id]
    );

    // Generate OTP
    const otp = generateCode(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await client.query(
      'INSERT INTO otp_verifications (user_id, email, otp, expires_at) VALUES ($1, $2, $3, $4)',
      [user.id, email, otp, expiresAt]
    );

    // ========================================================================
    // COMMIT TRANSACTION FIRST - User now exists in database
    // ========================================================================
    await client.query('COMMIT');

    // ========================================================================
    // AFTER COMMIT - These operations run AFTER user is committed to database
    // This fixes the foreign key constraint violation
    // ========================================================================
    
    // Record device information (user ID now exists in database)
    try {
      await antiFraudService.recordDevice(user.id, req, fingerprint, ip, fraudCheck.vpnDetected);
    } catch (deviceError) {
      console.error('⚠️ Failed to record device (non-critical):', deviceError.message);
      // Don't fail registration if device recording fails
    }

    // Log fraud triggers if any (account created but flagged)
    if (fraudCheck.triggers.length > 0) {
      try {
        await antiFraudService.logFraudEvent(
          user.id, 'fraud_triggers', 'medium',
          { triggers: fraudCheck.triggers, fraudScore: fraudCheck.fraudScore }, 
          ip, fingerprint
        );
        console.log(`⚠️ User ${email} flagged with triggers: ${fraudCheck.triggers.join(', ')}`);
      } catch (logError) {
        console.error('⚠️ Failed to log fraud event:', logError.message);
      }
    }

    // Send OTP email (async, non-blocking)
    sendOTP(email, otp).catch(console.error);

    res.status(201).json({
      message: 'Registration successful. Please check your email for verification code.',
      userId: user.id,
      email: user.email,
      ...(fraudCheck.triggers.length > 0 && { 
        warning: 'Additional verification may be required.' 
      }),
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  } finally {
    client.release();
  }
};

// ============================================================================
// VERIFY OTP
// ============================================================================
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userRes = await client.query(
      'SELECT id, first_name, referred_by, referral_eligible FROM users WHERE email = $1', 
      [email]
    );
    if (userRes.rows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }
    const userId = userRes.rows[0].id;
    const firstName = userRes.rows[0].first_name;
    const referredBy = userRes.rows[0].referred_by;
    const referralEligible = userRes.rows[0].referral_eligible;

    const otpRes = await client.query(
      `SELECT id FROM otp_verifications
       WHERE user_id = $1 AND email = $2 AND otp = $3 AND expires_at > NOW() AND verified = FALSE`,
      [userId, email, otp]
    );
    if (otpRes.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await client.query('UPDATE otp_verifications SET verified = TRUE WHERE id = $1', [otpRes.rows[0].id]);
    await client.query(
      'UPDATE users SET is_active = TRUE, email_verified = TRUE, updated_at = NOW() WHERE id = $1',
      [userId]
    );

    // Grant signup bonus ONLY if referral is eligible (not self-referral, account age ok)
    if (referredBy && referralEligible) {
      await referralService.grantSignupBonus(client, referredBy, userId, firstName);
      console.log(`✅ Referral bonus granted: ${firstName} referred by user ${referredBy}`);
    } else if (referredBy && !referralEligible) {
      console.log(`⚠️ Referral bonus skipped (ineligible) for ${firstName}`);
    }

    await client.query('COMMIT');

    // Send welcome email
    sendWelcome(email, firstName).catch(console.error);

    res.json({ message: 'Email verified successfully. You can now login.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('OTP verify error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// ============================================================================
// LOGIN
// ============================================================================
exports.login = async (req, res) => {
  const { phone, pin } = req.body;
  const ip = antiFraudService.getClientIP(req);
  
  try {
    const result = await pool.query(
      `SELECT id, email, phone, first_name, is_admin, is_active, email_verified, 
              pin_hash, referral_code, kyc_status, fraud_score, referral_eligible
       FROM users WHERE phone = $1`,
      [phone]
    );
    if (result.rows.length === 0) {
      // Log failed login attempt
      console.log(`⚠️ Failed login attempt for non-existent phone: ${phone} from ${ip}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const user = result.rows[0];
    
    if (!user.is_active || !user.email_verified) {
      return res.status(401).json({ message: 'Account not verified or suspended' });
    }
    
    const pinMatch = await compare(pin, user.pin_hash);
    if (!pinMatch) {
      // Log failed PIN attempt
      console.log(`⚠️ Failed PIN attempt for ${phone} from ${ip}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const walletRes = await pool.query(
      `SELECT balance, available_balance, total_deposited, total_withdrawn, total_profit, active_investments 
       FROM wallets WHERE user_id = $1`,
      [user.id]
    );
    const wallet = walletRes.rows[0] || {};

    const token = generateToken(user);

    // Log successful login
    console.log(`✅ Successful login: ${user.email} (fraud_score: ${user.fraud_score})`);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        first_name: user.first_name,
        is_admin: user.is_admin,
        kyc_status: user.kyc_status,
        referral_code: user.referral_code,
        fraud_score: user.fraud_score,
        referral_eligible: user.referral_eligible,
        wallet,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// GET ME
// ============================================================================
exports.getMe = async (req, res) => {
  try {
    const userRes = await pool.query(
      `SELECT id, email, phone, first_name, is_admin, is_active, email_verified, 
              kyc_status, referral_code, created_at, fraud_score, referral_eligible
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    const walletRes = await pool.query(
      `SELECT balance, available_balance, total_deposited, total_withdrawn, total_profit, active_investments 
       FROM wallets WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({
      user: userRes.rows[0],
      wallet: walletRes.rows[0] || {},
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// RESEND OTP
// ============================================================================
exports.resendOTP = async (req, res) => {
  const { email } = req.body;
  const ip = antiFraudService.getClientIP(req);
  
  try {
    const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userId = userRes.rows[0].id;

    // Rate limit OTP resend (max 5 per hour per IP)
    const rateCheck = await pool.query(
      `SELECT COUNT(*) as count FROM otp_verifications 
       WHERE email = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
      [email]
    );
    
    if (parseInt(rateCheck.rows[0].count) >= 5) {
      console.warn(`🚫 OTP rate limit exceeded for ${email} from ${ip}`);
      return res.status(429).json({ 
        message: 'Too many OTP requests. Please try again later.',
        code: 'RATE_LIMIT'
      });
    }

    const otp = generateCode(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await pool.query(
      'INSERT INTO otp_verifications (user_id, email, otp, expires_at) VALUES ($1, $2, $3, $4)',
      [userId, email, otp, expiresAt]
    );

    await sendOTP(email, otp);
    res.json({ message: 'New OTP sent to your email' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};