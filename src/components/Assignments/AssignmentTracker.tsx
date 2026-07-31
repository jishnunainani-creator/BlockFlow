import React, { useState, useEffect } from 'react';
import { Assignment } from '../../types/executionOS';
import { loadAssignments, saveAssignments } from '../../utils/assignmentStorage';
import { generateAssignmentStudyPlan } from '../../utils/scheduleOptimizerEngine';
import { useTimetable } from '../../context/TimetableContext';
import {
  BookOpen,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trash2,
  Edit2,
  X,
  Check,
  FileText,
  Tag,
  Filter,
} from 'lucide-react';

const INITIAL_SAMPLE_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asgn-1',
    subject: 'CS 401 — Operating Systems',
    title: 'Database Design Project',
    description: 'Design a normalized database schema for a ride-sharing application. Deliverables include ER diagrams, SQL schema, and sample data queries.',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    priority: 'high',
    estimatedHours: 4,
    progressPct: 35,
    status: 'in_progress',
    studyPlan: [
      { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], durationMinutes: 90, title: 'ER Diagram & Schema Design' },
      { date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], durationMinutes: 120, title: 'SQL Queries & Test Dataset' },
    ],
  },
  {
    id: 'asgn-2',
    subject: 'CS 302 — Data Structures',
    title: 'Dynamic Programming Problem Sheet',
    description: 'Implement solutions for Knapsack 0/1, Longest Common Subsequence, and Matrix Chain Multiplication with full unit tests.',
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    priority: 'high',
    estimatedHours: 6,
    progressPct: 0,
    status: 'pending',
    studyPlan: [
      { date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], durationMinutes: 120, title: 'Knapsack & LCS Implementation' },
      { date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0], durationMinutes: 120, title: 'Matrix Chain & Unit Tests' },
    ],
  },
];

