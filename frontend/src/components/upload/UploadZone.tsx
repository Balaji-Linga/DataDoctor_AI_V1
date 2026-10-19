import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, AlertCircle, X, CheckCircle2 } from 'lucide-react';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  currentFile?: File | null;
  onClear?: () => void;
  className?: string;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function isCsvFile(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return (
    name.endsWith('.csv') ||
    type === 'text/csv' ||
    type === 'application/vnd.ms-excel' ||
    type === 'text/plain' && name.endsWith('.csv')
  );
}

export default function UploadZone({
  onFileSelected,
  disabled = false,
  currentFile = null,
  onClear,
  className = '',
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeFile = currentFile !== undefined && currentFile !== null ? currentFile : localFile;

  const validateAndSelectFile = useCallback(
    (file: File) => {
      setErrorMessage(null);

      if (file.size === 0) {
        setErrorMessage('The selected file is empty (0 bytes). Please upload a valid CSV dataset.');
        return false;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage(
          `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 10 MB limit. Please select a smaller CSV file.`
        );
        return false;
      }

      if (!isCsvFile(file)) {
        setErrorMessage('Unsupported file format. Please upload a standard comma-separated (.csv) file.');
        return false;
      }

      setLocalFile(file);
      onFileSelected(file);
      return true;
    },
    [onFileSelected]
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      setIsDragging(true);
    },
    [disabled]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only reset dragging if cursor left the drop container completely
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles && droppedFiles.length > 0) {
        validateAndSelectFile(droppedFiles[0]);
      }
    },
    [disabled, validateAndSelectFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles && selectedFiles.length > 0) {
        validateAndSelectFile(selectedFiles[0]);
      }
    },
    [validateAndSelectFile]
  );

  const handleZoneClick = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  const handleRemoveFile = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setLocalFile(null);
      setErrorMessage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClear?.();
    },
    [onClear]
  );

  return (
    <div className={`w-full ${className}`}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv,application/vnd.ms-excel"
        className="hidden"
        disabled={disabled}
        onChange={handleInputChange}
      />

      {/* Main Upload Drop Box */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleZoneClick}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            handleZoneClick();
          }
        }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative group rounded-3xl p-8 sm:p-10 transition-all duration-300 border-2 border-dashed flex flex-col items-center justify-center text-center backdrop-blur-2xl overflow-hidden select-none outline-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        style={{
          background: isDragging
            ? 'rgba(0, 212, 255, 0.08)'
            : activeFile
            ? 'rgba(15, 17, 37, 0.85)'
            : 'var(--bg-glass)',
          borderColor: isDragging
            ? 'var(--accent-cyan)'
            : activeFile
            ? 'rgba(0, 212, 255, 0.4)'
            : 'var(--border-subtle)',
          boxShadow: isDragging
            ? '0 0 35px var(--glow-cyan), inset 0 0 20px var(--glow-cyan)'
            : '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Ambient background glow orb */}
        <div
          className="absolute -top-24 -left-24 w-64 h-64 rounded-full pointer-events-none transition-all duration-500 blur-3xl opacity-20"
          style={{
            background: isDragging ? 'var(--accent-cyan)' : 'var(--accent-blue)',
          }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full pointer-events-none transition-all duration-500 blur-3xl opacity-15"
          style={{
            background: 'var(--accent-gold)',
          }}
        />

        <AnimatePresence mode="wait">
          {!activeFile ? (
            /* Empty / Idle State */
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center z-10"
            >
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105"
                style={{
                  background: isDragging
                    ? 'rgba(0, 212, 255, 0.2)'
                    : 'rgba(0, 212, 255, 0.08)',
                  border: '1px solid rgba(0, 212, 255, 0.25)',
                  boxShadow: '0 0 25px rgba(0, 212, 255, 0.1)',
                }}
              >
                <Upload
                  className="w-8 h-8 sm:w-10 sm:h-10 transition-colors"
                  style={{
                    color: isDragging ? '#ffffff' : 'var(--accent-cyan)',
                  }}
                />
              </div>

              <h3
                className="text-lg sm:text-xl font-bold tracking-tight mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                {isDragging ? 'Drop CSV File Here' : 'Upload Your Dataset'}
              </h3>

              <p
                className="text-sm max-w-md mb-6 leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                Drag & drop your CSV file here, or{' '}
                <span
                  className="font-medium underline underline-offset-4"
                  style={{ color: 'var(--accent-cyan)' }}
                >
                  browse your device
                </span>
                . Instant automated diagnostic inspection and AI cleaning.
              </p>

              {/* Badges for Format & Size Requirements */}
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full border backdrop-blur-md"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" style={{ color: 'var(--accent-cyan)' }} />
                  CSV format only (.csv)
                </span>
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full border backdrop-blur-md"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--accent-gold)' }} />
                  Max size: 10 MB
                </span>
              </div>
            </motion.div>
          ) : (
            /* Selected File State */
            <motion.div
              key="selected"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg flex flex-col items-center z-10"
            >
              <div
                className="w-full rounded-2xl p-4 sm:p-5 border flex items-center justify-between gap-4 backdrop-blur-md transition-all shadow-xl"
                style={{
                  background: 'rgba(15, 17, 37, 0.9)',
                  borderColor: 'rgba(0, 212, 255, 0.3)',
                }}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
                    style={{
                      background: 'rgba(0, 212, 255, 0.1)',
                      borderColor: 'rgba(0, 212, 255, 0.25)',
                    }}
                  >
                    <FileSpreadsheet
                      className="w-6 h-6"
                      style={{ color: 'var(--accent-cyan)' }}
                    />
                  </div>

                  <div className="min-w-0 text-left">
                    <p
                      className="font-semibold text-sm sm:text-base truncate tracking-tight"
                      style={{ color: 'var(--text-primary)' }}
                      title={activeFile.name}
                    >
                      {activeFile.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-xs font-mono"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {formatFileSize(activeFile.size)}
                      </span>
                      <span
                        className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded font-semibold"
                        style={{
                          background: 'rgba(0, 212, 255, 0.15)',
                          color: 'var(--accent-cyan)',
                        }}
                      >
                        CSV
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  title="Remove file"
                  aria-label="Remove selected file"
                  className="p-2 rounded-xl transition-colors hover:scale-105 active:scale-95 shrink-0 border"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderColor: 'rgba(239, 68, 68, 0.25)',
                    color: '#f87171',
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p
                className="text-xs mt-3.5 text-center"
                style={{ color: 'var(--text-secondary)' }}
              >
                Click or drag another CSV file to replace
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Message Banner */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 overflow-hidden"
          >
            <div
              className="rounded-xl p-3.5 border flex items-center justify-between gap-3 text-xs sm:text-sm backdrop-blur-md"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                borderColor: 'rgba(239, 68, 68, 0.25)',
                color: '#fca5a5',
              }}
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="p-1 hover:opacity-80 rounded"
                title="Dismiss error"
              >
                <X className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
