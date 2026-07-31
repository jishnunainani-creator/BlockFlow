import React, { useState, useEffect } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import {
  parseNaturalLanguageSchedule,
  parseTimetableScheduleText,
  ParsedScheduleResult,
} from '../../utils/aiNaturalLanguageParser';
import { minutesToTimeStr, DAYS_OF_WEEK } from '../../utils/timeUtils';
import {
  Mic,
  MicOff,
  Keyboard,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Plus,
  ArrowRight,
} from 'lucide-react';

interface AIScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'voice' | 'text' | 'import';
}

export const AIScheduleModal: React.FC<AIScheduleModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'voice',
}) => {
  const { currentWeekScheduledBlocks, addScheduledBlock, addToast, currentWeekId } = useTimetable();

  const [activeTab, setActiveTab] = useState<'voice' | 'text' | 'import'>(initialTab);

  // 1. Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState('');

  // 2. Text State
  const [inputText, setInputText] = useState('');

  // 3. Import State
  const [importText, setImportText] = useState(
    `Monday\n9:00-10:30 Data Structures Graphs\n11:00-12:30 DBMS Concepts\n14:00-16:00 OOP Laboratory\n\nTuesday\n8:00-9:30 DSA Practice\n10:00-12:00 CAT Quantitative Mock`
  );

  // Parsed Preview & Conflict State
  const [parsedPreview, setParsedPreview] = useState<ParsedScheduleResult | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  // Speech Recognition API setup
  const handleToggleVoiceRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      addToast('Voice Speech Recognition is not supported in this browser. Transitioning to Text input mode.', 'warning');
      setActiveTab('text');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        addToast('Listening... Speak naturally! 🎤', 'info');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceText(transcript);
        setIsRecording(false);
        const parsed = parseNaturalLanguageSchedule(transcript, currentWeekScheduledBlocks);
        setParsedPreview(parsed);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        addToast('Could not access microphone or error occurred. Switching to Text mode.', 'warning');
        setActiveTab('text');
      };

      recognition.start();
    } catch (e) {
      setIsRecording(false);
      setActiveTab('text');
    }
  };

  const handleParseText = (textToParse: string) => {
    if (!textToParse.trim()) return;
    const parsed = parseNaturalLanguageSchedule(textToParse, currentWeekScheduledBlocks);
    setParsedPreview(parsed);
  };

  const handleConfirmSchedule = (customStartMinutes?: number) => {
    if (!parsedPreview) return;

    const startMin = customStartMinutes !== undefined ? customStartMinutes : parsedPreview.startMinutes;

    addScheduledBlock({
      blockId: `ai-voice-${Date.now()}`,
      title: parsedPreview.title,
      description: parsedPreview.description,
      color: parsedPreview.category === 'Study' ? '#8B5CF6' : parsedPreview.category === 'Health' ? '#F43F5E' : '#6366F1',
      priority: parsedPreview.priority,
      icon: 'sparkles',
      dayOfWeek: parsedPreview.dayOfWeek,
      startMinutes: startMin,
      duration: parsedPreview.duration,
      status: 'not_started',
    });

    addToast(`Scheduled "${parsedPreview.title}" for ${DAYS_OF_WEEK[parsedPreview.dayOfWeek].full} at ${minutesToTimeStr(startMin)}! ✨`, 'success');
    setParsedPreview(null);
    setVoiceText('');
    setInputText('');
    onClose();
  };

  const handleImportScheduleText = () => {
    const importedBlocks = parseTimetableScheduleText(importText);
    if (importedBlocks.length === 0) {
      addToast('Could not parse any timetable lines. Ensure lines follow "9:00-10:30 Course Name".', 'warning');
      return;
    }

    importedBlocks.forEach((b) => {
      addScheduledBlock(b);
    });

    addToast(`Successfully imported ${importedBlocks.length} timetable activities! 🎉`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Three AI Scheduling Methods</h2>
              <p className="text-xs text-slate-400">Speak, type, or paste schedules to populate your timetable</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 border-b border-slate-800 text-xs font-semibold bg-slate-950/50 p-1 gap-1">
          <button
            onClick={() => { setActiveTab('voice'); setParsedPreview(null); }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'voice' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>🎤 Voice</span>
          </button>

          <button
            onClick={() => { setActiveTab('text'); setParsedPreview(null); }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'text' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>⌨️ Smart Text</span>
          </button>

          <button
            onClick={() => { setActiveTab('import'); setParsedPreview(null); }}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'import' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>📄 Schedule Import</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* TAB 1: VOICE */}
          {activeTab === 'voice' && (
            <div className="text-center space-y-5">
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <button
                  onClick={handleToggleVoiceRecording}
                  className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center transition-all shadow-xl ${
                    isRecording
                      ? 'bg-rose-600 text-white animate-pulse ring-8 ring-rose-500/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>

                <p className="text-xs text-slate-300 font-medium">
                  {isRecording ? 'Listening... Speak naturally now' : 'Click microphone to start voice recording'}
                </p>
              </div>

              <div className="text-left space-y-1.5 text-xs text-slate-400">
                <span className="font-bold text-slate-300 block">Try speaking:</span>
                <p className="italic bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-300">
                  "Schedule DSA tomorrow from 9 to 10:30. Topic Graphs. Priority High."
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: SMART TEXT */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">Type Intent</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Study Operating Systems tonight for 90 minutes"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleParseText(inputText)}
                    className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => handleParseText(inputText)}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow"
                  >
                    Parse
                  </button>
                </div>
              </div>

              {/* Example Chips */}
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {['Book Gym Mon, Wed, Fri at 6 PM', 'Study Operating Systems tonight for 90 minutes', 'Schedule CAT mock test Sunday morning'].map((ex) => (
                  <button
                    key={ex}
                    onClick={() => { setInputText(ex); handleParseText(ex); }}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SCHEDULE IMPORT */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">Paste College / Exam Timetable Text</label>
                <textarea
                  rows={6}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <button
                onClick={handleImportScheduleText}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Extract & Populate Timetable</span>
              </button>
            </div>
          )}

          {/* ── AI CONFIRMATION & CONFLICT DETECTOR PREVIEW ── */}
          {parsedPreview && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3 animate-fade-in text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>AI Schedule Confirmation Preview</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 uppercase">
                  {parsedPreview.category}
                </span>
              </div>

              <div className="space-y-1 text-slate-300">
                <p><span className="text-slate-500 font-semibold">Title:</span> <strong className="text-white">{parsedPreview.title}</strong></p>
                <p><span className="text-slate-500 font-semibold">Day & Time:</span> {DAYS_OF_WEEK[parsedPreview.dayOfWeek].full} at {minutesToTimeStr(parsedPreview.startMinutes)} ({parsedPreview.duration} mins)</p>
              </div>

              {/* Conflict Alert Banner */}
              {parsedPreview.hasConflict && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Intelligent Conflict Detected</span>
                  </div>
                  <p className="text-[11px] text-slate-300">{parsedPreview.conflictMessage}</p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {parsedPreview.suggestedStartMinutes && (
                      <button
                        onClick={() => handleConfirmSchedule(parsedPreview.suggestedStartMinutes)}
                        className="px-3 py-1 bg-indigo-600 text-white font-bold rounded-lg text-[10px]"
                      >
                        Shift to {minutesToTimeStr(parsedPreview.suggestedStartMinutes)}
                      </button>
                    )}
                    <button
                      onClick={() => handleConfirmSchedule()}
                      className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg text-[10px]"
                    >
                      Replace Existing Event
                    </button>
                  </div>
                </div>
              )}

              {!parsedPreview.hasConflict && (
                <button
                  onClick={() => handleConfirmSchedule()}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Confirm & Save to Timetable</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
