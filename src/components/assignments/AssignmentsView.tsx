import React, { useState, useMemo } from 'react';
import { 
  BookMarked, 
  Plus, 
  Check, 
  Clock, 
  Search, 
  Edit2, 
  Trash2, 
  ListPlus, 
  CheckCircle2, 
  FileText,
  AlertCircle 
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import { Assignment, AssignmentStatus } from '../../types';
import { formatFriendlyDate, getDaysRemaining } from '../../utils/dateUtils';
import { AssignmentModal } from './AssignmentModal';

export const AssignmentsView: React.FC = () => {
  const { 
    data, 
    toggleAssignmentSubmitted, 
    deleteAssignment, 
    createTaskForAssignment 
  } = useOrganizer();

  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [taskCreatedToast, setTaskCreatedToast] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingAssignment(null);
    setIsModalOpen(true);
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleCreateTask = (assignmentId: string, title: string) => {
    const taskId = createTaskForAssignment(assignmentId);
    if (taskId) {
      setTaskCreatedToast(`Created study task for "${title}" in your Inbox!`);
      setTimeout(() => setTaskCreatedToast(null), 3000);
    }
  };

  // Sort by nearest deadline first
  const sortedAssignments = useMemo(() => {
    return [...data.assignments].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [data.assignments]);

  const filteredAssignments = useMemo(() => {
    return sortedAssignments.filter((a) => {
      if (filter === 'pending' && a.status === 'submitted') return false;
      if (filter === 'submitted' && a.status !== 'submitted') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = a.title.toLowerCase().includes(q);
        const matchesSubject = a.subject.toLowerCase().includes(q);
        const matchesDesc = a.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubject && !matchesDesc) return false;
      }

      return true;
    });
  }, [sortedAssignments, filter, searchQuery]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {taskCreatedToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#294B34] text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{taskCreatedToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-[#242F26]">
            Assignments & Homework
          </h1>
          <p className="text-xs text-[#6C7A6E] mt-0.5">
            Track major projects, weekly problem sets, lab reports, and deadlines.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#3E684A] text-white hover:bg-[#34583E] transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Controls: Segmented Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center p-1 bg-[#EFEAE2] rounded-xl text-xs">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filter === 'pending'
                ? 'bg-white text-[#253227] shadow-2xs'
                : 'text-[#647266] hover:text-[#253227]'
            }`}
          >
            Pending ({data.assignments.filter((a) => a.status !== 'submitted').length})
          </button>
          <button
            onClick={() => setFilter('submitted')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filter === 'submitted'
                ? 'bg-white text-[#253227] shadow-2xs'
                : 'text-[#647266] hover:text-[#253227]'
            }`}
          >
            Submitted ({data.assignments.filter((a) => a.status === 'submitted').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-[#253227] shadow-2xs'
                : 'text-[#647266] hover:text-[#253227]'
            }`}
          >
            All ({data.assignments.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-[#8A988D] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search assignments or subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-[#E0D7CC] bg-white text-[#242F26] placeholder:text-[#9DA99F] focus:outline-hidden focus:border-[#3E684A]"
          />
        </div>
      </div>

      {/* Assignment List */}
      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white rounded-3xl border border-[#E8E2D7] shadow-2xs">
          <BookMarked className="w-8 h-8 text-[#8C9B8E] mx-auto mb-2 opacity-70" />
          <p className="text-sm font-semibold text-[#29352B]">
            {filter === 'submitted'
              ? 'No submitted assignments yet'
              : 'No pending assignments'}
          </p>
          <p className="text-xs text-[#718073] mt-1 max-w-sm mx-auto">
            {filter === 'submitted'
              ? 'Submitted coursework will be recorded here.'
              : 'Add upcoming homework or problem sets to stay ahead calmly.'}
          </p>
          {filter !== 'submitted' && (
            <button
              onClick={handleOpenAdd}
              className="mt-3.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#3E684A] text-white hover:bg-[#34583E] transition-colors cursor-pointer"
            >
              Add an assignment
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredAssignments.map((assignment) => {
            const isSubmitted = assignment.status === 'submitted';
            const daysInfo = getDaysRemaining(assignment.dueDate);
            const isOverdue = daysInfo.isOverdue && !isSubmitted;

            // Check if there is already a linked task for this assignment
            const linkedTask = data.tasks.find(
              (t) => t.assignmentId === assignment.id && t.status !== 'completed'
            );

            return (
              <div
                key={assignment.id}
                className={`p-4 md:p-5 rounded-3xl border transition-all ${
                  isSubmitted
                    ? 'bg-[#F9F7F4]/70 border-[#E7E2D8] opacity-80'
                    : isOverdue
                    ? 'bg-[#FEFBFB] border-[#E8D6D4] shadow-2xs'
                    : 'bg-white border-[#E6E0D5] hover:border-[#D5CDC1] shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Checkmark for submit + Content */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => toggleAssignmentSubmitted(assignment.id)}
                      className={`mt-1 w-6 h-6 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        isSubmitted
                          ? 'bg-[#3E684A] border-[#3E684A] text-white'
                          : 'border-[#C8BFB2] hover:border-[#3E684A] bg-[#FCFAF7]'
                      }`}
                      title={isSubmitted ? 'Mark as pending' : 'Mark as submitted'}
                    >
                      {isSubmitted && <Check className="w-4 h-4 stroke-[2.5]" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <h3
                          className={`text-sm md:text-base font-semibold leading-snug ${
                            isSubmitted
                              ? 'line-through text-[#79877B]'
                              : 'text-[#233025]'
                          }`}
                        >
                          {assignment.title}
                        </h3>
                        <span className="text-xs font-medium text-[#465749]">
                          ({assignment.subject})
                        </span>
                      </div>

                      {/* Clean Unboxed Metadata Line */}
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#6F7D71] mt-1.5">
                        <span
                          className={
                            isSubmitted
                              ? 'text-[#7B887D]'
                              : isOverdue
                              ? 'text-[#9A4242] font-semibold'
                              : daysInfo.isToday
                              ? 'text-[#3E684A] font-semibold'
                              : 'text-[#506654] font-medium'
                          }
                        >
                          {isSubmitted ? 'Submitted' : daysInfo.label}
                        </span>

                        <span aria-hidden="true" className="text-[#C4BCB0]">·</span>

                        <span>Due {formatFriendlyDate(assignment.dueDate)}</span>
                        {assignment.dueTime && <span>at {assignment.dueTime}</span>}

                        <span aria-hidden="true" className="text-[#C4BCB0]">·</span>

                        <span>Assigned {formatFriendlyDate(assignment.assignedDate)}</span>
                      </div>

                      {/* Description */}
                      {assignment.description && (
                        <p className="text-xs text-[#5D6B60] mt-2.5 p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EBE5DB] leading-relaxed">
                          {assignment.description}
                        </p>
                      )}

                      {/* Linked Task status or Quick action */}
                      {!isSubmitted && (
                        <div className="mt-3 flex items-center gap-2">
                          {linkedTask ? (
                            <span className="text-xs text-[#3E684A] flex items-center gap-1 font-medium bg-[#EEF5EF] px-2.5 py-1 rounded-lg">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Study task scheduled in Inbox</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCreateTask(assignment.id, assignment.title)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-[#FAF7F2] hover:bg-[#F2ECE2] text-[#4A5D4D] border border-[#E0D8CC] font-medium transition-colors cursor-pointer"
                              title="Create a study session task for this assignment"
                            >
                              <ListPlus className="w-3.5 h-3.5 text-[#3E684A]" />
                              <span>Add study task for this</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(assignment)}
                      className="p-1.5 rounded-lg text-[#748476] hover:text-[#253227] hover:bg-[#F2ECE3] transition-colors cursor-pointer"
                      title="Edit assignment"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteAssignment(assignment.id)}
                      className="p-1.5 rounded-lg text-[#8A988D] hover:text-[#9B4242] hover:bg-[#FBEAEA] transition-colors cursor-pointer"
                      title="Delete assignment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialAssignment={editingAssignment}
      />
    </div>
  );
};
