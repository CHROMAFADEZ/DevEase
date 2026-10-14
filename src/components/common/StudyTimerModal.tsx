import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Coffee, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';

export const StudyTimerModal: React.FC = () => {
  const { isTimerModalOpen, setIsTimerModalOpen, data } = useOrganizer();
  
  const studyMins = data.settings.studySessionMinutes || 45;
  const breakMins = data.settings.breakMinutes || 10;

  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [timeLeft, setTimeLeft] = useState<number>(studyMins * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Sync initial time when modal opens or session settings change
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(mode === 'study' ? studyMins * 60 : breakMins * 60);
    }
  }, [studyMins, breakMins, mode]);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      // Play a soft chime with Web Audio API (no external asset needed)
      if (soundEnabled && typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4); // A5
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 1.2);
        } catch (e) {
          // ignore audio context restrictions
        }
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, soundEnabled]);

  if (!isTimerModalOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressPercent =
    mode === 'study'
      ? ((studyMins * 60 - timeLeft) / (studyMins * 60)) * 100
      : ((breakMins * 60 - timeLeft) / (breakMins * 60)) * 100;

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'study' ? studyMins * 60 : breakMins * 60);
  };

  const handleSwitchMode = (newMode: 'study' | 'break') => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(newMode === 'study' ? studyMins * 60 : breakMins * 60);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#252E27]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-[#FCFAF7] border border-[#E3DCD2] rounded-3xl w-full max-w-md shadow-2xl p-6 text-center"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#ECE6DC]">
          <span className="text-xs font-semibold text-[#576459] tracking-wider uppercase">
            Calm Focus Companion
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-[#88968B] hover:text-[#253027] p-1.5 rounded-lg hover:bg-[#F2ECE3] cursor-pointer"
              title={soundEnabled ? 'Mute gentle chime' : 'Enable gentle chime'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsTimerModalOpen(false)}
              className="text-[#88968B] hover:text-[#253027] p-1.5 rounded-lg hover:bg-[#F2ECE3] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center justify-center gap-2 mt-5 p-1 bg-[#F0EBE3] rounded-2xl max-w-xs mx-auto">
          <button
            onClick={() => handleSwitchMode('study')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              mode === 'study'
                ? 'bg-white text-[#253227] shadow-xs'
                : 'text-[#647266] hover:text-[#253227]'
            }`}
          >
            Study Focus ({studyMins}m)
          </button>
          <button
            onClick={() => handleSwitchMode('break')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              mode === 'break'
                ? 'bg-white text-[#253227] shadow-xs'
                : 'text-[#647266] hover:text-[#253227]'
            }`}
          >
            Gentle Break ({breakMins}m)
          </button>
        </div>

        {/* Circular / Big Timer Display */}
        <div className="my-8 flex flex-col items-center">
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-[#EFEAE2]"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                className={mode === 'study' ? 'stroke-[#3F684B]' : 'stroke-[#705E82]'}
                strokeWidth="6"
                strokeDasharray={264}
                strokeDashoffset={264 - (264 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-bold tracking-tight text-[#232F26]">
                {formattedTime}
              </span>
              <span className="text-xs text-[#717E73] mt-1 font-medium">
                {mode === 'study' ? 'Deep Calm Study' : 'Rest Your Eyes'}
              </span>
            </div>
          </div>

          <p className="text-xs text-[#7B887D] max-w-xs mt-1">
            {mode === 'study'
              ? 'Focus on just one small step at a time. No multitasking needed.'
              : 'Stand up, drink some water, and stretch your shoulders.'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleReset}
            className="p-3 rounded-2xl bg-white border border-[#DDD6CB] text-[#5C6A5E] hover:bg-[#F4EFE7] transition-colors cursor-pointer"
            title="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm transition-all cursor-pointer shadow-md ${
              isRunning
                ? 'bg-[#E3DFD5] text-[#333E35] hover:bg-[#D9D4C8]'
                : mode === 'study'
                ? 'bg-[#3E684A] text-white hover:bg-[#34583E]'
                : 'bg-[#6D5D81] text-white hover:bg-[#5E4F70]'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{timeLeft === (mode === 'study' ? studyMins * 60 : breakMins * 60) ? 'Start Focus' : 'Resume'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
