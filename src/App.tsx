import { useState, useEffect, useMemo, useRef } from 'react';
import { useCourseUrlParams } from './hooks/useCourseUrlParams';
import ChatSidebar from './components/ChatSidebar';
import ChatHomeView from './components/ChatHomeView';
import SearchBox, { type CourseInputParams } from './components/SearchBox';
import {
  prepareCourseLibrarySyncPayload,
  dispatchCourseToLibrarySync,
} from './services/courseLibrarySyncService';
import QuestionTreeDrawer from './components/QuestionTreeDrawer';
import LibraryWorkspaceView from './components/LibraryWorkspaceView';
import DedicatedLibraryView from './components/DedicatedLibraryView';
import SlideAiLibraryView from './components/SlideAiLibraryView';
import VideoAiLibraryView from './components/VideoAiLibraryView';
import IntelliCoachView from './components/IntelliCoachView';
import LearningPathModeView, { LEARNING_PATH_MODES, type LearningPathMode } from './components/LearningPathModeView';
import CourseErrorBoundary from './components/CourseErrorBoundary';
import MasterclassVideoPlayer from './components/MasterclassVideoPlayer';
import TeachingSlidesModal from './components/TeachingSlidesModal';
import {
  Sparkles,
  PanelLeft,
  Check,
  RefreshCw,
  Sun,
  Moon,
  Palette,
  ChevronDown,
  Droplets,
  ShieldCheck,
  MessageSquare,
  Presentation,
  Tv,
  Bot,
  Grid,
  Activity,
  Sliders,
  Compass,
  Users,
  UserCheck,
  Tent,
  MapPin,
  Trophy,
  Code2,
  Cpu,
  TrendingUp,
  Briefcase,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  LayoutDashboard,
  GraduationCap,
  Plus,
  FolderOpen,
  Database,
  Handshake,
  SendHorizontal,
  Award,
  Settings,
} from 'lucide-react';
import {
  getAllChatSessions,
  saveChatSession,
  deleteChatSession,
  clearAllChatSessions,
  updateChatSessionTitle,
  togglePinSession,
  exportAllSessionsJSON,
  importSessionsJSON,
  createNewSessionObject,
  isStoragePersisted,
  getDbHealthInfo,
  saveLibraryCourse,
  saveToPermanentStore,
  compileCourseFromChatSession,
  extractSmartCourseTitle,
  extractCourseTitleFromContent,
  type ChatSession,
  type ChatMessage,
  type AttachedDocument,
  type DbStatusInfo,
  type CoursePlan,
  type CoursePlanModule,
  type LibraryCourse,
  type AutonomousCoursePlan,
  type AutonomousTaskStep,
} from './services/dbService';
import {
  generateIlaResponse,
  getIlaModelDisplayName,
  generateAIHubResponse,
  ILA_MODEL,
} from './services/geminiService';
import { useVoice } from './hooks/useVoice';
import AIHubDropdown, { type HubModuleType } from './components/AIHubDropdown';
import AIHubWorkspaceView from './components/AIHubWorkspaceView';
import TieupResearchEngineView from './components/TieupResearchEngineView';
import ResourcesDataHubView from './components/ResourcesDataHubView';
import ActivityTrackerModal from './components/ActivityTrackerModal';
import CentralDashboardView from './components/CentralDashboardView';
import AIUnifiedParameterModal from './components/AIUnifiedParameterModal';
import WorkspaceSettingsDropdown from './components/WorkspaceSettingsDropdown';
import { type AIProductType, getAIProductConfig } from './services/aiHubConfig';

export type PrimaryNavView =
  | 'course_creator'
  | 'tieup_creator'
  | 'library'
  | 'student_paths'
  | 'chat_home'
  | 'resources'
  | 'central_dashboard'
  | 'ai_tool';

export type AppTheme = 'standard' | 'sunny-day' | 'obsidian' | 'sapphire' | 'emerald' | 'amber';

export type CourseCreatorTabType =
  | 'home'
  | 'admin_library'
  | 'slide_ai'
  | 'video_ai'
  | 'intelli_coach'
  | 'one_on_one_online'
  | 'group_online'
  | 'camp_online'
  | 'camp_offline'
  | 'sports_online'
  | 'sports_offline';

interface ThemeOption {
  id: AppTheme;
  name: string;
  badge: string;
  icon: typeof Sun;
  color: string;
  description: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'standard',
    name: 'Standard Light',
    badge: 'Default',
    icon: Sun,
    color: '#2563eb',
    description: 'Clean minimalist white and slate theme with high-contrast text',
  },
  {
    id: 'sunny-day',
    name: 'Sunny Daylight',
    badge: 'Anti-Glare',
    icon: Sun,
    color: '#f59e0b',
    description: 'Anti-reflection high-contrast daylight mode for outdoor sunlight visibility',
  },
  {
    id: 'obsidian',
    name: 'Midnight Cyber',
    badge: 'Dark',
    icon: Moon,
    color: '#818cf8',
    description: 'Deep obsidian dark mode with indigo accents',
  },
  {
    id: 'sapphire',
    name: 'Ocean Sapphire',
    badge: 'Blue',
    icon: Droplets,
    color: '#38bdf8',
    description: 'Deep naval sapphire slate with arctic blue accents',
  },
  {
    id: 'emerald',
    name: 'Forest Emerald',
    badge: 'Mint',
    icon: Sparkles,
    color: '#34d399',
    description: 'Deep matrix emerald theme with mint accents',
  },
  {
    id: 'amber',
    name: 'Solar Sunset',
    badge: 'Warm',
    icon: Palette,
    color: '#fbbf24',
    description: 'Warm obsidian and amber glow with gold accents',
  },
];

