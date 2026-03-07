import { useState, useEffect, useCallback } from 'react';
import DataInput from './components/DataInput';
import DataTable from './components/DataTable';
import DownloadButton from './components/DownloadButton';
import Toast from './components/Toast';
import type { ToastMessage, ToastType } from './components/Toast';
import { parseRawData } from './services/dataProcessor';
import { translateBatch } from './services/translator';
import { classifyItems, extractAttributes } from './services/classifier';
import { getExchangeRate } from './services/currency';
import type { OrderItem } from './types';
import {
  Languages,
  Key,
  Brain,
  FileText,
  Zap,
  Menu,
  X,
  ChevronRight,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Palette,
  Sparkles,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   Types & constants
═══════════════════════════════════════════════════════ */
type Theme = 'default' | 'festive' | 'ocean' | 'petal';

const THEMES: { id: Theme; label: string; color: string }[] = [
  { id: 'default', label: 'Greige', color: '#A3A199' },
  { id: 'festive', label: 'Festive', color: '#D43F3F' },
  { id: 'ocean', label: 'Ocean', color: '#3F9AD4' },
  { id: 'petal', label: 'Petal', color: '#D43F9A' },
];

const NAV_ITEMS = [{ id: 'console', label: 'Console' }];

let toastCounter = 0;

/* ═══════════════════════════════════════════════════════
   App
═══════════════════════════════════════════════════════ */
function App() {
  /* ── Data state ────────────────────────────────── */
  const [data, setData] = useState<OrderItem[]>([]);
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem('tl_openai_key') || import.meta.env.VITE_OPENAI_API_KEY || '');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingType, setProcessingType] = useState<'translate' | 'classify' | 'extract' | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeNav, setActiveNav] = useState('console');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(0.14);

  /* ── UI state ──────────────────────────────────── */
  const [isDark, setIsDark] = useState(() => localStorage.getItem('tl_dark') === 'true');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('tl_theme') as Theme) || 'default');
  // Collapse API key card when key already saved
  const [keysExpanded, setKeysExpanded] = useState(() => !localStorage.getItem('tl_openai_key'));
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  /* ── Sync → DOM / storage ──────────────────────── */
  useEffect(() => {
    document.documentElement.setAttribute('data-dark', isDark ? 'true' : 'false');
    localStorage.setItem('tl_dark', isDark ? 'true' : 'false');
  }, [isDark]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tl_theme', theme);
  }, [theme]);

  useEffect(() => { getExchangeRate().then(setExchangeRate); }, []);
  useEffect(() => { localStorage.setItem('tl_openai_key', openaiKey); }, [openaiKey]);

  // Close drawer on resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setDrawerOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        document.getElementById('table-search')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ── Toast helper ──────────────────────────────── */
  const addToast = useCallback((type: ToastType, title: string, description?: string, duration?: number) => {
    const id = `toast-${++toastCounter}`;
    setToasts(prev => [...prev, { id, type, title, description, duration }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /* ── Handlers ──────────────────────────────────── */
  const handleProcess = (rawData: string) => {
    try {
      const { data: parsed, errors } = parseRawData(rawData);
      if (errors.length) console.warn('Parse warnings:', errors);
      if (!parsed.length) {
        addToast('error', 'No data found', 'Check that your data is in CSV or TSV format.');
        return;
      }
      setData(parsed);
      addToast('success', `${parsed.length} items loaded`, `${new Set(parsed.map(i => i.orderNumber)).size} orders ready to process.`);
    } catch (err) {
      addToast('error', 'Parse failed', "Ensure data is properly formatted (CSV/TSV).");
      console.error(err);
    }
  };

  const handleTranslate = async () => {
    if (!openaiKey.trim()) { addToast('error', 'API key missing', 'Enter your OpenAI API key.'); return; }
    if (!data.length) { addToast('info', 'No data', 'Load order data first.'); return; }
    setIsProcessing(true); setProcessingType('translate'); setProgress(0);
    try {
      const result = await translateBatch(data, openaiKey, p => setProgress(p));
      setData(result);
      addToast('success', 'Translation complete', `${result.length} items translated.`);
    } catch {
      addToast('error', 'Translation failed', 'Check your OpenAI API key.');
    } finally { setIsProcessing(false); setProcessingType(null); setProgress(0); }
  };

  const handleClassify = async () => {
    if (!openaiKey.trim()) { addToast('error', 'API key missing', 'Enter your OpenAI API key.'); return; }
    if (!data.length) { addToast('info', 'No data', 'Load order data first.'); return; }
    setIsProcessing(true); setProcessingType('classify'); setProgress(0);
    try {
      const result = await classifyItems(data, openaiKey, p => setProgress(p));
      setData(result);
      addToast('success', 'Classification complete', `${result.length} items classified.`);
    } catch {
      addToast('error', 'Classification failed', 'Check your OpenAI API key.');
    } finally { setIsProcessing(false); setProcessingType(null); setProgress(0); }
  };

  const handleSmartProcess = async () => {
    if (!openaiKey.trim()) {
      addToast('error', 'API key missing', 'Enter your OpenAI API key.');
      return;
    }
    if (!data.length) { addToast('info', 'No data', 'Load order data first.'); return; }
    setIsProcessing(true);
    try {
      setProcessingType('translate'); setProgress(0);
      const t = await translateBatch(data, openaiKey, p => setProgress(p));
      setData(t);

      setProcessingType('classify'); setProgress(0);
      const c = await classifyItems(t, openaiKey, p => setProgress(p));
      setData(c);

      setProcessingType('extract'); setProgress(0);
      const f = await extractAttributes(c, openaiKey, p => setProgress(p));
      setData(f);

      addToast('success', 'Smart processing done!', `${f.length} items translated, classified & enriched.`, 6000);
    } catch {
      addToast('error', 'Processing failed', 'Check your API key and connection.');
    } finally { setIsProcessing(false); setProcessingType(null); setProgress(0); }
  };

  const isTranslating = isProcessing && processingType === 'translate';
  const isClassifying = isProcessing && processingType === 'classify';
  const keysConfigured = !!openaiKey;

  /* ── Progress step labels ──────────────────────── */
  const STEPS = [
    { key: 'translate', label: 'Translating' },
    { key: 'classify', label: 'Classifying' },
    { key: 'extract', label: 'Extracting' },
  ] as const;
  const curStepIdx = STEPS.findIndex(s => s.key === processingType);

  /* ══════════════════════════════════════════════════
     Render
  ══════════════════════════════════════════════════ */
  return (
    <div className="app-layout">

      {/* ══════════════════════  TOP HEADER  ══════════════════════ */}
      <header className="app-header">

        <button
          id="btn-menu-toggle"
          className="header-menu-btn"
          onClick={() => setDrawerOpen(d => !d)}
          aria-label="Open menu"
          style={{ marginRight: '0.5rem' }}
        >
          <Menu size={18} />
        </button>

        <div className="header-brand">
          <span className="brand-name">thread</span>
          <span className="brand-tagline">line</span>
        </div>

        <div className="header-divider" />

        <nav className="header-nav">
          {NAV_ITEMS.map(item => (
            <div
              key={item.id}
              id={`nav-${item.id}`}
              className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => setActiveNav(item.id)}
              role="button"
              tabIndex={0}
            >
              {item.label}
            </div>
          ))}
        </nav>

        <div className="header-controls">
          <button
            id="btn-theme-cycle"
            title={`Theme: ${THEMES.find(t => t.id === theme)?.label}`}
            onClick={() => {
              const idx = THEMES.findIndex(t => t.id === theme);
              const next = THEMES[(idx + 1) % THEMES.length];
              setTheme(next.id);
              addToast('info', `Theme: ${next.label}`, undefined, 1800);
            }}
            aria-label="Cycle theme"
          >
            <Palette size={15} />
          </button>

          <button
            id="btn-dark-toggle"
            onClick={() => setIsDark(d => !d)}
            aria-label="Toggle dark mode"
          >
            {isDark ? <Moon size={15} /> : <Sun size={15} />}
          </button>
        </div>
      </header>

      {/* ══════════════════  STICKY PROGRESS BAR  ══════════════════
           Thin 2px bar below the header; only rendered while processing */}
      {isProcessing && (
        <div style={{
          position: 'sticky',
          top: 52,
          zIndex: 150,
          height: 3,
          background: 'var(--surface-color)',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'var(--accent-color)',
            transition: 'width 0.3s ease',
            borderRadius: '0 2px 2px 0',
          }} />
        </div>
      )}

      {/* ══════════════════  MOBILE DRAWER  ══════════════════ */}
      <div className={`mobile-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
        <div className="drawer-panel">
          <div className="drawer-header">
            <div className="header-brand" style={{ gap: '0.375rem' }}>
              <span className="brand-name" style={{ fontSize: '1rem' }}>thread</span>
              <span className="brand-tagline" style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em' }}>line</span>
            </div>
            <button className="btn-ghost btn-sm" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
              <X size={18} />
            </button>
          </div>

          <nav className="drawer-nav">
            {NAV_ITEMS.map(item => (
              <div
                key={item.id}
                id={`drawer-nav-${item.id}`}
                className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
                onClick={() => { setActiveNav(item.id); setDrawerOpen(false); }}
                role="button"
                tabIndex={0}
              >
                {item.label}
              </div>
            ))}

            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0.75rem 0' }} />

            <div id="drawer-smart-process" className="nav-item" onClick={() => { handleSmartProcess(); setDrawerOpen(false); }}>
              <Sparkles size={14} />Smart Process
            </div>
            <div id="drawer-translate" className="nav-item" onClick={() => { handleTranslate(); setDrawerOpen(false); }}>
              <Languages size={14} />Translate
            </div>
            <div id="drawer-classify" className="nav-item" onClick={() => { handleClassify(); setDrawerOpen(false); }}>
              <Brain size={14} />Classify
            </div>
          </nav>

          <div className="drawer-footer">
            <div className="drawer-footer-label">Appearance</div>
            <button className="dark-toggle" onClick={() => setIsDark(d => !d)} aria-label="Toggle dark mode">
              {isDark ? <Moon size={14} /> : <Sun size={14} />}
              <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{isDark ? 'Dark mode' : 'Light mode'}</span>
              <div className="toggle-track" style={{ marginLeft: 'auto' }}>
                <div className="toggle-thumb" />
              </div>
            </button>
            <div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Palette size={10} />Theme
              </div>
              <div className="theme-dots">
                {THEMES.map(t => (
                  <button key={t.id} className={`theme-dot ${theme === t.id ? 'active' : ''}`} title={t.label} onClick={() => setTheme(t.id)} aria-label={`${t.label} theme`} style={{ background: t.color }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════  MAIN CONTENT  ════════════════ */}
      <main className="main-content">

        {/* ── Page header ─────────────────────────────── */}
        <header className="page-header animate-reveal">
          <div className="page-title">
            <h1>Translator Console</h1>
            <div className={`status-badge ${isProcessing ? 'processing' : ''}`}>
              {isProcessing ? (
                <><span className="spinner" style={{ width: 8, height: 8, borderWidth: 1.5 }} />{STEPS[curStepIdx]?.label ?? 'Working'}</>
              ) : 'Online'}
            </div>
          </div>
          <p className="page-description">
            Process, translate, and classify e-commerce order data with AI.
          </p>
        </header>

        {/* ── API Keys card (collapsible) ──────────────── */}
        <div className="responsive-grid mb-4 animate-fade-up delay-1">

          <div className="card">
            {/* Header row — always visible */}
            <div
              className="card-header"
              onClick={() => setKeysExpanded(v => !v)}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <span className="card-title"><Key size={13} />API Keys</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Status pill */}
                <span style={{
                  fontSize: '0.65rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4,
                  color: keysConfigured ? 'var(--success)' : 'var(--text-muted)',
                }}>
                  {keysConfigured
                    ? <><CheckCircle2 size={11} style={{ color: 'var(--success)' }} />Configured</>
                    : <><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block' }} />Needs keys</>}
                </span>
                <ChevronDown size={14} style={{
                  color: 'var(--text-muted)',
                  transform: keysExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s ease',
                }} />
              </div>
            </div>

            {/* Collapsible body */}
            <div style={{
              overflow: 'hidden',
              maxHeight: keysExpanded ? 300 : 0,
              transition: 'max-height 0.35s cubic-bezier(0.16,1,0.3,1)',
            }}>
              <div className="card-body">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">OpenAI Project Key</label>
                  <div className="input-wrapper">
                    <input
                      id="input-openai-key"
                      type={showOpenaiKey ? 'text' : 'password'}
                      placeholder="sk-proj-…"
                      value={openaiKey}
                      onChange={e => setOpenaiKey(e.target.value)}
                      style={{ paddingRight: 72 }}
                    />
                    <span className={`input-status-dot ${openaiKey ? 'active' : ''}`} style={{ right: 36 }} />
                    <button className="input-toggle-btn" onClick={() => setShowOpenaiKey(v => !v)} tabIndex={-1} aria-label="Toggle visibility">
                      {showOpenaiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Capabilities card */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Zap size={13} />Capabilities</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {[
                  { icon: FileText, label: 'Data Parsing' },
                  { icon: Languages, label: 'Translation' },
                  { icon: Brain, label: 'Classification' },
                  { icon: Sparkles, label: 'Noise Filter' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="capability-item">
                    <div className="capability-icon"><Icon size={13} /></div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Data Input ──────────────────────────────── */}
        <div className="animate-fade-up delay-2">
          <DataInput onProcess={handleProcess} isLoading={isProcessing} addToast={addToast} />
        </div>

        {/* ── Processing progress (in-flow, full detail) ── */}
        {isProcessing && (
          <div className="progress-container animate-fade">
            <div className="progress-header">
              <div className="progress-steps">
                {STEPS.map((step, idx) => (
                  <div
                    key={step.key}
                    className={`progress-step ${processingType === step.key ? 'active' : ''} ${curStepIdx > idx ? 'done' : ''}`}
                  >
                    <span className="progress-step-dot" />
                    {step.label}
                  </div>
                ))}
              </div>
              <span className="progress-value">{progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* ── Empty state (no data yet) ────────────────── */}
        {!data.length && !isProcessing && (
          <div className="empty-state animate-fade-up delay-3">
            <div className="empty-icon">
              <FileText size={32} />
            </div>
            <h3>No data loaded</h3>
            <p>Paste order data or upload an Excel / CSV file above, then click <strong>Process Data</strong>.</p>
            <div className="empty-hints">
              <span className="kbd">⌘V</span><span>paste</span>
              <span style={{ opacity: 0.3 }}>·</span>
              <span className="kbd">/</span><span>search</span>
              <span style={{ opacity: 0.3 }}>·</span>
              <span className="kbd">Esc</span><span>close drawer</span>
            </div>
          </div>
        )}

        {/* ── Results ─────────────────────────────────── */}
        {data.length > 0 && (
          <div className="animate-fade-up delay-3">

            {/* Metrics */}
            <div className="metrics-grid">
              {[
                {
                  label: 'Items',
                  value: <span className="accent">{data.length}</span>,
                  sub: <span className="positive"><ChevronRight size={12} />Ready</span>,
                },
                {
                  label: 'Orders',
                  value: new Set(data.map(i => i.orderNumber)).size,
                  sub: null,
                },
                {
                  label: 'Value (CNY)',
                  value: (() => {
                    const total = data.reduce((s, i) => {
                      const q = parseFloat(i.quantity.replace(/[^0-9.]/g, '') || '0');
                      const p = parseFloat(i.amount.replace(/[^0-9.]/g, '') || '0');
                      return s + q * p;
                    }, 0);
                    return (
                      <>
                        <div>¥{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <div style={{ color: 'var(--accent-color)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                          ${(total * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
                        </div>
                      </>
                    );
                  })(),
                  sub: null,
                },
              ].map((m, i) => (
                <div key={i} className="metric-card" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="metric-label">{m.label}</div>
                  <div className="metric-value">{m.value}</div>
                  {m.sub && <div className="metric-change">{m.sub}</div>}
                </div>
              ))}
            </div>

            {/* Action toolbar */}
            <div className="toolbar">
              <div className="toolbar-left">
                <button
                  id="btn-smart-process"
                  className="btn-primary"
                  onClick={handleSmartProcess}
                  disabled={isProcessing}
                  title="Translate → Classify → Extract in one click"
                >
                  {isProcessing && processingType
                    ? <><span className="spinner" />Processing…</>
                    : <><Sparkles size={15} />Smart Process</>}
                </button>

                <div className="action-cluster">
                  <button id="btn-translate" className="btn-secondary btn-sm" onClick={handleTranslate} disabled={isProcessing} title="Translate only">
                    {isTranslating ? <span className="spinner" /> : <Languages size={13} />}
                    <span className="hide-mobile">Translate</span>
                  </button>
                  <button id="btn-classify" className="btn-secondary btn-sm" onClick={handleClassify} disabled={isProcessing} title="Classify only">
                    {isClassifying ? <span className="spinner" /> : <Brain size={13} />}
                    <span className="hide-mobile">Classify</span>
                  </button>
                </div>

                <DownloadButton data={data} exchangeRate={exchangeRate} />
              </div>

              <div className="toolbar-right">
                <button
                  id="btn-clear"
                  className="btn-ghost btn-sm"
                  onClick={() => {
                    setData([]);
                    addToast('info', 'Cleared', 'Data removed from console.');
                  }}
                  disabled={isProcessing}
                  title="Clear all data"
                >
                  <X size={13} />Clear
                </button>
              </div>
            </div>

            {/* Data Table */}
            <DataTable data={data} exchangeRate={exchangeRate} addToast={addToast} />
          </div>
        )}
      </main>

      {/* ══ Toast stack ══ */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
