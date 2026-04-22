import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Bot, Sparkles, Trash2, Clock } from 'lucide-react';
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Detect keyboard on mobile
  useEffect(() => {
    if (!isOpen) return;

    const handleFocus = () => {
      // On input focus, wait for keyboard to appear
      setTimeout(() => {
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
          // Get keyboard height (rough estimate)
          const viewportHeight = window.visualViewport?.height || window.innerHeight;
          const windowHeight = window.innerHeight;
          const estimatedHeight = windowHeight - viewportHeight;
          if (estimatedHeight > 100) {
            setKeyboardHeight(estimatedHeight);
          }
        }
      }, 100);
    };

    const handleBlur = () => {
      setKeyboardHeight(0);
    };

    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener('focus', handleFocus);
      inputElement.addEventListener('blur', handleBlur);
    }

    // Also listen for visualViewport resize (more accurate)
    const handleViewportResize = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const diff = windowHeight - viewportHeight;
        if (diff > 100) {
          setKeyboardHeight(diff);
        } else {
          setKeyboardHeight(0);
        }
      }
    };

    window.visualViewport?.addEventListener('resize', handleViewportResize);

    return () => {
      if (inputElement) {
        inputElement.removeEventListener('focus', handleFocus);
        inputElement.removeEventListener('blur', handleBlur);
      }
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
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
      const res = await API.post('/ai/chat', { message: userMessage, sessionId });
      if (res.data.sessionId && !sessionId) setSessionId(res.data.sessionId);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: error.response?.data?.response || "Sorry, I'm having trouble connecting. Please try again." }]);
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
    setTimeout(() => {
      inputRef.current?.focus();
      handleSend();
    }, 100);
  };

  const handleClearChat = () => {
    setMessages([{ role: 'assistant', content: "👋 Chat cleared! How can I help you with your investment decisions today?" }]);
    setSessionId(null);
  };

  const quickQuestions = [
    { text: "◇ Best for $500?", prompt: "Which plan is best for $500 investment?" },
    { text: "⬡ Gold Plan", prompt: "Explain the Gold Plan details and returns" },
    { text: "◆ Minimum?", prompt: "What is the minimum investment amount?" },
    { text: "✦ Highest returns?", prompt: "Which plan has the highest daily return?" }
  ];

  if (!isOpen) return null;

  // Dynamic bottom padding to lift modal above keyboard
  const modalStyle = keyboardHeight > 0 ? { transform: `translateY(-${keyboardHeight}px)` } : {};

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal-sheet" style={modalStyle} onClick={e => e.stopPropagation()}>
        <div className="ai-modal-handle" />
        
        <div className="ai-modal-header">
          <div className="ai-modal-header-left">
            <div className="ai-modal-avatar">
              <Bot size={18} color="var(--bg, #f5f4f0)" />
            </div>
            <div>
              <h3 className="ai-modal-title">AI Investment Assistant</h3>
              <p className="ai-modal-subtitle">Powered by Gemini · Ask me anything</p>
            </div>
          </div>
          <div className="ai-modal-header-actions">
            <button className="ai-icon-btn" onClick={() => { setShowHistory(!showHistory); if (!showHistory) loadHistory(); }} title="Chat History">
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
            <button className="ai-back-btn" onClick={() => setShowHistory(false)}>← Back to Chat</button>
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
                  <div className="ai-message-bubble">{msg.content}</div>
                </div>
              ))}
              {isLoading && (
                <div className="ai-message assistant">
                  <div className="ai-message-avatar"><Loader2 size={11} className="ai-spinner" /></div>
                  <div className="ai-message-bubble ai-typing"><span>●</span><span>●</span><span>●</span></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick questions - hide when keyboard is open */}
            {messages.length <= 1 && keyboardHeight === 0 && (
              <div className="ai-quick-questions">
                <p>SUGGESTED QUESTIONS</p>
                <div className="ai-quick-buttons">
                  {quickQuestions.map((q, idx) => (
                    <button key={idx} onClick={() => handleQuickQuestion(q.prompt)}>{q.text}</button>
                  ))}
                </div>
              </div>
            )}

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
              <button onClick={handleSend} disabled={!input.trim() || isLoading} className="ai-send-btn">
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

        .ai-modal-sheet {
          background: var(--surface);
          width: 100%;
          max-width: 480px;
          border-radius: var(--radius-xl, 28px) var(--radius-xl, 28px) 0 0;
          padding: 20px 24px 24px;
          animation: slideUp 0.28s cubic-bezier(0.34, 1.4, 0.64, 1);
          border: 1px solid var(--border);
          border-bottom: none;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s ease;
          max-height: 85vh;
          overflow: hidden;
        }

        @media (min-width: 640px) {
          .ai-modal-sheet {
            border-radius: var(--radius-xl, 28px);
            animation: scaleIn 0.24s cubic-bezier(0.34, 1.4, 0.64, 1);
            border-bottom: 1px solid var(--border);
            max-height: 85vh;
          }
        }

        .ai-modal-handle {
          width: 36px;
          height: 3px;
          background: var(--border2);
          border-radius: 2px;
          margin: 0 auto 16px;
          display: none;
        }

        @media (max-width: 639px) {
          .ai-modal-handle {
            display: block;
          }
        }

        .ai-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          flex-shrink: 0;
        }

        .ai-modal-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ai-modal-avatar {
          width: 40px;
          height: 40px;
          background: var(--text);
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ai-modal-title {
          font-family: var(--font-display, 'Instrument Serif', Georgia, serif);
          font-size: 17px;
          font-weight: 400;
          letter-spacing: -0.02em;
          margin: 0;
          color: var(--text);
        }

        .ai-modal-subtitle {
          font-family: var(--font-mono, 'Geist Mono', monospace);
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.02em;
          opacity: 0.45;
          margin: 2px 0 0;
          color: var(--text);
        }

        .ai-modal-header-actions {
          display: flex;
          gap: 5px;
        }

        .ai-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-xs, 6px);
          background: var(--surface2);
          border: 1px solid var(--border);
          color: var(--text2);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 200ms cubic-bezier(0.4,0,0.2,1);
        }

        .ai-icon-btn:hover {
          background: var(--surface3);
          color: var(--text);
        }

        .ai-icon-btn:active {
          transform: scale(0.95);
        }

        .ai-modal-messages {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 0 0 16px 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scrollbar-width: thin;
        }

        .ai-modal-messages::-webkit-scrollbar {
          width: 3px;
        }

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

        .ai-message-bubble {
          padding: 10px 14px;
          border-radius: var(--radius, 14px);
          font-family: var(--font-body, 'Geist', system-ui, sans-serif);
          font-size: 13px;
          line-height: 1.5;
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

        .ai-typing {
          display: flex;
          gap: 3px;
          align-items: center;
          padding: 12px 14px;
        }

        .ai-typing span {
          font-size: 10px;
          animation: bounce 1.4s infinite ease-in-out both;
        }

        @keyframes bounce {
          0%,80%,100% { transform: scale(0.8); opacity:0.5; }
          40% { transform: scale(1.2); opacity:1; }
        }

        .ai-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .ai-quick-questions {
          padding: 12px 0 0;
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }

        .ai-quick-questions p {
          font-family: var(--font-mono, 'Geist Mono', monospace);
          font-size: 10px;
          font-weight: 700;
          color: var(--text3);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .ai-quick-buttons {
          display: flex;
          flex-wrap: nowrap;
          overflow-x: auto;
          gap: 8px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          padding-bottom: 4px;
        }

        .ai-quick-buttons::-webkit-scrollbar {
          height: 3px;
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
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 200ms cubic-bezier(0.4,0,0.2,1);
        }

        .ai-quick-buttons button:hover {
          background: var(--surface);
          border-color: var(--accent, #1a4aff);
          color: var(--accent, #1a4aff);
        }

        .ai-modal-input {
          padding: 12px 0 0;
          border-top: 1px solid var(--border);
          display: flex;
          gap: 10px;
          align-items: center;
          flex-shrink: 0;
          margin-top: 4px;
          background: var(--surface);
        }

        .ai-modal-input input {
          flex: 1;
          padding: 11px 16px;
          background: var(--surface2);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-sm, 10px);
          font-family: var(--font-body, 'Geist', system-ui, sans-serif);
          font-size: 13px;
          color: var(--text);
          outline: none;
        }

        .ai-modal-input input:focus {
          border-color: var(--accent, #1a4aff);
          box-shadow: 0 0 0 3px var(--accent-soft);
        }

        .ai-send-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: var(--text);
          border: none;
          color: var(--bg);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 200ms cubic-bezier(0.4,0,0.2,1);
        }

        .ai-send-btn:hover:not(:disabled) {
          opacity: 0.85;
          transform: scale(1.05);
        }

        .ai-send-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .ai-modal-history {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
        }

        .ai-history-heading {
          font-family: var(--font-mono, 'Geist Mono', monospace);
          font-size: 10px;
          font-weight: 700;
          color: var(--text3);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 12px;
        }

        .ai-history-item {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: var(--radius, 14px);
          padding: 12px;
          margin-bottom: 10px;
        }

        .ai-history-question {
          font-size: 12px;
          color: var(--text);
          margin-bottom: 5px;
        }

        .ai-history-answer {
          font-size: 11.5px;
          color: var(--text2);
          margin-bottom: 6px;
        }

        .ai-history-time {
          font-family: var(--font-mono, 'Geist Mono', monospace);
          font-size: 9px;
          color: var(--text3);
        }

        .ai-empty-history {
          text-align: center;
          color: var(--text3);
          padding: 40px 20px;
          font-size: 13px;
        }

        .ai-back-btn {
          width: 100%;
          padding: 10px 16px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm, 10px);
          font-size: 13px;
          font-weight: 500;
          color: var(--text2);
          cursor: pointer;
          margin-top: 10px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(60px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default AIChatModal;