import type { ChartDefinition } from './chartRegistry';
import type { AnalysisResponse, CleaningResponse } from '../../types/dataset';
import type { PipelineExecutionEvent } from '../../types/engine';
import BasicChartRenderer from './renderers/BasicChartRenderer';
import StatisticalChartRenderer from './renderers/StatisticalChartRenderer';
import DataQualityChartRenderer from './renderers/DataQualityChartRenderer';
import MonitoringChartRenderer from './renderers/MonitoringChartRenderer';
import AdvancedChartRenderer from './renderers/AdvancedChartRenderer';
import MLTelemetrySpecRenderer from './renderers/MLTelemetrySpecRenderer';

interface ChartRendererProps {
  chart: ChartDefinition;
  analysis: AnalysisResponse | null;
  cleanResult: CleaningResponse | null;
  events: PipelineExecutionEvent[];
  selectedX: string;
  selectedY: string;
}

export default function ChartRenderer({
  chart,
  analysis,
  cleanResult,
  events,
  selectedX,
  selectedY,
}: ChartRendererProps) {
  if (chart.id >= 1 && chart.id <= 16) {
    return (
      <BasicChartRenderer
        chart={chart}
        analysis={analysis}
        selectedX={selectedX}
        selectedY={selectedY}
      />
    );
  }

  if (chart.id >= 17 && chart.id <= 30) {
    return (
      <StatisticalChartRenderer
        chart={chart}
        analysis={analysis}
        selectedX={selectedX}
        selectedY={selectedY}
      />
    );
  }

  if (chart.id >= 31 && chart.id <= 50) {
    return (
      <DataQualityChartRenderer
        chart={chart}
        analysis={analysis}
        cleanResult={cleanResult}
      />
    );
  }

  if (chart.id >= 51 && chart.id <= 80) {
    return (
      <MLTelemetrySpecRenderer
        chart={chart}
        analysis={analysis}
      />
    );
  }

  if (chart.id >= 81 && chart.id <= 95) {
    return (
      <MonitoringChartRenderer
        chart={chart}
        analysis={analysis}
        events={events}
      />
    );
  }

  if (chart.id >= 96 && chart.id <= 115) {
    return (
      <AdvancedChartRenderer
        chart={chart}
        analysis={analysis}
        selectedX={selectedX}
        selectedY={selectedY}
      />
    );
  }

  return (
    <div className="flex items-center justify-center h-full text-center text-[#64748b]">
      <p>Chart #{chart.id} renderer not mapped.</p>
    </div>
  );
}

