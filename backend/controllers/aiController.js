const { GoogleGenerativeAI } = require('@google/generative-ai');
const AIInteraction = require('../models/AIInteraction');
const { v4: uuidv4 } = require('uuid');

// Initialize Gemini with error handling
let genAI = null;
let geminiAvailable = false;

try {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== '') {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiAvailable = true;
    console.log('✅ Gemini AI initialized successfully');
  } else {
    console.warn('⚠️ GEMINI_API_KEY not set. AI features will use fallback responses.');
  }
} catch (error) {
  console.error('❌ Failed to initialize Gemini AI:', error.message);
  geminiAvailable = false;
}

const INVESTMENT_PLANS_CONTEXT = `
You are an AI assistant for CryptoLegacy, a premium crypto investment platform.

INVESTMENT PLANS:
- Basic Plan: 6.52% daily return, $45-$265 investment range, 120 days duration, 24h profit interval
- Silver Plan: 8.15% daily return, $310-$613 investment range, 240 days duration, 20h profit interval
- Gold Plan: 10.19% daily return, $656-$1,040 investment range, 360 days duration, 16h profit interval
- Diamond Plan: 12.74% daily return, $1,048-$1,743 investment range, 480 days duration, 12h profit interval
- Platinum Plan: 15.93% daily return, $2,178-$4,265 investment range, 600 days duration, 8h profit interval
- Ultimate Plan: 19.91% daily return, $4,352-$951,515 investment range, 720 days duration, 4h profit interval

FEATURES:
- Capital withdrawal available at end of term
- Profits paid at specified intervals
- Minimum deposit: $5
- Withdrawal fee: 1%
- Referral commission: 5%

RULES:
- Keep responses concise and professional (max 3-4 sentences)
- Always be helpful and accurate
- If asked about topics outside CryptoLegacy investments, politely redirect to investment questions
- Do not make up information not provided above
- Use USD currency format
`;

// Store chat sessions per user
const userSessions = new Map();

// Fallback response generator (when Gemini is unavailable)
const getFallbackResponse = (message) => {
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('basic')) return "Basic Plan: 6.52% daily return, $45-$265 investment, 120 days duration, profits every 24h.";
  if (lowerMsg.includes('silver')) return "Silver Plan: 8.15% daily return, $310-$613 investment, 240 days duration, profits every 20h.";
  if (lowerMsg.includes('gold')) return "Gold Plan: 10.19% daily return, $656-$1,040 investment, 360 days duration, profits every 16h.";
  if (lowerMsg.includes('diamond')) return "Diamond Plan: 12.74% daily return, $1,048-$1,743 investment, 480 days duration, profits every 12h.";
  if (lowerMsg.includes('platinum')) return "Platinum Plan: 15.93% daily return, $2,178-$4,265 investment, 600 days duration, profits every 8h.";
  if (lowerMsg.includes('ultimate')) return "Ultimate Plan: 19.91% daily return, $4,352-$951,515 investment, 720 days duration, profits every 4h.";
  if (lowerMsg.includes('minimum') || lowerMsg.includes('deposit')) return "Minimum deposit is $5.";
  if (lowerMsg.includes('withdrawal') || lowerMsg.includes('fee')) return "Withdrawal fee is 1%.";
  if (lowerMsg.includes('referral')) return "Referral commission is 5%.";
  return "Welcome to CryptoLegacy! I can help you with our investment plans (Basic, Silver, Gold, Diamond, Platinum, Ultimate). What would you like to know about?";
};

/**
 * Estimate tokens used (rough estimate: ~4 chars per token)
 */
const estimateTokens = (text) => Math.ceil(text.length / 4);

/**
 * General AI chat endpoint
 * POST /api/ai/chat
 */
