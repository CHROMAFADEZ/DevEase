import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, User, FileText, AlertCircle } from 'lucide-react';
import { DayOfWeek, TimetableClass } from '../../types';
import { useOrganizer } from '../../context/OrganizerContext';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClass?: TimetableClass | null;
  defaultDay?: DayOfWeek;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  initialClass,
  defaultDay = 'Monday',
}) => {
  const { addClass, updateClass } = useOrganizer();

  const [subject, setSubject] = useState('');
  const [day, setDay] = useState<DayOfWeek>(defaultDay);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [room, setRoom] = useState('');
  const [instructor, setInstructor] = useState('');
  const [accentColor, setAccentColor] = useState<'sage' | 'lavender' | 'blue' | 'amber'>('sage');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialClass) {
      setSubject(initialClass.subject || '');
      setDay(initialClass.day || defaultDay);
      setStartTime(initialClass.startTime || '09:00');
      setEndTime(initialClass.endTime || '10:30');
      setRoom(initialClass.room || '');
      setInstructor(initialClass.instructor || '');
      setAccentColor(initialClass.accentColor || 'sage');
      setNotes(initialClass.notes || '');
    } else {
      setSubject('');
      setDay(defaultDay);
      setStartTime('09:00');
      setEndTime('10:30');
      setRoom('');
      setInstructor('');
      setAccentColor('sage');
      setNotes('');
    }
    setError('');
  }, [initialClass, defaultDay, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Subject name is required.');
      return;
    }
    if (startTime >= endTime) {
      setError('Start time must be before end time.');
      return;
    }

    if (initialClass) {
      updateClass(initialClass.id, {
        subject: subject.trim(),
        day,
        startTime,
        endTime,
        room: room.trim(),
        instructor: instructor.trim() || undefined,
        accentColor,
        notes: notes.trim() || undefined,
      });
    } else {
      addClass({
        subject: subject.trim(),
        day,
        startTime,
        endTime,
        room: room.trim(),
        instructor: instructor.trim() || undefined,
        accentColor,
        notes: notes.trim() || undefined,
      });
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
            {initialClass ? 'Edit College Class' : 'Add Class to Timetable'}
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

          {/* Subject / Course Name */}
          <div>
            <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
              Subject / Course Title <span className="text-[#9E3939]">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. CS 101: Intro to Programming"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D9D2C7] bg-white text-[#242F26] placeholder:text-[#9AA59C] focus:outline-hidden focus:border-[#3E684A]"
            />
          </div>

          {/* Day of Week */}
          <div>
            <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
              Day of Week
            </label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value as DayOfWeek)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#D9D2C7] bg-white text-[#242F26] focus:outline-hidden focus:border-[#3E684A]"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Start Time & End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
                Start Time
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#D9D2C7] bg-white text-[#242F26] focus:outline-hidden focus:border-[#3E684A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
                End Time
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#D9D2C7] bg-white text-[#242F26] focus:outline-hidden focus:border-[#3E684A]"
              />
            </div>
          </div>

          {/* Room & Instructor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
                Room / Location
              </label>
              <input
                type="text"
                placeholder="e.g. Hall 204 or Online"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#D9D2C7] bg-white text-[#242F26] placeholder:text-[#9AA59C] focus:outline-hidden focus:border-[#3E684A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
                Instructor / Lecturer
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Evans"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#D9D2C7] bg-white text-[#242F26] placeholder:text-[#9AA59C] focus:outline-hidden focus:border-[#3E684A]"
              />
            </div>
          </div>

          {/* Accent Color for calendar block */}
          <div>
            <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
              Accent Color
            </label>
            <div className="flex items-center gap-3">
              {[
                { id: 'sage', label: 'Sage Green', bg: 'bg-[#4B7358]' },
                { id: 'lavender', label: 'Lavender', bg: 'bg-[#76638C]' },
                { id: 'blue', label: 'Soft Blue', bg: 'bg-[#4B6F8E]' },
                { id: 'amber', label: 'Warm Oat', bg: 'bg-[#8F7757]' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setAccentColor(c.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-colors cursor-pointer ${
                    accentColor === c.id
                      ? 'border-[#2C4A33] bg-[#EBF2EC] text-[#243A2A] font-semibold'
                      : 'border-[#E0D7CC] bg-white text-[#5F6E61]'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${c.bg}`}></span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
              Notes (e.g. Bring notebook, attendance policy)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Discussion session every second week, slides on portal"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#D9D2C7] bg-white text-[#242F26] placeholder:text-[#9AA59C] focus:outline-hidden focus:border-[#3E684A]"
            />
          </div>

          {/* Footer */}
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
              {initialClass ? 'Save Changes' : 'Add Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
