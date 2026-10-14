import React, { useState, useRef, useMemo } from 'react';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Clock, 
  Calendar, 
  ArrowRight, 
  RefreshCw, 
  AlertTriangle, 
  Layers, 
  FlaskConical,
  Sunrise,
  ShieldCheck,
  Info
} from 'lucide-react';
import { useOrganizer } from '../../context/OrganizerContext';
import { useAuth } from '../../context/AuthContext';
import { DayOfWeek, ExtractedClass, TimetableClass } from '../../types';
import { formatTimeRange } from '../../utils/dateUtils';
import { DailyResetView } from '../daily-reset/DailyResetView';

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const RoutineView: React.FC = () => {
  const { data, importClassesBatch, setActiveTab, cloudSyncStatus } = useOrganizer();
  const { currentUser } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'import' | 'reset'>('import');
  
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Extraction state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [extractionSummary, setExtractionSummary] = useState<string | null>(null);
  const [extractedClasses, setExtractedClasses] = useState<ExtractedClass[]>([]);
  
  // Review & Confirmation state
  const [replaceConflicts, setReplaceConflicts] = useState(false);
  const [importSuccessResult, setImportSuccessResult] = useState<{
    importedCount: number;
    skippedDuplicates: number;
    replacedCount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle file selection
  const handleFile = (file: File) => {
    setAnalysisError(null);
    setNeedsApiKey(false);
    setImportSuccessResult(null);
    setExtractedClasses([]);
    setExtractionSummary(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpe?g|png|webp)$/i)) {
      setAnalysisError('Please upload a PDF document or JPG/PNG image file.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setAnalysisError('File size exceeds 20MB limit. Please upload a smaller image or document.');
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreviewUrl(null); // PDF indicator
    }
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
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Analyze Timetable with AI Vision
  const handleAnalyzeTimetable = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setNeedsApiKey(false);

    try {
      const base64Data = await fileToBase64(selectedFile);
      const mimeType = selectedFile.type || (selectedFile.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

      const response = await fetch('/api/extract-timetable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileData: base64Data,
          mimeType: mimeType,
          fileName: selectedFile.name,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (result.needsApiKey) {
          setNeedsApiKey(true);
        }
        setAnalysisError(result.error || 'Unable to parse timetable from this file.');
        return;
      }

      // Process extracted classes & evaluate duplicates & conflicts against existing classes
      const rawClasses: any[] = result.classes || [];
      const processed: ExtractedClass[] = rawClasses.map((item, idx) => {
        // Validate day
        const matchedDay = DAYS.find((d) => d.toLowerCase() === (item.day || '').toLowerCase()) || 'Monday';
        
        // Exact duplicate check
        const isDuplicate = data.classes.some(
          (c) =>
            c.day === matchedDay &&
            c.startTime === item.startTime &&
            c.endTime === item.endTime &&
            c.subject.trim().toLowerCase() === (item.subject || '').trim().toLowerCase()
        );

        // Conflict check
        const conflictingClass = data.classes.find(
          (c) =>
            c.day === matchedDay &&
            c.startTime < item.endTime &&
            c.endTime > item.startTime
        );

        return {
          id: `extracted_${Date.now()}_${idx}`,
          subject: item.subject || 'Untitled Course',
          day: matchedDay,
          startTime: item.startTime || '09:00',
          endTime: item.endTime || '10:30',
          room: item.room || 'Room TBA',
          instructor: item.instructor || undefined,
          notes: item.notes || undefined,
          isLabOrPractical: Boolean(item.isLabOrPractical),
          accentColor: item.accentColor || (item.isLabOrPractical ? 'blue' : 'sage'),
          isUncertain: Boolean(item.isUncertain),
          uncertainReason: item.uncertainReason || undefined,
          selected: !isDuplicate, // selected by default unless already in schedule
          isDuplicate,
          isConflict: Boolean(conflictingClass && !isDuplicate),
          conflictWith: conflictingClass,
        };
      });

      setExtractedClasses(processed);
      setExtractionSummary(result.summary || `Extracted ${processed.length} classes`);
    } catch (err: any) {
      console.error('Analysis request error:', err);
      setAnalysisError(err.message || 'Network error communicating with analysis service.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Provide realistic sample timetable data for instant testing
  const handleLoadSampleExtraction = () => {
    setAnalysisError(null);
    setNeedsApiKey(false);
    const sampleClasses: ExtractedClass[] = [
      {
        id: `sample_${Date.now()}_1`,
        subject: 'BIO 102: Cell Biology',
        day: 'Monday',
        startTime: '10:00',
        endTime: '11:30',
        room: 'Life Sciences 302',
        instructor: 'Dr. Katherine Bell',
        isLabOrPractical: false,
        accentColor: 'sage',
        selected: true,
      },
      {
        id: `sample_${Date.now()}_2`,
        subject: 'BIO 102: Practical Microscopy Lab',
        day: 'Monday',
        startTime: '14:00',
        endTime: '17:00',
        room: 'Bio Lab C-10',
        instructor: 'Lab Tech Henderson',
        isLabOrPractical: true,
        notes: 'Mandatory lab coat and safety goggles',
        accentColor: 'blue',
        selected: true,
      },
      {
        id: `sample_${Date.now()}_3`,
        subject: 'CHEM 101: General Chemistry',
        day: 'Tuesday',
        startTime: '09:00',
        endTime: '10:30',
        room: 'Auditorium 1',
        instructor: 'Prof. Marcus Vance',
        isLabOrPractical: false,
        accentColor: 'lavender',
        selected: true,
      },
      {
        id: `sample_${Date.now()}_4`,
        subject: 'ENG 202: Technical Writing',
        day: 'Wednesday',
        startTime: '11:30',
        endTime: '13:00',
        room: 'Humanities B-12',
        instructor: 'Prof. Rachel Wood',
        isLabOrPractical: false,
        accentColor: 'amber',
        isUncertain: true,
        uncertainReason: 'Room number handwriting was faint on timetable image',
        selected: true,
      },
      {
        id: `sample_${Date.now()}_5`,
        subject: 'CHEM 101: Synthesis Workshop',
        day: 'Thursday',
        startTime: '13:30',
        endTime: '15:30',
        room: 'Chem Hall 204',
        instructor: 'TA Daniel',
        isLabOrPractical: true,
        accentColor: 'blue',
        selected: true,
      },
    ];

    setExtractedClasses(sampleClasses);
    setExtractionSummary('Sample Timetable extracted 5 classes (including 2 lab sessions and 1 flagged review item).');
  };

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setExtractedClasses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setExtractedClasses((prev) => prev.map((c) => ({ ...c, selected: select })));
  };

  // In-place edit of extracted class
  const handleUpdateExtractedClass = (id: string, updates: Partial<ExtractedClass>) => {
    setExtractedClasses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, isUncertain: false } : c))
    );
  };

  const handleDeleteExtractedClass = (id: string) => {
    setExtractedClasses((prev) => prev.filter((c) => c.id !== id));
  };

  // Confirm and Save
  const handleConfirmImport = () => {
    const selectedToImport = extractedClasses.filter((c) => c.selected);
    if (selectedToImport.length === 0) return;

    const result = importClassesBatch(selectedToImport, { replaceConflicts });
    setImportSuccessResult(result);
    setExtractedClasses([]);
    setSelectedFile(null);
    setFilePreviewUrl(null);
  };

  const handleCancel = () => {
    setExtractedClasses([]);
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setExtractionSummary(null);
    setAnalysisError(null);
  };

  const selectedCount = extractedClasses.filter((c) => c.selected).length;
  const uncertainCount = extractedClasses.filter((c) => c.isUncertain).length;
  const conflictCount = extractedClasses.filter((c) => c.isConflict).length;

  return (
    <div className="space-y-7 max-w-5xl mx-auto pb-14 animate-in fade-in duration-200">
      {/* Top Header & Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#232F26] tracking-tight">
            Routine & Timetable
          </h1>
          <p className="text-xs sm:text-sm text-[#6C7A6E] mt-0.5">
            Intelligently import college schedules from PDFs or photos, manage your weekly routine, and reflect daily.
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center p-1 bg-[#EFEAE2] rounded-xl text-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('import')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeSubTab === 'import'
                ? 'bg-white text-[#242F26] shadow-2xs'
                : 'text-[#617163] hover:text-[#242F26]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#3E684A]" />
            <span>AI Timetable Import</span>
          </button>
          <button
            onClick={() => setActiveSubTab('reset')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              activeSubTab === 'reset'
                ? 'bg-white text-[#242F26] shadow-2xs'
                : 'text-[#617163] hover:text-[#242F26]'
            }`}
          >
            <Sunrise className="w-3.5 h-3.5 text-[#887042]" />
            <span>Daily Reset & Reflections</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 2: Daily Reset preserved and accessible */}
      {activeSubTab === 'reset' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-[#FCFAF7] border border-[#E7DFD4] text-xs text-[#58685A] flex items-center gap-2">
            <Info className="w-4 h-4 text-[#3E684A] shrink-0" />
            <span>
              Your daily reflections and morning planning routines are safely preserved right here under the Routine hub.
            </span>
          </div>
          <DailyResetView />
        </div>
      )}

      {/* SUBTAB 1: Smart Timetable Import Feature */}
      {activeSubTab === 'import' && (
        <div className="space-y-6">
          {/* Success Banner */}
          {importSuccessResult && (
            <div className="p-5 rounded-3xl bg-[#EEF5EF] border border-[#D5E6D8] text-xs text-[#2A5233] space-y-2 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-sm text-[#24482C]">
                <CheckCircle2 className="w-5 h-5 text-[#3E684A]" />
                <span>Timetable Successfully Imported!</span>
              </div>
              <p className="text-xs text-[#4F6854]">
                Added <strong>{importSuccessResult.importedCount} new class{importSuccessResult.importedCount === 1 ? '' : 'es'}</strong> to your college timetable.
                {importSuccessResult.skippedDuplicates > 0 && (
                  <span> ({importSuccessResult.skippedDuplicates} duplicates were skipped).</span>
                )}
                {importSuccessResult.replacedCount > 0 && (
                  <span> ({importSuccessResult.replacedCount} conflicting classes were updated).</span>
                )}
              </p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('timetable')}
                  className="px-3.5 py-1.5 bg-[#3E684A] text-white text-xs font-semibold rounded-xl hover:bg-[#34583E] transition-colors cursor-pointer"
                >
                  View in College Timetable &rarr;
                </button>
                <button
                  onClick={() => setActiveTab('today')}
                  className="px-3.5 py-1.5 bg-white text-[#2C5237] border border-[#C5D8C9] text-xs font-semibold rounded-xl hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  Go to Today's Dashboard
                </button>
              </div>
            </div>
          )}

          {/* Privacy & Cloud Notice */}
          <div className="p-3.5 rounded-2xl bg-[#FCFAF7] border border-[#E9E2D7] text-xs text-[#637265] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#3E684A] shrink-0" />
              <span>
                <strong>Privacy Protected:</strong> Timetables are processed using Gemini multimodal AI vision solely to parse class hours and rooms into your private account.
              </span>
            </div>
            <span className="text-[11px] font-semibold text-[#3C6448]">
              {currentUser ? 'Cloud Sync Enabled' : 'Offline Mode (Saved Locally)'}
            </span>
          </div>

          {/* Step 1: Upload Box (when no extracted classes are being reviewed) */}
          {extractedClasses.length === 0 && (
            <div className="bg-white border border-[#E6E0D5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="text-center max-w-lg mx-auto space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#EBF2EC] text-[#345C3E] flex items-center justify-center mx-auto shadow-2xs">
                  <Upload className="w-6 h-6 text-[#3E684A]" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#232F26]">
                  Upload Your College Timetable
                </h2>
                <p className="text-xs text-[#6C7A6E]">
                  Upload your semester timetable as a <strong>PDF, JPG, PNG</strong>, or take a phone screenshot of your student portal schedule.
                </p>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#3E684A] bg-[#F2F7F3] scale-[1.01]'
                    : selectedFile
                    ? 'border-[#3E684A] bg-[#FAFAF8]'
                    : 'border-[#D9D1C5] hover:border-[#3E684A] bg-[#FAF8F5] hover:bg-[#F6F3EE]'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-4 max-w-md mx-auto">
                    {filePreviewUrl ? (
                      <div className="relative inline-block max-h-56 overflow-hidden rounded-2xl border border-[#E0D8CB] shadow-xs">
                        <img
                          src={filePreviewUrl}
                          alt="Timetable preview"
                          className="max-h-56 max-w-full object-contain mx-auto"
                        />
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 p-4 rounded-2xl bg-[#F0EFEB] border border-[#E0D8CB]">
                        <FileText className="w-8 h-8 text-[#A84A4A]" />
                        <div className="text-left">
                          <span className="font-semibold text-xs text-[#242F26] block truncate max-w-xs">
                            {selectedFile.name}
                          </span>
                          <span className="text-[11px] text-[#718073]">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB PDF Document
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-2 text-xs">
                      <span className="font-semibold text-[#243126]">{selectedFile.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setFilePreviewUrl(null);
                        }}
                        className="text-[#9E4A4A] hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-center gap-2 text-[#7A8A7C]">
                      <FileText className="w-7 h-7 stroke-[1.6]" />
                      <ImageIcon className="w-7 h-7 stroke-[1.6]" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-[#2A362D]">
                        Click to upload or drag & drop timetable file here
                      </p>
                      <p className="text-[11px] text-[#7E8D81] mt-1">
                        Supports PDF schedules, camera photos, syllabus charts, and portal screenshots up to 20MB
                      </p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-[#D5CDC0] text-[#28352A] shadow-2xs hover:bg-[#FAF8F5]"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#3E684A]" />
                      <span>Select Timetable File</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Error Callout */}
              {analysisError && (
                <div className="p-4 rounded-2xl bg-[#FDF2F2] border border-[#F5D4D4] text-xs text-[#9E3939] space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Timetable Analysis Notice</span>
                  </div>
                  <p className="leading-relaxed">{analysisError}</p>
                  {needsApiKey && (
                    <div className="p-3 bg-white rounded-xl border border-[#F2C8C8] text-[11px] text-[#552020]">
                      💡 <strong>Note on Gemini API Key:</strong> To use automated vision extraction on live files, ensure <code>GEMINI_API_KEY</code> is set in your project environment secrets. Alternatively, you can test the extraction review immediately with our realistic sample below.
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleLoadSampleExtraction}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-xl bg-[#FAF6EE] text-[#5C4F35] border border-[#EADBBD] hover:bg-[#F5EEDF] transition-colors cursor-pointer"
                  title="Test timetable parser preview with sample college classes"
                >
                  ⚡ Try with Sample Timetable Preview
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreviewUrl(null);
                      }}
                      className="px-4 py-2 text-xs font-medium text-[#6B796D] hover:text-[#232F26] cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={!selectedFile || isAnalyzing}
                    onClick={handleAnalyzeTimetable}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-[#3E684A] text-white hover:bg-[#34583E] transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Analyzing with AI Vision...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Extract Classes with AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Review Before Saving (Editable Timetable Preview) */}
          {extractedClasses.length > 0 && (
            <div className="bg-white border border-[#E6E0D5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              {/* Review Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#ECE6DE]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3E684A]"></span>
                    <h2 className="text-base sm:text-lg font-bold text-[#232F26]">
                      Review Extracted Timetable
                    </h2>
                  </div>
                  <p className="text-xs text-[#6A786C] mt-1">
                    {extractionSummary || `Found ${extractedClasses.length} class entries.`} Verify subjects, days, and times before importing.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(selectedCount !== extractedClasses.length)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#FAF8F5] border border-[#DDD6CB] hover:bg-[#F2ECE3] text-[#4F5E52] cursor-pointer"
                  >
                    {selectedCount === extractedClasses.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-3 py-1.5 text-xs font-medium text-[#7A4A4A] hover:bg-[#FDF2F2] rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Status Notice Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-xl bg-[#EEF5EF] text-[#2F5739] font-medium border border-[#D5E3D8]">
                  {selectedCount} of {extractedClasses.length} selected to import
                </span>
                {uncertainCount > 0 && (
                  <span className="px-3 py-1 rounded-xl bg-[#FFF8EB] text-[#8C5D20] font-medium border border-[#F5E0B6] flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{uncertainCount} item{uncertainCount === 1 ? '' : 's'} flagged for verification</span>
                  </span>
                )}
                {conflictCount > 0 && (
                  <span className="px-3 py-1 rounded-xl bg-[#FDF6F0] text-[#9E5131] font-medium border border-[#F2D7C2]">
                    {conflictCount} overlaps with existing schedule
                  </span>
                )}
              </div>

              {/* Conflict resolution option */}
              {conflictCount > 0 && (
                <div className="p-3.5 rounded-2xl bg-[#FCF8F2] border border-[#EBDCC8] flex items-center justify-between gap-3 text-xs text-[#6E5535]">
                  <div>
                    <strong>Conflict Handling:</strong> Some imported classes overlap in time with classes already on your timetable.
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer shrink-0 font-semibold">
                    <input
                      type="checkbox"
                      checked={replaceConflicts}
                      onChange={(e) => setReplaceConflicts(e.target.checked)}
                      className="accent-[#3E684A] w-4 h-4 rounded cursor-pointer"
                    />
                    <span>Replace existing conflicting entries</span>
                  </label>
                </div>
              )}

              {/* Extracted Classes Editable Table / Cards */}
              <div className="space-y-3">
                {extractedClasses.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      !item.selected
                        ? 'bg-[#FAF8F5]/60 border-[#E8E2D7] opacity-65'
                        : item.isUncertain
                        ? 'bg-[#FFFDF9] border-[#E8D4A8] shadow-2xs'
                        : 'bg-white border-[#E6E0D5] hover:border-[#D5CDC1] shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Selection Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(item.id)}
                        className={`mt-1 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          item.selected
                            ? 'bg-[#3E684A] border-[#3E684A] text-white'
                            : 'border-[#C8BFB2] bg-white'
                        }`}
                        title={item.selected ? 'Deselect entry' : 'Select entry'}
                      >
                        {item.selected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      </button>

                      {/* Editable Form Controls Grid */}
                      <div className="flex-1 min-w-0 space-y-2.5">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                          {/* Subject Input */}
                          <div className="md:col-span-5">
                            <label className="block text-[10px] font-bold text-[#556357] uppercase tracking-wider mb-0.5">
                              Subject / Course Name
                            </label>
                            <input
                              type="text"
                              value={item.subject}
                              onChange={(e) =>
                                handleUpdateExtractedClass(item.id, { subject: e.target.value })
                              }
                              className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-[#DCD5C9] bg-white text-[#242F26] focus:border-[#3E684A] focus:outline-hidden"
                            />
                          </div>

                          {/* Day Selector */}
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-[#556357] uppercase tracking-wider mb-0.5">
                              Day
                            </label>
                            <select
                              value={item.day}
                              onChange={(e) =>
                                handleUpdateExtractedClass(item.id, { day: e.target.value as DayOfWeek })
                              }
                              className="w-full text-xs px-2 py-1.5 rounded-xl border border-[#DCD5C9] bg-white text-[#242F26] focus:border-[#3E684A] focus:outline-hidden"
                            >
                              {DAYS.map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Time Inputs */}
                          <div className="md:col-span-3 flex items-center gap-1.5">
                            <div className="flex-1">
                              <label className="block text-[10px] font-bold text-[#556357] uppercase tracking-wider mb-0.5">
                                Start
                              </label>
                              <input
                                type="time"
                                value={item.startTime}
                                onChange={(e) =>
                                  handleUpdateExtractedClass(item.id, { startTime: e.target.value })
                                }
                                className="w-full text-xs px-2 py-1.5 rounded-xl border border-[#DCD5C9] bg-white text-[#242F26] focus:border-[#3E684A] focus:outline-hidden"
                              />
                            </div>
                            <span className="text-[#88978A] mt-4">–</span>
                            <div className="flex-1">
                              <label className="block text-[10px] font-bold text-[#556357] uppercase tracking-wider mb-0.5">
                                End
                              </label>
                              <input
                                type="time"
                                value={item.endTime}
                                onChange={(e) =>
                                  handleUpdateExtractedClass(item.id, { endTime: e.target.value })
                                }
                                className="w-full text-xs px-2 py-1.5 rounded-xl border border-[#DCD5C9] bg-white text-[#242F26] focus:border-[#3E684A] focus:outline-hidden"
                              />
                            </div>
                          </div>

                          {/* Delete Entry */}
                          <div className="md:col-span-2 flex items-center justify-end mt-4">
                            <button
                              type="button"
                              onClick={() => handleDeleteExtractedClass(item.id)}
                              className="p-1.5 text-[#9E4A4A] hover:bg-[#FDF0F0] rounded-lg transition-colors cursor-pointer"
                              title="Delete from import list"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Secondary Details: Room, Teacher, Lab badge */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                          <input
                            type="text"
                            placeholder="Room / Hall"
                            value={item.room}
                            onChange={(e) =>
                              handleUpdateExtractedClass(item.id, { room: e.target.value })
                            }
                            className="text-xs px-2.5 py-1 rounded-lg border border-[#DCD5C9] bg-white text-[#4A574C] placeholder:text-[#9EA89F] focus:border-[#3E684A] focus:outline-hidden"
                          />
                          <input
                            type="text"
                            placeholder="Teacher / Instructor (Optional)"
                            value={item.instructor || ''}
                            onChange={(e) =>
                              handleUpdateExtractedClass(item.id, { instructor: e.target.value || undefined })
                            }
                            className="text-xs px-2.5 py-1 rounded-lg border border-[#DCD5C9] bg-white text-[#4A574C] placeholder:text-[#9EA89F] focus:border-[#3E684A] focus:outline-hidden"
                          />
                          <label className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#FAF8F5] border border-[#E2DBD1] cursor-pointer text-[#4B594E]">
                            <input
                              type="checkbox"
                              checked={item.isLabOrPractical}
                              onChange={(e) =>
                                handleUpdateExtractedClass(item.id, {
                                  isLabOrPractical: e.target.checked,
                                  accentColor: e.target.checked ? 'blue' : 'sage',
                                })
                              }
                              className="accent-[#3E684A] w-3.5 h-3.5 rounded cursor-pointer"
                            />
                            <FlaskConical className="w-3.5 h-3.5 text-[#356187]" />
                            <span className="text-[11px] font-medium">Lab / Practical Session</span>
                          </label>
                        </div>

                        {/* Uncertain or Duplicate Warnings */}
                        {item.isUncertain && (
                          <div className="p-2 rounded-xl bg-[#FFF9EE] border border-[#F5E2B8] text-[11px] text-[#875C21] flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#9E6D24]" />
                            <span>
                              <strong>Flagged for Review:</strong> {item.uncertainReason || 'Please verify room and time accuracy.'}
                            </span>
                          </div>
                        )}

                        {item.isDuplicate && (
                          <div className="p-2 rounded-xl bg-[#F5F5F3] border border-[#E3E3DE] text-[11px] text-[#696F6B] flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 shrink-0" />
                            <span>Already exists in your timetable. Skipped by default to prevent duplicates.</span>
                          </div>
                        )}

                        {item.isConflict && (
                          <div className="p-2 rounded-xl bg-[#FDF5F2] border border-[#F2D7CD] text-[11px] text-[#9A4C32] flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Overlaps with existing class: <strong>{item.conflictWith?.subject}</strong> ({item.conflictWith?.startTime} – {item.conflictWith?.endTime}).
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Confirm & Save Actions */}
              <div className="pt-4 border-t border-[#ECE6DE] flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-[#6A786C] hover:text-[#232F26] rounded-xl hover:bg-[#F2ECE3] transition-colors cursor-pointer"
                >
                  Discard & Cancel
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={selectedCount === 0}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-[#3E684A] text-white hover:bg-[#34583E] transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Import {selectedCount} Classes into Timetable</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
