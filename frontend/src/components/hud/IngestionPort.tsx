import React, { useState, useRef } from 'react';
import { Upload, Sparkles, AlertCircle, FileText, X } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

interface IngestionPortProps {
  onFileLoaded: (file: File) => void;
  isLoading: boolean;
  activeFile: File | null;
  onClearFile: () => void;
}

export default function IngestionPort({
  onFileLoaded,
  isLoading,
  activeFile,
  onClearFile,
}: IngestionPortProps) {
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndEmit = (f: File) => {
    setErrorMsg(null);
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setErrorMsg('REJECTED: ONLY RFC-4180 CSV STREAMS ACCEPTED');
      soundManager.playAnomalyWarning();
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setErrorMsg('REJECTED: STREAM EXCEEDS 10 MB HARD LIMIT');
      soundManager.playAnomalyWarning();
      return;
    }
    if (f.size === 0) {
      setErrorMsg('REJECTED: ZERO-BYTE FILE PAYLOAD');
      soundManager.playAnomalyWarning();
      return;
    }
    soundManager.playScan();
    onFileLoaded(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateAndEmit(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndEmit(files[0]);
    }
  };

  // 1-Click Sample Telemetry Loader
  const handleLoadSample = async () => {
    soundManager.playScan();
    try {
      const res = await fetch('/sample_intelligence.csv');
      const blob = await res.blob();
      const sampleFile = new File([blob], 'sample_intelligence.csv', { type: 'text/csv' });
      onFileLoaded(sampleFile);
    } catch {
      setErrorMsg('FAILED TO FETCH SAMPLE TELEMETRY');
    }
  };

  return (
    <div className="fixed top-20 left-4 sm:left-6 z-40 w-80 sm:w-92 select-none pointer-events-auto">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`p-4 rounded-2xl border backdrop-blur-2xl shadow-2xl transition-all duration-300 ${
          isDragOver
            ? 'border-[#00d4ff] bg-[#00d4ff]/10 scale-[1.02]'
            : 'border-white/10 bg-[#050a18]/90'
        }`}
        style={{
          boxShadow: isDragOver
            ? '0 15px 40px rgba(0, 212, 255, 0.25)'
            : '0 10px 40px rgba(0, 0, 0, 0.8)',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Port Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Upload size={14} className="text-[#00d4ff]" />
            <span className="text-xs font-mono font-bold uppercase text-[#00d4ff] tracking-wider">
              INGESTION PORT
            </span>
          </div>
          {activeFile && (
            <button
              type="button"
              onClick={onClearFile}
              className="text-[#6b7280] hover:text-[#ef4444] cursor-pointer"
              title="Eject Stream"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Content based on loaded file or empty state */}
        {activeFile ? (
          <div className="py-3 font-mono text-xs space-y-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10">
              <FileText size={16} className="text-[#00d4ff]" />
              <div className="flex-1 truncate">
                <div className="font-bold text-[#f0f0f5] truncate">{activeFile.name}</div>
                <div className="text-[10px] text-[#6b7280]">
                  {(activeFile.size / 1024).toFixed(1)} KB · RFC-4180 STREAM
                </div>
              </div>
            </div>

            {isLoading && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-[#c9a961]">
                  <span>DISSECTING MATRIX...</span>
                  <span className="animate-pulse">PROCESSING</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#00d4ff] to-[#c9a961] animate-[pulse_1s_infinite] w-full" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-xs font-mono text-[#94a3b8] mb-3 leading-relaxed">
              DRAG &amp; DROP CSV STREAM INTO THE ENGINE, OR INITIALIZE TELEMETRY
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  soundManager.playClick();
                  fileInputRef.current?.click();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#00d4ff]/15 hover:bg-[#00d4ff]/25 border border-[#00d4ff]/40 text-[#00d4ff] text-xs font-mono font-bold transition-all cursor-pointer"
              >
                <Upload size={13} />
                <span>SELECT CSV</span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleLoadSample}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#c9a961]/15 hover:bg-[#c9a961]/25 border border-[#c9a961]/40 text-[#c9a961] text-xs font-mono font-bold transition-all cursor-pointer"
                title="Loads real sample telemetry immediately"
              >
                <Sparkles size={13} />
                <span>LOAD SAMPLE</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="mt-2 p-2 rounded-lg bg-red-950/40 border border-red-500/30 flex items-center gap-2 text-[11px] font-mono text-red-400">
            <AlertCircle size={13} />
            <span className="truncate">{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}

