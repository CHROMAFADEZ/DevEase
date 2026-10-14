import React, { useState, useRef } from 'react';
import { 
  Palette, 
  Clock, 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  User, 
  FileJson,
  X,
  Cloud,
  CloudOff,
  LogOut,
  Database,
  Check,
  Instagram
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import { useAuth } from '../../context/AuthContext';
import { AppTheme } from '../../types';

export const SettingsView: React.FC = () => {
  const { 
    data, 
    updateSettings, 
    resetToSampleData, 
    clearSampleData, 
    clearAllData, 
    exportDataAsJson, 
    importDataFromJson,
    cloudSyncStatus,
    lastSyncedAt,
    syncErrorMessage
  } = useOrganizer();

  const { currentUser, loading: authLoading, signInWithGoogle, signOutUser } = useAuth();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [userName, setUserName] = useState(data.settings.userName);
  const [collegeName, setCollegeName] = useState(data.settings.collegeName);
  const [majorOrFocus, setMajorOrFocus] = useState(data.settings.majorOrFocus);
  const [studySessionMinutes, setStudySessionMinutes] = useState(data.settings.studySessionMinutes);
  const [breakMinutes, setBreakMinutes] = useState(data.settings.breakMinutes);
  const [theme, setTheme] = useState<AppTheme>(data.settings.theme);

  // Status feedback
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<{ message: string; isError: boolean } | null>(null);

  // Clear confirmation modal state
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearInputConfirm, setClearInputConfirm] = useState('');

  const handleSaveProfileAndPreferences = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      userName: userName.trim() || (currentUser?.displayName || 'Student'),
      collegeName: collegeName.trim(),
      majorOrFocus: majorOrFocus.trim(),
      studySessionMinutes,
      breakMinutes,
      theme,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleThemeChange = (newTheme: AppTheme) => {
    setTheme(newTheme);
    updateSettings({ theme: newTheme });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDataFromJson(content, 'replace');
      if (res.success) {
        setImportStatus({ message: 'Backup successfully imported!', isError: false });
      } else {
        setImportStatus({ message: res.error || 'Failed to import backup.', isError: true });
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmClearAll = () => {
    clearAllData();
    setIsClearModalOpen(false);
    setClearInputConfirm('');
  };

  const themesList: { id: AppTheme; label: string; desc: string; previewClasses: string }[] = [
    {
      id: 'cream-sage',
      label: 'Warm Cream & Sage (Default)',
      desc: 'Calm earthy greens with gentle warm paper tones',
      previewClasses: 'bg-[#FAF7F2] border-[#446A50] text-[#2F4A37]',
    },
    {
      id: 'lavender-oat',
      label: 'Gentle Lavender & Oat',
      desc: 'Muted purple hues for quiet, reflective studying',
      previewClasses: 'bg-[#F9F6F7] border-[#68577C] text-[#4A3D5B]',
    },
    {
      id: 'soft-blue',
      label: 'Soft Blue Mist',
      desc: 'Cool, serene blues for relaxed focus',
      previewClasses: 'bg-[#F5F8FA] border-[#366080] text-[#294B66]',
    },
    {
      id: 'nordic-slate',
      label: 'Nordic Slate',
      desc: 'Crisp minimal neutrals with low visual strain',
      previewClasses: 'bg-[#F7F7F6] border-[#48525B] text-[#343C43]',
    },
  ];

  const authenticatedName = currentUser?.displayName || currentUser?.email?.split('@')[0] || data.settings.userName || 'Student';

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-14 animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-[#242F26]">
          Settings & Preferences
        </h1>
        <p className="text-xs text-[#6C7A6E] mt-0.5">
          Manage your Google Account, Cloud Firestore synchronization, app themes, and backups.
        </p>
      </div>

      {/* 1. Firebase Cloud Sync & Authentication Section */}
      <div className="bg-white border border-[#E6E0D5] rounded-3xl p-6 md:p-7 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#EBE4DA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8EFF5] text-[#335C7E] flex items-center justify-center">
              <Cloud className="w-5 h-5 text-[#376185]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#253227]">
                Firebase Cloud Sync & Account
              </h2>
              <p className="text-xs text-[#718073]">
                Sync tasks, classes, assignments, and daily resets securely across your devices
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <span className="text-xs font-semibold text-[#2F5739] flex items-center gap-1.5 bg-[#EEF5EF] px-3 py-1.5 rounded-xl border border-[#D5E3D8]">
                <Check className="w-3.5 h-3.5" />
                <span>Connected</span>
              </span>
            ) : (
              <span className="text-xs font-medium text-[#7A6B53] flex items-center gap-1.5 bg-[#FAF6EE] px-3 py-1.5 rounded-xl border border-[#EFE5D0]">
                <CloudOff className="w-3.5 h-3.5" />
                <span>Offline / Local Only</span>
              </span>
            )}
          </div>
        </div>

        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#E7E0D6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={authenticatedName}
                    className="w-12 h-12 rounded-full object-cover border border-[#D9D1C5]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#3E684A] text-white font-bold flex items-center justify-center text-base">
                    {authenticatedName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-[#232F26]">
                    {authenticatedName}
                  </h3>
                  <p className="text-xs text-[#6B796D]">{currentUser.email}</p>
                  <p className="text-[11px] text-[#7A8A7C] mt-0.5">
                    User UID: <code className="bg-[#EFEAE2] px-1 py-0.5 rounded text-[10px]">{currentUser.uid.slice(0, 14)}...</code>
                  </p>
                </div>
              </div>

              <button
                onClick={signOutUser}
                disabled={authLoading}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#FAF6F2] hover:bg-[#F3ECE0] text-[#7E3D3D] border border-[#E4D5D5] transition-colors cursor-pointer self-start sm:self-auto"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Cloud Firestore details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE3D7]">
                <span className="text-[#78877B] block text-[11px]">Database Region</span>
                <span className="font-semibold text-[#253227] mt-0.5 block">asia-south1 (Mumbai)</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE3D7]">
                <span className="text-[#78877B] block text-[11px]">Sync Status</span>
                <span className="font-semibold text-[#2C5535] mt-0.5 flex items-center gap-1">
                  {cloudSyncStatus === 'syncing' ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Synchronizing...</span>
                    </>
                  ) : cloudSyncStatus === 'error' ? (
                    <span className="text-[#A24444]">Sync error</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-[#3E684A]" />
                      <span>Live Real-Time Sync</span>
                    </>
                  )}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE3D7]">
                <span className="text-[#78877B] block text-[11px]">Last Cloud Sync</span>
                <span className="font-semibold text-[#253227] mt-0.5 block">
                  {lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : 'Just now'}
                </span>
              </div>
            </div>

            {syncErrorMessage && (
              <div className="p-3 rounded-xl bg-[#FDF2F2] border border-[#F5D4D4] text-xs text-[#9E3939] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{syncErrorMessage}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-[#FCFAF7] border border-[#E7E0D6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[#243126]">
                Sign in with Google to enable Cloud Sync
              </h3>
              <p className="text-xs text-[#6F7D71] mt-1 max-w-lg leading-relaxed">
                Connect your account to synchronize your college tasks, assignments, and timetable with Cloud Firestore. Your existing local data will be automatically preserved and migrated without losing anything.
              </p>
            </div>
            <button
              onClick={signInWithGoogle}
              disabled={authLoading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#3E684A] hover:bg-[#34583E] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              {authLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <User className="w-4 h-4" />
              )}
              <span>Sign in with Google</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Student Profile & Focus Timings */}
      <form onSubmit={handleSaveProfileAndPreferences} className="bg-white border border-[#E6E0D5] rounded-3xl p-6 md:p-7 shadow-2xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#EBE4DA]">
          <div className="w-10 h-10 rounded-xl bg-[#EAF0EB] text-[#34593C] flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#253227]">
              Student Profile & Focus Timings
            </h2>
            <p className="text-xs text-[#718073]">
              Personalize your greetings and study timer presets
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
              Your Name or Nickname
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-[#242F26] focus:outline-hidden focus:border-[#3E684A] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
              College or University
            </label>
            <input
              type="text"
              placeholder="e.g. State College"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-[#242F26] focus:outline-hidden focus:border-[#3E684A] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3C4A3E] mb-1">
              Major or Academic Focus
            </label>
            <input
              type="text"
              placeholder="e.g. Computer Science"
              value={majorOrFocus}
              onChange={(e) => setMajorOrFocus(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-[#242F26] focus:outline-hidden focus:border-[#3E684A] focus:bg-white"
            />
          </div>
        </div>

        {/* Study Timing Preferences */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-[#3C4A3E] mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#3E684A]" />
              <span>Preferred Study Session Length</span>
            </label>
            <select
              value={studySessionMinutes}
              onChange={(e) => setStudySessionMinutes(Number(e.target.value))}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-[#242F26] focus:outline-hidden focus:border-[#3E684A] focus:bg-white"
            >
              <option value={25}>25 minutes (Standard Pomodoro)</option>
              <option value={35}>35 minutes (Balanced Sprint)</option>
              <option value={45}>45 minutes (Optimal Deep Work)</option>
              <option value={50}>50 minutes (Classic Lecture Block)</option>
              <option value={60}>60 minutes (1 Full Hour)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#3C4A3E] mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#735D8A]" />
              <span>Preferred Break Length</span>
            </label>
            <select
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value))}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#D9D1C5] bg-[#FAF8F5] text-[#242F26] focus:outline-hidden focus:border-[#3E684A] focus:bg-white"
            >
              <option value={5}>5 minutes (Quick stretch & water)</option>
              <option value={10}>10 minutes (Walk & relax)</option>
              <option value={15}>15 minutes (Longer recharge)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {saveSuccess && (
            <span className="text-xs text-[#3E684A] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Preferences saved!
            </span>
          )}
          <button
            type="submit"
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#3E684A] text-white hover:bg-[#34583E] transition-colors cursor-pointer shadow-xs"
          >
            Save Profile
          </button>
        </div>
      </form>

      {/* 3. Visual Theme Picker */}
      <div className="bg-white border border-[#E6E0D5] rounded-3xl p-6 md:p-7 shadow-2xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-[#EBE4DA]">
          <div className="w-10 h-10 rounded-xl bg-[#FAF1E3] text-[#7A643B] flex items-center justify-center">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#253227]">
              App Theme & Atmosphere
            </h2>
            <p className="text-xs text-[#718073]">
              Gentle color palettes crafted for zero eye strain during long study hours
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {themesList.map((t) => {
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleThemeChange(t.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#3E684A] ring-2 ring-[#3E684A]/20 bg-[#FAFBF9] shadow-xs'
                    : 'border-[#E3DBD0] hover:border-[#CAD2C8] bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#253227]">{t.label}</span>
                  {isSelected && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3E684A]" />
                  )}
                </div>
                <p className="text-[11px] text-[#69786B] mt-1">{t.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Local Storage & JSON Backup / Restore */}
      <div className="bg-white border border-[#E6E0D5] rounded-3xl p-6 md:p-7 shadow-2xs space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-[#EBE4DA]">
          <div className="w-10 h-10 rounded-xl bg-[#E8EFF5] text-[#3B6282] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#253227]">
              Local Storage & File Backups
            </h2>
            <p className="text-xs text-[#718073]">
              Offline copy is always saved locally on this browser. Export or restore JSON backups anytime.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E7E0D5] text-xs text-[#5E6D60] leading-relaxed">
          <p>
            <strong>Dual Storage Architecture:</strong> DayEase stores your records in browser <code>localStorage</code> for lightning-fast offline access and syncs with Cloud Firestore whenever you are signed in. You can also download complete JSON backups anytime.
          </p>
        </div>

        {importStatus && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              importStatus.isError
                ? 'bg-[#FDF2F2] border border-[#F5D4D4] text-[#9A3838]'
                : 'bg-[#EEF5EF] border border-[#D5E8D8] text-[#325E3B]'
            }`}
          >
            {importStatus.isError ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={exportDataAsJson}
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-[#DED7CC] bg-[#FAF8F5] hover:bg-[#F2ECE3] text-[#2A372C] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#3E684A]" />
            <span>Export Backup (JSON)</span>
          </button>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-[#DED7CC] bg-[#FAF8F5] hover:bg-[#F2ECE3] text-[#2A372C] text-xs font-semibold transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#3E684A]" />
              <span>Import Backup (JSON)</span>
            </button>
          </div>
        </div>

        {/* Sample Data & Reset options */}
        <div className="pt-4 border-t border-[#EBE4DA] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={resetToSampleData}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-white border border-[#DCD4C7] hover:bg-[#F6F1E9] text-[#4F5E52] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#3E684A]" />
              <span>Restore Sample Data</span>
            </button>
            <button
              onClick={clearSampleData}
              className="px-3 py-1.5 text-xs font-medium rounded-xl bg-white border border-[#DCD4C7] hover:bg-[#F6F1E9] text-[#4F5E52] transition-colors cursor-pointer"
            >
              Remove Sample Data
            </button>
          </div>

          <button
            onClick={() => setIsClearModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#FEF4F4] text-[#A24444] hover:bg-[#FDE7E7] border border-[#F2D0D0] transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>

      {/* Owner Credit Row */}
      <div className="-mt-3 pt-3.5 border-t border-[#E8E2D8] flex items-center justify-end">
        <a
          href="https://www.instagram.com/Chromafadez/"
          target="_blank"
          rel="noopener noreferrer"
          className="group ml-auto inline-flex items-center gap-2 py-1 text-xs text-[#7A887C] hover:text-[#253227] transition-colors whitespace-nowrap cursor-pointer select-none"
        >
          <span className="text-[#849286] group-hover:text-[#4F5E52] transition-colors">Owner</span>
          <Instagram className="w-3.5 h-3.5 text-[#7A887C] group-hover:text-[#253227] transition-colors shrink-0 ml-1 -mr-1" strokeWidth={1.75} />
          <span className="font-medium text-[#566558] group-hover:text-[#253227] transition-colors">Chromafadez</span>
        </a>
      </div>

      {/* Confirmation Modal for Clearing All Data */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#252E27]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="bg-[#FCFAF7] border border-[#E5DFD5] rounded-3xl w-full max-w-md shadow-2xl p-6"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#ECE6DC]">
              <div className="flex items-center gap-2 text-[#9A3838]">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-sm font-bold">Clear All Organizer Data?</h3>
              </div>
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="text-[#89978C] hover:text-[#253227] p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-[#5A685D]">
              <p>
                This will erase all your tasks, classes, assignments, and reset logs from your browser and connected cloud database.
              </p>
              <p>
                To confirm, please type <strong>CLEAR</strong> in the box below:
              </p>
              <input
                type="text"
                autoFocus
                placeholder="Type CLEAR to confirm"
                value={clearInputConfirm}
                onChange={(e) => setClearInputConfirm(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#D9D1C5] bg-white text-[#242F26] focus:outline-hidden focus:border-[#9A3838]"
              />
            </div>

            <div className="pt-3 border-t border-[#ECE6DC] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-[#657367] hover:text-[#253227] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clearInputConfirm !== 'CLEAR'}
                onClick={handleConfirmClearAll}
                className={`px-4 py-2 text-xs font-semibold rounded-xl text-white transition-colors cursor-pointer ${
                  clearInputConfirm === 'CLEAR'
                    ? 'bg-[#A24444] hover:bg-[#8B3737]'
                    : 'bg-[#D6C2C2] cursor-not-allowed'
                }`}
              >
                Permanently Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
