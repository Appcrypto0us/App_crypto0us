exports.grantSignupBonus = async (client, referrerId, referredUserId, referredFirstName) => {
  const bonus = 10; // $10 signup bonus
  
  // Update referrer wallet
  await client.query(
    `UPDATE wallets
     SET balance = balance + $1,
         available_balance = available_balance + $1,
         updated_at = NOW()
     WHERE user_id = $2`,
    [bonus, referrerId]
  );
  
  // Record transaction
  await client.query(
    `INSERT INTO transactions (user_id, type, amount, status, description, created_at)
     VALUES ($1, 'referral_bonus', $2, 'completed', $3, NOW())`,
    [referrerId, bonus, `Signup bonus for referring ${referredFirstName}`]
  );
  
  // Update user referral count
  await client.query(
    `UPDATE users SET referrals_count = referrals_count + 1 WHERE id = $1`,
    [referrerId]
  );
  
  // Record referral earnings
  await client.query(
    `INSERT INTO referral_earnings (referrer_id, referred_user_id, type, amount, created_at)
     VALUES ($1, $2, 'signup_bonus', $3, NOW())`,
    [referrerId, referredUserId, bonus]
  );
};

exports.grantDepositCommission = async (client, referrerId, depositAmount, referredUserId, depositId) => {
  const configRes = await client.query("SELECT value FROM system_config WHERE key = 'referral_commission_percent'");
  const percent = parseFloat(configRes.rows[0]?.value || 5);
  const commission = parseFloat(((depositAmount * percent) / 100).toFixed(2));
  
  // Update referrer wallet
  await client.query(
    `UPDATE wallets
     SET balance = balance + $1,
         available_balance = available_balance + $1,
         updated_at = NOW()
     WHERE user_id = $2`,
    [commission, referrerId]
  );
  
  // Record transaction
  await client.query(
    `INSERT INTO transactions (user_id, type, amount, status, description, created_at)
     VALUES ($1, 'referral_commission', $2, 'completed', $3, NOW())`,
    [referrerId, commission, `Commission from deposit of referred user`]
  );
  
  // Record referral earnings
  await client.query(
    `INSERT INTO referral_earnings (referrer_id, referred_user_id, type, amount, deposit_id, created_at)
     VALUES ($1, $2, 'deposit_commission', $3, $4, NOW())`,
    [referrerId, referredUserId, commission, depositId]
  );
};
