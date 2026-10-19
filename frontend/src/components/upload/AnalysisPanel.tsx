import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Sparkles,
  SlidersHorizontal,
  Download,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  HelpCircle,
  Activity,
  ShieldCheck,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';
import {
  analyzeDataset,
  cleanDataset,
  recordsToCsv,
  triggerCsvDownload,
} from '../../services/api';
import type {
  AnalysisResponse,
  CleaningResponse,
  QualityIssue,
} from '../../types/dataset';
import LoadingSpinner from '../ui/LoadingSpinner';
import QualityIssueCard from './QualityIssueCard';
import DataPreviewTable from './DataPreviewTable';

export type WorkflowState =
  | 'idle'
  | 'analyzing'
  | 'analyzed'
  | 'cleaning'
  | 'cleaned'
  | 'error';

interface AnalysisPanelProps {
  file: File;
  onAnalysisComplete?: (result: AnalysisResponse) => void;
  onCleanComplete?: (result: CleaningResponse) => void;
  className?: string;
}

type MissingStrategy = 'none' | 'mean' | 'median' | 'mode' | 'constant';

export default function AnalysisPanel({
  file,
  onAnalysisComplete,
  onCleanComplete,
  className = '',
}: AnalysisPanelProps) {
  const [state, setState] = useState<WorkflowState>('idle');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [cleanResult, setCleanResult] = useState<CleaningResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cleaning form controls
  const [missingStrategy, setMissingStrategy] = useState<MissingStrategy>('mean');
  const [fillValue, setFillValue] = useState<string>('');
  const [dropDuplicates, setDropDuplicates] = useState<boolean>(true);
  const [dropMissingRows, setDropMissingRows] = useState<boolean>(false);

  // Issues filter tab
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showScoreTooltip, setShowScoreTooltip] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);


  const handleRunAnalysis = useCallback(async () => {
    setState('analyzing');
    setErrorMessage(null);

    try {
      const response = await analyzeDataset(file, 10);
      setAnalysisResult(response);
      setState('analyzed');
      onAnalysisComplete?.(response);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed. Please check backend connection.';
      setErrorMessage(msg);
      setState('error');
    }
  }, [file, onAnalysisComplete]);

  const handleRunCleaning = useCallback(async () => {
    setState('cleaning');
    setErrorMessage(null);
    setDownloadSuccess(false);

    try {
      const response = await cleanDataset(file, {
        missing_strategy: missingStrategy,
        fill_value: missingStrategy === 'constant' ? fillValue : undefined,
        drop_duplicates: dropDuplicates,
        drop_missing_rows: dropMissingRows,
        preview_rows: 10,
      });

      setCleanResult(response);
      setState('cleaned');
      onCleanComplete?.(response);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Dataset cleaning failed. Please check options and try again.';
      setErrorMessage(msg);
      setState('error');
    }
  }, [
    file,
    missingStrategy,
    fillValue,
    dropDuplicates,
    dropMissingRows,
    onCleanComplete,
  ]);

  const handleDownloadCleaned = useCallback(() => {
    if (!cleanResult?.cleaning?.cleaned_dataset) return;

    const { columns, records, preview } = cleanResult.cleaning.cleaned_dataset;
    const dataToExport = records && records.length > 0 ? records : preview;
    const csvContent = recordsToCsv(columns, dataToExport);

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    triggerCsvDownload(`${baseName}_cleaned.csv`, csvContent);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  }, [cleanResult, file.name]);

  // Quality score computation
  const qualityScore = useMemo(() => {
    if (!analysisResult) return 100;
    const rowCount = analysisResult.dataset.row_count;
    const colCount = analysisResult.dataset.column_count;
    const totalIssues = analysisResult.quality_report.total_issues;
    const totalCells = rowCount * colCount;

    if (totalCells <= 0) return 100;
    const calculated = (1 - totalIssues / totalCells) * 100;
    return Math.max(0, Math.min(100, Math.round(calculated * 10) / 10));
  }, [analysisResult]);

  const scoreColor = useMemo(() => {
    if (qualityScore > 80) return { text: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', status: 'Healthy' };
    if (qualityScore > 50) return { text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', status: 'Degraded' };
    return { text: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', status: 'Critical Issues' };
  }, [qualityScore]);

  // Filtered issues
  const filteredIssues = useMemo(() => {
    if (!analysisResult) return [];
    const issues = analysisResult.quality_report.issues;
    if (selectedSeverity === 'all') return issues;
    return issues.filter((iss) => iss.severity === selectedSeverity);
  }, [analysisResult, selectedSeverity]);

  const issuesCounts = useMemo(() => {
    if (!analysisResult) return { all: 0, high: 0, medium: 0, low: 0 };
    const issues = analysisResult.quality_report.issues;
    return {
      all: issues.length,
      high: issues.filter((i) => i.severity === 'high').length,
      medium: issues.filter((i) => i.severity === 'medium').length,
      low: issues.filter((i) => i.severity === 'low').length,
    };
  }, [analysisResult]);

  return (
    <div className={`w-full flex flex-col gap-6 ${className}`}>
      {/* 1. IDLE STATE: Launch prompt */}
      {state === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="rounded-3xl p-8 border backdrop-blur-2xl flex flex-col items-center text-center relative overflow-hidden"
          style={{
            background: 'var(--bg-glass)',
            borderColor: 'var(--border-subtle)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border"
            style={{
              background: 'rgba(0, 212, 255, 0.1)',
              borderColor: 'rgba(0, 212, 255, 0.25)',
              color: 'var(--accent-cyan)',
            }}
          >
            <Activity className="w-8 h-8" />
          </div>

          <h3
            className="text-xl sm:text-2xl font-bold tracking-tight mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Ready for Diagnostic Inspection
          </h3>
          <p
            className="text-sm max-w-lg mb-6 leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            File <span className="font-semibold text-white">{file.name}</span> is staged.
            Run the automated engine to detect null values, duplicates, outliers, and type distributions.
          </p>

          <button
            type="button"
            onClick={handleRunAnalysis}
            className="px-6 py-3.5 rounded-2xl font-semibold text-sm flex items-center gap-2.5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
              color: '#050510',
              boxShadow: '0 0 25px var(--glow-cyan)',
            }}
          >
            <Play className="w-4 h-4 fill-current" />
            Analyze Dataset
          </button>
        </motion.div>
      )}

      {/* 2. LOADING STATE: Analyzing */}
      {state === 'analyzing' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="rounded-3xl p-12 border backdrop-blur-2xl flex flex-col items-center justify-center text-center"
          style={{
            background: 'var(--bg-glass)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <LoadingSpinner
            size="lg"
            message={`Analyzing ${file.name}... Calculating structural metrics, missingness, and quality issues.`}
          />
        </motion.div>
      )}

      {/* 3. ERROR STATE */}
      {state === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 border flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-xl"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
          }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="p-2.5 rounded-xl border shrink-0"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
              }}
            >
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-red-400">Analysis or Cleaning Error</h4>
              <p className="text-xs text-red-200/80 mt-0.5">{errorMessage}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={analysisResult ? handleRunCleaning : handleRunAnalysis}
            className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all hover:opacity-90 shrink-0"
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              borderColor: 'rgba(239, 68, 68, 0.4)',
              color: '#ffffff',
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </motion.div>
      )}

      {/* 4. ANALYZED / CLEANING / CLEANED MAIN WORKFLOW */}
      {analysisResult && (
        <AnimatePresence mode="sync">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-6"
          >
            {/* Top Cards: Dataset Overview & Quality Score */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1 & 2: Dataset Overview */}
              <div
                className="md:col-span-2 rounded-3xl p-6 border backdrop-blur-xl flex flex-col justify-between"
                style={{
                  background: 'var(--bg-glass)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet
                        className="w-4 h-4"
                        style={{ color: 'var(--accent-cyan)' }}
                      />
                      <span
                        className="text-xs uppercase tracking-wider font-semibold"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Dataset Overview
                      </span>
                    </div>

                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded border"
                      style={{
                        background: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--accent-cyan)',
                      }}
                    >
                      {analysisResult.dataset.file_name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
                    <div
                      className="p-3.5 rounded-2xl border"
                      style={{
                        background: 'rgba(15, 17, 37, 0.6)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <span
                        className="text-[11px] block mb-1 font-medium"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Total Rows
                      </span>
                      <span
                        className="text-xl font-bold font-mono"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {analysisResult.dataset.row_count.toLocaleString()}
                      </span>
                    </div>

                    <div
                      className="p-3.5 rounded-2xl border"
                      style={{
                        background: 'rgba(15, 17, 37, 0.6)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <span
                        className="text-[11px] block mb-1 font-medium"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Columns
                      </span>
                      <span
                        className="text-xl font-bold font-mono"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {analysisResult.dataset.column_count}
                      </span>
                    </div>

                    <div
                      className="p-3.5 rounded-2xl border"
                      style={{
                        background: 'rgba(15, 17, 37, 0.6)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <span
                        className="text-[11px] block mb-1 font-medium"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Missing Cells
                      </span>
                      <span
                        className="text-xl font-bold font-mono"
                        style={{
                          color:
                            analysisResult.statistics.missing_cells > 0
                              ? '#f59e0b'
                              : '#10b981',
                        }}
                      >
                        {analysisResult.statistics.missing_cells.toLocaleString()}
                      </span>
                    </div>

                    <div
                      className="p-3.5 rounded-2xl border"
                      style={{
                        background: 'rgba(15, 17, 37, 0.6)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <span
                        className="text-[11px] block mb-1 font-medium"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Duplicates
                      </span>
                      <span
                        className="text-xl font-bold font-mono"
                        style={{
                          color:
                            analysisResult.statistics.duplicate_rows > 0
                              ? '#ef4444'
                              : '#10b981',
                        }}
                      >
                        {analysisResult.statistics.duplicate_rows.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className="mt-4 pt-3 border-t flex flex-wrap items-center justify-between text-xs gap-2"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                >
                  <div className="flex items-center gap-3">
                    <span>
                      Numeric:{' '}
                      <strong className="text-white font-mono">
                        {analysisResult.statistics.numeric_columns.length}
                      </strong>
                    </span>
                    <span>·</span>
                    <span>
                      Non-numeric:{' '}
                      <strong className="text-white font-mono">
                        {analysisResult.statistics.non_numeric_columns.length}
                      </strong>
                    </span>
                  </div>
                  <span className="font-mono text-[11px]">
                    Previewing {analysisResult.dataset.preview.length} sample rows
                  </span>
                </div>
              </div>

              {/* Card 3: Quality Score Card */}
              <div
                className="rounded-3xl p-6 border backdrop-blur-xl flex flex-col justify-between relative overflow-hidden"
                style={{
                  background: 'var(--bg-glass)',
                  borderColor: scoreColor.border,
                }}
              >
                {/* Glow pill behind score */}
                <div
                  className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-20"
                  style={{ background: scoreColor.text }}
                />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-xs uppercase tracking-wider font-semibold"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Estimated Quality Score
                      </span>
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onMouseEnter={() => setShowScoreTooltip(true)}
                          onMouseLeave={() => setShowScoreTooltip(false)}
                          onClick={() => setShowScoreTooltip(!showScoreTooltip)}
                          aria-label="Quality score formula info"
                          className="p-0.5 rounded-full hover:opacity-80 transition-opacity"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                        </button>

                        {showScoreTooltip && (
                          <div
                            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-xl border text-[11px] leading-relaxed shadow-2xl backdrop-blur-2xl"
                            style={{
                              background: 'rgba(5, 5, 16, 0.95)',
                              borderColor: 'var(--border-subtle)',
                              color: 'var(--text-primary)',
                            }}
                          >
                            <p className="font-semibold text-white mb-1">
                              Estimated Quality Score Formula:
                            </p>
                            <code className="block p-1.5 rounded font-mono bg-black/40 text-cyan-300 text-[10px] mb-1.5">
                              (1 - Total Issues / (Rows × Columns)) × 100
                            </code>
                            <p style={{ color: 'var(--text-secondary)' }}>
                              Calculates the proportion of defect-free data points across the entire matrix. Clamped between 0 and 100.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                      style={{
                        background: scoreColor.bg,
                        color: scoreColor.text,
                      }}
                    >
                      {scoreColor.status}
                    </span>
                  </div>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span
                      className="text-5xl sm:text-6xl font-extrabold tracking-tight font-mono"
                      style={{ color: scoreColor.text }}
                    >
                      {qualityScore}
                    </span>
                    <span className="text-xl font-bold text-gray-400">/ 100</span>
                  </div>
                </div>

                <div className="mt-4">
                  {/* Score bar */}
                  <div
                    className="w-full h-2 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${qualityScore}%`,
                        background: scoreColor.text,
                      }}
                    />
                  </div>

                  <p
                    className="text-[11px] mt-2 flex items-center justify-between"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span>Total Issues Detected:</span>
                    <span className="font-mono font-semibold text-white">
                      {analysisResult.quality_report.total_issues}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quality Issues Summary Section */}
            <div
              className="rounded-3xl p-6 border backdrop-blur-xl"
              style={{
                background: 'var(--bg-glass)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="p-1.5 rounded-lg"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                    }}
                  >
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3
                      className="font-bold text-base tracking-tight"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Quality Issues & Anomalies
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Ranked by severity and impact on downstream analysis
                    </p>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div
                  className="flex items-center p-1 rounded-xl border self-start sm:self-auto"
                  style={{
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedSeverity('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      selectedSeverity === 'all'
                        ? 'bg-white/10 text-white font-semibold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    All ({issuesCounts.all})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSeverity('high')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      selectedSeverity === 'high'
                        ? 'bg-red-500/20 text-red-300 font-semibold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    High ({issuesCounts.high})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSeverity('medium')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      selectedSeverity === 'medium'
                        ? 'bg-amber-500/20 text-amber-300 font-semibold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Medium ({issuesCounts.medium})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSeverity('low')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      selectedSeverity === 'low'
                        ? 'bg-blue-500/20 text-blue-300 font-semibold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Low ({issuesCounts.low})
                  </button>
                </div>
              </div>

              {/* List of Issue Cards */}
              {filteredIssues.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border"
                    style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      borderColor: 'rgba(16, 185, 129, 0.25)',
                      color: '#10b981',
                    }}
                  >
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-sm text-emerald-400">
                    No issues found in this category
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {issuesCounts.all === 0
                      ? 'The dataset passed all automated quality heuristics!'
                      : 'Try switching to another severity filter to see other issues.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {filteredIssues.map((issue: QualityIssue, index: number) => (
                    <QualityIssueCard
                      key={`issue-${issue.type}-${issue.column}-${index}`}
                      issue={issue}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Original Data Preview Table */}
            <DataPreviewTable
              columns={analysisResult.dataset.columns}
              rows={analysisResult.dataset.preview}
              title="Raw Dataset Sample (First 10 Rows)"
              maxHeight={380}
            />

            {/* Cleaning Configuration Panel */}
            <div
              className="rounded-3xl p-6 sm:p-8 border backdrop-blur-xl relative overflow-hidden"
              style={{
                background: 'var(--bg-glass)',
                borderColor: 'rgba(0, 212, 255, 0.25)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
              }}
            >
              <div className="flex items-center gap-2.5 mb-6">
                <div
                  className="p-2 rounded-xl border"
                  style={{
                    background: 'rgba(0, 212, 255, 0.1)',
                    borderColor: 'rgba(0, 212, 255, 0.3)',
                    color: 'var(--accent-cyan)',
                  }}
                >
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    className="font-bold text-lg tracking-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Automated Remediation & Cleaning Engine
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Configure pipeline strategies to resolve missing values and prune duplicates
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Missing Value Strategy */}
                <div className="flex flex-col gap-4">
                  <div>
                    <label
                      htmlFor="missing-strategy-select"
                      className="block text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Missing Values Imputation Strategy
                    </label>
                    <select
                      id="missing-strategy-select"
                      value={missingStrategy}
                      onChange={(e) => setMissingStrategy(e.target.value as MissingStrategy)}
                      className="w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-colors"
                      style={{
                        background: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="none">None (Keep existing missing/null values)</option>
                      <option value="mean">Mean (Fill numeric with column average)</option>
                      <option value="median">Median (Fill numeric with column median)</option>
                      <option value="mode">Mode (Fill with most frequent value)</option>
                      <option value="constant">Constant (Fill with custom specified value)</option>
                    </select>
                    <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Non-numeric columns automatically fallback to modal (most frequent) values.
                    </p>
                  </div>

                  {/* Constant Fill Value (Visible only if strategy === 'constant') */}
                  {missingStrategy === 'constant' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <label
                        htmlFor="constant-fill-input"
                        className="block text-xs font-semibold uppercase tracking-wider mb-2"
                        style={{ color: 'var(--accent-cyan)' }}
                      >
                        Constant Fill Value
                      </label>
                      <input
                        id="constant-fill-input"
                        type="text"
                        placeholder="e.g. Unknown, 0, or N/A"
                        value={fillValue}
                        onChange={(e) => setFillValue(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none font-mono"
                        style={{
                          background: 'var(--bg-surface)',
                          borderColor: 'rgba(0, 212, 255, 0.4)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </motion.div>
                  )}
                </div>

                {/* Right Column: Checkbox Options */}
                <div className="flex flex-col gap-3.5 justify-center">
                  <label
                    className="flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors"
                    style={{
                      background: dropDuplicates
                        ? 'rgba(0, 212, 255, 0.05)'
                        : 'var(--bg-surface)',
                      borderColor: dropDuplicates
                        ? 'rgba(0, 212, 255, 0.3)'
                        : 'var(--border-subtle)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={dropDuplicates}
                      onChange={(e) => setDropDuplicates(e.target.checked)}
                      className="mt-1 rounded accent-cyan-400"
                    />
                    <div>
                      <span className="font-semibold text-xs text-white block">
                        Drop Duplicate Rows
                      </span>
                      <span className="text-[11px] text-gray-400 leading-normal">
                        Detects and purges identical rows to prevent bias in downstream modeling.
                      </span>
                    </div>
                  </label>

                  <label
                    className="flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors"
                    style={{
                      background: dropMissingRows
                        ? 'rgba(0, 212, 255, 0.05)'
                        : 'var(--bg-surface)',
                      borderColor: dropMissingRows
                        ? 'rgba(0, 212, 255, 0.3)'
                        : 'var(--border-subtle)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={dropMissingRows}
                      onChange={(e) => setDropMissingRows(e.target.checked)}
                      className="mt-1 rounded accent-cyan-400"
                    />
                    <div>
                      <span className="font-semibold text-xs text-white block">
                        Drop Rows with Missing Values
                      </span>
                      <span className="text-[11px] text-gray-400 leading-normal">
                        Removes any records containing nulls after imputation strategy is applied.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-7 pt-5 border-t flex flex-wrap items-center justify-between gap-4" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Remediation preserves original file integrity and computes before/after diffs.
                </div>

                <button
                  type="button"
                  disabled={state === 'cleaning'}
                  onClick={handleRunCleaning}
                  className="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
                    color: '#050510',
                    boxShadow: '0 0 25px var(--glow-cyan)',
                  }}
                >
                  {state === 'cleaning' ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Cleaning Dataset...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{cleanResult ? 'Re-clean Dataset' : 'Clean Dataset'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 5. CLEANING RESULTS & REPORT SECTION (When cleanResult exists) */}
            {cleanResult && cleanResult.cleaning && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6"
              >
                {/* Cleaning Summary Card */}
                <div
                  className="rounded-3xl p-6 sm:p-8 border backdrop-blur-xl relative overflow-hidden"
                  style={{
                    background: 'var(--bg-glass)',
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2.5 rounded-xl border"
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          borderColor: 'rgba(16, 185, 129, 0.3)',
                          color: '#10b981',
                        }}
                      >
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white">
                          Cleaning Pipeline Completed Successfully
                        </h3>
                        <p className="text-xs text-gray-400">
                          Summary of changes applied to {file.name}
                        </p>
                      </div>
                    </div>

                    {/* Download Button */}
                    <button
                      type="button"
                      onClick={handleDownloadCleaned}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all hover:scale-105 active:scale-95 shadow-md"
                      style={{
                        background: downloadSuccess
                          ? 'rgba(16, 185, 129, 0.25)'
                          : 'rgba(0, 212, 255, 0.15)',
                        borderColor: downloadSuccess
                          ? 'rgba(16, 185, 129, 0.5)'
                          : 'rgba(0, 212, 255, 0.4)',
                        color: downloadSuccess ? '#34d399' : 'var(--accent-cyan)',
                      }}
                    >
                      {downloadSuccess ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Downloaded!
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download Cleaned CSV
                        </>
                      )}
                    </button>
                  </div>

                  {/* Before / After Metrics Comparison Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {/* Rows metric */}
                    <div
                      className="p-4 rounded-2xl border"
                      style={{
                        background: 'rgba(15, 17, 37, 0.7)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <span className="text-[11px] text-gray-400 block mb-1">
                        Row Count
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold font-mono text-white">
                          {cleanResult.cleaning.report.rows_after.toLocaleString()}
                        </span>
                        <span className="text-xs font-mono text-gray-500 line-through">
                          {cleanResult.cleaning.report.rows_before.toLocaleString()}
                        </span>
                      </div>
                      <span
                        className="text-[10px] font-mono mt-1 block"
                        style={{
                          color:
                            cleanResult.cleaning.report.rows_removed > 0
                              ? '#ef4444'
                              : '#10b981',
                        }}
                      >
                        {cleanResult.cleaning.report.rows_removed > 0
                          ? `-${cleanResult.cleaning.report.rows_removed} rows removed`
                          : 'No rows removed'}
                      </span>
                    </div>

                    {/* Missing Cells metric */}
                    <div
                      className="p-4 rounded-2xl border"
                      style={{
                        background: 'rgba(15, 17, 37, 0.7)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <span className="text-[11px] text-gray-400 block mb-1">
                        Missing Cells
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold font-mono text-emerald-400">
                          {cleanResult.cleaning.report.missing_cells_after.toLocaleString()}
                        </span>
                        <span className="text-xs font-mono text-gray-500 line-through">
                          {cleanResult.cleaning.report.missing_cells_before.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 mt-1 block">
                        {(
                          cleanResult.cleaning.report.missing_cells_before -
                          cleanResult.cleaning.report.missing_cells_after
                        ).toLocaleString()}{' '}
                        cells resolved
                      </span>
                    </div>

                    {/* Duplicate Rows metric */}
                    <div
                      className="p-4 rounded-2xl border"
                      style={{
                        background: 'rgba(15, 17, 37, 0.7)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <span className="text-[11px] text-gray-400 block mb-1">
                        Duplicate Rows
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold font-mono text-emerald-400">
                          {cleanResult.cleaning.report.duplicate_rows_after.toLocaleString()}
                        </span>
                        <span className="text-xs font-mono text-gray-500 line-through">
                          {cleanResult.cleaning.report.duplicate_rows_before.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 mt-1 block">
                        {(
                          cleanResult.cleaning.report.duplicate_rows_before -
                          cleanResult.cleaning.report.duplicate_rows_after
                        ).toLocaleString()}{' '}
                        duplicates purged
                      </span>
                    </div>
                  </div>

                  {/* Changes List */}
                  {cleanResult.cleaning.report.changes &&
                    cleanResult.cleaning.report.changes.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-400 mb-3 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-cyan-400" />
                          Operations Applied:
                        </h4>
                        <div className="flex flex-col gap-2">
                          {cleanResult.cleaning.report.changes.map((ch, idx) => (
                            <div
                              key={`change-${idx}`}
                              className="px-4 py-2.5 rounded-xl border flex items-center justify-between text-xs font-mono"
                              style={{
                                background: 'rgba(10, 10, 26, 0.5)',
                                borderColor: 'var(--border-subtle)',
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-cyan-400 font-semibold">
                                  {ch.operation.replace(/_/g, ' ')}
                                </span>
                                {ch.column && (
                                  <span className="text-gray-400">
                                    on column <strong className="text-white">{ch.column}</strong>
                                  </span>
                                )}
                                {ch.strategy && (
                                  <span className="text-gray-500">({ch.strategy})</span>
                                )}
                              </div>
                              <span className="text-gray-400">
                                {ch.count.toLocaleString()} occurrences
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* Cleaned Dataset Preview Table */}
                <DataPreviewTable
                  columns={cleanResult.cleaning.cleaned_dataset.columns}
                  rows={cleanResult.cleaning.cleaned_dataset.preview}
                  title="Cleaned Dataset Sample (After Remediation)"
                  maxHeight={380}
                />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
