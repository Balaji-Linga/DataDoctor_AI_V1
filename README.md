# DataDoctor AI

> **Intelligent Data Quality, Profiling, and Remediation Workspace**  
> Built for data scientists, ML engineers, and analytics teams who need fast, accurate, and verified dataset diagnostics without compromising security or data integrity.

---

## Features

- **Interactive 3D Holographic Core**: Responsive WebGL data-sphere visualization powered by Three.js and React Three Fiber with dynamic scanning beams, particle dust, and automatic mobile/low-power fallback.
- **Automated CSV Ingestion & Profiling**: Multipart upload handling supporting up to 10 MB CSV files with instant schema detection, row/column counts, and type classification.
- **Multi-Dimensional Quality Scoring**: Objective 0–100 quality score derived from dataset completeness, duplicate ratio, and IQR (Interquartile Range) outlier frequency.
- **Interactive Visual Diagnostics**:
  - **Missing Values by Column**: Real-time bar chart illustrating null distributions.
  - **Completeness Ratio Donut**: Visual breakdown of populated vs. missing cells across the entire dataset.
  - **Structured Issue Log**: Exact count, column targeting, and descriptive explanations for all detected quality anomalies.
- **ML Feature Readiness Diagnostics**:
  - Numerical distribution and variance diagnostics.
  - Categorical cardinality checks and one-hot encoding readiness indicators.
  - Honest dataset hygiene assessment (no fabricated model scores or fake training loops).
- **Automated Remediation Engine**:
  - Imputation strategies: `mean`, `median`, `mode`, and `constant` (with automatic numeric casting).
  - Duplicate row removal and optional incomplete record elimination.
  - Comprehensive Before-and-After diff metrics (rows removed, nulls filled, duplicates purged).
- **RFC-4180 Compliant CSV Export**: Cleaned datasets are exported client-side directly from API response records with proper escaping and quote isolation.
- **Zero-Trust Security Architecture**: Temporary files are isolated and guaranteed to be unlinked in Python `finally` blocks; original source files remain strictly immutable.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Three.js, `@react-three/fiber`, `@react-three/drei`, Recharts, Lucide React |
| **Backend API** | FastAPI, Uvicorn, Python 3.14 / 3.12, Starlette, HTTPX / HTTPX2 |
| **Data Engine** | Pandas (Vectorized profiling, IQR outlier detection, type-preserving imputation) |
| **Testing** | Pytest, FastAPI TestClient, ESLint, TypeScript Strict Compiler |
| **Security** | 10 MB chunked stream limits, OS temp isolation, zero npm vulnerabilities, JSX auto-escaping |

---

## Quickstart

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start FastAPI API server
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- API Base URL: `http://127.0.0.1:8000`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/health`

### 2. Frontend Setup

```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```

- Open `http://localhost:5173` in your browser.

---

## Testing & Quality Verification

### Backend Pytest Suite (55 Tests Passed)
The backend test suite covers 22 integration tests and 33 unit tests:

```bash
cd backend
python -m pytest -v
```

Output:
```
============================= 55 passed in 1.23s ==============================
```

### Frontend Linting & Production Build
```bash
cd frontend

# Run ESLint (0 errors, 0 warnings)
npm run lint

# Build production bundle with TypeScript type-checking
npm run build
```

---

## Documentation

Detailed architectural and operational documentation is located in the `docs/` folder:

- [`docs/SECURITY_AUDIT.md`](./docs/SECURITY_AUDIT.md) — Comprehensive security assessment, threat modeling, and audit findings.
- [`docs/api-contract.md`](./docs/api-contract.md) — Complete endpoint specifications, request schemas, and sample JSON payloads.
- [`docs/architecture.md`](./docs/architecture.md) — System architecture diagram and design principles.
- [`docs/testing-strategy.md`](./docs/testing-strategy.md) — Test matrix, edge cases, and regression prevention.
- [`docs/demo-guide.md`](./docs/demo-guide.md) — Step-by-step user walkthrough and demo workflow.

---

## License
MIT License.

