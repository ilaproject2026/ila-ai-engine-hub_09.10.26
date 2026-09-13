import { useState, useMemo, type FormEvent, type KeyboardEvent, type ChangeEvent } from 'react';
import {
  Sparkles,
  Loader2,
  Mic,
  MicOff,
  Paperclip,
  BookOpen,
  Layers,
  X,
  GraduationCap,
  Bookmark,
  Wand2,
  Copy,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { useVoice } from '../hooks/useVoice';
import DocumentUploadZone from './DocumentUploadZone';
import { type AttachedDocument } from '../services/dbService';
import {
  COURSE_TAXONOMY_CATEGORIES,
  COURSE_DELIVERY_PATHS,
  COURSE_BATCH_OPTIONS,
  COURSE_SLOT_OPTIONS,
  generateStandardCourseId,
  type CourseCreationMetadata,
} from '../services/courseLibrarySyncService';

export interface CourseInputParams extends CourseCreationMetadata {}

interface SearchBoxProps {
  onSendMessage: (
    query: string,
    documents: AttachedDocument[],
    targetAudience?: string,
    courseParams?: CourseInputParams
  ) => void;
  loading: boolean;
  attachedDocuments: AttachedDocument[];
  onDocumentsChange: (docs: AttachedDocument[]) => void;
  placeholder?: string;
  onNewChat?: () => void;
  isBulkPlannerActive?: boolean;
  onToggleBulkPlanner?: (active: boolean) => void;
  targetAudience?: string;
  onTargetAudienceChange?: (aud: string) => void;
  initialCourseName?: string;
  initialCourseId?: string;
}

export default function SearchBox({
  onSendMessage,
  loading,
  attachedDocuments,
  onDocumentsChange,
  placeholder = 'Create course or ask anything...',
  onNewChat: _onNewChat,
  isBulkPlannerActive = false,
  onToggleBulkPlanner,
  targetAudience: propTargetAudience,
  initialCourseName = '',
  initialCourseId = '',
}: SearchBoxProps) {
  const [query, setQuery] = useState<string>('');
  const [showUploadZone, setShowUploadZone] = useState<boolean>(false);
  const targetAudience = propTargetAudience || 'General Student / Lifelong Learner';

  // 1. Top-Row Dedicated Fields: Course Name & Course ID
  const [courseName, setCourseName] = useState<string>(initialCourseName);
  const [selectedCategory, setSelectedCategory] = useState<string>(COURSE_TAXONOMY_CATEGORIES[0].id);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(
    COURSE_TAXONOMY_CATEGORIES[0].subCategories[0].id
  );
  const [courseId, setCourseId] = useState<string>(() => {
    return initialCourseId || generateStandardCourseId(COURSE_TAXONOMY_CATEGORIES[0].id, COURSE_TAXONOMY_CATEGORIES[0].subCategories[0].id);
  });
  const [copyIdFeedback, setCopyIdFeedback] = useState<boolean>(false);

  // 2. Main Parameter Selection: Delivery Path, Batch & Slot
  const [selectedPath, setSelectedPath] = useState<string>(COURSE_DELIVERY_PATHS[0].id);
  const [selectedBatch, setSelectedBatch] = useState<string>(COURSE_BATCH_OPTIONS[0]);
  const [selectedSlot, setSelectedSlot] = useState<string>(COURSE_SLOT_OPTIONS[0]);

  // Derived Category and Sub-Category Objects
  const activeCategoryObj = useMemo(() => {
    return (
      COURSE_TAXONOMY_CATEGORIES.find((c) => c.id === selectedCategory) ||
      COURSE_TAXONOMY_CATEGORIES[0]
    );
  }, [selectedCategory]);

  const activeSubCategories = useMemo(() => {
    return activeCategoryObj.subCategories;
  }, [activeCategoryObj]);

  const activeSubCategoryObj = useMemo(() => {
    return (
      activeSubCategories.find((s) => s.id === selectedSubCategory) ||
      activeSubCategories[0]
    );
  }, [activeSubCategories, selectedSubCategory]);

  const activePathObj = useMemo(() => {
    return (
      COURSE_DELIVERY_PATHS.find((p) => p.id === selectedPath) ||
      COURSE_DELIVERY_PATHS[0]
    );
  }, [selectedPath]);

  // When category changes, auto-align sub-category and update Course ID suggestion
  const handleCategoryChange = (newCatId: string) => {
    setSelectedCategory(newCatId);
    const cat = COURSE_TAXONOMY_CATEGORIES.find((c) => c.id === newCatId);
    if (cat && cat.subCategories.length > 0) {
      const newSubId = cat.subCategories[0].id;
      setSelectedSubCategory(newSubId);
      // If user hasn't typed a custom Course ID, auto-refresh to standard prefix
      if (!courseId || courseId.startsWith('CRS-')) {
        setCourseId(generateStandardCourseId(newCatId, newSubId));
      }
    }
  };

  // Re-generate standardized Course ID
  const handleRegenerateId = () => {
    const newId = generateStandardCourseId(selectedCategory, selectedSubCategory);
    setCourseId(newId);
  };

  // Copy Course ID to clipboard
  const handleCopyCourseId = () => {
    if (!courseId) return;
    navigator.clipboard.writeText(courseId);
    setCopyIdFeedback(true);
    setTimeout(() => setCopyIdFeedback(false), 2000);
  };

  const {
    isListening,
    speechError,
    setSpeechError,
    isRecognitionSupported,
    toggleListening,
  } = useVoice();

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery || loading) return;

    if (isListening) {
      toggleListening(() => {});
    }

    const catName = activeCategoryObj?.name || selectedCategory;
    const subCatName = activeSubCategoryObj?.name || selectedSubCategory;
    const pathName = activePathObj?.name || selectedPath;
    const effectiveCourseName = courseName.trim() || cleanQuery.slice(0, 60);
    const effectiveCourseId = courseId.trim() || generateStandardCourseId(selectedCategory, selectedSubCategory);

    const courseParams: CourseInputParams = {
      courseName: effectiveCourseName,
      courseId: effectiveCourseId,
      category: catName,
      subCategory: subCatName,
      deliveryPath: pathName,
      batch: selectedBatch,
      slot: selectedSlot,
      batchSlot: `${selectedBatch} • ${selectedSlot}`,
    };

    onSendMessage(cleanQuery, attachedDocuments, targetAudience, courseParams);
    setQuery('');
    setShowUploadZone(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleVoiceInputClick = () => {
    toggleListening((transcript) => {
      setQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
    });
  };

  return (
    <div
      id="course-creator-input-section-root"
      style={{
        width: '100%',
        maxWidth: '100%',
        margin: '0',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.55rem',
      }}
    >
      {/* Search Input Box Card */}
      <div
        className="glass-panel"
        style={{
          borderRadius: '1.25rem',
          padding: '0.9rem 1.15rem',
          boxShadow: 'var(--shadow-md)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          
          {/* ============================================================== */}
          {/* 1. TOP-ROW: DEDICATED COURSE NAME & COURSE ID INPUT FIELDS    */}
          {/* ============================================================== */}
          <div
            id="course-creator-top-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              flexWrap: 'wrap',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            {/* Field 1: Course Name Input Box */}
            <div
              id="course-name-field-container"
              style={{
                flex: '1 1 320px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-medium)',
                borderRadius: '0.65rem',
                padding: '0.35rem 0.75rem',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  color: 'var(--accent-primary)',
                  flexShrink: 0,
                }}
              >
                <GraduationCap size={15} />
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Course Name
                </span>
              </div>
              <input
                id="course-name-top-input"
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. Enterprise AI Engineering & Neural Systems"
                disabled={loading}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-main)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  padding: '0.15rem 0',
                }}
              />
              {courseName && (
                <button
                  type="button"
                  onClick={() => setCourseName('')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-subtle)',
                    cursor: 'pointer',
                    padding: '0.15rem',
                    display: 'flex',
                  }}
                  title="Clear Course Name"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Field 2: Course ID Input Box with Auto-Generate & Copy */}
            <div
              id="course-id-field-container"
              style={{
                flex: '0 1 250px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-medium)',
                borderRadius: '0.65rem',
                padding: '0.35rem 0.65rem',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  color: '#06b6d4',
                  flexShrink: 0,
                }}
              >
                <Bookmark size={14} />
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Course ID
                </span>
              </div>
              <input
                id="course-id-top-input"
                type="text"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value.toUpperCase())}
                placeholder="CRS-2026-AI01"
                disabled={loading}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#38bdf8',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  letterSpacing: '0.04em',
                  padding: '0.15rem 0',
                }}
              />
              <button
                type="button"
                onClick={handleRegenerateId}
                style={{
                  background: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid rgba(6, 182, 212, 0.35)',
                  color: '#38bdf8',
                  borderRadius: '0.35rem',
                  padding: '0.2rem 0.4rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                }}
                title="Generate new standard Course ID"
              >
                <Wand2 size={11} />
                <span>Auto</span>
              </button>
              <button
                type="button"
                onClick={handleCopyCourseId}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: copyIdFeedback ? 'var(--success)' : 'var(--text-subtle)',
                  cursor: 'pointer',
                  padding: '0.15rem',
                  display: 'flex',
                }}
                title="Copy Course ID"
              >
                {copyIdFeedback ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>

            {/* Preparation Indicator: Library Navigation Synchronization Status */}
            <div
              id="library-nav-sync-badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '0.5rem',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: '0.73rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
              title="Course metadata is configured and prepared to map directly into the Library sub-navigation structure"
            >
              <CheckCircle2 size={13} color="#10b981" />
              <span>Library Sync Prepared</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. MAIN PARAMETER SELECTION: Category, Sub-Category, Path, Batch & Slot */}
          {/* ========================================================================= */}
          <div
            id="course-creator-param-row"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '0.55rem',
              alignItems: 'center',
              paddingBottom: '0.25rem',
            }}
          >
            {/* 1. Category Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <label
                htmlFor="course-param-category"
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Category
              </label>
              <select
                id="course-param-category"
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '0.55rem',
                  padding: '0.38rem 0.6rem',
                  color: 'var(--text-main)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {COURSE_TAXONOMY_CATEGORIES.map((cat) => (
                  <option
                    key={cat.id}
                    value={cat.id}
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                  >
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Sub-Category Dropdown (Dynamically populated from Category) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <label
                htmlFor="course-param-subcategory"
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Sub-Category
              </label>
              <select
                id="course-param-subcategory"
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '0.55rem',
                  padding: '0.38rem 0.6rem',
                  color: 'var(--text-main)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {activeSubCategories.map((sub) => (
                  <option
                    key={sub.id}
                    value={sub.id}
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                  >
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Delivery Path Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <label
                htmlFor="course-param-path"
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Path (Delivery Format)
              </label>
              <select
                id="course-param-path"
                value={selectedPath}
                onChange={(e) => setSelectedPath(e.target.value)}
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '0.55rem',
                  padding: '0.38rem 0.6rem',
                  color: 'var(--text-main)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {COURSE_DELIVERY_PATHS.map((path) => (
                  <option
                    key={path.id}
                    value={path.id}
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                  >
                    {path.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Batch & Slot Selectors */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <label
                htmlFor="course-param-batch"
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Batch & Slot
              </label>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <select
                  id="course-param-batch"
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  disabled={loading}
                  style={{
                    flex: '1 1 50%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '0.55rem',
                    padding: '0.38rem 0.45rem',
                    color: 'var(--text-main)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                  title="Select Batch Cohort"
                >
                  {COURSE_BATCH_OPTIONS.map((batch) => (
                    <option
                      key={batch}
                      value={batch}
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                    >
                      {batch}
                    </option>
                  ))}
                </select>

                <select
                  id="course-param-slot"
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  disabled={loading}
                  style={{
                    flex: '1 1 50%',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '0.55rem',
                    padding: '0.38rem 0.45rem',
                    color: 'var(--text-main)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                  title="Select Timing Slot"
                >
                  {COURSE_SLOT_OPTIONS.map((slot) => (
                    <option
                      key={slot}
                      value={slot}
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}
                    >
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 3. PROMPT & CREATION QUERY INPUT LINE                          */}
          {/* ============================================================== */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              background: 'var(--input-bg)',
              border: isListening
                ? '1.5px solid rgba(239, 68, 68, 0.7)'
                : '1px solid var(--border-medium)',
              borderRadius: '0.875rem',
              padding: '0.45rem 0.75rem',
              boxShadow: isListening ? '0 0 16px rgba(239, 68, 68, 0.25)' : 'inset 0 1px 3px rgba(0,0,0,0.2)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div
              style={{
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '0.25rem',
                paddingRight: '0.65rem',
              }}
            >
              <BookOpen size={18} />
            </div>

            <input
              id="ai-search-input"
              type="text"
              value={query}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? 'Listening to your voice... Speak now'
                  : placeholder
              }
              disabled={loading}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-main)',
                fontSize: '0.94rem',
                fontFamily: 'inherit',
                padding: '0.35rem 0',
              }}
            />

            {/* Clear Query button */}
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-subtle)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  marginRight: '0.35rem',
                }}
                title="Clear prompt"
              >
                <X size={15} />
              </button>
            )}

            {/* Voice Input Button */}
            {isRecognitionSupported && (
              <button
                type="button"
                onClick={handleVoiceInputClick}
                disabled={loading}
                className="action-chip"
                style={{
                  background: isListening ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                  border: isListening
                    ? '1px solid rgba(239, 68, 68, 0.6)'
                    : '1px solid var(--border-subtle)',
                  borderRadius: '0.6rem',
                  color: isListening ? '#ef4444' : 'var(--text-main)',
                  padding: '0.42rem 0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '0.45rem',
                  transition: 'all 0.2s ease',
                  boxShadow: isListening ? '0 0 10px rgba(239, 68, 68, 0.3)' : 'none',
                }}
                title={isListening ? 'Stop listening' : 'Speak your prompt'}
              >
                {isListening ? (
                  <MicOff size={15} className="animate-pulse" />
                ) : (
                  <Mic size={15} />
                )}
              </button>
            )}

            {/* Submit Prompt Button */}
            <button
              id="ai-submit-button"
              type="submit"
              disabled={!query.trim() || loading}
              className="action-chip"
              style={{
                background:
                  !query.trim() || loading
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'var(--accent-gradient)',
                border: 'none',
                borderRadius: '0.65rem',
                color: !query.trim() || loading ? 'var(--text-subtle)' : '#ffffff',
                padding: '0.45rem 1.15rem',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: !query.trim() || loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow:
                  !query.trim() || loading ? 'none' : '0 4px 16px var(--accent-glow)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Create</span>
                </>
              )}
            </button>
          </div>

          {/* ============================================================== */}
          {/* 4. SUB-BAR: ATTACHMENTS, BULK PLANNER & NAVIGATION MAPPING    */}
          {/* ============================================================== */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              color: 'var(--text-subtle)',
              paddingTop: '0.1rem',
              flexWrap: 'wrap',
              gap: '0.45rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              {/* Document Attachment Button */}
              <button
                type="button"
                onClick={() => setShowUploadZone(!showUploadZone)}
                style={{
                  background: showUploadZone ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: showUploadZone ? '1px solid rgba(99, 102, 241, 0.35)' : 'none',
                  color: showUploadZone ? 'var(--accent-primary)' : 'var(--text-muted)',
                  borderRadius: '0.45rem',
                  padding: '0.25rem 0.6rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  transition: 'all 0.15s ease',
                }}
              >
                <Paperclip size={13} />
                <span>
                  {attachedDocuments.length > 0
                    ? `${attachedDocuments.length} ${
                        attachedDocuments.length === 1 ? 'Document' : 'Documents'
                      } Attached`
                    : 'Attach Syllabus / Reference Documents'}
                </span>
              </button>

              {/* Bulk Task Planner Trigger Link / Toggle */}
              {onToggleBulkPlanner && (
                <button
                  id="bulk-task-planner-toggle-btn"
                  type="button"
                  onClick={() => onToggleBulkPlanner(!isBulkPlannerActive)}
                  style={{
                    background: isBulkPlannerActive
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.25) 100%)'
                      : 'transparent',
                    border: isBulkPlannerActive
                      ? '1px solid rgba(165, 180, 252, 0.45)'
                      : '1px solid transparent',
                    color: isBulkPlannerActive ? '#c7d2fe' : 'var(--text-muted)',
                    borderRadius: '0.45rem',
                    padding: '0.25rem 0.6rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.78rem',
                    fontWeight: isBulkPlannerActive ? 700 : 500,
                    boxShadow: isBulkPlannerActive
                      ? '0 0 10px rgba(99, 102, 241, 0.25)'
                      : 'none',
                    transition: 'all 0.15s ease',
                  }}
                  title="Bulk Task Planner: Automatically decompose and sequentially execute comprehensive multi-book courses"
                >
                  <Layers size={13} color={isBulkPlannerActive ? '#a5b4fc' : undefined} />
                  <span>Bulk Task Planner</span>
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      padding: '0.05rem 0.35rem',
                      borderRadius: '9999px',
                      background: isBulkPlannerActive
                        ? 'var(--accent-gradient)'
                        : 'rgba(255, 255, 255, 0.08)',
                      color: isBulkPlannerActive ? '#ffffff' : 'var(--text-subtle)',
                      border: isBulkPlannerActive
                        ? 'none'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    {isBulkPlannerActive ? 'Active' : 'Autonomous'}
                  </span>
                </button>
              )}
            </div>

            {/* Real-time Sub-Navigation Mapping Tag */}
            <div
              id="sub-nav-mapping-pill"
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '0.2rem 0.55rem',
                borderRadius: '0.4rem',
                border: '1px solid var(--border-subtle)',
                whiteSpace: 'nowrap',
              }}
              title="Target Library Sub-Navigation Hierarchy preview"
            >
              <Layers size={11} color="var(--accent-primary)" />
              <span>
                Nav Path:{' '}
                <strong style={{ color: 'var(--text-main)' }}>{activeCategoryObj.code}</strong> /{' '}
                <strong style={{ color: '#38bdf8' }}>{activeSubCategoryObj.code}</strong> •{' '}
                <span>{activePathObj.name.split(' ')[0]}</span> ({selectedBatch})
              </span>
            </div>
          </div>

          {/* Expandable Document Upload Dropzone */}
          {showUploadZone && (
            <div style={{ marginTop: '0.35rem' }}>
              <DocumentUploadZone
                documents={attachedDocuments}
                onDocumentsChange={onDocumentsChange}
                compact={true}
              />
            </div>
          )}

          {/* Voice recognition error notification */}
          {speechError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '0.5rem',
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                color: 'var(--error)',
              }}
            >
              <span>{speechError}</span>
              <button
                type="button"
                onClick={() => setSpeechError(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}
              >
                <X size={13} />
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
