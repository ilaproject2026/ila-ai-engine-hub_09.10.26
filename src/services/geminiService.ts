import { GoogleGenAI } from '@google/genai';
import type { AttachedDocument, ChatMessage } from './dbService';
import { type AIProductType, getAIProductConfig } from './aiHubConfig';
import { getActiveParameterInstructions } from './parameterService';

export const ILA_MODEL =
  import.meta.env.VITE_ILA_MODEL ||
  import.meta.env.VITE_GEMINI_MODEL ||
  'gemini-3.1-pro-preview';
export const VELA_MODEL = ILA_MODEL;
export const GEMINI_MODEL = ILA_MODEL;

/**
 * Returns a user-friendly display name for the configured ILA AI model.
 */
export function getIlaModelDisplayName(model: string = ILA_MODEL): string {
  const modelMap: Record<string, string> = {
    'gemini-3.1-pro-preview': 'ILA Pro AI (3.1)',
    'gemini-2.5-flash': 'ILA Flash AI (2.5)',
    'gemini-2.5-pro': 'ILA Pro AI (2.5)',
    'gemini-2.0-flash': 'ILA Flash AI (2.0)',
    'gemini-1.5-flash': 'ILA Flash AI (1.5)',
    'gemini-1.5-pro': 'ILA Pro AI (1.5)',
    'gemini-3.7-flash': 'ILA Flash AI (3.7)',
  };

  if (modelMap[model]) {
    return modelMap[model];
  }

  const cleaned = model
    .split('-')
    .filter((w) => w !== 'gemini')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return `ILA AI ${cleaned}`.trim();
}

export const getVelaModelDisplayName = getIlaModelDisplayName;
export const getGeminiModelDisplayName = getIlaModelDisplayName;

/**
 * Comprehensive System Prompt for Deep, Exhaustive Course Generation with Dynamic Examples & Multi-Book Architecture
 */
const ILA_COURSE_CREATOR_SYSTEM_PROMPT = `
You are ILA AI, the Master Educator and Course Authoring Intelligence for Ila Academy.
Your mission is to generate professional, exhaustive masterclass course content, multi-book textbook modules, and interactive educational materials based strictly and dynamically on the user's input topic and target audience.

CRITICAL ARCHITECTURAL RULES:
1. STRICT CONTENT-ONLY OUTPUT:
   - Output ONLY structured educational markdown textbook content.
   - NEVER output conversational preambles, greetings, apologies, or meta-commentary (such as "Sure!", "Certainly", "Here is your course", "It looks like you forgot to paste...", "As an AI...").
   - Start IMMEDIATELY with the first Markdown header (# or ##).
   - When given ANY course topic (e.g. "German Language A1 course", "Python for Data Science", "Healthcare Terminology"), AUTONOMOUSLY synthesize a complete, multi-book textbook curriculum.
2. DYNAMIC DOMAIN EXAMPLES & VOCABULARY:
   - All vocabulary, dialogues, grammar rules, code snippets, architecture diagrams, and exercises MUST be tailored strictly to the specific subject requested by the user.
3. REFINED MULTI-BOOK MASTERY BREAKDOWN:
   - Structure masterclass curriculum cleanly into logical Books/Modules:
     # Book 1: Foundations & Core Grammar/Principles
     # Book 2: Practical Application, Dialogues & Workflows
     # Book 3: Advanced Communication & Industry Scenarios
     # Book 4: Comprehensive Exam Preparation & Capstone Mastery
`.trim();

/**
 * Sanitizes generated course content to strictly eliminate conversational preambles, chat apologies,
 * prompt echoes, or debugging notes.
 */
