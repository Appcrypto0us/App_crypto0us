import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const INVESTMENT_CONTEXT = `
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
- Be helpful and accurate
- Redirect non-investment questions politely
- Use USD currency format
`;

let chatSession = null;

export const initializeGeminiChat = async () => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
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
    
    return true;
  } catch (error) {
    console.error("Failed to initialize Gemini:", error);
    return false;
  }
};

export const sendMessageToGemini = async (message) => {
  if (!chatSession) {
    await initializeGeminiChat();
  }
  
  try {
    const prompt = `${INVESTMENT_CONTEXT}\n\nUser question: ${message}\n\nProvide a helpful, concise response:`;
    const result = await chatSession.sendMessage(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    return "I'm having trouble connecting right now. Please try again in a moment.";
  }
};