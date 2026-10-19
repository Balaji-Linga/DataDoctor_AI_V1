import type { AnalysisResponse, CleaningResponse, DataRow } from '../types/dataset'

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/$/, '')

async function readResponse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    if (typeof data.detail === 'string') {
      message = data.detail
    } else if (Array.isArray(data.detail) && data.detail.length > 0) {
      message = data.detail
        .map((err: unknown) => {
          if (typeof err === 'object' && err !== null && 'msg' in err) {
            return String((err as { msg: unknown }).msg)
          }
          return JSON.stringify(err)
        })
        .join(', ')
    }
    throw new Error(message)
  }

  return data as T
}

export async function checkHealth(): Promise<{ status: string; service: string; version: string }> {
  const response = await fetch(`${API_BASE}/health`)
  return readResponse(response)
}

export async function analyzeDataset(file: File, previewRows: number = 10): Promise<AnalysisResponse> {
  const body = new FormData()
  body.append('file', file)
  body.append('preview_rows', String(previewRows))

  const response = await fetch(`${API_BASE}/api/v1/analyze`, {
    method: 'POST',
    body,
  })

  return readResponse<AnalysisResponse>(response)
}

export async function cleanDataset(
  file: File,
  options: {
    missing_strategy: string
    fill_value?: string
    drop_duplicates: boolean
    drop_missing_rows: boolean
    preview_rows?: number
  },
): Promise<CleaningResponse> {
  const body = new FormData()
  body.append('file', file)
  body.append('missing_strategy', options.missing_strategy)
  body.append('drop_duplicates', String(options.drop_duplicates))
  body.append('drop_missing_rows', String(options.drop_missing_rows))
  body.append('preview_rows', String(options.preview_rows ?? 10))

  if (options.fill_value !== undefined && options.fill_value !== '') {
    body.append('fill_value', options.fill_value)
  }

  const response = await fetch(`${API_BASE}/api/v1/clean`, {
    method: 'POST',
    body,
  })

  return readResponse<CleaningResponse>(response)
}

/**
 * Escapes a single cell value according to RFC-4180 CSV standard.
 */
function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) {
    return ''
  }
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Converts dataset records to an RFC-4180 compliant CSV string.
 */
export function recordsToCsv(columns: string[], records: DataRow[]): string {
  if (!columns || columns.length === 0) return ''
  const header = columns.map(escapeCsvValue).join(',')
  const rows = records.map((record) =>
    columns.map((col) => escapeCsvValue(record[col])).join(',')
  )
  return [header, ...rows].join('\r\n')
}

/**
 * Initiates a browser download of a CSV file.
 */
export function triggerCsvDownload(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

