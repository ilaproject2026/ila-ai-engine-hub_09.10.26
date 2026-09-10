import { type AIProductType } from './aiHubConfig';

export interface DynamicAIParameter {
  id: string;
  productId: AIProductType | 'global';
  name: string;
  key: string;
  description?: string;
  instruction: string; // The system rule / prompt modifier
  valueType: 'text' | 'select' | 'boolean' | 'numeric' | 'voice_instruction';
  defaultValue: string;
  currentValue: string;
  options?: Array<{ value: string; label: string }>;
  category: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  source: 'default' | 'custom' | 'voice_input';
}

const STORAGE_KEY = 'ila_dynamic_ai_parameters_v1';

/**
 * Built-in default parameter rules for each AI module & global operations
 */
const DEFAULT_PARAMETERS: DynamicAIParameter[] = [
  // Global Parameters
  {
    id: 'param_global_tone',
    productId: 'global',
    name: 'Executive Tone & Style',
    key: 'global_tone',
    description: 'Enforces high-level executive communication, eliminating conversational filler across all tools.',
    instruction: 'Maintain an authoritative, precise, highly professional executive tone. Avoid conversational filler or meta-apologies.',
    valueType: 'select',
    defaultValue: 'authoritative_executive',
    currentValue: 'authoritative_executive',
    options: [
      { value: 'authoritative_executive', label: 'Authoritative Executive' },
      { value: 'academic_scholarly', label: 'Academic & Scholarly' },
      { value: 'concise_bulleted', label: 'Concise Bullet Points' },
      { value: 'consultative_friendly', label: 'Consultative & Warm' },
    ],
    category: 'Global Core',
    isActive: true,
    createdAt: Date.now() - 100000,
    updatedAt: Date.now() - 100000,
    source: 'default',
  },
  {
    id: 'param_global_formatting',
    productId: 'global',
    name: 'Standardized Markdown & Tables',
    key: 'global_formatting',
    description: 'Requires structured tables, callouts, and clean markdown hierarchy.',
    instruction: 'Format complex data into well-organized Markdown tables, visual callouts (> [!NOTE]), and clear bold subheaders.',
    valueType: 'boolean',
    defaultValue: 'true',
    currentValue: 'true',
    category: 'Global Core',
    isActive: true,
    createdAt: Date.now() - 90000,
    updatedAt: Date.now() - 90000,
    source: 'default',
  },

  // Course Creator
  {
    id: 'param_course_cefr',
    productId: 'course_creator',
    name: 'CEFR / Academic Level Calibration',
    key: 'cefr_level',
    description: 'Calibrates educational curriculum depth and linguistic vocabulary.',
    instruction: 'Strictly align chapter vocabulary, dialogues, and exercises with the target CEFR level (A1 to C2) and curriculum standard.',
    valueType: 'select',
    defaultValue: 'B2_professional',
    currentValue: 'B2_professional',
    options: [
      { value: 'A1_beginner', label: 'A1 - Beginner' },
      { value: 'A2_elementary', label: 'A2 - Elementary' },
      { value: 'B1_intermediate', label: 'B1 - Intermediate' },
      { value: 'B2_professional', label: 'B2 - Upper Intermediate / Professional' },
      { value: 'C1_advanced', label: 'C1 - Advanced Academic' },
    ],
    category: 'Education & Learning',
    isActive: true,
    createdAt: Date.now() - 80000,
    updatedAt: Date.now() - 80000,
    source: 'default',
  },

  // Visa Doc Analyzer
  {
    id: 'param_visa_strictness',
    productId: 'visa_doc_analyzer',
    name: 'Embassy Checklist Strictness',
    key: 'embassy_strictness',
    description: 'Flags missing document clauses and translation requirements with zero tolerance.',
    instruction: 'Apply strict consular scrutiny. Flag any missing certifications, apostilles, or translation ambiguities with high-priority warnings.',
    valueType: 'boolean',
    defaultValue: 'true',
    currentValue: 'true',
    category: 'Legal & Mobility',
    isActive: true,
    createdAt: Date.now() - 70000,
    updatedAt: Date.now() - 70000,
    source: 'default',
  },

  // AI Pricing Tool
  {
    id: 'param_pricing_margin',
    productId: 'ai_pricing_tool',
    name: 'Target Margin & Discount Guardrail',
    key: 'pricing_guardrail',
    description: 'Maintains minimum gross profit margin thresholds when calculating seasonal tariffs.',
    instruction: 'Ensure all pricing tiers preserve a minimum 25% gross margin after factoring in promotional discounts and partner commissions.',
    valueType: 'numeric',
    defaultValue: '25',
    currentValue: '25',
    category: 'Market & Pricing',
    isActive: true,
    createdAt: Date.now() - 60000,
    updatedAt: Date.now() - 60000,
    source: 'default',
  },

  // HR Interviewer
  {
    id: 'param_hr_star_method',
    productId: 'hr_interviewer',
    name: 'STAR Methodology Scoring',
    key: 'hr_star_scoring',
    description: 'Evaluates candidate responses strictly across Situation, Task, Action, and Result.',
    instruction: 'Grade candidate responses on a 1-10 STAR scale (Situation, Task, Action, Result) with actionable improvement pointers.',
    valueType: 'boolean',
    defaultValue: 'true',
    currentValue: 'true',
    category: 'Human Resources',
    isActive: true,
    createdAt: Date.now() - 50000,
    updatedAt: Date.now() - 50000,
    source: 'default',
  },

  // Senior Marketing Manager
  {
    id: 'param_marketing_objections',
    productId: 'senior_marketing_manager',
    name: 'Objection Handling Battlecard Mode',
    key: 'objection_handling',
    description: 'Generates real-time rebuttal scripts during client negotiations.',
    instruction: 'Include proactive objection handling battlecards (Price, Timing, Competitor Comparison) in every marketing response.',
    valueType: 'boolean',
    defaultValue: 'true',
    currentValue: 'true',
    category: 'Sales & Marketing',
    isActive: true,
    createdAt: Date.now() - 40000,
    updatedAt: Date.now() - 40000,
    source: 'default',
  },
];