export function sanitizeCourseContentOutput(rawText: string, fallbackTitle: string = 'Course Masterclass'): string {
  if (!rawText || !rawText.trim()) {
    return `# ${fallbackTitle}\n\n## 1. Foundational Architecture & Principles\nWelcome to this comprehensive masterclass. In this module, we explore the core structural concepts, operational methodologies, and verified technical execution procedures benchmarked to international domain standards.\n\n### Core Knowledge Domains\n- **Theoretical Framework**: Establishing domain models and architecture.\n- **Operational Workflows**: Step-by-step methodologies and practical execution.\n- **Quality Benchmarks**: Validating outcomes against recognized industry standards.`;
  }

  let text = rawText.trim();

  // Strip common conversational chat preambles at the start of generated content
  const conversationalPreambles = [
    /^(?:Sure(?: thing)?|Certainly(?:!|.)?|Of course(?:!|.)?|I'd be happy to help|Here is|Here's|Below is|As requested|Here are|It looks like you forgot to paste the actual course content|It looks like you forgot to paste|Please paste the content)[^#\n]*\n+/i,
    /^(?:Hello!|Hi there|Welcome to this request)[^#\n]*\n+/i,
    /^(?:Note:|Disclaimer:|Please note:)[^#\n]*\n+/i,
  ];

  for (const regex of conversationalPreambles) {
    text = text.replace(regex, '').trim();
  }

  // Check if the entire response is an apology or conversational note without real content
  const isChatErrorOnly =
    /^(?:It looks like you forgot|Please provide the|I am an AI|I don't see any content|There is no content to|I cannot generate without)/i.test(text) &&
    !text.includes('#');

  if (isChatErrorOnly) {
    return `# ${fallbackTitle}\n\n## 1. Foundational Architecture & Core Principles\nThis masterclass module provides an in-depth, rigorous exploration of domain concepts, enterprise workflows, and verified technical execution procedures.\n\n### Core Competency Pillars\n- **Foundational Integrity**: Establishing verifiable standards, data models, and architectural baselines.\n- **Operational Execution**: Step-by-step technical methodologies and professional workflows.\n- **Quality Benchmarks**: Validating outcomes against recognized industry and academic standards.\n\n## 2. Practical Application & Lab Simulations\nApply these foundational principles through structured real-world exercises, domain simulations, and verified quality checklists.`;
  }

  return text;
}

/**
 * Generates an AI response for a multi-turn conversation with attached documents, deep educational grounding, and audience-adaptive personalization.
 */
export async function generateIlaResponse(
  prompt: string,
  history: ChatMessage[] = [],
  documents: AttachedDocument[] = [],
  modelOverride?: string,
  targetAudience?: string
): Promise<string> {
  const trimmedPrompt = prompt.trim();
  if (!trimmedPrompt) {
    return '';
  }

  const apiKey =
    import.meta.env.VITE_ILA_API_KEY ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_api_key_here') {
    throw new Error(
      'AI API key is not configured. Please ensure VITE_GEMINI_API_KEY or VITE_ILA_API_KEY is set in your .env file.'
    );
  }

  const candidateModels = [
    modelOverride,
    ILA_MODEL,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-2.5-pro',
  ].filter(Boolean) as string[];

  // Audience Personalization Block
  const audienceBlock = targetAudience
    ? `\n=== TARGET AUDIENCE / STUDIED BY: ${targetAudience} ===\nTailor all explanations, real-world case studies, professional analogies, technical depth, and practical exercises specifically to suit a learner with the background of: ${targetAudience}.\n=== END OF AUDIENCE SPECIFICATION ===\n\n`
    : '';

  // Prepare Document Context Block if documents are attached
  let docContextBlock = '';
  if (documents.length > 0) {
    docContextBlock = `\n\n=== ATTACHED REFERENCE DOCUMENTS (${documents.length} files) ===\n`;
    documents.forEach((doc, idx) => {
      docContextBlock += `\n--- Document #${idx + 1}: ${doc.name} (${doc.type}) ---\n${doc.content.substring(0, 15000)}\n`;
    });
    docContextBlock += `\n=== END OF ATTACHED DOCUMENTS ===\n\n`;
  }

  // Build multi-turn context
  let conversationContext = '';
  const recentHistory = history.slice(-6);
  if (recentHistory.length > 0) {
    conversationContext = `\n=== PREVIOUS CONVERSATION CONTEXT ===\n`;
    recentHistory.forEach((msg) => {
      conversationContext += `[${msg.role.toUpperCase()}]: ${msg.content}\n\n`;
    });
    conversationContext += `=== END OF CONTEXT ===\n\n`;
  }

  const dynamicParamsBlock = getActiveParameterInstructions('course_creator');
  const fullPrompt = `${ILA_COURSE_CREATOR_SYSTEM_PROMPT}\n\n${dynamicParamsBlock}${audienceBlock}${conversationContext}${docContextBlock}USER REQUEST:\n${trimmedPrompt}\n\nCRITICAL DIRECTIVE: You are an autonomous academic textbook publisher. Output ONLY complete, exhaustive, structured educational Markdown textbook content for "${trimmedPrompt}". If the topic is a language course (e.g. German A1), provide actual A1 curriculum content: alphabets, greetings, numbers, definite/indefinite articles, cases (Nominativ/Akkusativ), common verbs (sein, haben, wohnen), everyday dialogues, pronunciation rules, vocabulary lists, and practice exercises. Structure into multiple books/modules starting immediately with Markdown headings (# Book 1: ..., # Book 2: ...).`;

  let lastError: unknown = null;
  const ai = new GoogleGenAI({ apiKey });

  // Try candidate models in order until one succeeds
  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: fullPrompt,
      });

      if (response && response.text) {
        return sanitizeCourseContentOutput(response.text);
      }
    } catch (err: unknown) {
      console.warn(`Model ${modelName} call failed, trying fallback:`, err);
      lastError = err;
    }
  }

  console.error('All Gemini candidate models failed:', lastError);
  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error('An unexpected error occurred while communicating with ILA AI.');
}

