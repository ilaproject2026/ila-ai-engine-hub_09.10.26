/**
 * ILA Course Creator -> Library Navigation Synchronization Service
 * Provides baseline API preparation hooks, structured payloads, and taxonomy mappings
 * for synchronizing created courses with the Library's sub-navigation architecture.
 */

export interface CourseSubCategoryOption {
  id: string;
  name: string;
  code: string;
}

export interface CourseCategoryOption {
  id: string;
  name: string;
  code: string;
  subCategories: CourseSubCategoryOption[];
}

export interface CourseCreationMetadata {
  courseName: string;
  courseId: string;
  category: string;
  subCategory: string;
  deliveryPath: string;
  batch: string;
  slot: string;
  batchSlot: string;
}

export interface CourseLibrarySyncPayload {
  courseId: string;
  courseName: string;
  category: string;
  subCategory: string;
  deliveryPath: string;
  batch: string;
  slot: string;
  batchSlot: string;
  libraryNavPath: {
    categoryKey: string;
    subCategoryKey: string;
    pathKey: string;
    batchSlotKey: string;
  };
  syncStatus: 'prepared' | 'synced' | 'pending';
  preparedAt: number;
  syncedAt?: number;
  endpointPreview: string;
  metadata?: Record<string, any>;
}

// 1. Authoritative Domain Taxonomy for Library Sub-Navigation
export const COURSE_TAXONOMY_CATEGORIES: CourseCategoryOption[] = [
  {
    id: 'computer_science_ai',
    name: 'Computer Science & AI',
    code: 'AI',
    subCategories: [
      { id: 'gen_ai_llm', name: 'Generative AI & LLMs', code: 'GENAI' },
      { id: 'deep_learning', name: 'Deep Learning & Neural Nets', code: 'DL' },
      { id: 'fullstack_arch', name: 'Full-Stack Software Architecture', code: 'FSA' },
      { id: 'mlops_cloud', name: 'MLOps & Cloud DevOps', code: 'OPS' },
      { id: 'cybersecurity', name: 'Enterprise Cybersecurity & Defense', code: 'SEC' },
      { id: 'data_science', name: 'Big Data & Predictive Analytics', code: 'DATA' },
    ],
  },
  {
    id: 'business_leadership',
    name: 'Business & Executive Leadership',
    code: 'BIZ',
    subCategories: [
      { id: 'strat_management', name: 'Strategic Enterprise Management', code: 'STRAT' },
      { id: 'venture_capital', name: 'Venture Capital & Private Equity', code: 'VC' },
      { id: 'agile_leadership', name: 'Agile Product & Engineering Leadership', code: 'AGL' },
      { id: 'risk_governance', name: 'Corporate Governance & Risk Mitigation', code: 'GOV' },
      { id: 'b2b_marketing', name: 'B2B Revenue Operations & Go-To-Market', code: 'MKT' },
    ],
  },
  {
    id: 'healthcare_medicine',
    name: 'Healthcare & Clinical Sciences',
    code: 'MED',
    subCategories: [
      { id: 'clinical_medicine', name: 'Clinical Diagnostics & Internal Medicine', code: 'CLN' },
      { id: 'medical_german', name: 'Medical German & Approbation Exam', code: 'GERMED' },
      { id: 'nursing_practice', name: 'Advanced Nursing Care & Triage', code: 'NUR' },
      { id: 'health_informatics', name: 'Healthcare AI & Hospital Informatics', code: 'HLT' },
      { id: 'pharmacy_pharma', name: 'Pharmaceutical Biotechnology', code: 'PHAR' },
    ],
  },
  {
    id: 'finance_economics',
    name: 'Finance & Quantitative Economics',
    code: 'FIN',
    subCategories: [
      { id: 'fin_analytics', name: 'Financial Modeling & Enterprise Valuation', code: 'VAL' },
      { id: 'banking_fintech', name: 'Investment Banking & Decentralized FinTech', code: 'FTK' },
      { id: 'risk_audit', name: 'Audit Compliance, IFRS & HGB Accounting', code: 'AUD' },
      { id: 'quant_trading', name: 'Quantitative Algorithmic Trading Systems', code: 'QNT' },
    ],
  },
  {
    id: 'languages_humanities',
    name: 'Languages & Academic Pathways',
    code: 'LANG',
    subCategories: [
      { id: 'german_a1_c1', name: 'German Fluency (CEFR A1–C1 Academic)', code: 'GER' },
      { id: 'ielts_toefl', name: 'IELTS Academic & TOEFL Band 8+ Mastery', code: 'ENG' },
      { id: 'business_english', name: 'Executive Cross-Border Negotiation English', code: 'BIZENG' },
      { id: 'university_pathway', name: 'German Studienkolleg & University Prep', code: 'STK' },
    ],
  },
  {
    id: 'engineering_robotics',
    name: 'Engineering & Applied Systems',
    code: 'ENG',
    subCategories: [
      { id: 'robotics_automation', name: 'Robotics & Industrial PLC Automation', code: 'ROB' },
      { id: 'automotive_systems', name: 'Automotive EV Systems & Battery Tech', code: 'AUTO' },
      { id: 'renewable_energy', name: 'Renewable Power & Micro-Grid Systems', code: 'NRG' },
      { id: 'embedded_iot', name: 'Embedded Systems & Industrial IoT', code: 'IOT' },
    ],
  },
];

