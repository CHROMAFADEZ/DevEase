import React, { useState } from 'react';
import { 
  Sparkles, 
  Calendar as CalendarIcon, 
  Clock, 
  BookMarked, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Compass,
  Smile,
  Paperclip,
  Send
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import { useAuth } from '../../context/AuthContext';
import { TaskCard } from '../tasks/TaskCard';
import { DayEaseAppIcon } from '../brand/Logo';
import { 
  formatFriendlyDate, 
  formatTimeRange, 
  getGreeting, 
  getTodayDayOfWeek,
  getTodayDateString 
} from '../../utils/dateUtils';
import { Task } from '../../types';

interface TodayViewProps {
  onOpenTaskModal: () => void;
  onEditTask: (task: Task) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({ onOpenTaskModal, onEditTask }) => {
  const {
    data,
    setActiveTab,
    todayClasses,
    todayTasks,
    overdueTasks,
    upcomingTasks,
    activeAssignments,
    nextSteps,
    toggleTaskComplete,
    deleteTask,
    setIsOrganizeModalOpen,
    openAIAssistant,
  } = useOrganizer();

  const [dashAiQuery, setDashAiQuery] = useState('');

  const { currentUser } = useAuth();

  const greeting = getGreeting();
  const dayOfWeek = getTodayDayOfWeek();
  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Extract the user's actual Google display name dynamically (no hardcoding)
  const rawDisplayName = currentUser?.displayName || data.settings.userName || '';
  const firstName = rawDisplayName
    ? rawDisplayName.trim().split(' ')[0]
    : 'Friend';
  
  // Format titlecase nicely if all uppercase (e.g. "ANAS" -> "Anas")
  const friendlyName = firstName.length > 1 && firstName === firstName.toUpperCase()
    ? firstName.charAt(0) + firstName.slice(1).toLowerCase()
    : firstName;

  const pendingTodayTasks = todayTasks.filter((t) => t.status !== 'completed');
  const completedTodayTasks = todayTasks.filter((t) => t.status === 'completed');

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* 1. Main Focus Greeting Banner */}
      <div className="bg-gradient-to-br from-[#FAF5EE] via-[#F6F1E8] to-[#EFEBE2] border border-[#E7DFD4] rounded-3xl p-7 md:p-9 relative overflow-hidden shadow-sm">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#486B52]">
              <CalendarIcon className="w-4 h-4" />
              <span>{todayFormatted}</span>
            </div>

            {/* Help me get organized button */}
            <button
              onClick={() => setIsOrganizeModalOpen(true)}
              className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-[#3E684A] text-white text-xs font-semibold hover:bg-[#34583E] transition-all shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Help me get organized</span>
            </button>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#202B22] tracking-tight">
              {greeting}, {friendlyName}!
            </h1>
            <p className="text-sm text-[#617063] mt-2 leading-relaxed max-w-xl">
              Here is your overview for today. You don't have to rush through everything—just take it one small, clear step at a time.
            </p>
          </div>

          {/* Essential Status Summary */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-4 border-t border-[#E1D8CC] text-xs text-[#526255]">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-[#3F684B]" />
              {todayClasses.length} {todayClasses.length === 1 ? 'class' : 'classes'} today
            </span>
            <span aria-hidden="true" className="text-[#C4BBAF]">·</span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3F684B]" />
              {pendingTodayTasks.length} pending task{pendingTodayTasks.length === 1 ? '' : 's'}
            </span>
            {activeAssignments.length > 0 && (
              <>
                <span aria-hidden="true" className="text-[#C4BBAF]">·</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <BookMarked className="w-3.5 h-3.5 text-[#5F5170]" />
                  {activeAssignments.length} active assignment{activeAssignments.length === 1 ? '' : 's'}
                </span>
              </>
            )}
            {overdueTasks.length > 0 && (
              <>
                <span aria-hidden="true" className="text-[#C4BBAF]">·</span>
                <span className="flex items-center gap-1.5 font-medium text-[#9E4A4A]">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {overdueTasks.length} overdue
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Central DayEase AI Assistant Hub */}
      <section className="bg-gradient-to-br from-[#FAF5ED] via-[#F4EDE2] to-[#ECE5D8] border border-[#DDD3C3] rounded-3xl p-6 md:p-7 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <DayEaseAppIcon size={38} rounded="rounded-xl" className="shadow-2xs shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#202E23]">DayEase AI Assistant</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E2EBE4] text-[#285031] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#3E684A]" />
                  Central Hub
                </span>
              </div>
              <p className="text-xs text-[#5D6F61] mt-0.5">
                Talk naturally, drop routine photos, or upload syllabus PDFs. DayEase AI organizes it for you.
              </p>
            </div>
          </div>

          <button
            onClick={() => openAIAssistant()}
            className="flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-[#DCD3C4] text-[#2F5337] hover:bg-[#F5EFE5] transition-colors cursor-pointer shadow-2xs"
          >
            <span>Open Full Assistant</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dashboard Direct Prompt Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (dashAiQuery.trim()) {
              openAIAssistant(dashAiQuery.trim());
              setDashAiQuery('');
            } else {
              openAIAssistant();
            }
          }}
          className="flex items-center gap-2 bg-white border border-[#D5CCC0] rounded-2xl p-1.5 shadow-2xs focus-within:ring-2 focus-within:ring-[#3E684A]/30 focus-within:border-[#3E684A]"
        >
          <input
            type="text"
            value={dashAiQuery}
            onChange={(e) => setDashAiQuery(e.target.value)}
            placeholder="Ask anything, e.g. 'What classes do I have today?' or 'Add C assignment due tomorrow'..."
            className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-[#232F24] placeholder-[#859487] focus:outline-none"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3E684A] text-white text-xs font-semibold hover:bg-[#34583E] transition-all cursor-pointer shadow-2xs shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask AI</span>
          </button>
        </form>

        {/* Quick Suggestion Chips on Dashboard */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-[#E5DDD0]/80">
          <span className="text-[11px] font-bold text-[#6D7D70] mr-1 uppercase tracking-wider">
            Quick Ask:
          </span>
          <button
            type="button"
            onClick={() => openAIAssistant('What classes do I have scheduled for today?')}
            className="text-xs py-1 px-2.5 rounded-xl bg-white/80 hover:bg-white border border-[#DCD3C5] text-[#334637] transition-colors cursor-pointer shadow-2xs font-medium"
          >
            📅 What classes today?
          </button>
          <button
            type="button"
            onClick={() => openAIAssistant('Show me which assignments I should finish first based on deadlines.')}
            className="text-xs py-1 px-2.5 rounded-xl bg-white/80 hover:bg-white border border-[#DCD3C5] text-[#334637] transition-colors cursor-pointer shadow-2xs font-medium"
          >
            📚 Priority assignments
          </button>
          <button
            type="button"
            onClick={() => openAIAssistant('Help me plan my study time for today without feeling overwhelmed.')}
            className="text-xs py-1 px-2.5 rounded-xl bg-white/80 hover:bg-white border border-[#DCD3C5] text-[#334637] transition-colors cursor-pointer shadow-2xs font-medium"
          >
            ⏱️ Plan study time
          </button>
          <button
            type="button"
            onClick={() => openAIAssistant('My C programming assignment is due tomorrow. Add a task for it.')}
            className="text-xs py-1 px-2.5 rounded-xl bg-white/80 hover:bg-white border border-[#DCD3C5] text-[#334637] transition-colors cursor-pointer shadow-2xs font-medium"
          >
            📝 Add task for tomorrow
          </button>
          <button
            type="button"
            onClick={() => openAIAssistant()}
            className="text-xs py-1 px-2.5 rounded-xl bg-[#E8EFE9] hover:bg-[#DCE7DE] border border-[#CBDCCF] text-[#285032] font-semibold transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
          >
            <Paperclip className="w-3 h-3" />
            <span>Upload routine or PDF</span>
          </button>
        </div>
      </section>

      {/* 3. "My next steps" (Prioritized Anti-Paralysis Focus List) */}
      <section className="bg-white border border-[#E6E0D5] rounded-3xl p-6 md:p-7 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#EBF2EC] text-[#345C3E] flex items-center justify-center">
              <Compass className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#232F25]">My Next Steps</h2>
              <p className="text-xs text-[#718073]">
                Your top 3 focus items right now to eliminate decision fatigue
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('tasks')}
            className="text-xs text-[#3E684A] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>View all tasks</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {nextSteps.length === 0 ? (
          <div className="text-center py-8 px-4 bg-[#FBF9F6] rounded-2xl border border-dashed border-[#E4DDD2]">
            <Smile className="w-6 h-6 text-[#497355] mx-auto mb-2 opacity-80" />
            <p className="text-xs font-semibold text-[#2A352C]">Your focus list is clear!</p>
            <p className="text-xs text-[#6F7D71] mt-1 max-w-sm mx-auto">
              You have no pending urgent items. Add a task or enjoy your peaceful study break.
            </p>
            <button
              onClick={onOpenTaskModal}
              className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#3E684A] text-white hover:bg-[#32563C] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add a task</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {nextSteps.map((task) => (
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
      </section>

      {/* 3. Essential Two-Column Grid: Today's Classes & Relevant Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Today's Classes */}
        <section className="bg-white border border-[#E6E0D5] rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#3E684A]" />
              <h2 className="text-sm font-bold text-[#232F25]">
                Today's Classes ({dayOfWeek})
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('timetable')}
              className="text-xs text-[#3E684A] hover:underline font-semibold cursor-pointer"
            >
              Full Timetable
            </button>
          </div>

          {todayClasses.length === 0 ? (
            <div className="py-8 text-center bg-[#FAF7F2] rounded-2xl border border-dashed border-[#E5DFD4]">
              <p className="text-xs font-medium text-[#465348]">No scheduled classes today</p>
              <p className="text-xs text-[#7B887C] mt-1">
                {data.classes.length === 0
                  ? 'Your timetable is empty. Import your college schedule or add classes.'
                  : 'A free day to catch up on assignments or rest comfortably!'}
              </p>
              {data.classes.length === 0 && (
                <button
                  onClick={() => setActiveTab('routine')}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#3E684A] text-white hover:bg-[#32563C] transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Import Timetable with AI</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {todayClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="p-3.5 rounded-2xl border border-[#E8E2D7] bg-[#FCFAF7] hover:border-[#D8D0C3] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-[#232F25]">
                        {cls.subject}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-[#6B796D] mt-1">
                        <span className="font-semibold text-[#38483B]">
                          {formatTimeRange(cls.startTime, cls.endTime)}
                        </span>
                        <span aria-hidden="true" className="text-[#BFB5A7]">·</span>
                        <span>{cls.room || 'Room TBA'}</span>
                      </div>
                    </div>
                    {cls.instructor && (
                      <span className="text-[11px] text-[#717F73]">
                        {cls.instructor}
                      </span>
                    )}
                  </div>
                  {cls.notes && (
                    <p className="text-[11px] text-[#79887B] mt-2 pt-2 border-t border-[#EFEAE1]">
                      {cls.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right: Relevant Upcoming Deadlines & Overdue Notice */}
        <section className="bg-white border border-[#E6E0D5] rounded-3xl p-6 shadow-xs space-y-5">
          {/* Overdue Tasks if any */}
          {overdueTasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-[#232F25] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#A85B5B]"></span>
                  <span>Overdue (No Stress)</span>
                </h2>
                <span className="text-xs text-[#7B8A7D]">
                  {overdueTasks.length} item{overdueTasks.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="space-y-2">
                {overdueTasks.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-xl border border-[#ECDCDA] bg-[#FEFBFB] flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-medium text-[#29322A] truncate">{t.title}</div>
                      <div className="text-[11px] text-[#9E4A4A] mt-0.5">
                        Due {formatFriendlyDate(t.deadline)}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleTaskComplete(t.id)}
                      className="shrink-0 px-2.5 py-1 text-xs rounded-lg bg-[#3E684A] text-white hover:bg-[#34583E] transition-colors cursor-pointer font-semibold"
                    >
                      Done
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Assignment Deadlines */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#232F25] flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-[#5F5170]" />
                <span>Relevant Upcoming Deadlines</span>
              </h2>
              <button
                onClick={() => setActiveTab('assignments')}
                className="text-xs text-[#3E684A] hover:underline font-semibold cursor-pointer"
              >
                View all
              </button>
            </div>

            {activeAssignments.length === 0 ? (
              <p className="text-xs text-[#6B7A6D] bg-[#F9F7F3] p-3 rounded-xl border border-[#EBE5DB]">
                🌱 No upcoming assignment submissions due right now.
              </p>
            ) : (
              <div className="space-y-2">
                {activeAssignments.slice(0, 4).map((a) => (
                  <div
                    key={a.id}
                    className="p-2.5 rounded-xl border border-[#E7E2D8] bg-[#FAF8F5] flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-[#283329] truncate">{a.title}</div>
                      <div className="text-[11px] text-[#69786B] mt-0.5">
                        {a.subject} · Due {formatFriendlyDate(a.dueDate)}
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#466950] shrink-0">
                      {a.status === 'in_progress' ? 'In progress' : 'Not started'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 4. Today's Full Task List */}
      <section className="bg-white border border-[#E6E0D5] rounded-3xl p-6 md:p-7 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#232F25]">
              Today's Tasks ({pendingTodayTasks.length} remaining)
            </h2>
            <p className="text-xs text-[#718073]">Tasks scheduled specifically for today</p>
          </div>
          <button
            onClick={onOpenTaskModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#EAF0EB] text-[#2C5237] hover:bg-[#DDE7DF] transition-colors cursor-pointer border border-[#D5E1D7]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add task</span>
          </button>
        </div>

        {todayTasks.length === 0 ? (
          <div className="text-center py-8 bg-[#FAF7F2] rounded-2xl border border-dashed border-[#E5DFD4]">
            <p className="text-xs font-medium text-[#445045]">No tasks scheduled for today yet</p>
            <p className="text-xs text-[#78877A] mt-1">
              Add a quick task or pull from your Task Inbox.
            </p>
            <button
              onClick={onOpenTaskModal}
              className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#3E684A] text-white hover:bg-[#34583E] cursor-pointer"
            >
              Create today's first task
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayTasks.map((task) => (
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
      </section>
    </div>
  );
};
