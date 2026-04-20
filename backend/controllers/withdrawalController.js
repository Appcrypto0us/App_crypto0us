const { pool } = require('../config/db');
const conversionService = require('../services/conversionService');

exports.getPendingWithdrawals = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM withdrawals 
       WHERE user_id = $1 AND status = 'pending'
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get pending withdrawals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createWithdrawal = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { amount_usd, method, details } = req.body;
    
    const minWithdrawal = parseFloat((await conversionService.getSystemConfig('min_withdrawal_usd')) || 10);
    if (amount_usd < minWithdrawal) {
      return res.status(400).json({ message: `Minimum withdrawal is $${minWithdrawal}` });
    }
    
    const feePercent = parseFloat((await conversionService.getSystemConfig('withdrawal_fee_percent')) || 1);
    const fee_usd = parseFloat((amount_usd * feePercent / 100).toFixed(2));
    const net_amount_usd = parseFloat((amount_usd - fee_usd).toFixed(2));
    
    // Check balance
    const walletRes = await client.query(
      'SELECT available_balance FROM wallets WHERE user_id = $1 FOR UPDATE',
      [req.user.id]
    );
    
    if (walletRes.rows.length === 0 || walletRes.rows[0].available_balance < amount_usd) {
      return res.status(400).json({ message: 'Insufficient available balance' });
    }
    
    // Deduct from wallet
    await client.query(
      `UPDATE wallets 
       SET available_balance = available_balance - $1,
           balance = balance - $1,
           total_withdrawn = total_withdrawn + $1,
           updated_at = NOW()
       WHERE user_id = $2`,
      [amount_usd, req.user.id]
    );
    
    let amount_kes = null;
    if (method === 'mpesa') {
      amount_kes = await conversionService.usdToKes(net_amount_usd);
    }
    
    const result = await client.query(
      `INSERT INTO withdrawals 
       (user_id, amount_usd, amount_kes, fee_usd, net_amount_usd, method, details, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [req.user.id, amount_usd, amount_kes, fee_usd, net_amount_usd, method, details]
    );
    
    // Record transaction
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, status, description, created_at)
       VALUES ($1, 'withdrawal', $2, 'pending', $3, NOW())`,
      [req.user.id, amount_usd, `Withdrawal via ${method} — awaiting approval`]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create withdrawal error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};
