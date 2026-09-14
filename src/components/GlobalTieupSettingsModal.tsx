import { useState, useMemo } from 'react';
import {
  X,
  Settings,
  Bookmark,
  Trash2,
  RotateCcw,
  Check,
  Building2,
  FolderPlus,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Download,
  Copy,
  Sparkles,
  ArrowRight,
  Layers,
  Database,
  Mail,
  BadgePercent,
  GraduationCap
} from 'lucide-react';
import type { TieupLeadItem, TieupSavedList } from '../services/dbService';

export interface GlobalTieupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'saved_lists' | 'cleanup' | 'sandbox';
  onSelectTab: (tab: 'saved_lists' | 'cleanup' | 'sandbox') => void;
  currentView: 'chat_home' | 'resources' | 'process' | 'partners';
  sessionLeads: TieupLeadItem[];
  allResourcesLeads: TieupLeadItem[];
  selectedLeadIds: Set<string>;
  onToggleLeadSelection: (leadId: string) => void;
  onSelectAllVisible: (leadIds: string[]) => void;
  onClearSelection: () => void;
  savedLists: TieupSavedList[];
  onSaveCurrentAsList: (name: string, description: string) => Promise<boolean>;
  onLoadSavedList: (list: TieupSavedList) => void;
  onDeleteSavedList: (listId: string) => Promise<void>;
  onBulkDeleteLeads: (leadIds: string[]) => Promise<void>;
  onClearCurrentSessionLeads: () => Promise<void>;
  onInjectSandboxTestColleges: () => Promise<void>;
  onResetDatabasePipeline?: () => Promise<void>;
}