exports.askAI = async (req, res) => {
  const startTime = Date.now();
  const userId = req.user.id;
  const { message, sessionId } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }

  // Use fallback if Gemini is not available
  if (!geminiAvailable) {
    const aiResponse = getFallbackResponse(message);
    
    // Log interaction to database
    await AIInteraction.create({
      userId,
      sessionId: sessionId || uuidv4(),
      userMessage: message,
      aiResponse,
      context: 'general',
      tokensUsed: estimateTokens(message) + estimateTokens(aiResponse),
      responseTimeMs: Date.now() - startTime
    }).catch(e => console.error('Failed to log interaction:', e));

    return res.json({ 
      response: aiResponse,
      sessionId: sessionId || uuidv4()
    });
  }

  try {
    // Get or create chat session
    const currentSessionId = sessionId || uuidv4();
    let chatSession = userSessions.get(`${userId}:${currentSessionId}`);

    if (!chatSession) {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 256,
          topP: 0.9,
        }
      });

      chatSession = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: "Confirm you understand CryptoLegacy investment plans." }],
          },
          {
            role: "model",
            parts: [{ text: "I understand CryptoLegacy investment plans and I'm ready to help users choose the best plan for their goals." }],
          },
        ],
      });

      userSessions.set(`${userId}:${currentSessionId}`, chatSession);
    }

    const prompt = `${INVESTMENT_PLANS_CONTEXT}\n\nUser question: ${message}\n\nProvide a helpful, concise response:`;
    const result = await chatSession.sendMessage(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    const responseTimeMs = Date.now() - startTime;
    const tokensUsed = estimateTokens(prompt) + estimateTokens(aiResponse);

    // Log interaction to database
    await AIInteraction.create({
      userId,
      sessionId: currentSessionId,
      userMessage: message,
      aiResponse,
      context: 'general',
      tokensUsed,
      responseTimeMs
    });

    res.json({ 
      response: aiResponse,
      sessionId: currentSessionId
    });
  } catch (error) {
    console.error('AI Chat Error:', error);

    // Log failed interaction
    const responseTimeMs = Date.now() - startTime;
    await AIInteraction.create({
      userId,
      sessionId: sessionId || 'error',
      userMessage: message,
      aiResponse: 'Error: ' + error.message,
      context: 'general',
      responseTimeMs
    }).catch(e => console.error('Failed to log error interaction:', e));

    res.status(500).json({ 
      message: 'Failed to get AI response',
      response: 'I apologize, but I am having trouble processing your request right now. Please try again in a moment.'
    });
  }
};

/**
 * Get investment plan recommendation
 * POST /api/ai/recommend
 */
