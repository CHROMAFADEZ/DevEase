import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  ActiveTab,
  Assignment,
  CloudSyncStatus,
  DailyResetLog,
  DayEaseStorageSchema,
  Task,
  TaskCategory,
  TimetableClass,
  UserSettings,
} from '../types';
import { createEmptyData, createInitialSampleData } from '../data/initialData';
import { getTodayDateString, getTodayDayOfWeek } from '../utils/dateUtils';
import { useAuth } from './AuthContext';
import { db, handleFirestoreError, OperationType, testFirestoreConnection } from '../lib/firebase';

const STORAGE_KEY = 'dayease_college_organizer_v1';

interface OrganizerContextType {
  data: DayEaseStorageSchema;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  
  // Navigation helpers
  isTimerModalOpen: boolean;
  setIsTimerModalOpen: (open: boolean) => void;
  isOrganizeModalOpen: boolean;
  setIsOrganizeModalOpen: (open: boolean) => void;

  // Cloud & Auth status
  cloudSyncStatus: CloudSyncStatus;
  lastSyncedAt: Date | null;
  syncErrorMessage: string | null;

  // Task methods
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => string;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => void;
  quickAddTask: (title: string, category?: TaskCategory) => string;

  // Timetable methods
  addClass: (cls: Omit<TimetableClass, 'id'>) => string;
  updateClass: (id: string, updates: Partial<TimetableClass>) => void;
  deleteClass: (id: string) => void;
  importClassesBatch: (
    classes: Array<Omit<TimetableClass, 'id'> | TimetableClass>,
    options?: { replaceConflicts?: boolean }
  ) => { importedCount: number; skippedDuplicates: number; replacedCount: number };

