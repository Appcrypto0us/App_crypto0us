const { pool } = require('../config/db');
const conversionService = require('../services/conversionService');

exports.getPendingDeposits = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM deposits 
       WHERE user_id = $1 AND status = 'pending'
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get pending deposits error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createDeposit = async (req, res) => {
  try {
    const { amount_usd, method, transaction_code, phone_number, wallet_address, network } = req.body;
    
    const minDeposit = parseFloat((await conversionService.getSystemConfig('min_deposit_usd')) || 5);
    if (amount_usd < minDeposit) {
      return res.status(400).json({ message: `Minimum deposit is $${minDeposit}` });
    }
    
    let amount_kes = null;
    if (method === 'mpesa') {
      amount_kes = await conversionService.usdToKes(amount_usd);
    }
    
    const result = await pool.query(
      `INSERT INTO deposits 
       (user_id, amount_usd, amount_kes, method, transaction_code, phone_number, wallet_address, network, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING *`,
      [req.user.id, amount_usd, amount_kes, method, transaction_code, phone_number, wallet_address, network]
    );
    
    // Record transaction
    await pool.query(
      `INSERT INTO transactions (user_id, type, amount, status, description, created_at)
       VALUES ($1, 'deposit', $2, 'pending_approval', $3, NOW())`,
      [req.user.id, amount_usd, `Deposit via ${method} — awaiting approval`]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create deposit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDepositInstructions = async (req, res) => {
  try {
    const mpesaPaybill = await conversionService.getSystemConfig('mpesa_paybill');
    const mpesaAccount = await conversionService.getSystemConfig('mpesa_account');
    const btcAddress = await conversionService.getSystemConfig('crypto_btc_address');
    const usdtAddress = await conversionService.getSystemConfig('crypto_usdt_address');
    const rate = parseFloat(await conversionService.getSystemConfig('usd_to_kes') || 129);
    
    res.json({
      mpesa: { paybill: mpesaPaybill, account: mpesaAccount },
      crypto: { btc: btcAddress, usdt: usdtAddress },
      usd_to_kes: rate,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