export default function App() {
  // Theme State: Persisted to localStorage and applied to data-theme attribute (default to clean light mode)
  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('ila_app_theme') as AppTheme) || 'standard';
  });
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ila_app_theme', theme);

    // Initial restore for font scale and workspace preferences
    const savedScale = localStorage.getItem('ila_font_scale');
    if (savedScale) {
      document.documentElement.style.fontSize = `${savedScale}%`;
      document.documentElement.style.setProperty('--workspace-font-scale', `${savedScale}%`);
    }
    const savedContrast = localStorage.getItem('ila_high_contrast');
    if (savedContrast === 'true') {
      document.documentElement.setAttribute('data-high-contrast', 'true');
    }
  }, [theme]);

  // Active Hub Module: 'course_creator' is default studio home page!
  const [activeModule, setActiveModule] = useState<HubModuleType>(() => {
    return (localStorage.getItem('ila_active_module') as HubModuleType) || 'course_creator';
  });

  useEffect(() => {
    localStorage.setItem('ila_active_module', activeModule);
  }, [activeModule]);

  // Primary Navigation View State: 'course_creator' | 'tieup_creator' | 'library' | 'student_paths' | 'central_dashboard' | 'ai_tool'
  const [primaryNavView, setPrimaryNavView] = useState<PrimaryNavView>(() => {
    const savedModule = localStorage.getItem('ila_active_module') as HubModuleType;
    if (savedModule === 'ai_tieup_creator') return 'tieup_creator';
    if (savedModule === 'central_dashboard') return 'central_dashboard';
    const savedNav = localStorage.getItem('ila_primary_nav_view') as PrimaryNavView;
    if (savedNav === 'tieup_creator' || savedNav === 'library' || savedNav === 'student_paths' || savedNav === 'resources') {
      return savedNav;
    }
    return 'course_creator';
  });

  useEffect(() => {
    localStorage.setItem('ila_primary_nav_view', primaryNavView);
  }, [primaryNavView]);

  // Course Creator Internal Sub-Tab State: 'home' | 'admin_library' | 'slide_ai' | 'video_ai' | 'intelli_coach' | 'one_on_one_online' | 'group_online' | 'camp_online' | 'camp_offline' | 'sports_online' | 'sports_offline'
  const [courseCreatorTab, setCourseCreatorTab] = useState<CourseCreatorTabType>('home');
  const [isDeliveryPathsMenuOpen, setIsDeliveryPathsMenuOpen] = useState<boolean>(false);
  const [selectedPathMode, setSelectedPathMode] = useState<LearningPathMode>('one_on_one_online');
  const deliveryPathsDropdownRef = useRef<HTMLDivElement>(null);

  // Auto-close / click-outside handler for Delivery Paths dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        deliveryPathsDropdownRef.current &&
        !deliveryPathsDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDeliveryPathsMenuOpen(false);
      }
    };

    if (isDeliveryPathsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('touchstart', handleClickOutside, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [isDeliveryPathsMenuOpen]);

  // Left Chat Sidebar State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(true);
  const [isDbPersisted, setIsDbPersisted] = useState<boolean>(false);
  const [dbHealth, setDbHealth] = useState<DbStatusInfo | null>(null);
  const [attachedDocuments, setAttachedDocuments] = useState<AttachedDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isBulkPlannerActive, setIsBulkPlannerActive] = useState<boolean>(false);
  const [isActivityTrackerOpen, setIsActivityTrackerOpen] = useState<boolean>(false);
  const [isParameterModalOpen, setIsParameterModalOpen] = useState<boolean>(false);
  const [parameterModalTab, setParameterModalTab] = useState<'list' | 'input'>('list');

  const handleOpenParameters = (tab: 'list' | 'input' = 'list') => {
    setParameterModalTab(tab);
    setIsParameterModalOpen(true);
  };

  // Inbound Course Ingestion State (from Admin Portal / URL parameters)
  const inboundCourse = useCourseUrlParams();
  const [inboundPrompt, setInboundPrompt] = useState<string>('');
  const [inboundCourseName, setInboundCourseName] = useState<string>('');
  const [inboundCourseId, setInboundCourseId] = useState<string>('');
  const [inboundCategory, setInboundCategory] = useState<string | undefined>(undefined);
  const [inboundSubCategory, setInboundSubCategory] = useState<string | undefined>(undefined);
  const [inboundReturnUrl, setInboundReturnUrl] = useState<string | null>(() => {
    return sessionStorage.getItem('ila_admin_portal_return_url') || null;
  });

  // Unified Course Creator sessions: include course_creator, unassigned, and ila_chat sessions
  const courseCreatorSessions = useMemo(() => {
    return sessions.filter((s) => s.productType === 'course_creator' || !s.productType || s.productType === 'ila_chat');
  }, [sessions]);

  // Conversational sessions
  const chatSessions = useMemo(() => {
    return sessions.filter((s) => s.productType === 'ila_chat');
  }, [sessions]);

  // Active session for Course Creator
  const activeCourseSession = useMemo(() => {
    const matched = courseCreatorSessions.find((s) => s.id === activeSessionId);
    return matched || courseCreatorSessions[0] || null;
  }, [courseCreatorSessions, activeSessionId]);

  // Active session for Chat Home
  const activeChatSession = useMemo(() => {
    const matched = chatSessions.find((s) => s.id === activeSessionId);
    return matched || chatSessions[0] || null;
  }, [chatSessions, activeSessionId]);

  // Active session for Tie-up & Partnership Creator (Strict Isolation)
  const activeTieupSession = useMemo(() => {
    const tieupSessions = sessions.filter((s) => s.productType === 'ai_tieup_creator');
    const matched = tieupSessions.find((s) => s.id === activeSessionId);
    return matched || tieupSessions[0] || null;
  }, [sessions, activeSessionId]);

  // Tie-up Creator Sub-Navigation & Policies State (Persistent)
  const [tieupActiveTab, setTieupActiveTab] = useState<'chat_home' | 'resources' | 'process' | 'partners'>(() => {
    const saved = localStorage.getItem('ila_tieup_active_tab');
    if (saved === 'resources' || saved === 'process' || saved === 'partners' || saved === 'chat_home') {
      return saved;
    }
    return 'chat_home';
  });
  const [isTieupPolicyModalOpen, setIsTieupPolicyModalOpen] = useState<boolean>(false);
  const [tieupCounts, setTieupCounts] = useState<{ resources: number; process: number; partners: number }>({
    resources: 0,
    process: 0,
    partners: 0,
  });

  const handleSelectTieupTab = (tab: 'chat_home' | 'resources' | 'process' | 'partners') => {
    setTieupActiveTab(tab);
    localStorage.setItem('ila_tieup_active_tab', tab);
  };

  // Global Multi-Language & Open-Source Voice Profile States
  const [globalLanguage] = useState<string>(() => {
    return localStorage.getItem('ila_active_language') || 'en-US';
  });
  const [globalVoiceProfile] = useState<string>(() => {
    const saved = localStorage.getItem('ila_active_voice_profile');
    if (saved && !saved.startsWith('piper')) return saved;
    return 'coqui-xtts-multilingual';
  });

  // Interactive Masterclass Video Player state in Result View
  const [activeVideoCourseData, setActiveVideoCourseData] = useState<{
    courseTitle: string;
    chapterTitle: string;
    chapterNumber: number;
    chapterContent: string;
    topicNumber?: string;
  } | null>(null);

  // Presentation-Ready Teaching Slides state in Result View
  const [activeSlidesData, setActiveSlidesData] = useState<{
    courseTitle: string;
    chapterTitle: string;
    chapterNumber: number;
    chapterContent: string;
  } | null>(null);

  // Question Tree Navigation State
  const [isQuestionTreeOpen, setIsQuestionTreeOpen] = useState<boolean>(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const { isSpeaking, activeSpeakingId, speak, stopAllSpeech } = useVoice();

  // Active Session object
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  // List of all user questions in the active session
  const userQuestions = (activeSession?.messages || []).filter((m) => m.role === 'user');
  const totalUserQuestions = userQuestions.length;

  // Initial load of all chat sessions from SQLite DB on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const loaded = await getAllChatSessions();
        if (isMounted) {
          setSessions(loaded);
          const isTieup = activeModule === 'ai_tieup_creator' || primaryNavView === 'tieup_creator';
          const isCourse = activeModule === 'course_creator' || activeModule === 'central_dashboard';
          const lastActiveId = localStorage.getItem('ila_last_active_course_id') || localStorage.getItem('ila_last_saved_session_id');
          const lastActiveMatch = loaded.find((s) => s.id === lastActiveId);

          if (isTieup) {
            const tieupMatch =
              (lastActiveMatch?.productType === 'ai_tieup_creator' && lastActiveMatch) ||
              loaded.find((s) => s.productType === 'ai_tieup_creator');
            if (tieupMatch) {
              setActiveSessionId(tieupMatch.id);
            } else {
              const fresh = createNewSessionObject('Tie-up & Partnership Workspace', 'ai_tieup_creator');
              await saveChatSession(fresh);
              setSessions((prev) => [fresh, ...prev]);
              setActiveSessionId(fresh.id);
            }
          } else {
            const hasRealContent =
              lastActiveMatch &&
              lastActiveMatch.messages &&
              lastActiveMatch.messages.some((m) => m.role === 'assistant' && m.content && m.content.length > 100);

            if (lastActiveMatch && (isCourse ? (hasRealContent && (lastActiveMatch.productType === 'course_creator' || !lastActiveMatch.productType)) : lastActiveMatch.productType === activeModule)) {
              setActiveSessionId(lastActiveMatch.id);
            } else {
              // Prefer rich permanent session with content so testing features immediately have full data
              const richCourseMatch = loaded.find((s) =>
                (s.productType === 'course_creator' || !s.productType) &&
                (s.isPermanent || s.id.includes('perm_')) &&
                s.messages?.length > 0
              );
              const richMatch = richCourseMatch || loaded.find((s) =>
                isCourse
                  ? (s.productType === 'course_creator' || !s.productType) && (s.messages?.length > 0)
                  : s.productType === activeModule
              );
              const match = richMatch || loaded.find((s) =>
                isCourse ? s.productType === 'course_creator' || !s.productType : s.productType === activeModule
              );

              if (match) {
                setActiveSessionId(match.id);
                localStorage.setItem('ila_last_active_course_id', match.id);
              } else if (loaded.length > 0) {
                setActiveSessionId(loaded[0].id);
              } else {
                const fresh = createNewSessionObject('New Course Workspace', 'course_creator');
                await saveChatSession(fresh);
                setSessions([fresh]);
                setActiveSessionId(fresh.id);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load chat sessions:', err);
      }

      // Check SQLite persistence and health info
      try {
        const [persisted, health] = await Promise.all([
          isStoragePersisted(),
          getDbHealthInfo(),
        ]);
        if (isMounted) {
          setIsDbPersisted(persisted);
          setDbHealth(health);
        }
      } catch (err) {
        console.warn('Storage check failed:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync active question id when active session changes
  useEffect(() => {
    if (userQuestions.length > 0) {
      setActiveQuestionId(userQuestions[userQuestions.length - 1].id);
    } else {
      setActiveQuestionId(null);
    }
  }, [activeSessionId]);

  // Handle session selection
  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    localStorage.setItem('ila_last_active_course_id', sessionId);
    setError(null);
    stopAllSpeech();
    if (courseCreatorTab === 'admin_library') {
      setCourseCreatorTab('home');
    }
    if (window.innerWidth < 768) {
      setIsLeftSidebarOpen(false);
    }
  };

  // Switch Module in AI Hub / Primary Views
  const handleSelectModule = async (mod: HubModuleType) => {
    setIsDeliveryPathsMenuOpen(false);
    setActiveModule(mod);
    localStorage.setItem('ila_active_module', mod);
    stopAllSpeech();
    setError(null);

    if (mod === 'central_dashboard') {
      setPrimaryNavView('central_dashboard');
      return;
    }

    if (mod === 'ai_tieup_creator') {
      setPrimaryNavView('tieup_creator');
      localStorage.setItem('ila_primary_nav_view', 'tieup_creator');
      const tieupMatch = sessions.find((s) => s.productType === 'ai_tieup_creator');
      if (tieupMatch) {
        setActiveSessionId(tieupMatch.id);
        localStorage.setItem('ila_last_active_course_id', tieupMatch.id);
      } else {
        const fresh = createNewSessionObject('Tie-up & Partnership Workspace', 'ai_tieup_creator');
        const saved = await saveChatSession(fresh);
        setSessions((prev) => [saved, ...prev]);
        setActiveSessionId(saved.id);
        localStorage.setItem('ila_last_active_course_id', saved.id);
      }
      return;
    }

    if (mod === 'course_creator') {
      setPrimaryNavView('course_creator');
      localStorage.setItem('ila_primary_nav_view', 'course_creator');
    } else {
      setPrimaryNavView('chat_home');
      localStorage.setItem('ila_primary_nav_view', 'chat_home');
    }

    const isCourse = mod === 'course_creator';
    const isChat = mod === 'ila_chat';
    const existing = sessions.find((s) =>
      isCourse
        ? s.productType === 'course_creator' || !s.productType
        : s.productType === mod
    );
    if (existing) {
      setActiveSessionId(existing.id);
      localStorage.setItem('ila_last_active_course_id', existing.id);
    } else {
      const config = isCourse ? null : getAIProductConfig(mod as AIProductType);
      const title = isCourse
        ? 'New Course Workspace'
        : isChat
        ? 'New Chat'
        : `New ${config?.shortName || mod} Query`;
      const fresh = createNewSessionObject(title, isCourse ? 'course_creator' : (mod as AIProductType));
      const saved = await saveChatSession(fresh);
      setSessions((prev) => [saved, ...prev]);
      setActiveSessionId(saved.id);
      localStorage.setItem('ila_last_active_course_id', saved.id);
    }
  };

  // Create a brand new course session in Course Creator
  const handleNewCourse = async () => {
    const fresh = createNewSessionObject('New Course Workspace', 'course_creator');
    await saveChatSession(fresh);
    setSessions((prev) => [fresh, ...prev]);
    setActiveSessionId(fresh.id);
    setAttachedDocuments([]);
    setError(null);
    stopAllSpeech();
    setCourseCreatorTab('home');
  };

  // Create a brand new chat session in Chat Home
  const handleNewChatSession = async () => {
    const newSession = createNewSessionObject('New Chat', 'ila_chat');
    await saveChatSession(newSession);
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setAttachedDocuments([]);
    setError(null);
    stopAllSpeech();
  };

  // Convert a conversational chat session into a structured course and jump to Course Creator
  const handleConvertChatToCourse = async (chatSession: ChatSession) => {
    const courseTitle = extractSmartCourseTitle(chatSession.title || 'Masterclass Course', 'Masterclass Course');
    const courseSession: ChatSession = {
      ...chatSession,
      id: `course_${Date.now()}`,
      title: courseTitle,
      productType: 'course_creator',
      updatedAt: Date.now(),
    };
    await saveChatSession(courseSession);
    setSessions((prev) => [courseSession, ...prev]);
    setActiveSessionId(courseSession.id);
    setPrimaryNavView('course_creator');
    setActiveModule('course_creator');
  };

  // Dedicated Chat Home Message Handler
  const handleSendChatMessage = async (
    queryText: string,
    docs: AttachedDocument[] = []
  ) => {
    const cleanQuery = queryText.trim();
    if (!cleanQuery || loading) return;

    setLoading(true);
    setError(null);

    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: cleanQuery,
      timestamp: Date.now(),
      documents: docs.length > 0 ? [...docs] : undefined,
    };

    let targetSession = chatSessions.find((s) => s.id === activeSessionId);
    if (!targetSession) {
      targetSession = createNewSessionObject(
        cleanQuery.length > 40 ? cleanQuery.slice(0, 40) + '...' : cleanQuery,
        'ila_chat'
      );
      await saveChatSession(targetSession);
      setSessions((prev) => [targetSession, ...prev]);
    }

    const title =
      targetSession.messages.length === 0 ||
      targetSession.title === "New Ila's With You Query" ||
      targetSession.title === 'New Chat'
        ? cleanQuery.length > 40
          ? cleanQuery.slice(0, 40) + '...'
          : cleanQuery
        : targetSession.title;

    const sessionWithUser: ChatSession = {
      ...targetSession,
      title,
      productType: 'ila_chat',
      messages: [...targetSession.messages, userMessage],
      updatedAt: Date.now(),
    };

    setSessions((prev) =>
      prev.map((s) => (s.id === sessionWithUser.id ? sessionWithUser : s))
    );
    setActiveSessionId(sessionWithUser.id);
    await saveChatSession(sessionWithUser);

    try {
      const startTime = Date.now();
      const aiResponse = await generateAIHubResponse(
        'ila_chat',
        cleanQuery,
        sessionWithUser.messages,
        docs,
        sessionWithUser.productParams || {}
      );

      const assistantMessage: ChatMessage = {
        id: `msg_assistant_${Date.now()}`,
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
        model: ILA_MODEL,
        modelDisplayName: getIlaModelDisplayName(),
        responseTimeMs: Date.now() - startTime,
      };

      const finalSession: ChatSession = {
        ...sessionWithUser,
        messages: [...sessionWithUser.messages, assistantMessage],
        updatedAt: Date.now(),
      };

      setSessions((prev) =>
        prev.map((s) => (s.id === finalSession.id ? finalSession : s))
      );
      await saveChatSession(finalSession);
    } catch (err: any) {
      console.error('Chat Home generation error:', err);
      setError(err?.message || 'Failed to generate response');
    } finally {
      setLoading(false);
    }
  };

  // Create a brand new chat session (Adaptive to active module)
  const handleNewChat = async () => {
    const isCourse = activeModule === 'course_creator' || activeModule === 'central_dashboard';
    const targetProduct: AIProductType = isCourse ? 'course_creator' : (activeModule as AIProductType);
    const config = getAIProductConfig(targetProduct);
    const title = isCourse
      ? 'New Course Workspace'
      : `New ${config.shortName} Query`;
    const newSession = createNewSessionObject(title, targetProduct);
    await saveChatSession(newSession);
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setAttachedDocuments([]);
    setError(null);
    stopAllSpeech();
    setCourseCreatorTab('home');
  };

  // Create a brand new session for a specific product and parameters
  const handleNewChatForProduct = async (
    product: AIProductType = (activeModule === 'central_dashboard' ? 'course_creator' : (activeModule as AIProductType)),
    productParams?: Record<string, string>
  ) => {
    const config = getAIProductConfig(product);
    const title =
      product === 'course_creator'
        ? 'New Course Workspace'
        : `New ${config.shortName} Query`;
    const newSession = createNewSessionObject(title, product, productParams);
    await saveChatSession(newSession);
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setAttachedDocuments([]);
    setError(null);
    stopAllSpeech();
  };

  // Handle message sending for non-Course Creator AI Hub tools
  const handleSendAIHubMessage = async (
    queryText: string,
    docs: AttachedDocument[] = [],
    productParams: Record<string, string> = {}
  ) => {
    const cleanQuery = queryText.trim();
    if (!cleanQuery || loading) return;

    const currentProd = (activeModule === 'central_dashboard' ? 'ila_chat' : activeModule) as AIProductType;

    setLoading(true);
    setError(null);

    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: cleanQuery,
      timestamp: Date.now(),
      documents: docs.length > 0 ? [...docs] : undefined,
    };

    let targetSession = sessions.find((s) => s.id === activeSessionId);
    if (!targetSession || targetSession.productType !== currentProd) {
      const config = getAIProductConfig(currentProd);
      targetSession = createNewSessionObject(
        `New ${config.shortName} Query`,
        currentProd,
        productParams
      );
    }

    const config = getAIProductConfig(currentProd);
    const title =
      targetSession.title === `New ${config.shortName} Query` ||
      targetSession.title === 'New Course Workspace' ||
      targetSession.messages.length === 0
        ? cleanQuery.length > 40
          ? cleanQuery.slice(0, 40) + '...'
          : cleanQuery
        : targetSession.title;

    const sessionWithUser: ChatSession = {
      ...targetSession,
      title,
      productType: currentProd,
      productParams,
      messages: [...targetSession.messages, userMessage],
      updatedAt: Date.now(),
    };

    setSessions((prev) =>
      prev.map((s) => (s.id === sessionWithUser.id ? sessionWithUser : s))
    );
    await saveChatSession(sessionWithUser);

    try {
      const startTime = Date.now();
      const aiResponseContent = await generateAIHubResponse(
        currentProd,
        cleanQuery,
        targetSession.messages,
        docs,
        productParams
      );

      const assistantMessage: ChatMessage = {
        id: `msg_assistant_${Date.now()}`,
        role: 'assistant',
        content: aiResponseContent,
        timestamp: Date.now(),
        model: ILA_MODEL,
        modelDisplayName: getIlaModelDisplayName(),
        responseTimeMs: Date.now() - startTime,
      };

      const finalSession: ChatSession = {
        ...sessionWithUser,
        messages: [...sessionWithUser.messages, assistantMessage],
        updatedAt: Date.now(),
      };

      setSessions((prev) =>
        prev.map((s) => (s.id === finalSession.id ? finalSession : s))
      );
      await saveChatSession(finalSession);
    } catch (err: any) {
      console.error('AI Hub generation error:', err);
      setError(err?.message || 'Failed to generate AI Hub response');
    } finally {
      setLoading(false);
    }
  };

  // Delete chat session (Manual Deletion Only for locked permanent courses)
  const handleDeleteSession = async (sessionId: string) => {
    stopAllSpeech();
    const session = sessions.find((s) => s.id === sessionId);
    if (session?.locked || session?.isPermanent) {
      const confirmed = window.confirm(
        `"${session.title || 'This course'}" is locked in permanent storage to protect token work.\n\nAre you sure you want to permanently delete this course?`
      );
      if (!confirmed) return;
      await deleteChatSession(sessionId, { confirmManualDelete: true });
    } else {
      await deleteChatSession(sessionId);
    }
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);

    if (activeSessionId === sessionId) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
      } else {
        const fresh = createNewSessionObject('New Course Workspace');
        await saveChatSession(fresh);
        setSessions([fresh]);
        setActiveSessionId(fresh.id);
      }
    }
  };

  // Rename session title
  const handleRenameSession = async (sessionId: string, newTitle: string) => {
    await updateChatSessionTitle(sessionId, newTitle);
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle, updatedAt: Date.now() } : s))
    );
  };

  // Toggle pin session
  const handleTogglePinSession = async (sessionId: string) => {
    await togglePinSession(sessionId);
    setSessions((prev) =>
      prev
        .map((s) => (s.id === sessionId ? { ...s, isPinned: !s.isPinned, updatedAt: Date.now() } : s))
        .sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return b.updatedAt - a.updatedAt;
        })
    );
  };

  // Clear all sessions
  const handleClearAllSessions = async () => {
    stopAllSpeech();
    await clearAllChatSessions();
    const fresh = createNewSessionObject('New Course Workspace');
    await saveChatSession(fresh);
    setSessions([fresh]);
    setActiveSessionId(fresh.id);
  };

  // Export all sessions as JSON
  const handleExportJSON = async () => {
    try {
      const jsonStr = await exportAllSessionsJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ila-courses-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // Import sessions from JSON backup
  const handleImportJSON = async (jsonStr: string) => {
    try {
      const count = await importSessionsJSON(jsonStr);
      const reloaded = await getAllChatSessions();
      setSessions(reloaded);
      if (reloaded.length > 0) {
        setActiveSessionId(reloaded[0].id);
      }
      alert(`Successfully imported ${count} sessions into SQLite DB!`);
    } catch (err) {
      console.error('Import failed:', err);
      alert('Failed to import JSON backup. Please verify file format.');
    }
  };

  // Helper to update session message in place after in-place AI chapter refinement
  const handleUpdateSessionMessage = async (messageId: string, updatedContent: string) => {
    if (!activeSession) return;
    const updatedMessages = activeSession.messages.map((m) =>
      m.id === messageId ? { ...m, content: updatedContent } : m
    );
    const updatedSession: ChatSession = {
      ...activeSession,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };
    await saveChatSession(updatedSession);
    setSessions((prev) =>
      prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
    );
  };

  // Build or extract multi-book course plan
  const createOrUpdateCoursePlan = (query: string, currentSession: ChatSession): CoursePlan => {
    if (currentSession.coursePlan && currentSession.coursePlan.modules.length > 0) {
      return currentSession.coursePlan;
    }

    const smartTitle = extractSmartCourseTitle(query, 'Enterprise Masterclass');

    return {
      title: smartTitle,
      subtitle: 'Comprehensive Enterprise Modular Curriculum with Hands-on Labs',
      totalModules: 4,
      modules: [
        {
          moduleNumber: 1,
          title: `Book 1: Foundations, Architecture & Core Fundamentals`,
          summary: `Core principles, data models, initial configuration, and underlying mechanisms for ${smartTitle}.`,
          status: 'completed',
        },
        {
          moduleNumber: 2,
          title: `Book 2: Master Data, Workflows & Business Transactions`,
          summary: `End-to-end operational execution, transaction codes, UI screens, and core workflows.`,
          status: 'ready',
        },
        {
          moduleNumber: 3,
          title: `Book 3: Advanced Configuration, Integration & Optimization`,
          summary: `Enterprise cross-module integrations, compliance policies, analytics dashboards, and tuning.`,
          status: 'pending',
        },
        {
          moduleNumber: 4,
          title: `Book 4: Hands-on Enterprise Labs, Case Studies & Assessments`,
          summary: `Practical lab simulations, scenario challenges, real-world case studies, and certification questions.`,
          status: 'pending',
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  };

  // Autonomous Bulk Task Decomposition & Step-by-Step Execution Engine
  const executeAutonomousCoursePlan = async (
    query: string,
    docs: AttachedDocument[],
    targetAudience?: string,
    courseParams?: CourseInputParams
  ) => {
    const cleanQuery = query.trim();
    if (!cleanQuery || loading) return;

    setError(null);
    setLoading(true);
    stopAllSpeech();

    const audience = targetAudience || localStorage.getItem('ila_learner_category') || 'General Student / Lifelong Learner';

    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: cleanQuery,
      timestamp: Date.now(),
      documents: docs.length > 0 ? [...docs] : undefined,
    };

    let targetSession = sessions.find((s) => s.id === activeSessionId);
    if (!targetSession) {
      targetSession = createNewSessionObject('New Course Workspace');
    }

    let smartTitle = courseParams?.courseName?.trim() || extractSmartCourseTitle(cleanQuery, 'Enterprise Masterclass');

    // 1. Task Decomposition: Create initial steps
    const initialSteps: AutonomousTaskStep[] = [
      {
        id: `step_1_${Date.now()}`,
        stepNumber: 1,
        title: 'Curriculum Architecture & Module Decomposition',
        description: `Structuring comprehensive 4-Book curriculum roadmap for ${smartTitle} tailored for ${audience}.`,
        type: 'blueprint',
        status: 'in_progress',
        startedAt: Date.now(),
      },
      {
        id: `step_2_${Date.now()}`,
        stepNumber: 2,
        title: 'Book 1: Foundations, Architecture & Core Fundamentals',
        description: 'Theoretical foundations, underlying mechanisms, initial configuration, and core data models.',
        type: 'book_generation',
        bookNumber: 1,
        status: 'pending',
      },
      {
        id: `step_3_${Date.now()}`,
        stepNumber: 3,
        title: 'Book 2: Applied Workflows & Domain Practice',
        description: 'Step-by-step practical workflows, execution methods, demonstrations, and process standards.',
        type: 'book_generation',
        bookNumber: 2,
        status: 'pending',
      },
      {
        id: `step_4_${Date.now()}`,
        stepNumber: 4,
        title: 'Book 3: Advanced Architectures, Integration & Systems',
        description: 'Complex integrations, governance standards, analytics, and performance optimization.',
        type: 'book_generation',
        bookNumber: 3,
        status: 'pending',
      },
      {
        id: `step_5_${Date.now()}`,
        stepNumber: 5,
        title: 'Book 4: Hands-on Labs, Capstone Case Studies & Assessments',
        description: 'Practical scenario challenges, capstone case studies, and standardized certification quizzes.',
        type: 'book_generation',
        bookNumber: 4,
        status: 'pending',
      },
      {
        id: `step_6_${Date.now()}`,
        stepNumber: 6,
        title: 'Synthesis & Automatic Compilation to SQLite Library Workspace',
        description: 'Aggregating all modules and chapters into persistent multi-book interactive library repository.',
        type: 'synthesis',
        status: 'pending',
      },
    ];

    const autonomousPlan: AutonomousCoursePlan = {
      id: `auto_plan_${Date.now()}`,
      prompt: cleanQuery,
      courseTitle: smartTitle,
      courseSubtitle: `Autonomous Modular Task Planner for ${audience}`,
      totalSteps: initialSteps.length,
      currentStepIndex: 0,
      status: 'executing',
      steps: initialSteps,
      startedAt: Date.now(),
    };

    const coursePlan = createOrUpdateCoursePlan(cleanQuery, targetSession);
    coursePlan.title = smartTitle;
    coursePlan.modules = coursePlan.modules.map((m, idx) => ({
      ...m,
      status: idx === 0 ? 'generating' : 'pending',
    }));

    let currentSession: ChatSession = {
      ...targetSession,
      title: smartTitle,
      messages: [...targetSession.messages, userMessage],
      attachedDocuments: docs,
      coursePlan,
      autonomousPlan,
      studiedBy: audience,
      updatedAt: Date.now(),
    };

    setSessions((prev) => {
      const exists = prev.some((s) => s.id === currentSession.id);
      if (exists) {
        return prev.map((s) => (s.id === currentSession.id ? currentSession : s));
      }
      return [currentSession, ...prev];
    });
    setActiveSessionId(currentSession.id);
    await saveChatSession(currentSession);

    try {
      // Step 1: Curriculum Blueprint Generation
      const blueprintPrompt = `Create an exhaustive Master Curriculum Architecture Blueprint for: "${cleanQuery}".
Detail the complete 4-Book curriculum roadmap with learning outcomes, domain architecture diagrams, practical workflows, and lab goals strictly tailored for: ${audience}.`;

      const blueprintResponse = await generateIlaResponse(
        blueprintPrompt,
        currentSession.messages,
        docs,
        undefined,
        audience
      );

      // Smartly extract title from the AI's generated blueprint header if available
      const aiExtractedTitle = extractCourseTitleFromContent(blueprintResponse);
      if (aiExtractedTitle) {
        smartTitle = aiExtractedTitle;
        autonomousPlan.courseTitle = smartTitle;
        coursePlan.title = smartTitle;
      }

      const step1Msg: ChatMessage = {
        id: `msg_asst_step1_${Date.now()}`,
        role: 'assistant',
        content: blueprintResponse,
        timestamp: Date.now(),
        modelDisplayName: getIlaModelDisplayName(),
      };

      autonomousPlan.steps[0].status = 'completed';
      autonomousPlan.steps[0].completedAt = Date.now();
      autonomousPlan.steps[1].status = 'in_progress';
      autonomousPlan.steps[1].startedAt = Date.now();
      autonomousPlan.currentStepIndex = 1;

      currentSession = {
        ...currentSession,
        title: smartTitle,
        messages: [...currentSession.messages, step1Msg],
        coursePlan,
        autonomousPlan: { ...autonomousPlan },
        updatedAt: Date.now(),
      };
      setSessions((prev) => prev.map((s) => (s.id === currentSession.id ? currentSession : s)));
      await saveChatSession(currentSession);

      // Steps 2 to 5: Sequential Book Generation
      const bookConfigs = [
        {
          bookNum: 1,
          stepIdx: 1,
          prompt: `Please author the complete, exhaustive content for Book 1: Foundations, Architecture & Core Fundamentals for "${smartTitle}". Include deep theoretical foundations, data models, initial configuration, architectural mechanisms, real-world domain scenarios, and visual diagrams tailored for ${audience}. Do NOT provide an outline; write the complete textbook-grade material with lab exercises.`,
        },
        {
          bookNum: 2,
          stepIdx: 2,
          prompt: `Please author the complete, exhaustive content for Book 2: Applied Workflows & Domain Practice for "${smartTitle}". Include end-to-end operational execution, domain-specific methods, practical guidance, and embedded visual screenshot tags tailored for ${audience}.`,
        },
        {
          bookNum: 3,
          stepIdx: 3,
          prompt: `Please author the complete, exhaustive content for Book 3: Advanced Configuration, Integration & Optimization for "${smartTitle}". Include system integrations, compliance policies, domain reporting dashboards, security controls, and optimization techniques tailored for ${audience}.`,
        },
        {
          bookNum: 4,
          stepIdx: 4,
          prompt: `Please author the complete, exhaustive content for Book 4: Hands-on Labs, Capstone Case Studies & Knowledge Assessments for "${smartTitle}". Include detailed hands-on lab exercises with scenario setup, step-by-step instructions, troubleshooting checklists, case studies, and multiple-choice certification questions with answer keys tailored for ${audience}.`,
        },
      ];

      for (let i = 0; i < bookConfigs.length; i++) {
        const { bookNum, stepIdx, prompt } = bookConfigs[i];

        const bookResponse = await generateIlaResponse(
          prompt,
          currentSession.messages,
          docs,
          undefined,
          audience
        );

        const bookMsg: ChatMessage = {
          id: `msg_asst_book${bookNum}_${Date.now()}`,
          role: 'assistant',
          content: bookResponse,
          timestamp: Date.now(),
          modelDisplayName: getIlaModelDisplayName(),
        };

        autonomousPlan.steps[stepIdx].status = 'completed';
        autonomousPlan.steps[stepIdx].completedAt = Date.now();
        coursePlan.modules[i].status = 'completed';

        if (stepIdx + 1 < autonomousPlan.steps.length) {
          autonomousPlan.steps[stepIdx + 1].status = 'in_progress';
          autonomousPlan.steps[stepIdx + 1].startedAt = Date.now();
          autonomousPlan.currentStepIndex = stepIdx + 1;
          if (coursePlan.modules[i + 1]) {
            coursePlan.modules[i + 1].status = 'generating';
          }
        }

        currentSession = {
          ...currentSession,
          messages: [...currentSession.messages, bookMsg],
          coursePlan,
          autonomousPlan: { ...autonomousPlan },
          updatedAt: Date.now(),
        };
        setSessions((prev) => prev.map((s) => (s.id === currentSession.id ? currentSession : s)));
        await saveChatSession(currentSession);
      }

      // Step 6: Synthesis & Automatic Compilation to SQLite Library
      const finalStepIdx = 5;
      try {
        const compiled = compileCourseFromChatSession(currentSession, smartTitle);
        compiled.studiedBy = audience;
        if (courseParams) {
          compiled.courseId = courseParams.courseId;
          compiled.courseName = courseParams.courseName;
          compiled.title = courseParams.courseName || compiled.title;
          compiled.category = courseParams.category;
          compiled.subCategory = courseParams.subCategory;
          compiled.deliveryPath = courseParams.deliveryPath;
          compiled.batch = courseParams.batch;
          compiled.slot = courseParams.slot;
          compiled.batchSlot = courseParams.batchSlot;
          compiled.librarySyncPayload = prepareCourseLibrarySyncPayload(courseParams);
          await dispatchCourseToLibrarySync(compiled.librarySyncPayload);
        }
        await saveLibraryCourse(compiled);
        await saveToPermanentStore(compiled, currentSession, { reason: 'generation' });

        // If All Categories / Batch Generate was selected, create tailored department course blocks
        if (audience.toLowerCase().includes('all') || audience.toLowerCase().includes('batch')) {
          const targetDepts = [
            'Enterprises & Business Leaders',
            'Doctors & Healthcare Specialists',
            'Finance & Operations Specialists',
            'Teachers & Academic Researchers',
            'General Students & Career Professionals',
          ];
          for (let dIdx = 0; dIdx < targetDepts.length; dIdx++) {
            const dept = targetDepts[dIdx];
            try {
              const deptCourse = {
                ...compiled,
                id: `lib_course_${Date.now()}_${dIdx}_${dept.slice(0, 3).toLowerCase()}`,
                title: `${smartTitle} [${dept.split(' ')[0]} Edition]`,
                studiedBy: dept,
                targetAudience: dept,
                updatedAt: Date.now(),
              };
              await saveLibraryCourse(deptCourse);
            } catch (dErr) {
              console.warn('Batch department adaptation save notice:', dErr);
            }
          }
        }

        autonomousPlan.steps[finalStepIdx].status = 'completed';
        autonomousPlan.steps[finalStepIdx].completedAt = Date.now();
        autonomousPlan.status = 'completed';
        autonomousPlan.completedAt = Date.now();
      } catch (e) {
        console.warn('Library compilation notice:', e);
        autonomousPlan.steps[finalStepIdx].status = 'completed';
        autonomousPlan.status = 'completed';
      }

      currentSession = {
        ...currentSession,
        autonomousPlan: { ...autonomousPlan },
        updatedAt: Date.now(),
      };
      setSessions((prev) => prev.map((s) => (s.id === currentSession.id ? currentSession : s)));
      await saveChatSession(currentSession);
    } catch (err: unknown) {
      console.error('Autonomous Execution Error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during autonomous course execution.');
      }
      autonomousPlan.status = 'error';
    } finally {
      setLoading(false);
    }
  };

  // Send message handler (Multi-turn generation or Autonomous Planner with ILA AI)
  const handleSendMessage = async (
    query: string,
    docs: AttachedDocument[],
    targetAudience?: string,
    courseParams?: CourseInputParams
  ) => {
    const cleanQuery = query.trim();
    if (!cleanQuery || loading) return;

    const audience = targetAudience || localStorage.getItem('ila_learner_category') || 'General Student / Lifelong Learner';

    // Check if Bulk Task Planner is active OR if the prompt is an autonomous course generation request
    const lowerQuery = cleanQuery.toLowerCase();
    const isExplicitBulkRequest =
      isBulkPlannerActive ||
      ((lowerQuery.includes('comprehensive') ||
        lowerQuery.includes('full course') ||
        lowerQuery.includes('all books') ||
        lowerQuery.includes('all modules') ||
        lowerQuery.includes('masterclass')) &&
        cleanQuery.length > 50);

    if (isExplicitBulkRequest) {
      await executeAutonomousCoursePlan(cleanQuery, docs, audience, courseParams);
      return;
    }

    setError(null);
    setLoading(true);
    stopAllSpeech();

    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: cleanQuery,
      timestamp: Date.now(),
      documents: docs.length > 0 ? [...docs] : undefined,
    };

    // Determine target session
    let targetSession = sessions.find((s) => s.id === activeSessionId);
    if (!targetSession) {
      targetSession = createNewSessionObject('New Course Workspace');
    }

    // Auto-set title from courseParams or first prompt
    let newTitle = courseParams?.courseName?.trim() || targetSession.title;
    if (
      !courseParams?.courseName?.trim() &&
      (targetSession.messages.length === 0 ||
        targetSession.title === 'New Course Workspace' ||
        targetSession.title === 'Untitled Course' ||
        targetSession.title.startsWith('Please ') ||
        targetSession.title.startsWith('Can you ') ||
        targetSession.title.length > 55)
    ) {
      newTitle = extractSmartCourseTitle(cleanQuery, 'Course Workspace');
    }

    // Generate or update Course Plan
    const coursePlan = createOrUpdateCoursePlan(cleanQuery, targetSession);

    // Update completed status of modules based on message count
    const assistantCount = targetSession.messages.filter((m) => m.role === 'assistant').length + 1;
    const updatedModules: CoursePlanModule[] = coursePlan.modules.map((m) => {
      if (m.moduleNumber <= assistantCount) {
        return { ...m, status: 'completed' as const };
      }
      if (m.moduleNumber === assistantCount + 1) {
        return { ...m, status: 'ready' as const };
      }
      return m;
    });
    coursePlan.modules = updatedModules;

    const updatedMessagesWithUser = [...targetSession.messages, userMessage];
    const sessionWithUser: ChatSession = {
      ...targetSession,
      title: newTitle,
      messages: updatedMessagesWithUser,
      attachedDocuments: docs,
      coursePlan,
      studiedBy: audience,
      updatedAt: Date.now(),
    };

    // Update state immediately so user sees their message
    setSessions((prev) => {
      const exists = prev.some((s) => s.id === sessionWithUser.id);
      if (exists) {
        return prev.map((s) => (s.id === sessionWithUser.id ? sessionWithUser : s));
      }
      return [sessionWithUser, ...prev];
    });
    setActiveSessionId(sessionWithUser.id);

    const startTime = performance.now();
    const modelDisplayName = getIlaModelDisplayName();

    try {
      const responseText = await generateIlaResponse(
        cleanQuery,
        updatedMessagesWithUser,
        docs,
        undefined,
        audience
      );
      const durationMs = Math.round(performance.now() - startTime);

      const assistantMessage: ChatMessage = {
        id: `msg_asst_${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
        modelDisplayName,
        responseTimeMs: durationMs,
      };

      // Extract smart title from AI response if session has generic or default title
      const aiExtractedTitle = extractCourseTitleFromContent(responseText);
      const finalTitle =
        aiExtractedTitle ||
        (newTitle !== 'Course Workspace' && newTitle !== 'New Course Workspace'
          ? newTitle
          : extractSmartCourseTitle(cleanQuery, 'Masterclass Course'));

      if (coursePlan && (!coursePlan.title || coursePlan.title.startsWith('Please') || coursePlan.title === 'Enterprise Masterclass')) {
        coursePlan.title = finalTitle;
      }

      const finalSession: ChatSession = {
        ...sessionWithUser,
        title: finalTitle,
        messages: [...updatedMessagesWithUser, assistantMessage],
        coursePlan,
        updatedAt: Date.now(),
      };

      // Save permanently to SQLite
      await saveChatSession(finalSession);

      // Also compile and synchronize with Library Navigation
      try {
        const compiled = compileCourseFromChatSession(finalSession, finalTitle);
        compiled.studiedBy = audience;
        if (courseParams) {
          compiled.courseId = courseParams.courseId;
          compiled.courseName = courseParams.courseName;
          compiled.title = courseParams.courseName || compiled.title;
          compiled.category = courseParams.category;
          compiled.subCategory = courseParams.subCategory;
          compiled.deliveryPath = courseParams.deliveryPath;
          compiled.batch = courseParams.batch;
          compiled.slot = courseParams.slot;
          compiled.batchSlot = courseParams.batchSlot;
          compiled.librarySyncPayload = prepareCourseLibrarySyncPayload(courseParams);
          await dispatchCourseToLibrarySync(compiled.librarySyncPayload);
        }
        await saveLibraryCourse(compiled);
      } catch (cErr) {
        console.warn('Single-turn library compilation notice:', cErr);
      }

      // Update state
      setSessions((prev) =>
        prev.map((s) => (s.id === finalSession.id ? finalSession : s))
      );
    } catch (err: unknown) {
      console.error('Error generating AI response:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while communicating with ILA AI.');
      }
    } finally {
      setLoading(false);
    }
  };

  // React to Inbound Course Ingestion Parameters from Admin Portal
  useEffect(() => {
    if (!inboundCourse) return;

    // 1. Synthesize a comprehensive academic textbook prompt
    const synthesizedPrompt = `Create a complete academic course curriculum and textbook for "${inboundCourse.courseName}".
Category: ${inboundCourse.category || 'General'} / Track: ${inboundCourse.subCategory || 'Standard'}
Total Chapters: ${inboundCourse.chapters || '10'} Chapters
Pacing & Duration: ${inboundCourse.duration || 'Standard Term'}
Delivery Method: ${inboundCourse.methods || 'AI + Adaptive Tutoring'}
${inboundCourse.staff ? `Assigned Staff / Lead: ${inboundCourse.staff}` : ''}
${inboundCourse.pathName ? `Education Path: ${inboundCourse.pathName}` : ''}
${inboundCourse.batchName ? `Cohort / Batch: ${inboundCourse.batchName}` : ''}
${inboundCourse.courseStructure ? `\nSyllabus & Module Guidance:\n${inboundCourse.courseStructure}` : ''}

Structure each chapter with detailed pedagogical breakdowns, real-world examples, chapter summaries, diagnostic quiz questions, and slide presentation outlines.`;

    setInboundPrompt(synthesizedPrompt);
    setInboundCourseName(inboundCourse.courseName);
    if (inboundCourse.compositeId) {
      setInboundCourseId(inboundCourse.compositeId);
    }
    if (inboundCourse.category) {
      setInboundCategory(inboundCourse.category);
    }
    if (inboundCourse.subCategory) {
      setInboundSubCategory(inboundCourse.subCategory);
    }
    if (inboundCourse.returnUrl) {
      setInboundReturnUrl(inboundCourse.returnUrl);
      sessionStorage.setItem('ila_admin_portal_return_url', inboundCourse.returnUrl);
    }

    // Ensure we switch to Course Creator Home view
    setPrimaryNavView('course_creator');
    setActiveModule('course_creator');
    setCourseCreatorTab('home');

    // Adapt learner category / target audience if provided or inferred
    const potentialAudience =
      inboundCourse.subCategory ||
      inboundCourse.category ||
      inboundCourse.pathName;
    if (potentialAudience) {
      localStorage.setItem('ila_learner_category', potentialAudience);
    }

    // If autoGenerate is true, autonomously trigger course generation
    if (inboundCourse.autoGenerate) {
      const effectiveCourseParams: CourseInputParams = {
        courseName: inboundCourse.courseName,
        courseId: inboundCourse.compositeId || `CRS-${Date.now()}`,
        category: inboundCourse.category || 'general',
        subCategory: inboundCourse.subCategory || 'standard',
        deliveryPath: inboundCourse.methods || 'standard',
        batch: inboundCourse.batchName || 'Default Batch',
        slot: 'Morning',
        batchSlot: `${inboundCourse.batchName || 'Default Batch'} - Morning`,
      };

      const timer = setTimeout(() => {
        handleSendMessage(
          synthesizedPrompt,
          [],
          potentialAudience || 'General Student / Lifelong Learner',
          effectiveCourseParams
        );
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [inboundCourse]);

  // Jump to specific message element smoothly
  const handleJumpToMessage = (messageId: string) => {
    setActiveQuestionId(messageId);
    const el = document.getElementById(`msg-item-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Unified App Layout & Multi-Engine Dynamic Routing
  return (
    <div
      id="app-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
        color: 'var(--text-main)',
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* 1. TOP GLOBAL NAVIGATION & SYSTEM HEADER */}
      <header
        id="global-header-bar"
        style={{
          height: '56px',
          padding: '0 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          background: 'var(--header-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 100,
          flexShrink: 0,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Left: Essential Brand Logo & Title */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, cursor: 'pointer' }}
          onClick={() => handleSelectModule('central_dashboard')}
          title="ILA Hub Auto AI Ecosystem • Click to view Central Dashboard"
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '0.75rem',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px var(--accent-glow)',
              flexShrink: 0,
              transition: 'transform 0.2s ease',
            }}
          >
            <Sparkles size={20} color="#ffffff" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                letterSpacing: '-0.02em',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              ILA Hub Auto AI Ecosystem
            </h1>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                {getIlaModelDisplayName()}
              </span>
            </div>
          </div>
        </div>
        {/* Right: Engine Selector + Dashboard + Consolidated Global Utility Buttons + Theme Switcher (Same across all views) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          {/* Module Selector Dropdown */}
          <AIHubDropdown
            activeProductId={activeModule}
            onSelectProduct={handleSelectModule}
            variant="navbar"
          />

          {/* Global Dashboard Button */}
          <button
            id="global-dashboard-btn"
            type="button"
            onClick={() => {
              setPrimaryNavView('central_dashboard');
              setActiveModule('central_dashboard');
              setIsDeliveryPathsMenuOpen(false);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.38rem 0.85rem',
              borderRadius: '9999px',
              background: primaryNavView === 'central_dashboard' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'var(--btn-dashboard-bg)',
              border: primaryNavView === 'central_dashboard' ? 'none' : '1px solid var(--btn-dashboard-border)',
              color: primaryNavView === 'central_dashboard' ? '#ffffff' : 'var(--btn-dashboard-color)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: primaryNavView === 'central_dashboard' ? '0 2px 14px rgba(245, 158, 11, 0.45)' : 'var(--btn-default-shadow, none)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (primaryNavView !== 'central_dashboard') {
                e.currentTarget.style.background = 'var(--btn-dashboard-hover-bg)';
                e.currentTarget.style.borderColor = 'var(--btn-dashboard-hover-border)';
              }
            }}
            onMouseLeave={(e) => {
              if (primaryNavView !== 'central_dashboard') {
                e.currentTarget.style.background = 'var(--btn-dashboard-bg)';
                e.currentTarget.style.borderColor = 'var(--btn-dashboard-border)';
              }
            }}
            title="Open Central Dashboard: Global overview & platform analytics"
          >
            <LayoutDashboard size={13} />
            <span>Dashboard</span>
          </button>

          {/* Core Utility Button: Activity Tracker */}
          <button
            id="global-activity-tracker-btn"
            type="button"
            onClick={() => setIsActivityTrackerOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.38rem 0.85rem',
              borderRadius: '9999px',
              background: 'var(--btn-activity-bg)',
              border: '1px solid var(--btn-activity-border)',
              color: 'var(--btn-activity-color)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--btn-default-shadow, none)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--btn-activity-hover-bg)';
              e.currentTarget.style.borderColor = 'var(--btn-activity-hover-border)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--btn-activity-bg)';
              e.currentTarget.style.borderColor = 'var(--btn-activity-border)';
            }}
            title="Open Activity Tracker & Live Performance Analytics Dashboard"
          >
            <Activity size={13} color="var(--btn-activity-color)" />
            <span>Activity Tracker</span>
          </button>

          {/* Consolidated Unified Parameter Button */}
          <button
            id="global-parameter-btn"
            type="button"
            onClick={() => handleOpenParameters('list')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.38rem 0.85rem',
              borderRadius: '9999px',
              background: 'var(--btn-param-bg)',
              border: '1px solid var(--btn-param-border)',
              color: 'var(--btn-param-color)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--btn-default-shadow, none)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--btn-param-hover-bg)';
              e.currentTarget.style.borderColor = 'var(--btn-param-hover-border)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--btn-param-bg)';
              e.currentTarget.style.borderColor = 'var(--btn-param-border)';
            }}
            title="Open AI Parameters Hub: Review Active Rules & Setup Voice Directives"
          >
            <Sliders size={13} color="var(--btn-param-color)" />
            <span>Parameter</span>
          </button>

          {/* Theme Selector Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              id="theme-switcher-btn"
              type="button"
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                background: isThemeMenuOpen ? 'var(--dropdown-item-selected)' : 'var(--btn-default-bg)',
                border: isThemeMenuOpen ? '1px solid var(--border-focus)' : '1px solid var(--btn-default-border)',
                color: 'var(--btn-default-color, var(--text-main))',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'var(--btn-default-shadow, none)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isThemeMenuOpen) {
                  e.currentTarget.style.background = 'var(--btn-default-hover-bg)';
                  e.currentTarget.style.borderColor = 'var(--btn-default-hover-border)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isThemeMenuOpen) {
                  e.currentTarget.style.background = 'var(--btn-default-bg)';
                  e.currentTarget.style.borderColor = 'var(--btn-default-border)';
                }
              }}
              title="Select Color Palette & Sunlight Anti-Glare Mode"
            >
              {theme === 'sunny-day' ? (
                <Sun size={14} color="#f59e0b" />
              ) : theme === 'obsidian' ? (
                <Moon size={14} color="#818cf8" />
              ) : theme === 'sapphire' ? (
                <Droplets size={14} color="#38bdf8" />
              ) : theme === 'emerald' ? (
                <Sparkles size={14} color="#34d399" />
              ) : (
                <Palette size={14} color="#2563eb" />
              )}
              <span>
                {THEME_OPTIONS.find((t) => t.id === theme)?.name || 'Theme'}
              </span>
              <ChevronDown size={12} style={{ opacity: 0.7 }} />
            </button>

            {isThemeMenuOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                  onClick={() => setIsThemeMenuOpen(false)}
                />
                <div
                  className="animate-fade-in dropdown-menu-popover"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 0.4rem)',
                    width: '260px',
                    background: 'var(--dropdown-bg)',
                    border: '1px solid var(--dropdown-border)',
                    borderRadius: '0.85rem',
                    padding: '0.4rem',
                    boxShadow: 'var(--dropdown-shadow)',
                    zIndex: 95,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                  }}
                >
                  <div
                    style={{
                      padding: '0.4rem 0.65rem 0.3rem 0.65rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'var(--text-subtle)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid var(--border-subtle)',
                      marginBottom: '0.2rem',
                    }}
                  >
                    Display Themes & Anti-Glare
                  </div>
                  {THEME_OPTIONS.map((t) => {
                    const IconComp = t.icon;
                    const isSelected = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTheme(t.id);
                          setIsThemeMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '0.55rem',
                          background: isSelected ? 'var(--dropdown-item-selected)' : 'transparent',
                          border: isSelected ? '1px solid var(--dropdown-item-selected-border)' : '1px solid transparent',
                          color: isSelected ? 'var(--accent-primary)' : 'var(--text-main)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'var(--dropdown-item-hover)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              background: isSelected ? t.color : 'var(--bg-tertiary)',
                              border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isSelected ? '#ffffff' : t.color,
                            }}
                          >
                            <IconComp size={12} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>
                              {t.name}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-subtle)' }}>
                              {t.badge}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check size={13} color="var(--accent-primary)" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Dedicated Engine Hub Settings & Display Customization Button */}
          <WorkspaceSettingsDropdown
            theme={theme}
            onSelectTheme={setTheme}
          />
        </div>
      </header>

      {/* 2. SECONDARY SUB-NAVIGATION LINE (Right-Aligned Functional Controls for Active Engine) */}
      <div
        id="secondary-subnav-bar"
        style={{
          height: '46px',
          padding: '0 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          background: 'var(--header-bg)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 90,
          flexShrink: 0,
        }}
      >
        {/* Left Side: Sidebar Toggle + Active Course Title / Tool Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
          {activeModule === 'course_creator' ? (
            <>
              <button
                id="course-creator-sidebar-toggle-btn"
                type="button"
                onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '30px',
                  height: '30px',
                  borderRadius: '0.55rem',
                  background: isLeftSidebarOpen ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-subtle)',
                  color: isLeftSidebarOpen ? 'var(--accent-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
                title={isLeftSidebarOpen ? 'Collapse Chat Sidebar' : 'Expand Chat Sidebar'}
              >
                <PanelLeft size={15} />
              </button>

              {activeCourseSession?.title && activeCourseSession.title !== 'New Course Workspace' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                  <BookOpen size={14} color="var(--accent-primary)" />
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '340px',
                      letterSpacing: '-0.01em',
                    }}
                    title={activeCourseSession.title}
                  >
                    {activeCourseSession.title}
                  </span>
                </div>
              )}

              {courseCreatorTab !== 'home' && (
                <button
                  type="button"
                  onClick={() => setCourseCreatorTab('home')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.28rem 0.75rem',
                    borderRadius: '9999px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-main)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  title="Return to main Course Creator workspace"
                >
                  <span>← Studio Workspace</span>
                </button>
              )}
            </>
          ) : activeModule === 'ai_tieup_creator' || primaryNavView === 'tieup_creator' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Handshake size={15} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Tie-up & Partnership Creator
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  padding: '0.1rem 0.5rem',
                  borderRadius: '9999px',
                  background: 'var(--accent-gradient-subtle)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--accent-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Research & Outreach
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={14} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {getAIProductConfig(activeModule as AIProductType)?.name || 'AI Assistant'}
              </span>
            </div>
          )}
        </div>

        {/* Right Corner: Module-Specific Menus & Inbound Return Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {inboundReturnUrl && (
            <a
              id="nav-return-to-portal-btn"
              href={inboundReturnUrl}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.42rem',
                padding: '0.34rem 0.85rem',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
                border: '1px solid rgba(148, 163, 184, 0.35)',
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: 700,
                textDecoration: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(51, 65, 85, 1) 0%, rgba(30, 41, 59, 1) 100%)';
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)';
                e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.35)';
              }}
              title="Return to ILA Admin Portal"
            >
              <ArrowLeft size={13} />
              <span>Return to Admin Portal</span>
            </a>
          )}
          {activeModule === 'course_creator' ? (
            /* Course Creator Mode: Course Creator | Library | Delivery Paths */
            <nav
              id="primary-core-navbar"
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--subnav-track-bg)',
                border: '1px solid var(--subnav-track-border)',
                borderRadius: '9999px',
                padding: '0.22rem',
                gap: '0.25rem',
                boxShadow: 'var(--subnav-track-shadow)',
              }}
            >
              {/* 1. Course Creator */}
              <button
                id="nav-course-creator-btn"
                type="button"
                onClick={() => {
                  setPrimaryNavView('course_creator');
                  setActiveModule('course_creator');
                  setCourseCreatorTab('home');
                  setIsDeliveryPathsMenuOpen(false);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.42rem',
                  padding: '0.34rem 0.95rem',
                  borderRadius: '9999px',
                  background:
                    primaryNavView === 'course_creator' && courseCreatorTab === 'home'
                      ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                      : 'transparent',
                  border: 'none',
                  color:
                    primaryNavView === 'course_creator' && courseCreatorTab === 'home'
                      ? '#ffffff'
                      : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow:
                    primaryNavView === 'course_creator' && courseCreatorTab === 'home'
                      ? '0 2px 14px rgba(99, 102, 241, 0.45)'
                      : 'none',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                title="Course Creator: Master authoring studio & chat history workspace"
              >
                <GraduationCap size={14} />
                <span>Course Creator</span>
              </button>

              {/* 2. Library */}
              <button
                id="nav-library-btn"
                type="button"
                onClick={() => {
                  setPrimaryNavView('library');
                  setIsDeliveryPathsMenuOpen(false);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.42rem',
                  padding: '0.34rem 0.95rem',
                  borderRadius: '9999px',
                  background:
                    primaryNavView === 'library'
                      ? 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)'
                      : 'transparent',
                  border: 'none',
                  color: primaryNavView === 'library' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow:
                    primaryNavView === 'library'
                      ? '0 2px 14px rgba(56, 189, 248, 0.45)'
                      : 'none',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                title="Library: Dedicated curriculum reader & catalog"
              >
                <BookOpen size={14} />
                <span>Library</span>
              </button>

              {/* 3. Delivery Paths (Migrated from Delivery Mode with complete options) */}
              <div ref={deliveryPathsDropdownRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <button
                  id="nav-delivery-paths-btn"
                  type="button"
                  onClick={() => setIsDeliveryPathsMenuOpen(!isDeliveryPathsMenuOpen)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.42rem',
                    padding: '0.34rem 0.85rem',
                    borderRadius: '9999px',
                    background:
                      primaryNavView === 'student_paths' || courseCreatorTab !== 'home'
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : 'transparent',
                    border: 'none',
                    color:
                      primaryNavView === 'student_paths' || courseCreatorTab !== 'home'
                        ? '#ffffff'
                        : 'var(--text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow:
                      primaryNavView === 'student_paths' || courseCreatorTab !== 'home'
                        ? '0 2px 14px rgba(16, 185, 129, 0.45)'
                        : 'none',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  title="Delivery Paths: Select specialized delivery mode or teaching studio"
                >
                  <Compass size={14} />
                  <span>
                    {courseCreatorTab === 'slide_ai'
                      ? 'Slide + AI'
                      : courseCreatorTab === 'video_ai'
                      ? 'Video + AI'
                      : courseCreatorTab === 'intelli_coach'
                      ? 'Intelli Coach'
                      : courseCreatorTab === 'one_on_one_online'
                      ? '1-on-1 Online'
                      : courseCreatorTab === 'group_online'
                      ? 'Group Online'
                      : courseCreatorTab === 'camp_online'
                      ? 'Camp Online'
                      : courseCreatorTab === 'camp_offline'
                      ? 'Camp Offline'
                      : courseCreatorTab === 'sports_online'
                      ? 'Sports Online'
                      : courseCreatorTab === 'sports_offline'
                      ? 'Sports Offline'
                      : 'Delivery Paths'}
                  </span>
                  <ChevronDown
                    size={12}
                    style={{
                      transform: isDeliveryPathsMenuOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>

                {/* Delivery Paths Dropdown Menu */}
                {isDeliveryPathsMenuOpen && (
                  <>
                    <div
                      id="delivery-paths-backdrop"
                      style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                      onClick={() => setIsDeliveryPathsMenuOpen(false)}
                    />
                    <div
                      id="delivery-paths-dropdown-menu"
                      className="animate-pop-in"
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 0.5rem)',
                        width: '320px',
                        maxHeight: '480px',
                        overflowY: 'auto',
                        background: 'var(--dropdown-bg)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: '1px solid var(--dropdown-border)',
                        borderRadius: '0.95rem',
                        padding: '0.5rem',
                        boxShadow: 'var(--dropdown-shadow)',
                        zIndex: 95,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                      }}
                    >
                      <div
                        style={{
                          padding: '0.35rem 0.65rem 0.2rem 0.65rem',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: 'var(--text-subtle)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        AI Teaching & Studio Tools
                      </div>

                      <button
                        id="path-menu-slide-ai-btn"
                        type="button"
                        onClick={() => {
                          setPrimaryNavView('course_creator');
                          setCourseCreatorTab('slide_ai');
                          setIsDeliveryPathsMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '0.55rem',
                          background: courseCreatorTab === 'slide_ai' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                          border: courseCreatorTab === 'slide_ai' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                          color: courseCreatorTab === 'slide_ai' ? '#38bdf8' : 'var(--text-main)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <Presentation size={14} color="#38bdf8" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700 }}>Slide + AI</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Interactive Slide Decks & TTS Narration</div>
                        </div>
                        {courseCreatorTab === 'slide_ai' && <Check size={13} color="#38bdf8" />}
                      </button>

                      <button
                        id="path-menu-video-ai-btn"
                        type="button"
                        onClick={() => {
                          setPrimaryNavView('course_creator');
                          setCourseCreatorTab('video_ai');
                          setIsDeliveryPathsMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '0.55rem',
                          background: courseCreatorTab === 'video_ai' ? 'rgba(236, 72, 153, 0.15)' : 'transparent',
                          border: courseCreatorTab === 'video_ai' ? '1px solid rgba(236, 72, 153, 0.4)' : '1px solid transparent',
                          color: courseCreatorTab === 'video_ai' ? '#ec4899' : 'var(--text-main)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <Tv size={14} color="#ec4899" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700 }}>Video + AI</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Studio Video Masterclasses & Playback</div>
                        </div>
                        {courseCreatorTab === 'video_ai' && <Check size={13} color="#ec4899" />}
                      </button>

                      <button
                        id="path-menu-intelli-coach-btn"
                        type="button"
                        onClick={() => {
                          setPrimaryNavView('course_creator');
                          setCourseCreatorTab('intelli_coach');
                          setIsDeliveryPathsMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '0.55rem',
                          background: courseCreatorTab === 'intelli_coach' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                          border: courseCreatorTab === 'intelli_coach' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                          color: courseCreatorTab === 'intelli_coach' ? '#10b981' : 'var(--text-main)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <Bot size={14} color="#10b981" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700 }}>Intelli Coach</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Tutoring Diagnostics & Blueprints</div>
                        </div>
                        {courseCreatorTab === 'intelli_coach' && <Check size={13} color="#10b981" />}
                      </button>

                      <div
                        style={{
                          padding: '0.45rem 0.65rem 0.2rem 0.65rem',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: 'var(--text-subtle)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          borderTop: '1px solid var(--border-subtle)',
                          marginTop: '0.2rem',
                        }}
                      >
                        Learning Delivery Formats
                      </div>

                      <button
                        id="path-menu-1on1-btn"
                        type="button"
                        onClick={() => {
                          setSelectedPathMode('one_on_one_online');
                          setPrimaryNavView('student_paths');
                          setCourseCreatorTab('one_on_one_online');
                          setIsDeliveryPathsMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.42rem 0.65rem',
                          borderRadius: '0.55rem',
                          background: courseCreatorTab === 'one_on_one_online' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                          border: courseCreatorTab === 'one_on_one_online' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                          color: courseCreatorTab === 'one_on_one_online' ? '#818cf8' : 'var(--text-main)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <UserCheck size={14} color="#818cf8" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700 }}>1-on-1 Online</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Private Mentorship & Live Diagnostics</div>
                        </div>
                        {courseCreatorTab === 'one_on_one_online' && <Check size={13} color="#818cf8" />}
                      </button>

                      <button
                        id="path-menu-group-btn"
                        type="button"
                        onClick={() => {
                          setSelectedPathMode('group_online');
                          setPrimaryNavView('student_paths');
                          setCourseCreatorTab('group_online');
                          setIsDeliveryPathsMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.42rem 0.65rem',
                          borderRadius: '0.55rem',
                          background: courseCreatorTab === 'group_online' ? 'rgba(14, 165, 233, 0.15)' : 'transparent',
                          border: courseCreatorTab === 'group_online' ? '1px solid rgba(14, 165, 233, 0.4)' : '1px solid transparent',
                          color: courseCreatorTab === 'group_online' ? '#38bdf8' : 'var(--text-main)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <Users size={14} color="#38bdf8" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700 }}>Group Online</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Collaborative Cohorts & Breakouts</div>
                        </div>
                        {courseCreatorTab === 'group_online' && <Check size={13} color="#38bdf8" />}
                      </button>

                      <button
                        id="path-menu-camp-online-btn"
                        type="button"
                        onClick={() => {
                          setSelectedPathMode('camp_online');
                          setPrimaryNavView('student_paths');
                          setCourseCreatorTab('camp_online');
                          setIsDeliveryPathsMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.42rem 0.65rem',
                          borderRadius: '0.55rem',
                          background: courseCreatorTab === 'camp_online' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                          border: courseCreatorTab === 'camp_online' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                          color: courseCreatorTab === 'camp_online' ? '#f59e0b' : 'var(--text-main)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <Tent size={14} color="#f59e0b" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700 }}>Camp Online</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Intensive Virtual Bootcamps</div>
                        </div>
                        {courseCreatorTab === 'camp_online' && <Check size={13} color="#f59e0b" />}
                      </button>

                      <button
                        id="path-menu-camp-offline-btn"
                        type="button"
                        onClick={() => {
                          setSelectedPathMode('camp_offline');
                          setPrimaryNavView('student_paths');
                          setCourseCreatorTab('camp_offline');
                          setIsDeliveryPathsMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.42rem 0.65rem',
                          borderRadius: '0.55rem',
                          background: courseCreatorTab === 'camp_offline' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                          border: courseCreatorTab === 'camp_offline' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                          color: courseCreatorTab === 'camp_offline' ? '#10b981' : 'var(--text-main)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <MapPin size={14} color="#10b981" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700 }}>Camp Offline</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>On-Campus Physical Stations</div>
                        </div>
                        {courseCreatorTab === 'camp_offline' && <Check size={13} color="#10b981" />}
                      </button>

                      <button
                        id="path-menu-sports-online-btn"
                        type="button"
                        onClick={() => {
                          setSelectedPathMode('sports_online');
                          setPrimaryNavView('student_paths');
                          setCourseCreatorTab('sports_online');
                          setIsDeliveryPathsMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.42rem 0.65rem',
                          borderRadius: '0.55rem',
                          background: courseCreatorTab === 'sports_online' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                          border: courseCreatorTab === 'sports_online' ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent',
                          color: courseCreatorTab === 'sports_online' ? '#c084fc' : 'var(--text-main)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <Trophy size={14} color="#c084fc" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700 }}>Sports Online</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Tactical Playbook & Home Conditioning</div>
                        </div>
                        {courseCreatorTab === 'sports_online' && <Check size={13} color="#c084fc" />}
                      </button>

                      <button
                        id="path-menu-sports-offline-btn"
                        type="button"
                        onClick={() => {
                          setSelectedPathMode('sports_offline');
                          setPrimaryNavView('student_paths');
                          setCourseCreatorTab('sports_offline');
                          setIsDeliveryPathsMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.42rem 0.65rem',
                          borderRadius: '0.55rem',
                          background: courseCreatorTab === 'sports_offline' ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
                          border: courseCreatorTab === 'sports_offline' ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid transparent',
                          color: courseCreatorTab === 'sports_offline' ? '#f43f5e' : 'var(--text-main)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <Activity size={14} color="#f43f5e" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700 }}>Sports Offline</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>On-Field Drills & Circuits</div>
                        </div>
                        {courseCreatorTab === 'sports_offline' && <Check size={13} color="#f43f5e" />}
                      </button>

                      {/* Active Learning Modules List */}
                      {courseCreatorSessions.length > 0 && (
                        <>
                          <div
                            style={{
                              padding: '0.45rem 0.65rem 0.2rem 0.65rem',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: 'var(--text-subtle)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              borderTop: '1px solid var(--border-subtle)',
                              marginTop: '0.2rem',
                            }}
                          >
                            Active Modules ({courseCreatorSessions.length})
                          </div>
                          {courseCreatorSessions.slice(0, 4).map((cSession) => (
                            <button
                              key={cSession.id}
                              type="button"
                              onClick={() => {
                                handleSelectSession(cSession.id);
                                setPrimaryNavView('course_creator');
                                setCourseCreatorTab('home');
                                setIsDeliveryPathsMenuOpen(false);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.42rem 0.65rem',
                                borderRadius: '0.55rem',
                                background: 'transparent',
                                border: '1px solid transparent',
                                cursor: 'pointer',
                                textAlign: 'left',
                                gap: '0.5rem',
                                transition: 'background 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div
                                  style={{
                                    fontSize: '0.76rem',
                                    fontWeight: 600,
                                    color: 'var(--text-main)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {cSession.title || 'Untitled Path'}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: '#10b981' }}>
                                  Access Lessons & Slides
                                </div>
                              </div>
                              <ArrowRight size={12} color="var(--text-muted)" />
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </nav>
          ) : activeModule === 'ai_tieup_creator' || primaryNavView === 'tieup_creator' ? (
            /* Dedicated Tie-up Sub-Navigation Menu (Permanently Locked on Secondary Row) */
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <nav
                id="tieup-sub-navbar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '9999px',
                  padding: '0.2rem 0.25rem',
                  gap: '0.25rem',
                }}
              >
                {/* 1. Chat Home */}
                <button
                  id="tieup-subnav-chat-home"
                  type="button"
                  onClick={() => handleSelectTieupTab('chat_home')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.38rem',
                    padding: '0.32rem 0.85rem',
                    borderRadius: '9999px',
                    background: tieupActiveTab === 'chat_home' ? 'var(--bg-card)' : 'transparent',
                    border: tieupActiveTab === 'chat_home' ? '1px solid var(--border-medium)' : '1px solid transparent',
                    borderBottom: tieupActiveTab === 'chat_home' ? '2px solid var(--accent-primary)' : '1px solid transparent',
                    color: tieupActiveTab === 'chat_home' ? 'var(--text-main)' : 'var(--text-muted)',
                    fontSize: '0.76rem',
                    fontWeight: tieupActiveTab === 'chat_home' ? 700 : 500,
                    cursor: 'pointer',
                    boxShadow: tieupActiveTab === 'chat_home' ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                  title="Chat Home: Inverted workspace & AI grounding research"
                >
                  <MessageSquare size={13} color={tieupActiveTab === 'chat_home' ? 'var(--accent-primary)' : 'currentColor'} />
                  <span>Chat Home</span>
                </button>

                {/* 2. Resources */}
                <button
                  id="tieup-subnav-resources"
                  type="button"
                  onClick={() => handleSelectTieupTab('resources')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.38rem',
                    padding: '0.32rem 0.85rem',
                    borderRadius: '9999px',
                    background: tieupActiveTab === 'resources' ? 'var(--bg-card)' : 'transparent',
                    border: tieupActiveTab === 'resources' ? '1px solid var(--border-medium)' : '1px solid transparent',
                    borderBottom: tieupActiveTab === 'resources' ? '2px solid var(--accent-primary)' : '1px solid transparent',
                    color: tieupActiveTab === 'resources' ? 'var(--text-main)' : 'var(--text-muted)',
                    fontSize: '0.76rem',
                    fontWeight: tieupActiveTab === 'resources' ? 700 : 500,
                    cursor: 'pointer',
                    boxShadow: tieupActiveTab === 'resources' ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                  title="Resources: Master institutional repository & lead database"
                >
                  <Database size={13} color={tieupActiveTab === 'resources' ? 'var(--accent-primary)' : 'currentColor'} />
                  <span>Resources</span>
                  {tieupCounts.resources > 0 && (
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        padding: '0.05rem 0.4rem',
                        borderRadius: '9999px',
                        background: tieupActiveTab === 'resources' ? 'var(--accent-gradient-subtle)' : 'var(--border-subtle)',
                        color: tieupActiveTab === 'resources' ? 'var(--accent-primary)' : 'var(--text-subtle)',
                      }}
                    >
                      {tieupCounts.resources}
                    </span>
                  )}
                </button>

                {/* 3. Process */}
                <button
                  id="tieup-subnav-process"
                  type="button"
                  onClick={() => handleSelectTieupTab('process')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.38rem',
                    padding: '0.32rem 0.85rem',
                    borderRadius: '9999px',
                    background: tieupActiveTab === 'process' ? 'var(--bg-card)' : 'transparent',
                    border: tieupActiveTab === 'process' ? '1px solid var(--border-medium)' : '1px solid transparent',
                    borderBottom: tieupActiveTab === 'process' ? '2px solid var(--accent-primary)' : '1px solid transparent',
                    color: tieupActiveTab === 'process' ? 'var(--text-main)' : 'var(--text-muted)',
                    fontSize: '0.76rem',
                    fontWeight: tieupActiveTab === 'process' ? 700 : 500,
                    cursor: 'pointer',
                    boxShadow: tieupActiveTab === 'process' ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                  title="Process: Outreach automation, dispatch queue & delivery tracking"
                >
                  <SendHorizontal size={13} color={tieupActiveTab === 'process' ? 'var(--accent-primary)' : 'currentColor'} />
                  <span>Process</span>
                  {tieupCounts.process > 0 && (
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        padding: '0.05rem 0.4rem',
                        borderRadius: '9999px',
                        background: tieupActiveTab === 'process' ? 'var(--accent-gradient-subtle)' : 'var(--border-subtle)',
                        color: tieupActiveTab === 'process' ? 'var(--accent-primary)' : 'var(--text-subtle)',
                      }}
                    >
                      {tieupCounts.process}
                    </span>
                  )}
                </button>

                {/* 4. Partners */}
                <button
                  id="tieup-subnav-partners"
                  type="button"
                  onClick={() => handleSelectTieupTab('partners')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.38rem',
                    padding: '0.32rem 0.85rem',
                    borderRadius: '9999px',
                    background: tieupActiveTab === 'partners' ? 'var(--bg-card)' : 'transparent',
                    border: tieupActiveTab === 'partners' ? '1px solid var(--border-medium)' : '1px solid transparent',
                    borderBottom: tieupActiveTab === 'partners' ? '2px solid var(--accent-primary)' : '1px solid transparent',
                    color: tieupActiveTab === 'partners' ? 'var(--text-main)' : 'var(--text-muted)',
                    fontSize: '0.76rem',
                    fontWeight: tieupActiveTab === 'partners' ? 700 : 500,
                    cursor: 'pointer',
                    boxShadow: tieupActiveTab === 'partners' ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                  title="Partners: Finalized MOUs, signed contracts & board records"
                >
                  <Award size={13} color={tieupActiveTab === 'partners' ? 'var(--accent-primary)' : 'currentColor'} />
                  <span>Partners</span>
                  {tieupCounts.partners > 0 && (
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        padding: '0.05rem 0.4rem',
                        borderRadius: '9999px',
                        background: tieupActiveTab === 'partners' ? 'var(--accent-gradient-subtle)' : 'var(--border-subtle)',
                        color: tieupActiveTab === 'partners' ? 'var(--accent-primary)' : 'var(--text-subtle)',
                      }}
                    >
                      {tieupCounts.partners}
                    </span>
                  )}
                </button>
              </nav>

              {/* Our Policies Button */}
              <button
                id="tieup-subnav-policies-btn"
                type="button"
                onClick={() => setIsTieupPolicyModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.38rem',
                  padding: '0.34rem 0.85rem',
                  borderRadius: '9999px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-main)',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.15s ease',
                }}
                title="Configure institution criteria, commission benchmarks, and student requirements"
              >
                <Settings size={13} strokeWidth={2} color="var(--accent-primary)" />
                <span>Our Policies</span>
              </button>
            </div>
          ) : (
            /* General AI / Other Tools Navigation: Chat Home | Resources */
            <nav
              id="general-ai-navbar"
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--subnav-track-bg)',
                border: '1px solid var(--subnav-track-border)',
                borderRadius: '9999px',
                padding: '0.22rem',
                gap: '0.25rem',
                boxShadow: 'var(--subnav-track-shadow)',
              }}
            >
              {/* 1. Chat Home */}
              <button
                id="nav-chat-home-btn"
                type="button"
                onClick={() => {
                  setPrimaryNavView('chat_home');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.42rem',
                  padding: '0.34rem 0.95rem',
                  borderRadius: '9999px',
                  background:
                    primaryNavView === 'chat_home' || primaryNavView === 'ai_tool'
                      ? 'var(--accent-gradient)'
                      : 'transparent',
                  border: 'none',
                  color:
                    primaryNavView === 'chat_home' || primaryNavView === 'ai_tool'
                      ? '#ffffff'
                      : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow:
                    primaryNavView === 'chat_home' || primaryNavView === 'ai_tool'
                      ? '0 2px 14px var(--accent-glow)'
                      : 'none',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                title="Chat Home: Conversational AI companion & specialized assistant"
              >
                <MessageSquare size={14} />
                <span>Chat Home</span>
              </button>

              {/* 2. Resources */}
              <button
                id="nav-resources-btn"
                type="button"
                onClick={() => {
                  setPrimaryNavView('resources');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.42rem',
                  padding: '0.34rem 0.95rem',
                  borderRadius: '9999px',
                  background:
                    primaryNavView === 'resources'
                      ? 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)'
                      : 'transparent',
                  border: 'none',
                  color: primaryNavView === 'resources' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow:
                    primaryNavView === 'resources'
                      ? '0 2px 14px rgba(14, 165, 233, 0.45)'
                      : 'none',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                title="Resources: Saved outputs repository & centralized data hub"
              >
                <Database size={14} />
                <span>Resources</span>
              </button>
            </nav>
          )}
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div
          id="global-error-banner"
          style={{
            padding: '0.45rem 1.25rem',
            background: 'rgba(239, 68, 68, 0.15)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            fontSize: '0.78rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 110,
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fca5a5',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.82rem',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. MAIN CONTENT VIEWPORT */}
      <div
        id="main-viewport-container"
        style={{
          flex: 1,
          display: 'flex',
          minHeight: 0,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* VIEW ROUTING BASED ON STRICT ISOLATION ARCHITECTURE */}
        {activeModule === 'ai_tieup_creator' || primaryNavView === 'tieup_creator' ? (
          /* 1. 100% IMMERSIVE ISOLATED TIE-UP & PARTNERSHIP CREATOR WORKSPACE */
          <CourseErrorBoundary
            key="tieup_creator_boundary"
            onReset={() => {
              setActiveModule('ai_tieup_creator');
              setPrimaryNavView('tieup_creator');
            }}
          >
            <TieupResearchEngineView
              key={`tieup_isolated_view_${activeTieupSession?.id || 'default'}`}
              activeSession={activeTieupSession}
              sessions={sessions}
              onSelectSession={handleSelectSession}
              onNewSession={(prod, p) => handleNewChatForProduct(prod || 'ai_tieup_creator', p)}
              onDeleteSession={handleDeleteSession}
              onSendMessage={handleSendAIHubMessage}
              loading={loading}
              activeMainTab={tieupActiveTab}
              onSelectTab={handleSelectTieupTab}
              isPolicyModalOpen={isTieupPolicyModalOpen}
              onOpenPolicyModal={() => setIsTieupPolicyModalOpen(true)}
              onClosePolicyModal={() => setIsTieupPolicyModalOpen(false)}
              onUpdateCounts={setTieupCounts}
            />
          </CourseErrorBoundary>
        ) : primaryNavView === 'library' ? (
          /* 2. 100% IMMERSIVE DEDICATED LIBRARY VIEW: ZERO CHAT SIDEBAR */
          <DedicatedLibraryView
            onOpenInWorkspace={(course: LibraryCourse) => {
              const matchedSession = sessions.find((s) => s.id === course.sourceSessionId);
              if (matchedSession) {
                setActiveSessionId(matchedSession.id);
              }
              setPrimaryNavView('course_creator');
              setCourseCreatorTab('home');
            }}
            onBackToChat={() => {
              setPrimaryNavView('course_creator');
              setCourseCreatorTab('home');
            }}
            onCreateNewCourse={() => {
              handleNewCourse();
              setPrimaryNavView('course_creator');
              setCourseCreatorTab('home');
            }}
          />
        ) : primaryNavView === 'student_paths' ? (
          /* 2. 100% IMMERSIVE STUDENT PATHS VIEW WITH SAFE ERROR BOUNDARY */
          <CourseErrorBoundary
            key="student_paths_boundary"
            onReset={() => setPrimaryNavView('student_paths')}
          >
            <LearningPathModeView
              key={`dedicated_student_paths_${selectedPathMode}`}
              initialMode={selectedPathMode}
              sessions={courseCreatorSessions}
              onSelectCourseSession={(sId) => {
                handleSelectSession(sId);
                setPrimaryNavView('course_creator');
                setCourseCreatorTab('home');
              }}
              onLaunchCourse={(topicQuery, mode) => {
                const modeCfg = LEARNING_PATH_MODES[mode];
                const targetAudienceValue = modeCfg?.recommendedAudience || 'General Student';
                localStorage.setItem('ila_learner_category', targetAudienceValue);
                setPrimaryNavView('course_creator');
                setCourseCreatorTab('home');
                handleNewCourse().then(() => {
                  executeAutonomousCoursePlan(
                    `[${modeCfg?.title || mode} Delivery] ${topicQuery}`,
                    [],
                    targetAudienceValue
                  );
                });
              }}
              onOpenSlideAi={() => {
                setPrimaryNavView('course_creator');
                setCourseCreatorTab('slide_ai');
              }}
              onOpenVideoAi={() => {
                setPrimaryNavView('course_creator');
                setCourseCreatorTab('video_ai');
              }}
              onOpenIntelliCoach={() => {
                setPrimaryNavView('course_creator');
                setCourseCreatorTab('intelli_coach');
              }}
              onOpenAdminLibrary={() => setPrimaryNavView('library')}
              onOpenChatHome={() => {
                setPrimaryNavView('course_creator');
                setCourseCreatorTab('home');
              }}
            />
          </CourseErrorBoundary>
        ) : primaryNavView === 'central_dashboard' ? (
          /* 3. 100% IMMERSIVE CENTRAL DASHBOARD: ZERO CHAT SIDEBAR */
          <CentralDashboardView
            sessions={sessions}
            onSelectProduct={(prod) => handleSelectModule(prod)}
            onSelectSession={(sId) => {
              handleSelectSession(sId);
              const matched = sessions.find((s) => s.id === sId);
              if (matched?.productType && matched.productType !== 'course_creator') {
                handleSelectModule(matched.productType);
              } else {
                setPrimaryNavView('course_creator');
                setCourseCreatorTab('home');
              }
            }}
            onOpenParameterInput={() => handleOpenParameters('input')}
            onOpenParameterList={() => handleOpenParameters('list')}
            onReturnToHome={() => {
              setPrimaryNavView('course_creator');
              setCourseCreatorTab('home');
            }}
          />
        ) : primaryNavView === 'resources' ? (
          /* 4. 100% IMMERSIVE RESOURCES REPOSITORY & DATA HUB */
          <ResourcesDataHubView
            sessions={sessions}
            onOpenSessionInWorkspace={(session) => {
              handleSelectSession(session.id);
              if (session.productType && session.productType !== 'course_creator' && session.productType !== 'ila_chat') {
                handleSelectModule(session.productType);
              } else if (session.productType === 'ila_chat') {
                setActiveModule('ila_chat');
                setPrimaryNavView('chat_home');
              } else {
                setPrimaryNavView('course_creator');
                setCourseCreatorTab('home');
              }
            }}
            onDeleteSession={handleDeleteSession}
            onExportJSON={handleExportJSON}
            onNavigateToChat={() => {
              setActiveModule('ila_chat');
              setPrimaryNavView('chat_home');
            }}
            onNavigateToCourseCreator={() => {
              setActiveModule('course_creator');
              setPrimaryNavView('course_creator');
              setCourseCreatorTab('home');
            }}
          />
        ) : (primaryNavView === 'ai_tool' || (activeModule !== 'course_creator' && primaryNavView === 'chat_home' && activeModule !== 'ila_chat')) ? (
          /* 5. 100% IMMERSIVE SPECIALIZED AI HUB TOOLS */
          <AIHubWorkspaceView
            productType={activeModule as AIProductType}
            onSelectProduct={handleSelectModule}
            onReturnToCourseCreator={() => {
              setPrimaryNavView('course_creator');
              setCourseCreatorTab('home');
            }}
            activeSession={activeSession}
            sessions={sessions}
            onSelectSession={handleSelectSession}
            onNewSession={(prod, p) => handleNewChatForProduct(prod, p)}
            onDeleteSession={handleDeleteSession}
            onSendMessage={handleSendAIHubMessage}
            loading={loading}
            theme={theme}
            onToggleThemeMenu={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            isThemeMenuOpen={isThemeMenuOpen}
            onSelectTheme={setTheme}
            isSidebarOpen={isLeftSidebarOpen}
            onToggleSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
            onOpenActivityTracker={() => setIsActivityTrackerOpen(true)}
            onOpenCentralDashboard={() => {
              setPrimaryNavView('central_dashboard');
            }}
            onOpenParameterInput={() => handleOpenParameters('input')}
            onOpenParameterList={() => handleOpenParameters('list')}
          />
        ) : activeModule === 'ila_chat' && primaryNavView === 'chat_home' ? (
          /* 6. GENERAL CHAT HOME MODE (Unified AI Assistant) */
          <ChatHomeView
            sessions={sessions.filter((s) => s.productType === 'ila_chat' || !s.productType)}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
            onNewChat={() => handleNewChatForProduct('ila_chat')}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
            onTogglePinSession={handleTogglePinSession}
            onClearAllSessions={handleClearAllSessions}
            onExportJSON={handleExportJSON}
            onImportJSON={handleImportJSON}
            onSendMessage={handleSendMessage}
            loading={loading}
            isDbPersisted={isDbPersisted}
            dbHealth={dbHealth}
            onSpeak={speak}
            isSpeaking={isSpeaking}
            activeSpeakingId={activeSpeakingId}
            onConvertToCourse={(session) => {
              handleSelectSession(session.id);
              setActiveModule('course_creator');
              setPrimaryNavView('course_creator');
              setCourseCreatorTab('home');
            }}
          />
        ) : (
          /* 5. COURSE CREATOR UNIFIED MASTER STUDIO (Left Chat History Sidebar + Right Master Workspace) */
          <div
            id="course-creator-studio-layout"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'row',
              height: '100%',
              width: '100%',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Left: Unified Course Chat History Sidebar (Only shown on Course Creator Home tab, removed from Slide AI, Video AI, IntelliCoach, and Student Delivery Paths) */}
            {courseCreatorTab === 'home' && (
              <ChatSidebar
                sessions={courseCreatorSessions}
                activeSessionId={activeCourseSession?.id || activeSessionId}
                onSelectSession={(sId) => {
                  handleSelectSession(sId);
                  setCourseCreatorTab('home');
                }}
                onNewChat={handleNewCourse}
                onDeleteSession={handleDeleteSession}
                onRenameSession={handleRenameSession}
                onTogglePinSession={handleTogglePinSession}
                onClearAllSessions={handleClearAllSessions}
                onExportJSON={handleExportJSON}
                onImportJSON={handleImportJSON}
                isOpen={isLeftSidebarOpen}
                onToggleOpen={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                isDbPersisted={isDbPersisted}
                dbHealth={dbHealth}
                activeProductType="course_creator"
                onSelectProduct={handleSelectModule}
              />
            )}

            {/* Right: Full Course Creation Workspace Panel */}
            <div
              id="course-creator-workspace-container"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minWidth: 0,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Sub-Views inside Course Creator wrapped in safe Error Boundary */}
              <CourseErrorBoundary
                key={courseCreatorTab}
                onReset={() => setCourseCreatorTab('home')}
              >
              {courseCreatorTab === 'intelli_coach' ? (
                <IntelliCoachView
                  key="intelli_coach_standalone_view"
                  initialCourse={activeCourseSession && activeCourseSession.messages.length > 0 ? compileCourseFromChatSession(activeCourseSession) : null}
                  onLaunchCourse={(_courseTitle, targetAudience, promptQuery) => {
                    setCourseCreatorTab('home');
                    const targetAudienceValue = targetAudience || 'General Student / Lifelong Learner';
                    localStorage.setItem('ila_learner_category', targetAudienceValue);
                    handleNewCourse().then(() => {
                      if (promptQuery) {
                        executeAutonomousCoursePlan(promptQuery, [], targetAudienceValue);
                      }
                    });
                  }}
                  onOpenReadingTab={() => setCourseCreatorTab('home')}
                  onOpenSlideTab={() => setCourseCreatorTab('slide_ai')}
                  onOpenVideoTab={() => setCourseCreatorTab('video_ai')}
                />
              ) : courseCreatorTab === 'slide_ai' ? (
                <SlideAiLibraryView
                  key="slide_ai_standalone_view"
                  onOpenCreator={() => {
                    setCourseCreatorTab('home');
                    handleNewCourse();
                  }}
                />
              ) : courseCreatorTab === 'video_ai' ? (
                <VideoAiLibraryView
                  key="video_ai_standalone_view"
                  onOpenCreator={() => {
                    setCourseCreatorTab('home');
                    handleNewCourse();
                  }}
                />
              ) : (
                courseCreatorTab === 'one_on_one_online' ||
                courseCreatorTab === 'group_online' ||
                courseCreatorTab === 'camp_online' ||
                courseCreatorTab === 'camp_offline' ||
                courseCreatorTab === 'sports_online' ||
                courseCreatorTab === 'sports_offline'
              ) ? (
                <LearningPathModeView
                  key={`path_mode_${courseCreatorTab}`}
                  initialMode={courseCreatorTab as LearningPathMode}
                  onLaunchCourse={(topicQuery, mode) => {
                    setCourseCreatorTab('home');
                    const modeCfg = LEARNING_PATH_MODES[mode];
                    const targetAudienceValue = modeCfg?.recommendedAudience || 'General Student';
                    localStorage.setItem('ila_learner_category', targetAudienceValue);
                    handleNewCourse().then(() => {
                      executeAutonomousCoursePlan(
                        `[${modeCfg?.title || mode} Delivery] ${topicQuery}`,
                        [],
                        targetAudienceValue
                      );
                    });
                  }}
                  onOpenSlideAi={() => setCourseCreatorTab('slide_ai')}
                  onOpenVideoAi={() => setCourseCreatorTab('video_ai')}
                  onOpenIntelliCoach={() => setCourseCreatorTab('intelli_coach')}
                  onOpenAdminLibrary={() => setPrimaryNavView('library')}
                  onOpenChatHome={() => setPrimaryNavView('chat_home')}
                />
              ) : (
                /* Home / Workspace Course Creation view */
                <>
                  {/* Upper Search Bar & Creator Controls */}
                  <div
                    id="upper-search-container"
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: 'var(--header-bg)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      padding: '0.55rem 1.25rem 0.5rem 1.25rem',
                      zIndex: 28,
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ width: '100%', maxWidth: '100%', margin: '0' }}>
                      <SearchBox
                        key={activeCourseSession?.id || 'default'}
                        onSendMessage={handleSendMessage}
                        loading={loading}
                        attachedDocuments={attachedDocuments}
                        onDocumentsChange={setAttachedDocuments}
                        placeholder="Create enterprise course curriculum, author textbook chapter, or specify topic..."
                        onNewChat={handleNewCourse}
                        isBulkPlannerActive={isBulkPlannerActive}
                        onToggleBulkPlanner={setIsBulkPlannerActive}
                        initialQuery={inboundPrompt}
                        initialCategory={inboundCategory}
                        initialSubCategory={inboundSubCategory}
                        initialCourseId={inboundCourseId}
                        initialCourseName={
                          inboundCourseName ||
                          (activeCourseSession &&
                          activeCourseSession.title !== 'New Course Workspace' &&
                          activeCourseSession.title !== 'Untitled Course'
                            ? activeCourseSession.title
                            : '')
                        }
                      />
                    </div>
                  </div>

                  {/* Direct Comprehensive Course Workspace View */}
                  {activeCourseSession && activeCourseSession.messages.length > 0 ? (
                    <div
                      id="main-course-workspace-container"
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      {/* Real-time AI Generation Progress Notification Banner */}
                      {loading && (
                        <div
                          style={{
                            padding: '0.45rem 1.5rem',
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
                            borderBottom: '1px solid rgba(165, 180, 252, 0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.78rem',
                            color: '#c7d2fe',
                            fontWeight: 600,
                            animation: 'pulse 2s infinite ease-in-out',
                            zIndex: 25,
                            flexShrink: 0,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <RefreshCw size={14} className="animate-spin" color="var(--accent-primary)" />
                            <span>ILA AI is actively authoring & compiling your course curriculum in real-time...</span>
                          </div>
                          <span style={{ fontSize: '0.72rem', opacity: 0.85, color: '#a5b4fc' }}>
                            Auto-compiling to SQLite Course Workspace
                          </span>
                        </div>
                      )}

                      <LibraryWorkspaceView
                        key={activeCourseSession.id}
                        session={activeCourseSession}
                        onSpeak={speak}
                        isSpeaking={isSpeaking}
                        activeSpeakingId={activeSpeakingId}
                        onUpdateSessionMessage={handleUpdateSessionMessage}
                        onOpenQuestionTree={() => setIsQuestionTreeOpen(true)}
                        totalQuestions={totalUserQuestions}
                      />
                    </div>
                  ) : (
                    /* Blank / Starter Hero Banner when no messages in session */
                    <div
                      id="workspace-starter-hero"
                      style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '2rem 1.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        maxWidth: '1000px',
                        margin: '0 auto',
                        width: '100%',
                      }}
                    >
                      {loading ? (
                        <div
                          style={{
                            width: '100%',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '1.25rem',
                            padding: '2.5rem 2rem',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                          }}
                        >
                          <div
                            style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '50%',
                              background: 'rgba(99, 102, 241, 0.15)',
                              border: '1px solid rgba(99, 102, 241, 0.35)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '1rem',
                            }}
                          >
                            <RefreshCw size={26} className="animate-spin" color="var(--accent-primary)" />
                          </div>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                            Generating Course Curriculum...
                          </h3>
                          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '460px', margin: '0 auto' }}>
                            ILA AI is architecting complete multi-chapter chapters, structured subtopics, and dynamic quiz masteries.
                          </p>
                        </div>
                      ) : (
                        <div
                          className="animate-fade-in"
                          style={{
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
                              position: 'relative',
                            }}
                          >
                            <Sparkles size={34} color="#ffffff" className="animate-float" />
                          </div>
                          <h2
                            style={{
                              fontSize: '2rem',
                              fontWeight: 800,
                              color: 'var(--text-main)',
                              letterSpacing: '-0.035em',
                              marginBottom: '0.65rem',
                              background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                            }}
                          >
                            Course Creator
                          </h2>
                          <p
                            style={{
                              fontSize: '0.94rem',
                              color: 'var(--text-muted)',
                              maxWidth: '580px',
                              lineHeight: '1.65',
                              marginBottom: '2rem',
                            }}
                          >
                            Architect complete multi-chapter enterprise curricula with synchronized slides, masterclass video player, neural TTS voice narration, and real-time assessments.
                          </p>

                          {/* Grouped Action Starter Cards Grid */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                              gap: '0.85rem',
                              width: '100%',
                              maxWidth: '820px',
                              textAlign: 'left',
                            }}
                          >
                            {[
                              {
                                title: 'Full Stack Modern Web Dev',
                                desc: 'Next.js 15, TypeScript, TailwindCSS & Cloud Architecture',
                                prompt: 'Full Stack Web Development with Next.js 15 & Tailwind',
                                icon: Code2,
                                color: '#38bdf8',
                                tag: 'Technology',
                              },
                              {
                                title: 'Enterprise AI & LLM Systems',
                                desc: 'Prompt engineering, fine-tuning & agentic workflows',
                                prompt: 'Enterprise Artificial Intelligence & LLM Prompt Engineering',
                                icon: Cpu,
                                color: '#a855f7',
                                tag: 'AI & Data',
                              },
                              {
                                title: 'Strategic Financial Portfolio',
                                desc: 'Global equity markets, risk management & algorithmic models',
                                prompt: 'Global Financial Markets & Strategic Investment Portfolio',
                                icon: TrendingUp,
                                color: '#10b981',
                                tag: 'Finance',
                              },
                              {
                                title: 'Executive Agile Leadership',
                                desc: 'Strategic organizational agility, high-performance coaching',
                                prompt: 'Executive Leadership & Agile Organizational Management',
                                icon: Briefcase,
                                color: '#f59e0b',
                                tag: 'Leadership',
                              },
                            ].map((card) => {
                              const CardIcon = card.icon;
                              return (
                                <div
                                  key={card.title}
                                  onClick={() => handleSendMessage(card.prompt, [])}
                                  className="interactive-card glass-panel"
                                  style={{
                                    padding: '1rem 1.15rem',
                                    borderRadius: '0.85rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.45rem',
                                    position: 'relative',
                                    overflow: 'hidden',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div
                                      style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '0.55rem',
                                        background: `${card.color}18`,
                                        border: `1px solid ${card.color}40`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: card.color,
                                      }}
                                    >
                                      <CardIcon size={16} />
                                    </div>
                                    <span
                                      style={{
                                        fontSize: '0.64rem',
                                        fontWeight: 700,
                                        padding: '0.1rem 0.45rem',
                                        borderRadius: '9999px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid var(--border-subtle)',
                                        color: 'var(--text-subtle)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.04em',
                                      }}
                                    >
                                      {card.tag}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.15rem' }}>
                                      {card.title}
                                    </h4>
                                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                      {card.desc}
                                    </p>
                                  </div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.3rem',
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                      color: card.color,
                                      marginTop: '0.2rem',
                                    }}
                                  >
                                    <span>Generate Masterclass</span>
                                    <ArrowRight size={11} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CourseErrorBoundary>
          </div>
        </div>
      )}
    </div>

      {/* Question Tree Navigation Drawer */}
      <QuestionTreeDrawer
        isOpen={isQuestionTreeOpen}
        onClose={() => setIsQuestionTreeOpen(false)}
        messages={activeSession?.messages || []}
        activeQuestionId={activeQuestionId}
        onJumpToMessage={handleJumpToMessage}
      />

      {/* Interactive Masterclass Video Player in Chat / Workspace */}
      {activeVideoCourseData && (
        <MasterclassVideoPlayer
          courseTitle={activeVideoCourseData.courseTitle}
          chapterTitle={activeVideoCourseData.chapterTitle}
          chapterNumber={activeVideoCourseData.chapterNumber}
          chapterContent={activeVideoCourseData.chapterContent}
          initialTopicNumber={activeVideoCourseData.topicNumber}
          activeLanguage={globalLanguage}
          activeVoiceProfile={globalVoiceProfile}
          onClose={() => setActiveVideoCourseData(null)}
        />
      )}

      {/* Presentation-Ready Teaching Slides Modal in Chat / Workspace */}
      {activeSlidesData && (
        <TeachingSlidesModal
          courseTitle={activeSlidesData.courseTitle}
          chapterTitle={activeSlidesData.chapterTitle}
          chapterNumber={activeSlidesData.chapterNumber}
          chapterContent={activeSlidesData.chapterContent}
          activeLanguage={globalLanguage}
          activeVoiceProfile={globalVoiceProfile}
          onClose={() => setActiveSlidesData(null)}
          onOpenInVideo={() => {
            const data = activeSlidesData;
            setActiveSlidesData(null);
            setActiveVideoCourseData({
              courseTitle: data.courseTitle,
              chapterTitle: data.chapterTitle,
              chapterNumber: data.chapterNumber,
              chapterContent: data.chapterContent,
              topicNumber: `${data.chapterNumber}.1`,
            });
          }}
        />
      )}

      {/* Global Modal 2: Full ILA AI Hub Activity Tracker & Dashboard Modal */}
      <ActivityTrackerModal
        isOpen={isActivityTrackerOpen}
        onClose={() => setIsActivityTrackerOpen(false)}
        activeProductId={
          (primaryNavView === 'central_dashboard' || activeModule === 'central_dashboard')
            ? 'all'
            : (activeModule === 'ai_tieup_creator' || primaryNavView === 'tieup_creator')
            ? 'ai_tieup_creator'
            : (activeModule as any)
        }
        sessions={sessions}
        onSelectSession={handleSelectSession}
        onSelectProduct={handleSelectModule}
      />

      {/* Global Unified Parameter Modal (Consolidates Parameter List & Input/Voice into a single view) */}
      <AIUnifiedParameterModal
        isOpen={isParameterModalOpen}
        onClose={() => setIsParameterModalOpen(false)}
        activeProductId={activeModule === 'central_dashboard' ? 'course_creator' : (activeModule as AIProductType)}
        initialTab={parameterModalTab}
        onSelectProduct={handleSelectModule}
      />
    </div>
  );
}
