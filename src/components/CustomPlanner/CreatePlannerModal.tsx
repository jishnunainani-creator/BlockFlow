/**
 * Create Planner Modal
 * Modal for creating a new custom planner from starter templates or blank,
 * configuring name, description, icon, and accent color.
 */

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Layers,
  ArrowRight,
  GraduationCap,
  BookOpen,
  Calendar,
  Target,
  Dumbbell,
  FilePlus,
  Palette,
} from 'lucide-react';
import {
  CustomPlanner,
  PlannerRow,
  PlannerTemplateType,
} from '../../types/customPlanner';
import {
  STARTER_TEMPLATES_METADATA,
  createPlannerFromTemplate,
} from '../../utils/plannerTemplates';
import { getIconComponent } from '../../utils/iconLibrary';
import { IconPickerModal } from './IconPickerModal';

interface CreatePlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (planner: CustomPlanner, initialRows: PlannerRow[]) => void;
}

const COLOR_PRESETS = [
  '#4F73E3', // BlockFlow Indigo
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Rose
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#64748B', // Slate
];

export const CreatePlannerModal: React.FC<CreatePlannerModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<PlannerTemplateType>('exam_schedule');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('GraduationCap');
  const [accentColor, setAccentColor] = useState('#4F73E3');
  const [includeSampleData, setIncludeSampleData] = useState(true);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // 1 = Template pick, 2 = Customise details

  if (!isOpen) return null;

  const currentTemplateMeta =
    STARTER_TEMPLATES_METADATA.find((m) => m.id === selectedTemplate) ||
    STARTER_TEMPLATES_METADATA[0];

  const handleSelectTemplate = (templateType: PlannerTemplateType) => {
    setSelectedTemplate(templateType);
    const meta = STARTER_TEMPLATES_METADATA.find((m) => m.id === templateType);
    if (meta) {
      setName(meta.id === 'blank' ? '' : meta.title);
      setDescription(meta.id === 'blank' ? '' : meta.description);
      setIcon(meta.icon);
      setAccentColor(meta.accentColor);
      setIncludeSampleData(meta.id !== 'blank');
    }
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const { planner, rows } = createPlannerFromTemplate(
      selectedTemplate,
      name.trim(),
      description.trim()
    );

    planner.icon = icon;
    planner.accentColor = accentColor;

    onCreate(planner, includeSampleData ? rows : []);
    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setName('');
    setDescription('');
    setIcon('GraduationCap');
    setAccentColor('#4F73E3');
    setIncludeSampleData(true);
    onClose();
  };

  const SelectedIconComp = getIconComponent(icon);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-planner-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="create-planner-modal-title"
                className="text-base font-bold text-slate-900 dark:text-white"
              >
                {step === 1 ? 'Choose a Template' : 'Configure Your Planner'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {step === 1
                  ? 'Select a ready-to-use schedule template or start with a blank canvas'
                  : 'Customize the title, icon, and colors for your new schedule'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: TEMPLATE SELECTION */}
        {step === 1 && (
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STARTER_TEMPLATES_METADATA.map((tmpl) => {
                const IconComp = getIconComponent(tmpl.icon);
                const isSelected = selectedTemplate === tmpl.id;

                return (
                  <div
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl.id)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-500 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: tmpl.accentColor }}
                        >
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {tmpl.badge}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {tmpl.title}
                      </h3>
                      <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 mb-1">
                        {tmpl.subtitle}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {tmpl.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{tmpl.columnsCount} columns</span>
                      <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                        Select <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: CUSTOMISATION FORM */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Template Indicator */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs"
                  style={{ backgroundColor: currentTemplateMeta.accentColor }}
                >
                  <SelectedIconComp className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                    Template:
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {currentTemplateMeta.title} ({currentTemplateMeta.columnsCount} default columns)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Change template
              </button>
            </div>

            {/* Name & Icon Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Planner Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. End Semester Exam Schedule 2026"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Icon
                </label>
                <button
                  type="button"
                  onClick={() => setIsIconPickerOpen(true)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    <SelectedIconComp className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-medium truncate">{icon}</span>
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary or objective for this planner..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            {/* Accent Theme Color */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Theme Accent Color
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAccentColor(color)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      accentColor === color
                        ? 'scale-110 border-slate-900 dark:border-white shadow-md'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Include Sample Data Option */}
            {selectedTemplate !== 'blank' && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeSampleData}
                    onChange={(e) => setIncludeSampleData(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>
                    Populate planner with sample rows so I can see how it works
                  </span>
                </label>
              </div>
            )}
          </form>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
          {step === 1 ? (
            <div></div>
          ) : (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Back to templates
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            {step === 2 && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!name.trim()}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-sm transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create Planner</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 150+ Curated Icon Picker Modal */}
      <IconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        selectedIcon={icon}
        onSelectIcon={(newIcon) => setIcon(newIcon)}
      />
    </div>
  );
};
