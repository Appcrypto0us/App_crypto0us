const { pool } = require('../config/db');
const INVESTMENT_PLANS = require('../services/investmentPlans');
const investmentService = require('../services/investmentService');

exports.getUserInvestments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM investments 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get investments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getInvestmentPlans = async (req, res) => {
  res.json(INVESTMENT_PLANS);
};

exports.createInvestment = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { plan_id, amount } = req.body;
    const plan = INVESTMENT_PLANS[plan_id];
    
    if (!plan) {
      return res.status(400).json({ message: 'Invalid investment plan' });
    }
    
    const { capital_range_min, capital_range_max, duration_days, profit_interval_hours } = plan.details;
    
    if (amount < capital_range_min || amount > capital_range_max) {
      return res.status(400).json({ 
        message: `Amount must be between $${capital_range_min} and $${capital_range_max}` 
      });
    }
    
    // Check wallet balance
    const walletRes = await client.query(
      'SELECT available_balance FROM wallets WHERE user_id = $1 FOR UPDATE',
      [req.user.id]
    );
    
    if (walletRes.rows.length === 0 || walletRes.rows[0].available_balance < amount) {
      return res.status(400).json({ message: 'Insufficient available balance' });
    }
    
    // Deduct from wallet
    await client.query(
      `UPDATE wallets 
       SET available_balance = available_balance - $1,
           active_investments = active_investments + $1,
           updated_at = NOW()
       WHERE user_id = $2`,
      [amount, req.user.id]
    );
    
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + duration_days);
    
    const nextPayout = new Date(now);
    nextPayout.setHours(now.getHours() + profit_interval_hours);
    
    const expectedTotal = amount * (1 + (plan.details.daily_return_rate * duration_days) / 100);
    
    const invResult = await client.query(
      `INSERT INTO investments 
       (user_id, plan_id, plan_name, amount, start_date, end_date, profit_interval_hours, 
        last_payout, next_payout, expected_total, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
       RETURNING *`,
      [req.user.id, plan_id, plan.plan_name, amount, now, endDate, profit_interval_hours,
       now, nextPayout, expectedTotal]
    );
    
    // Record transaction
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, status, description, created_at)
       VALUES ($1, 'investment', $2, 'completed', $3, NOW())`,
      [req.user.id, amount, `Invested in ${plan.plan_name} plan`]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json(invResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create investment error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};
