const { pool } = require('../config/db');

const usdToKes = async (usdAmount) => {
  const result = await pool.query("SELECT value FROM system_config WHERE key = 'usd_to_kes'");
  const rate = parseFloat(result.rows[0]?.value || 129);
  return parseFloat((usdAmount * rate).toFixed(2));
};

const kesToUsd = async (kesAmount) => {
  const result = await pool.query("SELECT value FROM system_config WHERE key = 'usd_to_kes'");
  const rate = parseFloat(result.rows[0]?.value || 129);
  return parseFloat((kesAmount / rate).toFixed(2));
};

const getSystemConfig = async (key) => {
  const result = await pool.query('SELECT value FROM system_config WHERE key = $1', [key]);
  return result.rows[0]?.value || null;
};

module.exports = { usdToKes, kesToUsd, getSystemConfig };
