import React, { useState } from 'react';
import { Sparkles, Clock, Coffee, Check, X, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import { formatMinutes } from '../../utils/dateUtils';

interface GeneratedBlock {
  title: string;
  type: 'focus' | 'break' | 'freetime';
  durationMins: number;
  subject?: string;
  notes?: string;
}

export const OrganizeModal: React.FC = () => {
  const { 
    isOrganizeModalOpen, 
    setIsOrganizeModalOpen, 
    data, 
    quickAddTask, 
    nextSteps, 
    todayClasses 
  } = useOrganizer();

  const [availableHours, setAvailableHours] = useState<number>(2.5);
  const [energyLevel, setEnergyLevel] = useState<'gentle' | 'steady' | 'focused'>('steady');
  const [applied, setApplied] = useState(false);

  if (!isOrganizeModalOpen) return null;

  const totalMinutes = Math.round(availableHours * 60);

  // Calculate a realistic schedule breakdown based on student's actual tasks and realistic limits
  const generatePlan = (): GeneratedBlock[] => {
    const blocks: GeneratedBlock[] = [];
    let remainingMins = totalMinutes;

    // Determine focus block size according to energy
    const focusChunk = energyLevel === 'gentle' ? 25 : energyLevel === 'steady' ? 35 : 45;
    const breakChunk = energyLevel === 'gentle' ? 10 : 8;

    // Prioritize from nextSteps or active tasks
    const candidateTasks = data.tasks.filter((t) => t.status !== 'completed');

    let taskIdx = 0;
    while (remainingMins >= 25 && taskIdx < Math.max(candidateTasks.length, 1)) {
      const task = candidateTasks[taskIdx];
      const taskTitle = task ? task.title : 'Catch-up review or course reading';
      const taskSubject = task?.subject;

      // Add a focus block
      const actualFocus = Math.min(focusChunk, remainingMins - 15);
      if (actualFocus >= 20) {
        blocks.push({
          title: taskTitle,
          type: 'focus',
          durationMins: actualFocus,
          subject: taskSubject,
          notes: task?.notes || 'Work at a comfortable pace without rushing',
        });
        remainingMins -= actualFocus;
      }

      // Add a gentle break if time permits
      if (remainingMins >= 10) {
        blocks.push({
          title: 'Mindful break: Hydrate, stretch, or look away from screen',
          type: 'break',
          durationMins: breakChunk,
        });
        remainingMins -= breakChunk;
      }

      taskIdx++;
    }

    // Allocate whatever time remains as guilt-free relaxation / recharge time
    if (remainingMins > 0) {
      blocks.push({
        title: 'Guilt-free personal & free time (Read, music, chat, unwind)',
        type: 'freetime',
        durationMins: remainingMins,
      });
    }

    return blocks;
  };

  const plan = generatePlan();

  const handleApplyToDay = () => {
    // Add missing study tasks if desired
    setApplied(true);
    setTimeout(() => {
      setApplied(false);
      setIsOrganizeModalOpen(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#252E27]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-[#FCFAF7] border border-[#E4DDD3] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#ECE6DC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8EFE9] text-[#2C5237] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#376142]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#253027]">Help Me Get Organized</h2>
              <p className="text-xs text-[#6F7D71]">
                A zero-guilt, realistic schedule that protects your well-being and free time.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOrganizeModalOpen(false)}
            className="text-[#88968A] hover:text-[#253027] p-1.5 rounded-lg hover:bg-[#F2ECE3] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: How much time do you have? */}
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#3C4A3E] mb-2">
              1. How much time do you realistically have for college work today?
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 2.5, 4].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => setAvailableHours(hours)}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all cursor-pointer text-center ${
                    availableHours === hours
                      ? 'bg-[#EBF2EC] border-[#396244] text-[#294B34] font-semibold shadow-2xs'
                      : 'bg-white border-[#E0D9CE] text-[#556357] hover:border-[#CAD2CA]'
                  }`}
                >
                  {hours} {hours === 1 ? 'hour' : 'hours'}
                </button>
              ))}
            </div>
            <div className="mt-2.5 flex items-center gap-3 text-xs text-[#68766A]">
              <span>Or fine-tune:</span>
              <input
                type="range"
                min="0.5"
                max="6"
                step="0.5"
                value={availableHours}
                onChange={(e) => setAvailableHours(parseFloat(e.target.value))}
                className="flex-1 accent-[#3F684B] h-1.5 bg-[#E6DFD4] rounded-lg cursor-pointer"
              />
              <span className="font-semibold text-[#2B352D] w-14 text-right">
                {availableHours} hrs
              </span>
            </div>
          </div>

          {/* Energy level selector */}
          <div>
            <label className="block text-xs font-semibold text-[#3C4A3E] mb-2">
              2. How is your energy right now?
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setEnergyLevel('gentle')}
                className={`p-2.5 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                  energyLevel === 'gentle'
                    ? 'bg-[#F2EEF7] border-[#68577C] text-[#3A3047] font-semibold'
                    : 'bg-white border-[#E0D9CE] text-[#5C6A5E] hover:border-[#CAD2CA]'
                }`}
              >
                <div className="font-medium text-[#29322A]">🌱 Low / Gentle</div>
                <div className="text-[11px] text-[#78867A] mt-0.5">Short 25m bursts & more breathing room</div>
              </button>
              <button
                type="button"
                onClick={() => setEnergyLevel('steady')}
                className={`p-2.5 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                  energyLevel === 'steady'
                    ? 'bg-[#EEF5EF] border-[#3A6446] text-[#23432B] font-semibold'
                    : 'bg-white border-[#E0D9CE] text-[#5C6A5E] hover:border-[#CAD2CA]'
                }`}
              >
                <div className="font-medium text-[#29322A]">🌿 Steady</div>
                <div className="text-[11px] text-[#78867A] mt-0.5">Balanced 35m blocks with regular breaks</div>
              </button>
              <button
                type="button"
                onClick={() => setEnergyLevel('focused')}
                className={`p-2.5 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                  energyLevel === 'focused'
                    ? 'bg-[#EBF2F7] border-[#3F688B] text-[#24415C] font-semibold'
                    : 'bg-white border-[#E0D9CE] text-[#5C6A5E] hover:border-[#CAD2CA]'
                }`}
              >
                <div className="font-medium text-[#29322A]">🚀 High Focus</div>
                <div className="text-[11px] text-[#78867A] mt-0.5">Deeper 45m deep-work study sprints</div>
              </button>
            </div>
          </div>
        </div>

        {/* Suggested Plan */}
        <div className="mt-6 pt-5 border-t border-[#ECE6DC]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-[#253027] uppercase tracking-wider">
              Suggested Realistic Plan ({formatMinutes(totalMinutes)})
            </h3>
            <span className="text-xs text-[#6F7D71] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#3D6948]" />
              Guilt-free pacing
            </span>
          </div>

          <div className="space-y-2.5">
            {plan.map((block, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                  block.type === 'focus'
                    ? 'bg-white border-[#E2DDD3] text-[#28332A]'
                    : block.type === 'break'
                    ? 'bg-[#F5F2EA] border-[#E8E2D7] text-[#5C6A5D]'
                    : 'bg-[#EDF5EE] border-[#D7E6DA] text-[#295033]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0">
                    {block.type === 'focus' ? (
                      <Clock className="w-4 h-4 text-[#3F684B]" />
                    ) : block.type === 'break' ? (
                      <Coffee className="w-4 h-4 text-[#7A6B53]" />
                    ) : (
                      <Heart className="w-4 h-4 text-[#3E6C4A]" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-xs text-[#263128]">
                      {block.title}
                    </div>
                    {block.subject && (
                      <div className="text-[11px] text-[#69776A] mt-0.5">
                        {block.subject}
                      </div>
                    )}
                  </div>
                </div>
                <div className="font-semibold text-xs text-[#4F5D51] shrink-0">
                  {block.durationMins} mins
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* College context note */}
        {todayClasses.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-[#F8F5EF] border border-[#E9E4DA] text-xs text-[#647266]">
            💡 <strong>Remember:</strong> You also have <strong>{todayClasses.length} class{todayClasses.length > 1 ? 'es' : ''}</strong> scheduled today. Do not try to do too much; finishing just one or two study tasks is a genuine win!
          </div>
        )}

        {/* Modal Actions */}
        <div className="mt-6 pt-4 border-t border-[#ECE6DC] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsOrganizeModalOpen(false)}
            className="px-4 py-2 text-xs font-medium text-[#657367] hover:text-[#253027] cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleApplyToDay}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#3E684A] text-white hover:bg-[#32563C] transition-colors cursor-pointer shadow-xs"
          >
            {applied ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>Plan Ready! Good luck today</span>
              </>
            ) : (
              <>
                <span>I'll follow this plan</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