export default function GlobalTieupSettingsModal({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  currentView,
  sessionLeads,
  allResourcesLeads,
  selectedLeadIds,
  onToggleLeadSelection,
  onSelectAllVisible,
  onClearSelection,
  savedLists,
  onSaveCurrentAsList,
  onLoadSavedList,
  onDeleteSavedList,
  onBulkDeleteLeads,
  onClearCurrentSessionLeads,
  onInjectSandboxTestColleges,
  onResetDatabasePipeline,
}: GlobalTieupSettingsModalProps) {
  // Local state for creating new saved list
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSavingList, setIsSavingList] = useState(false);

  // Local state for cleanup search & filter
  const [cleanupSearchQuery, setCleanupSearchQuery] = useState('');
  const [cleanupSource, setCleanupSource] = useState<'current_view' | 'all_resources'>('current_view');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Sandbox injection state
  const [isInjectingSandbox, setIsInjectingSandbox] = useState(false);
  const [sandboxConfirmOpen, setSandboxConfirmOpen] = useState(false);

  // Copied indicator
  const [copiedListId, setCopiedListId] = useState<string | null>(null);

  // Derive active view display name
  const currentViewDisplayName = useMemo(() => {
    switch (currentView) {
      case 'chat_home':
        return 'Chat Home Prospects';
      case 'resources':
        return 'Resources Repository';
      case 'process':
        return 'Process Pipeline';
      case 'partners':
        return 'Finalized Partners';
      default:
        return 'Workspace';
    }
  }, [currentView]);

  // Derive candidate leads for current view
  const currentViewLeads = useMemo(() => {
    if (currentView === 'chat_home') return sessionLeads;
    if (currentView === 'partners') return allResourcesLeads.filter((l) => l.isPartner);
    return allResourcesLeads;
  }, [currentView, sessionLeads, allResourcesLeads]);

  // Cleanup leads candidate list
  const candidateCleanupLeads = useMemo(() => {
    const base = cleanupSource === 'current_view' ? currentViewLeads : allResourcesLeads;
    if (!cleanupSearchQuery.trim()) return base;
    const q = cleanupSearchQuery.toLowerCase();
    return base.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.locationMain.toLowerCase().includes(q) ||
        l.contactEmail?.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q)
    );
  }, [cleanupSource, currentViewLeads, allResourcesLeads, cleanupSearchQuery]);

  // Selected leads count for "Save As"
  const leadsToSaveCount = useMemo(() => {
    if (selectedLeadIds.size > 0) {
      return selectedLeadIds.size;
    }
    return currentViewLeads.length;
  }, [selectedLeadIds.size, currentViewLeads.length]);

  if (!isOpen) return null;

  // Handler: Save As New List
  const handleSaveList = async () => {
    if (!newListName.trim()) return;
    setIsSavingList(true);
    try {
      const ok = await onSaveCurrentAsList(newListName.trim(), newListDescription.trim());
      if (ok) {
        setSaveSuccessMsg(`✓ List "${newListName.trim()}" created successfully!`);
        setNewListName('');
        setNewListDescription('');
        setTimeout(() => setSaveSuccessMsg(null), 3500);
      }
    } finally {
      setIsSavingList(false);
    }
  };

  // Handler: Export Saved List as JSON
  const handleExportList = (list: TieupSavedList) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(list, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `saved_list_${list.name.replace(/\s+/g, '_')}_${list.createdAt}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Handler: Copy JSON
  const handleCopyList = (list: TieupSavedList) => {
    navigator.clipboard.writeText(JSON.stringify(list, null, 2));
    setCopiedListId(list.id);
    setTimeout(() => setCopiedListId(null), 2000);
  };

  // Handler: Execute Bulk Delete
  const handleExecuteBulkDelete = async () => {
    const idsToDelete = Array.from(selectedLeadIds);
    if (idsToDelete.length === 0) return;
    setIsDeleting(true);
    try {
      await onBulkDeleteLeads(idsToDelete);
      setDeleteConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler: Execute Sandbox Reset & Injection
  const handleExecuteSandboxInjection = async () => {
    setIsInjectingSandbox(true);
    try {
      await onInjectSandboxTestColleges();
      setSandboxConfirmOpen(false);
      onClose();
    } finally {
      setIsInjectingSandbox(false);
    }
  };

  return (
    <div
      id="global-tieup-settings-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(7, 10, 19, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="global-tieup-settings-modal-card"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          background: 'var(--bg-card)',
          borderRadius: '1rem',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.55)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: '1.15rem 1.5rem',
            borderBottom: '1px solid var(--border-medium)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '0.6rem',
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
              }}
            >
              <Settings size={19} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Engine Hub Workspace Settings
                </h3>
                <span
                  style={{
                    padding: '0.15rem 0.55rem',
                    borderRadius: '0.4rem',
                    background: 'var(--dropdown-item-selected)',
                    border: '1px solid var(--accent-primary)',
                    color: 'var(--accent-primary)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  {currentViewDisplayName}
                </span>
              </div>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Manage custom Saved Lists ("Save As"), perform multi-record bulk cleanup, or inject clean Sandbox test colleges.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: '0.5rem',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Close Settings"
          >
            <X size={16} />
          </button>
        </div>

        {/* TAB SWITCHER */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
          }}
        >
          <button
            type="button"
            onClick={() => onSelectTab('saved_lists')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.95rem',
              borderRadius: '0.55rem',
              background: activeTab === 'saved_lists' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
              color: activeTab === 'saved_lists' ? '#ffffff' : 'var(--text-muted)',
              border: activeTab === 'saved_lists' ? 'none' : '1px solid var(--border-medium)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Bookmark size={14} />
            <span>Saved Lists ("Save As")</span>
            <span
              style={{
                marginLeft: '0.25rem',
                padding: '0.08rem 0.4rem',
                borderRadius: '0.35rem',
                background: activeTab === 'saved_lists' ? 'rgba(255,255,255,0.25)' : 'var(--bg-card)',
                fontSize: '0.72rem',
                fontWeight: 800,
              }}
            >
              {savedLists.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('cleanup')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.95rem',
              borderRadius: '0.55rem',
              background: activeTab === 'cleanup' ? '#dc2626' : 'var(--bg-secondary)',
              color: activeTab === 'cleanup' ? '#ffffff' : 'var(--text-muted)',
              border: activeTab === 'cleanup' ? 'none' : '1px solid var(--border-medium)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Trash2 size={14} />
            <span>Bulk Delete & Cleanup</span>
            {selectedLeadIds.size > 0 && (
              <span
                style={{
                  marginLeft: '0.25rem',
                  padding: '0.08rem 0.4rem',
                  borderRadius: '0.35rem',
                  background: 'rgba(255,255,255,0.3)',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                }}
              >
                {selectedLeadIds.size}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('sandbox')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.95rem',
              borderRadius: '0.55rem',
              background: activeTab === 'sandbox' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'var(--bg-secondary)',
              color: activeTab === 'sandbox' ? '#ffffff' : 'var(--text-muted)',
              border: activeTab === 'sandbox' ? 'none' : '1px solid var(--border-medium)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <RotateCcw size={14} />
            <span>Sandbox Mode (Test Colleges)</span>
            <span
              style={{
                marginLeft: '0.25rem',
                padding: '0.08rem 0.4rem',
                borderRadius: '0.35rem',
                background: activeTab === 'sandbox' ? 'rgba(255,255,255,0.25)' : 'var(--success-bg)',
                color: activeTab === 'sandbox' ? '#ffffff' : 'var(--success)',
                fontSize: '0.72rem',
                fontWeight: 800,
              }}
            >
              Mock Ready
            </span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {/* =============================================================== */}
          {/* TAB 1: SAVED LISTS ("SAVE AS")                                 */}
          {/* =============================================================== */}
          {activeTab === 'saved_lists' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* SAVE SELECTION CARD */}
              <div
                style={{
                  padding: '1.15rem 1.25rem',
                  borderRadius: '0.75rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <FolderPlus size={16} color="var(--accent-primary)" />
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Save Selection as New Custom List ("Save As")
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      color: 'var(--accent-primary)',
                      background: 'var(--dropdown-item-selected)',
                      padding: '0.15rem 0.55rem',
                      borderRadius: '0.35rem',
                    }}
                  >
                    {selectedLeadIds.size > 0
                      ? `${selectedLeadIds.size} Selected Lead(s) Targeted`
                      : `All ${currentViewLeads.length} Current Leads Targeted`}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                      List Name *
                    </label>
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="e.g., German Tech Universities Fall 2026"
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.75rem',
                        borderRadius: '0.5rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-medium)',
                        color: 'var(--text-main)',
                        fontSize: '0.84rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                      Notes / Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={newListDescription}
                      onChange={(e) => setNewListDescription(e.target.value)}
                      placeholder="e.g., High-commission engineering institutions"
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.75rem',
                        borderRadius: '0.5rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-medium)',
                        color: 'var(--text-main)',
                        fontSize: '0.84rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveList}
                    disabled={!newListName.trim() || isSavingList || leadsToSaveCount === 0}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.48rem 1.1rem',
                      borderRadius: '0.5rem',
                      background: 'var(--accent-primary)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: !newListName.trim() || isSavingList || leadsToSaveCount === 0 ? 'not-allowed' : 'pointer',
                      opacity: !newListName.trim() || isSavingList || leadsToSaveCount === 0 ? 0.6 : 1,
                      transition: 'all 0.15s ease',
                      height: '35px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Bookmark size={14} />
                    <span>{isSavingList ? 'Saving...' : `Save List (${leadsToSaveCount})`}</span>
                  </button>
                </div>

                {saveSuccessMsg && (
                  <div
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '0.45rem',
                      background: 'var(--success-bg)',
                      border: '1px solid var(--success)',
                      color: 'var(--success)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <Check size={14} />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}
              </div>

              {/* SAVED LISTS REPOSITORY */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Your Saved Lists ({savedLists.length})
                  </h4>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Load any list to restore filtered leads or select them for pipeline actions.
                  </span>
                </div>

                {savedLists.length === 0 ? (
                  <div
                    style={{
                      padding: '2.5rem 1.5rem',
                      textAlign: 'center',
                      background: 'var(--bg-secondary)',
                      border: '1px dashed var(--border-medium)',
                      borderRadius: '0.75rem',
                    }}
                  >
                    <Bookmark size={36} color="var(--text-subtle)" style={{ margin: '0 auto 0.65rem auto' }} />
                    <h5 style={{ margin: '0 0 0.35rem 0', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      No Saved Lists Yet
                    </h5>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '420px', marginInline: 'auto' }}>
                      Select specific colleges or leads in the active table and use the "Save As" form above to create custom reference lists.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {savedLists.map((list) => {
                      const dateFormatted = new Date(list.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const isCopied = copiedListId === list.id;

                      return (
                        <div
                          key={list.id}
                          style={{
                            padding: '0.85rem 1.15rem',
                            borderRadius: '0.65rem',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-medium)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: '220px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.2rem' }}>
                              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                {list.name}
                              </span>
                              <span
                                style={{
                                  padding: '0.1rem 0.45rem',
                                  borderRadius: '0.35rem',
                                  background: 'var(--dropdown-item-selected)',
                                  color: 'var(--accent-primary)',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                }}
                              >
                                {list.leadIds.length} Institutions
                              </span>
                              {list.sourceTab && (
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--text-muted)',
                                    textTransform: 'capitalize',
                                  }}
                                >
                                  (from {list.sourceTab.replace('_', ' ')})
                                </span>
                              )}
                            </div>

                            {list.description && (
                              <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {list.description}
                              </p>
                            )}

                            {/* Preview sample institution names */}
                            {list.leadsSnapshot && list.leadsSnapshot.length > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                {list.leadsSnapshot.slice(0, 3).map((lead) => (
                                  <span
                                    key={lead.id}
                                    style={{
                                      fontSize: '0.7rem',
                                      padding: '0.08rem 0.4rem',
                                      borderRadius: '0.3rem',
                                      background: 'var(--bg-card)',
                                      border: '1px solid var(--border-subtle)',
                                      color: 'var(--text-main)',
                                      maxWidth: '180px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {lead.name}
                                  </span>
                                ))}
                                {list.leadsSnapshot.length > 3 && (
                                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                    +{list.leadsSnapshot.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}

                            <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', display: 'block', marginTop: '0.35rem' }}>
                              Created: {dateFormatted}
                            </span>
                          </div>

                          {/* Actions for this saved list */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <button
                              type="button"
                              onClick={() => {
                                onLoadSavedList(list);
                                onClose();
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.38rem 0.75rem',
                                borderRadius: '0.45rem',
                                background: 'var(--accent-primary)',
                                border: 'none',
                                color: '#ffffff',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                              title="Apply this list to current view and select these leads"
                            >
                              <Layers size={13} />
                              <span>Load / Apply</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyList(list)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.38rem 0.6rem',
                                borderRadius: '0.45rem',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-medium)',
                                color: isCopied ? 'var(--success)' : 'var(--text-main)',
                                fontSize: '0.76rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                              title="Copy JSON to clipboard"
                            >
                              {isCopied ? <Check size={13} /> : <Copy size={13} />}
                              <span>{isCopied ? 'Copied' : 'Copy'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleExportList(list)}
                              style={{
                                padding: '0.38rem 0.55rem',
                                borderRadius: '0.45rem',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-medium)',
                                color: 'var(--text-main)',
                                fontSize: '0.76rem',
                                cursor: 'pointer',
                              }}
                              title="Download List as JSON"
                            >
                              <Download size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete saved list "${list.name}"?`)) {
                                  onDeleteSavedList(list.id);
                                }
                              }}
                              style={{
                                padding: '0.38rem 0.55rem',
                                borderRadius: '0.45rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#ef4444',
                                fontSize: '0.76rem',
                                cursor: 'pointer',
                              }}
                              title="Delete this saved list"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 2: BULK DELETE / CLEANUP                                   */}
          {/* =============================================================== */}
          {activeTab === 'cleanup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* Summary Stats Banner */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <div style={{ padding: '0.85rem', borderRadius: '0.6rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>MASTER REPOSITORY</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                    {allResourcesLeads.length} Leads
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Across Resources & Process</div>
                </div>

                <div style={{ padding: '0.85rem', borderRadius: '0.6rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>CURRENT ACTIVE THREAD</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.15rem' }}>
                    {sessionLeads.length} Prospects
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>In active Chat Home session</div>
                </div>

                <div style={{ padding: '0.85rem', borderRadius: '0.6rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 600 }}>SELECTED FOR CLEANUP</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444', marginTop: '0.15rem' }}>
                    {selectedLeadIds.size} Leads
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Targeted for permanent removal</div>
                </div>
              </div>

              {/* Action Toolbar for Bulk Delete */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  padding: '0.65rem 0.95rem',
                  borderRadius: '0.65rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-medium)',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {/* Source Toggle */}
                  <select
                    value={cleanupSource}
                    onChange={(e) => setCleanupSource(e.target.value as any)}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '0.45rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-main)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    <option value="current_view">Scope: {currentViewDisplayName} ({currentViewLeads.length})</option>
                    <option value="all_resources">Scope: Entire Master Database ({allResourcesLeads.length})</option>
                  </select>

                  {/* Filter Search */}
                  <div style={{ position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                    <input
                      type="text"
                      value={cleanupSearchQuery}
                      onChange={(e) => setCleanupSearchQuery(e.target.value)}
                      placeholder="Filter records..."
                      style={{
                        padding: '0.35rem 0.65rem 0.35rem 1.8rem',
                        borderRadius: '0.45rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-medium)',
                        color: 'var(--text-main)',
                        fontSize: '0.8rem',
                        outline: 'none',
                        width: '180px',
                      }}
                    />
                  </div>

                  {/* Select All Visible */}
                  <button
                    type="button"
                    onClick={() => onSelectAllVisible(candidateCleanupLeads.map((l) => l.id))}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '0.45rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-main)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Select All ({candidateCleanupLeads.length})
                  </button>

                  {selectedLeadIds.size > 0 && (
                    <button
                      type="button"
                      onClick={onClearSelection}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '0.45rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-medium)',
                        color: 'var(--text-muted)',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                      }}
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                {/* Primary Action Button: Delete Selected */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Clear all prospects from this active chat thread only? Master repository leads will remain intact.')) {
                        onClearCurrentSessionLeads();
                      }
                    }}
                    disabled={sessionLeads.length === 0}
                    style={{
                      padding: '0.38rem 0.75rem',
                      borderRadius: '0.45rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: sessionLeads.length === 0 ? 'not-allowed' : 'pointer',
                    }}
                    title="Clear only active thread leads"
                  >
                    Clear Thread Only
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={selectedLeadIds.size === 0 || isDeleting}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.42rem 0.95rem',
                      borderRadius: '0.5rem',
                      background: selectedLeadIds.size > 0 ? '#dc2626' : 'var(--bg-card)',
                      border: selectedLeadIds.size > 0 ? 'none' : '1px solid var(--border-medium)',
                      color: selectedLeadIds.size > 0 ? '#ffffff' : 'var(--text-subtle)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: selectedLeadIds.size === 0 || isDeleting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: selectedLeadIds.size > 0 ? '0 2px 8px rgba(220, 38, 38, 0.35)' : 'none',
                    }}
                  >
                    <Trash2 size={14} />
                    <span>
                      {selectedLeadIds.size > 0 ? `Delete Selected (${selectedLeadIds.size})` : 'Select Records to Delete'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirmation Dialog Overlay within modal */}
              {deleteConfirmOpen && (
                <div
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '0.65rem',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid #ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <AlertTriangle size={24} color="#ef4444" />
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ef4444' }}>
                        Confirm Permanent Deletion of {selectedLeadIds.size} Record(s)?
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        These records will be removed from the SQLite database and all workspace modules. This cannot be undone.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmOpen(false)}
                      style={{
                        padding: '0.38rem 0.75rem',
                        borderRadius: '0.45rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-medium)',
                        color: 'var(--text-main)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteBulkDelete}
                      disabled={isDeleting}
                      style={{
                        padding: '0.38rem 0.95rem',
                        borderRadius: '0.45rem',
                        background: '#dc2626',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: isDeleting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isDeleting ? 'Deleting...' : 'Yes, Delete Now'}
                    </button>
                  </div>
                </div>
              )}

              {/* Records Checklist Table */}
              <div
                style={{
                  maxHeight: '380px',
                  overflowY: 'auto',
                  borderRadius: '0.65rem',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-secondary)',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-medium)' }}>
                      <th style={{ padding: '0.55rem 0.75rem', width: '36px' }}>
                        <input
                          type="checkbox"
                          checked={candidateCleanupLeads.length > 0 && candidateCleanupLeads.every((l) => selectedLeadIds.has(l.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              onSelectAllVisible(candidateCleanupLeads.map((l) => l.id));
                            } else {
                              onClearSelection();
                            }
                          }}
                          style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                        />
                      </th>
                      <th style={{ padding: '0.55rem 0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Institution Name</th>
                      <th style={{ padding: '0.55rem 0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Category / Location</th>
                      <th style={{ padding: '0.55rem 0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Contact Liaison</th>
                      <th style={{ padding: '0.55rem 0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidateCleanupLeads.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No records match current cleanup filters.
                        </td>
                      </tr>
                    ) : (
                      candidateCleanupLeads.map((lead) => {
                        const isSelected = selectedLeadIds.has(lead.id);
                        return (
                          <tr
                            key={lead.id}
                            style={{
                              borderBottom: '1px solid var(--border-subtle)',
                              background: isSelected ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                              cursor: 'pointer',
                            }}
                            onClick={() => onToggleLeadSelection(lead.id)}
                          >
                            <td style={{ padding: '0.55rem 0.75rem' }} onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => onToggleLeadSelection(lead.id)}
                                style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ padding: '0.55rem 0.75rem' }}>
                              <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{lead.name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{lead.locationMain}</div>
                            </td>
                            <td style={{ padding: '0.55rem 0.75rem' }}>
                              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{lead.category}</span>
                            </td>
                            <td style={{ padding: '0.55rem 0.75rem' }}>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>{lead.contactPerson || 'Liaison'}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lead.contactEmail}</div>
                            </td>
                            <td style={{ padding: '0.55rem 0.75rem' }}>
                              <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.8rem' }}>
                                {lead.commissionPercent ? `${lead.commissionPercent}%` : '15%'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 3: SANDBOX MODE & TEST COLLEGES INJECTION                  */}
          {/* =============================================================== */}
          {activeTab === 'sandbox' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* SANDBOX OVERVIEW BANNER */}
              <div
                style={{
                  padding: '1.25rem 1.35rem',
                  borderRadius: '0.85rem',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.12) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <RotateCcw size={18} color="#10b981" />
                      <h4 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        Data Reset & Test Colleges Injection (Sandbox Outreach Mode)
                      </h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
                      Wipe existing dummy/stale records from the database and populate clean <strong>Test Colleges (Test College 1, Test College 2, Test College 3)</strong> configured with mock commission rates, student admission criteria, and test email addresses.
                    </p>
                    <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.74rem', background: 'var(--bg-card)', padding: '0.15rem 0.5rem', borderRadius: '0.35rem', border: '1px solid var(--border-medium)', color: 'var(--text-main)' }}>
                        🎯 Auto-populates in Chat Home first
                      </span>
                      <span style={{ fontSize: '0.74rem', background: 'var(--bg-card)', padding: '0.15rem 0.5rem', borderRadius: '0.35rem', border: '1px solid var(--border-medium)', color: 'var(--text-main)' }}>
                        📤 Ready to push to Resources & Process
                      </span>
                      <span style={{ fontSize: '0.74rem', background: 'var(--bg-card)', padding: '0.15rem 0.5rem', borderRadius: '0.35rem', border: '1px solid var(--border-medium)', color: 'var(--text-main)' }}>
                        🛡️ Anti-Spam Verified
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', alignItems: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setSandboxConfirmOpen(true)}
                      disabled={isInjectingSandbox}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.55rem 1.25rem',
                        borderRadius: '0.6rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        cursor: isInjectingSandbox ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <RotateCcw size={15} />
                      <span>{isInjectingSandbox ? 'Resetting & Injecting...' : 'Reset & Inject Test Colleges'}</span>
                    </button>

                    {onResetDatabasePipeline && (
                      <button
                        type="button"
                        onClick={async () => {
                          await onResetDatabasePipeline();
                          onClose();
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          padding: '0.42rem 0.9rem',
                          borderRadius: '0.55rem',
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          color: '#fca5a5',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        title="Purge all legacy records from Chat Home, Resources, Process, and Partners"
                      >
                        <Trash2 size={13} />
                        <span>Wipe & Reset Pipeline Only</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Confirm prompt */}
                {sandboxConfirmOpen && (
                  <div
                    style={{
                      marginTop: '1rem',
                      padding: '0.85rem 1rem',
                      borderRadius: '0.55rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertTriangle size={18} color="#10b981" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        Proceed with clearing old leads and injecting clean Test Colleges into Chat Home?
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setSandboxConfirmOpen(false)}
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: '0.4rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-medium)',
                          color: 'var(--text-muted)',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleExecuteSandboxInjection}
                        disabled={isInjectingSandbox}
                        style={{
                          padding: '0.35rem 0.85rem',
                          borderRadius: '0.4rem',
                          background: '#10b981',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: isInjectingSandbox ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isInjectingSandbox ? 'Injecting...' : 'Confirm Injection'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* TEST DATA PREVIEW CARDS */}
              <div>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Mock College Datasets to be Injected (4 Verified Real-Recipient Test Records)
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.85rem' }}>
                  {/* Test College 1 */}
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent-primary)', background: 'var(--dropdown-item-selected)', padding: '0.12rem 0.5rem', borderRadius: '0.35rem' }}>
                        TEST COLLEGE 1
                      </span>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--success)' }}>
                        22% Commission
                      </span>
                    </div>

                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Berlin Institute of Applied Technologies (Sandbox)
                    </div>

                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      📍 Berlin, Germany (Tiergarten Tech Campus)
                    </div>

                    <div style={{ fontSize: '0.76rem', color: 'var(--text-main)', background: 'var(--bg-card)', padding: '0.45rem 0.65rem', borderRadius: '0.45rem', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                        <Mail size={12} color="var(--accent-primary)" />
                        <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>rafiaquafqu@gmail.com</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        Liaison: Dr. Markus Weber (Head of Admissions)
                      </div>
                    </div>

                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      <div>• <strong>Tuition:</strong> €0 Public (Semester Fee €320)</div>
                      <div>• <strong>Language:</strong> A2 German / IELTS 6.0</div>
                      <div>• <strong>Programs:</strong> B.Sc. Applied AI, Cloud Architecture</div>
                    </div>
                  </div>

                  {/* Test College 2 */}
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#10b981', background: 'var(--success-bg)', padding: '0.12rem 0.5rem', borderRadius: '0.35rem' }}>
                        TEST COLLEGE 2
                      </span>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--success)' }}>
                        25% Commission (€3,500)
                      </span>
                    </div>

                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Munich Academy of Health & Nursing (Sandbox)
                    </div>

                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      📍 Munich, Germany (Schwabing Medical Center)
                    </div>

                    <div style={{ fontSize: '0.76rem', color: 'var(--text-main)', background: 'var(--bg-card)', padding: '0.45rem 0.65rem', borderRadius: '0.45rem', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                        <Mail size={12} color="#10b981" />
                        <span style={{ fontWeight: 700, color: '#10b981' }}>ilaproject075@gmail.com</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        Liaison: Prof. Dr. Elena Schneider (Nursing Director)
                      </div>
                    </div>

                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      <div>• <strong>Tuition:</strong> €0 Dual Ausbildung + €1,250/mo Stipend</div>
                      <div>• <strong>Language:</strong> B1 German Required</div>
                      <div>• <strong>Programs:</strong> Pflegefachmann, Physiotherapy</div>
                    </div>
                  </div>

                  {/* Test College 3 */}
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)', padding: '0.12rem 0.5rem', borderRadius: '0.35rem' }}>
                        TEST COLLEGE 3
                      </span>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--success)' }}>
                        20% Commission (€2,400)
                      </span>
                    </div>

                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Frankfurt International Business College (Sandbox)
                    </div>

                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      📍 Frankfurt am Main, Germany (Financial Tower)
                    </div>

                    <div style={{ fontSize: '0.76rem', color: 'var(--text-main)', background: 'var(--bg-card)', padding: '0.45rem 0.65rem', borderRadius: '0.45rem', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                        <Mail size={12} color="#f59e0b" />
                        <span style={{ fontWeight: 700, color: '#f59e0b' }}>classicraffi@gmail.com</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        Liaison: Julian Vance, MBA (Academic Dean)
                      </div>
                    </div>

                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      <div>• <strong>Tuition:</strong> €6,500 / year (Private FIBAA accredited)</div>
                      <div>• <strong>Language:</strong> 100% English (IELTS 6.5)</div>
                      <div>• <strong>Programs:</strong> MBA Fintech, Digital Banking</div>
                    </div>
                  </div>

                  {/* Test College 4 */}
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#06b6d4', background: 'rgba(6, 182, 212, 0.12)', padding: '0.12rem 0.5rem', borderRadius: '0.35rem' }}>
                        TEST COLLEGE 4
                      </span>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--success)' }}>
                        24% Commission (€3,100)
                      </span>
                    </div>

                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Hamburg Technical University of AI (Sandbox)
                    </div>

                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      📍 Hamburg, Germany (HafenCity Innovation)
                    </div>

                    <div style={{ fontSize: '0.76rem', color: 'var(--text-main)', background: 'var(--bg-card)', padding: '0.45rem 0.65rem', borderRadius: '0.45rem', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                        <Mail size={12} color="#06b6d4" />
                        <span style={{ fontWeight: 700, color: '#06b6d4' }}>ilaproject2026@gmail.com</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        Liaison: Dr. Clara Lindemann (VP Global Partnerships)
                      </div>
                    </div>

                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      <div>• <strong>Tuition:</strong> €7,200 / year (Siemens/Airbus Co-op)</div>
                      <div>• <strong>Language:</strong> 100% English (IELTS 6.5)</div>
                      <div>• <strong>Programs:</strong> M.Sc. Autonomous Robotics & AI</div>
                    </div>
                  </div>

                  {/* Test College 5 */}
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-medium)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#ec4899', background: 'rgba(236, 72, 153, 0.12)', padding: '0.12rem 0.5rem', borderRadius: '0.35rem' }}>
                        TEST COLLEGE 5
                      </span>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--success)' }}>
                        23% Commission (€2,800)
                      </span>
                    </div>

                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Munich International Innovation & AI Campus (Sandbox)
                    </div>

                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      📍 Munich, Germany (Garching Science Park)
                    </div>

                    <div style={{ fontSize: '0.76rem', color: 'var(--text-main)', background: 'var(--bg-card)', padding: '0.45rem 0.65rem', borderRadius: '0.45rem', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                        <Mail size={12} color="#ec4899" />
                        <span style={{ fontWeight: 700, color: '#ec4899' }}>rafiaquafqu@gmail.com</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        Liaison: Prof. Dr. Christian Meyer (Dean Global Alliances)
                      </div>
                    </div>

                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      <div>• <strong>Tuition:</strong> €5,200 / year (Private Applied Sciences)</div>
                      <div>• <strong>Language:</strong> 100% English (IELTS 6.5)</div>
                      <div>• <strong>Programs:</strong> M.Sc. Artificial Intelligence, Data Science</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={14} color="#10b981" />
            <span>ILA Global Tie-up Data Engine • Clean Sandbox Outreach Ready</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.42rem 1.1rem',
              borderRadius: '0.5rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-main)',
              fontSize: '0.82rem',
              fontWeight: 700,
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
