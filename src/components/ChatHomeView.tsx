import { useState, useRef, useEffect, type FormEvent } from 'react';
import {
  Send,
  Loader2,
  Paperclip,
  X,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Sparkles,
  BookOpen,
  ArrowRight,
  MessageSquare,
  FileText,
  PanelLeft,
  Bot,
  User,
  GraduationCap,
  Download,
  Share2,
} from 'lucide-react';
import ChatSidebar from './ChatSidebar';
import DocumentUploadZone from './DocumentUploadZone';
import MarkdownRenderer from './MarkdownRenderer';
import { useVoice } from '../hooks/useVoice';
import type { ChatSession, AttachedDocument, DbStatusInfo } from '../services/dbService';
import { getIlaModelDisplayName } from '../services/geminiService';

interface ChatHomeViewProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, title: string) => void;
  onTogglePinSession: (id: string) => void;
  onClearAllSessions: () => void;
  onExportJSON: () => void;
  onImportJSON: (jsonStr: string) => void;
  onSendMessage: (query: string, documents: AttachedDocument[]) => void;
  loading: boolean;
  isDbPersisted?: boolean;
  dbHealth?: DbStatusInfo | null;
  onSpeak: (text: string, id: string, lang?: string) => void;
  isSpeaking: boolean;
  activeSpeakingId: string | null;
  onConvertToCourse: (session: ChatSession) => void;
}

const CHAT_PROMPTS = [
  {
    title: 'Study Abroad in Germany vs UK',
    prompt: 'Compare studying AI & Computer Science in Germany vs the UK: tuition fees, living costs, post-study work visa rights, and top universities.',
    tag: 'Academic Guidance',
    color: '#818cf8',
  },
  {
    title: 'German Healthcare Language Path',
    prompt: 'Give me a structured CEFR progression roadmap from A1 to C1 German for foreign doctors and nurses seeking Approbation.',
    tag: 'Language & Career',
    color: '#38bdf8',
  },
  {
    title: 'Full-Stack Curriculum Blueprint',
    prompt: 'Outline a modern 12-week Full Stack Web Development curriculum covering React 19, Node.js, PostgreSQL, and LLM API integrations.',
    tag: 'Curriculum Design',
    color: '#10b981',
  },
  {
    title: 'Executive AI Strategy Framework',
    prompt: 'How should mid-size enterprise organizations evaluate and deploy private LLM agents while maintaining data privacy and regulatory compliance?',
    tag: 'Enterprise Strategy',
    color: '#f59e0b',
  },
];

