import { useState, useEffect, useMemo, useRef, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react';
import {
  Search,
  Handshake,
  Plus,
  Send,
  Loader2,
  ExternalLink,
  Building2,
  MapPin,
  Mail,
  Phone,
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Database,
  Trash2,
  X,
  Mic,
  PanelLeft,
  Globe,
  SendHorizontal,
  Lock,
  ShieldAlert,
  Award,
  Filter,
  MessageSquare,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Briefcase,
  Truck,
  Home,
  Laptop,
  GraduationCap,
  Settings,
  Sliders,
  Percent,
  DollarSign,
  BadgePercent,
  ChevronDown,
  Calendar,
  Clock,
  Video,
  List,
  LayoutGrid,
  RotateCcw,
  AlertCircle,
  UserCheck,
  BookOpen,
  Bookmark,
  FolderPlus,
  Layers,
  Users,
  Key,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import type { ChatSession, ChatMessage, AttachedDocument, TieupLeadItem, OutreachStatusLogItem, OurPartnershipPolicies, TieupSavedList } from '../services/dbService';
import {
  fetchTieupLeads,
  saveTieupLeadsBatch,
  deleteTieupLead,
  clearTieupLeads,
  toggleLeadPartnerStatus,
  fetchTieupPartners,
  fetchOutreachLogs,
  saveOutreachLog,
  deleteOutreachLog,
  clearOutreachLogs,
  saveChatSession,
  fetchTieupPolicies,
  saveTieupPolicies,
  fetchTieupSavedLists,
  saveTieupSavedList,
  deleteTieupSavedList
} from '../services/dbService';
import {
  verifyEmailJsConnection,
  sendEmailJsSingle,
  substituteEmailTokens,
} from '../services/emailService';
import { generateTieupResearchLeads, getIlaModelDisplayName, isValidDirectUrl } from '../services/geminiService';
import { useVoice } from '../hooks/useVoice';
import MarkdownRenderer from './MarkdownRenderer';
import GlobalTieupSettingsModal from './GlobalTieupSettingsModal';

// -------------------------------------------------------------
// MULTI-DROPDOWN CATEGORIES (Preserves All 9 Institutional & Business Domains)
// -------------------------------------------------------------

export interface CategoryOption {
  id: string;
  name: string;
  icon?: any;
  subCategories: Array<{ id: string; name: string }>;
}

export const TIEUP_CATEGORIES: CategoryOption[] = [
  {
    id: 'colleges_universities',
    name: 'Colleges & Universities',
    icon: Building2,
    subCategories: [
      { id: 'private_applied_sciences', name: 'Private Applied Sciences (Fachhochschule)' },
      { id: 'public_research_uni', name: 'Public Research University (TU9 / State Uni)' },
      { id: 'dual_study_uni', name: 'Dual-Study University (Duale Hochschule)' },
      { id: 'business_management_school', name: 'Business & Management School' },
      { id: 'medical_nursing_college', name: 'Medical & Nursing Academy' },
    ],
  },
  {
    id: 'visa_immigration_agencies',
    name: 'Visa & Immigration Agencies',
    icon: Globe,
    subCategories: [
      { id: 'student_visa_specialists', name: 'Student Visa & Blocked Account Specialists' },
      { id: 'work_permit_blue_card', name: 'Work Permit & EU Blue Card Agency' },
      { id: 'skilled_relocation', name: 'Skilled Immigrant Relocation Agency' },
      { id: 'legal_immigration_notary', name: 'Immigration Legal & Notary Partner' },
    ],
  },
  {
    id: 'job_recruiters_staffing',
    name: 'Job Recruiters & Staffing',
    icon: Briefcase,
    subCategories: [
      { id: 'stem_it_staffing', name: 'STEM & Executive Talent Placement' },
      { id: 'banking_finance_headhunters', name: 'Banking, FinTech & Management Recruitment' },
      { id: 'nursing_healthcare_recruiters', name: 'Clinical Healthcare & Nurse Recruitment' },
      { id: 'dual_study_traineeship', name: 'Dual-Study & Industrial Traineeship Networks' },
    ],
  },
  {
    id: 'import_export_suppliers',
    name: 'Import-Export & Wholesale Suppliers',
    icon: Truck,
    subCategories: [
      { id: 'air_cargo_agro_suppliers', name: 'Air Cargo, Cold Chain & Agro-Suppliers' },
      { id: 'agricultural_producers_grain', name: 'Agricultural Producers & Bulk Grain Exporters' },
      { id: 'lab_tech_equipment_dealers', name: 'Lab, Engineering & Simulation Equipment' },
      { id: 'maritime_freight_clearing', name: 'Cross-Border Maritime & Customs Clearing' },
      { id: 'cross_border_trading_hubs', name: 'Cross-Border Logistics & Trading Hubs' },
    ],
  },
  {
    id: 'real_estate_housing',
    name: 'Real Estate & Student Housing',
    icon: Home,
    subCategories: [
      { id: 'student_dorm_operators', name: 'Student Dormitory & Residence Providers' },
      { id: 'furnished_expat_apartments', name: 'Furnished Expat & Student Apartments' },
      { id: 'wg_shared_housing', name: 'Shared Living / WG Operators' },
      { id: 'commercial_campus_spaces', name: 'Campus Commercial & Training Facilities' },
    ],
  },
  {
    id: 'saas_enterprise_tech',
    name: 'SaaS Leads & Enterprise Tech',
    icon: Laptop,
    subCategories: [
      { id: 'hrtech_campus_recruitment', name: 'HRTech & Campus Recruitment Software' },
      { id: 'process_mining_execution', name: 'AI Process Intelligence & Academic Alliance' },
      { id: 'lms_edtech_integrators', name: 'LMS & EdTech Platform Integrators' },
      { id: 'cloud_data_safe_harbor', name: 'Cloud Infrastructure & API Middleware' },
    ],
  },
  {
    id: 'hospitals_healthcare',
    name: 'Hospitals & Healthcare Facilities',
    icon: Building2,
    subCategories: [
      { id: 'university_clinics', name: 'University Hospital (Universitätsklinikum)' },
      { id: 'private_hospital_networks', name: 'Private Hospital Network (Helios / Asklepios)' },
      { id: 'geriatric_senior_care', name: 'Senior Care & Geriatric Centers' },
      { id: 'specialist_nursing_clinics', name: 'Specialist Nursing & Rehab Clinics' },
    ],
  },
  {
    id: 'schools_k12',
    name: 'Schools & Language Academies',
    icon: GraduationCap,
    subCategories: [
      { id: 'gymnasium_secondary', name: 'Gymnasium & Secondary Schools (K-12)' },
      { id: 'vocational_schools', name: 'Vocational School (Berufsschule)' },
      { id: 'language_institutes', name: 'Goethe / Telc Language Exam Centers' },
      { id: 'international_ib_schools', name: 'International Baccalaureate (IB) Schools' },
    ],
  },
  {
    id: 'corporate_enterprises',
    name: 'Corporate & Employer Partners',
    icon: Briefcase,
    subCategories: [
      { id: 'dax40_enterprises', name: 'DAX 40 / MNC Enterprise' },
      { id: 'mittelstand_engineering', name: 'German Mittelstand Engineering Firm' },
      { id: 'it_tech_consulting', name: 'IT & Tech Consulting Partner' },
      { id: 'healthcare_staffing_firms', name: 'Healthcare Staffing & Placement Agency' },
    ],
  },
];

export const TARGET_COUNTRIES = [
  { id: 'germany', name: 'Germany (Deutschland)' },
  { id: 'austria', name: 'Austria (Österreich)' },
  { id: 'switzerland', name: 'Switzerland (Schweiz)' },
  { id: 'uk', name: 'United Kingdom' },
  { id: 'india', name: 'India' },
  { id: 'uae_gulf', name: 'United Arab Emirates & Gulf' },
  { id: 'netherlands', name: 'Netherlands' },
  { id: 'france', name: 'France' },
  { id: 'usa', name: 'United States' },
  { id: 'global', name: 'Global International' },
];

export const TEST_COLLEGES_SANDBOX_DATA: TieupLeadItem[] = [
  {
    id: 'test_college_1_berlin_tech',
    name: 'Test College 1 - Berlin Institute of Applied Technologies (Sandbox)',
    category: 'Colleges & Universities',
    subCategory: 'Private Applied Sciences',
    country: 'Germany',
    region: 'Berlin-Brandenburg',
    locationMain: 'Berlin, Germany',
    locationSub: 'Tiergarten Tech Campus',
    contactPerson: 'Dr. Markus Weber',
    contactTitle: 'Head of International Admissions & Strategic Alliances',
    contactEmail: 'rafiaquafqu@gmail.com',
    contactPhone: '+49 30 5550191',
    antiSpamStatus: 'verified',
    antiSpamNotes: 'Official sandbox institutional liaison. Verified direct deliverability via EmailJS, zero spam flags.',
    termsSummary: '22% Net Tuition Commission. Accelerated 14-day offer turnaround. Direct bi-lateral MoU.',
    websiteUrl: 'https://berlin-tech-sandbox.de',
    directSourcePageUrl: 'https://berlin-tech-sandbox.de/international/partnerships',
    compatibilityScore: 96,
    matchingCriteria: ['STEM Direct Pathways', 'Zero Tuition Public Model', 'A2 German Support'],
    commissionPercent: 22,
    minIeltsScore: 6.0,
    germanLevelRequired: 'A2 German',
    tuitionFeeYearly: '€0 (Public Subsidized / Semester Fee €320)',
    tuitionAmountEur: 0,
    scholarshipAvailable: true,
    scholarshipDetails: 'Merit-based €1,500 semester living grant available for qualified international applicants.',
    studentRequirements: 'High school diploma / bachelor equivalent, IELTS 6.0, A2 Goethe/Telc certificate, APS clearance.',
    institutionCriteria: 'State-recognized university of applied sciences with direct industry internships and 94% graduate placement.',
    termsOfPartnership: 'Standard Bilateral MoU; 22% commission paid on semester census date; quarterly settlement via SEPA wire.',
    courseList: ['B.Sc. Applied Artificial Intelligence', 'M.Sc. Cloud Architecture', 'B.Eng. Renewable Energy Systems'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'test_college_2_munich_health',
    name: 'Test College 2 - Munich Academy of Health Sciences & Nursing (Sandbox)',
    category: 'Vocational & Apprenticeship Hubs',
    subCategory: 'Healthcare & Nursing Apprenticeships',
    country: 'Germany',
    region: 'Bavaria',
    locationMain: 'Munich, Germany',
    locationSub: 'Schwabing Medical Center',
    contactPerson: 'Prof. Dr. Elena Schneider',
    contactTitle: 'Director of International Nursing Partnerships',
    contactEmail: 'ilaproject075@gmail.com',
    contactPhone: '+49 89 4440282',
    antiSpamStatus: 'verified',
    antiSpamNotes: 'Verified clinical partnership office. Fast-track visa sponsorship accredited under German Skilled Workers Act.',
    termsSummary: '25% Placement Commission (€3,500 flat). 100% Free Tuition + €1,250/mo apprentice salary.',
    websiteUrl: 'https://munich-health-sandbox.edu',
    directSourcePageUrl: 'https://munich-health-sandbox.edu/ausbildung/cooperation',
    compatibilityScore: 94,
    matchingCriteria: ['Healthcare Dual Track', '100% Funded Training', 'Guaranteed Employment'],
    commissionPercent: 25,
    minIeltsScore: 5.5,
    germanLevelRequired: 'B1 German',
    tuitionFeeYearly: '€0 (Fully Sponsored Dual Degree + €1,250/mo Stipend)',
    tuitionAmountEur: 0,
    scholarshipAvailable: true,
    scholarshipDetails: '100% corporate healthcare sponsorship + free dormitory housing for 1st year apprentices.',
    studentRequirements: '12th grade with biology/science, certified B1 German, clean police clearance, health fitness certificate.',
    institutionCriteria: 'Accredited state hospital teaching group with guaranteed hospital permanent employment upon completion.',
    termsOfPartnership: 'Dual Ausbildung MoU; €3,500 / 25% recruiter fee payable 30 days post-visa arrival and work contract registration.',
    courseList: ['General Nursing Practitioner (Pflegefachmann)', 'Physiotherapy Specialist Track', 'Surgical Tech Assistant'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'test_college_3_frankfurt_business',
    name: 'Test College 3 - Frankfurt International Business & Fintech College (Sandbox)',
    category: 'Colleges & Universities',
    subCategory: 'Private Business Schools',
    country: 'Germany',
    region: 'Hesse',
    locationMain: 'Frankfurt am Main, Germany',
    locationSub: 'Financial District Tower Campus',
    contactPerson: 'Julian Vance, MBA',
    contactTitle: 'Dean of Global Academic Recruitment & Corporate Outreach',
    contactEmail: 'classicraffi@gmail.com',
    contactPhone: '+49 69 7770313',
    antiSpamStatus: 'verified',
    antiSpamNotes: 'Corporate fintech partner network. 100% English-taught degree pathways with European credit transfer.',
    termsSummary: '20% Tuition Commission (€2,400 per student). Direct credit transfer & accelerated 1-year Master degrees.',
    websiteUrl: 'https://frankfurt-business-sandbox.com',
    directSourcePageUrl: 'https://frankfurt-business-sandbox.com/global-agents',
    compatibilityScore: 91,
    matchingCriteria: ['Fintech & Investment Banking', 'English-Medium Instruction', 'Fast Turnaround'],
    commissionPercent: 20,
    minIeltsScore: 6.5,
    germanLevelRequired: 'None (100% English)',
    tuitionFeeYearly: '€6,500 / year',
    tuitionAmountEur: 6500,
    scholarshipAvailable: true,
    scholarshipDetails: 'Early-bird 20% tuition fee reduction for partner agency student submissions completed 60 days before intake.',
    studentRequirements: 'Bachelor degree in business/tech, IELTS 6.5 or equivalent, updated resume & statement of purpose.',
    institutionCriteria: 'FIBAA-accredited private business school with European credit transfers (ECTS) and career fair placement.',
    termsOfPartnership: 'Official Agency Representation Agreement, 20% commission on net received tuition per term, Net 30 payment.',
    courseList: ['International MBA in Fintech', 'M.Sc. Digital Banking & Compliance', 'B.A. Global Supply Chain & Logistics'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'test_college_4_hamburg_engineering',
    name: 'Test College 4 - Hamburg Global Institute of Engineering & Robotics (Sandbox)',
    category: 'Colleges & Universities',
    subCategory: 'Private Applied Sciences',
    country: 'Germany',
    region: 'Hamburg',
    locationMain: 'Hamburg, Germany',
    locationSub: 'HafenCity Innovation Campus',
    contactPerson: 'Dr. Alexander Hartmann',
    contactTitle: 'Vice President of International Academic Relations',
    contactEmail: 'ilaproject2026@gmail.com',
    contactPhone: '+49 40 8880414',
    antiSpamStatus: 'verified',
    antiSpamNotes: 'Verified direct institutional liaison. Zero spam flags, SPF/DKIM confirmed deliverable.',
    termsSummary: '24% Tuition Commission. Accelerated 10-day admission decisions with direct bilateral student visa support.',
    websiteUrl: 'https://hamburg-robotics-sandbox.edu',
    directSourcePageUrl: 'https://hamburg-robotics-sandbox.edu/international/agents',
    compatibilityScore: 95,
    matchingCriteria: ['Industry 4.0 & Mechatronics', 'Dual Degree Articulation', '24% High-Margin Commission'],
    commissionPercent: 24,
    minIeltsScore: 6.0,
    germanLevelRequired: 'B1 German / English',
    tuitionFeeYearly: '€4,800 / year',
    tuitionAmountEur: 4800,
    scholarshipAvailable: true,
    scholarshipDetails: 'Excellence STEM Scholarship: €2,000 tuition grant for candidates with GPA >= 3.0.',
    studentRequirements: 'Bachelor degree in Engineering or Computer Science, IELTS 6.0, Statement of Motivation.',
    institutionCriteria: 'FIBAA & ASIIN accredited university of applied technologies with direct industrial co-ops.',
    termsOfPartnership: 'Standard Bilateral University MoU; 24% net tuition fee commission payable within 30 days of intake confirmation.',
    courseList: ['M.Sc. Autonomous Robotics & IoT', 'B.Sc. Smart Manufacturing Engineering', 'M.Sc. Cyber-Physical Systems'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'test_college_5_munich_innovation',
    name: 'Test College 5 - Munich International Innovation & AI Campus (Sandbox)',
    category: 'Colleges & Universities',
    subCategory: 'Private Applied Sciences',
    country: 'Germany',
    region: 'Bavaria',
    locationMain: 'Munich, Germany',
    locationSub: 'Garching Science Park',
    contactPerson: 'Prof. Dr. Christian Meyer',
    contactTitle: 'Dean of Global Academic Alliances',
    contactEmail: 'rafiaquafqu@gmail.com',
    contactPhone: '+49 89 2890100',
    antiSpamStatus: 'verified',
    antiSpamNotes: 'Verified academic liaison mailbox. Zero spam flags, SPF/DKIM validated.',
    termsSummary: '23% Net Tuition Commission. Guaranteed fast-track 7-day conditional offer turnaround.',
    websiteUrl: 'https://munich-innovation-sandbox.edu',
    directSourcePageUrl: 'https://munich-innovation-sandbox.edu/international/partnerships',
    compatibilityScore: 97,
    matchingCriteria: ['Generative AI & Data Systems', 'Direct Visa Articulation', '23% Agency Commission'],
    commissionPercent: 23,
    minIeltsScore: 6.5,
    germanLevelRequired: 'None (100% English)',
    tuitionFeeYearly: '€5,200 / year',
    tuitionAmountEur: 5200,
    scholarshipAvailable: true,
    scholarshipDetails: 'Global Merit Scholarship: €1,800 tuition reduction for partner agency student enrollments.',
    studentRequirements: 'Bachelor degree in computer science, STEM, or quantitative business, IELTS 6.5, SOP.',
    institutionCriteria: 'State-recognized private university of applied sciences with direct industry internships and 95% placement rate.',
    termsOfPartnership: 'Official Bilateral MoU; 23% commission paid on semester census date; quarterly settlement via SEPA.',
    courseList: ['M.Sc. Artificial Intelligence & Machine Learning', 'B.Sc. Data Science & Analytics', 'M.Sc. Cyber Security Operations'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export type MainNavigationTab = 'chat_home' | 'resources' | 'process' | 'partners';

interface TieupResearchEngineViewProps {
  activeSession: ChatSession | null;
  sessions: ChatSession[];
  onSelectSession: (sessionId: string) => void;
  onNewSession: (productType?: any, params?: any) => void;
  onDeleteSession: (sessionId: string) => void;
  onSendMessage?: (message: string, attachedDocs: AttachedDocument[], params: Record<string, string>) => void;
  loading?: boolean;
  activeMainTab?: MainNavigationTab;
  onSelectTab?: (tab: MainNavigationTab) => void;
  isPolicyModalOpen?: boolean;
  onOpenPolicyModal?: () => void;
  onClosePolicyModal?: () => void;
  onUpdateCounts?: (counts: { resources: number; process: number; partners: number }) => void;
  onUpdateSession?: (session: ChatSession) => void;
}

export default function TieupResearchEngineView({
  activeSession,
  sessions,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  activeMainTab: externalActiveTab,
  onSelectTab,
  isPolicyModalOpen: externalPolicyModalOpen,
  onOpenPolicyModal,
  onClosePolicyModal,
  onUpdateCounts,
  onUpdateSession,
}: TieupResearchEngineViewProps) {
  // 1. Session Isolation: Filter sessions specific to ai_tieup_creator
  const tieupSessions = useMemo(() => {
    return sessions.filter((s) => s.productType === 'ai_tieup_creator');
  }, [sessions]);

  const currentSession =
    activeSession && activeSession.productType === 'ai_tieup_creator'
      ? activeSession
      : tieupSessions.length > 0
      ? tieupSessions[0]
      : null;

  // 2. Main Navigation Flow State (Chat Home -> Resources -> Process -> Partners)
  const [internalActiveTab, setInternalActiveTab] = useState<MainNavigationTab>(() => {
    return (localStorage.getItem('ila_tieup_active_tab') as MainNavigationTab) || 'chat_home';
  });

  const activeMainTab = externalActiveTab || internalActiveTab;

  const setActiveMainTab = (tab: MainNavigationTab) => {
    setInternalActiveTab(tab);
    onSelectTab?.(tab);
    try {
      localStorage.setItem('ila_tieup_active_tab', tab);
    } catch {
      // ignore
    }
  };

  // Ensure an isolated tie-up session thread exists on mount if none present
  useEffect(() => {
    if (tieupSessions.length === 0 && !currentSession) {
      onNewSession('ai_tieup_creator');
    }
  }, [tieupSessions.length, currentSession, onNewSession]);

  // 3. Multi-Dropdown State (Category, Sub-Category, Target Country)
  const [selectedCategory, setSelectedCategory] = useState<string>('colleges_universities');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('private_applied_sciences');
  const [selectedCountry, setSelectedCountry] = useState<string>('germany');

  // Dynamically update available subcategories when category changes
  const activeCategoryConfig = useMemo(() => {
    return TIEUP_CATEGORIES.find((c) => c.id === selectedCategory) || TIEUP_CATEGORIES[0];
  }, [selectedCategory]);

  useEffect(() => {
    if (activeCategoryConfig.subCategories.length > 0) {
      const exists = activeCategoryConfig.subCategories.some((s) => s.id === selectedSubCategory);
      if (!exists) {
        setSelectedSubCategory(activeCategoryConfig.subCategories[0].id);
      }
    }
  }, [selectedCategory, activeCategoryConfig, selectedSubCategory]);

  // 4. Chat & Input state
  const [query, setQuery] = useState<string>('');
  const [attachedDocs, setAttachedDocs] = useState<AttachedDocument[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [sessionSearchQuery, setSessionSearchQuery] = useState<string>('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Voice dictation
  const { isListening, toggleListening } = useVoice();

  // 5. Isolated Session Leads vs All Resources Leads
  // sessionLeads: strictly tied to the active session thread in Chat Home
  const [sessionLeads, setSessionLeads] = useState<TieupLeadItem[]>([]);
  // allResourcesLeads: comprehensive raw repository holding all leads for Resources / Process / Partners
  const [allResourcesLeads, setAllResourcesLeads] = useState<TieupLeadItem[]>([]);

  // Filter States for Resources Tab
  const [tableSearchFilter, setTableSearchFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'flagged_generic' | 'bounced'>('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>('all');
  const [compatibilityFilter, setCompatibilityFilter] = useState<'all' | '90' | '80'>('all');

  // Core Academic & Admission Criteria Filters (Applicable across Home, Resources, and Process Phase 1)
  const [ieltsFilter, setIeltsFilter] = useState<'all' | '5.5' | '6.0' | '6.5' | '7.0'>('all');
  const [germanLevelFilter, setGermanLevelFilter] = useState<'all' | 'none' | 'a1_a2' | 'b1_b2' | 'c1'>('all');
  const [tuitionFilter, setTuitionFilter] = useState<'all' | 'free' | 'low' | 'private'>('all');
  const [scholarshipFilter, setScholarshipFilter] = useState<'all' | 'available'>('all');
  const [minCommissionFilter, setMinCommissionFilter] = useState<'all' | '15' | '20'>('all');

  // Floating toolbar unified filter dropdown open/close state
  const [isToolbarFilterOpen, setIsToolbarFilterOpen] = useState<boolean>(false);
  const toolbarFilterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (toolbarFilterRef.current && !toolbarFilterRef.current.contains(e.target as Node)) {
        setIsToolbarFilterOpen(false);
      }
    };
    if (isToolbarFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isToolbarFilterOpen]);

  // Resources Master Repository: Consolidated "Sort By & Filter" Popover State
  const [isResourcesSortFilterOpen, setIsResourcesSortFilterOpen] = useState<boolean>(false);
  const resourcesSortFilterRef = useRef<HTMLDivElement>(null);
  const [resourcesNotice, setResourcesNotice] = useState<{ text: string; type: 'info' | 'warning' | 'success' } | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (resourcesSortFilterRef.current && !resourcesSortFilterRef.current.contains(e.target as Node)) {
        setIsResourcesSortFilterOpen(false);
      }
    };
    if (isResourcesSortFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isResourcesSortFilterOpen]);

  // Process Pipeline: Consolidated "Sort By & Filter" Popover State
  const [isProcessSortFilterOpen, setIsProcessSortFilterOpen] = useState<boolean>(false);
  const processSortFilterRef = useRef<HTMLDivElement>(null);
  const [processNotice, setProcessNotice] = useState<{ text: string; type: 'info' | 'warning' | 'success' } | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (processSortFilterRef.current && !processSortFilterRef.current.contains(e.target as Node)) {
        setIsProcessSortFilterOpen(false);
      }
    };
    if (isProcessSortFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isProcessSortFilterOpen]);

  // Responsive Full Screen Workspace Mode
  const [isTieupFullScreen, setIsTieupFullScreen] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && isTieupFullScreen) {
        setIsTieupFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTieupFullScreen]);

  const toggleTieupFullScreen = () => {
    setIsTieupFullScreen((prev) => !prev);
  };

  const renderFullScreenButton = (buttonId: string, customStyle?: React.CSSProperties) => (
    <button
      id={buttonId}
      type="button"
      onClick={toggleTieupFullScreen}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.38rem 0.85rem',
        borderRadius: '0.5rem',
        background: isTieupFullScreen ? 'rgba(99, 102, 241, 0.22)' : 'var(--bg-secondary)',
        border: isTieupFullScreen ? '1px solid var(--accent-primary)' : '1px solid var(--border-medium)',
        color: isTieupFullScreen ? 'var(--accent-primary)' : 'var(--text-main)',
        fontSize: '0.82rem',
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: isTieupFullScreen ? '0 0 10px rgba(99, 102, 241, 0.25)' : 'none',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
        ...customStyle,
      }}
      title={isTieupFullScreen ? 'Exit Full Screen (Esc)' : 'Enter Full Screen Workspace'}
    >
      {isTieupFullScreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
      <span>{isTieupFullScreen ? 'Exit Full Screen' : 'Full Screen'}</span>
    </button>
  );

  // Pipeline Reset & Data Purge Handler
  const [isResettingPipeline, setIsResettingPipeline] = useState<boolean>(false);

  const handleResetDatabasePipeline = async () => {
    if (!window.confirm('Are you sure you want to reset the entire Tie-Up pipeline? This will clear all records from Chat Home, Resources, Process, and Partners, restoring a clean slate.')) {
      return;
    }
    setIsResettingPipeline(true);
    try {
      await clearTieupLeads();
      await clearOutreachLogs();
      try {
        localStorage.removeItem('ila_tieup_in_process_leads');
        localStorage.removeItem('ila_tieup_resource_groups');
        localStorage.removeItem('ila_tieup_process_leads');
      } catch {}

      setSessionLeads([]);
      setAllResourcesLeads([]);
      setProcessLeads([]);
      setOutreachLogs([]);
      setSelectedLeadIds(new Set());
      setPhase1SelectedLeadIds(new Set());
      setInProcessLeadMap({});
      setResourceGroups([]);

      if (currentSession) {
        const updatedSession = { ...currentSession, tieupLeads: [], updatedAt: Date.now() };
        await saveChatSession(updatedSession);
        onUpdateSession?.(updatedSession);
      }

      setSandboxNotice('✓ DATABASE RESET COMPLETE: All legacy pipeline records cleared across Chat Home, Resources, Process, and Partners.');
      setTimeout(() => setSandboxNotice(null), 7000);
    } catch (err) {
      console.error('Failed to reset database pipeline:', err);
      alert('Failed to reset database pipeline.');
    } finally {
      setIsResettingPipeline(false);
    }
  };

  // Dynamically populated sub-categories based on selected Category
  const availableSubCategories = useMemo(() => {
    if (categoryFilter !== 'all') {
      const matched = TIEUP_CATEGORIES.find(
        (c) => c.name.toLowerCase() === categoryFilter.toLowerCase() || c.id === categoryFilter
      );
      if (matched && matched.subCategories) {
        return matched.subCategories;
      }
    }
    const allSubs: Array<{ id: string; name: string }> = [];
    const seen = new Set<string>();
    TIEUP_CATEGORIES.forEach((cat) => {
      cat.subCategories.forEach((sc) => {
        if (!seen.has(sc.name)) {
          seen.add(sc.name);
          allSubs.push(sc);
        }
      });
    });
    return allSubs;
  }, [categoryFilter]);

  // -------------------------------------------------------------
  // RESOURCE GROUPS & IN-PROCESS TRACKING
  // -------------------------------------------------------------
  const [resourceGroups, setResourceGroups] = useState<Array<{ id: string; name: string; description?: string; leadIds: string[]; createdAt: number }>>(() => {
    try {
      const raw = localStorage.getItem('ila_tieup_resource_groups');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupDescription, setNewGroupDescription] = useState<string>('');
  const [isGroupListOpen, setIsGroupListOpen] = useState<boolean>(false);
  const groupListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (groupListRef.current && !groupListRef.current.contains(e.target as Node)) {
        setIsGroupListOpen(false);
      }
    };
    if (isGroupListOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isGroupListOpen]);

  // Real-time in-process metadata tracking (stage, groupName, timestamp)
  const [inProcessLeadMap, setInProcessLeadMap] = useState<Record<string, { leadId: string; stage: string; groupName?: string; movedAt: number }>>(() => {
    try {
      const raw = localStorage.getItem('ila_tieup_in_process_leads');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Dedicated Process Page Leads (populated strictly through explicit "Move to Process")
  const [processLeads, setProcessLeads] = useState<TieupLeadItem[]>(() => {
    try {
      const raw = localStorage.getItem('ila_tieup_process_leads');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Action to securely migrate selected items or custom groups from Resources into Process Phase 1 Workflow
  const handleMoveToProcess = (customLeadIds?: string[], groupName?: string) => {
    const ids = customLeadIds || Array.from(selectedLeadIds);
    if (ids.length === 0) {
      setResourcesNotice({
        text: 'Please select one or more institutions using the checkboxes before moving to Process.',
        type: 'warning',
      });
      setTimeout(() => setResourcesNotice(null), 4000);
      return;
    }

    const count = ids.length;

    // Retrieve full lead items from Resources (or session leads as fallback)
    const resourceCandidates = allResourcesLeads.filter((l) => ids.includes(l.id));
    const sessionCandidates = sessionLeads.filter((l) => ids.includes(l.id) && !resourceCandidates.some((c) => c.id === l.id));
    const leadsToProcess = [...resourceCandidates, ...sessionCandidates];

    // Populate Process Page Leads independently
    setProcessLeads((prev) => {
      const existingIds = new Set(prev.map((l) => l.id));
      const fresh = leadsToProcess.filter((l) => !existingIds.has(l.id));
      const updated = [...prev, ...fresh];
      try {
        localStorage.setItem('ila_tieup_process_leads', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Record in-process real-time metadata
    setInProcessLeadMap((prev) => {
      const nextMap = { ...prev };
      ids.forEach((id) => {
        nextMap[id] = {
          leadId: id,
          stage: 'Phase 1 Outreach',
          groupName: groupName || nextMap[id]?.groupName || undefined,
          movedAt: Date.now(),
        };
      });
      try {
        localStorage.setItem('ila_tieup_in_process_leads', JSON.stringify(nextMap));
      } catch {}
      return nextMap;
    });

    // Package selected leads into Phase 1 Outreach pipeline
    setPhase1SelectedLeadIds((prev) => {
      const merged = new Set(prev);
      ids.forEach((id) => merged.add(id));
      return merged;
    });

    setBulkSendNotice(
      groupName
        ? `Successfully packaged group "${groupName}" (${count} leads) into Process Workflow (Phase 1 Outreach).`
        : `Successfully packaged & migrated ${count} institution lead(s) into Process Workflow (Phase 1 Outreach).`
    );
    setTimeout(() => setBulkSendNotice(null), 5000);

    // Navigate directly to Process tab & Phase 1 Outreach view
    setActiveMainTab('process');
    setActiveProcessPhase('phase1_outreach');
  };

  // Group Creation Handler
  const handleCreateGroup = () => {
    if (!newGroupName.trim() || selectedLeadIds.size === 0) return;
    const newGroup = {
      id: `group_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newGroupName.trim(),
      description: newGroupDescription.trim() || undefined,
      leadIds: Array.from(selectedLeadIds),
      createdAt: Date.now(),
    };

    const updated = [newGroup, ...resourceGroups];
    setResourceGroups(updated);
    try {
      localStorage.setItem('ila_tieup_resource_groups', JSON.stringify(updated));
    } catch {}

    setNewGroupName('');
    setNewGroupDescription('');
    setIsCreateGroupModalOpen(false);

    setResourcesNotice({
      text: `✓ Successfully created group "${newGroup.name}" with ${newGroup.leadIds.length} lead(s).`,
      type: 'success',
    });
    setTimeout(() => setResourcesNotice(null), 4000);
  };

  const handleDeleteGroup = (groupId: string) => {
    const updated = resourceGroups.filter((g) => g.id !== groupId);
    setResourceGroups(updated);
    try {
      localStorage.setItem('ila_tieup_resource_groups', JSON.stringify(updated));
    } catch {}
  };

  const handlePushGroupToProcess = (group: { id: string; name: string; leadIds: string[] }) => {
    handleMoveToProcess(group.leadIds, group.name);
  };

  // Real-time in-process status badge renderer for Resources table
  const renderLeadProcessStatusBadge = (lead: TieupLeadItem) => {
    if (lead.isPartner) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.12rem 0.45rem',
            borderRadius: '0.35rem',
            background: 'var(--success-bg)',
            border: '1px solid var(--success)',
            color: 'var(--success)',
            fontSize: '0.7rem',
            fontWeight: 800,
            whiteSpace: 'nowrap',
          }}
          title="Finalized Official Educational Partner"
        >
          <Award size={11} />
          <span>Partner</span>
        </span>
      );
    }

    const matchingLog = outreachLogs.find(
      (l) => l.leadId === lead.id || l.institutionName?.toLowerCase() === lead.name.toLowerCase()
    );

    if (matchingLog) {
      if (matchingLog.status === 'replied') {
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.12rem 0.45rem',
              borderRadius: '0.35rem',
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.45)',
              color: '#8b5cf6',
              fontSize: '0.7rem',
              fontWeight: 800,
              whiteSpace: 'nowrap',
            }}
            title="Institution has replied - active negotiations underway"
          >
            <Handshake size={11} />
            <span>In Discussion</span>
          </span>
        );
      }
      if (matchingLog.phase === 'meeting') {
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.12rem 0.45rem',
              borderRadius: '0.35rem',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.45)',
              color: '#3b82f6',
              fontSize: '0.7rem',
              fontWeight: 800,
              whiteSpace: 'nowrap',
            }}
            title="Meeting or discovery interview scheduled"
          >
            <Calendar size={11} />
            <span>Meeting Set</span>
          </span>
        );
      }
      if (matchingLog.phase === 'followup') {
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.12rem 0.45rem',
              borderRadius: '0.35rem',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              color: '#f59e0b',
              fontSize: '0.7rem',
              fontWeight: 800,
              whiteSpace: 'nowrap',
            }}
            title="Outreach dispatched - awaiting follow-up sequence"
          >
            <RotateCcw size={11} />
            <span>In Follow-up</span>
          </span>
        );
      }
      if (matchingLog.status === 'delivered' || matchingLog.phase === 'outreach') {
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.12rem 0.45rem',
              borderRadius: '0.35rem',
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.45)',
              color: '#06b6d4',
              fontSize: '0.7rem',
              fontWeight: 800,
              whiteSpace: 'nowrap',
            }}
            title="Official introductory proposal dispatched"
          >
            <Mail size={11} />
            <span>Outreach Sent</span>
          </span>
        );
      }
    }

    const inProcessMeta = inProcessLeadMap[lead.id];
    const isInProcess = Boolean(inProcessMeta) || phase1SelectedLeadIds.has(lead.id);

    if (isInProcess) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.12rem 0.45rem',
            borderRadius: '0.35rem',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.45)',
            color: 'var(--accent-primary)',
            fontSize: '0.7rem',
            fontWeight: 800,
            whiteSpace: 'nowrap',
          }}
          title={`Pushed to Process Stage${inProcessMeta?.groupName ? ` (Group: ${inProcessMeta.groupName})` : ''}`}
        >
          <SendHorizontal size={11} />
          <span>In Process{inProcessMeta?.groupName ? ` • ${inProcessMeta.groupName}` : ''}</span>
        </span>
      );
    }

    return null;
  };

  // Batch Push Processed & Communicated Leads to Final Partnership Database
  const handleBatchPushToPartnership = async () => {
    const targetIds = phase1SelectedLeadIds.size > 0
      ? Array.from(phase1SelectedLeadIds)
      : Array.from(selectedLeadIds);

    if (targetIds.length === 0) {
      setProcessNotice({
        text: 'Please select one or more processed leads using the checkboxes before pushing to Partnership.',
        type: 'warning',
      });
      setTimeout(() => setProcessNotice(null), 4000);
      return;
    }

    // Filter target leads to only those that have had outreach successfully dispatched/communicated
    const eligibleIds = targetIds.filter((id) => {
      const lead =
        processLeads.find((l) => l.id === id) ||
        allResourcesLeads.find((l) => l.id === id) ||
        sessionLeads.find((l) => l.id === id);
      return outreachLogs.some(
        (log) =>
          (log.leadId === id || log.id === id || (lead && log.recipientEmail === lead.contactEmail)) &&
          (log.status === 'delivered' || log.sentAt != null)
      );
    });

    const uncommunicatedIds = targetIds.filter((id) => !eligibleIds.includes(id));

    if (eligibleIds.length === 0) {
      setProcessNotice({
        text: '⚠ Communication Required: None of the selected leads have had outreach dispatched yet. Please dispatch personalized outreach emails via EmailJS in Process first before converting to Partnership.',
        type: 'warning',
      });
      setTimeout(() => setProcessNotice(null), 6500);
      return;
    }

    // Toggle official partner status in SQLite database and state
    for (const id of eligibleIds) {
      await toggleLeadPartnerStatus(id, true);
    }

    setSessionLeads((prev) =>
      prev.map((l) => (eligibleIds.includes(l.id) ? { ...l, isPartner: true } : l))
    );
    setAllResourcesLeads((prev) =>
      prev.map((l) => (eligibleIds.includes(l.id) ? { ...l, isPartner: true } : l))
    );
    setProcessLeads((prev) => {
      const updated = prev.map((l) => (eligibleIds.includes(l.id) ? { ...l, isPartner: true } : l));
      try {
        localStorage.setItem('ila_tieup_process_leads', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Record formal audit trail in outreach status logs
    for (const id of eligibleIds) {
      const match = outreachLogs.find((l) => l.leadId === id || l.id === id);
      if (match) {
        const updated: OutreachStatusLogItem = { ...match, phase: 'pushed_partner', lastChecked: Date.now() };
        await saveOutreachLog(updated);
        setOutreachLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      } else {
        const lead =
          processLeads.find((l) => l.id === id) ||
          allResourcesLeads.find((l) => l.id === id) ||
          sessionLeads.find((l) => l.id === id);
        if (lead) {
          const auditLog: OutreachStatusLogItem = {
            id: `log_partner_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            leadId: lead.id,
            institutionName: lead.name,
            recipientEmail: lead.contactEmail,
            recipientName: lead.contactPerson,
            senderEmail: senderEmail || 'rafiaquafqu@gmail.com',
            subject: `Official Partnership Executed - ${lead.name}`,
            status: 'delivered',
            phase: 'pushed_partner',
            sentAt: Date.now(),
            lastChecked: Date.now(),
            leadDataSnapshot: lead,
          };
          await saveOutreachLog(auditLog);
          setOutreachLogs((prev) => [auditLog, ...prev]);
        }
      }
    }

    const successMsg = uncommunicatedIds.length > 0
      ? `✓ Officially recorded ${eligibleIds.length} communicated lead(s) into Final Partnership Database! (${uncommunicatedIds.length} lead(s) retained in Process because outreach emails were not dispatched yet).`
      : `✓ Successfully converted ${eligibleIds.length} communicated institution(s) into Final Partnership Database with full audit trail!`;

    setPushSuccessNotice(successMsg);
    setTimeout(() => setPushSuccessNotice(null), 6000);

    // Clear selection
    setPhase1SelectedLeadIds(new Set());
    setSelectedLeadIds(new Set());

    // Switch directly to Partners tab to show finalized database
    setActiveMainTab('partners');
  };

  // Row-Based Result Display vs Card Grid View (Defaults to 'table' for clean side-by-side comparison)
  const [homeViewMode, setHomeViewMode] = useState<'table' | 'grid'>('table');

  // Multi-Stage Process Workflow Sub-Navigation
  type ProcessPhase = 'phase1_outreach' | 'phase2_triggers' | 'phase3_meetings' | 'phase4_push_partners';
  const [activeProcessPhase, setActiveProcessPhase] = useState<ProcessPhase>('phase1_outreach');

  // Phase 1: Initial Outreach State
  const [phase1SelectedLeadIds, setPhase1SelectedLeadIds] = useState<Set<string>>(new Set());
  const [phase1EmailSubject, setPhase1EmailSubject] = useState<string>('Bilateral Partnership MOU & Institutional Articulation - Ila Academy');
  const [phase1EmailBody, setPhase1EmailBody] = useState<string>(
    `Dear {{CONTACT_PERSON}},\n\nOn behalf of Ila Academy, we are pleased to present our bilateral partnership proposal. We have reviewed {{INSTITUTION_NAME}}'s admission standards and curriculum articulation requirements, and we are prepared to establish a dedicated student pipeline with a pre-screened {{COMMISSION_PERCENT}}% institutional revenue-sharing framework.\n\nKey academic alignments:\n- Program Articulation: {{COURSES}}\n- Student Language Compliance: Minimum IELTS and German proficiency certified\n- Bilateral MoU: Non-exclusive, quarterly fee reconciliation, 3-year term\n\nPlease find our preliminary Memorandum of Understanding details at {{MOU_LINK}}.\n\nWarm regards,\nDirector of Academic Partnerships\nIla Academy`
  );
  const [isBulkSending, setIsBulkSending] = useState<boolean>(false);
  const [bulkSendNotice, setBulkSendNotice] = useState<string | null>(null);
  const [manualReviewLog, setManualReviewLog] = useState<OutreachStatusLogItem | null>(null);
  const [manualReviewEmail, setManualReviewEmail] = useState<string>('');

  // Sender Email State (Default to designated test sender rafiaquafqu@gmail.com)
  const [senderEmail, setSenderEmail] = useState<string>(() => {
    return (
      localStorage.getItem('ila_emailjs_sender_email') ||
      (import.meta as any).env?.VITE_EMAILJS_SENDER_EMAIL ||
      localStorage.getItem('ila_gmail_sender_email') ||
      'rafiaquafqu@gmail.com'
    );
  });
  // EmailJS Dispatch Transporter Configuration State
  const [emailjsServiceId, setEmailjsServiceId] = useState<string>(() => {
    return (
      localStorage.getItem('ila_emailjs_service_id') ||
      (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID ||
      ''
    );
  });
  const [emailjsTemplateId, setEmailjsTemplateId] = useState<string>(() => {
    return (
      localStorage.getItem('ila_emailjs_template_id') ||
      (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID ||
      ''
    );
  });
  const [emailjsPublicKey, setEmailjsPublicKey] = useState<string>(() => {
    return (
      localStorage.getItem('ila_emailjs_public_key') ||
      (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY ||
      ''
    );
  });
  const [showPublicKey, setShowPublicKey] = useState<boolean>(false);
  const [showEmailJsGuide, setShowEmailJsGuide] = useState<boolean>(false);
  const [isVerifyingEmailJs, setIsVerifyingEmailJs] = useState<boolean>(false);
  const [emailjsVerifyStatus, setEmailjsVerifyStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Test & Verify EmailJS Connection Handler
  const handleVerifyEmailJs = async () => {
    setIsVerifyingEmailJs(true);
    setEmailjsVerifyStatus(null);
    const cleanService = (emailjsServiceId || '').trim();
    const cleanTemplate = (emailjsTemplateId || '').trim();
    const cleanPublic = (emailjsPublicKey || '').trim();
    const cleanEmail = (senderEmail || '').trim();

    if (cleanService !== emailjsServiceId) setEmailjsServiceId(cleanService);
    if (cleanTemplate !== emailjsTemplateId) setEmailjsTemplateId(cleanTemplate);
    if (cleanPublic !== emailjsPublicKey) setEmailjsPublicKey(cleanPublic);
    if (cleanEmail !== senderEmail) setSenderEmail(cleanEmail);

    try {
      localStorage.setItem('ila_emailjs_service_id', cleanService);
      localStorage.setItem('ila_emailjs_template_id', cleanTemplate);
      localStorage.setItem('ila_emailjs_public_key', cleanPublic);
      localStorage.setItem('ila_emailjs_sender_email', cleanEmail);

      const res = await verifyEmailJsConnection(
        {
          serviceId: cleanService,
          templateId: cleanTemplate,
          publicKey: cleanPublic,
          senderEmail: cleanEmail,
        },
        cleanEmail
      );
      setEmailjsVerifyStatus(res);
    } catch (err: any) {
      setEmailjsVerifyStatus({
        success: false,
        message: err.message || 'Error communicating with EmailJS API service.',
      });
    } finally {
      setIsVerifyingEmailJs(false);
    }
  };

  // AI Auto-Reply Assistant State
  const [aiReplyModalLog, setAiReplyModalLog] = useState<OutreachStatusLogItem | null>(null);
  const [isGeneratingAiReply, setIsGeneratingAiReply] = useState<boolean>(false);
  const [aiDraftedSubject, setAiDraftedSubject] = useState<string>('');
  const [aiDraftedBody, setAiDraftedBody] = useState<string>('');
  const [aiDraftSuccessNotice, setAiDraftSuccessNotice] = useState<string | null>(null);
  const [phase2StatusTab, setPhase2StatusTab] = useState<'all' | 'replied' | 'pending' | 'flagged'>('all');
  const [aiDraftCopied, setAiDraftCopied] = useState<boolean>(false);

  // Phase 2: Status & Auto-Triggers State
  const [isTriggeringFollowups, setIsTriggeringFollowups] = useState<boolean>(false);
  const [autoTriggerNotice, setAutoTriggerNotice] = useState<string | null>(null);

  // Phase 3: Meeting Scheduling State
  const [meetingModalOpen, setMeetingModalOpen] = useState<boolean>(false);
  const [selectedLogForMeeting, setSelectedLogForMeeting] = useState<OutreachStatusLogItem | null>(null);
  const [meetingFormDate, setMeetingFormDate] = useState<string>('2026-09-20');
  const [meetingFormTime, setMeetingFormTime] = useState<string>('14:30');
  const [meetingFormTz, setMeetingFormTz] = useState<string>('CET (Frankfurt)');
  const [meetingFormPlatform, setMeetingFormPlatform] = useState<string>('Google Meet');
  const [meetingFormLink, setMeetingFormLink] = useState<string>('https://meet.google.com/ila-acad-b2b');
  const [meetingFormAgenda, setMeetingFormAgenda] = useState<string>('Finalize 20% tuition commission schedule, quota allocations, and signing of bilateral MoU.');
  const [meetingFormNotes, setMeetingFormNotes] = useState<string>('');

  // Phase 4: Push to Partners State
  const [pushSuccessNotice, setPushSuccessNotice] = useState<string | null>(null);

  // Filter States for Process Tab
  const [outreachCategoryFilter, setOutreachCategoryFilter] = useState<string>('all');
  const [outreachCountryFilter, setOutreachCountryFilter] = useState<string>('all');
  const [outreachStatusFilter, setOutreachStatusFilter] = useState<string>('all');

  // Filter States for Partners Tab
  const [partnerCategoryFilter, setPartnerCategoryFilter] = useState<string>('all');
  const [partnerCountryFilter, setPartnerCountryFilter] = useState<string>('all');
  const [partnerSearchFilter, setPartnerSearchFilter] = useState<string>('');

  // Modals & Notices
  const [selectedLeadForModal, setSelectedLeadForModal] = useState<TieupLeadItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);
  const [antiTheftToast, setAntiTheftToast] = useState<boolean>(false);

  // Search History Enhancements: Relative Timestamps & Delete Confirmation Modal
  const [sessionPendingDelete, setSessionPendingDelete] = useState<{ id: string; title: string } | null>(null);

  // Space Optimization: Suggestions Dropdown Menu beside Search Input
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState<boolean>(false);

  // Direct Saving Toolbar for Results -> Resources Repository
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [saveToResourcesNotice, setSaveToResourcesNotice] = useState<string | null>(null);

  // -------------------------------------------------------------
  // GLOBAL SETTINGS, SAVED LISTS ("SAVE AS"), & SANDBOX STATE
  // -------------------------------------------------------------
  const [isGlobalSettingsModalOpen, setIsGlobalSettingsModalOpen] = useState<boolean>(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState<'saved_lists' | 'cleanup' | 'sandbox'>('saved_lists');
  const [savedLists, setSavedLists] = useState<TieupSavedList[]>([]);
  const [sandboxNotice, setSandboxNotice] = useState<string | null>(null);

  // Load Saved Lists on mount and subscribe to updates
  useEffect(() => {
    const loadLists = async () => {
      const lists = await fetchTieupSavedLists();
      setSavedLists(lists);
    };
    loadLists();

    const handleSavedListsUpdated = (e: any) => {
      if (e.detail) setSavedLists(e.detail);
    };
    window.addEventListener('ila_tieup_saved_lists_updated', handleSavedListsUpdated);
    return () => {
      window.removeEventListener('ila_tieup_saved_lists_updated', handleSavedListsUpdated);
    };
  }, []);

  // Handler: Save Current Selection or Active Records as a Named List ("Save As")
  const handleSaveCurrentAsList = async (name: string, description: string): Promise<boolean> => {
    let targetLeads: TieupLeadItem[] = [];
    if (selectedLeadIds.size > 0) {
      const pool = activeMainTab === 'chat_home' ? sessionLeads : allResourcesLeads;
      targetLeads = pool.filter((l) => selectedLeadIds.has(l.id));
    } else {
      targetLeads = activeMainTab === 'chat_home' ? sessionLeads : allResourcesLeads;
    }

    if (targetLeads.length === 0) return false;

    const newList: TieupSavedList = {
      id: `list_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      description: description.trim() || undefined,
      sourceTab: activeMainTab,
      leadIds: targetLeads.map((l) => l.id),
      leadsSnapshot: targetLeads,
      createdAt: Date.now(),
    };

    const updated = await saveTieupSavedList(newList);
    setSavedLists(updated);
    setSaveToResourcesNotice(`✓ Saved "${newList.name}" (${newList.leadIds.length} leads) to Saved Lists.`);
    setTimeout(() => setSaveToResourcesNotice(null), 3500);
    return true;
  };

  // Handler: Load / Apply Saved List
  const handleLoadSavedList = (list: TieupSavedList) => {
    if (activeMainTab === 'chat_home') {
      const newItems = list.leadsSnapshot.filter((snap) => !sessionLeads.some((sl) => sl.id === snap.id));
      if (newItems.length > 0) {
        setSessionLeads((prev) => [...newItems, ...prev]);
      }
    }

    const missingInMaster = list.leadsSnapshot.filter((snap) => !allResourcesLeads.some((ar) => ar.id === snap.id));
    if (missingInMaster.length > 0) {
      setAllResourcesLeads((prev) => [...missingInMaster, ...prev]);
    }

    setSelectedLeadIds(new Set(list.leadIds));
    setSaveToResourcesNotice(`✓ Loaded saved list "${list.name}" (${list.leadIds.length} records selected).`);
    setTimeout(() => setSaveToResourcesNotice(null), 3500);
  };

  // Handler: Delete Saved List
  const handleDeleteSavedList = async (listId: string) => {
    const updated = await deleteTieupSavedList(listId);
    setSavedLists(updated);
  };

  // -------------------------------------------------------------
  // DECOUPLED PAGE-INDEPENDENT DELETION HANDLERS
  // -------------------------------------------------------------

  // Handler: Delete Lead Record strictly from Chat Home Session
  const handleDeleteChatLead = async (lead: TieupLeadItem) => {
    const remainingSession = sessionLeads.filter((l) => l.id !== lead.id);
    setSessionLeads(remainingSession);
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      next.delete(lead.id);
      return next;
    });

    if (currentSession?.id) {
      const updatedSession: ChatSession = {
        ...currentSession,
        tieupLeads: remainingSession,
        updatedAt: Date.now(),
      };
      await saveChatSession(updatedSession);
      onUpdateSession?.(updatedSession);
    }
    setSaveToResourcesNotice(`✓ Removed "${lead.name}" from current chat session.`);
    setTimeout(() => setSaveToResourcesNotice(null), 3500);
  };

  // Handler: Delete Lead Record strictly from Resources Repository
  const handleDeleteResourceLead = async (lead: TieupLeadItem) => {
    try {
      await deleteTieupLead(lead.id);

      // Remove strictly from allResourcesLeads
      setAllResourcesLeads((prev) => prev.filter((l) => l.id !== lead.id));

      // Remove from active selections
      setSelectedLeadIds((prev) => {
        const next = new Set(prev);
        next.delete(lead.id);
        return next;
      });

      // Remove from resource groups
      setResourceGroups((prev) => {
        const updated = prev.map((g) => ({
          ...g,
          leadIds: g.leadIds.filter((id) => id !== lead.id),
        }));
        try {
          localStorage.setItem('ila_tieup_resource_groups', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      setSaveToResourcesNotice(`✓ Deleted "${lead.name}" permanently from Resources repository.`);
      setTimeout(() => setSaveToResourcesNotice(null), 3500);
    } catch (err) {
      console.error('Failed to delete resource lead:', err);
    }
  };

  // Handler: Delete Lead Record strictly from Process Workflow (Does NOT affect Resources)
  const handleDeleteProcessLead = (leadId: string) => {
    // 1. Remove from Process Page Leads
    setProcessLeads((prev) => {
      const updated = prev.filter((l) => l.id !== leadId);
      try {
        localStorage.setItem('ila_tieup_process_leads', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 2. Remove from in-process metadata map
    setInProcessLeadMap((prev) => {
      const next = { ...prev };
      delete next[leadId];
      try {
        localStorage.setItem('ila_tieup_in_process_leads', JSON.stringify(next));
      } catch {}
      return next;
    });

    // 3. Remove from phase 1 selections
    setPhase1SelectedLeadIds((prev) => {
      const next = new Set(prev);
      next.delete(leadId);
      return next;
    });

    setBulkSendNotice('✓ Removed institution from Process workflow (Resources repository preserved).');
    setTimeout(() => setBulkSendNotice(null), 3500);
  };

  // Handler: Delete Outreach Log strictly from Phase 2 (Does NOT affect Resources or Chat)
  const handleDeleteOutreachLog = async (logId: string) => {
    try {
      await deleteOutreachLog(logId);
      setOutreachLogs((prev) => prev.filter((l) => l.id !== logId));
      setSaveToResourcesNotice('✓ Removed outreach log permanently from database.');
      setTimeout(() => setSaveToResourcesNotice(null), 3500);
    } catch (err) {
      console.error('Failed to delete outreach log:', err);
    }
  };

  // Backward-compatible router for single lead deletion based on active view
  const handleDeleteSingleLead = async (lead: TieupLeadItem) => {
    if (activeMainTab === 'process') {
      handleDeleteProcessLead(lead.id);
    } else if (activeMainTab === 'resources') {
      await handleDeleteResourceLead(lead);
    } else {
      await handleDeleteChatLead(lead);
    }
  };

  // Handler: Tab-Independent Bulk Delete
  const handleBulkDeleteLeads = async (leadIdsToDelete: string[]) => {
    if (leadIdsToDelete.length === 0) return;
    const idSet = new Set(leadIdsToDelete);

    if (activeMainTab === 'process') {
      // Process Tab: Delete strictly from Process workflow
      setProcessLeads((prev) => {
        const remaining = prev.filter((l) => !idSet.has(l.id));
        try {
          localStorage.setItem('ila_tieup_process_leads', JSON.stringify(remaining));
        } catch {}
        return remaining;
      });
      setInProcessLeadMap((prev) => {
        const next = { ...prev };
        leadIdsToDelete.forEach((id) => delete next[id]);
        try {
          localStorage.setItem('ila_tieup_in_process_leads', JSON.stringify(next));
        } catch {}
        return next;
      });
      setPhase1SelectedLeadIds((prev) => {
        const next = new Set(prev);
        leadIdsToDelete.forEach((id) => next.delete(id));
        return next;
      });
      setBulkSendNotice(`✓ Removed ${leadIdsToDelete.length} lead(s) from Process workflow.`);
      setTimeout(() => setBulkSendNotice(null), 3500);
      return;
    }

    if (activeMainTab === 'resources') {
      // Resources Tab: Delete strictly from Resources repository
      for (const id of leadIdsToDelete) {
        await deleteTieupLead(id);
      }
      setAllResourcesLeads((prev) => prev.filter((l) => !idSet.has(l.id)));
      setSelectedLeadIds((prev) => {
        const next = new Set(prev);
        leadIdsToDelete.forEach((id) => next.delete(id));
        return next;
      });
      setResourceGroups((prev) => {
        const updated = prev.map((g) => ({
          ...g,
          leadIds: g.leadIds.filter((id) => !idSet.has(id)),
        }));
        try {
          localStorage.setItem('ila_tieup_resource_groups', JSON.stringify(updated));
        } catch {}
        return updated;
      });
      setSaveToResourcesNotice(`✓ Deleted ${leadIdsToDelete.length} lead(s) from Resources repository.`);
      setTimeout(() => setSaveToResourcesNotice(null), 3500);
      return;
    }

    // Default / Chat Home: Delete strictly from sessionLeads
    setSessionLeads((prev) => prev.filter((l) => !idSet.has(l.id)));
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      leadIdsToDelete.forEach((id) => next.delete(id));
      return next;
    });
    if (currentSession?.id) {
      const remainingSessionLeads = (currentSession.tieupLeads || []).filter((l) => !idSet.has(l.id));
      const updatedSession: ChatSession = {
        ...currentSession,
        tieupLeads: remainingSessionLeads,
        updatedAt: Date.now(),
      };
      await saveChatSession(updatedSession);
      onUpdateSession?.(updatedSession);
    }
    setSaveToResourcesNotice(`✓ Removed ${leadIdsToDelete.length} lead(s) from current chat session.`);
    setTimeout(() => setSaveToResourcesNotice(null), 3500);
  };

  // Handler: Clear Only Active Chat Session Leads
  const handleClearCurrentSessionLeads = async () => {
    if (currentSession?.id) {
      await clearTieupLeads(currentSession.id);
      setSessionLeads([]);
      const updatedSession: ChatSession = {
        ...currentSession,
        tieupLeads: [],
        updatedAt: Date.now(),
      };
      await saveChatSession(updatedSession);
      onUpdateSession?.(updatedSession);
      setSelectedLeadIds(new Set());
      setSaveToResourcesNotice('✓ Cleared active chat thread records.');
      setTimeout(() => setSaveToResourcesNotice(null), 3500);
    }
  };

  // Handler: Inject Clean Sandbox Test Colleges Strictly Isolated in Chat Home (No Auto-Push)
  const handleInjectSandboxTestColleges = async () => {
    const sessionId = currentSession?.id || 'session_sandbox_main';
    const testLeads: TieupLeadItem[] = TEST_COLLEGES_SANDBOX_DATA.map((tc) => ({
      ...tc,
      sessionId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    // Strictly isolate test data in the active Chat Home results view
    setSessionLeads(testLeads);
    setSelectedLeadIds(new Set());

    if (currentSession) {
      const updatedSession: ChatSession = {
        ...currentSession,
        tieupLeads: testLeads,
        updatedAt: Date.now(),
      };
      await saveChatSession(updatedSession);
      onUpdateSession?.(updatedSession);
    }

    setActiveMainTab('chat_home');
    setSandboxNotice(
      '🧪 Test Data Injected (Test 1 to 5): Isolated in Chat Home results view. Select desired institutions using the checkboxes and click "Save to Resources" to manually migrate.'
    );
    setTimeout(() => setSandboxNotice(null), 8000);
  };

  // Reusable Settings Button Component for All 4 Toolbars
  const renderSettingsButton = (variant: 'toolbar' | 'compact' = 'toolbar') => (
    <button
      type="button"
      onClick={() => {
        setSettingsActiveTab('saved_lists');
        setIsGlobalSettingsModalOpen(true);
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: variant === 'compact' ? '0.38rem 0.65rem' : '0.45rem 0.8rem',
        borderRadius: '0.5rem',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-medium)',
        color: 'var(--text-main)',
        fontSize: '0.8rem',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
      title="Global Workspace Settings, Saved Lists & Sandbox Testing"
    >
      <Settings size={14} color="var(--accent-primary)" />
      <span>Settings</span>
      {savedLists.length > 0 && (
        <span
          style={{
            padding: '0.05rem 0.35rem',
            borderRadius: '0.3rem',
            background: 'var(--dropdown-item-selected)',
            color: 'var(--accent-primary)',
            fontSize: '0.68rem',
            fontWeight: 800,
          }}
        >
          {savedLists.length}
        </span>
      )}
    </button>
  );

  // Helper: Format human-readable relative timestamp (e.g., '5 mins ago', '1 day ago')
  const formatRelativeTime = (dateInput?: number | string | Date): string => {
    if (!dateInput) return 'just now';
    const time = typeof dateInput === 'number' ? dateInput : new Date(dateInput).getTime();
    const diffSec = Math.floor((Date.now() - time) / 1000);
    if (isNaN(diffSec) || diffSec < 45) return 'just now';
    if (diffSec < 90) return '1 min ago';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} mins ago`;
    if (diffMin < 120) return '1 hour ago';
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} hours ago`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    return new Date(time).toLocaleDateString();
  };

  // Handler: Direct Save into Categorized Resources Master Repository (Strict Manual Selection Enforced)
  const handleSaveLeadsToResources = async (leadIdsToSave?: string[]) => {
    const ids = leadIdsToSave || Array.from(selectedLeadIds);
    if (ids.length === 0) {
      setSaveToResourcesNotice('ℹ Please select one or more institution leads from the table using checkboxes to save to Resources.');
      setTimeout(() => setSaveToResourcesNotice(null), 4000);
      return;
    }

    const leadsToSave = sessionLeads.filter((l) => ids.includes(l.id));
    if (leadsToSave.length === 0) return;

    try {
      await saveTieupLeadsBatch(leadsToSave);
      setAllResourcesLeads((prev) => [
        ...leadsToSave,
        ...prev.filter((p) => !leadsToSave.some((nl) => nl.id === p.id || nl.name === p.name)),
      ]);
      setSelectedLeadIds(new Set());
      setSaveToResourcesNotice(`✓ Successfully saved ${leadsToSave.length} selected lead${leadsToSave.length > 1 ? 's' : ''} to Resources repository.`);
      setTimeout(() => setSaveToResourcesNotice(null), 4000);
    } catch (err) {
      console.error('Failed to batch save leads to resources:', err);
    }
  };

  // Our Policies Configuration State & Report Display State
  const [internalPolicyModalOpen, setInternalPolicyModalOpen] = useState<boolean>(false);
  const isPolicyModalOpen = externalPolicyModalOpen !== undefined ? externalPolicyModalOpen : internalPolicyModalOpen;
  const setIsPolicyModalOpen = (open: boolean) => {
    setInternalPolicyModalOpen(open);
    if (open) {
      onOpenPolicyModal?.();
    } else {
      onClosePolicyModal?.();
    }
  };
  const [isReportExpanded, setIsReportExpanded] = useState<boolean>(false);
  const [ourPolicies, setOurPolicies] = useState<OurPartnershipPolicies>({
    minCommissionPercent: 15,
    targetCommissionPercent: 20,
    partnershipCriteria: 'State-accredited institution or licensed educational service provider; direct admissions/partnership liaison inbox; transparent student processing; non-exclusive mutual partnership.',
    studentRequirementsGuidelines: 'Minimum IELTS 6.5 / TOEFL 85+ / Duolingo 115; B2 German for bilingual tracks; APS certificate for relevant jurisdictions; minimum German GPA equivalent 2.5.',
    termsExpectations: 'Standard bilateral Memorandum of Understanding (MoU); quarterly commission payment cycles (50% on visa clearance, 50% on semester 1 enrollment); 3-year renewable validity with 90-day review period.',
    preferredPaymentTerms: 'Net 30 days via direct SEPA/SWIFT wire transfer upon official student enrollment census date.',
  });
  const [isSavingPolicies, setIsSavingPolicies] = useState<boolean>(false);
  const [policySaveSuccess, setPolicySaveSuccess] = useState<boolean>(false);

  // Smart Profit-Based Sorting State (Default: Highest Profit Margin / Commission First)
  const [sortBy, setSortBy] = useState<'profit_desc' | 'compatibility_desc' | 'name_asc' | 'date_desc'>('profit_desc');

  // Outreach Logs State
  const [outreachLogs, setOutreachLogs] = useState<OutreachStatusLogItem[]>([]);

  // Initial Load & SQLite Sync: Isolate Session Thread Leads, All Resources Leads, and Our Policies
  useEffect(() => {
    const loadSessionAndResources = async () => {
      try {
        // Load master pool of all gathered leads for Resources, Process, and Partners
        const allDbLeads = await fetchTieupLeads();
        setAllResourcesLeads(allDbLeads || []);

        // Load configured baseline partnership policies
        const policies = await fetchTieupPolicies();
        if (policies) {
          setOurPolicies(policies);
        }

        // Load leads strictly bound to currentSession.id for the active Chat thread
        if (currentSession?.id) {
          const storedSessionLeads = await fetchTieupLeads(currentSession.id);
          if (storedSessionLeads && storedSessionLeads.length > 0) {
            setSessionLeads(storedSessionLeads);
          } else if (currentSession.tieupLeads && currentSession.tieupLeads.length > 0) {
            setSessionLeads(currentSession.tieupLeads);
          } else {
            setSessionLeads([]);
          }
        } else {
          setSessionLeads([]);
        }

        const logs = await fetchOutreachLogs();
        setOutreachLogs(logs || []);
      } catch (err) {
        console.warn('Initial data load notice:', err);
      }
    };

    loadSessionAndResources();
  }, [currentSession?.id]);

  // Save Our Policies
  const handleSavePolicies = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingPolicies(true);
    try {
      const saved = await saveTieupPolicies(ourPolicies);
      setOurPolicies(saved);
      setPolicySaveSuccess(true);
      setTimeout(() => {
        setPolicySaveSuccess(false);
        setIsPolicyModalOpen(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to save policies:', err);
    } finally {
      setIsSavingPolicies(false);
    }
  };

  // Reset Our Policies to Recommended Defaults
  const handleResetPolicyDefaults = () => {
    setOurPolicies({
      minCommissionPercent: 15,
      targetCommissionPercent: 20,
      partnershipCriteria: 'State-accredited institution or licensed educational service provider; direct admissions/partnership liaison inbox; transparent student processing; non-exclusive mutual partnership.',
      studentRequirementsGuidelines: 'Minimum IELTS 6.5 / TOEFL 85+ / Duolingo 115; B2 German for bilingual tracks; APS certificate for relevant jurisdictions; minimum German GPA equivalent 2.5.',
      termsExpectations: 'Standard bilateral Memorandum of Understanding (MoU); quarterly commission payment cycles (50% on visa clearance, 50% on semester 1 enrollment); 3-year renewable validity with 90-day review period.',
      preferredPaymentTerms: 'Net 30 days via direct SEPA/SWIFT wire transfer upon official student enrollment census date.',
    });
  };

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // Start an Independent Fresh Session Thread
  const handleStartNewSearchSession = () => {
    onNewSession('ai_tieup_creator');
    setQuery('');
    setSessionLeads([]);
    setActiveMainTab('chat_home');
  };

  // Execute AI Search Grounding Query (Strictly bound to the active session thread)
  const handleExecuteSearch = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery || isSearching) return;

    if (isListening) {
      toggleListening(() => {});
    }

    setIsSearching(true);
    setQuery('');

    const categoryLabel = activeCategoryConfig.name;
    const subCategoryLabel =
      activeCategoryConfig.subCategories.find((s) => s.id === selectedSubCategory)?.name || selectedSubCategory;
    const countryLabel = TARGET_COUNTRIES.find((c) => c.id === selectedCountry)?.name || selectedCountry;

    // Create user prompt with grounding context
    const fullUserPrompt = `[Category: ${categoryLabel} | Sub-Category: ${subCategoryLabel} | Country: ${countryLabel}]\n${cleanQuery}`;

    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: fullUserPrompt,
      timestamp: Date.now(),
      documents: attachedDocs.length > 0 ? [...attachedDocs] : undefined,
    };

    let session = currentSession;
    if (!session) {
      session = {
        id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: cleanQuery.slice(0, 36) || `Tie-up: ${categoryLabel}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [userMessage],
        productType: 'ai_tieup_creator',
        productParams: {
          category: selectedCategory,
          subCategory: selectedSubCategory,
          country: selectedCountry,
        },
      };
    } else {
      session = {
        ...session,
        title: session.messages.length === 0 ? cleanQuery.slice(0, 36) : session.title,
        messages: [...session.messages, userMessage],
        updatedAt: Date.now(),
      };
    }

    // Save user message immediately
    await saveChatSession(session);

    try {
      // Execute Grounding AI with multi-domain logic, mutual policy analysis, and our policy baseline
      const { textResponse, leads: newLeads } = await generateTieupResearchLeads(
        cleanQuery,
        categoryLabel,
        subCategoryLabel,
        countryLabel,
        session.messages,
        attachedDocs,
        ourPolicies
      );

      const assistantMessage: ChatMessage = {
        id: `msg_asst_${Date.now()}`,
        role: 'assistant',
        content: textResponse,
        timestamp: Date.now(),
        modelDisplayName: getIlaModelDisplayName(),
      };

      // Tag newly researched leads strictly with the current session ID
      const taggedLeads = newLeads.map((l) => ({
        ...l,
        sessionId: session.id,
      }));

      // Update leads bound strictly to this session thread (sorted by profit descending)
      const updatedSessionLeads = [
        ...taggedLeads,
        ...sessionLeads.filter((l) => !taggedLeads.some((nl) => nl.name === l.name)),
      ].sort((a, b) => (b.commissionPercent || 0) - (a.commissionPercent || 0));
      setSessionLeads(updatedSessionLeads);

      // Keep newly researched leads strictly isolated in active session results (No Auto-Push)
      const updatedSession: ChatSession = {
        ...session,
        messages: [...session.messages, assistantMessage],
        tieupLeads: updatedSessionLeads,
        updatedAt: Date.now(),
      };

      await saveChatSession(updatedSession);

      // Trigger auto-save notification
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3500);
    } catch (err: any) {
      console.error('Tie-up search grounding error:', err);
    } finally {
      setIsSearching(false);
      setAttachedDocs([]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecuteSearch();
    }
  };

  // Core Academic & Admission Criteria Evaluator
  const matchesAcademicCriteria = (lead: TieupLeadItem) => {
    // 1. Minimum IELTS Score
    if (ieltsFilter !== 'all') {
      const maxAllowedIelts = parseFloat(ieltsFilter);
      const leadScore = lead.minIeltsScore != null ? lead.minIeltsScore : 6.0;
      if (leadScore > maxAllowedIelts) return false;
    }

    // 2. German Language Proficiency Level
    if (germanLevelFilter !== 'all') {
      const gl = (lead.germanLevelRequired || '').toLowerCase();
      if (germanLevelFilter === 'none') {
        if (!gl.includes('none') && !gl.includes('english') && !gl.includes('0')) return false;
      } else if (germanLevelFilter === 'a1_a2') {
        if (!gl.includes('a1') && !gl.includes('a2')) return false;
      } else if (germanLevelFilter === 'b1_b2') {
        if (!gl.includes('b1') && !gl.includes('b2')) return false;
      } else if (germanLevelFilter === 'c1') {
        if (!gl.includes('c1') && !gl.includes('testdaf')) return false;
      }
    }

    // 3. Tuition Fee & Low-Fee Options
    if (tuitionFilter !== 'all') {
      const amount = lead.tuitionAmountEur != null ? lead.tuitionAmountEur : (lead.tuitionFeeYearly?.includes('0') ? 0 : 5000);
      if (tuitionFilter === 'free' && amount !== 0) return false;
      if (tuitionFilter === 'low' && (amount === 0 || amount >= 5000)) return false;
      if (tuitionFilter === 'private' && amount < 5000) return false;
    }

    // 4. Scholarship & Discount Benefits
    if (scholarshipFilter === 'available' && !lead.scholarshipAvailable) {
      return false;
    }

    // 5. Min Commission / Margin Threshold
    if (minCommissionFilter !== 'all') {
      const minComm = parseFloat(minCommissionFilter);
      if ((lead.commissionPercent || 15) < minComm) return false;
    }

    return true;
  };

  const activeAcademicFilterCount = useMemo(() => {
    let count = 0;
    if (compatibilityFilter !== 'all') count++;
    if (ieltsFilter !== 'all') count++;
    if (germanLevelFilter !== 'all') count++;
    if (tuitionFilter !== 'all') count++;
    if (scholarshipFilter !== 'all') count++;
    if (minCommissionFilter !== 'all') count++;
    return count;
  }, [compatibilityFilter, ieltsFilter, germanLevelFilter, tuitionFilter, scholarshipFilter, minCommissionFilter]);

  const handleClearAcademicFilters = () => {
    setCompatibilityFilter('all');
    setIeltsFilter('all');
    setGermanLevelFilter('all');
    setTuitionFilter('all');
    setScholarshipFilter('all');
    setMinCommissionFilter('all');
  };

  // Filtered Leads in Resources Repository (Master pool across all sessions, sorted by profit margin)
  const filteredResourcesLeads = useMemo(() => {
    const filtered = allResourcesLeads.filter((lead) => {
      if (!matchesAcademicCriteria(lead)) return false;
      if (categoryFilter !== 'all' && !lead.category.toLowerCase().includes(categoryFilter.toLowerCase())) {
        return false;
      }
      if (countryFilter !== 'all' && !lead.country.toLowerCase().includes(countryFilter.toLowerCase())) {
        return false;
      }
      if (statusFilter !== 'all' && lead.antiSpamStatus !== statusFilter) {
        return false;
      }
      if (subCategoryFilter !== 'all') {
        const scTerm = subCategoryFilter.toLowerCase();
        const leadSc = (lead.subCategory || '').toLowerCase();
        if (!leadSc.includes(scTerm)) return false;
      }
      if (compatibilityFilter === '90' && (lead.compatibilityScore || 0) < 90) {
        return false;
      }
      if (compatibilityFilter === '80' && (lead.compatibilityScore || 0) < 80) {
        return false;
      }
      if (!tableSearchFilter.trim()) return true;
      const term = tableSearchFilter.toLowerCase();
      return (
        lead.name.toLowerCase().includes(term) ||
        lead.locationMain.toLowerCase().includes(term) ||
        lead.contactPerson.toLowerCase().includes(term) ||
        lead.contactEmail.toLowerCase().includes(term) ||
        lead.termsSummary.toLowerCase().includes(term) ||
        (lead.studentRequirements && lead.studentRequirements.toLowerCase().includes(term)) ||
        (lead.termsOfPartnership && lead.termsOfPartnership.toLowerCase().includes(term)) ||
        (lead.subCategory && lead.subCategory.toLowerCase().includes(term))
      );
    });

    // Smart Profit Sorting (Highest profit margin / commission at top by default)
    filtered.sort((a, b) => {
      if (sortBy === 'profit_desc') {
        return (b.commissionPercent || 0) - (a.commissionPercent || 0);
      }
      if (sortBy === 'compatibility_desc') {
        return (b.compatibilityScore || 0) - (a.compatibilityScore || 0);
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
    return filtered;
  }, [allResourcesLeads, tableSearchFilter, categoryFilter, countryFilter, statusFilter, subCategoryFilter, compatibilityFilter, sortBy, ieltsFilter, germanLevelFilter, tuitionFilter, scholarshipFilter, minCommissionFilter]);

  // Sorted session leads for Chat Home prospect preview (Highest profit first by default)
  const sortedSessionLeads = useMemo(() => {
    const filtered = sessionLeads.filter(matchesAcademicCriteria);
    return filtered.sort((a, b) => {
      if (sortBy === 'profit_desc') {
        return (b.commissionPercent || 0) - (a.commissionPercent || 0);
      }
      if (sortBy === 'compatibility_desc') {
        return (b.compatibilityScore || 0) - (a.compatibilityScore || 0);
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [sessionLeads, sortBy, ieltsFilter, germanLevelFilter, tuitionFilter, scholarshipFilter, minCommissionFilter]);

  // Phase 1: Simultaneous Bulk Send Outreach Action with Configured EmailJS Transporter
  const handleSendBulkOutreach = async () => {
    const selectedIds = Array.from(phase1SelectedLeadIds);
    if (selectedIds.length === 0) {
      setBulkSendNotice(
        '⚠ No Leads Selected: Please check one or more institutional leads in Section 1 above before dispatching.'
      );
      setTimeout(() => setBulkSendNotice(null), 6000);
      return;
    }

    const cleanService = (
      emailjsServiceId ||
      (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID ||
      ''
    ).trim();
    const cleanTemplate = (
      emailjsTemplateId ||
      (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID ||
      ''
    ).trim();
    const cleanPublic = (
      emailjsPublicKey ||
      (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY ||
      ''
    ).trim();
    const fromAddress = senderEmail.trim() || 'rafiaquafqu@gmail.com';

    if (!cleanService || !cleanTemplate || !cleanPublic) {
      setBulkSendNotice(
        '⚠ EmailJS Credentials Required: Please enter your Service ID, Template ID, and Public Key in the configuration card above.'
      );
      setTimeout(() => setBulkSendNotice(null), 8000);
      return;
    }

    setIsBulkSending(true);

    try {
      // Save credentials preference in browser storage
      localStorage.setItem('ila_emailjs_service_id', cleanService);
      localStorage.setItem('ila_emailjs_template_id', cleanTemplate);
      localStorage.setItem('ila_emailjs_public_key', cleanPublic);
      localStorage.setItem('ila_emailjs_sender_email', fromAddress);

      // Search in processLeads FIRST, then allResourcesLeads and sessionLeads
      const selectedLeadItems = selectedIds
        .map((id) => processLeads.find((l) => l.id === id) || allResourcesLeads.find((l) => l.id === id) || sessionLeads.find((l) => l.id === id))
        .filter((l): l is TieupLeadItem => Boolean(l && (l.contactEmail || (l as any).email || (l as any).contact_email)));

      if (selectedLeadItems.length === 0) {
        setBulkSendNotice('⚠ No valid target lead email addresses found in selection. Please check lead contact details.');
        setIsBulkSending(false);
        setTimeout(() => setBulkSendNotice(null), 6500);
        return;
      }

      let deliveredCount = 0;
      let failedCount = 0;
      let lastErrorMessage = '';
      const newLogs: OutreachStatusLogItem[] = [];

      for (const lead of selectedLeadItems) {
        const targetEmail = (lead.contactEmail || (lead as any).email || (lead as any).contact_email || '').trim();
        if (!targetEmail) continue;

        const isGeneric = targetEmail.includes('noreply') || targetEmail.includes('info@');
        const populatedSubject = substituteEmailTokens(phase1EmailSubject, lead);
        const populatedBody = substituteEmailTokens(phase1EmailBody, lead);

        const res = await sendEmailJsSingle({
          config: {
            serviceId: cleanService,
            templateId: cleanTemplate,
            publicKey: cleanPublic,
            senderEmail: fromAddress,
          },
          recipientEmail: targetEmail,
          recipientName: lead.contactPerson || lead.name,
          subject: populatedSubject,
          body: populatedBody,
          institutionName: lead.name,
          commissionPercent: lead.commissionPercent,
          courses: lead.courseList?.join(', ') || (lead as any)?.programs || 'Undergraduate & Graduate Articulation',
        });

        const isSuccess = res.success;
        if (isSuccess) {
          deliveredCount++;
        } else {
          failedCount++;
          lastErrorMessage = res.error || `Status ${res.status || 'failed'}`;
        }

        const logItem: OutreachStatusLogItem = {
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          leadId: lead.id,
          institutionName: lead.name,
          recipientEmail: targetEmail,
          recipientName: lead.contactPerson || lead.name,
          senderEmail: fromAddress,
          subject: populatedSubject,
          status: isGeneric ? 'flagged_generic' : isSuccess ? 'delivered' : 'bounced',
          phase: isGeneric ? 'outreach' : isSuccess ? 'followup' : 'outreach',
          sentAt: Date.now(),
          lastChecked: Date.now(),
          spamScore: isGeneric ? 80 : isSuccess ? 5 : 85,
          flagReason: isGeneric
            ? 'Generic alias detected. Transferred to generic sandbox.'
            : !isSuccess
            ? (res.error || 'EmailJS delivery error')
            : undefined,
          leadDataSnapshot: lead,
        };

        await saveOutreachLog(logItem);
        newLogs.push(logItem);
      }

      if (newLogs.length > 0) {
        setOutreachLogs((prev) => [...newLogs, ...prev]);
      }

      if (deliveredCount > 0) {
        setPhase1SelectedLeadIds(new Set());
        setBulkSendNotice(
          `✓ LIVE EMAILJS DISPATCH SUCCESS: Successfully sent ${deliveredCount} personalized outreach email(s) from ${fromAddress} via EmailJS!`
        );
      } else if (failedCount > 0) {
        setBulkSendNotice(
          `⚠ Outreach dispatch failed for ${failedCount} lead(s): ${lastErrorMessage}. Please verify your EmailJS Service ID, Template ID, and Public Key.`
        );
      } else {
        setBulkSendNotice('ℹ No valid target lead email addresses found in selection.');
      }
    } catch (err: any) {
      console.error('EmailJS outreach dispatch error:', err);
      setBulkSendNotice(`❌ Dispatch error: ${err.message || 'Failed to dispatch emails via EmailJS.'}`);
    } finally {
      setIsBulkSending(false);
      setTimeout(() => setBulkSendNotice(null), 8000);
    }
  };

  // Phase 1 & 2: Re-trigger / Retry Outreach Record Immediately with EmailJS
  const handleRetriggerDelivery = async (log: OutreachStatusLogItem, overrideEmail?: string) => {
    const targetEmail = (overrideEmail || log.recipientEmail).trim();
    const fromAddress = senderEmail.trim() || 'rafiaquafqu@gmail.com';
    const cleanService = (emailjsServiceId || '').trim();
    const cleanTemplate = (emailjsTemplateId || '').trim();
    const cleanPublic = (emailjsPublicKey || '').trim();
    const isGeneric = targetEmail.includes('noreply') || targetEmail.includes('info@');

    if (!cleanService || !cleanTemplate || !cleanPublic) {
      setBulkSendNotice('⚠ EmailJS credentials missing. Please enter Service ID, Template ID, and Public Key above.');
      setTimeout(() => setBulkSendNotice(null), 4500);
      return;
    }

    try {
      const res = await sendEmailJsSingle({
        config: {
          serviceId: cleanService,
          templateId: cleanTemplate,
          publicKey: cleanPublic,
          senderEmail: fromAddress,
        },
        recipientEmail: targetEmail,
        recipientName: log.recipientName || log.institutionName,
        subject: log.subject,
        body: phase1EmailBody,
        institutionName: log.institutionName,
      });

      const updatedLog: OutreachStatusLogItem = {
        ...log,
        recipientEmail: targetEmail,
        status: isGeneric ? 'flagged_generic' : (res.success ? 'delivered' : 'flagged_generic'),
        flagReason: isGeneric
          ? 'Generic alias retained. Dropped into generic sandbox.'
          : (res.error || undefined),
        spamScore: isGeneric ? 80 : 8,
        phase: isGeneric ? 'outreach' : 'followup',
        sentAt: Date.now(),
        retryCount: (log.retryCount || 0) + 1,
        lastChecked: Date.now(),
      };

      await saveOutreachLog(updatedLog);
      setOutreachLogs((prev) => prev.map((l) => (l.id === updatedLog.id ? updatedLog : l)));
      setBulkSendNotice(`✓ Dispatched retry delivery sequence for ${log.institutionName} (${targetEmail}) via EmailJS.`);
      setTimeout(() => setBulkSendNotice(null), 4000);
    } catch (err: any) {
      console.error('Single EmailJS retrigger error:', err);
    }
  };

  // Phase 1: Fix and Resend Flagged/Bounced Log from Modal
  const handleResendReviewedLog = async () => {
    if (!manualReviewLog || !manualReviewEmail.trim()) return;
    await handleRetriggerDelivery(manualReviewLog, manualReviewEmail.trim());
    setManualReviewLog(null);
    setManualReviewEmail('');
  };

  // Phase 2: Simulate Incoming Partner Reply (For Demo & Live Interaction Testing)
  const handleSimulatePartnerReply = async (log: OutreachStatusLogItem) => {
    const sampleReplies = [
      {
        excerpt: `Dear Ila Academy Team, thank you for reaching out. We have reviewed your bilateral proposal and are very interested in partnering for our English-taught Masters in Computer Science and Engineering. We would like to schedule a call to finalize the 20% commission schedule.`,
        sentiment: 'meeting_requested' as const,
      },
      {
        excerpt: `Greetings from Admissions. We received your articulation proposal. Our university caps agency commission at 18% for the initial semester. Would you be open to this framework? If so, please send your standard MoU.`,
        sentiment: 'negotiation' as const,
      },
      {
        excerpt: `Thank you for contacting us. We welcome student referrals from Ila Academy who meet our minimum IELTS 6.5 requirement. Please proceed with sending applicant profiles to our international office.`,
        sentiment: 'interested' as const,
      },
    ];
    const chosen = sampleReplies[Math.floor(Math.random() * sampleReplies.length)];
    const updatedLog: OutreachStatusLogItem = {
      ...log,
      status: 'replied',
      phase: chosen.sentiment === 'meeting_requested' ? 'meeting' : 'followup',
      responseExcerpt: chosen.excerpt,
      responseSentiment: chosen.sentiment,
      responseReceivedAt: Date.now(),
      lastChecked: Date.now(),
    };
    await saveOutreachLog(updatedLog);
    setOutreachLogs((prev) => prev.map((l) => (l.id === updatedLog.id ? updatedLog : l)));
    setAutoTriggerNotice(`✓ Incoming partner response captured from ${log.institutionName}!`);
    setTimeout(() => setAutoTriggerNotice(null), 4000);
  };

  // Phase 2: Open AI Auto-Reply Assistant
  const handleOpenAiReplyModal = (log: OutreachStatusLogItem) => {
    setAiReplyModalLog(log);
    setIsGeneratingAiReply(true);
    setAiDraftSuccessNotice(null);

    const instName = log.institutionName || 'the University';
    const person = log.recipientName || 'Admissions Liaison';
    const sentiment = log.responseSentiment || 'interested';
    const excerpt = log.responseExcerpt || '';

    let subject = `Re: Partnership MoU & Articulation Agreement - ${instName} / Ila Academy`;
    let body = '';

    if (sentiment === 'meeting_requested' || excerpt.toLowerCase().includes('meeting') || excerpt.toLowerCase().includes('schedule')) {
      subject = `Confirmed: Bilateral Discussion & Articulation Schedule - ${instName}`;
      body = `Dear ${person},\n\nThank you for your prompt response and invitation to meet regarding the partnership between ${instName} and Ila Academy.\n\nWe are pleased to confirm our availability for a 30-minute virtual consultation. Below are our direct coordination details:\n- Proposed Window: This Thursday/Friday, 14:00 - 16:30 CET\n- Video Room: https://meet.google.com/ila-acad-b2b (Google Meet)\n- Discussion Agenda: Review of 20% tuition revenue-share terms, Anabin credential verification workflow, and semester quota allocation.\n\nPlease let us know which slot works best for your schedule, or feel free to send a calendar invite directly.\n\nWarm regards,\nAcademic Partnerships Directorate\nIla Academy | Frankfurt - Berlin Liaison Desk`;
    } else if (sentiment === 'negotiation' || excerpt.toLowerCase().includes('commission') || excerpt.toLowerCase().includes('percent') || excerpt.toLowerCase().includes('18%')) {
      subject = `Re: Commission Framework Alignment & Bilateral Terms - ${instName}`;
      body = `Dear ${person},\n\nThank you for reviewing our bilateral proposal and providing transparent institutional terms.\n\nWe understand ${instName}'s standard policy framework regarding initial commissions. In the spirit of establishing a productive, long-term collaboration, we are pleased to proceed with the baseline tier with a performance review after the first matriculated cohort of 5 students.\n\nOur academic advising team is ready to begin pre-screening international candidates matching your specific IELTS and APS validation standards. We have prepared the draft Memorandum of Understanding (MoU) reflecting these terms for your review.\n\nLooking forward to formalizing this collaboration.\n\nSincerely,\nDirector of Global University Partnerships\nIla Academy`;
    } else {
      subject = `Re: Bilateral Academic Partnership Follow-up - ${instName}`;
      body = `Dear ${person},\n\nThank you for your reply regarding our proposed educational collaboration with ${instName}.\n\nWe have documented your requirements regarding international student admissions and program articulation. We are attaching our formal Institutional Profile, accredited partner credentials, and the standard non-exclusive bilateral agreement for your review.\n\nShould you have any specific curriculum guidelines or admission deadlines for the upcoming semester intake, please feel free to share them so our counselors can align prospective applicants accordingly.\n\nBest regards,\nPartnership Operations Team\nIla Academy`;
    }

    setTimeout(() => {
      setAiDraftedSubject(subject);
      setAiDraftedBody(body);
      setIsGeneratingAiReply(false);
    }, 350);
  };

  // Phase 2: Send AI-Drafted Auto-Reply
  const handleSendAiReply = async () => {
    if (!aiReplyModalLog) return;

    if (emailjsServiceId.trim() && emailjsTemplateId.trim() && emailjsPublicKey.trim() && aiReplyModalLog.recipientEmail) {
      try {
        await sendEmailJsSingle({
          config: {
            serviceId: emailjsServiceId.trim(),
            templateId: emailjsTemplateId.trim(),
            publicKey: emailjsPublicKey.trim(),
            senderEmail: senderEmail.trim(),
          },
          recipientEmail: aiReplyModalLog.recipientEmail,
          recipientName: aiReplyModalLog.recipientName || aiReplyModalLog.institutionName,
          subject: aiDraftedSubject,
          body: aiDraftedBody,
          institutionName: aiReplyModalLog.institutionName,
        });
      } catch (err) {
        console.warn('AI reply EmailJS sending notice:', err);
      }
    }

    const updated: OutreachStatusLogItem = {
      ...aiReplyModalLog,
      status: 'replied',
      phase: aiReplyModalLog.responseSentiment === 'meeting_requested' ? 'meeting' : 'followup',
      aiSuggestedReply: aiDraftedBody,
      aiSuggestedSubject: aiDraftedSubject,
      lastFollowupAt: Date.now(),
      lastChecked: Date.now(),
    };
    await saveOutreachLog(updated);
    setOutreachLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setAiDraftSuccessNotice(`✓ AI contextual reply dispatched to ${aiReplyModalLog.recipientEmail}`);
    setTimeout(() => {
      setAiDraftSuccessNotice(null);
      setAiReplyModalLog(null);
    }, 1800);
  };

  // Phase 2: Trigger Auto-Reminders for Leads without Response after 7-10 Days
  const handleTriggerAutoReminders = async () => {
    setIsTriggeringFollowups(true);
    let triggeredCount = 0;
    const now = Date.now();
    const updatedLogs = await Promise.all(
      outreachLogs.map(async (log) => {
        const daysSinceContact = Math.floor((now - (log.lastFollowupAt || log.sentAt || log.lastChecked)) / 86400000);
        if (daysSinceContact >= 7 && log.status !== 'replied' && log.status !== 'flagged_generic' && log.phase !== 'pushed_partner') {
          triggeredCount++;
          const updated: OutreachStatusLogItem = {
            ...log,
            phase: 'followup',
            lastFollowupAt: now,
            followupCount: (log.followupCount || 0) + 1,
            lastChecked: now,
          };
          await saveOutreachLog(updated);
          return updated;
        }
        return log;
      })
    );
    setOutreachLogs(updatedLogs);
    setIsTriggeringFollowups(false);
    setAutoTriggerNotice(`✓ Automated follow-up reminder triggered for ${triggeredCount} institutions pending response (>7 days).`);
    setTimeout(() => setAutoTriggerNotice(null), 4000);
  };

  // Advance Outreach Log to Phase 3 (Meeting Coordination) when Replied
  const handleMarkRepliedAndSchedule = async (log: OutreachStatusLogItem) => {
    const updated: OutreachStatusLogItem = {
      ...log,
      status: 'replied',
      phase: 'meeting',
      lastChecked: Date.now(),
    };
    await saveOutreachLog(updated);
    setOutreachLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setSelectedLogForMeeting(updated);
    setMeetingModalOpen(true);
    setActiveProcessPhase('phase3_meetings');
  };

  // Phase 3: Save Meeting Details
  const handleSaveMeetingDetails = async () => {
    if (!selectedLogForMeeting) return;
    const updated: OutreachStatusLogItem = {
      ...selectedLogForMeeting,
      phase: 'meeting',
      meetingScheduledAt: `${meetingFormDate} ${meetingFormTime} (${meetingFormTz})`,
      meetingLink: meetingFormLink,
      meetingAgenda: meetingFormAgenda,
      meetingNotes: meetingFormNotes,
      lastChecked: Date.now(),
    };
    await saveOutreachLog(updated);
    setOutreachLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setMeetingModalOpen(false);
  };

  // Advance from Phase 3 to Phase 4 (Push to Partners)
  const handleAdvanceToPushToPartner = async (log: OutreachStatusLogItem) => {
    const updated: OutreachStatusLogItem = {
      ...log,
      phase: 'pushed_partner',
      lastChecked: Date.now(),
    };
    await saveOutreachLog(updated);
    setOutreachLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setActiveProcessPhase('phase4_push_partners');
  };

  // Phase 4: Push to Official Partners Database
  const handlePushToOfficialPartnerDatabase = async (leadOrLog: TieupLeadItem | OutreachStatusLogItem) => {
    const targetLeadId = 'leadId' in leadOrLog ? leadOrLog.leadId || leadOrLog.id : leadOrLog.id;
    const leadToMigrate = allResourcesLeads.find((l) => l.id === targetLeadId || l.name === ('institutionName' in leadOrLog ? leadOrLog.institutionName : leadOrLog.name));
    if (!leadToMigrate) return;

    await toggleLeadPartnerStatus(leadToMigrate.id, true);
    setSessionLeads((prev) => prev.map((l) => (l.id === leadToMigrate.id ? { ...l, isPartner: true } : l)));
    setAllResourcesLeads((prev) => prev.map((l) => (l.id === leadToMigrate.id ? { ...l, isPartner: true } : l)));

    const matchingLog = outreachLogs.find((l) => l.leadId === leadToMigrate.id || l.institutionName === leadToMigrate.name);
    if (matchingLog) {
      const updatedLog: OutreachStatusLogItem = {
        ...matchingLog,
        phase: 'pushed_partner',
        lastChecked: Date.now(),
      };
      await saveOutreachLog(updatedLog);
      setOutreachLogs((prev) => prev.map((l) => (l.id === updatedLog.id ? updatedLog : l)));
    }

    setPushSuccessNotice(`✓ Successfully migrated "${leadToMigrate.name}" into official Partners database!`);
    setTimeout(() => setPushSuccessNotice(null), 4000);
  };

  // Partners list with Category and Country filters
  const finalizedPartners = useMemo(() => {
    return allResourcesLeads.filter((l) => {
      if (!l.isPartner) return false;
      if (partnerCategoryFilter !== 'all' && !l.category.toLowerCase().includes(partnerCategoryFilter.toLowerCase())) {
        return false;
      }
      if (partnerCountryFilter !== 'all' && !l.country.toLowerCase().includes(partnerCountryFilter.toLowerCase())) {
        return false;
      }
      if (!partnerSearchFilter.trim()) return true;
      const term = partnerSearchFilter.toLowerCase();
      return (
        l.name.toLowerCase().includes(term) ||
        l.contactPerson.toLowerCase().includes(term) ||
        l.termsSummary.toLowerCase().includes(term)
      );
    });
  }, [allResourcesLeads, partnerCategoryFilter, partnerCountryFilter, partnerSearchFilter]);

  // Toggle partner status in database and state
  const handleTogglePartner = async (lead: TieupLeadItem) => {
    const nextStatus = !lead.isPartner;
    await toggleLeadPartnerStatus(lead.id, nextStatus);

    setSessionLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, isPartner: nextStatus } : l))
    );
    setAllResourcesLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, isPartner: nextStatus } : l))
    );
  };

  // Copy helper for single contact or MOU text
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Anti-theft copy attempt blocker for table selections
  const handleTableCopyAttempt = (e: React.ClipboardEvent) => {
    e.preventDefault();
    setAntiTheftToast(true);
    setTimeout(() => setAntiTheftToast(false), 3500);
  };

  // Open modal for details & MOU
  const handleOpenTermsModal = (lead: TieupLeadItem) => {
    setSelectedLeadForModal(lead);
    setIsModalOpen(true);
  };

  // Send simulated test outreach to log deliverability & anti-spam status
  const handleSendTestOutreach = async (lead: TieupLeadItem) => {
    const isRoboticGeneric = lead.contactEmail.includes('noreply') || lead.contactEmail.includes('info@');
    const newLog: OutreachStatusLogItem = {
      id: `log_${Date.now()}`,
      leadId: lead.id,
      institutionName: lead.name,
      recipientEmail: lead.contactEmail,
      recipientName: lead.contactPerson,
      subject: `Strategic B2B Partnership & Articulation Proposal - Ila Academy / ${lead.name}`,
      status: isRoboticGeneric ? 'flagged_generic' : 'delivered',
      flagReason: isRoboticGeneric ? 'Robotic "no-reply" address detected. Dropped into generic sandbox.' : undefined,
      spamScore: isRoboticGeneric ? 85 : 12,
      lastChecked: Date.now(),
    };

    const updated = [newLog, ...outreachLogs];
    setOutreachLogs(updated);
    await saveOutreachLog(newLog);
    setActiveMainTab('process');
  };

  // Promote top 3 compatible leads to partners if none exist
  const handleSeedInitialPartners = async () => {
    const topLeads = allResourcesLeads.slice(0, 3);
    for (const lead of topLeads) {
      await toggleLeadPartnerStatus(lead.id, true);
    }
    setSessionLeads((prev) =>
      prev.map((l, idx) => (idx < 3 ? { ...l, isPartner: true } : l))
    );
    setAllResourcesLeads((prev) =>
      prev.map((l, idx) => (idx < 3 ? { ...l, isPartner: true } : l))
    );
  };

  // Filtered outreach logs with Category, Country and Status filters
  const filteredOutreachLogs = useMemo(() => {
    return outreachLogs.filter((log) => {
      const matchLead = allResourcesLeads.find((l) => l.id === log.leadId || l.name === log.institutionName);
      if (outreachCategoryFilter !== 'all' && matchLead && !matchLead.category.toLowerCase().includes(outreachCategoryFilter.toLowerCase())) {
        return false;
      }
      if (outreachCountryFilter !== 'all' && matchLead && !matchLead.country.toLowerCase().includes(outreachCountryFilter.toLowerCase())) {
        return false;
      }
      if (outreachStatusFilter === 'all') return true;
      if (outreachStatusFilter === 'flagged') return log.status === 'flagged_generic' || log.status === 'bounced';
      return log.status === outreachStatusFilter;
    });
  }, [outreachLogs, allResourcesLeads, outreachCategoryFilter, outreachCountryFilter, outreachStatusFilter]);

  // Dynamic Suggestion Presets based on Active Category & Domain
  const categorySuggestions = useMemo((): string[] => {
    switch (selectedCategory) {
      case 'colleges_universities':
        return [
          'Universities in Frankfurt am Main with €2,000+ tuition fee share',
          'Private Applied Sciences (Fachhochschule) with English-taught M.Sc. Data Science',
          'TU9 Public Research Universities with zero tuition & low IELTS threshold',
          'German Business Schools with 20% commission on international student enrollments',
          'Medical & Nursing Academies with guaranteed clinical placement tie-ups',
        ];
      case 'visa_immigration_agencies':
        return [
          'Expatrio & Fintiba student visa blocked account specialists in Germany',
          'Work permit & EU Blue Card fast-track immigration legal liaisons',
          'Skilled immigrant relocation agencies with direct APS certificate guidance',
          'Certified German immigration notaries and digital escrow account partners',
        ];
      case 'job_recruiters_staffing':
        return [
          'STEM & IT executive talent headhunters in Rhine-Main / Hesse',
          'Clinical healthcare & nurse recruitment staffing agencies in Germany',
          'Dual-Study (Duale Hochschule) industrial traineeship networks',
          'Banking, FinTech & management recruitment placement partners',
        ];
      case 'import_export_suppliers':
        return [
          'CargoCity Frankfurt air cargo wholesale trade distributors',
          'B2B wholesale suppliers & European import-export customs brokers',
          'Industrial parts & equipment procurement networks in Germany',
        ];
      case 'accommodation_housing':
        return [
          'The Fizz, Neon Wood & Studentendorf international dormitories in Germany',
          'Furnished student housing providers with direct agency commission',
          'Short-term flat share & student relocation booking networks in Berlin and Frankfurt',
        ];
      case 'travel_logistics':
        return [
          'Student flight booking portals & discounted group fare consolidators',
          'Airport transfer & European rail pass student affiliate partners',
          'International excess baggage & student relocation shipping services',
        ];
      case 'language_training_institutes':
        return [
          'Goethe-Institut & Telc accredited German language schools in Germany',
          'Intensive TestDaF & DSH university pathway language prep academies',
          'Online CEFR A1-C1 German language partner schools with student referral fee',
        ];
      case 'corporate_legal_notary':
        return [
          'German commercial law firms for academic bilateral MOU validation',
          'Certified English-German document translation and apostille services',
          'B2B educational contracts & corporate notary partners in Frankfurt',
        ];
      case 'b2b_saas_service_providers':
        return [
          'Personio enterprise HR & student management SaaS partners with 25% ARR revenue share',
          'Educational CRM & international student application tracking platforms',
          'Digital credential verification and APS document processing software',
        ];
      default:
        return [
          'Universities in Frankfurt am Main with €2,000+ tuition fee share',
          'Expatrio & Fintiba student visa blocked account specialists in Germany',
          'Hays & Michael Page STEM talent recruitment partners in Hesse',
          'CargoCity Frankfurt air cargo wholesale trade distributors',
        ];
    }
  }, [selectedCategory]);

  // Notify parent of count updates for secondary header badges
  useEffect(() => {
    onUpdateCounts?.({
      resources: allResourcesLeads.length,
      process: outreachLogs.length,
      partners: finalizedPartners.length,
    });
  }, [allResourcesLeads.length, outreachLogs.length, finalizedPartners.length, onUpdateCounts]);

  return (
    <div
      id="tieup-research-engine-root"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: isTieupFullScreen ? '100vh' : '100%',
        width: isTieupFullScreen ? '100vw' : '100%',
        position: isTieupFullScreen ? 'fixed' : 'relative',
        top: isTieupFullScreen ? 0 : undefined,
        left: isTieupFullScreen ? 0 : undefined,
        right: isTieupFullScreen ? 0 : undefined,
        bottom: isTieupFullScreen ? 0 : undefined,
        zIndex: isTieupFullScreen ? 99990 : 1,
        overflow: 'hidden',
        background: 'var(--bg-primary)',
        color: 'var(--text-main)',
      }}
    >
      {/* ANTI-THEFT WARNING TOAST NOTIFICATION */}
      {antiTheftToast && (
        <div
          className="animate-pop-in"
          style={{
            position: 'fixed',
            top: '64px',
            right: '20px',
            zIndex: 100,
            background: 'rgba(239, 68, 68, 0.95)',
            border: '1px solid rgba(254, 202, 202, 0.4)',
            color: '#ffffff',
            padding: '0.7rem 1.15rem',
            borderRadius: '0.7rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.8rem',
            fontWeight: 700,
          }}
        >
          <ShieldAlert size={17} />
          <div>
            <div>Proprietary Database Protected</div>
            <div style={{ fontSize: '0.68rem', fontWeight: 500, opacity: 0.9 }}>
              Bulk copy/paste and raw table extractions are disabled by security policy.
            </div>
          </div>
        </div>
      )}

      {/* 2. PAGE 1: CHAT HOME (INVERTED SPLIT LAYOUT WITH COMPACT LEFT PANEL) */}
      {activeMainTab === 'chat_home' && (
        <div
          id="tieup-chat-home-inverted-layout"
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* ============================================================== */}
          {/* LEFT SIDE: REDUCED BY HALF WIDTH (21% width, 220px-280px)      */}
          {/* HOSTS CHAT HISTORY SESSIONS & GROUNDING LOGS STREAM           */}
          {/* ============================================================== */}
          {isSidebarOpen && (
            <div
              id="tieup-left-history-and-logs"
              style={{
                flex: '0 0 21%',
                minWidth: '220px',
                maxWidth: '280px',
                borderRight: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
                background: 'var(--bg-secondary)',
              }}
            >
              {/* Header for Left History Panel */}
              <div
                style={{
                  padding: '0.65rem 0.75rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MessageSquare size={13} color="var(--accent-primary)" />
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Search Sessions
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleStartNewSearchSession}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '0.35rem',
                    padding: '0.2rem 0.5rem',
                    color: 'var(--accent-primary)',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                  title="Create New Isolated Search Thread"
                >
                  <Plus size={11} strokeWidth={2.5} />
                  <span>New</span>
                </button>
              </div>

              {/* Search filter for past threads */}
              <div style={{ padding: '0.45rem 0.65rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-card)', padding: '0.28rem 0.5rem', borderRadius: '0.45rem', border: '1px solid var(--border-subtle)' }}>
                  <Search size={11} color="var(--text-subtle)" />
                  <input
                    type="text"
                    value={sessionSearchQuery}
                    onChange={(e) => setSessionSearchQuery(e.target.value)}
                    placeholder="Search threads..."
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'var(--text-main)',
                      fontSize: '0.72rem',
                    }}
                  />
                </div>
              </div>

              {/* Sessions List with Relative Timestamps & Delete Confirmation Prompt */}
              <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '0.45rem 0.6rem', borderBottom: '1px solid var(--border-subtle)' }}>
                {tieupSessions.length === 0 ? (
                  <div style={{ padding: '0.85rem 0.4rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.84rem' }}>
                    No sessions yet. Click "+" to start.
                  </div>
                ) : (
                  tieupSessions
                    .filter((s) => !sessionSearchQuery.trim() || s.title.toLowerCase().includes(sessionSearchQuery.toLowerCase()))
                    .map((sess) => {
                      const isActive = currentSession?.id === sess.id;
                      return (
                        <div
                          key={sess.id}
                          onClick={() => onSelectSession(sess.id)}
                          style={{
                            padding: '0.5rem 0.65rem',
                            borderRadius: '0.55rem',
                            background: isActive ? 'var(--accent-gradient-subtle)' : 'transparent',
                            border: isActive ? '1px solid var(--border-medium)' : '1px solid transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '0.35rem',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontSize: '0.86rem',
                                fontWeight: isActive ? 700 : 500,
                                color: isActive ? 'var(--accent-primary)' : 'var(--text-main)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {sess.title}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: '0.15rem' }}>
                              {formatRelativeTime(sess.createdAt || sess.updatedAt)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSessionPendingDelete({ id: sess.id, title: sess.title });
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-subtle)',
                              cursor: 'pointer',
                              padding: '0.3rem',
                              marginLeft: '0.4rem',
                              borderRadius: '0.35rem',
                            }}
                            title="Delete thread"
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-subtle)')}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })
                )}
              </div>

              {/* Clean Search Query History for Active Thread */}
              <div
                id="tieup-search-query-history"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                }}
              >
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0 0.2rem' }}>
                  Thread Query Log
                </div>

                {!currentSession || currentSession.messages.filter((m) => m.role === 'user').length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', padding: '1.25rem 0.6rem' }}>
                    <Sparkles size={22} color="var(--accent-primary)" style={{ margin: '0 auto 0.45rem auto' }} />
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Ready for Research
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem', lineHeight: 1.4 }}>
                      Select Geography & Category on the right to start grounding partners.
                    </div>
                  </div>
                ) : (
                  currentSession.messages
                    .filter((msg) => msg.role === 'user')
                    .map((msg, idx) => {
                      const cleanPrompt = msg.content.replace(/^\[Category:.*?\]\n?/, '').trim() || msg.content;
                      return (
                        <div
                          key={msg.id || idx}
                          style={{
                            padding: '0.65rem 0.8rem',
                            borderRadius: '0.65rem',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.86rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                            boxShadow: 'var(--shadow-sm)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                              Search #{idx + 1}
                            </span>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                              {formatRelativeTime(msg.timestamp)}
                            </span>
                          </div>
                          <div style={{ color: 'var(--text-main)', fontWeight: 600, lineHeight: 1.4, wordBreak: 'break-word' }}>
                            {cleanPrompt}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                            <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.45rem', borderRadius: '9999px', background: 'var(--success-bg)', color: 'var(--success)', fontWeight: 700 }}>
                              ✓ Grounded
                            </span>
                          </div>
                        </div>
                      );
                    })
                )}

                {isSearching && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 0.65rem',
                      borderRadius: '0.55rem',
                      background: 'var(--accent-gradient-subtle)',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.7rem',
                      color: 'var(--accent-primary)',
                      fontWeight: 600,
                    }}
                  >
                    <Loader2 size={12} className="animate-spin" />
                    <span>Grounding leads & policies...</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* RIGHT SIDE: EXPANDED WORKSPACE (79% width)                     */}
          {/* HOSTS COMPACT SEARCH CONTROLS, INPUT BOX & MATCHED PROSPECTS   */}
          {/* ============================================================== */}
          <div
            id="tieup-right-input-and-preview"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflowY: 'auto',
              background: 'var(--bg-primary)',
              minWidth: 0,
            }}
          >
                   {/* 1. SPACE-OPTIMIZED INLINE SEARCH & CATEGORY CONTROLS */}
            <div
              id="tieup-search-controls-header"
              style={{
                padding: '0.65rem 1.25rem',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              {/* Ultra-compact inline target selectors (Country -> Category -> Sub-Sector) without redundant header text */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  flexWrap: 'wrap',
                }}
              >
                {/* Target Country */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-subtle)' }}>Country:</span>
                  <select
                    id="tieup-select-country"
                    value={selectedCountry}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedCountry(e.target.value)}
                    style={{
                      padding: '0.32rem 0.55rem',
                      borderRadius: '0.45rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-main)',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {TARGET_COUNTRIES.map((ctry) => (
                      <option key={ctry.id} value={ctry.id} style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>
                        {ctry.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Main Category */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-subtle)' }}>Category:</span>
                  <select
                    id="tieup-select-category"
                    value={selectedCategory}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
                    style={{
                      padding: '0.32rem 0.55rem',
                      borderRadius: '0.45rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-main)',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {TIEUP_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id} style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sub-Category */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-subtle)' }}>Sub-Sector:</span>
                  <select
                    id="tieup-select-subcategory"
                    value={selectedSubCategory}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedSubCategory(e.target.value)}
                    style={{
                      padding: '0.32rem 0.55rem',
                      borderRadius: '0.45rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-main)',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {activeCategoryConfig.subCategories.map((sub) => (
                      <option key={sub.id} value={sub.id} style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Main Search Input Bar with integrated Dynamic Suggestions Menu */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <form onSubmit={handleExecuteSearch} style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'var(--bg-secondary)',
                      border: isListening ? '2px solid #ef4444' : '1px solid var(--border-medium)',
                      borderRadius: '0.65rem',
                      padding: '0.25rem 0.65rem',
                      gap: '0.5rem',
                      boxShadow: 'var(--shadow-sm)',
                      height: '44px',
                      boxSizing: 'border-box',
                    }}
                  >
                    <Search size={16} color="var(--text-subtle)" style={{ flexShrink: 0 }} />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Search ${activeCategoryConfig.name.toLowerCase()} in ${TARGET_COUNTRIES.find((c) => c.id === selectedCountry)?.name || 'Germany'} (e.g. tuition, IELTS, commission)...`}
                      disabled={isSearching}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--text-main)',
                        fontSize: '0.9rem',
                        padding: '0.2rem 0.3rem',
                      }}
                    />

                    {/* Voice dictation toggle */}
                    <button
                      type="button"
                      onClick={() => toggleListening((text) => setQuery((prev) => (prev ? `${prev} ${text}` : text)))}
                      style={{
                        background: isListening ? '#ef4444' : 'var(--bg-tertiary)',
                        border: 'none',
                        borderRadius: '0.45rem',
                        color: isListening ? '#ffffff' : 'var(--text-subtle)',
                        cursor: 'pointer',
                        padding: '0.4rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                      title={isListening ? 'Stop voice dictation' : 'Start voice search'}
                    >
                      <Mic size={15} />
                    </button>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={!query.trim() || isSearching}
                      style={{
                        background: !query.trim() || isSearching ? 'var(--border-subtle)' : 'var(--accent-primary)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: !query.trim() || isSearching ? 'var(--text-subtle)' : '#ffffff',
                        cursor: !query.trim() || isSearching ? 'not-allowed' : 'pointer',
                        padding: '0.45rem 1rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isSearching ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <>
                          <span>Search & Match</span>
                          <Send size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Suggestions Dropdown Menu Positioned Right Beside Input Box */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => setIsSuggestionsOpen(!isSuggestionsOpen)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      height: '44px',
                      padding: '0 0.9rem',
                      borderRadius: '0.65rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-main)',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Sparkles size={15} color="var(--accent-primary)" />
                    <span>Suggestions</span>
                    <ChevronDown size={14} style={{ transform: isSuggestionsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
                  </button>

                  {/* Dropdown Menu with category-filtered grounding suggestions */}
                  {isSuggestionsOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        right: 0,
                        width: '400px',
                        maxHeight: '360px',
                        overflowY: 'auto',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '0.75rem',
                        boxShadow: 'var(--shadow-lg)',
                        padding: '0.5rem',
                        zIndex: 100,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                      }}
                    >
                      <div
                        style={{
                          padding: '0.4rem 0.65rem',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: 'var(--text-subtle)',
                          textTransform: 'uppercase',
                          borderBottom: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>Preset Queries: {activeCategoryConfig.name}</span>
                        <span style={{ color: 'var(--accent-primary)', fontSize: '0.7rem' }}>{categorySuggestions.length} suggestions</span>
                      </div>
                      {categorySuggestions.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setQuery(preset);
                            setIsSuggestionsOpen(false);
                          }}
                          style={{
                            textAlign: 'left',
                            padding: '0.55rem 0.7rem',
                            borderRadius: '0.45rem',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-main)',
                            fontSize: '0.84rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            lineHeight: 1.35,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 1-Click Seed Test 1 to 5 (Isolated in Chat Home) */}
                <button
                  type="button"
                  onClick={handleInjectSandboxTestColleges}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    height: '44px',
                    padding: '0 0.95rem',
                    borderRadius: '0.65rem',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#10b981',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                  title="Seed 5 verified test colleges (rafiaquafqu@gmail.com, ilaproject075@gmail.com, classicraffi@gmail.com) strictly isolated in Chat Home results view"
                >
                  <Sparkles size={14} color="#10b981" />
                  <span>🧪 Seed Test 1 to 5</span>
                </button>

                {/* Plus icon button for new session thread */}
                <button
                  type="button"
                  onClick={handleStartNewSearchSession}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '44px',
                    height: '44px',
                    borderRadius: '0.65rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--accent-primary)',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    flexShrink: 0,
                  }}
                  title="Create New Isolated Search Session Thread"
                >
                  <Plus size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* 2. SINGLE-LINE COLLAPSIBLE AI STRATEGIC REPORT TOGGLE */}
            {(() => {
              const latestAssistantReport = [...(currentSession?.messages || [])].reverse().find((m) => m.role === 'assistant');
              const currentCountryObj = TARGET_COUNTRIES.find((c) => c.id === selectedCountry);
              const jurisdictionLabel = currentCountryObj && currentCountryObj.id !== 'germany'
                ? `${currentCountryObj.name} High-Yield Ecosystem`
                : 'Frankfurt High-Yield Ecosystem';

              const defaultFrankfurtBrief = `### 🏛️ Executive Strategic Memorandum: Frankfurt High-Yield University & Visa Ecosystem

**Target Jurisdiction:** Frankfurt am Main, Hesse & Rhine-Main Metropolitan Region, Germany  
**Institutional Focus:** Applied Sciences (*Fachhochschule*), TU9 State Research Universities, Blocked Account Specialists & EU Relocation Agencies

---

#### 📊 1. Market Overview
- **Continental Financial Hub:** Frankfurt am Main hosts Europe's premier financial apparatus alongside 45+ accredited higher education faculties offering high-capacity English-taught degree programs.
- **Tuition & Commission Architecture:** International student recruitment contracts average **18% to 25% commissions** (**€1,800 – €3,400+ per enrolled student**), yielding industry-leading institutional margins.
- **Relocation Ecosystem Integration:** Direct integration with certified blocked account and health insurance providers (**Expatrio, Fintiba, Coracle**) expedites the mandatory **€11,904/year** German visa living cost guarantee.

#### 🎓 2. Institutional Eligibility
- **Academic Accreditation:** Degrees must possess recognized Anabin *H+* accreditation status with minimum 2.5 German GPA equivalency (~70%+ equivalent).
- **Language Pre-requisites:** Minimum IELTS 6.5 (or CEFR B2 equivalent) for international tracks; TestDaF 4x4 or Goethe-Zertifikat B2 for German-medium courses.
- **Admissions Verification:** Pre-screened APS certification and direct transcript verification required prior to unconditional enrollment.

#### 💡 3. Strategic Advice
- **Priority MoUs:** Target private applied sciences faculties and state universities offering conditional offer turnaround within 5 to 10 working days.
- **Payment Milestones:** Contract a 50/50 bilateral disbursement schedule (50% on visa clearance, 50% post-census enrollment) with multi-year renewals.
- **Integrated Student Bundling:** Package admissions applications with blocked accounts and accommodation verification to accelerate visa issuance rates.`;

              const activeReportContent = latestAssistantReport ? latestAssistantReport.content : defaultFrankfurtBrief;

              return (
                <div style={{ margin: '0.65rem 1.25rem 0 1.25rem' }}>
                  {/* Clean Single-Line Collapsible Accordion Toggle */}
                  <div
                    id="tieup-ai-memorandum-toggle-strip"
                    onClick={() => setIsReportExpanded(!isReportExpanded)}
                    style={{
                      padding: '0.45rem 0.95rem',
                      borderRadius: '0.6rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-medium)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'all 0.15s ease',
                      userSelect: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-secondary)';
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--bg-card)';
                      e.currentTarget.style.borderColor = 'var(--border-medium)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', overflow: 'hidden' }}>
                      <Sparkles size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                        AI Resource Intelligence Memorandum: {jurisdictionLabel}
                      </span>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 500,
                          color: isReportExpanded ? 'var(--text-muted)' : 'var(--accent-primary)',
                          background: isReportExpanded ? 'transparent' : 'var(--accent-gradient-subtle)',
                          padding: isReportExpanded ? '0' : '0.08rem 0.45rem',
                          borderRadius: '0.35rem',
                          border: isReportExpanded ? 'none' : '1px solid var(--border-subtle)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isReportExpanded ? '(Click to Collapse)' : '(Click to Expand)'}
                      </span>
                      <span
                        style={{
                          fontSize: '0.66rem',
                          fontWeight: 600,
                          padding: '0.08rem 0.42rem',
                          borderRadius: '9999px',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border-subtle)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {getIlaModelDisplayName()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                      {isReportExpanded && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyText(activeReportContent, 'ai_report_main');
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '0.35rem',
                            background: copiedId === 'ai_report_main' ? 'var(--success-bg)' : 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            color: copiedId === 'ai_report_main' ? 'var(--success)' : 'var(--text-main)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                          title="Copy entire AI report to clipboard"
                        >
                          {copiedId === 'ai_report_main' ? <Check size={11} /> : <Copy size={11} />}
                          <span>{copiedId === 'ai_report_main' ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                      <ChevronDown
                        size={15}
                        color="var(--text-muted)"
                        style={{
                          transform: isReportExpanded ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.15s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Expandable Structured Content Right Above Main Result Tables */}
                  {isReportExpanded && (
                    <div
                      style={{
                        marginTop: '0.45rem',
                        padding: '1rem 1.25rem',
                        maxHeight: '380px',
                        overflowY: 'auto',
                        fontSize: '0.84rem',
                        lineHeight: '1.6',
                        color: 'var(--text-main)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '0.65rem',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}
                    >
                      {/* Structured Quick-Glance Points Strip */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.65rem' }}>
                        <div style={{ padding: '0.65rem 0.8rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>📊 1. Market Overview</span>
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-main)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                            Frankfurt & Rhine-Main Hub • <strong>18%–25% Commissions</strong> (€1,800–€3,400 yield per student).
                          </div>
                        </div>

                        <div style={{ padding: '0.65rem 0.8rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>🎓 2. Institutional Eligibility</span>
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-main)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                            Min <strong>2.5 German GPA</strong> (~70%+) • IELTS 6.5+ • <strong>Anabin H+</strong> State Accreditation.
                          </div>
                        </div>

                        <div style={{ padding: '0.65rem 0.8rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>💡 3. Strategic Advice</span>
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-main)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                            Fast-track Conditional MoUs • <strong>50/50 Milestone Payouts</strong> • Visa Escrow Bundling.
                          </div>
                        </div>
                      </div>

                      {isSearching && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0', color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 600 }}>
                          <Loader2 size={15} className="animate-spin" />
                          <span>AI Grounding Engine is researching verified leads and synthesizing bilateral terms...</span>
                        </div>
                      )}

                      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem' }}>
                        <MarkdownRenderer content={activeReportContent} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 3. CONSOLIDATED UNIFIED SLEEK FLOATING TOOLBAR */}
            <div
              id="tieup-unified-floating-toolbar"
              style={{
                margin: '0.75rem 1.25rem 0 1.25rem',
                padding: '0.55rem 0.95rem',
                borderRadius: '0.75rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.65rem',
              }}
            >
              {/* Left Group: Select All, Save to Resources & Consolidated Filter Criteria Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                {/* Select All Checkbox */}
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sortedSessionLeads.length > 0 && selectedLeadIds.size === sortedSessionLeads.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLeadIds(new Set(sortedSessionLeads.map((l) => l.id)));
                      } else {
                        setSelectedLeadIds(new Set());
                      }
                    }}
                    style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                  />
                  <span>Select All ({sortedSessionLeads.length})</span>
                </label>

                {/* Full Screen Toggle Button placed right before Save to Resources */}
                {renderFullScreenButton('tieup-chat-fullscreen-toggle-btn')}

                {/* Save Button directly to categorized Resources (Manual Selection Enforced) */}
                <button
                  type="button"
                  id="tieup-chat-save-to-resources-btn"
                  onClick={() => handleSaveLeadsToResources()}
                  disabled={selectedLeadIds.size === 0}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.38rem 0.85rem',
                    borderRadius: '0.5rem',
                    background: selectedLeadIds.size > 0 ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    border: selectedLeadIds.size > 0 ? 'none' : '1px solid var(--border-medium)',
                    color: selectedLeadIds.size > 0 ? '#ffffff' : 'var(--text-subtle)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: selectedLeadIds.size === 0 ? 'not-allowed' : 'pointer',
                    boxShadow: selectedLeadIds.size > 0 ? 'var(--shadow-sm)' : 'none',
                    opacity: selectedLeadIds.size === 0 ? 0.65 : 1,
                    transition: 'all 0.15s ease',
                  }}
                  title={selectedLeadIds.size > 0 ? `Save ${selectedLeadIds.size} selected lead(s) into categorized Resources` : 'Select specific leads from the table to save to Resources'}
                >
                  <Database size={13} />
                  <span>{selectedLeadIds.size > 0 ? `Save Selected (${selectedLeadIds.size}) to Resources` : 'Save to Resources'}</span>
                </button>

                {/* Consolidated Filter Criteria Single Dropdown Popover */}
                <div ref={toolbarFilterRef} style={{ position: 'relative', display: 'inline-block' }}>
                  <button
                    type="button"
                    onClick={() => setIsToolbarFilterOpen((prev) => !prev)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.38rem 0.85rem',
                      borderRadius: '0.5rem',
                      background: isToolbarFilterOpen || activeAcademicFilterCount > 0 ? 'var(--dropdown-item-selected)' : 'var(--bg-secondary)',
                      border: activeAcademicFilterCount > 0 ? '1px solid var(--accent-primary)' : '1px solid var(--border-medium)',
                      color: activeAcademicFilterCount > 0 ? 'var(--accent-primary)' : 'var(--text-main)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title="Filter leads by academic requirements, language, and commission"
                  >
                    <Filter size={13} color={activeAcademicFilterCount > 0 ? 'var(--accent-primary)' : 'currentColor'} />
                    <span>Filter Criteria</span>
                    {activeAcademicFilterCount > 0 && (
                      <span
                        style={{
                          background: 'var(--accent-primary)',
                          color: '#ffffff',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '0.05rem 0.4rem',
                          borderRadius: '9999px',
                        }}
                      >
                        {activeAcademicFilterCount}
                      </span>
                    )}
                    <ChevronDown
                      size={13}
                      style={{
                        transform: isToolbarFilterOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </button>

                  {/* Popover Menu for Consolidated Filter Dropdown */}
                  {isToolbarFilterOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0,
                        zIndex: 60,
                        minWidth: '290px',
                        background: 'var(--dropdown-bg)',
                        border: '1px solid var(--dropdown-border)',
                        borderRadius: '0.75rem',
                        boxShadow: 'var(--dropdown-shadow)',
                        padding: '0.9rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header with Reset Action */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.45rem' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          Filter Criteria
                        </span>
                        {activeAcademicFilterCount > 0 && (
                          <button
                            type="button"
                            onClick={handleClearAcademicFilters}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              padding: '0.2rem 0.45rem',
                              borderRadius: '0.35rem',
                              background: 'var(--bg-tertiary)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-subtle)',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            <RotateCcw size={11} />
                            <span>Reset All</span>
                          </button>
                        )}
                      </div>

                      {/* IELTS Requirement */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          IELTS Requirement
                        </label>
                        <select
                          value={ieltsFilter}
                          onChange={(e) => setIeltsFilter(e.target.value as any)}
                          style={{
                            width: '100%',
                            padding: '0.38rem 0.6rem',
                            borderRadius: '0.45rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-medium)',
                            color: 'var(--text-main)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="all">Any IELTS Score</option>
                          <option value="5.5">≤ 5.5 (Low / Foundation)</option>
                          <option value="6.0">≤ 6.0 (Standard Direct)</option>
                          <option value="6.5">≤ 6.5 (Competitive Entry)</option>
                          <option value="7.0">≤ 7.0 (Strict / Ivy Track)</option>
                        </select>
                      </div>

                      {/* German Language Level */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          German Language Proficiency
                        </label>
                        <select
                          value={germanLevelFilter}
                          onChange={(e) => setGermanLevelFilter(e.target.value as any)}
                          style={{
                            width: '100%',
                            padding: '0.38rem 0.6rem',
                            borderRadius: '0.45rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-medium)',
                            color: 'var(--text-main)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="all">Any German Requirement</option>
                          <option value="none">English Only (No German Required)</option>
                          <option value="a1_a2">A1 - A2 (Basic Elementary)</option>
                          <option value="b1_b2">B1 - B2 (Intermediate Working)</option>
                          <option value="c1">C1 / TestDaF (Full Academic)</option>
                        </select>
                      </div>

                      {/* Scholarship Availability */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          Scholarship Status
                        </label>
                        <select
                          value={scholarshipFilter}
                          onChange={(e) => setScholarshipFilter(e.target.value as any)}
                          style={{
                            width: '100%',
                            padding: '0.38rem 0.6rem',
                            borderRadius: '0.45rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-medium)',
                            color: 'var(--text-main)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="all">All Institutions</option>
                          <option value="available">🎓 Verified Scholarships Available Only</option>
                        </select>
                      </div>

                      {/* High-Profile Commission (≥20%) */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.4rem', borderTop: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          High-Profile Commission (≥20%)
                        </span>
                        <input
                          type="checkbox"
                          checked={minCommissionFilter === '20'}
                          onChange={(e) => setMinCommissionFilter(e.target.checked ? '20' : 'all')}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Group: Sort & View Switcher (Rows vs Cards) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-main)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    borderRadius: '0.45rem',
                    padding: '0.3rem 0.55rem',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="profit_desc">💰 Highest Commission</option>
                  <option value="compatibility_desc">🎯 Highest Fit</option>
                  <option value="name_asc">🏷️ Name (A - Z)</option>
                  <option value="date_desc">🕒 Recently Added</option>
                </select>

                {/* View Switcher: Table vs Cards */}
                <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', borderRadius: '0.45rem', padding: '0.12rem' }}>
                  <button
                    type="button"
                    onClick={() => setHomeViewMode('table')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.55rem',
                      borderRadius: '0.35rem',
                      background: homeViewMode === 'table' ? 'var(--accent-primary)' : 'transparent',
                      color: homeViewMode === 'table' ? '#ffffff' : 'var(--text-muted)',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title="Compact Row/Table View"
                  >
                    <List size={13} />
                    <span>Rows</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHomeViewMode('grid')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.55rem',
                      borderRadius: '0.35rem',
                      background: homeViewMode === 'grid' ? 'var(--accent-primary)' : 'transparent',
                      color: homeViewMode === 'grid' ? '#ffffff' : 'var(--text-muted)',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title="Grid Card View"
                  >
                    <LayoutGrid size={13} />
                    <span>Cards</span>
                  </button>
                </div>

                {/* Global Settings & Saved Lists Button */}
                {renderSettingsButton()}
              </div>
            </div>

            {/* Sandbox Test Mode Injected Notice */}
            {sandboxNotice && (
              <div
                style={{
                  margin: '0.5rem 1.25rem 0 1.25rem',
                  padding: '0.65rem 1rem',
                  borderRadius: '0.65rem',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.45)',
                  color: 'var(--text-main)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={16} color="#10b981" />
                  <span>{sandboxNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSandboxNotice(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.2rem',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Save Notice */}
            {saveToResourcesNotice && (
              <div
                style={{
                  margin: '0.5rem 1.25rem 0 1.25rem',
                  padding: '0.55rem 0.95rem',
                  borderRadius: '0.55rem',
                  background: 'var(--success-bg)',
                  border: '1px solid var(--success)',
                  color: 'var(--success)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <CheckCircle2 size={16} />
                <span>{saveToResourcesNotice}</span>
              </div>
            )}

            {/* 4. RESTRUCTURED RESULT TABLE / ROW FORMAT (Clean, Scannable & Compact) */}
            <div style={{ padding: '0.75rem 1.25rem 1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sortedSessionLeads.length === 0 ? (
                <div
                  style={{
                    padding: '3rem 1.5rem',
                    textAlign: 'center',
                    background: 'var(--bg-card)',
                    border: '1px dashed var(--border-medium)',
                    borderRadius: '0.75rem',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <Building2 size={40} color="var(--text-subtle)" style={{ margin: '0 auto 0.75rem auto' }} />
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.35rem 0' }}>
                    No Matching Prospects Found
                  </h4>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 1rem auto' }}>
                    No leads match your current criteria in this thread. Try clearing filters or running a targeted search query.
                  </p>
                  {activeAcademicFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAcademicFilters}
                      style={{
                        padding: '0.45rem 1rem',
                        borderRadius: '0.5rem',
                        background: 'var(--accent-primary)',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Clear Criteria Filters
                    </button>
                  )}
                </div>
              ) : homeViewMode === 'table' ? (
                /* Compact Row-by-Row Result Table matching Resources layout */
                <div
                  id="tieup-chat-home-table-container"
                  style={{
                    overflowX: 'auto',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border-medium)',
                    background: 'var(--bg-card)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '980px' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-medium)' }}>
                        <th style={{ padding: '0.65rem 0.75rem', width: '38px' }}>
                          <input
                            type="checkbox"
                            checked={sortedSessionLeads.length > 0 && selectedLeadIds.size === sortedSessionLeads.length}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedLeadIds(new Set(sortedSessionLeads.map((l) => l.id)));
                              else setSelectedLeadIds(new Set());
                            }}
                            style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                          />
                        </th>
                        <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Institution Name & Location
                        </th>
                        <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                          Language & Academic Requirements
                        </th>
                        <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                          Scholarship Availability
                        </th>
                        <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase' }}>
                          Commission / Margin
                        </th>
                        <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Programs & Terms
                        </th>
                        <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSessionLeads.map((lead) => {
                        const isVerified = lead.antiSpamStatus === 'verified';
                        const isPartner = lead.isPartner === true;
                        const isSelected = selectedLeadIds.has(lead.id);
                        const hasDirectUrl = isValidDirectUrl(lead.directSourcePageUrl);
                        const hasWebsite = isValidDirectUrl(lead.websiteUrl);

                        return (
                          <tr
                            key={lead.id}
                            style={{
                              borderBottom: '1px solid var(--border-subtle)',
                              background: isPartner ? 'var(--success-bg)' : isSelected ? 'var(--accent-gradient-subtle)' : 'transparent',
                              transition: 'background 0.15s ease',
                            }}
                          >
                            {/* Checkbox */}
                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const next = new Set(selectedLeadIds);
                                  if (e.target.checked) next.add(lead.id);
                                  else next.delete(lead.id);
                                  setSelectedLeadIds(next);
                                }}
                                style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                              />
                            </td>

                            {/* Institution Name & Location (Location placed directly underneath Name as subtitle) */}
                            <td style={{ padding: '0.75rem 0.85rem', maxWidth: '280px' }}>
                              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.3 }}>
                                {lead.name}
                              </div>
                              {/* Subtitle: Location / City */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                <MapPin size={12} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                                <span>{lead.region || lead.locationMain || lead.country || 'Location Not Specified'}</span>
                              </div>
                              {/* Official Portal / Source */}
                              <div style={{ marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                                {hasWebsite ? (
                                  <a
                                    href={lead.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      fontSize: '0.76rem',
                                      color: 'var(--accent-primary)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.2rem',
                                      textDecoration: 'none',
                                      fontWeight: 500,
                                    }}
                                    title={`Official website: ${lead.websiteUrl}`}
                                  >
                                    <span>{lead.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                                    <ExternalLink size={10} />
                                  </a>
                                ) : (
                                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Website: Not Available</span>
                                )}
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                                  • {lead.category}
                                </span>
                              </div>
                              {/* Contact Liaison */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                                <span style={{ fontSize: '0.76rem', color: 'var(--text-main)', fontWeight: 500 }}>
                                  {lead.contactPerson}
                                </span>
                                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                  ({lead.contactEmail})
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    padding: '0.05rem 0.3rem',
                                    borderRadius: '9999px',
                                    background: isVerified ? 'var(--success-bg)' : 'var(--warning-bg)',
                                    color: isVerified ? 'var(--success)' : 'var(--warning)',
                                  }}
                                >
                                  {isVerified ? '✓' : '!'}
                                </span>
                              </div>
                            </td>

                            {/* Language & Academic Requirements */}
                            <td style={{ padding: '0.75rem 0.85rem', maxWidth: '180px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.12rem 0.45rem',
                                    borderRadius: '0.35rem',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-medium)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    width: 'fit-content',
                                  }}
                                >
                                  <span>Min IELTS: ≤ {lead.minIeltsScore ?? 6.0}</span>
                                </span>
                                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                  German: {lead.germanLevelRequired || 'None (English taught)'}
                                </span>
                              </div>
                            </td>

                            {/* Scholarship Availability: Strict Verification */}
                            <td style={{ padding: '0.75rem 0.85rem', maxWidth: '170px' }}>
                              {lead.scholarshipAvailable ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      padding: '0.12rem 0.45rem',
                                      borderRadius: '9999px',
                                      background: 'var(--success-bg)',
                                      border: '1px solid var(--success)',
                                      color: 'var(--success)',
                                      fontSize: '0.78rem',
                                      fontWeight: 600,
                                      width: 'fit-content',
                                    }}
                                  >
                                    <span>🎓 Yes</span>
                                  </span>
                                  {hasDirectUrl ? (
                                    <a
                                      href={lead.directSourcePageUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        fontSize: '0.74rem',
                                        color: 'var(--accent-primary)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.2rem',
                                        marginTop: '0.15rem',
                                        textDecoration: 'none',
                                        fontWeight: 500,
                                      }}
                                      title="Inspect exact verified scholarship page"
                                    >
                                      <span>Direct Policy Page</span>
                                      <ExternalLink size={10} />
                                    </a>
                                  ) : (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                      Policy Link: Not Available
                                    </span>
                                  )}
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '0.1rem', lineHeight: 1.3 }}>
                                    {lead.scholarshipDetails || 'Merit scholarships available'}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None</span>
                              )}
                            </td>

                            {/* Commission / Profit Margin: Strict Verification */}
                            <td style={{ padding: '0.75rem 0.85rem', maxWidth: '170px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.15rem 0.55rem',
                                    borderRadius: '9999px',
                                    background: (lead.commissionPercent || 20) >= 20 ? 'var(--success-bg)' : 'var(--accent-gradient-subtle)',
                                    border: (lead.commissionPercent || 20) >= 20 ? '1px solid var(--success)' : '1px solid var(--border-medium)',
                                    color: (lead.commissionPercent || 20) >= 20 ? 'var(--success)' : 'var(--accent-primary)',
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    width: 'fit-content',
                                  }}
                                >
                                  <span>💰 {lead.commissionPercent || 20}%</span>
                                </span>
                                {hasDirectUrl ? (
                                  <a
                                    href={lead.directSourcePageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      fontSize: '0.74rem',
                                      color: 'var(--success)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.2rem',
                                      marginTop: '0.15rem',
                                      textDecoration: 'none',
                                      fontWeight: 500,
                                    }}
                                    title="Inspect exact verified commission terms"
                                  >
                                    <span>Direct Terms Page</span>
                                    <ExternalLink size={10} />
                                  </a>
                                ) : (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                    Terms Link: Not Available
                                  </span>
                                )}
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '0.1rem' }}>
                                  {lead.tuitionFeeYearly || '€0 (Public)'} • {lead.compatibilityScore || 92}% Fit
                                </div>
                              </div>
                            </td>

                            {/* Programs & Terms */}
                            <td style={{ padding: '0.65rem 0.75rem', maxWidth: '220px' }}>
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.35, fontWeight: 600 }}>
                                {lead.termsSummary || lead.termsOfPartnership}
                              </div>
                              {lead.courseList && lead.courseList.length > 0 && (
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                                  {lead.courseList.slice(0, 2).map((course, cIdx) => (
                                    <span key={cIdx} style={{ padding: '0.04rem 0.32rem', borderRadius: '0.25rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                                      {course}
                                    </span>
                                  ))}
                                  {lead.courseList.length > 2 && (
                                    <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>+{lead.courseList.length - 2} more</span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenTermsModal(lead)}
                                  style={{
                                    padding: '0.32rem 0.55rem',
                                    borderRadius: '0.45rem',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-medium)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                  title="View Bilateral MOU Preview"
                                >
                                  MOU
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSaveLeadsToResources([lead.id])}
                                  style={{
                                    padding: '0.32rem 0.55rem',
                                    borderRadius: '0.45rem',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-medium)',
                                    color: 'var(--accent-primary)',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.2rem',
                                  }}
                                  title="Save directly to categorized Resources"
                                >
                                  <Database size={12} />
                                  <span>Save</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSendTestOutreach(lead)}
                                  style={{
                                    padding: '0.32rem 0.55rem',
                                    borderRadius: '0.45rem',
                                    background: 'var(--accent-gradient-subtle)',
                                    border: '1px solid var(--border-medium)',
                                    color: 'var(--accent-primary)',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.2rem',
                                  }}
                                  title="Initiate Multi-Stage B2B Outreach"
                                >
                                  <SendHorizontal size={12} />
                                  <span>Outreach</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleTogglePartner(lead)}
                                  style={{
                                    padding: '0.32rem 0.6rem',
                                    borderRadius: '0.45rem',
                                    background: isPartner ? 'var(--error-bg)' : 'var(--success-bg)',
                                    border: isPartner ? '1px solid var(--error)' : '1px solid var(--success)',
                                    color: isPartner ? 'var(--error)' : 'var(--success)',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {isPartner ? 'Revoke' : 'Tie-up'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteChatLead(lead)}
                                  style={{
                                    padding: '0.32rem 0.45rem',
                                    borderRadius: '0.45rem',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-medium)',
                                    color: 'var(--text-subtle)',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                  title="Remove from Chat Session"
                                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-subtle)')}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Card Grid View */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '0.85rem' }}>
                  {sortedSessionLeads.map((lead) => {
                    const isVerified = lead.antiSpamStatus === 'verified';
                    const isPartner = lead.isPartner === true;
                    const isSelected = selectedLeadIds.has(lead.id);
                    const websiteUrl = lead.websiteUrl || lead.directSourcePageUrl || '#';
                    const scholarshipLink = lead.directSourcePageUrl || lead.websiteUrl || '#';
                    const commissionLink = lead.directSourcePageUrl || lead.websiteUrl || '#';

                    return (
                      <div
                        key={lead.id}
                        className="interactive-card"
                        style={{
                          background: isPartner ? 'var(--success-bg)' : 'var(--bg-card)',
                          border: isPartner ? '1px solid var(--success)' : isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-medium)',
                          borderRadius: '0.75rem',
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.65rem',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        {/* Header: Select Checkbox, Category & Commission */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const next = new Set(selectedLeadIds);
                                if (e.target.checked) next.add(lead.id);
                                else next.delete(lead.id);
                                setSelectedLeadIds(next);
                              }}
                              style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                              {lead.category}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <a
                              href={commissionLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '0.15rem 0.55rem',
                                borderRadius: '9999px',
                                background: (lead.commissionPercent || 20) >= 20 ? 'var(--success-bg)' : 'var(--accent-gradient-subtle)',
                                border: (lead.commissionPercent || 20) >= 20 ? '1px solid var(--success)' : '1px solid var(--border-medium)',
                                color: (lead.commissionPercent || 20) >= 20 ? 'var(--success)' : 'var(--accent-primary)',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                textDecoration: 'none',
                              }}
                              title="Commission & Profit Margin source"
                            >
                              <span>💰 {lead.commissionPercent || 20}%</span>
                              <ExternalLink size={10} />
                            </a>

                            {isPartner && (
                              <span style={{ padding: '0.1rem 0.45rem', borderRadius: '9999px', background: 'var(--success-bg)', color: 'var(--success)', fontSize: '0.72rem', fontWeight: 800 }}>
                                PARTNER
                              </span>
                            )}
                          </div>
                        </div>

                        {/* College Name & Website Link */}
                        <div>
                          <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {lead.name}
                          </div>
                          <a
                            href={websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '0.78rem',
                              color: 'var(--accent-primary)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              textDecoration: 'none',
                              marginTop: '0.15rem',
                              fontWeight: 600,
                            }}
                          >
                            <span>{lead.websiteUrl ? lead.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '') : 'Official Website'}</span>
                            <ExternalLink size={10} />
                          </a>
                        </div>

                        {/* Location & Decision Maker */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <MapPin size={12} color="var(--accent-primary)" />
                            <span>{lead.locationMain} ({lead.country})</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Mail size={12} color={isVerified ? 'var(--success)' : 'var(--warning)'} />
                            <span>{lead.contactPerson} ({lead.contactEmail})</span>
                          </div>
                        </div>

                        {/* Academic Requirements & Clickable Scholarship */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', padding: '0.4rem 0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-subtle)', fontSize: '0.78rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            IELTS ≤ {lead.minIeltsScore ?? 6.0} • {lead.germanLevelRequired || 'English'}
                          </span>
                          <div>
                            {lead.scholarshipAvailable ? (
                              <a
                                href={scholarshipLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  color: 'var(--accent-primary)',
                                  fontWeight: 700,
                                  textDecoration: 'underline',
                                }}
                              >
                                <span>🎓 Scholarship: Yes</span>
                                <ExternalLink size={10} />
                              </a>
                            ) : (
                              <span style={{ color: 'var(--text-subtle)' }}>Scholarship: None</span>
                            )}
                          </div>
                        </div>

                        {/* Terms Summary */}
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', background: 'var(--accent-gradient-subtle)', border: '1px solid var(--border-subtle)', padding: '0.45rem 0.65rem', borderRadius: '0.5rem', lineHeight: '1.35' }}>
                          <strong style={{ color: 'var(--accent-primary)' }}>Terms:</strong> {lead.termsOfPartnership || lead.termsSummary}
                        </div>

                        {/* Card Actions */}
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', paddingTop: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenTermsModal(lead)}
                            style={{
                              flex: 1,
                              padding: '0.38rem 0.6rem',
                              borderRadius: '0.45rem',
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-main)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            MOU
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSaveLeadsToResources([lead.id])}
                            style={{
                              padding: '0.38rem 0.65rem',
                              borderRadius: '0.45rem',
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-medium)',
                              color: 'var(--accent-primary)',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <Database size={12} />
                            <span>Save</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendTestOutreach(lead)}
                            style={{
                              padding: '0.38rem 0.65rem',
                              borderRadius: '0.45rem',
                              background: 'var(--accent-gradient-subtle)',
                              border: '1px solid var(--border-medium)',
                              color: 'var(--accent-primary)',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <SendHorizontal size={12} />
                            <span>Outreach</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleTogglePartner(lead)}
                            style={{
                              padding: '0.38rem 0.7rem',
                              borderRadius: '0.45rem',
                              background: isPartner ? 'var(--error-bg)' : 'var(--success-bg)',
                              border: isPartner ? '1px solid var(--error)' : '1px solid var(--success)',
                              color: isPartner ? 'var(--error)' : 'var(--success)',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {isPartner ? 'Revoke' : 'Tie-up'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteChatLead(lead)}
                            style={{
                              padding: '0.38rem 0.55rem',
                              borderRadius: '0.45rem',
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-medium)',
                              color: 'var(--text-subtle)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Remove from Chat Session"
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-subtle)')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* 3. PAGE 2: RESOURCES (MASTER DATABASE ACROSS ALL SESSIONS & ANTI-THEFT SHIELD) */}
      {activeMainTab === 'resources' && (
        <div
          id="tieup-resources-tab-view"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            padding: '1.25rem',
            gap: '0.85rem',
          }}
        >
          {/* Structured 2-Line Toolbar: Line 1 Universal Filter Bar | Line 2 Action Buttons */}
          <div
            id="tieup-resources-toolbar"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: '0.75rem',
              padding: '0.75rem 0.9rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* Line 1 - Universal Filter Bar */}
            <div
              id="tieup-resources-universal-filter-bar"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                flexWrap: 'wrap',
              }}
            >
              {/* Search Input - Optimized reduced length */}
              <div style={{ position: 'relative', flex: '0 1 200px', minWidth: '160px', maxWidth: '220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                <input
                  type="text"
                  value={tableSearchFilter}
                  onChange={(e) => setTableSearchFilter(e.target.value)}
                  placeholder="Search leads..."
                  style={{
                    width: '100%',
                    padding: '0.42rem 0.75rem 0.42rem 2.1rem',
                    borderRadius: '0.5rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-main)',
                    fontSize: '0.84rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* 1. All Geography */}
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                style={{
                  padding: '0.42rem 0.75rem',
                  borderRadius: '0.5rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-main)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
                title="Filter by Geography / Target Country"
              >
                <option value="all" style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>All Geography</option>
                {TARGET_COUNTRIES.map((c) => (
                  <option key={c.id} value={c.name} style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>{c.name}</option>
                ))}
              </select>

              {/* 2. All Category */}
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setSubCategoryFilter('all');
                }}
                style={{
                  padding: '0.42rem 0.75rem',
                  borderRadius: '0.5rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-main)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
                title="Filter by Category"
              >
                <option value="all" style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>All Category</option>
                {TIEUP_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.name} style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>{c.name}</option>
                ))}
              </select>

              {/* 3. All Sub-Category */}
              <select
                value={subCategoryFilter}
                onChange={(e) => setSubCategoryFilter(e.target.value)}
                style={{
                  padding: '0.42rem 0.75rem',
                  borderRadius: '0.5rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-main)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                  maxWidth: '185px',
                }}
                title="Filter by Specialized Sub-Category Track"
              >
                <option value="all" style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>All Sub-Category</option>
                {availableSubCategories.map((sc) => (
                  <option key={sc.id} value={sc.name} style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>
                    {sc.name}
                  </option>
                ))}
              </select>

              {/* 4. All Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{
                  padding: '0.42rem 0.75rem',
                  borderRadius: '0.5rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-main)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
                title="Filter by Deliverability / Verification Status"
              >
                <option value="all" style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>All Status</option>
                <option value="verified" style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>Verified Direct Only</option>
                <option value="flagged_generic" style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>Generic Flagged Only</option>
              </select>

              {/* 5. Unified "Sort By" Filter Dropdown */}
              <div ref={resourcesSortFilterRef} style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  type="button"
                  id="tieup-resources-sort-by-btn"
                  onClick={() => setIsResourcesSortFilterOpen((prev) => !prev)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.42rem 0.85rem',
                    borderRadius: '0.5rem',
                    background: isResourcesSortFilterOpen || activeAcademicFilterCount > 0 ? 'var(--dropdown-item-selected)' : 'var(--bg-secondary)',
                    border: activeAcademicFilterCount > 0 ? '1px solid var(--accent-primary)' : '1px solid var(--border-medium)',
                    color: activeAcademicFilterCount > 0 ? 'var(--accent-primary)' : 'var(--text-main)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  title="Consolidated Sort & Secondary Filters (Compatibility, Bands, Levels, Tuition, Scholarships, Commission)"
                >
                  <Sliders size={14} color={activeAcademicFilterCount > 0 ? 'var(--accent-primary)' : 'currentColor'} />
                  <span>Sort By</span>
                  {activeAcademicFilterCount > 0 && (
                    <span
                      style={{
                        background: 'var(--accent-primary)',
                        color: '#ffffff',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '0.05rem 0.4rem',
                        borderRadius: '9999px',
                      }}
                    >
                      {activeAcademicFilterCount}
                    </span>
                  )}
                  <ChevronDown
                    size={13}
                    style={{
                      transform: isResourcesSortFilterOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>

                {isResourcesSortFilterOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      zIndex: 60,
                      width: '320px',
                      maxWidth: '90vw',
                      background: 'var(--dropdown-bg)',
                      border: '1px solid var(--dropdown-border)',
                      borderRadius: '0.75rem',
                      boxShadow: 'var(--dropdown-shadow)',
                      padding: '0.9rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header with Reset All */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.45rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Filter size={13} color="var(--accent-primary)" />
                        <span>Sort & Secondary Filters</span>
                      </span>
                      {(activeAcademicFilterCount > 0 || sortBy !== 'profit_desc') && (
                        <button
                          type="button"
                          onClick={() => {
                            handleClearAcademicFilters();
                            setSortBy('profit_desc');
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            padding: '0.2rem 0.45rem',
                            borderRadius: '0.35rem',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-subtle)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <RotateCcw size={11} />
                          <span>Reset All</span>
                        </button>
                      )}
                    </div>

                    {/* 1. Sort Order Criteria */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        Sort Order
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        style={{
                          width: '100%',
                          padding: '0.38rem 0.6rem',
                          borderRadius: '0.45rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-medium)',
                          color: 'var(--text-main)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="profit_desc">💰 Highest Profit Margin / Comm. (Default)</option>
                        <option value="compatibility_desc">🎯 Highest Policy Compatibility</option>
                        <option value="name_asc">🏷️ Name (A - Z)</option>
                        <option value="date_desc">🕒 Recently Discovered</option>
                      </select>
                    </div>

                    {/* 2. Policy Compatibility (Absorbed from primary toolbar) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          Policy Fit / Compatibility
                        </label>
                        {compatibilityFilter !== 'all' && (
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                            Active ({compatibilityFilter === '90' ? '≥ 90%' : '≥ 80%'})
                          </span>
                        )}
                      </div>
                      <select
                        value={compatibilityFilter}
                        onChange={(e) => setCompatibilityFilter(e.target.value as any)}
                        style={{
                          width: '100%',
                          padding: '0.38rem 0.6rem',
                          borderRadius: '0.45rem',
                          background: 'var(--bg-secondary)',
                          border: compatibilityFilter !== 'all' ? '1px solid var(--accent-primary)' : '1px solid var(--border-medium)',
                          color: 'var(--text-main)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="all">Any Compatibility / Fit</option>
                        <option value="90">🎯 High Fit (≥ 90%)</option>
                        <option value="80">✨ Standard Fit (≥ 80%)</option>
                      </select>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.45rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Academic Admission Criteria
                      </div>

                      {/* 2. Minimum IELTS Band */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          IELTS Requirement (All Bands)
                        </label>
                        <select
                          value={ieltsFilter}
                          onChange={(e) => setIeltsFilter(e.target.value as any)}
                          style={{
                            width: '100%',
                            padding: '0.35rem 0.6rem',
                            borderRadius: '0.45rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-medium)',
                            color: 'var(--text-main)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="all">All Bands</option>
                          <option value="5.5">IELTS ≤ 5.5 (Low Barrier)</option>
                          <option value="6.0">IELTS ≤ 6.0 (Standard Direct)</option>
                          <option value="6.5">IELTS ≤ 6.5 (Selective Entry)</option>
                          <option value="7.0">IELTS ≤ 7.0 (Strict / Ivy)</option>
                        </select>
                      </div>

                      {/* 3. German Language Level */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          German Language Level (All Levels)
                        </label>
                        <select
                          value={germanLevelFilter}
                          onChange={(e) => setGermanLevelFilter(e.target.value as any)}
                          style={{
                            width: '100%',
                            padding: '0.35rem 0.6rem',
                            borderRadius: '0.45rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-medium)',
                            color: 'var(--text-main)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="all">All Levels</option>
                          <option value="none">English Only (No German)</option>
                          <option value="a1_a2">A1 - A2 (Beginner)</option>
                          <option value="b1_b2">B1 - B2 (Intermediate)</option>
                          <option value="c1">C1 / TestDaF (Native / Fluent)</option>
                        </select>
                      </div>

                      {/* 4. Tuition Fee Tier */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          Tutor / Tuition Tiers
                        </label>
                        <select
                          value={tuitionFilter}
                          onChange={(e) => setTuitionFilter(e.target.value as any)}
                          style={{
                            width: '100%',
                            padding: '0.35rem 0.6rem',
                            borderRadius: '0.45rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-medium)',
                            color: 'var(--text-main)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="all">Any Tuition Tier</option>
                          <option value="free">€0 Public Tuition (Semester Fee Only)</option>
                          <option value="low">Low-Fee (&lt; €5,000/yr)</option>
                          <option value="private">Private / Elite (≥ €5,000/yr)</option>
                        </select>
                      </div>

                      {/* 5. Scholarships Availability */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          Scholarships / All Institutions
                        </label>
                        <select
                          value={scholarshipFilter}
                          onChange={(e) => setScholarshipFilter(e.target.value as any)}
                          style={{
                            width: '100%',
                            padding: '0.35rem 0.6rem',
                            borderRadius: '0.45rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-medium)',
                            color: 'var(--text-main)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="all">All Institutions</option>
                          <option value="available">🎓 Scholarships / Fee Discounts Available</option>
                        </select>
                      </div>

                      {/* 6. Commission Rates */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          Commission Rates
                        </label>
                        <select
                          value={minCommissionFilter}
                          onChange={(e) => setMinCommissionFilter(e.target.value as any)}
                          style={{
                            width: '100%',
                            padding: '0.35rem 0.6rem',
                            borderRadius: '0.45rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-medium)',
                            color: 'var(--text-main)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="all">Any Commission</option>
                          <option value="15">≥ 15% Standard</option>
                          <option value="20">≥ 20% High Yield Tier</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Line 2 - Resources Page-Specific Action Buttons */}
            <div
              id="tieup-resources-action-line"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.65rem',
                flexWrap: 'wrap',
                paddingTop: '0.55rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              {/* Left Context / Selection */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                {selectedLeadIds.size > 0 ? (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.28rem 0.65rem',
                      borderRadius: '0.45rem',
                      background: 'var(--dropdown-item-selected)',
                      border: '1px solid var(--accent-primary)',
                      color: 'var(--accent-primary)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    <span>{selectedLeadIds.size} Selected</span>
                    <button
                      type="button"
                      onClick={() => setSelectedLeadIds(new Set())}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '0.74rem',
                        marginLeft: '0.25rem',
                        textDecoration: 'underline',
                      }}
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
                    {filteredResourcesLeads.length} Lead Repository Records
                  </span>
                )}
              </div>

              {/* Right: Cleanly housed Action Buttons: Create Group, Group List, Move to Process, Settings */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
              {/* 1. "Create Group" Action Button (Active when items selected) */}
              <button
                type="button"
                id="tieup-create-group-btn"
                onClick={() => {
                  if (selectedLeadIds.size === 0) {
                    setResourcesNotice({
                      text: 'Please select one or more institutions using the checkboxes first to create a custom group.',
                      type: 'warning',
                    });
                    setTimeout(() => setResourcesNotice(null), 3500);
                    return;
                  }
                  setNewGroupName(`Cohort ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} (${selectedLeadIds.size} Leads)`);
                  setIsCreateGroupModalOpen(true);
                }}
                disabled={selectedLeadIds.size === 0}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.48rem 0.85rem',
                  borderRadius: '0.55rem',
                  background: selectedLeadIds.size > 0 ? 'var(--dropdown-item-selected)' : 'var(--bg-card)',
                  border: selectedLeadIds.size > 0 ? '1px solid var(--accent-primary)' : '1px solid var(--border-medium)',
                  color: selectedLeadIds.size > 0 ? 'var(--accent-primary)' : 'var(--text-subtle)',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: selectedLeadIds.size === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: selectedLeadIds.size > 0 ? 'var(--shadow-sm)' : 'none',
                  opacity: selectedLeadIds.size === 0 ? 0.6 : 1,
                  transition: 'all 0.18s ease',
                  whiteSpace: 'nowrap',
                }}
                title={selectedLeadIds.size > 0 ? `Package ${selectedLeadIds.size} selected institutions into a custom named group` : 'Select records using checkboxes to create a group'}
              >
                <FolderPlus size={14} color={selectedLeadIds.size > 0 ? 'var(--accent-primary)' : 'currentColor'} />
                <span>{selectedLeadIds.size > 0 ? `Create Group (${selectedLeadIds.size})` : 'Create Group'}</span>
              </button>

              {/* 2. "Group List" Dropdown Popover */}
              <div ref={groupListRef} style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  type="button"
                  id="tieup-group-list-btn"
                  onClick={() => setIsGroupListOpen((prev) => !prev)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.48rem 0.85rem',
                    borderRadius: '0.55rem',
                    background: isGroupListOpen ? 'var(--dropdown-item-selected)' : 'var(--bg-card)',
                    border: isGroupListOpen ? '1px solid var(--accent-primary)' : '1px solid var(--border-medium)',
                    color: 'var(--text-main)',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  title="View custom groups and push entire cohorts directly into Process"
                >
                  <Layers size={14} color="var(--accent-primary)" />
                  <span>Group List</span>
                  {resourceGroups.length > 0 && (
                    <span
                      style={{
                        padding: '0.08rem 0.4rem',
                        borderRadius: '0.35rem',
                        background: 'var(--dropdown-item-selected)',
                        color: 'var(--accent-primary)',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                      }}
                    >
                      {resourceGroups.length}
                    </span>
                  )}
                  <ChevronDown
                    size={13}
                    style={{
                      transform: isGroupListOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      color: 'var(--text-muted)',
                    }}
                  />
                </button>

                {isGroupListOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      right: 0,
                      zIndex: 70,
                      width: '360px',
                      maxWidth: '92vw',
                      background: 'var(--dropdown-bg)',
                      border: '1px solid var(--dropdown-border)',
                      borderRadius: '0.75rem',
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45)',
                      padding: '0.9rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.45rem' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Layers size={14} color="var(--accent-primary)" />
                        <span>Custom Resource Groups ({resourceGroups.length})</span>
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Push to Process
                      </span>
                    </div>

                    {resourceGroups.length === 0 ? (
                      <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        <FolderPlus size={24} color="var(--text-subtle)" style={{ margin: '0 auto 0.4rem auto' }} />
                        <div>No custom groups created yet.</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '0.2rem' }}>
                          Select multiple records in Resources and click "Create Group".
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '320px', overflowY: 'auto' }}>
                        {resourceGroups.map((group) => {
                          const groupLeads = allResourcesLeads.filter((l) => group.leadIds.includes(l.id));
                          return (
                            <div
                              key={group.id}
                              style={{
                                padding: '0.65rem 0.75rem',
                                borderRadius: '0.55rem',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-subtle)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.35rem',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                  {group.name}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    padding: '0.08rem 0.35rem',
                                    borderRadius: '0.3rem',
                                    background: 'var(--dropdown-item-selected)',
                                    color: 'var(--accent-primary)',
                                  }}
                                >
                                  {group.leadIds.length} Leads
                                </span>
                              </div>

                              {group.description && (
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                  {group.description}
                                </div>
                              )}

                              {groupLeads.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
                                  {groupLeads.slice(0, 2).map((l) => (
                                    <span
                                      key={l.id}
                                      style={{
                                        fontSize: '0.68rem',
                                        padding: '0.05rem 0.35rem',
                                        borderRadius: '0.25rem',
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-subtle)',
                                        color: 'var(--text-main)',
                                        maxWidth: '140px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {l.name}
                                    </span>
                                  ))}
                                  {groupLeads.length > 2 && (
                                    <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>
                                      +{groupLeads.length - 2} more
                                    </span>
                                  )}
                                </div>
                              )}

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedLeadIds(new Set(group.leadIds));
                                    setIsGroupListOpen(false);
                                    setResourcesNotice({
                                      text: `Selected ${group.leadIds.length} leads from group "${group.name}".`,
                                      type: 'info',
                                    });
                                    setTimeout(() => setResourcesNotice(null), 3500);
                                  }}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--accent-primary)',
                                    fontSize: '0.74rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    padding: 0,
                                  }}
                                >
                                  Select in Table
                                </button>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handlePushGroupToProcess(group);
                                      setIsGroupListOpen(false);
                                    }}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      padding: '0.25rem 0.55rem',
                                      borderRadius: '0.35rem',
                                      background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                                      border: 'none',
                                      color: '#ffffff',
                                      fontSize: '0.74rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)',
                                    }}
                                    title={`Push all ${group.leadIds.length} leads of "${group.name}" to Process Stage`}
                                  >
                                    <SendHorizontal size={11} />
                                    <span>Push to Process</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Delete group "${group.name}"? (Leads will remain in repository)`)) {
                                        handleDeleteGroup(group.id);
                                      }
                                    }}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: 'var(--text-subtle)',
                                      cursor: 'pointer',
                                      padding: '0.2rem',
                                    }}
                                    title="Delete Group"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Prominent "Move to Process" Action Button (Manual Selection Enforced) */}
              <button
                type="button"
                id="tieup-move-to-process-btn"
                onClick={() => handleMoveToProcess()}
                disabled={selectedLeadIds.size === 0}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.48rem 1rem',
                  borderRadius: '0.55rem',
                  background: selectedLeadIds.size > 0
                    ? 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)'
                    : 'var(--bg-card)',
                  border: selectedLeadIds.size > 0
                    ? '1px solid rgba(255, 255, 255, 0.25)'
                    : '1px solid var(--border-medium)',
                  color: selectedLeadIds.size > 0 ? '#ffffff' : 'var(--text-subtle)',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: selectedLeadIds.size === 0 ? 'not-allowed' : 'pointer',
                  opacity: selectedLeadIds.size === 0 ? 0.65 : 1,
                  boxShadow: selectedLeadIds.size > 0 ? '0 2px 10px rgba(79, 70, 229, 0.35)' : 'none',
                  transition: 'all 0.18s ease',
                  whiteSpace: 'nowrap',
                }}
                title={selectedLeadIds.size > 0
                  ? `Migrate ${selectedLeadIds.size} selected institution(s) instantly to Process Pipeline`
                  : 'Select institutions from the table below and click to migrate into Process Workflow'}
              >
                <SendHorizontal size={15} color={selectedLeadIds.size > 0 ? '#ffffff' : 'var(--accent-primary)'} />
                <span>{selectedLeadIds.size > 0 ? `Move to Process (${selectedLeadIds.size})` : 'Move to Process'}</span>
              </button>

              {/* 4. Global Settings & Saved Lists */}
              {renderSettingsButton()}

              {/* 5. Full Screen Workspace Toggle */}
              {renderFullScreenButton('tieup-resources-fullscreen-toggle-btn')}
              </div>
            </div>
          </div>

          {/* Resources Notification Banner */}
          {resourcesNotice && (
            <div
              style={{
                padding: '0.6rem 0.9rem',
                borderRadius: '0.55rem',
                background: resourcesNotice.type === 'warning' ? 'var(--warning-bg)' : 'var(--success-bg)',
                border: `1px solid ${resourcesNotice.type === 'warning' ? 'var(--warning)' : 'var(--success)'}`,
                color: resourcesNotice.type === 'warning' ? 'var(--warning)' : 'var(--success)',
                fontSize: '0.84rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                {resourcesNotice.type === 'warning' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
                <span>{resourcesNotice.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setResourcesNotice(null)}
                style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0.1rem', display: 'flex' }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Secure Raw Leads Table with userSelect: none and onCopy blocking */}
          <div
            id="tieup-protected-table-container"
            onCopy={handleTableCopyAttempt}
            style={{
              flex: 1,
              overflow: 'auto',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow-sm)',
              userSelect: 'none',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '980px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-medium)', position: 'sticky', top: 0, zIndex: 10 }}>
                  <th style={{ padding: '0.65rem 0.75rem', width: '38px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={filteredResourcesLeads.length > 0 && selectedLeadIds.size === filteredResourcesLeads.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedLeadIds(new Set(filteredResourcesLeads.map((l) => l.id)));
                        else setSelectedLeadIds(new Set());
                      }}
                      style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Institution Name & Location
                  </th>
                  <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                    Language & Academic Requirements
                  </th>
                  <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                    Scholarship Availability
                  </th>
                  <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase' }}>
                    Commission / Margin
                  </th>
                  <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Programs & Terms
                  </th>
                  <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredResourcesLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.9rem' }}>
                      No leads match your filter parameters. Try adjusting your search or academic criteria filters above.
                    </td>
                  </tr>
                ) : (
                  filteredResourcesLeads.map((lead) => {
                    const isVerified = lead.antiSpamStatus === 'verified';
                    const isPartner = lead.isPartner === true;
                    const isSelected = selectedLeadIds.has(lead.id);
                    const hasDirectUrl = isValidDirectUrl(lead.directSourcePageUrl);
                    const hasWebsite = isValidDirectUrl(lead.websiteUrl);

                    return (
                      <tr
                        key={lead.id}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          background: isPartner
                            ? 'var(--success-bg)'
                            : isSelected
                            ? 'var(--accent-gradient-subtle)'
                            : inProcessLeadMap[lead.id] || phase1SelectedLeadIds.has(lead.id)
                            ? 'rgba(79, 70, 229, 0.04)'
                            : 'transparent',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        {/* Checkbox */}
                        <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const next = new Set(selectedLeadIds);
                              if (e.target.checked) next.add(lead.id);
                              else next.delete(lead.id);
                              setSelectedLeadIds(next);
                            }}
                            style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                          />
                        </td>

                        {/* Institution Name & Location with In-Process Status Badge */}
                        <td style={{ padding: '0.75rem 0.85rem', maxWidth: '300px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.3 }}>
                              {lead.name}
                            </span>
                            {renderLeadProcessStatusBadge(lead)}
                          </div>
                          {/* Subtitle: Location / City */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            <MapPin size={12} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                            <span>{lead.region || lead.locationMain || lead.country || 'Location Not Specified'}</span>
                          </div>
                          {/* Official Portal / Source */}
                          <div style={{ marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                            {hasWebsite ? (
                              <a
                                href={lead.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: '0.76rem',
                                  color: 'var(--accent-primary)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  textDecoration: 'none',
                                  fontWeight: 500,
                                }}
                                title={`Official website: ${lead.websiteUrl}`}
                              >
                                <span>{lead.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                                <ExternalLink size={10} />
                              </a>
                            ) : (
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Website: Not Available</span>
                            )}
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                              • {lead.category}
                            </span>
                          </div>
                          {/* Contact Liaison */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                            <span style={{ fontSize: '0.76rem', color: 'var(--text-main)', fontWeight: 500 }}>
                              {lead.contactPerson}
                            </span>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              ({lead.contactEmail})
                            </span>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '0.05rem 0.3rem',
                                borderRadius: '9999px',
                                background: isVerified ? 'var(--success-bg)' : 'var(--warning-bg)',
                                color: isVerified ? 'var(--success)' : 'var(--warning)',
                              }}
                            >
                              {isVerified ? '✓' : '!'}
                            </span>
                          </div>
                        </td>

                        {/* Language & Academic Requirements */}
                        <td style={{ padding: '0.75rem 0.85rem', maxWidth: '180px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.12rem 0.45rem',
                                borderRadius: '0.35rem',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-medium)',
                                color: 'var(--text-main)',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                width: 'fit-content',
                              }}
                            >
                              <span>Min IELTS: ≤ {lead.minIeltsScore ?? 6.0}</span>
                            </span>
                            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                              German: {lead.germanLevelRequired || 'None (English taught)'}
                            </span>
                          </div>
                        </td>

                        {/* Scholarship Availability: Strict Verification */}
                        <td style={{ padding: '0.75rem 0.85rem', maxWidth: '170px' }}>
                          {lead.scholarshipAvailable ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.12rem 0.45rem',
                                  borderRadius: '9999px',
                                  background: 'var(--success-bg)',
                                  border: '1px solid var(--success)',
                                  color: 'var(--success)',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  width: 'fit-content',
                                }}
                              >
                                <span>🎓 Yes</span>
                              </span>
                              {hasDirectUrl ? (
                                <a
                                  href={lead.directSourcePageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    fontSize: '0.74rem',
                                    color: 'var(--accent-primary)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.2rem',
                                    marginTop: '0.15rem',
                                    textDecoration: 'none',
                                    fontWeight: 500,
                                  }}
                                  title="Inspect exact verified scholarship page"
                                >
                                  <span>Direct Policy Page</span>
                                  <ExternalLink size={10} />
                                </a>
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                  Policy Link: Not Available
                                </span>
                              )}
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '0.1rem', lineHeight: 1.3 }}>
                                {lead.scholarshipDetails || 'Merit scholarships available'}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None</span>
                          )}
                        </td>

                        {/* Commission / Profit Margin: Strict Verification */}
                        <td style={{ padding: '0.75rem 0.85rem', maxWidth: '170px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.15rem 0.55rem',
                                borderRadius: '9999px',
                                background: (lead.commissionPercent || 20) >= 20 ? 'var(--success-bg)' : 'var(--accent-gradient-subtle)',
                                border: (lead.commissionPercent || 20) >= 20 ? '1px solid var(--success)' : '1px solid var(--border-medium)',
                                color: (lead.commissionPercent || 20) >= 20 ? 'var(--success)' : 'var(--accent-primary)',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                width: 'fit-content',
                              }}
                            >
                              <span>💰 {lead.commissionPercent || 20}%</span>
                            </span>
                            {hasDirectUrl ? (
                              <a
                                href={lead.directSourcePageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: '0.74rem',
                                  color: 'var(--success)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  marginTop: '0.15rem',
                                  textDecoration: 'none',
                                  fontWeight: 500,
                                }}
                                title="Inspect exact verified commission terms"
                              >
                                <span>Direct Terms Page</span>
                                <ExternalLink size={10} />
                              </a>
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                Terms Link: Not Available
                              </span>
                            )}
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '0.1rem' }}>
                              {lead.tuitionFeeYearly || '€0 (Public)'} • {lead.compatibilityScore || 92}% Fit
                            </div>
                          </div>
                        </td>

                        {/* Programs & Terms */}
                        <td style={{ padding: '0.75rem 0.85rem', maxWidth: '220px' }}>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.35, fontWeight: 500 }}>
                            {lead.termsSummary || lead.termsOfPartnership}
                          </div>
                          {lead.courseList && lead.courseList.length > 0 && (
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                              {lead.courseList.slice(0, 2).map((course, cIdx) => (
                                <span key={cIdx} style={{ padding: '0.04rem 0.32rem', borderRadius: '0.25rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                                  {course}
                                </span>
                              ))}
                              {lead.courseList.length > 2 && (
                                <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>+{lead.courseList.length - 2} more</span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenTermsModal(lead)}
                              style={{
                                padding: '0.32rem 0.55rem',
                                borderRadius: '0.45rem',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-medium)',
                                color: 'var(--accent-primary)',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                              title="View Bilateral MOU Preview"
                            >
                              MOU
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSendTestOutreach(lead)}
                              style={{
                                padding: '0.32rem 0.55rem',
                                borderRadius: '0.45rem',
                                background: 'var(--accent-gradient-subtle)',
                                border: '1px solid var(--border-medium)',
                                color: 'var(--accent-primary)',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                              title="Initiate Outreach for this lead"
                            >
                              Outreach
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTogglePartner(lead)}
                              style={{
                                padding: '0.32rem 0.6rem',
                                borderRadius: '0.45rem',
                                background: isPartner ? 'var(--error-bg)' : 'var(--success-bg)',
                                border: isPartner ? '1px solid var(--error)' : '1px solid var(--success)',
                                color: isPartner ? 'var(--error)' : 'var(--success)',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                              title={isPartner ? 'Revoke Official Partner Status' : 'Promote to Official Partner'}
                            >
                              {isPartner ? 'Revoke' : 'Tie-up'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteResourceLead(lead)}
                              style={{
                                padding: '0.32rem 0.45rem',
                                borderRadius: '0.45rem',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-medium)',
                                color: 'var(--text-subtle)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Delete from Resources Repository"
                              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-subtle)')}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Create Resource Group Modal */}
          {isCreateGroupModalOpen && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(7, 10, 19, 0.8)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.25rem',
              }}
              onClick={() => setIsCreateGroupModalOpen(false)}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: '490px',
                  background: 'var(--bg-card)',
                  borderRadius: '0.85rem',
                  border: '1px solid var(--border-medium)',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <FolderPlus size={18} color="var(--accent-primary)" />
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      Create Resource Group
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreateGroupModalOpen(false)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Package <strong>{selectedLeadIds.size} selected institution(s)</strong> into a named group for cohort tracking and 1-click push to the Process stage.
                </p>

                {/* Selected Leads Preview */}
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', maxHeight: '90px', overflowY: 'auto', padding: '0.45rem', borderRadius: '0.45rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                  {allResourcesLeads.filter((l) => selectedLeadIds.has(l.id)).map((l) => (
                    <span key={l.id} style={{ fontSize: '0.72rem', padding: '0.1rem 0.4rem', borderRadius: '0.3rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.name}
                    </span>
                  ))}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                    Group Name *
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g., German STEM Nursing Cohort 2026"
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-main)',
                      fontSize: '0.86rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    Notes / Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="e.g., High-margin partner prospects for Q4 intake"
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '0.5rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-main)',
                      fontSize: '0.84rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.55rem', marginTop: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsCreateGroupModalOpen(false)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '0.45rem',
                      background: 'transparent',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-muted)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateGroup}
                    disabled={!newGroupName.trim()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.48rem 1.1rem',
                      borderRadius: '0.5rem',
                      background: 'var(--accent-primary)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: !newGroupName.trim() ? 'not-allowed' : 'pointer',
                      opacity: !newGroupName.trim() ? 0.6 : 1,
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <FolderPlus size={14} />
                    <span>Save Group</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. PAGE 3: PROCESS (STRUCTURED MULTI-STAGE OUTREACH WORKFLOW) */}
      {activeMainTab === 'process' && (
        <div
          id="tieup-process-tab-view"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.15rem',
          }}
        >
          {/* Structured 2-Line Toolbar: Line 1 Universal Filter Bar | Line 2 Action Buttons */}
          <div
            id="tieup-process-toolbar"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: '0.75rem',
              padding: '0.75rem 0.9rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* Line 1 - Universal Filter Bar */}
            <div
              id="tieup-process-universal-filter-bar"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                flexWrap: 'wrap',
              }}
            >
              {/* Search Input - Optimized reduced length */}
              <div style={{ position: 'relative', flex: '0 1 200px', minWidth: '160px', maxWidth: '220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                <input
                  type="text"
                  value={tableSearchFilter}
                  onChange={(e) => setTableSearchFilter(e.target.value)}
                  placeholder="Search leads..."
                  style={{
                    width: '100%',
                    padding: '0.42rem 0.75rem 0.42rem 2.1rem',
                    borderRadius: '0.5rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-main)',
                    fontSize: '0.84rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* 1. All Geography */}
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                style={{
                  padding: '0.42rem 0.75rem',
                  borderRadius: '0.5rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-main)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
                title="Filter pipeline by Geography / Country"
              >
                <option value="all" style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>All Geography</option>
                {TARGET_COUNTRIES.map((c) => (
                  <option key={c.id} value={c.name} style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>{c.name}</option>
                ))}
              </select>

              {/* 2. All Category */}
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setSubCategoryFilter('all');
                }}
                style={{
                  padding: '0.42rem 0.75rem',
                  borderRadius: '0.5rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-main)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
                title="Filter pipeline by Category"
              >
                <option value="all" style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>All Category</option>
                {TIEUP_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.name} style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>{c.name}</option>
                ))}
              </select>

              {/* 3. All Sub-Category */}
              <select
                value={subCategoryFilter}
                onChange={(e) => setSubCategoryFilter(e.target.value)}
                style={{
                  padding: '0.42rem 0.75rem',
                  borderRadius: '0.5rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-main)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                  maxWidth: '185px',
                }}
                title="Filter pipeline by Sub-Category Track"
              >
                <option value="all" style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>All Sub-Category</option>
                {availableSubCategories.map((sc) => (
                  <option key={sc.id} value={sc.name} style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>
                    {sc.name}
                  </option>
                ))}
              </select>

              {/* 4. All Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{
                  padding: '0.42rem 0.75rem',
                  borderRadius: '0.5rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-main)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
                title="Filter pipeline by Deliverability / Verification Status"
              >
                <option value="all" style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>All Status</option>
                <option value="verified" style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>Verified Direct Only</option>
                <option value="flagged_generic" style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>Generic Flagged Only</option>
              </select>

              {/* 5. Unified "Sort By" Filter Dropdown */}
              <div ref={processSortFilterRef} style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  type="button"
                  id="tieup-process-sort-by-btn"
                  onClick={() => setIsProcessSortFilterOpen((prev) => !prev)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.42rem 0.85rem',
                    borderRadius: '0.5rem',
                    background: isProcessSortFilterOpen || activeAcademicFilterCount > 0 ? 'var(--dropdown-item-selected)' : 'var(--bg-secondary)',
                    border: activeAcademicFilterCount > 0 ? '1px solid var(--accent-primary)' : '1px solid var(--border-medium)',
                    color: activeAcademicFilterCount > 0 ? 'var(--accent-primary)' : 'var(--text-main)',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  title="Consolidated Sort & Secondary Filters (Compatibility, Bands, Levels, Tuition, Scholarships, Commission)"
                >
                  <Sliders size={14} color={activeAcademicFilterCount > 0 ? 'var(--accent-primary)' : 'currentColor'} />
                  <span>Sort By</span>
                  {activeAcademicFilterCount > 0 && (
                    <span
                      style={{
                        background: 'var(--accent-primary)',
                        color: '#ffffff',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '0.05rem 0.4rem',
                        borderRadius: '9999px',
                      }}
                    >
                      {activeAcademicFilterCount}
                    </span>
                  )}
                  <ChevronDown
                    size={13}
                    style={{
                      transform: isProcessSortFilterOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>

                {isProcessSortFilterOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      zIndex: 60,
                      width: '320px',
                      maxWidth: '90vw',
                      background: 'var(--dropdown-bg)',
                      border: '1px solid var(--dropdown-border)',
                      borderRadius: '0.75rem',
                      boxShadow: 'var(--dropdown-shadow)',
                      padding: '0.9rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header with Reset All */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.45rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Filter size={13} color="var(--accent-primary)" />
                        <span>Sort & Secondary Filters</span>
                      </span>
                      {(activeAcademicFilterCount > 0 || sortBy !== 'profit_desc') && (
                        <button
                          type="button"
                          onClick={() => {
                            handleClearAcademicFilters();
                            setSortBy('profit_desc');
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            padding: '0.2rem 0.45rem',
                            borderRadius: '0.35rem',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-subtle)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <RotateCcw size={11} />
                          <span>Reset All</span>
                        </button>
                      )}
                    </div>

                    {/* Sort Order */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        Sort Order
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        style={{
                          width: '100%',
                          padding: '0.38rem 0.6rem',
                          borderRadius: '0.45rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-medium)',
                          color: 'var(--text-main)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="profit_desc">💰 Highest Profit Margin / Comm. (Default)</option>
                        <option value="compatibility_desc">🎯 Highest Policy Compatibility</option>
                        <option value="name_asc">🏷️ Name (A - Z)</option>
                        <option value="date_desc">🕒 Recently Discovered</option>
                      </select>
                    </div>

                    {/* Policy Compatibility (Absorbed into unified Sort By) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          Policy Fit / Compatibility
                        </label>
                        {compatibilityFilter !== 'all' && (
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                            Active ({compatibilityFilter === '90' ? '≥ 90%' : '≥ 80%'})
                          </span>
                        )}
                      </div>
                      <select
                        value={compatibilityFilter}
                        onChange={(e) => setCompatibilityFilter(e.target.value as any)}
                        style={{
                          width: '100%',
                          padding: '0.38rem 0.6rem',
                          borderRadius: '0.45rem',
                          background: 'var(--bg-secondary)',
                          border: compatibilityFilter !== 'all' ? '1px solid var(--accent-primary)' : '1px solid var(--border-medium)',
                          color: 'var(--text-main)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="all">Any Compatibility / Fit</option>
                        <option value="90">🎯 High Fit (≥ 90%)</option>
                        <option value="80">✨ Standard Fit (≥ 80%)</option>
                      </select>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.45rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Academic Admission Criteria
                      </div>

                      {/* IELTS */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          IELTS Requirement
                        </label>
                        <select
                          value={ieltsFilter}
                          onChange={(e) => setIeltsFilter(e.target.value as any)}
                          style={{
                            width: '100%',
                            padding: '0.35rem 0.6rem',
                            borderRadius: '0.45rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-medium)',
                            color: 'var(--text-main)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="all">All Bands</option>
                          <option value="5.5">IELTS ≤ 5.5 (Low Barrier)</option>
                          <option value="6.0">IELTS ≤ 6.0 (Standard Direct)</option>
                          <option value="6.5">IELTS ≤ 6.5 (Selective Entry)</option>
                          <option value="7.0">IELTS ≤ 7.0 (Strict / Ivy)</option>
                        </select>
                      </div>

                      {/* German */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          German Language Level
                        </label>
                        <select
                          value={germanLevelFilter}
                          onChange={(e) => setGermanLevelFilter(e.target.value as any)}
                          style={{
                            width: '100%',
                            padding: '0.35rem 0.6rem',
                            borderRadius: '0.45rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-medium)',
                            color: 'var(--text-main)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="all">All Levels</option>
                          <option value="none">English Only (No German)</option>
                          <option value="a1_a2">A1 - A2 (Beginner)</option>
                          <option value="b1_b2">B1 - B2 (Intermediate)</option>
                          <option value="c1">C1 / TestDaF (Native / Fluent)</option>
                        </select>
                      </div>

                      {/* Tuition */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          Tutor / Tuition Tiers
                        </label>
                        <select
                          value={tuitionFilter}
                          onChange={(e) => setTuitionFilter(e.target.value as any)}
                          style={{
                            width: '100%',
                            padding: '0.35rem 0.6rem',
                            borderRadius: '0.45rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-medium)',
                            color: 'var(--text-main)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="all">Any Tuition Tier</option>
                          <option value="free">€0 Public Tuition (Semester Fee Only)</option>
                          <option value="low">Low-Fee (&lt; €5,000/yr)</option>
                          <option value="private">Private / Elite (≥ €5,000/yr)</option>
                        </select>
                      </div>

                      {/* Scholarships */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          Scholarships / All Institutions
                        </label>
                        <select
                          value={scholarshipFilter}
                          onChange={(e) => setScholarshipFilter(e.target.value as any)}
                          style={{
                            width: '100%',
                            padding: '0.35rem 0.6rem',
                            borderRadius: '0.45rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-medium)',
                            color: 'var(--text-main)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="all">All Institutions</option>
                          <option value="available">🎓 Scholarships / Fee Discounts Available</option>
                        </select>
                      </div>

                      {/* Commission */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          Commission Rates
                        </label>
                        <select
                          value={minCommissionFilter}
                          onChange={(e) => setMinCommissionFilter(e.target.value as any)}
                          style={{
                            width: '100%',
                            padding: '0.35rem 0.6rem',
                            borderRadius: '0.45rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-medium)',
                            color: 'var(--text-main)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="all">Any Commission</option>
                          <option value="15">≥ 15% Standard</option>
                          <option value="20">≥ 20% High Yield Tier</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Line 2 - Process Page-Specific Action Buttons */}
            <div
              id="tieup-process-action-line"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.65rem',
                flexWrap: 'wrap',
                paddingTop: '0.55rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              {/* Left: Process Leads indicator & Selection Count */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.32rem 0.7rem',
                    borderRadius: '0.5rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                  title="Total pipeline leads matching current criteria"
                >
                  <ShieldCheck size={13} color="#10b981" />
                  <span>{processLeads.length} Process Leads</span>
                </div>
                {(phase1SelectedLeadIds.size > 0 || selectedLeadIds.size > 0) && (
                  <span
                    style={{
                      padding: '0.2rem 0.55rem',
                      borderRadius: '0.35rem',
                      background: 'var(--success-bg)',
                      border: '1px solid var(--success)',
                      color: 'var(--success)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {activeProcessPhase === 'phase4_push_partners'
                      ? `${phase1SelectedLeadIds.size || selectedLeadIds.size} Selected for Partnership`
                      : `${phase1SelectedLeadIds.size || selectedLeadIds.size} Active in Workflow`}
                  </span>
                )}
              </div>

              {/* Right: Specific Action Buttons: Push to Partnership (Strictly Stage 4) and Settings */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                {activeProcessPhase === 'phase4_push_partners' && (
                  <button
                    type="button"
                    id="tieup-push-to-partnership-btn"
                    onClick={handleBatchPushToPartnership}
                    disabled={phase1SelectedLeadIds.size === 0 && selectedLeadIds.size === 0}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.48rem 1rem',
                      borderRadius: '0.55rem',
                      background: phase1SelectedLeadIds.size > 0 || selectedLeadIds.size > 0
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : 'var(--bg-card)',
                      border: phase1SelectedLeadIds.size > 0 || selectedLeadIds.size > 0
                        ? '1px solid rgba(255, 255, 255, 0.25)'
                        : '1px solid var(--border-medium)',
                      color: phase1SelectedLeadIds.size > 0 || selectedLeadIds.size > 0 ? '#ffffff' : 'var(--text-subtle)',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      cursor: phase1SelectedLeadIds.size === 0 && selectedLeadIds.size === 0 ? 'not-allowed' : 'pointer',
                      opacity: phase1SelectedLeadIds.size === 0 && selectedLeadIds.size === 0 ? 0.65 : 1,
                      boxShadow: phase1SelectedLeadIds.size > 0 || selectedLeadIds.size > 0 ? '0 2px 10px rgba(16, 185, 129, 0.35)' : 'none',
                      transition: 'all 0.18s ease',
                      whiteSpace: 'nowrap',
                    }}
                    title="Migrate and record selected communicated leads into the Official Partnership Database"
                  >
                    <Award size={15} color={phase1SelectedLeadIds.size > 0 || selectedLeadIds.size > 0 ? '#ffffff' : 'var(--text-subtle)'} />
                    <span>
                      {phase1SelectedLeadIds.size > 0
                        ? `Push to Partnership (${phase1SelectedLeadIds.size})`
                        : selectedLeadIds.size > 0
                        ? `Push to Partnership (${selectedLeadIds.size})`
                        : 'Push to Partnership'}
                    </span>
                  </button>
                )}

                {/* Global Settings & Saved Lists */}
                {renderSettingsButton()}

                {/* Full Screen Workspace Toggle */}
                {renderFullScreenButton('tieup-process-fullscreen-toggle-btn')}
              </div>
            </div>
          </div>

          {/* Process Notification Banner */}
          {processNotice && (
            <div
              style={{
                padding: '0.6rem 0.9rem',
                borderRadius: '0.55rem',
                background: processNotice.type === 'warning' ? 'var(--warning-bg)' : 'var(--success-bg)',
                border: `1px solid ${processNotice.type === 'warning' ? 'var(--warning)' : 'var(--success)'}`,
                color: processNotice.type === 'warning' ? 'var(--warning)' : 'var(--success)',
                fontSize: '0.84rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                {processNotice.type === 'warning' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
                <span>{processNotice.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setProcessNotice(null)}
                style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0.1rem', display: 'flex' }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Structured Multi-Phase Sub-Navigation Flow */}
          <div
            id="tieup-process-phase-nav"
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-medium)',
              borderRadius: '0.75rem',
              padding: '0.35rem',
              gap: '0.4rem',
              flexWrap: 'wrap',
            }}
          >
            {[
              {
                id: 'phase1_outreach' as ProcessPhase,
                step: '1',
                title: 'Initial Outreach & Report',
                desc: 'Lead selection & email templates',
                icon: Mail,
                badge: `${processLeads.length} leads`,
              },
              {
                id: 'phase2_triggers' as ProcessPhase,
                step: '2',
                title: 'Status & Auto-Triggers',
                desc: 'Automated 7-10d reminders',
                icon: Clock,
                badge: `${outreachLogs.filter((l) => l.phase === 'followup' || (!l.phase && l.status === 'delivered')).length} pending`,
              },
              {
                id: 'phase3_meetings' as ProcessPhase,
                step: '3',
                title: 'Meeting & Appointment Scheduling',
                desc: 'Coordinate virtual discussions',
                icon: Calendar,
                badge: `${outreachLogs.filter((l) => l.phase === 'meeting' || l.status === 'replied').length} active`,
              },
              {
                id: 'phase4_push_partners' as ProcessPhase,
                step: '4',
                title: 'Push to Partners',
                desc: 'Migrate to official database',
                icon: Award,
                badge: `${outreachLogs.filter((l) => l.phase === 'pushed_partner').length} ready`,
              },
            ].map((phase) => {
              const isActive = activeProcessPhase === phase.id;
              const IconComp = phase.icon;
              return (
                <button
                  key={phase.id}
                  type="button"
                  onClick={() => setActiveProcessPhase(phase.id)}
                  style={{
                    flex: '1 1 200px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '0.55rem',
                    background: isActive ? 'var(--bg-card)' : 'transparent',
                    border: isActive ? '1px solid var(--accent-primary)' : '1px solid transparent',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: isActive ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      color: isActive ? '#ffffff' : 'var(--text-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {phase.step}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: isActive ? 'var(--text-main)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {phase.title}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', marginTop: '0.1rem' }}>
                      {phase.desc}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      background: isActive ? 'var(--accent-gradient-subtle)' : 'var(--bg-tertiary)',
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-subtle)',
                      border: '1px solid var(--border-subtle)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {phase.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ========================================================================= */}
          {/* PHASE 1: INITIAL OUTREACH & REPORT (Selection, Templates, Delivery Logs) */}
          {/* ========================================================================= */}
          {activeProcessPhase === 'phase1_outreach' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Notification Banner */}
              {bulkSendNotice && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.65rem',
                    background: 'var(--success-bg)',
                    border: '1px solid var(--success)',
                    color: 'var(--success)',
                    fontSize: '0.86rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>{bulkSendNotice}</span>
                </div>
              )}

              {/* 1. Lead Selection Area (Filtered by Academic Criteria & High Profit Margins) */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '0.75rem',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <UserCheck size={18} color="var(--accent-primary)" />
                      <span>1. Select Filtered Institutional Leads for Bulk Outreach</span>
                    </h4>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                      Target institutions matched from Resources repository satisfying IELTS thresholds and commission tiers.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (phase1SelectedLeadIds.size === processLeads.length) {
                          setPhase1SelectedLeadIds(new Set());
                        } else {
                          setPhase1SelectedLeadIds(new Set(processLeads.map((l) => l.id)));
                        }
                      }}
                      style={{
                        padding: '0.38rem 0.8rem',
                        borderRadius: '0.45rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-medium)',
                        color: 'var(--text-main)',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      {phase1SelectedLeadIds.size === processLeads.length ? 'Deselect All' : `Select All (${processLeads.length})`}
                    </button>

                    <span
                      style={{
                        padding: '0.32rem 0.75rem',
                        borderRadius: '9999px',
                        background: phase1SelectedLeadIds.size > 0 ? 'var(--accent-gradient-subtle)' : 'var(--bg-tertiary)',
                        border: phase1SelectedLeadIds.size > 0 ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        color: phase1SelectedLeadIds.size > 0 ? 'var(--accent-primary)' : 'var(--text-subtle)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                      }}
                    >
                      {phase1SelectedLeadIds.size} Leads Selected
                    </span>
                  </div>
                </div>

                {/* Lead Selection Table */}
                <div style={{ overflowX: 'auto', border: '1px solid var(--border-medium)', borderRadius: '0.6rem', background: 'var(--bg-card)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '980px' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-medium)' }}>
                        <th style={{ padding: '0.65rem 0.75rem', width: '38px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={processLeads.length > 0 && phase1SelectedLeadIds.size === processLeads.length}
                            onChange={(e) => {
                              if (e.target.checked) setPhase1SelectedLeadIds(new Set(processLeads.map((l) => l.id)));
                              else setPhase1SelectedLeadIds(new Set());
                            }}
                            style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                          />
                        </th>
                        <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Institution Name & Location
                        </th>
                        <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                          Language & Academic Requirements
                        </th>
                        <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                          Scholarship Availability
                        </th>
                        <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase' }}>
                          Commission / Margin
                        </th>
                        <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Programs & Terms
                        </th>
                        <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {processLeads.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                            <Building2 size={26} style={{ opacity: 0.35, marginBottom: '0.4rem', display: 'block', margin: '0 auto' }} />
                            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>No Leads in Process Workflow</div>
                            <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                              Select institutions from the <strong>Resources</strong> tab and click <strong>"Move to Process"</strong> to initiate outreach.
                            </div>
                          </td>
                        </tr>
                      ) : (
                        processLeads.map((lead) => {
                        const isSelected = phase1SelectedLeadIds.has(lead.id);
                        const isVerified = lead.antiSpamStatus === 'verified';
                        const isGeneric = lead.antiSpamStatus === 'flagged_generic';
                        const hasDirectUrl = isValidDirectUrl(lead.directSourcePageUrl);
                        const hasWebsite = isValidDirectUrl(lead.websiteUrl);

                        return (
                          <tr
                            key={lead.id}
                            style={{
                              borderBottom: '1px solid var(--border-subtle)',
                              background: lead.isPartner ? 'var(--success-bg)' : isSelected ? 'var(--accent-gradient-subtle)' : 'transparent',
                              transition: 'background 0.15s ease',
                            }}
                          >
                            <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const next = new Set(phase1SelectedLeadIds);
                                  if (e.target.checked) next.add(lead.id);
                                  else next.delete(lead.id);
                                  setPhase1SelectedLeadIds(next);
                                }}
                                style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                              />
                            </td>

                            {/* Institution Name & Location (Location placed directly underneath Name as subtitle) */}
                            <td style={{ padding: '0.75rem 0.85rem', maxWidth: '280px' }}>
                              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.3 }}>
                                {lead.name}
                              </div>
                              {/* Subtitle: Location / City */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                <MapPin size={12} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                                <span>{lead.region || lead.locationMain || lead.country || 'Location Not Specified'}</span>
                              </div>
                              {/* Official Portal / Source */}
                              <div style={{ marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                                {hasWebsite ? (
                                  <a
                                    href={lead.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      fontSize: '0.76rem',
                                      color: 'var(--accent-primary)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.2rem',
                                      textDecoration: 'none',
                                      fontWeight: 500,
                                    }}
                                    title={`Official website: ${lead.websiteUrl}`}
                                  >
                                    <span>{lead.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                                    <ExternalLink size={10} />
                                  </a>
                                ) : (
                                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Website: Not Available</span>
                                )}
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                                  • {lead.category}
                                </span>
                              </div>
                              {/* Contact Liaison */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                                <span style={{ fontSize: '0.76rem', color: 'var(--text-main)', fontWeight: 500 }}>
                                  {lead.contactPerson}
                                </span>
                                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                  ({lead.contactEmail})
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    padding: '0.05rem 0.3rem',
                                    borderRadius: '9999px',
                                    background: isVerified ? 'var(--success-bg)' : 'var(--warning-bg)',
                                    color: isVerified ? 'var(--success)' : 'var(--warning)',
                                  }}
                                >
                                  {isVerified ? '✓' : '!'}
                                </span>
                              </div>
                            </td>

                            {/* Language & Academic Requirements */}
                            <td style={{ padding: '0.75rem 0.85rem', maxWidth: '180px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.12rem 0.45rem',
                                    borderRadius: '0.35rem',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-medium)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    width: 'fit-content',
                                  }}
                                >
                                  <span>Min IELTS: ≤ {lead.minIeltsScore ?? 6.0}</span>
                                </span>
                                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                  German: {lead.germanLevelRequired || 'None (English taught)'}
                                </span>
                              </div>
                            </td>

                            {/* Scholarship Availability: Strict Verification */}
                            <td style={{ padding: '0.75rem 0.85rem', maxWidth: '170px' }}>
                              {lead.scholarshipAvailable ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      padding: '0.12rem 0.45rem',
                                      borderRadius: '9999px',
                                      background: 'var(--success-bg)',
                                      border: '1px solid var(--success)',
                                      color: 'var(--success)',
                                      fontSize: '0.78rem',
                                      fontWeight: 600,
                                      width: 'fit-content',
                                    }}
                                  >
                                    <span>🎓 Yes</span>
                                  </span>
                                  {hasDirectUrl ? (
                                    <a
                                      href={lead.directSourcePageUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        fontSize: '0.74rem',
                                        color: 'var(--accent-primary)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.2rem',
                                        marginTop: '0.15rem',
                                        textDecoration: 'none',
                                        fontWeight: 500,
                                      }}
                                      title="Inspect exact verified scholarship page"
                                    >
                                      <span>Direct Policy Page</span>
                                      <ExternalLink size={10} />
                                    </a>
                                  ) : (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                      Policy Link: Not Available
                                    </span>
                                  )}
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '0.1rem', lineHeight: 1.3 }}>
                                    {lead.scholarshipDetails || 'Merit scholarships available'}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None</span>
                              )}
                            </td>

                            {/* Commission / Profit Margin: Strict Verification */}
                            <td style={{ padding: '0.75rem 0.85rem', maxWidth: '170px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.15rem 0.55rem',
                                    borderRadius: '9999px',
                                    background: (lead.commissionPercent || 20) >= 20 ? 'var(--success-bg)' : 'var(--accent-gradient-subtle)',
                                    border: (lead.commissionPercent || 20) >= 20 ? '1px solid var(--success)' : '1px solid var(--border-medium)',
                                    color: (lead.commissionPercent || 20) >= 20 ? 'var(--success)' : 'var(--accent-primary)',
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    width: 'fit-content',
                                  }}
                                >
                                  <span>💰 {lead.commissionPercent || 20}%</span>
                                </span>
                                {hasDirectUrl ? (
                                  <a
                                    href={lead.directSourcePageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      fontSize: '0.74rem',
                                      color: 'var(--success)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.2rem',
                                      marginTop: '0.15rem',
                                      textDecoration: 'none',
                                      fontWeight: 500,
                                    }}
                                    title="Inspect exact verified commission terms"
                                  >
                                    <span>Direct Terms Page</span>
                                    <ExternalLink size={10} />
                                  </a>
                                ) : (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                    Terms Link: Not Available
                                  </span>
                                )}
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '0.1rem' }}>
                                  {lead.tuitionFeeYearly || '€0 (Public)'} • {lead.compatibilityScore || 92}% Fit
                                </div>
                              </div>
                            </td>

                            {/* Programs & Terms */}
                            <td style={{ padding: '0.75rem 0.85rem', maxWidth: '220px' }}>
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.35, fontWeight: 500 }}>
                                {lead.termsSummary || lead.termsOfPartnership}
                              </div>
                              {lead.courseList && lead.courseList.length > 0 && (
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                                  {lead.courseList.slice(0, 2).map((course, cIdx) => (
                                    <span key={cIdx} style={{ padding: '0.04rem 0.32rem', borderRadius: '0.25rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                                      {course}
                                    </span>
                                  ))}
                                  {lead.courseList.length > 2 && (
                                    <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>+{lead.courseList.length - 2} more</span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Actions & Mailbox Status */}
                            <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    padding: '0.12rem 0.45rem',
                                    borderRadius: '9999px',
                                    background: isGeneric ? 'var(--warning-bg)' : 'var(--success-bg)',
                                    color: isGeneric ? 'var(--warning)' : 'var(--success)',
                                    border: isGeneric ? '1px solid var(--warning)' : '1px solid var(--success)',
                                  }}
                                  title={isGeneric ? 'Flagged generic institutional alias' : 'Direct admissions mailbox verified'}
                                >
                                  {isGeneric ? '⚠ Generic' : '✓ Verified'}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleOpenTermsModal(lead)}
                                  style={{
                                    padding: '0.32rem 0.55rem',
                                    borderRadius: '0.45rem',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-medium)',
                                    color: 'var(--accent-primary)',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                  title="View Bilateral MOU Preview"
                                >
                                  MOU
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSendTestOutreach(lead)}
                                  style={{
                                    padding: '0.32rem 0.55rem',
                                    borderRadius: '0.45rem',
                                    background: 'var(--accent-gradient-subtle)',
                                    border: '1px solid var(--border-medium)',
                                    color: 'var(--accent-primary)',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                  title="Initiate Outreach for this lead"
                                >
                                  Outreach
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleTogglePartner(lead)}
                                  style={{
                                    padding: '0.32rem 0.55rem',
                                    borderRadius: '0.45rem',
                                    background: lead.isPartner ? 'var(--error-bg)' : 'var(--success-bg)',
                                    border: lead.isPartner ? '1px solid var(--error)' : '1px solid var(--success)',
                                    color: lead.isPartner ? 'var(--error)' : 'var(--success)',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                  title={lead.isPartner ? 'Revoke Partner Status' : 'Mark as Finalized Partner'}
                                >
                                  {lead.isPartner ? 'Revoke' : 'Tie-up'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteProcessLead(lead.id)}
                                  style={{
                                    padding: '0.32rem 0.45rem',
                                    borderRadius: '0.45rem',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-medium)',
                                    color: 'var(--text-subtle)',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                  title="Remove from Process Workflow"
                                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-subtle)')}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Bulk Email Template Preview & Dynamic Parameter Replacement */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '0.75rem',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Mail size={18} color="var(--accent-primary)" />
                      <span>2. Preview & Customize Bulk Outreach Script</span>
                    </h4>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                      Configured sender mailbox with automated token replacement for personalized institutional proposals.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {['{{CONTACT_PERSON}}', '{{INSTITUTION_NAME}}', '{{COMMISSION_PERCENT}}', '{{COURSES}}', '{{MOU_LINK}}'].map((token) => (
                      <span
                        key={token}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '0.12rem 0.45rem',
                          borderRadius: '0.3rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--accent-primary)',
                        }}
                      >
                        {token}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Dedicated EmailJS Dispatch Transporter Configuration Card */}
                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '0.65rem',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Mail size={16} color="var(--accent-primary)" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        EmailJS Dispatch Transporter
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.12rem 0.45rem',
                          borderRadius: '0.35rem',
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#10b981',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        emailjs-browser (Direct TLS Relay)
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setShowEmailJsGuide(!showEmailJsGuide)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.32rem 0.65rem',
                          borderRadius: '0.45rem',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-medium)',
                          color: 'var(--text-main)',
                          fontSize: '0.76rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        <Sparkles size={12} color="var(--accent-primary)" />
                        <span>{showEmailJsGuide ? 'Hide Setup Guide' : 'How to Setup (Free)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleVerifyEmailJs}
                        disabled={isVerifyingEmailJs}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.32rem 0.75rem',
                          borderRadius: '0.45rem',
                          background: 'var(--accent-primary)',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: isVerifyingEmailJs ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isVerifyingEmailJs ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                        <span>{isVerifyingEmailJs ? 'Verifying...' : 'Test EmailJS Connection'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Collapsible EmailJS Setup Guide */}
                  {showEmailJsGuide && (
                    <div
                      style={{
                        padding: '0.75rem 0.9rem',
                        borderRadius: '0.5rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-medium)',
                        fontSize: '0.76rem',
                        lineHeight: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                      }}
                    >
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Sparkles size={14} color="var(--accent-primary)" />
                        <span>Quick 2-Minute EmailJS Setup Guide (Free 200 emails/month):</span>
                      </div>
                      <ol style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-muted)' }}>
                        <li>
                          Sign up at{' '}
                          <a
                            href="https://www.emailjs.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--accent-primary)', textDecoration: 'underline', fontWeight: 600 }}
                          >
                            emailjs.com
                          </a>{' '}
                          (free tier, no credit card required).
                        </li>
                        <li>
                          In <strong>Email Services</strong>, click <em>Add New Service</em> (select Gmail, Outlook, or your preferred provider) and copy your <strong>Service ID</strong>.
                        </li>
                        <li>
                          In <strong>Email Templates</strong>, click <em>Create New Template</em>. Use variables <code>{'{{to_email}}'}</code>, <code>{'{{subject}}'}</code>, <code>{'{{message}}'}</code>, <code>{'{{to_name}}'}</code>, save and copy your <strong>Template ID</strong>.
                        </li>
                        <li>
                          In <strong>Account &gt; Security</strong>, copy your <strong>Public Key</strong>.
                        </li>
                        <li>
                          Paste the 3 keys below and click <strong>"Test EmailJS Connection"</strong>. No Google App Passwords or server port configurations needed!
                        </li>
                      </ol>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                        EmailJS Service ID:
                      </label>
                      <input
                        type="text"
                        value={emailjsServiceId}
                        onChange={(e) => setEmailjsServiceId(e.target.value)}
                        onBlur={(e) => setEmailjsServiceId(e.target.value.trim())}
                        placeholder="e.g. service_xxxxxxx"
                        style={{
                          width: '100%',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '0.45rem',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-medium)',
                          color: 'var(--text-main)',
                          fontSize: '0.84rem',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                        EmailJS Template ID:
                      </label>
                      <input
                        type="text"
                        value={emailjsTemplateId}
                        onChange={(e) => setEmailjsTemplateId(e.target.value)}
                        onBlur={(e) => setEmailjsTemplateId(e.target.value.trim())}
                        placeholder="e.g. template_xxxxxxx"
                        style={{
                          width: '100%',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '0.45rem',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-medium)',
                          color: 'var(--text-main)',
                          fontSize: '0.84rem',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                        EmailJS Public Key:
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type={showPublicKey ? 'text' : 'password'}
                          value={emailjsPublicKey}
                          onChange={(e) => setEmailjsPublicKey(e.target.value)}
                          onBlur={(e) => setEmailjsPublicKey(e.target.value.trim())}
                          placeholder="e.g. xxxxxxxxxxxxxxx"
                          style={{
                            width: '100%',
                            padding: '0.45rem 2.2rem 0.45rem 0.65rem',
                            borderRadius: '0.45rem',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-medium)',
                            color: 'var(--text-main)',
                            fontSize: '0.84rem',
                            letterSpacing: showPublicKey ? 'normal' : '0.1em',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPublicKey(!showPublicKey)}
                          style={{
                            position: 'absolute',
                            right: '0.5rem',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-subtle)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title={showPublicKey ? 'Hide public key' : 'Show public key'}
                        >
                          {showPublicKey ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                        Designated Sender / Reply-To Email:
                      </label>
                      <input
                        type="email"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        onBlur={(e) => setSenderEmail(e.target.value.trim())}
                        placeholder="rafiaquafqu@gmail.com"
                        style={{
                          width: '100%',
                          padding: '0.45rem 0.65rem',
                          borderRadius: '0.45rem',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-medium)',
                          color: 'var(--text-main)',
                          fontSize: '0.84rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* Verification Status Notification Pill */}
                  {emailjsVerifyStatus && (
                    <div
                      style={{
                        padding: '0.45rem 0.75rem',
                        borderRadius: '0.45rem',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: emailjsVerifyStatus.success
                          ? 'rgba(16, 185, 129, 0.12)'
                          : 'rgba(239, 68, 68, 0.12)',
                        border: `1px solid ${
                          emailjsVerifyStatus.success
                            ? 'rgba(16, 185, 129, 0.35)'
                            : 'rgba(239, 68, 68, 0.35)'
                        }`,
                        color: emailjsVerifyStatus.success ? '#10b981' : '#ef4444',
                      }}
                    >
                      {emailjsVerifyStatus.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      <span>{emailjsVerifyStatus.message}</span>
                    </div>
                  )}

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', lineHeight: 1.4 }}>
                    ⚡ 100% Client-side EmailJS integration. Emails dispatch directly via official EmailJS API with zero Google SMTP port or App Password restrictions.
                  </div>
                </div>

                {/* Email Subject Line */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                    Email Subject Line:
                  </label>
                  <input
                    type="text"
                    value={phase1EmailSubject}
                    onChange={(e) => setPhase1EmailSubject(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.48rem 0.75rem',
                      borderRadius: '0.5rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-main)',
                      fontSize: '0.86rem',
                      fontWeight: 500,
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Body Textarea */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                    Email Body Template:
                  </label>
                  <textarea
                    rows={6}
                    value={phase1EmailBody}
                    onChange={(e) => setPhase1EmailBody(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.8rem',
                      borderRadius: '0.5rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-main)',
                      fontSize: '0.86rem',
                      lineHeight: '1.5',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      fontWeight: 400,
                    }}
                  />
                </div>

                {/* Inline Notice Banner (Visible directly at dispatch location) */}
                {bulkSendNotice && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.65rem 0.95rem',
                      borderRadius: '0.55rem',
                      background: bulkSendNotice.startsWith('✓') ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      border: `1px solid ${bulkSendNotice.startsWith('✓') ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                      color: bulkSendNotice.startsWith('✓') ? '#10b981' : '#f87171',
                      fontSize: '0.84rem',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                    }}
                  >
                    {bulkSendNotice.startsWith('✓') ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span>{bulkSendNotice}</span>
                  </div>
                )}

                {/* Dispatch Button Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.65rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                      Simultaneously fires to all selected leads using authenticated relay with live delivery logging.
                    </div>
                    {phase1SelectedLeadIds.size === 0 && (
                      <div style={{ fontSize: '0.76rem', color: 'var(--accent-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>👉 Select one or more leads in <strong>1. Select Filtered Institutional Leads</strong> above to enable dispatch.</span>
                      </div>
                    )}
                    {(!emailjsServiceId.trim() || !emailjsTemplateId.trim() || !emailjsPublicKey.trim()) && (
                      <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 500 }}>
                        ⚠ EmailJS credentials not fully entered in configuration card above.
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSendBulkOutreach}
                    disabled={isBulkSending || phase1SelectedLeadIds.size === 0}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.55rem 1.35rem',
                      borderRadius: '0.55rem',
                      background: phase1SelectedLeadIds.size > 0 ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      border: phase1SelectedLeadIds.size > 0 ? 'none' : '1px solid var(--border-medium)',
                      color: phase1SelectedLeadIds.size > 0 ? '#ffffff' : 'var(--text-subtle)',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      cursor: isBulkSending || phase1SelectedLeadIds.size === 0 ? 'not-allowed' : 'pointer',
                      boxShadow: phase1SelectedLeadIds.size > 0 ? 'var(--shadow-sm)' : 'none',
                      opacity: isBulkSending ? 0.7 : phase1SelectedLeadIds.size === 0 ? 0.65 : 1,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isBulkSending ? <Loader2 size={15} className="animate-spin" /> : <SendHorizontal size={15} />}
                    <span>
                      {isBulkSending
                        ? 'Dispatching Outreach Stream...'
                        : `Dispatch Bulk Outreach (${phase1SelectedLeadIds.size} Selected)`}
                    </span>
                  </button>
                </div>
              </div>

              {/* 3. Delivery Status & Robotic / Bounced Mailbox Audit */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ padding: '0.85rem 1.15rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <ShieldAlert size={17} color="var(--accent-primary)" />
                      <span>3. Delivery Status & Flagged Generic / Bounced Mailbox Audit</span>
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                      Monitors authenticated EmailJS relay delivery and identifies dropped generic aliases.
                    </span>
                  </div>

                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {outreachLogs.length} Records Logged
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-medium)' }}>
                        <th style={{ padding: '0.7rem 0.95rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Institution</th>
                        <th style={{ padding: '0.7rem 0.95rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sender / Recipient Mailbox</th>
                        <th style={{ padding: '0.7rem 0.95rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '0.7rem 0.95rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Deliverability Diagnostic</th>
                        <th style={{ padding: '0.7rem 0.95rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outreachLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.86rem', fontWeight: 400 }}>
                            No outreach emails sent yet. Select leads above and dispatch your first campaign.
                          </td>
                        </tr>
                      ) : (
                        outreachLogs.map((log) => {
                          const isFlagged = log.status === 'flagged_generic' || log.status === 'bounced';
                          const isReplied = log.status === 'replied';
                          return (
                            <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                              <td style={{ padding: '0.75rem 0.95rem', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                {log.institutionName}
                              </td>
                              <td style={{ padding: '0.75rem 0.95rem' }}>
                                <div style={{ fontSize: '0.84rem', color: 'var(--text-main)', fontWeight: 500 }}>{log.recipientName || 'Admissions Desk'}</div>
                                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 400 }}>To: {log.recipientEmail}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 400 }}>From: {log.senderEmail || 'partnerships@ila-academy.com'}</div>
                              </td>
                              <td style={{ padding: '0.75rem 0.95rem' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.74rem',
                                    fontWeight: 600,
                                    background: isReplied ? 'var(--success-bg)' : isFlagged ? 'var(--warning-bg)' : 'var(--accent-gradient-subtle)',
                                    color: isReplied ? 'var(--success)' : isFlagged ? 'var(--warning)' : 'var(--accent-primary)',
                                    border: isReplied ? '1px solid var(--success)' : isFlagged ? '1px solid var(--warning)' : '1px solid var(--border-medium)',
                                  }}
                                >
                                  {isReplied ? <CheckCircle2 size={11} /> : isFlagged ? <AlertTriangle size={11} /> : <Send size={11} />}
                                  <span style={{ textTransform: 'capitalize' }}>{log.status.replace('_', ' ')}</span>
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 0.95rem', fontSize: '0.8rem', color: isFlagged ? 'var(--error)' : 'var(--text-muted)', fontWeight: 400 }}>
                                <div>{log.flagReason || 'SPF/DKIM verified. Delivered directly to recipient mailbox.'}</div>
                                {log.retryCount && log.retryCount > 0 ? (
                                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                                    (Retried {log.retryCount}x)
                                  </span>
                                ) : null}
                              </td>
                              <td style={{ padding: '0.75rem 0.95rem', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                  {isFlagged ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleRetriggerDelivery(log)}
                                        style={{
                                          padding: '0.3rem 0.65rem',
                                          borderRadius: '0.45rem',
                                          background: 'var(--accent-primary)',
                                          border: 'none',
                                          color: '#ffffff',
                                          fontSize: '0.76rem',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.25rem',
                                        }}
                                        title="Re-trigger / retry email dispatch immediately"
                                      >
                                        <RotateCcw size={11} />
                                        <span>Re-trigger</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setManualReviewLog(log);
                                          setManualReviewEmail(log.recipientEmail);
                                        }}
                                        style={{
                                          padding: '0.3rem 0.65rem',
                                          borderRadius: '0.45rem',
                                          background: 'var(--warning-bg)',
                                          border: '1px solid var(--warning)',
                                          color: 'var(--warning)',
                                          fontSize: '0.76rem',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                        }}
                                        title="Edit recipient address and retry"
                                      >
                                        Fix Email
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleRetriggerDelivery(log)}
                                        style={{
                                          padding: '0.3rem 0.55rem',
                                          borderRadius: '0.45rem',
                                          background: 'var(--bg-secondary)',
                                          border: '1px solid var(--border-subtle)',
                                          color: 'var(--text-muted)',
                                          fontSize: '0.74rem',
                                          fontWeight: 500,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.25rem',
                                        }}
                                        title="Re-send outreach email sequence"
                                      >
                                        <RotateCcw size={11} />
                                        <span>Resend</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleSimulatePartnerReply(log)}
                                        style={{
                                          padding: '0.3rem 0.65rem',
                                          borderRadius: '0.45rem',
                                          background: 'var(--accent-gradient-subtle)',
                                          border: '1px solid var(--border-medium)',
                                          color: 'var(--accent-primary)',
                                          fontSize: '0.74rem',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.25rem',
                                        }}
                                        title="Simulate incoming partner response for demonstration"
                                      >
                                        <MessageSquare size={11} />
                                        <span>Simulate Reply</span>
                                      </button>
                                    </>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOutreachLog(log.id)}
                                    style={{
                                      padding: '0.3rem 0.45rem',
                                      borderRadius: '0.45rem',
                                      background: 'var(--bg-card)',
                                      border: '1px solid var(--border-subtle)',
                                      color: 'var(--text-subtle)',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                    title="Delete outreach log record"
                                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-subtle)')}
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PHASE 2: STATUS & REPLIES DASHBOARD (Response Capture, Sentiment & AI)   */}
          {/* ========================================================================= */}
          {activeProcessPhase === 'phase2_triggers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Notice Banner */}
              {autoTriggerNotice && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.65rem',
                    background: 'var(--success-bg)',
                    border: '1px solid var(--success)',
                    color: 'var(--success)',
                    fontSize: '0.86rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>{autoTriggerNotice}</span>
                </div>
              )}

              {/* Status & Replies Dashboard Control Banner */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '0.75rem',
                  padding: '1.15rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MessageSquare size={18} color="var(--accent-primary)" />
                    <span>Status & Replies Dashboard (Incoming Responses & 7-10d Inactivity Triggers)</span>
                  </h4>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                    Captures real-time incoming responses from institutional decision makers with contextual AI reply drafting and automated inactivity follow-ups.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleTriggerAutoReminders}
                    disabled={isTriggeringFollowups}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.5rem 1.15rem',
                      borderRadius: '0.55rem',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: isTriggeringFollowups ? 'not-allowed' : 'pointer',
                      boxShadow: 'var(--shadow-sm)',
                      opacity: isTriggeringFollowups ? 0.7 : 1,
                    }}
                  >
                    {isTriggeringFollowups ? <Loader2 size={15} className="animate-spin" /> : <Clock size={15} />}
                    <span>{isTriggeringFollowups ? 'Triggering Reminders...' : '⚡ Trigger 7-10d Auto-Reminders'}</span>
                  </button>
                </div>
              </div>

              {/* Status Filter Tabs: Sent Mail / Outbox, Inbox, Bounce List */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  {
                    id: 'pending' as const,
                    label: 'Sent Mail / Outbox',
                    icon: Send,
                    count: outreachLogs.filter((l) => l.status !== 'replied' && l.status !== 'flagged_generic' && l.status !== 'bounced').length,
                  },
                  {
                    id: 'replied' as const,
                    label: 'Inbox',
                    icon: Mail,
                    count: outreachLogs.filter((l) => l.status === 'replied').length,
                  },
                  {
                    id: 'flagged' as const,
                    label: 'Bounce List',
                    icon: AlertTriangle,
                    count: outreachLogs.filter((l) => l.status === 'flagged_generic' || l.status === 'bounced').length,
                  },
                  {
                    id: 'all' as const,
                    label: 'All Dispatches',
                    icon: Layers,
                    count: outreachLogs.length,
                  },
                ].map((tab) => {
                  const isActive = phase2StatusTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPhase2StatusTab(tab.id)}
                      style={{
                        padding: '0.45rem 0.95rem',
                        borderRadius: '0.55rem',
                        background: isActive ? 'var(--accent-primary)' : 'var(--bg-card)',
                        border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--border-medium)',
                        color: isActive ? '#ffffff' : 'var(--text-main)',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        boxShadow: isActive ? '0 2px 8px rgba(99, 102, 241, 0.35)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Icon size={14} color={isActive ? '#ffffff' : 'currentColor'} />
                      <span>{tab.label}</span>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          padding: '0.08rem 0.45rem',
                          borderRadius: '9999px',
                          background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-tertiary)',
                          color: isActive ? '#ffffff' : 'var(--text-subtle)',
                          fontWeight: 800,
                        }}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Status & Replies Table */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ padding: '0.85rem 1.15rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Institutional Interactions & Incoming Responses
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                    Showing {
                      outreachLogs.filter((log) => {
                        if (phase2StatusTab === 'replied') return log.status === 'replied';
                        if (phase2StatusTab === 'pending') return log.status !== 'replied' && log.status !== 'flagged_generic' && log.status !== 'bounced';
                        if (phase2StatusTab === 'flagged') return log.status === 'flagged_generic' || log.status === 'bounced';
                        return true;
                      }).length
                    } records
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-medium)' }}>
                        <th style={{ padding: '0.7rem 0.95rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Institution & Mailbox</th>
                        <th style={{ padding: '0.7rem 0.95rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sequence & Timing</th>
                        <th style={{ padding: '0.7rem 0.95rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status / Trigger</th>
                        <th style={{ padding: '0.7rem 0.95rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>Captured Partner Response</th>
                        <th style={{ padding: '0.7rem 0.95rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filtered = outreachLogs.filter((log) => {
                          if (phase2StatusTab === 'replied') return log.status === 'replied';
                          if (phase2StatusTab === 'pending') return log.status !== 'replied' && log.status !== 'flagged_generic' && log.status !== 'bounced';
                          if (phase2StatusTab === 'flagged') return log.status === 'flagged_generic' || log.status === 'bounced';
                          return true;
                        });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.86rem', fontWeight: 400 }}>
                                No institutional interactions matching this view tab.
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((log) => {
                          const daysSinceContact = Math.floor((Date.now() - (log.lastFollowupAt || log.sentAt || log.lastChecked)) / 86400000);
                          const isOverdue = daysSinceContact >= 7 && log.status !== 'replied' && log.phase !== 'pushed_partner';
                          const isReplied = log.status === 'replied';

                          return (
                            <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)', background: isReplied ? 'var(--success-bg)' : isOverdue ? 'var(--warning-bg)' : 'transparent' }}>
                              <td style={{ padding: '0.8rem 0.95rem', maxWidth: '240px' }}>
                                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                  {log.institutionName}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 500, marginTop: '0.15rem' }}>
                                  {log.recipientName || 'Admissions Desk'}
                                </div>
                                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                  To: {log.recipientEmail}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 400 }}>
                                  From: {log.senderEmail || 'partnerships@ila-academy.com'}
                                </div>
                              </td>

                              <td style={{ padding: '0.8rem 0.95rem', whiteSpace: 'nowrap' }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-main)' }}>
                                  {formatRelativeTime(log.sentAt)}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                                  <span style={{ fontSize: '0.74rem', fontWeight: 600, padding: '0.1rem 0.45rem', borderRadius: '0.35rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                                    Seq #{log.followupCount || 0}
                                  </span>
                                  {log.retryCount && log.retryCount > 0 ? (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                                      {log.retryCount}x retry
                                    </span>
                                  ) : null}
                                </div>
                              </td>

                              <td style={{ padding: '0.8rem 0.95rem' }}>
                                {isReplied ? (
                                  <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <CheckCircle2 size={12} />
                                    <span>Partner Replied</span>
                                  </span>
                                ) : isOverdue ? (
                                  <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.15)', padding: '0.18rem 0.5rem', borderRadius: '9999px', border: '1px solid var(--warning)', whiteSpace: 'nowrap' }}>
                                    ⚠️ Auto-Reminder Due ({daysSinceContact}d)
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                    In Window ({7 - daysSinceContact}d left)
                                  </span>
                                )}
                              </td>

                              {/* Captured Partner Reply Excerpt & Sentiment */}
                              <td style={{ padding: '0.8rem 0.95rem', maxWidth: '340px' }}>
                                {log.responseExcerpt || isReplied ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                      {log.responseSentiment === 'meeting_requested' ? (
                                        <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.08rem 0.45rem', borderRadius: '9999px', background: 'var(--accent-gradient-subtle)', color: 'var(--accent-primary)', border: '1px solid var(--border-medium)' }}>
                                          📅 Meeting Requested
                                        </span>
                                      ) : log.responseSentiment === 'negotiation' ? (
                                        <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.08rem 0.45rem', borderRadius: '9999px', background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid var(--warning)' }}>
                                          ⚖️ Terms Negotiation
                                        </span>
                                      ) : log.responseSentiment === 'declined' ? (
                                        <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.08rem 0.45rem', borderRadius: '9999px', background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid var(--error)' }}>
                                          ❌ Declined
                                        </span>
                                      ) : (
                                        <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.08rem 0.45rem', borderRadius: '9999px', background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success)' }}>
                                          🎓 Interested
                                        </span>
                                      )}
                                      <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 400 }}>
                                        {formatRelativeTime(log.responseReceivedAt || log.lastChecked)}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: 1.4, background: 'var(--bg-secondary)', padding: '0.35rem 0.6rem', borderRadius: '0.45rem', border: '1px solid var(--border-subtle)', fontWeight: 400 }}>
                                      "{log.responseExcerpt || 'We reviewed your articulation proposal and would like to proceed with setting up bilateral student quotas.'}"
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontStyle: 'italic', fontWeight: 400 }}>
                                      Awaiting institutional reply...
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleSimulatePartnerReply(log)}
                                      style={{
                                        padding: '0.22rem 0.5rem',
                                        borderRadius: '0.35rem',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-subtle)',
                                        color: 'var(--accent-primary)',
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                      }}
                                      title="Simulate incoming response for demonstration"
                                    >
                                      Simulate Reply
                                    </button>
                                  </div>
                                )}
                              </td>

                              {/* Action Buttons: AI Auto-Reply & Book Meeting */}
                              <td style={{ padding: '0.8rem 0.95rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                  {isReplied ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenAiReplyModal(log)}
                                        style={{
                                          padding: '0.35rem 0.75rem',
                                          borderRadius: '0.45rem',
                                          background: 'var(--accent-primary)',
                                          border: 'none',
                                          color: '#ffffff',
                                          fontSize: '0.78rem',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.3rem',
                                          boxShadow: 'var(--shadow-sm)',
                                        }}
                                        title="Open AI Auto-Reply Assistant to synthesize contextual response"
                                      >
                                        <Sparkles size={12} />
                                        <span>Draft AI Reply</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleMarkRepliedAndSchedule(log)}
                                        style={{
                                          padding: '0.35rem 0.7rem',
                                          borderRadius: '0.45rem',
                                          background: 'var(--bg-secondary)',
                                          border: '1px solid var(--border-medium)',
                                          color: 'var(--text-main)',
                                          fontSize: '0.78rem',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.25rem',
                                        }}
                                      >
                                        <Calendar size={12} />
                                        <span>Book Meeting</span>
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleRetriggerDelivery(log)}
                                        style={{
                                          padding: '0.32rem 0.6rem',
                                          borderRadius: '0.45rem',
                                          background: 'var(--bg-secondary)',
                                          border: '1px solid var(--border-subtle)',
                                          color: 'var(--text-muted)',
                                          fontSize: '0.76rem',
                                          fontWeight: 500,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.2rem',
                                        }}
                                        title="Re-trigger outreach sequence"
                                      >
                                        <RotateCcw size={11} />
                                        <span>Re-trigger</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleMarkRepliedAndSchedule(log)}
                                        style={{
                                          padding: '0.32rem 0.65rem',
                                          borderRadius: '0.45rem',
                                          background: 'var(--accent-gradient-subtle)',
                                          border: '1px solid var(--border-medium)',
                                          color: 'var(--accent-primary)',
                                          fontSize: '0.76rem',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                        }}
                                      >
                                        Mark Replied
                                      </button>
                                    </>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOutreachLog(log.id)}
                                    style={{
                                      padding: '0.32rem 0.45rem',
                                      borderRadius: '0.45rem',
                                      background: 'var(--bg-card)',
                                      border: '1px solid var(--border-subtle)',
                                      color: 'var(--text-subtle)',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                    title="Delete outreach log record"
                                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-subtle)')}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PHASE 3: MEETING & APPOINTMENT SCHEDULING (Coordination & Calendar Setup)  */}
          {/* ========================================================================= */}
          {activeProcessPhase === 'phase3_meetings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '0.75rem',
                  padding: '1.15rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={19} color="var(--accent-primary)" />
                    <span>Responsive Institutions & Virtual Meeting Scheduler</span>
                  </h4>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    Coordinate bilateral negotiations, Google Meet / Zoom dates, and commission alignment with responsive institutional deans.
                  </p>
                </div>

                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--accent-primary)', background: 'var(--accent-gradient-subtle)', padding: '0.3rem 0.75rem', borderRadius: '9999px', border: '1px solid var(--border-medium)' }}>
                  {outreachLogs.filter((l) => l.phase === 'meeting' || l.status === 'replied').length} Institutions in Negotiation
                </span>
              </div>

              {/* Meeting Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
                {outreachLogs
                  .filter((l) => l.phase === 'meeting' || l.status === 'replied')
                  .map((log) => (
                    <div
                      key={log.id}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: '0.85rem',
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.85rem',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {log.institutionName}
                          </div>
                          <div style={{ fontSize: '0.84rem', color: 'var(--accent-primary)', fontWeight: 600, marginTop: '0.15rem' }}>
                            Liaison: {log.recipientName || 'Executive Desk'} ({log.recipientEmail})
                          </div>
                        </div>

                        <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '9999px', background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success)' }}>
                          ✓ Replied
                        </span>
                      </div>

                      {/* Scheduled Meeting Details Box */}
                      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '0.65rem', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.86rem', color: 'var(--text-main)', fontWeight: 600 }}>
                          <Calendar size={14} color="var(--accent-primary)" />
                          <span>Appointment: {log.meetingScheduledAt || 'Not scheduled yet'}</span>
                        </div>

                        {log.meetingLink && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem' }}>
                            <Video size={14} color="#10b981" />
                            <a href={log.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
                              {log.meetingLink}
                            </a>
                          </div>
                        )}

                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                          <strong>Agenda:</strong> {log.meetingAgenda || 'Review bilateral revenue sharing and degree articulation curriculum.'}
                        </div>

                        {log.meetingNotes && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', background: 'var(--bg-tertiary)', padding: '0.4rem 0.6rem', borderRadius: '0.4rem' }}>
                            <strong>Notes:</strong> {log.meetingNotes}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLogForMeeting(log);
                            setMeetingModalOpen(true);
                          }}
                          style={{
                            flex: 1,
                            padding: '0.45rem 0.75rem',
                            borderRadius: '0.5rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-medium)',
                            color: 'var(--text-main)',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          📅 Edit Appointment
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAdvanceToPushToPartner(log)}
                          style={{
                            flex: 1,
                            padding: '0.45rem 0.75rem',
                            borderRadius: '0.5rem',
                            background: 'var(--success-bg)',
                            border: '1px solid var(--success)',
                            color: 'var(--success)',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          ✓ Finalize Terms & Advance
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PHASE 4: PUSH TO PARTNERS (Structured Institution Profile & Migration)     */}
          {/* ========================================================================= */}
          {activeProcessPhase === 'phase4_push_partners' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Notice Banner */}
              {pushSuccessNotice && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.65rem',
                    background: 'var(--success-bg)',
                    border: '1px solid var(--success)',
                    color: 'var(--success)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>{pushSuccessNotice}</span>
                </div>
              )}

              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '0.75rem',
                  padding: '1.15rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Award size={19} color="var(--accent-primary)" />
                    <span>Negotiated Leads Staging Area & Official Partner Migration</span>
                  </h4>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    Fully validated institutions with finalized revenue shares, academic thresholds, and official bilateral MOU terms ready to migrate into the official Partners database.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveMainTab('partners')}
                  style={{
                    padding: '0.45rem 0.95rem',
                    borderRadius: '0.5rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--accent-primary)',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <span>View Partners Directory</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Comprehensive Structured Profiles of Ready Leads */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {outreachLogs.filter((l) => l.phase === 'pushed_partner' || l.status === 'replied').length === 0 ? (
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px dashed var(--border-medium)',
                      borderRadius: '0.85rem',
                      padding: '2.5rem 1.5rem',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.65rem',
                    }}
                  >
                    <Award size={36} color="var(--accent-primary)" style={{ opacity: 0.6 }} />
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      No Negotiated Leads Ready for Partner Migration Yet
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '520px', lineHeight: 1.5 }}>
                      Institutions appear here after completing Phase 1 Outreach, tracking follow-up triggers in Phase 2, and finalizing bilateral negotiation terms & appointments in Phase 3.
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveProcessPhase('phase3_meetings')}
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.45rem 1rem',
                        borderRadius: '0.5rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-medium)',
                        color: 'var(--accent-primary)',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Go to Phase 3: Meeting & Negotiations
                    </button>
                  </div>
                ) : (
                  outreachLogs
                    .filter((l) => l.phase === 'pushed_partner' || l.status === 'replied')
                    .map((log) => {
                    const leadObj = allResourcesLeads.find((l) => l.id === log.leadId || l.name === log.institutionName);
                    const isAlreadyPartner = leadObj?.isPartner === true;

                    return (
                      <div
                        key={log.id}
                        style={{
                          background: 'var(--bg-card)',
                          border: isAlreadyPartner ? '1px solid var(--success)' : '1px solid var(--border-medium)',
                          borderRadius: '0.85rem',
                          padding: '1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1rem',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        {/* Header: Institution & Agreed Commission */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Building2 size={18} color="var(--accent-primary)" />
                              <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                {log.institutionName}
                              </h3>
                              {isAlreadyPartner && (
                                <span style={{ fontSize: '0.74rem', fontWeight: 800, padding: '0.12rem 0.55rem', borderRadius: '9999px', background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success)' }}>
                                  ✓ Official Active Partner
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              Liaison: {log.recipientName} ({log.recipientEmail})
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--success)', background: 'var(--success-bg)', border: '1px solid var(--success)', padding: '0.3rem 0.75rem', borderRadius: '9999px' }}>
                              💰 {leadObj?.commissionPercent || 20}% Institutional Commission
                            </span>

                            <button
                              type="button"
                              onClick={() => handlePushToOfficialPartnerDatabase(log)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.45rem 1rem',
                                borderRadius: '0.5rem',
                                background: isAlreadyPartner ? 'var(--bg-secondary)' : 'var(--success-bg)',
                                border: isAlreadyPartner ? '1px solid var(--border-medium)' : '1px solid var(--success)',
                                color: isAlreadyPartner ? 'var(--text-muted)' : 'var(--success)',
                                fontSize: '0.84rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              <CheckCircle2 size={15} />
                              <span>{isAlreadyPartner ? 'Update Partner Profile' : 'Migrate to Partners Database'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteOutreachLog(log.id)}
                              style={{
                                padding: '0.45rem 0.55rem',
                                borderRadius: '0.5rem',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-medium)',
                                color: 'var(--text-subtle)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Delete Process Record"
                              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-subtle)')}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Structured Profile Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
                          {/* 1. Academic Criteria */}
                          <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '0.6rem', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                              🎓 Admission & Language Standards
                            </div>
                            <div style={{ fontSize: '0.86rem', color: 'var(--text-main)', fontWeight: 600 }}>
                              Min IELTS Score: ≤ {leadObj?.minIeltsScore ?? 6.0}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              German Requirement: {leadObj?.germanLevelRequired || 'English Only (No German required)'}
                            </div>
                          </div>

                          {/* 2. Tuition & Scholarship Terms */}
                          <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '0.6rem', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                              💶 Tuition Fees & Scholarships
                            </div>
                            <div style={{ fontSize: '0.86rem', color: 'var(--text-main)', fontWeight: 600 }}>
                              Annual Tuition: {leadObj?.tuitionFeeYearly || '€0 Public (Semester admin fee only)'}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              Scholarships: {leadObj?.scholarshipDetails || 'Merit and regional fee discount quotas available.'}
                            </div>
                          </div>

                          {/* 3. Articulated Courses */}
                          <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '0.6rem', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                              📚 Articulated Degree Programs
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              {(leadObj?.courseList || ['B.Sc. Applied Computing', 'M.Sc. Business Analytics', 'B.A. International Management']).map((crs, cIdx) => (
                                <span key={cIdx} style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                                  • {crs}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* 4. Official MOU Blueprint & Source */}
                          <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: '0.6rem', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                              📜 Official MOU & Terms Link
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                              {leadObj?.termsOfPartnership || 'Non-exclusive bilateral partnership with quarterly SEPA commission reconciliation.'}
                            </div>
                            <a
                              href={leadObj?.directSourcePageUrl || leadObj?.websiteUrl || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                color: 'var(--accent-primary)',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                marginTop: '0.4rem',
                              }}
                            >
                              <span>Official Terms Link</span>
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  }))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. PAGE 4: PARTNERS (FINALIZED TIE-UPS WITH CATEGORY & COUNTRY FILTERS) */}
      {activeMainTab === 'partners' && (
        <div
          id="tieup-partners-tab-view"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.15rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={20} color="var(--accent-primary)" />
                <span>Finalized Institutional Partners ({finalizedPartners.length} Active Tie-ups)</span>
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                Official accredited partners with signed Memorandums of Understanding (MOUs) and active commercial agreements.
              </p>
            </div>

            {finalizedPartners.length === 0 && allResourcesLeads.length > 0 && (
              <button
                type="button"
                onClick={handleSeedInitialPartners}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.95rem',
                  borderRadius: '0.55rem',
                  background: 'var(--success-bg)',
                  border: '1px solid var(--success)',
                  color: 'var(--success)',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Check size={14} strokeWidth={2.5} />
                <span>Promote Top 3 Leads to Partners</span>
              </button>
            )}
          </div>

          {/* Category, Country & Search Filters for Partners */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '320px' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
              <input
                type="text"
                value={partnerSearchFilter}
                onChange={(e) => setPartnerSearchFilter(e.target.value)}
                placeholder="Search active partners..."
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                  borderRadius: '0.5rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-main)',
                  fontSize: '0.86rem',
                  outline: 'none',
                }}
              />
            </div>

            <select
              value={partnerCategoryFilter}
              onChange={(e) => setPartnerCategoryFilter(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: '0.5rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-main)',
                fontSize: '0.86rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all" style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>All Categories</option>
              {TIEUP_CATEGORIES.map((c) => (
                <option key={c.id} value={c.name} style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>{c.name}</option>
              ))}
            </select>

            <select
              value={partnerCountryFilter}
              onChange={(e) => setPartnerCountryFilter(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: '0.5rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-main)',
                fontSize: '0.86rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all" style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>All Geographies</option>
              {TARGET_COUNTRIES.map((c) => (
                <option key={c.id} value={c.name} style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>{c.name}</option>
              ))}
            </select>

            {/* Global Settings & Saved Lists */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              {renderSettingsButton()}
              {renderFullScreenButton('tieup-partners-fullscreen-toggle-btn')}
            </div>
          </div>

          {finalizedPartners.length === 0 ? (
            <div
              style={{
                padding: '3rem 1.5rem',
                textAlign: 'center',
                background: 'var(--bg-card)',
                border: '1px dashed var(--border-medium)',
                borderRadius: '0.75rem',
                maxWidth: '520px',
                margin: '2rem auto',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Award size={40} color="var(--accent-primary)" style={{ margin: '0 auto 0.75rem auto' }} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.4rem 0' }}>
                No Finalized Partners Matching Filters
              </h4>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                Promote matched leads from the <strong>Chat Home</strong> or <strong>Resources</strong> tab once contract terms or outreach responses are confirmed.
              </p>
              {allResourcesLeads.length > 0 && (
                <button
                  type="button"
                  onClick={handleSeedInitialPartners}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '0.5rem',
                    background: 'var(--accent-primary)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  Promote Top Compatible Leads Now
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                overflowX: 'auto',
                border: '1px solid var(--border-medium)',
                borderRadius: '0.75rem',
                background: 'var(--bg-card)',
                boxShadow: 'var(--shadow-sm)',
                userSelect: 'none',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '980px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-medium)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <th style={{ padding: '0.65rem 0.75rem', width: '38px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={finalizedPartners.length > 0 && selectedLeadIds.size === finalizedPartners.length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedLeadIds(new Set(finalizedPartners.map((l) => l.id)));
                          else setSelectedLeadIds(new Set());
                        }}
                        style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                      />
                    </th>
                    <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Institution Name & Location
                    </th>
                    <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                      Language & Academic Requirements
                    </th>
                    <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                      Scholarship Availability
                    </th>
                    <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase' }}>
                      Commission / Margin
                    </th>
                    <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Programs & Terms
                    </th>
                    <th style={{ padding: '0.65rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {finalizedPartners.map((partner) => {
                    const hasDirectUrl = isValidDirectUrl(partner.directSourcePageUrl);
                    const hasWebsite = isValidDirectUrl(partner.websiteUrl);

                    return (
                      <tr
                        key={partner.id}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          background: selectedLeadIds.has(partner.id) ? 'var(--accent-gradient-subtle)' : 'var(--success-bg)',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        {/* Checkbox */}
                        <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={selectedLeadIds.has(partner.id)}
                            onChange={(e) => {
                              const next = new Set(selectedLeadIds);
                              if (e.target.checked) next.add(partner.id);
                              else next.delete(partner.id);
                              setSelectedLeadIds(next);
                            }}
                            style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                          />
                        </td>

                        {/* Institution Name & Location (Location directly underneath Name as subtitle) */}
                        <td style={{ padding: '0.75rem 0.85rem', maxWidth: '280px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.3 }}>
                              {partner.name}
                            </span>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.45rem',
                                borderRadius: '9999px',
                                background: 'var(--bg-secondary)',
                                color: 'var(--success)',
                                border: '1px solid var(--success)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                flexShrink: 0,
                              }}
                            >
                              <CheckCircle2 size={11} />
                              <span>Active Partner</span>
                            </span>
                          </div>
                          {/* Subtitle: Location / City */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            <MapPin size={12} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                            <span>{partner.region || partner.locationMain || partner.country || 'Location Not Specified'}</span>
                          </div>
                          {/* Official Portal / Source */}
                          <div style={{ marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                            {hasWebsite ? (
                              <a
                                href={partner.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: '0.76rem',
                                  color: 'var(--accent-primary)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  textDecoration: 'none',
                                  fontWeight: 500,
                                }}
                                title={`Official website: ${partner.websiteUrl}`}
                              >
                                <span>{partner.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                                <ExternalLink size={10} />
                              </a>
                            ) : (
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Website: Not Available</span>
                            )}
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                              • {partner.category}
                            </span>
                          </div>
                          {/* Contact Liaison */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                            <span style={{ fontSize: '0.76rem', color: 'var(--text-main)', fontWeight: 500 }}>
                              {partner.contactPerson}
                            </span>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              ({partner.contactEmail})
                            </span>
                          </div>
                        </td>

                        {/* Language & Academic Requirements */}
                        <td style={{ padding: '0.75rem 0.85rem', maxWidth: '180px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.12rem 0.45rem',
                                borderRadius: '0.35rem',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-medium)',
                                color: 'var(--text-main)',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                width: 'fit-content',
                              }}
                            >
                              <span>Min IELTS: ≤ {partner.minIeltsScore ?? 6.0}</span>
                            </span>
                            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                              German: {partner.germanLevelRequired || 'None (English taught)'}
                            </span>
                          </div>
                        </td>

                        {/* Scholarship Availability: Strict Verification */}
                        <td style={{ padding: '0.75rem 0.85rem', maxWidth: '170px' }}>
                          {partner.scholarshipAvailable ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.12rem 0.45rem',
                                  borderRadius: '9999px',
                                  background: 'var(--success-bg)',
                                  border: '1px solid var(--success)',
                                  color: 'var(--success)',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  width: 'fit-content',
                                }}
                              >
                                <span>🎓 Yes</span>
                              </span>
                              {hasDirectUrl ? (
                                <a
                                  href={partner.directSourcePageUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    fontSize: '0.74rem',
                                    color: 'var(--accent-primary)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.2rem',
                                    marginTop: '0.15rem',
                                    textDecoration: 'none',
                                    fontWeight: 500,
                                  }}
                                  title="Inspect exact verified scholarship page"
                                >
                                  <span>Direct Policy Page</span>
                                  <ExternalLink size={10} />
                                </a>
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                  Policy Link: Not Available
                                </span>
                              )}
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '0.1rem', lineHeight: 1.3 }}>
                                {partner.scholarshipDetails || 'Merit scholarships available'}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None</span>
                          )}
                        </td>

                        {/* Commission / Profit Margin: Strict Verification */}
                        <td style={{ padding: '0.75rem 0.85rem', maxWidth: '170px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.15rem 0.55rem',
                                borderRadius: '9999px',
                                background: (partner.commissionPercent || 20) >= 20 ? 'var(--success-bg)' : 'var(--accent-gradient-subtle)',
                                border: (partner.commissionPercent || 20) >= 20 ? '1px solid var(--success)' : '1px solid var(--border-medium)',
                                color: (partner.commissionPercent || 20) >= 20 ? 'var(--success)' : 'var(--accent-primary)',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                width: 'fit-content',
                              }}
                            >
                              <span>💰 {partner.commissionPercent || 20}%</span>
                            </span>
                            {hasDirectUrl ? (
                              <a
                                href={partner.directSourcePageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: '0.74rem',
                                  color: 'var(--success)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  marginTop: '0.15rem',
                                  textDecoration: 'none',
                                  fontWeight: 500,
                                }}
                                title="Inspect exact verified commission terms"
                              >
                                <span>Direct Terms Page</span>
                                <ExternalLink size={10} />
                              </a>
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                Terms Link: Not Available
                              </span>
                            )}
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '0.1rem' }}>
                              {partner.tuitionFeeYearly || '€0 (Public)'} • {partner.compatibilityScore || 95}% Fit
                            </div>
                          </div>
                        </td>

                        {/* Programs & Terms */}
                        <td style={{ padding: '0.75rem 0.85rem', maxWidth: '220px' }}>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.35, fontWeight: 500 }}>
                            {partner.termsSummary || partner.termsOfPartnership}
                          </div>
                          {partner.courseList && partner.courseList.length > 0 && (
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                              {partner.courseList.slice(0, 2).map((course, cIdx) => (
                                <span key={cIdx} style={{ padding: '0.04rem 0.32rem', borderRadius: '0.25rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                                  {course}
                                </span>
                              ))}
                              {partner.courseList.length > 2 && (
                                <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>+{partner.courseList.length - 2} more</span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenTermsModal(partner)}
                              style={{
                                padding: '0.35rem 0.65rem',
                                borderRadius: '0.45rem',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-medium)',
                                color: 'var(--accent-primary)',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              View Signed MOU
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTogglePartner(partner)}
                              style={{
                                padding: '0.35rem 0.65rem',
                                borderRadius: '0.45rem',
                                background: 'var(--error-bg)',
                                border: '1px solid var(--error)',
                                color: 'var(--error)',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Revoke
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. MODAL: DETAILED BILATERAL MOU & POLICY AGREEMENT BLUEPRINT */}
      {isModalOpen && selectedLeadForModal && (
        <div
          id="tieup-terms-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="animate-pop-in"
            style={{
              width: '100%',
              maxWidth: '850px',
              maxHeight: '90vh',
              background: 'var(--modal-bg)',
              border: '1px solid var(--modal-border)',
              borderRadius: '0.9rem',
              boxShadow: 'var(--modal-shadow)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1rem 1.4rem',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--modal-header-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '0.7rem',
                    background: 'linear-gradient(135deg, #d946ef 0%, #a21caf 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <Handshake size={17} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    {selectedLeadForModal.name}
                  </h2>
                  <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', marginTop: '0.1rem' }}>
                    Institutional Bilateral Policy & Memorandum of Understanding (MOU)
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '0.45rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.3rem',
                }}
              >
                <X size={17} />
              </button>
            </div>

            {/* Modal Body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.4rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.15rem',
                fontSize: '0.8rem',
                lineHeight: '1.6',
              }}
            >
              {/* Metrics Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.65rem',
                }}
              >
                <div style={{ padding: '0.75rem', borderRadius: '0.6rem', background: 'var(--bg-card)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ fontSize: '0.66rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 800 }}>
                    💰 Profit Margin / Comm. %
                  </div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>
                    {selectedLeadForModal.commissionPercent || 20}% Margin
                  </div>
                  <div style={{ fontSize: '0.64rem', color: 'var(--text-subtle)', marginTop: '0.1rem' }}>
                    {selectedLeadForModal.termsSummary}
                  </div>
                </div>

                <div style={{ padding: '0.75rem', borderRadius: '0.6rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Region & Campus
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.2rem' }}>
                    {selectedLeadForModal.locationMain}
                  </div>
                  <div style={{ fontSize: '0.64rem', color: 'var(--text-subtle)', marginTop: '0.1rem' }}>
                    {selectedLeadForModal.country}
                  </div>
                </div>

                <div style={{ padding: '0.75rem', borderRadius: '0.6rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Direct Executive Liaison
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f0abfc', marginTop: '0.2rem' }}>
                    {selectedLeadForModal.contactPerson}
                  </div>
                  <div style={{ fontSize: '0.64rem', color: 'var(--text-subtle)', marginTop: '0.1rem' }}>
                    {selectedLeadForModal.contactEmail}
                  </div>
                </div>
              </div>

              {/* Bilateral Draft MOU Agreement Text */}
              <div
                style={{
                  padding: '1.15rem',
                  borderRadius: '0.7rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                }}
              >
                <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.6rem 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Memorandum of Understanding (MOU) Framework
                </h4>
                <p>
                  <strong>ARTICLE 1: PURPOSE & SCOPE</strong><br />
                  This agreement formalizes cooperation between <strong>{selectedLeadForModal.name}</strong> and <strong>Ila Academy</strong>. Both parties establish an articulated international admissions and business collaboration framework facilitating bilateral progression, verified pre-screening, and mutual service standards.
                </p>
                <p>
                  <strong>ARTICLE 2: COMMERCIAL REMUNERATION & COMMISSIONS</strong><br />
                  The Entity agrees to remunerate Ila Academy as authorized partner: <em>{selectedLeadForModal.termsOfPartnership || selectedLeadForModal.termsSummary}</em> ({selectedLeadForModal.commissionPercent || 20}% commercial profit tier), payable within 30 days of the verification date upon successful placement or transaction confirmation.
                </p>
                {selectedLeadForModal.studentRequirements && (
                  <p>
                    <strong>ARTICLE 3: STUDENT ENTRY REQUIREMENTS & CRITERIA</strong><br />
                    Ila Academy pre-screens and nominates candidates meeting prerequisite thresholds: <em>{selectedLeadForModal.studentRequirements}</em>.
                  </p>
                )}
                {selectedLeadForModal.institutionCriteria && (
                  <p>
                    <strong>ARTICLE 4: INSTITUTIONAL GOVERNANCE & COMPLIANCE</strong><br />
                    Both institutions agree to honor bilateral standards: <em>{selectedLeadForModal.institutionCriteria}</em>.
                  </p>
                )}
                <p>
                  <strong>ARTICLE 5: TERM & TERMINATION</strong><br />
                  This Memorandum remains valid for a rolling period of 3 years and may be renewed upon mutual written consent. Either party may terminate with 90-day bilateral written notice.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '0.8rem 1.4rem',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--modal-header-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.6rem',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>Direct Policy Source:</span>
                <a
                  href={selectedLeadForModal.directSourcePageUrl || selectedLeadForModal.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#38bdf8', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  <span>{selectedLeadForModal.directSourcePageUrl || selectedLeadForModal.websiteUrl}</span>
                  <ExternalLink size={10} />
                </a>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => handleCopyText(`MOU Agreement: ${selectedLeadForModal.name}\nCommission: ${selectedLeadForModal.commissionPercent || 20}%\nTerms: ${selectedLeadForModal.termsOfPartnership || selectedLeadForModal.termsSummary}\nRequirements: ${selectedLeadForModal.studentRequirements || 'N/A'}\nContact: ${selectedLeadForModal.contactPerson} (${selectedLeadForModal.contactEmail})\nWebsite: ${selectedLeadForModal.directSourcePageUrl || selectedLeadForModal.websiteUrl}`, 'modal_copy')}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '0.45rem',
                    background: 'var(--btn-default-bg)',
                    border: '1px solid var(--btn-default-border)',
                    color: copiedId === 'modal_copy' ? '#10b981' : 'var(--btn-default-color)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {copiedId === 'modal_copy' ? 'Copied to Clipboard' : 'Copy MOU Text'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: '0.45rem',
                    background: 'linear-gradient(135deg, #d946ef 0%, #a21caf 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. OUR POLICIES & PARTNERSHIP CRITERIA CONFIGURATION MODAL */}
      {isPolicyModalOpen && (
        <div
          id="tieup-policies-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setIsPolicyModalOpen(false)}
        >
          <div
            className="animate-pop-in"
            style={{
              width: '100%',
              maxWidth: '820px',
              maxHeight: '90vh',
              background: 'var(--modal-bg)',
              border: '1px solid var(--modal-border)',
              borderRadius: '1rem',
              boxShadow: 'var(--modal-shadow)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1rem 1.4rem',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--modal-header-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '0.6rem',
                    background: 'linear-gradient(135deg, #d946ef 0%, #a21caf 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <Settings size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>Our Policies & Partnership Criteria Configuration</span>
                    <span style={{ fontSize: '0.62rem', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.5)', color: '#34d399', padding: '0.1rem 0.4rem', borderRadius: '9999px', fontWeight: 800 }}>
                      AI Research Baseline
                    </span>
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    Define our institutional benchmarks, commission targets, and student requirements. AI search grounding strictly evaluates and ranks prospects against these guidelines.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPolicyModalOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '0.45rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSavePolicies} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.4rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.1rem', flex: 1 }}>
                
                {/* 1. Commission & Profit Target Sliders */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        💰 Target / Preferred Commission
                      </label>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#34d399' }}>
                        {ourPolicies.targetCommissionPercent}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="1"
                      value={ourPolicies.targetCommissionPercent}
                      onChange={(e) => setOurPolicies({ ...ourPolicies, targetCommissionPercent: Number(e.target.value) })}
                      style={{ width: '100%', accentColor: '#34d399', cursor: 'pointer' }}
                    />
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Institutions offering {ourPolicies.targetCommissionPercent}% or higher are highlighted as prime high-yield tie-ups.
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        ⚖️ Minimum Acceptable Commission
                      </label>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fbbf24' }}>
                        {ourPolicies.minCommissionPercent}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      step="1"
                      value={ourPolicies.minCommissionPercent}
                      onChange={(e) => setOurPolicies({ ...ourPolicies, minCommissionPercent: Number(e.target.value) })}
                      style={{ width: '100%', accentColor: '#fbbf24', cursor: 'pointer' }}
                    />
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Minimum profit threshold to approve outreach or sign bilateral MOUs.
                    </div>
                  </div>
                </div>

                {/* 2. Our Partnership Criteria */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    🏛️ Our Partnership & Institutional Criteria
                  </label>
                  <textarea
                    rows={3}
                    value={ourPolicies.partnershipCriteria}
                    onChange={(e) => setOurPolicies({ ...ourPolicies, partnershipCriteria: e.target.value })}
                    placeholder="E.g. State-accredited institution; direct international admissions mailbox; transparent student tracking portal..."
                    style={{
                      width: '100%',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '0.55rem',
                      padding: '0.65rem 0.8rem',
                      color: 'var(--text-main)',
                      fontSize: '0.78rem',
                      lineHeight: '1.4',
                      resize: 'vertical',
                    }}
                  />
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Prerequisites institutions must satisfy before we commit to active bilateral marketing.
                  </div>
                </div>

                {/* 3. Student Requirements Guidelines */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    🎓 Student Entry Requirements Guidelines
                  </label>
                  <textarea
                    rows={3}
                    value={ourPolicies.studentRequirementsGuidelines}
                    onChange={(e) => setOurPolicies({ ...ourPolicies, studentRequirementsGuidelines: e.target.value })}
                    placeholder="E.g. Minimum IELTS 6.5 / Duolingo 115; B2 German for bilingual courses; APS certificate for India/China..."
                    style={{
                      width: '100%',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '0.55rem',
                      padding: '0.65rem 0.8rem',
                      color: 'var(--text-main)',
                      fontSize: '0.78rem',
                      lineHeight: '1.4',
                      resize: 'vertical',
                    }}
                  />
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Language requirements, GPA standards, and pre-screening guidelines our applicants are prepared to meet.
                  </div>
                </div>

                {/* 4. Terms & Payment Expectations */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    📄 Terms of Partnership & Remuneration Expectations
                  </label>
                  <textarea
                    rows={3}
                    value={ourPolicies.termsExpectations}
                    onChange={(e) => setOurPolicies({ ...ourPolicies, termsExpectations: e.target.value })}
                    placeholder="E.g. 50% upon student visa grant, 50% upon semester 1 census enrollment; 3-year renewable validity..."
                    style={{
                      width: '100%',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '0.55rem',
                      padding: '0.65rem 0.8rem',
                      color: 'var(--text-main)',
                      fontSize: '0.78rem',
                      lineHeight: '1.4',
                      resize: 'vertical',
                    }}
                  />
                </div>

                {/* 5. Preferred Payment Terms */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    💳 Preferred Invoicing & Payment Terms
                  </label>
                  <input
                    type="text"
                    value={ourPolicies.preferredPaymentTerms || ''}
                    onChange={(e) => setOurPolicies({ ...ourPolicies, preferredPaymentTerms: e.target.value })}
                    placeholder="E.g. Net 30 days via direct SEPA/SWIFT wire transfer upon official student enrollment census date"
                    style={{
                      width: '100%',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '0.55rem',
                      padding: '0.55rem 0.8rem',
                      color: 'var(--text-main)',
                      fontSize: '0.78rem',
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div
                style={{
                  padding: '0.8rem 1.4rem',
                  borderTop: '1px solid var(--border-subtle)',
                  background: 'var(--modal-header-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <button
                  type="button"
                  onClick={handleResetPolicyDefaults}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '0.5rem',
                    background: 'var(--btn-default-bg)',
                    border: '1px solid var(--btn-default-border)',
                    color: 'var(--btn-default-color)',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Reset Defaults
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {policySaveSuccess && (
                    <span style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle2 size={13} />
                      <span>Policies Saved & Applied</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsPolicyModalOpen(false)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: '0.5rem',
                      background: 'transparent',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingPolicies}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 1.1rem',
                      borderRadius: '0.5rem',
                      background: 'linear-gradient(135deg, #d946ef 0%, #a21caf 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: isSavingPolicies ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 10px rgba(217, 70, 239, 0.4)',
                    }}
                  >
                    {isSavingPolicies ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2.5} />}
                    <span>Save Policy Baseline</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. VIRTUAL MEETING & APPOINTMENT SCHEDULER MODAL */}
      {meetingModalOpen && selectedLogForMeeting && (
        <div
          id="tieup-meeting-scheduler-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
          }}
          onClick={() => setMeetingModalOpen(false)}
        >
          <div
            className="animate-pop-in"
            style={{
              width: '100%',
              maxWidth: '560px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: '0.9rem',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '1.15rem 1.4rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '0.55rem', background: 'var(--accent-gradient-subtle)', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Schedule Virtual Meeting & Coordination
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {selectedLogForMeeting.institutionName} • {selectedLogForMeeting.recipientName || 'Admissions Liaison'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMeetingModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.35rem' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Date & Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                    📅 Meeting Date:
                  </label>
                  <input
                    type="date"
                    value={meetingFormDate}
                    onChange={(e) => setMeetingFormDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-main)',
                      fontSize: '0.86rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                    ⏰ Meeting Time:
                  </label>
                  <input
                    type="time"
                    value={meetingFormTime}
                    onChange={(e) => setMeetingFormTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-main)',
                      fontSize: '0.86rem',
                    }}
                  />
                </div>
              </div>

              {/* Timezone & Platform */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                    🌐 Timezone:
                  </label>
                  <input
                    type="text"
                    value={meetingFormTz}
                    onChange={(e) => setMeetingFormTz(e.target.value)}
                    placeholder="E.g. CET (Frankfurt)"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-main)',
                      fontSize: '0.86rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                    💻 Platform:
                  </label>
                  <select
                    value={meetingFormPlatform}
                    onChange={(e) => setMeetingFormPlatform(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-main)',
                      fontSize: '0.86rem',
                    }}
                  >
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                    <option value="Direct Call">Direct Phone Call</option>
                  </select>
                </div>
              </div>

              {/* Video Link */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                  🔗 Virtual Meeting Room Link:
                </label>
                <input
                  type="url"
                  value={meetingFormLink}
                  onChange={(e) => setMeetingFormLink(e.target.value)}
                  placeholder="https://meet.google.com/xyz-abcd-efg"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-main)',
                    fontSize: '0.86rem',
                  }}
                />
              </div>

              {/* Agenda */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                  📋 Discussion Agenda:
                </label>
                <input
                  type="text"
                  value={meetingFormAgenda}
                  onChange={(e) => setMeetingFormAgenda(e.target.value)}
                  placeholder="Review 20% tuition commission, course quotas, and MOU signing."
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-main)',
                    fontSize: '0.86rem',
                  }}
                />
              </div>

              {/* Meeting Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                  📝 Meeting Notes / Negotiation Progress:
                </label>
                <textarea
                  rows={3}
                  value={meetingFormNotes}
                  onChange={(e) => setMeetingFormNotes(e.target.value)}
                  placeholder="Key institutional remarks, dean expectations, and agreements..."
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '0.5rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-main)',
                    fontSize: '0.84rem',
                    lineHeight: '1.4',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '0.9rem 1.4rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => setMeetingModalOpen(false)}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '0.5rem',
                  background: 'transparent',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-muted)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMeetingDetails}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 1.25rem',
                  borderRadius: '0.5rem',
                  background: 'var(--accent-primary)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Check size={14} />
                <span>Save Appointment Details</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MANUAL REVIEW & EMAIL CORRECTION MODAL */}
      {manualReviewLog && (
        <div
          id="tieup-manual-review-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
          }}
          onClick={() => setManualReviewLog(null)}
        >
          <div
            className="animate-pop-in"
            style={{
              width: '100%',
              maxWidth: '520px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: '0.9rem',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '1.15rem 1.4rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '0.55rem', background: 'var(--warning-bg)', border: '1px solid var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Manual Mailbox Review & Correction
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {manualReviewLog.institutionName}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManualReviewLog(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.35rem' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '0.85rem', borderRadius: '0.6rem', background: 'var(--warning-bg)', border: '1px solid var(--warning)', color: 'var(--text-main)', fontSize: '0.84rem', lineHeight: '1.45' }}>
                <strong style={{ color: 'var(--warning)' }}>Flag Reason:</strong> {manualReviewLog.flagReason || 'Generic robotic address rejected or bounced by destination mail exchanger.'}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Verified Direct Liaison Mailbox:
                </label>
                <input
                  type="email"
                  value={manualReviewEmail}
                  onChange={(e) => setManualReviewEmail(e.target.value)}
                  placeholder="e.g. partnerships@institution.edu or dean.admissions@..."
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.8rem',
                    borderRadius: '0.5rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-main)',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                  }}
                />
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  Replace the robotic inbox with a verified named liaison (e.g. International Officer or Dean).
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '0.9rem 1.4rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => setManualReviewLog(null)}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '0.5rem',
                  background: 'transparent',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-muted)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResendReviewedLog}
                disabled={!manualReviewEmail.trim()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 1.25rem',
                  borderRadius: '0.5rem',
                  background: 'var(--accent-primary)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: !manualReviewEmail.trim() ? 'not-allowed' : 'pointer',
                  opacity: !manualReviewEmail.trim() ? 0.6 : 1,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <SendHorizontal size={14} />
                <span>Resend Outreach</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. DELETE SEARCH HISTORY THREAD CONFIRMATION POPUP MODAL */}
      {sessionPendingDelete && (
        <div
          id="tieup-delete-confirm-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setSessionPendingDelete(null)}
        >
          <div
            className="animate-pop-in"
            style={{
              width: '100%',
              maxWidth: '460px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: '0.9rem',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              padding: '1.5rem',
              gap: '1.15rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--error-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--error)',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Confirm Thread Deletion
                </h4>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Permanent Action Warning
                </div>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: 1.55 }}>
              Are you sure you want to delete the search session <strong>"{sessionPendingDelete.title}"</strong>? All associated query logs and matched leads in this thread will be permanently removed.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.4rem' }}>
              <button
                type="button"
                onClick={() => setSessionPendingDelete(null)}
                style={{
                  padding: '0.5rem 1.1rem',
                  borderRadius: '0.5rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteSession(sessionPendingDelete.id);
                  setSessionPendingDelete(null);
                }}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.5rem',
                  background: 'var(--error)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Trash2 size={15} />
                <span>Delete Thread</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Auto-Reply Assistant Modal */}
      {aiReplyModalLog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
          }}
          onClick={() => setAiReplyModalLog(null)}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-medium)',
              borderRadius: '0.85rem',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.1rem 1.4rem',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '0.55rem',
                    background: 'var(--accent-gradient-subtle)',
                    border: '1px solid var(--border-medium)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-primary)',
                  }}
                >
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    AI Auto-Reply Assistant
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {aiReplyModalLog.institutionName} • {aiReplyModalLog.recipientEmail}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAiReplyModalLog(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
              {aiDraftSuccessNotice && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    background: 'var(--success-bg, rgba(16, 185, 129, 0.12))',
                    border: '1px solid var(--success-border, rgba(16, 185, 129, 0.3))',
                    color: 'var(--success, #10b981)',
                    fontSize: '0.86rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{aiDraftSuccessNotice}</span>
                </div>
              )}

              {/* Institution's Incoming Message Box */}
              <div
                style={{
                  padding: '0.9rem 1.1rem',
                  borderRadius: '0.65rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                    Incoming Partner Message Excerpt
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 500,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '0.35rem',
                        background:
                          aiReplyModalLog.responseSentiment === 'meeting_requested'
                            ? 'rgba(168, 85, 247, 0.15)'
                            : aiReplyModalLog.responseSentiment === 'negotiation'
                            ? 'rgba(234, 179, 8, 0.15)'
                            : 'rgba(16, 185, 129, 0.15)',
                        color:
                          aiReplyModalLog.responseSentiment === 'meeting_requested'
                            ? '#a855f7'
                            : aiReplyModalLog.responseSentiment === 'negotiation'
                            ? '#eab308'
                            : '#10b981',
                        border: '1px solid currentColor',
                        textTransform: 'capitalize',
                      }}
                    >
                      {aiReplyModalLog.responseSentiment ? aiReplyModalLog.responseSentiment.replace('_', ' ') : 'Interested'}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {aiReplyModalLog.responseReceivedAt ? new Date(aiReplyModalLog.responseReceivedAt).toLocaleDateString() : 'Today'}
                    </span>
                  </div>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.86rem',
                    color: 'var(--text-main)',
                    lineHeight: 1.5,
                    fontStyle: 'italic',
                  }}
                >
                  "{aiReplyModalLog.responseExcerpt || 'We reviewed your articulation proposal and would like to proceed with bilateral discussion.'}"
                </p>
              </div>

              {/* Subject Field */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  Response Subject Line:
                </label>
                <input
                  type="text"
                  value={aiDraftedSubject}
                  onChange={(e) => setAiDraftedSubject(e.target.value)}
                  disabled={isGeneratingAiReply}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.8rem',
                    borderRadius: '0.5rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-main)',
                    fontSize: '0.86rem',
                    fontWeight: 500,
                  }}
                />
              </div>

              {/* Contextual Reply Body */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    AI Contextual Draft (Customizable):
                  </label>
                  <span style={{ fontSize: '0.74rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Sparkles size={12} />
                    Context-aware partnership response
                  </span>
                </div>
                {isGeneratingAiReply ? (
                  <div
                    style={{
                      height: '180px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.6rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <Loader2 size={24} className="animate-spin" />
                    <span>Analyzing partner response and tailoring agreement draft...</span>
                  </div>
                ) : (
                  <textarea
                    rows={8}
                    value={aiDraftedBody}
                    onChange={(e) => setAiDraftedBody(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.85rem',
                      borderRadius: '0.5rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      lineHeight: 1.55,
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      fontWeight: 400,
                    }}
                  />
                )}
              </div>

              {/* AI Guidance Note */}
              <div
                style={{
                  padding: '0.6rem 0.85rem',
                  borderRadius: '0.45rem',
                  background: 'var(--accent-gradient-subtle)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.76rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Sparkles size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                <span>
                  This draft is dynamically adapted to institutional inquiries, commission review terms, or virtual meeting arrangements. You can modify any wording before dispatch.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '0.9rem 1.4rem',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(aiDraftedBody);
                  setAiDraftCopied(true);
                  setTimeout(() => setAiDraftCopied(false), 2000);
                }}
                disabled={isGeneratingAiReply || !aiDraftedBody}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '0.45rem',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {aiDraftCopied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                <span>{aiDraftCopied ? 'Copied to Clipboard' : 'Copy Text'}</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setAiReplyModalLog(null)}
                  style={{
                    padding: '0.45rem 0.95rem',
                    borderRadius: '0.45rem',
                    background: 'transparent',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendAiReply}
                  disabled={isGeneratingAiReply || !aiDraftedBody.trim()}
                  style={{
                    padding: '0.48rem 1.15rem',
                    borderRadius: '0.45rem',
                    background: 'var(--accent-primary)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    boxShadow: 'var(--shadow-sm)',
                    opacity: isGeneratingAiReply || !aiDraftedBody.trim() ? 0.6 : 1,
                  }}
                >
                  <Send size={14} />
                  <span>Send AI Response</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL SETTINGS, SAVED LISTS ("SAVE AS"), & SANDBOX MODAL */}
      <GlobalTieupSettingsModal
        isOpen={isGlobalSettingsModalOpen}
        onClose={() => setIsGlobalSettingsModalOpen(false)}
        activeTab={settingsActiveTab}
        onSelectTab={setSettingsActiveTab}
        currentView={activeMainTab}
        sessionLeads={sessionLeads}
        allResourcesLeads={allResourcesLeads}
        selectedLeadIds={selectedLeadIds}
        onToggleLeadSelection={(id) => {
          setSelectedLeadIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
          });
        }}
        onSelectAllVisible={(ids) => {
          setSelectedLeadIds(new Set(ids));
        }}
        onClearSelection={() => {
          setSelectedLeadIds(new Set());
        }}
        savedLists={savedLists}
        onSaveCurrentAsList={handleSaveCurrentAsList}
        onLoadSavedList={handleLoadSavedList}
        onDeleteSavedList={handleDeleteSavedList}
        onBulkDeleteLeads={handleBulkDeleteLeads}
        onClearCurrentSessionLeads={handleClearCurrentSessionLeads}
        onInjectSandboxTestColleges={handleInjectSandboxTestColleges}
        onResetDatabasePipeline={handleResetDatabasePipeline}
      />
    </div>
  );
}
