const { pool } = require('../config/db');

exports.getReferrals = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.first_name, u.created_at, u.total_deposited
       FROM users u
       WHERE u.referred_by = (SELECT id FROM users WHERE id = $1)
       ORDER BY u.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, type, amount, status, description, created_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const walletRes = await pool.query(
      'SELECT * FROM wallets WHERE user_id = $1',
      [req.user.id]
    );
    const invRes = await pool.query(
      `SELECT COUNT(*) as total, SUM(amount) as total_amount 
       FROM investments WHERE user_id = $1 AND status = 'active'`,
      [req.user.id]
    );
    res.json({
      wallet: walletRes.rows[0],
      activeInvestments: parseInt(invRes.rows[0].total) || 0,
      activeAmount: parseFloat(invRes.rows[0].total_amount) || 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
