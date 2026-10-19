/**
 * DataDoctor AI — Mathematical & Statistical Analysis Utilities
 * Real dataset calculations for 3D Visualizations.
 */

export interface CorrelationCell {
  colA: string;
  colB: string;
  r: number;
}

export interface HistogramBin {
  binStart: number;
  binEnd: number;
  mid: number;
  count: number;
  percentage: number;
}

/**
 * Calculates the exact Pearson correlation coefficient between two numeric series.
 * Handles edge cases (< 2 points, zero variance, NaN values) by returning 0.
 */
export function pearsonCorrelation(
  x: (number | null | undefined)[],
  y: (number | null | undefined)[]
): number {
  let n = 0;
  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumYY = 0;
  let sumXY = 0;

  const len = Math.min(x.length, y.length);
  for (let i = 0; i < len; i++) {
    const valX = x[i];
    const valY = y[i];
    if (
      typeof valX === "number" &&
      !isNaN(valX) &&
      isFinite(valX) &&
      typeof valY === "number" &&
      !isNaN(valY) &&
      isFinite(valY)
    ) {
      n++;
      sumX += valX;
      sumY += valY;
      sumXX += valX * valX;
      sumYY += valY * valY;
      sumXY += valX * valY;
    }
  }

  if (n < 2) return 0;

  const numerator = n * sumXY - sumX * sumY;
  const varX = n * sumXX - sumX * sumX;
  const varY = n * sumYY - sumY * sumY;

  // Zero variance check
  if (varX <= 0 || varY <= 0) return 0;

  const denominator = Math.sqrt(varX * varY);
  if (denominator === 0 || !isFinite(denominator)) return 0;

  const r = numerator / denominator;
  if (isNaN(r) || !isFinite(r)) return 0;

  return Math.max(-1, Math.min(1, Number(r.toFixed(4))));
}

/**
 * Alias for backward compatibility.
 */
export const calculatePearsonCorrelation = pearsonCorrelation;

/**
 * Computes full pairwise correlation matrix for numeric columns from records.
 */
export function calculateCorrelationMatrix(
  columns: string[],
  records: Record<string, unknown>[]
): { matrix: CorrelationCell[]; columns: string[] } {
  if (!columns || columns.length === 0 || !records || records.length === 0) {
    return { matrix: [], columns: [] };
  }

  // Filter columns that actually contain numeric values in records
  const validColumns = columns.filter((col) => {
    let hasNumeric = false;
    for (const r of records) {
      const v = r[col];
      if (typeof v === "number" && !isNaN(v) && isFinite(v)) {
        hasNumeric = true;
        break;
      }
    }
    return hasNumeric;
  });

  if (validColumns.length === 0) {
    return { matrix: [], columns: [] };
  }

  // Pre-extract numeric series for performance
  const seriesMap: Record<string, (number | null)[]> = {};
  for (const col of validColumns) {
    seriesMap[col] = records.map((r) => {
      const v = r[col];
      return typeof v === "number" && !isNaN(v) && isFinite(v) ? v : null;
    });
  }

  const matrix: CorrelationCell[] = [];
  for (let i = 0; i < validColumns.length; i++) {
    for (let j = 0; j < validColumns.length; j++) {
      const colA = validColumns[i];
      const colB = validColumns[j];
      const r = i === j ? 1.0 : pearsonCorrelation(seriesMap[colA], seriesMap[colB]);
      matrix.push({ colA, colB, r: Number(r.toFixed(3)) });
    }
  }

  return { matrix, columns: validColumns };
}

/**
 * Calculates equal-width histogram frequency bins for a single numeric feature.
 */