export default function AssignmentTracker() {
  const { addToast, addScheduledBlock, currentWeekId } = useTimetable();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<string>('high');
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadAssignments();
    if (loaded && loaded.length > 0) {
      setAssignments(loaded);
    } else {
      setAssignments(INITIAL_SAMPLE_ASSIGNMENTS);
      saveAssignments(INITIAL_SAMPLE_ASSIGNMENTS);
    }
  }, []);

  const persistAssignments = (updated: Assignment[]) => {
    setAssignments(updated);
    saveAssignments(updated);
  };

  const handleSaveAssignment = () => {
    if (!title || !subject || !dueDate) {
      addToast('Please fill in Subject, Title, and Due Date', 'warning');
      return;
    }

    const studyPlan = generateAssignmentStudyPlan(title, dueDate, estimatedHours);

    if (editingId) {
      const updated = assignments.map(a =>
        a.id === editingId
          ? { ...a, subject, title, description, dueDate, priority: priority as any, estimatedHours, studyPlan }
          : a
      );
      persistAssignments(updated);
      addToast('Assignment updated successfully!', 'success');
    } else {
      const newAssignment: Assignment = {
        id: `asgn-${Date.now()}`,
        subject,
        title,
        description,
        dueDate,
        priority: priority as any,
        estimatedHours,
        progressPct: 0,
        status: 'pending',
        studyPlan,
      };
      persistAssignments([newAssignment, ...assignments]);
      addToast('Assignment created with AI Study Plan!', 'success');
    }

    resetForm();
  };

  const resetForm = () => {
    setSubject('');
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('high');
    setEstimatedHours(2);
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    persistAssignments(assignments.filter(a => a.id !== id));
    addToast('Assignment removed', 'info');
  };

  const handleStatusChange = (id: string, status: Assignment['status']) => {
    persistAssignments(
      assignments.map(a =>
        a.id === id
          ? { ...a, status, progressPct: status === 'submitted' || status === 'graded' ? 100 : status === 'in_progress' ? 50 : 0 }
          : a
      )
    );
    addToast(`Updated status to "${status.replace('_', ' ')}"`, 'success');
  };

  const handleAcceptStudyPlan = (asgn: Assignment) => {
    if (!asgn.studyPlan || asgn.studyPlan.length === 0) return;

    let addedCount = 0;
    asgn.studyPlan.forEach((slot, idx) => {
      const slotDate = new Date(slot.date);
      const dayOfWeek = (slotDate.getDay() + 6) % 7; // Monday = 0
      addScheduledBlock({
        blockId: `asgn-plan-${asgn.id}-${idx}`,
        title: slot.title,
        description: `Study session for assignment: ${asgn.title}`,
        color: '#8B5CF6',
        priority: asgn.priority,
        icon: 'book',
        dayOfWeek,
        startMinutes: 840 + idx * 120, // 2:00 PM onwards
        duration: slot.durationMinutes,
      });
      addedCount++;
    });

    addToast(`Added ${addedCount} study sessions to your calendar! 📅`, 'success');
  };

  const filteredAssignments = assignments.filter(a => {
    if (filterStatus === 'All') return true;
    const mappedKey = filterStatus.toLowerCase().replace(' ', '_');
    return a.status === mappedKey;
  });

  const getStatusBadge = (status: Assignment['status']) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-semibold">Pending</span>;
      case 'in_progress':
        return <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold">In Progress</span>;
      case 'submitted':
        return <span className="px-2.5 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-semibold">Submitted</span>;
      case 'graded':
        return <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">Graded</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="text-indigo-400" size={24} />
            Assignments Tracker
          </h2>
          <p className="text-slate-400 text-sm">Track coursework, deadlines, and automated AI study plans.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition-colors font-medium text-sm shadow-lg"
        >
          <Plus size={18} />
          New Assignment
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {['All', 'Pending', 'In Progress', 'Submitted', 'Graded'].map((f) => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
              filterStatus === f
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignment Cards Column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {filteredAssignments.map((asgn) => (
            <div
              key={asgn.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white">{asgn.title}</h3>
                    <p className="text-xs text-indigo-300 font-medium">{asgn.subject}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(asgn.status)}
                  <button
                    onClick={() => {
                      setEditingId(asgn.id);
                      setSubject(asgn.subject);
                      setTitle(asgn.title);
                      setDescription(asgn.description || '');
                      setDueDate(asgn.dueDate);
                      setPriority(asgn.priority);
                      setEstimatedHours(asgn.estimatedHours);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(asgn.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {asgn.description && (
                <p className="text-slate-300 text-sm leading-relaxed">{asgn.description}</p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-800/80 pt-3">
                <div className="flex items-center gap-4 text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-indigo-400" />
                    Due: <strong className="text-slate-200">{asgn.dueDate}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-purple-400" />
                    Est: <strong className="text-slate-200">{asgn.estimatedHours}h</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Status:</span>
                  <select
                    value={asgn.status}
                    onChange={(e) => handleStatusChange(asgn.id, e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 text-xs font-semibold rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="submitted">Submitted</option>
                    <option value="graded">Graded</option>
                  </select>
                </div>
              </div>
            </div>
          ))}

          {filteredAssignments.length === 0 && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-400">No assignments found for status "{filterStatus}"</p>
              <button
                onClick={() => { resetForm(); setIsModalOpen(true); }}
                className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl"
              >
                Add New Assignment
              </button>
            </div>
          )}
        </div>

        {/* AI Study Plan Column */}
        <div className="flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl rounded-full pointer-events-none"></div>
            
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Sparkles className="text-indigo-400" size={18} />
                AI Automated Study Plan
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">Smart Scheduling</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              BlockFlow automatically breaks down your pending assignments into optimal study sessions based on your workload.
            </p>

            {filteredAssignments.length > 0 && filteredAssignments[0].studyPlan ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-300">
                  Plan for: <strong className="text-indigo-300">{filteredAssignments[0].title}</strong>
                </p>
                <div className="flex flex-col gap-2">
                  {filteredAssignments[0].studyPlan.map((slot, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                        <Clock size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{slot.title}</p>
                        <p className="text-[10px] text-slate-400">{slot.date} • {slot.durationMinutes} mins</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleAcceptStudyPlan(filteredAssignments[0])}
                  className="w-full mt-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 py-2.5 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  Accept &amp; Add to Calendar
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Select or create an assignment to view AI study plan recommendations.</p>
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Assignment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingId ? 'Edit Assignment' : 'New Assignment'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Subject / Course</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. CS 401 — Operating Systems"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Assignment Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Database Design Project"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white h-20 resize-none focus:outline-none focus:border-indigo-500"
                  placeholder="Deliverables, requirements, links..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAssignment}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
              >
                Save &amp; Generate AI Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { AssignmentTracker };
