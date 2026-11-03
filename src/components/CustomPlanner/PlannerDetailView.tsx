/**
 * Planner Detail View Workspace
 * Displays the active planner with full toolbar, 3 view modes (Table, Card, Calendar),
 * inline search, column management, CSV import/export, and JSON backups.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  Table,
  LayoutGrid,
  Calendar,
  Plus,
  SlidersHorizontal,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  MoreVertical,
  Check,
  Trash2,
  Copy,
  Sparkles,
  Filter,
  CheckCircle2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import {
  CustomPlanner,
  PlannerColumn,
  PlannerRow,
  PlannerDisplayMode,
  TableDensity,
} from '../../types/customPlanner';
import {
  loadPlannerRows,
  savePlannerRows,
  addPlannerRow,
  updatePlannerRow,
  deletePlannerRow,
  updatePlannerColumns,
  savePlanner,
  exportPlannerToJson,
} from '../../utils/customPlannerStorage';
import { exportPlannerToCsv } from '../../utils/customPlannerCsv';
import { getIconComponent } from '../../utils/iconLibrary';
import { ExamBanner } from './ExamBanner';
import { PlannerTableView } from './PlannerTableView';
import { PlannerCardView } from './PlannerCardView';
import { PlannerCalendarView } from './PlannerCalendarView';
import { RowEditModal } from './RowEditModal';
import { ColumnConfigModal } from './ColumnConfigModal';
import { PlannerCsvImportModal } from './PlannerCsvImportModal';

interface PlannerDetailViewProps {
  planner: CustomPlanner;
  onBack: () => void;
  onUpdatePlanner?: (updated: CustomPlanner) => void;
  onDeletePlanner?: (plannerId: string) => void;
}

export const PlannerDetailView: React.FC<PlannerDetailViewProps> = ({
  planner,
  onBack,
  onUpdatePlanner,
  onDeletePlanner,
}) => {
  const [currentPlanner, setCurrentPlanner] = useState<CustomPlanner>(planner);
  const [rows, setRows] = useState<PlannerRow[]>(() => loadPlannerRows(planner.id));
  const [viewMode, setViewMode] = useState<PlannerDisplayMode>(planner.defaultView || 'table');
  const [density, setDensity] = useState<TableDensity>(planner.density || 'comfortable');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframeFilter, setTimeframeFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');

  // Modals state
  const [isRowModalOpen, setIsRowModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<PlannerRow | null>(null);
  const [newRowInitialValues, setNewRowInitialValues] = useState<Record<string, any>>({});
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [deleteConfirmRowId, setDeleteConfirmRowId] = useState<string | null>(null);

  // Sync rows if storage event fires externally
  const refreshRows = useCallback(() => {
    const updated = loadPlannerRows(currentPlanner.id);
    setRows(updated);
  }, [currentPlanner.id]);

  useEffect(() => {
    const handleStorageChange = (e: any) => {
      if (!e.detail?.plannerId || e.detail?.plannerId === currentPlanner.id) {
        refreshRows();
      }
    };
    window.addEventListener('blockflow_planners_changed', handleStorageChange);
    return () => window.removeEventListener('blockflow_planners_changed', handleStorageChange);
  }, [currentPlanner.id, refreshRows]);

  // Detect semantic filter columns
  const dateCol = useMemo(
    () => currentPlanner.columns.find((c) => c.type === 'date'),
    [currentPlanner.columns]
  );
  const statusCol = useMemo(
    () => currentPlanner.columns.find((c) => c.type === 'status' || c.type === 'dropdown'),
    [currentPlanner.columns]
  );
  const courseCol = useMemo(
    () =>
      currentPlanner.columns.find(
        (c) =>
          c.type === 'text' &&
          (c.name.toLowerCase().includes('code') ||
            c.name.toLowerCase().includes('course') ||
            c.name.toLowerCase().includes('subject'))
      ),
    [currentPlanner.columns]
  );

  // Available unique filter values
  const courseOptions = useMemo(() => {
    if (!courseCol) return [];
    const set = new Set<string>();
    rows.forEach((r) => {
      const val = r.values[courseCol.id];
      if (val && typeof val === 'string' && val.trim()) {
        set.add(val.trim());
      }
    });
    return Array.from(set).sort();
  }, [rows, courseCol]);

  const statusOptions = useMemo(() => {
    if (!statusCol) return [];
    if (statusCol.options && statusCol.options.length > 0) {
      return statusCol.options;
    }
    const set = new Set<string>();
    rows.forEach((r) => {
      const val = r.values[statusCol.id];
      if (val && typeof val === 'string' && val.trim()) {
        set.add(val.trim());
      }
    });
    return Array.from(set).map((s) => ({ id: s, label: s, color: '#6366F1' }));
  }, [rows, statusCol]);

  // Filtered rows based on timeframe, status, and course
  const displayRows = useMemo(() => {
    let list = [...rows];
    const todayStr = new Date().toISOString().slice(0, 10);

    // Timeframe filter (upcoming vs completed)
    if (timeframeFilter !== 'all' && dateCol) {
      if (timeframeFilter === 'upcoming') {
        list = list.filter((r) => {
          const d = String(r.values[dateCol.id] || '');
          const isCompleted =
            statusCol &&
            String(r.values[statusCol.id] || '').toLowerCase().includes('complet');
          return d >= todayStr && !isCompleted;
        });
      } else if (timeframeFilter === 'completed') {
        list = list.filter((r) => {
          const d = String(r.values[dateCol.id] || '');
          const isCompleted =
            statusCol &&
            String(r.values[statusCol.id] || '').toLowerCase().includes('complet');
          return isCompleted || (d && d < todayStr);
        });
      }
    }

    // Status filter
    if (statusFilter !== 'all' && statusCol) {
      list = list.filter((r) => String(r.values[statusCol.id]) === statusFilter);
    }

    // Course filter
    if (courseFilter !== 'all' && courseCol) {
      list = list.filter((r) => String(r.values[courseCol.id]) === courseFilter);
    }

    return list;
  }, [rows, timeframeFilter, statusFilter, courseFilter, dateCol, statusCol, courseCol]);

  // Reset filters
  const hasActiveFilters =
    timeframeFilter !== 'all' || statusFilter !== 'all' || courseFilter !== 'all';

  const handleResetFilters = () => {
    setTimeframeFilter('all');
    setStatusFilter('all');
    setCourseFilter('all');
    setSearchQuery('');
  };

  // Keep internal planner synced with props
  useEffect(() => {
    setCurrentPlanner(planner);
    refreshRows();
  }, [planner, refreshRows]);

  // Handle row additions or updates
  const handleSaveRow = (values: Record<string, any>) => {
    if (editingRow) {
      updatePlannerRow(currentPlanner.id, editingRow.id, values);
    } else {
      addPlannerRow(currentPlanner.id, values);
    }
    refreshRows();
    setIsRowModalOpen(false);
    setEditingRow(null);
    setNewRowInitialValues({});
  };

  const handleEditRow = (row: PlannerRow) => {
    setEditingRow(row);
    setIsRowModalOpen(true);
  };

  const handleDeleteRow = (rowId: string) => {
    deletePlannerRow(currentPlanner.id, rowId);
    refreshRows();
    setDeleteConfirmRowId(null);
  };

  const handleUpdateRowValuesInline = (rowId: string, values: Record<string, any>) => {
    updatePlannerRow(currentPlanner.id, rowId, values);
    refreshRows();
  };

  const handleAddRowClick = () => {
    setEditingRow(null);
    setNewRowInitialValues({});
    setIsRowModalOpen(true);
  };

  const handleAddRowWithDate = (dateStr: string) => {
    setEditingRow(null);
    const dateCol = currentPlanner.columns.find((c) => c.type === 'date');
    if (dateCol) {
      setNewRowInitialValues({ [dateCol.id]: dateStr });
    }
    setIsRowModalOpen(true);
  };

  // Handle column configuration updates
  const handleSaveColumns = (updatedColumns: PlannerColumn[]) => {
    updatePlannerColumns(currentPlanner.id, updatedColumns);
    const updated = { ...currentPlanner, columns: updatedColumns };
    setCurrentPlanner(updated);
    if (onUpdatePlanner) onUpdatePlanner(updated);
    refreshRows();
  };

  // Handle density toggle
  const handleToggleDensity = () => {
    const nextDensity: TableDensity = density === 'comfortable' ? 'compact' : 'comfortable';
    setDensity(nextDensity);
    const updated = { ...currentPlanner, density: nextDensity };
    setCurrentPlanner(updated);
    savePlanner(updated);
    if (onUpdatePlanner) onUpdatePlanner(updated);
  };

  // Handle CSV export
  const handleExportCsv = () => {
    const csvContent = exportPlannerToCsv(currentPlanner, rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentPlanner.name.replace(/[^a-z0-9]/gi, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle JSON backup export
  const handleExportJson = () => {
    const exportData = exportPlannerToJson(currentPlanner.id);
    if (!exportData) return;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentPlanner.name.replace(/[^a-z0-9]/gi, '_')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle CSV import
  const handleCsvImport = (importedRows: PlannerRow[], replace: boolean) => {
    if (replace) {
      savePlannerRows(currentPlanner.id, importedRows);
    } else {
      const combined = [...rows, ...importedRows].map((r, i) => ({ ...r, order: i }));
      savePlannerRows(currentPlanner.id, combined);
    }
    refreshRows();
  };

  const PlannerIcon = getIconComponent(currentPlanner.icon);

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* ── TOP HEADER & NAVIGATION ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back to Planners"
            aria-label="Back to Planners"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
            style={{ backgroundColor: currentPlanner.accentColor || '#4F73E3' }}
          >
            <PlannerIcon className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {currentPlanner.name}
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {currentPlanner.templateType.replace('_', ' ')}
              </span>
            </div>
            {currentPlanner.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {currentPlanner.description}
              </p>
            )}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          <button
            onClick={handleExportCsv}
            title="Export CSV spreadsheet"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => setIsCsvImportOpen(true)}
            title="Import CSV spreadsheet"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>

          <button
            onClick={() => setIsColumnModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Columns ({currentPlanner.columns.length})</span>
          </button>

          <button
            onClick={handleAddRowClick}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Row</span>
          </button>
        </div>
      </div>

      {/* ── EXAMINATION SCHEDULE SPECIALIZED BANNER ── */}
      {currentPlanner.templateType === 'exam_schedule' && (
        <ExamBanner rows={rows} columns={currentPlanner.columns} />
      )}

      {/* ── TOOLBAR: VIEW SWITCHER, SEARCH, DENSITY ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* View Mode Switcher */}
        <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              viewMode === 'card'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Cards</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
              viewMode === 'calendar'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </button>
        </div>

        {/* Search & Density Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {viewMode === 'table' && (
            <button
              onClick={handleToggleDensity}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors whitespace-nowrap"
              title={`Switch to ${density === 'comfortable' ? 'compact' : 'comfortable'} row density`}
            >
              {density === 'comfortable' ? 'Compact' : 'Comfortable'}
            </button>
          )}

          <div className="text-xs text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap hidden sm:block">
            {displayRows.length} of {rows.length} {rows.length === 1 ? 'row' : 'rows'}
          </div>
        </div>
      </div>

      {/* ── FILTER CHIPS BAR (TIMEFRAME, COURSE, STATUS) ── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-slate-50/70 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>

          {/* Timeframe Filter (Upcoming / Completed / All) */}
          {dateCol && (
            <div className="flex items-center p-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setTimeframeFilter('all')}
                className={`px-2.5 py-1 text-[11px] rounded font-medium transition-colors ${
                  timeframeFilter === 'all'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setTimeframeFilter('upcoming')}
                className={`px-2.5 py-1 text-[11px] rounded font-medium transition-colors flex items-center gap-1 ${
                  timeframeFilter === 'upcoming'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Upcoming</span>
              </button>
              <button
                type="button"
                onClick={() => setTimeframeFilter('completed')}
                className={`px-2.5 py-1 text-[11px] rounded font-medium transition-colors flex items-center gap-1 ${
                  timeframeFilter === 'completed'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Completed</span>
              </button>
            </div>
          )}

          {/* Course / Subject Filter Dropdown */}
          {courseOptions.length > 0 && (
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="all">All Courses / Subjects</option>
              {courseOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter Dropdown */}
          {statusOptions.length > 0 && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* ── ACTIVE VIEW DISPLAY ── */}
      {viewMode === 'table' && (
        <PlannerTableView
          columns={currentPlanner.columns}
          rows={displayRows}
          density={density}
          onEditRow={handleEditRow}
          onDeleteRow={(rowId) => setDeleteConfirmRowId(rowId)}
          onUpdateRowValues={handleUpdateRowValuesInline}
          searchQuery={searchQuery}
        />
      )}

      {viewMode === 'card' && (
        <PlannerCardView
          columns={currentPlanner.columns}
          rows={displayRows}
          onEditRow={handleEditRow}
          onDeleteRow={(rowId) => setDeleteConfirmRowId(rowId)}
          searchQuery={searchQuery}
        />
      )}

      {viewMode === 'calendar' && (
        <PlannerCalendarView
          columns={currentPlanner.columns}
          rows={displayRows}
          onEditRow={handleEditRow}
          onAddRowWithDate={handleAddRowWithDate}
          accentColor={currentPlanner.accentColor}
        />
      )}

      {/* ── ROW EDIT / CREATE MODAL ── */}
      <RowEditModal
        isOpen={isRowModalOpen}
        onClose={() => {
          setIsRowModalOpen(false);
          setEditingRow(null);
          setNewRowInitialValues({});
        }}
        onSave={handleSaveRow}
        columns={currentPlanner.columns}
        initialValues={editingRow ? editingRow.values : newRowInitialValues}
        title={editingRow ? 'Edit Entry' : 'Add New Entry'}
      />

      {/* ── COLUMN CONFIGURATION MODAL ── */}
      <ColumnConfigModal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        columns={currentPlanner.columns}
        onSaveColumns={handleSaveColumns}
      />

      {/* ── CSV IMPORT MODAL ── */}
      <PlannerCsvImportModal
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
        plannerId={currentPlanner.id}
        columns={currentPlanner.columns}
        onImport={handleCsvImport}
      />

      {/* ── ROW DELETE CONFIRMATION MODAL ── */}
      {deleteConfirmRowId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Delete this entry?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
              This action cannot be undone. All values in this row will be permanently removed.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmRowId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRow(deleteConfirmRowId)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              >
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
