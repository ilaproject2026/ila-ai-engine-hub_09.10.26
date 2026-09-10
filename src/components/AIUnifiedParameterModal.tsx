import { useState, useMemo, useEffect, useRef, type FormEvent } from 'react';
import {
  X,
  Search,
  Plus,
  Sliders,
  Check,
  Trash2,
  Edit2,
  Download,
  RotateCcw,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  SlidersHorizontal,
  Mic,
  MicOff,
  AlertCircle,
} from 'lucide-react';
import {
  AI_PRODUCTS,
  type AIProductType,
  getAIProductConfig,
} from '../services/aiHubConfig';
import {
  getAllDynamicParameters,
  toggleParameterActive,
  deleteDynamicParameter,
  resetParametersToDefault,
  saveDynamicParameter,
  type DynamicAIParameter,
} from '../services/parameterService';

interface AIUnifiedParameterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProductId: AIProductType;
  initialTab?: 'list' | 'input';
  onSelectProduct?: (productId: AIProductType) => void;
  onParameterSaved?: (param: DynamicAIParameter) => void;
}

const TEMPLATE_PRESETS = [
  {
    name: 'Executive Bullet Summary',
    category: 'Global Core',
    instruction: 'Structure all key takeaways, risk assessments, and recommendations strictly into clear bullet points with bold metrics.',
    type: 'boolean' as const,
    defaultValue: 'true',
  },
  {
    name: 'Strict Consular Compliance',
    category: 'Legal & Mobility',
    instruction: 'Apply zero-tolerance validation on missing translations, apostilles, and financial statement clauses.',
    type: 'boolean' as const,
    defaultValue: 'true',
  },
  {
    name: 'Minimum Margin Guardrail (25%)',
    category: 'Market & Pricing',
    instruction: 'Ensure all computed seasonal and package tariffs preserve a minimum gross profit margin of 25%.',
    type: 'numeric' as const,
    defaultValue: '25',
  },
  {
    name: 'Objection Handling Battlecards',
    category: 'Sales & Marketing',
    instruction: 'Generate real-time competitor comparison scripts and pricing objection responses for client negotiations.',
    type: 'boolean' as const,
    defaultValue: 'true',
  },
  {
    name: 'CEFR B2 Level Rigor',
    category: 'Education & Learning',
    instruction: 'Calibrate all vocabulary, grammar explanations, and dialogues strictly to CEFR B2 professional proficiency standards.',
    type: 'select' as const,
    defaultValue: 'B2_level',
  },
];