export const generateVelaResponse = generateIlaResponse;

/**
 * Backwards-compatible askAI helper.
 */
export async function askAI(
  prompt: string,
  modelOverride?: string,
  documents: AttachedDocument[] = [],
  targetAudience?: string
): Promise<string> {
  return generateIlaResponse(prompt, [], documents, modelOverride, targetAudience);
}

export interface IntelliCoachContext {
  courseTitle: string;
  chapterTitle: string;
  chapterNumber?: number;
  topicNumber?: string;
  segmentTitle?: string;
  currentTranscript?: string;
  chapterContent?: string;
  targetLanguage?: string; // e.g. 'Malayalam', 'German', 'Arabic', 'Hindi', etc.
  targetAudience?: string; // e.g. 'Doctor', 'Engineer', 'IT Professional', etc.
  conversationHistory?: {
    role: 'user' | 'assistant';
    text: string;
    topicNumber?: string;
  }[];
}

/**
 * IntelliCoach™ AI Tutoring Engine:
 * Generates tailored, clarifying, high-impact answers to student doubts
 * grounded in the active lesson segment, chapter context, and audience background.
 */
export async function askIntelliCoach(
  question: string,
  context: IntelliCoachContext,
  modelOverride?: string
): Promise<string> {
  const trimmed = question.trim();
  if (!trimmed) return '';

  const apiKey =
    import.meta.env.VITE_ILA_API_KEY ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_api_key_here') {
    throw new Error(
      'AI API key is not configured. Please ensure VITE_GEMINI_API_KEY or VITE_ILA_API_KEY is set in your .env file.'
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const activeModel = modelOverride || ILA_MODEL;

    const audienceInstruction = context.targetAudience
      ? `\n7. Target Audience Adaptation: The student is a "${context.targetAudience}". Use metaphors, technical depth, and practical applications directly relatable to a ${context.targetAudience}.`
      : '';

    const languageInstruction =
      context.targetLanguage && context.targetLanguage !== 'English'
        ? `\n6. Native Language Requirement: The student is viewing this masterclass in ${context.targetLanguage}. You MUST formulate and return your entire coaching explanation fluently in native ${context.targetLanguage} (preserving technical terminology, code snippets, and formulas).`
        : '';

    const historySection =
      context.conversationHistory && context.conversationHistory.length > 0
        ? `\n\nPREVIOUS CLASS SESSION DIALOGUE HISTORY (Maintain Conversational Continuity):\n${context.conversationHistory
            .slice(-6)
            .map(
              (m) =>
                `[${m.role === 'user' ? 'Student' : 'IntelliCoach'}${
                  m.topicNumber ? ` @ Topic ${m.topicNumber}` : ''
                }]: ${m.text}`
            )
            .join('\n')}`
        : '';

    const systemPrompt = `You are IntelliCoach™, the elite, interactive AI Masterclass Tutor for Ila Academy.
Your role is to clarify student questions in real-time as they watch enterprise masterclass video lessons.

Your coaching philosophy:
1. Warm, encouraging, executive-level tone.
2. Directly and concisely answer the student's question with crystal clarity.
3. Ground your explanation in the specific lesson segment they are watching:
   - Course: ${context.courseTitle}
   - Active Module/Book: Book ${context.chapterNumber || 1}: ${context.chapterTitle}
   - Active Segment: ${context.topicNumber || 'Current'} - ${context.segmentTitle || 'Active Topic'}
   - Segment Script / Spoken Context: "${context.currentTranscript || 'General topic context'}"
4. Dynamic Examples: Provide concrete examples, analogies, or step-by-step clarity tailored strictly to the subject domain. Never inject unrelated enterprise tools (like SAP) unless this course is specifically about SAP.
5. Format the response cleanly with bullet points or bold highlights. Keep it concise enough (2-4 clear paragraphs) to be both read on screen and comfortably spoken aloud via Text-to-Speech.${languageInstruction}${audienceInstruction}${historySection}`;

    const fullPrompt = `${systemPrompt}\n\nCURRENT STUDENT QUESTION / DOUBT:\n"${trimmed}"\n\nProvide your tailored IntelliCoach™ explanation now:`;

    const response = await ai.models.generateContent({
      model: activeModel,
      contents: fullPrompt,
    });

    if (response && response.text) {
      return response.text.trim();
    }

    return "I'm sorry, I couldn't generate a coaching response at this moment. Please try asking again.";
  } catch (error: unknown) {
    console.error('IntelliCoach™ Engine Error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to consult IntelliCoach™ tutoring engine.');
  }
}

