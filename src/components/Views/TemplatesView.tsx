import React, { useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { TimetableTemplate } from '../../types/timetable';
import { NavView } from '../Navigation/Sidebar';
import { formatDuration } from '../../utils/timeUtils';
import {
  Bookmark,
  Plus,
  Copy,
  Trash2,
  Play,
  Calendar,
  Check,
  Sparkles,
  Layers,
} from 'lucide-react';

interface TemplatesViewProps {
  onNavigate: (view: NavView) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ onNavigate }) => {
  const {
    templates,
    loadTemplate,
    deleteTemplate,
    duplicateTemplate,
    saveCurrentWeekAsTemplate,
    currentWeekScheduledBlocks,
  } = useTimetable();

  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSaveCurrentWeek = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;
    saveCurrentWeekAsTemplate(newTemplateName.trim(), newTemplateDesc.trim());
    setNewTemplateName('');
    setNewTemplateDesc('');
    setIsCreating(false);
  };

  const handleLoadAndGoToCalendar = (id: string) => {
    loadTemplate(id);
    onNavigate('calendar');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6 select-none scrollbar-thin">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-purple-400" />
            <span>Weekly Routine Templates</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Save, duplicate, and instantly apply full week routine schedules ({templates.length} templates)
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Save Current Week as Template</span>
        </button>
      </div>

      {/* Save Template Creation Form */}
      {isCreating && (
        <form
          onSubmit={handleSaveCurrentWeek}
          className="p-5 rounded-2xl bg-slate-900 border border-purple-500/30 space-y-4 shadow-lg animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Save Active Timetable as Template</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Template Name</label>
              <input
                type="text"
                required
                placeholder="e.g. College Exam Week, Internship Sprint"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Heavy DSA practice & morning lectures"
                value={newTemplateDesc}
                onChange={(e) => setNewTemplateDesc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save Template ({currentWeekScheduledBlocks.length} blocks)
            </button>
          </div>
        </form>
      )}

      {/* Main Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {templates.map((tmpl) => {
          const totalDurationMinutes = tmpl.blocks.reduce((acc, b) => acc + b.duration, 0);

          return (
            <div
              key={tmpl.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 shadow-sm flex flex-col justify-between space-y-4 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">{tmpl.name}</h3>
                    {tmpl.description && (
                      <p className="text-xs text-slate-400 mt-1">{tmpl.description}</p>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 shrink-0">
                    {tmpl.blocks.length} blocks
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 pt-1 font-medium">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{(totalDurationMinutes / 60).toFixed(1)} hours scheduled</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-4 border-t border-slate-800">
                <button
                  onClick={() => handleLoadAndGoToCalendar(tmpl.id)}
                  className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Apply to Timetable</span>
                </button>

                <button
                  onClick={() => duplicateTemplate(tmpl.id)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
                  title="Duplicate Template"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => deleteTemplate(tmpl.id)}
                  className="p-2 text-slate-400 hover:text-rose-400 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors"
                  title="Delete Template"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
