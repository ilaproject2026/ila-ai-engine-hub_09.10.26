import { useState } from 'react';
import {
  Users,
  UserCheck,
  Tent,
  MapPin,
  Trophy,
  Activity,
  Sparkles,
  ArrowRight,
  Clock,
  Target,
  CheckCircle2,
  Calendar,
  Layers,
  Bot,
  Video,
  Presentation,
  ShieldCheck,
} from 'lucide-react';

export type LearningPathMode =
  | 'one_on_one_online'
  | 'group_online'
  | 'camp_online'
  | 'camp_offline'
  | 'sports_online'
  | 'sports_offline';

interface LearningPathModeConfig {
  id: LearningPathMode;
  title: string;
  badge: string;
  tagline: string;
  description: string;
  icon: typeof Users;
  gradient: string;
  accentColor: string;
  defaultDuration: string;
  recommendedAudience: string;
  structureHighlights: string[];
  sampleTopics: string[];
  logistics: string;
}

export const LEARNING_PATH_MODES: Record<LearningPathMode, LearningPathModeConfig> = {
  one_on_one_online: {
    id: 'one_on_one_online',
    title: '1-on-1 Online',
    badge: 'Private Mentorship',
    tagline: 'Hyper-Personalized Private Coaching with Real-Time Skill Diagnostics',
    description: 'Dedicated 1-on-1 live virtual tutoring sessions featuring milestone pacing, custom doubt-clearing transcripts, and AI-adapted homework assignments.',
    icon: UserCheck,
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    accentColor: '#818cf8',
    defaultDuration: '45-60 Mins per session (Weekly Milestones)',
    recommendedAudience: 'Individual Students, Executives & Certification Candidates',
    structureHighlights: [
      'Diagnostic baseline evaluation & customized learning blueprint',
      'Interactive Socratic dialogue with live TTS voice pronunciation checks',
      'Post-session AI diagnostic summary with targeted micro-drills',
      'Direct WhatsApp / Email summary delivery to mentors & parents',
    ],
    sampleTopics: [
      'IELTS / TOEFL Speaking & Writing Masterclass',
      'Full-Stack Python & React 1-on-1 Code Mentoring',
      'Executive English & C-Suite Negotiation Strategies',
      'Advanced Mathematics & Algorithmic Problem Solving',
    ],
    logistics: 'Virtual Classroom (Zoom / Google Meet / WebRTC) + Live Code & Slide Sync',
  },
  group_online: {
    id: 'group_online',
    title: 'Group Online',
    badge: 'Cohort Masterclass',
    tagline: 'Collaborative Virtual Classroom with Interactive Breakouts & Team Sprints',
    description: 'Engaging cohort-based group lessons combining instructor master lectures, team case-study discussions, peer reviews, and gamified quiz masteries.',
    icon: Users,
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
    accentColor: '#38bdf8',
    defaultDuration: '60-90 Mins per session (Cohort Sprints)',
    recommendedAudience: 'Student Cohorts (4-15 participants), Corporate Teams',
    structureHighlights: [
      'Live plenary lecture with automated slide & video synchronized delivery',
      'Dynamic breakout room challenges with collaborative workspace boards',
      'Real-time class leaderboards, poll voting & peer response analysis',
      'Recorded lecture replay with indexed chapter transcripts & timestamps',
    ],
    sampleTopics: [
      'AI Prompt Engineering & Business Process Automation Cohort',
      'Global Business Communication & Team Presentation Lab',
      'Design Thinking & Product Management Sprint',
      'Secondary School STEM Interactive Science Circle',
    ],
    logistics: 'Multi-party Interactive WebRTC Room + Real-Time Digital Whiteboard',
  },
  camp_online: {
    id: 'camp_online',
    title: 'Camp Online',
    badge: 'Virtual Bootcamp',
    tagline: 'High-Energy Intensive Virtual Immersion Camp with Daily Sprints',
    description: 'Structured multi-day online bootcamp designed for accelerated learning, project deliverables, daily hacker labs, and closing graduation demo showcases.',
    icon: Tent,
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    accentColor: '#f59e0b',
    defaultDuration: '5-Day Intensive Bootcamp (3-4 Hours Daily)',
    recommendedAudience: 'Holiday Camps, Fast-Track Skill Upgraders, Student Builders',
    structureHighlights: [
      'Day 1-5 modular curriculum roadmap with clear milestone deliverables',
      'Morning masterclass workshops followed by afternoon hands-on build labs',
      'AI coach mentor on standby for 24/7 asynchronous code/essay review',
      'Final Demo Day presentation with digital credential certification',
    ],
    sampleTopics: [
      '5-Day Mobile App & Game Development Bootcamp for Teens',
      'AI Startup Incubator: From Ideation to Pitch Deck in 1 Week',
      'Creative Writing & Digital Storytelling Virtual Camp',
      'Digital Marketing & TikTok Content Creator Intensive',
    ],
    logistics: 'Camp Discord / Slack Community Hub + Daily Live Studio Broadcasts',
  },
  camp_offline: {
    id: 'camp_offline',
    title: 'Camp Offline',
    badge: 'Physical Immersion',
    tagline: 'On-Premise Physical Camp Experience with Interactive Lab Stations',
    description: 'Complete on-campus bootcamp curriculum with printed handbook guides, physical activity station cards, facilitator prompts, and team workshop logistics.',
    icon: MapPin,
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    accentColor: '#10b981',
    defaultDuration: '1 to 2 Weeks On-Campus (Full Day 9 AM - 4 PM)',
    recommendedAudience: 'Summer/Winter School Camps, Corporate Retreats',
    structureHighlights: [
      'Facilitator physical lesson plans with minute-by-minute timetable breakdowns',
      'Printable student workbook handouts & physical station challenge cards',
      'Team building icebreakers, outdoor challenges & lab experiment guides',
      'Station checklist & physical equipment / materials requirement lists',
    ],
    sampleTopics: [
      'Robotics & Arduino Physical Electronics Makers Camp',
      'Leadership, Public Speaking & Stage Drama Summer Academy',
      'Junior Scientists: Hands-on Chemistry & Eco-Explorers Camp',
      'Entrepreneurship & Trade Fair Physical Exhibition Bootcamp',
    ],
    logistics: 'Physical Campus / Workshop Venue + Printable Facilitator Kits',
  },
  sports_online: {
    id: 'sports_online',
    title: 'Sports Class Online',
    badge: 'Virtual Athletic Hub',
    tagline: 'Tactical Playbook, Sports Psychology, Motion Video Analysis & Conditioning',
    description: 'Interactive sports theory, nutrition planning, biomechanics breakdown, tactical playbook reviews, and home fitness conditioning guided by AI sports coaching.',
    icon: Trophy,
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
    accentColor: '#c084fc',
    defaultDuration: '45 Mins Tactical/Conditioning Sessions',
    recommendedAudience: 'Athletes, Sports Academies, PE Students & Fitness Enthusiasts',
    structureHighlights: [
      'Tactical playbook video breakdown with telestrator diagram markers',
      'Home space athletic conditioning routines & stretching timers',
      'Sports nutrition, recovery protocols & sleep optimization guidelines',
      'Mental game & sports psychology visualization drills',
    ],
    sampleTopics: [
      'Football (Soccer) Tactical IQ & Positional Analysis Masterclass',
      'Basketball Shooting Mechanics & Defensive Rotation Clinic',
      'Youth Athletic Functional Movement & Agility at Home',
      'Endurance Runner Nutrition, Heart Rate Zones & Race Strategy',
    ],
    logistics: 'Virtual Screen Share with Video Playbook Analysis & Exercise Timers',
  },
  sports_offline: {
    id: 'sports_offline',
    title: 'Sports Class Offline',
    badge: 'On-Field Training',
    tagline: 'On-Field Physical Drills, Whistle Circuit Timers & Player Scorecards',
    description: 'Comprehensive field training session plans with cone layouts, skill progression drills, coach whistle intervals, fitness testing protocols, and match scrimmages.',
    icon: Activity,
    gradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
    accentColor: '#f43f5e',
    defaultDuration: '60-120 Mins On-Field Practice',
    recommendedAudience: 'Sports Clubs, Coaches, Physical Education Classes',
    structureHighlights: [
      'Warm-up, Dynamic Stretching, Main Drills, and Scrimmage Time Blocks',
      'Cone layout diagrams, equipment checklists & station rotation sequences',
      'Individual player skill evaluation rubrics & performance scorecards',
      'Injury prevention, hydration protocols & emergency action plans',
    ],
    sampleTopics: [
      'Football Academy: High-Pressing & Transition Drills on Field',
      'Tennis Academy: Footwork, Serve Power & Match Play Scrimmages',
      'Swimming & Aquatic Conditioning Circuit Training',
      'Martial Arts & Self Defense Form, Stance & Sparring Syllabus',
    ],
    logistics: 'Sports Pitch / Court / Field + Cones, Balls, Whistles & Clipboards',
  },
};