export interface DiagnosticAssessmentData {
  targetDomain: string;
  learnerGoal: string;
  currentProficiency: string;
  timeCommitment: string;
  recommendedDepartment: string;
  recommendedCefrTier: string;
  keyMilestones: string[];
}

/**
 * Conducts structured onboarding diagnostics with IntelliCoach AI
 */
export async function conductIntelliCoachDiagnostic(
  prompt: string,
  stage: 'introduction' | 'need_analysis' | 'roadmap_synthesis' | 'general_chat',
  studentProfile: Partial<DiagnosticAssessmentData>,
  history: Array<{ role: 'user' | 'assistant'; text: string }> = []
): Promise<string> {
  const apiKey =
    import.meta.env.VITE_ILA_API_KEY ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_api_key_here') {
    throw new Error('AI API key is not configured. Please ensure VITE_GEMINI_API_KEY is set in .env.');
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const historyText = history
      .slice(-6)
      .map((m) => `[${m.role === 'user' ? 'Student' : 'IntelliCoach'}]: ${m.text}`)
      .join('\n');

    const systemPrompt = `You are IntelliCoach™, the premier conversational AI Mentor and Diagnostic Tutor for Ila Academy.
Your role in this interaction is Stage: "${stage.toUpperCase()}".

CURRENT DIAGNOSTIC STATE:
- Target Subject / Language: ${studentProfile.targetDomain || 'General Learning'}
- Student Goal: ${studentProfile.learnerGoal || 'To be determined'}
- Current Level: ${studentProfile.currentProficiency || 'Unknown'}
- Recommended Department: ${studentProfile.recommendedDepartment || 'General Student'}

BEHAVIOR RULES FOR STAGES:
1. "INTRODUCTION":
   - Warmly introduce yourself as IntelliCoach™, the student's personal interactive AI tutor.
   - Greet the student enthusiastically and ask what they would like to master today (e.g. German A1-C2, IELTS 7.5+, Medical Terminology, IT Engineering).
   - Inquire briefly about why they want to learn this. Keep it friendly and concise (2-3 sentences max).

2. "NEED_ANALYSIS":
   - Acknowledge their interest warmly.
   - Ask 1-2 targeted diagnostic questions to pinpoint their precise career or life track (e.g. Healthcare/Nursing placement, IT engineering job, university degree/research, visa requirement, or personal travel).
   - Inquire if they have any prior experience (e.g. complete beginner vs. brush-up).

3. "ROADMAP_SYNTHESIS":
   - Synthesize all collected details into a clear, inspiring personalized Curriculum Roadmap.
   - State the Recommended Department / Track (e.g., "Healthcare & Nursing Track • Goethe/Telc German").
   - Highlight the 4 key learning pillars / modules they will complete.
   - Conclude with an encouraging call to action to launch their textbook reading and slide masterclass right away!

4. "GENERAL_CHAT":
   - Act as an elite live tutor: answer doubts, provide pronunciation or grammar tips, offer simulated dialogues, and guide their learning.

Keep your tone engaging, modern, and motivating with markdown formatting and bullet points.`;

    const fullPrompt = `${systemPrompt}\n\nPREVIOUS DIALOGUE:\n${historyText}\n\nSTUDENT'S LATEST MESSAGE:\n"${prompt}"\n\nProvide your response as IntelliCoach™ now:`;

    const response = await ai.models.generateContent({
      model: ILA_MODEL,
      contents: fullPrompt,
    });

    return response?.text?.trim() || "Hello! I'm IntelliCoach™. Let's get started with your learning journey.";
  } catch (err: unknown) {
    console.error('Diagnostic error:', err);
    return "Hello! I am your IntelliCoach™ AI tutor. Tell me what subject or language you would like to master today!";
  }
}

