# DataDoctor AI — System Architecture

## Overview
DataDoctor AI is an enterprise data quality inspection, profiling, and remediation platform. It decouples high-performance client-side rendering (React 19, Three.js, Lucide, Recharts) from a modular, Python/FastAPI backend analytical engine.

```mermaid
graph TD
    subgraph Client ["Frontend Client (React 19 + Vite)"]
        UI["Modern UI / Hero Section"]
        ThreeCanvas["3D Holographic Particle Core\n(Three.js / React Three Fiber)"]
        Uploader["Drag-and-Drop CSV Ingestion"]
        Dashboard["Metrics Cards & Recharts Visualizer"]
        MLHygiene["ML Readiness & Feature Diagnostics"]
        CleaningPanel["Remediation Engine Controls"]
        Exporter["RFC-4180 CSV Exporter"]
    end

    subgraph Server ["Backend API (FastAPI + Python 3.14)"]
        Router["FastAPI App (app/main.py)\nCORS, Validation, Limits"]
        Pipeline["Analysis & Cleaning Pipeline\n(app/pipeline.py)"]
        
        subgraph Engines ["Modular Core Engines (app/engines/)"]
            Reader["Data Reader (csv_reader.py)\nSafe stream parsing"]
            Profiler["Profiler (statistics.py)\nSummary stats & null counting"]
            Detector["Quality Detector (detector.py)\nIQR Outliers, Duplicates, Cardinality"]
            Cleaner["Data Cleaner (cleaner.py)\nImputation & Deduplication"]
        end
    end

    Uploader -->|"POST /api/v1/analyze"| Router
    CleaningPanel -->|"POST /api/v1/clean"| Router
    Router --> Pipeline
    Pipeline --> Reader
    Pipeline --> Profiler
    Pipeline --> Detector
    Pipeline --> Cleaner
    Cleaner --> Router
    Router -->|"Structured Analysis JSON"| Dashboard
    Router -->|"Cleaned Dataset + Diffs"| CleaningPanel
    CleaningPanel --> Exporter
```

## Architectural Tenets

1. **Defensive Ingestion**:
   - Files are validated at the API boundary (size check, extension validation, empty payload detection) before disk storage or Pandas parsing.
2. **Stateless Processing**:
   - The backend holds no long-term persistent session state. Temporary files are isolated in OS temp directories and unlinked immediately in `finally` blocks.
3. **Immutability**:
   - Neither profiling nor cleaning ever alters the user's uploaded source file. DataFrames are processed as functional copies.
4. **Honest ML Diagnostics**:
   - The application explicitly distinguishes dataset feature readiness diagnostics (cardinality, null ratios, numeric distributions) from active ML model training. It never fabricates accuracy or training scores without an underlying model.
5. **Progressive Enhancement & Resilience**:
   - The 3D WebGL core includes an automatic fallback error boundary for low-power or mobile environments, respecting user accessibility and system performance.

