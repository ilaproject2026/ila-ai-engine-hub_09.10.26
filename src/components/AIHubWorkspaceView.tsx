import { useState, useMemo, type FormEvent, type KeyboardEvent, type ChangeEvent } from 'react';
import {
  Send,
  Loader2,
  Mic,
  MicOff,
  Paperclip,
  X,
  Copy,
  Check,
  Download,
  FileText,
  SlidersHorizontal,
  Plus,
  RefreshCw,
  ArrowRight,
  MessageSquare,
  Search,
  PanelLeft,
  Grid,
} from 'lucide-react';
import { renderAIProductIcon } from './AIHubDropdown';
import DocumentUploadZone from './DocumentUploadZone';
import MarkdownRenderer from './MarkdownRenderer';
import { useVoice } from '../hooks/useVoice';
import {
  type AIProductType,
  getAIProductConfig,
} from '../services/aiHubConfig';
import type { ChatSession, AttachedDocument } from '../services/dbService';
import { getIlaModelDisplayName } from '../services/geminiService';
import type { AppTheme } from '../App';

interface AIHubWorkspaceViewProps {
  productType: AIProductType;
  onSelectProduct?: (productId: AIProductType) => void;
  onReturnToCourseCreator?: () => void;
  activeSession: ChatSession | null;
  sessions: ChatSession[];
  onSelectSession: (sessionId: string) => void;
  onNewSession: (productType: AIProductType, params?: Record<string, string>) => void;
  onDeleteSession: (sessionId: string) => void;
  onSendMessage: (
    query: string,
    documents: AttachedDocument[],
    params: Record<string, string>
  ) => void;
  loading: boolean;
  theme?: AppTheme;
  onToggleThemeMenu?: () => void;
  isThemeMenuOpen?: boolean;
  onSelectTheme?: (t: AppTheme) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenFunctionList?: () => void;
  onOpenActivityTracker?: () => void;
  onOpenCentralDashboard?: () => void;
  onOpenParameterInput?: () => void;
  onOpenParameterList?: () => void;
}