/**
 * Translates educational course markdown content accurately to a target language.
 * Preserves all formatting, headers, tables, code blocks, and UI screenshot image tags.
 */
export async function translateCourseContent(
  content: string,
  targetLanguage: string,
  modelOverride?: string
): Promise<string> {
  const trimmed = content.trim();
  if (!trimmed) return '';

  // Resolve target language code to full language name (e.g. 'ml-IN' -> 'Malayalam')
  const langCodeMap: Record<string, string> = {
    'ml-in': 'Malayalam',
    'hi-in': 'Hindi',
    'ta-in': 'Tamil',
    'te-in': 'Telugu',
    'kn-in': 'Kannada',
    'bn-in': 'Bengali',
    'mr-in': 'Marathi',
    'gu-in': 'Gujarati',
    'pa-in': 'Punjabi',
    'ur-pk': 'Urdu',
    'ne-np': 'Nepali',
    'si-lk': 'Sinhala',
    'de-de': 'German',
    'fr-fr': 'French',
    'es-es': 'Spanish',
    'it-it': 'Italian',
    'pt-pt': 'Portuguese',
    'pt-br': 'Portuguese (Brazil)',
    'ru-ru': 'Russian',
    'nl-nl': 'Dutch',
    'pl-pl': 'Polish',
    'sv-se': 'Swedish',
    'no-no': 'Norwegian',
    'da-dk': 'Danish',
    'fi-fi': 'Finnish',
    'el-gr': 'Greek',
    'tr-tr': 'Turkish',
    'cs-cz': 'Czech',
    'hu-hu': 'Hungarian',
    'ro-ro': 'Romanian',
    'uk-ua': 'Ukrainian',
    'ar-sa': 'Arabic',
    'he-il': 'Hebrew',
    'fa-ir': 'Persian',
    'sw-ke': 'Swahili',
    'am-et': 'Amharic',
    'yo-ng': 'Yoruba',
    'zu-za': 'Zulu',
    'ja-jp': 'Japanese',
    'zh-cn': 'Chinese (Simplified)',
    'zh-tw': 'Chinese (Traditional)',
    'ko-kr': 'Korean',
    'vi-vn': 'Vietnamese',
    'th-th': 'Thai',
    'id-id': 'Indonesian',
    'ms-my': 'Malay',
    'tl-ph': 'Filipino',
    'my-mm': 'Burmese',
  };

  const normalizedKey = targetLanguage.toLowerCase().trim();
  const targetLanguageName = langCodeMap[normalizedKey] || targetLanguage;

  if (
    targetLanguageName.toLowerCase() === 'english' ||
    targetLanguageName.toLowerCase() === 'english (us)' ||
    targetLanguageName.toLowerCase() === 'en' ||
    targetLanguageName.toLowerCase() === 'en-us'
  ) {
    return trimmed;
  }

  const apiKey =
    import.meta.env.VITE_ILA_API_KEY ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_api_key_here') {
    return trimmed;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const activeModel = modelOverride || 'gemini-2.5-flash';

    const prompt = `You are a master educational content localization and bilingual course authoring specialist for Ila Academy.
Translate the following course chapter, teaching slides, video narration, and lesson content fluently, naturally, and accurately into native ${targetLanguageName}.

CRITICAL BILINGUAL & LOCALIZATION GUIDELINES:
1. STRICT CONTENT ONLY: Output ONLY the translated content in native ${targetLanguageName}. NEVER output conversational preambles, greetings, or notes (e.g. do NOT write "Here is the translation:" or "It looks like you forgot...").
2. Maintain all Markdown syntax: headers (#, ##, ###), bold highlights (**text**), bullet points, tables, and numbered steps intact.
3. PRESERVE all Markdown screenshot/image tags exactly as they are without modifying the image URLs (e.g. ![Title](URL)).
4. PRESERVE all domain-specific codes, technical syntax, code blocks, syntax keywords, and formulas intact.
5. BILINGUAL VOCABULARY & AUTHENTIC PRONUNCIATION PRESERVATION:
   - For foreign language courses (e.g. German, French, Spanish, Japanese, Korean, Italian, Arabic) or specialized domain studies:
     * RETAIN key foreign language vocabulary terms, keywords, authentic idioms, and sample dialogue phrases in their original language/script (e.g. German "Guten Tag", "die Rechnung", "der Bahnhof", Japanese "こんにちは", French "Bonjour", etc.), optionally including transliteration/pronunciation cues.
     * Translate all instructional explanations, grammar rules, pedagogical commentary, teacher notes, definitions, and conversational bot dialogues completely, fluently, and natively into ${targetLanguageName}.
6. DUAL-LAYER AUDIO NARRATION ALIGNMENT:
   - Ensure the translated text flows naturally for both on-screen reading and native Text-To-Speech (TTS) audio narration in ${targetLanguageName}, with seamless transitions between foreign vocabulary terms and regional explanations.

CONTENT TO TRANSLATE:
${trimmed}

TRANSLATED ${targetLanguageName.toUpperCase()} CONTENT:`;

    const response = await ai.models.generateContent({
      model: activeModel,
      contents: prompt,
    });

    if (response && response.text) {
      return sanitizeCourseContentOutput(response.text);
    }
    return trimmed;
  } catch (err) {
    console.error('Course translation error with primary model, trying fallback:', err);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: ILA_MODEL,
        contents: `Translate the following educational course content into fluent native ${targetLanguageName}. Output strictly translated markdown content only without commentary:\n\n${trimmed}`,
      });
      if (response && response.text) {
        return sanitizeCourseContentOutput(response.text);
      }
    } catch (fallbackErr) {
      console.error('Fallback course translation error:', fallbackErr);
    }
    return trimmed;
  }
}