export default function AIUnifiedParameterModal({
  isOpen,
  onClose,
  activeProductId,
  initialTab = 'list',
  onParameterSaved,
}: AIUnifiedParameterModalProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'input'>(initialTab);
  const [selectedToolFilter, setSelectedToolFilter] = useState<string>(activeProductId || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingParamId, setEditingParamId] = useState<string | null>(null);
  const [editInstruction, setEditInstruction] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Input Form State
  const [targetProduct, setTargetProduct] = useState<AIProductType | 'global'>(activeProductId);
  const [paramName, setParamName] = useState<string>('');
  const [paramCategory, setParamCategory] = useState<string>('Custom Rule');
  const [paramInstruction, setParamInstruction] = useState<string>('');
  const [valueType, setValueType] = useState<'text' | 'select' | 'boolean' | 'numeric' | 'voice_instruction'>('text');
  const [defaultValue, setDefaultValue] = useState<string>('Enabled');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Setup Web Speech Recognition
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setParamInstruction((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSelectedToolFilter(activeProductId || 'all');
      setTargetProduct(activeProductId || 'global');
      setSuccessMessage(null);
      setError(null);
      setEditingParamId(null);
    }
  }, [isOpen, activeProductId, initialTab]);

  // Load parameters from service
  const parameters = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    refreshKey;
    return getAllDynamicParameters();
  }, [refreshKey]);

  // Filter parameters by tool scope and search query
  const filteredParameters = useMemo(() => {
    return parameters.filter((p) => {
      if (selectedToolFilter !== 'all') {
        if (p.productId !== selectedToolFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesInstruction = p.instruction.toLowerCase().includes(q);
        const matchesCategory = p.category.toLowerCase().includes(q);
        if (!matchesName && !matchesInstruction && !matchesCategory) return false;
      }
      return true;
    });
  }, [parameters, selectedToolFilter, searchQuery]);

  const handleToggleActive = (id: string) => {
    toggleParameterActive(id);
    setRefreshKey((k) => k + 1);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this parameter rule?')) {
      deleteDynamicParameter(id);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleStartEdit = (param: DynamicAIParameter) => {
    setEditingParamId(param.id);
    setEditInstruction(param.instruction);
  };

  const handleSaveEdit = (param: DynamicAIParameter) => {
    saveDynamicParameter({
      ...param,
      instruction: editInstruction.trim() || param.instruction,
    });
    setEditingParamId(null);
    setRefreshKey((k) => k + 1);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all parameters to factory defaults? Custom modifications will be restored.')) {
      resetParametersToDefault();
      setRefreshKey((k) => k + 1);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(parameters, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ila_ai_parameters_config_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      setError('Voice recognition is not supported in this browser. Please type your parameter instructions.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
      } catch (err) {
        console.error('Speech recognition start error:', err);
        setIsListening(false);
      }
    }
  };

  const handleApplyPreset = (preset: typeof TEMPLATE_PRESETS[0]) => {
    setParamName(preset.name);
    setParamCategory(preset.category);
    setParamInstruction(preset.instruction);
    setValueType(preset.type);
    setDefaultValue(preset.defaultValue);
  };

  const handleSaveNewParam = (e: FormEvent) => {
    e.preventDefault();
    if (!paramName.trim()) {
      setError('Please provide a parameter name.');
      return;
    }
    if (!paramInstruction.trim()) {
      setError('Please provide prompt instructions or constraints for this parameter.');
      return;
    }

    const key = paramName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const newParam: DynamicAIParameter = {
      id: `param_${Date.now()}`,
      productId: targetProduct,
      name: paramName.trim(),
      key,
      category: paramCategory.trim() || 'Custom Rule',
      instruction: paramInstruction.trim(),
      valueType,
      defaultValue: defaultValue.trim() || 'true',
      currentValue: defaultValue.trim() || 'true',
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      source: isListening ? 'voice_input' : 'custom',
    };

    saveDynamicParameter(newParam);
    if (onParameterSaved) {
      onParameterSaved(newParam);
    }

    setRefreshKey((k) => k + 1);
    setSuccessMessage(`Parameter "${newParam.name}" successfully created and active!`);
    setParamName('');
    setParamInstruction('');

    setTimeout(() => {
      setActiveTab('list');
      setSuccessMessage(null);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div
      id="unified-parameter-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 7, 13, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
      onClick={onClose}
    >
      <div
        id="unified-parameter-modal-container"
        style={{
          width: '100%',
          maxWidth: '1050px',
          maxHeight: '90vh',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px var(--accent-glow)',
          overflow: 'hidden',
          animation: 'fade-in 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.1rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
              }}
            >
              <Sliders size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  AI Parameters & Rules Hub
                </h2>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.55rem',
                    borderRadius: '9999px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    color: '#a5b4fc',
                  }}
                >
                  {parameters.filter((p) => p.isActive).length} Active Rules
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.2rem' }}>
                Configure prompt instructions, business guardrails, CEFR proficiency levels, and voice constraints across all engines.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Tab Switcher */}
            <div
              style={{
                display: 'inline-flex',
                padding: '0.2rem',
                borderRadius: '0.6rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                gap: '0.25rem',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '0.45rem',
                  border: 'none',
                  background: activeTab === 'list' ? 'var(--accent-gradient)' : 'transparent',
                  color: activeTab === 'list' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <Sliders size={13} />
                <span>Parameter List</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('input')}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '0.45rem',
                  border: 'none',
                  background: activeTab === 'input' ? 'var(--accent-gradient)' : 'transparent',
                  color: activeTab === 'input' ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <Plus size={13} />
                <span>Input / Voice Setup</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '0.5rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.45rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'list' ? (
            /* TAB 1: PARAMETER LIST & RULES */
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Search & Action Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                {/* Search Bar */}
                <div
                  style={{
                    position: 'relative',
                    flex: '1 1 280px',
                    maxWidth: '400px',
                  }}
                >
                  <Search
                    size={14}
                    style={{
                      position: 'absolute',
                      left: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                    }}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search parameter names, instructions..."
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.85rem 0.5rem 2.25rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '0.6rem',
                      color: 'var(--text-main)',
                      fontSize: '0.82rem',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Scope Filter Dropdown & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <select
                    value={selectedToolFilter}
                    onChange={(e) => setSelectedToolFilter(e.target.value)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '0.6rem',
                      color: 'var(--text-main)',
                      fontSize: '0.8rem',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="all">All Engine Scopes</option>
                    <option value="global">🌐 Global (All Tools)</option>
                    {AI_PRODUCTS.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setActiveTab('input')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.5rem 0.85rem',
                      borderRadius: '0.6rem',
                      background: 'var(--accent-gradient)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={14} />
                    <span>Add Parameter</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportJSON}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.6rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                    title="Export all parameters as JSON"
                  >
                    <Download size={13} />
                    <span>Export</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.6rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#f87171',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                    title="Reset to factory preset parameters"
                  >
                    <RotateCcw size={13} />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Parameter Rules Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredParameters.length === 0 ? (
                  <div
                    style={{
                      padding: '3rem 2rem',
                      textAlign: 'center',
                      background: 'var(--bg-card)',
                      borderRadius: '0.85rem',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <SlidersHorizontal size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto' }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                      No parameters matched your filter
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      Add a custom parameter instruction or reset filter criteria.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('input')}
                      style={{
                        padding: '0.45rem 1rem',
                        borderRadius: '0.55rem',
                        background: 'var(--accent-gradient)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      + Create Parameter Rule
                    </button>
                  </div>
                ) : (
                  filteredParameters.map((param) => {
                    const isEditing = editingParamId === param.id;
                    const prodConfig = param.productId === 'global' ? null : getAIProductConfig(param.productId as AIProductType);

                    return (
                      <div
                        key={param.id}
                        style={{
                          background: param.isActive ? 'var(--bg-card)' : 'rgba(255, 255, 255, 0.02)',
                          border: param.isActive ? '1px solid var(--border-subtle)' : '1px dashed var(--border-subtle)',
                          borderRadius: '0.85rem',
                          padding: '1rem 1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.6rem',
                          opacity: param.isActive ? 1 : 0.65,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: '0.88rem',
                                fontWeight: 700,
                                color: param.isActive ? 'var(--text-main)' : 'var(--text-muted)',
                              }}
                            >
                              {param.name}
                            </span>

                            {/* Scope Badge */}
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '0.15rem 0.5rem',
                                borderRadius: '9999px',
                                background: param.productId === 'global' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                                border: param.productId === 'global' ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid rgba(56, 189, 248, 0.35)',
                                color: param.productId === 'global' ? '#a5b4fc' : '#7dd3fc',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              {param.productId === 'global' ? '🌐 Global' : prodConfig?.shortName || param.productId}
                            </span>

                            {/* Category Badge */}
                            <span
                              style={{
                                fontSize: '0.68rem',
                                color: 'var(--text-subtle)',
                                background: 'rgba(255, 255, 255, 0.04)',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                              }}
                            >
                              {param.category}
                            </span>
                          </div>

                          {/* Controls: Active Toggle, Edit, Delete */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleActive(param.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                color: param.isActive ? '#10b981' : 'var(--text-muted)',
                              }}
                              title={param.isActive ? 'Active (Click to disable)' : 'Disabled (Click to activate)'}
                            >
                              {param.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                            </button>

                            {!isEditing && (
                              <button
                                type="button"
                                onClick={() => handleStartEdit(param)}
                                style={{
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid var(--border-subtle)',
                                  borderRadius: '0.45rem',
                                  padding: '0.35rem',
                                  color: 'var(--text-muted)',
                                  cursor: 'pointer',
                                }}
                                title="Edit prompt instruction"
                              >
                                <Edit2 size={13} />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDelete(param.id)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '0.45rem',
                                padding: '0.35rem',
                                color: '#f87171',
                                cursor: 'pointer',
                              }}
                              title="Delete rule"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Instruction Content / Editor */}
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.35rem' }}>
                            <textarea
                              value={editInstruction}
                              onChange={(e) => setEditInstruction(e.target.value)}
                              rows={3}
                              style={{
                                width: '100%',
                                padding: '0.6rem 0.8rem',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-focus)',
                                borderRadius: '0.55rem',
                                color: 'var(--text-main)',
                                fontSize: '0.8rem',
                                fontFamily: 'inherit',
                                outline: 'none',
                              }}
                            />
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => setEditingParamId(null)}
                                style={{
                                  padding: '0.35rem 0.75rem',
                                  borderRadius: '0.45rem',
                                  background: 'transparent',
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--text-muted)',
                                  fontSize: '0.76rem',
                                  cursor: 'pointer',
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(param)}
                                style={{
                                  padding: '0.35rem 0.85rem',
                                  borderRadius: '0.45rem',
                                  background: 'var(--accent-gradient)',
                                  border: 'none',
                                  color: '#ffffff',
                                  fontSize: '0.76rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: '0.82rem',
                              color: 'var(--text-main)',
                              lineHeight: '1.5',
                              background: 'rgba(255, 255, 255, 0.03)',
                              padding: '0.55rem 0.85rem',
                              borderRadius: '0.5rem',
                              border: '1px solid rgba(255, 255, 255, 0.04)',
                            }}
                          >
                            {param.instruction}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: INPUT PARAMETER & VOICE SETUP */
            <form
              onSubmit={handleSaveNewParam}
              style={{
                padding: '1.25rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.2rem',
                maxWidth: '850px',
                margin: '0 auto',
                width: '100%',
              }}
            >
              {successMessage && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.6rem',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    color: '#34d399',
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Check size={16} />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.6rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#f87171',
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Preset Templates Quick Row */}
              <div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--text-subtle)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.5rem',
                  }}
                >
                  Quick Template Presets
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {TEMPLATE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '0.55rem',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-main)',
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Sparkles size={11} color="var(--accent-primary)" />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1rem',
                }}
              >
                {/* 1. Target Engine Scope */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Target AI Engine Scope
                  </label>
                  <select
                    value={targetProduct}
                    onChange={(e) => setTargetProduct(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '0.6rem',
                      color: 'var(--text-main)',
                      fontSize: '0.82rem',
                      outline: 'none',
                    }}
                  >
                    <option value="global">🌐 Global (Applied to All 16 Modules)</option>
                    {AI_PRODUCTS.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Parameter Name */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Parameter Name *
                  </label>
                  <input
                    type="text"
                    value={paramName}
                    onChange={(e) => setParamName(e.target.value)}
                    placeholder="e.g. Strict Consular Compliance"
                    required
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '0.6rem',
                      color: 'var(--text-main)',
                      fontSize: '0.82rem',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* 3. Category */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Category
                  </label>
                  <input
                    type="text"
                    value={paramCategory}
                    onChange={(e) => setParamCategory(e.target.value)}
                    placeholder="e.g. Legal & Compliance, Sales"
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '0.6rem',
                      color: 'var(--text-main)',
                      fontSize: '0.82rem',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* 4. Value / Type */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      marginBottom: '0.4rem',
                    }}
                  >
                    Rule Type
                  </label>
                  <select
                    value={valueType}
                    onChange={(e) => setValueType(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '0.6rem',
                      color: 'var(--text-main)',
                      fontSize: '0.82rem',
                      outline: 'none',
                    }}
                  >
                    <option value="text">Text Directive</option>
                    <option value="boolean">Boolean Toggle (Enabled/Disabled)</option>
                    <option value="numeric">Numeric Threshold</option>
                    <option value="select">Dropdown Choice</option>
                  </select>
                </div>
              </div>

              {/* 5. Prompt Instruction / Voice Input */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <label
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                    }}
                  >
                    Prompt Instructions & Operational Constraints *
                  </label>

                  {speechSupported && (
                    <button
                      type="button"
                      onClick={toggleVoiceRecording}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '0.45rem',
                        background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                        border: isListening ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(99, 102, 241, 0.35)',
                        color: isListening ? '#f87171' : '#a5b4fc',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {isListening ? <MicOff size={13} className="animate-pulse" /> : <Mic size={13} />}
                      <span>{isListening ? 'Stop Recording' : 'Dictate with Voice'}</span>
                    </button>
                  )}
                </div>

                <textarea
                  value={paramInstruction}
                  onChange={(e) => setParamInstruction(e.target.value)}
                  placeholder="Define exact AI prompt directive or constraint. (e.g., 'Ensure all generated courses include step-by-step interactive quiz questions and real-world executive lab simulations.')"
                  rows={4}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.95rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '0.65rem',
                    color: 'var(--text-main)',
                    fontSize: '0.84rem',
                    lineHeight: '1.5',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '0.6rem',
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    padding: '0.6rem 1.5rem',
                    borderRadius: '0.6rem',
                    background: 'var(--accent-gradient)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px var(--accent-glow)',
                  }}
                >
                  Save & Activate Parameter
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
