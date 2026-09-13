import { useState, useMemo } from 'react';
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
import { renderAIProductIcon } from './AIHubDropdown';

interface AIParameterListModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProductId: AIProductType;
  onOpenAddParameter: () => void;
  onSelectProduct?: (productId: AIProductType) => void;
}

export default function AIParameterListModal({
  isOpen,
  onClose,
  activeProductId,
  onOpenAddParameter,
  onSelectProduct,
}: AIParameterListModalProps) {
  const [selectedToolFilter, setSelectedToolFilter] = useState<string>(activeProductId || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingParamId, setEditingParamId] = useState<string | null>(null);
  const [editInstruction, setEditInstruction] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Load parameters from service
  const parameters = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    refreshKey; // triggers recalculation
    return getAllDynamicParameters();
  }, [refreshKey]);

  // Filter parameters by tool scope and search query
  const filteredParameters = useMemo(() => {
    return parameters.filter((p) => {
      // 1. Tool filter
      if (selectedToolFilter !== 'all') {
        if (p.productId !== selectedToolFilter) return false;
      }

      // 2. Search query filter
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
    if (window.confirm('Reset all parameters to factory defaults? Custom modifications will be restored to original settings.')) {
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

  if (!isOpen) return null;

  return (
    <div
      id="parameter-list-modal-backdrop"
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
        id="parameter-list-modal-container"
        style={{
          width: '100%',
          maxWidth: '1000px',
          maxHeight: '90vh',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '1.25rem',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.15)',
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
            background: 'var(--modal-header-bg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(168, 85, 247, 0.4)',
              }}
            >
              <Sliders size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: 'var(--text-main)',
                    margin: 0,
                  }}
                >
                  AI Parameter & Rule Directory
                </h2>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    background: 'rgba(168, 85, 247, 0.2)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    color: '#d8b4fe',
                  }}
                >
                  {parameters.filter((p) => p.isActive).length} Active Rules
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', margin: '0.2rem 0 0 0' }}>
                Review, configure, activate, or modify live system instructions without touching source code
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAddParameter();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '0.55rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(99, 102, 241, 0.3)',
              }}
            >
              <Plus size={13} />
              <span>Add New Parameter</span>
            </button>

            <button
              type="button"
              onClick={handleExportJSON}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.75rem',
                borderRadius: '0.55rem',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Export Parameter Configuration as JSON"
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
                padding: '0.45rem 0.75rem',
                borderRadius: '0.55rem',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Restore Factory Default Parameters"
            >
              <RotateCcw size={12} />
              <span>Defaults</span>
            </button>

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
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(10, 14, 24, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Tool Scope Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', fontWeight: 600 }}>Filter by Engine:</span>
            <select
              value={selectedToolFilter}
              onChange={(e) => setSelectedToolFilter(e.target.value)}
              style={{
                padding: '0.38rem 1.5rem 0.38rem 0.75rem',
                borderRadius: '0.55rem',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.78rem',
                fontWeight: 600,
                outline: 'none',
              }}
            >
              <option value="all" style={{ background: '#0f172a' }}>🌐 All Scopes ({parameters.length})</option>
              <option value="global" style={{ background: '#0f172a' }}>⚡ Global Operational Rules</option>
              {AI_PRODUCTS.map((prod) => (
                <option key={prod.id} value={prod.id} style={{ background: '#0f172a' }}>
                  {prod.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '0.55rem',
              padding: '0.32rem 0.75rem',
              minWidth: '260px',
            }}
          >
            <Search size={13} color="var(--text-subtle)" />
            <input
              type="text"
              placeholder="Search parameters, keys, rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-main)',
                fontSize: '0.76rem',
                width: '100%',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', padding: 0 }}
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Parameter List Grid / Rows */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {filteredParameters.length === 0 ? (
            <div
              style={{
                padding: '3rem 1rem',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed var(--border-subtle)',
                borderRadius: '0.85rem',
                color: 'var(--text-subtle)',
              }}
            >
              <SlidersHorizontal size={32} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
              <p style={{ margin: 0, fontSize: '0.88rem' }}>No AI parameters found for the selected filter.</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddParameter();
                }}
                style={{
                  marginTop: '0.75rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.35)',
                  color: '#a5b4fc',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Plus size={12} />
                <span>Create New Parameter</span>
              </button>
            </div>
          ) : (
            filteredParameters.map((param) => {
              const isGlobal = param.productId === 'global';
              const prodConfig = isGlobal ? null : getAIProductConfig(param.productId as AIProductType);
              const isEditing = editingParamId === param.id;

              return (
                <div
                  key={param.id}
                  style={{
                    background: param.isActive ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.01)',
                    border: param.isActive ? '1px solid var(--border-subtle)' : '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '0.85rem',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    opacity: param.isActive ? 1 : 0.6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {/* Scope Badge */}
                      <span
                        onClick={() => {
                          if (onSelectProduct && !isGlobal) {
                            onSelectProduct(param.productId as AIProductType);
                            onClose();
                          }
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.15rem 0.55rem',
                          borderRadius: '9999px',
                          background: isGlobal ? 'rgba(99, 102, 241, 0.15)' : `${prodConfig?.accentColor}18`,
                          border: isGlobal ? '1px solid rgba(99, 102, 241, 0.4)' : `1px solid ${prodConfig?.accentColor}40`,
                          color: isGlobal ? '#a5b4fc' : prodConfig?.accentColor,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: !isGlobal && onSelectProduct ? 'pointer' : 'default',
                        }}
                        title={!isGlobal && onSelectProduct ? `Click to launch ${prodConfig?.name}` : undefined}
                      >
                        {isGlobal ? <Sparkles size={11} /> : renderAIProductIcon(prodConfig?.icon || 'Bot', 11)}
                        <span>{isGlobal ? 'Global Core' : prodConfig?.name}</span>
                      </span>

                      <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#ffffff' }}>
                        {param.name}
                      </span>

                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-subtle)',
                        }}
                      >
                        {param.category}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {/* Toggle Active Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(param.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '9999px',
                          background: param.isActive ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.06)',
                          border: param.isActive ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                          color: param.isActive ? '#6ee7b7' : 'var(--text-muted)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {param.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        <span>{param.isActive ? 'Active' : 'Disabled'}</span>
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => (isEditing ? handleSaveEdit(param) : handleStartEdit(param))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '0.45rem',
                          background: isEditing ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                          border: isEditing ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                          color: isEditing ? '#6ee7b7' : 'var(--text-muted)',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                        }}
                        title={isEditing ? 'Save Changes' : 'Edit Prompt Instruction'}
                      >
                        {isEditing ? <Check size={12} /> : <Edit2 size={12} />}
                        <span>{isEditing ? 'Done' : 'Edit'}</span>
                      </button>

                      {/* Delete Custom Parameter */}
                      {param.source !== 'default' && (
                        <button
                          type="button"
                          onClick={() => handleDelete(param.id)}
                          style={{
                            padding: '0.25rem 0.45rem',
                            borderRadius: '0.45rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#fca5a5',
                            cursor: 'pointer',
                          }}
                          title="Delete Custom Parameter"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Instruction / Constraint Content */}
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <textarea
                        rows={3}
                        value={editInstruction}
                        onChange={(e) => setEditInstruction(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.6rem',
                          borderRadius: '0.5rem',
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid var(--border-focus)',
                          color: 'var(--text-main)',
                          fontSize: '0.8rem',
                          lineHeight: '1.4',
                          outline: 'none',
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-subtle)',
                        background: 'rgba(0, 0, 0, 0.25)',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '0.5rem',
                        borderLeft: `2px solid ${isGlobal ? '#818cf8' : prodConfig?.accentColor || '#6366f1'}`,
                        lineHeight: '1.5',
                      }}
                    >
                      <strong style={{ color: 'var(--text-main)' }}>Rule Instruction: </strong>
                      {param.instruction}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.75rem 1.75rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'rgba(10, 14, 24, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.74rem',
            color: 'var(--text-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={13} color="#34d399" />
            <span>Active parameters automatically injected into Gemini prompt pipelines</span>
          </div>
          <div>
            <span>ILA AI Dynamic Parameter Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
