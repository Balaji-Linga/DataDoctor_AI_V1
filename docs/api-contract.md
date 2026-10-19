# DataDoctor AI — API Contract Documentation

**Version**: `1.0.0`  
**Base URL**: `http://127.0.0.1:8000`  
**Interactive Docs**: `http://127.0.0.1:8000/docs` (OpenAPI / Swagger UI)

---

## 1. System Health

### `GET /health`
Returns the operational status of the DataDoctor AI backend service.

- **Request**: No parameters or body required.
- **Response** (`200 OK`):
  ```json
  {
    "status": "healthy"
  }
  ```

---

## 2. Dataset Analysis

### `POST /api/v1/analyze`
Profiles an uploaded CSV file, computing comprehensive row/column counts, missing values, duplicates, summary statistics, and detected data quality issues.

- **Content-Type**: `multipart/form-data`
- **Request Parameters**:
  | Parameter | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `file` | `UploadFile` | Yes | Valid `.csv` file (maximum 10 MB). |
  | `preview_rows` | `integer` (query) | No | Number of rows to return in the preview (default: 5, range: 0–100). |

- **Response** (`200 OK`):
  ```json
  {
    "dataset": {
      "file_name": "sample_churn.csv",
      "row_count": 1000,
      "column_count": 8,
      "columns": ["customer_id", "age", "tenure", "balance", "churn"],
      "preview": [
        {"customer_id": "C101", "age": 42, "tenure": 3, "balance": 15000.5, "churn": 0}
      ]
    },
    "statistics": {
      "summary": {
        "age": {"count": 980, "mean": 38.5, "std": 12.1, "min": 18, "max": 75},
        "balance": {"count": 950, "mean": 12450.0, "std": 8900.0, "min": 0, "max": 85000}
      },
      "missing_values": {
        "age": 20,
        "balance": 50,
        "customer_id": 0
      },
      "duplicate_rows": 5
    },
    "quality_report": {
      "total_issues": 3,
      "issues": [
        {
          "type": "missing_values",
          "column": "balance",
          "count": 50,
          "description": "Column balance has 50 missing values (5.0%)"
        },
        {
          "type": "duplicate_rows",
          "count": 5,
          "description": "Dataset contains 5 duplicate rows"
        },
        {
          "type": "outliers",
          "column": "balance",
          "count": 12,
          "description": "Column balance has 12 potential outliers detected via IQR"
        }
      ]
    }
  }
  ```

- **Error Codes**:
  - `400 Bad Request`: Missing file, unsupported file extension, empty CSV, or upload exceeding 10 MB limit.
  - `422 Unprocessable Content`: Invalid query parameter format.

---

## 3. Dataset Cleaning

### `POST /api/v1/clean`
Applies rule-based remediation strategies to impute missing values, drop duplicate rows, and eliminate incomplete records.

- **Content-Type**: `multipart/form-data`
- **Request Parameters**:
  | Field | Type | Required | Default | Description |
  | :--- | :--- | :--- | :--- | :--- |
  | `file` | `UploadFile` | Yes | — | CSV file to clean (max 10 MB). |
  | `missing_strategy` | `string` (Form) | No | `"none"` | Imputation strategy: `none`, `mean`, `median`, `mode`, or `constant`. |
  | `fill_value` | `string` (Form) | Conditional | `None` | Required when `missing_strategy` is `"constant"`. Numeric values are auto-cast to preserve numeric column types. |
  | `drop_duplicates` | `boolean` (Form) | No | `false` | If `true`, removes duplicate rows from the dataset. |
  | `drop_missing_rows`| `boolean` (Form) | No | `false` | If `true`, drops any rows containing remaining missing values. |

- **Response** (`200 OK`):
  ```json
  {
    "cleaned_dataset": {
      "file_name": "sample_churn.csv",
      "row_count": 975,
      "column_count": 8,
      "columns": ["customer_id", "age", "tenure", "balance", "churn"],
      "records": [
        {"customer_id": "C101", "age": 42.0, "tenure": 3, "balance": 15000.5, "churn": 0}
      ]
    },
    "changes": {
      "rows_before": 1000,
      "rows_after": 975,
      "rows_removed": 25,
      "duplicates_removed": 5,
      "missing_values_filled": 70,
      "missing_rows_dropped": 20
    },
    "statistics_before": {
      "summary": { ... },
      "missing_values": { "age": 20, "balance": 50 },
      "duplicate_rows": 5
    },
    "statistics_after": {
      "summary": { ... },
      "missing_values": { "age": 0, "balance": 0 },
      "duplicate_rows": 0
    }
  }
  ```

- **Error Codes**:
  - `400 Bad Request`: Unsupported strategy, missing `fill_value` for constant strategy, attempting `mean`/`median` on non-numeric columns with nulls, or oversized file.

