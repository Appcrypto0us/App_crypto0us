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
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Keyboard detection using visualViewport API
  useEffect(() => {
    if (!isOpen) return;

    const handleViewportChange = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const isKeyboardOpen = viewportHeight < windowHeight * 0.75;
        setIsKeyboardVisible(isKeyboardOpen);
      }
    };

    window.visualViewport?.addEventListener('resize', handleViewportChange);
    window.visualViewport?.addEventListener('scroll', handleViewportChange);
    
    // Initial check
    handleViewportChange();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
    };
  }, [isOpen]);

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
    // Auto-focus input when quick question is selected
    setTimeout(() => inputRef.current?.focus(), 100);
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
    { text: "◇ Best for $500?", prompt: "Which plan is best for $500 investment?" },
    { text: "⬡ Gold Plan", prompt: "Explain the Gold Plan details and returns" },
    { text: "◆ Minimum?", prompt: "What is the minimum investment amount?" },
    { text: "✦ Highest returns?", prompt: "Which plan has the highest daily return?" }
  ];

  if (!isOpen) return null;

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div 
        className={`ai-modal ${isKeyboardVisible ? 'keyboard-active' : ''}`} 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ai-modal-header">
          <div className="ai-modal-header-left">
            <div className="ai-modal-avatar">
              <Bot size={18} color="var(--bg, #f5f4f0)" />
            </div>
            <div>
              <h3>AI Investment Assistant</h3>
              <p>Powered by Gemini · Ask me about plans</p>
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
              <Clock size={15} />
            </button>
            <button className="ai-icon-btn" onClick={handleClearChat} title="Clear Chat">
              <Trash2 size={15} />
            </button>
            <button className="ai-icon-btn" onClick={onClose} title="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        {showHistory ? (
          <div className="ai-modal-history">
            <p className="ai-history-heading">Recent Conversations</p>
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
                      <Sparkles size={11} />
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
                    <Loader2 size={11} className="ai-spinner" />
                  </div>
                  <div className="ai-message-bubble ai-typing">
                    <span>●</span><span>●</span><span>●</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions - Hidden when keyboard is visible */}
            {messages.length <= 1 && !isKeyboardVisible && (
              <div className="ai-quick-questions">
                <p>Suggested questions</p>
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
                placeholder="Ask about investment plans..."
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
                <Send size={15} />
              </button>
            </div>
          </>
        )}
      </div>
