import React, { useState } from 'react';
import { useExecution } from '../../context/ExecutionContext';
import { DailyReflection, DayRating, EnergyLevel, DistractionType, DAY_RATING_CONFIG, ENERGY_CONFIG, DISTRACTION_OPTIONS } from '../../types/execution';
import { X, ChevronLeft, ChevronRight, Save, SkipForward } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyReflectionModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { saveDailyReflection } = useExecution();
  const [step, setStep] = useState(1);
  const totalSteps = 10;

  const [reflection, setReflection] = useState<Partial<DailyReflection>>({
    dayRating: 'good',
    energyLevel: 'moderate',
    focusRating: 5,
    scheduleRealistic: 'yes',
    distractions: [],
  });

  if (!isOpen) return null;

  const handleSave = () => {
    const today = new Date().toISOString().split('T')[0];
    saveDailyReflection({
      date: today,
      dayRating: reflection.dayRating || 'good',
      whatWentWell: reflection.whatWentWell || '',
      whatPreventedWork: reflection.whatPreventedWork || '',
      improveTomorrow: reflection.improveTomorrow || '',
      gratitude: reflection.gratitude || '',
      energyLevel: reflection.energyLevel || 'moderate',
      focusRating: reflection.focusRating || 5,
      scheduleRealistic: reflection.scheduleRealistic || 'yes',
      distractions: (reflection.distractions || []) as DistractionType[],
      additionalThoughts: reflection.additionalThoughts || '',
      createdAt: Date.now(),
    });
    setStep(1);
    onClose();
  };

  const handleNext = () => { if (step < totalSteps) setStep(step + 1); };
  const handleBack = () => { if (step > 1) setStep(step - 1); };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-800 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header + Progress */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Daily Reflection</h2>
            <span className="text-[10px] text-slate-400 font-semibold">Step {step} of {totalSteps}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 bg-slate-800">
          <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>

        {/* Step Content */}
        <div className="p-6 min-h-[280px]">
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-white mb-6">How would you rate your day?</h2>
              <div className="flex flex-wrap gap-3 justify-center">
                {(Object.entries(DAY_RATING_CONFIG) as [DayRating, typeof DAY_RATING_CONFIG[DayRating]][]).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setReflection({ ...reflection, dayRating: key })}
                    className={`flex flex-col items-center p-4 rounded-2xl border transition-all min-w-[80px] ${
                      reflection.dayRating === key ? 'bg-indigo-600/20 border-indigo-500 scale-105 shadow-lg shadow-indigo-500/10' : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-2xl mb-1">{config.emoji}</span>
                    <span className="text-[10px] font-bold text-slate-300">{config.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-white mb-6">What went well today?</h2>
              <textarea
                value={reflection.whatWentWell || ''}
                onChange={e => setReflection({ ...reflection, whatWentWell: e.target.value })}
                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                placeholder="Celebrate your wins..."
              />
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-white mb-6">What prevented you from completing your work?</h2>
              <textarea
                value={reflection.whatPreventedWork || ''}
                onChange={e => setReflection({ ...reflection, whatPreventedWork: e.target.value })}
                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                placeholder="Any obstacles or challenges..."
              />
            </div>
          )}
          
          {step === 4 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-white mb-6">One improvement for tomorrow?</h2>
              <textarea
                value={reflection.improveTomorrow || ''}
                onChange={e => setReflection({ ...reflection, improveTomorrow: e.target.value })}
                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                placeholder="How can you make tomorrow better?"
              />
            </div>
          )}

          {step === 5 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-white mb-6">What are you grateful for?</h2>
              <textarea
                value={reflection.gratitude || ''}
                onChange={e => setReflection({ ...reflection, gratitude: e.target.value })}
                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                placeholder="Take a moment to appreciate..."
              />
            </div>
          )}

          {step === 6 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-white mb-6">How was your energy?</h2>
              <div className="flex flex-col gap-2">
                {(Object.entries(ENERGY_CONFIG) as [EnergyLevel, typeof ENERGY_CONFIG[EnergyLevel]][]).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setReflection({ ...reflection, energyLevel: key })}
                    className={`flex items-center p-3 rounded-xl border transition-all ${
                      reflection.energyLevel === key ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: config.color }} />
                    <span className="text-sm font-semibold text-slate-200">{config.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-white mb-6">Rate your focus (1-10)</h2>
              <div className="py-8">
                <input
                  type="range"
                  min="1" max="10"
                  value={reflection.focusRating || 5}
                  onChange={e => setReflection({ ...reflection, focusRating: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between mt-4 text-slate-400 font-semibold text-xs">
                  <span>1 (Distracted)</span>
                  <span className="text-indigo-400 text-lg">{reflection.focusRating || 5}</span>
                  <span>10 (Flow)</span>
                </div>
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-white mb-6">Was your schedule realistic?</h2>
              <div className="flex gap-3">
                {(['yes', 'somewhat', 'no'] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => setReflection({ ...reflection, scheduleRealistic: opt })}
                    className={`flex-1 py-3 rounded-xl border font-semibold text-sm transition-all capitalize ${
                      reflection.scheduleRealistic === opt ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 9 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-white mb-6">Biggest Distractions</h2>
              <div className="flex flex-wrap gap-2">
                {DISTRACTION_OPTIONS.map(opt => {
                  const isSelected = (reflection.distractions || []).includes(opt.type);
                  return (
                    <button
                      key={opt.type}
                      onClick={() => {
                        const current = reflection.distractions || [];
                        const next = isSelected ? current.filter(x => x !== opt.type) : [...current, opt.type];
                        setReflection({ ...reflection, distractions: next });
                      }}
                      className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                        isSelected ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 10 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold text-white mb-6">Any additional thoughts?</h2>
              <textarea
                value={reflection.additionalThoughts || ''}
                onChange={e => setReflection({ ...reflection, additionalThoughts: e.target.value })}
                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                placeholder="Optional journal entry..."
              />
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-5 border-t border-slate-800 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button onClick={handleBack} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white font-semibold transition-colors">
                <ChevronLeft size={14} /> Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step < totalSteps && (
              <button onClick={handleNext} className="text-xs text-slate-500 hover:text-slate-300 font-semibold flex items-center gap-1 transition-colors">
                <SkipForward size={12} /> Skip
              </button>
            )}
            {step < totalSteps ? (
              <button onClick={handleNext} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors">
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={handleSave} className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all">
                <Save size={14} /> Save Reflection
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
