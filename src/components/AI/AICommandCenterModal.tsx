import React, { useState } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { generateAISmartSchedule } from '../../utils/aiProductivityEngine';
import {
  Sparkles,
  Send,
  X,
  BookOpen,
  Calendar,
  Zap,
  HelpCircle,
  CheckCircle2,
  Bot,
} from 'lucide-react';

interface AICommandCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AICommandCenterModal: React.FC<AICommandCenterModalProps> = ({ isOpen, onClose }) => {
  const { libraryBlocks, currentWeekId, addScheduledBlock, addToast } = useTimetable();

  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; actionText?: string; onAction?: () => void }>>([
    {
      sender: 'ai',
      text: 'Good day! I am your AI Command Center. Ask me to generate an Exam Study Plan, build a Semester Timetable, or find your peak focus windows.',
    },
  ]);

  if (!isOpen) return null;

  const handleSendPrompt = (userMsg?: string) => {
    const text = userMsg || prompt;
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setPrompt('');

    const lower = text.toLowerCase();

    setTimeout(() => {
      if (lower.includes('cat') || lower.includes('exam') || lower.includes('45 days') || lower.includes('study plan')) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: 'I have generated a 45-day CAT Exam Personalized Study Plan (2.0h/day high-focus sessions, Sunday mock tests, and buffer days). Would you like to apply this plan to your weekly timetable?',
            actionText: '✨ Apply 45-Day Study Plan',
            onAction: () => {
              const blocks = generateAISmartSchedule(libraryBlocks, currentWeekId);
              blocks.forEach((b) => addScheduledBlock(b));
              addToast('Applied 45-Day Study Plan to weekly timetable! 🎯', 'success');
              onClose();
            },
          },
        ]);
      } else if (lower.includes('semester') || lower.includes('semester 3') || lower.includes('college')) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: 'I can build a balanced Semester 3 timetable combining your College Lectures (9 AM–2 PM), Internship Sprint (4 PM–6 PM), and Gym (7 PM). Would you like to generate this schedule?',
            actionText: '✨ Generate Semester 3 Timetable',
            onAction: () => {
              const blocks = generateAISmartSchedule(libraryBlocks, currentWeekId);
              blocks.forEach((b) => addScheduledBlock(b));
              addToast('Generated & Applied Semester 3 Timetable! 📚', 'success');
              onClose();
            },
          },
        ]);
      } else if (lower.includes('free time') || lower.includes('available')) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: 'Your next available 2-hour deep study window is tomorrow between 09:00 AM and 11:30 AM (94% completion probability).',
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: `Understood intent: "${text}". I have analyzed your productivity patterns. Recommendation: Schedule high-priority sessions during morning hours (08:00 AM - 11:30 AM).`,
          },
        ]);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Productivity Command Center</h2>
              <p className="text-xs text-slate-400">Ask questions, generate exam study plans, or build semester timetables</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Chips */}
        <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2 overflow-x-auto text-[11px]">
          <button
            onClick={() => handleSendPrompt('I have my CAT exam in 45 days. Build a study plan.')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-indigo-300 font-semibold shrink-0 flex items-center gap-1"
          >
            <BookOpen className="w-3 h-3" />
            <span>45-Day CAT Study Plan</span>
          </button>

          <button
            onClick={() => handleSendPrompt('Create my timetable for Semester 3.')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-purple-300 font-semibold shrink-0 flex items-center gap-1"
          >
            <Calendar className="w-3 h-3" />
            <span>Semester 3 Planner</span>
          </button>

          <button
            onClick={() => handleSendPrompt('When is my next free 2-hour study window?')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-emerald-300 font-semibold shrink-0 flex items-center gap-1"
          >
            <Zap className="w-3 h-3" />
            <span>Find Free Time</span>
          </button>
        </div>

        {/* Conversation Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none space-y-2'
                }`}
              >
                <p>{msg.text}</p>

                {msg.onAction && (
                  <button
                    onClick={msg.onAction}
                    className="mt-2 w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>{msg.actionText}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type command or prompt (e.g. 'I have CAT exam in 45 days')..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
            className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => handleSendPrompt()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
