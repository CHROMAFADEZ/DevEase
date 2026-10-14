import React, { useState } from 'react';
import { 
  Clock, 
  Plus, 
  MapPin, 
  User, 
  Edit2, 
  Trash2, 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import { DayOfWeek, TimetableClass } from '../../types';
import { formatTimeRange, getTodayDayOfWeek } from '../../utils/dateUtils';
import { ClassModal } from './ClassModal';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const TimetableView: React.FC = () => {
  const { data, deleteClass, setActiveTab } = useOrganizer();
  const currentDayOfWeek = getTodayDayOfWeek();

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(currentDayOfWeek);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<TimetableClass | null>(null);

  const handleOpenAdd = (dayToPreselect?: DayOfWeek) => {
    setEditingClass(null);
    if (dayToPreselect) setSelectedDay(dayToPreselect);
    setIsModalOpen(true);
  };

  const handleEdit = (cls: TimetableClass) => {
    setEditingClass(cls);
    setIsModalOpen(true);
  };

  // Group classes by day
  const classesForSelectedDay = data.classes
    .filter((c) => c.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const totalClassesCount = data.classes.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-[#242F26]">
            College Timetable
          </h1>
          <p className="text-xs text-[#6C7A6E] mt-0.5">
            Your weekly class schedule, lecture rooms, and campus hours.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View mode toggle */}
          <div className="flex items-center p-1 bg-[#EFEAE2] rounded-xl text-xs">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-white text-[#242F26] shadow-2xs'
                  : 'text-[#647366] hover:text-[#242F26]'
              }`}
            >
              Day View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-white text-[#242F26] shadow-2xs'
                  : 'text-[#647366] hover:text-[#242F26]'
              }`}
            >
              Full Week
            </button>
          </div>

          <button
            onClick={() => setActiveTab('routine')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-[#FAF5EB] border border-[#DDD3C3] text-[#2F5638] hover:bg-[#F2ECE0] transition-colors cursor-pointer shadow-2xs"
            title="Import college schedule from PDF or image"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#3E684A]" />
            <span>AI Import</span>
          </button>

          <button
            onClick={() => handleOpenAdd(selectedDay)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#3E684A] text-white hover:bg-[#34583E] transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class</span>
          </button>
        </div>
      </div>

      {/* Day Selector Pills / Segmented Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {DAYS.map((day) => {
          const isSelected = selectedDay === day;
          const isToday = currentDayOfWeek === day;
          const dayClassesCount = data.classes.filter((c) => c.day === day).length;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 min-w-[90px] py-2.5 px-2 rounded-2xl border text-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#3E684A] border-[#3E684A] text-white shadow-xs'
                  : 'bg-white border-[#E4DDD3] text-[#556357] hover:border-[#CAD2C8] hover:bg-[#FAF7F2]'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <span className="text-xs font-semibold block">{day.slice(0, 3)}</span>
                {isToday && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-emerald-200' : 'bg-[#3E684A]'
                    }`}
                    title="Today"
                  />
                )}
              </div>
              <span
                className={`text-[10px] block mt-0.5 ${
                  isSelected ? 'text-emerald-100' : 'text-[#7D8A7F]'
                }`}
              >
                {dayClassesCount} {dayClassesCount === 1 ? 'class' : 'classes'}
              </span>
            </button>
          );
        })}
      </div>

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="bg-white border border-[#E6E0D5] rounded-3xl p-5 md:p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#ECE6DD]">
            <div>
              <h2 className="text-base font-semibold text-[#253227] flex items-center gap-2">
                <span>{selectedDay}</span>
                {selectedDay === currentDayOfWeek && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#EAF2EC] text-[#335F3E] font-medium">
                    Today
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#718073]">
                {classesForSelectedDay.length} class
                {classesForSelectedDay.length === 1 ? '' : 'es'} scheduled
              </p>
            </div>

            <button
              onClick={() => handleOpenAdd(selectedDay)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#EAF0EB] text-[#2F5739] hover:bg-[#DDE7DF] transition-colors cursor-pointer border border-[#D5E1D7]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add class to {selectedDay.slice(0, 3)}</span>
            </button>
          </div>

          {classesForSelectedDay.length === 0 ? (
            <div className="py-12 text-center bg-[#FAF7F2] rounded-2xl border border-dashed border-[#E5DFD4]">
              <CalendarDays className="w-8 h-8 text-[#8C9B8E] mx-auto mb-2 opacity-70" />
              <p className="text-sm font-semibold text-[#2D392F]">
                No classes on {selectedDay}
              </p>
              <p className="text-xs text-[#778679] mt-1 max-w-sm mx-auto">
                Enjoy your free hours or schedule study sessions and personal rest.
              </p>
              <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => handleOpenAdd(selectedDay)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#3E684A] text-white hover:bg-[#34583E] cursor-pointer"
                >
                  Schedule a class
                </button>
                <button
                  onClick={() => setActiveTab('routine')}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#FAF5EB] border border-[#DDD3C3] text-[#2F5638] hover:bg-[#F2ECE0] cursor-pointer"
                >
                  Import timetable with AI
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {classesForSelectedDay.map((cls) => {
                const borderAccent =
                  cls.accentColor === 'lavender'
                    ? 'border-l-4 border-l-[#725F88]'
                    : cls.accentColor === 'blue'
                    ? 'border-l-4 border-l-[#4A7294]'
                    : cls.accentColor === 'amber'
                    ? 'border-l-4 border-l-[#967C5A]'
                    : 'border-l-4 border-l-[#3E684A]';

                return (
                  <div
                    key={cls.id}
                    className={`p-4 rounded-2xl border border-[#E7E1D6] bg-[#FCFAF7] hover:border-[#D5CDC1] transition-all ${borderAccent}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[#243126]">
                          {cls.subject}
                        </h3>

                        {/* Details */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#677769] mt-1.5">
                          <span className="flex items-center gap-1 font-medium text-[#2F4433]">
                            <Clock className="w-3.5 h-3.5 text-[#3E684A]" />
                            {formatTimeRange(cls.startTime, cls.endTime)}
                          </span>

                          <span aria-hidden="true" className="text-[#C6BDB1]">·</span>

                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#889689]" />
                            {cls.room || 'Room not set'}
                          </span>

                          {cls.instructor && (
                            <>
                              <span aria-hidden="true" className="text-[#C6BDB1]">·</span>
                              <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-[#889689]" />
                                {cls.instructor}
                              </span>
                            </>
                          )}
                        </div>

                        {cls.notes && (
                          <p className="text-xs text-[#758477] mt-2 pt-2 border-t border-[#EFEAE2]">
                            {cls.notes}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEdit(cls)}
                          className="p-1.5 rounded-lg text-[#738275] hover:text-[#253227] hover:bg-[#F2ECE3] transition-colors cursor-pointer"
                          title="Edit class"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteClass(cls.id)}
                          className="p-1.5 rounded-lg text-[#8A988D] hover:text-[#9B4242] hover:bg-[#FBEAEA] transition-colors cursor-pointer"
                          title="Delete class"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FULL WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DAYS.map((day) => {
            const dayClasses = data.classes
              .filter((c) => c.day === day)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            const isToday = currentDayOfWeek === day;

            return (
              <div
                key={day}
                className={`p-4 rounded-3xl border transition-all ${
                  isToday
                    ? 'bg-white border-[#3E684A] shadow-xs'
                    : 'bg-[#FCFAF7] border-[#E6E0D5]'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#ECE6DD]">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-semibold text-[#253227]">
                      {day}
                    </h3>
                    {isToday && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#EBF2EC] text-[#356140] font-semibold">
                        Today
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleOpenAdd(day)}
                    className="p-1 rounded-lg text-[#738375] hover:bg-[#EFEAE2] hover:text-[#253227] transition-colors cursor-pointer"
                    title={`Add class to ${day}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {dayClasses.length === 0 ? (
                  <p className="text-[11px] text-[#869688] italic py-3 text-center">
                    No classes
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dayClasses.map((cls) => (
                      <div
                        key={cls.id}
                        onClick={() => handleEdit(cls)}
                        className="p-2.5 rounded-xl border border-[#E8E2D8] bg-white hover:border-[#D0C7B8] transition-colors cursor-pointer text-xs"
                      >
                        <div className="font-semibold text-[#263328] truncate">
                          {cls.subject}
                        </div>
                        <div className="text-[11px] text-[#697A6C] mt-0.5">
                          {formatTimeRange(cls.startTime, cls.endTime)} · {cls.room || 'Room TBA'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Class Modal */}
      <ClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialClass={editingClass}
        defaultDay={selectedDay}
      />
    </div>
  );
};
