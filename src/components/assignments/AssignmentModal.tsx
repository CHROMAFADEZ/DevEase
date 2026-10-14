import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, BookOpen } from 'lucide-react';
import { Assignment, AssignmentStatus } from '../../types';
import { useOrganizer } from '../../context/OrganizerContext';
import { getTodayDateString } from '../../utils/dateUtils';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAssignment?: Assignment | null;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  initialAssignment,
}) => {
  const { addAssignment, updateAssignment, data } = useOrganizer();

  const today = getTodayDateString();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [assignedDate, setAssignedDate] = useState(today);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<AssignmentStatus>('not_started');
  const [createLinkedTask, setCreateLinkedTask] = useState(true);
  const [error, setError] = useState('');

  // Course suggestions from existing timetable
  const subjectSuggestions = Array.from(new Set(data.classes.map((c) => c.subject))).filter(Boolean);

  useEffect(() => {
    if (initialAssignment) {
      setTitle(initialAssignment.title || '');
      setSubject(initialAssignment.subject || '');
      setAssignedDate(initialAssignment.assignedDate || today);
      setDueDate(initialAssignment.dueDate || '');
      setDueTime(initialAssignment.dueTime || '23:59');
      setDescription(initialAssignment.description || '');
      setStatus(initialAssignment.status || 'not_started');
      setCreateLinkedTask(false);
    } else {
      setTitle('');
      setSubject('');
      setAssignedDate(today);
      // Default due date to 5 days from today
      const defaultDue = new Date();
      defaultDue.setDate(defaultDue.getDate() + 5);
      const y = defaultDue.getFullYear();
      const m = String(defaultDue.getMonth() + 1).padStart(2, '0');
      const d = String(defaultDue.getDate()).padStart(2, '0');
      setDueDate(`${y}-${m}-${d}`);
      setDueTime('23:59');
      setDescription('');
      setStatus('not_started');
      setCreateLinkedTask(true);
    }
    setError('');
  }, [initialAssignment, isOpen, today]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!subject.trim()) {
      setError('Subject is required.');
      return;
    }
    if (!dueDate) {
      setError('Due date is required.');
      return;
    }

    if (initialAssignment) {
      updateAssignment(initialAssignment.id, {
        title: title.trim(),
        subject: subject.trim(),
        assignedDate,
        dueDate,
        dueTime: dueTime || undefined,
        description: description.trim(),
        status,
      });
    } else {
      const newAssignId = addAssignment({
        title: title.trim(),
        subject: subject.trim(),
        assignedDate,
        dueDate,
        dueTime: dueTime || undefined,
        description: description.trim(),
        status,
      });

      // Optionally auto-create linked study task without creating duplicate tasks
      if (createLinkedTask) {
        // Handled through the context logic
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#252E27]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-[#FCFAF7] border border-[#E3DBD0] rounded-3xl w-full max-w-lg shadow-2xl p-6 overflow-y-auto max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#ECE6DC]">
          <h2 className="text-base font-semibold text-[#253227]">
            {initialAssignment ? 'Edit Assignment' : 'Add Assignment or Homework'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#88978A] hover:text-[#253227] p-1.5 rounded-lg hover:bg-[#F2ECE3] cursor-pointer"
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

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
              Assignment / Homework Title <span className="text-[#9E3939]">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Lab Report: Acid-Base Titration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D9D2C7] bg-white text-[#242F26] placeholder:text-[#9AA59C] focus:outline-hidden focus:border-[#3E684A]"
            />
          </div>

          {/* Subject / Course */}
          <div>
            <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
              Subject / Course <span className="text-[#9E3939]">*</span>
            </label>
            <input
              type="text"
              required
              list="subject-assign-suggestions"
              placeholder="e.g. CS 101, Chemistry, Literature"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D9D2C7] bg-white text-[#242F26] placeholder:text-[#9AA59C] focus:outline-hidden focus:border-[#3E684A]"
            />
            {subjectSuggestions.length > 0 && (
              <datalist id="subject-assign-suggestions">
                {subjectSuggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            )}
          </div>

          {/* Assigned Date & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
                Assigned Date
              </label>
              <input
                type="date"
                value={assignedDate}
                onChange={(e) => setAssignedDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#D9D2C7] bg-white text-[#242F26] focus:outline-hidden focus:border-[#3E684A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
                Due Date <span className="text-[#9E3939]">*</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#D9D2C7] bg-white text-[#242F26] focus:outline-hidden focus:border-[#3E684A]"
              />
            </div>
          </div>

          {/* Due Time & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
                Due Time (e.g. 23:59 or 17:00)
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#D9D2C7] bg-white text-[#242F26] focus:outline-hidden focus:border-[#3E684A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
                Submission Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AssignmentStatus)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#D9D2C7] bg-white text-[#242F26] focus:outline-hidden focus:border-[#3E684A]"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="submitted">Submitted</option>
              </select>
            </div>
          </div>

          {/* Description & Requirements */}
          <div>
            <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
              Instructions, Rubric, or Submission Notes
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Format in PDF, attach graph appendix, submit through Canvas"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#D9D2C7] bg-white text-[#242F26] placeholder:text-[#9AA59C] focus:outline-hidden focus:border-[#3E684A]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#ECE6DC] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#657367] hover:text-[#253227] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#3E684A] text-white hover:bg-[#34583E] transition-colors cursor-pointer shadow-xs"
            >
              {initialAssignment ? 'Save Changes' : 'Add Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
