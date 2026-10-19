
from typing import Any

import pandas as pd

from app.engines.profiling.statistics import calculate_statistics


MISSING_STRATEGIES = {"none", "mean", "median", "mode", "constant"}


def clean_dataset(
    data: pd.DataFrame,
    missing_strategy: str = "none",
    fill_value: Any = None,
    drop_duplicates: bool = False,
    drop_missing_rows: bool = False,
) -> dict[str, Any]:
    """
    Clean a DataFrame and return a cleaned copy with a change report.

    Missing-value strategies:
        none     : Do not fill missing values.
        mean     : Fill missing numeric values with column means.
        median   : Fill missing numeric values with column medians.
        mode     : Fill missing values with each column's most frequent value.
        constant : Fill missing values with fill_value.

    Rows can optionally be removed if they contain missing values.
    Duplicate rows can optionally be removed.

    The input DataFrame is never modified.
    """

    # 1. Validate inputs
    if not isinstance(data, pd.DataFrame):
        raise TypeError("Input must be a pandas DataFrame.")

    if missing_strategy not in MISSING_STRATEGIES:
        raise ValueError(
            f"Unsupported missing_strategy: {missing_strategy}. "
            f"Choose from {sorted(MISSING_STRATEGIES)}."
        )

    if not isinstance(drop_duplicates, bool):
        raise TypeError("drop_duplicates must be a boolean.")

    if not isinstance(drop_missing_rows, bool):
        raise TypeError("drop_missing_rows must be a boolean.")

    if missing_strategy == "constant" and fill_value is None:
        raise ValueError(
            "fill_value must be provided when using the constant strategy."
        )

    # 2. Work on a separate copy
    cleaned = data.copy(deep=True)

    rows_before = len(cleaned)
    missing_before = int(cleaned.isna().sum().sum())
    duplicates_before = int(cleaned.duplicated().sum())

    changes: list[dict[str, Any]] = []

    # 3. Handle missing values
    if missing_strategy != "none":
        for column in cleaned.columns:
            missing_count = int(cleaned[column].isna().sum())

            if missing_count == 0:
                continue

            series = cleaned[column]

            if missing_strategy == "mean":
                if not pd.api.types.is_numeric_dtype(series):
                    raise ValueError(
                        f"Mean strategy requires numeric columns. "
                        f"Column '{column}' is not numeric."
                    )

                replacement = series.mean()

            elif missing_strategy == "median":
                if not pd.api.types.is_numeric_dtype(series):
                    raise ValueError(
                        f"Median strategy requires numeric columns. "
                        f"Column '{column}' is not numeric."
                    )

                replacement = series.median()

            elif missing_strategy == "mode":
                modes = series.mode(dropna=True)

                if modes.empty:
                    raise ValueError(
                        f"Cannot calculate mode for column '{column}' "
                        "because it contains no non-missing values."
                    )

                # If multiple values tie, use the first sorted mode.
                replacement = modes.iloc[0]

            else:  # constant
                replacement = fill_value

            # An entirely missing numeric column has no mean/median.
            if pd.isna(replacement):
                raise ValueError(
                    f"Cannot calculate a replacement for column "
                    f"'{column}' using strategy '{missing_strategy}'."
                )

            cleaned[column] = cleaned[column].fillna(replacement)

            changes.append({
                "operation": "fill_missing_values",
                "column": str(column),
                "strategy": missing_strategy,
                "count": missing_count,
                "replacement": (
                    replacement.item()
                    if hasattr(replacement, "item")
                    else replacement
                ),
            })

    # 4. Optionally remove rows that still contain missing values
    if drop_missing_rows:
        missing_rows = int(cleaned.isna().any(axis=1).sum())

        if missing_rows > 0:
            cleaned = cleaned.dropna().copy()

            changes.append({
                "operation": "drop_missing_rows",
                "count": missing_rows,
            })

    # 5. Optionally remove duplicate rows
    if drop_duplicates:
        duplicate_count = int(cleaned.duplicated().sum())

        if duplicate_count > 0:
            cleaned = cleaned.drop_duplicates().copy()

            changes.append({
                "operation": "drop_duplicate_rows",
                "count": duplicate_count,
            })

    # 6. Build before-and-after report
    missing_after = int(cleaned.isna().sum().sum())
    duplicates_after = int(cleaned.duplicated().sum())

    report = {
        "rows_before": rows_before,
        "rows_after": len(cleaned),
        "rows_removed": rows_before - len(cleaned),
        "missing_cells_before": missing_before,
        "missing_cells_after": missing_after,
        "duplicate_rows_before": duplicates_before,
        "duplicate_rows_after": duplicates_after,
        "changes": changes,
        "before_statistics": calculate_statistics(data),
        "after_statistics": calculate_statistics(cleaned),
    }

    return {
        "cleaned_data": cleaned,
        "report": report,
    }
