import { useState, useEffect, useRef, type FormEvent } from 'react';
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  Check,
  SlidersHorizontal,
  AlertCircle,
} from 'lucide-react';
import {
  AI_PRODUCTS,
  type AIProductType,
} from '../services/aiHubConfig';
import {
  saveDynamicParameter,
  type DynamicAIParameter,
} from '../services/parameterService';

interface AIParameterInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProductId: AIProductType;
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

export default function AIParameterInputModal({
  isOpen,
  onClose,
  activeProductId,
  onParameterSaved,
}: AIParameterInputModalProps) {
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

  // Sync default target product when opened
  useEffect(() => {
    if (isOpen) {
      setTargetProduct(activeProductId);
      setSuccessMessage(null);
      setError(null);
    }
  }, [isOpen, activeProductId]);

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

  const handleSave = (e: FormEvent) => {
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

    setSuccessMessage(`Parameter "${newParam.name}" successfully created and activated!`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div
      id="parameter-input-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 7, 13, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        id="parameter-input-modal-container"
        style={{
          width: '100%',
          maxWidth: '750px',
          maxHeight: '90vh',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '1.25rem',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)',
              }}
            >
              <SlidersHorizontal size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: '#ffffff',
                    margin: 0,
                  }}
                >
                  AI Parameter & Rule Input
                </h2>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    color: '#a5b4fc',
                  }}
                >
                  Text & Voice Support
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', margin: '0.2rem 0 0 0' }}>
                Define live system constraints, formatting rules, and behavioral parameters for any AI engine
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '0.55rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.45rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form
          onSubmit={handleSave}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {/* Quick Presets */}
          <div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              ⚡ Quick Operational Templates
            </div>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              {TEMPLATE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                >
                  <Sparkles size={12} color="#818cf8" />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target Tool Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.4rem' }}>
                Target AI Engine Scope
              </label>
              <select
                value={targetProduct}
                onChange={(e) => setTargetProduct(e.target.value as AIProductType | 'global')}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '0.6rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              >
                <option value="global" style={{ background: '#0f172a', color: '#ffffff' }}>
                  🌐 Global (All 16 Engines)
                </option>
                {AI_PRODUCTS.map((prod) => (
                  <option key={prod.id} value={prod.id} style={{ background: '#0f172a', color: '#ffffff' }}>
                    {prod.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.4rem' }}>
                Parameter Category
              </label>
              <input
                type="text"
                placeholder="e.g. Legal Strictness, Tone, Formatting"
                value={paramCategory}
                onChange={(e) => setParamCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '0.6rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Parameter Name & Value Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.4rem' }}>
                Parameter / Rule Name
              </label>
              <input
                type="text"
                placeholder="e.g. STAR Grading Rubric, Consular Strictness, Max Output Length"
                value={paramName}
                onChange={(e) => setParamName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '0.6rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.4rem' }}>
                Input Control Type
              </label>
              <select
                value={valueType}
                onChange={(e) => setValueType(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '0.6rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  outline: 'none',
                }}
              >
                <option value="text" style={{ background: '#0f172a' }}>Text Instruction</option>
                <option value="boolean" style={{ background: '#0f172a' }}>Boolean (Toggle)</option>
                <option value="select" style={{ background: '#0f172a' }}>Dropdown Select</option>
                <option value="numeric" style={{ background: '#0f172a' }}>Numeric Limit</option>
              </select>
            </div>
          </div>

          {/* Prompt Instruction & Live Voice Input */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>
                Operational Instruction & Constraint (Injected into System Prompt)
              </label>

              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '9999px',
                    background: isListening ? 'rgba(239, 68, 68, 0.25)' : 'rgba(99, 102, 241, 0.15)',
                    border: isListening ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid rgba(99, 102, 241, 0.4)',
                    color: isListening ? '#fca5a5' : '#a5b4fc',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    animation: isListening ? 'pulse 1.5s infinite' : 'none',
                  }}
                  title="Speak instructions using your microphone"
                >
                  {isListening ? <MicOff size={12} color="#ef4444" /> : <Mic size={12} color="#818cf8" />}
                  <span>{isListening ? 'Listening (Click to Stop)...' : 'Voice Dictate'}</span>
                </button>
              )}
            </div>

            <textarea
              rows={4}
              placeholder="e.g. Always evaluate candidate responses across STAR methodology, flagging gaps in quantifiable results. Never output conversational pleasantries."
              value={paramInstruction}
              onChange={(e) => setParamInstruction(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.6rem',
                background: 'rgba(255, 255, 255, 0.04)',
                border: isListening ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                lineHeight: '1.5',
                outline: 'none',
                resize: 'vertical',
              }}
              required
            />
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.6rem',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.6rem',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#6ee7b7',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Check size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.55rem 1.1rem',
                borderRadius: '0.55rem',
                background: 'rgba(255, 255, 255, 0.05)',
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
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 1.25rem',
                borderRadius: '0.55rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Check size={14} />
              <span>Save & Activate Parameter</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
