import { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Activity,
  Sparkles,
  TrendingUp,
  Download,
  Search,
  ArrowRight,
  Lightbulb,
  Target,
  SlidersHorizontal,
  Sliders,
  ExternalLink,
  Home,
  Plus,
} from 'lucide-react';
import {
  AI_PRODUCTS,
  type AIProductType,
  getAIProductConfig,
} from '../services/aiHubConfig';
import { renderAIProductIcon } from './AIHubDropdown';
import type { ChatSession } from '../services/dbService';
import { getAllDynamicParameters } from '../services/parameterService';

interface CentralDashboardViewProps {
  sessions: ChatSession[];
  onSelectProduct: (productId: AIProductType) => void;
  onSelectSession: (sessionId: string) => void;
  onOpenParameterInput: () => void;
  onOpenParameterList: () => void;
  onReturnToHome: () => void;
}

export default function CentralDashboardView({
  sessions,
  onSelectProduct,
  onSelectSession,
  onOpenParameterInput,
  onOpenParameterList,
  onReturnToHome,
}: CentralDashboardViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');

  // Load all dynamic parameters
  const dynamicParams = useMemo(() => {
    return getAllDynamicParameters();
  }, []);

  // Filter sessions according to date filter & search query
  const filteredSessions = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    return sessions.filter((s) => {
      const sessionDate = s.updatedAt || s.createdAt || now;
      if (dateFilter === 'today' && now - sessionDate > oneDay) return false;
      if (dateFilter === '7days' && now - sessionDate > 7 * oneDay) return false;
      if (dateFilter === '30days' && now - sessionDate > 30 * oneDay) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = s.title.toLowerCase().includes(q);
        const matchesMsg = s.messages.some((m) => m.content.toLowerCase().includes(q));
        if (!matchesTitle && !matchesMsg) return false;
      }
      return true;
    });
  }, [sessions, dateFilter, searchQuery]);

  // Global Aggregate Metrics
  const globalMetrics = useMemo(() => {
    let totalOutputs = 0;
    let totalPrompts = 0;
    let totalDocs = 0;
    let totalWords = 0;
    const toolCounts: Record<string, number> = {};

    filteredSessions.forEach((s) => {
      const prod = s.productType || 'course_creator';
      let assistantMsgCount = 0;

      s.messages.forEach((m) => {
        if (m.role === 'assistant') {
          totalOutputs += 1;
          assistantMsgCount += 1;
          totalWords += m.content.split(/\s+/).filter(Boolean).length;
        } else if (m.role === 'user') {
          totalPrompts += 1;
          if (m.documents) totalDocs += m.documents.length;
        }
      });

      if (s.attachedDocuments) totalDocs += s.attachedDocuments.length;
      toolCounts[prod] = (toolCounts[prod] || 0) + (assistantMsgCount || 1);
    });

    return {
      totalSessions: filteredSessions.length,
      totalOutputs,
      totalPrompts,
      totalDocs,
      totalWords,
      toolCounts,
    };
  }, [filteredSessions]);

  // Domain Breakdown metrics
  const domainBreakdown = useMemo(() => {
    const categories: Record<string, { count: number; tools: AIProductType[] }> = {
      'Core & Guidance': { count: 0, tools: [] },
      'Visa & Careers': { count: 0, tools: [] },
      'Corporate & Operations': { count: 0, tools: [] },
      'Growth & Partnerships': { count: 0, tools: [] },
    };

    AI_PRODUCTS.forEach((p) => {
      if (!categories[p.category]) {
        categories[p.category] = { count: 0, tools: [] };
      }
      categories[p.category].tools.push(p.id);
      categories[p.category].count += globalMetrics.toolCounts[p.id] || 0;
    });

    return categories;
  }, [globalMetrics]);

  // Recent interaction events
  const recentEvents = useMemo(() => {
    const events: Array<{
      sessionId: string;
      sessionTitle: string;
      productType: AIProductType;
      timestamp: number;
      prompt: string;
      responseSnippet: string;
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
            responseSnippet: nextAssistant ? nextAssistant.content.slice(0, 160) + '...' : 'Prompt logged',
          });
        }
      }
    });

    return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, 15);
  }, [filteredSessions]);

  // Export full dashboard CSV
  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Date', 'Tool', 'Session Title', 'User Prompt', 'Response Preview'];
    const rows = recentEvents.map((e) => [
      e.timestamp,
      `"${new Date(e.timestamp).toLocaleString()}"`,
      `"${getAIProductConfig(e.productType).name}"`,
      `"${e.sessionTitle.replace(/"/g, '""')}"`,
      `"${e.prompt.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${e.responseSnippet.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ila_central_dashboard_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div
      id="central-dashboard-view"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        background: 'var(--bg-primary)',
        color: 'var(--text-main)',
      }}
    >
      {/* Top Banner & Control Bar */}
      <div
        style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(10, 13, 20, 0.8)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '0.85rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
              flexShrink: 0,
            }}
          >
            <LayoutDashboard size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
                ILA AI Hub Central Dashboard
              </h1>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.6rem',
                  borderRadius: '9999px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  color: '#a5b4fc',
                }}
              >
                {AI_PRODUCTS.length} AI Engines Active
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-subtle)', margin: '0.2rem 0 0 0' }}>
              Centralized activity oversight, cross-module output counters, marketing analytics & dynamic rule engine
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* AI Parameter Input Button */}
          <button
            type="button"
            onClick={onOpenParameterInput}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '0.55rem',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#a5b4fc',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Add real-time prompt parameters and voice instructions"
          >
            <SlidersHorizontal size={13} color="#818cf8" />
            <span>AI Parameter Input</span>
          </button>

          {/* Parameter List Button */}
          <button
            type="button"
            onClick={onOpenParameterList}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '0.55rem',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: '#d8b4fe',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="View all active system rules and constraints"
          >
            <Sliders size={13} color="#c084fc" />
            <span>Parameter List ({dynamicParams.filter((p) => p.isActive).length})</span>
          </button>

          {/* Export Report */}
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.8rem',
              borderRadius: '0.55rem',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title="Export full dashboard summary as CSV"
          >
            <Download size={13} />
            <span>Export Report</span>
          </button>

          {/* Return to Chat / Course Studio */}
          <button
            type="button"
            onClick={() => onSelectProduct('course_creator')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 1rem',
              borderRadius: '9999px',
              background: 'var(--accent-gradient)',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 14px var(--accent-glow)',
              transition: 'transform 0.15s ease',
            }}
          >
            <Home size={14} />
            <span>Course Studio</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          padding: '0.85rem 2rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(15, 23, 42, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', fontWeight: 600, marginRight: '0.25rem' }}>
            Period:
          </span>
          {(['all', 'today', '7days', '30days'] as const).map((df) => {
            const isSel = dateFilter === df;
            const labels = { all: 'All Time', today: 'Today', '7days': 'Last 7 Days', '30days': 'Last 30 Days' };
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
                  background: isSel ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSel ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid var(--border-subtle)',
                  color: isSel ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                }}
              >
                {labels[df]}
              </button>
            );
          })}
        </div>

        {/* Search */}
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
            placeholder="Search all cross-engine outputs..."
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
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* 1. Global Stat Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {/* Total Outputs */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0.02) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '1rem',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Total Generated Outputs</span>
              <Sparkles size={18} color="#818cf8" />
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em' }}>
              {globalMetrics.totalOutputs}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#a5b4fc' }}>
              Across {globalMetrics.totalSessions} active workspaces
            </span>
          </div>

          {/* User Prompts */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(56, 189, 248, 0.02) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '1rem',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Total Prompts Processed</span>
              <Activity size={18} color="#38bdf8" />
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em' }}>
              {globalMetrics.totalPrompts}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#7dd3fc' }}>
              Multi-turn dialogues & live queries
            </span>
          </div>

          {/* Words Synthesized */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.02) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '1rem',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Words Synthesized</span>
              <TrendingUp size={18} color="#34d399" />
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em' }}>
              {globalMetrics.totalWords.toLocaleString()}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#6ee7b7' }}>
              Textbooks, tariffs, proposals & slides
            </span>
          </div>

          {/* Active AI Parameters */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(168, 85, 247, 0.02) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '1rem',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              cursor: 'pointer',
            }}
            onClick={onOpenParameterList}
            title="Click to view all parameters"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Live AI System Rules</span>
              <Sliders size={18} color="#c084fc" />
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.03em' }}>
              {dynamicParams.filter((p) => p.isActive).length}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#d8b4fe' }}>
              Active constraints & prompt modifiers
            </span>
          </div>
        </div>

        {/* 2. Four Domain Pillars Breakdown & Live Status */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {Object.entries(domainBreakdown).map(([domain, data]) => {
            const percent = globalMetrics.totalOutputs > 0 ? Math.round((data.count / globalMetrics.totalOutputs) * 100) : 0;
            return (
              <div
                key={domain}
                style={{
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '1rem',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff' }}>
                    {domain}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#818cf8',
                    }}
                  >
                    {data.count} outputs ({percent}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(percent, 5)}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #38bdf8)', borderRadius: '9999px' }} />
                </div>

                {/* Sub-tools pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                  {data.tools.map((tId) => {
                    const cfg = getAIProductConfig(tId);
                    return (
                      <span
                        key={tId}
                        onClick={() => onSelectProduct(tId)}
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '0.4rem',
                          background: `${cfg.accentColor}12`,
                          border: `1px solid ${cfg.accentColor}30`,
                          color: cfg.accentColor,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                        title={`Open ${cfg.name}`}
                      >
                        {cfg.shortName}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. 16 AI Modules Full Control Matrix */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '1.25rem',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                {AI_PRODUCTS.length} Specialized AI Engines Matrix & Output Counters
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', margin: '0.2rem 0 0 0' }}>
                Directly monitor output production, active parameters, and launch dedicated tool workspaces
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={onOpenParameterInput}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.35)',
                  color: '#a5b4fc',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Plus size={12} />
                <span>Add AI Rule</span>
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem',
            }}
          >
            {AI_PRODUCTS.map((prod) => {
              const count = globalMetrics.toolCounts[prod.id] || 0;
              const prodParams = dynamicParams.filter((p) => p.productId === prod.id && p.isActive);

              return (
                <div
                  key={prod.id}
                  onClick={() => onSelectProduct(prod.id)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '0.85rem',
                    padding: '1.1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.borderColor = `${prod.accentColor}60`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  title={`Launch ${prod.name}`}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '0.55rem',
                          background: `${prod.accentColor}18`,
                          color: prod.accentColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {renderAIProductIcon(prod.icon, 18)}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                          {prod.name}
                        </h4>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                          {prod.category}
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.55rem',
                        borderRadius: '9999px',
                        background: count > 0 ? `${prod.accentColor}20` : 'rgba(255, 255, 255, 0.05)',
                        color: count > 0 ? prod.accentColor : 'var(--text-subtle)',
                        border: count > 0 ? `1px solid ${prod.accentColor}40` : '1px solid var(--border-subtle)',
                      }}
                    >
                      {count} outputs
                    </span>
                  </div>

                  <p style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', margin: 0, lineHeight: '1.4' }}>
                    {prod.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '0.6rem' }}>
                    <span style={{ fontSize: '0.68rem', color: prodParams.length > 0 ? '#6ee7b7' : 'var(--text-subtle)' }}>
                      ⚙️ {prodParams.length} custom AI rules active
                    </span>

                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', fontWeight: 700, color: prod.accentColor }}>
                      Launch Workspace <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Marketing Insights & Promotional Opportunities */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.02) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '1.25rem',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '0.6rem',
                background: 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Target size={20} color="#34d399" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                AI-Driven Marketing Strategy & Promotion Opportunities
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.8)', margin: '0.15rem 0 0 0' }}>
                Generated dynamically from real-time customer dialogues, parameter utilization, and multi-tool activity
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '0.75rem', padding: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <Lightbulb size={16} color="#fbbf24" />
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>Course Creator & Pricing Bundle</h4>
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', margin: 0, lineHeight: '1.5' }}>
                High generation volume across educational masterclasses indicates strong demand for packaged multi-tier enterprise curriculum licenses.
              </p>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '0.75rem', padding: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <Lightbulb size={16} color="#fbbf24" />
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>Visa & Mobility Candidate Funnel</h4>
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', margin: 0, lineHeight: '1.5' }}>
                Users analyzing relocation documents benefit from bundled language tutoring (CEFR B1/B2) and interview preparation tools.
              </p>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '0.75rem', padding: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <Lightbulb size={16} color="#fbbf24" />
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>Senior Marketing Manager Rebuttals</h4>
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', margin: 0, lineHeight: '1.5' }}>
                Deploy active objection battlecard rules into customer demos to maximize conversion velocity on high-value business proposals.
              </p>
            </div>
          </div>
        </div>

        {/* 5. Recent Global Activity Log */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '1.25rem',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Recent Cross-Engine Interactions ({recentEvents.length})
            </h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
              Live SQLite Audit Trail
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentEvents.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.82rem' }}>
                No recent activity events found.
              </div>
            ) : (
              recentEvents.map((evt, idx) => {
                const prodConfig = getAIProductConfig(evt.productType);
                return (
                  <div
                    key={`${evt.sessionId}-${idx}`}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '0.75rem',
                      padding: '0.9rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
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
                          flexShrink: 0,
                        }}
                      >
                        {renderAIProductIcon(prodConfig.icon, 11)}
                        <span>{prodConfig.shortName}</span>
                      </span>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {evt.sessionTitle}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {evt.prompt}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSession(evt.sessionId);
                          onSelectProduct(evt.productType);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          background: 'rgba(99, 102, 241, 0.12)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: '#a5b4fc',
                          borderRadius: '0.4rem',
                          padding: '0.2rem 0.55rem',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <span>Open</span>
                        <ExternalLink size={10} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
