import { Table, Eye, Hash } from 'lucide-react';
import type { DataRow } from '../../types/dataset';

interface DataPreviewTableProps {
  columns: string[];
  rows: DataRow[];
  title?: string;
  maxHeight?: number;
  className?: string;
}

export default function DataPreviewTable({
  columns,
  rows,
  title = 'Data Preview',
  maxHeight = 440,
  className = '',
}: DataPreviewTableProps) {
  const isMissingValue = (value: unknown): boolean => {
    return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
  };

  const renderCellValue = (value: unknown) => {
    if (isMissingValue(value)) {
      return (
        <span
          className="inline-block px-1.5 py-0.5 rounded text-[11px] font-mono italic tracking-wide"
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.25)',
          }}
        >
          {value === '' ? 'empty' : 'null'}
        </span>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <span
          className="inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-medium"
          style={{
            background: value ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: value ? '#34d399' : '#f87171',
          }}
        >
          {String(value)}
        </span>
      );
    }

    if (typeof value === 'number') {
      return (
        <span className="font-mono text-xs" style={{ color: 'var(--accent-cyan)' }}>
          {Number.isInteger(value) ? value.toLocaleString() : value.toFixed(4).replace(/\.?0+$/, '')}
        </span>
      );
    }

    const strValue = String(value);
    return (
      <span
        className="font-mono text-xs truncate max-w-xs block"
        title={strValue}
        style={{ color: 'var(--text-primary)' }}
      >
        {strValue}
      </span>
    );
  };

  return (
    <div
      className={`rounded-2xl border overflow-hidden flex flex-col backdrop-blur-xl ${className}`}
      style={{
        background: 'var(--bg-glass)',
        borderColor: 'var(--border-subtle)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }}
    >
      {/* Table Header Bar */}
      <div
        className="px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3"
        style={{
          background: 'rgba(10, 10, 26, 0.65)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="p-1.5 rounded-lg"
            style={{
              background: 'rgba(0, 212, 255, 0.1)',
              color: 'var(--accent-cyan)',
            }}
          >
            <Table className="w-4 h-4" />
          </div>
          <span
            className="font-semibold text-sm tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span
            className="px-2.5 py-1 rounded-md font-mono border"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            {columns.length} columns
          </span>
          <span
            className="px-2.5 py-1 rounded-md font-mono border"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--accent-cyan)',
            }}
          >
            {rows.length} preview rows
          </span>
        </div>
      </div>

      {/* Table Content or Empty State */}
      {rows.length === 0 || columns.length === 0 ? (
        <div className="py-14 flex flex-col items-center justify-center text-center px-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <Eye className="w-6 h-6 opacity-40" />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            No data rows to display
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Dataset preview is empty or unavailable.
          </p>
        </div>
      ) : (
        <div
          className="overflow-x-auto overflow-y-auto"
          style={{ maxHeight: `${maxHeight}px` }}
        >
          <table className="w-full border-collapse text-left text-xs min-w-max">
            {/* Header */}
            <thead>
              <tr
                className="sticky top-0 z-20 backdrop-blur-md"
                style={{
                  background: 'rgba(15, 17, 37, 0.95)',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                {/* Row Number Column Header */}
                <th
                  scope="col"
                  className="py-3 px-3.5 font-mono text-[11px] font-semibold tracking-wider text-center sticky left-0 z-30"
                  style={{
                    background: 'rgba(15, 17, 37, 0.98)',
                    color: 'var(--text-secondary)',
                    borderRight: '1px solid var(--border-subtle)',
                    width: '56px',
                  }}
                >
                  #
                </th>

                {/* Data Column Headers */}
                {columns.map((col) => (
                  <th
                    key={col}
                    scope="col"
                    className="py-3 px-4 font-medium text-xs tracking-tight"
                    style={{
                      color: 'var(--text-primary)',
                      borderRight: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3 h-3 opacity-40 shrink-0" />
                      <span className="font-semibold">{col}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr
                  key={`row-${rowIndex}`}
                  className="group transition-colors duration-150"
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  {/* Sticky Row Index */}
                  <td
                    className="py-2.5 px-3.5 font-mono text-[11px] text-center sticky left-0 z-10 transition-colors"
                    style={{
                      background: 'rgba(10, 10, 26, 0.95)',
                      color: 'var(--text-secondary)',
                      borderRight: '1px solid var(--border-subtle)',
                    }}
                  >
                    {rowIndex + 1}
                  </td>

                  {/* Data Cells */}
                  {columns.map((col) => {
                    const cellVal = row[col];
                    const isMissing = isMissingValue(cellVal);

                    return (
                      <td
                        key={`${rowIndex}-${col}`}
                        className="py-2.5 px-4 whitespace-nowrap transition-colors"
                        style={{
                          background: isMissing ? 'rgba(239, 68, 68, 0.04)' : undefined,
                          borderRight: '1px solid var(--border-subtle)',
                        }}
                      >
                        {renderCellValue(cellVal)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
