import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Bot, Sparkles, MessageCircle, Trash2, Clock } from 'lucide-react';
import API from '../api';

const AIChatModal = ({ isOpen, onClose, onInvest }) => {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "👋 Hi! I'm your CryptoLegacy AI assistant. Ask me about investment plans, returns, or which plan fits your budget!" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadHistory = async () => {
    try {
      const res = await API.get('/ai/history');
      setHistory(res.data.interactions || []);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await API.post('/ai/chat', { 
        message: userMessage,
        sessionId 
      });
      
      if (res.data.sessionId && !sessionId) {
        setSessionId(res.data.sessionId);
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: error.response?.data?.response || "Sorry, I'm having trouble connecting. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickQuestion = (question) => {
    setInput(question);
  };

  const handleClearChat = () => {
    setMessages([
      { 
        role: 'assistant', 
        content: "👋 Chat cleared! How can I help you with your investment decisions today?" 
      }
    ]);
    setSessionId(null);
  };

  const quickQuestions = [
    { text: "💎 Best for $500?", prompt: "Which plan is best for $500 investment?" },
    { text: "🥇 Gold Plan", prompt: "Explain the Gold Plan details and returns" },
    { text: "💰 Minimum?", prompt: "What is the minimum investment amount?" },
    { text: "📈 Highest returns?", prompt: "Which plan has the highest daily return?" }
  ];

  if (!isOpen) return null;

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-modal-header">
          <div className="ai-modal-header-left">
            <div className="ai-modal-avatar">
              <Bot size={20} color="#fff" />
            </div>
            <div>
              <h3>AI Investment Assistant</h3>
              <p>Powered by Gemini • Ask me anything about plans</p>
            </div>
          </div>
          <div className="ai-modal-header-actions">
            <button 
              className="ai-icon-btn" 
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory) loadHistory();
              }}
              title="Chat History"
            >
              <Clock size={16} />
            </button>
            <button className="ai-icon-btn" onClick={handleClearChat} title="Clear Chat">
              <Trash2 size={16} />
            </button>
            <button className="ai-icon-btn" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        {showHistory ? (
          <div className="ai-modal-history">
            <h4>Recent Conversations</h4>
            {history.length === 0 ? (
              <p className="ai-empty-history">No conversation history yet.</p>
            ) : (
              history.slice(0, 20).map((item, idx) => (
                <div key={idx} className="ai-history-item">
                  <p className="ai-history-question"><strong>Q:</strong> {item.user_message}</p>
                  <p className="ai-history-answer"><strong>A:</strong> {item.ai_response}</p>
                  <span className="ai-history-time">{new Date(item.created_at).toLocaleString()}</span>
                </div>
              ))
            )}
            <button className="ai-back-btn" onClick={() => setShowHistory(false)}>
              ← Back to Chat
            </button>
          </div>
        ) : (
          <>
            <div className="ai-modal-messages">
              {messages.map((msg, idx) => (
                <div key={idx} className={`ai-message ${msg.role}`}>
                  {msg.role === 'assistant' && (
                    <div className="ai-message-avatar">
                      <Sparkles size={12} />
                    </div>
                  )}
                  <div className="ai-message-bubble">
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="ai-message assistant">
                  <div className="ai-message-avatar">
                    <Loader2 size={12} className="ai-spinner" />
                  </div>
                  <div className="ai-message-bubble ai-typing">
                    <span>●</span><span>●</span><span>●</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length <= 1 && (
              <div className="ai-quick-questions">
                <p>Suggested questions:</p>
                <div className="ai-quick-buttons">
                  {quickQuestions.map((q, idx) => (
                    <button key={idx} onClick={() => handleQuickQuestion(q.prompt)}>
                      {q.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="ai-modal-input">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type your question about investment plans..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <button 
                onClick={handleSend} 
                disabled={!input.trim() || isLoading}
                className="ai-send-btn"
              >
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </div>
<style jsx>{`
  .ai-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 2000;
    padding: 0;
    animation: fadeIn 0.2s ease;
  }

  @media (min-width: 481px) {
    .ai-modal-overlay {
      align-items: center;
      padding: 16px;
    }
  }

  .ai-modal {
    background: var(--surface);
    border-radius: 24px 24px 0 0;
    width: 100%;
    max-width: 480px;
    height: 85vh;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-xl);
    border: 1px solid var(--border);
    border-bottom: none;
    animation: slideUp 0.25s cubic-bezier(0.34, 1.4, 0.64, 1);
    overflow: hidden;
  }

  @media (min-width: 481px) {
    .ai-modal {
      border-radius: 24px;
      height: 600px;
      max-height: 85vh;
      border-bottom: 1px solid var(--border);
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(100%); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (min-width: 481px) {
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
  }

  .ai-modal-header {
    padding: 16px 16px 14px;
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  @media (min-width: 481px) {
    .ai-modal-header {
      padding: 20px;
    }
  }

  .ai-modal-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  @media (min-width: 481px) {
    .ai-modal-header-left {
      gap: 14px;
    }
  }

  .ai-modal-avatar {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (min-width: 481px) {
    .ai-modal-avatar {
      width: 44px;
      height: 44px;
      border-radius: 14px;
    }
  }

  .ai-modal-header h3 {
    font-size: 15px;
    font-weight: 700;
    margin: 0 0 2px;
    letter-spacing: -0.01em;
  }

  @media (min-width: 481px) {
    .ai-modal-header h3 {
      font-size: 16px;
      margin: 0 0 4px;
    }
  }

  .ai-modal-header p {
    font-size: 11px;
    opacity: 0.85;
    margin: 0;
  }

  @media (min-width: 481px) {
    .ai-modal-header p {
      font-size: 12px;
    }
  }

  .ai-modal-header-actions {
    display: flex;
    gap: 4px;
  }

  @media (min-width: 481px) {
    .ai-modal-header-actions {
      gap: 6px;
    }
  }

  .ai-icon-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.15);
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  @media (min-width: 481px) {
    .ai-icon-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
    }
  }

  .ai-icon-btn:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  .ai-modal-messages {
    flex: 1;
    overflow-y: auto;
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  @media (min-width: 481px) {
    .ai-modal-messages {
      padding: 20px;
      gap: 14px;
    }
  }

  .ai-message {
    display: flex;
    gap: 8px;
    max-width: 88%;
  }

  @media (min-width: 481px) {
    .ai-message {
      gap: 10px;
      max-width: 85%;
    }
  }

  .ai-message.user {
    align-self: flex-end;
    flex-direction: row-reverse;
  }

  .ai-message.assistant {
    align-self: flex-start;
  }

  .ai-message-avatar {
    width: 24px;
    height: 24px;
    border-radius: 8px;
    background: var(--accent-soft);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
    flex-shrink: 0;
  }

  @media (min-width: 481px) {
    .ai-message-avatar {
      width: 28px;
      height: 28px;
      border-radius: 10px;
    }
  }

  .ai-message-bubble {
    padding: 10px 14px;
    border-radius: 16px;
    font-size: 13px;
    line-height: 1.45;
  }

  @media (min-width: 481px) {
    .ai-message-bubble {
      padding: 12px 16px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.5;
    }
  }

  .ai-message.user .ai-message-bubble {
    background: var(--accent);
    color: white;
    border-bottom-right-radius: 4px;
  }

  .ai-message.assistant .ai-message-bubble {
    background: var(--surface2);
    color: var(--text);
    border-bottom-left-radius: 4px;
  }

  .ai-typing {
    display: flex;
    gap: 3px;
    padding: 12px 16px;
  }

  @media (min-width: 481px) {
    .ai-typing {
      gap: 4px;
      padding: 14px 18px;
    }
  }

  .ai-typing span {
    animation: bounce 1.4s infinite ease-in-out both;
    opacity: 0.5;
  }

  .ai-typing span:nth-child(1) { animation-delay: -0.32s; }
  .ai-typing span:nth-child(2) { animation-delay: -0.16s; }

  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0.8); }
    40% { transform: scale(1.2); }
  }

  .ai-spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .ai-quick-questions {
    padding: 12px 16px;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }

  @media (min-width: 481px) {
    .ai-quick-questions {
      padding: 16px 20px;
    }
  }

  .ai-quick-questions p {
    font-size: 11px;
    font-weight: 600;
    color: var(--text3);
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  @media (min-width: 481px) {
    .ai-quick-questions p {
      font-size: 12px;
      margin-bottom: 10px;
    }
  }

  .ai-quick-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  @media (min-width: 481px) {
    .ai-quick-buttons {
      gap: 8px;
    }
  }

  .ai-quick-buttons button {
    padding: 6px 12px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 16px;
    font-size: 11px;
    color: var(--text2);
    cursor: pointer;
    transition: all 0.15s;
  }

  @media (min-width: 481px) {
    .ai-quick-buttons button {
      padding: 8px 14px;
      border-radius: 20px;
      font-size: 12px;
    }
  }

  .ai-quick-buttons button:hover {
    background: var(--surface);
    border-color: var(--accent);
    color: var(--accent);
  }

  .ai-modal-input {
    padding: 12px 16px;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 8px;
    align-items: center;
    flex-shrink: 0;
  }

  @media (min-width: 481px) {
    .ai-modal-input {
      padding: 16px 20px;
      gap: 10px;
    }
  }

  .ai-modal-input input {
    flex: 1;
    padding: 10px 14px;
    background: var(--surface2);
    border: 1.5px solid var(--border);
    border-radius: 24px;
    font-size: 13px;
    color: var(--text);
    outline: none;
    transition: border-color 0.2s;
  }

  @media (min-width: 481px) {
    .ai-modal-input input {
      padding: 12px 16px;
      border-radius: 30px;
      font-size: 14px;
    }
  }

  .ai-modal-input input:focus {
    border-color: var(--accent);
  }

  .ai-send-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--accent);
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  @media (min-width: 481px) {
    .ai-send-btn {
      width: 44px;
      height: 44px;
    }
  }

  .ai-send-btn:hover:not(:disabled) {
    background: var(--accent2);
    transform: scale(1.05);
  }

  .ai-send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .ai-modal-history {
    flex: 1;
    overflow-y: auto;
    padding: 14px 16px;
  }

  @media (min-width: 481px) {
    .ai-modal-history {
      padding: 20px;
    }
  }

  .ai-modal-history h4 {
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 14px;
    color: var(--text);
  }

  @media (min-width: 481px) {
    .ai-modal-history h4 {
      font-size: 14px;
      margin-bottom: 16px;
    }
  }

  .ai-history-item {
    background: var(--surface2);
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 10px;
  }

  @media (min-width: 481px) {
    .ai-history-item {
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 12px;
    }
  }

  .ai-history-question {
    font-size: 12px;
    color: var(--text);
    margin-bottom: 5px;
  }

  @media (min-width: 481px) {
    .ai-history-question {
      font-size: 13px;
      margin-bottom: 6px;
    }
  }

  .ai-history-answer {
    font-size: 12px;
    color: var(--text2);
    margin-bottom: 5px;
  }

  @media (min-width: 481px) {
    .ai-history-answer {
      font-size: 13px;
      margin-bottom: 6px;
    }
  }

  .ai-history-time {
    font-size: 9px;
    color: var(--text3);
    font-family: var(--font-mono);
  }

  @media (min-width: 481px) {
    .ai-history-time {
      font-size: 10px;
    }
  }

  .ai-empty-history {
    text-align: center;
    color: var(--text3);
    padding: 32px;
    font-size: 13px;
  }

  @media (min-width: 481px) {
    .ai-empty-history {
      padding: 40px;
    }
  }

  .ai-back-btn {
    width: 100%;
    padding: 10px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    cursor: pointer;
    margin-top: 8px;
  }

  @media (min-width: 481px) {
    .ai-back-btn {
      padding: 12px;
      border-radius: 12px;
      font-size: 14px;
      margin-top: 10px;
    }
  }

  .ai-back-btn:hover {
    background: var(--surface3);
  }
`}</style>
    </div>
  );
};

export default AIChatModal;