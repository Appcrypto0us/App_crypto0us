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
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #f5f4f0;
    --bg2: #eeede8;
    --surface: #ffffff;
    --surface2: #f9f8f5;
    --surface3: #f2f1ed;
    --border: rgba(0,0,0,0.07);
    --border2: rgba(0,0,0,0.12);
    --text: #0f0e0b;
    --text2: #5c5a52;
    --text3: #9e9b90;
    --accent: #1a4aff;
    --accent2: #0a2fd4;
    --accent-soft: rgba(26,74,255,0.08);
    --accent-glow: rgba(26,74,255,0.15);
    --green: #00875a;
    --green-soft: rgba(0,135,90,0.08);
    --green-text: #006644;
    --red: #d93025;
    --red-soft: rgba(217,48,37,0.07);
    --gold: #b45309;
    --gold-soft: rgba(180,83,9,0.08);
    --purple: #6d28d9;
    --purple-soft: rgba(109,40,217,0.08);
    --shadow-xs: 0 1px 2px rgba(0,0,0,0.04);
    --shadow-sm: 0 1px 4px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
    --shadow-lg: 0 12px 40px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.05);
    --shadow-xl: 0 24px 64px rgba(0,0,0,0.12);
    --radius-xs: 6px;
    --radius-sm: 10px;
    --radius: 14px;
    --radius-lg: 20px;
    --radius-xl: 28px;
    --transition: 200ms cubic-bezier(0.4,0,0.2,1);
    --font-display: 'Instrument Serif', Georgia, serif;
    --font-body: 'Geist', system-ui, sans-serif;
    --font-mono: 'Geist Mono', monospace;
  }

  .dark-mode {
    --bg: #0c0b09;
    --bg2: #111009;
    --surface: #161510;
    --surface2: #1c1a14;
    --surface3: #22201a;
    --border: rgba(255,255,255,0.07);
    --border2: rgba(255,255,255,0.12);
    --text: #f0ede4;
    --text2: #8a8470;
    --text3: #504d42;
    --accent-soft: rgba(26,74,255,0.12);
    --accent-glow: rgba(26,74,255,0.20);
    --green-soft: rgba(0,135,90,0.12);
    --red-soft: rgba(217,48,37,0.10);
    --gold-soft: rgba(180,83,9,0.12);
    --purple-soft: rgba(109,40,217,0.12);
    --shadow-sm: 0 1px 4px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.2);
    --shadow-lg: 0 12px 40px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3);
  }

  html, body {
    font-family: var(--font-body);
    background: var(--bg);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .cl-app {
    min-height: 100vh;
    background: var(--bg);
    transition: background 0.3s ease, color 0.3s ease;
    font-family: var(--font-body);
  }

  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }

  /* ── Buttons ── */
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 7px;
    font-family: var(--font-body); font-weight: 500; cursor: pointer;
    border: none; outline: none;
    transition: all var(--transition);
    border-radius: var(--radius-sm);
    letter-spacing: -0.01em;
  }
  .btn:active { transform: scale(0.97); }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; pointer-events: none; }

  .btn-primary {
    background: var(--text);
    color: var(--bg);
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 600;
  }
  .btn-primary:hover { opacity: 0.88; }

  .btn-accent {
    background: var(--accent);
    color: #fff;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 14px var(--accent-glow);
  }
  .btn-accent:hover { background: var(--accent2); box-shadow: 0 6px 20px var(--accent-glow); transform: translateY(-1px); }

  .btn-ghost {
    background: transparent;
    color: var(--text2);
    padding: 8px 12px;
    font-size: 13px;
    border: 1px solid var(--border);
  }
  .btn-ghost:hover { background: var(--surface2); color: var(--text); border-color: var(--border2); }

  .btn-danger { background: var(--red-soft); color: var(--red); padding: 7px 12px; font-size: 12px; font-weight: 600; }
  .btn-danger:hover { background: var(--red); color: #fff; }
  .btn-success { background: var(--green-soft); color: var(--green); padding: 7px 12px; font-size: 12px; font-weight: 600; }
  .btn-success:hover { background: var(--green); color: #fff; }
  .btn-full { width: 100%; }
  .btn-lg { padding: 14px 24px; font-size: 15px; border-radius: var(--radius); }
  .btn-icon { width: 36px; height: 36px; padding: 0; border-radius: var(--radius-sm); }

  /* ── Cards ── */
  .card {
    background: var(--surface);
    border-radius: var(--radius);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border);
    padding: 20px;
    transition: box-shadow var(--transition);
  }
  .card:hover { box-shadow: var(--shadow-md); }
  .card-lg { padding: 28px; border-radius: var(--radius-lg); }

  /* ── Inputs ── */
  .input-field {
    width: 100%;
    background: var(--surface2);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 12px 16px;
    font-family: var(--font-body);
    font-size: 14px;
    color: var(--text);
    outline: none;
    transition: border-color var(--transition), box-shadow var(--transition);
    letter-spacing: -0.01em;
  }
  .input-field:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
  .input-field::placeholder { color: var(--text3); }
  .select-field {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239e9b90' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 36px;
    cursor: pointer;
  }
  .input-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text3);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 6px;
    display: block;
  }
  .input-group { margin-bottom: 16px; }

  /* ── Badges ── */
  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 8px; border-radius: 20px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.02em;
  }
  .badge-green { background: var(--green-soft); color: var(--green); }
  .badge-red { background: var(--red-soft); color: var(--red); }
  .badge-gold { background: var(--gold-soft); color: var(--gold); }
  .badge-blue { background: var(--accent-soft); color: var(--accent); }
  .badge-gray { background: var(--surface2); color: var(--text2); border: 1px solid var(--border); }

  /* ── Modal ── */
  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.35);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 1000;
    display: flex; align-items: flex-end; justify-content: center;
    padding: 0;
    animation: fadeIn 0.18s ease;
  }
  @media(min-width:640px){ .modal-overlay { align-items: center; padding: 20px; } }

  .modal-sheet {
    background: var(--surface);
    width: 100%; max-width: 440px;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    padding: 28px 24px 32px;
    animation: slideUp 0.28s cubic-bezier(0.34,1.4,0.64,1);
    max-height: 90vh; overflow-y: auto;
    border: 1px solid var(--border);
    border-bottom: none;
  }
  @media(min-width:640px){
    .modal-sheet {
      border-radius: var(--radius-xl);
      animation: scaleIn 0.24s cubic-bezier(0.34,1.4,0.64,1);
      border-bottom: 1px solid var(--border);
    }
  }
  .modal-handle {
    width: 36px; height: 3px;
    background: var(--border2);
    border-radius: 2px;
    margin: 0 auto 24px;
  }
  @media(min-width:640px){ .modal-handle { display: none; } }
  .modal-title {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 400;
    margin-bottom: 20px;
    color: var(--text);
    letter-spacing: -0.02em;
  }

  /* ── Toast ── */
  .toast-container {
    position: fixed; bottom: 96px; left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    display: flex; flex-direction: column; gap: 8px;
    align-items: center; pointer-events: none;
  }
  .toast {
    padding: 11px 18px; border-radius: 100px;
    font-size: 13px; font-weight: 500;
    color: #fff;
    animation: toastIn 0.3s cubic-bezier(0.34,1.4,0.64,1);
    box-shadow: var(--shadow-lg);
    display: flex; align-items: center; gap: 7px;
    white-space: nowrap;
    letter-spacing: -0.01em;
  }
  .toast-success { background: var(--green); }
  .toast-error { background: var(--red); }
  .toast-info { background: var(--accent); }

  /* ── Spinner ── */
  .spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block; flex-shrink: 0;
  }
  .spinner-dark {
    border-color: var(--border2);
    border-top-color: var(--text);
  }

  /* ── Bottom Nav ── */
  .bottom-nav {
    position: fixed; bottom: 0; left: 0; right: 0;
    background: var(--surface);
    border-top: 1px solid var(--border);
    display: flex;
    z-index: 100;
    padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }
  .nav-item {
    flex: 1;
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    padding: 6px 4px;
    cursor: pointer;
    transition: color var(--transition);
    color: var(--text3);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    border: none; background: transparent;
    font-family: var(--font-body);
  }
  .nav-item.active { color: var(--accent); }

  /* ── Wallet Card ── */
  .wallet-card {
    background: var(--text);
    border-radius: var(--radius-lg);
    padding: 28px 24px;
    color: var(--bg);
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-lg);
  }
  .wallet-card::before {
    content: '';
    position: absolute;
    top: -80px; right: -80px;
    width: 240px; height: 240px;
    background: rgba(255,255,255,0.04);
    border-radius: 50%;
  }
  .wallet-card::after {
    content: '';
    position: absolute;
    bottom: -100px; left: -60px;
    width: 220px; height: 220px;
    background: rgba(255,255,255,0.03);
    border-radius: 50%;
  }

  /* ── Action Tiles ── */
  .action-tile {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 16px 12px;
    border: 1px solid var(--border);
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    cursor: pointer;
    transition: all var(--transition);
    box-shadow: var(--shadow-xs);
  }
  .action-tile:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--border2); }
  .action-tile:active { transform: scale(0.97); }

  .action-icon {
    width: 48px; height: 48px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
  }

  /* ── Stat Cards ── */
  .stat-card {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 18px;
    border: 1px solid var(--border);
    box-shadow: var(--shadow-xs);
  }
  .stat-label {
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--text3); margin-bottom: 6px;
  }
  .stat-value {
    font-family: var(--font-display);
    font-size: 24px;
    color: var(--text);
    letter-spacing: -0.02em;
  }

  /* ── Plan Cards ── */
  .plan-card {
    background: var(--surface);
    border-radius: var(--radius);
    border: 1.5px solid var(--border);
    padding: 20px;
    transition: all var(--transition);
    cursor: pointer;
  }
  .plan-card:hover { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); transform: translateY(-2px); }

  /* ── Transaction Items ── */
  .tx-item {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 0;
    border-bottom: 1px solid var(--border);
  }
  .tx-item:last-child { border-bottom: none; }
  .tx-icon {
    width: 40px; height: 40px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; flex-shrink: 0;
  }
  .tx-info { flex: 1; min-width: 0; }
  .tx-name { font-size: 14px; font-weight: 500; color: var(--text); letter-spacing: -0.01em; }
  .tx-date { font-size: 11px; color: var(--text3); margin-top: 2px; }
  .tx-amount { font-size: 14px; font-weight: 600; text-align: right; font-family: var(--font-mono); }

  .divider { height: 1px; background: var(--border); margin: 16px 0; }

  /* ── Segmented Control ── */
  .seg-control {
    background: var(--surface2);
    border-radius: var(--radius-sm);
    padding: 3px; display: flex; gap: 2px;
    border: 1px solid var(--border);
  }
  .seg-btn {
    flex: 1; padding: 7px 10px;
    border-radius: 7px;
    font-size: 12px; font-weight: 500;
    border: none; background: transparent;
    cursor: pointer; color: var(--text2);
    transition: all var(--transition);
    font-family: var(--font-body);
  }
  .seg-btn.active { background: var(--surface); color: var(--text); box-shadow: var(--shadow-xs); }

  /* ── Progress Bar ── */
  .progress-bar { height: 4px; background: var(--surface3); border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--accent); border-radius: 3px; transition: width 0.6s ease; }

  /* ── Page Header ── */
  .page-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    position: sticky; top: 0; z-index: 50;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }
  .header-greeting { font-size: 11px; color: var(--text3); font-weight: 500; letter-spacing: 0.02em; text-transform: uppercase; }
  .header-name { font-family: var(--font-display); font-size: 18px; color: var(--text); letter-spacing: -0.02em; }

  /* ── Avatar ── */
  .avatar {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: var(--text);
    display: flex; align-items: center; justify-content: center;
    color: var(--bg); font-weight: 700; font-size: 13px;
    flex-shrink: 0; letter-spacing: 0.02em;
    font-family: var(--font-mono);
  }

  .empty-state { text-align: center; padding: 56px 24px; color: var(--text2); }
  .empty-icon { font-size: 36px; margin-bottom: 14px; opacity: 0.4; }

  .page-content { padding: 20px; padding-bottom: 96px; }
  .section-title {
    font-size: 11px; font-weight: 700;
    color: var(--text3); letter-spacing: 0.08em;
    text-transform: uppercase; margin-bottom: 12px;
  }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }

  /* ── Ref Card ── */
  .ref-card {
    background: var(--text);
    border-radius: var(--radius-lg);
    padding: 24px;
    color: var(--bg);
    position: relative; overflow: hidden;
    box-shadow: var(--shadow-lg);
  }

  /* ── Investment Card ── */
  .inv-card {
    background: var(--surface);
    border-radius: var(--radius);
    border: 1px solid var(--border);
    padding: 18px;
    transition: all var(--transition);
  }

  /* ── Number formatting ── */
  .num { font-family: var(--font-mono); }

  /* ── Animations ── */
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { transform: translateY(60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes scaleIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  @keyframes toastIn { from { transform: translateY(16px) scale(0.92); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .fade-up { animation: fadeUp 0.3s ease both; }

  /* ── Skeleton ── */
  .skeleton {
    background: linear-gradient(90deg, var(--surface2) 25%, var(--surface3) 50%, var(--surface2) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8px;
  }

  /* ── Alert Strips ── */
  .alert-strip {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px;
    border-radius: var(--radius-sm);
    font-size: 13px; font-weight: 500;
    border: 1px solid;
    margin-bottom: 8px;
  }

  /* ============== ADMIN STYLES ============== */
  :root {
    --adm-bg: #0d0c0a;
    --adm-bg2: #111009;
    --adm-surface: #161410;
    --adm-surface2: #1d1b15;
    --adm-surface3: #24221b;
    --adm-border: rgba(255,255,255,0.07);
    --adm-border2: rgba(255,255,255,0.13);
    --adm-text: #f0ede4;
    --adm-text2: #857f6a;
    --adm-text3: #4a4840;
    --adm-accent: #f0c050;
    --adm-accent2: #d4a830;
    --adm-accent-dim: rgba(240,192,80,0.10);
    --adm-accent-glow: rgba(240,192,80,0.20);
    --adm-blue: #4f85f6;
    --adm-blue-dim: rgba(79,133,246,0.10);
    --adm-green: #34c97b;
    --adm-green-dim: rgba(52,201,123,0.10);
    --adm-red: #ff5050;
    --adm-red-dim: rgba(255,80,80,0.10);
    --adm-amber: #f59e0b;
    --adm-amber-dim: rgba(245,158,11,0.10);
    --adm-purple: #a78bfa;
    --adm-purple-dim: rgba(167,139,250,0.10);
    --adm-font-display: 'Instrument Serif', Georgia, serif;
    --adm-font-body: 'Geist', system-ui, sans-serif;
    --adm-font-mono: 'Geist Mono', monospace;
    --adm-sidebar-w: 232px;
    --adm-sidebar-collapsed: 60px;
    --adm-header-h: 60px;
    --adm-radius: 10px;
    --adm-radius-lg: 14px;
    --adm-shadow: 0 4px 24px rgba(0,0,0,0.5);
    --adm-shadow-lg: 0 8px 48px rgba(0,0,0,0.7);
  }

  .adm-root {
    font-family: var(--adm-font-body);
    background: var(--adm-bg);
    color: var(--adm-text);
    min-height: 100vh;
    display: flex;
    -webkit-font-smoothing: antialiased;
    line-height: 1.5;
  }
  .adm-root *, .adm-root *::before, .adm-root *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .adm-sidebar {
    position: fixed; top: 0; left: 0; bottom: 0;
    width: var(--adm-sidebar-w);
    background: var(--adm-surface);
    border-right: 1px solid var(--adm-border);
    display: flex; flex-direction: column;
    z-index: 100;
    transition: width 0.25s cubic-bezier(.4,0,.2,1);
    overflow: hidden;
  }
  .adm-sidebar.collapsed { width: var(--adm-sidebar-collapsed); }

  .adm-logo {
    padding: 18px 16px;
    display: flex; align-items: center; gap: 10px;
    border-bottom: 1px solid var(--adm-border);
    min-height: var(--adm-header-h);
    flex-shrink: 0;
  }
  .adm-logo-icon {
    width: 30px; height: 30px;
    background: var(--adm-accent);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 16px var(--adm-accent-glow);
  }
  .adm-logo-text { display: flex; flex-direction: column; white-space: nowrap; overflow: hidden; transition: opacity 0.2s; }
  .adm-logo-title { font-family: var(--adm-font-display); font-size: 15px; color: var(--adm-text); letter-spacing: -0.02em; }
  .adm-logo-badge { font-size: 9px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--adm-text3); margin-top: 1px; font-family: var(--adm-font-mono); }

  .adm-nav { flex: 1; padding: 8px; overflow-y: auto; overflow-x: hidden; scrollbar-width: none; }
  .adm-nav::-webkit-scrollbar { display: none; }

  .adm-nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px;
    border-radius: var(--adm-radius);
    cursor: pointer; border: none; background: transparent;
    color: var(--adm-text2);
    width: 100%;
    font-family: var(--adm-font-body);
    font-size: 13px; font-weight: 500;
    transition: all 0.15s; white-space: nowrap;
    position: relative; text-align: left;
  }
  .adm-nav-item:hover { background: var(--adm-surface2); color: var(--adm-text); }
  .adm-nav-item.active { background: var(--adm-accent-dim); color: var(--adm-accent); }
  .adm-nav-item.active::before {
    content: '';
    position: absolute; left: 0; top: 25%; bottom: 25%;
    width: 2px; background: var(--adm-accent);
    border-radius: 0 2px 2px 0;
  }
  .adm-nav-icon { flex-shrink: 0; width: 17px; height: 17px; }
  .adm-nav-label { flex: 1; transition: opacity 0.2s; }
  .adm-badge {
    background: var(--adm-red);
    color: #fff; border-radius: 20px;
    padding: 1px 6px; font-size: 10px; font-weight: 700;
    flex-shrink: 0; transition: opacity 0.2s; line-height: 1.5;
    font-family: var(--adm-font-mono);
  }

  .adm-sidebar-footer { padding: 8px 8px 16px; border-top: 1px solid var(--adm-border); flex-shrink: 0; }

  .adm-collapse-btn {
    position: absolute; top: 18px; right: -11px;
    width: 22px; height: 22px;
    background: var(--adm-surface2);
    border: 1px solid var(--adm-border2);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--adm-text2); z-index: 101;
    transition: all 0.15s;
  }
  .adm-collapse-btn:hover { color: var(--adm-text); background: var(--adm-surface3); }

  .adm-main {
    margin-left: var(--adm-sidebar-w);
    flex: 1;
    display: flex; flex-direction: column;
    min-height: 100vh;
    transition: margin-left 0.25s cubic-bezier(.4,0,.2,1);
  }
  .adm-main.collapsed { margin-left: var(--adm-sidebar-collapsed); }

  .adm-header {
    position: sticky; top: 0;
    height: var(--adm-header-h);
    background: rgba(13,12,10,0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--adm-border);
    display: flex; align-items: center;
    padding: 0 24px; gap: 16px;
    z-index: 50;
  }

  .adm-search { flex: 1; max-width: 300px; position: relative; }
  .adm-search input {
    width: 100%;
    background: var(--adm-surface2);
    border: 1px solid var(--adm-border);
    border-radius: var(--adm-radius);
    padding: 8px 12px 8px 34px;
    font-family: var(--adm-font-body);
    font-size: 13px; color: var(--adm-text);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .adm-search input::placeholder { color: var(--adm-text3); }
  .adm-search input:focus { border-color: var(--adm-accent); box-shadow: 0 0 0 3px var(--adm-accent-dim); }
  .adm-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--adm-text3); pointer-events: none; }

  .adm-header-actions { display: flex; align-items: center; gap: 6px; margin-left: auto; }
  .adm-icon-btn {
    width: 34px; height: 34px;
    border-radius: var(--adm-radius);
    background: var(--adm-surface2);
    border: 1px solid var(--adm-border);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: var(--adm-text2);
    transition: all 0.15s; position: relative;
  }
  .adm-icon-btn:hover { background: var(--adm-surface3); color: var(--adm-text); }
  .adm-notification-dot {
    position: absolute; top: 5px; right: 5px;
    width: 6px; height: 6px;
    background: var(--adm-red);
    border-radius: 50%; border: 1.5px solid var(--adm-bg);
  }

  .adm-avatar-btn {
    display: flex; align-items: center; gap: 7px;
    padding: 4px 10px 4px 4px;
    border-radius: var(--adm-radius);
    background: var(--adm-surface2);
    border: 1px solid var(--adm-border);
    cursor: pointer; transition: all 0.15s;
  }
  .adm-avatar-btn:hover { background: var(--adm-surface3); }

  .adm-avatar {
    width: 26px; height: 26px;
    border-radius: 7px;
    background: var(--adm-accent);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700;
    color: #1a1200; flex-shrink: 0;
    font-family: var(--adm-font-mono);
  }
  .adm-avatar-lg { width: 38px; height: 38px; border-radius: 10px; font-size: 13px; }
  .adm-avatar-xl { width: 46px; height: 46px; border-radius: 12px; font-size: 15px; }
  .adm-avatar-name { font-size: 12px; font-weight: 500; color: var(--adm-text); }

  .adm-content { flex: 1; padding: 28px; max-width: 1400px; width: 100%; }

  .adm-page-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    margin-bottom: 24px; gap: 16px;
  }
  .adm-page-title {
    font-family: var(--adm-font-display);
    font-size: 26px; color: var(--adm-text);
    letter-spacing: -0.03em;
  }
  .adm-page-sub { font-size: 13px; color: var(--adm-text3); margin-top: 3px; }

  .adm-kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px; margin-bottom: 24px;
  }
  .adm-kpi {
    background: var(--adm-surface);
    border: 1px solid var(--adm-border);
    border-radius: var(--adm-radius-lg);
    padding: 18px;
    transition: all 0.2s; cursor: default;
    position: relative; overflow: hidden;
  }
  .adm-kpi:hover { border-color: var(--adm-border2); transform: translateY(-1px); box-shadow: var(--adm-shadow); }
  .adm-kpi-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
  .adm-kpi-icon-wrap {
    width: 36px; height: 36px;
    border-radius: 9px;
    background: var(--kpi-bg, var(--adm-accent-dim));
    display: flex; align-items: center; justify-content: center;
    color: var(--kpi-accent, var(--adm-accent));
  }
  .adm-kpi-trend {
    display: flex; align-items: center; gap: 3px;
    font-size: 10px; font-weight: 600; font-family: var(--adm-font-mono);
    padding: 2px 6px; border-radius: 20px;
  }
  .adm-kpi-trend.up { background: var(--adm-green-dim); color: var(--adm-green); }
  .adm-kpi-trend.neutral { background: var(--adm-surface2); color: var(--adm-text3); }
  .adm-kpi-value {
    font-family: var(--adm-font-display);
    font-size: 28px; color: var(--adm-text);
    letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 4px;
  }
  .adm-kpi-label { font-size: 12px; color: var(--adm-text3); font-weight: 500; }
  .adm-kpi-sub { font-size: 11px; color: var(--adm-text3); margin-top: 2px; font-family: var(--adm-font-mono); }

  .adm-card {
    background: var(--adm-surface);
    border: 1px solid var(--adm-border);
    border-radius: var(--adm-radius-lg);
    padding: 20px;
  }
  .adm-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .adm-card-title { font-size: 14px; font-weight: 600; color: var(--adm-text); letter-spacing: -0.01em; }
  .adm-card-action {
    font-size: 12px; color: var(--adm-accent);
    background: none; border: none; cursor: pointer;
    font-family: var(--adm-font-body); font-weight: 500;
    display: flex; align-items: center; gap: 4px; transition: opacity 0.15s;
  }
  .adm-card-action:hover { opacity: 0.7; }

  .adm-table-wrap {
    background: var(--adm-surface);
    border: 1px solid var(--adm-border);
    border-radius: var(--adm-radius-lg);
    overflow: hidden;
  }
  .adm-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .adm-table th {
    background: var(--adm-surface2);
    padding: 10px 14px; text-align: left;
    font-size: 10px; font-weight: 600; font-family: var(--adm-font-mono);
    color: var(--adm-text3); letter-spacing: 0.8px; text-transform: uppercase;
    border-bottom: 1px solid var(--adm-border); white-space: nowrap;
  }
  .adm-table td {
    padding: 11px 14px; border-bottom: 1px solid var(--adm-border);
    color: var(--adm-text2); vertical-align: middle;
  }
  .adm-table tr:last-child td { border-bottom: none; }
  .adm-table tbody tr { transition: background 0.1s; }
  .adm-table tbody tr:hover { background: var(--adm-surface2); }

  .adm-status {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 8px; border-radius: 20px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.02em; white-space: nowrap;
    font-family: var(--adm-font-mono);
  }
  .adm-status-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
  .adm-status.green { background: var(--adm-green-dim); color: var(--adm-green); }
  .adm-status.green .adm-status-dot { background: var(--adm-green); }
  .adm-status.amber { background: var(--adm-amber-dim); color: var(--adm-amber); }
  .adm-status.amber .adm-status-dot { background: var(--adm-amber); }
  .adm-status.red { background: var(--adm-red-dim); color: var(--adm-red); }
  .adm-status.red .adm-status-dot { background: var(--adm-red); }
  .adm-status.blue { background: var(--adm-blue-dim); color: var(--adm-blue); }
  .adm-status.blue .adm-status-dot { background: var(--adm-blue); }
  .adm-status.purple { background: var(--adm-purple-dim); color: var(--adm-purple); }
  .adm-status.purple .adm-status-dot { background: var(--adm-purple); }
  .adm-status.gray { background: var(--adm-surface2); color: var(--adm-text3); }

  .adm-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 8px 14px; border-radius: var(--adm-radius);
    font-family: var(--adm-font-body); font-size: 13px; font-weight: 600;
    cursor: pointer; border: none; transition: all 0.15s;
    white-space: nowrap; letter-spacing: -0.01em;
  }
  .adm-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .adm-btn-primary { background: var(--adm-accent); color: #1a1200; }
  .adm-btn-primary:hover:not(:disabled) { background: var(--adm-accent2); box-shadow: 0 4px 16px var(--adm-accent-glow); transform: translateY(-1px); }
  .adm-btn-danger { background: var(--adm-red-dim); color: var(--adm-red); border: 1px solid rgba(255,80,80,0.2); }
  .adm-btn-danger:hover:not(:disabled) { background: rgba(255,80,80,0.2); }
  .adm-btn-success { background: var(--adm-green-dim); color: var(--adm-green); border: 1px solid rgba(52,201,123,0.2); }
  .adm-btn-success:hover:not(:disabled) { background: rgba(52,201,123,0.2); }
  .adm-btn-ghost { background: var(--adm-surface2); color: var(--adm-text2); border: 1px solid var(--adm-border); }
  .adm-btn-ghost:hover:not(:disabled) { background: var(--adm-surface3); color: var(--adm-text); }

  .adm-btn-sm { padding: 5px 10px; font-size: 12px; border-radius: 7px; }
  .adm-btn-full { width: 100%; }

  .adm-input-group { margin-bottom: 14px; }
  .adm-label { display: block; font-size: 10px; font-weight: 700; color: var(--adm-text3); letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 6px; font-family: var(--adm-font-mono); }
  .adm-input {
    width: 100%;
    background: var(--adm-surface2);
    border: 1px solid var(--adm-border);
    border-radius: var(--adm-radius);
    padding: 10px 13px;
    font-family: var(--adm-font-body); font-size: 13px; color: var(--adm-text);
    outline: none; transition: border-color 0.15s, box-shadow 0.15s;
    resize: vertical;
  }
  .adm-input::placeholder { color: var(--adm-text3); }
  .adm-input:focus { border-color: var(--adm-accent); box-shadow: 0 0 0 3px var(--adm-accent-dim); }

  .adm-user-card {
    background: var(--adm-surface);
    border: 1px solid var(--adm-border);
    border-radius: var(--adm-radius-lg);
    padding: 20px; margin-bottom: 12px;
    transition: border-color 0.15s;
  }
  .adm-user-card:hover { border-color: var(--adm-border2); }

  .adm-action-card {
    background: var(--adm-surface);
    border: 1px solid var(--adm-border);
    border-radius: var(--adm-radius-lg);
    padding: 20px; margin-bottom: 12px;
    transition: border-color 0.15s;
  }

  .adm-detail-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 7px 0; border-bottom: 1px solid var(--adm-border);
  }
  .adm-detail-row:last-child { border-bottom: none; }
  .adm-detail-key { font-size: 11px; color: var(--adm-text3); font-family: var(--adm-font-mono); letter-spacing: 0.02em; }
  .adm-detail-val { font-size: 13px; font-weight: 500; color: var(--adm-text); }

  .adm-progress-track { background: var(--adm-surface2); border-radius: 99px; height: 4px; overflow: hidden; }
  .adm-progress-fill { height: 100%; border-radius: 99px; background: var(--adm-accent); transition: width 0.5s ease; }

  .adm-detail-box {
    background: var(--adm-surface2);
    border: 1px solid var(--adm-border);
    border-radius: var(--adm-radius); padding: 14px; margin: 12px 0;
  }

  .adm-alert {
    display: flex; align-items: center; justify-content: space-between;
    padding: 13px 16px; border-radius: var(--adm-radius);
    border: 1px solid; gap: 12px; flex-wrap: wrap;
  }
  .adm-alert-left { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 500; }

  .adm-tx-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 11px 0; border-bottom: 1px solid var(--adm-border);
    transition: background 0.1s;
  }
  .adm-tx-row:last-child { border-bottom: none; }

  .adm-info-box {
    background: var(--adm-surface2);
    border: 1px solid var(--adm-border);
    border-radius: var(--adm-radius); padding: 16px; margin-top: 18px;
  }
  .adm-info-box-title {
    font-size: 12px; font-weight: 700; color: var(--adm-text2);
    margin-bottom: 10px; display: flex; align-items: center; gap: 6px;
    text-transform: uppercase; letter-spacing: 0.05em; font-family: var(--adm-font-mono);
  }
  .adm-info-box li { font-size: 12px; color: var(--adm-text3); list-style: disc; margin-left: 16px; margin-bottom: 5px; line-height: 1.6; }

  .adm-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 56px 20px; gap: 10px; }
  .adm-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: var(--adm-surface2); border: 1px solid var(--adm-border); display: flex; align-items: center; justify-content: center; color: var(--adm-text3); margin-bottom: 4px; }
  .adm-empty-title { font-size: 14px; font-weight: 600; color: var(--adm-text2); }
  .adm-empty-sub { font-size: 12px; color: var(--adm-text3); text-align: center; max-width: 260px; line-height: 1.6; }

  .adm-skeleton {
    background: linear-gradient(90deg, var(--adm-surface2) 25%, var(--adm-surface3) 50%, var(--adm-surface2) 75%);
    background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 7px;
  }

  .adm-divider { height: 1px; background: var(--adm-border); margin: 18px 0; }

  .adm-mini-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
    padding: 14px; background: var(--adm-surface2); border-radius: var(--adm-radius); margin: 12px 0;
  }
  .adm-mini-stat-label { font-size: 9px; color: var(--adm-text3); font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 4px; font-family: var(--adm-font-mono); }
  .adm-mini-stat-val { font-size: 15px; font-weight: 600; color: var(--adm-text); font-family: var(--adm-font-display); letter-spacing: -0.02em; }

  .adm-mono { font-family: var(--adm-font-mono); font-size: 12px; color: var(--adm-accent); font-weight: 500; }

  .adm-mobile-tabs {
    display: flex; gap: 6px; overflow-x: auto;
    padding-bottom: 14px; margin-bottom: 20px; scrollbar-width: none;
  }
  .adm-mobile-tabs::-webkit-scrollbar { display: none; }
  .adm-mobile-tab {
    flex-shrink: 0; display: flex; align-items: center; gap: 5px;
    padding: 6px 12px; border-radius: 20px;
    font-size: 12px; font-weight: 500; cursor: pointer;
    border: 1px solid var(--adm-border);
    background: var(--adm-surface); color: var(--adm-text2);
    font-family: var(--adm-font-body); transition: all 0.15s; white-space: nowrap;
  }
  .adm-mobile-tab.active { background: var(--adm-accent); color: #1a1200; border-color: var(--adm-accent); font-weight: 600; }
  .adm-mobile-tab-badge { background: var(--adm-red); color: #fff; border-radius: 20px; padding: 1px 5px; font-size: 9px; font-weight: 700; }
  .adm-mobile-tab.active .adm-mobile-tab-badge { background: rgba(26,18,0,0.25); color: #1a1200; }

  .adm-section-title {
    font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
    color: var(--adm-text3); margin-bottom: 12px;
    display: flex; align-items: center; gap: 8px; font-family: var(--adm-font-mono);
  }
  .adm-section-title::after { content: ''; flex: 1; height: 1px; background: var(--adm-border); }

  .adm-fade-up { animation: fadeUp 0.25s ease both; }

  .adm-modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.65); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    z-index: 500; padding: 20px;
  }
  .adm-modal {
    background: var(--adm-surface);
    border: 1px solid var(--adm-border2);
    border-radius: calc(var(--adm-radius-lg) + 4px);
    padding: 24px; width: 100%; max-width: 440px;
    box-shadow: var(--adm-shadow-lg);
    animation: fadeUp 0.2s ease both;
  }
  .adm-modal-title { font-family: var(--adm-font-display); font-size: 22px; margin-bottom: 4px; color: var(--adm-text); letter-spacing: -0.02em; }
  .adm-modal-sub { font-size: 13px; color: var(--adm-text3); margin-bottom: 18px; }

  @media (max-width: 900px) {
    .adm-sidebar { display: none; }
    .adm-main { margin-left: 0 !important; }
    .adm-content { padding: 16px; }
    .adm-kpi-grid { grid-template-columns: repeat(2, 1fr); }
    .adm-mini-grid { grid-template-columns: repeat(2, 1fr); }
    .adm-header { padding: 0 16px; }
    .adm-search { max-width: 200px; }
    .adm-page-header { margin-bottom: 14px; }
    .adm-page-title { font-size: 22px; }
  }
  @media (max-width: 480px) {
    .adm-kpi-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
    .adm-kpi { padding: 14px; }
    .adm-kpi-value { font-size: 22px; }
    .adm-content { padding: 12px; }
    .adm-mini-grid { grid-template-columns: repeat(2, 1fr); }
  }
  .adm-root ::-webkit-scrollbar { width: 3px; height: 3px; }
  .adm-root ::-webkit-scrollbar-track { background: transparent; }
  .adm-root ::-webkit-scrollbar-thumb { background: var(--adm-surface3); border-radius: 10px; }

  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

// ============================================================================
// CONSTANTS
// ============================================================================
const INVESTMENT_PLANS = {
  basic_plan: { plan_id: "basic_plan", plan_name: "Basic", details: { daily_return_rate: 6.52, capital_range_min: 45, capital_range_max: 265, profit_interval_hours: 24, duration_days: 120, capital_withdrawal: true, color: "#4f85f6", gradient: "linear-gradient(135deg,#4f85f6,#2563eb)", icon: "◆" } },
  silver_plan: { plan_id: "silver_plan", plan_name: "Silver", details: { daily_return_rate: 8.15, capital_range_min: 310, capital_range_max: 613, profit_interval_hours: 20, duration_days: 240, capital_withdrawal: true, color: "#94a3b8", gradient: "linear-gradient(135deg,#94a3b8,#64748b)", icon: "◈" } },
  gold_plan: { plan_id: "gold_plan", plan_name: "Gold", details: { daily_return_rate: 10.19, capital_range_min: 656, capital_range_max: 1040, profit_interval_hours: 16, duration_days: 360, capital_withdrawal: true, color: "#d97706", gradient: "linear-gradient(135deg,#f59e0b,#d97706)", icon: "⬡" } },
  diamond_plan: { plan_id: "diamond_plan", plan_name: "Diamond", details: { daily_return_rate: 12.74, capital_range_min: 1048, capital_range_max: 1743, profit_interval_hours: 12, duration_days: 480, capital_withdrawal: true, color: "#06b6d4", gradient: "linear-gradient(135deg,#22d3ee,#0891b2)", icon: "◇" } },
  platinum_plan: { plan_id: "platinum_plan", plan_name: "Platinum", details: { daily_return_rate: 15.93, capital_range_min: 2178, capital_range_max: 4265, profit_interval_hours: 8, duration_days: 600, capital_withdrawal: true, color: "#e97316", gradient: "linear-gradient(135deg,#fb923c,#ea580c)", icon: "⬟" } },
  ultimate_plan: { plan_id: "ultimate_plan", plan_name: "Ultimate", details: { daily_return_rate: 19.91, capital_range_min: 4352, capital_range_max: 951515, profit_interval_hours: 4, duration_days: 720, capital_withdrawal: true, color: "#a855f7", gradient: "linear-gradient(135deg,#c084fc,#9333ea)", icon: "✦" } },
};

const BRAND_CONFIG = { referral_commission: 5 };

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
          {t.type === 'success' && <Icon name="check" size={13} />}
          {t.type === 'error' && <Icon name="x" size={13} />}
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
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ border: 'none' }}>
            <Icon name="x" size={16} />
          </button>
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
            <Icon name={showPass ? 'eyeoff' : 'eye'} size={15} />
          </button>
        )}
        {suffix && !isPass && <span style={{ position: 'absolute', right: 12, fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{suffix}</span>}
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
        <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 20px', color: 'var(--bg)' }}>₿</div>
        <div className="spinner spinner-dark" style={{ width: 20, height: 20 }} />
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
    <div className={`cl-app ${darkMode ? 'dark-mode' : ''}`} style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      {/* Subtle grid background */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)', backgroundSize: '32px 32px', pointerEvents: 'none', opacity: 0.6 }} />

      <button onClick={() => setDarkMode(!darkMode)} style={{ position: 'fixed', top: 16, right: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)', boxShadow: 'var(--shadow-sm)' }}>
        <Icon name={darkMode ? 'sun' : 'moon'} size={13} />
        {darkMode ? 'Light' : 'Dark'}
      </button>

      <div style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: 'var(--text)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 16px', color: 'var(--bg)', fontFamily: 'var(--font-mono)' }}>₿</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.03em' }}>CryptoLegacy</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)', letterSpacing: '-0.01em' }}>Premium crypto investment platform</p>
        </div>

        {/* Tab switcher */}
        {step === 'form' && (
          <div className="seg-control" style={{ marginBottom: 20 }}>
            <button className={`seg-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>Sign In</button>
            <button className={`seg-btn ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError(''); }}>Create Account</button>
          </div>
        )}

        <div className="card card-lg" style={{ boxShadow: 'var(--shadow-lg)' }}>
          {mode === 'login' ? (
            <form onSubmit={handleSubmit}>
              <InputField label="Phone Number" placeholder="+1 234 567 8900" value={phone} onChange={setPhone} required />
              <InputField label="PIN" type="password" placeholder="Enter your PIN" value={pin} onChange={setPin} required />
              {error && (
                <div style={{ background: 'var(--red-soft)', border: '1px solid rgba(217,48,37,0.2)', borderRadius: 'var(--radius-xs)', padding: '10px 12px', marginBottom: 14 }}>
                  <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>
                </div>
              )}
              <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg">
                {loading ? <><span className="spinner" /> Signing In…</> : 'Sign In'}
              </button>
            </form>
          ) : step === 'form' ? (
            <form onSubmit={handleSubmit}>
              <InputField label="Email" type="email" placeholder="your@email.com" value={email} onChange={setEmail} required />
              <InputField label="Phone Number" placeholder="+1 234 567 8900" value={phone} onChange={setPhone} required />
              <InputField label="First Name" placeholder="Your first name" value={firstName} onChange={setFirstName} required />
              <InputField label="Password" type="password" placeholder="Minimum 6 characters" value={password} onChange={setPassword} required />
              <InputField label="PIN (4-6 digits)" type="password" placeholder="Secure PIN" value={pin} onChange={setPin} required />
              <InputField label="Referral Code (optional)" placeholder="Enter code" value={referralCode} onChange={setReferralCode} />
              {error && (
                <div style={{ background: 'var(--red-soft)', border: '1px solid rgba(217,48,37,0.2)', borderRadius: 'var(--radius-xs)', padding: '10px 12px', marginBottom: 14 }}>
                  <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>
                </div>
              )}
              <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg">
                {loading ? <><span className="spinner" /> Creating…</> : 'Create Account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, background: 'var(--accent-soft)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Icon name="shield" size={20} color="var(--accent)" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '-0.02em', marginBottom: 6 }}>Verify Email</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>We sent a 6-digit code to<br /><strong style={{ color: 'var(--text)' }}>{email}</strong></p>
              </div>
              <InputField label="Verification Code" placeholder="000000" value={otp} onChange={setOtp} required />
              {error && (
                <div style={{ background: 'var(--red-soft)', border: '1px solid rgba(217,48,37,0.2)', borderRadius: 'var(--radius-xs)', padding: '10px 12px', marginBottom: 14 }}>
                  <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>
                </div>
              )}
              <button type="submit" disabled={loading} className="btn btn-primary btn-full btn-lg">
                {loading ? <><span className="spinner" /> Verifying…</> : 'Verify & Activate'}
              </button>
              <button type="button" onClick={handleResendOTP} className="btn btn-ghost btn-full" style={{ marginTop: 8 }}>Resend Code</button>
              <button type="button" onClick={() => setStep('form')} className="btn btn-ghost btn-full" style={{ marginTop: 4 }}>← Back to Registration</button>
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
          <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 14 }}>
            <p style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>Payment Details</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>Paybill</span>
              <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{instructions?.mpesa?.paybill || '714777'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>Account</span>
              <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{instructions?.mpesa?.account || '440200284022'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>Amount</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>KES {kesAmount}</span>
            </div>
          </div>
          <InputField label="M-Pesa Phone Number" placeholder="2547XXXXXXXX" value={phone} onChange={setPhone} required />
        </>
      )}
      {method === 'crypto' && (
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 14 }}>
          <p style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>USDT TRC20 Address</p>
          <code style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', wordBreak: 'break-all', display: 'block', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>{instructions?.crypto?.usdt || 'Loading...'}</code>
        </div>
      )}
      <InputField label={method === 'mpesa' ? 'M-Pesa Transaction Code' : 'Transaction Hash'} placeholder={method === 'mpesa' ? 'e.g. QK7E3ABCDE' : '0x...'} value={code} onChange={setCode} required />
      <button disabled={loading || !amount || !code || (method === 'mpesa' && !phone)} onClick={handleSubmit} className="btn btn-primary btn-full btn-lg">
        {loading ? <><span className="spinner" /> Processing…</> : 'Submit Deposit'}
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
  const isInsufficient = amount && parseFloat(amount) > (wallet?.available_balance || 0);

  const handleSubmit = async () => {
    if (!amount || !details || isInsufficient) return;
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
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Amount</span>
            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>{fmt(parseFloat(amount))}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Fee (1%)</span>
            <span style={{ fontSize: 13, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>−${fee}</span>
          </div>
          <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>You receive</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>${net}</span>
          </div>
        </div>
      )}
      {isInsufficient && <p style={{ color: 'var(--red)', fontSize: 12, marginBottom: 10 }}>Insufficient balance. Available: {fmt(wallet?.available_balance || 0)}</p>}
      <button disabled={loading || !amount || !details || isInsufficient} onClick={handleSubmit} className="btn btn-primary btn-full btn-lg">
        {loading ? <><span className="spinner" /> Processing…</> : 'Request Withdrawal'}
      </button>
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
    <Modal title={`${plan.plan_name} Plan`} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: d.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{d.icon}</div>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 18, letterSpacing: '-0.02em', marginBottom: 2 }}>{plan.plan_name}</p>
          <p style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>{d.daily_return_rate}% daily · {d.duration_days} days · every {d.profit_interval_hours}h</p>
        </div>
      </div>
      <InputField label="Investment Amount (USD)" type="number" placeholder={`$${d.capital_range_min} – $${d.capital_range_max}`} value={amount} onChange={setAmount} suffix="USD" />
      {amount && parseFloat(amount) > 0 && (
        <div style={{ background: 'var(--green-soft)', border: '1px solid rgba(0,135,90,0.15)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', marginBottom: 14 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Projected Returns</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Daily profit</span>
            <span style={{ fontSize: 13, color: 'var(--green)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>+${projectedDaily}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Total over {d.duration_days} days</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>+${projectedTotal}</span>
          </div>
        </div>
      )}
      <button disabled={loading || !amount} onClick={handleSubmit} className="btn btn-primary btn-full btn-lg">
        {loading ? <><span className="spinner" /> Investing…</> : `Invest ${amount ? fmt(parseFloat(amount)) : 'Now'}`}
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
      {/* Wallet Card */}
      <div className="wallet-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, position: 'relative', zIndex: 1 }}>
          <div>
            <p style={{ fontSize: 10, opacity: 0.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>Available Balance</p>
          </div>
          <button onClick={() => setBalVisible(!balVisible)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 7, padding: '5px 8px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center' }}>
            <Icon name={balVisible ? 'eye' : 'eyeoff'} size={13} color="currentColor" />
          </button>
        </div>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: '-0.04em', marginBottom: 4, position: 'relative', zIndex: 1, lineHeight: 1 }}>
          {balVisible ? fmt(wallet?.available_balance || 0) : '••••••'}
        </p>
        <p style={{ fontSize: 11, opacity: 0.4, marginBottom: 24, fontFamily: 'var(--font-mono)', position: 'relative', zIndex: 1 }}>USDT · TRC20</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          {[
            { label: 'Invested', value: balVisible ? fmt(wallet?.active_investments || 0) : '••••' },
            { label: 'Profit', value: balVisible ? fmt(wallet?.total_profit || 0) : '••••', highlight: true },
            { label: 'Deposited', value: balVisible ? fmt(wallet?.total_deposited || 0) : '••••' },
          ].map(item => (
            <div key={item.label}>
              <p style={{ fontSize: 9, opacity: 0.45, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{item.label}</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, opacity: item.highlight ? 1 : 0.85, color: item.highlight ? '#a0ffcc' : undefined }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <p className="section-title" style={{ marginBottom: 10 }}>Quick Actions</p>
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { icon: <Icon name="deposit" size={20} color="var(--accent)" />, label: 'Deposit', bg: 'var(--accent-soft)', action: onDeposit },
          { icon: <Icon name="withdraw" size={20} color="var(--green)" />, label: 'Withdraw', bg: 'var(--green-soft)', action: onWithdraw },
          { icon: <Icon name="trending" size={20} color="var(--gold)" />, label: 'Invest', bg: 'var(--gold-soft)', action: onInvest },
          { icon: <Icon name="chart" size={20} color="var(--purple)" />, label: 'Portfolio', bg: 'var(--purple-soft)', action: onPortfolio },
        ].map(a => (
          <div key={a.label} className="action-tile" onClick={a.action}>
            <div className="action-icon" style={{ background: a.bg }}>{a.icon}</div>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-mono)' }}>{a.label}</span>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {(pendingDeposits.length > 0 || pendingWithdrawals.length > 0) && (
        <div style={{ marginBottom: 20 }}>
          {pendingDeposits.length > 0 && (
            <div className="alert-strip" style={{ background: 'var(--gold-soft)', borderColor: 'rgba(180,83,9,0.2)', color: 'var(--text)' }}>
              <Clock size={14} color="var(--gold)" />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{pendingDeposits.length} deposit pending approval</span>
            </div>
          )}
          {pendingWithdrawals.length > 0 && (
            <div className="alert-strip" style={{ background: 'var(--accent-soft)', borderColor: 'rgba(26,74,255,0.2)', color: 'var(--text)' }}>
              <RefreshCw size={14} color="var(--accent)" />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{pendingWithdrawals.length} withdrawal processing</span>
            </div>
          )}
        </div>
      )}

      {/* Plans Preview */}
      <p className="section-title" style={{ marginBottom: 10 }}>Investment Plans</p>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, margin: '0 -20px', paddingLeft: 20, paddingRight: 20 }}>
        {Object.values(INVESTMENT_PLANS).slice(0, 4).map(p => (
          <div key={p.plan_id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 14px', flexShrink: 0, minWidth: 108, boxShadow: 'var(--shadow-xs)' }}>
            <p style={{ fontSize: 16, marginBottom: 8 }}>{p.details.icon}</p>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>{p.plan_name}</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--green)', marginBottom: 2 }}>{p.details.daily_return_rate}%</p>
            <p style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>daily</p>
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
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '-0.03em', marginBottom: 6 }}>Investment Plans</h2>
        <p style={{ fontSize: 13, color: 'var(--text3)' }}>Choose a plan that matches your goals</p>
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
   {/* ADD AI ASSISTANT HERE - Only appears on Invest tab */}
      <InvestAIAssistant />
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
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '-0.03em', marginBottom: 20 }}>Portfolio</h2>
      <div className="empty-state"><div className="empty-icon">◻</div><p style={{ fontSize: 14, fontWeight: 500 }}>No investments yet.</p><p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Start investing to build your portfolio.</p></div>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '-0.03em', marginBottom: 20 }}>Portfolio</h2>
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <p className="stat-label">Active Plans</p>
          <p className="stat-value">{active.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Earned</p>
          <p className="stat-value" style={{ color: 'var(--green)' }}>{fmt(investments.reduce((s, i) => s + (i.total_paid || 0), 0))}</p>
        </div>
      </div>
      {active.map(inv => {
        const plan = INVESTMENT_PLANS[inv.plan_id];
        const progress = Math.min(100, ((new Date() - new Date(inv.start_date)) / (new Date(inv.end_date) - new Date(inv.start_date))) * 100);
        return (
          <div key={inv.id} className="inv-card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 17, letterSpacing: '-0.02em', marginBottom: 3 }}>{inv.plan_name}</p>
                <p style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>Capital: {fmt(inv.amount)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-green">Active</span>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>+{fmt(inv.total_paid)}</p>
              </div>
            </div>
            <div className="progress-bar" style={{ marginBottom: 8 }}>
              <div className="progress-fill" style={{ width: `${progress}%`, background: plan?.details.gradient }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{progress.toFixed(1)}% complete</p>
              <p style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>Next: {fmtDate(inv.next_payout)}</p>
            </div>
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
  const earnings = referrals?.reduce?.((s, r) => s + ((r.total_deposited || 0) * BRAND_CONFIG.referral_commission / 100), 0) || 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      showToast('Referral link copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Copy failed', 'error');
    }
  };

  return (
    <div>
      <div className="ref-card" style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 10, opacity: 0.4, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>Referral Earnings</p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 36, letterSpacing: '-0.04em', marginBottom: 4, position: 'relative', zIndex: 1 }}>{fmt(earnings)}</p>
        <p style={{ fontSize: 11, opacity: 0.45, fontFamily: 'var(--font-mono)' }}>{referrals?.length || 0} referrals · {BRAND_CONFIG.referral_commission}% commission</p>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>Your Code</p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 12 }}>
          <code style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)' }}>{user?.referral_code}</code>
          <button onClick={handleCopy} className={`btn btn-ghost`} style={{ padding: '6px 12px', fontSize: 12, gap: 5 }}>
            <Icon name={copied ? 'check' : 'copy'} size={13} color={copied ? 'var(--green)' : undefined} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <button onClick={handleCopy} className="btn btn-primary btn-full" style={{ gap: 8 }}>
          <Icon name="link" size={13} color="inherit" /> Share Referral Link
        </button>
      </div>

      <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '16px 18px', marginBottom: 20, border: '1px solid var(--border)' }}>
        <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>How it works</p>
        {[
          { step: '01', text: 'Share your unique referral link' },
          { step: '02', text: 'Friend signs up → you earn $10 bonus' },
          { step: '03', text: `Friend deposits → you earn ${BRAND_CONFIG.referral_commission}% commission` },
        ].map(r => (
          <div key={r.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ width: 28, height: 20, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>{r.step}</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.4 }}>{r.text}</p>
          </div>
        ))}
      </div>

      {referrals?.length > 0 && (
        <>
          <p className="section-title">Referrals</p>
          {referrals.map(r => (
            <div key={r.id || r.telegram_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="avatar" style={{ fontSize: 12 }}>{initials(r.first_name)}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em' }}>{r.first_name}</p>
                <p style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>Joined {fmtDateShort(r.created_at || r.join_date)}</p>
              </div>
              <span className="badge badge-green" style={{ fontFamily: 'var(--font-mono)' }}>+${((r.total_deposited || 0) * BRAND_CONFIG.referral_commission / 100).toFixed(2)}</span>
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

  const txIconMap = { deposit: '↓', withdrawal: '↑', investment: '⬡', profit_payout: '◆', referral_bonus: '◇' };
  const txColorMap = {
    deposit: 'var(--green-soft)',
    profit_payout: 'var(--green-soft)',
    withdrawal: 'var(--surface2)',
    investment: 'var(--accent-soft)',
    referral_bonus: 'var(--purple-soft)',
  };

  if (all.length === 0) return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '-0.03em', marginBottom: 20 }}>History</h2>
      <div className="empty-state"><div className="empty-icon">◻</div><p style={{ fontSize: 14, fontWeight: 500 }}>No transactions yet.</p></div>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '-0.03em', marginBottom: 20 }}>History</h2>
      <div className="card" style={{ padding: '4px 16px 0' }}>
        {all.map((tx, i) => (
          <div key={i} className="tx-item">
            <div className="tx-icon" style={{ background: txColorMap[tx.type] || 'var(--surface2)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>
              {txIconMap[tx.type] || '·'}
            </div>
            <div className="tx-info">
              <p className="tx-name" style={{ textTransform: 'capitalize' }}>{tx.type?.replace(/_/g, ' ')}</p>
              <p className="tx-date">{fmtDate(tx.created_at)}</p>
              {tx.status === 'pending' && <span className="badge badge-gold" style={{ marginTop: 4, fontFamily: 'var(--font-mono)' }}>Pending</span>}
            </div>
            <div className="tx-amount" style={{ color: tx.type === 'withdrawal' || tx.type === 'investment' ? 'var(--text2)' : 'var(--green)' }}>
              {tx.type === 'withdrawal' || tx.type === 'investment' ? '−' : '+'}{fmt(tx.amount_usd || tx.amount)}
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
    const statusMap = {
      pending: { badge: 'badge-gold', label: 'Under Review', icon: '◷', desc: 'Your documents are being reviewed. This usually takes 1-2 business days.' },
      verified: { badge: 'badge-green', label: 'Verified', icon: '◆', desc: 'Your identity has been verified successfully.' },
      rejected: { badge: 'badge-red', label: 'Rejected', icon: '◇', desc: submission.rejection_reason || 'Please resubmit with clearer documents.' },
    };
    const s = statusMap[submission.status] || statusMap.pending;
    return (
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '-0.03em', marginBottom: 20 }}>KYC Verification</h2>
        <div className="card">
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 14, fontFamily: 'var(--font-mono)' }}>{s.icon}</div>
            <span className={`badge ${s.badge}`} style={{ marginBottom: 12, fontFamily: 'var(--font-mono)', fontSize: 12, padding: '4px 12px' }}>{s.label}</span>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 10, lineHeight: 1.6, maxWidth: 280, margin: '12px auto 0' }}>{s.desc}</p>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 12, fontFamily: 'var(--font-mono)' }}>Submitted {fmtDate(submission.created_at)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '-0.03em', marginBottom: 6 }}>KYC Verification</h2>
      <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24 }}>Verify your identity to unlock all platform features.</p>
      <form onSubmit={handleSubmit}>
        <InputField label="Full Legal Name" value={fullName} onChange={setFullName} required />
        <InputField label="ID / Passport Number" value={idNumber} onChange={setIdNumber} required />
        <div className="input-group">
          <label className="input-label">ID Document Photo</label>
          <div style={{ background: 'var(--surface2)', border: '1.5px dashed var(--border2)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
            <input type="file" accept="image/*" onChange={e => setIdImage(e.target.files[0])} required style={{ display: 'block', width: '100%', fontSize: 13, color: 'var(--text2)' }} />
          </div>
        </div>
        <div className="input-group">
          <label className="input-label">Selfie with ID</label>
          <div style={{ background: 'var(--surface2)', border: '1.5px dashed var(--border2)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
            <input type="file" accept="image/*" onChange={e => setSelfieImage(e.target.files[0])} required style={{ display: 'block', width: '100%', fontSize: 13, color: 'var(--text2)' }} />
          </div>
        </div>
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
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '-0.03em', marginBottom: 24 }}>Settings</h2>
      <div className="card" style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>Change Password</p>
        <InputField label="Current Password" type="password" value={oldPassword} onChange={setOldPassword} />
        <InputField label="New Password" type="password" value={newPassword} onChange={setNewPassword} />
        <button onClick={updatePassword} disabled={loadingPass || !oldPassword || !newPassword} className="btn btn-primary btn-full">{loadingPass ? 'Updating...' : 'Update Password'}</button>
      </div>
      <div className="card">
        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>Payment Methods</p>
        <InputField label="M-Pesa Phone" value={mpesaPhone} onChange={setMpesaPhone} placeholder="2547XXXXXXXX" />
        <InputField label="Crypto Wallet (USDT TRC20)" value={cryptoWallet} onChange={setCryptoWallet} placeholder="T..." />
        <button onClick={updatePaymentMethods} disabled={loadingPay} className="btn btn-primary btn-full">{loadingPay ? 'Saving...' : 'Save Changes'}</button>
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
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'invest', label: 'Invest', icon: 'trending' },
    { id: 'portfolio', label: 'Portfolio', icon: 'chart' },
    { id: 'referrals', label: 'Refer', icon: 'link' },
    { id: 'history', label: 'History', icon: 'history' },
    { id: 'kyc', label: 'KYC', icon: 'shield' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className={`cl-app ${darkMode ? 'dark-mode' : ''}`}>
      {/* Header */}
      <header className="page-header">
        <div>
          <p className="header-greeting">{greeting}</p>
          <p className="header-name">{user?.first_name}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setDarkMode(!darkMode)} className="btn btn-ghost btn-icon" style={{ border: '1px solid var(--border)' }}>
            <Icon name={darkMode ? 'sun' : 'moon'} size={15} />
          </button>
          <button onClick={onLogout} className="btn btn-ghost btn-icon" style={{ border: '1px solid var(--border)' }}>
            <Icon name="logout" size={15} />
          </button>
          <div className="avatar">{initials(user?.first_name)}</div>
        </div>
      </header>

      {/* Content */}
      <div className="page-content fade-up">
        {loadingData ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div className="spinner spinner-dark" style={{ width: 24, height: 24 }} />
          </div>
        ) : (
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

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        {tabs.map(t => (
          <button key={t.id} className={`nav-item ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <Icon name={t.icon} size={20} color={tab === t.id ? 'var(--accent)' : undefined} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Modals */}
      {modal === 'deposit' && <DepositModal onClose={closeModal} onSubmit={handleDeposit} />}
      {modal === 'withdraw' && <WithdrawModal onClose={closeModal} onSubmit={handleWithdraw} wallet={wallet} />}
      {modal?.type === 'invest' && <InvestModal planId={modal.planId} onClose={closeModal} onSubmit={handleInvest} />}
    </div>
  );
}

// ============================================================================
// ADMIN — Sub-components
// ============================================================================
const FontLink = () => {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);
  return null;
};

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
      <div className="adm-empty-icon"><Icon2 size={22} /></div>
      <p className="adm-empty-title">{title}</p>
      {sub && <p className="adm-empty-sub">{sub}</p>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="adm-card" style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
        <div className="adm-skeleton" style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="adm-skeleton" style={{ height: 12, width: '55%', marginBottom: 7 }} />
          <div className="adm-skeleton" style={{ height: 10, width: '38%' }} />
        </div>
      </div>
      <div className="adm-skeleton" style={{ height: 56, borderRadius: 8 }} />
    </div>
  );
}

function DetailBox({ rows }) {
  return (
    <div className="adm-detail-box">
      {rows.map(([k, v], i) => v != null && (
        <div key={i} className="adm-detail-row">
          <span className="adm-detail-key">{k}</span>
          <span className="adm-detail-val">{v}</span>
        </div>
      ))}
    </div>
  );
}

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { id: 'users', label: 'Users', Icon: Users },
  { id: 'deposits', label: 'Deposits', Icon: ArrowDownCircle },
  { id: 'withdrawals', label: 'Withdrawals', Icon: ArrowUpCircle },
  { id: 'investments', label: 'Investments', Icon: TrendingUp },
  { id: 'kyc', label: 'KYC', Icon: ShieldCheck },
  { id: 'transactions', label: 'Transactions', Icon: History },
  { id: 'broadcast', label: 'Broadcast', Icon: Radio },
];

function makeKPICards(stats) {
  return [
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), sub: `${stats.activeUsers.toLocaleString()} active`, Icon: Users, color: '--adm-blue', bg: '--adm-blue-dim', trend: null },
    { label: 'Total Deposits', value: fmt(stats.totalDeposits), sub: 'All time', Icon: ArrowDownCircle, color: '--adm-accent', bg: '--adm-accent-dim', trend: 'up' },
    { label: 'Total Withdrawals', value: fmt(stats.totalWithdrawals), sub: 'All time', Icon: ArrowUpCircle, color: '--adm-red', bg: '--adm-red-dim', trend: null },
    { label: 'Profit Paid', value: fmt(stats.totalProfit), sub: 'To investors', Icon: DollarSign, color: '--adm-amber', bg: '--adm-amber-dim', trend: 'up' },
    { label: 'Pending Deposits', value: stats.pendingDeposits, sub: 'Awaiting review', Icon: Clock, color: '--adm-amber', bg: '--adm-amber-dim', trend: null },
    { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, sub: 'Awaiting review', Icon: RefreshCw, color: '--adm-blue', bg: '--adm-blue-dim', trend: null },
    { label: 'Active Investments', value: stats.activeInvestments, sub: 'Running plans', Icon: BarChart3, color: '--adm-green', bg: '--adm-green-dim', trend: 'up' },
    { label: 'Pending KYC', value: stats.pendingKYC, sub: 'Needs review', Icon: ShieldCheck, color: '--adm-purple', bg: '--adm-purple-dim', trend: null },
  ];
}

// ============================================================================
// ADMIN DASHBOARD
// ============================================================================
function AdminDashboard({ darkMode, setDarkMode, onLogout, showToast }) {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, totalDeposits: 0, totalWithdrawals: 0, totalProfit: 0, pendingDeposits: 0, pendingWithdrawals: 0, activeInvestments: 0, pendingKYC: 0 });
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, depRes, wdRes, kycRes, invRes, txRes] = await Promise.all([
        API.get('/admin/stats'), API.get('/admin/users'), API.get('/admin/deposits/pending'),
        API.get('/admin/withdrawals/pending'), API.get('/admin/kyc/pending'),
        API.get('/admin/investments'), API.get('/admin/transactions'),
      ]);
      setStats(statsRes.data); setUsers(usersRes.data); setFilteredUsers(usersRes.data);
      setPendingDeposits(depRes.data); setPendingWithdrawals(wdRes.data); setPendingKYC(kycRes.data);
      setAllInvestments(invRes.data || []); setAllTransactions(txRes.data || []);
    } catch (err) {
      showToast('Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchAdminData(); }, [fetchAdminData]);

  useEffect(() => {
    if (userSearch.trim()) {
      setFilteredUsers(users.filter(u => u.first_name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()) || u.phone?.includes(userSearch)));
    } else {
      setFilteredUsers(users);
    }
  }, [userSearch, users]);

  const approveDeposit = async (id) => { try { await API.put(`/admin/deposits/${id}/approve`); showToast('Deposit approved', 'success'); fetchAdminData(); } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error'); } };
  const rejectDeposit = async (id) => { try { await API.put(`/admin/deposits/${id}/reject`); showToast('Deposit rejected', 'info'); fetchAdminData(); } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error'); } };
  const approveWithdrawal = async (id) => { try { await API.put(`/admin/withdrawals/${id}/approve`); showToast('Withdrawal approved', 'success'); fetchAdminData(); } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error'); } };
  const rejectWithdrawal = async (id) => { try { await API.put(`/admin/withdrawals/${id}/reject`); showToast('Withdrawal rejected and refunded', 'info'); fetchAdminData(); } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error'); } };
  const banUser = async (id) => { try { await API.put(`/admin/users/${id}/ban`); showToast('User suspended', 'success'); fetchAdminData(); } catch (err) { showToast('Failed', 'error'); } };
  const unbanUser = async (id) => { try { await API.put(`/admin/users/${id}/unban`); showToast('User reactivated', 'success'); fetchAdminData(); } catch (err) { showToast('Failed', 'error'); } };
  const editUserBalance = async (userId) => {
    if (!editBalanceAmount) return;
    try { await API.put(`/admin/users/${userId}/balance`, { balance: parseFloat(editBalanceAmount) }); showToast('Balance updated', 'success'); setEditBalanceUserId(null); setEditBalanceAmount(''); fetchAdminData(); }
    catch (err) { showToast('Failed to update balance', 'error'); }
  };
  const approveKYC = async (id) => { try { await API.put(`/admin/kyc/${id}/approve`); showToast('KYC approved', 'success'); fetchAdminData(); } catch (err) { showToast('Failed', 'error'); } };
  const rejectKYC = async (id, reason) => {
    try { await API.put(`/admin/kyc/${id}/reject`, { reason }); showToast('KYC rejected', 'info'); setShowRejectModal(null); setRejectReason(''); fetchAdminData(); }
    catch (err) { showToast('Failed', 'error'); }
  };
  const sendBroadcast = async () => {
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) { showToast('Subject and message are required', 'error'); return; }
    setBroadcastLoading(true);
    try { const res = await API.post('/admin/broadcast', { subject: broadcastSubject, message: broadcastMessage }); showToast(res.data.message, 'success'); setBroadcastSubject(''); setBroadcastMessage(''); }
    catch (err) { showToast('Failed to send broadcast', 'error'); }
    finally { setBroadcastLoading(false); }
  };

  const kpiCards = makeKPICards(stats);
  const activeNavItem = NAV_ITEMS.find(n => n.id === tab);
  const badges = { deposits: stats.pendingDeposits, withdrawals: stats.pendingWithdrawals, kyc: stats.pendingKYC };

  if (loading) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <FontLink />
        <div className="adm-root">
          <div className="adm-sidebar">
            <div className="adm-logo">
              <div className="adm-logo-icon"><Zap size={14} color="#1a1200" /></div>
              <div className="adm-logo-text"><span className="adm-logo-title">CryptoLegacy</span><span className="adm-logo-badge">Admin Panel</span></div>
            </div>
          </div>
          <div className="adm-main">
            <div className="adm-header" />
            <div className="adm-content">
              <div className="adm-kpi-grid">
                {Array(8).fill(0).map((_, i) => (
                  <div key={i} className="adm-kpi">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div className="adm-skeleton" style={{ width: 36, height: 36, borderRadius: 9 }} />
                      <div className="adm-skeleton" style={{ width: 40, height: 20, borderRadius: 20 }} />
                    </div>
                    <div className="adm-skeleton" style={{ height: 28, width: '60%', marginBottom: 7 }} />
                    <div className="adm-skeleton" style={{ height: 11, width: '40%' }} />
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
      <style>{GLOBAL_CSS}</style>
      <FontLink />

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="adm-modal-overlay" onClick={() => { setShowRejectModal(null); setRejectReason(''); }}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <p className="adm-modal-title">Reject KYC</p>
            <p className="adm-modal-sub">Provide a clear reason — it will be sent to the user.</p>
            <div className="adm-input-group">
              <label className="adm-label">Rejection Reason</label>
              <textarea className="adm-input" rows={3} placeholder="e.g. ID document is unclear or expired..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} autoFocus />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="adm-btn adm-btn-danger adm-btn-full" onClick={() => rejectKYC(showRejectModal, rejectReason)} disabled={!rejectReason.trim()}>
                <XCircle size={14} /> Confirm Rejection
              </button>
              <button className="adm-btn adm-btn-ghost" onClick={() => { setShowRejectModal(null); setRejectReason(''); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="adm-root">
        {/* Sidebar */}
        <aside className={`adm-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <button className="adm-collapse-btn" onClick={() => setSidebarCollapsed(v => !v)} title={sidebarCollapsed ? 'Expand' : 'Collapse'}>
            {sidebarCollapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
          </button>
          <div className="adm-logo">
            <div className="adm-logo-icon"><Zap size={14} color="#1a1200" /></div>
            {!sidebarCollapsed && (
              <div className="adm-logo-text">
                <span className="adm-logo-title">CryptoLegacy</span>
                <span className="adm-logo-badge">Admin Panel</span>
              </div>
            )}
          </div>
          <nav className="adm-nav">
            {!sidebarCollapsed && <p className="adm-section-title" style={{ padding: '8px 2px 4px', fontSize: 8, letterSpacing: 1.5 }}>Navigation</p>}
            {NAV_ITEMS.map(({ id, label, Icon: NavIcon }) => (
              <button key={id} className={`adm-nav-item ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)} title={sidebarCollapsed ? label : undefined}>
                <NavIcon size={16} className="adm-nav-icon" />
                {!sidebarCollapsed && <span className="adm-nav-label">{label}</span>}
                {!sidebarCollapsed && badges[id] > 0 && <span className="adm-badge">{badges[id]}</span>}
                {sidebarCollapsed && badges[id] > 0 && <span style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: '50%', background: 'var(--adm-red)', border: '1.5px solid var(--adm-bg)' }} />}
              </button>
            ))}
          </nav>
          <div className="adm-sidebar-footer">
            <button className="adm-nav-item" onClick={() => setDarkMode(!darkMode)} title="Toggle theme">
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              {!sidebarCollapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>
            <button className="adm-nav-item" onClick={onLogout} style={{ color: 'var(--adm-red)' }} title="Sign out">
              <LogOut size={16} />
              {!sidebarCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className={`adm-main ${sidebarCollapsed ? 'collapsed' : ''}`}>
          {/* Header */}
          <header className="adm-header">
            <div className="adm-search">
              <Search size={13} className="adm-search-icon" />
              <input placeholder="Search anything..." value={headerSearch} onChange={e => setHeaderSearch(e.target.value)} />
            </div>
            <div className="adm-header-actions">
              <button className="adm-icon-btn" onClick={fetchAdminData} title="Refresh"><RefreshCw size={14} /></button>
              <button className="adm-icon-btn" title="Notifications">
                <Bell size={14} />
                {(stats.pendingDeposits + stats.pendingWithdrawals + stats.pendingKYC) > 0 && <span className="adm-notification-dot" />}
              </button>
              <div className="adm-avatar-btn" onClick={onLogout} title="Sign out">
                <div className="adm-avatar">{initials(user?.first_name || 'AD')}</div>
                <span className="adm-avatar-name">{user?.first_name || 'Admin'}</span>
                <ChevronDown size={11} color="var(--adm-text3)" />
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="adm-content">
            <div className="adm-page-header">
              <div>
                <h1 className="adm-page-title">{activeNavItem?.label || 'Admin'}</h1>
                <p className="adm-page-sub">
                  {tab === 'overview' ? `Welcome back, ${user?.first_name}` :
                   tab === 'users' ? `${filteredUsers.length} user${filteredUsers.length !== 1 ? 's' : ''} total` :
                   tab === 'deposits' ? `${pendingDeposits.length} pending approval` :
                   tab === 'withdrawals' ? `${pendingWithdrawals.length} pending approval` :
                   tab === 'kyc' ? `${pendingKYC.length} awaiting review` :
                   tab === 'investments' ? `${allInvestments.filter(i => i.status === 'active').length} active` :
                   tab === 'transactions' ? `${allTransactions.length} total` :
                   'Send a message to all active users'}
                </p>
              </div>
              <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={fetchAdminData}>
                <RefreshCw size={12} /> Refresh
              </button>
            </div>

            {/* Mobile tab strip */}
            <div className="adm-mobile-tabs">
              {NAV_ITEMS.map(({ id, label, Icon: NavIcon }) => (
                <button key={id} className={`adm-mobile-tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
                  <NavIcon size={12} />{label}
                  {badges[id] > 0 && <span className="adm-mobile-tab-badge">{badges[id]}</span>}
                </button>
              ))}
            </div>

            {/* ── OVERVIEW ── */}
            {tab === 'overview' && (
              <div className="adm-fade-up">
                <div className="adm-kpi-grid">
                  {kpiCards.map(card => (
                    <div key={card.label} className="adm-kpi" style={{ '--kpi-accent': `var(${card.color})`, '--kpi-bg': `var(${card.bg})` }}>
                      <div className="adm-kpi-header">
                        <div className="adm-kpi-icon-wrap"><card.Icon size={16} /></div>
                        {card.trend === 'up' ? <span className="adm-kpi-trend up"><ArrowUpRight size={10} />+12%</span> : <span className="adm-kpi-trend neutral">—</span>}
                      </div>
                      <div className="adm-kpi-value">{card.value}</div>
                      <div className="adm-kpi-label">{card.label}</div>
                      <div className="adm-kpi-sub">{card.sub}</div>
                    </div>
                  ))}
                </div>

                {(stats.pendingDeposits > 0 || stats.pendingWithdrawals > 0 || stats.pendingKYC > 0) && (
                  <div className="adm-card" style={{ marginBottom: 18 }}>
                    <div className="adm-card-header">
                      <span className="adm-card-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <AlertTriangle size={13} color="var(--adm-amber)" /> Pending Actions
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {stats.pendingDeposits > 0 && (
                        <div className="adm-alert" style={{ background: 'var(--adm-amber-dim)', borderColor: 'rgba(245,158,11,0.2)', color: 'var(--adm-text)' }}>
                          <div className="adm-alert-left"><Clock size={14} color="var(--adm-amber)" /><span>{stats.pendingDeposits} deposit{stats.pendingDeposits > 1 ? 's' : ''} awaiting approval</span></div>
                          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => setTab('deposits')}>Review <ChevronRight size={11} /></button>
                        </div>
                      )}
                      {stats.pendingWithdrawals > 0 && (
                        <div className="adm-alert" style={{ background: 'var(--adm-blue-dim)', borderColor: 'rgba(79,133,246,0.2)', color: 'var(--adm-text)' }}>
                          <div className="adm-alert-left"><RefreshCw size={14} color="var(--adm-blue)" /><span>{stats.pendingWithdrawals} withdrawal{stats.pendingWithdrawals > 1 ? 's' : ''} awaiting approval</span></div>
                          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => setTab('withdrawals')}>Review <ChevronRight size={11} /></button>
                        </div>
                      )}
                      {stats.pendingKYC > 0 && (
                        <div className="adm-alert" style={{ background: 'var(--adm-purple-dim)', borderColor: 'rgba(167,139,250,0.2)', color: 'var(--adm-text)' }}>
                          <div className="adm-alert-left"><ShieldCheck size={14} color="var(--adm-purple)" /><span>{stats.pendingKYC} KYC submission{stats.pendingKYC > 1 ? 's' : ''} awaiting review</span></div>
                          <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => setTab('kyc')}>Review <ChevronRight size={11} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="adm-card">
                  <div className="adm-card-header">
                    <span className="adm-card-title">Recent Transactions</span>
                    <button className="adm-card-action" onClick={() => setTab('transactions')}>View all <ChevronRight size={12} /></button>
                  </div>
                  {allTransactions.length === 0 ? (
                    <EmptyState icon={History} title="No transactions yet" sub="Activity will appear here once users start transacting." />
                  ) : (
                    allTransactions.slice(0, 10).map(tx => {
                      const u = users.find(u => u.id === tx.user_id);
                      const isPos = tx.type?.includes('deposit') || tx.type?.includes('profit') || tx.type?.includes('referral') || tx.type?.includes('bonus');
                      return (
                        <div key={tx.id} className="adm-tx-row">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="adm-avatar" style={{ borderRadius: 8 }}>{initials(u?.first_name)}</div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--adm-text)', textTransform: 'capitalize' }}>{tx.type?.replace(/_/g, ' ')}</p>
                              <p style={{ fontSize: 11, color: 'var(--adm-text3)', marginTop: 1, fontFamily: 'var(--adm-font-mono)' }}>{u?.first_name || 'Unknown'} · {fmtDate(tx.created_at)}</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <StatusBadge status={tx.status} />
                            <span style={{ fontFamily: 'var(--adm-font-mono)', fontSize: 13, fontWeight: 600, color: isPos ? 'var(--adm-green)' : 'var(--adm-text)', minWidth: 80, textAlign: 'right' }}>
                              {isPos ? '+' : '−'}{fmt(Math.abs(tx.amount))}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ── USERS ── */}
            {tab === 'users' && (
              <div className="adm-fade-up">
                <div style={{ marginBottom: 16, maxWidth: 420 }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--adm-text3)', pointerEvents: 'none' }} />
                    <input className="adm-input" style={{ paddingLeft: 34 }} placeholder="Search by name, email or phone..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                  </div>
                </div>
                {filteredUsers.length === 0 ? (
                  <EmptyState icon={Users} title="No users found" sub="Try adjusting your search query." />
                ) : (
                  filteredUsers.map(u => (
                    <div key={u.id} className="adm-user-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                        <div className="adm-avatar adm-avatar-xl">{initials(u.first_name)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--adm-text)' }}>{u.first_name}</span>
                            {!u.is_active && <StatusBadge status="suspended" />}
                            {u.is_admin && <StatusBadge status="admin" />}
                            {u.kyc_status === 'verified' && <StatusBadge status="verified" />}
                            {u.kyc_status === 'pending' && <StatusBadge status="kyc_pending" />}
                          </div>
                          <p style={{ fontSize: 12, color: 'var(--adm-text3)', fontFamily: 'var(--adm-font-mono)' }}>{u.email}</p>
                          <p style={{ fontSize: 11, color: 'var(--adm-text3)', marginTop: 1, fontFamily: 'var(--adm-font-mono)' }}>{u.phone} · Joined {fmtDateShort(u.created_at)}</p>
                        </div>
                      </div>
                      <div className="adm-mini-grid">
                        <div><p className="adm-mini-stat-label">Balance</p><p className="adm-mini-stat-val" style={{ color: 'var(--adm-accent)' }}>{fmt(u.balance || 0)}</p></div>
                        <div><p className="adm-mini-stat-label">Deposited</p><p className="adm-mini-stat-val">{fmt(u.total_deposited || 0)}</p></div>
                        <div><p className="adm-mini-stat-label">Profit</p><p className="adm-mini-stat-val" style={{ color: 'var(--adm-green)' }}>{fmt(u.total_profit || 0)}</p></div>
                        <div><p className="adm-mini-stat-label">Referrals</p><p className="adm-mini-stat-val">{u.referrals_count || 0}</p></div>
                      </div>
                      {editBalanceUserId === u.id && (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
                          <div style={{ flex: 1, position: 'relative' }}>
                            <Wallet size={12} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--adm-text3)' }} />
                            <input type="number" className="adm-input" style={{ paddingLeft: 30 }} value={editBalanceAmount} onChange={e => setEditBalanceAmount(e.target.value)} placeholder="New balance" autoFocus />
                          </div>
                          <button onClick={() => editUserBalance(u.id)} className="adm-btn adm-btn-success adm-btn-sm"><CheckCircle2 size={12} /> Save</button>
                          <button onClick={() => { setEditBalanceUserId(null); setEditBalanceAmount(''); }} className="adm-btn adm-btn-ghost adm-btn-sm">Cancel</button>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                        {!u.is_admin && (
                          u.is_active
                            ? <button onClick={() => banUser(u.id)} className="adm-btn adm-btn-danger adm-btn-sm"><UserX size={12} /> Suspend</button>
                            : <button onClick={() => unbanUser(u.id)} className="adm-btn adm-btn-success adm-btn-sm"><UserCheck size={12} /> Reactivate</button>
                        )}
                        {editBalanceUserId !== u.id && (
                          <button onClick={() => { setEditBalanceUserId(u.id); setEditBalanceAmount((u.balance || 0).toFixed(2)); }} className="adm-btn adm-btn-ghost adm-btn-sm">
                            <Edit3 size={12} /> Edit Balance
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── DEPOSITS ── */}
            {tab === 'deposits' && (
              <div className="adm-fade-up">
                {pendingDeposits.length === 0 ? (
                  <div className="adm-card"><EmptyState icon={CheckCircle2} title="All clear" sub="No deposits pending approval." /></div>
                ) : (
                  pendingDeposits.map(d => {
                    const u = users.find(u => u.id === d.user_id);
                    return (
                      <div key={d.id} className="adm-action-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div className="adm-avatar adm-avatar-lg">{initials(u?.first_name || '?')}</div>
                            <div>
                              <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--adm-text)' }}>{u?.first_name || 'Unknown'}</p>
                              <p style={{ fontSize: 12, color: 'var(--adm-text3)', fontFamily: 'var(--adm-font-mono)' }}>{u?.email}</p>
                              <p style={{ fontSize: 11, color: 'var(--adm-text3)', fontFamily: 'var(--adm-font-mono)' }}>{fmtDate(d.created_at)}</p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontFamily: 'var(--adm-font-display)', fontSize: 26, color: 'var(--adm-accent)', letterSpacing: '-0.03em' }}>{fmt(d.amount_usd)}</p>
                            <StatusBadge status="pending" />
                          </div>
                        </div>
                        <DetailBox rows={[
                          ['Method', <span style={{ textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--adm-font-mono)', fontSize: 11 }}>{d.method}</span>],
                          ['Transaction Code', <span className="adm-mono">{d.transaction_code}</span>],
                          d.phone_number && ['Phone', <span style={{ fontFamily: 'var(--adm-font-mono)', fontSize: 12 }}>{d.phone_number}</span>],
                          d.amount_kes && ['KES Amount', <span style={{ fontFamily: 'var(--adm-font-mono)', fontSize: 12 }}>{`KES ${d.amount_kes?.toLocaleString()}`}</span>],
                        ].filter(Boolean)} />
                        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                          <button onClick={() => approveDeposit(d.id)} className="adm-btn adm-btn-success adm-btn-full"><CheckCircle2 size={14} /> Approve</button>
                          <button onClick={() => rejectDeposit(d.id)} className="adm-btn adm-btn-danger adm-btn-full"><XCircle size={14} /> Reject</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── WITHDRAWALS ── */}
            {tab === 'withdrawals' && (
              <div className="adm-fade-up">
                {pendingWithdrawals.length === 0 ? (
                  <div className="adm-card"><EmptyState icon={CheckCircle2} title="All clear" sub="No withdrawals pending approval." /></div>
                ) : (
                  pendingWithdrawals.map(w => {
                    const u = users.find(u => u.id === w.user_id);
                    return (
                      <div key={w.id} className="adm-action-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div className="adm-avatar adm-avatar-lg">{initials(u?.first_name || '?')}</div>
                            <div>
                              <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--adm-text)' }}>{u?.first_name || 'Unknown'}</p>
                              <p style={{ fontSize: 12, color: 'var(--adm-text3)', fontFamily: 'var(--adm-font-mono)' }}>{u?.email}</p>
                              <p style={{ fontSize: 11, color: 'var(--adm-text3)', fontFamily: 'var(--adm-font-mono)' }}>{fmtDate(w.created_at)}</p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontFamily: 'var(--adm-font-display)', fontSize: 26, color: 'var(--adm-text)', letterSpacing: '-0.03em' }}>{fmt(w.amount_usd)}</p>
                            <p style={{ fontSize: 11, color: 'var(--adm-green)', fontFamily: 'var(--adm-font-mono)', marginTop: 2 }}>Net {fmt(w.net_amount_usd)}</p>
                          </div>
                        </div>
                        <DetailBox rows={[
                          ['Method', <span style={{ textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--adm-font-mono)', fontSize: 11 }}>{w.method}</span>],
                          ['Destination', <span style={{ maxWidth: 220, textAlign: 'right', wordBreak: 'break-all', display: 'inline-block', fontFamily: 'var(--adm-font-mono)', fontSize: 11 }}>{w.details}</span>],
                          ['Fee (1%)', <span style={{ color: 'var(--adm-red)', fontFamily: 'var(--adm-font-mono)' }}>−{fmt(w.fee_usd)}</span>],
                          w.amount_kes && ['KES Amount', <span style={{ fontFamily: 'var(--adm-font-mono)', fontSize: 12 }}>{`KES ${w.amount_kes?.toLocaleString()}`}</span>],
                        ].filter(Boolean)} />
                        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                          <button onClick={() => approveWithdrawal(w.id)} className="adm-btn adm-btn-success adm-btn-full"><CheckCircle2 size={14} /> Approve</button>
                          <button onClick={() => rejectWithdrawal(w.id)} className="adm-btn adm-btn-danger adm-btn-full"><XCircle size={14} /> Reject & Refund</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── INVESTMENTS ── */}
            {tab === 'investments' && (
              <div className="adm-fade-up">
                <p className="adm-section-title"><Activity size={11} /> Active ({allInvestments.filter(i => i.status === 'active').length})</p>
                {allInvestments.filter(i => i.status === 'active').length === 0 ? (
                  <div className="adm-card" style={{ marginBottom: 20 }}><EmptyState icon={TrendingUp} title="No active investments" /></div>
                ) : (
                  allInvestments.filter(i => i.status === 'active').map(inv => {
                    const u = users.find(u => u.id === inv.user_id);
                    const plan = INVESTMENT_PLANS?.[inv.plan_id];
                    const progress = Math.min(100, ((new Date() - new Date(inv.start_date)) / (new Date(inv.end_date) - new Date(inv.start_date))) * 100);
                    return (
                      <div key={inv.id} className="adm-card" style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <div className="adm-avatar adm-avatar-lg">{initials(u?.first_name)}</div>
                            <div>
                              <p style={{ fontWeight: 600, color: 'var(--adm-text)', fontSize: 13 }}>{u?.first_name || 'Unknown'}</p>
                              <p style={{ fontSize: 11, color: 'var(--adm-text3)', fontFamily: 'var(--adm-font-mono)' }}>{inv.plan_name}</p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontFamily: 'var(--adm-font-display)', fontSize: 19, color: 'var(--adm-text)', letterSpacing: '-0.02em' }}>{fmt(inv.amount)}</p>
                            <StatusBadge status="active" />
                          </div>
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--adm-text3)', marginBottom: 5, fontFamily: 'var(--adm-font-mono)' }}>
                            <span>Progress</span><span style={{ color: 'var(--adm-accent)' }}>{progress.toFixed(1)}%</span>
                          </div>
                          <div className="adm-progress-track"><div className="adm-progress-fill" style={{ width: `${progress}%`, background: plan?.details?.gradient || 'var(--adm-accent)' }} /></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--adm-text3)', fontFamily: 'var(--adm-font-mono)' }}>
                          <span>Start: <strong style={{ color: 'var(--adm-text2)' }}>{fmtDateShort(inv.start_date)}</strong></span>
                          <span>End: <strong style={{ color: 'var(--adm-text2)' }}>{fmtDateShort(inv.end_date)}</strong></span>
                          <span>Paid: <strong style={{ color: 'var(--adm-green)' }}>{fmt(inv.total_paid)}</strong></span>
                        </div>
                      </div>
                    );
                  })
                )}
                <p className="adm-section-title" style={{ marginTop: 24 }}><History size={11} /> Completed ({allInvestments.filter(i => i.status === 'completed').length})</p>
                {allInvestments.filter(i => i.status === 'completed').length === 0 ? (
                  <div className="adm-card"><EmptyState icon={CheckCircle2} title="No completed investments" /></div>
                ) : (
                  allInvestments.filter(i => i.status === 'completed').slice(0, 20).map(inv => {
                    const u = users.find(u => u.id === inv.user_id);
                    return (
                      <div key={inv.id} className="adm-card" style={{ marginBottom: 8, opacity: 0.65 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <div className="adm-avatar" style={{ borderRadius: 8 }}>{initials(u?.first_name)}</div>
                            <div>
                              <p style={{ fontWeight: 500, color: 'var(--adm-text)', fontSize: 13 }}>{u?.first_name || 'Unknown'}</p>
                              <p style={{ fontSize: 11, color: 'var(--adm-text3)', fontFamily: 'var(--adm-font-mono)' }}>{inv.plan_name} · {fmt(inv.amount)}</p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ color: 'var(--adm-green)', fontSize: 13, fontWeight: 600, fontFamily: 'var(--adm-font-mono)' }}>{fmt(inv.total_paid)} earned</p>
                            <StatusBadge status="completed" />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── KYC ── */}
            {tab === 'kyc' && (
              <div className="adm-fade-up">
                {pendingKYC.length === 0 ? (
                  <div className="adm-card"><EmptyState icon={ShieldCheck} title="All verified" sub="No KYC submissions pending review." /></div>
                ) : (
                  pendingKYC.map(k => {
                    const u = users.find(u => u.id === k.user_id);
                    return (
                      <div key={k.id} className="adm-action-card">
                        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
                          <div className="adm-avatar adm-avatar-xl">{initials(k.full_name)}</div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--adm-text)', marginBottom: 3 }}>{k.full_name}</p>
                            <p style={{ fontSize: 12, color: 'var(--adm-text3)', fontFamily: 'var(--adm-font-mono)' }}>ID: {k.id_number}</p>
                            <p style={{ fontSize: 12, color: 'var(--adm-text3)', fontFamily: 'var(--adm-font-mono)' }}>{u?.first_name} · {u?.email}</p>
                            <p style={{ fontSize: 11, color: 'var(--adm-text3)', marginTop: 2, fontFamily: 'var(--adm-font-mono)' }}>Submitted {fmtDate(k.created_at)}</p>
                          </div>
                          <StatusBadge status="pending" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                          {[
                            { label: 'ID Document', sub: 'View file ↗', url: k.id_image_url, Icon: FileText, color: 'var(--adm-accent)' },
                            { label: 'Selfie', sub: 'View photo ↗', url: k.selfie_image_url, Icon: Camera, color: 'var(--adm-blue)' },
                          ].map(doc => (
                            <a key={doc.label} href={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}/${doc.url}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                              <div style={{ background: 'var(--adm-surface2)', border: '1px solid var(--adm-border)', borderRadius: 9, padding: '10px 13px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'border-color 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--adm-accent)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--adm-border)'}>
                                <doc.Icon size={14} color={doc.color} />
                                <div>
                                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--adm-text)' }}>{doc.label}</p>
                                  <p style={{ fontSize: 10, color: doc.color, fontFamily: 'var(--adm-font-mono)' }}>{doc.sub}</p>
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button onClick={() => approveKYC(k.id)} className="adm-btn adm-btn-success adm-btn-full"><CheckCircle2 size={14} /> Approve KYC</button>
                          <button onClick={() => setShowRejectModal(k.id)} className="adm-btn adm-btn-danger adm-btn-full"><XCircle size={14} /> Reject KYC</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── TRANSACTIONS ── */}
            {tab === 'transactions' && (
              <div className="adm-fade-up">
                {allTransactions.length === 0 ? (
                  <div className="adm-card"><EmptyState icon={History} title="No transactions yet" sub="Platform transactions will appear here." /></div>
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
                                  <div className="adm-avatar" style={{ width: 26, height: 26, borderRadius: 7, fontSize: 10 }}>{initials(u?.first_name)}</div>
                                  <span style={{ color: 'var(--adm-text)', fontWeight: 500 }}>{u?.first_name || 'Unknown'}</span>
                                </div>
                              </td>
                              <td style={{ textTransform: 'capitalize', color: 'var(--adm-text)' }}>{tx.type?.replace(/_/g, ' ')}</td>
                              <td>
                                <span style={{ fontFamily: 'var(--adm-font-mono)', fontWeight: 600, fontSize: 13, color: isPos ? 'var(--adm-green)' : 'var(--adm-text)' }}>
                                  {isPos ? '+' : '−'}{fmt(Math.abs(tx.amount))}
                                </span>
                              </td>
                              <td><StatusBadge status={tx.status} /></td>
                              <td style={{ fontSize: 11, whiteSpace: 'nowrap', fontFamily: 'var(--adm-font-mono)', color: 'var(--adm-text3)' }}>{fmtDate(tx.created_at)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── BROADCAST ── */}
            {tab === 'broadcast' && (
              <div className="adm-fade-up" style={{ maxWidth: 560 }}>
                <div className="adm-card">
                  <div className="adm-card-header" style={{ marginBottom: 18 }}>
                    <span className="adm-card-title" style={{ fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Radio size={15} color="var(--adm-accent)" /> Broadcast Message
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--adm-text3)', background: 'var(--adm-surface2)', padding: '3px 9px', borderRadius: 20, border: '1px solid var(--adm-border)', fontFamily: 'var(--adm-font-mono)' }}>
                      {stats.activeUsers.toLocaleString()} recipients
                    </span>
                  </div>
                  <div className="adm-input-group">
                    <label className="adm-label">Subject Line</label>
                    <input className="adm-input" placeholder="Important update about your account..." value={broadcastSubject} onChange={e => setBroadcastSubject(e.target.value)} />
                  </div>
                  <div className="adm-input-group">
                    <label className="adm-label">Message Body</label>
                    <textarea className="adm-input" rows={7} placeholder="Write your broadcast message here..." value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} style={{ resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button onClick={sendBroadcast} disabled={broadcastLoading || !broadcastSubject.trim() || !broadcastMessage.trim()} className="adm-btn adm-btn-primary">
                      {broadcastLoading ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</> : <><Send size={13} /> Send to All Users</>}
                    </button>
                    {(broadcastSubject || broadcastMessage) && (
                      <button onClick={() => { setBroadcastSubject(''); setBroadcastMessage(''); }} className="adm-btn adm-btn-ghost">
                        <Trash2 size={12} /> Clear
                      </button>
                    )}
                  </div>
                  <div className="adm-info-box">
                    <p className="adm-info-box-title"><Zap size={12} color="var(--adm-accent)" /> Guidelines</p>
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

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    document.documentElement.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

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
