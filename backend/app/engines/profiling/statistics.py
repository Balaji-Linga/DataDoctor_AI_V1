
from pathlib import Path
from typing import Any

import pandas as pd


def calculate_statistics(data: pd.DataFrame) -> dict[str, Any]:
    """
    Calculate basic data-quality statistics for a pandas DataFrame.

    This function analyzes the dataset without modifying it.
    """

    if not isinstance(data, pd.DataFrame):
        raise TypeError("Input must be a pandas DataFrame.")

    row_count = len(data)
    column_count = len(data.columns)

    # Count all missing cells.
    missing_by_column = data.isna().sum()
    missing_cells = int(missing_by_column.sum())

    # Count rows that are exact duplicates of earlier rows.
    duplicate_rows = int(data.duplicated().sum())

    # Identify numeric and non-numeric columns.
    numeric_columns = data.select_dtypes(include="number").columns.tolist()
    non_numeric_columns = [
        column for column in data.columns
        if column not in numeric_columns
    ]

    # Calculate numerical statistics where applicable.
    numerical_summary = {}

    for column in numeric_columns:
        series = data[column]

        numerical_summary[str(column)] = {
            "count": int(series.count()),
            "mean": _safe_float(series.mean()),
            "median": _safe_float(series.median()),
            "minimum": _safe_float(series.min()),
            "maximum": _safe_float(series.max()),
            "standard_deviation": _safe_float(series.std()),
        }

    # Count missing values separately for every column.
    missing_by_column_result = {
        str(column): int(count)
        for column, count in missing_by_column.items()
    }

    # Keep column names and data types readable in the report.
    column_details = {
        str(column): {
            "data_type": str(data[column].dtype),
            "non_missing_values": int(data[column].count()),
            "missing_values": int(data[column].isna().sum()),
            "unique_values": int(data[column].nunique()),
        }
        for column in data.columns
    }

    return {
        "row_count": row_count,
        "column_count": column_count,
        "missing_cells": missing_cells,
        "missing_by_column": missing_by_column_result,
        "duplicate_rows": duplicate_rows,
        "numeric_columns": [str(c) for c in numeric_columns],
        "non_numeric_columns": [str(c) for c in non_numeric_columns],
        "column_details": column_details,
        "numerical_summary": numerical_summary,
    }


def _safe_float(value: Any) -> float | None:
    """Convert numeric results to JSON-friendly floats."""
    if pd.isna(value):
        return None

    return float(value)
