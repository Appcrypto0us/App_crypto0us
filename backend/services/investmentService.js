const INVESTMENT_PLANS = require('./investmentPlans');

exports.calculateProfit = (amount, planId) => {
  const plan = INVESTMENT_PLANS[planId];
  if (!plan) return null;
  const { daily_return_rate, profit_interval_hours } = plan.details;
  return parseFloat(((amount * (daily_return_rate / 100)) * (profit_interval_hours / 24)).toFixed(2));
};

exports.processPayout = async (client, investment) => {
  const plan = INVESTMENT_PLANS[investment.plan_id];
  if (!plan) throw new Error('Invalid plan');

  const now = new Date();
  const cycleProfit = exports.calculateProfit(investment.amount, investment.plan_id);
  
  if (!cycleProfit) return;

  // Update user wallet
  await client.query(
    `UPDATE wallets
     SET balance = balance + $1,
         available_balance = available_balance + $1,
         total_profit = total_profit + $1,
         updated_at = NOW()
     WHERE user_id = $2`,
    [cycleProfit, investment.user_id]
  );

  // Insert transaction
  await client.query(
    `INSERT INTO transactions (user_id, type, amount, status, description, created_at)
     VALUES ($1, 'profit_payout', $2, 'completed', $3, NOW())`,
    [investment.user_id, cycleProfit, `Profit from ${investment.plan_name}`]
  );

  // Update investment
  const nextPayout = new Date(now);
  nextPayout.setHours(now.getHours() + investment.profit_interval_hours);

  let status = investment.status;
  let capitalWithdrawn = investment.capital_withdrawn;

  if (now >= new Date(investment.end_date)) {
    status = 'completed';
    // Return capital if plan allows and not already withdrawn
    if (plan.details.capital_withdrawal && !capitalWithdrawn) {
      await client.query(
        `UPDATE wallets
         SET available_balance = available_balance + $1,
             active_investments = active_investments - $1,
             updated_at = NOW()
         WHERE user_id = $2`,
        [investment.amount, investment.user_id]
      );
      
      // Insert capital return transaction
      await client.query(
        `INSERT INTO transactions (user_id, type, amount, status, description, created_at)
         VALUES ($1, 'capital_return', $2, 'completed', $3, NOW())`,
        [investment.user_id, investment.amount, `Capital return from ${investment.plan_name}`]
      );
      
      capitalWithdrawn = true;
    }
  }

  await client.query(
    `UPDATE investments
     SET total_paid = total_paid + $1,
         last_payout = NOW(),
         next_payout = $2,
         status = $3,
         capital_withdrawn = $4,
         updated_at = NOW()
     WHERE id = $5`,
    [cycleProfit, nextPayout, status, capitalWithdrawn, investment.id]
  );
};