// 2. Standard Delivery Formats (Path)
export const COURSE_DELIVERY_PATHS = [
  { id: 'one_on_one_online', name: '1-on-1 Online (Private Mentorship)' },
  { id: 'group_online', name: 'Group Online (Collaborative Cohorts)' },
  { id: 'camp_online', name: 'Camp Online (Intensive Virtual Bootcamps)' },
  { id: 'camp_offline', name: 'Camp Offline (On-Campus Workshops)' },
  { id: 'sports_online', name: 'Sports Online (Tactical Coaching)' },
  { id: 'sports_offline', name: 'Sports Offline (Field Station)' },
  { id: 'self_paced', name: 'Self-Paced Masterclass (Digital Library)' },
];

// 3. Batch Options
export const COURSE_BATCH_OPTIONS = [
  'Batch 2026-Q1',
  'Batch 2026-Q2',
  'Batch 2026-Q3',
  'Batch 2026-Q4',
  'Weekend Fast-Track Intensive',
  'Evening Professional Cohort',
  'Continuous Rolling Intake',
];

// 4. Slot Options
export const COURSE_SLOT_OPTIONS = [
  'Morning Slot (09:00 - 11:00 CET)',
  'Midday Slot (12:00 - 14:00 CET)',
  'Afternoon Slot (15:00 - 17:00 CET)',
  'Evening Slot (18:00 - 20:00 CET)',
  'Weekend Slot (10:00 - 14:00 CET)',
  'Flexible Asynchronous / 24-7 Lab Access',
];

/**
 * Generates a clean, standardized enterprise Course ID.
 * Format: CRS-[YEAR]-[CATEGORY_CODE][RANDOM_2_DIGIT]
 * Example: CRS-2026-AI01, CRS-2026-MED03
 */
export function generateStandardCourseId(categoryNameOrId: string, subCategoryNameOrId?: string): string {
  const year = new Date().getFullYear();
  let catCode = 'GEN';

  const matchedCat = COURSE_TAXONOMY_CATEGORIES.find(
    (c) => c.id === categoryNameOrId || c.name.toLowerCase() === categoryNameOrId.toLowerCase()
  );

  if (matchedCat) {
    catCode = matchedCat.code;
    if (subCategoryNameOrId) {
      const matchedSub = matchedCat.subCategories.find(
        (s) => s.id === subCategoryNameOrId || s.name.toLowerCase() === subCategoryNameOrId.toLowerCase()
      );
      if (matchedSub) {
        catCode = `${matchedCat.code}-${matchedSub.code}`;
      }
    }
  }

  const seq = Math.floor(10 + Math.random() * 90);
  return `CRS-${year}-${catCode}${seq}`;
}

/**
 * Prepares the complete Course Library Navigation Synchronization Payload.
 * This formats the metadata so the Library Catalog and Sub-Navigation structures
 * immediately map and categorize the course.
 */
export function prepareCourseLibrarySyncPayload(metadata: CourseCreationMetadata): CourseLibrarySyncPayload {
  const catKey = metadata.category.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const subCatKey = metadata.subCategory.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const pathKey = metadata.deliveryPath.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const batchSlotKey = `${metadata.batch}__${metadata.slot}`.toLowerCase().replace(/[^a-z0-9]+/g, '_');

  return {
    courseId: metadata.courseId.trim() || generateStandardCourseId(metadata.category, metadata.subCategory),
    courseName: metadata.courseName.trim(),
    category: metadata.category,
    subCategory: metadata.subCategory,
    deliveryPath: metadata.deliveryPath,
    batch: metadata.batch,
    slot: metadata.slot,
    batchSlot: metadata.batchSlot || `${metadata.batch} • ${metadata.slot}`,
    libraryNavPath: {
      categoryKey: catKey,
      subCategoryKey: subCatKey,
      pathKey,
      batchSlotKey,
    },
    syncStatus: 'prepared',
    preparedAt: Date.now(),
    endpointPreview: `/api/v1/library/navigation/sync/${metadata.courseId.trim() || 'pending'}`,
    metadata: {
      generatedBy: 'ILA Course Creator Engine Hub v6',
      architectureVersion: '2026.1',
      subNavigationTier: 3,
    },
  };
}

const STORAGE_KEY = 'ila_course_library_sync_manifests';

/**
 * Persists the prepared course payload and broadcasts the synchronization
 * event so target library views update immediately.
 */
export async function dispatchCourseToLibrarySync(payload: CourseLibrarySyncPayload): Promise<boolean> {
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY);
    const manifests: CourseLibrarySyncPayload[] = existingStr ? JSON.parse(existingStr) : [];
    
    // Update or prepend
    const updated = [
      { ...payload, syncStatus: 'synced' as const, syncedAt: Date.now() },
      ...manifests.filter((m) => m.courseId !== payload.courseId),
    ];
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Broadcast event for live UI reactivity across tabs and views
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('ila-library-navigation-sync', {
          detail: { payload: updated[0] },
        })
      );
    }

    // Future REST Backend preparation hook
    // When the backend microservice endpoint is live, this will execute:
    // await fetch(payload.endpointPreview, { method: 'POST', body: JSON.stringify(payload) });

    return true;
  } catch (err) {
    console.warn('Library sync dispatch notice:', err);
    return false;
  }
}

/**
 * Retrieves all stored library synchronization manifests.
 */
export function getPreparedLibrarySyncManifests(): CourseLibrarySyncPayload[] {
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY);
    return existingStr ? JSON.parse(existingStr) : [];
  } catch {
    return [];
  }
}
