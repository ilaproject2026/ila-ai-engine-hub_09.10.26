export type AIProductType =
  | 'ila_chat'
  | 'course_creator'
  | 'visa_doc_analyzer'
  | 'hr_interviewer'
  | 'ai_live_consultant'
  | 'ai_business_proposal'
  | 'ila_news_agenda'
  | 'ai_pricing_tool'
  | 'ai_weather_delivery_tracker'
  | 'welcome_bot'
  | 'senior_marketing_manager'
  | 'ai_tieup_creator'
  | 'ai_promo_creator'
  | 'ai_meeting_mode'
  | 'ai_teacher_strategist'
  | 'ai_job_search_marketing'
  | 'cookie_tracker_rd';

export interface AIProductParamOption {
  value: string;
  label: string;
  badge?: string;
  description?: string;
}

export interface AIProductParamField {
  id: string;
  label: string;
  type: 'select' | 'text' | 'pills' | 'toggle';
  defaultValue: string;
  options?: AIProductParamOption[];
  placeholder?: string;
}

export interface AIProductConfig {
  id: AIProductType;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  category: 'Core & Guidance' | 'Visa & Careers' | 'Corporate & Operations' | 'Growth & Partnerships';
  icon: string; // Lucide icon name
  badge: string;
  gradient: string;
  accentColor: string;
  placeholderPrompt: string;
  quickPrompts: string[];
  parameters: AIProductParamField[];
  systemPrompt: string;
}