export default function ChatHomeView({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onTogglePinSession,
  onClearAllSessions,
  onExportJSON,
  onImportJSON,
  onSendMessage,
  loading,
  isDbPersisted,
  dbHealth,
  onSpeak,
  isSpeaking,
  activeSpeakingId,
  onConvertToCourse,
}: ChatHomeViewProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [attachedDocs, setAttachedDocs] = useState<AttachedDocument[]>([]);
  const [showUploadZone, setShowUploadZone] = useState<boolean>(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { isListening, toggleListening } = useVoice();

  // Active session
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;
  const messages = activeSession?.messages || [];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, loading]);

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputQuery.trim();
    if (!clean || loading) return;

    if (isListening) {
      toggleListening();
    }

    onSendMessage(clean, attachedDocs);
    setInputQuery('');
    setAttachedDocs([]);
    setShowUploadZone(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  return (
    <div
      id="chat-home-layout"
      style={{
        flex: 1,
        display: 'flex',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        background: 'var(--bg-main)',
      }}
    >
      {/* 1. LEFT CHAT HISTORY SIDEBAR (EXCLUSIVELY RENDERED HERE) */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={onSelectSession}
        onNewChat={onNewChat}
        onDeleteSession={onDeleteSession}
        onRenameSession={onRenameSession}
        onTogglePinSession={onTogglePinSession}
        onClearAllSessions={onClearAllSessions}
        onExportJSON={onExportJSON}
        onImportJSON={onImportJSON}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
        isDbPersisted={isDbPersisted}
        dbHealth={dbHealth}
        activeProductType="ila_chat"
      />

      {/* 2. MAIN CHAT HOME CONVERSATIONAL WORKSPACE */}
      <div
        id="chat-home-main-workspace"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
          minWidth: 0,
        }}
      >
        {/* Chat Home Sub-Header */}
        <div
          id="chat-home-sub-header"
          style={{
            padding: '0.6rem 1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--header-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexShrink: 0,
            zIndex: 25,
            boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Left: Sidebar Toggle + Active Conversation Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <button
              id="chat-sidebar-toggle-btn"
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
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
              title={isSidebarOpen ? 'Collapse Chat History' : 'Expand Chat History'}
            >
              <PanelLeft size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '0.65rem',
                  background: 'var(--accent-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 12px var(--accent-glow)',
                  flexShrink: 0,
                }}
              >
                <MessageSquare size={16} color="#ffffff" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '360px',
                    }}
                    title={activeSession?.title || "Ila's With You — Flagship AI Chat"}
                  >
                    {activeSession?.title || "Ila's With You — Flagship AI Chat"}
                  </span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '0.12rem 0.5rem',
                      borderRadius: '9999px',
                      background: 'rgba(99, 102, 241, 0.18)',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      color: '#a5b4fc',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Chat Home
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>{getIlaModelDisplayName()}</span>
                  <span>•</span>
                  <span>{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions (Convert to Course, New Chat) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {activeSession && messages.length > 0 && (
              <button
                id="chat-convert-to-course-btn"
                type="button"
                onClick={() => onConvertToCourse(activeSession)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.4rem 0.9rem',
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.2s ease',
                }}
                title="Convert this chat session into a structured Course Creator workspace"
              >
                <BookOpen size={13} />
                <span>Open in Course Creator</span>
                <ArrowRight size={12} />
              </button>
            )}

            <button
              id="chat-header-new-chat-btn"
              type="button"
              onClick={onNewChat}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title="Start a new conversational thread"
            >
              <Sparkles size={13} color="var(--accent-primary)" />
              <span>New Chat</span>
            </button>
          </div>
        </div>

        {/* Scrollable Message Thread Area */}
        <div
          id="chat-messages-container"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {messages.length === 0 ? (
            /* Starter Hero & Suggestion Cards */
            <div
              style={{
                maxWidth: '850px',
                margin: 'auto',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '2rem 0',
              }}
            >
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '1.4rem',
                  background: 'var(--accent-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 35px var(--accent-glow-strong)',
                  marginBottom: '1.25rem',
                }}
              >
                <Bot size={34} color="#ffffff" className="animate-float" />
              </div>
              <h2
                style={{
                  fontSize: '1.9rem',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  letterSpacing: '-0.03em',
                  marginBottom: '0.5rem',
                }}
              >
                How can Ila help you today?
              </h2>
              <p
                style={{
                  fontSize: '0.92rem',
                  color: 'var(--text-muted)',
                  maxWidth: '560px',
                  lineHeight: '1.6',
                  marginBottom: '2rem',
                }}
              >
                Explore global education, research degree paths, design curriculums, analyze visa guidelines, or solve complex technical problems with conversational AI mentoring.
              </p>

              {/* Starter Suggestions Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '0.85rem',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                {CHAT_PROMPTS.map((card) => (
                  <div
                    key={card.title}
                    onClick={() => onSendMessage(card.prompt, [])}
                    className="interactive-card glass-panel"
                    style={{
                      padding: '1.1rem 1.25rem',
                      borderRadius: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                      border: '1px solid var(--border-subtle)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '0.12rem 0.5rem',
                          borderRadius: '9999px',
                          background: `${card.color}18`,
                          border: `1px solid ${card.color}35`,
                          color: card.color,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {card.tag}
                      </span>
                      <ArrowRight size={12} color="var(--text-subtle)" />
                    </div>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {card.title}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                      {card.prompt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Active Conversational Message List */
            <div
              style={{
                maxWidth: '900px',
                margin: '0 auto',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
              }}
            >
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className="animate-fade-in"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                      width: '100%',
                    }}
                  >
                    {/* Message Bubble Container */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.75rem',
                        maxWidth: isUser ? '85%' : '100%',
                        alignItems: 'flex-start',
                        flexDirection: isUser ? 'row-reverse' : 'row',
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '0.65rem',
                          background: isUser ? 'rgba(255, 255, 255, 0.1)' : 'var(--accent-gradient)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: isUser ? 'none' : '0 0 12px var(--accent-glow)',
                          marginTop: '0.2rem',
                        }}
                      >
                        {isUser ? (
                          <User size={16} color="var(--text-main)" />
                        ) : (
                          <Sparkles size={16} color="#ffffff" />
                        )}
                      </div>

                      {/* Content Card */}
                      <div
                        style={{
                          background: isUser
                            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%)'
                            : 'var(--bg-card)',
                          border: isUser
                            ? '1px solid rgba(165, 180, 252, 0.35)'
                            : '1px solid var(--border-subtle)',
                          borderRadius: isUser ? '1rem 0.2rem 1rem 1rem' : '0.2rem 1rem 1rem 1rem',
                          padding: '1.15rem 1.35rem',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                          position: 'relative',
                          width: '100%',
                          minWidth: 0,
                        }}
                      >
                        {/* Attached Docs if any */}
                        {msg.documents && msg.documents.length > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '0.4rem',
                              marginBottom: '0.75rem',
                              paddingBottom: '0.6rem',
                              borderBottom: '1px solid var(--border-subtle)',
                            }}
                          >
                            {msg.documents.map((doc, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.25rem 0.6rem',
                                  borderRadius: '9999px',
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  border: '1px solid var(--border-subtle)',
                                  fontSize: '0.72rem',
                                  color: 'var(--text-main)',
                                }}
                              >
                                <FileText size={11} color="var(--accent-primary)" />
                                <span>{doc.name}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Markdown Content */}
                        <div style={{ color: 'var(--text-main)', fontSize: '0.92rem', lineHeight: '1.65' }}>
                          <MarkdownRenderer content={msg.content} />
                        </div>

                        {/* Message Action Bar (Copy & TTS) */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '0.4rem',
                            marginTop: '0.85rem',
                            paddingTop: '0.5rem',
                            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '0.45rem',
                              padding: '0.25rem 0.55rem',
                              color: copiedMessageId === msg.id ? 'var(--success)' : 'var(--text-muted)',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            title="Copy message content"
                          >
                            {copiedMessageId === msg.id ? <Check size={11} /> : <Copy size={11} />}
                            <span>{copiedMessageId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onSpeak(msg.content, msg.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              background:
                                isSpeaking && activeSpeakingId === msg.id
                                  ? 'rgba(99, 102, 241, 0.25)'
                                  : 'rgba(255, 255, 255, 0.05)',
                              border:
                                isSpeaking && activeSpeakingId === msg.id
                                  ? '1px solid var(--accent-primary)'
                                  : '1px solid var(--border-subtle)',
                              borderRadius: '0.45rem',
                              padding: '0.25rem 0.55rem',
                              color:
                                isSpeaking && activeSpeakingId === msg.id
                                  ? 'var(--accent-primary)'
                                  : 'var(--text-muted)',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            title="Read message aloud"
                          >
                            {isSpeaking && activeSpeakingId === msg.id ? (
                              <VolumeX size={11} />
                            ) : (
                              <Volume2 size={11} />
                            )}
                            <span>{isSpeaking && activeSpeakingId === msg.id ? 'Stop' : 'Listen'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Generating Pulse Bubble */}
              {loading && (
                <div
                  className="animate-fade-in"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '0.65rem',
                      background: 'var(--accent-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 12px var(--accent-glow)',
                    }}
                  >
                    <Loader2 size={16} className="animate-spin" color="#ffffff" />
                  </div>
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '0.2rem 1rem 1rem 1rem',
                      padding: '0.85rem 1.25rem',
                      color: 'var(--text-muted)',
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <Sparkles size={14} color="var(--accent-primary)" />
                    <span>Ila AI is thinking and generating a comprehensive response...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Document Upload Zone (Collapsible) */}
        {showUploadZone && (
          <div
            style={{
              padding: '0.75rem 1.5rem 0 1.5rem',
              maxWidth: '900px',
              width: '100%',
              margin: '0 auto',
            }}
          >
            <DocumentUploadZone
              attachedDocuments={attachedDocs}
              onDocumentsChange={setAttachedDocs}
              onClose={() => setShowUploadZone(false)}
            />
          </div>
        )}

        {/* Bottom Chat Input Bar */}
        <div
          id="chat-home-input-container"
          style={{
            padding: '1rem 1.5rem 1.25rem 1.5rem',
            background: 'var(--header-bg)',
            borderTop: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            flexShrink: 0,
            zIndex: 25,
          }}
        >
          <div
            style={{
              maxWidth: '900px',
              margin: '0 auto',
              width: '100%',
            }}
          >
            {/* Attached documents pill previews */}
            {attachedDocs.length > 0 && !showUploadZone && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.4rem',
                  marginBottom: '0.6rem',
                }}
              >
                {attachedDocs.map((doc, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '9999px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid rgba(99, 102, 241, 0.35)',
                      fontSize: '0.72rem',
                      color: '#a5b4fc',
                    }}
                  >
                    <FileText size={11} />
                    <span>{doc.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachedDocs((prev) => prev.filter((_, idx) => idx !== i))}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#a5b4fc',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                      }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Form Input Area */}
            <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '1rem',
                  padding: '0.5rem 0.65rem',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35), inset 0 1px 2px rgba(0,0,0,0.5)',
                  transition: 'border-color 0.2s ease',
                }}
              >
                {/* Paperclip Button */}
                <button
                  type="button"
                  onClick={() => setShowUploadZone(!showUploadZone)}
                  style={{
                    background: showUploadZone ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                    border: 'none',
                    borderRadius: '0.6rem',
                    color: showUploadZone ? 'var(--accent-primary)' : 'var(--text-subtle)',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  title="Attach files (PDF, DOCX, TXT, images)"
                >
                  <Paperclip size={18} />
                </button>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={inputQuery}
                  onChange={(e) => {
                    setInputQuery(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Ila anything or request a structured course plan..."
                  rows={1}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-main)',
                    fontSize: '0.92rem',
                    lineHeight: '1.5',
                    padding: '0.5rem 0.65rem',
                    resize: 'none',
                    maxHeight: '180px',
                    fontFamily: 'inherit',
                  }}
                />

                {/* Submit / Send Button */}
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || loading}
                  style={{
                    background: inputQuery.trim() && !loading ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    borderRadius: '0.75rem',
                    color: '#ffffff',
                    padding: '0.5rem 0.85rem',
                    cursor: inputQuery.trim() && !loading ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    boxShadow: inputQuery.trim() && !loading ? '0 0 14px var(--accent-glow)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                  title="Send message (Enter)"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={15} />
                    </>
                  )}
                </button>
              </div>

              {/* Sub-hint */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.4rem 0.5rem 0 0.5rem',
                  fontSize: '0.68rem',
                  color: 'var(--text-subtle)',
                }}
              >
                <span>Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for new line</span>
                <span>Powered by {getIlaModelDisplayName()}</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
