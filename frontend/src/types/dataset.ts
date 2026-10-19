export type DataRow = Record<string, string | number | boolean | null | undefined>;

export interface DatasetInfo {
  file_name: string;
  row_count: number;
  column_count: number;
  columns: string[];
  preview: DataRow[];
}

export interface ColumnDetail {
  data_type: string;
  non_missing_values: number;
  missing_values: number;
  unique_values: number;
}

export interface NumericalSummaryItem {
  count: number;
  mean: number | null;
  median: number | null;
  minimum: number | null;
  maximum: number | null;
  standard_deviation: number | null;
}

export interface Statistics {
  row_count: number;
  column_count: number;
  missing_cells: number;
  missing_by_column: Record<string, number>;
  duplicate_rows: number;
  numeric_columns: string[];
  non_numeric_columns: string[];
  column_details: Record<string, ColumnDetail>;
  numerical_summary: Record<string, NumericalSummaryItem>;
}

export interface QualityIssue {
  type: string;
  column: string | null;
  count: number;
  percentage?: number;
  severity: "high" | "medium" | "low";
  message: string;
  recommendation?: string;
  details?: Record<string, unknown>;
}

export interface QualityReport {
  row_count: number;
  column_count: number;
  total_issues: number;
  issue_counts: Record<string, number>;
  issues: QualityIssue[];
}

export interface CleaningChange {
  operation: string;
  column?: string;
  strategy?: string;
  count: number;
  replacement?: string | number | boolean | null;
}

export interface CleaningReport {
  rows_before: number;
  rows_after: number;
  rows_removed: number;
  missing_cells_before: number;
  missing_cells_after: number;
  duplicate_rows_before: number;
  duplicate_rows_after: number;
  changes: CleaningChange[];
  before_statistics: Statistics;
  after_statistics: Statistics;
}

export interface CleanedDataset {
  row_count: number;
  column_count: number;
  columns: string[];
  preview: DataRow[];
  records: DataRow[];
}

export interface AnalysisResponse {
  status: "success" | "error";
  dataset: DatasetInfo;
  statistics: Statistics;
  quality_report: QualityReport;
  cleaning: null | {
    report: CleaningReport;
    cleaned_dataset: CleanedDataset;
  };
}

export interface CleaningResponse extends AnalysisResponse {
  cleaning: {
    report: CleaningReport;
    cleaned_dataset: CleanedDataset;
  };
}

