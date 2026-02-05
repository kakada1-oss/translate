import { useState, useEffect } from 'react';
import DataInput from './components/DataInput';
import DataTable from './components/DataTable';
import DownloadButton from './components/DownloadButton';
import { parseRawData } from './services/dataProcessor';
import { translateBatch } from './services/translator';
import { classifyItems, extractAttributes } from './services/classifier';
import { getExchangeRate } from './services/currency';
import type { OrderItem } from './types';
import {
  Languages,
  Key,
  Sparkles,
  Brain,
  FileText,
  Settings,
  BarChart3,
  Layers,
  Zap,
  Menu,
  X,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

function App() {
  const [data, setData] = useState<OrderItem[]>([]);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('tl_google_key') || import.meta.env.VITE_GOOGLE_API_KEY || '');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('tl_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingType, setProcessingType] = useState<'translate' | 'classify' | 'extract' | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('console');
  const [exchangeRate, setExchangeRate] = useState<number>(0.14); // Default fallback

  // Fetch exchange rate on mount
  useEffect(() => {
    const fetchRate = async () => {
      const rate = await getExchangeRate();
      setExchangeRate(rate);
    };
    fetchRate();
  }, []);

  // Close sidebar when clicking overlay
  const closeSidebar = () => setSidebarOpen(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('tl_google_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('tl_gemini_key', geminiKey);
  }, [geminiKey]);

  // Close sidebar on route change or window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleProcess = (rawData: string) => {
    setError(null);
    try {
      const { data: parsedData, errors } = parseRawData(rawData);
      if (errors.length > 0) {
        console.warn('Parse errors:', errors);
      }
      if (parsedData.length === 0) {
        setError("No valid data found in input. Please check your data format.");
        return;
      }
      setData(parsedData);
    } catch (err) {
      setError("Failed to parse data. Ensure it's properly formatted.");
      console.error(err);
    }
  };

  const handleTranslate = async () => {
    if (!apiKey.trim()) {
      setError("Please enter your Google Translate API key.");
      return;
    }
    setIsProcessing(true);
    setProcessingType('translate');
    setProgress(0);
    setError(null);
    try {
      const translatedData = await translateBatch(data, apiKey, (p) => setProgress(p));
      setData(translatedData);
    } catch (err) {
      setError("Translation failed. Please check your API key.");
      console.error(err);
    } finally {
      setIsProcessing(false);
      setProcessingType(null);
      setProgress(0);
    }
  };

  const handleClassify = async () => {
    if (!geminiKey.trim()) {
      setError("Please enter your Gemini API key.");
      return;
    }
    setIsProcessing(true);
    setProcessingType('classify');
    setProgress(0);
    setError(null);
    try {
      const classifiedData = await classifyItems(data, geminiKey, (p) => setProgress(p));
      setData(classifiedData);
    } catch (err) {
      setError("Classification failed. Please check your API key.");
      console.error(err);
    } finally {
      setIsProcessing(false);
      setProcessingType(null);
      setProgress(0);
    }
  };

  const handleSmartProcess = async () => {
    if (!apiKey.trim() || !geminiKey.trim()) {
      setError("Please enter both Google Translate and Gemini API keys.");
      return;
    }
    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Translate
      setProcessingType('translate');
      setProgress(0);
      const translatedData = await translateBatch(data, apiKey, (p) => setProgress(p));
      setData(translatedData);

      // Step 2: Classify (category, subcategory, shortened name)
      setProcessingType('classify');
      setProgress(0);
      const classifiedData = await classifyItems(translatedData, geminiKey, (p) => setProgress(p));
      setData(classifiedData);

      // Step 3: Extract Attributes (size, color, material, gender, etc.)
      setProcessingType('extract');
      setProgress(0);
      const fullyProcessedData = await extractAttributes(classifiedData, geminiKey, (p) => setProgress(p));
      setData(fullyProcessedData);

    } catch (err) {
      setError("Smart processing failed. Please check your API keys and connection.");
      console.error(err);
    } finally {
      setIsProcessing(false);
      setProcessingType(null);
      setProgress(0);
    }
  };

  const isTranslating = isProcessing && processingType === 'translate';
  const isClassifying = isProcessing && processingType === 'classify';
  const isExtracting = isProcessing && processingType === 'extract';
  const isSmartProcessing = isProcessing && processingType === null;


  const navItems = [
    { id: 'console', icon: Layers, label: 'Console' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="app-layout">
      {/* Sidebar Overlay (mobile) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Sparkles size={18} />
          </div>
          <div className="brand-text">
            <span className="brand-name">Thread Line</span>
            <span className="brand-tagline">Intelligence Suite</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-label">Navigation</div>
            {navItems.map((item) => (
              <div
                key={item.id}
                className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveNav(item.id);
                  closeSidebar();
                }}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="nav-section">
            <div className="nav-section-label">Quick Actions</div>
            <div className="nav-item" onClick={() => { handleSmartProcess(); closeSidebar(); }}>
              <Sparkles size={18} />
              <span>Smart Process</span>
            </div>
            <div className="nav-item" onClick={() => { handleTranslate(); closeSidebar(); }}>
              <Languages size={18} />
              <span>Translate</span>
            </div>
            <div className="nav-item" onClick={() => { handleClassify(); closeSidebar(); }}>
              <Brain size={18} />
              <span>Classify</span>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Mobile Header */}
        <div className="mobile-header">
          <button className="btn-ghost" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: 'var(--accent)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Thread Line</span>
          </div>
          <div style={{ width: 36 }} />
        </div>

        {/* Page Header */}
        <header className="page-header animate-slide-up">
          <div className="page-title">
            <h1>Translator Console</h1>
            <div className="status-badge">
              <span>Online</span>
            </div>
          </div>
          <p className="page-description hide-mobile">
            Process, translate, and classify e-commerce order data with AI.
          </p>
        </header>

        {/* API Configuration */}
        <div className="responsive-grid mb-4 animate-slide-up delay-1">
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <Key size={14} />
                API Keys
              </span>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Google Translate</label>
                <input
                  type="password"
                  placeholder="Enter API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Gemini AI</label>
                <input
                  type="password"
                  placeholder="Enter API key"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card hide-mobile">
            <div className="card-header">
              <span className="card-title">
                <Zap size={14} />
                Capabilities
              </span>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { icon: FileText, label: 'Data Parsing' },
                  { icon: Languages, label: 'Translation' },
                  { icon: Brain, label: 'Classification' },
                  { icon: Sparkles, label: 'Noise Filter' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2" style={{ padding: '4px 0' }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: 'rgba(var(--accent-rgb), 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent)'
                    }}>
                      <Icon size={12} />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Data Input */}
        <div className="animate-slide-up delay-2">
          <DataInput onProcess={handleProcess} isLoading={isProcessing} />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error animate-fade">
            <AlertCircle className="alert-icon" />
            <div className="alert-content">
              <h4>Error</h4>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Processing Progress */}
        {isProcessing && (
          <div className="progress-container animate-fade">
            <div className="progress-header">
              <span className="progress-label">
                {isSmartProcessing ? 'Smart Processing...' : (isTranslating ? 'Translating...' : (isClassifying ? 'Classifying...' : (isExtracting ? 'Extracting Attributes...' : 'Processing...')))}
              </span>
              <span className="progress-value">{progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Results Section */}
        {data.length > 0 && (
          <div className="animate-slide-up delay-3">
            {/* Metrics */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Items</div>
                <div className="metric-value accent">{data.length}</div>
                <div className="metric-change positive">
                  <ChevronRight size={12} />
                  Ready
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Orders</div>
                <div className="metric-value">
                  {new Set(data.map(item => item.orderNumber)).size}
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Total Value</div>
                <div className="metric-value" style={{ fontSize: '1.2rem' }}>
                  <div style={{ color: 'var(--text-primary)' }}>
                    ¥{data.reduce((sum, item) => {
                      const qty = parseFloat(item.quantity.replace(/[^0-9.]/g, '') || '0');
                      const price = parseFloat(item.amount.replace(/[^0-9.]/g, '') || '0');
                      return sum + (qty * price);
                    }, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div style={{ color: 'var(--accent)', fontSize: '0.9rem', marginTop: 4 }}>
                    ${(data.reduce((sum, item) => {
                      const qty = parseFloat(item.quantity.replace(/[^0-9.]/g, '') || '0');
                      const price = parseFloat(item.amount.replace(/[^0-9.]/g, '') || '0');
                      return sum + (qty * price);
                    }, 0) * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
                  </div>
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="toolbar">
              <div className="toolbar-left">
                <button
                  className="btn-primary"
                  onClick={handleSmartProcess}
                  disabled={isProcessing}
                  style={{
                    background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)',
                    boxShadow: '0 4px 12px rgba(var(--accent-rgb), 0.3)'
                  }}
                >
                  {isProcessing && !processingType ? (
                    <>
                      <span className="spinner" />
                      <span className="hide-mobile">Processing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Smart Process</span>
                    </>
                  )}
                </button>
                <button
                  className="btn-secondary"
                  onClick={handleTranslate}
                  disabled={isProcessing}
                >
                  {isTranslating ? (
                    <>
                      <span className="spinner" />
                      <span className="hide-mobile">Translating</span>
                    </>
                  ) : (
                    <>
                      <Languages size={16} />
                      <span>Translate</span>
                    </>
                  )}
                </button>
                <button
                  className="btn-secondary"
                  onClick={handleClassify}
                  disabled={isProcessing}
                >
                  {isClassifying ? (
                    <>
                      <span className="spinner" />
                      <span className="hide-mobile">Classifying</span>
                    </>
                  ) : (
                    <>
                      <Brain size={16} />
                      <span>Classify</span>
                    </>
                  )}
                </button>
                <DownloadButton data={data} exchangeRate={exchangeRate} />
              </div>
              <div className="toolbar-right">
                <button
                  className="btn-danger btn-sm"
                  onClick={() => setData([])}
                  disabled={isProcessing}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Data Table */}
            <DataTable data={data} exchangeRate={exchangeRate} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