export const AI_PRODUCTS: AIProductConfig[] = [
  {
    id: 'ila_chat',
    name: "Ila's With You (Chat & Site Guide)",
    shortName: 'Ila Chat & Guide',
    tagline: 'Universal Intelligent Companion, Multimodal AI Mentor & Comprehensive Site Guide',
    description: 'Ask anything, explore global academic paths, learn technical concepts, navigate platform capabilities, and get personalized 24/7 AI mentoring.',
    category: 'Core & Guidance',
    icon: 'MessageSquareHeart',
    badge: 'Flagship AI',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    accentColor: '#818cf8',
    placeholderPrompt: "Ask Ila anything: study abroad paths, course authoring, platform features, visa guidance, or instant research...",
    quickPrompts: [
      "Compare Master's in AI in Germany vs UK with post-study visa and tuition benchmarks",
      "Give me a complete walkthrough of how to author multi-book courses and export slide decks in Ila",
      "Explain the CEFR German language progression path from A1 to C1 for international healthcare specialists",
      "How does the Ila Academy platform support B2B institutional partnerships and student placements?"
    ],
    parameters: [
      {
        id: 'mentor_mode',
        label: 'Mentor Personality',
        type: 'select',
        defaultValue: 'counselor_guide',
        options: [
          { value: 'counselor_guide', label: 'Study Abroad Counselor & Platform Guide' },
          { value: 'academic_professor', label: 'Academic Professor & Socratic Tutor' },
          { value: 'executive_strategist', label: 'Executive Strategist & Tech Lead' },
          { value: 'career_mentor', label: 'International Career & Placement Mentor' }
        ]
      },
      {
        id: 'depth_level',
        label: 'Response Depth',
        type: 'pills',
        defaultValue: 'comprehensive',
        options: [
          { value: 'concise', label: 'Concise Bullet Points' },
          { value: 'comprehensive', label: 'Comprehensive & Detailed' },
          { value: 'step_by_step', label: 'Step-by-Step Action Plan' }
        ]
      }
    ],
    systemPrompt: `You are Ila's With You (Chat & Site Guide), the universal intelligent companion, educational mentor, and premier guide for Ila AI Hub and Ila Academy.
Provide brilliant, structured, empathetic, and deeply informative responses. Use clear markdown headings, bullet points, checklists, and actionable insights. Guide users through platform features, education pathways, visa requirements, and technical workflows with precision.`
  },
  {
    id: 'course_creator',
    name: 'Course Creator',
    shortName: 'Course Creator',
    tagline: 'Multi-Book Interactive Curriculum & Masterclass Studio',
    description: 'Full-featured enterprise course authoring platform with automated 4-book synthesis, synchronized slide decks, studio video teleprompters, and teacher admin catalog.',
    category: 'Core & Guidance',
    icon: 'GraduationCap',
    badge: 'Creator Studio',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    accentColor: '#6366f1',
    placeholderPrompt: 'Enter course topic (e.g., German Language A1–C2, Cloud Architecture, Clinical Diagnosis)...',
    quickPrompts: [
      'German Language for Healthcare Professionals (A1 to B2 Arztbriefe & Patient Dialogues)',
      'Enterprise Full-Stack Cloud Architecture & Kubernetes Microservices',
      'International Financial Reporting Standards (IFRS & ESG Accounting)',
      'Autonomous AI Agents & Multi-Modal LLM Engineering Masterclass'
    ],
    parameters: [
      {
        id: 'targetAudience',
        label: 'Target Learner Segment',
        type: 'select',
        defaultValue: 'general_career',
        options: [
          { value: 'general_career', label: 'General Students & Career Professionals' },
          { value: 'doctor_healthcare', label: 'Doctors & Healthcare Specialists' },
          { value: 'executive_business', label: 'Enterprises & Business Leaders' },
          { value: 'finance_operations', label: 'Finance & Operations Specialists' }
        ]
      }
    ],
    systemPrompt: `You are ILA AI, the Master Educator and Course Authoring Intelligence for Ila Academy. Generate structured, exhaustive masterclass course content.`
  },
  {
    id: 'visa_doc_analyzer',
    name: 'Visa Doc Analyzer',
    shortName: 'Visa Analyzer',
    tagline: 'AI Audit & Risk Analysis for Immigration & Visa Files',
    description: 'Instantly audit Statements of Purpose (SOP), Motivation Letters, Financial Proofs, Blocked Accounts, and Employment Proofs against strict embassy criteria.',
    category: 'Visa & Careers',
    icon: 'ShieldAlert',
    badge: 'Immigration AI',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
    accentColor: '#38bdf8',
    placeholderPrompt: 'Paste your SOP, Motivation Letter, or upload visa documents to analyze acceptance odds and embassy compliance...',
    quickPrompts: [
      'Audit my Motivation Letter for a German National Student Visa (APS & Blocked Account compliance)',
      'Review my Statement of Purpose (SOP) for Canadian Study Permit with focus on home ties & financial proof',
      'Check Germany Opportunity Card (Chancenkarte) points score and required verification documents',
      'Analyze UK Skilled Worker Visa cover letter for shortage occupation code alignment'
    ],
    parameters: [
      {
        id: 'destination_country',
        label: 'Destination Country',
        type: 'select',
        defaultValue: 'germany',
        options: [
          { value: 'germany', label: 'Germany (National Visa / Chancenkarte / EU Blue Card)' },
          { value: 'uk', label: 'United Kingdom (Student Route / Skilled Worker)' },
          { value: 'usa', label: 'United States (F-1 Student / J-1 Exchange / H-1B)' },
          { value: 'canada', label: 'Canada (Study Permit / Express Entry / PGWP)' },
          { value: 'australia', label: 'Australia (Subclass 500 / Subclass 485 / 189)' },
          { value: 'ireland', label: 'Ireland (Stamp 2 Student / Critical Skills)' }
        ]
      },
      {
        id: 'visa_category',
        label: 'Visa Category',
        type: 'select',
        defaultValue: 'student_visa',
        options: [
          { value: 'student_visa', label: 'Higher Education Student Visa' },
          { value: 'chancenkarte', label: 'Opportunity Card (Chancenkarte / Job Seeker)' },
          { value: 'work_permit', label: 'Work Permit / Employment / Blue Card' },
          { value: 'vocational_training', label: 'Vocational Training (Ausbildung / Apprenticeship)' },
          { value: 'tourist_business', label: 'Schengen Tourist / Business Visa' }
        ]
      },
      {
        id: 'analysis_mode',
        label: 'Analysis Depth',
        type: 'pills',
        defaultValue: 'full_audit',
        options: [
          { value: 'full_audit', label: 'Full Embassy Audit & Scoring' },
          { value: 'red_flags', label: 'Red Flags & Rejection Risks' },
          { value: 'line_by_line', label: 'Line-by-Line Rewording' }
        ]
      }
    ],
    systemPrompt: `You are the Senior Immigration & Visa Compliance AI Auditor for Ila Academy.
Analyze submitted visa documents, Statements of Purpose (SOP), letters of motivation, or visa queries with extreme scrutiny against real embassy standards (e.g., German Auswärtiges Amt, UK Visas and Immigration, US DOS, IRCC Canada).
Provide:
1. Executive Compliance Score (0-100%) and Approval Probability Rating.
2. Identified Critical Red Flags & Ambiguities (with specific clause citations).
3. Country-Specific Legal & Evidentiary Checks (APS, Blocked Account, English/German proof, Tie-back to home country).
4. Concrete Corrective Recommendations & Line-by-Line Polished Rewrites.`
  },
  {
    id: 'hr_interviewer',
    name: 'HR Interviewer',
    shortName: 'HR Interviewer',
    tagline: 'Interactive Mock Interviews & Executive Competency Scoring',
    description: 'Conduct realistic AI mock interviews for global corporate roles, tech jobs, and university admissions with real-time feedback and behavioral scoring.',
    category: 'Visa & Careers',
    icon: 'UserCheck',
    badge: 'Career AI',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    accentColor: '#34d399',
    placeholderPrompt: 'Enter your target job title, company name, or paste your interview response for instant evaluation...',
    quickPrompts: [
      'Conduct a Senior Full-Stack Cloud Engineer interview (System Design + STAR Behavioral Questions)',
      'Simulate an interview for an International Clinical Resident (Assistenzarzt) in a German hospital',
      'Practice MBA Admissions Interview for Top European Business Schools (Leadership & Case Questions)',
      'Evaluate my response to "Tell me about a time you handled a severe production outage under pressure"'
    ],
    parameters: [
      {
        id: 'target_role',
        label: 'Target Industry / Domain',
        type: 'select',
        defaultValue: 'software_engineering',
        options: [
          { value: 'software_engineering', label: 'Software & Cloud Engineering' },
          { value: 'healthcare_medicine', label: 'Healthcare & Clinical Medicine' },
          { value: 'business_consulting', label: 'Management Consulting & Strategy' },
          { value: 'finance_banking', label: 'Investment Banking & Corporate Finance' },
          { value: 'marketing_sales', label: 'Product Marketing & Growth' },
          { value: 'data_science_ai', label: 'Data Science & Machine Learning' }
        ]
      },
      {
        id: 'seniority_level',
        label: 'Seniority Level',
        type: 'select',
        defaultValue: 'senior',
        options: [
          { value: 'entry_intern', label: 'Entry Level / Graduate / Intern' },
          { value: 'mid_level', label: 'Mid-Level Professional (3-5 years)' },
          { value: 'senior', label: 'Senior Specialist / Team Lead (5-10 years)' },
          { value: 'executive_c_level', label: 'Director / VP / C-Level Executive' }
        ]
      },
      {
        id: 'interview_type',
        label: 'Interview Round',
        type: 'pills',
        defaultValue: 'behavioral_star',
        options: [
          { value: 'behavioral_star', label: 'Behavioral & STAR Method' },
          { value: 'technical_domain', label: 'Technical & Case Solving' },
          { value: 'culture_executive', label: 'Executive Leadership' }
        ]
      }
    ],
    systemPrompt: `You are the Lead Executive HR Director & Technical Interview Board for Ila Academy.
Conduct or evaluate professional mock interviews. When conducting an interview:
- Ask 1-2 sharp, realistic, senior-level questions at a time.
- If evaluating a user's answer, provide:
  1. STAR Framework Score (Situation, Task, Action, Result) out of 100%.
  2. Strengths & High-Impact Vocabulary Highlights.
  3. Weaknesses, Fillers, or Missed Business Value.
  4. The Ideal High-Scoring Executive Rewrite.`
  },
  {
    id: 'ai_live_consultant',
    name: 'AI Live Consultant',
    shortName: 'Live Consultant',
    tagline: 'Strategic Advisory & Decision-Making Intelligence',
    description: 'Instant strategic consulting across global education trajectories, career pivots, business expansion, regulatory compliance, and investment decisions.',
    category: 'Visa & Careers',
    icon: 'Radio',
    badge: 'Live Advisory',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    accentColor: '#fbbf24',
    placeholderPrompt: 'Describe your challenge, crossroad, or strategic objective for executive-level advisory...',
    quickPrompts: [
      'Create a 12-month strategic roadmap for transition from non-EU IT specialist to EU Permanent Resident',
      'Evaluate business feasibility for establishing an AI EdTech subsidiary in Munich with German funding grants',
      'Compare Career ROI: On-campus Master in Germany vs Master in USA with H-1B lottery uncertainty',
      'Strategic audit for setting up a specialized German nursing recruitment agency in South Asia'
    ],
    parameters: [
      {
        id: 'consulting_domain',
        label: 'Advisory Domain',
        type: 'select',
        defaultValue: 'global_education',
        options: [
          { value: 'global_education', label: 'Global Higher Education & University Admissions' },
          { value: 'career_pivot', label: 'Career Pivot & Cross-Border Migration' },
          { value: 'business_startup', label: 'Business Incubation & EU Market Entry' },
          { value: 'legal_regulatory', label: 'Regulatory Compliance & Work Authorization' }
        ]
      },
      {
        id: 'target_market',
        label: 'Target Geography',
        type: 'select',
        defaultValue: 'germany_eu',
        options: [
          { value: 'germany_eu', label: 'Germany & European Union (DACH)' },
          { value: 'uk_ireland', label: 'UK & Ireland' },
          { value: 'north_america', label: 'USA & Canada' },
          { value: 'asia_pacific', label: 'Australia & New Zealand' }
        ]
      },
      {
        id: 'urgency_horizon',
        label: 'Execution Horizon',
        type: 'pills',
        defaultValue: '3_6_months',
        options: [
          { value: 'immediate', label: 'Immediate (1-30 Days)' },
          { value: '3_6_months', label: 'Short-Term (3-6 Months)' },
          { value: '12_24_months', label: 'Long-Term (1-2 Years)' }
        ]
      }
    ],
    systemPrompt: `You are the Chief Strategic Advisory Partner at Ila Academy Consulting.
Provide world-class, multi-dimensional executive consulting. Structure every response with:
1. Executive Summary & Core Strategic Verdict.
2. Comprehensive Decision Matrix with Pros, Cons, Costs, and Feasibility.
3. Risk Mitigation & Compliance Safeguards.
4. Chronological Phased Action Blueprint (Month-by-Month / Week-by-Week).`
  },
  {
    id: 'ai_business_proposal',
    name: 'AI Business R&D Proposal',
    shortName: 'R&D Proposal',
    tagline: 'Enterprise Grant Proposals, Investor Pitches & Feasibility Blueprints',
    description: 'Draft comprehensive R&D grant applications (Horizon Europe, ZIM, Exist), corporate business cases, startup pitch proposals, and technological feasibility studies.',
    category: 'Corporate & Operations',
    icon: 'Briefcase',
    badge: 'Enterprise AI',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    accentColor: '#a78bfa',
    placeholderPrompt: 'Describe your innovation, venture concept, or grant call to generate an investment-ready proposal...',
    quickPrompts: [
      'Write a German ZIM / Horizon Europe R&D proposal for an AI-powered Clinical Telemedicine platform',
      'Create a comprehensive Seed-stage Investor Pitch Proposal for an AI Language & Career Placement platform',
      'Draft an Enterprise Business Case for migrating legacy ERP infrastructure to Hybrid AI Cloud',
      'Generate a Technological Feasibility & Commercialization Study for Green Hydrogen distribution'
    ],
    parameters: [
      {
        id: 'proposal_type',
        label: 'Proposal Framework',
        type: 'select',
        defaultValue: 'grant_application',
        options: [
          { value: 'grant_application', label: 'R&D Government Grant (Horizon Europe / ZIM / EXIST)' },
          { value: 'investor_pitch', label: 'Venture Capital / Angel Investor Pitch Proposal' },
          { value: 'corporate_business_case', label: 'Corporate Board Business Case & ROI Justification' },
          { value: 'academic_commercialization', label: 'Academic Technology Transfer & Commercialization' }
        ]
      },
      {
        id: 'industry_vertical',
        label: 'Industry Vertical',
        type: 'select',
        defaultValue: 'ai_edtech',
        options: [
          { value: 'ai_edtech', label: 'AI, EdTech & Digital Learning' },
          { value: 'medtech_health', label: 'MedTech, Biotech & Healthcare' },
          { value: 'cleantech_energy', label: 'CleanTech, Renewable Energy & Sustainability' },
          { value: 'fintech_cyber', label: 'FinTech, Web3 & Cybersecurity' },
          { value: 'industry40_robotics', label: 'Smart Manufacturing & Robotics (Industry 4.0)' }
        ]
      },
      {
        id: 'budget_scale',
        label: 'Project Budget Scale',
        type: 'pills',
        defaultValue: '500k_2m',
        options: [
          { value: 'sub_250k', label: 'Seed (< €250k)' },
          { value: '500k_2m', label: 'Standard (€500k - €2M)' },
          { value: '5m_plus', label: 'Consortium (€5M+)' }
        ]
      }
    ],
    systemPrompt: `You are the Principal R&D Director and Venture Capital Investment Proposal Lead for Ila Academy.
Draft institutional-grade R&D proposals, grant dossiers, and business feasibility models.
Structure proposals with:
1. Project Identity, Abstract, and Strategic Relevance.
2. Technological Innovation, State of the Art Benchmark, and Novelty Proof.
3. Work Packages (WP1 to WP5) with Deliverables, Milestones, and Gantt Timeline.
4. Commercialization, Market TAM/SAM/SOM, and Revenue Projections.
5. Risk Assessment Matrix & Regulatory Compliance.`
  },
  {
    id: 'ila_news_agenda',
    name: 'ILA News & Agenda Updates',
    shortName: 'News & Agenda',
    tagline: 'Corporate News Management, Product Bulletins & CEO Strategic Agendas',
    description: 'Executive news portal for CEO and management staff to author, organize, and map corporate announcements, legal immigration alerts, and product releases.',
    category: 'Corporate & Operations',
    icon: 'Newspaper',
    badge: 'Management AI',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    accentColor: '#38bdf8',
    placeholderPrompt: 'Draft corporate announcements, map legal immigration updates to products, or generate CEO executive press releases...',
    quickPrompts: [
      'Draft a CEO Corporate Announcement on the launch of Ila AI Hub v6 and 16 modular engines',
      'Map recent German Chancenkarte regulations to Ila Academy course curriculum and student placement offerings',
      'Create an executive weekly agenda bulletin for academy staff covering student intake deadlines and embassy appointments',
      'Draft an official press release regarding strategic university partnerships in Germany and UK'
    ],
    parameters: [
      {
        id: 'news_audience',
        label: 'Target News Audience',
        type: 'select',
        defaultValue: 'all_stakeholders',
        options: [
          { value: 'all_stakeholders', label: 'Public & All Stakeholders (Press Release)' },
          { value: 'internal_staff_ceo', label: 'Internal Staff & CEO Board (Executive Memo)' },
          { value: 'students_applicants', label: 'Enrolled Students & Visa Applicants' },
          { value: 'institutional_partners', label: 'B2B Partners, Universities & Hospitals' }
        ]
      },
      {
        id: 'product_mapping',
        label: 'Mapped Product Line',
        type: 'select',
        defaultValue: 'ila_ai_hub_suite',
        options: [
          { value: 'ila_ai_hub_suite', label: 'ILA AI Hub Platform & Suite' },
          { value: 'german_language_nursing', label: 'German Language & Healthcare Programs' },
          { value: 'study_abroad_visa', label: 'Study Abroad & Visa Placement Services' },
          { value: 'b2b_institutional_contracts', label: 'B2B Institutional Tie-ups & Licensing' }
        ]
      },
      {
        id: 'bulletin_format',
        label: 'Publication Format',
        type: 'pills',
        defaultValue: 'executive_press_release',
        options: [
          { value: 'executive_press_release', label: 'Official Press Release' },
          { value: 'internal_memo', label: 'Internal Staff Memo' },
          { value: 'social_bulletin', label: 'Social & Web News Bulletin' }
        ]
      }
    ],
    systemPrompt: `You are the Chief Communications Officer and Senior Corporate Counsel for Ila Academy and Ila AI Hub.
Author institutional-grade news bulletins, corporate announcements, and strategic CEO agendas mapped to specific product lines and stakeholder groups.`
  },
  {
    id: 'ai_pricing_tool',
    name: 'AI Pricing Tool',
    shortName: 'AI Pricing Tool',
    tagline: 'Online Price Comparison, Competitor Pricing & Seasonal Package Creator',
    description: 'Perform real-time online price comparisons, evaluate competitor rates, build seasonal dynamic packages, and calculate gross margin profitability.',
    category: 'Corporate & Operations',
    icon: 'CreditCard',
    badge: 'Pricing & Finance',
    gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
    accentColor: '#34d399',
    placeholderPrompt: 'Enter course details, competitor URLs/prices, or target seasonal campaign to generate dynamic pricing models & packages...',
    quickPrompts: [
      'Compare online market rates for German A1-B2 Language + Visa consulting packages across Europe & South Asia',
      'Create a Summer/Winter Seasonal Pricing Package with early-bird discounts and payment installment plans',
      'Benchmark competitor pricing for B2B Healthcare staffing recruitment licenses and propose a winning price strategy',
      'Calculate gross margin, CAC breakeven, and student lifetime value (LTV) for a €2,400 elite training tier'
    ],
    parameters: [
      {
        id: 'pricing_strategy',
        label: 'Pricing Strategy',
        type: 'select',
        defaultValue: 'seasonal_package',
        options: [
          { value: 'seasonal_package', label: 'Seasonal Promotional Package (Early Bird / Intake Special)' },
          { value: 'competitor_benchmark', label: 'Competitor Price Benchmark & Undercut Analysis' },
          { value: 'tiered_subscription', label: '3-Tier Subscription (Basic, Pro, Elite VIP)' },
          { value: 'b2b_enterprise_volume', label: 'B2B Enterprise Volume & Seat Licensing' }
        ]
      },
      {
        id: 'currency_market',
        label: 'Target Currency & Market',
        type: 'select',
        defaultValue: 'eur_dach',
        options: [
          { value: 'eur_dach', label: 'EUR (€) - Germany & DACH Region' },
          { value: 'usd_global', label: 'USD ($) - Global International' },
          { value: 'gbp_uk', label: 'GBP (£) - United Kingdom' },
          { value: 'inr_south_asia', label: 'INR (₹) - South Asia' }
        ]
      },
      {
        id: 'discount_structure',
        label: 'Discount & Installments',
        type: 'pills',
        defaultValue: 'tiered_installment',
        options: [
          { value: 'upfront_discount', label: 'Upfront Pay-in-Full (15% Off)' },
          { value: 'tiered_installment', label: '3-Part Milestone Installments' },
          { value: 'no_discount_premium', label: 'Zero Discount High-Ticket' }
        ]
      }
    ],
    systemPrompt: `You are the Chief Pricing Officer (CPO) and Revenue Strategist for Ila Academy.
Analyze online price elasticity, competitor offerings, seasonal demand cycles, and cost structures to deliver clear price comparison matrices, package tier tables, and profitability projections.`
  },
  {
    id: 'ai_weather_delivery_tracker',
    name: 'AI Weather Forecast / Delivery Tracker',
    shortName: 'Weather & Delivery',
    tagline: 'Logistics, Climate Intelligence & Import-Export Consignment Tracking',
    description: 'Track global consignment shipments, customs transit timelines, airport arrival logistics, seasonal weather disruptions, and cold-chain import/export schedules.',
    category: 'Corporate & Operations',
    icon: 'CloudSun',
    badge: 'Logistics & Cargo',
    gradient: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
    accentColor: '#38bdf8',
    placeholderPrompt: 'Enter consignment details, tracking origin/destination hubs, cargo type, or arrival dates to calculate logistics schedules and weather risks...',
    quickPrompts: [
      'Track shipping transit timeline and customs clearance procedures for educational materials exported from Germany to India',
      'Evaluate seasonal weather disruptions and temperature controls for air cargo transit via Frankfurt (FRA) Airport in January',
      'Generate a student relocation logistics and baggage arrival packing guide for winter arrivals in Munich',
      'Create an import-export customs compliance checklist for cross-border medical equipment and books'
    ],
    parameters: [
      {
        id: 'tracking_mode',
        label: 'Logistics Category',
        type: 'select',
        defaultValue: 'import_export_cargo',
        options: [
          { value: 'import_export_cargo', label: 'Import-Export Consignment & Commercial Cargo' },
          { value: 'student_relocation_transit', label: 'International Student Relocation & Baggage Logistics' },
          { value: 'courier_document_dispatch', label: 'Official Documents & Visa Courier Dispatch' },
          { value: 'climate_weather_forecast', label: 'Regional Climate & Seasonal Weather Forecast' }
        ]
      },
      {
        id: 'transit_route',
        label: 'Transit Corridor',
        type: 'select',
        defaultValue: 'germany_frankfurt_hub',
        options: [
          { value: 'germany_frankfurt_hub', label: 'Germany (Frankfurt / Hamburg / Munich Hubs)' },
          { value: 'uk_heathrow_corridor', label: 'UK (London Heathrow / Manchester)' },
          { value: 'asia_europe_sea_air', label: 'Asia - Europe Sea & Air Freight Corridor' },
          { value: 'transatlantic_us_eu', label: 'Transatlantic (USA - European Union)' }
        ]
      },
      {
        id: 'risk_assessment',
        label: 'Weather Risk Depth',
        type: 'pills',
        defaultValue: 'weather_delay_audit',
        options: [
          { value: 'weather_delay_audit', label: 'Weather Delay & ETA Audit' },
          { value: 'customs_clearance', label: 'Customs Clearance Steps' },
          { value: 'full_logistics_manifest', label: 'Full Logistics Manifest' }
        ]
      }
    ],
    systemPrompt: `You are the Director of Global Logistics, Consignment Operations and Climate Tracking for Ila Academy.
Provide rigorous freight and cargo tracking breakdowns, customs compliance steps, airport transit schedules, weather impact forecasts, and contingency delivery plans.`
  },
  {
    id: 'welcome_bot',
    name: 'Welcome Bot',
    shortName: 'Welcome Bot',
    tagline: 'Interactive Visitor Reception, Smart Navigation & Platform Onboarding',
    description: 'Instant visitor receptionist guiding prospective students, teachers, and business partners through Ila AI Hub features, offerings, and registration paths.',
    category: 'Core & Guidance',
    icon: 'HelpCircle',
    badge: 'Reception AI',
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
    accentColor: '#2dd4bf',
    placeholderPrompt: 'Ask any question about Ila Academy, how to author courses, apply for visas, or get started...',
    quickPrompts: [
      'Welcome me to Ila Academy and summarize the top features available on the AI Hub',
      'Guide me step-by-step on how to enroll in German Language courses and get visa counseling',
      'How can an educator or institution use Course Creator to author multi-book curriculums?',
      'What B2B partnership and placement opportunities does Ila Academy offer for colleges?'
    ],
    parameters: [
      {
        id: 'visitor_intent',
        label: 'Visitor Intent',
        type: 'select',
        defaultValue: 'prospective_student',
        options: [
          { value: 'prospective_student', label: 'Study Abroad / Language Student' },
          { value: 'teacher_creator', label: 'Teacher / Course Author' },
          { value: 'b2b_institutional_partner', label: 'University / Hospital / Corporate Partner' },
          { value: 'general_visitor', label: 'General Explorer / First-Time Visitor' }
        ]
      },
      {
        id: 'reception_tone',
        label: 'Reception Style',
        type: 'pills',
        defaultValue: 'warm_engaging',
        options: [
          { value: 'warm_engaging', label: 'Warm & Helpful Guide' },
          { value: 'fast_summary', label: 'Quick Feature Highlights' },
          { value: 'guided_wizard', label: 'Interactive 3-Step Wizard' }
        ]
      }
    ],
    systemPrompt: `You are the Welcome Bot and Chief Digital Receptionist for Ila AI Hub and Ila Academy.
Greet visitors warmly, explain platform tools, suggest the best next actions based on their goals, and provide direct navigational guidance.`
  },
  {
    id: 'senior_marketing_manager',
    name: 'Senior Marketing Manager',
    shortName: 'Marketing Manager',
    tagline: 'Live Meeting Assistant for Client Conversions & Real-Time Closing Co-Pilot',
    description: 'Live meeting assistant designed for sales executives and marketing leads to handle objections, present value propositions, calculate ROI on the fly, and close client contracts.',
    category: 'Growth & Partnerships',
    icon: 'Mic2',
    badge: 'Conversion AI',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    accentColor: '#fb923c',
    placeholderPrompt: 'Enter live client objection, meeting agenda, or prospect profile to generate winning conversion scripts and closing frameworks...',
    quickPrompts: [
      'Handle client objection: "Your German language course fee is higher than local budget institutes"',
      'Live meeting closing script for converting a hesitant nursing candidate into enrolling in the B2 Hospital Program',
      'Generate a high-impact 10-minute pitch deck outline for presenting Ila AI Hub to a College Principal',
      'Synthesize sales meeting notes into a signed contract action checklist with follow-up milestones'
    ],
    parameters: [
      {
        id: 'conversion_scenario',
        label: 'Meeting / Sales Scenario',
        type: 'select',
        defaultValue: 'b2c_student_consultation',
        options: [
          { value: 'b2c_student_consultation', label: 'High-Ticket Student Counseling & Enrollment Closing' },
          { value: 'b2b_institutional_pitch', label: 'B2B College / University Partnership Pitch' },
          { value: 'hospital_employer_closing', label: 'Hospital / Employer Recruitment Contract Negotiation' },
          { value: 'objection_handling_live', label: 'Live Client Objection Handling & Defense' }
        ]
      },
      {
        id: 'deliverable_focus',
        label: 'Target Deliverable',
        type: 'pills',
        defaultValue: 'closing_script_objections',
        options: [
          { value: 'closing_script_objections', label: 'Live Closing Script & Rebuttals' },
          { value: 'roi_pitch_deck', label: 'ROI Justification & Pitch Deck' },
          { value: 'followup_contract_action', label: 'Contract Action Items' }
        ]
      }
    ],
    systemPrompt: `You are the Senior Marketing Director and Chief Sales Conversion Strategist for Ila Academy.
Equip marketing managers and sales leads with psychological persuasion frameworks, objection rebuttals, ROI justifications, and closing scripts that maximize conversion rates.`
  },
  {
    id: 'ai_tieup_creator',
    name: 'AI Tie-up Creator & Executive',
    shortName: 'Tie-up & Partner AI',
    tagline: 'School, College, Business, Import/Export, Supplier & Buyer Partner Identification',
    description: 'Identify high-yield institutional tie-ups, draft customized MOU partnership agreements, research supplier/buyer networks, and create formal cross-border collaboration proposals.',
    category: 'Growth & Partnerships',
    icon: 'Handshake',
    badge: 'Partnership AI',
    gradient: 'linear-gradient(135deg, #d946ef 0%, #a21caf 100%)',
    accentColor: '#e879f9',
    placeholderPrompt: 'Specify target partner type (schools, colleges, hospitals, suppliers, buyers) to generate partner identification dossiers and formal MOUs...',
    quickPrompts: [
      'Draft an Institutional Tie-up Proposal and MOU for partnering with Engineering Colleges in India for German Master’s admissions',
      'Identify potential German hospital networks seeking foreign healthcare tie-up agreements with nursing academies',
      'Create an Import/Export Buyer-Supplier Partnership Agreement for educational publishing materials',
      'Generate a comprehensive B2B Outreach Campaign for School Tie-ups (German Language as Foreign Language elective)'
    ],
    parameters: [
      {
        id: 'partner_type',
        label: 'Target Partner Entity',
        type: 'select',
        defaultValue: 'colleges_universities',
        options: [
          { value: 'colleges_universities', label: 'Colleges & Universities (Dual Degrees / Study Abroad)' },
          { value: 'schools_k12', label: 'K-12 Schools (Language Electives & Foundation Programs)' },
          { value: 'hospitals_healthcare', label: 'Hospitals & Healthcare Facilities (Staffing Tie-ups)' },
          { value: 'import_export_suppliers_buyers', label: 'Import/Export Suppliers & Buyer Distribution Networks' },
          { value: 'corporate_enterprises', label: 'Corporate Enterprises (Workforce Upskilling)' }
        ]
      },
      {
        id: 'tieup_geography',
        label: 'Target Geography',
        type: 'select',
        defaultValue: 'germany_dach',
        options: [
          { value: 'germany_dach', label: 'Germany & DACH Region' },
          { value: 'india_south_asia', label: 'India & South Asia' },
          { value: 'uk_europe', label: 'United Kingdom & Europe' },
          { value: 'middle_east_gulf', label: 'Middle East & Gulf Region' },
          { value: 'global_international', label: 'Global International' }
        ]
      },
      {
        id: 'tieup_output',
        label: 'Output Document',
        type: 'pills',
        defaultValue: 'mou_partnership_proposal',
        options: [
          { value: 'mou_partnership_proposal', label: 'Formal MOU & Tie-up Proposal' },
          { value: 'partner_lead_identification', label: 'Partner Sourcing & Lead Profile' },
          { value: 'outreach_email_sequence', label: 'Executive Cold Outreach Sequence' }
        ]
      }
    ],
    systemPrompt: `You are the Executive Vice President of Global Partnerships and Institutional Tie-ups for Ila Academy.
Author formal Memorandums of Understanding (MOUs), institutional partnership agreements, supplier/buyer network evaluations, and B2B joint-venture proposals.`
  },
  {
    id: 'ai_promo_creator',
    name: 'AI Promo Creator',
    shortName: 'AI Promo & Logo',
    tagline: 'High-Converting Campaign Scripts, Viral Videos & Integrated Logo Creation',
    description: 'Synthesize viral promotional campaigns, short-form video teleprompter scripts (Reels/TikTok), email sequences, and generate integrated brand logo concept briefs.',
    category: 'Growth & Partnerships',
    icon: 'Sparkles',
    badge: 'Promo & Branding',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    accentColor: '#f472b6',
    placeholderPrompt: 'Enter your course, offer, or campaign concept to generate promotional scripts, ad copy, and brand logo briefs...',
    quickPrompts: [
      'Generate a 5-part Instagram Reel & TikTok script series promoting German Language for Healthcare',
      'Design 5 minimalist logo concepts and Midjourney/DALL-E prompts for an AI Education Academy brand',
      'Write high-converting Facebook & Google Search ad copy for Study in Germany 2026 Admissions',
      'Create a 3-email drip sequence converting trial users into enrolled masterclass students'
    ],
    parameters: [
      {
        id: 'promo_focus',
        label: 'Creative Focus',
        type: 'select',
        defaultValue: 'video_teleprompter_script',
        options: [
          { value: 'video_teleprompter_script', label: 'Short-Form Video Teleprompter Script (Reels/TikTok/Shorts)' },
          { value: 'brand_logo_concept_suite', label: 'Integrated Brand Logo Design Brief & AI Prompts' },
          { value: 'paid_ad_campaign', label: 'Paid Ad Copy (Meta Ads, Google Search, LinkedIn)' },
          { value: 'email_sales_sequence', label: 'High-Conversion Email Nurture & Sales Sequence' }
        ]
      },
      {
        id: 'campaign_objective',
        label: 'Campaign Objective',
        type: 'select',
        defaultValue: 'student_enrollment',
        options: [
          { value: 'student_enrollment', label: 'Student Admissions & Course Enrollment' },
          { value: 'lead_generation', label: 'High-Intent Consultation Bookings' },
          { value: 'brand_authority', label: 'Viral Brand Awareness & Authority' }
        ]
      },
      {
        id: 'copy_angle',
        label: 'Marketing Angle',
        type: 'pills',
        defaultValue: 'urgent_aspirational',
        options: [
          { value: 'urgent_aspirational', label: 'Urgent & Aspirational' },
          { value: 'authoritative_data', label: 'Data-Driven & Authoritative' },
          { value: 'storytelling', label: 'Personal Transformation Story' }
        ]
      }
    ],
    systemPrompt: `You are the Lead Creative Director and Direct-Response Copywriting Architect for Ila Academy.
Create high-converting promotional assets with proven frameworks (AIDA, PAS). For video scripts, include scene directions and spoken text. For logo concepts, include design philosophy, color palettes, and generative AI text prompts.`
  },
  {
    id: 'ai_meeting_mode',
    name: 'AI Meeting Mode',
    shortName: 'Meeting Mode',
    tagline: 'Processing Customer Meeting Data, Past Interactions & Action Plans',
    description: 'Analyze raw customer consultation notes, historic client interaction records, and stakeholder transcripts into structured minutes, decision logs, and CRM follow-ups.',
    category: 'Corporate & Operations',
    icon: 'Users',
    badge: 'Meeting CRM',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
    accentColor: '#818cf8',
    placeholderPrompt: 'Paste raw customer meeting notes, consultation transcripts, or past interaction logs to structure executive minutes and CRM follow-ups...',
    quickPrompts: [
      'Process past customer interaction logs and generate a tailored follow-up proposal with exact pricing',
      'Convert raw student counseling transcript into a Profile Assessment Matrix, Red Flags & Next Steps',
      'Synthesize Board of Directors quarterly meeting notes into a Decision Record and RACI Action Matrix',
      'Analyze B2B partner meeting data and outline agreed milestones, deliverables, and assigned owners'
    ],
    parameters: [
      {
        id: 'interaction_type',
        label: 'Meeting / Interaction Type',
        type: 'select',
        defaultValue: 'customer_client_consultation',
        options: [
          { value: 'customer_client_consultation', label: 'Customer / Student Consultation & Counseling' },
          { value: 'b2b_stakeholder_sync', label: 'B2B Partner / Institutional Stakeholder Meeting' },
          { value: 'board_executive_review', label: 'Executive Board Review & Strategic Decisions' },
          { value: 'historical_crm_audit', label: 'Historical Interaction Audit & Account Recovery' }
        ]
      },
      {
        id: 'data_processing_mode',
        label: 'Processing Output',
        type: 'pills',
        defaultValue: 'decision_action_matrix',
        options: [
          { value: 'decision_action_matrix', label: 'Decision Log & Action Matrix' },
          { value: 'crm_followup_brief', label: 'CRM Summary & Email Draft' },
          { value: 'verbatim_minutes', label: 'Formal Executive Minutes' }
        ]
      }
    ],
    systemPrompt: `You are the Chief of Staff and Customer Intelligence Analyst for Ila Academy.
Process customer meeting data and interaction transcripts into structured, actionable documentation:
1. Executive Interaction Summary & Customer Intent.
2. Decisions Agreed & Commercial Terms.
3. Structured Action Items Table (Action, Owner, Priority, Due Date).
4. Ready-to-Send Client Follow-up Communication.`
  },
  {
    id: 'ai_teacher_strategist',
    name: 'AI Teacher & Strategist',
    shortName: 'Teacher & Strategist',
    tagline: "Pedagogical Strategy & Parameter Filtering for Ila's Teaching Methods",
    description: "Configure pedagogical frameworks, Bloom's Taxonomy progressions, diagnostic exams, Socratic dialogues, and custom teaching parameters for Ila Academy educators.",
    category: 'Core & Guidance',
    icon: 'GraduationCap',
    badge: 'Pedagogy AI',
    gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    accentColor: '#10b981',
    placeholderPrompt: "Specify subject, student grade, and pedagogical parameters to build dynamic lesson blueprints and teaching strategies...",
    quickPrompts: [
      "Create a 4-week active learning curriculum for German Grammar (Subjunctive II & Passive Voice) using Socratic Inquiry",
      "Design a 20-question Diagnostic Assessment with rubric scoring for Clinical Medical Terminology",
      "Build a Spaced Repetition flashcard and roleplay sequence for Business English presentations",
      "Develop a Flipped Classroom teaching strategy for Cloud Architecture and Kubernetes"
    ],
    parameters: [
      {
        id: 'teaching_method',
        label: "Ila's Teaching Framework",
        type: 'select',
        defaultValue: 'blooms_taxonomy_active',
        options: [
          { value: 'blooms_taxonomy_active', label: "Bloom's Taxonomy Progression (Foundations → Application → Mastery)" },
          { value: 'flipped_classroom_socratic', label: 'Flipped Classroom & Socratic Inquiry' },
          { value: 'clinical_scenario_simulation', label: 'Situational Roleplay & Case Simulation' },
          { value: 'spaced_repetition_micro', label: 'Spaced Repetition & Micro-Learning Units' },
          { value: 'pbl_project_driven', label: 'Project-Based Learning (PBL) Capstone' }
        ]
      },
      {
        id: 'target_level',
        label: 'Target Learner Level',
        type: 'select',
        defaultValue: 'undergrad_adult_cefr_b1_b2',
        options: [
          { value: 'beginner_cefr_a1_a2', label: 'Beginner / Foundational (CEFR A1–A2)' },
          { value: 'undergrad_adult_cefr_b1_b2', label: 'Intermediate / Career Ready (CEFR B1–B2)' },
          { value: 'advanced_specialist_cefr_c1_c2', label: 'Advanced Specialist / Medical Expert (CEFR C1–C2)' }
        ]
      },
      {
        id: 'pedagogy_output',
        label: 'Deliverable',
        type: 'pills',
        defaultValue: 'complete_curriculum_blueprint',
        options: [
          { value: 'complete_curriculum_blueprint', label: 'Full Curriculum & Lesson Plan' },
          { value: 'diagnostic_exam_rubric', label: 'Diagnostic Exam & Rubric' },
          { value: 'classroom_exercises', label: 'Interactive Class Exercises' }
        ]
      }
    ],
    systemPrompt: `You are the Lead Master Pedagogical Strategist and Curriculum Architect for Ila Academy.
Design educational experiences using proven instructional design methods. Structure outputs with clear learning objectives, time allocations, check-for-understanding prompts, and assessment rubrics.`
  },
  {
    id: 'ai_job_search_marketing',
    name: 'AI Job Search & Marketing Executive',
    shortName: 'Job Search & Marketing',
    tagline: 'European Career Matching, ATS Resumes, Cover Letters & Talent Marketing',
    description: 'Match candidates with top German and European job openings, optimize ATS resumes, draft German *Anschreiben* (DIN 5008), and architect candidate marketing campaigns.',
    category: 'Visa & Careers',
    icon: 'SearchCheck',
    badge: 'Career & Placement',
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #0284c7 100%)',
    accentColor: '#2dd4bf',
    placeholderPrompt: 'Paste candidate skills or job description to generate curated European job matches, ATS resume optimizations, and cover letters...',
    quickPrompts: [
      'Match English-speaking Software Engineer & DevOps jobs in Berlin and Munich with visa sponsorship likelihood',
      'Generate a German-standard Cover Letter (Anschreiben - DIN 5008) for a Senior Data Engineer position',
      'Benchmark salary expectations & negotiation strategy for an IT Specialist moving to Frankfurt with Blue Card',
      'Build a candidate talent marketing profile to present foreign medical doctors to German hospital directors'
    ],
    parameters: [
      {
        id: 'career_target_market',
        label: 'Target Job Market',
        type: 'select',
        defaultValue: 'germany_english_tech',
        options: [
          { value: 'germany_english_tech', label: 'Germany (English-Speaking Tech / Startups)' },
          { value: 'germany_german_healthcare', label: 'Germany (Healthcare & Engineering - B2/C1 German)' },
          { value: 'netherlands_benelux', label: 'Netherlands & Benelux (English Fluency)' },
          { value: 'switzerland_austria', label: 'Switzerland & Austria (DACH Region)' },
          { value: 'uk_global_remote', label: 'United Kingdom & Global Remote' }
        ]
      },
      {
        id: 'target_profession',
        label: 'Professional Field',
        type: 'select',
        defaultValue: 'it_software_ai',
        options: [
          { value: 'it_software_ai', label: 'IT, Software, Cloud & AI Engineering' },
          { value: 'healthcare_medicine_nursing', label: 'Doctors, Nurses & Healthcare Specialists' },
          { value: 'engineering_automotive', label: 'Mechanical, Automotive & Electrical Engineering' },
          { value: 'business_finance_marketing', label: 'Finance, Product Management & Marketing' }
        ]
      },
      {
        id: 'career_deliverable',
        label: 'Deliverable',
        type: 'pills',
        defaultValue: 'job_matches_cover_letter',
        options: [
          { value: 'job_matches_cover_letter', label: 'Job Matches & Cover Letter' },
          { value: 'ats_resume_optimization', label: 'ATS Resume Keyword Audit' },
          { value: 'salary_visa_strategy', label: 'Salary & Blue Card Strategy' }
        ]
      }
    ],
    systemPrompt: `You are the Senior European Talent Placement Executive and Recruitment Growth Strategist for Ila Academy.
Analyze candidate backgrounds, job market trends, and visa requirements. Deliver:
1. Curated Target Companies & Openings with visa sponsorship probability.
2. ATS Resume Optimization & Skill Bridge Checklist.
3. Culturally Tailored Cover Letter (*Anschreiben* compliant with German standards).
4. Compensation Benchmarking, Relocation Costs & Blue Card Visa Steps.`
  },
  {
    id: 'cookie_tracker_rd',
    name: 'Cookie Tracker & R&D Intelligence',
    shortName: 'Cookie Tracker & R&D',
    tagline: 'Visitor Journey Analytics, Cookie Consent Intelligence & Behavioral UX Research',
    description: 'Manage cookie tracking permissions, analyze user browsing journeys across Ila websites and services, diagnose drop-off friction points, identify high-engagement content, and generate actionable R&D optimization reports for AI welcome bots and platform growth.',
    category: 'Corporate & Operations',
    icon: 'Cookie',
    badge: 'R&D Analytics',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    accentColor: '#fbbf24',
    placeholderPrompt: 'Analyze visitor behavior, cookie consent data, user journey drop-offs, or request an R&D UX optimization audit...',
    quickPrompts: [
      'Diagnose visitor journey drop-offs and identify confusing or boring course modules based on cookie activity',
      'Generate a comprehensive R&D report on viewer selection patterns, time-on-page, and popular path transitions',
      'Audit cookie consent compliance, tracking opt-in rates, and real-time visitor engagement trends across services',
      'Recommend personalization workflows for the AI Welcome Bot based on visitor browsing history and interest clusters'
    ],
    parameters: [
      {
        id: 'tracking_scope',
        label: 'Analytics Scope',
        type: 'select',
        defaultValue: 'funnel_friction_rd',
        options: [
          { value: 'funnel_friction_rd', label: 'Drop-off & Friction Audit (Where viewers get stuck/bored)' },
          { value: 'journey_selection_rd', label: 'Option Selection & Engagement Mapping' },
          { value: 'cookie_consent_compliance', label: 'Cookie Consent & Privacy Permission Analytics' },
          { value: 'ai_bot_personalization', label: 'AI Welcome Bot Journey Handoff & Personalization' }
        ]
      },
      {
        id: 'analysis_target',
        label: 'Target Platform Area',
        type: 'select',
        defaultValue: 'course_workspace_catalog',
        options: [
          { value: 'course_workspace_catalog', label: 'Course Creator & Curriculum Workspace' },
          { value: 'student_intake_admission', label: 'Student Admissions & Unified Intake Forms' },
          { value: 'visa_careers_portal', label: 'Visa, Career & Jobs Portal' },
          { value: 'all_ila_ecosystem', label: 'Global Ila Academy Ecosystem & Web Services' }
        ]
      },
      {
        id: 'rd_output_format',
        label: 'Deliverable',
        type: 'pills',
        defaultValue: 'executive_rd_report',
        options: [
          { value: 'executive_rd_report', label: 'Executive R&D Intelligence Report' },
          { value: 'friction_fix_action_plan', label: 'Friction Fix & UX Action Plan' },
          { value: 'bot_prompt_directives', label: 'AI Welcome Bot Directives' }
        ]
      }
    ],
    systemPrompt: `You are the Lead Data Scientist, Cookie Tracking Specialist, and Behavioral UX R&D Director for Ila Academy and Ila AI Hub.
Your mission is to:
1. Analyze visitor interaction metrics, cookie tracking permissions, and navigation journey logs across all platform services.
2. Identify why users start, complete, or abandon specific courses, pages, or intake forms.
3. Detect bottlenecks, confusing sections, or boring/disturbing content that causes viewer drop-off.
4. Provide structured R&D solutions, UX adjustments, and personalization rules for the AI Welcome Bot to guide and retain viewers effectively.
Deliver structured insights with executive summaries, metrics diagnosis, friction root causes, and clear step-by-step action plans.`
  }
];

export function getAIProductConfig(productId: AIProductType | string): AIProductConfig {
  const found = AI_PRODUCTS.find((p) => p.id === productId);
  return found || AI_PRODUCTS[1]; // fallback to Course Creator
}
