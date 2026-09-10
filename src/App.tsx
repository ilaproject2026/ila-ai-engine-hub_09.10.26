import { useState, useEffect, useMemo } from 'react';
import ChatSidebar from './components/ChatSidebar';
import SearchBox from './components/SearchBox';
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
import FunctionListModal from './components/FunctionListModal';
import ActivityTrackerModal from './components/ActivityTrackerModal';
import CentralDashboardView from './components/CentralDashboardView';
import AIUnifiedParameterModal from './components/AIUnifiedParameterModal';
import { type AIProductType, getAIProductConfig } from './services/aiHubConfig';

export type AppTheme = 'obsidian' | 'sunny-day' | 'sapphire' | 'emerald' | 'amber';

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
    id: 'obsidian',
    name: 'Midnight Cyber',
    badge: 'Dark',
    icon: Moon,
    color: '#818cf8',
    description: 'Deep obsidian dark mode with neon indigo accents',
  },
  {
    id: 'sunny-day',
    name: 'Sunny Day',
    badge: 'Anti-Glare',
    icon: Sun,
    color: '#f59e0b',
    description: 'Anti-reflection high-contrast daylight mode for outdoor sunlight visibility',
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
  // Theme State: Persisted to localStorage and applied to data-theme attribute
  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('ila_app_theme') as AppTheme) || 'obsidian';
  });
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ila_app_theme', theme);
  }, [theme]);

  // Active Hub Module: 'course_creator' is default studio home page!
  const [activeModule, setActiveModule] = useState<HubModuleType>(() => {
    return (localStorage.getItem('ila_active_module') as HubModuleType) || 'course_creator';
  });

  useEffect(() => {
    localStorage.setItem('ila_active_module', activeModule);
  }, [activeModule]);

  // Course Creator Internal Sub-Tab State: 'home' | 'admin_library' | 'slide_ai' | 'video_ai' | 'intelli_coach' | 'one_on_one_online' | 'group_online' | 'camp_online' | 'camp_offline' | 'sports_online' | 'sports_offline'
  const [courseCreatorTab, setCourseCreatorTab] = useState<CourseCreatorTabType>('home');
  const [isPathDropdownOpen, setIsPathDropdownOpen] = useState<boolean>(false);

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
  const [isFunctionListOpen, setIsFunctionListOpen] = useState<boolean>(false);
  const [isActivityTrackerOpen, setIsActivityTrackerOpen] = useState<boolean>(false);
  const [isParameterModalOpen, setIsParameterModalOpen] = useState<boolean>(false);
  const [parameterModalTab, setParameterModalTab] = useState<'list' | 'input'>('list');

  const handleOpenParameters = (tab: 'list' | 'input' = 'list') => {
    setParameterModalTab(tab);
    setIsParameterModalOpen(true);
  };

  // Strictly isolated Course Creator sessions: only show sessions that belong to course_creator (or legacy unassigned)
  const courseCreatorSessions = useMemo(() => {
    return sessions.filter((s) => s.productType === 'course_creator' || !s.productType);
  }, [sessions]);

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
          const isCourse = activeModule === 'course_creator' || activeModule === 'central_dashboard';
          const match = loaded.find((s) =>
            isCourse ? s.productType === 'course_creator' || !s.productType : s.productType === activeModule
          );
          if (match) {
            setActiveSessionId(match.id);
          } else if (loaded.length > 0) {
            setActiveSessionId(loaded[0].id);
          } else {
            const fresh = createNewSessionObject('New Course Workspace', 'course_creator');
            await saveChatSession(fresh);
            setSessions([fresh]);
            setActiveSessionId(fresh.id);
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
    setError(null);
    stopAllSpeech();
    if (courseCreatorTab === 'admin_library') {
      setCourseCreatorTab('home');
    }
    if (window.innerWidth < 768) {
      setIsLeftSidebarOpen(false);
    }
  };

  // Switch Module in AI Hub
  const handleSelectModule = async (mod: HubModuleType) => {
    setActiveModule(mod);
    localStorage.setItem('ila_active_module', mod);
    stopAllSpeech();
    setError(null);

    if (mod === 'central_dashboard') {
      return;
    }

    const isCourse = mod === 'course_creator';
    const existing = sessions.find((s) =>
      isCourse ? s.productType === 'course_creator' || !s.productType : s.productType === mod
    );
    if (existing) {
      setActiveSessionId(existing.id);
    } else {
      const config = isCourse ? null : getAIProductConfig(mod as AIProductType);
      const title = isCourse
        ? 'New Course Workspace'
        : `New ${config?.shortName || mod} Query`;
      const fresh = createNewSessionObject(title, isCourse ? 'course_creator' : (mod as AIProductType));
      await saveChatSession(fresh);
      setSessions((prev) => [fresh, ...prev]);
      setActiveSessionId(fresh.id);
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

  // Delete chat session
  const handleDeleteSession = async (sessionId: string) => {
    stopAllSpeech();
    await deleteChatSession(sessionId);
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
  const executeAutonomousCoursePlan = async (query: string, docs: AttachedDocument[], targetAudience?: string) => {
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

    let smartTitle = extractSmartCourseTitle(cleanQuery, 'Enterprise Masterclass');

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
        await saveLibraryCourse(compiled);

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
  const handleSendMessage = async (query: string, docs: AttachedDocument[], targetAudience?: string) => {
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
      await executeAutonomousCoursePlan(cleanQuery, docs, audience);
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

    // Auto-set title from first prompt if default or long title
    let newTitle = targetSession.title;
    if (
      targetSession.messages.length === 0 ||
      targetSession.title === 'New Course Workspace' ||
      targetSession.title === 'Untitled Course' ||
      targetSession.title.startsWith('Please ') ||
      targetSession.title.startsWith('Can you ') ||
      targetSession.title.length > 55
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
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
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
          boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.5)',
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
                color: '#ffffff',
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

        {/* Right: Engine Selector Dropdown + Consolidated Global Utility Buttons + Theme Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Module Selector Dropdown */}
          <AIHubDropdown
            activeProductId={activeModule}
            onSelectProduct={handleSelectModule}
            variant="navbar"
          />

          {/* 1. Core Utility Button: Function List */}
          <button
            id="global-function-list-btn"
            type="button"
            onClick={() => setIsFunctionListOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.38rem 0.85rem',
              borderRadius: '9999px',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              color: '#a5b4fc',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.6)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(99, 102, 241, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.35)';
              e.currentTarget.style.color = '#a5b4fc';
              e.currentTarget.style.boxShadow = 'none';
            }}
            title="Open Full ILA AI Hub Function List (16 Specialized Engines)"
          >
            <Grid size={13} />
            <span>Function List</span>
          </button>

          {/* 2. Core Utility Button: Activity Tracker */}
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
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              color: '#a5b4fc',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.6)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(99, 102, 241, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.35)';
              e.currentTarget.style.color = '#a5b4fc';
              e.currentTarget.style.boxShadow = 'none';
            }}
            title="Open Activity Tracker & Live Performance Analytics Dashboard"
          >
            <Activity size={13} color="#818cf8" />
            <span>Activity Tracker</span>
          </button>

          {/* 3. Consolidated Unified Parameter Button */}
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
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#7dd3fc',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(56, 189, 248, 0.25)';
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.6)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(56, 189, 248, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
              e.currentTarget.style.color = '#7dd3fc';
              e.currentTarget.style.boxShadow = 'none';
            }}
            title="Open AI Parameters Hub: Review Active Rules & Setup Voice Directives"
          >
            <Sliders size={13} color="#38bdf8" />
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
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
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
                <Palette size={14} color="#fbbf24" />
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
                  className="animate-fade-in"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 0.4rem)',
                    width: '260px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '0.85rem',
                    padding: '0.4rem',
                    boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.5), 0 0 15px var(--accent-glow)',
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
                          background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                          border: isSelected ? '1px solid var(--border-focus)' : '1px solid transparent',
                          color: isSelected ? 'var(--text-main)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              background: isSelected ? t.color : 'rgba(255, 255, 255, 0.06)',
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
        </div>
      </header>

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
        {/* SCENARIO A: CENTRAL DASHBOARD (Default Landing Page) */}
        {activeModule === 'central_dashboard' ? (
          <CentralDashboardView
            sessions={sessions}
            onSelectProduct={(prod) => handleSelectModule(prod)}
            onSelectSession={(sId) => {
              handleSelectSession(sId);
              const matched = sessions.find((s) => s.id === sId);
              if (matched?.productType && matched.productType !== 'course_creator') {
                handleSelectModule(matched.productType);
              } else {
                handleSelectModule('course_creator');
              }
            }}
            onOpenParameterInput={() => handleOpenParameters('input')}
            onOpenParameterList={() => handleOpenParameters('list')}
            onReturnToHome={() => handleSelectModule('course_creator')}
          />
        ) : activeModule === 'course_creator' ? (
          /* SCENARIO B: ISOLATED COURSE CREATOR STUDIO VIEW */
          <div
            id="course-creator-studio-layout"
            style={{
              flex: 1,
              display: 'flex',
              height: '100%',
              width: '100%',
              overflow: 'hidden',
            }}
          >
            {/* Left Chat History Sidebar — only visible in home chatroom view with messages */}
            {courseCreatorTab === 'home' && activeSession && activeSession.messages.length > 0 && (
              <ChatSidebar
                sessions={courseCreatorSessions}
                activeSessionId={activeSessionId}
                onSelectSession={handleSelectSession}
                onNewChat={handleNewChat}
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
                onOpenFunctionList={() => setIsFunctionListOpen(true)}
              />
            )}

            {/* Main Course Creator Body */}
            <div
              id="course-creator-body-container"
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
              {/* COURSE CREATOR ISOLATED SUB-NAVIGATION BAR */}
              <div
                id="course-creator-subnav"
                style={{
                  padding: '0.5rem 1.25rem',
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
                {/* Left: Sidebar Toggle + Active Course Session Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                  {/* Sidebar toggle only makes sense in chatroom workspace view */}
                  {courseCreatorTab === 'home' && activeSession && activeSession.messages.length > 0 && (
                    <button
                      id="sidebar-toggle-btn"
                      type="button"
                      onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '0.6rem',
                        color: isLeftSidebarOpen ? 'var(--accent-primary)' : 'var(--text-main)',
                        cursor: 'pointer',
                        padding: '0.42rem 0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: isLeftSidebarOpen ? '0 0 12px var(--accent-glow)' : 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'var(--border-focus)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      }}
                      title={isLeftSidebarOpen ? 'Collapse Chat History' : 'Expand Chat History'}
                    >
                      <PanelLeft size={16} />
                    </button>
                  )}


                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--accent-primary)',
                        boxShadow: '0 0 8px var(--accent-primary)',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '320px',
                        letterSpacing: '-0.01em',
                      }}
                      title={activeSession?.title || 'Course Creator Studio'}
                    >
                      {activeSession?.title && activeSession.title !== 'New Course Workspace'
                        ? activeSession.title
                        : 'Course Creator Studio'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '0.12rem 0.55rem',
                        borderRadius: '9999px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.35)',
                        color: '#a5b4fc',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Workspace
                    </span>
                  </div>
                </div>

                {/* Right: Fixed Buttons (Chat Home, Admin Library) + Select Path Dropdown */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '9999px',
                    padding: '0.22rem',
                    gap: '0.3rem',
                    position: 'relative',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
                  }}
                >
                  {/* 1. Fixed Button: Chat Home */}
                  <button
                    id="main-nav-chat-home-btn"
                    type="button"
                    onClick={() => {
                      setCourseCreatorTab('home');
                      setIsPathDropdownOpen(false);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.38rem',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '9999px',
                      background:
                        courseCreatorTab === 'home'
                          ? 'var(--accent-gradient)'
                          : 'transparent',
                      border: 'none',
                      color: courseCreatorTab === 'home' ? '#ffffff' : 'var(--text-muted)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow:
                        courseCreatorTab === 'home'
                          ? '0 2px 12px var(--accent-glow)'
                          : 'none',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    onMouseEnter={(e) => {
                      if (courseCreatorTab !== 'home') {
                        e.currentTarget.style.color = 'var(--text-main)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (courseCreatorTab !== 'home') {
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                    title="Chat Home: Course Workspace & Download Page, Authoring Studio, Prompts & Live Course Generation"
                  >
                    <MessageSquare size={13} />
                    <span>Chat Home</span>
                  </button>

                  {/* 2. Fixed Button: Admin Library */}
                  <button
                    id="main-nav-admin-lib-btn"
                    type="button"
                    onClick={() => {
                      setCourseCreatorTab('admin_library');
                      setIsPathDropdownOpen(false);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.38rem',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '9999px',
                      background:
                        courseCreatorTab === 'admin_library'
                          ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                          : 'transparent',
                      border: 'none',
                      color:
                        courseCreatorTab === 'admin_library'
                          ? '#ffffff'
                          : 'var(--text-muted)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow:
                        courseCreatorTab === 'admin_library'
                          ? '0 2px 12px rgba(99, 102, 241, 0.4)'
                          : 'none',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    onMouseEnter={(e) => {
                      if (courseCreatorTab !== 'admin_library') {
                        e.currentTarget.style.color = 'var(--text-main)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (courseCreatorTab !== 'admin_library') {
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                    title="Admin Library: Manage authorized courses, inspect versions, DOCX downloads & course structures"
                  >
                    <ShieldCheck size={13} />
                    <span>Admin Library</span>
                  </button>

                  {/* 3. Dropdown Menu: Select Path */}
                  <div style={{ position: 'relative' }}>
                    <button
                      id="main-nav-path-dropdown-btn"
                      type="button"
                      onClick={() => setIsPathDropdownOpen(!isPathDropdownOpen)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.38rem',
                        padding: '0.35rem 0.9rem',
                        borderRadius: '9999px',
                        background:
                          courseCreatorTab !== 'home' && courseCreatorTab !== 'admin_library'
                            ? 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)'
                            : 'transparent',
                        border: 'none',
                        color:
                          courseCreatorTab !== 'home' && courseCreatorTab !== 'admin_library'
                            ? '#ffffff'
                            : 'var(--text-muted)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow:
                          courseCreatorTab !== 'home' && courseCreatorTab !== 'admin_library'
                            ? '0 2px 12px rgba(56, 189, 248, 0.45)'
                            : 'none',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                      onMouseEnter={(e) => {
                        if (courseCreatorTab === 'home' || courseCreatorTab === 'admin_library') {
                          e.currentTarget.style.color = 'var(--text-main)';
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (courseCreatorTab === 'home' || courseCreatorTab === 'admin_library') {
                          e.currentTarget.style.color = 'var(--text-muted)';
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                      title="Select Learning & Teaching Delivery Path"
                    >
                      <Compass size={13} />
                      <span>
                        {courseCreatorTab === 'slide_ai'
                          ? 'Path: Slide+AI'
                          : courseCreatorTab === 'video_ai'
                          ? 'Path: Video+AI'
                          : courseCreatorTab === 'intelli_coach'
                          ? 'Path: Intelli Coach'
                          : courseCreatorTab === 'one_on_one_online'
                          ? 'Path: 1-on-1 Online'
                          : courseCreatorTab === 'group_online'
                          ? 'Path: Group Online'
                          : courseCreatorTab === 'camp_online'
                          ? 'Path: Camp Online'
                          : courseCreatorTab === 'camp_offline'
                          ? 'Path: Camp Offline'
                          : courseCreatorTab === 'sports_online'
                          ? 'Path: Sports Online'
                          : courseCreatorTab === 'sports_offline'
                          ? 'Path: Sports Offline'
                          : 'Select Path'}
                      </span>
                      <ChevronDown
                        size={12}
                        style={{
                          transform: isPathDropdownOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      />
                    </button>

                    {/* Path Dropdown Menu */}
                    {isPathDropdownOpen && (
                      <>
                        <div
                          style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                          onClick={() => setIsPathDropdownOpen(false)}
                        />
                        <div
                          className="animate-pop-in"
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: 'calc(100% + 0.5rem)',
                            width: '290px',
                            background: 'var(--bg-glass-elevated)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid var(--border-medium)',
                            borderRadius: '0.95rem',
                            padding: '0.5rem',
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: 95,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem',
                          }}
                        >
                          {/* Group 1: Teaching & Studio Tools */}
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
                              setCourseCreatorTab('slide_ai');
                              setIsPathDropdownOpen(false);
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
                              <div style={{ fontWeight: 700 }}>Slide+AI</div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Interactive Slide Decks & TTS Narration</div>
                            </div>
                            {courseCreatorTab === 'slide_ai' && <Check size={13} color="#38bdf8" />}
                          </button>

                          <button
                            id="path-menu-video-ai-btn"
                            type="button"
                            onClick={() => {
                              setCourseCreatorTab('video_ai');
                              setIsPathDropdownOpen(false);
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
                              <div style={{ fontWeight: 700 }}>Video+AI</div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Studio Video Masterclasses & Playback</div>
                            </div>
                            {courseCreatorTab === 'video_ai' && <Check size={13} color="#ec4899" />}
                          </button>

                          <button
                            id="path-menu-intelli-coach-btn"
                            type="button"
                            onClick={() => {
                              setCourseCreatorTab('intelli_coach');
                              setIsPathDropdownOpen(false);
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

                          {/* Group 2: Learning Delivery Formats */}
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
                              setCourseCreatorTab('one_on_one_online');
                              setIsPathDropdownOpen(false);
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
                              setCourseCreatorTab('group_online');
                              setIsPathDropdownOpen(false);
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
                              setCourseCreatorTab('camp_online');
                              setIsPathDropdownOpen(false);
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
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Multi-Day Virtual Intensive Bootcamp</div>
                            </div>
                            {courseCreatorTab === 'camp_online' && <Check size={13} color="#f59e0b" />}
                          </button>

                          <button
                            id="path-menu-camp-offline-btn"
                            type="button"
                            onClick={() => {
                              setCourseCreatorTab('camp_offline');
                              setIsPathDropdownOpen(false);
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
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>On-Campus Physical Activity Stations</div>
                            </div>
                            {courseCreatorTab === 'camp_offline' && <Check size={13} color="#10b981" />}
                          </button>

                          <button
                            id="path-menu-sports-online-btn"
                            type="button"
                            onClick={() => {
                              setCourseCreatorTab('sports_online');
                              setIsPathDropdownOpen(false);
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
                              <div style={{ fontWeight: 700 }}>Sports Class Online</div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Tactical Playbook & Home Conditioning</div>
                            </div>
                            {courseCreatorTab === 'sports_online' && <Check size={13} color="#c084fc" />}
                          </button>

                          <button
                            id="path-menu-sports-offline-btn"
                            type="button"
                            onClick={() => {
                              setCourseCreatorTab('sports_offline');
                              setIsPathDropdownOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.6rem',
                              padding: '0.42rem 0.65rem',
                              borderRadius: '0.55rem',
                              background: courseCreatorTab === 'sports_offline' ? 'rgba(236, 72, 153, 0.15)' : 'transparent',
                              border: courseCreatorTab === 'sports_offline' ? '1px solid rgba(236, 72, 153, 0.4)' : '1px solid transparent',
                              color: courseCreatorTab === 'sports_offline' ? '#f43f5e' : 'var(--text-main)',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                          >
                            <Activity size={14} color="#f43f5e" />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700 }}>Sports Class Offline</div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>On-Field Drills, Circuits & Scorecards</div>
                            </div>
                            {courseCreatorTab === 'sports_offline' && <Check size={13} color="#f43f5e" />}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Sub-Views inside Course Creator wrapped in safe Error Boundary */}
              <CourseErrorBoundary
                key={courseCreatorTab}
                onReset={() => setCourseCreatorTab('home')}
              >
                {courseCreatorTab === 'intelli_coach' ? (
                  <IntelliCoachView
                    key="intelli_coach_standalone_view"
                    onLaunchCourse={(_courseTitle, targetAudience, promptQuery) => {
                      setCourseCreatorTab('home');
                      const targetAudienceValue = targetAudience || 'General Student / Lifelong Learner';
                      localStorage.setItem('ila_learner_category', targetAudienceValue);
                      handleNewChat().then(() => {
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
                      handleNewChat();
                    }}
                  />
                ) : courseCreatorTab === 'video_ai' ? (
                  <VideoAiLibraryView
                    key="video_ai_standalone_view"
                    onOpenCreator={() => {
                      setCourseCreatorTab('home');
                      handleNewChat();
                    }}
                  />
                ) : courseCreatorTab === 'admin_library' ? (
                  <DedicatedLibraryView
                    onOpenInWorkspace={(course: LibraryCourse) => {
                      const matchedSession = sessions.find((s) => s.id === course.sourceSessionId);
                      if (matchedSession) {
                        setActiveSessionId(matchedSession.id);
                      }
                      setCourseCreatorTab('home');
                    }}
                    onBackToChat={() => setCourseCreatorTab('home')}
                    onCreateNewCourse={() => {
                      setCourseCreatorTab('home');
                      handleNewChat();
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
                      handleNewChat().then(() => {
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
                    onOpenAdminLibrary={() => setCourseCreatorTab('admin_library')}
                    onOpenChatHome={() => setCourseCreatorTab('home')}
                  />
                ) : (
                /* Home / Chat Workspace Course Creation view */
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
                        key={activeSessionId || 'default'}
                        onSendMessage={handleSendMessage}
                        loading={loading}
                        attachedDocuments={attachedDocuments}
                        onDocumentsChange={setAttachedDocuments}
                        placeholder="Create enterprise course or ask anything..."
                        onNewChat={handleNewChat}
                        isBulkPlannerActive={isBulkPlannerActive}
                        onToggleBulkPlanner={setIsBulkPlannerActive}
                      />
                    </div>
                  </div>

                  {/* Direct Comprehensive Course Workspace View */}
                  {activeSession && activeSession.messages.length > 0 ? (
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
                        key={activeSession.id}
                        session={activeSession}
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
                            Course Creator Studio
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
        ) : (
          /* SCENARIO C: MODULE INDEPENDENCE (ALL OTHER 15 SPECIALIZED AI TOOLS) */
          <AIHubWorkspaceView
            productType={activeModule as AIProductType}
            onSelectProduct={handleSelectModule}
            onReturnToCourseCreator={() => handleSelectModule('course_creator')}
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
            onOpenFunctionList={() => setIsFunctionListOpen(true)}
            onOpenActivityTracker={() => setIsActivityTrackerOpen(true)}
            onOpenCentralDashboard={() => handleSelectModule('central_dashboard')}
            onOpenParameterInput={() => handleOpenParameters('input')}
            onOpenParameterList={() => handleOpenParameters('list')}
          />
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

      {/* Global Modal 1: Full ILA AI Hub Function List Modal */}
      <FunctionListModal
        isOpen={isFunctionListOpen}
        onClose={() => setIsFunctionListOpen(false)}
        activeProductId={activeModule === 'central_dashboard' ? 'course_creator' : (activeModule as AIProductType)}
        onSelectProduct={(prod) => {
          handleSelectModule(prod);
          setIsFunctionListOpen(false);
        }}
      />

      {/* Global Modal 2: Full ILA AI Hub Activity Tracker & Dashboard Modal */}
      <ActivityTrackerModal
        isOpen={isActivityTrackerOpen}
        onClose={() => setIsActivityTrackerOpen(false)}
        activeProductId={activeModule === 'central_dashboard' ? 'course_creator' : (activeModule as AIProductType)}
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
