import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Type,
  Sun,
  Moon,
  Droplets,
  RotateCcw,
  Check,
  X,
  Minus,
  Plus,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';
import type { AppTheme } from '../App';

interface WorkspaceSettingsDropdownProps {
  theme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
  className?: string;
}

export type FontFamilyChoice = 'sans' | 'mono' | 'clean';

export const FONT_FAMILY_MAP: Record<FontFamilyChoice, { name: string; css: string; description: string }> = {
  sans: {
    name: 'Inter Sans',
    css: "'Inter', 'Roboto', 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    description: 'Modern system sans-serif',
  },
  clean: {
    name: 'Roboto UI',
    css: "'Roboto', 'Inter', -apple-system, sans-serif",
    description: 'Crisp, high-readability',
  },
  mono: {
    name: 'JetBrains Mono',
    css: "'JetBrains Mono', 'Fira Code', monospace",
    description: 'Monospaced technical density',
  },
};

export const FONT_SCALE_PRESETS = [
  { label: 'Compact', scale: 90, badge: '90%' },
  { label: 'Standard', scale: 100, badge: '100%' },
  { label: 'Comfort', scale: 110, badge: '110%' },
  { label: 'Large', scale: 120, badge: '120%' },
];

export default function WorkspaceSettingsDropdown({
  theme,
  onSelectTheme,
}: WorkspaceSettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Font scale (in percent: 85 - 125)
  const [fontScale, setFontScale] = useState<number>(() => {
    const saved = localStorage.getItem('ila_font_scale');
    return saved ? parseInt(saved, 10) : 100;
  });

  // Font family choice
  const [fontFamily, setFontFamily] = useState<FontFamilyChoice>(() => {
    return (localStorage.getItem('ila_font_family') as FontFamilyChoice) || 'sans';
  });

  // High contrast mode
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('ila_high_contrast') === 'true';
  });

  // Apply font scale to documentElement
  const applyFontScale = (scale: number) => {
    setFontScale(scale);
    document.documentElement.style.fontSize = `${scale}%`;
    document.documentElement.style.setProperty('--workspace-font-scale', `${scale}%`);
    localStorage.setItem('ila_font_scale', scale.toString());
  };

  // Apply font family
  const applyFontFamily = (family: FontFamilyChoice) => {
    setFontFamily(family);
    const cssVal = FONT_FAMILY_MAP[family]?.css || FONT_FAMILY_MAP.sans.css;
    document.documentElement.style.setProperty('--workspace-font-family', cssVal);
    localStorage.setItem('ila_font_family', family);
  };

  // Apply high contrast
  const toggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    if (next) {
      document.documentElement.setAttribute('data-high-contrast', 'true');
      localStorage.setItem('ila_high_contrast', 'true');
    } else {
      document.documentElement.removeAttribute('data-high-contrast');
      localStorage.setItem('ila_high_contrast', 'false');
    }
  };

  // Reset to default settings
  const handleReset = () => {
    applyFontScale(100);
    applyFontFamily('sans');
    setHighContrast(false);
    document.documentElement.removeAttribute('data-high-contrast');
    localStorage.setItem('ila_high_contrast', 'false');
  };

  // Close on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('touchstart', handleClickOutside, true);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Sync initial settings on mount
  useEffect(() => {
    const savedScale = localStorage.getItem('ila_font_scale');
    if (savedScale) {
      const scaleNum = parseInt(savedScale, 10);
      document.documentElement.style.fontSize = `${scaleNum}%`;
      document.documentElement.style.setProperty('--workspace-font-scale', `${scaleNum}%`);
    }
    const savedFamily = (localStorage.getItem('ila_font_family') as FontFamilyChoice) || 'sans';
    const cssVal = FONT_FAMILY_MAP[savedFamily]?.css || FONT_FAMILY_MAP.sans.css;
    document.documentElement.style.setProperty('--workspace-font-family', cssVal);

    if (localStorage.getItem('ila_high_contrast') === 'true') {
      document.documentElement.setAttribute('data-high-contrast', 'true');
    }
  }, []);

  const isCustomized = fontScale !== 100 || fontFamily !== 'sans' || highContrast;

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Sleek Settings Trigger Button */}
      <button
        id="engine-hub-settings-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.8rem',
          borderRadius: '9999px',
          background: isOpen
            ? 'var(--dropdown-item-selected)'
            : 'var(--btn-default-bg)',
          border: isOpen
            ? '1px solid var(--border-focus)'
            : '1px solid var(--btn-default-border)',
          color: isOpen ? 'var(--accent-primary)' : 'var(--btn-default-color, var(--text-main))',
          fontSize: '0.78rem',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: isOpen ? '0 0 14px var(--accent-glow)' : 'var(--btn-default-shadow)',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'var(--btn-default-hover-bg)';
            e.currentTarget.style.borderColor = 'var(--btn-default-hover-border)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'var(--btn-default-bg)';
            e.currentTarget.style.borderColor = 'var(--btn-default-border)';
          }
        }}
        title="Workspace Display & Font Settings (Text scaling, sizing, and theme toggles)"
      >
        <Settings
          size={14}
          color={isOpen ? 'var(--accent-primary)' : 'currentColor'}
          style={{
            transform: isOpen ? 'rotate(45deg)' : 'none',
            transition: 'transform 0.3s ease',
          }}
        />
        <span>Settings</span>

        {/* Small indicator badge when non-default adjustments are active */}
        {isCustomized && (
          <span
            title="Custom workspace settings active"
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              boxShadow: '0 0 6px var(--accent-glow)',
            }}
          />
        )}
      </button>

      {/* Settings Dropdown Popover */}
      {isOpen && (
        <div
          id="workspace-settings-dropdown-menu"
          className="animate-fade-in dropdown-menu-popover"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 0.45rem)',
            width: '320px',
            background: 'var(--dropdown-bg)',
            border: '1px solid var(--dropdown-border)',
            borderRadius: '1rem',
            padding: '0.85rem',
            boxShadow: 'var(--dropdown-shadow)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Sliders size={14} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Workspace Settings
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {isCustomized && (
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-subtle)',
                    fontSize: '0.68rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    padding: '0.2rem 0.35rem',
                    borderRadius: '0.35rem',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-subtle)')}
                  title="Reset font & display to factory defaults"
                >
                  <RotateCcw size={10} />
                  <span>Reset</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-subtle)',
                  cursor: 'pointer',
                  padding: '0.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '0.35rem',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-subtle)')}
                title="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Section 1: Font Sizing & Text Scaling */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.4rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Type size={12} color="var(--accent-primary)" />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Workspace Font Sizing
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: fontScale === 100 ? 'var(--text-subtle)' : 'var(--accent-primary)',
                  background: fontScale === 100 ? 'transparent' : 'var(--accent-gradient-subtle)',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '0.35rem',
                  border: fontScale === 100 ? 'none' : '1px solid var(--border-subtle)',
                }}
              >
                {fontScale}%
              </span>
            </div>

            {/* Quick Preset Buttons */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.35rem',
                marginBottom: '0.6rem',
              }}
            >
              {FONT_SCALE_PRESETS.map((p) => {
                const isSelected = fontScale === p.scale;
                return (
                  <button
                    key={p.scale}
                    type="button"
                    onClick={() => applyFontScale(p.scale)}
                    style={{
                      padding: '0.35rem 0.2rem',
                      borderRadius: '0.45rem',
                      background: isSelected
                        ? 'var(--accent-gradient)'
                        : 'var(--bg-tertiary)',
                      border: isSelected
                        ? '1px solid var(--accent-primary)'
                        : '1px solid var(--border-subtle)',
                      color: isSelected ? '#ffffff' : 'var(--text-main)',
                      fontSize: '0.68rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 8px var(--accent-glow)' : 'none',
                    }}
                  >
                    <div>{p.label}</div>
                    <div style={{ fontSize: '0.6rem', opacity: 0.85 }}>{p.badge}</div>
                  </button>
                );
              })}
            </div>

            {/* Stepper + Slider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                background: 'var(--bg-tertiary)',
                padding: '0.35rem 0.6rem',
                borderRadius: '0.55rem',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <button
                type="button"
                onClick={() => applyFontScale(Math.max(85, fontScale - 5))}
                disabled={fontScale <= 85}
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: fontScale <= 85 ? 'transparent' : 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  color: fontScale <= 85 ? 'var(--text-subtle)' : 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: fontScale <= 85 ? 'not-allowed' : 'pointer',
                  padding: 0,
                  opacity: fontScale <= 85 ? 0.4 : 1,
                  flexShrink: 0,
                }}
                title="Decrease font scale by 5%"
              >
                <Minus size={11} />
              </button>

              <input
                type="range"
                min="85"
                max="125"
                step="1"
                value={fontScale}
                onChange={(e) => applyFontScale(parseInt(e.target.value, 10))}
                style={{
                  flex: 1,
                  accentColor: 'var(--accent-primary)',
                  cursor: 'pointer',
                  height: '4px',
                }}
                title="Fine-tune workspace text scale"
              />

              <button
                type="button"
                onClick={() => applyFontScale(Math.min(125, fontScale + 5))}
                disabled={fontScale >= 125}
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: fontScale >= 125 ? 'transparent' : 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  color: fontScale >= 125 ? 'var(--text-subtle)' : 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: fontScale >= 125 ? 'not-allowed' : 'pointer',
                  padding: 0,
                  opacity: fontScale >= 125 ? 0.4 : 1,
                  flexShrink: 0,
                }}
                title="Increase font scale by 5%"
              >
                <Plus size={11} />
              </button>
            </div>

            {/* Live Preview Box */}
            <div
              style={{
                marginTop: '0.45rem',
                padding: '0.4rem 0.6rem',
                borderRadius: '0.45rem',
                background: 'var(--bg-tertiary)',
                border: '1px dashed var(--border-medium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Eye size={12} color="var(--text-subtle)" />
                <span
                  style={{
                    fontSize: '0.76rem',
                    color: 'var(--text-main)',
                    fontWeight: 600,
                  }}
                >
                  Aa Sample text legibility
                </span>
              </div>
              <span style={{ fontSize: '0.64rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
                {fontScale}% scale
              </span>
            </div>
          </div>

          {/* Section 2: Font Family Selection */}
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                marginBottom: '0.4rem',
              }}
            >
              Workspace Font Family
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
              {(Object.keys(FONT_FAMILY_MAP) as FontFamilyChoice[]).map((key) => {
                const item = FONT_FAMILY_MAP[key];
                const isSelected = fontFamily === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyFontFamily(key)}
                    style={{
                      padding: '0.35rem 0.25rem',
                      borderRadius: '0.45rem',
                      background: isSelected
                        ? 'var(--dropdown-item-selected)'
                        : 'var(--bg-tertiary)',
                      border: isSelected
                        ? '1px solid var(--accent-primary)'
                        : '1px solid var(--border-subtle)',
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-main)',
                      fontSize: '0.68rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontFamily: item.css,
                      transition: 'all 0.15s ease',
                    }}
                    title={item.description}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Clean Standard Theme Toggles */}
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                marginBottom: '0.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Standard Theme Toggles</span>
              <span style={{ fontSize: '0.64rem', color: 'var(--text-subtle)', textTransform: 'capitalize', fontWeight: 600 }}>
                Active: {theme}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.35rem' }}>
              {/* Light Standard */}
              <button
                type="button"
                onClick={() => onSelectTheme('standard')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.4rem 0.5rem',
                  borderRadius: '0.5rem',
                  background: theme === 'standard' ? 'var(--dropdown-item-selected)' : 'var(--bg-tertiary)',
                  border: theme === 'standard' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    border: '1px solid #94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, fontWeight: theme === 'standard' ? 700 : 500 }}>Clean Light</span>
                {theme === 'standard' && <Check size={11} color="var(--accent-primary)" />}
              </button>

              {/* Sunlight Anti-Glare */}
              <button
                type="button"
                onClick={() => onSelectTheme('sunny-day')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.4rem 0.5rem',
                  borderRadius: '0.5rem',
                  background: theme === 'sunny-day' ? 'var(--dropdown-item-selected)' : 'var(--bg-tertiary)',
                  border: theme === 'sunny-day' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <Sun size={13} color="#f59e0b" style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, fontWeight: theme === 'sunny-day' ? 700 : 500 }}>Anti-Glare</span>
                {theme === 'sunny-day' && <Check size={11} color="var(--accent-primary)" />}
              </button>

              {/* Obsidian Dark */}
              <button
                type="button"
                onClick={() => onSelectTheme('obsidian')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.4rem 0.5rem',
                  borderRadius: '0.5rem',
                  background: theme === 'obsidian' ? 'var(--dropdown-item-selected)' : 'var(--bg-tertiary)',
                  border: theme === 'obsidian' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <Moon size={13} color="#818cf8" style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, fontWeight: theme === 'obsidian' ? 700 : 500 }}>Obsidian Dark</span>
                {theme === 'obsidian' && <Check size={11} color="var(--accent-primary)" />}
              </button>

              {/* Sapphire Blue */}
              <button
                type="button"
                onClick={() => onSelectTheme('sapphire')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.4rem 0.5rem',
                  borderRadius: '0.5rem',
                  background: theme === 'sapphire' ? 'var(--dropdown-item-selected)' : 'var(--bg-tertiary)',
                  border: theme === 'sapphire' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <Droplets size={13} color="#38bdf8" style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, fontWeight: theme === 'sapphire' ? 700 : 500 }}>Sapphire</span>
                {theme === 'sapphire' && <Check size={11} color="var(--accent-primary)" />}
              </button>
            </div>
          </div>

          {/* Section 4: Readability & High Contrast Toggle */}
          <div
            style={{
              paddingTop: '0.5rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-main)' }}>
                High-Contrast Borders & Text
              </span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-subtle)' }}>
                Sharpens element outlines for bright ambient light
              </span>
            </div>

            <button
              type="button"
              onClick={toggleHighContrast}
              style={{
                width: '38px',
                height: '20px',
                borderRadius: '9999px',
                background: highContrast ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s ease',
                padding: 0,
                flexShrink: 0,
              }}
              title="Toggle high-contrast outlines"
            >
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: highContrast ? '20px' : '2px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  transition: 'left 0.2s ease',
                }}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
