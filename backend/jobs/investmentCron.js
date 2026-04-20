const cron = require('node-cron');
const { pool } = require('../config/db');
const investmentService = require('../services/investmentService');

// Job state
let job = null;
let isRunning = false;
let lastRunTime = null;
let nextRunTime = null;
let totalPayoutsProcessed = 0;
let totalAmountPaid = 0;
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 5;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const formatCurrency = (amount) => {
  return '$' + (parseFloat(amount) || 0).toFixed(2);
};

const calculateNextRunTime = () => {
  // Calculate next 5-minute mark
  const now = new Date();
  const minutes = now.getMinutes();
  const nextMinutes = Math.ceil((minutes + 1) / 5) * 5;
  const next = new Date(now);
  
  if (nextMinutes >= 60) {
    next.setHours(now.getHours() + 1);
    next.setMinutes(nextMinutes - 60);
  } else {
    next.setMinutes(nextMinutes);
  }
  next.setSeconds(0);
  next.setMilliseconds(0);
  
  return next;
};

const logStats = () => {
  console.log('\n📊 Investment Cron Statistics:');
  console.log(`   Last Run: ${lastRunTime ? lastRunTime.toISOString() : 'Never'}`);
  console.log(`   Next Run: ${nextRunTime ? nextRunTime.toISOString() : 'Not scheduled'}`);
  console.log(`   Total Payouts Processed: ${totalPayoutsProcessed}`);
  console.log(`   Total Amount Paid: ${formatCurrency(totalAmountPaid)}`);
  console.log(`   Consecutive Failures: ${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}`);
  console.log(`   Status: ${isRunning ? '🔄 Running' : job ? '⏰ Scheduled' : '⏸️ Stopped'}\n`);
};

// ============================================================================
// MAIN PAYOUT PROCESSING FUNCTION
// ============================================================================
const processPayouts = async () => {
  // Prevent concurrent runs
  if (isRunning) {
    console.log('⚠️  Cron job already running, skipping this cycle');
    return;
  }
  
  isRunning = true;
  const startTime = Date.now();
  const client = await pool.connect();
  
  let processedCount = 0;
  let failedCount = 0;
  let totalPaidThisRun = 0;
  let completedCount = 0;
  
  try {
    console.log('\n' + '═'.repeat(60));
    console.log(`⏰ [${new Date().toISOString()}] Starting investment payout cycle`);
    console.log('═'.repeat(60));
    
    await client.query('BEGIN');
    console.log('🔒 Transaction started, locking active investments...');
    
    // Lock relevant rows to avoid race conditions
    const investments = await client.query(
      `SELECT * FROM investments
       WHERE status = 'active' AND next_payout <= NOW()
       ORDER BY next_payout ASC
       FOR UPDATE`
    );

    if (investments.rows.length === 0) {
      console.log('ℹ️  No investments due for payout at this time');
      await client.query('COMMIT');
      console.log('🔓 Transaction committed (no changes)');
      consecutiveFailures = 0;
      lastRunTime = new Date();
      nextRunTime = calculateNextRunTime();
      return;
    }

    console.log(`📋 Found ${investments.rows.length} investment(s) due for payout`);
    console.log('─'.repeat(60));
    
    // Process each investment
    for (let i = 0; i < investments.rows.length; i++) {
      const inv = investments.rows[i];
      const progress = `[${i + 1}/${investments.rows.length}]`;
      
      try {
        console.log(`${progress} Processing Investment #${inv.id.substring(0, 8)}...`);
        console.log(`   User ID: ${inv.user_id.substring(0, 8)}`);
        console.log(`   Plan: ${inv.plan_name}`);
        console.log(`   Amount: ${formatCurrency(inv.amount)}`);
        console.log(`   Total Paid So Far: ${formatCurrency(inv.total_paid)}`);
        
        const result = await investmentService.processPayout(client, inv);
        
        processedCount++;
        totalPaidThisRun += result.payoutAmount;
        totalAmountPaid += result.payoutAmount;
        
        if (result.completed) {
          completedCount++;
          console.log(`   ✅ Payout: ${formatCurrency(result.payoutAmount)}`);
          console.log(`   🎉 Investment COMPLETED!`);
          console.log(`   Capital Returned: ${result.capitalReturned ? '✅ Yes' : '❌ No'}`);
          console.log(`   Final Total Paid: ${formatCurrency(inv.total_paid + result.payoutAmount)}`);
        } else {
          console.log(`   ✅ Payout: ${formatCurrency(result.payoutAmount)}`);
          console.log(`   📅 Next Payout: ${new Date(result.nextPayout).toLocaleString()}`);
          console.log(`   📊 Progress: ${formatCurrency(inv.total_paid + result.payoutAmount)} / ${formatCurrency(inv.expected_total)}`);
        }
        
      } catch (error) {
        failedCount++;
        console.error(`${progress} ❌ FAILED: Investment #${inv.id.substring(0, 8)}`);
        console.error(`   Error: ${error.message}`);
        
        // Log detailed error for debugging
        console.error('   Investment details:', {
          id: inv.id,
          user_id: inv.user_id,
          plan: inv.plan_name,
          amount: inv.amount,
          total_paid: inv.total_paid,
          expected_total: inv.expected_total,
          next_payout: inv.next_payout,
          end_date: inv.end_date
        });
        
        // If too many failures in this run, abort
        if (failedCount > 10) {
          console.error('❌ Too many failures (>10), aborting payout cycle');
          throw new Error('Too many payout failures in single cycle');
        }
      }
    }

    console.log('─'.repeat(60));
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('🔓 Transaction committed successfully');
    
    // Reset consecutive failures on success
    consecutiveFailures = 0;
    
    // Update statistics
    totalPayoutsProcessed += processedCount;
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('═'.repeat(60));
    console.log(`✅ Payout cycle completed in ${duration}s`);
    console.log(`   📊 Processed: ${processedCount} payouts`);
    console.log(`   🎉 Completed: ${completedCount} investments`);
    console.log(`   ❌ Failed: ${failedCount} payouts`);
    console.log(`   💰 Total Paid This Run: ${formatCurrency(totalPaidThisRun)}`);
    console.log('═'.repeat(60) + '\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    consecutiveFailures++;
    
    console.error('\n' + '═'.repeat(60));
    console.error(`❌ CRON JOB FAILED (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES} consecutive failures)`);
    console.error(`   Error: ${error.message}`);
    if (process.env.NODE_ENV === 'development') {
      console.error(`   Stack: ${error.stack}`);
    }
    console.error('═'.repeat(60) + '\n');
    
    // If too many consecutive failures, stop the cron job
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.error(`\n🚨🚨🚨 CRITICAL ALERT 🚨🚨🚨`);
      console.error(`${MAX_CONSECUTIVE_FAILURES} consecutive failures detected!`);
      console.error('🛑 Auto-stopping cron job to prevent cascading failures');
      console.error('💡 Please check:');
      console.error('   1. Database connection');
      console.error('   2. investmentService.processPayout function');
      console.error('   3. INVESTMENT_PLANS configuration');
      console.error('   4. Database constraints and triggers');
      stop();
    }
  } finally {
    client.release();
    isRunning = false;
    lastRunTime = new Date();
    nextRunTime = calculateNextRunTime();
  }
};