export default function AIHubWorkspaceView({
  productType,
  activeSession,
  sessions,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onSendMessage,
  loading,
  isSidebarOpen,
  onToggleSidebar,
  onOpenFunctionList,
}: AIHubWorkspaceViewProps) {
  const productConfig = getAIProductConfig(productType);

  // Active Tool Parameters State (Initialized from activeSession or default config)
  const [params, setParams] = useState<Record<string, string>>(() => {
    const defaultParams: Record<string, string> = {};
    productConfig.parameters.forEach((p) => {
      defaultParams[p.id] = p.defaultValue;
    });
    return activeSession?.productParams || defaultParams;
  });

  // Query and attachment states
  const [query, setQuery] = useState<string>('');
  const [attachedDocs, setAttachedDocs] = useState<AttachedDocument[]>([]);
  const [showUploadZone, setShowUploadZone] = useState<boolean>(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');

  // Voice input
  const { isListening, toggleListening } = useVoice();

  // Filter sessions specifically for the active productType
  const productSessions = useMemo(() => {
    return sessions.filter((s) => s.productType === productType);
  }, [sessions, productType]);

  const filteredProductSessions = useMemo(() => {
    if (!historySearchQuery.trim()) return productSessions;
    const term = historySearchQuery.toLowerCase().trim();
    return productSessions.filter(
      (s) =>
        s.title.toLowerCase().includes(term) ||
        s.messages.some((m) => m.content.toLowerCase().includes(term))
    );
  }, [productSessions, historySearchQuery]);

  const handleParamChange = (paramId: string, value: string) => {
    setParams((prev) => ({ ...prev, [paramId]: value }));
  };

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery || loading) return;

    if (isListening) {
      toggleListening(() => {});
    }

    onSendMessage(cleanQuery, attachedDocs, params);
    setQuery('');
    setAttachedDocs([]);
    setShowUploadZone(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleExportText = (content: string, filename: string = 'export.md') => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSessionJSON = () => {
    if (!currentProductSession) return;
    const jsonStr = JSON.stringify(currentProductSession, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentProductSession.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_history.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Strictly isolate active session to this specific tool without any cross-tool leaks
  const currentProductSession =
    activeSession && activeSession.productType === productType
      ? activeSession
      : productSessions.length > 0
      ? productSessions[0]
      : null;

  const messages = currentProductSession?.messages || [];

  return (
    <div
      id="ai-hub-dynamic-workspace"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
        color: 'var(--text-main)',
      }}
    >
      {/* 1. MODULE SUB-HEADER (Isolated to this specific tool) */}
      <div
        id="module-sub-header"
        style={{
          padding: '0.6rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--header-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexShrink: 0,
          zIndex: 30,
          boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Left: Sidebar Toggle + Module Badge + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
          <button
            type="button"
            onClick={onToggleSidebar}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '0.6rem',
              color: isSidebarOpen ? 'var(--accent-primary)' : 'var(--text-main)',
              cursor: 'pointer',
              padding: '0.42rem 0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            title={isSidebarOpen ? 'Hide History Sidebar' : 'Show History Sidebar'}
          >
            <PanelLeft size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '0.65rem',
                background: productConfig.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 0 14px ${productConfig.accentColor}55`,
              }}
            >
              {renderAIProductIcon(productConfig.icon, 16, '#ffffff')}
            </div>
            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
              {productConfig.name}
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '0.15rem 0.55rem',
                borderRadius: '9999px',
                background: `${productConfig.accentColor}25`,
                border: `1px solid ${productConfig.accentColor}50`,
                color: productConfig.accentColor,
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {productConfig.badge || productConfig.category}
            </span>
            <span
              style={{
                fontSize: '0.76rem',
                color: 'var(--text-subtle)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '450px',
              }}
              className="lg-flex"
            >
              — {productConfig.tagline}
            </span>
          </div>
        </div>

        {/* Right: Module Actions (New Session, Export JSON, Message Count) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={() => onNewSession(productType, params)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.38rem 0.8rem',
              borderRadius: '9999px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#c7d2fe',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Start a new isolated session for this module"
          >
            <Plus size={13} />
            <span>New Session</span>
          </button>

          <button
            type="button"
            onClick={handleExportSessionJSON}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.38rem 0.8rem',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Export this conversation as JSON"
          >
            <Download size={13} />
            <span>Export</span>
          </button>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: 'var(--text-subtle)',
            }}
          >
            <span>{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE CONTAINER (SIDEBAR HISTORY + CONTENT AREA) */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* LEFT QUERY HISTORY DRAWER (Filtered for this product) */}
        {isSidebarOpen && (
          <aside
            id="hub-product-history-sidebar"
            style={{
              width: '280px',
              minWidth: '280px',
              maxWidth: '280px',
              height: '100%',
              background: 'rgba(10, 15, 26, 0.95)',
              borderRight: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 20,
            }}
          >
            {/* Header & New Session Button */}
            <div
              style={{
                padding: '0.85rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {productConfig.shortName} History
                </span>
                {onOpenFunctionList && (
                  <button
                    type="button"
                    onClick={onOpenFunctionList}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: productConfig.accentColor,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: 0,
                    }}
                  >
                    <Grid size={11} />
                    <span>All Functions</span>
                  </button>
                )}
              </div>

              <button
                id="hub-new-query-btn"
                type="button"
                onClick={() => onNewSession(productType, params)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: productConfig.gradient,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.55rem',
                  padding: '0.55rem 0.85rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: `0 4px 12px ${productConfig.accentColor}40`,
                  transition: 'transform 0.15s ease',
                }}
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>New {productConfig.shortName} Query</span>
              </button>

              {/* Search Past Queries */}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '0.45rem',
                  padding: '0.3rem 0.55rem',
                }}
              >
                <Search size={12} style={{ color: 'var(--text-subtle)', marginRight: '0.35rem' }} />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder={`Search ${productConfig.shortName} history...`}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#ffffff',
                    fontSize: '0.74rem',
                  }}
                />
              </div>
            </div>

            {/* Session List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              {filteredProductSessions.length === 0 ? (
                <div
                  style={{
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    color: 'var(--text-subtle)',
                    fontSize: '0.76rem',
                  }}
                >
                  No past {productConfig.shortName} queries yet. Start a new search above!
                </div>
              ) : (
                filteredProductSessions.map((session) => {
                  const isActive = activeSession?.id === session.id;

                  return (
                    <div
                      key={session.id}
                      onClick={() => onSelectSession(session.id)}
                      style={{
                        padding: '0.5rem 0.65rem',
                        borderRadius: '0.5rem',
                        background: isActive ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                        border: isActive
                          ? '1px solid rgba(165, 180, 252, 0.4)'
                          : '1px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.4rem',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                        <MessageSquare
                          size={13}
                          color={isActive ? productConfig.accentColor : 'var(--text-subtle)'}
                        />
                        <span
                          style={{
                            fontSize: '0.76rem',
                            fontWeight: isActive ? 700 : 500,
                            color: isActive ? '#ffffff' : 'var(--text-main)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {session.title || 'Untitled Query'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-subtle)',
                          cursor: 'pointer',
                          padding: '0.15rem',
                          display: 'flex',
                          alignItems: 'center',
                          opacity: 0.6,
                        }}
                        title="Delete Session"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}

        {/* RIGHT DYNAMIC PRODUCT WORKSPACE AREA */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* TOP TOOL HEADER & PARAMETERS CONTROL BAR */}
          <div
            id="hub-parameters-control-bar"
            style={{
              padding: '1rem 1.75rem',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'linear-gradient(135deg, rgba(20, 27, 45, 0.75) 0%, rgba(12, 16, 28, 0.9) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              flexShrink: 0,
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            }}
          >
            {/* Tool Title & Overview */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '0.85rem',
                    background: productConfig.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: `0 0 20px ${productConfig.accentColor}55`,
                  }}
                >
                  {renderAIProductIcon(productConfig.icon, 20, '#ffffff')}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
                      {productConfig.name}
                    </h2>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        background: `${productConfig.accentColor}25`,
                        color: productConfig.accentColor,
                        border: `1px solid ${productConfig.accentColor}45`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {productConfig.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '0.15rem' }}>
                    {productConfig.description}
                  </div>
                </div>
              </div>

              {/* Status pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  padding: '0.25rem 0.65rem',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                }}
              >
                <SlidersHorizontal size={13} color={productConfig.accentColor} />
                <span>Custom Parameters Active</span>
              </div>
            </div>

            {/* Parameter Fields (Selects / Pills) */}
            {productConfig.parameters.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '0.65rem',
                  paddingTop: '0.35rem',
                }}
              >
                {productConfig.parameters.map((param) => {
                  const currentValue = params[param.id] || param.defaultValue;

                  if (param.type === 'select' && param.options) {
                    return (
                      <div
                        key={param.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '0.6rem',
                          padding: '0.3rem 0.75rem',
                          transition: 'border-color 0.2s ease',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--text-subtle)',
                          }}
                        >
                          {param.label}:
                        </span>
                        <select
                          value={currentValue}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                            handleParamChange(param.id, e.target.value)
                          }
                          style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: '#ffffff',
                            fontSize: '0.76rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {param.options.map((opt) => (
                            <option
                              key={opt.value}
                              value={opt.value}
                              style={{ background: '#0f172a', color: '#ffffff' }}
                            >
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  if (param.type === 'pills' && param.options) {
                    return (
                      <div
                        key={param.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          background: 'rgba(0, 0, 0, 0.35)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '9999px',
                          padding: '0.2rem',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: 'var(--text-subtle)',
                            paddingLeft: '0.55rem',
                            paddingRight: '0.25rem',
                          }}
                        >
                          {param.label}:
                        </span>
                        {param.options.map((opt) => {
                          const isSelected = currentValue === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleParamChange(param.id, opt.value)}
                              style={{
                                border: 'none',
                                borderRadius: '9999px',
                                padding: '0.25rem 0.65rem',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: isSelected
                                  ? productConfig.accentColor
                                  : 'transparent',
                                color: isSelected ? '#ffffff' : 'var(--text-muted)',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: isSelected ? `0 0 12px ${productConfig.accentColor}66` : 'none',
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            )}
          </div>

          {/* DYNAMIC RESULTS DISPLAY CONTAINER */}
          <div
            id="hub-results-viewport"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {/* Loading Banner */}
            {loading && (
              <div
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
                  border: '1px solid rgba(165, 180, 252, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  color: '#c7d2fe',
                  fontWeight: 600,
                  animation: 'pulse 2s infinite ease-in-out',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <RefreshCw size={15} className="animate-spin" color={productConfig.accentColor} />
                  <span>{productConfig.name} is synthesizing structured intelligence...</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: productConfig.accentColor }}>
                  Powered by {getIlaModelDisplayName()}
                </span>
              </div>
            )}

            {/* Render Messages or Starter State */}
            {messages.length === 0 ? (
              /* CLEAN STARTER HERO FOR THIS TOOL */
              <div
                id="hub-starter-hero"
                style={{
                  maxWidth: '900px',
                  margin: 'auto',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                  padding: '2rem 1rem',
                  textAlign: 'center',
                }}
              >
                {/* Hero Icon & Title */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '1.25rem',
                      background: productConfig.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: `0 0 30px ${productConfig.accentColor}66`,
                    }}
                  >
                    {renderAIProductIcon(productConfig.icon, 32, '#ffffff')}
                  </div>
                  <h1
                    style={{
                      fontSize: '1.75rem',
                      fontWeight: 800,
                      color: '#ffffff',
                      letterSpacing: '-0.02em',
                      margin: 0,
                    }}
                  >
                    {productConfig.name}
                  </h1>
                  <p
                    style={{
                      fontSize: '0.92rem',
                      color: 'var(--text-muted)',
                      maxWidth: '580px',
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {productConfig.tagline}. Select your target parameters above and enter a prompt or attach documents below to generate actionable insights.
                  </p>
                </div>

                {/* Quick Prompt Starter Pills */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.75rem' }}>
                  <div
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: 'var(--text-subtle)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Suggested Quick Starters
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                      gap: '0.85rem',
                      textAlign: 'left',
                    }}
                  >
                    {productConfig.quickPrompts.map((promptText, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="interactive-card"
                        onClick={() => {
                          setQuery(promptText);
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '0.85rem',
                          padding: '0.85rem 1.15rem',
                          color: 'var(--text-main)',
                          fontSize: '0.82rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          backdropFilter: 'blur(10px)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.borderColor = productConfig.accentColor;
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = `0 8px 25px -5px ${productConfig.accentColor}33`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                          e.currentTarget.style.borderColor = 'var(--border-subtle)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <span style={{ lineHeight: 1.4 }}>{promptText}</span>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: `${productConfig.accentColor}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <ArrowRight size={13} color={productConfig.accentColor} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* RENDER CONVERSATION / QUERY RESULTS */
              <div
                style={{
                  maxWidth: '960px',
                  margin: '0 auto',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                }}
              >
                {messages.map((msg, idx) => {
                  const isUser = msg.role === 'user';

                  if (isUser) {
                    return (
                      <div
                        key={msg.id || idx}
                        style={{
                          alignSelf: 'flex-end',
                          maxWidth: '85%',
                          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.35) 0%, rgba(124, 58, 237, 0.35) 100%)',
                          border: '1px solid rgba(165, 180, 252, 0.4)',
                          borderRadius: '1.25rem 1.25rem 0.35rem 1.25rem',
                          padding: '1rem 1.35rem',
                          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                          backdropFilter: 'blur(12px)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#c7d2fe',
                            marginBottom: '0.35rem',
                            letterSpacing: '0.02em',
                          }}
                        >
                          User Query • {productConfig.shortName}
                        </div>
                        <div style={{ fontSize: '0.92rem', color: '#ffffff', lineHeight: 1.55 }}>
                          {msg.content}
                        </div>

                        {/* Attached documents */}
                        {msg.documents && msg.documents.length > 0 && (
                          <div
                            style={{
                              marginTop: '0.6rem',
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '0.4rem',
                            }}
                          >
                            {msg.documents.map((d) => (
                              <div
                                key={d.id}
                                style={{
                                  fontSize: '0.7rem',
                                  background: 'rgba(0, 0, 0, 0.35)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  padding: '0.25rem 0.55rem',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                }}
                              >
                                <FileText size={12} color="#a5b4fc" />
                                <span>{d.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Assistant Output
                  return (
                    <div
                      key={msg.id || idx}
                      className="glass-panel"
                      style={{
                        alignSelf: 'stretch',
                        borderRadius: '1.25rem',
                        padding: '1.5rem',
                        boxShadow: '0 12px 35px -5px rgba(0, 0, 0, 0.4), 0 0 15px rgba(99, 102, 241, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.15rem',
                        border: '1px solid var(--glass-border)',
                      }}
                    >
                      {/* Output Header & Action Controls */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid var(--border-subtle)',
                          paddingBottom: '0.85rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '0.55rem',
                              background: productConfig.gradient,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              boxShadow: `0 0 12px ${productConfig.accentColor}55`,
                            }}
                          >
                            {renderAIProductIcon(productConfig.icon, 14, '#ffffff')}
                          </div>
                          <div>
                            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                              {productConfig.name} Analysis
                            </span>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-subtle)',
                                marginLeft: '0.5rem',
                              }}
                            >
                              • {getIlaModelDisplayName(msg.model)}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons (Copy, Export, Print) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.content, msg.id || `${idx}`)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '0.5rem',
                              padding: '0.35rem 0.7rem',
                              color: copiedMsgId === (msg.id || `${idx}`) ? '#34d399' : 'var(--text-muted)',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            title="Copy Markdown Output"
                          >
                            {copiedMsgId === (msg.id || `${idx}`) ? (
                              <>
                                <Check size={13} color="#34d399" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleExportText(
                                msg.content,
                                `${productConfig.id}_${Date.now()}.md`
                              )
                            }
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '0.5rem',
                              padding: '0.35rem 0.7rem',
                              color: 'var(--text-muted)',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            title="Download Markdown Report"
                          >
                            <Download size={13} />
                            <span>Export</span>
                          </button>
                        </div>
                      </div>

                      {/* Rendered Markdown Body */}
                      <div style={{ lineHeight: 1.7, fontSize: '0.94rem' }}>
                        <MarkdownRenderer content={msg.content} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. BOTTOM TASK-SPECIFIC SEARCH / QUERY INPUT BOX */}
          <div
            id="hub-bottom-input-container"
            style={{
              padding: '1rem 1.75rem 1.25rem 1.75rem',
              background: 'rgba(10, 15, 26, 0.85)',
              borderTop: '1px solid var(--border-subtle)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              flexShrink: 0,
              zIndex: 25,
            }}
          >
            <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
              {/* Optional Document Upload Zone Drawer */}
              {showUploadZone && (
                <div style={{ marginBottom: '0.85rem', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowUploadZone(false)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '0.45rem',
                        color: 'var(--text-muted)',
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <X size={12} />
                      <span>Close Upload</span>
                    </button>
                  </div>
                  <DocumentUploadZone
                    documents={attachedDocs}
                    onDocumentsChange={setAttachedDocs}
                  />
                </div>
              )}

              {/* Attached docs preview pill */}
              {attachedDocs.length > 0 && !showUploadZone && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.6rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {attachedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        fontSize: '0.74rem',
                        background: 'rgba(99, 102, 241, 0.2)',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        borderRadius: '0.45rem',
                        padding: '0.25rem 0.6rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        color: '#c7d2fe',
                      }}
                    >
                      <FileText size={13} color="#818cf8" />
                      <span>{doc.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setAttachedDocs((prev) => prev.filter((d) => d.id !== doc.id))
                        }
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#c7d2fe',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Main Input Form */}
              <form onSubmit={handleSubmit}>
                <div
                  className="interactive-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(5, 8, 16, 0.9)',
                    border: isListening
                      ? '1px solid rgba(239, 68, 68, 0.8)'
                      : `1px solid rgba(99, 102, 241, 0.45)`,
                    borderRadius: '1.25rem',
                    padding: '0.6rem 0.95rem',
                    boxShadow: isListening
                      ? '0 0 25px rgba(239, 68, 68, 0.4)'
                      : '0 8px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(99, 102, 241, 0.15)',
                    gap: '0.75rem',
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  {/* Tool Icon inside Search Box */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '0.65rem',
                      background: productConfig.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      flexShrink: 0,
                    }}
                  >
                    {renderAIProductIcon(productConfig.icon, 16, '#ffffff')}
                  </div>

                  {/* Input Field */}
                  <input
                    id="hub-ai-task-search-input"
                    type="text"
                    value={query}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isListening
                        ? 'Listening to your voice... Speak now'
                        : productConfig.placeholderPrompt
                    }
                    disabled={loading}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#ffffff',
                      fontSize: '0.94rem',
                      fontWeight: 500,
                    }}
                  />

                  {/* Document Attachment Button */}
                  <button
                    type="button"
                    onClick={() => setShowUploadZone(!showUploadZone)}
                    style={{
                      background: showUploadZone ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '0.6rem',
                      color: attachedDocs.length > 0 ? productConfig.accentColor : 'var(--text-subtle)',
                      cursor: 'pointer',
                      padding: '0.45rem 0.55rem',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    title="Attach reference documents (PDF, DOCX, TXT, images)"
                  >
                    <Paperclip size={16} />
                  </button>

                  {/* Voice Button */}
                  <button
                    type="button"
                    onClick={() =>
                      toggleListening((transcript) => {
                        setQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
                      })
                    }
                    style={{
                      background: isListening ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: isListening ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--border-subtle)',
                      borderRadius: '0.6rem',
                      color: isListening ? '#ef4444' : 'var(--text-subtle)',
                      cursor: 'pointer',
                      padding: '0.45rem 0.55rem',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    title={isListening ? 'Stop Voice Recording' : 'Dictate Query via Voice'}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>

                  {/* Submit Button */}
                  <button
                    id="hub-ai-task-submit-btn"
                    type="submit"
                    disabled={!query.trim() || loading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      background: !query.trim() || loading ? 'rgba(255, 255, 255, 0.1)' : productConfig.gradient,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '0.75rem',
                      padding: '0.6rem 1.15rem',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      cursor: !query.trim() || loading ? 'not-allowed' : 'pointer',
                      opacity: !query.trim() || loading ? 0.6 : 1,
                      boxShadow: query.trim() && !loading ? `0 4px 16px ${productConfig.accentColor}66` : 'none',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <span>Execute</span>
                        <Send size={14} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
