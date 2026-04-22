import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, ChevronDown, Sparkles } from 'lucide-react';
import { sendMessageToGemini, initializeGeminiChat } from '../services/geminiService';

const InvestAIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "👋 Hi! Ask me about our investment plans. Which plan fits your budget?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      initializeGeminiChat();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    try {
      const response = await sendMessageToGemini(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    { text: "Best for $500?", prompt: "Which plan is best for $500 investment?" },
    { text: "Gold Plan details", prompt: "Explain the Gold Plan details and returns" },
    { text: "Minimum deposit?", prompt: "What is the minimum investment amount?" },
    { text: "Highest returns?", prompt: "Which plan has the highest daily return?" }
  ];

  return (
    <div style={{ marginTop: 24 }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{ width: '100%', padding: '14px 18px', background: 'var(--accent-soft)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600, color: 'var(--accent)', cursor: 'pointer', transition: 'all 0.2s' }}>
        <Sparkles size={18} />
        <span style={{ flex: 1, textAlign: 'left' }}>AI Investment Assistant</span>
        <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div style={{ marginTop: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div style={{ maxHeight: 280, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, maxWidth: '90%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                {msg.role === 'assistant' && <div style={{ width: 28, height: 28, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}><Bot size={14} /></div>}
                <div style={{ padding: '10px 14px', borderRadius: 14, fontSize: 13, lineHeight: 1.5, background: msg.role === 'user' ? 'var(--accent)' : 'var(--surface2)', color: msg.role === 'user' ? '#fff' : 'var(--text)' }}>{msg.content}</div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /></div>
                <div style={{ padding: '10px 14px', borderRadius: 14, background: 'var(--surface2)', display: 'flex', gap: 4 }}><span style={{ width: 5, height: 5, background: 'var(--text3)', borderRadius: '50%', animation: 'bounce 1.4s infinite' }} /><span style={{ width: 5, height: 5, background: 'var(--text3)', borderRadius: '50%', animation: 'bounce 1.4s infinite 0.16s' }} /><span style={{ width: 5, height: 5, background: 'var(--text3)', borderRadius: '50%', animation: 'bounce 1.4s infinite 0.32s' }} /></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div style={{ padding: '8px 16px', display: 'flex', flexWrap: 'wrap', gap: 6, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            {quickQuestions.map((q, idx) => (
              <button key={idx} onClick={() => setInput(q.prompt)} style={{ padding: '5px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 20, fontSize: 11, color: 'var(--text2)', cursor: 'pointer' }}>{q.text}</button>
            ))}
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
            <input ref={inputRef} type="text" placeholder="Ask about investment plans..." value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} disabled={isLoading} style={{ flex: 1, padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 24, fontSize: 13, color: 'var(--text)', outline: 'none' }} />
            <button onClick={handleSend} disabled={!input.trim() || isLoading} style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !input.trim() || isLoading ? 0.4 : 1 }}><Send size={16} /></button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
      `}</style>
    </div>
  );
};

export default InvestAIAssistant;