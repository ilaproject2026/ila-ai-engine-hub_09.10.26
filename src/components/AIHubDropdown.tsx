import { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  Search,
  Check,
  Sparkles,
  GraduationCap,
  ShieldAlert,
  UserCheck,
  Radio,
  Briefcase,
  FileText,
  SearchCheck,
  TrendingUp,
  Type,
  MessageSquareHeart,
  Bot,
  Layers,
  Newspaper,
  CreditCard,
  CloudSun,
  HelpCircle,
  Mic2,
  Handshake,
  Video,
  Users,
  LayoutDashboard,
  Cookie,
} from 'lucide-react';
import {
  AI_PRODUCTS,
  type AIProductType,
  type AIProductConfig,
  getAIProductConfig,
} from '../services/aiHubConfig';

export type HubModuleType = 'central_dashboard' | AIProductType;

export const DASHBOARD_DROPDOWN_CONFIG: AIProductConfig = {
  id: 'central_dashboard' as any,
  name: 'Central Dashboard',
  shortName: 'Central Dashboard',
  tagline: 'Global Platform Overview, Cross-Module Analytics & Output Oversight',
  description: 'Centralized activity oversight, cross-module output counters, marketing analytics & dynamic rule engine.',
  category: 'Overview' as any,
  icon: 'LayoutDashboard',
  badge: 'Hub Home',
  gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  accentColor: '#818cf8',
  placeholderPrompt: '',
  quickPrompts: [],
  parameters: [],
  systemPrompt: '',
};

interface AIHubDropdownProps {
  activeProductId: HubModuleType;
  onSelectProduct: (productId: HubModuleType) => void;
  variant?: 'sidebar' | 'navbar' | 'hero';
  className?: string;
}

// Icon mapper helper
export function renderAIProductIcon(iconName: string, size: number = 16, color?: string) {
  switch (iconName) {
    case 'MessageSquareHeart':
      return <MessageSquareHeart size={size} color={color} />;
    case 'GraduationCap':
      return <GraduationCap size={size} color={color} />;
    case 'ShieldAlert':
      return <ShieldAlert size={size} color={color} />;
    case 'UserCheck':
      return <UserCheck size={size} color={color} />;
    case 'Radio':
      return <Radio size={size} color={color} />;
    case 'Briefcase':
      return <Briefcase size={size} color={color} />;
    case 'FileText':
      return <FileText size={size} color={color} />;
    case 'SearchCheck':
      return <SearchCheck size={size} color={color} />;
    case 'TrendingUp':
      return <TrendingUp size={size} color={color} />;
    case 'Type':
      return <Type size={size} color={color} />;
    case 'Sparkles':
      return <Sparkles size={size} color={color} />;
    case 'Newspaper':
      return <Newspaper size={size} color={color} />;
    case 'CreditCard':
      return <CreditCard size={size} color={color} />;
    case 'CloudSun':
      return <CloudSun size={size} color={color} />;
    case 'HelpCircle':
      return <HelpCircle size={size} color={color} />;
    case 'Mic2':
      return <Mic2 size={size} color={color} />;
    case 'Handshake':
      return <Handshake size={size} color={color} />;
    case 'Video':
      return <Video size={size} color={color} />;
    case 'Users':
      return <Users size={size} color={color} />;
    case 'LayoutDashboard':
      return <LayoutDashboard size={size} color={color} />;
    case 'Cookie':
      return <Cookie size={size} color={color} />;
    default:
      return <Bot size={size} color={color} />;
  }
}

