import React, { useState } from 'react';
import { 
  Plus, 
  Timer, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  Cloud, 
  CloudOff, 
  RefreshCw 
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import { useAuth } from '../../context/AuthContext';
import { TaskCategory } from '../../types';
import { DayEaseCompactLogo } from '../brand/Logo';

interface HeaderProps {
  onOpenTaskModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenTaskModal }) => {
  const { 
    data, 
    clearSampleData, 
    setIsTimerModalOpen, 
    setIsOrganizeModalOpen,
    quickAddTask,
    cloudSyncStatus,
    syncErrorMessage
  } = useOrganizer();

  const { currentUser } = useAuth();

  const [quickInput, setQuickInput] = useState('');
  const [quickCategory, setQuickCategory] = useState<TaskCategory>('study');
  const [showQuickInput, setShowQuickInput] = useState(false);
  const [quickSuccess, setQuickSuccess] = useState(false);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    quickAddTask(quickInput, quickCategory);
    setQuickInput('');
    setQuickSuccess(true);
    setTimeout(() => setQuickSuccess(false), 2000);
  };

  return (
    <header className="border-b border-[#E8E2D8] bg-[#FCFAF6]/90 backdrop-blur-xs sticky top-0 z-30 px-4 md:px-8 py-3.5">
      {/* Sync Error Notification if needed */}
      {syncErrorMessage && (
        <div className="mb-3 px-3.5 py-2 rounded-xl bg-[#FFF8EB] border border-[#F6E1B8] flex items-center justify-between gap-2 text-xs text-[#8A5B20]">
          <div className="flex items-center gap-2">
            <CloudOff className="w-4 h-4 shrink-0" />
            <span>Sync notification: {syncErrorMessage}</span>
          </div>
        </div>
      )}

      {/* Sample Data Banner */}
      {data.settings.isSampleDataLoaded && (
        <div className="mb-3 px-3.5 py-2 rounded-xl bg-[#F0EFEB] border border-[#E0DCD3] flex flex-wrap items-center justify-between gap-2 text-xs text-[#525E54]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#52795B]"></span>
            <span>
              <strong>Sample college data active</strong> — explore pre-filled classes, assignments, and study tasks.
            </span>
          </div>
          <button
            onClick={clearSampleData}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white text-[#744E4E] hover:bg-[#F9ECEC] border border-[#E8D4D4] font-medium transition-colors cursor-pointer"
            title="Remove sample items so you can start with a fresh slate"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear sample data</span>
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left Side: App mobile brand, college details & subtle Cloud status */}
        <div className="flex items-center justify-between md:justify-start gap-3 flex-wrap">
          <div className="md:hidden flex items-center">
            <DayEaseCompactLogo iconSize={28} />
          </div>

          <div className="text-xs text-[#738275] hidden sm:flex items-center gap-1.5">
            <span>{data.settings.collegeName || 'My College'}</span>
            {data.settings.majorOrFocus && (
              <>
                <span className="text-[#B0BCB2]">·</span>
                <span>{data.settings.majorOrFocus}</span>
              </>
            )}
          </div>

          {/* Quiet Cloud Status Pill (No interactive login controls) */}
          {currentUser && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EBF2EC] border border-[#D5E4D8] text-[11px] text-[#2C5635] font-medium">
              {cloudSyncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin text-[#3E684A]" />
                  <span>Syncing...</span>
                </>
              ) : cloudSyncStatus === 'error' ? (
                <>
                  <CloudOff className="w-3 h-3 text-[#A24444]" />
                  <span className="text-[#A24444]">Sync paused</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3 h-3 text-[#3E684A]" />
                  <span>Cloud Synced</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Essential Actions Only (NO login or sign-up controls) */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Quick inline task trigger */}
          {!showQuickInput ? (
            <button
              onClick={() => setShowQuickInput(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-[#DDD6CB] text-[#374439] hover:bg-[#F6F2EC] transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#4D7157]" />
              <span className="hidden sm:inline">Quick task</span>
            </button>
          ) : (
            <form onSubmit={handleQuickSubmit} className="flex items-center gap-1.5 animate-in fade-in">
              <input
                type="text"
                autoFocus
                placeholder="What do you need to do?"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-[#3E684A] bg-white text-[#202A22] placeholder:text-[#9AA59C] focus:outline-hidden w-44 sm:w-56 shadow-xs"
              />
              <select
                value={quickCategory}
                onChange={(e) => setQuickCategory(e.target.value as TaskCategory)}
                className="text-xs px-2 py-1.5 rounded-lg border border-[#DDD6CB] bg-white text-[#4A574C] focus:outline-hidden"
              >
                <option value="study">Study</option>
                <option value="college">College</option>
                <option value="personal">Personal</option>
              </select>
              <button
                type="submit"
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#3E684A] text-white hover:bg-[#34583E] transition-colors cursor-pointer"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowQuickInput(false)}
                className="text-xs px-2 py-1.5 text-[#738275] hover:text-[#232D25] cursor-pointer"
              >
                Cancel
              </button>
            </form>
          )}

          {quickSuccess && (
            <span className="flex items-center gap-1 text-xs text-[#396944] font-medium bg-[#EEF5EF] px-2 py-1 rounded-md">
              <CheckCircle2 className="w-3.5 h-3.5" /> Added!
            </span>
          )}

          {/* Add Task Button */}
          <button
            onClick={onOpenTaskModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#3E684A] text-white hover:bg-[#34573E] transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Task</span>
            <span className="sm:hidden">Task</span>
          </button>

          {/* Focus Timer */}
          <button
            onClick={() => setIsTimerModalOpen(true)}
            className="p-1.5 md:px-2.5 md:py-1.5 flex items-center gap-1.5 rounded-lg bg-white border border-[#DDD6CB] text-[#556357] hover:text-[#27332A] hover:bg-[#F6F2EC] text-xs font-medium cursor-pointer"
            title="Open Study Focus Timer"
          >
            <Timer className="w-4 h-4 text-[#756185]" />
            <span className="hidden md:inline">Focus Timer</span>
          </button>

          {/* Mobile Organize trigger */}
          <button
            onClick={() => setIsOrganizeModalOpen(true)}
            className="md:hidden p-1.5 rounded-lg bg-[#EEF4EF] text-[#2F5739] border border-[#D7E3D9] cursor-pointer"
            title="Help me organize my day"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
