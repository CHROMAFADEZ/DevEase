import { DayOfWeek } from '../types';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDayOfWeek(): DayOfWeek {
  const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayIndex = new Date().getDay();
  return days[dayIndex];
}

export function formatFriendlyDate(dateStr?: string): string {
  if (!dateStr) return 'No date set';
  const today = getTodayDateString();
  
  if (dateStr === today) return 'Today';
  
  // Calculate relative difference
  const targetDate = new Date(`${dateStr}T00:00:00`);
  const currentDate = new Date(`${today}T00:00:00`);
  const diffTime = targetDate.getTime() - currentDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1 && diffDays <= 6) return `In ${diffDays} days`;
  if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;
  
  return targetDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function getDaysRemaining(dueDateStr: string): {
  days: number;
  label: string;
  isOverdue: boolean;
  isToday: boolean;
} {
  const today = getTodayDateString();
  const targetDate = new Date(`${dueDateStr}T00:00:00`);
  const currentDate = new Date(`${today}T00:00:00`);
  const diffTime = targetDate.getTime() - currentDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      days: diffDays,
      label: `${Math.abs(diffDays)}d overdue`,
      isOverdue: true,
      isToday: false,
    };
  }
  if (diffDays === 0) {
    return {
      days: 0,
      label: 'Due today',
      isOverdue: false,
      isToday: true,
    };
  }
  if (diffDays === 1) {
    return {
      days: 1,
      label: 'Due tomorrow',
      isOverdue: false,
      isToday: false,
    };
  }
  return {
    days: diffDays,
    label: `${diffDays} days left`,
    isOverdue: false,
    isToday: false,
  };
}

export function isTaskOverdue(deadline?: string, status?: string): boolean {
  if (!deadline || status === 'completed') return false;
  const today = getTodayDateString();
  return deadline < today;
}

export function isTaskDueToday(deadline?: string): boolean {
  if (!deadline) return false;
  return deadline === getTodayDateString();
}

export function isTaskUpcoming(deadline?: string): boolean {
  if (!deadline) return false;
  const today = getTodayDateString();
  return deadline > today;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function formatTimeRange(start: string, end: string): string {
  const formatSingle = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h)) return timeStr;
    const period = h >= 12 ? 'pm' : 'am';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${String(m).padStart(2, '0')}${period}`;
  };
  return `${formatSingle(start)} – ${formatSingle(end)}`;
}

export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