export default function AIHubDropdown({
  activeProductId,
  onSelectProduct,
  variant = 'sidebar',
}: AIHubDropdownProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeConfig =
    activeProductId === 'central_dashboard'
      ? DASHBOARD_DROPDOWN_CONFIG
      : getAIProductConfig(activeProductId);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('touchstart', handleClickOutside, true);
      // Auto-focus search input when opened
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [isOpen]);

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return AI_PRODUCTS;
    const term = searchQuery.toLowerCase().trim();
    return AI_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.shortName.toLowerCase().includes(term) ||
        p.tagline.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    );
  }, [searchQuery]);

  // Group filtered products by category
  const groupedProducts = useMemo(() => {
    const groups: Record<string, AIProductConfig[]> = {};
    filteredProducts.forEach((p) => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }, [filteredProducts]);

  const handleSelect = (productId: HubModuleType) => {
    onSelectProduct(productId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const isSidebar = variant === 'sidebar';
  const isNavbar = variant === 'navbar';

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'relative',
        width: isSidebar ? '100%' : 'auto',
        display: 'inline-block',
      }}
    >
      {/* Dropdown Trigger Button */}
      <button
        id={`ai-hub-dropdown-trigger-${variant}`}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: isSidebar ? '100%' : 'auto',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: isSidebar ? 'space-between' : 'flex-start',
          gap: '0.5rem',
          padding: isSidebar ? '0.65rem 0.85rem' : '0.35rem 0.85rem',
          borderRadius: isSidebar ? '0.75rem' : '9999px',
          background: isSidebar
            ? 'var(--sidebar-input-bg, var(--input-bg))'
            : 'var(--btn-default-bg, rgba(255, 255, 255, 0.08))',
          border: isSidebar
            ? `1px solid ${isOpen ? 'var(--accent-primary)' : 'var(--border-medium)'}`
            : '1px solid var(--btn-default-border, var(--border-medium))',
          color: 'var(--text-main)',
          fontSize: isSidebar ? '0.86rem' : '0.78rem',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: isSidebar
            ? 'var(--shadow-sm)'
            : 'var(--btn-default-shadow, none)',
          transition: 'all 0.2s ease',
          outline: 'none',
        }}
        title="AI Engine Hub: Switch Product"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          {/* Active Product Icon Badge */}
          <div
            style={{
              width: isSidebar ? '26px' : '20px',
              height: isSidebar ? '26px' : '20px',
              borderRadius: '6px',
              background: activeConfig.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: `0 0 10px ${activeConfig.accentColor}55`,
              flexShrink: 0,
            }}
          >
            {renderAIProductIcon(activeConfig.icon, isSidebar ? 14 : 12, '#ffffff')}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: isSidebar ? 'column' : 'row',
              alignItems: isSidebar ? 'flex-start' : 'center',
              gap: isSidebar ? '0.05rem' : '0.4rem',
              minWidth: 0,
              textAlign: 'left',
            }}
          >
            <span
              style={{
                fontSize: isSidebar ? '0.84rem' : '0.78rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {isSidebar ? activeConfig.name : activeConfig.shortName}
            </span>

            {isSidebar && (
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: activeConfig.accentColor,
                  letterSpacing: '0.02em',
                }}
              >
                AI Hub • {activeConfig.badge}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
          {isNavbar && (
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                padding: '0.1rem 0.35rem',
                borderRadius: '4px',
                background: `${activeConfig.accentColor}25`,
                color: activeConfig.accentColor,
                border: `1px solid ${activeConfig.accentColor}40`,
              }}
            >
              Hub
            </span>
          )}
          <ChevronDown
            size={14}
            style={{
              color: 'var(--text-muted)',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </div>
      </button>

      {/* Dropdown Menu Modal */}
      {isOpen && (
        <div
          id="ai-hub-dropdown-menu"
          className="dropdown-menu-popover"
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.45rem)',
            left: isSidebar ? 0 : 'auto',
            right: isSidebar ? 'auto' : 0,
            width: isSidebar ? '340px' : '360px',
            maxHeight: '520px',
            background: 'var(--dropdown-bg)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid var(--dropdown-border)',
            borderRadius: '1rem',
            boxShadow: 'var(--dropdown-shadow)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeInScale 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header Banner & Search Box */}
          <div
            style={{
              padding: '0.85rem 1rem 0.75rem 1rem',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--dropdown-header-bg)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.65rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '4px',
                    background: 'var(--accent-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Layers size={11} color="#ffffff" />
                </div>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                  }}
                >
                  AI Engine Hub Products
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.45rem',
                  borderRadius: '9999px',
                  background: 'var(--accent-gradient-subtle)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--accent-primary)',
                }}
              >
                16 AI Engines
              </span>
            </div>

            {/* Quick Search */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                background: 'var(--input-bg)',
                border: '1px solid var(--border-medium)',
                borderRadius: '0.55rem',
                padding: '0.35rem 0.65rem',
              }}
            >
              <Search size={13} style={{ color: 'var(--text-subtle)', marginRight: '0.45rem' }} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search AI engines & tools..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-main)',
                  fontSize: '0.78rem',
                }}
              />
            </div>
          </div>

          {/* Product List Grouped by Category */}
          <div
            style={{
              padding: '0.5rem',
              overflowY: 'auto',
              maxHeight: '410px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
            }}
          >
            {/* Central Dashboard Item at top */}
            {(!searchQuery.trim() || 'central dashboard overview hub home'.includes(searchQuery.toLowerCase())) && (
              <div style={{ marginBottom: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => handleSelect('central_dashboard')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '0.65rem',
                    background:
                      activeProductId === 'central_dashboard'
                        ? 'var(--dropdown-item-selected)'
                        : 'var(--bg-card)',
                    border:
                      activeProductId === 'central_dashboard'
                        ? '1px solid var(--dropdown-item-selected-border)'
                        : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--dropdown-item-hover)';
                    e.currentTarget.style.borderColor = 'var(--border-medium)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      activeProductId === 'central_dashboard'
                        ? 'var(--dropdown-item-selected)'
                        : 'var(--bg-card)';
                    e.currentTarget.style.borderColor =
                      activeProductId === 'central_dashboard'
                        ? 'var(--dropdown-item-selected-border)'
                        : 'var(--border-subtle)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '0.5rem',
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)',
                        flexShrink: 0,
                      }}
                    >
                      <LayoutDashboard size={14} color="#ffffff" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          Central Dashboard
                        </span>
                        <span
                          style={{
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            padding: '0.05rem 0.35rem',
                            borderRadius: '3px',
                            background: 'var(--accent-gradient-subtle)',
                            color: 'var(--accent-primary)',
                          }}
                        >
                          Home
                        </span>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', marginTop: '0.1rem' }}>
                        Global Overview & Output Counters
                      </div>
                    </div>
                  </div>
                  {activeProductId === 'central_dashboard' && <Check size={14} color="var(--accent-primary)" />}
                </button>
              </div>
            )}

            {Object.keys(groupedProducts).length === 0 ? (
              <div
                style={{
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  color: 'var(--text-subtle)',
                  fontSize: '0.8rem',
                }}
              >
                No AI engines matched "{searchQuery}"
              </div>
            ) : (
              Object.entries(groupedProducts).map(([category, products]) => (
                <div key={category}>
                  {/* Category Title */}
                  <div
                    style={{
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      color: 'var(--text-subtle)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '0.3rem 0.5rem 0.2rem 0.5rem',
                    }}
                  >
                    {category}
                  </div>

                  {/* Products in this category */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {products.map((product) => {
                      const isSelected = product.id === activeProductId;

                      return (
                        <button
                          key={product.id}
                          id={`ai-hub-option-${product.id}`}
                          type="button"
                          onClick={() => handleSelect(product.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.55rem 0.65rem',
                            borderRadius: '0.625rem',
                            background: isSelected
                              ? 'var(--dropdown-item-selected)'
                              : 'transparent',
                            border: isSelected
                              ? '1px solid var(--dropdown-item-selected-border)'
                              : '1px solid transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'var(--dropdown-item-hover)';
                              e.currentTarget.style.borderColor = 'var(--border-subtle)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.borderColor = 'transparent';
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
                            {/* Product Icon */}
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '0.45rem',
                                background: isSelected ? product.gradient : 'var(--bg-tertiary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isSelected ? '#ffffff' : product.accentColor,
                                flexShrink: 0,
                                boxShadow: isSelected ? `0 0 12px ${product.accentColor}66` : 'none',
                              }}
                            >
                              {renderAIProductIcon(product.icon, 14)}
                            </div>

                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span
                                  style={{
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    color: isSelected ? 'var(--accent-primary)' : 'var(--text-main)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {product.name}
                                </span>
                                {product.badge && (
                                  <span
                                    style={{
                                      fontSize: '0.6rem',
                                      fontWeight: 700,
                                      padding: '0.08rem 0.35rem',
                                      borderRadius: '4px',
                                      background: `${product.accentColor}20`,
                                      color: product.accentColor,
                                      border: `1px solid ${product.accentColor}40`,
                                      lineHeight: '1.2',
                                      flexShrink: 0,
                                    }}
                                  >
                                    {product.badge}
                                  </span>
                                )}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.68rem',
                                  color: 'var(--text-subtle)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: '220px',
                                  marginTop: '0.1rem',
                                }}
                              >
                                {product.tagline}
                              </div>
                            </div>
                          </div>

                          {/* Selected Indicator */}
                          {isSelected && (
                            <div
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                background: product.accentColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                marginLeft: '0.4rem',
                              }}
                            >
                              <Check size={11} color="#ffffff" strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer note */}
          <div
            style={{
              padding: '0.5rem 0.85rem',
              borderTop: '1px solid var(--dropdown-border, var(--border-subtle))',
              background: 'var(--dropdown-header-bg, var(--bg-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.68rem',
              color: 'var(--text-subtle)',
            }}
          >
            <span>Powered by Ila AI Engine</span>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Multi-Functional Hub</span>
          </div>
        </div>
      )}
    </div>
  );
}
