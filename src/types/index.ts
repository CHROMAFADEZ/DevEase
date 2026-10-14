export type TaskCategory = 'college' | 'study' | 'personal';
export type TaskPriority = 'low' | 'medium' | 'high'; // low: Gentle, medium: Steady, high: Urgent
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  userId?: string;
  title: string;
  subject?: string;
  deadline?: string; // YYYY-MM-DD
  deadlineTime?: string; // HH:mm
  priority: TaskPriority;
  estimatedDuration: number; // in minutes (15, 30, 45, 60, 90)
  category: TaskCategory;
  status: TaskStatus;
  notes?: string;
  assignmentId?: string; // Links to assignment if generated from it
  createdAt: string;
  completedAt?: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface TimetableClass {
  id: string;
  userId?: string;
  subject: string;
  day: DayOfWeek;
  startTime: string; // HH:mm e.g. "09:00"
  endTime: string;   // HH:mm e.g. "10:30"
  room: string;
  instructor?: string;
  notes?: string;
  accentColor?: 'sage' | 'lavender' | 'blue' | 'amber';
}

export type AssignmentStatus = 'not_started' | 'in_progress' | 'submitted';

export interface Assignment {
  id: string;
  userId?: string;
  title: string;
  subject: string;
  assignedDate: string; // YYYY-MM-DD
  dueDate: string;      // YYYY-MM-DD
  dueTime?: string;     // HH:mm
  description: string;
  status: AssignmentStatus;
  submittedDate?: string;
}

export type AppTheme = 'cream-sage' | 'lavender-oat' | 'soft-blue' | 'nordic-slate';

export interface UserSettings {
  userName: string;
  collegeName: string;
  majorOrFocus: string;
  theme: AppTheme;
  studySessionMinutes: number; // e.g., 25, 45, 50
  breakMinutes: number;         // e.g., 5, 10, 15
  isSampleDataLoaded: boolean;
}

export interface DailyResetLog {
  date: string; // YYYY-MM-DD
  userId?: string;
  morningCompleted: boolean;
  morningTopTaskIds: string[];
  morningEnergy: 'gentle' | 'balanced' | 'energized';
  availableHours: number;
  morningNote?: string;
  
  eveningCompleted: boolean;
  eveningGratitude?: string;
  eveningTomorrowNote?: string;
}

export type CloudSyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export interface DayEaseStorageSchema {
  version: number;
  tasks: Task[];
  classes: TimetableClass[];
  assignments: Assignment[];
  settings: UserSettings;
  dailyResets: Record<string, DailyResetLog>; // keyed by YYYY-MM-DD
}

export interface ExtractedClass {
  id: string;
  subject: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string;
  instructor?: string;
  notes?: string;
  isLabOrPractical?: boolean;
  accentColor?: 'sage' | 'lavender' | 'blue' | 'amber';
  isUncertain?: boolean;
  uncertainReason?: string;
  selected?: boolean;
  isConflict?: boolean;
  conflictWith?: TimetableClass;
  isDuplicate?: boolean;
}

export type ActiveTab = 'today' | 'ai-assistant' | 'tasks' | 'timetable' | 'assignments' | 'routine' | 'reset' | 'settings';

export type AIDestination = 'timetable' | 'assignments' | 'tasks' | 'study_plan' | 'general';

export interface ProposedStudyBlock {
  id?: string;
  time?: string;
  title: string;
  type: 'focus' | 'break' | 'freetime';
  durationMins?: number;
  subject?: string;
  notes?: string;
}

export interface ProposedActions {
  summary?: string;
  classes?: ExtractedClass[];
  assignments?: Array<Omit<Assignment, 'id'> & { id?: string; selected?: boolean }>;
  tasks?: Array<Omit<Task, 'id' | 'createdAt'> & { id?: string; selected?: boolean }>;
  studyPlan?: ProposedStudyBlock[];
  followUpQuestions?: string[];
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  fileAttachment?: {
    name: string;
    mimeType: string;
    size?: number;
    previewUrl?: string;
    isDocument?: boolean;
  };
  destination?: AIDestination;
  proposedActions?: ProposedActions;
  isApplied?: boolean;
  appliedSummary?: string;
  error?: string;
  needsApiKey?: boolean;
}
