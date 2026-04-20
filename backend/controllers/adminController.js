const { pool } = require('../config/db');
const referralService = require('../services/referralService');
const { sendBroadcast } = require('../services/emailService');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function fmt(n) {
  return '$' + (parseFloat(n) || 0).toFixed(2);
}

// ============================================================================
// STATS
// ============================================================================
exports.getStats = async (req, res) => {
  try {
    const usersRes = await pool.query('SELECT COUNT(*) FROM users');
    const activeUsersRes = await pool.query('SELECT COUNT(*) FROM users WHERE is_active = true');
    const depositsRes = await pool.query('SELECT COALESCE(SUM(total_deposited), 0) FROM wallets');
    const withdrawalsRes = await pool.query('SELECT COALESCE(SUM(total_withdrawn), 0) FROM wallets');
    const profitRes = await pool.query('SELECT COALESCE(SUM(total_profit), 0) FROM wallets');
    const pendingDepositsRes = await pool.query('SELECT COUNT(*) FROM deposits WHERE status = $1', ['pending']);
    const pendingWithdrawalsRes = await pool.query('SELECT COUNT(*) FROM withdrawals WHERE status = $1', ['pending']);
    const activeInvestmentsRes = await pool.query('SELECT COUNT(*) FROM investments WHERE status = $1', ['active']);
    const pendingKYCRes = await pool.query('SELECT COUNT(*) FROM kyc_submissions WHERE status = $1', ['pending']);
    const totalInvestmentsRes = await pool.query('SELECT COALESCE(SUM(amount), 0) FROM investments');
    const todayDepositsRes = await pool.query(
      `SELECT COALESCE(SUM(amount_usd), 0) FROM deposits 
       WHERE status = 'approved' AND DATE(created_at) = CURRENT_DATE`
    );
    const todayWithdrawalsRes = await pool.query(
      `SELECT COALESCE(SUM(amount_usd), 0) FROM withdrawals 
       WHERE status = 'approved' AND DATE(created_at) = CURRENT_DATE`
    );
    const newUsersTodayRes = await pool.query(
      `SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURRENT_DATE`
    );
    const highFraudUsersRes = await pool.query('SELECT COUNT(*) FROM users WHERE fraud_score >= 50');
    const blockedIPsRes = await pool.query('SELECT COUNT(*) FROM blocked_ips WHERE blocked_until IS NULL OR blocked_until > NOW()');

    res.json({
      totalUsers: parseInt(usersRes.rows[0].count),
      activeUsers: parseInt(activeUsersRes.rows[0].count),
      totalDeposits: parseFloat(depositsRes.rows[0].sum),
      totalWithdrawals: parseFloat(withdrawalsRes.rows[0].sum),
      totalProfit: parseFloat(profitRes.rows[0].sum),
      pendingDeposits: parseInt(pendingDepositsRes.rows[0].count),
      pendingWithdrawals: parseInt(pendingWithdrawalsRes.rows[0].count),
      activeInvestments: parseInt(activeInvestmentsRes.rows[0].count),
      pendingKYC: parseInt(pendingKYCRes.rows[0].count),
      totalInvested: parseFloat(totalInvestmentsRes.rows[0].sum),
      todayDeposits: parseFloat(todayDepositsRes.rows[0].sum),
      todayWithdrawals: parseFloat(todayWithdrawalsRes.rows[0].sum),
      newUsersToday: parseInt(newUsersTodayRes.rows[0].count),
      netBalance: parseFloat(depositsRes.rows[0].sum) - parseFloat(withdrawalsRes.rows[0].sum) - parseFloat(profitRes.rows[0].sum),
      highFraudUsers: parseInt(highFraudUsersRes.rows[0].count),
      blockedIPs: parseInt(blockedIPsRes.rows[0].count),
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// USERS
// ============================================================================
exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.*, w.balance, w.available_balance, w.total_deposited, w.total_withdrawn, w.total_profit, w.active_investments
       FROM users u
       LEFT JOIN wallets w ON u.id = w.user_id
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await pool.query('UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [userId]);
    res.json({ message: 'User suspended' });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await pool.query('UPDATE users SET is_active = TRUE, updated_at = NOW() WHERE id = $1', [userId]);
    res.json({ message: 'User reactivated' });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.editBalance = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { userId } = req.params;
    const { balance } = req.body;

    // Get old balance for transaction record
    const oldWallet = await client.query(
      'SELECT balance FROM wallets WHERE user_id = $1',
      [userId]
    );
    const oldBalance = oldWallet.rows[0]?.balance || 0;
    const difference = parseFloat(balance) - parseFloat(oldBalance);

    await client.query(
      `UPDATE wallets 
       SET balance = $1, available_balance = $1, updated_at = NOW()
       WHERE user_id = $2`,
      [balance, userId]
    );

    await client.query(
      `INSERT INTO transactions (user_id, type, amount, status, description, created_at)
       VALUES ($1, 'admin_adjustment', $2, 'completed', $3, NOW())`,
      [userId, Math.abs(difference), `Balance adjusted by admin (${difference > 0 ? '+' : ''}${fmt(difference)})`]
    );

    await client.query('COMMIT');
    res.json({ message: 'Balance updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Edit balance error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// ============================================================================
// DEPOSITS
// ============================================================================
exports.getPendingDeposits = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, u.first_name, u.email, u.phone
       FROM deposits d
       JOIN users u ON d.user_id = u.id
       WHERE d.status = 'pending'
       ORDER BY d.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get pending deposits error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveDeposit = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { depositId } = req.params;

    const depositRes = await client.query(
      'SELECT * FROM deposits WHERE id = $1 AND status = $2 FOR UPDATE',
      [depositId, 'pending']
    );

    if (depositRes.rows.length === 0) {
      return res.status(404).json({ message: 'Deposit not found or already processed' });
    }

    const deposit = depositRes.rows[0];

    // Update wallet
    await client.query(
      `UPDATE wallets 
       SET balance = balance + $1,
           available_balance = available_balance + $1,
           total_deposited = total_deposited + $1,
           updated_at = NOW()
       WHERE user_id = $2`,
      [deposit.amount_usd, deposit.user_id]
    );

    // Update deposit status
    await client.query(
      `UPDATE deposits 
       SET status = 'approved', approved_by = $1, approved_at = NOW()
       WHERE id = $2`,
      [req.user.id, depositId]
    );

    // Update transaction
    await client.query(
      `UPDATE transactions 
       SET status = 'completed', description = description || ' — approved'
       WHERE user_id = $1 AND type = 'deposit' AND amount = $2 AND status = 'pending_approval'`,
      [deposit.user_id, deposit.amount_usd]
    );

    // Process referral commission
    const userRes = await client.query(
      'SELECT referred_by, first_name FROM users WHERE id = $1',
      [deposit.user_id]
    );

    if (userRes.rows[0]?.referred_by) {
      await referralService.grantDepositCommission(
        client, 
        userRes.rows[0].referred_by, 
        deposit.amount_usd, 
        deposit.user_id,
        depositId
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Deposit approved successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Approve deposit error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

exports.rejectDeposit = async (req, res) => {
  try {
    const { depositId } = req.params;

    const depositRes = await pool.query(
      'SELECT * FROM deposits WHERE id = $1 AND status = $2',
      [depositId, 'pending']
    );

    if (depositRes.rows.length === 0) {
      return res.status(404).json({ message: 'Deposit not found or already processed' });
    }

    const deposit = depositRes.rows[0];

    await pool.query(
      `UPDATE deposits 
       SET status = 'rejected', approved_by = $1, approved_at = NOW()
       WHERE id = $2`,
      [req.user.id, depositId]
    );

    await pool.query(
      `UPDATE transactions 
       SET status = 'rejected', description = description || ' — rejected'
       WHERE user_id = $1 AND type = 'deposit' AND amount = $2 AND status = 'pending_approval'`,
      [deposit.user_id, deposit.amount_usd]
    );

    res.json({ message: 'Deposit rejected' });
  } catch (error) {
    console.error('Reject deposit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// WITHDRAWALS
// ============================================================================
exports.getPendingWithdrawals = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.*, u.first_name, u.email, u.phone
       FROM withdrawals w
       JOIN users u ON w.user_id = u.id
       WHERE w.status = 'pending'
       ORDER BY w.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get pending withdrawals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;

    const withdrawalRes = await pool.query(
      'SELECT * FROM withdrawals WHERE id = $1 AND status = $2',
      [withdrawalId, 'pending']
    );

    if (withdrawalRes.rows.length === 0) {
      return res.status(404).json({ message: 'Withdrawal not found or already processed' });
    }

    const withdrawal = withdrawalRes.rows[0];

    await pool.query(
      `UPDATE withdrawals 
       SET status = 'approved', approved_by = $1, approved_at = NOW(), completed_at = NOW()
       WHERE id = $2`,
      [req.user.id, withdrawalId]
    );

    await pool.query(
      `UPDATE transactions 
       SET status = 'completed', description = description || ' — approved'
       WHERE user_id = $1 AND type = 'withdrawal' AND amount = $2 AND status = 'pending'`,
      [withdrawal.user_id, withdrawal.amount_usd]
    );

    res.json({ message: 'Withdrawal approved successfully' });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.rejectWithdrawal = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { withdrawalId } = req.params;

    const withdrawalRes = await client.query(
      'SELECT * FROM withdrawals WHERE id = $1 AND status = $2 FOR UPDATE',
      [withdrawalId, 'pending']
    );

    if (withdrawalRes.rows.length === 0) {
      return res.status(404).json({ message: 'Withdrawal not found or already processed' });
    }

    const withdrawal = withdrawalRes.rows[0];

    // Refund to wallet
    await client.query(
      `UPDATE wallets 
       SET available_balance = available_balance + $1,
           balance = balance + $1,
           total_withdrawn = total_withdrawn - $1,
           updated_at = NOW()
       WHERE user_id = $2`,
      [withdrawal.amount_usd, withdrawal.user_id]
    );

    await client.query(
      `UPDATE withdrawals 
       SET status = 'rejected', approved_by = $1, approved_at = NOW()
       WHERE id = $2`,
      [req.user.id, withdrawalId]
    );

    await client.query(
      `UPDATE transactions 
       SET status = 'rejected', description = description || ' — rejected & refunded'
       WHERE user_id = $1 AND type = 'withdrawal' AND amount = $2 AND status = 'pending'`,
      [withdrawal.user_id, withdrawal.amount_usd]
    );

    // Add refund transaction
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, status, description, created_at)
       VALUES ($1, 'withdrawal_refund', $2, 'completed', $3, NOW())`,
      [withdrawal.user_id, withdrawal.amount_usd, 'Withdrawal rejected and refunded']
    );

    await client.query('COMMIT');
    res.json({ message: 'Withdrawal rejected and refunded' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reject withdrawal error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// ============================================================================
// KYC
// ============================================================================
exports.getPendingKYC = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT k.*, u.first_name, u.email, u.phone
       FROM kyc_submissions k
       JOIN users u ON k.user_id = u.id
       WHERE k.status = 'pending'
       ORDER BY k.created_at ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get pending KYC error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveKYC = async (req, res) => {
  try {
    const { kycId } = req.params;

    const kycRes = await pool.query(
      'SELECT user_id FROM kyc_submissions WHERE id = $1',
      [kycId]
    );

    if (kycRes.rows.length === 0) {
      return res.status(404).json({ message: 'KYC submission not found' });
    }

    await pool.query(
      `UPDATE kyc_submissions 
       SET status = 'verified', reviewed_by = $1, reviewed_at = NOW()
       WHERE id = $2`,
      [req.user.id, kycId]
    );

    await pool.query(
      `UPDATE users SET kyc_status = 'verified', updated_at = NOW() WHERE id = $1`,
      [kycRes.rows[0].user_id]
    );

    res.json({ message: 'KYC approved successfully' });
  } catch (error) {
    console.error('Approve KYC error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.rejectKYC = async (req, res) => {
  try {
    const { kycId } = req.params;
    const { reason } = req.body;

    const kycRes = await pool.query(
      'SELECT user_id FROM kyc_submissions WHERE id = $1',
      [kycId]
    );

    if (kycRes.rows.length === 0) {
      return res.status(404).json({ message: 'KYC submission not found' });
    }

    await pool.query(
      `UPDATE kyc_submissions 
       SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), rejection_reason = $2
       WHERE id = $3`,
      [req.user.id, reason || 'No reason provided', kycId]
    );

    await pool.query(
      `UPDATE users SET kyc_status = 'rejected', updated_at = NOW() WHERE id = $1`,
      [kycRes.rows[0].user_id]
    );

    res.json({ message: 'KYC rejected' });
  } catch (error) {
    console.error('Reject KYC error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// INVESTMENTS
// ============================================================================
exports.getAllInvestments = async (req, res) => {
  try {
    const { limit = 200, offset = 0 } = req.query;
    const result = await pool.query(
      `SELECT i.*, u.first_name, u.email, u.phone
       FROM investments i
       JOIN users u ON i.user_id = u.id
       ORDER BY i.created_at DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), parseInt(offset)]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get all investments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getActiveInvestments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, u.first_name, u.email, u.phone
       FROM investments i
       JOIN users u ON i.user_id = u.id
       WHERE i.status = 'active'
       ORDER BY i.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get active investments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCompletedInvestments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, u.first_name, u.email, u.phone
       FROM investments i
       JOIN users u ON i.user_id = u.id
       WHERE i.status = 'completed'
       ORDER BY i.created_at DESC
       LIMIT 200`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get completed investments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// TRANSACTIONS
// ============================================================================
exports.getAllTransactions = async (req, res) => {
  try {
    const { limit = 500, offset = 0, type, status } = req.query;

    let query = `
      SELECT t.*, u.first_name, u.email, u.phone
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      params.push(type);
      query += ` AND t.type = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND t.status = $${params.length}`;
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserTransactions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100 } = req.query;

    const result = await pool.query(
      `SELECT * FROM transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, parseInt(limit)]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// BROADCAST
// ============================================================================
exports.broadcastMessage = async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    const usersRes = await pool.query(
      'SELECT email, first_name FROM users WHERE is_active = true AND email_verified = true'
    );

    let sentCount = 0;
    const errors = [];

    for (const user of usersRes.rows) {
      try {
        await sendBroadcast(user.email, subject, message);
        sentCount++;
      } catch (err) {
        console.error(`Failed to send to ${user.email}:`, err.message);
        errors.push({ email: user.email, error: err.message });
      }
    }

    res.json({ 
      message: `Broadcast sent to ${sentCount} of ${usersRes.rows.length} users`,
      sentCount,
      totalUsers: usersRes.rows.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// SYSTEM CONFIG
// ============================================================================
exports.getSystemConfig = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT key, value FROM system_config ORDER BY key`
    );

    const config = {};
    result.rows.forEach(row => {
      config[row.key] = row.value;
    });

    res.json(config);
  } catch (error) {
    console.error('Get system config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateSystemConfig = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updates = req.body;

    for (const [key, value] of Object.entries(updates)) {
      await client.query(
        `INSERT INTO system_config (key, value) 
         VALUES ($1, $2) 
         ON CONFLICT (key) DO UPDATE 
         SET value = $2, updated_at = NOW()`,
        [key, value.toString()]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Configuration updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update system config error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// ============================================================================
// REFERRAL ELIGIBILITY
// ============================================================================
exports.updateReferralEligibility = async (req, res) => {
  try {
    const { userId } = req.params;
    const { eligible } = req.body;
    
    await pool.query(
      'UPDATE users SET referral_eligible = $1, updated_at = NOW() WHERE id = $2',
      [eligible, userId]
    );
    
    res.json({ 
      message: `User referral eligibility updated to ${eligible}`,
      userId,
      referral_eligible: eligible
    });
  } catch (error) {
    console.error('Update referral eligibility error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// FRAUD LOGS
// ============================================================================
exports.getFraudLogs = async (req, res) => {
  try {
    const { limit = 100, severity, triggerType } = req.query;
    
    let query = `
      SELECT f.*, u.email, u.first_name, u.phone
      FROM fraud_logs f
      LEFT JOIN users u ON f.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (severity) {
      params.push(severity);
      query += ` AND f.severity = $${params.length}`;
    }
    
    if (triggerType) {
      params.push(triggerType);
      query += ` AND f.trigger_type = $${params.length}`;
    }
    
    query += ` ORDER BY f.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get fraud logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// USER FRAUD HISTORY
// ============================================================================
exports.getUserFraudHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM fraud_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get user fraud history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// FRAUD STATS
// ============================================================================
exports.getFraudStats = async (req, res) => {
  try {
    const totalLogs = await pool.query('SELECT COUNT(*) FROM fraud_logs');
    const bySeverity = await pool.query(
      `SELECT severity, COUNT(*) as count FROM fraud_logs GROUP BY severity`
    );
    const byTrigger = await pool.query(
      `SELECT trigger_type, COUNT(*) as count FROM fraud_logs GROUP BY trigger_type`
    );
    const recentBlocked = await pool.query(
      `SELECT COUNT(*) FROM fraud_logs 
       WHERE created_at > NOW() - INTERVAL '24 hours' 
       AND severity = 'critical'`
    );
    const highFraudUsers = await pool.query(
      `SELECT COUNT(*) FROM users WHERE fraud_score >= 50`
    );
    const blockedIPs = await pool.query('SELECT COUNT(*) FROM blocked_ips WHERE blocked_until IS NULL OR blocked_until > NOW()');
    const blockedFingerprints = await pool.query('SELECT COUNT(*) FROM blocked_fingerprints WHERE blocked_until IS NULL OR blocked_until > NOW()');
    
    res.json({
      totalLogs: parseInt(totalLogs.rows[0].count),
      bySeverity: bySeverity.rows,
      byTrigger: byTrigger.rows,
      recentBlocked24h: parseInt(recentBlocked.rows[0].count),
      highFraudUsers: parseInt(highFraudUsers.rows[0].count),
      blockedIPs: parseInt(blockedIPs.rows[0].count),
      blockedFingerprints: parseInt(blockedFingerprints.rows[0].count),
    });
  } catch (error) {
    console.error('Get fraud stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// BLOCKED IPs
// ============================================================================
exports.getBlockedIPs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM blocked_ips 
       WHERE blocked_until IS NULL OR blocked_until > NOW()
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get blocked IPs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.blockIP = async (req, res) => {
  try {
    const { ip_address, ip_range, reason, blocked_until } = req.body;
    
    const result = await pool.query(
      `INSERT INTO blocked_ips (ip_address, ip_range, reason, blocked_until)
       VALUES ($1::inet, $2::cidr, $3, $4)
       RETURNING *`,
      [ip_address, ip_range || null, reason, blocked_until || null]
    );
    
    await pool.query(
      `INSERT INTO fraud_logs (trigger_type, severity, details, ip_address, action_taken)
       VALUES ('manual_block', 'high', $1, $2::inet, 'ip_blocked')`,
      [JSON.stringify({ reason, blocked_until }), ip_address]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Block IP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.unblockIP = async (req, res) => {
  try {
    const { ipId } = req.params;
    
    await pool.query('DELETE FROM blocked_ips WHERE id = $1', [ipId]);
    
    res.json({ message: 'IP unblocked successfully' });
  } catch (error) {
    console.error('Unblock IP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// BLOCKED FINGERPRINTS
// ============================================================================
exports.getBlockedFingerprints = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM blocked_fingerprints 
       WHERE blocked_until IS NULL OR blocked_until > NOW()
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get blocked fingerprints error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.blockFingerprint = async (req, res) => {
  try {
    const { fingerprint_hash, reason, blocked_until } = req.body;
    
    const result = await pool.query(
      `INSERT INTO blocked_fingerprints (fingerprint_hash, reason, blocked_until)
       VALUES ($1, $2, $3)
       ON CONFLICT (fingerprint_hash) DO UPDATE
       SET reason = $2, blocked_until = $3
       RETURNING *`,
      [fingerprint_hash, reason, blocked_until || null]
    );
    
    await pool.query(
      `INSERT INTO fraud_logs (trigger_type, severity, details, fingerprint_hash, action_taken)
       VALUES ('manual_block', 'high', $1, $2, 'fingerprint_blocked')`,
      [JSON.stringify({ reason, blocked_until }), fingerprint_hash]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Block fingerprint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.unblockFingerprint = async (req, res) => {
  try {
    const { fingerprintId } = req.params;
    
    await pool.query('DELETE FROM blocked_fingerprints WHERE id = $1', [fingerprintId]);
    
    res.json({ message: 'Fingerprint unblocked successfully' });
  } catch (error) {
    console.error('Unblock fingerprint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// DEVICE TRACKING
// ============================================================================
exports.getUserDevices = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM user_devices 
       WHERE user_id = $1 
       ORDER BY last_seen_at DESC`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get user devices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAccountsByIP = async (req, res) => {
  try {
    const { ip } = req.params;
    
    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.phone, u.created_at, u.fraud_score, u.referral_eligible
       FROM users u
       WHERE u.signup_ip = $1::inet
       ORDER BY u.created_at DESC`,
      [ip]
    );
    
    res.json({
      ip,
      count: result.rows.length,
      accounts: result.rows
    });
  } catch (error) {
    console.error('Get accounts by IP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAccountsByFingerprint = async (req, res) => {
  try {
    const { fingerprint } = req.params;
    
    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.phone, u.created_at, u.fraud_score, u.referral_eligible
       FROM users u
       WHERE u.signup_fingerprint = $1
       ORDER BY u.created_at DESC`,
      [fingerprint]
    );
    
    res.json({
      fingerprint,
      count: result.rows.length,
      accounts: result.rows
    });
  } catch (error) {
    console.error('Get accounts by fingerprint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================================
// FRAUD ACTIONS
// ============================================================================
exports.flagUserForFraud = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, severity = 'high' } = req.body;
    
    await pool.query(
      `UPDATE users SET fraud_score = fraud_score + 50, updated_at = NOW() WHERE id = $1`,
      [userId]
    );
    
    await pool.query(
      `INSERT INTO fraud_logs (user_id, trigger_type, severity, details, action_taken)
       VALUES ($1, 'manual_flag', $2, $3, 'flagged')`,
      [userId, severity, JSON.stringify({ reason })]
    );
    
    res.json({ message: 'User flagged for fraud', userId });
  } catch (error) {
    console.error('Flag user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.clearFraudFlags = async (req, res) => {
  try {
    const { userId } = req.params;
    
    await pool.query(
      `UPDATE users SET fraud_score = 0, updated_at = NOW() WHERE id = $1`,
      [userId]
    );
    
    await pool.query(
      `INSERT INTO fraud_logs (user_id, trigger_type, severity, details, action_taken)
       VALUES ($1, 'manual_clear', 'low', $2, 'cleared')`,
      [userId, JSON.stringify({ action: 'fraud_flags_cleared' })]
    );
    
    res.json({ message: 'Fraud flags cleared', userId });
  } catch (error) {
    console.error('Clear fraud flags error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateFraudScore = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fraud_score } = req.body;
    
    await pool.query(
      `UPDATE users SET fraud_score = $1, updated_at = NOW() WHERE id = $2`,
      [fraud_score, userId]
    );
    
    await pool.query(
      `INSERT INTO fraud_logs (user_id, trigger_type, severity, details, action_taken)
       VALUES ($1, 'score_update', 'medium', $2, 'score_updated')`,
      [userId, JSON.stringify({ new_score: fraud_score })]
    );
    
    res.json({ message: 'Fraud score updated', userId, fraud_score });
  } catch (error) {
    console.error('Update fraud score error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};