interface LearningPathModeViewProps {
  initialMode: LearningPathMode;
  onLaunchCourse: (topicQuery: string, deliveryMode: LearningPathMode) => void;
  onOpenSlideAi: () => void;
  onOpenVideoAi: () => void;
  onOpenIntelliCoach: () => void;
  onOpenAdminLibrary: () => void;
  onOpenChatHome: () => void;
}

export default function LearningPathModeView({
  initialMode,
  onLaunchCourse,
  onOpenSlideAi,
  onOpenVideoAi,
  onOpenIntelliCoach,
  onOpenAdminLibrary,
  onOpenChatHome,
}: LearningPathModeViewProps) {
  const [activeMode, setActiveMode] = useState<LearningPathMode>(initialMode);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const config = LEARNING_PATH_MODES[activeMode] || LEARNING_PATH_MODES.one_on_one_online;
  const IconComp = config.icon;

  const handleQuickLaunch = (topic: string) => {
    onLaunchCourse(topic, activeMode);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPrompt.trim()) {
      onLaunchCourse(customPrompt.trim(), activeMode);
    }
  };

  return (
    <div
      id="learning-path-mode-view"
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* 1. Mode Selector Quick Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.4rem',
        }}
      >
        {(Object.keys(LEARNING_PATH_MODES) as LearningPathMode[]).map((modeKey) => {
          const item = LEARNING_PATH_MODES[modeKey];
          const isSelected = activeMode === modeKey;
          const ModeIcon = item.icon;

          return (
            <button
              key={modeKey}
              type="button"
              onClick={() => setActiveMode(modeKey)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.45rem 0.9rem',
                borderRadius: '9999px',
                background: isSelected ? item.gradient : 'rgba(255, 255, 255, 0.04)',
                border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                color: isSelected ? '#ffffff' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                boxShadow: isSelected ? `0 2px 12px ${item.accentColor}50` : 'none',
              }}
            >
              <ModeIcon size={14} />
              <span>{item.title}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Mode Hero Banner */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '1.25rem',
          padding: '1.75rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '300px',
            height: '100%',
            background: config.gradient,
            opacity: 0.07,
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '1rem',
                background: config.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 25px ${config.accentColor}50`,
                flexShrink: 0,
              }}
            >
              <IconComp size={28} color="#ffffff" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {config.title} Path
                </h1>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.6rem',
                    borderRadius: '9999px',
                    background: `${config.accentColor}25`,
                    border: `1px solid ${config.accentColor}50`,
                    color: config.accentColor,
                  }}
                >
                  {config.badge}
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.35rem', maxWidth: '650px', lineHeight: '1.5' }}>
                {config.description}
              </p>
            </div>
          </div>

          {/* Quick Launch Direct Button */}
          <button
            type="button"
            onClick={() => onLaunchCourse(`${config.title} Masterclass Curriculum`, activeMode)}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '0.65rem',
              background: config.gradient,
              border: 'none',
              color: '#ffffff',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: `0 4px 15px ${config.accentColor}40`,
            }}
          >
            <Sparkles size={16} />
            <span>Generate {config.title} Course</span>
          </button>
        </div>

        {/* Info Grid: Duration, Logistics, Audience */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Clock size={16} color={config.accentColor} />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Pacing & Duration</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600 }}>{config.defaultDuration}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Target size={16} color={config.accentColor} />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Target Audience</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600 }}>{config.recommendedAudience}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Layers size={16} color={config.accentColor} />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Delivery Logistics</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600 }}>{config.logistics}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Custom Topic Input Form for this Modality */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '1rem',
          padding: '1.25rem 1.5rem',
        }}
      >
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Create Custom {config.title} Curriculum
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Enter any curriculum title or subject to generate a complete course plan formatted specifically for {config.title} delivery with interactive slides, video breakdowns, and TTS speech coaches.
        </p>

        <form onSubmit={handleCustomSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder={`e.g. ${config.sampleTopics[0]}...`}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '0.6rem',
              color: 'var(--text-main)',
              fontSize: '0.84rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '0.6rem',
              background: config.gradient,
              border: 'none',
              color: '#ffffff',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              whiteSpace: 'nowrap',
            }}
          >
            <span>Author Curriculum</span>
            <ArrowRight size={15} />
          </button>
        </form>
      </div>

      {/* 4. Curriculum Structure Highlights & Sample Blueprints */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Left: Structure Highlights */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '1rem',
            padding: '1.25rem 1.5rem',
          }}
        >
          <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.85rem' }}>
            {config.title} Delivery Framework
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {config.structureHighlights.map((highlight, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                <CheckCircle2 size={16} color={config.accentColor} style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                  {highlight}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Curated Ready-to-Generate Blueprints */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '1rem',
            padding: '1.25rem 1.5rem',
          }}
        >
          <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.85rem' }}>
            Curated Ready-to-Generate Courses
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {config.sampleTopics.map((topic, idx) => (
              <div
                key={idx}
                onClick={() => handleQuickLaunch(topic)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '0.55rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${config.accentColor}15`;
                  e.currentTarget.style.borderColor = `${config.accentColor}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={13} color={config.accentColor} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600 }}>{topic}</span>
                </div>
                <ArrowRight size={13} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Navigation Hub to other Course Creator Tools */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '0.85rem',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Explore companion course delivery tools in Course Creator:
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onOpenSlideAi}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '0.5rem',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#7dd3fc',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Presentation size={13} />
            <span>Slide+AI</span>
          </button>

          <button
            type="button"
            onClick={onOpenVideoAi}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '0.5rem',
              background: 'rgba(236, 72, 153, 0.12)',
              border: '1px solid rgba(236, 72, 153, 0.35)',
              color: '#f472b6',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Video size={13} />
            <span>Video+AI</span>
          </button>

          <button
            type="button"
            onClick={onOpenIntelliCoach}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '0.5rem',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Bot size={13} />
            <span>Intelli Coach</span>
          </button>

          <button
            type="button"
            onClick={onOpenAdminLibrary}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '0.5rem',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              color: '#a5b4fc',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ShieldCheck size={13} />
            <span>Admin Library</span>
          </button>
        </div>
      </div>
    </div>
  );
}
