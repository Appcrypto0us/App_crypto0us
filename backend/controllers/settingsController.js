const { pool } = require('../config/db');
const { hash, compare } = require('../utils/bcrypt');

exports.updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Both old and new passwords are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    
    const userRes = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );
    
    const passwordMatch = await compare(oldPassword, userRes.rows[0].password_hash);
    if (!passwordMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    const newHash = await hash(newPassword);
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, req.user.id]
    );
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPaymentMethods = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT mpesa_phone, crypto_wallet_address, crypto_network, bank_details FROM user_payment_methods WHERE user_id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        mpesa_phone: null,
        crypto_wallet_address: null,
        crypto_network: null,
        bank_details: null,
      });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updatePaymentMethods = async (req, res) => {
  try {
    const { mpesa_phone, crypto_wallet_address, crypto_network, bank_details } = req.body;
    
    await pool.query(
      `INSERT INTO user_payment_methods (user_id, mpesa_phone, crypto_wallet_address, crypto_network, bank_details)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO UPDATE
       SET mpesa_phone = EXCLUDED.mpesa_phone,
           crypto_wallet_address = EXCLUDED.crypto_wallet_address,
           crypto_network = EXCLUDED.crypto_network,
           bank_details = EXCLUDED.bank_details,
           updated_at = NOW()`,
      [req.user.id, mpesa_phone, crypto_wallet_address, crypto_network, bank_details]
    );
    
    res.json({ message: 'Payment methods updated successfully' });
  } catch (error) {
    console.error('Update payment methods error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