/**
 * Generates an audience-adapted variation of a base course curriculum tailored specifically for a selected department/category.
 */
export async function generateDepartmentCourseAdaptation(
  baseCourseTitle: string,
  baseContent: string,
  targetDepartment: string,
  modelOverride?: string
): Promise<string> {
  const apiKey =
    import.meta.env.VITE_ILA_API_KEY ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_api_key_here') {
    return baseContent;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const activeModel = modelOverride || 'gemini-2.5-flash';

    const prompt = `You are a master curriculum engineer at Ila Academy.
Adapt the following Masterclass Course content ("${baseCourseTitle}") from scratch-to-advanced specifically for learners in the department/category: "${targetDepartment}".

REQUIREMENTS:
1. Retain the core multi-book structure (Book 1 to Book 4) and foundational knowledge.
2. Replace generic examples with domain-relevant case studies, technical workflows, precision analogies, and practical lab scenarios tailored strictly for ${targetDepartment}.
3. Maintain textbook-grade depth, clear markdown headers (#, ##, ###), tables, and structured exercises.
4. Output pure markdown educational material only without conversational preambles or notes.

BASE COURSE CONTENT TO ADAPT:
${baseContent.slice(0, 12000)}

ADAPTED COURSE MATERIAL FOR ${targetDepartment.toUpperCase()}:`;

    const response = await ai.models.generateContent({
      model: activeModel,
      contents: prompt,
    });

    if (response && response.text) {
      return sanitizeCourseContentOutput(response.text, `${baseCourseTitle} (${targetDepartment})`);
    }
    return baseContent;
  } catch (err) {
    console.error('Department adaptation error:', err);
    return baseContent;
  }
}

