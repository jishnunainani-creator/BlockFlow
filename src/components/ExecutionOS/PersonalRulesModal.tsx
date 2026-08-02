import React, { useState, useEffect } from 'react';
import { PersonalRule, PersonalRuleType } from '../../types/executionOS';
import { loadPersonalRules, savePersonalRules } from '../../utils/taskInboxStorage';
import { useTimetable } from '../../context/TimetableContext';
import { Sliders, Plus, Shield, Check, X, Trash2, Moon, Clock, Flame } from 'lucide-react';

interface PersonalRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PersonalRulesModal: React.FC<PersonalRulesModalProps> = ({ isOpen, onClose }) => {
  const { addToast } = useTimetable();
  const [rules, setRules] = useState<PersonalRule[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const [title, setTitle] = useState('');
  const [ruleType, setRuleType] = useState<PersonalRuleType>('no_work_after_time');
  const [priority, setPriority] = useState<'strict' | 'preference'>('strict');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRules(loadPersonalRules());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleRule = (id: string) => {
    const updated = rules.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r));
    setRules(updated);
    savePersonalRules(updated);
  };

  const handleTogglePriority = (id: string) => {
    const updated = rules.map((r) =>
      r.id === id ? { ...r, priority: r.priority === 'strict' ? ('preference' as const) : ('strict' as const) } : r
    );
    setRules(updated);
    savePersonalRules(updated);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newRule: PersonalRule = {
      id: `rule-${Date.now()}`,
      title: title.trim(),
      ruleType,
      priority,
      description: description.trim() || 'Custom planning constraint',
      isActive: true,
      timeValue: ruleType === 'no_work_after_time' ? 1320 : undefined,
    };

    const updated = [newRule, ...rules];
    setRules(updated);
    savePersonalRules(updated);

    setTitle('');
    setDescription('');
    setShowAdd(false);
    addToast(`Added Personal Planning Rule: "${newRule.title}"! 🛡️`, 'success');
  };

  const handleDeleteRule = (id: string) => {
    const updated = rules.filter((r) => r.id !== id);
    setRules(updated);
    savePersonalRules(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-5 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase flex items-center gap-1">
              <Shield size={12} /> Execution OS Constraints
            </span>
            <h3 className="text-lg font-black text-white mt-0.5">Personal Planning Rules</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Rules guide the Central Planning Engine when generating or rescheduling timetable slots. Strict rules are never violated automatically.
        </p>

        <div className="overflow-y-auto space-y-3 flex-1 pr-1">
          {rules.map((r) => (
            <div
              key={r.id}
              className={`p-4 rounded-2xl border transition-all ${
                r.isActive ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-950/40 border-slate-800/50 text-slate-500'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">{r.title}</h4>
                    <button
                      onClick={() => handleTogglePriority(r.id)}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${
                        r.priority === 'strict'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {r.priority} Constraint
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">{r.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={r.isActive}
                    onChange={() => handleToggleRule(r.id)}
                    className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                  />
                  <button onClick={() => handleDeleteRule(r.id)} className="text-slate-500 hover:text-rose-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {showAdd && (
            <form onSubmit={handleAddRule} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase">Add Custom Planning Rule</h4>
              <input
                type="text"
                required
                placeholder="Rule Title (e.g. Protect 5 PM for Gym Workout)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="no_work_after_time">No Work After Time</option>
                  <option value="min_break_between_blocks">Min Recovery Break</option>
                  <option value="max_daily_hours">Max Daily Focus Hours</option>
                  <option value="protect_workout_slot">Protect Workout Slot</option>
                </select>

                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-900 rounded-xl text-xs text-white"
                >
                  <option value="strict">Strict (Never Violate)</option>
                  <option value="preference">Preference (Soft)</option>
                </select>
              </div>

              <button type="submit" className="w-full py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl">
                Save Custom Rule
              </button>
            </form>
          )}
        </div>

        <div className="pt-2 flex justify-between items-center border-t border-slate-800">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1"
          >
            <Plus size={14} /> + Add Custom Rule
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
