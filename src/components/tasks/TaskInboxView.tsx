import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  SlidersHorizontal, 
  CheckCircle2, 
  Inbox, 
  Calendar, 
  Clock, 
  AlertCircle,
  Tag
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import { Task, TaskCategory } from '../../types';
import { TaskCard } from './TaskCard';
import { getTodayDateString, isTaskOverdue, isTaskDueToday, isTaskUpcoming } from '../../utils/dateUtils';

type InboxViewFilter = 'all' | 'today' | 'upcoming' | 'overdue' | 'unscheduled' | 'completed';

interface TaskInboxViewProps {
  onOpenTaskModal: () => void;
  onEditTask: (task: Task) => void;
}

export const TaskInboxView: React.FC<TaskInboxViewProps> = ({
  onOpenTaskModal,
  onEditTask,
}) => {
  const { data, quickAddTask, toggleTaskComplete, deleteTask } = useOrganizer();

  const [activeView, setActiveView] = useState<InboxViewFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | TaskCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState<TaskCategory>('study');

  const today = getTodayDateString();

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    quickAddTask(quickTitle.trim(), quickCategory);
    setQuickTitle('');
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return data.tasks.filter((task) => {
      // 1. View Filter
      if (activeView === 'today') {
        if (task.deadline !== today || task.status === 'completed') return false;
      } else if (activeView === 'upcoming') {
        if (!isTaskUpcoming(task.deadline) || task.status === 'completed') return false;
      } else if (activeView === 'overdue') {
        if (!isTaskOverdue(task.deadline, task.status)) return false;
      } else if (activeView === 'unscheduled') {
        if (task.deadline || task.status === 'completed') return false;
      } else if (activeView === 'completed') {
        if (task.status !== 'completed') return false;
      } else {
        // 'all': usually show active tasks first, but show all if user chooses
      }

      // 2. Category Filter
      if (categoryFilter !== 'all' && task.category !== categoryFilter) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesSubject = task.subject?.toLowerCase().includes(q);
        const matchesNotes = task.notes?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubject && !matchesNotes) return false;
      }

      return true;
    });
  }, [data.tasks, activeView, categoryFilter, searchQuery, today]);

  // Counts for each view
  const counts = useMemo(() => {
    return {
      all: data.tasks.length,
      today: data.tasks.filter((t) => t.deadline === today && t.status !== 'completed').length,
      upcoming: data.tasks.filter((t) => isTaskUpcoming(t.deadline) && t.status !== 'completed').length,
      overdue: data.tasks.filter((t) => isTaskOverdue(t.deadline, t.status)).length,
      unscheduled: data.tasks.filter((t) => !t.deadline && t.status !== 'completed').length,
      completed: data.tasks.filter((t) => t.status === 'completed').length,
    };
  }, [data.tasks, today]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-[#242F26]">
            Task Inbox
          </h1>
          <p className="text-xs text-[#6C7A6E] mt-0.5">
            Capture, plan, and organize college study & personal tasks with ease.
          </p>
        </div>

        <button
          onClick={onOpenTaskModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#3E684A] text-white hover:bg-[#34583E] transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Detailed Task</span>
        </button>
      </div>

      {/* Quick Add Bar (Zero-friction input) */}
      <form
        onSubmit={handleQuickAdd}
        className="bg-white border border-[#E3DBD0] rounded-2xl p-2.5 flex flex-wrap items-center gap-2 shadow-2xs"
      >
        <input
          type="text"
          placeholder="Quick add: Type task and press Enter..."
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          className="flex-1 min-w-[200px] text-xs px-3 py-2 bg-transparent text-[#232F26] placeholder:text-[#9EA89F] focus:outline-hidden"
        />

        <select
          value={quickCategory}
          onChange={(e) => setQuickCategory(e.target.value as TaskCategory)}
          className="text-xs px-2.5 py-1.5 rounded-xl border border-[#E0D7CC] bg-[#FAF8F5] text-[#425245] focus:outline-hidden cursor-pointer"
        >
          <option value="study">Study</option>
          <option value="college">College</option>
          <option value="personal">Personal</option>
        </select>

        <button
          type="submit"
          className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#3E684A] text-white hover:bg-[#34583E] transition-colors cursor-pointer shrink-0"
        >
          Add to Today
        </button>
      </form>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        {/* View Tabs (Segmented Controls) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {(
            [
              { id: 'all', label: 'All Tasks', count: counts.all },
              { id: 'today', label: 'Today', count: counts.today },
              { id: 'upcoming', label: 'Upcoming', count: counts.upcoming },
              { id: 'overdue', label: 'Overdue', count: counts.overdue },
              { id: 'unscheduled', label: 'Unscheduled', count: counts.unscheduled },
              { id: 'completed', label: 'Completed', count: counts.completed },
            ] as const
          ).map((tab) => {
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#232F26] border border-[#DDD5CA] shadow-2xs'
                    : 'text-[#627064] hover:text-[#232F26] hover:bg-[#F2EDE5]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                      isActive
                        ? 'bg-[#EBF2EC] text-[#2F5A39]'
                        : 'bg-[#EAE4DA] text-[#69746A]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-[#88968B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, course, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-[#E0D7CC] bg-white text-[#242F26] placeholder:text-[#9DA99F] focus:outline-hidden focus:border-[#3E684A]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#88968B] hover:text-[#242F26]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Buttons */}
          <div className="flex items-center gap-1 text-xs self-start sm:self-auto">
            <span className="text-[#7A887C] text-[11px] mr-1 hidden md:inline">Category:</span>
            {(['all', 'college', 'study', 'personal'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#EAE3D8] text-[#253227] font-semibold'
                    : 'text-[#6A796C] hover:bg-[#F2ECE3]'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Task List */}
      <div>
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-3xl border border-[#E8E2D7] shadow-2xs">
            <Inbox className="w-8 h-8 text-[#8C9B8E] mx-auto mb-2 opacity-70" />
            <p className="text-sm font-semibold text-[#29352B]">
              No tasks found in this view
            </p>
            <p className="text-xs text-[#718073] mt-1 max-w-sm mx-auto">
              {activeView === 'unscheduled'
                ? 'All tasks currently have deadlines assigned.'
                : activeView === 'overdue'
                ? 'Wonderful! You have no overdue tasks.'
                : activeView === 'completed'
                ? 'Complete tasks by clicking their checkbox to review them here.'
                : 'Try adjusting your filters or create a new task.'}
            </p>
            <button
              onClick={onOpenTaskModal}
              className="mt-4 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#3E684A] text-white hover:bg-[#34583E] transition-colors cursor-pointer"
            >
              Add a new task
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleComplete={toggleTaskComplete}
                onEdit={onEditTask}
                onDelete={deleteTask}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
