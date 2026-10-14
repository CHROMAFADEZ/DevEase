import React from 'react';
import { 
  Calendar, 
  CheckSquare, 
  Clock, 
  BookMarked, 
  CalendarDays, 
  Settings,
  Sparkles
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import { ActiveTab } from '../../types';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab, todayTasks, activeAssignments } = useOrganizer();

  const pendingTodayCount = todayTasks.filter((t) => t.status !== 'completed').length;
  const pendingAssignments = activeAssignments.length;

  const tabs: { id: ActiveTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'today', label: 'Today', icon: Calendar, badge: pendingTodayCount || undefined },
    { id: 'ai-assistant', label: 'AI', icon: Sparkles },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'timetable', label: 'Classes', icon: Clock },
    { id: 'assignments', label: 'Work', icon: BookMarked, badge: pendingAssignments || undefined },
    { id: 'routine', label: 'Routine', icon: CalendarDays },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FAF7F2]/95 backdrop-blur-md border-t border-[#E5DFD5] px-2 py-1.5 z-40 flex items-center justify-around shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors cursor-pointer relative min-w-[50px] ${
              isActive ? 'text-[#365D40] font-semibold' : 'text-[#6D7B70]'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.3]' : 'stroke-[1.7]'}`} />
              {tab.badge !== undefined && (
                <span className="absolute -top-1 -right-2 bg-[#3F6B4B] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
