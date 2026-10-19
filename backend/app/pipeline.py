
import json
from pathlib import Path
from typing import Any

import pandas as pd

from app.engines.data_reader.csv_reader import read_csv_file
from app.engines.profiling.statistics import calculate_statistics
from app.engines.quality_checks.detector import detect_quality_issues
from app.engines.cleaning.cleaner import clean_dataset


def analyze_dataset(
    file_path: str | Path,
    *,
    clean: bool = False,
    missing_strategy: str = "none",
    fill_value: Any = None,
    drop_duplicates: bool = False,
    drop_missing_rows: bool = False,
    preview_rows: int = 10,
) -> dict[str, Any]:
    """
    Run the DataDoctor AI analysis pipeline on a CSV dataset.

    Steps:
    1. Read and validate the CSV file.
    2. Calculate dataset statistics.
    3. Detect data quality issues.
    4. Optionally clean the dataset.
    5. Return a structured, JSON-friendly result.

    The source file is never modified.

    Note:
        The complete cleaned dataset is returned as records when
        clean=True. For large datasets, the API layer should use
        streaming or a downloadable output file instead.
    """

    if not isinstance(preview_rows, int) or isinstance(preview_rows, bool):
        raise TypeError("preview_rows must be an integer.")

    if preview_rows < 0:
        raise ValueError("preview_rows cannot be negative.")

    if not isinstance(clean, bool):
        raise TypeError("clean must be a boolean.")

    if not isinstance(drop_duplicates, bool):
        raise TypeError("drop_duplicates must be a boolean.")

    if not isinstance(drop_missing_rows, bool):
        raise TypeError("drop_missing_rows must be a boolean.")

    # Step 1: Read and validate the dataset.
    data = read_csv_file(file_path)

    # Step 2: Calculate initial statistics.
    statistics = calculate_statistics(data)

    # Step 3: Detect quality issues in the original data.
    quality_report = detect_quality_issues(data)

    result: dict[str, Any] = {
        "status": "success",
        "dataset": {
            "file_name": Path(file_path).name,
            "row_count": len(data),
            "column_count": len(data.columns),
            "columns": [str(column) for column in data.columns],
            "preview": _dataframe_to_records(data.head(preview_rows)),
        },
        "statistics": statistics,
        "quality_report": quality_report,
        "cleaning": None,
    }

    # Step 4: Clean only when explicitly requested.
    if clean:
        cleaning_result = clean_dataset(
            data,
            missing_strategy=missing_strategy,
            fill_value=fill_value,
            drop_duplicates=drop_duplicates,
            drop_missing_rows=drop_missing_rows,
        )

        cleaned_data = cleaning_result["cleaned_data"]

        result["cleaning"] = {
            "report": cleaning_result["report"],
            "cleaned_dataset": {
                "row_count": len(cleaned_data),
                "column_count": len(cleaned_data.columns),
                "columns": [str(column) for column in cleaned_data.columns],
                "preview": _dataframe_to_records(
                    cleaned_data.head(preview_rows)
                ),
                "records": _dataframe_to_records(cleaned_data),
            },
        }

    return result


def _dataframe_to_records(data: pd.DataFrame) -> list[dict[str, Any]]:
    """
    Convert a DataFrame to JSON-friendly records.
    Missing values become JSON nulls.
    """
    records_json = data.to_json(
        orient="records",
        date_format="iso",
    )

    return json.loads(records_json)