exports.getPlanRecommendation = async (req, res) => {
  const startTime = Date.now();
  const userId = req.user.id;
  const { amount, goal } = req.body;

  if (!amount) {
    return res.status(400).json({ message: 'Investment amount is required' });
  }

  // Use fallback if Gemini is not available
  if (!geminiAvailable) {
    let recommendation = "";
    let recommendedPlan = "";
    
    if (amount <= 265) {
      recommendedPlan = "Basic Plan";
      recommendation = "Basic Plan (6.52% daily return)";
    } else if (amount <= 613) {
      recommendedPlan = "Silver Plan";
      recommendation = "Silver Plan (8.15% daily return)";
    } else if (amount <= 1040) {
      recommendedPlan = "Gold Plan";
      recommendation = "Gold Plan (10.19% daily return)";
    } else if (amount <= 1743) {
      recommendedPlan = "Diamond Plan";
      recommendation = "Diamond Plan (12.74% daily return)";
    } else if (amount <= 4265) {
      recommendedPlan = "Platinum Plan";
      recommendation = "Platinum Plan (15.93% daily return)";
    } else {
      recommendedPlan = "Ultimate Plan";
      recommendation = "Ultimate Plan (19.91% daily return)";
    }
    
    const aiResponse = `Based on your $${amount} investment, I recommend the ${recommendation}. ${goal ? ` Since your goal is to ${goal}, ` : ''}This plan offers competitive returns within your investment range.`;
    
    // Log to database
    await AIInteraction.create({
      userId,
      sessionId: uuidv4(),
      userMessage: `Recommend plan for $${amount}. Goal: ${goal || 'maximize returns'}`,
      aiResponse,
      context: 'recommendation',
      investmentAmount: amount,
      tokensUsed: estimateTokens(aiResponse),
      responseTimeMs: Date.now() - startTime
    }).catch(e => console.error('Failed to log interaction:', e));

    return res.json({ response: aiResponse });
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200,
        topP: 0.9,
      }
    });

    const prompt = `User wants to invest $${amount}. Their goal is: ${goal || "maximize returns"}. 
    Based on CryptoLegacy's investment plans (Basic 6.52%, Silver 8.15%, Gold 10.19%, Diamond 12.74%, Platinum 15.93%, Ultimate 19.91%), 
    which plan would you recommend and why? Keep response under 100 words.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    const responseTimeMs = Date.now() - startTime;
    const tokensUsed = estimateTokens(prompt) + estimateTokens(aiResponse);

    // Log to database
    await AIInteraction.create({
      userId,
      sessionId: uuidv4(),
      userMessage: `Recommend plan for $${amount}. Goal: ${goal || 'maximize returns'}`,
      aiResponse,
      context: 'recommendation',
      investmentAmount: amount,
      tokensUsed,
      responseTimeMs
    });

    res.json({ response: aiResponse });
  } catch (error) {
    console.error('AI Recommendation Error:', error);
    res.status(500).json({ 
      message: 'Failed to get recommendation',
      response: 'I recommend the Basic or Silver plan for conservative growth, or Gold/Diamond for higher returns depending on your risk tolerance.'
    });
  }
};

/**
 * Explain specific plan details
 * POST /api/ai/explain/:planId
 */
exports.explainPlan = async (req, res) => {
  const startTime = Date.now();
  const userId = req.user.id;
  const { planId } = req.params;

  const planNames = {
    'basic_plan': 'Basic',
    'silver_plan': 'Silver',
    'gold_plan': 'Gold',
    'diamond_plan': 'Diamond',
    'platinum_plan': 'Platinum',
    'ultimate_plan': 'Ultimate'
  };

  const planName = planNames[planId] || planId;

  // Use fallback if Gemini is not available
  if (!geminiAvailable) {
    const plans = {
      basic_plan: "Basic Plan: 6.52% daily return, $45-$265 minimum investment, 120 days duration, profits paid every 24 hours. Key benefit: Low entry barrier with consistent returns.",
      silver_plan: "Silver Plan: 8.15% daily return, $310-$613 minimum investment, 240 days duration, profits paid every 20 hours. Key benefit: Higher returns with moderate investment.",
      gold_plan: "Gold Plan: 10.19% daily return, $656-$1,040 minimum investment, 360 days duration, profits paid every 16 hours. Key benefit: Enhanced returns for serious investors.",
      diamond_plan: "Diamond Plan: 12.74% daily return, $1,048-$1,743 minimum investment, 480 days duration, profits paid every 12 hours. Key benefit: Premium returns with balanced risk.",
      platinum_plan: "Platinum Plan: 15.93% daily return, $2,178-$4,265 minimum investment, 600 days duration, profits paid every 8 hours. Key benefit: High-yield returns for experienced investors.",
      ultimate_plan: "Ultimate Plan: 19.91% daily return, $4,352-$951,515 minimum investment, 720 days duration, profits paid every 4 hours. Key benefit: Maximum returns with frequent payouts."
    };
    
    const aiResponse = plans[planId] || `The ${planName} plan offers competitive daily returns with flexible investment amounts. Please check the investment plans section for specific rates and terms.`;
    
    // Log to database
    await AIInteraction.create({
      userId,
      sessionId: uuidv4(),
      userMessage: `Explain ${planName} plan`,
      aiResponse,
      context: 'plan_explanation',
      planId,
      tokensUsed: estimateTokens(aiResponse),
      responseTimeMs: Date.now() - startTime
    }).catch(e => console.error('Failed to log interaction:', e));

    return res.json({ response: aiResponse });
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200,
        topP: 0.9,
      }
    });

    const prompt = `Explain the CryptoLegacy ${planName} investment plan details including daily return percentage, minimum investment, duration, and profit payout interval. Keep it concise and highlight the key benefit.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    const responseTimeMs = Date.now() - startTime;
    const tokensUsed = estimateTokens(prompt) + estimateTokens(aiResponse);

    // Log to database
    await AIInteraction.create({
      userId,
      sessionId: uuidv4(),
      userMessage: `Explain ${planName} plan`,
      aiResponse,
      context: 'plan_explanation',
      planId,
      tokensUsed,
      responseTimeMs
    });

    res.json({ response: aiResponse });
  } catch (error) {
    console.error('AI Explain Error:', error);
    res.status(500).json({ 
      message: 'Failed to explain plan',
      response: 'This plan offers competitive daily returns with flexible investment amounts. Please check the plan details above for specific rates and terms.'
    });
  }
};

/**
 * Get AI interaction history for a user
 * GET /api/ai/history
 */
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const interactions = await AIInteraction.getByUser(userId, parseInt(limit), parseInt(offset));

    res.json({ interactions });
  } catch (error) {
    console.error('Error fetching AI history:', error);
    res.status(500).json({ message: 'Failed to fetch AI interaction history' });
  }
};

/**
 * Get AI analytics (admin only)
 * GET /api/ai/analytics
 */
exports.getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const analytics = await AIInteraction.getAnalytics(startDate, endDate);
    const recentInteractions = await AIInteraction.getRecent(50);

    res.json({ 
      analytics,
      recentInteractions
    });
  } catch (error) {
    console.error('Error fetching AI analytics:', error);
    res.status(500).json({ message: 'Failed to fetch AI analytics' });
  }
};

/**
 * Clear user session
 */
exports.clearUserSession = (userId) => {
  // Clear all sessions for this user
  for (const key of userSessions.keys()) {
    if (key.startsWith(`${userId}:`)) {
      userSessions.delete(key);
    }
  }
};

console.log('✅ AI Controller loaded successfully');
console.log('📊 Gemini AI status:', geminiAvailable ? 'Available' : 'Using fallback mode');
console.log('📤 Exported functions:', Object.keys(module.exports).join(', '));