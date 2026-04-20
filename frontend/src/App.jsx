import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard, Users, ArrowDownCircle, ArrowUpCircle,
  TrendingUp, ShieldCheck, History, Radio, LogOut, Sun, Moon,
  Search, Bell, ChevronRight, ChevronLeft, ChevronDown,
  CheckCircle2, XCircle, Clock, AlertTriangle, Eye,
  Camera, FileText, Send, Trash2, Edit3, UserX, UserCheck,
  DollarSign, Activity, BarChart3, Wallet, Filter, RefreshCw,
  Menu, X, ArrowUpRight, ArrowDownRight, MoreVertical, Zap
} from "lucide-react";
import { useAuth } from './context/AuthContext';
import API from './api';

// ============================================================================
// GLOBAL STYLES
// ============================================================================
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #f0f2f7;
    --surface: #ffffff;
    --surface2: #f7f8fc;
    --border: rgba(0,0,0,0.07);
    --text: #0d1117;
    --text2: #5a6272;
    --text3: #9ba3b2;
    --accent: #1a56db;
    --accent2: #0e3fa0;
    --accent-glow: rgba(26,86,219,0.18);
    --green: #0fa870;
    --green-bg: rgba(15,168,112,0.10);
    --red: #e53e3e;
    --red-bg: rgba(229,62,62,0.09);
    --gold: #c7922a;
    --gold-bg: rgba(199,146,42,0.10);
    --purple: #7c3aed;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
    --shadow-lg: 0 12px 40px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.05);
    --shadow-xl: 0 24px 64px rgba(0,0,0,0.12);
    --radius-sm: 10px;
    --radius: 16px;
    --radius-lg: 24px;
    --radius-xl: 32px;
    --transition: 200ms cubic-bezier(0.4,0,0.2,1);
    --font-display: 'Syne', sans-serif;
    --font-body: 'DM Sans', sans-serif;
  }

  .dark-mode {
    --bg: #0b0e14;
    --surface: #131720;
    --surface2: #1a1f2e;
    --border: rgba(255,255,255,0.06);
    --text: #e8ecf4;
    --text2: #8891a5;
    --text3: #4a5168;
    --accent-glow: rgba(26,86,219,0.22);
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.4);
    --shadow-lg: 0 12px 40px rgba(0,0,0,0.5);
  }

  html, body { font-family: var(--font-body); background: var(--bg); color: var(--text); }
  .cl-app { min-height: 100vh; background: var(--bg); transition: background 0.3s ease; font-family: var(--font-body); }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-family: var(--font-body); font-weight: 500; cursor: pointer; border: none; outline: none; transition: all var(--transition); border-radius: var(--radius-sm); }
  .btn:active { transform: scale(0.97); }
  .btn-primary { background: var(--accent); color: #fff; padding: 12px 20px; font-size: 14px; box-shadow: 0 4px 14px var(--accent-glow); }
  .btn-primary:hover { background: var(--accent2); box-shadow: 0 6px 20px var(--accent-glow); transform: translateY(-1px); }
  .btn-ghost { background: transparent; color: var(--text2); padding: 8px 12px; font-size: 13px; }
  .btn-ghost:hover { background: var(--surface2); color: var(--text); }
  .btn-danger { background: var(--red-bg); color: var(--red); padding: 7px 12px; font-size: 12px; }
  .btn-danger:hover { background: var(--red); color: #fff; }
  .btn-success { background: var(--green-bg); color: var(--green); padding: 7px 12px; font-size: 12px; }
  .btn-success:hover { background: var(--green); color: #fff; }
  .btn-full { width: 100%; }
  .btn-lg { padding: 14px 24px; font-size: 15px; border-radius: var(--radius); }
  .btn-icon { width: 36px; height: 36px; padding: 0; border-radius: 50%; }
  .btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none !important; }

  .card { background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow-sm); border: 1px solid var(--border); padding: 20px; transition: box-shadow var(--transition); }
  .card:hover { box-shadow: var(--shadow-md); }
  .card-lg { padding: 28px; border-radius: var(--radius-lg); }

  .input-field { width: 100%; background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 12px 16px; font-family: var(--font-body); font-size: 14px; color: var(--text); outline: none; transition: border-color var(--transition), box-shadow var(--transition); }
  .input-field:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
  .input-field::placeholder { color: var(--text3); }
  .select-field { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ba3b2' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px; cursor: pointer; }
  .input-label { font-size: 12px; font-weight: 600; color: var(--text2); letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 6px; display: block; }
  .input-group { margin-bottom: 16px; }

  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.02em; }
  .badge-green { background: var(--green-bg); color: var(--green); }
  .badge-red { background: var(--red-bg); color: var(--red); }
  .badge-gold { background: var(--gold-bg); color: var(--gold); }
  .badge-blue { background: var(--accent-glow); color: var(--accent); }
  .badge-gray { background: var(--surface2); color: var(--text2); }

  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: flex-end; justify-content: center; padding: 0; animation: fadeIn 0.18s ease; }
  @media(min-width:640px){ .modal-overlay { align-items: center; padding: 20px; } }
  .modal-sheet { background: var(--surface); width: 100%; max-width: 440px; border-radius: var(--radius-xl) var(--radius-xl) 0 0; padding: 28px 24px 32px; animation: slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1); max-height: 90vh; overflow-y: auto; }
  @media(min-width:640px){ .modal-sheet { border-radius: var(--radius-xl); animation: scaleIn 0.22s cubic-bezier(0.34,1.56,0.64,1); } }
  .modal-handle { width: 40px; height: 4px; background: var(--border); border-radius: 2px; margin: 0 auto 20px; }
  @media(min-width:640px){ .modal-handle { display: none; } }
  .modal-title { font-family: var(--font-display); font-size: 20px; font-weight: 700; margin-bottom: 20px; }

  .toast-container { position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); z-index: 9999; display: flex; flex-direction: column; gap: 8px; align-items: center; pointer-events: none; }
  .toast { padding: 12px 20px; border-radius: 100px; font-size: 13px; font-weight: 500; color: #fff; animation: toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1); box-shadow: var(--shadow-lg); display: flex; align-items: center; gap: 8px; white-space: nowrap; }
  .toast-success { background: linear-gradient(135deg, #0fa870, #0d8f5f); }
  .toast-error { background: linear-gradient(135deg, #e53e3e, #c53030); }
  .toast-info { background: linear-gradient(135deg, var(--accent), var(--accent2)); }

  .spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
  .spinner-dark { border-color: var(--border); border-top-color: var(--accent); }

  .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: var(--surface); border-top: 1px solid var(--border); display: flex; z-index: 100; padding: 8px 0 calc(8px + env(safe-area-inset-bottom)); }
  .nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px 4px; cursor: pointer; transition: color var(--transition); color: var(--text3); font-size: 10px; font-weight: 500; border: none; background: transparent; font-family: var(--font-body); }
  .nav-item.active { color: var(--accent); }

  .wallet-card { background: linear-gradient(135deg, #1a56db 0%, #0e3fa0 50%, #0a2d7a 100%); border-radius: var(--radius-lg); padding: 28px; color: #fff; position: relative; overflow: hidden; box-shadow: 0 8px 32px rgba(26,86,219,0.30); }
  .wallet-card::before { content: ''; position: absolute; top: -40px; right: -40px; width: 200px; height: 200px; background: rgba(255,255,255,0.05); border-radius: 50%; }
  .wallet-card::after { content: ''; position: absolute; bottom: -60px; left: -30px; width: 180px; height: 180px; background: rgba(255,255,255,0.04); border-radius: 50%; }

  .action-tile { background: var(--surface); border-radius: var(--radius); padding: 18px; border: 1px solid var(--border); display: flex; flex-direction: column; align-items: center; gap: 10px; cursor: pointer; transition: all var(--transition); box-shadow: var(--shadow-sm); }
  .action-tile:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--accent); }
  .action-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; }

  .stat-card { background: var(--surface); border-radius: var(--radius); padding: 18px; border: 1px solid var(--border); }
  .stat-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text3); margin-bottom: 6px; }
  .stat-value { font-family: var(--font-display); font-size: 22px; font-weight: 700; color: var(--text); }

  .plan-card { background: var(--surface); border-radius: var(--radius); border: 1.5px solid var(--border); padding: 18px; transition: all var(--transition); cursor: pointer; }
  .plan-card:hover { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); transform: translateY(-2px); }

  .tx-item { display: flex; align-items: center; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--border); }
  .tx-item:last-child { border-bottom: none; }
  .tx-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
  .tx-info { flex: 1; min-width: 0; }
  .tx-name { font-size: 14px; font-weight: 500; color: var(--text); }
  .tx-date { font-size: 11px; color: var(--text3); margin-top: 2px; }
  .tx-amount { font-size: 14px; font-weight: 600; text-align: right; }

  .divider { height: 1px; background: var(--border); margin: 16px 0; }

  .seg-control { background: var(--surface2); border-radius: var(--radius-sm); padding: 3px; display: flex; gap: 2px; }
  .seg-btn { flex: 1; padding: 7px 10px; border-radius: 8px; font-size: 12px; font-weight: 500; border: none; background: transparent; cursor: pointer; color: var(--text2); transition: all var(--transition); }
  .seg-btn.active { background: var(--surface); color: var(--text); box-shadow: var(--shadow-sm); }

  .progress-bar { height: 5px; background: var(--surface2); border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent), #6366f1); border-radius: 3px; transition: width 0.5s ease; }

  .page-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: var(--surface); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 50; backdrop-filter: blur(12px); }
  .header-greeting { font-size: 13px; color: var(--text2); }
  .header-name { font-family: var(--font-display); font-size: 16px; font-weight: 700; color: var(--text); }

  .avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), #6366f1); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 14px; flex-shrink: 0; }

  .empty-state { text-align: center; padding: 48px 24px; color: var(--text2); }
  .empty-icon { font-size: 40px; margin-bottom: 12px; opacity: 0.5; }

  .page-content { padding: 16px 20px; padding-bottom: 90px; }
  .section-title { font-family: var(--font-display); font-size: 14px; font-weight: 700; color: var(--text2); letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 12px; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }

  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: var(--surface2); color: var(--text2); border: 1px solid var(--border); }

  .ref-card { background: linear-gradient(135deg, #7c3aed, #4f46e5); border-radius: var(--radius-lg); padding: 24px; color: #fff; position: relative; overflow: hidden; }

  .inv-card { background: var(--surface); border-radius: var(--radius); border: 1px solid var(--border); padding: 18px; transition: all var(--transition); }

  .admin-app { background: var(--bg); min-height: 100vh; }
  .admin-sidebar { background: var(--surface); border-right: 1px solid var(--border); height: 100vh; position: fixed; width: 220px; top: 0; left: 0; padding: 24px 16px; display: flex; flex-direction: column; gap: 4px; }
  .admin-content { margin-left: 220px; padding: 28px; }
  .admin-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; cursor: pointer; color: var(--text2); transition: all var(--transition); border: none; background: transparent; width: 100%; text-align: left; }
  .admin-nav-item:hover { background: var(--surface2); color: var(--text); }
  .admin-nav-item.active { background: var(--accent-glow); color: var(--accent); font-weight: 600; }
  @media(max-width:768px){ .admin-sidebar{ display:none; } .admin-content{ margin-left:0; padding:16px; } }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes toastIn { from { transform: translateY(20px) scale(0.9); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// ============================================================================
// CONSTANTS
// ============================================================================
const INVESTMENT_PLANS = {
  basic_plan: { plan_id: "basic_plan", plan_name: "Basic", details: { daily_return_rate: 6.52, capital_range_min: 45, capital_range_max: 265, profit_interval_hours: 24, duration_days: 120, capital_withdrawal: true, color: "#4299e1", gradient: "linear-gradient(135deg,#4299e1,#3182ce)", icon: "🏁" } },
  silver_plan: { plan_id: "silver_plan", plan_name: "Silver", details: { daily_return_rate: 8.15, capital_range_min: 310, capital_range_max: 613, profit_interval_hours: 20, duration_days: 240, capital_withdrawal: true, color: "#718096", gradient: "linear-gradient(135deg,#a0aec0,#718096)", icon: "🥈" } },
  gold_plan: { plan_id: "gold_plan", plan_name: "Gold", details: { daily_return_rate: 10.19, capital_range_min: 656, capital_range_max: 1040, profit_interval_hours: 16, duration_days: 360, capital_withdrawal: true, color: "#c7922a", gradient: "linear-gradient(135deg,#f6ad55,#c7922a)", icon: "🥇" } },
  diamond_plan: { plan_id: "diamond_plan", plan_name: "Diamond", details: { daily_return_rate: 12.74, capital_range_min: 1048, capital_range_max: 1743, profit_interval_hours: 12, duration_days: 480, capital_withdrawal: true, color: "#4fd1c5", gradient: "linear-gradient(135deg,#81e6d9,#2c7a7b)", icon: "💎" } },
  platinum_plan: { plan_id: "platinum_plan", plan_name: "Platinum", details: { daily_return_rate: 15.93, capital_range_min: 2178, capital_range_max: 4265, profit_interval_hours: 8, duration_days: 600, capital_withdrawal: true, color: "#ed8936", gradient: "linear-gradient(135deg,#fbd38d,#c05621)", icon: "🏆" } },
  ultimate_plan: { plan_id: "ultimate_plan", plan_name: "Ultimate", details: { daily_return_rate: 19.91, capital_range_min: 4352, capital_range_max: 951515, profit_interval_hours: 4, duration_days: 720, capital_withdrawal: true, color: "#805ad5", gradient: "linear-gradient(135deg,#b794f4,#553c9a)", icon: "👑" } },
};

// ============================================================================
// HELPERS
// ============================================================================
const fmt = (n) => `$${(+n || 0).toFixed(2)}`;
const fmtDate = (d) => d ? new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
const fmtDateShort = (d) => d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
const initials = (name) => name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';

// ============================================================================
// STYLE INJECTOR
// ============================================================================
function StyleInjector() {
  useEffect(() => {
    const id = 'cl-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => { document.getElementById(id)?.remove(); };
  }, []);
  return null;
}

// ============================================================================
// ICONS
// ============================================================================
const Icon = ({ name, size = 20, color = 'currentColor' }) => {
  const s = { width: size, height: size, display: 'inline-block', flexShrink: 0 };
  const icons = {
    home: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    trending: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    chart: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    history: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    link: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    sun: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    moon: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    check: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    x: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    copy: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    logout: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    shield: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    eye: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    eyeoff: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
    settings: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    users: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    deposit: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
    withdraw: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
    broadcast: <svg style={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  };
  return icons[name] || null;
};

// ============================================================================
// TOAST
// ============================================================================
function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' && <Icon name="check" size={14} />}
          {t.type === 'error' && <Icon name="x" size={14} />}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MODAL
// ============================================================================
function Modal({ title, onClose, children }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 className="modal-title" style={{ marginBottom: 0 }}>{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// INPUT
// ============================================================================
function InputField({ label, type = 'text', placeholder, value, onChange, required, suffix, options }) {
  const [showPass, setShowPass] = useState(false);
  const isPass = type === 'password';
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {options ? (
          <select className="input-field select-field" value={value} onChange={(e) => onChange(e.target.value)}>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <input
            className="input-field"
            type={isPass ? (showPass ? 'text' : 'password') : type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            style={{ paddingRight: (isPass || suffix) ? 44 : undefined }}
          />
        )}
        {isPass && (
          <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 0, display: 'flex' }}>
            <Icon name={showPass ? 'eyeoff' : 'eye'} size={16} />
          </button>
        )}
        {suffix && !isPass && <span style={{ position: 'absolute', right: 12, fontSize: 12, color: 'var(--text3)' }}>{suffix}</span>}
      </div>
    </div>
  );
}

// ============================================================================
// LOADING
// ============================================================================
function LoadingScreen() {
  return (
    <div className="cl-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner spinner-dark" style={{ width: 40, height: 40, borderWidth: 3 }} />
        <p style={{ marginTop: 16, color: 'var(--text2)' }}>Loading CryptoLegacy...</p>
      </div>
    </div>
  );
}

// ============================================================================
// AUTH SCREEN
// ============================================================================
function AuthScreen({ darkMode, setDarkMode }) {
  const { login, register, verifyOTP, resendOTP } = useAuth();
  const [mode, setMode] = useState('login');
  const [step, setStep] = useState('form');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const showToast = (message, type = 'info') => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(phone, pin);
        showToast('Welcome back!', 'success');
      } else {
        if (step === 'form') {
          await register({ email, phone, first_name: firstName, password, pin, referral_code: referralCode || undefined });
          setStep('otp');
          showToast('Verification code sent to your email', 'success');
        } else {
          await verifyOTP(email, otp);
          showToast('Email verified! You can now sign in.', 'success');
          setMode('login');
          setStep('form');
          setOtp('');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'An error occurred';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await resendOTP(email);
      showToast('New code sent!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to resend', 'error');
    }
  };

  return (
    <div className={`cl-app ${darkMode ? 'dark-mode' : ''}`} style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: 20, background: darkMode ? 'var(--bg)' : 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 50%, #dbeafe 100%)' }}>
      <button onClick={() => setDarkMode(!darkMode)} style={{ position: 'fixed', top: 16, right: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)', boxShadow: 'var(--shadow-sm)' }}>
        <Icon name={darkMode ? 'sun' : 'moon'} size={14} />
      </button>

      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg,#1a56db,#6366f1)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>₿</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>CryptoLegacy</h1>
          <p style={{ fontSize: 14, color: 'var(--text2)' }}>Premium crypto investment platform</p>
        </div>

        <div className="card card-lg" style={{ boxShadow: 'var(--shadow-lg)' }}>
          {mode === 'login' ? (
            <form onSubmit={handleSubmit}>
              <h3 style={{ marginBottom: 20, fontFamily: 'var(--font-display)' }}>Sign In</h3>
              <InputField label="Phone Number" placeholder="+1 234 567 8900" value={phone} onChange={setPhone} required />
              <InputField label="PIN" type="password" placeholder="Enter your PIN" value={pin} onChange={setPin} required />
              {error && <p style={{ color: 'var(--red)', fontSize: 12, marginBottom: 12 }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg">
                {loading ? <><span className="spinner" /> Signing In…</> : 'Sign In'}
              </button>
              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
                Don't have an account?{' '}
                <button type="button" onClick={() => { setMode('register'); setStep('form'); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>Create one</button>
              </p>
            </form>
          ) : step === 'form' ? (
            <form onSubmit={handleSubmit}>
              <h3 style={{ marginBottom: 20, fontFamily: 'var(--font-display)' }}>Create Account</h3>
              <InputField label="Email" type="email" placeholder="your@email.com" value={email} onChange={setEmail} required />
              <InputField label="Phone Number" placeholder="+1 234 567 8900" value={phone} onChange={setPhone} required />
              <InputField label="First Name" placeholder="Your first name" value={firstName} onChange={setFirstName} required />
              <InputField label="Password" type="password" placeholder="Minimum 6 characters" value={password} onChange={setPassword} required />
              <InputField label="PIN (4-6 digits)" type="password" placeholder="Secure PIN" value={pin} onChange={setPin} required />
              <InputField label="Referral Code" placeholder="Optional" value={referralCode} onChange={setReferralCode} />
              {error && <p style={{ color: 'var(--red)', fontSize: 12, marginBottom: 12 }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg">
                {loading ? <><span className="spinner" /> Creating…</> : 'Register'}
              </button>
              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
                Already have an account?{' '}
                <button type="button" onClick={() => { setMode('login'); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>Sign In</button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <h3 style={{ marginBottom: 20, fontFamily: 'var(--font-display)' }}>Verify Email</h3>
              <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>We've sent a 6-digit code to <strong>{email}</strong></p>
              <InputField label="Verification Code" placeholder="000000" value={otp} onChange={setOtp} required />
              {error && <p style={{ color: 'var(--red)', fontSize: 12, marginBottom: 12 }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg">
                {loading ? <><span className="spinner" /> Verifying…</> : 'Verify & Activate'}
              </button>
              <button type="button" onClick={handleResendOTP} className="btn btn-ghost btn-full" style={{ marginTop: 8 }}>Resend Code</button>
              <button type="button" onClick={() => setStep('form')} className="btn btn-ghost btn-full">Back to Registration</button>
            </form>
          )}
        </div>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text3)' }}>
          By continuing you agree to our Terms of Service
        </p>
      </div>
      <ToastContainer toasts={toasts} />
    </div>
  );
}

// ============================================================================
// DEPOSIT MODAL
// ============================================================================
function DepositModal({ onClose, onSubmit }) {
  const [method, setMethod] = useState('mpesa');
  const [amount, setAmount] = useState('');
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [instructions, setInstructions] = useState(null);
  const rate = 129;

  useEffect(() => {
    API.get('/deposits/instructions').then(res => setInstructions(res.data)).catch(() => {});
  }, []);

  const kesAmount = amount ? (amount * rate).toFixed(2) : '0.00';

  const handleSubmit = async () => {
    if (!amount || !code) return;
    if (method === 'mpesa' && !phone) return;
    setLoading(true);
    await onSubmit(parseFloat(amount), method, code, phone);
    setLoading(false);
  };

  return (
    <Modal title="Make a Deposit" onClose={onClose}>
      <InputField label="Payment Method" value={method} onChange={setMethod} options={[{ value: 'mpesa', label: 'M-Pesa' }, { value: 'crypto', label: 'Crypto (USDT TRC20)' }]} />
      <InputField label="Amount (USD)" type="number" placeholder="Min $5" value={amount} onChange={setAmount} suffix="USD" />
      {method === 'mpesa' && (
        <>
          <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, marginBottom: 4 }}><strong>Paybill:</strong> {instructions?.mpesa?.paybill || '247247'}</p>
            <p style={{ fontSize: 13, marginBottom: 4 }}><strong>Account:</strong> {instructions?.mpesa?.account || '00206996476150'}</p>
            <p style={{ fontSize: 13 }}><strong>Amount:</strong> KES {kesAmount}</p>
          </div>
          <InputField label="M-Pesa Phone Number" placeholder="2547XXXXXXXX" value={phone} onChange={setPhone} required />
        </>
      )}
      {method === 'crypto' && (
        <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
          <p style={{ fontSize: 13, marginBottom: 4 }}>Send USDT (TRC20) to:</p>
          <code style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', wordBreak: 'break-all' }}>{instructions?.crypto?.usdt || 'T ijdfvhjj'}</code>
        </div>
      )}
      <InputField label={method === 'mpesa' ? 'M-Pesa Transaction Code' : 'Transaction Hash'} placeholder={method === 'mpesa' ? 'e.g. QK7E3ABCDE' : '0x...'} value={code} onChange={setCode} required />
      <button disabled={loading || !amount || !code || (method === 'mpesa' && !phone)} onClick={handleSubmit} className="btn btn-primary btn-full btn-lg">
        {loading ? <><span className="spinner" /> Processing…</> : 'Submit Deposit Request'}
      </button>
    </Modal>
  );
}

// ============================================================================
// WITHDRAW MODAL
// ============================================================================
function WithdrawModal({ onClose, onSubmit, wallet }) {
  const [method, setMethod] = useState('mpesa');
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const fee = amount ? (parseFloat(amount) * 0.01).toFixed(2) : '0.00';
  const net = amount ? (parseFloat(amount) * 0.99).toFixed(2) : '0.00';

  const handleSubmit = async () => {
    if (!amount || !details) return;
    if (parseFloat(amount) > (wallet?.available_balance || 0)) return;
    setLoading(true);
    await onSubmit(parseFloat(amount), method, details);
    setLoading(false);
  };

  return (
    <Modal title="Request Withdrawal" onClose={onClose}>
      <InputField label="Amount (USD)" type="number" placeholder="Min $10" value={amount} onChange={setAmount} suffix="USD" />
      <InputField label="Withdrawal Method" value={method} onChange={setMethod} options={[{ value: 'mpesa', label: 'M-Pesa' }, { value: 'bank', label: 'Bank Transfer' }, { value: 'crypto', label: 'Cryptocurrency' }]} />
      <InputField label={method === 'mpesa' ? 'Phone Number' : method === 'crypto' ? 'Wallet Address' : 'Bank Details'} placeholder={method === 'mpesa' ? '+254 7XX XXX XXX' : method === 'crypto' ? 'Your wallet address' : 'Bank details...'} value={details} onChange={setDetails} />
      {amount && parseFloat(amount) > 0 && (
        <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Amount</span><span>{fmt(parseFloat(amount))}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Fee (1%)</span><span style={{ color: 'var(--red)' }}>-${fee}</span></div>
          <div className="divider" style={{ margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 600 }}>You receive</span><span style={{ fontWeight: 700, color: 'var(--green)' }}>${net}</span></div>
        </div>
      )}
      <button disabled={loading || !amount || !details || parseFloat(amount) > (wallet?.available_balance || 0)} onClick={handleSubmit} className="btn btn-primary btn-full btn-lg">
        {loading ? <><span className="spinner" /> Processing…</> : 'Request Withdrawal'}
      </button>
      {amount && parseFloat(amount) > (wallet?.available_balance || 0) && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 8 }}>Insufficient balance</p>}
    </Modal>
  );
}

// ============================================================================
// INVEST MODAL
// ============================================================================
function InvestModal({ planId, onClose, onSubmit }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const plan = INVESTMENT_PLANS[planId];
  if (!plan) return null;
  const d = plan.details;
  const projectedDaily = amount ? (parseFloat(amount) * d.daily_return_rate / 100).toFixed(2) : '0.00';
  const projectedTotal = amount ? (parseFloat(amount) * d.daily_return_rate / 100 * d.duration_days).toFixed(2) : '0.00';

  const handleSubmit = async () => {
    if (!amount) return;
    setLoading(true);
    await onSubmit(planId, parseFloat(amount));
    setLoading(false);
  };

  return (
    <Modal title={`Invest in ${plan.plan_name}`} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, background: 'var(--surface2)', borderRadius: 14, padding: '14px' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: d.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{d.icon}</div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 16 }}>{plan.plan_name} Plan</p>
          <p style={{ fontSize: 12, color: 'var(--text2)' }}>{d.daily_return_rate}% daily • {d.duration_days} days</p>
        </div>
      </div>
      <InputField label="Investment Amount" type="number" placeholder={`$${d.capital_range_min} – $${d.capital_range_max}`} value={amount} onChange={setAmount} suffix="USD" />
      {amount && parseFloat(amount) > 0 && (
        <div style={{ background: 'var(--green-bg)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', marginBottom: 8 }}>Projected Returns</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Daily profit</span><span style={{ color: 'var(--green)' }}>+${projectedDaily}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total over {d.duration_days}d</span><span style={{ fontWeight: 700, color: 'var(--green)' }}>+${projectedTotal}</span></div>
        </div>
      )}
      <button disabled={loading || !amount} onClick={handleSubmit} className="btn btn-full btn-lg" style={{ background: d.gradient, color: '#fff', fontWeight: 600 }}>
        {loading ? <><span className="spinner" /> Investing…</> : `Invest ${amount ? fmt(parseFloat(amount)) : ''}`}
      </button>
    </Modal>
  );
}

// ============================================================================
// HOME TAB
// ============================================================================
function HomeTab({ wallet, pendingDeposits, pendingWithdrawals, onDeposit, onWithdraw, onInvest, onPortfolio }) {
  const [balVisible, setBalVisible] = useState(true);
  return (
    <div>
      <div className="wallet-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 500 }}>Available Balance</span>
          <button onClick={() => setBalVisible(!balVisible)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
            <Icon name={balVisible ? 'eye' : 'eyeoff'} size={14} color="#fff" />
          </button>
        </div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 800, marginBottom: 4 }}>
          {balVisible ? fmt(wallet?.available_balance || 0) : '••••••'}
        </p>
        <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 20 }}>USDT • TRC20</p>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div><p style={{ fontSize: 11, opacity: 0.6 }}>Invested</p><p style={{ fontWeight: 600, fontSize: 14 }}>{balVisible ? fmt(wallet?.active_investments || 0) : '••••'}</p></div>
          <div><p style={{ fontSize: 11, opacity: 0.6 }}>Total Profit</p><p style={{ fontWeight: 600, fontSize: 14, color: '#6ee7b7' }}>{balVisible ? fmt(wallet?.total_profit || 0) : '••••'}</p></div>
          <div><p style={{ fontSize: 11, opacity: 0.6 }}>Deposited</p><p style={{ fontWeight: 600, fontSize: 14 }}>{balVisible ? fmt(wallet?.total_deposited || 0) : '••••'}</p></div>
        </div>
      </div>

      <p className="section-title">Quick Actions</p>
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[{ icon: '➕', label: 'Deposit', color: '#dbeafe', action: onDeposit },
          { icon:'📲', label: 'Withdraw', color: '#dcfce7', action: onWithdraw },
          { icon: '🔐', label: 'Invest', color: '#fef3c7', action: onInvest },
          { icon: '🪙', label: 'Portfolio', color: '#fce7f3', action: onPortfolio }].map(a => (
          <div key={a.label} className="action-tile" onClick={a.action}>
            <div className="action-icon" style={{ background: a.color, fontSize: 20 }}>{a.icon}</div>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)' }}>{a.label}</span>
          </div>
        ))}
      </div>

      {(pendingDeposits.length > 0 || pendingWithdrawals.length > 0) && (
        <div style={{ marginBottom: 20 }}>
          {pendingDeposits.length > 0 && (
            <div style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold)', borderRadius: 12, padding: '12px 16px', marginBottom: 8 }}>
              <span>⏳ {pendingDeposits.length} deposit pending approval</span>
            </div>
          )}
          {pendingWithdrawals.length > 0 && (
            <div style={{ background: 'var(--accent-glow)', border: '1px solid rgba(26,86,219,0.2)', borderRadius: 12, padding: '12px 16px' }}>
              <span>🔄 {pendingWithdrawals.length} withdrawal processing</span>
            </div>
          )}
        </div>
      )}

      <p className="section-title">Platform Plans</p>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {Object.values(INVESTMENT_PLANS).slice(0, 4).map(p => (
          <div key={p.plan_id} style={{ background: 'var(--surface)', borderRadius: 14, padding: '14px 16px', border: '1px solid var(--border)', flexShrink: 0, minWidth: 110 }}>
            <p style={{ fontSize: 18 }}>{p.details.icon}</p>
            <p style={{ fontSize: 12, fontWeight: 700 }}>{p.plan_name}</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--green)' }}>{p.details.daily_return_rate}%</p>
            <p style={{ fontSize: 10, color: 'var(--text3)' }}>daily</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// INVEST TAB
// ============================================================================
function InvestTab({ onInvest }) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Investment Plans</h2>
      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>Choose a plan that matches your goals</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {Object.values(INVESTMENT_PLANS).map(plan => {
          const d = plan.details;
          return (
            <div key={plan.plan_id} className="plan-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: d.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{d.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>{plan.plan_name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text3)' }}>{d.duration_days} days • Every {d.profit_interval_hours}h</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>{d.daily_return_rate}%</p>
                  <p style={{ fontSize: 10, color: 'var(--text3)' }}>daily</p>
                </div>
              </div>
              <button onClick={() => onInvest(plan.plan_id)} className="btn btn-primary btn-full" style={{ background: d.gradient }}>
                Invest Now
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// PORTFOLIO TAB
// ============================================================================
function PortfolioTab({ investments }) {
  const active = investments.filter(i => i.status === 'active');
  if (investments.length === 0) return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>My Portfolio</h2>
      <div className="empty-state"><div className="empty-icon">💼</div><p>No investments yet.</p></div>
    </div>
  );
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 16 }}>My Portfolio</h2>
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="stat-card"><p className="stat-label">Active</p><p className="stat-value">{active.length}</p></div>
        <div className="stat-card"><p className="stat-label">Earned</p><p className="stat-value" style={{ color: 'var(--green)' }}>{fmt(investments.reduce((s, i) => s + (i.total_paid || 0), 0))}</p></div>
      </div>
      {active.map(inv => {
        const plan = INVESTMENT_PLANS[inv.plan_id];
        const progress = Math.min(100, ((new Date() - new Date(inv.start_date)) / (new Date(inv.end_date) - new Date(inv.start_date))) * 100);
        return (
          <div key={inv.id} className="inv-card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>{inv.plan_name}</span>
              <span className="badge badge-green">Active</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Capital: {fmt(inv.amount)}</span>
              <span>Earned: <span style={{ color: 'var(--green)' }}>{fmt(inv.total_paid)}</span></span>
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: plan?.details.gradient }} /></div>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Next payout: {fmtDate(inv.next_payout)}</p>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// REFERRALS TAB
// ============================================================================
function ReferralsTab({ user, referrals, showToast }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}?ref=${user?.referral_code}`;
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); showToast('Link copied!', 'success'); setTimeout(() => setCopied(false), 2000); } catch { showToast('Copy failed', 'error'); }
  };
  return (
    <div>
      <div className="ref-card" style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, opacity: 0.7 }}>Referral Code</p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800 }}>{user?.referral_code}</p>
        <p style={{ fontSize: 12, opacity: 0.6 }}>{referrals.length} referrals</p>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <code style={{ flex: 1, padding: 10, background: 'var(--surface2)', borderRadius: 8 }}>{link}</code>
          <button onClick={handleCopy} className="btn btn-primary">{copied ? 'Copied!' : 'Copy'}</button>
        </div>
      </div>
      {referrals.length > 0 && (
        <>
          <p className="section-title">Your Referrals</p>
          {referrals.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="avatar">{initials(r.first_name)}</div>
              <div style={{ flex: 1 }}><p>{r.first_name}</p><p style={{ fontSize: 11, color: 'var(--text3)' }}>Joined {fmtDateShort(r.created_at)}</p></div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ============================================================================
// HISTORY TAB
// ============================================================================
function HistoryTab({ transactions, pendingDeposits, pendingWithdrawals }) {
  const all = [...transactions, ...pendingDeposits.map(d => ({ ...d, type: 'deposit', status: 'pending' })), ...pendingWithdrawals.map(w => ({ ...w, type: 'withdrawal', status: 'pending' }))].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  if (all.length === 0) return <div className="empty-state"><div className="empty-icon">📋</div><p>No transactions yet.</p></div>;
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 16 }}>History</h2>
      <div className="card" style={{ padding: '0 16px' }}>
        {all.map((tx, i) => (
          <div key={i} className="tx-item">
            <div className="tx-icon" style={{ background: tx.type === 'deposit' || tx.type === 'profit_payout' ? 'var(--green-bg)' : 'var(--surface2)' }}>{tx.type === 'deposit' ? '📥' : tx.type === 'withdrawal' ? '📤' : tx.type === 'investment' ? '📈' : '💰'}</div>
            <div className="tx-info">
              <p className="tx-name">{tx.type?.replace(/_/g, ' ')}</p>
              <p className="tx-date">{fmtDate(tx.created_at)}</p>
              {tx.status === 'pending' && <span className="badge badge-gold">Pending</span>}
            </div>
            <div className="tx-amount" style={{ color: tx.type === 'withdrawal' || tx.type === 'investment' ? 'var(--text)' : 'var(--green)' }}>
              {tx.type === 'withdrawal' || tx.type === 'investment' ? '-' : '+'}{fmt(tx.amount_usd || tx.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// KYC TAB
// ============================================================================
function KYCTab({ showToast }) {
  const [submission, setSubmission] = useState(null);
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [idImage, setIdImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    API.get('/kyc').then(res => setSubmission(res.data)).catch(() => {}).finally(() => setLoadingData(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('full_name', fullName);
    formData.append('id_number', idNumber);
    formData.append('id_image', idImage);
    formData.append('selfie_image', selfieImage);
    setLoading(true);
    try {
      await API.post('/kyc', formData);
      showToast('KYC submitted', 'success');
      const res = await API.get('/kyc');
      setSubmission(res.data);
    } catch (err) {
      showToast('Submission failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) return <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner spinner-dark" /></div>;
  if (submission) {
    return (
      <div className="card">
        <h3>KYC Status: {submission.status}</h3>
        {submission.status === 'rejected' && <p style={{ color: 'var(--red)' }}>Reason: {submission.rejection_reason}</p>}
        <p style={{ fontSize: 13, marginTop: 12 }}>Submitted: {fmtDate(submission.created_at)}</p>
      </div>
    );
  }
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 16 }}>KYC Verification</h2>
      <form onSubmit={handleSubmit}>
        <InputField label="Full Legal Name" value={fullName} onChange={setFullName} required />
        <InputField label="ID / Passport Number" value={idNumber} onChange={setIdNumber} required />
        <div className="input-group"><label className="input-label">ID Document</label><input type="file" accept="image/*" onChange={e => setIdImage(e.target.files[0])} required /></div>
        <div className="input-group"><label className="input-label">Selfie with ID</label><input type="file" accept="image/*" onChange={e => setSelfieImage(e.target.files[0])} required /></div>
        <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg">{loading ? 'Submitting...' : 'Submit KYC'}</button>
      </form>
    </div>
  );
}

// ============================================================================
// SETTINGS TAB
// ============================================================================
function SettingsTab({ showToast, fetchUser }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [cryptoWallet, setCryptoWallet] = useState('');
  const [loadingPass, setLoadingPass] = useState(false);
  const [loadingPay, setLoadingPay] = useState(false);

  useEffect(() => {
    API.get('/settings/payment-methods').then(res => {
      setMpesaPhone(res.data.mpesa_phone || '');
      setCryptoWallet(res.data.crypto_wallet_address || '');
    }).catch(() => {});
  }, []);

  const updatePassword = async () => {
    setLoadingPass(true);
    try {
      await API.put('/settings/password', { oldPassword, newPassword });
      showToast('Password updated', 'success');
      setOldPassword(''); setNewPassword('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed', 'error');
    } finally {
      setLoadingPass(false);
    }
  };

  const updatePaymentMethods = async () => {
    setLoadingPay(true);
    try {
      await API.put('/settings/payment-methods', { mpesa_phone: mpesaPhone, crypto_wallet_address: cryptoWallet });
      showToast('Payment methods updated', 'success');
      fetchUser();
    } catch (err) {
      showToast('Update failed', 'error');
    } finally {
      setLoadingPay(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Settings</h2>
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 16 }}>Change Password</h3>
        <InputField label="Current Password" type="password" value={oldPassword} onChange={setOldPassword} />
        <InputField label="New Password" type="password" value={newPassword} onChange={setNewPassword} />
        <button onClick={updatePassword} disabled={loadingPass} className="btn btn-primary btn-full">{loadingPass ? 'Updating...' : 'Update Password'}</button>
      </div>
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Payment Methods</h3>
        <InputField label="M-Pesa Phone" value={mpesaPhone} onChange={setMpesaPhone} placeholder="2547XXXXXXXX" />
        <InputField label="Crypto Wallet (USDT TRC20)" value={cryptoWallet} onChange={setCryptoWallet} placeholder="T..." />
        <button onClick={updatePaymentMethods} disabled={loadingPay} className="btn btn-primary btn-full">{loadingPay ? 'Saving...' : 'Save'}</button>
      </div>
    </div>
  );
}

// ============================================================================
// USER DASHBOARD
// ============================================================================
function UserDashboard({ darkMode, setDarkMode, onLogout, showToast }) {
  const { user, wallet, updateWallet, fetchUser } = useAuth();
  const [tab, setTab] = useState('home');
  const [modal, setModal] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [invRes, txRes, refRes, depRes, wdRes] = await Promise.all([
        API.get('/investments'), API.get('/users/transactions'), API.get('/users/referrals'), API.get('/deposits/pending'), API.get('/withdrawals/pending')
      ]);
      setInvestments(invRes.data); setTransactions(txRes.data); setReferrals(refRes.data); setPendingDeposits(depRes.data); setPendingWithdrawals(wdRes.data);
    } catch (err) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoadingData(false);
    }
  }, [showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDeposit = async (amount, method, code, phone) => {
    try { await API.post('/deposits', { amount_usd: amount, method, transaction_code: code, phone_number: phone }); closeModal(); showToast('Deposit submitted', 'success'); fetchData(); fetchUser(); }
    catch (err) { showToast(err.response?.data?.message || 'Failed', 'error'); }
  };
  const handleWithdraw = async (amount, method, details) => {
    try { await API.post('/withdrawals', { amount_usd: amount, method, details }); closeModal(); showToast('Withdrawal submitted', 'success'); fetchData(); fetchUser(); }
    catch (err) { showToast(err.response?.data?.message || 'Failed', 'error'); }
  };
  const handleInvest = async (planId, amount) => {
    try { await API.post('/investments', { plan_id: planId, amount }); closeModal(); showToast('Investment created!', 'success'); fetchData(); fetchUser(); }
    catch (err) { showToast(err.response?.data?.message || 'Failed', 'error'); }
  };

  const closeModal = () => setModal(null);
  const tabs = [
    { id: 'home', label: 'Home', icon: 'home' }, { id: 'invest', label: 'Invest', icon: 'trending' }, { id: 'portfolio', label: 'Portfolio', icon: 'chart' },
    { id: 'referrals', label: 'Refer', icon: 'link' }, { id: 'history', label: 'History', icon: 'history' }, { id: 'kyc', label: 'KYC', icon: 'shield' }, { id: 'settings', label: 'Settings', icon: 'settings' }
  ];

  return (
    <div className={`cl-app ${darkMode ? 'dark-mode' : ''}`}>
      <header className="page-header">
        <div><p className="header-greeting">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},</p><p className="header-name">{user?.first_name} 👋</p></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setDarkMode(!darkMode)} className="btn btn-ghost btn-icon"><Icon name={darkMode ? 'sun' : 'moon'} size={16} /></button>
          <button onClick={onLogout} className="btn btn-ghost btn-icon"><Icon name="logout" size={16} /></button>
          <div className="avatar">{initials(user?.first_name)}</div>
        </div>
      </header>
      <div className="page-content fade-in">
        {loadingData ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner spinner-dark" /></div> : (
          <>
            {tab === 'home' && <HomeTab wallet={wallet} pendingDeposits={pendingDeposits} pendingWithdrawals={pendingWithdrawals} onDeposit={() => setModal('deposit')} onWithdraw={() => setModal('withdraw')} onInvest={() => setTab('invest')} onPortfolio={() => setTab('portfolio')} />}
            {tab === 'invest' && <InvestTab onInvest={(planId) => setModal({ type: 'invest', planId })} />}
            {tab === 'portfolio' && <PortfolioTab investments={investments} />}
            {tab === 'referrals' && <ReferralsTab user={user} referrals={referrals} showToast={showToast} />}
            {tab === 'history' && <HistoryTab transactions={transactions} pendingDeposits={pendingDeposits} pendingWithdrawals={pendingWithdrawals} />}
            {tab === 'kyc' && <KYCTab showToast={showToast} />}
            {tab === 'settings' && <SettingsTab showToast={showToast} fetchUser={fetchUser} />}
          </>
        )}
      </div>
      <nav className="bottom-nav">{tabs.map(t => <button key={t.id} className={`nav-item ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}><Icon name={t.icon} size={22} /><span>{t.label}</span></button>)}</nav>
      {modal === 'deposit' && <DepositModal onClose={closeModal} onSubmit={handleDeposit} />}
      {modal === 'withdraw' && <WithdrawModal onClose={closeModal} onSubmit={handleWithdraw} wallet={wallet} />}
      {modal?.type === 'invest' && <InvestModal planId={modal.planId} onClose={closeModal} onSubmit={handleInvest} />}
    </div>
  );
}

// ============================================================================
// ADMIN DASHBOARD (Simplified - full version available on request)
// ============================================================================
// ============================================================================
// ADMIN DASHBOARD — Premium Fintech Redesign
// Design: Refined dark-base with luminous emerald accent (Stripe/Revolut-grade)
// Font: DM Mono display headers + DM Sans body for banking precision
// ============================================================================
// ─── Google Fonts Injector ────────────────────────────────────────────────────
const FontLink = () => {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);
  return null;
};

// ─── Design Tokens ────────────────────────────────────────────────────────────
const STYLES = `
  :root {
    --bg: #0a0c10;
    --bg2: #0f1117;
    --surface: #141720;
    --surface2: #1a1e2a;
    --surface3: #1f2535;
    --border: rgba(255,255,255,0.07);
    --border-strong: rgba(255,255,255,0.13);
    --text: #f0f2f8;
    --text2: #8892aa;
    --text3: #525d75;
    --accent: #00d4a0;
    --accent-dim: rgba(0,212,160,0.12);
    --accent-glow: rgba(0,212,160,0.25);
    --blue: #3b7bfa;
    --blue-dim: rgba(59,123,250,0.12);
    --red: #ff4d6a;
    --red-dim: rgba(255,77,106,0.12);
    --amber: #f5a623;
    --amber-dim: rgba(245,166,35,0.12);
    --purple: #a78bfa;
    --purple-dim: rgba(167,139,250,0.12);
    --green: #00d4a0;
    --green-dim: rgba(0,212,160,0.12);
    --font-display: 'DM Mono', monospace;
    --font-body: 'DM Sans', sans-serif;
    --sidebar-w: 240px;
    --sidebar-w-collapsed: 64px;
    --header-h: 64px;
    --radius: 12px;
    --radius-lg: 16px;
    --radius-xl: 20px;
    --shadow: 0 4px 24px rgba(0,0,0,0.4);
    --shadow-lg: 0 8px 40px rgba(0,0,0,0.6);
    --shadow-accent: 0 0 30px rgba(0,212,160,0.15);
  }

  .adm-root *, .adm-root *::before, .adm-root *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .adm-root {
    font-family: var(--font-body);
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    display: flex;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Sidebar ── */
  .adm-sidebar {
    position: fixed;
    top: 0; left: 0; bottom: 0;
    width: var(--sidebar-w);
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    z-index: 100;
    transition: width 0.25s cubic-bezier(.4,0,.2,1);
    overflow: hidden;
  }
  .adm-sidebar.collapsed { width: var(--sidebar-w-collapsed); }

  .adm-logo {
    padding: 20px 18px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid var(--border);
    min-height: 64px;
    flex-shrink: 0;
  }
  .adm-logo-icon {
    width: 32px; height: 32px;
    background: linear-gradient(135deg, var(--accent), #00a07c);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 16px rgba(0,212,160,0.3);
  }
  .adm-logo-text {
    display: flex; flex-direction: column;
    white-space: nowrap;
    overflow: hidden;
    transition: opacity 0.2s;
  }
  .adm-logo-title {
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
    letter-spacing: 0.5px;
  }
  .adm-logo-badge {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--accent);
    margin-top: 1px;
  }

  .adm-nav {
    flex: 1;
    padding: 10px 8px;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
  }
  .adm-nav::-webkit-scrollbar { display: none; }

  .adm-nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    border-radius: var(--radius);
    cursor: pointer;
    border: none;
    background: transparent;
    color: var(--text2);
    width: 100%;
    font-family: var(--font-body);
    font-size: 13.5px;
    font-weight: 500;
    transition: all 0.15s;
    white-space: nowrap;
    position: relative;
    text-align: left;
  }
  .adm-nav-item:hover { background: var(--surface2); color: var(--text); }
  .adm-nav-item.active {
    background: var(--accent-dim);
    color: var(--accent);
  }
  .adm-nav-item.active::before {
    content: '';
    position: absolute;
    left: 0; top: 20%; bottom: 20%;
    width: 3px;
    background: var(--accent);
    border-radius: 0 3px 3px 0;
    box-shadow: 0 0 8px var(--accent);
  }

  .adm-nav-icon { flex-shrink: 0; width: 18px; height: 18px; }
  .adm-nav-label { flex: 1; transition: opacity 0.2s; }
  .adm-badge {
    background: var(--red);
    color: #fff;
    border-radius: 20px;
    padding: 2px 7px;
    font-size: 10px;
    font-weight: 700;
    flex-shrink: 0;
    transition: opacity 0.2s;
    line-height: 1.4;
  }

  .adm-sidebar-footer {
    padding: 8px 8px 16px;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }

  .adm-collapse-btn {
    position: absolute;
    top: 20px;
    right: -12px;
    width: 24px; height: 24px;
    background: var(--surface2);
    border: 1px solid var(--border-strong);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: var(--text2);
    z-index: 101;
    transition: all 0.15s;
  }
  .adm-collapse-btn:hover { color: var(--text); background: var(--surface3); }

  /* ── Main Layout ── */
  .adm-main {
    margin-left: var(--sidebar-w);
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    transition: margin-left 0.25s cubic-bezier(.4,0,.2,1);
  }
  .adm-main.collapsed { margin-left: var(--sidebar-w-collapsed); }

  /* ── Header ── */
  .adm-header {
    position: sticky;
    top: 0;
    height: var(--header-h);
    background: rgba(10,12,16,0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: 0 24px;
    gap: 16px;
    z-index: 50;
  }

  .adm-search {
    flex: 1;
    max-width: 320px;
    position: relative;
  }
  .adm-search input {
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 8px 12px 8px 36px;
    font-family: var(--font-body);
    font-size: 13px;
    color: var(--text);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .adm-search input::placeholder { color: var(--text3); }
  .adm-search input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim);
  }
  .adm-search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text3);
    pointer-events: none;
  }

  .adm-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  .adm-icon-btn {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: var(--surface2);
    border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: var(--text2);
    transition: all 0.15s;
    position: relative;
  }
  .adm-icon-btn:hover { background: var(--surface3); color: var(--text); }

  .adm-notification-dot {
    position: absolute;
    top: 6px; right: 6px;
    width: 7px; height: 7px;
    background: var(--red);
    border-radius: 50%;
    border: 1.5px solid var(--bg);
  }

  .adm-avatar-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 10px 4px 4px;
    border-radius: 10px;
    background: var(--surface2);
    border: 1px solid var(--border);
    cursor: pointer;
    transition: all 0.15s;
  }
  .adm-avatar-btn:hover { background: var(--surface3); }

  .adm-avatar {
    width: 28px; height: 28px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--accent), #00a07c);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: #0a1a14;
    letter-spacing: 0.5px;
    flex-shrink: 0;
    font-family: var(--font-display);
  }
  .adm-avatar-lg {
    width: 40px; height: 40px;
    border-radius: 10px;
    font-size: 14px;
  }
  .adm-avatar-xl {
    width: 48px; height: 48px;
    border-radius: 12px;
    font-size: 16px;
  }

  .adm-avatar-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
  }

  /* ── Content Area ── */
  .adm-content {
    flex: 1;
    padding: 28px 28px;
    max-width: 1400px;
    width: 100%;
  }

  /* ── Page Header ── */
  .adm-page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 28px;
    gap: 16px;
  }
  .adm-page-title {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 500;
    color: var(--text);
    letter-spacing: -0.3px;
  }
  .adm-page-sub {
    font-size: 13px;
    color: var(--text3);
    margin-top: 3px;
  }

  /* ── KPI Cards ── */
  .adm-kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 14px;
    margin-bottom: 28px;
  }

  .adm-kpi {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
    transition: all 0.2s;
    cursor: default;
    position: relative;
    overflow: hidden;
  }
  .adm-kpi::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--kpi-accent, var(--accent)), transparent);
    opacity: 0;
    transition: opacity 0.2s;
  }
  .adm-kpi:hover { border-color: var(--border-strong); transform: translateY(-1px); box-shadow: var(--shadow); }
  .adm-kpi:hover::before { opacity: 1; }

  .adm-kpi-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .adm-kpi-icon-wrap {
    width: 40px; height: 40px;
    border-radius: 10px;
    background: var(--kpi-bg, var(--accent-dim));
    display: flex; align-items: center; justify-content: center;
    color: var(--kpi-accent, var(--accent));
  }
  .adm-kpi-trend {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 7px;
    border-radius: 20px;
  }
  .adm-kpi-trend.up { background: var(--green-dim); color: var(--green); }
  .adm-kpi-trend.neutral { background: var(--surface2); color: var(--text3); }

  .adm-kpi-value {
    font-family: var(--font-display);
    font-size: 26px;
    font-weight: 500;
    color: var(--text);
    letter-spacing: -1px;
    line-height: 1.1;
    margin-bottom: 4px;
  }
  .adm-kpi-label {
    font-size: 12px;
    color: var(--text3);
    font-weight: 500;
  }
  .adm-kpi-sub {
    font-size: 11px;
    color: var(--text3);
    margin-top: 2px;
  }

  /* ── Cards ── */
  .adm-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
  }
  .adm-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }
  .adm-card-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: 0.1px;
  }
  .adm-card-action {
    font-size: 12px;
    color: var(--accent);
    background: none;
    border: none;
    cursor: pointer;
    font-family: var(--font-body);
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: opacity 0.15s;
  }
  .adm-card-action:hover { opacity: 0.75; }

  /* ── Table ── */
  .adm-table-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }
  .adm-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .adm-table th {
    background: var(--surface2);
    padding: 11px 16px;
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    color: var(--text3);
    letter-spacing: 0.8px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }
  .adm-table td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    color: var(--text2);
    vertical-align: middle;
  }
  .adm-table tr:last-child td { border-bottom: none; }
  .adm-table tbody tr { transition: background 0.1s; }
  .adm-table tbody tr:hover { background: var(--surface2); }

  /* ── Status Badges ── */
  .adm-status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 9px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.3px;
    white-space: nowrap;
  }
  .adm-status-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .adm-status.green { background: var(--green-dim); color: var(--green); }
  .adm-status.green .adm-status-dot { background: var(--green); }
  .adm-status.amber { background: var(--amber-dim); color: var(--amber); }
  .adm-status.amber .adm-status-dot { background: var(--amber); }
  .adm-status.red { background: var(--red-dim); color: var(--red); }
  .adm-status.red .adm-status-dot { background: var(--red); }
  .adm-status.blue { background: var(--blue-dim); color: var(--blue); }
  .adm-status.blue .adm-status-dot { background: var(--blue); }
  .adm-status.purple { background: var(--purple-dim); color: var(--purple); }
  .adm-status.purple .adm-status-dot { background: var(--purple); }
  .adm-status.gray { background: var(--surface2); color: var(--text3); }

  /* ── Buttons ── */
  .adm-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 9px 16px;
    border-radius: var(--radius);
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.15s;
    white-space: nowrap;
    text-decoration: none;
  }
  .adm-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .adm-btn-primary {
    background: var(--accent);
    color: #051a12;
  }
  .adm-btn-primary:hover:not(:disabled) {
    background: #00f0b8;
    box-shadow: var(--shadow-accent);
    transform: translateY(-1px);
  }

  .adm-btn-danger {
    background: var(--red-dim);
    color: var(--red);
    border: 1px solid rgba(255,77,106,0.2);
  }
  .adm-btn-danger:hover:not(:disabled) { background: rgba(255,77,106,0.2); }

  .adm-btn-success {
    background: var(--accent-dim);
    color: var(--accent);
    border: 1px solid rgba(0,212,160,0.2);
  }
  .adm-btn-success:hover:not(:disabled) { background: rgba(0,212,160,0.2); }

  .adm-btn-ghost {
    background: var(--surface2);
    color: var(--text2);
    border: 1px solid var(--border);
  }
  .adm-btn-ghost:hover:not(:disabled) { background: var(--surface3); color: var(--text); }

  .adm-btn-sm { padding: 6px 12px; font-size: 12px; border-radius: 8px; }
  .adm-btn-full { width: 100%; }
  .adm-btn-icon { padding: 8px; width: 34px; height: 34px; border-radius: 8px; }

  /* ── Inputs ── */
  .adm-input-group { margin-bottom: 16px; }
  .adm-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--text3);
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .adm-input {
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 10px 14px;
    font-family: var(--font-body);
    font-size: 14px;
    color: var(--text);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    resize: vertical;
  }
  .adm-input::placeholder { color: var(--text3); }
  .adm-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-dim);
  }

  /* ── User Card ── */
  .adm-user-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
    transition: border-color 0.15s;
    margin-bottom: 12px;
  }
  .adm-user-card:hover { border-color: var(--border-strong); }

  /* ── Action Card (Deposits/Withdrawals/KYC) ── */
  .adm-action-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px;
    margin-bottom: 14px;
    transition: border-color 0.15s;
  }

  /* ── Detail Row ── */
  .adm-detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 0;
    border-bottom: 1px solid var(--border);
  }
  .adm-detail-row:last-child { border-bottom: none; }
  .adm-detail-key { font-size: 12px; color: var(--text3); }
  .adm-detail-val { font-size: 13px; font-weight: 500; color: var(--text); }

  /* ── Progress Bar ── */
  .adm-progress-track {
    background: var(--surface2);
    border-radius: 99px;
    height: 5px;
    overflow: hidden;
  }
  .adm-progress-fill {
    height: 100%;
    border-radius: 99px;
    background: linear-gradient(90deg, var(--accent), #00a07c);
    transition: width 0.5s ease;
  }

  /* ── Detail Box ── */
  .adm-detail-box {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 14px;
    margin: 14px 0;
  }

  /* ── Pending Alert ── */
  .adm-alert {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 13px 16px;
    border-radius: var(--radius);
    border: 1px solid;
    gap: 12px;
    flex-wrap: wrap;
  }
  .adm-alert-left {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13.5px;
    font-weight: 500;
  }

  /* ── Transaction Row ── */
  .adm-tx-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
    transition: background 0.1s;
  }
  .adm-tx-row:last-child { border-bottom: none; }

  /* ── Info Box ── */
  .adm-info-box {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
    margin-top: 20px;
  }
  .adm-info-box-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text2);
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .adm-info-box li {
    font-size: 12px;
    color: var(--text3);
    list-style: disc;
    margin-left: 16px;
    margin-bottom: 5px;
    line-height: 1.6;
  }

  /* ── Empty State ── */
  .adm-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    gap: 12px;
  }
  .adm-empty-icon {
    width: 56px; height: 56px;
    border-radius: 16px;
    background: var(--surface2);
    border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    color: var(--text3);
    margin-bottom: 4px;
  }
  .adm-empty-title { font-size: 15px; font-weight: 600; color: var(--text2); }
  .adm-empty-sub { font-size: 13px; color: var(--text3); text-align: center; max-width: 280px; }

  /* ── Skeleton ── */
  .adm-skeleton {
    background: linear-gradient(90deg, var(--surface2) 25%, var(--surface3) 50%, var(--surface2) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8px;
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── Divider ── */
  .adm-divider { height: 1px; background: var(--border); margin: 20px 0; }

  /* ── Stat Mini Grid ── */
  .adm-mini-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    padding: 14px;
    background: var(--surface2);
    border-radius: var(--radius);
    margin: 14px 0;
  }
  .adm-mini-stat-label { font-size: 10px; color: var(--text3); font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 4px; }
  .adm-mini-stat-val { font-size: 14px; font-weight: 700; color: var(--text); font-family: var(--font-display); }

  /* ── Mono text ── */
  .adm-mono {
    font-family: var(--font-display);
    font-size: 12px;
    color: var(--accent);
    font-weight: 500;
    letter-spacing: 0.3px;
  }

  /* ── Mobile Tab Nav ── */
  .adm-mobile-tabs {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 14px;
    margin-bottom: 20px;
    scrollbar-width: none;
  }
  .adm-mobile-tabs::-webkit-scrollbar { display: none; }
  .adm-mobile-tab {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 20px;
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text2);
    font-family: var(--font-body);
    transition: all 0.15s;
    white-space: nowrap;
  }
  .adm-mobile-tab.active {
    background: var(--accent);
    color: #051a12;
    border-color: var(--accent);
    font-weight: 600;
  }
  .adm-mobile-tab-badge {
    background: var(--red);
    color: #fff;
    border-radius: 20px;
    padding: 1px 5px;
    font-size: 10px;
    font-weight: 700;
  }
  .adm-mobile-tab.active .adm-mobile-tab-badge {
    background: rgba(5,26,18,0.3);
    color: #051a12;
  }

  /* ── Section Title ── */
  .adm-section-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text3);
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .adm-section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  /* ── Animations ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .adm-fade-up {
    animation: fadeUp 0.25s ease both;
  }

  /* ── Reject Modal ── */
  .adm-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 500;
    padding: 20px;
  }
  .adm-modal {
    background: var(--surface);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-xl);
    padding: 24px;
    width: 100%;
    max-width: 440px;
    box-shadow: var(--shadow-lg);
    animation: fadeUp 0.2s ease both;
  }
  .adm-modal-title {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 5px;
    color: var(--text);
  }
  .adm-modal-sub {
    font-size: 13px;
    color: var(--text3);
    margin-bottom: 18px;
  }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .adm-sidebar { display: none; }
    .adm-main { margin-left: 0 !important; }
    .adm-content { padding: 16px; }
    .adm-kpi-grid { grid-template-columns: repeat(2, 1fr); }
    .adm-mini-grid { grid-template-columns: repeat(2, 1fr); }
    .adm-header { padding: 0 16px; }
    .adm-search { max-width: 200px; }
    .adm-page-header { margin-bottom: 16px; }
    .adm-page-title { font-size: 18px; }
  }
  @media (max-width: 480px) {
    .adm-kpi-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
    .adm-kpi { padding: 15px; }
    .adm-kpi-value { font-size: 20px; }
    .adm-content { padding: 12px; }
    .adm-mini-grid { grid-template-columns: repeat(2, 1fr); }
  }

  /* Scrollbar global */
  .adm-root ::-webkit-scrollbar { width: 5px; height: 5px; }
  .adm-root ::-webkit-scrollbar-track { background: transparent; }
  .adm-root ::-webkit-scrollbar-thumb { background: var(--surface3); border-radius: 10px; }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    completed: { cls: 'green', label: 'Completed' },
    active: { cls: 'green', label: 'Active' },
    approved: { cls: 'green', label: 'Approved' },
    verified: { cls: 'green', label: 'Verified' },
    pending: { cls: 'amber', label: 'Pending' },
    pending_approval: { cls: 'amber', label: 'Pending' },
    rejected: { cls: 'red', label: 'Rejected' },
    cancelled: { cls: 'red', label: 'Cancelled' },
    suspended: { cls: 'red', label: 'Suspended' },
    admin: { cls: 'blue', label: 'Admin' },
    kyc_pending: { cls: 'purple', label: 'KYC Pending' },
  };
  const s = map[status] || { cls: 'gray', label: status || '—' };
  return (
    <span className={`adm-status ${s.cls}`}>
      <span className="adm-status-dot" />
      {s.label}
    </span>
  );
}

function EmptyState({ icon: Icon2, title, sub }) {
  return (
    <div className="adm-empty">
      <div className="adm-empty-icon"><Icon2 size={24} /></div>
      <p className="adm-empty-title">{title}</p>
      {sub && <p className="adm-empty-sub">{sub}</p>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="adm-card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
        <div className="adm-skeleton" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="adm-skeleton" style={{ height: 13, width: '60%', marginBottom: 7 }} />
          <div className="adm-skeleton" style={{ height: 11, width: '40%' }} />
        </div>
      </div>
      <div className="adm-skeleton" style={{ height: 60, borderRadius: 8 }} />
    </div>
  );
}

function DetailBox({ rows }) {
  return (
    <div className="adm-detail-box">
      {rows.map(([k, v]) => v != null && (
        <div key={k} className="adm-detail-row">
          <span className="adm-detail-key">{k}</span>
          <span className="adm-detail-val">{v}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Nav Items Config ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'overview',     label: 'Overview',      Icon: LayoutDashboard },
  { id: 'users',        label: 'Users',          Icon: Users },
  { id: 'deposits',     label: 'Deposits',       Icon: ArrowDownCircle },
  { id: 'withdrawals',  label: 'Withdrawals',    Icon: ArrowUpCircle },
  { id: 'investments',  label: 'Investments',    Icon: TrendingUp },
  { id: 'kyc',          label: 'KYC',            Icon: ShieldCheck },
  { id: 'transactions', label: 'Transactions',   Icon: History },
  { id: 'broadcast',    label: 'Broadcast',      Icon: Radio },
];

// ─── KPI Card Config ──────────────────────────────────────────────────────────
function makeKPICards(stats) {
  return [
    {
      label: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      sub: `${stats.activeUsers.toLocaleString()} active`,
      Icon: Users,
      color: '--blue',
      bg: '--blue-dim',
      trend: null,
    },
    {
      label: 'Total Deposits',
      value: stats.totalDeposits,
      sub: 'All time',
      Icon: ArrowDownCircle,
      color: '--accent',
      bg: '--accent-dim',
      trend: 'up',
    },
    {
      label: 'Total Withdrawals',
      value: stats.totalWithdrawals,
      sub: 'All time',
      Icon: ArrowUpCircle,
      color: '--red',
      bg: '--red-dim',
      trend: null,
    },
    {
      label: 'Profit Paid',
      value: stats.totalProfit,
      sub: 'To investors',
      Icon: DollarSign,
      color: '--amber',
      bg: '--amber-dim',
      trend: 'up',
    },
    {
      label: 'Pending Deposits',
      value: stats.pendingDeposits,
      sub: 'Awaiting review',
      Icon: Clock,
      color: '--amber',
      bg: '--amber-dim',
      trend: null,
    },
    {
      label: 'Pending Withdrawals',
      value: stats.pendingWithdrawals,
      sub: 'Awaiting review',
      Icon: RefreshCw,
      color: '--blue',
      bg: '--blue-dim',
      trend: null,
    },
    {
      label: 'Active Investments',
      value: stats.activeInvestments,
      sub: 'Running plans',
      Icon: BarChart3,
      color: '--accent',
      bg: '--accent-dim',
      trend: 'up',
    },
    {
      label: 'Pending KYC',
      value: stats.pendingKYC,
      sub: 'Needs review',
      Icon: ShieldCheck,
      color: '--purple',
      bg: '--purple-dim',
      trend: null,
    },
  ];
}

// ─── Main Component ───────────────────────────────────────────────────────────
function AdminDashboard({ darkMode, setDarkMode, onLogout, showToast }) {
  // ── All original state (untouched) ──
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0, activeUsers: 0, totalDeposits: 0, totalWithdrawals: 0,
    totalProfit: 0, pendingDeposits: 0, pendingWithdrawals: 0,
    activeInvestments: 0, pendingKYC: 0,
  });
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [pendingKYC, setPendingKYC] = useState([]);
  const [allInvestments, setAllInvestments] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [editBalanceUserId, setEditBalanceUserId] = useState(null);
  const [editBalanceAmount, setEditBalanceAmount] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);

  // ── UI-only state ──
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');

  // ── All original data fetching & actions (untouched) ──
  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, depRes, wdRes, kycRes, invRes, txRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/users'),
        API.get('/admin/deposits/pending'),
        API.get('/admin/withdrawals/pending'),
        API.get('/admin/kyc/pending'),
        API.get('/admin/investments'),
        API.get('/admin/transactions'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setFilteredUsers(usersRes.data);
      setPendingDeposits(depRes.data);
      setPendingWithdrawals(wdRes.data);
      setPendingKYC(kycRes.data);
      setAllInvestments(invRes.data || []);
      setAllTransactions(txRes.data || []);
    } catch (err) {
      showToast('Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchAdminData(); }, [fetchAdminData]);

  useEffect(() => {
    if (userSearch.trim()) {
      setFilteredUsers(users.filter(u =>
        u.first_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.phone?.includes(userSearch)
      ));
    } else {
      setFilteredUsers(users);
    }
  }, [userSearch, users]);

  const approveDeposit = async (id) => {
    try { await API.put(`/admin/deposits/${id}/approve`); showToast('Deposit approved successfully', 'success'); fetchAdminData(); }
    catch (err) { showToast(err.response?.data?.message || 'Failed to approve', 'error'); }
  };
  const rejectDeposit = async (id) => {
    try { await API.put(`/admin/deposits/${id}/reject`); showToast('Deposit rejected', 'info'); fetchAdminData(); }
    catch (err) { showToast(err.response?.data?.message || 'Failed to reject', 'error'); }
  };
  const approveWithdrawal = async (id) => {
    try { await API.put(`/admin/withdrawals/${id}/approve`); showToast('Withdrawal approved', 'success'); fetchAdminData(); }
    catch (err) { showToast(err.response?.data?.message || 'Failed to approve', 'error'); }
  };
  const rejectWithdrawal = async (id) => {
    try { await API.put(`/admin/withdrawals/${id}/reject`); showToast('Withdrawal rejected and refunded', 'info'); fetchAdminData(); }
    catch (err) { showToast(err.response?.data?.message || 'Failed to reject', 'error'); }
  };
  const banUser = async (id) => {
    try { await API.put(`/admin/users/${id}/ban`); showToast('User suspended', 'success'); fetchAdminData(); }
    catch (err) { showToast('Failed to suspend user', 'error'); }
  };
  const unbanUser = async (id) => {
    try { await API.put(`/admin/users/${id}/unban`); showToast('User reactivated', 'success'); fetchAdminData(); }
    catch (err) { showToast('Failed to reactivate user', 'error'); }
  };
  const editUserBalance = async (userId) => {
    if (!editBalanceAmount) return;
    try {
      await API.put(`/admin/users/${userId}/balance`, { balance: parseFloat(editBalanceAmount) });
      showToast('Balance updated', 'success');
      setEditBalanceUserId(null); setEditBalanceAmount('');
      fetchAdminData();
    } catch (err) { showToast('Failed to update balance', 'error'); }
  };
  const approveKYC = async (id) => {
    try { await API.put(`/admin/kyc/${id}/approve`); showToast('KYC approved', 'success'); fetchAdminData(); }
    catch (err) { showToast('Failed to approve KYC', 'error'); }
  };
  const rejectKYC = async (id, reason) => {
    try {
      await API.put(`/admin/kyc/${id}/reject`, { reason });
      showToast('KYC rejected', 'info');
      setShowRejectModal(null); setRejectReason('');
      fetchAdminData();
    } catch (err) { showToast('Failed to reject KYC', 'error'); }
  };
  const sendBroadcast = async () => {
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      showToast('Subject and message are required', 'error'); return;
    }
    setBroadcastLoading(true);
    try {
      const res = await API.post('/admin/broadcast', { subject: broadcastSubject, message: broadcastMessage });
      showToast(res.data.message, 'success');
      setBroadcastSubject(''); setBroadcastMessage('');
    } catch (err) { showToast('Failed to send broadcast', 'error'); }
    finally { setBroadcastLoading(false); }
  };

  const kpiCards = makeKPICards(stats);
  const activeNavItem = NAV_ITEMS.find(n => n.id === tab);
  const badges = {
    deposits: stats.pendingDeposits,
    withdrawals: stats.pendingWithdrawals,
    kyc: stats.pendingKYC,
  };

  // ── Loading skeleton ──
  if (loading) {
    return (
      <>
        <style>{STYLES}</style>
        <FontLink />
        <div className="adm-root">
          <div className="adm-sidebar">
            <div className="adm-logo">
              <div className="adm-logo-icon"><Zap size={16} color="#051a12" /></div>
              <div className="adm-logo-text">
                <span className="adm-logo-title">CryptoLegacy</span>
                <span className="adm-logo-badge">Admin Panel</span>
              </div>
            </div>
          </div>
          <div className="adm-main">
            <div className="adm-header" />
            <div className="adm-content">
              <div className="adm-kpi-grid">
                {Array(8).fill(0).map((_, i) => (
                  <div key={i} className="adm-kpi">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div className="adm-skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
                      <div className="adm-skeleton" style={{ width: 44, height: 22, borderRadius: 20 }} />
                    </div>
                    <div className="adm-skeleton" style={{ height: 28, width: '65%', marginBottom: 8 }} />
                    <div className="adm-skeleton" style={{ height: 12, width: '45%' }} />
                  </div>
                ))}
              </div>
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <FontLink />

      {/* ── Reject Modal ── */}
      {showRejectModal && (
        <div className="adm-modal-overlay" onClick={() => { setShowRejectModal(null); setRejectReason(''); }}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <p className="adm-modal-title">Reject KYC Submission</p>
            <p className="adm-modal-sub">Provide a clear reason — this will be sent to the user.</p>
            <div className="adm-input-group">
              <label className="adm-label">Rejection Reason</label>
              <textarea
                className="adm-input"
                rows={3}
                placeholder="e.g. ID document is unclear or expired..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="adm-btn adm-btn-danger adm-btn-full"
                onClick={() => rejectKYC(showRejectModal, rejectReason)}
                disabled={!rejectReason.trim()}
              >
                <XCircle size={15} /> Confirm Rejection
              </button>
              <button
                className="adm-btn adm-btn-ghost"
                onClick={() => { setShowRejectModal(null); setRejectReason(''); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="adm-root">
        {/* ── Sidebar ── */}
        <aside className={`adm-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <button
            className="adm-collapse-btn"
            onClick={() => setSidebarCollapsed(v => !v)}
            title={sidebarCollapsed ? 'Expand' : 'Collapse'}
          >
            {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>

          <div className="adm-logo">
            <div className="adm-logo-icon"><Zap size={16} color="#051a12" /></div>
            {!sidebarCollapsed && (
              <div className="adm-logo-text">
                <span className="adm-logo-title">CryptoLegacy</span>
                <span className="adm-logo-badge">Admin Panel</span>
              </div>
            )}
          </div>

          <nav className="adm-nav">
            {!sidebarCollapsed && <p className="adm-section-title" style={{ padding: '8px 2px 4px', fontSize: 9, letterSpacing: 1.2 }}>Navigation</p>}
            {NAV_ITEMS.map(({ id, label, Icon: NavIcon }) => (
              <button
                key={id}
                className={`adm-nav-item ${tab === id ? 'active' : ''}`}
                onClick={() => setTab(id)}
                title={sidebarCollapsed ? label : undefined}
              >
                <NavIcon size={17} className="adm-nav-icon" />
                {!sidebarCollapsed && <span className="adm-nav-label">{label}</span>}
                {!sidebarCollapsed && badges[id] > 0 && (
                  <span className="adm-badge">{badges[id]}</span>
                )}
                {sidebarCollapsed && badges[id] > 0 && (
                  <span style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--red)', border: '1.5px solid var(--bg)'
                  }} />
                )}
              </button>
            ))}
          </nav>

          <div className="adm-sidebar-footer">
            <button className="adm-nav-item" onClick={() => setDarkMode(!darkMode)} title="Toggle theme">
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              {!sidebarCollapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>
            <button className="adm-nav-item" onClick={onLogout} style={{ color: 'var(--red)' }} title="Sign out">
              <LogOut size={17} />
              {!sidebarCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className={`adm-main ${sidebarCollapsed ? 'collapsed' : ''}`}>

          {/* ── Sticky Header ── */}
          <header className="adm-header">
            <div className="adm-search">
              <Search size={14} className="adm-search-icon" />
              <input
                placeholder="Search anything..."
                value={headerSearch}
                onChange={e => setHeaderSearch(e.target.value)}
              />
            </div>
            <div className="adm-header-actions">
              <button className="adm-icon-btn" onClick={fetchAdminData} title="Refresh data">
                <RefreshCw size={15} />
              </button>
              <button className="adm-icon-btn" title="Notifications">
                <Bell size={15} />
                {(stats.pendingDeposits + stats.pendingWithdrawals + stats.pendingKYC) > 0 && (
                  <span className="adm-notification-dot" />
                )}
              </button>
              <button className="adm-icon-btn" onClick={() => setDarkMode(!darkMode)} title="Toggle theme">
                {darkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <div className="adm-avatar-btn" onClick={onLogout} title="Sign out">
                <div className="adm-avatar">{initials(user?.first_name || 'AD')}</div>
                <span className="adm-avatar-name" style={{ fontSize: 12 }}>{user?.first_name || 'Admin'}</span>
                <ChevronDown size={12} color="var(--text3)" />
              </div>
            </div>
          </header>

          {/* ── Content ── */}
          <main className="adm-content">

            {/* Page header */}
            <div className="adm-page-header">
              <div>
                <h1 className="adm-page-title">{activeNavItem?.label || 'Admin'}</h1>
                <p className="adm-page-sub">
                  {tab === 'overview' ? `Welcome back, ${user?.first_name} — here's your platform at a glance` :
                   tab === 'users' ? `${filteredUsers.length} user${filteredUsers.length !== 1 ? 's' : ''} total` :
                   tab === 'deposits' ? `${pendingDeposits.length} pending approval` :
                   tab === 'withdrawals' ? `${pendingWithdrawals.length} pending approval` :
                   tab === 'kyc' ? `${pendingKYC.length} awaiting review` :
                   tab === 'investments' ? `${allInvestments.filter(i => i.status === 'active').length} active` :
                   tab === 'transactions' ? `${allTransactions.length} total transactions` :
                   'Send a message to all active users'}
                </p>
              </div>
              <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={fetchAdminData}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            {/* Mobile tab strip */}
            <div className="adm-mobile-tabs">
              {NAV_ITEMS.map(({ id, label, Icon: NavIcon }) => (
                <button
                  key={id}
                  className={`adm-mobile-tab ${tab === id ? 'active' : ''}`}
                  onClick={() => setTab(id)}
                >
                  <NavIcon size={13} />
                  {label}
                  {badges[id] > 0 && <span className="adm-mobile-tab-badge">{badges[id]}</span>}
                </button>
              ))}
            </div>

            {/* ════════════════════════════════════════════
                TAB: OVERVIEW
            ════════════════════════════════════════════ */}
            {tab === 'overview' && (
              <div className="adm-fade-up">
                {/* KPI Grid */}
                <div className="adm-kpi-grid">
                  {kpiCards.map(card => (
                    <div
                      key={card.label}
                      className="adm-kpi"
                      style={{ '--kpi-accent': `var(${card.color})`, '--kpi-bg': `var(${card.bg})` }}
                    >
                      <div className="adm-kpi-header">
                        <div className="adm-kpi-icon-wrap">
                          <card.Icon size={18} />
                        </div>
                        {card.trend === 'up' && (
                          <span className="adm-kpi-trend up">
                            <ArrowUpRight size={11} /> +12%
                          </span>
                        )}
                        {!card.trend && <span className="adm-kpi-trend neutral">—</span>}
                      </div>
                      <div className="adm-kpi-value">
                        {typeof card.value === 'number' && card.value > 999
                          ? fmt(card.value)
                          : typeof card.value === 'string' && card.value.startsWith('$')
                          ? card.value
                          : card.value}
                      </div>
                      <div className="adm-kpi-label">{card.label}</div>
                      <div className="adm-kpi-sub">{card.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Pending alerts */}
                {(stats.pendingDeposits > 0 || stats.pendingWithdrawals > 0 || stats.pendingKYC > 0) && (
                  <div className="adm-card" style={{ marginBottom: 20 }}>
                    <div className="adm-card-header">
                      <span className="adm-card-title">
                        <AlertTriangle size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--amber)' }} />
                        Pending Actions
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {stats.pendingDeposits > 0 && (
                        <div className="adm-alert" style={{ background: 'var(--amber-dim)', borderColor: 'rgba(245,166,35,0.25)', color: 'var(--text)' }}>
                          <div className="adm-alert-left">
                            <Clock size={16} color="var(--amber)" />
                            <span>{stats.pendingDeposits} deposit{stats.pendingDeposits > 1 ? 's' : ''} awaiting approval</span>
                          </div>
                          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => setTab('deposits')}>
                            Review <ChevronRight size={12} />
                          </button>
                        </div>
                      )}
                      {stats.pendingWithdrawals > 0 && (
                        <div className="adm-alert" style={{ background: 'var(--blue-dim)', borderColor: 'rgba(59,123,250,0.25)', color: 'var(--text)' }}>
                          <div className="adm-alert-left">
                            <RefreshCw size={16} color="var(--blue)" />
                            <span>{stats.pendingWithdrawals} withdrawal{stats.pendingWithdrawals > 1 ? 's' : ''} awaiting approval</span>
                          </div>
                          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => setTab('withdrawals')}>
                            Review <ChevronRight size={12} />
                          </button>
                        </div>
                      )}
                      {stats.pendingKYC > 0 && (
                        <div className="adm-alert" style={{ background: 'var(--purple-dim)', borderColor: 'rgba(167,139,250,0.25)', color: 'var(--text)' }}>
                          <div className="adm-alert-left">
                            <ShieldCheck size={16} color="var(--purple)" />
                            <span>{stats.pendingKYC} KYC submission{stats.pendingKYC > 1 ? 's' : ''} awaiting review</span>
                          </div>
                          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => setTab('kyc')}>
                            Review <ChevronRight size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recent transactions */}
                <div className="adm-card">
                  <div className="adm-card-header">
                    <span className="adm-card-title">Recent Transactions</span>
                    <button className="adm-card-action" onClick={() => setTab('transactions')}>
                      View all <ChevronRight size={13} />
                    </button>
                  </div>
                  {allTransactions.length === 0 ? (
                    <EmptyState icon={History} title="No transactions yet" sub="Transactions will appear here once users start activity." />
                  ) : (
                    allTransactions.slice(0, 10).map(tx => {
                      const u = users.find(u => u.id === tx.user_id);
                      const isPos = tx.type?.includes('deposit') || tx.type?.includes('profit') || tx.type?.includes('referral') || tx.type?.includes('bonus');
                      return (
                        <div key={tx.id} className="adm-tx-row">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div className={`adm-avatar`} style={{ borderRadius: 10 }}>
                              {initials(u?.first_name)}
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', textTransform: 'capitalize' }}>
                                {tx.type?.replace(/_/g, ' ')}
                              </p>
                              <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                                {u?.first_name || 'Unknown'} · {fmtDate(tx.created_at)}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <StatusBadge status={tx.status} />
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 500, color: isPos ? 'var(--green)' : 'var(--text)', minWidth: 80, textAlign: 'right' }}>
                              {isPos ? '+' : '-'}{fmt(Math.abs(tx.amount))}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════
                TAB: USERS
            ════════════════════════════════════════════ */}
            {tab === 'users' && (
              <div className="adm-fade-up">
                <div style={{ marginBottom: 18, maxWidth: 420 }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
                    <input
                      className="adm-input"
                      style={{ paddingLeft: 36 }}
                      placeholder="Search by name, email or phone..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                    />
                  </div>
                </div>

                {filteredUsers.length === 0 ? (
                  <EmptyState icon={Users} title="No users found" sub="Try adjusting your search query." />
                ) : (
                  filteredUsers.map(u => (
                    <div key={u.id} className="adm-user-card">
                      {/* User header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                        <div className="adm-avatar adm-avatar-xl">{initials(u.first_name)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 3 }}>
                            <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{u.first_name}</span>
                            {!u.is_active && <StatusBadge status="suspended" />}
                            {u.is_admin && <StatusBadge status="admin" />}
                            {u.kyc_status === 'verified' && <StatusBadge status="verified" />}
                            {u.kyc_status === 'pending' && <StatusBadge status="kyc_pending" />}
                          </div>
                          <p style={{ fontSize: 12, color: 'var(--text3)' }}>{u.email}</p>
                          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                            {u.phone} · Joined {fmtDateShort(u.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Stats mini grid */}
                      <div className="adm-mini-grid">
                        <div>
                          <p className="adm-mini-stat-label">Balance</p>
                          <p className="adm-mini-stat-val" style={{ color: 'var(--accent)' }}>{fmt(u.balance || 0)}</p>
                        </div>
                        <div>
                          <p className="adm-mini-stat-label">Deposited</p>
                          <p className="adm-mini-stat-val">{fmt(u.total_deposited || 0)}</p>
                        </div>
                        <div>
                          <p className="adm-mini-stat-label">Profit</p>
                          <p className="adm-mini-stat-val" style={{ color: 'var(--green)' }}>{fmt(u.total_profit || 0)}</p>
                        </div>
                        <div>
                          <p className="adm-mini-stat-label">Referrals</p>
                          <p className="adm-mini-stat-val">{u.referrals_count || 0}</p>
                        </div>
                      </div>

                      {/* Edit balance inline */}
                      {editBalanceUserId === u.id && (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
                          <div style={{ flex: 1, position: 'relative' }}>
                            <Wallet size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                            <input
                              type="number"
                              className="adm-input"
                              style={{ paddingLeft: 32 }}
                              value={editBalanceAmount}
                              onChange={e => setEditBalanceAmount(e.target.value)}
                              placeholder="New balance amount"
                              autoFocus
                            />
                          </div>
                          <button onClick={() => editUserBalance(u.id)} className="adm-btn adm-btn-success adm-btn-sm">
                            <CheckCircle2 size={13} /> Save
                          </button>
                          <button onClick={() => { setEditBalanceUserId(null); setEditBalanceAmount(''); }} className="adm-btn adm-btn-ghost adm-btn-sm">
                            Cancel
                          </button>
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {!u.is_admin && (
                          u.is_active ? (
                            <button onClick={() => banUser(u.id)} className="adm-btn adm-btn-danger adm-btn-sm">
                              <UserX size={13} /> Suspend
                            </button>
                          ) : (
                            <button onClick={() => unbanUser(u.id)} className="adm-btn adm-btn-success adm-btn-sm">
                              <UserCheck size={13} /> Reactivate
                            </button>
                          )
                        )}
                        {editBalanceUserId !== u.id && (
                          <button
                            onClick={() => { setEditBalanceUserId(u.id); setEditBalanceAmount((u.balance || 0).toFixed(2)); }}
                            className="adm-btn adm-btn-ghost adm-btn-sm"
                          >
                            <Edit3 size={13} /> Edit Balance
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════
                TAB: DEPOSITS
            ════════════════════════════════════════════ */}
            {tab === 'deposits' && (
              <div className="adm-fade-up">
                {pendingDeposits.length === 0 ? (
                  <div className="adm-card">
                    <EmptyState icon={CheckCircle2} title="All clear" sub="No deposits pending approval right now." />
                  </div>
                ) : (
                  pendingDeposits.map(d => {
                    const u = users.find(u => u.id === d.user_id);
                    return (
                      <div key={d.id} className="adm-action-card">
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div className="adm-avatar adm-avatar-lg">{initials(u?.first_name || '?')}</div>
                            <div>
                              <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{u?.first_name || 'Unknown User'}</p>
                              <p style={{ fontSize: 12, color: 'var(--text3)' }}>{u?.email}</p>
                              <p style={{ fontSize: 11, color: 'var(--text3)' }}>{fmtDate(d.created_at)}</p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 500, color: 'var(--accent)', letterSpacing: -1 }}>
                              {fmt(d.amount_usd)}
                            </p>
                            <StatusBadge status="pending" />
                          </div>
                        </div>

                        <DetailBox rows={[
                          ['Method', <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>{d.method}</span>],
                          ['Transaction Code', <span className="adm-mono">{d.transaction_code}</span>],
                          d.phone_number && ['Phone', d.phone_number],
                          d.amount_kes && ['KES Amount', `KES ${d.amount_kes?.toLocaleString()}`],
                        ].filter(Boolean)} />

                        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                          <button onClick={() => approveDeposit(d.id)} className="adm-btn adm-btn-success adm-btn-full">
                            <CheckCircle2 size={15} /> Approve
                          </button>
                          <button onClick={() => rejectDeposit(d.id)} className="adm-btn adm-btn-danger adm-btn-full">
                            <XCircle size={15} /> Reject
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════
                TAB: WITHDRAWALS
            ════════════════════════════════════════════ */}
            {tab === 'withdrawals' && (
              <div className="adm-fade-up">
                {pendingWithdrawals.length === 0 ? (
                  <div className="adm-card">
                    <EmptyState icon={CheckCircle2} title="All clear" sub="No withdrawals pending approval." />
                  </div>
                ) : (
                  pendingWithdrawals.map(w => {
                    const u = users.find(u => u.id === w.user_id);
                    return (
                      <div key={w.id} className="adm-action-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div className="adm-avatar adm-avatar-lg">{initials(u?.first_name || '?')}</div>
                            <div>
                              <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{u?.first_name || 'Unknown User'}</p>
                              <p style={{ fontSize: 12, color: 'var(--text3)' }}>{u?.email}</p>
                              <p style={{ fontSize: 11, color: 'var(--text3)' }}>{fmtDate(w.created_at)}</p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 500, color: 'var(--text)', letterSpacing: -1 }}>
                              {fmt(w.amount_usd)}
                            </p>
                            <p style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2 }}>
                              Net {fmt(w.net_amount_usd)}
                            </p>
                          </div>
                        </div>

                        <DetailBox rows={[
                          ['Method', <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>{w.method}</span>],
                          ['Destination', <span style={{ maxWidth: 220, textAlign: 'right', wordBreak: 'break-all', display: 'inline-block' }}>{w.details}</span>],
                          ['Fee (1%)', <span style={{ color: 'var(--red)' }}>-{fmt(w.fee_usd)}</span>],
                          w.amount_kes && ['KES Amount', `KES ${w.amount_kes?.toLocaleString()}`],
                        ].filter(Boolean)} />

                        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                          <button onClick={() => approveWithdrawal(w.id)} className="adm-btn adm-btn-success adm-btn-full">
                            <CheckCircle2 size={15} /> Approve
                          </button>
                          <button onClick={() => rejectWithdrawal(w.id)} className="adm-btn adm-btn-danger adm-btn-full">
                            <XCircle size={15} /> Reject & Refund
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════
                TAB: INVESTMENTS
            ════════════════════════════════════════════ */}
            {tab === 'investments' && (
              <div className="adm-fade-up">
                <p className="adm-section-title">
                  <Activity size={12} /> Active ({allInvestments.filter(i => i.status === 'active').length})
                </p>

                {allInvestments.filter(i => i.status === 'active').length === 0 ? (
                  <div className="adm-card" style={{ marginBottom: 24 }}>
                    <EmptyState icon={TrendingUp} title="No active investments" sub="Active investment plans will appear here." />
                  </div>
                ) : (
                  allInvestments.filter(i => i.status === 'active').map(inv => {
                    const u = users.find(u => u.id === inv.user_id);
                    const plan = INVESTMENT_PLANS?.[inv.plan_id];
                    const progress = Math.min(100, ((new Date() - new Date(inv.start_date)) / (new Date(inv.end_date) - new Date(inv.start_date))) * 100);
                    return (
                      <div key={inv.id} className="adm-card" style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                          <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
                            <div className="adm-avatar adm-avatar-lg">{initials(u?.first_name)}</div>
                            <div>
                              <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{u?.first_name || 'Unknown'}</p>
                              <p style={{ fontSize: 12, color: 'var(--text3)' }}>{inv.plan_name}</p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--text)' }}>{fmt(inv.amount)}</p>
                            <StatusBadge status="active" />
                          </div>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>
                            <span>Progress</span>
                            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{progress.toFixed(1)}%</span>
                          </div>
                          <div className="adm-progress-track">
                            <div className="adm-progress-fill" style={{ width: `${progress}%`, background: plan?.details?.gradient || 'var(--accent)' }} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)' }}>
                          <span>Start: <strong style={{ color: 'var(--text2)' }}>{fmtDateShort(inv.start_date)}</strong></span>
                          <span>End: <strong style={{ color: 'var(--text2)' }}>{fmtDateShort(inv.end_date)}</strong></span>
                          <span>Paid: <strong style={{ color: 'var(--green)' }}>{fmt(inv.total_paid)}</strong></span>
                        </div>
                      </div>
                    );
                  })
                )}

                <p className="adm-section-title" style={{ marginTop: 28 }}>
                  <History size={12} /> Completed ({allInvestments.filter(i => i.status === 'completed').length})
                </p>
                {allInvestments.filter(i => i.status === 'completed').length === 0 ? (
                  <div className="adm-card">
                    <EmptyState icon={CheckCircle2} title="No completed investments" />
                  </div>
                ) : (
                  allInvestments.filter(i => i.status === 'completed').slice(0, 20).map(inv => {
                    const u = users.find(u => u.id === inv.user_id);
                    return (
                      <div key={inv.id} className="adm-card" style={{ marginBottom: 10, opacity: 0.75 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <div className="adm-avatar">{initials(u?.first_name)}</div>
                            <div>
                              <p style={{ fontWeight: 500, color: 'var(--text)', fontSize: 13 }}>{u?.first_name || 'Unknown'}</p>
                              <p style={{ fontSize: 11, color: 'var(--text3)' }}>{inv.plan_name} · {fmt(inv.amount)}</p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>{fmt(inv.total_paid)} earned</p>
                            <StatusBadge status="completed" />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════
                TAB: KYC
            ════════════════════════════════════════════ */}
            {tab === 'kyc' && (
              <div className="adm-fade-up">
                {pendingKYC.length === 0 ? (
                  <div className="adm-card">
                    <EmptyState icon={ShieldCheck} title="All verified" sub="No KYC submissions are pending review." />
                  </div>
                ) : (
                  pendingKYC.map(k => {
                    const u = users.find(u => u.id === k.user_id);
                    return (
                      <div key={k.id} className="adm-action-card">
                        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
                          <div className="adm-avatar adm-avatar-xl">{initials(k.full_name)}</div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)', marginBottom: 3 }}>{k.full_name}</p>
                            <p style={{ fontSize: 12, color: 'var(--text3)' }}>
                              ID: <span className="adm-mono">{k.id_number}</span>
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--text3)' }}>
                              Account: {u?.first_name} ({u?.email})
                            </p>
                            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                              Submitted {fmtDate(k.created_at)}
                            </p>
                          </div>
                          <StatusBadge status="pending" />
                        </div>

                        {/* Document links */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                          <a
                            href={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}/${k.id_image_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none' }}
                          >
                            <div style={{
                              background: 'var(--surface2)',
                              border: '1px solid var(--border)',
                              borderRadius: 10,
                              padding: '11px 14px',
                              display: 'flex', alignItems: 'center', gap: 8,
                              cursor: 'pointer',
                              transition: 'border-color 0.15s',
                            }}
                              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                            >
                              <FileText size={15} color="var(--accent)" />
                              <div>
                                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>ID Document</p>
                                <p style={{ fontSize: 10, color: 'var(--accent)' }}>View file ↗</p>
                              </div>
                            </div>
                          </a>
                          <a
                            href={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}/${k.selfie_image_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none' }}
                          >
                            <div style={{
                              background: 'var(--surface2)',
                              border: '1px solid var(--border)',
                              borderRadius: 10,
                              padding: '11px 14px',
                              display: 'flex', alignItems: 'center', gap: 8,
                              cursor: 'pointer',
                              transition: 'border-color 0.15s',
                            }}
                              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                            >
                              <Camera size={15} color="var(--blue)" />
                              <div>
                                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>Selfie</p>
                                <p style={{ fontSize: 10, color: 'var(--blue)' }}>View photo ↗</p>
                              </div>
                            </div>
                          </a>
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                          <button onClick={() => approveKYC(k.id)} className="adm-btn adm-btn-success adm-btn-full">
                            <CheckCircle2 size={15} /> Approve KYC
                          </button>
                          <button onClick={() => setShowRejectModal(k.id)} className="adm-btn adm-btn-danger adm-btn-full">
                            <XCircle size={15} /> Reject KYC
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════
                TAB: TRANSACTIONS
            ════════════════════════════════════════════ */}
            {tab === 'transactions' && (
              <div className="adm-fade-up">
                {allTransactions.length === 0 ? (
                  <div className="adm-card">
                    <EmptyState icon={History} title="No transactions yet" sub="Platform transactions will appear here." />
                  </div>
                ) : (
                  <div className="adm-table-wrap" style={{ overflowX: 'auto' }}>
                    <table className="adm-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allTransactions.slice(0, 100).map(tx => {
                          const u = users.find(u => u.id === tx.user_id);
                          const isPos = tx.type?.includes('deposit') || tx.type?.includes('profit') || tx.type?.includes('referral') || tx.type?.includes('bonus');
                          return (
                            <tr key={tx.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div className="adm-avatar" style={{ width: 28, height: 28, borderRadius: 7, fontSize: 10 }}>
                                    {initials(u?.first_name)}
                                  </div>
                                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>{u?.first_name || 'Unknown'}</span>
                                </div>
                              </td>
                              <td style={{ textTransform: 'capitalize', color: 'var(--text)' }}>
                                {tx.type?.replace(/_/g, ' ')}
                              </td>
                              <td>
                                <span style={{
                                  fontFamily: 'var(--font-display)',
                                  fontWeight: 500,
                                  fontSize: 13,
                                  color: isPos ? 'var(--green)' : 'var(--text)',
                                }}>
                                  {isPos ? '+' : '-'}{fmt(Math.abs(tx.amount))}
                                </span>
                              </td>
                              <td><StatusBadge status={tx.status} /></td>
                              <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{fmtDate(tx.created_at)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════
                TAB: BROADCAST
            ════════════════════════════════════════════ */}
            {tab === 'broadcast' && (
              <div className="adm-fade-up" style={{ maxWidth: 580 }}>
                <div className="adm-card">
                  <div className="adm-card-header" style={{ marginBottom: 20 }}>
                    <span className="adm-card-title" style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Radio size={16} color="var(--accent)" />
                      Broadcast Message
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text3)', background: 'var(--surface2)', padding: '3px 9px', borderRadius: 20, border: '1px solid var(--border)' }}>
                      {stats.activeUsers.toLocaleString()} recipients
                    </span>
                  </div>

                  <div className="adm-input-group">
                    <label className="adm-label">Subject Line</label>
                    <input
                      className="adm-input"
                      placeholder="Important update about your account..."
                      value={broadcastSubject}
                      onChange={e => setBroadcastSubject(e.target.value)}
                    />
                  </div>

                  <div className="adm-input-group">
                    <label className="adm-label">Message Body</label>
                    <textarea
                      className="adm-input"
                      rows={7}
                      placeholder="Write your broadcast message here. Be clear and concise..."
                      value={broadcastMessage}
                      onChange={e => setBroadcastMessage(e.target.value)}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                      onClick={sendBroadcast}
                      disabled={broadcastLoading || !broadcastSubject.trim() || !broadcastMessage.trim()}
                      className="adm-btn adm-btn-primary"
                    >
                      {broadcastLoading ? (
                        <>
                          <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                          Sending...
                        </>
                      ) : (
                        <><Send size={14} /> Send to All Users</>
                      )}
                    </button>
                    {(broadcastSubject || broadcastMessage) && (
                      <button
                        onClick={() => { setBroadcastSubject(''); setBroadcastMessage(''); }}
                        className="adm-btn adm-btn-ghost"
                      >
                        <Trash2 size={13} /> Clear
                      </button>
                    )}
                  </div>

                  <div className="adm-info-box">
                    <p className="adm-info-box-title"><Zap size={13} color="var(--accent)" /> Broadcast Guidelines</p>
                    <ul>
                      <li>Keep messages concise and professional</li>
                      <li>Use for important announcements and platform updates</li>
                      <li>Avoid sending too frequently — respect your users</li>
                      <li>All {stats.activeUsers.toLocaleString()} active users will receive this email</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}


// ============================================================================
// MAIN APP
// ============================================================================
export default function App() {
  const { user, loading, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  useEffect(() => { localStorage.setItem('darkMode', darkMode); document.documentElement.classList.toggle('dark-mode', darkMode); }, [darkMode]);

  const showToast = useCallback((message, type = 'info') => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }, []);

  if (loading) return <LoadingScreen />;
  if (!user) return <><StyleInjector /><AuthScreen darkMode={darkMode} setDarkMode={setDarkMode} /><ToastContainer toasts={toasts} /></>;
  if (user.is_admin) return <><StyleInjector /><AdminDashboard darkMode={darkMode} setDarkMode={setDarkMode} onLogout={logout} showToast={showToast} /><ToastContainer toasts={toasts} /></>;
  return <><StyleInjector /><UserDashboard darkMode={darkMode} setDarkMode={setDarkMode} onLogout={logout} showToast={showToast} /><ToastContainer toasts={toasts} /></>;
}