<style jsx>{`
  .ai-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    z-index: 2000;
    padding: 0;
    animation: fadeIn 0.18s ease;
  }

  @media (min-width: 640px) {
    .ai-modal-overlay {
      align-items: center;
      padding: 20px;
    }
  }

  /* ── Modal shell — matches .modal-sheet from App.js ── */
  .ai-modal {
    background: var(--surface);
    border-radius: var(--radius-xl, 28px) var(--radius-xl, 28px) 0 0;
    width: 100%;
    max-width: 480px;
    height: 85vh;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-xl);
    border: 1px solid var(--border);
    border-bottom: none;
    animation: slideUp 0.28s cubic-bezier(0.34, 1.4, 0.64, 1);
    overflow: hidden;
    transition: height 0.2s ease, border-radius 0.2s ease;
  }

  /* Keyboard active styles */
  .ai-modal.keyboard-active {
    height: 95vh;
    max-height: 95vh;
    border-radius: 0 !important;
  }

  @media (min-width: 640px) {
    .ai-modal {
      border-radius: var(--radius-xl, 28px);
      height: 600px;
      max-height: 85vh;
      border-bottom: 1px solid var(--border);
      animation: scaleIn 0.24s cubic-bezier(0.34, 1.4, 0.64, 1);
    }
    
    .ai-modal.keyboard-active {
      height: 600px;
      max-height: 85vh;
      border-radius: var(--radius-xl, 28px) !important;
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(60px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.92); }
    to   { opacity: 1; transform: scale(1); }
  }

  /* ── Header — dark/inverted like .wallet-card ── */
  .ai-modal-header {
    padding: 18px 20px 16px;
    background: var(--text);
    color: var(--bg);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
  }

  /* Subtle orb decorations matching wallet-card pseudo-elements */
  .ai-modal-header::before {
    content: '';
    position: absolute;
    top: -50px;
    right: -50px;
    width: 160px;
    height: 160px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 50%;
    pointer-events: none;
  }

  .ai-modal-header::after {
    content: '';
    position: absolute;
    bottom: -60px;
    left: -30px;
    width: 140px;
    height: 140px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 50%;
    pointer-events: none;
  }

  .ai-modal-header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    position: relative;
    z-index: 1;
  }

  .ai-modal-avatar {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.12);
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  /* Title — Instrument Serif matching .header-name */
  .ai-modal-header h3 {
    font-family: var(--font-display, 'Instrument Serif', Georgia, serif);
    font-size: 18px;
    font-weight: 400;
    letter-spacing: -0.02em;
    margin: 0 0 2px;
    color: var(--bg);
    opacity: 0.95;
  }

  /* Sub — Geist Mono matching caption style */
  .ai-modal-header p {
    font-family: var(--font-mono, 'Geist Mono', monospace);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.02em;
    opacity: 0.45;
    margin: 0;
    color: var(--bg);
  }

  .ai-modal-header-actions {
    display: flex;
    gap: 5px;
    position: relative;
    z-index: 1;
  }

  /* Icon buttons in header — ghost on dark bg */
  .ai-icon-btn {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-xs, 6px);
    background: rgba(255, 255, 255, 0.10);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: var(--bg);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--transition, 200ms cubic-bezier(0.4,0,0.2,1));
  }

  .ai-icon-btn:hover {
    background: rgba(255, 255, 255, 0.18);
  }

  .ai-icon-btn:active {
    transform: scale(0.95);
  }

  /* ── Messages area ── */
  .ai-modal-messages {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    scrollbar-width: thin;
    scrollbar-color: var(--border2, rgba(0,0,0,0.12)) transparent;
  }

  .ai-modal-messages::-webkit-scrollbar { width: 3px; }
  .ai-modal-messages::-webkit-scrollbar-track { background: transparent; }
  .ai-modal-messages::-webkit-scrollbar-thumb { background: var(--border2, rgba(0,0,0,0.12)); border-radius: 3px; }

  .ai-message {
    display: flex;
    gap: 8px;
    max-width: 86%;
  }

  .ai-message.user {
    align-self: flex-end;
    flex-direction: row-reverse;
  }

  .ai-message.assistant {
    align-self: flex-start;
  }

  /* Small bot avatar — matches .action-icon feel */
  .ai-message-avatar {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    background: var(--accent-soft, rgba(26,74,255,0.08));
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent, #1a4aff);
    flex-shrink: 0;
    margin-top: 2px;
  }

  /* Bubbles — mirror .inv-card and .card surface treatment */
  .ai-message-bubble {
    padding: 10px 14px;
    border-radius: var(--radius, 14px);
    font-family: var(--font-body, 'Geist', system-ui, sans-serif);
    font-size: 13.5px;
    line-height: 1.5;
    letter-spacing: -0.01em;
  }

  .ai-message.user .ai-message-bubble {
    background: var(--text);
    color: var(--bg);
    border-bottom-right-radius: 4px;
  }

  .ai-message.assistant .ai-message-bubble {
    background: var(--surface2, #f9f8f5);
    color: var(--text);
    border: 1px solid var(--border);
    border-bottom-left-radius: 4px;
  }

  /* Typing indicator */
  .ai-typing {
    display: flex;
    gap: 3px;
    align-items: center;
    padding: 12px 14px;
  }

  .ai-typing span {
    font-size: 10px;
    animation: bounce 1.4s infinite ease-in-out both;
    color: var(--text3);
  }

  .ai-typing span:nth-child(1) { animation-delay: -0.32s; }
  .ai-typing span:nth-child(2) { animation-delay: -0.16s; }

  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
    40%           { transform: scale(1.2); opacity: 1; }
  }

  .ai-spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  /* ── Quick questions — Horizontal scroll chips ── */
  .ai-quick-questions {
    padding: 12px 20px 14px;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }

  .ai-quick-questions p {
    font-family: var(--font-mono, 'Geist Mono', monospace);
    font-size: 10px;
    font-weight: 700;
    color: var(--text3);
    margin-bottom: 9px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .ai-quick-buttons {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 6px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    padding-bottom: 4px;
  }

  .ai-quick-buttons::-webkit-scrollbar {
    height: 3px;
  }

  .ai-quick-buttons::-webkit-scrollbar-track {
    background: transparent;
  }

  .ai-quick-buttons::-webkit-scrollbar-thumb {
    background: var(--border2, rgba(0,0,0,0.12));
    border-radius: 3px;
  }

  .ai-quick-buttons button {
    padding: 6px 12px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 20px;
    font-family: var(--font-mono, 'Geist Mono', monospace);
    font-size: 11px;
    font-weight: 500;
    color: var(--text2);
    cursor: pointer;
    transition: all var(--transition, 200ms cubic-bezier(0.4,0,0.2,1));
    letter-spacing: 0.01em;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .ai-quick-buttons button:hover {
    background: var(--surface);
    border-color: var(--accent, #1a4aff);
    color: var(--accent, #1a4aff);
    box-shadow: 0 0 0 2px var(--accent-soft, rgba(26,74,255,0.08));
  }

  .ai-quick-buttons button:active {
    transform: scale(0.96);
  }

  /* ── Input row — matches .input-field pattern ── */
  .ai-modal-input {
    padding: 12px 20px 14px;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 9px;
    align-items: center;
    flex-shrink: 0;
  }

  .ai-modal-input input {
    flex: 1;
    padding: 11px 16px;
    background: var(--surface2);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm, 10px);
    font-family: var(--font-body, 'Geist', system-ui, sans-serif);
    font-size: 13.5px;
    color: var(--text);
    outline: none;
    transition: border-color var(--transition, 200ms cubic-bezier(0.4,0,0.2,1)),
                box-shadow var(--transition, 200ms cubic-bezier(0.4,0,0.2,1));
    letter-spacing: -0.01em;
  }

  .ai-modal-input input::placeholder {
    color: var(--text3);
  }

  .ai-modal-input input:focus {
    border-color: var(--accent, #1a4aff);
    box-shadow: 0 0 0 3px var(--accent-soft, rgba(26,74,255,0.08));
  }

  .ai-modal-input input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Send button — .btn-primary inverted (dark pill) */
  .ai-send-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--text);
    border: none;
    color: var(--bg);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition, 200ms cubic-bezier(0.4,0,0.2,1));
    flex-shrink: 0;
  }

  .ai-send-btn:hover:not(:disabled) {
    opacity: 0.85;
    transform: scale(1.05);
  }

  .ai-send-btn:active:not(:disabled) {
    transform: scale(0.96);
  }

  .ai-send-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  /* ── History panel ── */
  .ai-modal-history {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 20px;
    scrollbar-width: thin;
    scrollbar-color: var(--border2, rgba(0,0,0,0.12)) transparent;
  }

  .ai-modal-history::-webkit-scrollbar { width: 3px; }
  .ai-modal-history::-webkit-scrollbar-track { background: transparent; }
  .ai-modal-history::-webkit-scrollbar-thumb { background: var(--border2, rgba(0,0,0,0.12)); border-radius: 3px; }

  /* History heading — matches .section-title */
  .ai-history-heading {
    font-family: var(--font-mono, 'Geist Mono', monospace);
    font-size: 10px;
    font-weight: 700;
    color: var(--text3);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 14px;
  }

  /* History item — matches .inv-card */
  .ai-history-item {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius, 14px);
    padding: 14px;
    margin-bottom: 10px;
    transition: box-shadow var(--transition, 200ms cubic-bezier(0.4,0,0.2,1));
  }

  .ai-history-item:hover {
    box-shadow: var(--shadow-sm);
  }

  .ai-history-question {
    font-family: var(--font-body, 'Geist', system-ui, sans-serif);
    font-size: 13px;
    color: var(--text);
    margin-bottom: 5px;
    letter-spacing: -0.01em;
    line-height: 1.45;
  }

  .ai-history-answer {
    font-family: var(--font-body, 'Geist', system-ui, sans-serif);
    font-size: 12.5px;
    color: var(--text2);
    margin-bottom: 8px;
    line-height: 1.45;
  }

  .ai-history-time {
    font-family: var(--font-mono, 'Geist Mono', monospace);
    font-size: 10px;
    color: var(--text3);
    letter-spacing: 0.02em;
  }

  .ai-empty-history {
    text-align: center;
    color: var(--text3);
    padding: 48px 20px;
    font-family: var(--font-body, 'Geist', system-ui, sans-serif);
    font-size: 13px;
  }

  /* Back button — matches .btn-ghost */
  .ai-back-btn {
    width: 100%;
    padding: 11px 16px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm, 10px);
    font-family: var(--font-body, 'Geist', system-ui, sans-serif);
    font-size: 13px;
    font-weight: 500;
    color: var(--text2);
    cursor: pointer;
    margin-top: 10px;
    transition: all var(--transition, 200ms cubic-bezier(0.4,0,0.2,1));
    letter-spacing: -0.01em;
  }

  .ai-back-btn:hover {
    background: var(--surface);
    color: var(--text);
    border-color: var(--border2, rgba(0,0,0,0.12));
  }
`}</style>
    </div>
  );
};

export default AIChatModal;