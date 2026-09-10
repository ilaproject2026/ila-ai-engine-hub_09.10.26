import { useState, useMemo } from 'react';
import {
  X,
  Search,
  Activity,
  BarChart3,
  TrendingUp,
  FileText,
  Clock,
  Sparkles,
  Download,
  CheckCircle2,
  ChevronDown,
  ArrowUpRight,
  Lightbulb,
  Target,
  ExternalLink,
} from 'lucide-react';
import {
  AI_PRODUCTS,
  type AIProductType,
  getAIProductConfig,
} from '../services/aiHubConfig';
import { renderAIProductIcon } from './AIHubDropdown';
import type { ChatSession } from '../services/dbService';

interface ActivityTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProductId: AIProductType;
  sessions: ChatSession[];
  onSelectSession?: (sessionId: string) => void;
  onSelectProduct?: (productId: AIProductType) => void;
}

type DateRangeFilter = 'all' | 'today' | '7days' | '30days' | 'custom';

export default function ActivityTrackerModal({
  isOpen,
  onClose,
  activeProductId,
  sessions,
  onSelectSession,
  onSelectProduct,
}: ActivityTrackerModalProps) {
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>(activeProductId);
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'insights'>('overview');

  // Filter sessions according to product, date range, and search query
  const filteredSessions = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    return sessions.filter((s) => {
      // 1. Product Filter
      if (selectedProductFilter !== 'all') {
        const prod = s.productType || 'course_creator';
        if (prod !== selectedProductFilter) return false;
      }

      // 2. Date Filter
      const sessionDate = s.updatedAt || s.createdAt || now;
      if (dateFilter === 'today') {
        if (now - sessionDate > oneDay) return false;
      } else if (dateFilter === '7days') {
        if (now - sessionDate > 7 * oneDay) return false;
      } else if (dateFilter === '30days') {
        if (now - sessionDate > 30 * oneDay) return false;
      } else if (dateFilter === 'custom') {
        if (customStartDate) {
          const startTimestamp = new Date(customStartDate).setHours(0, 0, 0, 0);
          if (sessionDate < startTimestamp) return false;
        }
        if (customEndDate) {
          const endTimestamp = new Date(customEndDate).setHours(23, 59, 59, 999);
          if (sessionDate > endTimestamp) return false;
        }
      }

      // 3. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = s.title.toLowerCase().includes(query);
        const matchesMessage = s.messages.some((m) =>
          m.content.toLowerCase().includes(query)
        );
        const matchesParams = s.productParams
          ? Object.values(s.productParams).some((v) => v.toLowerCase().includes(query))
          : false;
        if (!matchesTitle && !matchesMessage && !matchesParams) return false;
      }

      return true;
    });
  }, [sessions, selectedProductFilter, dateFilter, customStartDate, customEndDate, searchQuery]);

  // Aggregate Metrics & Output Counters across filtered sessions
  const metrics = useMemo(() => {
    let totalOutputs = 0;
    let totalUserPrompts = 0;
    let totalDocumentsProcessed = 0;
    let totalWordsGenerated = 0;
    const toolCounts: Record<string, number> = {};

    filteredSessions.forEach((s) => {
      const prod = s.productType || 'course_creator';
      let assistantMsgCount = 0;

      s.messages.forEach((m) => {
        if (m.role === 'assistant') {
          totalOutputs += 1;
          assistantMsgCount += 1;
          totalWordsGenerated += m.content.split(/\s+/).filter(Boolean).length;
        } else if (m.role === 'user') {
          totalUserPrompts += 1;
          if (m.documents && m.documents.length > 0) {
            totalDocumentsProcessed += m.documents.length;
          }
        }
      });

      if (s.attachedDocuments) {
        totalDocumentsProcessed += s.attachedDocuments.length;
      }

      toolCounts[prod] = (toolCounts[prod] || 0) + (assistantMsgCount || 1);
    });

    return {
      totalSessions: filteredSessions.length,
      totalOutputs,
      totalUserPrompts,
      totalDocumentsProcessed,
      totalWordsGenerated,
      toolCounts,
    };
  }, [filteredSessions]);

  // Extract individual interaction events for the history timeline
  const activityEvents = useMemo(() => {
    const events: Array<{
      sessionId: string;
      sessionTitle: string;
      productType: AIProductType;
      timestamp: number;
      prompt: string;
      responseSnippet: string;
      wordCount: number;
      docCount: number;
    }> = [];

    filteredSessions.forEach((s) => {
      const prod = (s.productType || 'course_creator') as AIProductType;
      for (let i = 0; i < s.messages.length; i++) {
        const m = s.messages[i];
        if (m.role === 'user') {
          const nextAssistant = s.messages[i + 1]?.role === 'assistant' ? s.messages[i + 1] : null;
          events.push({
            sessionId: s.id,
            sessionTitle: s.title,
            productType: prod,
            timestamp: m.timestamp || s.updatedAt || Date.now(),
            prompt: m.content,
            responseSnippet: nextAssistant ? nextAssistant.content.slice(0, 180) + '...' : 'Processing / Prompt logged',
            wordCount: nextAssistant ? nextAssistant.content.split(/\s+/).length : 0,
            docCount: m.documents?.length || 0,
          });
        }
      }
    });

    return events.sort((a, b) => b.timestamp - a.timestamp);
  }, [filteredSessions]);

  // Dynamic Marketing & Growth Insights Generator
  const marketingInsights = useMemo(() => {
    const total = metrics.totalOutputs || 1;
    const sortedTools = Object.entries(metrics.toolCounts).sort((a, b) => b[1] - a[1]);
    const topTool = sortedTools.length > 0 ? sortedTools[0] : ['course_creator', 0];
    const topConfig = getAIProductConfig(topTool[0] as AIProductType);

    const insights = [
      {
        title: 'Top Performing AI Engine',
        description: `${topConfig.name} accounts for ${Math.round(
          ((topTool[1] as number) / total) * 100
        )}% of all platform activity (${topTool[1]} outputs generated).`,
        action: `Recommended Campaign: Feature "${topConfig.shortName}" in upcoming corporate newsletters & client onboarding demos.`,
      },
      {
        title: 'Cross-Tool Promotion Opportunity',
        description: 'Users interacting with Course Creator & Pricing tools demonstrate strong interest in bundled enterprise masterclasses and automated curriculum licensing.',
        action: 'Launch a targeted promo bundling "AI Pricing Tool" with "Course Creator Masterclasses".',
      },
      {
        title: 'Client Engagement & Retention',
        description: `Average user dialogue depth is ${
          metrics.totalSessions > 0
            ? (metrics.totalUserPrompts / metrics.totalSessions).toFixed(1)
            : '0'
        } queries per workspace with ${metrics.totalDocumentsProcessed} reference files ingested.`,
        action: 'Enable "AI Live Consultant" and "Senior Marketing Manager" for high-touch customer conversion calls.',
      },
    ];

    return insights;
  }, [metrics]);

  // Export filtered activity report to CSV
  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Date', 'Tool', 'Session Title', 'User Prompt', 'Response Preview', 'Word Count', 'Docs'];
    const rows = activityEvents.map((e) => [
      e.timestamp,
      `"${new Date(e.timestamp).toLocaleString()}"`,
      `"${getAIProductConfig(e.productType).name}"`,
      `"${e.sessionTitle.replace(/"/g, '""')}"`,
      `"${e.prompt.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${e.responseSnippet.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      e.wordCount,
      e.docCount,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ila_ai_hub_activity_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div
      id="activity-tracker-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 7, 13, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        id="activity-tracker-modal-container"
        style={{
          width: '100%',
          maxWidth: '1050px',
          maxHeight: '90vh',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '1.25rem',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Activity size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: '#ffffff',
                    margin: 0,
                  }}
                >
                  ILA AI Hub Activity Tracker & Dashboard
                </h2>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    color: '#a5b4fc',
                  }}
                >
                  Live Analytics
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', margin: '0.2rem 0 0 0' }}>
                Real-time generated output counters, date-filtered audit trails, and marketing conversion insights
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={handleExportCSV}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '0.55rem',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                color: '#a5b4fc',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Export filtered activity metrics as CSV report"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '0.55rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.45rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              title="Close Tracker (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Toolbar & Tab Switcher */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(10, 14, 24, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            {/* View Tabs */}
            <div
              style={{
                display: 'inline-flex',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '0.6rem',
                padding: '0.2rem',
                gap: '0.25rem',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '0.45rem',
                  background: activeTab === 'overview' ? 'var(--accent-gradient)' : 'transparent',
                  border: 'none',
                  color: activeTab === 'overview' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <BarChart3 size={13} />
                <span>Overview & Counters</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '0.45rem',
                  background: activeTab === 'history' ? 'var(--accent-gradient)' : 'transparent',
                  border: 'none',
                  color: activeTab === 'history' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Clock size={13} />
                <span>Interaction Timeline ({activityEvents.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('insights')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '0.45rem',
                  background: activeTab === 'insights' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                  border: 'none',
                  color: activeTab === 'insights' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Lightbulb size={13} />
                <span>Marketing Insights</span>
              </button>
            </div>

            {/* Product Filter Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Tool Scope:</span>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedProductFilter}
                  onChange={(e) => setSelectedProductFilter(e.target.value)}
                  style={{
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    padding: '0.38rem 2rem 0.38rem 0.75rem',
                    borderRadius: '0.55rem',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="all" style={{ background: '#0f172a', color: '#ffffff' }}>
                    🌐 All 16 AI Engines (Global)
                  </option>
                  {AI_PRODUCTS.map((p) => (
                    <option key={p.id} value={p.id} style={{ background: '#0f172a', color: '#ffffff' }}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  style={{
                    position: 'absolute',
                    right: '0.65rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: 'var(--text-subtle)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Date Filter Pills & Keyword Search */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', fontWeight: 600, marginRight: '0.25rem' }}>
                Date Range:
              </span>
              {(['all', 'today', '7days', '30days', 'custom'] as DateRangeFilter[]).map((df) => {
                const isSelected = dateFilter === df;
                const labels: Record<DateRangeFilter, string> = {
                  all: 'All Time',
                  today: 'Today',
                  '7days': 'Last 7 Days',
                  '30days': 'Last 30 Days',
                  custom: 'Custom Range',
                };
                return (
                  <button
                    key={df}
                    type="button"
                    onClick={() => setDateFilter(df)}
                    style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '0.45rem',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid var(--border-subtle)',
                      color: isSelected ? '#ffffff' : 'var(--text-muted)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {labels[df]}
                  </button>
                );
              })}

              {dateFilter === 'custom' && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.5rem' }}>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.4rem',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '0.72rem',
                    }}
                    title="Start Date"
                  />
                  <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.4rem',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '0.72rem',
                    }}
                    title="End Date"
                  />
                </div>
              )}
            </div>

            {/* Keyword Search Input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '0.55rem',
                padding: '0.32rem 0.75rem',
                minWidth: '240px',
              }}
            >
              <Search size={13} color="var(--text-subtle)" />
              <input
                type="text"
                placeholder="Search queries, keywords, titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-main)',
                  fontSize: '0.76rem',
                  width: '100%',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-subtle)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Main Content Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {/* TAB 1: OVERVIEW & OUTPUT COUNTERS */}
          {activeTab === 'overview' && (
            <>
              {/* Primary Stat Counter Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                }}
              >
                {/* Stat 1: Total Outputs */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0.03) 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '0.85rem',
                    padding: '1.1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Total Generated Outputs</span>
                    <Sparkles size={16} color="#818cf8" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
                    {metrics.totalOutputs}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#a5b4fc' }}>
                    Across {metrics.totalSessions} active sessions
                  </span>
                </div>

                {/* Stat 2: User Prompts & Inquiries */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(56, 189, 248, 0.03) 100%)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '0.85rem',
                    padding: '1.1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', fontWeight: 600 }}>User Prompts Processed</span>
                    <Activity size={16} color="#38bdf8" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
                    {metrics.totalUserPrompts}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#7dd3fc' }}>
                    Average {(metrics.totalUserPrompts / (metrics.totalSessions || 1)).toFixed(1)} turns/session
                  </span>
                </div>

                {/* Stat 3: Total Words Synthesized */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.03) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '0.85rem',
                    padding: '1.1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Words Synthesized</span>
                    <TrendingUp size={16} color="#34d399" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
                    {metrics.totalWordsGenerated.toLocaleString()}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#6ee7b7' }}>
                    Authoritative educational & business content
                  </span>
                </div>

                {/* Stat 4: Reference Documents Ingested */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(244, 63, 94, 0.03) 100%)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    borderRadius: '0.85rem',
                    padding: '1.1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Documents Ingested</span>
                    <FileText size={16} color="#fb7185" />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
                    {metrics.totalDocumentsProcessed}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#fda4af' }}>
                    PDFs, DOCX, TXT & spreadsheets analyzed
                  </span>
                </div>
              </div>

              {/* Breakdown per Specialized Tool */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                    Activity Breakdown by Specialized AI Engine (16 Modules)
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                    Outputs & Workspaces Generated
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  {AI_PRODUCTS.map((prod) => {
                    const count = metrics.toolCounts[prod.id] || 0;
                    const isCurrentTool = prod.id === activeProductId;

                    return (
                      <div
                        key={prod.id}
                        onClick={() => {
                          if (onSelectProduct) {
                            onSelectProduct(prod.id);
                            onClose();
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem 1rem',
                          borderRadius: '0.65rem',
                          background: isCurrentTool ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                          border: isCurrentTool ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isCurrentTool ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)';
                        }}
                        title={`Click to switch to ${prod.name}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '0.45rem',
                              background: `${prod.accentColor}18`,
                              color: prod.accentColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {renderAIProductIcon(prod.icon, 14)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                color: '#ffffff',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {prod.name}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>
                              {prod.category}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              background: count > 0 ? `${prod.accentColor}20` : 'rgba(255, 255, 255, 0.05)',
                              color: count > 0 ? prod.accentColor : 'var(--text-subtle)',
                              border: count > 0 ? `1px solid ${prod.accentColor}40` : '1px solid var(--border-subtle)',
                            }}
                          >
                            {count} outputs
                          </span>
                          <ArrowUpRight size={12} color="var(--text-subtle)" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: INTERACTION TIMELINE & AUDIT TRAIL */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff' }}>
                  Showing {activityEvents.length} filtered interactions
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                  Sorted latest first
                </span>
              </div>

              {activityEvents.length === 0 ? (
                <div
                  style={{
                    padding: '3rem 1rem',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed var(--border-subtle)',
                    borderRadius: '0.85rem',
                    color: 'var(--text-subtle)',
                  }}
                >
                  <Activity size={32} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
                  <p style={{ margin: 0, fontSize: '0.88rem' }}>No activity records found matching the current filters.</p>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem' }}>Try clearing the search query or selecting 'All Time'.</p>
                </div>
              ) : (
                activityEvents.map((evt, idx) => {
                  const prodConfig = getAIProductConfig(evt.productType);
                  return (
                    <div
                      key={`${evt.sessionId}-${idx}`}
                      style={{
                        background: 'rgba(255, 255, 255, 0.025)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '0.75rem',
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              background: `${prodConfig.accentColor}18`,
                              border: `1px solid ${prodConfig.accentColor}40`,
                              color: prodConfig.accentColor,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                            }}
                          >
                            {renderAIProductIcon(prodConfig.icon, 11)}
                            <span>{prodConfig.name}</span>
                          </span>

                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {evt.sessionTitle}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                            {new Date(evt.timestamp).toLocaleString()}
                          </span>

                          {onSelectSession && (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectSession(evt.sessionId);
                                if (onSelectProduct) onSelectProduct(evt.productType);
                                onClose();
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                background: 'rgba(99, 102, 241, 0.12)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                color: '#a5b4fc',
                                borderRadius: '0.4rem',
                                padding: '0.2rem 0.5rem',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                              title="Jump directly to this session"
                            >
                              <span>Open Session</span>
                              <ExternalLink size={10} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Prompt and Output Excerpt */}
                      <div style={{ fontSize: '0.8rem', color: '#e2e8f0', lineHeight: '1.4' }}>
                        <strong style={{ color: '#818cf8' }}>User Query:</strong> {evt.prompt}
                      </div>

                      <div
                        style={{
                          fontSize: '0.76rem',
                          color: 'var(--text-subtle)',
                          background: 'rgba(0, 0, 0, 0.25)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.45rem',
                          borderLeft: `2px solid ${prodConfig.accentColor}`,
                          lineHeight: '1.4',
                        }}
                      >
                        <strong style={{ color: 'var(--text-main)' }}>Generated Preview:</strong> {evt.responseSnippet}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: MARKETING & PROMOTION INSIGHTS */}
          {activeTab === 'insights' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.04) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '0.6rem',
                    background: 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Target size={20} color="#34d399" />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.25rem 0' }}>
                    AI-Driven Marketing Strategy & Promotion Opportunities
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.8)', margin: 0, lineHeight: '1.5' }}>
                    These insights are calculated dynamically from real-time customer dialogues, frequency of AI tool utilization, and document uploads. Use them to tailor enterprise marketing campaigns, package promotions, and curriculum offerings.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {marketingInsights.map((ins, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '0.85rem',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Lightbulb size={16} color="#fbbf24" />
                      <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                        {ins.title}
                      </h4>
                    </div>

                    <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', margin: 0, lineHeight: '1.5' }}>
                      {ins.description}
                    </p>

                    <div
                      style={{
                        marginTop: 'auto',
                        background: 'rgba(99, 102, 241, 0.08)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        borderRadius: '0.5rem',
                        padding: '0.6rem 0.8rem',
                        fontSize: '0.74rem',
                        color: '#a5b4fc',
                        fontWeight: 600,
                        lineHeight: '1.4',
                      }}
                    >
                      💡 {ins.action}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Status Bar */}
        <div
          style={{
            padding: '0.75rem 1.75rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'rgba(10, 14, 24, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.74rem',
            color: 'var(--text-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={13} color="#34d399" />
            <span>SQLite Local DB Activity Feed • 16 Modules Connected</span>
          </div>
          <div>
            <span>ILA AI Hub Analytics Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
