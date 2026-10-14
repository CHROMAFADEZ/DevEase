import React, { useState } from 'react';
import { BookMarked, RefreshCw } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrganizerProvider, useOrganizer } from './context/OrganizerContext';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { Header } from './components/layout/Header';
import { TodayView } from './components/home/TodayView';
import { TaskInboxView } from './components/tasks/TaskInboxView';
import { TimetableView } from './components/timetable/TimetableView';
import { AssignmentsView } from './components/assignments/AssignmentsView';
import { DailyResetView } from './components/daily-reset/DailyResetView';
import { RoutineView } from './components/routine/RoutineView';
import { SettingsView } from './components/settings/SettingsView';
import { DayEaseAIAssistant } from './components/ai/DayEaseAIAssistant';
import { TaskFormModal } from './components/tasks/TaskFormModal';
import { OrganizeModal } from './components/home/OrganizeModal';
import { StudyTimerModal } from './components/common/StudyTimerModal';
import { LoginPage } from './components/auth/LoginPage';
import { DayEaseAppIcon } from './components/brand/Logo';
import { Task } from './types';

const MainContent: React.FC = () => {
  const { activeTab } = useOrganizer();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleOpenNewTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#242F26] flex flex-col md:flex-row">
      {/* Desktop Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-6">
        {/* Clean Dashboard Header (No login or sign-up controls) */}
        <Header onOpenTaskModal={handleOpenNewTask} />

        {/* Dynamic Page Container */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {activeTab === 'today' && (
            <TodayView
              onOpenTaskModal={handleOpenNewTask}
              onEditTask={handleEditTask}
            />
          )}
          {activeTab === 'ai-assistant' && <DayEaseAIAssistant />}
          {activeTab === 'tasks' && (
            <TaskInboxView
              onOpenTaskModal={handleOpenNewTask}
              onEditTask={handleEditTask}
            />
          )}
          {activeTab === 'timetable' && <TimetableView />}
          {activeTab === 'assignments' && <AssignmentsView />}
          {activeTab === 'routine' && <RoutineView />}
          {activeTab === 'reset' && <RoutineView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Global Modals */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        initialTask={editingTask}
      />
      <OrganizeModal />
      <StudyTimerModal />
    </div>
  );
};

const AppRouter: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const [offlineBypass, setOfflineBypass] = useState(false);

  // Restore authenticated session after refresh: show calm loader while verifying
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4">
        <DayEaseAppIcon size={52} rounded="rounded-2xl" className="shadow-md mb-4 animate-pulse" />
        <div className="flex items-center gap-2 text-xs font-semibold text-[#5A6F5E]">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Opening DayEase...</span>
        </div>
      </div>
    );
  }

  // When no user is signed in, show the dedicated login page
  if (!currentUser && !offlineBypass) {
    return <LoginPage onContinueOffline={() => setOfflineBypass(true)} />;
  }

  return <MainContent />;
};

export default function App() {
  return (
    <AuthProvider>
      <OrganizerProvider>
        <AppRouter />
      </OrganizerProvider>
    </AuthProvider>
  );
}
