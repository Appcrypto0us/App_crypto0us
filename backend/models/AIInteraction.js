const { pool } = require('../config/db');

class AIInteraction {
  /**
   * Create a new AI interaction log
   */
  static async create(data) {
    const {
      userId,
      sessionId,
      userMessage,
      aiResponse,
      context = 'general',
      planId = null,
      investmentAmount = null,
      tokensUsed = 0,
      responseTimeMs = null
    } = data;

    const query = `
      INSERT INTO ai_interactions 
      (user_id, session_id, user_message, ai_response, context, plan_id, investment_amount, tokens_used, response_time_ms)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      userId,
      sessionId,
      userMessage,
      aiResponse,
      context,
      planId,
      investmentAmount,
      tokensUsed,
      responseTimeMs
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating AI interaction:', error);
      throw error;
    }
  }

  /**
   * Get AI interactions for a user
   */
  static async getByUser(userId, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM ai_interactions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    
    try {
      const result = await pool.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching AI interactions:', error);
      throw error;
    }
  }

  /**
   * Get AI interactions by session
   */
  static async getBySession(sessionId) {
    const query = `
      SELECT * FROM ai_interactions 
      WHERE session_id = $1 
      ORDER BY created_at ASC
    `;
    
    try {
      const result = await pool.query(query, [sessionId]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching session interactions:', error);
      throw error;
    }
  }

  /**
   * Get AI analytics
   */
  static async getAnalytics(startDate = null, endDate = null) {
    let query = `
      SELECT 
        COUNT(*) as total_interactions,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT session_id) as total_sessions,
        AVG(response_time_ms) as avg_response_time,
        SUM(tokens_used) as total_tokens_used,
        context,
        COUNT(*) as context_count
      FROM ai_interactions
    `;

    const values = [];
    if (startDate && endDate) {
      query += ` WHERE created_at BETWEEN $1 AND $2`;
      values.push(startDate, endDate);
    }

    query += ` GROUP BY context ORDER BY context_count DESC`;

    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error fetching AI analytics:', error);
      throw error;
    }
  }

  /**
   * Get recent interactions (admin)
   */
  static async getRecent(limit = 100) {
    const query = `
      SELECT 
        ai.*,
        u.first_name,
        u.email
      FROM ai_interactions ai
      JOIN users u ON ai.user_id = u.id
      ORDER BY ai.created_at DESC
      LIMIT $1
    `;
    
    try {
      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching recent AI interactions:', error);
      throw error;
    }
  }

  /**
   * Delete old interactions (for data retention policy)
   */
  static async deleteOlderThan(days = 90) {
    const query = `
      DELETE FROM ai_interactions 
      WHERE created_at < NOW() - INTERVAL '${days} days'
      RETURNING id
    `;
    
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error deleting old AI interactions:', error);
      throw error;
    }
  }
}

module.exports = AIInteraction;