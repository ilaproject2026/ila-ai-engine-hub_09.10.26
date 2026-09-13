import { useState } from 'react';
import {
  Award,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  Globe2,
  CheckCheck,
} from 'lucide-react';
import {
  detectStandardCurriculum,
  type StandardBodyInfo,
} from '../services/curriculumStandardService';

interface AuthorizedCurriculumBannerProps {
  courseTitle: string;
  content?: string;
  compact?: boolean;
}

export default function AuthorizedCurriculumBanner({
  courseTitle,
  content,
  compact = false,
}: AuthorizedCurriculumBannerProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);
  const info: StandardBodyInfo = detectStandardCurriculum(courseTitle, content);

  return (
    <div
      className="authorized-curriculum-banner"
      style={{
        margin: '0.75rem 0 1.25rem 0',
        borderRadius: '0.85rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 0 12px rgba(168, 85, 247, 0.12)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          padding: compact ? '0.5rem 0.85rem' : '0.75rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          cursor: 'pointer',
          background: 'var(--bg-secondary)',
          borderBottom: isExpanded ? '1px solid var(--border-subtle)' : 'none',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '0.5rem',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              color: 'var(--accent-primary)',
            }}
          >
            <ShieldCheck size={16} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {info.bodyName}
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.45rem',
                  borderRadius: '9999px',
                  background: `${info.badgeColor}25`,
                  color: info.badgeColor,
                  border: `1px solid ${info.badgeColor}60`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {info.badge}
              </span>
              <span
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  padding: '0.08rem 0.4rem',
                  borderRadius: '9999px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#059669',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                }}
              >
                Global Benchmark
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Standard Framework: <strong style={{ color: 'var(--accent-primary)' }}>{info.frameworkName}</strong> ({info.levelOrCode})
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', display: compact ? 'none' : 'block' }}>
            {isExpanded ? 'Collapse Standard' : 'View Authorized Standard Details'}
          </span>
          <button
            type="button"
            aria-label="Toggle details"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Details Body */}
      {isExpanded && (
        <div style={{ padding: '0.9rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Overview & Governing Authority & Approval Nature */}
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '0.6rem',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.74rem',
              color: 'var(--text-main)',
              lineHeight: '1.45',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#7c3aed', fontWeight: 700 }}>
              <Globe2 size={13} />
              <span>International Governing Authority: {info.governingAuthority}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontSize: '0.7rem', fontWeight: 700 }}>
              <CheckCheck size={12} />
              <span>Nature of Approval & Access: {info.approvalNature}</span>
            </div>
            <div style={{ color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              {info.description}
            </div>
          </div>

          {/* Standard Curriculum Competency Structure */}
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '0.45rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <BookOpen size={12} color="var(--accent-primary)" />
              <span>Standard Competency Structure & Learning Pillars</span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '0.4rem',
              }}
            >
              {info.standardStructure.map((pillar, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.4rem',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '0.45rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.72rem',
                    color: 'var(--text-main)',
                  }}
                >
                  <CheckCircle2 size={12} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{pillar}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Official Verified & Open-Access Reference Links */}
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '0.45rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Award size={12} color="#d97706" />
              <span>Official Authoritative & Open-Access Reference Portals</span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              {info.referenceLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '0.5rem',
                    background: 'var(--chip-download-bg)',
                    border: '1px solid var(--chip-download-border)',
                    color: 'var(--chip-download-color)',
                    textDecoration: 'none',
                    fontSize: '0.74rem',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--chip-download-hover-bg)';
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--chip-download-bg)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <ExternalLink size={12} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                    <div>
                      <strong style={{ color: 'var(--text-main)' }}>{link.title}</strong>
                      <div style={{ fontSize: '0.67rem', color: 'var(--text-subtle)' }}>
                        {link.description}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                    {link.approvalNature && (
                      <span
                        style={{
                          fontSize: '0.58rem',
                          padding: '0.08rem 0.35rem',
                          borderRadius: '9999px',
                          background: 'rgba(168, 85, 247, 0.15)',
                          color: '#7c3aed',
                          border: '1px solid rgba(168, 85, 247, 0.3)',
                          fontWeight: 600,
                        }}
                      >
                        {link.approvalNature}
                      </span>
                    )}
                    {link.isOpenAccess && (
                      <span
                        style={{
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '9999px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#059669',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        Open-Access
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
