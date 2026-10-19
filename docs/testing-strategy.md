# DataDoctor AI — Testing Strategy

## Test Suite Structure

The DataDoctor AI backend uses **pytest** with strict assertions and zero tolerance for skipped tests or unhandled warnings.

```
backend/tests/
├── integration/
│   └── test_api.py            # 22 End-to-end FastAPI endpoint tests
└── unit/
    ├── test_cleaner.py        # 11 Unit tests for imputation & deduplication
    ├── test_csv_reader.py     # 4 Unit tests for CSV parser & boundaries
    ├── test_pipeline.py       # 5 Unit tests for pipeline coordination
    ├── test_profiling.py      # 4 Unit tests for summary statistics
    └── test_quality_detector.py # 9 Unit tests for IQR outliers, nulls & rules
```

**Total Tests**: 55 passing tests (0 failures, 0 skipped, 0 warnings).

## Integration Test Coverage Matrix

| Test Function | Verification Scope | Status |
| :--- | :--- | :--- |
| `test_health_endpoint` | Verifies `GET /health` returns `{"status": "healthy"}` | Pass |
| `test_analyze_valid_csv` | Checks row count, preview schema, summary statistics | Pass |
| `test_analyze_missing_file` | Asserts `HTTP 400` when no file is uploaded | Pass |
| `test_analyze_empty_filename` | Asserts `HTTP 400` for blank filenames | Pass |
| `test_analyze_unsupported_extension` | Asserts `HTTP 400` for non-`.csv` files | Pass |
| `test_analyze_empty_csv_file` | Asserts `HTTP 400` for zero-byte uploads | Pass |
| `test_analyze_invalid_csv_content` | Asserts `HTTP 400` for malformed/binary files | Pass |
| `test_analyze_oversized_upload` | Asserts `HTTP 400` for payloads exceeding 10 MB | Pass |
| `test_analyze_detects_quality_issues` | Confirms detection of nulls, duplicates, outliers | Pass |
| `test_analyze_custom_preview_rows` | Tests `preview_rows` query parameter | Pass |
| `test_clean_missing_values_mean_and_duplicates` | Tests numeric mean imputation with deduplication | Pass |
| `test_clean_missing_values_median` | Tests median imputation on numeric columns | Pass |
| `test_clean_missing_values_mode` | Tests mode imputation across mixed datatypes | Pass |
| `test_clean_missing_values_constant_string` | Tests constant text fill on string columns | Pass |
| `test_clean_missing_values_constant_numeric_preserves_type` | Validates numeric type preservation on constant fills | Pass |
| `test_clean_drop_missing_rows` | Tests dropping incomplete records | Pass |
| `test_clean_invalid_strategy` | Asserts `HTTP 400` on unrecognized cleaning strategy | Pass |
| `test_clean_constant_strategy_requires_fill_value` | Asserts `HTTP 400` when constant strategy lacks value | Pass |
| `test_clean_mean_on_text_column_raises_error` | Asserts `HTTP 400` for mean/median on text nulls | Pass |
| `test_temporary_file_cleanup_on_success` | Verifies temp file is unlinked after clean execution | Pass |
| `test_temporary_file_cleanup_on_error` | Verifies temp file is unlinked when exceptions occur | Pass |
| `test_uploaded_source_file_never_modified` | Verifies source file byte-for-byte immutability | Pass |

## Running the Tests

To execute the full test suite with verbose output:

```bash
cd backend
python -m pytest -v
```

