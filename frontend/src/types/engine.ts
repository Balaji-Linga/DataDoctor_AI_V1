export type EngineStatus = 'idle' | 'running' | 'success' | 'failed' | 'planned';

export interface EngineMetric {
  label: string;
  value: string | number;
  unit?: string;
}

export interface EngineDefinition {
  id: string;
  name: string;
  category: 'ingestion' | 'profiling' | 'detection' | 'remediation' | 'verification' | 'ml_future';
  implementation: 'implemented' | 'planned';
  backendModule: string;
  purpose: string;
  algorithm: string;
  responsibilities: string[];
  inputs: string[];
  outputs: string[];
  status: EngineStatus;
  lastRunTime: string | null;
  executionDurationMs: number | null;
  metrics: Record<string, string | number>;
  lastError: string | null;
}

export interface PipelineExecutionEvent {
  id: string;
  timestamp: string;
  operation: string;
  engineId: string;
  durationMs: number;
  status: 'success' | 'error';
  details: string;
}

