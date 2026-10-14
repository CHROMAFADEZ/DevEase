import React from 'react';
import { 
  Calendar, 
  CheckSquare, 
  Clock, 
  BookMarked, 
  CalendarDays,
  Sunrise, 
  Settings, 
  Timer, 
  Sparkles,
  Cloud,
  CloudOff
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import { useAuth } from '../../context/AuthContext';
import { ActiveTab } from '../../types';
import { DayEaseFullLogo } from '../brand/Logo';

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export const Sidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    todayTasks, 
    activeAssignments, 
    setIsTimerModalOpen, 
    setIsOrganizeModalOpen,
    data,
    cloudSyncStatus
  } = useOrganizer();

  const { currentUser } = useAuth();

  const pendingTodayCount = todayTasks.filter(t => t.status !== 'completed').length;
  const pendingAssignmentsCount = activeAssignments.length;

  const navItems: NavItem[] = [
    { 
      id: 'today', 
      label: 'Today', 
      icon: Calendar,
      badge: pendingTodayCount > 0 ? pendingTodayCount : undefined 
    },
    { 
      id: 'ai-assistant', 
      label: 'DayEase AI', 
      icon: Sparkles,
    },
    { 
      id: 'tasks', 
      label: 'Task Inbox', 
      icon: CheckSquare,
      badge: data.tasks.filter(t => t.status !== 'completed').length || undefined
    },
    { 
      id: 'timetable', 
      label: 'Timetable', 
      icon: Clock 
    },
    { 
      id: 'assignments', 
      label: 'Assignments', 
      icon: BookMarked,
      badge: pendingAssignmentsCount > 0 ? pendingAssignmentsCount : undefined 
    },
    { 
      id: 'routine', 
      label: 'Routine & Import', 
      icon: CalendarDays 
    },
    { 
      id: 'settings', 
      label: 'Settings & Cloud', 
      icon: Settings 
    },
  ];

  const displayName = currentUser ? (currentUser.displayName || currentUser.email?.split('@')[0] || 'Student') : (data.settings.userName || 'Student');

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-[#E8E2D8] bg-[#FAF7F2] p-5 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="px-2 py-3 mb-6">
        <DayEaseFullLogo iconSize={38} />
      </div>

      {/* Primary Action Button: Help me get organized */}
      <div className="mb-6">
        <button
          onClick={() => setIsOrganizeModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#E8EFE9] text-[#2C5237] text-sm font-medium hover:bg-[#DDE7DF] transition-colors shadow-2xs cursor-pointer border border-[#D5E3D7]"
        >
          <Sparkles className="w-4 h-4 text-[#3E684A]" />
          <span>Help me get organized</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-white text-[#232D25] shadow-xs border border-[#E4DDD3]'
                  : 'text-[#5E6C60] hover:text-[#232D25] hover:bg-[#F2ECE3]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-[#3E684A]' : 'text-[#7D8B7F]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isActive ? 'bg-[#EEF4EF] text-[#2F5A3A]' : 'bg-[#EAE4DA] text-[#69746A]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Study Timer Widget */}
      <div className="pt-4 border-t border-[#E8E2D8]">
        <button
          onClick={() => setIsTimerModalOpen(true)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-[#E6E0D6] hover:border-[#D6CFB4] text-[#344136] transition-all shadow-2xs cursor-pointer text-left group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#F1EBF5] text-[#645277] flex items-center justify-center">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#273229]">Study Focus Timer</p>
              <p className="text-[11px] text-[#717F72]">{data.settings.studySessionMinutes}m calm session</p>
            </div>
          </div>
          <span className="text-xs text-[#4F7358] font-medium group-hover:translate-x-0.5 transition-transform">
            Start &rarr;
          </span>
        </button>

        {/* User profile & cloud snippet */}
        <div className="mt-3 px-2 flex items-center justify-between text-xs text-[#7B887C]">
          <div className="flex items-center gap-1.5 min-w-0">
            {currentUser ? (
              <span className="w-2 h-2 rounded-full bg-[#3E684A] shrink-0" title="Cloud Synced" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-[#A89F90] shrink-0" title="Offline Mode" />
            )}
            <span className="truncate font-semibold text-[#253227]">
              {displayName}
            </span>
          </div>
          <span className="text-[11px] shrink-0">{currentUser ? 'Online' : 'Local'}</span>
        </div>
      </div>
    </aside>
  );
};
