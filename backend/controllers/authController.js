const { pool } = require('../config/db');
const { hash, compare } = require('../utils/bcrypt');
const { generateToken } = require('../utils/jwt');
const { sendOTP, sendWelcome } = require('../services/emailService');
const generateCode = require('../utils/generateCode');
const referralService = require('../services/referralService');

exports.register = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { email, phone, first_name, password, pin, referral_code } = req.body;

    // Check existing user
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1 OR phone = $2',
      [email, phone]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'User with that email or phone already exists' });
    }

    // Hash password and PIN
    const passwordHash = await hash(password);
    const pinHash = await hash(pin);

    // Generate unique referral code
    const refCode = `CL${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Find referrer if any
    let referredBy = null;
    if (referral_code) {
      const refResult = await client.query(
        'SELECT id FROM users WHERE referral_code = $1',
        [referral_code]
      );
      if (refResult.rows.length > 0) {
        referredBy = refResult.rows[0].id;
      }
    }

    // Create user (inactive until OTP verified)
    const userResult = await client.query(
      `INSERT INTO users (email, phone, first_name, password_hash, pin_hash, referral_code, referred_by, is_active, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, FALSE)
       RETURNING id, email, phone, first_name, referral_code`,
      [email, phone, first_name, passwordHash, pinHash, refCode, referredBy]
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

    await client.query('COMMIT');

    // Send OTP email (async)
    sendOTP(email, otp).catch(console.error);

    res.status(201).json({
      message: 'Registration successful. Please check your email for verification code.',
      userId: user.id,
      email: user.email,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  } finally {
    client.release();
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const userRes = await client.query('SELECT id, first_name FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }
    const userId = userRes.rows[0].id;
    const firstName = userRes.rows[0].first_name;

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

    const userData = await client.query('SELECT referred_by FROM users WHERE id = $1', [userId]);
    if (userData.rows[0].referred_by) {
      await referralService.grantSignupBonus(client, userData.rows[0].referred_by, userId, firstName);
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

exports.login = async (req, res) => {
  const { phone, pin } = req.body;
  try {
    const result = await pool.query(
      `SELECT id, email, phone, first_name, is_admin, is_active, email_verified, pin_hash, referral_code, kyc_status
       FROM users WHERE phone = $1`,
      [phone]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const user = result.rows[0];
    if (!user.is_active || !user.email_verified) {
      return res.status(401).json({ message: 'Account not verified or suspended' });
    }
    const pinMatch = await compare(pin, user.pin_hash);
    if (!pinMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const walletRes = await pool.query(
      `SELECT balance, available_balance, total_deposited, total_withdrawn, total_profit, active_investments 
       FROM wallets WHERE user_id = $1`,
      [user.id]
    );
    const wallet = walletRes.rows[0] || {};

    const token = generateToken(user);

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
        wallet,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const userRes = await pool.query(
      `SELECT id, email, phone, first_name, is_admin, is_active, email_verified, kyc_status, referral_code, created_at
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

exports.resendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userId = userRes.rows[0].id;

    const otp = generateCode(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await pool.query(
      'INSERT INTO otp_verifications (user_id, email, otp, expires_at) VALUES ($1, $2, $3, $4)',
      [userId, email, otp, expiresAt]
    );

    await sendOTP(email, otp);
    res.json({ message: 'New OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