  // Assignment methods
  addAssignment: (assignment: Omit<Assignment, 'id'>) => string;
  updateAssignment: (id: string, updates: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;
  toggleAssignmentSubmitted: (id: string) => void;
  createTaskForAssignment: (assignmentId: string) => string | null;
  importAssignmentsBatch: (assignments: Array<Omit<Assignment, 'id'>>) => number;
  importTasksBatch: (tasks: Array<Omit<Task, 'id' | 'createdAt'>>) => number;

  // AI Assistant helpers
  aiInitialPrompt: string | null;
  setAiInitialPrompt: (prompt: string | null) => void;
  openAIAssistant: (initialPrompt?: string) => void;

  // Daily Reset methods
  getTodayReset: () => DailyResetLog;
  saveMorningReset: (log: Partial<DailyResetLog>) => void;
  saveEveningReset: (log: Partial<DailyResetLog>) => void;

  // Settings & Storage methods
  updateSettings: (updates: Partial<UserSettings>) => void;
  resetToSampleData: () => void;
  clearSampleData: () => void;
  clearAllData: () => void;
  exportDataAsJson: () => void;
  importDataFromJson: (jsonStr: string, mode: 'replace' | 'merge') => { success: boolean; error?: string };

  // Computed values
  todayClasses: TimetableClass[];
  todayTasks: Task[];
  overdueTasks: Task[];
  upcomingTasks: Task[];
  unscheduledTasks: Task[];
  activeAssignments: Assignment[];
  nextSteps: Task[];
}

const OrganizerContext = createContext<OrganizerContextType | undefined>(undefined);

export const OrganizerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [data, setData] = useState<DayEaseStorageSchema>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.tasks) && Array.isArray(parsed.classes)) {
          return parsed as DayEaseStorageSchema;
        }
      }
    } catch (e) {
      console.warn('Failed to read from localStorage:', e);
    }
    return createInitialSampleData();
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isOrganizeModalOpen, setIsOrganizeModalOpen] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | null>(null);

  const openAIAssistant = (initialPrompt?: string) => {
    if (initialPrompt) {
      setAiInitialPrompt(initialPrompt);
    }
    setActiveTab('ai-assistant');
  };

  // Cloud sync tracking
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('offline');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);

  const isMigratingRef = useRef(false);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [data]);

  // Apply theme to document body
  useEffect(() => {
    const theme = data.settings.theme || 'cream-sage';
    document.body.setAttribute('data-theme', theme);
  }, [data.settings.theme]);

  // Test connection on mount
  useEffect(() => {
    testFirestoreConnection().catch((err) => {
      console.warn('Initial Firestore ping check:', err);
    });
  }, []);

  // Update userName on Google Sign-In
  useEffect(() => {
    if (currentUser) {
      const preferredName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Student';
      setData((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          userName: preferredName,
        },
      }));

      // Update or create user profile document in Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      setDoc(
        userDocRef,
        {
          displayName: preferredName,
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || '',
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
      });
    }
  }, [currentUser]);

  // Cloud Sync & Real-time Listeners Effect
  useEffect(() => {
    if (!currentUser) {
      setCloudSyncStatus('offline');
      setSyncErrorMessage(null);
      return;
    }

    const uid = currentUser.uid;
    setCloudSyncStatus('syncing');

    let isMounted = true;
    let unsubTasks: (() => void) | null = null;
    let unsubClasses: (() => void) | null = null;
    let unsubAssignments: (() => void) | null = null;
    let unsubResets: (() => void) | null = null;

    const initializeCloudSync = async () => {
      try {
        if (isMigratingRef.current) return;
        isMigratingRef.current = true;

        // 1. Fetch current cloud documents to see what exists in cloud
        const tasksCol = collection(db, 'users', uid, 'tasks');
        const classesCol = collection(db, 'users', uid, 'classes');
        const assignmentsCol = collection(db, 'users', uid, 'assignments');
        const resetsCol = collection(db, 'users', uid, 'dailyResets');

        const [tasksSnap, classesSnap, assignsSnap, resetsSnap] = await Promise.all([
          getDocs(tasksCol),
          getDocs(classesCol),
          getDocs(assignmentsCol),
          getDocs(resetsCol),
        ]);

        const cloudTaskIds = new Set(tasksSnap.docs.map((d) => d.id));
        const cloudClassIds = new Set(classesSnap.docs.map((d) => d.id));
        const cloudAssignIds = new Set(assignsSnap.docs.map((d) => d.id));
        const cloudResetIds = new Set(resetsSnap.docs.map((d) => d.id));

        // 2. Upload any local items not present in Cloud (preserves local data without duplication)
        const uploadPromises: Promise<any>[] = [];

        data.tasks.forEach((task) => {
          if (!cloudTaskIds.has(task.id)) {
            const taskDoc = doc(db, 'users', uid, 'tasks', task.id);
            uploadPromises.push(
              setDoc(taskDoc, { ...task, userId: uid }).catch((err) =>
                handleFirestoreError(err, OperationType.WRITE, `users/${uid}/tasks/${task.id}`)
              )
            );
          }
        });

        data.classes.forEach((cls) => {
          if (!cloudClassIds.has(cls.id)) {
            const classDoc = doc(db, 'users', uid, 'classes', cls.id);
            uploadPromises.push(
              setDoc(classDoc, { ...cls, userId: uid }).catch((err) =>
                handleFirestoreError(err, OperationType.WRITE, `users/${uid}/classes/${cls.id}`)
              )
            );
          }
        });

        data.assignments.forEach((assignment) => {
          if (!cloudAssignIds.has(assignment.id)) {
            const assignDoc = doc(db, 'users', uid, 'assignments', assignment.id);
            uploadPromises.push(
              setDoc(assignDoc, { ...assignment, userId: uid }).catch((err) =>
                handleFirestoreError(err, OperationType.WRITE, `users/${uid}/assignments/${assignment.id}`)
              )
            );
          }
        });

        Object.entries(data.dailyResets || {}).forEach(([dateStr, log]) => {
          if (!cloudResetIds.has(dateStr)) {
            const resetDoc = doc(db, 'users', uid, 'dailyResets', dateStr);
            uploadPromises.push(
              setDoc(resetDoc, { ...log, userId: uid }).catch((err) =>
                handleFirestoreError(err, OperationType.WRITE, `users/${uid}/dailyResets/${dateStr}`)
              )
            );
          }
        });

        await Promise.all(uploadPromises);

        if (!isMounted) return;

        // 3. Attach real-time listeners for all four collections with error handlers
        unsubTasks = onSnapshot(
          tasksCol,
          (snapshot) => {
            const incoming: Task[] = [];
            snapshot.forEach((docSnap) => {
              incoming.push(docSnap.data() as Task);
            });
            setData((prev) => ({
              ...prev,
              tasks: incoming,
            }));
            setLastSyncedAt(new Date());
            setCloudSyncStatus('synced');
          },
          (error) => {
            setCloudSyncStatus('error');
            setSyncErrorMessage(error.message);
            handleFirestoreError(error, OperationType.GET, `users/${uid}/tasks`);
          }
        );

        unsubClasses = onSnapshot(
          classesCol,
          (snapshot) => {
            const incoming: TimetableClass[] = [];
            snapshot.forEach((docSnap) => {
              incoming.push(docSnap.data() as TimetableClass);
            });
            setData((prev) => ({
              ...prev,
              classes: incoming,
            }));
            setLastSyncedAt(new Date());
          },
          (error) => {
            setCloudSyncStatus('error');
            setSyncErrorMessage(error.message);
            handleFirestoreError(error, OperationType.GET, `users/${uid}/classes`);
          }
        );

        unsubAssignments = onSnapshot(
          assignmentsCol,
          (snapshot) => {
            const incoming: Assignment[] = [];
            snapshot.forEach((docSnap) => {
              incoming.push(docSnap.data() as Assignment);
            });
            setData((prev) => ({
              ...prev,
              assignments: incoming,
            }));
            setLastSyncedAt(new Date());
          },
          (error) => {
            setCloudSyncStatus('error');
            setSyncErrorMessage(error.message);
            handleFirestoreError(error, OperationType.GET, `users/${uid}/assignments`);
          }
        );

        unsubResets = onSnapshot(
          resetsCol,
          (snapshot) => {
            const incomingResets: Record<string, DailyResetLog> = {};
            snapshot.forEach((docSnap) => {
              const r = docSnap.data() as DailyResetLog;
              incomingResets[r.date] = r;
            });
            setData((prev) => ({
              ...prev,
              dailyResets: incomingResets,
            }));
            setLastSyncedAt(new Date());
          },
          (error) => {
            setCloudSyncStatus('error');
            setSyncErrorMessage(error.message);
            handleFirestoreError(error, OperationType.GET, `users/${uid}/dailyResets`);
          }
        );

        setCloudSyncStatus('synced');
        setSyncErrorMessage(null);
        setLastSyncedAt(new Date());
      } catch (err: any) {
        console.error('Error during cloud sync bootstrap:', err);
        setCloudSyncStatus('error');
        setSyncErrorMessage(err.message || 'Error syncing data with Cloud Firestore');
      } finally {
        isMigratingRef.current = false;
      }
    };

    initializeCloudSync();

    return () => {
      isMounted = false;
      if (unsubTasks) unsubTasks();
      if (unsubClasses) unsubClasses();
      if (unsubAssignments) unsubAssignments();
      if (unsubResets) unsubResets();
    };
  }, [currentUser]);

  // Task Actions
  const addTask = (taskInput: Omit<Task, 'id' | 'createdAt'>): string => {
    const newId = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const newTask: Task = {
      ...taskInput,
      id: newId,
      userId: currentUser?.uid,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));

    if (currentUser) {
      setDoc(doc(db, 'users', currentUser.uid, 'tasks', newId), newTask).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/tasks/${newId}`);
      });
    }

    return newId;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    let updatedTask: Task | undefined;
    setData((prev) => {
      const nextTasks = prev.tasks.map((t) => {
        if (t.id === id) {
          updatedTask = { ...t, ...updates };
          return updatedTask;
        }
        return t;
      });
      return { ...prev, tasks: nextTasks };
    });

    if (currentUser && updatedTask) {
      setDoc(doc(db, 'users', currentUser.uid, 'tasks', id), updatedTask, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/tasks/${id}`);
      });
    }
  };

  const deleteTask = (id: string) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));

    if (currentUser) {
      deleteDoc(doc(db, 'users', currentUser.uid, 'tasks', id)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `users/${currentUser.uid}/tasks/${id}`);
      });
    }
  };

  const toggleTaskComplete = (id: string) => {
    let targetTask: Task | undefined;
    setData((prev) => {
      const nextTasks = prev.tasks.map((t) => {
        if (t.id !== id) return t;
        const willComplete = t.status !== 'completed';
        targetTask = {
          ...t,
          status: willComplete ? 'completed' : 'pending',
          completedAt: willComplete ? new Date().toISOString() : undefined,
        };
        return targetTask;
      });
      return { ...prev, tasks: nextTasks };
    });

    if (currentUser && targetTask) {
      setDoc(doc(db, 'users', currentUser.uid, 'tasks', id), targetTask, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/tasks/${id}`);
      });
    }
  };

  const quickAddTask = (title: string, category: TaskCategory = 'study'): string => {
    const today = getTodayDateString();
    return addTask({
      title: title.trim(),
      category,
      priority: 'medium',
      estimatedDuration: 30,
      status: 'pending',
      deadline: today,
    });
  };

  // Timetable Actions
  const addClass = (clsInput: Omit<TimetableClass, 'id'>): string => {
    const newId = 'class_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const newClass: TimetableClass = {
      ...clsInput,
      id: newId,
      userId: currentUser?.uid,
    };
    setData((prev) => ({
      ...prev,
      classes: [...prev.classes, newClass],
    }));

    if (currentUser) {
      setDoc(doc(db, 'users', currentUser.uid, 'classes', newId), newClass).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/classes/${newId}`);
      });
    }

    return newId;
  };

  const updateClass = (id: string, updates: Partial<TimetableClass>) => {
    let updatedClass: TimetableClass | undefined;
    setData((prev) => {
      const nextClasses = prev.classes.map((c) => {
        if (c.id === id) {
          updatedClass = { ...c, ...updates };
          return updatedClass;
        }
        return c;
      });
      return { ...prev, classes: nextClasses };
    });

    if (currentUser && updatedClass) {
      setDoc(doc(db, 'users', currentUser.uid, 'classes', id), updatedClass, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/classes/${id}`);
      });
    }
  };

  const deleteClass = (id: string) => {
    setData((prev) => ({
      ...prev,
      classes: prev.classes.filter((c) => c.id !== id),
    }));

    if (currentUser) {
      deleteDoc(doc(db, 'users', currentUser.uid, 'classes', id)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `users/${currentUser.uid}/classes/${id}`);
      });
    }
  };

  const importClassesBatch = (
    incomingClasses: Array<Omit<TimetableClass, 'id'> | TimetableClass>,
    options: { replaceConflicts?: boolean } = {}
  ): { importedCount: number; skippedDuplicates: number; replacedCount: number } => {
    let importedCount = 0;
    let skippedDuplicates = 0;
    let replacedCount = 0;

    setData((prev) => {
      const currentClasses = [...prev.classes];

      for (const item of incomingClasses) {
        // 1. Exact Duplicate Check
        const isExactDuplicate = currentClasses.some(
          (c) =>
            c.day === item.day &&
            c.startTime === item.startTime &&
            c.endTime === item.endTime &&
            c.subject.trim().toLowerCase() === item.subject.trim().toLowerCase()
        );

        if (isExactDuplicate) {
          skippedDuplicates++;
          continue;
        }

        // 2. Conflict Check
        const conflictingIdx = currentClasses.findIndex(
          (c) =>
            c.day === item.day &&
            c.startTime < item.endTime &&
            c.endTime > item.startTime
        );

        const newId =
          'id' in item && item.id
            ? item.id
            : 'class_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

        const preparedClass: TimetableClass = {
          ...item,
          id: newId,
          userId: currentUser?.uid,
        };

        if (conflictingIdx !== -1 && options.replaceConflicts) {
          const oldClass = currentClasses[conflictingIdx];
          currentClasses[conflictingIdx] = preparedClass;
          replacedCount++;
          if (currentUser) {
            deleteDoc(doc(db, 'users', currentUser.uid, 'classes', oldClass.id)).catch(() => {});
            setDoc(doc(db, 'users', currentUser.uid, 'classes', newId), preparedClass).catch(() => {});
          }
        } else {
          currentClasses.push(preparedClass);
          importedCount++;
          if (currentUser) {
            setDoc(doc(db, 'users', currentUser.uid, 'classes', newId), preparedClass).catch(() => {});
          }
        }
      }

      return {
        ...prev,
        classes: currentClasses,
      };
    });

    return { importedCount, skippedDuplicates, replacedCount };
  };

  // Assignment Actions
  const addAssignment = (assignInput: Omit<Assignment, 'id'>): string => {
    const newId = 'assign_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    const newAssignment: Assignment = {
      ...assignInput,
      id: newId,
      userId: currentUser?.uid,
    };
    setData((prev) => ({
      ...prev,
      assignments: [...prev.assignments, newAssignment],
    }));

    if (currentUser) {
      setDoc(doc(db, 'users', currentUser.uid, 'assignments', newId), newAssignment).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/assignments/${newId}`);
      });
    }

    return newId;
  };

  const updateAssignment = (id: string, updates: Partial<Assignment>) => {
    let updatedAssignment: Assignment | undefined;
    setData((prev) => {
      const nextAssigns = prev.assignments.map((a) => {
        if (a.id === id) {
          updatedAssignment = { ...a, ...updates };
          return updatedAssignment;
        }
        return a;
      });
      return { ...prev, assignments: nextAssigns };
    });

    if (currentUser && updatedAssignment) {
      setDoc(doc(db, 'users', currentUser.uid, 'assignments', id), updatedAssignment, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/assignments/${id}`);
      });
    }
  };

  const deleteAssignment = (id: string) => {
    setData((prev) => ({
      ...prev,
      assignments: prev.assignments.filter((a) => a.id !== id),
      tasks: prev.tasks.map((t) => (t.assignmentId === id ? { ...t, assignmentId: undefined } : t)),
    }));

    if (currentUser) {
      deleteDoc(doc(db, 'users', currentUser.uid, 'assignments', id)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `users/${currentUser.uid}/assignments/${id}`);
      });
    }
  };

  const toggleAssignmentSubmitted = (id: string) => {
    let targetAssignment: Assignment | undefined;
    setData((prev) => {
      const nextAssigns = prev.assignments.map((a) => {
        if (a.id !== id) return a;
        const willSubmit = a.status !== 'submitted';
        targetAssignment = {
          ...a,
          status: willSubmit ? 'submitted' : 'in_progress',
          submittedDate: willSubmit ? getTodayDateString() : undefined,
        };
        return targetAssignment;
      });
      return { ...prev, assignments: nextAssigns };
    });

    if (currentUser && targetAssignment) {
      setDoc(doc(db, 'users', currentUser.uid, 'assignments', id), targetAssignment, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/assignments/${id}`);
      });
    }
  };

  const createTaskForAssignment = (assignmentId: string): string | null => {
    const assignment = data.assignments.find((a) => a.id === assignmentId);
    if (!assignment) return null;

    const existing = data.tasks.find((t) => t.assignmentId === assignmentId && t.status !== 'completed');
    if (existing) {
      return existing.id;
    }

    const taskId = addTask({
      title: `Work on: ${assignment.title}`,
      subject: assignment.subject,
      deadline: assignment.dueDate,
      priority: 'high',
      estimatedDuration: 45,
      category: 'college',
      status: 'pending',
      assignmentId: assignment.id,
      notes: assignment.description || undefined,
    });
    return taskId;
  };

  const importAssignmentsBatch = (incomingAssignments: Array<Omit<Assignment, 'id'>>): number => {
    let imported = 0;
    setData((prev) => {
      const current = [...prev.assignments];

      for (const item of incomingAssignments) {
        const isDuplicate = current.some(
          (a) =>
            a.title.trim().toLowerCase() === item.title.trim().toLowerCase() &&
            a.dueDate === item.dueDate
        );
        if (isDuplicate) continue;

        const newId = 'assign_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        const newAssign: Assignment = {
          ...item,
          id: newId,
          userId: currentUser?.uid,
        };
        current.push(newAssign);
        imported++;

        if (currentUser) {
          setDoc(doc(db, 'users', currentUser.uid, 'assignments', newId), newAssign).catch((err) => {
            handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/assignments/${newId}`);
          });
        }
      }

      return {
        ...prev,
        assignments: current,
      };
    });
    return imported;
  };

  const importTasksBatch = (incomingTasks: Array<Omit<Task, 'id' | 'createdAt'>>): number => {
    let imported = 0;
    const nowIso = new Date().toISOString();
    setData((prev) => {
      const current = [...prev.tasks];

      for (const item of incomingTasks) {
        const isDuplicate = current.some(
          (t) =>
            t.title.trim().toLowerCase() === item.title.trim().toLowerCase() &&
            t.deadline === item.deadline
        );
        if (isDuplicate) continue;

        const newId = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        const newTask: Task = {
          ...item,
          id: newId,
          createdAt: nowIso,
          userId: currentUser?.uid,
        };
        current.push(newTask);
        imported++;

        if (currentUser) {
          setDoc(doc(db, 'users', currentUser.uid, 'tasks', newId), newTask).catch((err) => {
            handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/tasks/${newId}`);
          });
        }
      }

      return {
        ...prev,
        tasks: current,
      };
    });
    return imported;
  };

  // Daily Reset Actions
  const getTodayReset = (): DailyResetLog => {
    const today = getTodayDateString();
    if (data.dailyResets && data.dailyResets[today]) {
      return data.dailyResets[today];
    }
    return {
      date: today,
      userId: currentUser?.uid,
      morningCompleted: false,
      morningTopTaskIds: [],
      morningEnergy: 'balanced',
      availableHours: 3,
      eveningCompleted: false,
    };
  };

  const saveMorningReset = (log: Partial<DailyResetLog>) => {
    const today = getTodayDateString();
    let savedLog: DailyResetLog | undefined;
    setData((prev) => {
      const existing = prev.dailyResets?.[today] || {
        date: today,
        morningCompleted: false,
        morningTopTaskIds: [],
        morningEnergy: 'balanced',
        availableHours: 3,
        eveningCompleted: false,
      };
      savedLog = {
        ...existing,
        ...log,
        userId: currentUser?.uid,
        morningCompleted: true,
      };
      return {
        ...prev,
        dailyResets: {
          ...prev.dailyResets,
          [today]: savedLog,
        },
      };
    });

    if (currentUser && savedLog) {
      setDoc(doc(db, 'users', currentUser.uid, 'dailyResets', today), savedLog, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/dailyResets/${today}`);
      });
    }
  };

  const saveEveningReset = (log: Partial<DailyResetLog>) => {
    const today = getTodayDateString();
    let savedLog: DailyResetLog | undefined;
    setData((prev) => {
      const existing = prev.dailyResets?.[today] || {
        date: today,
        morningCompleted: false,
        morningTopTaskIds: [],
        morningEnergy: 'balanced',
        availableHours: 3,
        eveningCompleted: false,
      };
      savedLog = {
        ...existing,
        ...log,
        userId: currentUser?.uid,
        eveningCompleted: true,
      };
      return {
        ...prev,
        dailyResets: {
          ...prev.dailyResets,
          [today]: savedLog,
        },
      };
    });

    if (currentUser && savedLog) {
      setDoc(doc(db, 'users', currentUser.uid, 'dailyResets', today), savedLog, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}/dailyResets/${today}`);
      });
    }
  };

  // Settings & Storage Actions
  const updateSettings = (updates: Partial<UserSettings>) => {
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...updates,
      },
    }));

    if (currentUser) {
      setDoc(
        doc(db, 'users', currentUser.uid),
        { settings: updates, updatedAt: new Date().toISOString() },
        { merge: true }
      ).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
      });
    }
  };

  const resetToSampleData = () => {
    setData(createInitialSampleData());
  };

  const clearSampleData = () => {
    const sampleTaskIds = data.tasks.filter((t) => t.id.startsWith('task-')).map((t) => t.id);
    const sampleClassIds = data.classes.filter((c) => c.id.startsWith('class-')).map((c) => c.id);
    const sampleAssignIds = data.assignments.filter((a) => a.id.startsWith('assign-')).map((a) => a.id);

    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => !t.id.startsWith('task-')),
      classes: prev.classes.filter((c) => !c.id.startsWith('class-')),
      assignments: prev.assignments.filter((a) => !a.id.startsWith('assign-')),
      settings: {
        ...prev.settings,
        isSampleDataLoaded: false,
      },
    }));

    if (currentUser) {
      sampleTaskIds.forEach((id) => deleteDoc(doc(db, 'users', currentUser.uid, 'tasks', id)).catch(() => {}));
      sampleClassIds.forEach((id) => deleteDoc(doc(db, 'users', currentUser.uid, 'classes', id)).catch(() => {}));
      sampleAssignIds.forEach((id) => deleteDoc(doc(db, 'users', currentUser.uid, 'assignments', id)).catch(() => {}));
    }
  };

  const clearAllData = () => {
    setData(createEmptyData());
  };

  const exportDataAsJson = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    const today = getTodayDateString();
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `dayease_backup_${today}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importDataFromJson = (
    jsonStr: string,
    mode: 'replace' | 'merge'
  ): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'Invalid JSON file format.' };
      }

      if (!Array.isArray(parsed.tasks) && !Array.isArray(parsed.classes)) {
        return { success: false, error: 'File is missing required DayEase data fields.' };
      }

      if (mode === 'replace') {
        setData({
          version: 1,
          tasks: parsed.tasks || [],
          classes: parsed.classes || [],
          assignments: parsed.assignments || [],
          settings: {
            ...data.settings,
            ...(parsed.settings || {}),
          },
          dailyResets: parsed.dailyResets || {},
        });
      } else {
        setData((prev) => {
          const taskMap = new Map(prev.tasks.map((t) => [t.id, t]));
          (parsed.tasks || []).forEach((t: Task) => taskMap.set(t.id, t));

          const classMap = new Map(prev.classes.map((c) => [c.id, c]));
          (parsed.classes || []).forEach((c: TimetableClass) => classMap.set(c.id, c));

          const assignMap = new Map(prev.assignments.map((a) => [a.id, a]));
          (parsed.assignments || []).forEach((a: Assignment) => assignMap.set(a.id, a));

          return {
            ...prev,
            tasks: Array.from(taskMap.values()),
            classes: Array.from(classMap.values()),
            assignments: Array.from(assignMap.values()),
            dailyResets: {
              ...prev.dailyResets,
              ...(parsed.dailyResets || {}),
            },
          };
        });
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error parsing JSON file.' };
    }
  };

  // Computed values
  const todayDate = getTodayDateString();
  const currentDayOfWeek = getTodayDayOfWeek();

  const todayClasses = useMemo(() => {
    return data.classes
      .filter((c) => c.day === currentDayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [data.classes, currentDayOfWeek]);

  const todayTasks = useMemo(() => {
    return data.tasks.filter((t) => t.deadline === todayDate);
  }, [data.tasks, todayDate]);

  const overdueTasks = useMemo(() => {
    return data.tasks.filter((t) => t.deadline && t.deadline < todayDate && t.status !== 'completed');
  }, [data.tasks, todayDate]);

  const upcomingTasks = useMemo(() => {
    return data.tasks.filter((t) => t.deadline && t.deadline > todayDate && t.status !== 'completed');
  }, [data.tasks, todayDate]);

  const unscheduledTasks = useMemo(() => {
    return data.tasks.filter((t) => !t.deadline && t.status !== 'completed');
  }, [data.tasks]);

  const activeAssignments = useMemo(() => {
    return data.assignments
      .filter((a) => a.status !== 'submitted')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [data.assignments]);

  const nextSteps = useMemo(() => {
    const reset = data.dailyResets?.[todayDate];
    const topIds = reset?.morningTopTaskIds || [];

    const activeTasks = data.tasks.filter((t) => t.status !== 'completed');

    const topResetTasks = activeTasks.filter((t) => topIds.includes(t.id));
    const urgentTasks = activeTasks.filter(
      (t) => (t.deadline === todayDate || (t.deadline && t.deadline < todayDate)) && !topIds.includes(t.id)
    );
    const otherTasks = activeTasks.filter(
      (t) => !topIds.includes(t.id) && t.deadline !== todayDate && !(t.deadline && t.deadline < todayDate)
    );

    const combined = [...topResetTasks, ...urgentTasks, ...otherTasks];
    return combined.slice(0, 3);
  }, [data.tasks, data.dailyResets, todayDate]);

  return (
    <OrganizerContext.Provider
      value={{
        data,
        activeTab,
        setActiveTab,
        isTimerModalOpen,
        setIsTimerModalOpen,
        isOrganizeModalOpen,
        setIsOrganizeModalOpen,
        cloudSyncStatus,
        lastSyncedAt,
        syncErrorMessage,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        quickAddTask,
        addClass,
        updateClass,
        deleteClass,
        importClassesBatch,
        addAssignment,
        updateAssignment,
        deleteAssignment,
        toggleAssignmentSubmitted,
        createTaskForAssignment,
        importAssignmentsBatch,
        importTasksBatch,
        aiInitialPrompt,
        setAiInitialPrompt,
        openAIAssistant,
        getTodayReset,
        saveMorningReset,
        saveEveningReset,
        updateSettings,
        resetToSampleData,
        clearSampleData,
        clearAllData,
        exportDataAsJson,
        importDataFromJson,
        todayClasses,
        todayTasks,
        overdueTasks,
        upcomingTasks,
        unscheduledTasks,
        activeAssignments,
        nextSteps,
      }}
    >
      {children}
    </OrganizerContext.Provider>
  );
};

export const useOrganizer = () => {
  const context = useContext(OrganizerContext);
  if (!context) {
    throw new Error('useOrganizer must be used within an OrganizerProvider');
  }
  return context;
};