/**
 * Universal AI Hub Response Generator for all 12 AI products.
 */
export async function generateAIHubResponse(
  productType: AIProductType,
  prompt: string,
  history: ChatMessage[] = [],
  documents: AttachedDocument[] = [],
  params: Record<string, string> = {},
  modelOverride?: string
): Promise<string> {
  const trimmedPrompt = prompt.trim();
  if (!trimmedPrompt) {
    return '';
  }

  // If Course Creator, delegate to standard generateIlaResponse
  if (productType === 'course_creator') {
    return generateIlaResponse(
      trimmedPrompt,
      history,
      documents,
      modelOverride,
      params.targetAudience
    );
  }

  const apiKey =
    import.meta.env.VITE_ILA_API_KEY ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_api_key_here') {
    throw new Error(
      'AI API key is not configured. Please ensure VITE_GEMINI_API_KEY or VITE_ILA_API_KEY is set in your .env file.'
    );
  }

  const productConfig = getAIProductConfig(productType);

  // Format parameters into human-readable context
  let paramsBlock = '';
  if (Object.keys(params).length > 0) {
    paramsBlock = `\n=== SELECTED CONFIGURATION & ACTIVE PARAMETERS ===\n`;
    Object.entries(params).forEach(([key, val]) => {
      const field = productConfig.parameters.find((p) => p.id === key);
      const label = field ? field.label : key;
      const opt = field?.options?.find((o) => o.value === val);
      const valLabel = opt ? `${opt.label} (${val})` : val;
      paramsBlock += `- **${label}**: ${valLabel}\n`;
    });
    paramsBlock += `=== END OF PARAMETERS ===\n\n`;
  }

  // Format attached reference documents
  let docContextBlock = '';
  if (documents.length > 0) {
    docContextBlock = `\n\n=== ATTACHED REFERENCE DOCUMENTS (${documents.length} files) ===\n`;
    documents.forEach((doc, idx) => {
      docContextBlock += `\n--- Document #${idx + 1}: ${doc.name} (${doc.type}) ---\n${doc.content.substring(0, 15000)}\n`;
    });
    docContextBlock += `\n=== END OF ATTACHED DOCUMENTS ===\n\n`;
  }

  // Build multi-turn recent history context
  let conversationContext = '';
  const recentHistory = history.slice(-6);
  if (recentHistory.length > 0) {
    conversationContext = `\n=== PREVIOUS CONVERSATION CONTEXT ===\n`;
    recentHistory.forEach((msg) => {
      conversationContext += `[${msg.role.toUpperCase()}]: ${msg.content}\n\n`;
    });
    conversationContext += `=== END OF CONTEXT ===\n\n`;
  }

  const dynamicParamsBlock = getActiveParameterInstructions(productType);
  const fullPrompt = `${productConfig.systemPrompt}\n\n${dynamicParamsBlock}${paramsBlock}${conversationContext}${docContextBlock}USER QUERY & TASK:\n${trimmedPrompt}\n\nOUTPUT REQUIREMENTS: Deliver an in-depth, professional, beautifully formatted Markdown response tailored specifically to the ${productConfig.name} workflow and the selected parameters above.`;

  const candidateModels = [
    modelOverride,
    ILA_MODEL,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-2.5-pro',
  ].filter(Boolean) as string[];

  const ai = new GoogleGenAI({ apiKey });
  let lastError: unknown = null;

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: fullPrompt,
      });

      if (response && response.text) {
        return response.text.trim();
      }
    } catch (err: unknown) {
      console.warn(`AI Hub Model ${modelName} call failed, trying fallback:`, err);
      lastError = err;
    }
  }

  throw new Error(
    `Failed to generate response for ${productConfig.name}: ${lastError instanceof Error ? lastError.message : 'AI generation error'}`
  );
}