// ============================================================================
// CRON JOB CONTROL FUNCTIONS
// ============================================================================
const start = () => {
  if (job) {
    console.log('⚠️  Cron job already running');
    return job;
  }
  
  try {
    job = cron.schedule('*/5 * * * *', processPayouts, {
      scheduled: true,
      timezone: "UTC"
    });
    
    nextRunTime = calculateNextRunTime();
    
    console.log('✅ Investment payout cron job scheduled successfully');
    console.log(`   Schedule: Every 5 minutes`);
    console.log(`   Timezone: UTC`);
    console.log(`   Next run: ${nextRunTime.toISOString()} (${nextRunTime.toLocaleString()})`);
    
    return job;
  } catch (error) {
    console.error('❌ Failed to start cron job:', error.message);
    return null;
  }
};

const stop = () => {
  if (job) {
    try {
      job.stop();
      job = null;
      isRunning = false;
      nextRunTime = null;
      console.log('🛑 Cron job stopped successfully');
      logStats();
    } catch (error) {
      console.error('❌ Error stopping cron job:', error.message);
    }
  } else {
    console.log('ℹ️  Cron job is not running');
  }
  return null;
};

const restart = () => {
  console.log('🔄 Restarting cron job...');
  stop();
  return start();
};

const runManually = async () => {
  console.log('\n' + '═'.repeat(60));
  console.log('🔄 MANUAL PAYOUT TRIGGERED');
  console.log('═'.repeat(60));
  
  if (isRunning) {
    console.log('⚠️  Cron job is already running, please wait...');
    return { 
      success: false, 
      message: 'Job already running',
      isRunning: true 
    };
  }
  
  const startTime = Date.now();
  await processPayouts();
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log(`\n✅ Manual payout completed in ${duration}s`);
  
  return { 
    success: true, 
    message: 'Manual payout completed successfully',
    duration: `${duration}s`,
    lastRunTime,
    totalPayoutsProcessed,
    totalAmountPaid: formatCurrency(totalAmountPaid)
  };
};

const getStatus = () => {
  return {
    isRunning,
    isScheduled: !!job,
    lastRunTime: lastRunTime ? lastRunTime.toISOString() : null,
    nextRunTime: nextRunTime ? nextRunTime.toISOString() : null,
    totalPayoutsProcessed,
    totalAmountPaid: formatCurrency(totalAmountPaid),
    consecutiveFailures,
    maxConsecutiveFailures: MAX_CONSECUTIVE_FAILURES,
    healthy: consecutiveFailures < MAX_CONSECUTIVE_FAILURES
  };
};

