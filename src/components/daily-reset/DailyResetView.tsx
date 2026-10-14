import React, { useState } from 'react';
import { 
  Sunrise, 
  Sunset, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Calendar, 
  ArrowRight, 
  Smile, 
  HeartHandshake,
  Check
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import { getTodayDateString, getTodayDayOfWeek, formatFriendlyDate, formatTimeRange } from '../../utils/dateUtils';
import { Task } from '../../types';

export const DailyResetView: React.FC = () => {
  const { 
    data, 
    getTodayReset, 
    saveMorningReset, 
    saveEveningReset,
    todayClasses,
    todayTasks,
    toggleTaskComplete 
  } = useOrganizer();

  const today = getTodayDateString();
  const dayOfWeek = getTodayDayOfWeek();
  const currentReset = getTodayReset();

  // Morning State
  const [morningTopTaskIds, setMorningTopTaskIds] = useState<string[]>(
    currentReset.morningTopTaskIds || []
  );
  const [availableHours, setAvailableHours] = useState<number>(
    currentReset.availableHours || 3
  );
  const [morningEnergy, setMorningEnergy] = useState<'gentle' | 'balanced' | 'energized'>(
    currentReset.morningEnergy || 'balanced'
  );
  const [morningNote, setMorningNote] = useState<string>(
    currentReset.morningNote || ''
  );
  const [morningSaved, setMorningSaved] = useState(false);

  // Evening State
  const [eveningGratitude, setEveningGratitude] = useState<string>(
    currentReset.eveningGratitude || ''
  );
  const [eveningTomorrowNote, setEveningTomorrowNote] = useState<string>(
    currentReset.eveningTomorrowNote || ''
  );
  const [eveningSaved, setEveningSaved] = useState(false);

  const toggleTaskSelection = (id: string) => {
    setMorningTopTaskIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        // limit to 3 to prevent cognitive overload
        return [prev[1], prev[2], id];
      }
      return [...prev, id];
    });
  };

  const handleSaveMorning = (e: React.FormEvent) => {
    e.preventDefault();
    saveMorningReset({
      morningTopTaskIds,
      availableHours,
      morningEnergy,
      morningNote,
    });
    setMorningSaved(true);
    setTimeout(() => setMorningSaved(false), 2500);
  };

  const handleSaveEvening = (e: React.FormEvent) => {
    e.preventDefault();
    saveEveningReset({
      eveningGratitude,
      eveningTomorrowNote,
    });
    setEveningSaved(true);
    setTimeout(() => setEveningSaved(false), 2500);
  };

  const completedTodayTasks = todayTasks.filter((t) => t.status === 'completed');
  const remainingTodayTasks = todayTasks.filter((t) => t.status !== 'completed');

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-14 animate-in fade-in duration-200">
      {/* Page Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-[#242F26]">
          Daily Reset
        </h1>
        <p className="text-xs text-[#6C7A6E] mt-0.5">
          Two short, intentional pauses (2 minutes each). A calm morning orientation and a peaceful evening reflection.
        </p>
      </div>

      {/* 1. MORNING RESET FLOW */}
      <div className="bg-white border border-[#E6E0D5] rounded-3xl p-6 md:p-7 shadow-2xs relative">
        <div className="flex items-center justify-between pb-4 border-b border-[#EBE4DA] mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4F0E4] text-[#826E45] flex items-center justify-center">
              <Sunrise className="w-5 h-5 text-[#887042]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#253227]">
                Morning Planning Flow
              </h2>
              <p className="text-xs text-[#738275]">
                {currentReset.morningCompleted ? 'Completed for today · Edit anytime' : 'Start your day with clarity & calm'}
              </p>
            </div>
          </div>
          {currentReset.morningCompleted && (
            <span className="text-xs font-semibold text-[#3E684A] flex items-center gap-1 bg-[#EEF5EF] px-3 py-1.5 rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5" /> Set for today
            </span>
          )}
        </div>

        <form onSubmit={handleSaveMorning} className="space-y-6">
          {/* Step 1: What do I have today? */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-[#354337] uppercase tracking-wider">
              Step 1 · What do I have today? ({dayOfWeek})
            </h3>
            
            {todayClasses.length === 0 ? (
              <p className="text-xs text-[#68786B] p-3 rounded-xl bg-[#FAF7F2] border border-[#EBE5DB]">
                No classes scheduled today! Great opportunity for self-paced study or rest.
              </p>
            ) : (
              <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D7] space-y-2">
                <div className="text-xs font-medium text-[#2F4232]">
                  Today's Classes ({todayClasses.length}):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {todayClasses.map((c) => (
                    <div key={c.id} className="p-2 rounded-xl bg-white border border-[#E8E2D7]">
                      <div className="font-semibold text-[#243026] truncate">{c.subject}</div>
                      <div className="text-[11px] text-[#69796C]">
                        {formatTimeRange(c.startTime, c.endTime)} · {c.room || 'Room TBA'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: What is most important? (Pick 1-3 tasks) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#354337] uppercase tracking-wider">
                Step 2 · What is most important today? (Pick 1 to 3 anchor tasks)
              </h3>
              <span className="text-xs text-[#7B8B7D]">
                {morningTopTaskIds.length} / 3 selected
              </span>
            </div>

            {todayTasks.length === 0 ? (
              <p className="text-xs text-[#68786B] p-3 rounded-xl bg-[#FAF7F2] border border-[#EBE5DB]">
                No tasks scheduled for today yet. Add tasks from your Task Inbox to prioritize them here.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {todayTasks.map((t) => {
                  const isSelected = morningTopTaskIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTaskSelection(t.id)}
                      className={`p-3 rounded-2xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#EBF2EC] border-[#3E684A] text-[#22402B] font-medium shadow-2xs'
                          : 'bg-white border-[#E0D7CC] text-[#4F5E52] hover:border-[#CCD5CB]'
                      }`}
                    >
                      <span className="truncate">{t.title}</span>
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[#3E684A] border-[#3E684A] text-white'
                            : 'border-[#BFB6A9] bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 3: How much time & energy do I have? */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#354337] uppercase tracking-wider">
              Step 3 · How much study time do I have?
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((hrs) => (
                <button
                  key={hrs}
                  type="button"
                  onClick={() => setAvailableHours(hrs)}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border transition-colors cursor-pointer text-center ${
                    availableHours === hrs
                      ? 'bg-[#EBF2EC] border-[#3E684A] text-[#22402B] font-bold shadow-2xs'
                      : 'bg-white border-[#E0D7CC] text-[#526255] hover:border-[#CCD5CB]'
                  }`}
                >
                  {hrs} {hrs === 1 ? 'hour' : 'hours'}
                </button>
              ))}
            </div>

            {/* Morning intention note */}
            <div>
              <label className="block text-xs font-medium text-[#4D5D50] mb-1">
                Gentle Morning Intention (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Work steadily on homework, no frantic multitasking today"
                value={morningNote}
                onChange={(e) => setMorningNote(e.target.value)}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#D9D1C5] bg-white text-[#242F26] placeholder:text-[#9EA89F] focus:outline-hidden focus:border-[#3E684A]"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            {morningSaved && (
              <span className="text-xs text-[#3E684A] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Morning plan saved!
              </span>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-[#3E684A] text-white hover:bg-[#34583E] transition-colors cursor-pointer shadow-xs"
            >
              Save Morning Reset
            </button>
          </div>
        </form>
      </div>

      {/* 2. EVENING REVIEW FLOW */}
      <div className="bg-white border border-[#E6E0D5] rounded-3xl p-6 md:p-7 shadow-2xs relative">
        <div className="flex items-center justify-between pb-4 border-b border-[#EBE4DA] mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0EBF5] text-[#69547C] flex items-center justify-center">
              <Sunset className="w-5 h-5 text-[#6D5880]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#253227]">
                Evening Gentle Review
              </h2>
              <p className="text-xs text-[#738275]">
                {currentReset.eveningCompleted ? 'Completed for today · Sweet dreams!' : 'Wrap up without guilt and prepare a peaceful night'}
              </p>
            </div>
          </div>
          {currentReset.eveningCompleted && (
            <span className="text-xs font-semibold text-[#66537A] flex items-center gap-1 bg-[#F3EFF8] px-3 py-1.5 rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5" /> Reviewed
            </span>
          )}
        </div>

        <form onSubmit={handleSaveEvening} className="space-y-6">
          {/* Review what was finished */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-[#354337] uppercase tracking-wider">
              1. What did I finish today?
            </h3>
            {completedTodayTasks.length === 0 ? (
              <p className="text-xs text-[#6A786C] p-3 rounded-xl bg-[#FAF7F2] border border-[#EBE5DB]">
                Even if you didn't finish tasks on paper, attending class, reading, or resting are all valid progress!
              </p>
            ) : (
              <div className="p-3 rounded-2xl bg-[#EEF5EF] border border-[#D5E6D8] space-y-2">
                <div className="text-xs font-semibold text-[#2C5635] flex items-center gap-1.5">
                  <Smile className="w-4 h-4" />
                  <span>Celebration: You accomplished {completedTodayTasks.length} task{completedTodayTasks.length === 1 ? '' : 's'}!</span>
                </div>
                <div className="space-y-1">
                  {completedTodayTasks.map((t) => (
                    <div key={t.id} className="text-xs text-[#3E6547] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#467351]"></span>
                      <span className="line-through">{t.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Remaining tasks (Gentle, zero guilt) */}
          {remainingTodayTasks.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-[#354337] uppercase tracking-wider">
                2. What remains? ({remainingTodayTasks.length} unfinished tasks)
              </h3>
              <p className="text-xs text-[#6B796D]">
                It is okay not to finish everything. These tasks will simply stay safely in your inbox or schedule for tomorrow without any penalty or broken streaks.
              </p>
              <div className="space-y-1.5">
                {remainingTodayTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E6E0D6] flex items-center justify-between text-xs"
                  >
                    <span className="text-[#323D34] font-medium">{t.title}</span>
                    <button
                      type="button"
                      onClick={() => toggleTaskComplete(t.id)}
                      className="text-xs text-[#3E684A] font-semibold hover:underline cursor-pointer"
                    >
                      Mark done now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* One good thing / Gratitude */}
          <div>
            <label className="block text-xs font-medium text-[#465449] mb-1">
              One good thing about today (or a small win)
            </label>
            <input
              type="text"
              placeholder="e.g. Had good tea with friends, understood recursion concept"
              value={eveningGratitude}
              onChange={(e) => setEveningGratitude(e.target.value)}
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#D9D1C5] bg-white text-[#242F26] placeholder:text-[#9EA89F] focus:outline-hidden focus:border-[#3E684A]"
            />
          </div>

          {/* What to remember tomorrow */}
          <div>
            <label className="block text-xs font-medium text-[#465449] mb-1">
              Note for tomorrow morning
            </label>
            <input
              type="text"
              placeholder="e.g. Start with reading Chapter 5 before 10 AM class"
              value={eveningTomorrowNote}
              onChange={(e) => setEveningTomorrowNote(e.target.value)}
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-[#D9D1C5] bg-white text-[#242F26] placeholder:text-[#9EA89F] focus:outline-hidden focus:border-[#3E684A]"
            />
          </div>

          {/* Save Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            {eveningSaved && (
              <span className="text-xs text-[#635076] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Evening review saved! Rest well.
              </span>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-[#67547A] text-white hover:bg-[#574468] transition-colors cursor-pointer shadow-xs"
            >
              Complete Evening Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
