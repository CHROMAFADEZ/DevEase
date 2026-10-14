import React from 'react';
import { Check, Clock, Trash2, Edit2, Link as LinkIcon } from 'lucide-react';
import { Task } from '../../types';
import { formatFriendlyDate, formatMinutes, isTaskOverdue, isTaskDueToday } from '../../utils/dateUtils';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const isCompleted = task.status === 'completed';
  const isOverdue = isTaskOverdue(task.deadline, task.status);
  const isToday = isTaskDueToday(task.deadline);

  // Gentle priority indicator (subtle typographic tone, not aggressive screaming badges)
  const priorityColor =
    task.priority === 'high'
      ? 'text-[#964747]'
      : task.priority === 'medium'
      ? 'text-[#58685A]'
      : 'text-[#7B8B7D]';

  const categoryLabel =
    task.category === 'college'
      ? 'College'
      : task.category === 'study'
      ? 'Study'
      : 'Personal';

  return (
    <div
      className={`group relative p-3.5 rounded-2xl border transition-all ${
        isCompleted
          ? 'bg-[#F9F7F4]/60 border-[#E8E2D8] opacity-75'
          : isOverdue
          ? 'bg-[#FDFBF9] border-[#E8DDD8] shadow-2xs'
          : 'bg-white border-[#E6E0D6] hover:border-[#D5CDC1] shadow-2xs'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Calm Checkbox */}
        <button
          onClick={() => onToggleComplete(task.id)}
          className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
            isCompleted
              ? 'bg-[#3E684A] border-[#3E684A] text-white'
              : 'border-[#C8BFB2] hover:border-[#3E684A] bg-[#FCFAF7]'
          }`}
          aria-label={isCompleted ? 'Mark task as incomplete' : 'Mark task as complete'}
        >
          {isCompleted && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`text-sm font-medium leading-snug break-words ${
                isCompleted
                  ? 'line-through text-[#7E8B80]'
                  : 'text-[#242F26]'
              }`}
            >
              {task.title}
            </h3>

            {/* Action buttons (revealed on hover on desktop, always visible gently) */}
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => onEdit(task)}
                className="p-1 rounded-md text-[#78877A] hover:text-[#232F26] hover:bg-[#F2ECE3] cursor-pointer"
                title="Edit task"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="p-1 rounded-md text-[#88958B] hover:text-[#9B4444] hover:bg-[#FBEBEB] cursor-pointer"
                title="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Notes snippet if present */}
          {task.notes && (
            <p className="text-xs text-[#6B796D] mt-1 line-clamp-2">
              {task.notes}
            </p>
          )}

          {/* Clean Unboxed Metadata Line with typographic separators (anti-slop rule) */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#717F73] mt-2">
            {task.subject && (
              <>
                <span className="font-medium text-[#37463A]">{task.subject}</span>
                <span aria-hidden="true" className="text-[#BFB6A8]">·</span>
              </>
            )}

            <span>{categoryLabel}</span>

            <span aria-hidden="true" className="text-[#BFB6A8]">·</span>

            {/* Estimated time */}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#8A988D]" />
              {formatMinutes(task.estimatedDuration)}
            </span>

            <span aria-hidden="true" className="text-[#BFB6A8]">·</span>

            {/* Deadline status */}
            {task.deadline ? (
              <span
                className={
                  isCompleted
                    ? 'text-[#7D8A7E]'
                    : isOverdue
                    ? 'text-[#964747] font-medium'
                    : isToday
                    ? 'text-[#3E684A] font-medium'
                    : 'text-[#627064]'
                }
              >
                {isOverdue && !isCompleted ? '⚠️ ' : ''}
                {formatFriendlyDate(task.deadline)}
                {task.deadlineTime ? ` at ${task.deadlineTime}` : ''}
              </span>
            ) : (
              <span className="text-[#849286] italic">Unscheduled</span>
            )}

            {/* Priority notice if high or medium */}
            {task.priority !== 'low' && !isCompleted && (
              <>
                <span aria-hidden="true" className="text-[#BFB6A8]">·</span>
                <span className={priorityColor}>
                  {task.priority === 'high' ? 'Urgent' : 'Steady'}
                </span>
              </>
            )}

            {/* Linked assignment flag */}
            {task.assignmentId && (
              <>
                <span aria-hidden="true" className="text-[#BFB6A8]">·</span>
                <span className="text-[#59758E] flex items-center gap-0.5 text-[11px]">
                  <LinkIcon className="w-3 h-3" /> Assignment link
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
