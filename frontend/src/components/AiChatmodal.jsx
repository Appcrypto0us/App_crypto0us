// Add import at the top
import AIChatModal from './components/AIChatModal';

// Update InvestTab function
function InvestTab({ onInvest }) {
  const [showAIModal, setShowAIModal] = useState(false);

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '-0.03em', marginBottom: 6 }}>Investment Plans</h2>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>Choose a plan that matches your goals</p>
        </div>
        
        {/* AI Assistant Button */}
        <button 
          onClick={() => setShowAIModal(true)}
          className="btn btn-accent"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px' }}
        >
          <MessageCircle size={18} />
          <span>AI Assistant</span>
          <Sparkles size={14} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Object.values(INVESTMENT_PLANS).map(plan => {
          const d = plan.details;
          return (
            <div key={plan.plan_id} className="plan-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: d.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{d.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: '-0.02em', marginBottom: 2 }}>{plan.plan_name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{d.duration_days}d · every {d.profit_interval_hours}h · ${d.capital_range_min}–${d.capital_range_max}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{d.daily_return_rate}%</p>
                  <p style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>daily</p>
                </div>
              </div>
              <button onClick={() => onInvest(plan.plan_id)} className="btn btn-primary btn-full" style={{ fontSize: 14 }}>
                Invest in {plan.plan_name}
              </button>
            </div>
          );
        })}
      </div>

      {/* AI Chat Modal */}
      <AIChatModal 
        isOpen={showAIModal} 
        onClose={() => setShowAIModal(false)}
        onInvest={onInvest}
      />
    </div>
  );
}