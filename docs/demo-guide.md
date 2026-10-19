# DataDoctor AI — Quickstart & Demonstration Guide

This guide walks through starting and running the full DataDoctor AI application locally, from launching the services to analyzing and cleaning sample datasets.

---

## 1. Prerequisites
- **Python**: 3.10+ (Tested on Python 3.14.5)
- **Node.js**: v18+ (Tested on Node v22.13.1)
- **Modern Web Browser**: Chrome, Edge, Firefox, or Safari (WebGL enabled)

---

## 2. Starting the Backend API

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Ensure dependencies are installed:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI development server:
   ```bash
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
4. Verify backend health:
   - Open [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health) -> `{"status": "healthy"}`
   - Interactive Swagger API docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 3. Starting the Frontend UI

1. Open a second terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the web application:
   - Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 4. End-to-End Walkthrough

### Step 1: Ingesting a Dataset
- Click the **"Try Sample Dataset"** button on the upload area to instantly load a test customer dataset with deliberate quality issues (missing values, duplicates, outliers).
- Alternatively, drag and drop any `.csv` file up to 10 MB.
- Click **"Analyze Dataset"**.

### Step 2: Exploring Data Quality Diagnostics
- View the overall **Quality Score** ring (computed based on completeness, uniqueness, and outlier thresholds).
- Inspect the **Summary Metric Cards**: Total Records, Columns, Missing Cells, Duplicate Rows.
- Analyze the interactive charts:
  - **Missing Values by Column**: Bar chart illustrating the null concentration across features.
  - **Cell Completeness Donut**: Ratio of complete vs. missing cells.
- Review the **Issue Breakdown List**: Highlighting exact columns with issues and IQR outlier counts.

### Step 3: Examining ML Feature Readiness
- Scroll down to the **Machine Learning Feature Readiness** section.
- Inspect continuous feature distributions, cardinality metrics, and categorical one-hot encoding readiness indicators.

### Step 4: Configuring and Executing Remediation
- In the **Data Cleaning Engine** panel:
  - Select an imputation strategy: `mean`, `median`, `mode`, or `constant` (with custom fill value).
  - Toggle **"Remove Duplicate Rows"**.
  - Toggle **"Drop Incomplete Records"** (optional).
- Click **"Apply Cleaning Strategy"**.

### Step 5: Reviewing Changes & Downloading Cleaned Data
- Compare **Before vs. After** statistics (rows removed, duplicates purged, missing cells filled).
- Preview the cleaned dataset in the tabular inspector.
- Click **"Download Cleaned CSV"** to save the fully cleaned, RFC-4180 escaped dataset directly to your local machine.

