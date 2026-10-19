import type { AnalysisResponse, CleaningResponse } from '../../types/dataset';
import MidnightMetricCards from './MidnightMetricCards';
import DonutQualityChart from './DonutQualityChart';
import PipelineFunnelChart from './PipelineFunnelChart';
import ColumnCompletenessCard from './ColumnCompletenessCard';
import DefectsBreakdownCard from './DefectsBreakdownCard';
import ActivityFeedCard from './ActivityFeedCard';
import DatasetRiskTable from './DatasetRiskTable';
import QualityScoreGauge from '../analytics/QualityScoreGauge';
import QualityBarCharts from '../analytics/QualityBarCharts';
import DatasetStatsExplorer from '../analytics/DatasetStatsExplorer';
import BeforeAfterComparisonChart from '../analytics/BeforeAfterComparisonChart';

interface MidnightOverviewProps {
  analysis: AnalysisResponse | null;
  cleanResult: CleaningResponse | null;
  onOpenStudioChart: (chartId: number) => void;
  onNavigateToEngines: () => void;
  onNavigateToCleaning: () => void;
}

export default function MidnightOverview({
  analysis,
  cleanResult,
  onOpenStudioChart,
  onNavigateToEngines,
  onNavigateToCleaning,
}: MidnightOverviewProps) {
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto w-full">
      {/* 1. Top 4 Metric Cards */}
      <section>
        <MidnightMetricCards
          analysis={analysis}
          cleanResult={cleanResult}
          onOpenChart={onOpenStudioChart}
        />
      </section>

      {/* 2. Primary Quality Core: Animated Gauge + Remediation Pipeline */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-5 min-h-[320px]">
          <QualityScoreGauge
            analysis={analysis}
            cleanResult={cleanResult}
            onOpenChart={onOpenStudioChart}
          />
        </div>
        <div className="lg:col-span-7 min-h-[320px]">
          <PipelineFunnelChart
            analysis={analysis}
            cleanResult={cleanResult}
            onNavigateToEngines={onNavigateToEngines}
            onOpenChart={onOpenStudioChart}
          />
        </div>
      </section>

      {/* 3. Deep Statistical & Quality Charts with On-Demand 3D Triggers */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        <div className="min-h-[340px]">
          <QualityBarCharts
            analysis={analysis}
            onOpenChart={onOpenStudioChart}
          />
        </div>
        <div className="min-h-[340px]">
          <DatasetStatsExplorer
            analysis={analysis}
            onOpenChart={onOpenStudioChart}
          />
        </div>
      </section>

      {/* 4. Feature Distribution + Column Completeness + Defects Breakdown */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
        <div className="min-h-[280px]">
          <DonutQualityChart
            analysis={analysis}
            onOpenChart={onOpenStudioChart}
          />
        </div>
        <div className="min-h-[280px]">
          <ColumnCompletenessCard
            analysis={analysis}
            onOpenChart={onOpenStudioChart}
          />
        </div>
        <div className="min-h-[280px]">
          <DefectsBreakdownCard
            analysis={analysis}
            onOpenChart={onOpenStudioChart}
          />
        </div>
      </section>

      {/* 5. Before vs After Remediation Comparison */}
      <section>
        <BeforeAfterComparisonChart
          analysis={analysis}
          cleanResult={cleanResult}
          onNavigateToCleaning={onNavigateToCleaning}
          onOpenChart={onOpenStudioChart}
        />
      </section>

      {/* 6. Activity & Risk Triage Table */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8">
          <DatasetRiskTable
            analysis={analysis}
            onOpenChart={onOpenStudioChart}
            onNavigateToCleaning={onNavigateToCleaning}
          />
        </div>
        <div className="lg:col-span-4 h-full">
          <ActivityFeedCard
            analysis={analysis}
            cleanResult={cleanResult}
            onViewLogs={onNavigateToEngines}
          />
        </div>
      </section>
    </div>
  );
}
