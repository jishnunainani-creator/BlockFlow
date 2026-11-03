/**
 * "My Planners" Main Dashboard View
 * Lists all user planners, allows 1-click template quick-starts,
 * search, archiving, duplicating, backups, and detail workspace navigation.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Layers,
  Plus,
  Search,
  MoreVertical,
  Copy,
  Archive,
  RotateCcw,
  Trash2,
  Download,
  Upload,
  Calendar,
  Sparkles,
  ExternalLink,
  Table,
  CheckCircle2,
  AlertCircle,
  Palette,
} from 'lucide-react';
import {
  CustomPlanner,
  PlannerTemplateType,
  PlannerRow,
} from '../../types/customPlanner';
import {
  loadPlanners,
  savePlanners,
  savePlanner,
  deletePlanner,
  duplicatePlanner,
  archivePlanner,
  loadPlannerRows,
  savePlannerRows,
  exportAllPlannersBackup,
  importPlannerFromJson,
} from '../../utils/customPlannerStorage';
import {
  STARTER_TEMPLATES_METADATA,
  createPlannerFromTemplate,
} from '../../utils/plannerTemplates';
import { getIconComponent } from '../../utils/iconLibrary';
import { CreatePlannerModal } from '../CustomPlanner/CreatePlannerModal';
import { PlannerDetailView } from '../CustomPlanner/PlannerDetailView';
import { IconPickerModal } from '../CustomPlanner/IconPickerModal';

export const PlannersDashboardView: React.FC = () => {
  const [planners, setPlanners] = useState<CustomPlanner[]>(() => loadPlanners());
  const [activePlannerId, setActivePlannerId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isIconLibraryOpen, setIsIconLibraryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'active' | 'archived' | 'all'>('active');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with storage events
  const refreshPlanners = () => {
    setPlanners(loadPlanners());
  };

  useEffect(() => {
    window.addEventListener('blockflow_planners_changed', refreshPlanners);
    return () => window.removeEventListener('blockflow_planners_changed', refreshPlanners);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered planners
  const filteredPlanners = useMemo(() => {
    return planners.filter((p) => {
      // Tab filter
      if (filterTab === 'active' && p.isArchived) return false;
      if (filterTab === 'archived' && !p.isArchived) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchType = p.templateType.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchType) return false;
      }

      return true;
    });
  }, [planners, filterTab, searchQuery]);

  // Quick-start 1-click template creation
  const handleQuickStartTemplate = (templateType: PlannerTemplateType) => {
    const { planner, rows } = createPlannerFromTemplate(templateType);
    const existing = loadPlanners();
    savePlanners([planner, ...existing]);
    savePlannerRows(planner.id, rows);
    refreshPlanners();
    setActivePlannerId(planner.id);
    showToast(`Created "${planner.name}" from template`);
  };

  const handleCreateNewCustom = (planner: CustomPlanner, initialRows: PlannerRow[]) => {
    const existing = loadPlanners();
    savePlanners([planner, ...existing]);
    if (initialRows.length > 0) {
      savePlannerRows(planner.id, initialRows);
    }
    refreshPlanners();
    setActivePlannerId(planner.id);
    showToast(`Created "${planner.name}"`);
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const copy = duplicatePlanner(id);
    if (copy) {
      refreshPlanners();
      showToast(`Duplicated "${copy.name}"`);
    }
    setOpenMenuId(null);
  };

  const handleArchiveToggle = (id: string, currentlyArchived: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    archivePlanner(id, !currentlyArchived);
    refreshPlanners();
    showToast(currentlyArchived ? 'Restored planner from archive' : 'Archived planner');
    setOpenMenuId(null);
  };

  const handleDelete = (id: string) => {
    deletePlanner(id);
    refreshPlanners();
    setDeleteConfirmId(null);
    setOpenMenuId(null);
    showToast('Planner deleted');
  };

  // Full backup JSON export
  const handleExportAllBackup = () => {
    const backup = exportAllPlannersBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `blockflow_planners_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Exported planners backup file');
  };

  // Full backup JSON restore
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (parsed.type === 'custom_planners_backup' && Array.isArray(parsed.planners)) {
          // Batch backup package
          parsed.planners.forEach((item: any) => {
            if (item.planner) {
              importPlannerFromJson(item, 'create_new');
            }
          });
          refreshPlanners();
          showToast(`Successfully restored ${parsed.planners.length} planners from backup!`);
        } else if (parsed.planner || parsed.name) {
          // Single planner backup
          const imported = importPlannerFromJson(parsed, 'create_new');
          refreshPlanners();
          showToast(`Successfully imported "${imported.name}"!`);
        } else {
          alert('Unrecognized planner backup format.');
        }
      } catch (err: any) {
        alert(`Failed to parse backup JSON: ${err?.message || 'Invalid format'}`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // If a planner is opened in detail view, render PlannerDetailView
  const activePlanner = planners.find((p) => p.id === activePlannerId);
  if (activePlanner) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PlannerDetailView
          planner={activePlanner}
          onBack={() => setActivePlannerId(null)}
          onUpdatePlanner={(updated) => {
            savePlanner(updated);
            refreshPlanners();
          }}
          onDeletePlanner={(id) => {
            deletePlanner(id);
            refreshPlanners();
            setActivePlannerId(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold shadow-xl animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              My Planners
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Personalised schedule builders, exam timetables, trackers, and custom data tables.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsIconLibraryOpen(true)}
            title="Browse all 150+ curated icons across 15 categories"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Palette className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Icon Library (150+)</span>
          </button>

          <button
            onClick={handleExportAllBackup}
            title="Export all planners as JSON backup"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Backup All</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Restore planners from JSON backup"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restore Backup</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileRestore}
            className="hidden"
          />

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Planner</span>
          </button>
        </div>
      </div>

      {/* ── QUICK-START STARTER TEMPLATES BAR ── */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Quick-Start Templates</span>
          </h2>
          <span className="text-[11px] text-slate-400">Click to instantly create</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {STARTER_TEMPLATES_METADATA.map((tmpl) => {
            const IconComp = getIconComponent(tmpl.icon);
            return (
              <button
                key={tmpl.id}
                onClick={() => handleQuickStartTemplate(tmpl.id)}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-xs transition-all text-left flex flex-col justify-between group"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white mb-2 shrink-0 group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: tmpl.accentColor }}
                >
                  <IconComp className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {tmpl.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {tmpl.columnsCount} columns
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Filter Tabs */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
          <button
            onClick={() => setFilterTab('active')}
            className={`flex-1 sm:flex-none px-3 py-1 text-xs font-medium rounded-md transition-all ${
              filterTab === 'active'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Active ({planners.filter((p) => !p.isArchived).length})
          </button>
          <button
            onClick={() => setFilterTab('archived')}
            className={`flex-1 sm:flex-none px-3 py-1 text-xs font-medium rounded-md transition-all ${
              filterTab === 'archived'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Archived ({planners.filter((p) => p.isArchived).length})
          </button>
          <button
            onClick={() => setFilterTab('all')}
            className={`flex-1 sm:flex-none px-3 py-1 text-xs font-medium rounded-md transition-all ${
              filterTab === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All ({planners.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search planners by name or type..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* ── PLANNERS GRID ── */}
      {filteredPlanners.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {searchQuery ? 'No matching planners found' : 'No planners yet'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto mb-5">
            {searchQuery
              ? 'Try adjusting your search query or clear the filter.'
              : 'Create your first custom planner or select a template above to get started.'}
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Planner</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlanners.map((planner) => {
            const IconComp = getIconComponent(planner.icon);
            const rowCount = loadPlannerRows(planner.id).length;
            const updatedDate = new Date(planner.updatedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={planner.id}
                onClick={() => setActivePlannerId(planner.id)}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between"
              >
                <div>
                  {/* Top row: Icon + More menu */}
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: planner.accentColor || '#4F73E3' }}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === planner.id ? null : planner.id);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Options"
                        aria-label="Options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown menu */}
                      {openMenuId === planner.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-7 z-20 w-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-1 text-xs text-slate-700 dark:text-slate-300 animate-in fade-in"
                        >
                          <button
                            onClick={(e) => handleDuplicate(planner.id, e)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Duplicate</span>
                          </button>
                          <button
                            onClick={(e) => handleArchiveToggle(planner.id, planner.isArchived, e)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                          >
                            {planner.isArchived ? (
                              <>
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Unarchive</span>
                              </>
                            ) : (
                              <>
                                <Archive className="w-3.5 h-3.5" />
                                <span>Archive</span>
                              </>
                            )}
                          </button>
                          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(planner.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-left transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {planner.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {planner.description || 'No description provided'}
                  </p>
                </div>

                {/* Footer metadata */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {rowCount} {rowCount === 1 ? 'row' : 'rows'}
                    </span>
                    <span>•</span>
                    <span>{planner.columns.length} cols</span>
                  </div>

                  <span>Updated {updatedDate}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE PLANNER MODAL ── */}
      <CreatePlannerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateNewCustom}
      />

      {/* ── CURATED ICON LIBRARY BROWSER MODAL ── */}
      <IconPickerModal
        isOpen={isIconLibraryOpen}
        onClose={() => setIsIconLibraryOpen(false)}
        onSelectIcon={(iconName) => {
          showToast(`Selected icon: ${iconName}`);
          setIsIconLibraryOpen(false);
        }}
        title="BlockFlow Curated Icon Library (150+ Icons across 15 Categories)"
      />

      {/* ── DELETE PLANNER CONFIRMATION MODAL ── */}
      {deleteConfirmId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Delete this planner?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
              This will permanently delete this planner, all custom column structures, and its rows.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              >
                Delete Planner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