export function calculateHistogramBins(
  values: number[],
  binCount = 10
): HistogramBin[] {
  const clean = values.filter((v) => typeof v === "number" && !isNaN(v) && isFinite(v));
  if (clean.length === 0 || binCount <= 0) return [];

  let min = Math.min(...clean);
  let max = Math.max(...clean);

  if (min === max) {
    min = min - 1;
    max = max + 1;
  }

  const actualBinCount = Math.max(1, Math.min(binCount, 50));
  const binWidth = (max - min) / actualBinCount;
  const bins: HistogramBin[] = [];

  for (let b = 0; b < actualBinCount; b++) {
    const binStart = min + b * binWidth;
    const binEnd = min + (b + 1) * binWidth;
    bins.push({
      binStart: Number(binStart.toFixed(2)),
      binEnd: Number(binEnd.toFixed(2)),
      mid: Number(((binStart + binEnd) / 2).toFixed(2)),
      count: 0,
      percentage: 0,
    });
  }

  for (const val of clean) {
    let placed = false;
    for (let b = 0; b < actualBinCount; b++) {
      if (b === actualBinCount - 1) {
        if (val >= bins[b].binStart && val <= bins[b].binEnd + 1e-7) {
          bins[b].count++;
          placed = true;
          break;
        }
      } else {
        if (val >= bins[b].binStart && val < bins[b].binEnd) {
          bins[b].count++;
          placed = true;
          break;
        }
      }
    }
    if (!placed) {
      bins[actualBinCount - 1].count++;
    }
  }

  for (const bin of bins) {
    bin.percentage = Number(((bin.count / clean.length) * 100).toFixed(1));
  }

  return bins;
}

export interface BoxPlotStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  iqr: number;
  lowerFence: number;
  upperFence: number;
  outliers: number[];
}

export function calculateBoxPlotStats(values: number[]): BoxPlotStats | null {
  const clean = values
    .filter((v) => typeof v === 'number' && !isNaN(v) && isFinite(v))
    .sort((a, b) => a - b);
  if (clean.length === 0) return null;

  const q = (p: number) => {
    const pos = (clean.length - 1) * p;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (clean[base + 1] !== undefined) {
      return clean[base] + rest * (clean[base + 1] - clean[base]);
    }
    return clean[base];
  };

  const min = clean[0];
  const max = clean[clean.length - 1];
  const q1 = q(0.25);
  const median = q(0.5);
  const q3 = q(0.75);
  const iqr = q3 - q1;
  const lowerFence = Math.max(min, q1 - 1.5 * iqr);
  const upperFence = Math.min(max, q3 + 1.5 * iqr);

  const outliers = clean.filter((v) => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr);

  return {
    min: Number(min.toFixed(2)),
    q1: Number(q1.toFixed(2)),
    median: Number(median.toFixed(2)),
    q3: Number(q3.toFixed(2)),
    max: Number(max.toFixed(2)),
    iqr: Number(iqr.toFixed(2)),
    lowerFence: Number(lowerFence.toFixed(2)),
    upperFence: Number(upperFence.toFixed(2)),
    outliers,
  };
}

export function calculateKDE(values: number[], steps = 40): { x: number; density: number }[] {
  const clean = values.filter((v) => typeof v === 'number' && !isNaN(v) && isFinite(v));
  if (clean.length < 2) return [];

  const n = clean.length;
  const mean = clean.reduce((s, v) => s + v, 0) / n;
  const variance = clean.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1);
  const std = Math.sqrt(variance);
  if (std === 0) return [];

  // Silverman's rule of thumb bandwidth
  const bandwidth = 1.06 * std * Math.pow(n, -0.2);

  const min = Math.min(...clean) - bandwidth * 2;
  const max = Math.max(...clean) + bandwidth * 2;
  const stepSize = (max - min) / steps;

  const gaussianKernel = (u: number) => (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * u * u);

  const points: { x: number; density: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = min + i * stepSize;
    let sum = 0;
    for (const val of clean) {
      sum += gaussianKernel((x - val) / bandwidth);
    }
    const density = sum / (n * bandwidth);
    points.push({ x: Number(x.toFixed(2)), density: Number(density.toFixed(5)) });
  }

  return points;
}

export function calculateECDF(values: number[]): { x: number; ecdf: number }[] {
  const clean = values
    .filter((v) => typeof v === 'number' && !isNaN(v) && isFinite(v))
    .sort((a, b) => a - b);
  if (clean.length === 0) return [];

  return clean.map((x, idx) => ({
    x: Number(x.toFixed(2)),
    ecdf: Number(((idx + 1) / clean.length).toFixed(3)),
  }));
}

