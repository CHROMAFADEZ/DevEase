import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Paperclip,
  FileText,
  Image as ImageIcon,
  X,
  Check,
  AlertCircle,
  Clock,
  BookMarked,
  CheckSquare,
  Calendar,
  ChevronRight,
  Edit2,
  Trash2,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  Layers,
  ArrowRight,
  FileCheck
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import { useAuth } from '../../context/AuthContext';
import { DayEaseAppIcon } from '../brand/Logo';
import {
  ActiveTab,
  AIChatMessage,
  ProposedActions,
  ExtractedClass,
  Assignment,
  Task,
  TaskPriority,
  TaskCategory,
  DayOfWeek
} from '../../types';
import { getTodayDateString, getTodayDayOfWeek, formatTimeRange } from '../../utils/dateUtils';

interface FileUploadState {
  file: File;
  base64: string;
  previewUrl?: string;
  mimeType: string;
}

export const DayEaseAIAssistant: React.FC = () => {
  const {
    data,
    setActiveTab,
    todayClasses,
    todayTasks,
    activeAssignments,
    overdueTasks,
    importClassesBatch,
    importAssignmentsBatch,
    importTasksBatch,
    aiInitialPrompt,
    setAiInitialPrompt,
  } = useOrganizer();

  const { currentUser } = useAuth();
  const studentName = currentUser?.displayName || data.settings.userName || 'Student';

  // Chat message history (starts with warm greeting)
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome_1',
      role: 'assistant',
      content: `Hello ${studentName.split(' ')[0]}! I'm **DayEase AI**, your personal college assistant.\n\nYou can chat with me, upload your routine photo, drop a syllabus PDF, or ask me to organize your assignments and study time. I'll prepare everything for you to review before anything is saved.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadFile, setUploadFile] = useState<FileUploadState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [needsApiKey, setNeedsApiKey] = useState(false);

  // Editable state for active proposed action cards
  const [editingItem, setEditingItem] = useState<{
    msgId: string;
    type: 'class' | 'assignment' | 'task';
    index: number;
    data: any;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSubmitting]);

  // Handle initial prompt passed from Dashboard chips
  useEffect(() => {
    if (aiInitialPrompt) {
      const promptToRun = aiInitialPrompt;
      setAiInitialPrompt(null);
      handleSendMessage(promptToRun);
    }
  }, [aiInitialPrompt]);

  // Quick Prompt Suggestions
  const suggestionChips = [
    { label: '📅 What classes do I have today?', prompt: 'What classes do I have scheduled for today?' },
    { label: '📚 Which assignments are due first?', prompt: 'Show me which assignments I should finish first based on due dates.' },
    { label: '⏱️ Plan my study time for today', prompt: 'Help me plan a realistic study schedule for today based on my classes and tasks.' },
    { label: '📝 Add C programming task due tomorrow', prompt: 'My C programming assignment is due tomorrow. Add a task for it.' },
    { label: '📄 Upload routine or syllabus', prompt: '', isUpload: true },
  ];

  // File Upload Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processSelectedFile(file);
  };

  const processSelectedFile = (file: File) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Please select a PDF document or image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds 25MB limit.');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const isImg = file.type.startsWith('image/');
      setUploadFile({
        file,
        base64,
        previewUrl: isImg ? base64 : undefined,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processSelectedFile(file);
  };

  // Main Send Function
  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend !== undefined ? textToSend : inputPrompt).trim();
    if (!prompt && !uploadFile) return;

    setErrorMessage(null);
    setNeedsApiKey(false);

    const userMsgId = 'user_' + Date.now();
    const userMsg: AIChatMessage = {
      id: userMsgId,
      role: 'user',
      content: prompt || (uploadFile ? `Please analyze this attached document: ${uploadFile.file.name}` : ''),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fileAttachment: uploadFile
        ? {
            name: uploadFile.file.name,
            mimeType: uploadFile.mimeType,
            size: uploadFile.file.size,
            previewUrl: uploadFile.previewUrl,
            isDocument: uploadFile.mimeType === 'application/pdf',
          }
        : undefined,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputPrompt('');
    const currentAttachment = uploadFile;
    setUploadFile(null);
    setIsSubmitting(true);

    try {
      // Gather live DayEase student context
      const contextPayload = {
        studentName,
        todayDate: getTodayDateString(),
        dayOfWeek: getTodayDayOfWeek(),
        collegeName: data.settings.collegeName,
        major: data.settings.majorOrFocus,
        todayClasses: todayClasses.map((c) => ({
          subject: c.subject,
          time: `${c.startTime} - ${c.endTime}`,
          room: c.room,
          instructor: c.instructor,
        })),
        activeAssignments: activeAssignments.map((a) => ({
          title: a.title,
          subject: a.subject,
          dueDate: a.dueDate,
          dueTime: a.dueTime,
          description: a.description,
        })),
        pendingTasks: todayTasks
          .filter((t) => t.status !== 'completed')
          .map((t) => ({
            title: t.title,
            subject: t.subject,
            deadline: t.deadline,
            priority: t.priority,
            estimatedDuration: t.estimatedDuration,
          })),
        overdueTasks: overdueTasks.map((t) => ({
          title: t.title,
          deadline: t.deadline,
        })),
      };

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          file: currentAttachment
            ? {
                fileData: currentAttachment.base64,
                mimeType: currentAttachment.mimeType,
                fileName: currentAttachment.file.name,
              }
            : undefined,
          context: contextPayload,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        const errorMsg = resData.error || 'Failed to get response from DayEase AI.';
        const keyNeeded = Boolean(
          resData.needsApiKey ||
          response.status === 401 ||
          errorMsg.includes('GEMINI_API_KEY') ||
          errorMsg.includes('API key')
        );
        if (keyNeeded) {
          setNeedsApiKey(true);
        }
        const errObj: any = new Error(errorMsg);
        errObj.needsApiKey = keyNeeded;
        throw errObj;
      }

      // Prepare proposed actions with selection tags
      const proposed = resData.proposedActions || {};
      const preparedClasses = Array.isArray(proposed.classes)
        ? proposed.classes.map((c: any, idx: number) => ({
            ...c,
            id: c.id || `cls_prop_${Date.now()}_${idx}`,
            selected: true,
          }))
        : [];

      const preparedAssignments = Array.isArray(proposed.assignments)
        ? proposed.assignments.map((a: any, idx: number) => ({
            ...a,
            id: a.id || `assign_prop_${Date.now()}_${idx}`,
            selected: true,
          }))
        : [];

      const preparedTasks = Array.isArray(proposed.tasks)
        ? proposed.tasks.map((t: any, idx: number) => ({
            ...t,
            id: t.id || `task_prop_${Date.now()}_${idx}`,
            selected: true,
          }))
        : [];

      const assistantMsg: AIChatMessage = {
        id: 'assistant_' + Date.now(),
        role: 'assistant',
        content: resData.reply || 'I processed your request.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        destination: resData.destination || 'general',
        proposedActions: {
          summary: proposed.summary || null,
          classes: preparedClasses,
          assignments: preparedAssignments,
          tasks: preparedTasks,
          studyPlan: proposed.studyPlan || [],
          followUpQuestions: proposed.followUpQuestions || [],
        },
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('DayEase AI Request Error:', err);
      const isApiKeyIssue = Boolean(
        err.needsApiKey ||
        needsApiKey ||
        err.message?.includes('GEMINI_API_KEY') ||
        err.message?.includes('API key')
      );
      if (isApiKeyIssue) {
        setNeedsApiKey(true);
      }
      const errMsg: AIChatMessage = {
        id: 'err_' + Date.now(),
        role: 'assistant',
        content: isApiKeyIssue
          ? 'To use DayEase AI, please configure your GEMINI_API_KEY on the server or in the AI Studio Secrets panel.'
          : `${err.message || 'Unable to connect to AI service.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        error: err.message,
        needsApiKey: isApiKeyIssue,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle selection of proposed items
  const toggleItemSelection = (msgId: string, type: 'classes' | 'assignments' | 'tasks', index: number) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId || !msg.proposedActions) return msg;
        const currentList = msg.proposedActions[type] as any[];
        if (!currentList) return msg;

        const updatedList = currentList.map((item, idx) =>
          idx === index ? { ...item, selected: !item.selected } : item
        );

        return {
          ...msg,
          proposedActions: {
            ...msg.proposedActions,
            [type]: updatedList,
          },
        };
      })
    );
  };

  // Delete an item from proposed list
  const deleteProposedItem = (msgId: string, type: 'classes' | 'assignments' | 'tasks', index: number) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId || !msg.proposedActions) return msg;
        const currentList = msg.proposedActions[type] as any[];
        if (!currentList) return msg;

        const updatedList = currentList.filter((_, idx) => idx !== index);
        return {
          ...msg,
          proposedActions: {
            ...msg.proposedActions,
            [type]: updatedList,
          },
        };
      })
    );
  };

  // Save inline edit changes to a proposed item
  const saveItemEdit = (updatedData: any) => {
    if (!editingItem) return;
    const { msgId, type, index } = editingItem;
    const fieldKey = type === 'class' ? 'classes' : type === 'assignment' ? 'assignments' : 'tasks';

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId || !msg.proposedActions) return msg;
        const currentList = msg.proposedActions[fieldKey] as any[];
        if (!currentList) return msg;

        const updatedList = currentList.map((item, idx) => (idx === index ? { ...item, ...updatedData } : item));
        return {
          ...msg,
          proposedActions: {
            ...msg.proposedActions,
            [fieldKey]: updatedList,
          },
        };
      })
    );
    setEditingItem(null);
  };

  // Apply proposed changes into real OrganizerContext
  const handleApplyProposed = (msgId: string) => {
    const targetMsg = messages.find((m) => m.id === msgId);
    if (!targetMsg || !targetMsg.proposedActions) return;

    const { classes = [], assignments = [], tasks = [] } = targetMsg.proposedActions;

    const selectedClasses = classes.filter((c) => c.selected);
    const selectedAssignments = assignments.filter((a) => a.selected);
    const selectedTasks = tasks.filter((t) => t.selected);

    let classesCount = 0;
    let assignmentsCount = 0;
    let tasksCount = 0;

    if (selectedClasses.length > 0) {
      const res = importClassesBatch(selectedClasses);
      classesCount = res.importedCount;
    }

    if (selectedAssignments.length > 0) {
      assignmentsCount = importAssignmentsBatch(selectedAssignments);
    }

    if (selectedTasks.length > 0) {
      tasksCount = importTasksBatch(selectedTasks);
    }

    const appliedParts: string[] = [];
    if (classesCount > 0) appliedParts.push(`${classesCount} class${classesCount > 1 ? 'es' : ''}`);
    if (assignmentsCount > 0) appliedParts.push(`${assignmentsCount} assignment${assignmentsCount > 1 ? 's' : ''}`);
    if (tasksCount > 0) appliedParts.push(`${tasksCount} task${tasksCount > 1 ? 's' : ''}`);

    const summaryText =
      appliedParts.length > 0
        ? `Saved ${appliedParts.join(', ')} to DayEase.`
        : 'All items are already in your organizer or were deselected.';

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId
          ? {
              ...msg,
              isApplied: true,
              appliedSummary: summaryText,
            }
          : msg
      )
    );
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-white border border-[#E7DFD4] rounded-3xl shadow-xs overflow-hidden animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-[#FAF7F2] border-b border-[#E8E1D5] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DayEaseAppIcon size={34} rounded="rounded-xl" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#233026]">DayEase AI</h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E5EDE7] text-[#2F5638]">
                <Sparkles className="w-3 h-3 text-[#3E684A]" />
                College Assistant
              </span>
            </div>
            <p className="text-xs text-[#6B796D]">
              Understands routines, syllabus PDFs, assignments, and daily study planning.
            </p>
          </div>
        </div>

        {/* Clear Chat Button */}
        <button
          onClick={() => {
            setMessages([
              {
                id: 'welcome_reset',
                role: 'assistant',
                content: `Chat cleared. How can I help you today, ${studentName.split(' ')[0]}? Feel free to upload your routine or ask about your schedule.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }}
          title="Clear Conversation"
          className="text-xs font-medium text-[#7D8A7F] hover:text-[#2E3C31] p-1.5 rounded-lg hover:bg-[#EFEAE1] transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 overflow-y-auto p-4 md:p-6 space-y-5 relative transition-colors ${
          isDragging ? 'bg-[#F2ECE0]/60 ring-2 ring-dashed ring-[#3E684A]' : 'bg-[#FAF8F5]'
        }`}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-[#FAF7F2]/90 backdrop-blur-xs flex flex-col items-center justify-center z-20 pointer-events-none">
            <Paperclip className="w-10 h-10 text-[#3E684A] animate-bounce mb-2" />
            <p className="text-sm font-semibold text-[#2C5237]">Drop your routine photo or syllabus PDF here</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-start gap-2.5 max-w-[92%] sm:max-w-[85%]">
              {msg.role === 'assistant' && (
                <div className="mt-1 shrink-0">
                  <DayEaseAppIcon size={26} rounded="rounded-lg" />
                </div>
              )}

              <div className="space-y-2">
                {/* Bubble Body */}
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#3E684A] text-white rounded-tr-xs shadow-xs'
                      : 'bg-white border border-[#E7DFD4] text-[#242F26] rounded-tl-xs shadow-xs'
                  }`}
                >
                  {/* File Attachment Pill */}
                  {msg.fileAttachment && (
                    <div className="mb-3 p-2.5 rounded-xl bg-white/10 border border-white/20 flex items-center gap-2 text-xs">
                      {msg.fileAttachment.isDocument ? (
                        <FileText className="w-4 h-4 shrink-0 text-white" />
                      ) : (
                        <ImageIcon className="w-4 h-4 shrink-0 text-white" />
                      )}
                      <span className="font-medium truncate">{msg.fileAttachment.name}</span>
                    </div>
                  )}

                  {/* Message Markdown / Text */}
                  <div className="whitespace-pre-wrap font-normal">
                    {msg.content}
                  </div>

                  {/* API Key Missing Guidance */}
                  {msg.needsApiKey && (
                    <div className="mt-3 p-3 rounded-xl bg-[#FAF1E8] border border-[#E8D1BE] text-[#7A3F1F] text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-4 h-4" />
                        <span>Gemini API Key Required</span>
                      </div>
                      <p>
                        To activate genuine AI capabilities, add your Gemini API Key in the AI Studio Secrets panel or configure <code className="bg-[#EFE2D3] px-1 rounded">GEMINI_API_KEY</code> in your environment.
                      </p>
                    </div>
                  )}
                </div>

                {/* Proposed Actions Card */}
                {msg.proposedActions &&
                  (msg.proposedActions.classes?.length ||
                    msg.proposedActions.assignments?.length ||
                    msg.proposedActions.tasks?.length ||
                    msg.proposedActions.studyPlan?.length) && (
                    <div className="bg-white border border-[#DDD4C5] rounded-2xl p-4 shadow-sm space-y-4 max-w-xl">
                      {/* Card Title Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DD]">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[#3E684A]" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#35573E]">
                            {msg.proposedActions.summary || 'Proposed Updates for DayEase'}
                          </h4>
                        </div>
                        {msg.isApplied ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2D663B] bg-[#E3EFE5] px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" />
                            Saved to Organizer
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-[#7A877B]">
                            Review & edit before saving
                          </span>
                        )}
                      </div>

                      {/* 1. Proposed Classes */}
                      {msg.proposedActions.classes && msg.proposedActions.classes.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold text-[#4F5E52]">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-[#3E684A]" />
                              Timetable Classes ({msg.proposedActions.classes.length})
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {msg.proposedActions.classes.map((cls, idx) => (
                              <div
                                key={cls.id || idx}
                                className={`flex items-start justify-between p-2.5 rounded-xl border transition-all text-xs ${
                                  cls.selected
                                    ? 'bg-[#FAF8F5] border-[#DED5C7]'
                                    : 'bg-[#F9F7F5]/50 border-dashed border-[#E3DBD0] opacity-50'
                                }`}
                              >
                                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                  {!msg.isApplied && (
                                    <input
                                      type="checkbox"
                                      checked={cls.selected !== false}
                                      onChange={() => toggleItemSelection(msg.id, 'classes', idx)}
                                      className="mt-0.5 rounded text-[#3E684A] focus:ring-[#3E684A] cursor-pointer"
                                    />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-[#233125]">{cls.subject}</span>
                                      {cls.isLabOrPractical && (
                                        <span className="text-[10px] bg-[#E4ECE5] text-[#2F5638] px-1.5 py-0.2 rounded font-semibold">
                                          Lab
                                        </span>
                                      )}
                                      {cls.isUncertain && (
                                        <span className="text-[10px] bg-[#FCECE4] text-[#A64B2A] px-1.5 py-0.2 rounded font-semibold">
                                          Uncertain
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[#647367] mt-0.5 flex flex-wrap gap-x-2 text-[11px]">
                                      <span>{cls.day}</span>
                                      <span>·</span>
                                      <span>{cls.startTime} - {cls.endTime}</span>
                                      {cls.room && (
                                        <>
                                          <span>·</span>
                                          <span>Room {cls.room}</span>
                                        </>
                                      )}
                                      {cls.instructor && (
                                        <>
                                          <span>·</span>
                                          <span>{cls.instructor}</span>
                                        </>
                                      )}
                                    </div>
                                    {cls.uncertainReason && (
                                      <p className="text-[10px] text-[#A64B2A] mt-0.5 italic">
                                        Note: {cls.uncertainReason}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {!msg.isApplied && (
                                  <div className="flex items-center gap-1 pl-2">
                                    <button
                                      onClick={() =>
                                        setEditingItem({
                                          msgId: msg.id,
                                          type: 'class',
                                          index: idx,
                                          data: { ...cls },
                                        })
                                      }
                                      className="p-1 text-[#6F7D71] hover:text-[#243126] rounded-md hover:bg-[#EFE8DD] cursor-pointer"
                                      title="Edit details"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => deleteProposedItem(msg.id, 'classes', idx)}
                                      className="p-1 text-[#8C6B6B] hover:text-[#A83232] rounded-md hover:bg-[#FBEAEA] cursor-pointer"
                                      title="Remove"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2. Proposed Assignments */}
                      {msg.proposedActions.assignments && msg.proposedActions.assignments.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold text-[#4F5E52]">
                            <span className="flex items-center gap-1.5">
                              <BookMarked className="w-3.5 h-3.5 text-[#5F5170]" />
                              Assignments ({msg.proposedActions.assignments.length})
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {msg.proposedActions.assignments.map((assign, idx) => (
                              <div
                                key={assign.id || idx}
                                className={`flex items-start justify-between p-2.5 rounded-xl border transition-all text-xs ${
                                  assign.selected
                                    ? 'bg-[#FAF8F5] border-[#DED5C7]'
                                    : 'bg-[#F9F7F5]/50 border-dashed border-[#E3DBD0] opacity-50'
                                }`}
                              >
                                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                  {!msg.isApplied && (
                                    <input
                                      type="checkbox"
                                      checked={assign.selected !== false}
                                      onChange={() => toggleItemSelection(msg.id, 'assignments', idx)}
                                      className="mt-0.5 rounded text-[#3E684A] focus:ring-[#3E684A] cursor-pointer"
                                    />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <span className="font-bold text-[#233125]">{assign.title}</span>
                                    <div className="text-[#647367] mt-0.5 flex flex-wrap gap-x-2 text-[11px]">
                                      <span>Subject: {assign.subject}</span>
                                      <span>·</span>
                                      <span className="font-medium text-[#7D3F3F]">
                                        Due {assign.dueDate} {assign.dueTime ? `at ${assign.dueTime}` : ''}
                                      </span>
                                    </div>
                                    {assign.description && (
                                      <p className="text-[11px] text-[#69786C] mt-1 line-clamp-2">
                                        {assign.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {!msg.isApplied && (
                                  <div className="flex items-center gap-1 pl-2">
                                    <button
                                      onClick={() =>
                                        setEditingItem({
                                          msgId: msg.id,
                                          type: 'assignment',
                                          index: idx,
                                          data: { ...assign },
                                        })
                                      }
                                      className="p-1 text-[#6F7D71] hover:text-[#243126] rounded-md hover:bg-[#EFE8DD] cursor-pointer"
                                      title="Edit assignment"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => deleteProposedItem(msg.id, 'assignments', idx)}
                                      className="p-1 text-[#8C6B6B] hover:text-[#A83232] rounded-md hover:bg-[#FBEAEA] cursor-pointer"
                                      title="Remove"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 3. Proposed Tasks */}
                      {msg.proposedActions.tasks && msg.proposedActions.tasks.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold text-[#4F5E52]">
                            <span className="flex items-center gap-1.5">
                              <CheckSquare className="w-3.5 h-3.5 text-[#3E684A]" />
                              Tasks & Action Items ({msg.proposedActions.tasks.length})
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {msg.proposedActions.tasks.map((task, idx) => (
                              <div
                                key={task.id || idx}
                                className={`flex items-start justify-between p-2.5 rounded-xl border transition-all text-xs ${
                                  task.selected
                                    ? 'bg-[#FAF8F5] border-[#DED5C7]'
                                    : 'bg-[#F9F7F5]/50 border-dashed border-[#E3DBD0] opacity-50'
                                }`}
                              >
                                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                  {!msg.isApplied && (
                                    <input
                                      type="checkbox"
                                      checked={task.selected !== false}
                                      onChange={() => toggleItemSelection(msg.id, 'tasks', idx)}
                                      className="mt-0.5 rounded text-[#3E684A] focus:ring-[#3E684A] cursor-pointer"
                                    />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <span className="font-bold text-[#233125]">{task.title}</span>
                                    <div className="text-[#647367] mt-0.5 flex flex-wrap gap-x-2 text-[11px]">
                                      {task.subject && <span>{task.subject}</span>}
                                      {task.deadline && (
                                        <>
                                          <span>·</span>
                                          <span>Deadline: {task.deadline}</span>
                                        </>
                                      )}
                                      <span>·</span>
                                      <span className="capitalize">{task.priority} priority</span>
                                      <span>·</span>
                                      <span>{task.estimatedDuration || 30} mins</span>
                                    </div>
                                  </div>
                                </div>

                                {!msg.isApplied && (
                                  <div className="flex items-center gap-1 pl-2">
                                    <button
                                      onClick={() =>
                                        setEditingItem({
                                          msgId: msg.id,
                                          type: 'task',
                                          index: idx,
                                          data: { ...task },
                                        })
                                      }
                                      className="p-1 text-[#6F7D71] hover:text-[#243126] rounded-md hover:bg-[#EFE8DD] cursor-pointer"
                                      title="Edit task"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => deleteProposedItem(msg.id, 'tasks', idx)}
                                      className="p-1 text-[#8C6B6B] hover:text-[#A83232] rounded-md hover:bg-[#FBEAEA] cursor-pointer"
                                      title="Remove"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 4. Proposed Study Plan Blocks */}
                      {msg.proposedActions.studyPlan && msg.proposedActions.studyPlan.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs font-semibold text-[#4F5E52] flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#3E684A]" />
                            Recommended Study Schedule
                          </span>
                          <div className="grid grid-cols-1 gap-1.5">
                            {msg.proposedActions.studyPlan.map((block, idx) => (
                              <div
                                key={idx}
                                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                                  block.type === 'break'
                                    ? 'bg-[#F4F8F5] border-[#D4E4D8] text-[#2A5735]'
                                    : 'bg-[#FAF7F2] border-[#E5DFD4] text-[#263127]'
                                }`}
                              >
                                <div>
                                  <span className="font-bold">{block.title}</span>
                                  {block.notes && (
                                    <p className="text-[11px] text-[#637265] mt-0.5">{block.notes}</p>
                                  )}
                                </div>
                                {block.time && (
                                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-[#DDD3C4]">
                                    {block.time}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Confirmation Footer */}
                      <div className="pt-2 border-t border-[#EFE8DD] flex flex-wrap items-center justify-between gap-3">
                        {msg.isApplied ? (
                          <div className="flex items-center gap-3 w-full justify-between">
                            <span className="text-xs text-[#2A5A35] font-semibold flex items-center gap-1.5">
                              <FileCheck className="w-4 h-4" />
                              {msg.appliedSummary || 'Successfully added to your DayEase organizer.'}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setActiveTab('timetable')}
                                className="text-xs font-semibold text-[#345B3E] hover:underline cursor-pointer"
                              >
                                View Timetable →
                              </button>
                              <button
                                onClick={() => setActiveTab('tasks')}
                                className="text-xs font-semibold text-[#345B3E] hover:underline cursor-pointer"
                              >
                                View Tasks →
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-[11px] text-[#718073]">
                              Uncheck any item you don't wish to add.
                            </p>
                            <button
                              onClick={() => handleApplyProposed(msg.id)}
                              className="px-4 py-2 rounded-xl bg-[#3E684A] text-white text-xs font-bold hover:bg-[#32543B] transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Apply to DayEase</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                <span className="text-[10px] text-[#8C9A8E] block px-1">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isSubmitting && (
          <div className="flex items-start gap-2.5 animate-in fade-in">
            <DayEaseAppIcon size={26} rounded="rounded-lg" className="animate-pulse" />
            <div className="bg-white border border-[#E7DFD4] rounded-2xl p-4 shadow-xs flex items-center gap-2 text-xs text-[#526355]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#3E684A]" />
              <span>DayEase AI is analyzing and organizing your request...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length <= 3 && !isSubmitting && (
        <div className="px-6 py-2 bg-[#FAF7F2] border-t border-[#EDE6DC] flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-[#6D7D70] shrink-0 uppercase tracking-wider">
            Try asking:
          </span>
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (chip.isUpload) {
                  fileInputRef.current?.click();
                } else {
                  handleSendMessage(chip.prompt);
                }
              }}
              className="shrink-0 text-xs py-1 px-3 rounded-full bg-white border border-[#DDD3C5] text-[#334637] hover:bg-[#F2ECE0] transition-colors cursor-pointer shadow-2xs font-medium"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Input & Upload Dock */}
      <div className="p-4 bg-white border-t border-[#E8E1D5]">
        {/* Uploaded File Banner */}
        {uploadFile && (
          <div className="mb-3 p-2.5 rounded-xl bg-[#FAF6F0] border border-[#E4DDD0] flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center gap-2 min-w-0">
              {uploadFile.mimeType === 'application/pdf' ? (
                <FileText className="w-4 h-4 text-[#C2410C] shrink-0" />
              ) : (
                <ImageIcon className="w-4 h-4 text-[#3E684A] shrink-0" />
              )}
              <span className="font-semibold text-[#253227] truncate">
                {uploadFile.file.name}
              </span>
              <span className="text-[11px] text-[#718073]">
                ({Math.round(uploadFile.file.size / 1024)} KB)
              </span>
            </div>
            <button
              onClick={() => setUploadFile(null)}
              className="p-1 text-[#78887B] hover:text-[#B91C1C] rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="flex items-center gap-2">
          {/* File Attachment Trigger */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach Routine, Timetable Photo or Syllabus PDF"
            className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#DDD4C7] text-[#475C4B] hover:bg-[#EFEAE1] transition-colors cursor-pointer"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              uploadFile
                ? 'Add instructions (e.g. "Add all classes" or "Extract assignments")...'
                : 'Ask DayEase AI anything, or paste / drop your routine & syllabus...'
            }
            disabled={isSubmitting}
            className="flex-1 bg-[#FAF7F2] border border-[#DDD4C7] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#232F25] placeholder-[#859487] focus:outline-none focus:ring-2 focus:ring-[#3E684A]/30 focus:border-[#3E684A] disabled:opacity-50"
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={isSubmitting || (!inputPrompt.trim() && !uploadFile)}
            className="px-4 py-2.5 rounded-xl bg-[#3E684A] text-white hover:bg-[#34583E] disabled:bg-[#BAC6BC] transition-all cursor-pointer shadow-xs flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <p className="text-xs text-[#B91C1C] mt-2 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            {errorMessage}
          </p>
        )}
      </div>

      {/* Inline Item Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-[#252E27]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#DDD4C5] rounded-3xl p-6 w-full max-w-md shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-[#EFE8DD]">
              <h3 className="text-sm font-bold text-[#233125]">
                Edit {editingItem.type === 'class' ? 'Class' : editingItem.type === 'assignment' ? 'Assignment' : 'Task'} Details
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 text-[#78887B] hover:text-[#233125] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Class Fields */}
            {editingItem.type === 'class' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-[#4B5A4D] mb-1">Subject</label>
                  <input
                    type="text"
                    value={editingItem.data.subject || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, subject: e.target.value },
                      })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#D9D0C3] rounded-xl px-3 py-2 text-xs text-[#222E24]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-[#4B5A4D] mb-1">Day</label>
                    <select
                      value={editingItem.data.day || 'Monday'}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, day: e.target.value as DayOfWeek },
                        })
                      }
                      className="w-full bg-[#FAF7F2] border border-[#D9D0C3] rounded-xl px-2 py-2 text-xs text-[#222E24]"
                    >
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                        (d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-[#4B5A4D] mb-1">Room</label>
                    <input
                      type="text"
                      value={editingItem.data.room || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, room: e.target.value },
                        })
                      }
                      className="w-full bg-[#FAF7F2] border border-[#D9D0C3] rounded-xl px-3 py-2 text-xs text-[#222E24]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-[#4B5A4D] mb-1">Start Time (24h)</label>
                    <input
                      type="text"
                      placeholder="09:00"
                      value={editingItem.data.startTime || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, startTime: e.target.value },
                        })
                      }
                      className="w-full bg-[#FAF7F2] border border-[#D9D0C3] rounded-xl px-3 py-2 text-xs text-[#222E24]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#4B5A4D] mb-1">End Time (24h)</label>
                    <input
                      type="text"
                      placeholder="10:30"
                      value={editingItem.data.endTime || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, endTime: e.target.value },
                        })
                      }
                      className="w-full bg-[#FAF7F2] border border-[#D9D0C3] rounded-xl px-3 py-2 text-xs text-[#222E24]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Assignment Fields */}
            {editingItem.type === 'assignment' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-[#4B5A4D] mb-1">Title</label>
                  <input
                    type="text"
                    value={editingItem.data.title || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, title: e.target.value },
                      })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#D9D0C3] rounded-xl px-3 py-2 text-xs text-[#222E24]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-[#4B5A4D] mb-1">Subject</label>
                    <input
                      type="text"
                      value={editingItem.data.subject || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, subject: e.target.value },
                        })
                      }
                      className="w-full bg-[#FAF7F2] border border-[#D9D0C3] rounded-xl px-3 py-2 text-xs text-[#222E24]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#4B5A4D] mb-1">Due Date</label>
                    <input
                      type="date"
                      value={editingItem.data.dueDate || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, dueDate: e.target.value },
                        })
                      }
                      className="w-full bg-[#FAF7F2] border border-[#D9D0C3] rounded-xl px-3 py-2 text-xs text-[#222E24]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Task Fields */}
            {editingItem.type === 'task' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-[#4B5A4D] mb-1">Task Title</label>
                  <input
                    type="text"
                    value={editingItem.data.title || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, title: e.target.value },
                      })
                    }
                    className="w-full bg-[#FAF7F2] border border-[#D9D0C3] rounded-xl px-3 py-2 text-xs text-[#222E24]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-[#4B5A4D] mb-1">Deadline</label>
                    <input
                      type="date"
                      value={editingItem.data.deadline || ''}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, deadline: e.target.value },
                        })
                      }
                      className="w-full bg-[#FAF7F2] border border-[#D9D0C3] rounded-xl px-3 py-2 text-xs text-[#222E24]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-[#4B5A4D] mb-1">Priority</label>
                    <select
                      value={editingItem.data.priority || 'medium'}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, priority: e.target.value as TaskPriority },
                        })
                      }
                      className="w-full bg-[#FAF7F2] border border-[#D9D0C3] rounded-xl px-2 py-2 text-xs text-[#222E24]"
                    >
                      <option value="low">Gentle (Low)</option>
                      <option value="medium">Steady (Medium)</option>
                      <option value="high">Urgent (High)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EFE8DD]">
              <button
                onClick={() => setEditingItem(null)}
                className="px-3.5 py-1.5 text-xs text-[#5D6D5F] hover:bg-[#F2ECE0] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => saveItemEdit(editingItem.data)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#3E684A] hover:bg-[#34583E] rounded-xl cursor-pointer shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
