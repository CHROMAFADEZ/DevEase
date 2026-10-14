import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, BookOpen, AlertCircle } from 'lucide-react';
import { Task, TaskCategory, TaskPriority, TaskStatus } from '../../types';
import { useOrganizer } from '../../context/OrganizerContext';
import { getTodayDateString } from '../../utils/dateUtils';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTask?: Task | null;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  initialTask,
}) => {
  const { addTask, updateTask, data } = useOrganizer();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [deadline, setDeadline] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [estimatedDuration, setEstimatedDuration] = useState<number>(30);
  const [category, setCategory] = useState<TaskCategory>('study');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Collect existing subjects from classes & assignments for friendly autocomplete/dropdown
  const subjectSuggestions = Array.from(
    new Set([
      ...data.classes.map((c) => c.subject),
      ...data.assignments.map((a) => a.subject),
    ])
  ).filter(Boolean);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title || '');
      setSubject(initialTask.subject || '');
      setDeadline(initialTask.deadline || '');
      setDeadlineTime(initialTask.deadlineTime || '');
      setPriority(initialTask.priority || 'medium');
      setEstimatedDuration(initialTask.estimatedDuration || 30);
      setCategory(initialTask.category || 'study');
      setStatus(initialTask.status || 'pending');
      setNotes(initialTask.notes || '');
    } else {
      setTitle('');
      setSubject('');
      setDeadline(getTodayDateString());
      setDeadlineTime('');
      setPriority('medium');
      setEstimatedDuration(30);
      setCategory('study');
      setStatus('pending');
      setNotes('');
    }
    setError('');
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for this task.');
      return;
    }

    if (initialTask) {
      updateTask(initialTask.id, {
        title: title.trim(),
        subject: subject.trim() || undefined,
        deadline: deadline || undefined,
        deadlineTime: deadlineTime || undefined,
        priority,
        estimatedDuration,
        category,
        status,
        notes: notes.trim() || undefined,
      });
    } else {
      addTask({
        title: title.trim(),
        subject: subject.trim() || undefined,
        deadline: deadline || undefined,
        deadlineTime: deadlineTime || undefined,
        priority,
        estimatedDuration,
        category,
        status,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#242E26]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-[#FCFAF7] border border-[#E5DFD5] rounded-3xl w-full max-w-lg shadow-2xl p-6 overflow-y-auto max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#EBE5DB]">
          <h2 className="text-base font-semibold text-[#253227]">
            {initialTask ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#89978C] hover:text-[#253227] p-1.5 rounded-lg hover:bg-[#F2ECE3] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-2.5 rounded-xl bg-[#FDF2F2] border border-[#F5D3D3] text-xs text-[#9E3939] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Task Title */}
          <div>
            <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
              Task Title <span className="text-[#9E3939]">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Read Chapter 4 on Cognitive Biases"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#D9D2C7] bg-white text-[#242F26] placeholder:text-[#9BA79D] focus:outline-hidden focus:border-[#3E684A] focus:ring-1 focus:ring-[#3E684A]"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#D9D2C7] bg-white text-[#242F26] focus:outline-hidden focus:border-[#3E684A]"
              >
                <option value="study">Study (Self-study & prep)</option>
                <option value="college">College (Classes & admin)</option>
                <option value="personal">Personal (Errands & well-being)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#D9D2C7] bg-white text-[#242F26] focus:outline-hidden focus:border-[#3E684A]"
              >
                <option value="low">Gentle (Low pressure)</option>
                <option value="medium">Steady (Standard)</option>
                <option value="high">Urgent (Needs attention)</option>
              </select>
            </div>
          </div>

          {/* Subject / Course */}
          <div>
            <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
              Subject or Course (Optional)
            </label>
            <input
              type="text"
              list="subject-suggestions"
              placeholder="e.g. CS 101, Calculus II, English"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#D9D2C7] bg-white text-[#242F26] placeholder:text-[#9BA79D] focus:outline-hidden focus:border-[#3E684A]"
            />
            {subjectSuggestions.length > 0 && (
              <datalist id="subject-suggestions">
                {subjectSuggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            )}
          </div>

          {/* Deadline Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
                Deadline Date
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#D9D2C7] bg-white text-[#242F26] focus:outline-hidden focus:border-[#3E684A]"
              />
              <span className="text-[11px] text-[#78877A] mt-0.5 block">
                Leave empty for unscheduled Inbox
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
                Deadline Time
              </label>
              <input
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#D9D2C7] bg-white text-[#242F26] focus:outline-hidden focus:border-[#3E684A]"
              />
            </div>
          </div>

          {/* Estimated Duration & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
                Estimated Time
              </label>
              <select
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#D9D2C7] bg-white text-[#242F26] focus:outline-hidden focus:border-[#3E684A]"
              >
                <option value={15}>15 minutes (Quick sprint)</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes (Standard focus)</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#D9D2C7] bg-white text-[#242F26] focus:outline-hidden focus:border-[#3E684A]"
              >
                <option value="pending">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
              Notes & Helpful Details
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Textbook pages 80-92, check question 3 formula"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#D9D2C7] bg-white text-[#242F26] placeholder:text-[#9BA79D] focus:outline-hidden focus:border-[#3E684A]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#EBE5DB] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#677469] hover:text-[#253227] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#3E684A] text-white hover:bg-[#34583E] transition-colors cursor-pointer shadow-xs"
            >
              {initialTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