/**
 * Loads all dynamic parameters from local storage, seeded with defaults.
 */
export function getAllDynamicParameters(): DynamicAIParameter[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PARAMETERS));
      return DEFAULT_PARAMETERS;
    }
    const parsed = JSON.parse(raw) as DynamicAIParameter[];
    return parsed;
  } catch (err) {
    console.error('Failed to load dynamic parameters:', err);
    return DEFAULT_PARAMETERS;
  }
}

/**
 * Returns parameters applicable to a specific product (including active global parameters).
 */
export function getParametersForProduct(productId: AIProductType | 'global'): DynamicAIParameter[] {
  const all = getAllDynamicParameters();
  if (productId === 'global') {
    return all.filter((p) => p.productId === 'global');
  }
  return all.filter((p) => p.productId === productId || p.productId === 'global');
}

/**
 * Saves or updates a dynamic parameter.
 */
export function saveDynamicParameter(param: DynamicAIParameter): void {
  const all = getAllDynamicParameters();
  const existingIndex = all.findIndex((p) => p.id === param.id);
  if (existingIndex >= 0) {
    all[existingIndex] = { ...param, updatedAt: Date.now() };
  } else {
    all.unshift({ ...param, createdAt: Date.now(), updatedAt: Date.now() });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

/**
 * Deletes a custom dynamic parameter by ID.
 */
export function deleteDynamicParameter(id: string): void {
  const all = getAllDynamicParameters();
  const updated = all.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Toggles a parameter's active status.
 */
export function toggleParameterActive(id: string): void {
  const all = getAllDynamicParameters();
  const target = all.find((p) => p.id === id);
  if (target) {
    target.isActive = !target.isActive;
    target.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
}

/**
 * Updates the current value of a parameter.
 */
export function updateParameterValue(id: string, value: string): void {
  const all = getAllDynamicParameters();
  const target = all.find((p) => p.id === id);
  if (target) {
    target.currentValue = value;
    target.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
}

/**
 * Resets all parameters to factory defaults.
 */
export function resetParametersToDefault(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PARAMETERS));
}

/**
 * Compiles all active parameter rules for a product into prompt instructions.
 */
export function getActiveParameterInstructions(productId: AIProductType): string {
  const params = getParametersForProduct(productId).filter((p) => p.isActive);
  if (params.length === 0) return '';

  let instructionBlock = `\n=== DYNAMIC AI OPERATIONAL PARAMETERS & CONSTRAINTS ===\n`;
  params.forEach((p) => {
    instructionBlock += `[PARAMETER: ${p.name}] (Scope: ${p.productId === 'global' ? 'Global' : p.productId})\n`;
    instructionBlock += `Rule / Constraint: ${p.instruction}\n`;
    if (p.currentValue && p.currentValue !== 'true') {
      instructionBlock += `Active Setting Value: ${p.currentValue}\n`;
    }
    instructionBlock += `\n`;
  });
  instructionBlock += `=== END OF OPERATIONAL CONSTRAINTS ===\n\n`;

  return instructionBlock;
}
