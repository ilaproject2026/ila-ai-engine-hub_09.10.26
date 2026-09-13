import { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  MessageSquare,
  ArrowRight,
  Download,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Database,
  Layers,
  FileText,
  Calendar,
  Handshake,
} from 'lucide-react';
import type { ChatSession } from '../services/dbService';
import { getAIProductConfig, type AIProductType } from '../services/aiHubConfig';

interface ResourcesDataHubViewProps {
  sessions: ChatSession[];
  onOpenSessionInWorkspace: (session: ChatSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onExportJSON?: () => void;
  onNavigateToChat?: () => void;
  onNavigateToCourseCreator?: () => void;
}

type FilterCategory = 'all' | 'courses' | 'chats' | 'slides' | 'ai_tools' | 'tieups';

export default function ResourcesDataHubView({
  sessions,
  onOpenSessionInWorkspace,
  onDeleteSession,
  onExportJSON,
  onNavigateToChat,
}: ResourcesDataHubViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered list of stored resources
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Category filter
      if (activeCategory === 'courses' && s.productType !== 'course_creator' && s.productType !== undefined) {
        return false;
      }
      if (activeCategory === 'chats' && s.productType !== 'ila_chat') {
        return false;
      }
      if (activeCategory === 'slides' && !s.title.toLowerCase().includes('slide') && !s.coursePlan?.chapters?.some((c) => c.title.toLowerCase().includes('slide'))) {
        return false;
      }
      if (activeCategory === 'ai_tools' && (s.productType === 'course_creator' || s.productType === 'ila_chat' || s.productType === 'ai_tieup_creator' || !s.productType)) {
        return false;
      }
      if (activeCategory === 'tieups' && s.productType !== 'ai_tieup_creator') {
        return false;
      }

      // Search filter
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const titleMatch = (s.title || '').toLowerCase().includes(query);
      const msgMatch = (s.messages || []).some((m) => (m.content || '').toLowerCase().includes(query));
      const planMatch = (s.coursePlan?.title || '').toLowerCase().includes(query);
      return titleMatch || msgMatch || planMatch;
    });
  }, [sessions, activeCategory, searchQuery]);

  // Summary statistics
  const stats = useMemo(() => {
    const total = sessions.length;
    const courses = sessions.filter((s) => s.productType === 'course_creator' || !s.productType).length;
    const chats = sessions.filter((s) => s.productType === 'ila_chat').length;
    const tieups = sessions.filter((s) => s.productType === 'ai_tieup_creator').length;
    const specialized = sessions.filter((s) => s.productType && s.productType !== 'course_creator' && s.productType !== 'ila_chat' && s.productType !== 'ai_tieup_creator').length;
    return { total, courses, chats, tieups, specialized };
  }, [sessions]);

  const handleCopySummary = (s: ChatSession) => {
    const text = `Resource: ${s.title}\nMessages: ${s.messages.length}\nUpdated: ${new Date(s.updatedAt).toLocaleDateString()}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(s.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div
      id="resources-data-hub-view"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflowY: 'auto',
        background: 'var(--bg-primary)',
        color: 'var(--text-main)',
        padding: '1.75rem 2.25rem',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Header Section */}
      <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)',
                }}
              >
                <Database size={18} />
              </div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.025em', margin: 0, color: 'var(--text-main)' }}>
                Resources & Output Repository
              </h1>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0, maxWidth: '680px', lineHeight: '1.5' }}>
              Centralized Data Hub for all generated course curricula, conversational prompt transcripts, slide decks, and exported knowledge artifacts.
            </p>
          </div>

          {/* Action Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {onExportJSON && (
              <button
                type="button"
                onClick={onExportJSON}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.95rem',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-main)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                title="Export all stored repository outputs to JSON"
              >
                <Download size={13} />
                <span>Export JSON Backup</span>
              </button>
            )}

            {onNavigateToChat && (
              <button
                type="button"
                onClick={onNavigateToChat}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 1rem',
                  borderRadius: '9999px',
                  background: 'var(--accent-gradient)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 12px var(--accent-glow)',
                  transition: 'all 0.2s ease',
                }}
              >
                <MessageSquare size={13} />
                <span>Open Chat</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Key Stats Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.85rem',
            marginTop: '0.25rem',
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: '0.9rem 1.15rem',
              borderRadius: '0.85rem',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Resources
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                {stats.total}
              </div>
            </div>
            <div style={{ width: '34px', height: '34px', borderRadius: '0.55rem', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
              <Layers size={18} />
            </div>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '0.9rem 1.15rem',
              borderRadius: '0.85rem',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Course Curricula
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.15rem' }}>
                {stats.courses}
              </div>
            </div>
            <div style={{ width: '34px', height: '34px', borderRadius: '0.55rem', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
              <BookOpen size={18} />
            </div>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '0.9rem 1.15rem',
              borderRadius: '0.85rem',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Chat Transcripts
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#a855f7', marginTop: '0.15rem' }}>
                {stats.chats}
              </div>
            </div>
            <div style={{ width: '34px', height: '34px', borderRadius: '0.55rem', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
              <MessageSquare size={18} />
            </div>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '0.9rem 1.15rem',
              borderRadius: '0.85rem',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                AI Engine Outputs
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981', marginTop: '0.15rem' }}>
                {stats.specialized}
              </div>
            </div>
            <div style={{ width: '34px', height: '34px', borderRadius: '0.55rem', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <Sparkles size={18} />
            </div>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '0.9rem 1.15rem',
              borderRadius: '0.85rem',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Tie-up Partner Tables
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#d946ef', marginTop: '0.15rem' }}>
                {stats.tieups}
              </div>
            </div>
            <div style={{ width: '34px', height: '34px', borderRadius: '0.55rem', background: 'rgba(217, 70, 239, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d946ef' }}>
              <Handshake size={18} />
            </div>
          </div>
        </div>

        {/* 3. Search & Filter Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            padding: '0.75rem 0',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {/* Search Box */}
          <div
            style={{
              position: 'relative',
              flex: 1,
              minWidth: '260px',
              maxWidth: '480px',
            }}
          >
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved outputs, topics, or transcripts..."
              style={{
                width: '100%',
                padding: '0.48rem 1rem 0.48rem 2.4rem',
                borderRadius: '9999px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Filter Categories */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Resources' },
              { id: 'courses', label: 'Course Curricula' },
              { id: 'chats', label: 'Chat Transcripts' },
              { id: 'slides', label: 'Slide Decks' },
              { id: 'ai_tools', label: 'Specialized AI' },
              { id: 'tieups', label: 'Tie-up & Partner Tables' },
            ].map((tab) => {
              const isSelected = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id as FilterCategory)}
                  style={{
                    padding: '0.35rem 0.8rem',
                    borderRadius: '9999px',
                    background: isSelected ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.05)',
                    border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Output Items Grid */}
        {filteredSessions.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: '3.5rem 2rem',
              borderRadius: '1rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              marginTop: '1rem',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <FileText size={26} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              No Resources Found
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '420px', margin: 0 }}>
              {searchQuery
                ? `No saved outputs match "${searchQuery}". Try a different keyword.`
                : 'No saved resources yet. Generate a course or chat query to save it to your repository.'}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '1rem',
              marginTop: '0.5rem',
              paddingBottom: '2rem',
            }}
          >
            {filteredSessions.map((session) => {
              const isCourse = session.productType === 'course_creator' || !session.productType;
              const isChat = session.productType === 'ila_chat';
              const isTieup = session.productType === 'ai_tieup_creator';
              const aiConfig = !isCourse && !isChat && !isTieup && session.productType ? getAIProductConfig(session.productType as AIProductType) : null;

              const badgeColor = isCourse ? '#38bdf8' : isChat ? '#818cf8' : isTieup ? '#d946ef' : aiConfig?.accentColor || '#10b981';
              const badgeName = isCourse ? 'Course Curriculum' : isChat ? 'General Chat' : isTieup ? 'Tie-up Leads Table' : aiConfig?.shortName || session.productType;

              // Last message excerpt
              const lastMsg = session.messages.length > 0 ? session.messages[session.messages.length - 1].content : '';
              const cleanExcerpt = lastMsg.replace(/[#*`_]/g, '').slice(0, 160) || 'Empty resource';

              return (
                <div
                  key={session.id}
                  className="interactive-card glass-panel"
                  style={{
                    padding: '1.15rem',
                    borderRadius: '0.95rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.9rem',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-secondary)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {/* Badge & Date */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.55rem',
                          borderRadius: '9999px',
                          background: `${badgeColor}18`,
                          border: `1px solid ${badgeColor}40`,
                          color: badgeColor,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {badgeName}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={11} />
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      style={{
                        fontSize: '0.96rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        margin: 0,
                        lineHeight: '1.35',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                      title={session.title}
                    >
                      {session.title || 'Untitled Resource'}
                    </h3>

                    {/* Excerpt */}
                    <p
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        margin: 0,
                        lineHeight: '1.45',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {cleanExcerpt}
                    </p>
                  </div>

                  {/* Footer Stats & Actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '0.65rem',
                      borderTop: '1px solid var(--border-subtle)',
                      gap: '0.5rem',
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                      {session.messages.length} messages
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => handleCopySummary(session)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          padding: '0.3rem',
                          borderRadius: '0.4rem',
                          cursor: 'pointer',
                        }}
                        title="Copy Summary"
                      >
                        {copiedId === session.id ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteSession(session.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#f87171',
                          padding: '0.3rem',
                          borderRadius: '0.4rem',
                          cursor: 'pointer',
                        }}
                        title="Delete Resource"
                      >
                        <Trash2 size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenSessionInWorkspace(session)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.32rem 0.75rem',
                          borderRadius: '9999px',
                          background: `${badgeColor}18`,
                          border: `1px solid ${badgeColor}50`,
                          color: badgeColor,
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>Open</span>
                        <ArrowRight size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
