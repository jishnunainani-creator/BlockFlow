import React, { useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import {
  X,
  Bookmark,
  Plus,
  Play,
  Copy,
  Trash2,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({ isOpen, onClose }) => {
  const {
    templates,
    saveCurrentWeekAsTemplate,
    loadTemplate,
    deleteTemplate,
    duplicateTemplate,
    currentWeekScheduledBlocks,
  } = useTimetable();

  const [isCreating, setIsCreating] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');

  if (!isOpen) return null;

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;

    saveCurrentWeekAsTemplate(templateName.trim(), templateDesc.trim());
    setTemplateName('');
    setTemplateDesc('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl overflow-hidden relative text-slate-100 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Timetable Templates</h3>
              <p className="text-xs text-slate-400">Save & load reusable routine templates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Action: Create New Template from Current Schedule */}
        {!isCreating ? (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs tracking-wide shadow-lg mb-4 active:scale-98 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Save Current Week as Template ({currentWeekScheduledBlocks.length} items)</span>
          </button>
        ) : (
          <form onSubmit={handleSaveSubmit} className="p-4 rounded-2xl bg-slate-800/60 border border-indigo-500/30 mb-4 space-y-3 shrink-0">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Save New Template</h4>
            <div>
              <input
                type="text"
                required
                placeholder="Template Name (e.g. College Week, Exam Routine)"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Description / Notes (Optional)"
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow"
              >
                Save Preset
              </button>
            </div>
          </form>
        )}

        {/* Templates List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
          {templates.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
              No saved templates yet. Save your current schedule above.
            </div>
          ) : (
            templates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="p-4 rounded-2xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                    <h4 className="text-sm font-bold text-white truncate">{tmpl.name}</h4>
                  </div>
                  {tmpl.description && (
                    <p className="text-xs text-slate-400 mt-1 truncate">{tmpl.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 font-medium">
                    <span>{tmpl.blocks.length} scheduled blocks</span>
                    <span>•</span>
                    <span>Saved {new Date(tmpl.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      loadTemplate(tmpl.id);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow transition-colors"
                    title="Load template into active week"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Load</span>
                  </button>

                  <button
                    onClick={() => duplicateTemplate(tmpl.id)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-xl transition-colors"
                    title="Duplicate template"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => deleteTemplate(tmpl.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded-xl transition-colors"
                    title="Delete template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
