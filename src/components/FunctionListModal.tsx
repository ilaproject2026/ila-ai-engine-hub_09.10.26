import { useState, useMemo } from 'react';
import {
  X,
  Search,
  ArrowRight,
  Check,
  Grid,
} from 'lucide-react';
import {
  AI_PRODUCTS,
  type AIProductType,
  type AIProductConfig,
} from '../services/aiHubConfig';
import { renderAIProductIcon } from './AIHubDropdown';

interface FunctionListModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProductId: AIProductType;
  onSelectProduct: (productId: AIProductType) => void;
}

export default function FunctionListModal({
  isOpen,
  onClose,
  activeProductId,
  onSelectProduct,
}: FunctionListModalProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return AI_PRODUCTS;
    const term = searchQuery.toLowerCase().trim();
    return AI_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.shortName.toLowerCase().includes(term) ||
        p.tagline.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    );
  }, [searchQuery]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, AIProductConfig[]> = {};
    filteredProducts.forEach((p) => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }, [filteredProducts]);

  if (!isOpen) return null;

  return (
    <div
      id="function-list-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 8, 16, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        id="function-list-modal-container"
        style={{
          width: '100%',
          maxWidth: '1060px',
          maxHeight: '90vh',
          background: 'var(--modal-bg)',
          border: '1px solid var(--modal-border)',
          borderRadius: '1.25rem',
          boxShadow: 'var(--modal-shadow)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--modal-header-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '0.65rem',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 0 16px var(--accent-glow)',
              }}
            >
              <Grid size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  ILA AI Hub — Function List
                </h2>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    background: 'rgba(99, 102, 241, 0.25)',
                    border: '1px solid rgba(99, 102, 241, 0.45)',
                    color: '#c7d2fe',
                  }}
                >
                  16 AI Modules
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', margin: '0.2rem 0 0 0' }}>
                Comprehensive suite of specialized AI engines for education, visa audit, corporate operations, and global growth.
              </p>
            </div>
          </div>

          <button
            id="close-function-list-btn"
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '0.5rem',
              color: 'var(--text-main)',
              cursor: 'pointer',
              padding: '0.45rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            title="Close Function List"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              background: 'var(--input-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '0.65rem',
              padding: '0.45rem 0.85rem',
            }}
          >
            <Search size={15} style={{ color: 'var(--text-subtle)', marginRight: '0.5rem' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all 16 AI functions by keyword, name, or capability..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-main)',
                fontSize: '0.86rem',
              }}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-subtle)',
                  cursor: 'pointer',
                  padding: '0.2rem',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Categorized Function Grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {Object.keys(groupedProducts).length === 0 ? (
            <div
              style={{
                padding: '3rem 1rem',
                textAlign: 'center',
                color: 'var(--text-subtle)',
                fontSize: '0.9rem',
              }}
            >
              No AI functions matched "{searchQuery}"
            </div>
          ) : (
            Object.entries(groupedProducts).map(([category, products]) => (
              <div key={category}>
                {/* Category Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      color: 'var(--accent-primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {category}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: '1px',
                      background: 'var(--border-subtle)',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.68rem',
                      color: 'var(--text-subtle)',
                      fontWeight: 600,
                    }}
                  >
                    {products.length} {products.length === 1 ? 'Engine' : 'Engines'}
                  </span>
                </div>

                {/* Cards Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
                    gap: '0.85rem',
                  }}
                >
                  {products.map((product) => {
                    const isSelected = product.id === activeProductId;

                    return (
                      <div
                        key={product.id}
                        id={`function-card-${product.id}`}
                        onClick={() => {
                          onSelectProduct(product.id);
                          onClose();
                        }}
                        style={{
                          background: isSelected
                            ? 'var(--dropdown-item-selected)'
                            : 'var(--bg-card)',
                          border: isSelected
                            ? '1px solid var(--dropdown-item-selected-border)'
                            : '1px solid var(--border-subtle)',
                          borderRadius: '0.85rem',
                          padding: '1rem',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                          boxShadow: isSelected
                            ? '0 8px 25px rgba(99, 102, 241, 0.25)'
                            : 'none',
                          transition: 'all 0.18s ease',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'var(--dropdown-item-hover)';
                            e.currentTarget.style.borderColor = 'var(--border-medium)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = 'var(--bg-card)';
                            e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        {/* Card Top */}
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '0.5rem',
                            }}
                          >
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '0.55rem',
                                background: product.gradient,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                boxShadow: `0 0 12px ${product.accentColor}55`,
                              }}
                            >
                              {renderAIProductIcon(product.icon, 16, '#ffffff')}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span
                                style={{
                                  fontSize: '0.62rem',
                                  fontWeight: 700,
                                  padding: '0.12rem 0.4rem',
                                  borderRadius: '4px',
                                  background: `${product.accentColor}20`,
                                  color: product.accentColor,
                                  border: `1px solid ${product.accentColor}40`,
                                }}
                              >
                                {product.badge}
                              </span>
                              {isSelected && (
                                <span
                                  style={{
                                    fontSize: '0.62rem',
                                    fontWeight: 700,
                                    padding: '0.12rem 0.4rem',
                                    borderRadius: '4px',
                                    background: 'var(--accent-primary)',
                                    color: '#ffffff',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.2rem',
                                  }}
                                >
                                  <Check size={10} strokeWidth={3} /> Active
                                </span>
                              )}
                            </div>
                          </div>

                          <h3
                            style={{
                              fontSize: '0.94rem',
                              fontWeight: 700,
                              color: 'var(--text-main)',
                              margin: '0 0 0.25rem 0',
                            }}
                          >
                            {product.name}
                          </h3>
                          <p
                            style={{
                              fontSize: '0.74rem',
                              color: 'var(--text-subtle)',
                              margin: 0,
                              lineHeight: 1.45,
                            }}
                          >
                            {product.description}
                          </p>
                        </div>

                        {/* Card Bottom / Launch Button */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderTop: '1px solid var(--border-subtle)',
                            paddingTop: '0.6rem',
                            marginTop: '0.2rem',
                          }}
                        >
                          <span style={{ fontSize: '0.68rem', color: product.accentColor, fontWeight: 600 }}>
                            {product.parameters.length} Configurable Parameters
                          </span>
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              color: isSelected ? 'var(--accent-primary)' : 'var(--text-main)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            Launch Engine <ArrowRight size={12} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--modal-header-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.74rem',
            color: 'var(--text-subtle)',
          }}
        >
          <span>ILA AI Hub v6 • 16 Modular AI Engines</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--btn-default-bg)',
              border: '1px solid var(--btn-default-border)',
              borderRadius: '0.45rem',
              padding: '0.35rem 0.85rem',
              color: 'var(--btn-default-color)',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