// ============================================================================
// PENDING INVESTMENTS CHECK (Diagnostic)
// ============================================================================
const checkPendingPayouts = async () => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN next_payout <= NOW() THEN 1 END) as due_now,
        MIN(next_payout) as next_due,
        MAX(next_payout) as last_due,
        SUM(amount) as total_amount,
        SUM(total_paid) as total_paid,
        SUM(expected_total) as total_expected
       FROM investments
       WHERE status = 'active'`
    );
    
    const stats = result.rows[0];
    
    console.log('\n' + '═'.repeat(60));
    console.log('📊 ACTIVE INVESTMENTS SUMMARY');
    console.log('═'.repeat(60));
    console.log(`   Total Active Investments: ${stats.total || 0}`);
    console.log(`   Due for Payout Now: ${stats.due_now || 0}`);
    console.log(`   Next Payout Due: ${stats.next_due ? new Date(stats.next_due).toLocaleString() : 'N/A'}`);
    console.log(`   Last Payout Due: ${stats.last_due ? new Date(stats.last_due).toLocaleString() : 'N/A'}`);
    console.log('─'.repeat(60));
    console.log(`   Total Capital Invested: ${formatCurrency(stats.total_amount || 0)}`);
    console.log(`   Total Profit Paid: ${formatCurrency(stats.total_paid || 0)}`);
    console.log(`   Total Expected: ${formatCurrency(stats.total_expected || 0)}`);
    console.log(`   Remaining to Pay: ${formatCurrency((stats.total_expected || 0) - (stats.total_paid || 0))}`);
    console.log('═'.repeat(60));
    
    // Show upcoming payouts
    const upcoming = await pool.query(
      `SELECT id, user_id, plan_name, amount, total_paid, expected_total, next_payout, end_date
       FROM investments
       WHERE status = 'active'
       ORDER BY next_payout ASC
       LIMIT 10`
    );
    
    if (upcoming.rows.length > 0) {
      console.log('\n📅 UPCOMING PAYOUTS (Next 10):');
      console.log('─'.repeat(60));
      upcoming.rows.forEach((inv, i) => {
        const dueDate = new Date(inv.next_payout);
        const isOverdue = dueDate <= new Date();
        const progress = ((inv.total_paid / inv.expected_total) * 100).toFixed(1);
        
        console.log(`   ${i + 1}. ${inv.plan_name} - ${formatCurrency(inv.amount)}`);
        console.log(`      Progress: ${progress}% (${formatCurrency(inv.total_paid)} / ${formatCurrency(inv.expected_total)})`);
        console.log(`      Due: ${dueDate.toLocaleString()} ${isOverdue ? '⚠️ OVERDUE' : ''}`);
      });
      console.log('═'.repeat(60) + '\n');
    }
    
    return {
      ...stats,
      total_amount: parseFloat(stats.total_amount) || 0,
      total_paid: parseFloat(stats.total_paid) || 0,
      total_expected: parseFloat(stats.total_expected) || 0,
      upcoming: upcoming.rows
    };
  } catch (error) {
    console.error('❌ Failed to check pending payouts:', error.message);
    return null;
  }
};

// ============================================================================
// RESET STATISTICS
// ============================================================================
const resetStats = () => {
  totalPayoutsProcessed = 0;
  totalAmountPaid = 0;
  consecutiveFailures = 0;
  lastRunTime = null;
  console.log('✅ Statistics reset successfully');
  logStats();
};

// ============================================================================
// HEALTH CHECK
// ============================================================================
const healthCheck = async () => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    // Check if any investments are severely overdue (>24 hours)
    const overdueResult = await pool.query(
      `SELECT COUNT(*) as count FROM investments 
       WHERE status = 'active' AND next_payout < NOW() - INTERVAL '24 hours'`
    );
    
    const severelyOverdue = parseInt(overdueResult.rows[0].count) || 0;
    
    return {
      healthy: consecutiveFailures < MAX_CONSECUTIVE_FAILURES && severelyOverdue < 10,
      database: 'connected',
      cronScheduled: !!job,
      isRunning,
      consecutiveFailures,
      severelyOverduePayouts: severelyOverdue,
      lastRunTime: lastRunTime?.toISOString() || null,
      nextRunTime: nextRunTime?.toISOString() || null
    };
  } catch (error) {
    return {
      healthy: false,
      database: 'disconnected',
      error: error.message,
      cronScheduled: !!job,
      isRunning,
      consecutiveFailures
    };
  }
};

// ============================================================================
// EXPORTS
// ============================================================================
module.exports = { 
  start, 
  stop, 
  restart, 
  runManually, 
  getStatus, 
  checkPendingPayouts,
  resetStats,
  healthCheck,
  processPayouts // Exported for testing
};

// ============================================================================
// STARTUP LOGGING
// ============================================================================
console.log('┌─────────────────────────────────────────────────────────────┐');
console.log('│ 📦 Investment Cron Module Loaded                            │');
console.log('│    Schedule: Every 5 minutes                                │');
console.log('│    Timezone: UTC                                            │');
console.log('│    Max Consecutive Failures: ' + MAX_CONSECUTIVE_FAILURES + '                             │');
console.log('└─────────────────────────────────────────────────────────────┘');
