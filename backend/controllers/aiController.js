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

const userSessions = new Map();

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

const estimateTokens = (text) => Math.ceil(text.length / 4);

exports.askAI = async (req, res) => {
  const startTime = Date.now();
  const userId = req.user.id;
  const { message, sessionId } = req.body;

  if (!message) return res.status(400).json({ message: 'Message is required' });

  if (!geminiAvailable) {
    const aiResponse = getFallbackResponse(message);
    await AIInteraction.create({
      userId,
      sessionId: sessionId || uuidv4(),
      userMessage: message,
      aiResponse,
      context: 'general',
      tokensUsed: estimateTokens(message) + estimateTokens(aiResponse),
      responseTimeMs: Date.now() - startTime
    }).catch(e => console.error('Failed to log interaction:', e));

    return res.json({ response: aiResponse, sessionId: sessionId || uuidv4() });
  }

  try {
    const currentSessionId = sessionId || uuidv4();
    let chatSession = userSessions.get(`${userId}:${currentSessionId}`);

    if (!chatSession) {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash", // UPDATED MODEL
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 256,
          topP: 0.9,
        }
      });

      chatSession = model.startChat({
        history: [
          { role: "user", parts: [{ text: "Confirm you understand CryptoLegacy investment plans." }] },
          { role: "model", parts: [{ text: "I understand CryptoLegacy investment plans and I'm ready to help users choose the best plan for their goals." }] },
        ],
      });
      userSessions.set(`${userId}:${currentSessionId}`, chatSession);
    }

    const prompt = `${INVESTMENT_PLANS_CONTEXT}\n\nUser question: ${message}\n\nProvide a helpful, concise response:`;
    const result = await chatSession.sendMessage(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    await AIInteraction.create({
      userId,
      sessionId: currentSessionId,
      userMessage: message,
      aiResponse,
      context: 'general',
      tokensUsed: estimateTokens(prompt) + estimateTokens(aiResponse),
      responseTimeMs: Date.now() - startTime
    });

    res.json({ response: aiResponse, sessionId: currentSessionId });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ 
      message: 'Failed to get AI response',
      response: 'I apologize, but I am having trouble processing your request right now.' 
    });
  }
};

exports.getPlanRecommendation = async (req, res) => {
  const startTime = Date.now();
  const userId = req.user.id;
  const { amount, goal } = req.body;

  if (!amount) return res.status(400).json({ message: 'Investment amount is required' });

  if (!geminiAvailable) {
    // ... [Keep your existing recommendation fallback logic]
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", // UPDATED MODEL
      generationConfig: { temperature: 0.7, maxOutputTokens: 200, topP: 0.9 }
    });

    const prompt = `User wants to invest $${amount}. Their goal is: ${goal || "maximize returns"}. 
    Based on CryptoLegacy's investment plans, which plan would you recommend and why? Keep response under 100 words.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    await AIInteraction.create({
      userId,
      sessionId: uuidv4(),
      userMessage: `Recommend plan for $${amount}. Goal: ${goal || 'maximize returns'}`,
      aiResponse,
      context: 'recommendation',
      investmentAmount: amount,
      tokensUsed: estimateTokens(prompt) + estimateTokens(aiResponse),
      responseTimeMs: Date.now() - startTime
    });

    res.json({ response: aiResponse });
  } catch (error) {
    console.error('AI Recommendation Error:', error);
    res.status(500).json({ message: 'Failed to get recommendation' });
  }
};

exports.explainPlan = async (req, res) => {
  const startTime = Date.now();
  const userId = req.user.id;
  const { planId } = req.params;
  const planNames = { 'basic_plan': 'Basic', 'silver_plan': 'Silver', 'gold_plan': 'Gold', 'diamond_plan': 'Diamond', 'platinum_plan': 'Platinum', 'ultimate_plan': 'Ultimate' };
  const planName = planNames[planId] || planId;

  if (!geminiAvailable) {
    // ... [Keep your existing explanation fallback logic]
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", // UPDATED MODEL
      generationConfig: { temperature: 0.7, maxOutputTokens: 200, topP: 0.9 }
    });

    const prompt = `Explain the CryptoLegacy ${planName} investment plan details. Keep it concise.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    await AIInteraction.create({
      userId,
      sessionId: uuidv4(),
      userMessage: `Explain ${planName} plan`,
      aiResponse,
      context: 'plan_explanation',
      planId,
      tokensUsed: estimateTokens(prompt) + estimateTokens(aiResponse),
      responseTimeMs: Date.now() - startTime
    });

    res.json({ response: aiResponse });
  } catch (error) {
    console.error('AI Explain Error:', error);
    res.status(500).json({ message: 'Failed to explain plan' });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;
    const interactions = await AIInteraction.getByUser(userId, parseInt(limit), parseInt(offset));
    res.json({ interactions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch history' });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const analytics = await AIInteraction.getAnalytics(startDate, endDate);
    const recentInteractions = await AIInteraction.getRecent(50);
    res.json({ analytics, recentInteractions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
};

exports.clearUserSession = (userId) => {
  for (const key of userSessions.keys()) {
    if (key.startsWith(`${userId}:`)) userSessions.delete(key);
  }
};

console.log('✅ AI Controller loaded and updated to Gemini 2.5');
