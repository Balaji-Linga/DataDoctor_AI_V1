
from typing import Any

import pandas as pd


def detect_quality_issues(
    data: pd.DataFrame,
    outlier_threshold: float = 1.5,
    high_cardinality_threshold: float = 0.95,
) -> dict[str, Any]:
    """
    Detect common data quality issues without modifying the input.

    Checks:
    - Missing values
    - Duplicate rows
    - Numerical outliers using IQR
    - Constant columns
    - High-cardinality columns

    High-cardinality checks are skipped for datasets with fewer
    than 20 rows to reduce noise on small datasets.
    """

    # Validate input
    if not isinstance(data, pd.DataFrame):
        raise TypeError("Input must be a pandas DataFrame.")

    if outlier_threshold <= 0:
        raise ValueError("outlier_threshold must be greater than zero.")

    if not 0 < high_cardinality_threshold <= 1:
        raise ValueError(
            "high_cardinality_threshold must be greater than 0 "
            "and at most 1."
        )

    row_count = len(data)
    column_count = len(data.columns)
    issues: list[dict[str, Any]] = []

    # 1. Missing-value detection
    for column in data.columns:
        missing_count = int(data[column].isna().sum())

        if missing_count == 0:
            continue

        missing_percentage = (
            round(missing_count / row_count * 100, 2)
            if row_count > 0
            else 0.0
        )

        issues.append({
            "type": "missing_values",
            "column": str(column),
            "count": missing_count,
            "percentage": missing_percentage,
            "severity": (
                "high" if missing_percentage >= 30 else "medium"
            ),
            "message": (
                f"Column '{column}' contains {missing_count} "
                "missing value(s)."
            ),
            "recommendation": (
                "Review missing values and consider suitable "
                "imputation or row removal."
            ),
        })

    # 2. Duplicate-row detection
    duplicate_count = int(data.duplicated().sum())

    if duplicate_count > 0:
        duplicate_percentage = round(
            duplicate_count / row_count * 100, 2
        )

        issues.append({
            "type": "duplicate_rows",
            "column": None,
            "count": duplicate_count,
            "percentage": duplicate_percentage,
            "severity": (
                "high" if duplicate_percentage >= 10 else "medium"
            ),
            "message": (
                f"Dataset contains {duplicate_count} duplicate row(s)."
            ),
            "recommendation": (
                "Review duplicate records before deciding whether "
                "they should be removed."
            ),
        })

    # 3. Numerical outlier detection using IQR
    numeric_columns = data.select_dtypes(
        include="number"
    ).columns

    for column in numeric_columns:
        values = data[column].dropna()

        # Require enough observations and variation.
        if len(values) < 4 or values.nunique() < 2:
            continue

        q1 = float(values.quantile(0.25))
        q3 = float(values.quantile(0.75))
        iqr = q3 - q1

        # Avoid misleading bounds when IQR is zero.
        if iqr == 0:
            continue

        lower_bound = q1 - outlier_threshold * iqr
        upper_bound = q3 + outlier_threshold * iqr

        outlier_mask = (
            (values < lower_bound) | (values > upper_bound)
        )
        outlier_count = int(outlier_mask.sum())

        if outlier_count == 0:
            continue

        outlier_percentage = round(
            outlier_count / len(values) * 100, 2
        )

        issues.append({
            "type": "outliers",
            "column": str(column),
            "count": outlier_count,
            "percentage": outlier_percentage,
            "severity": "medium",
            "message": (
                f"Column '{column}' contains {outlier_count} "
                "potential outlier(s) using the IQR method."
            ),
            "details": {
                "lower_bound": lower_bound,
                "upper_bound": upper_bound,
                "method": "IQR",
                "multiplier": outlier_threshold,
            },
            "recommendation": (
                "Inspect flagged values in context. An outlier may "
                "be valid data and should not be removed blindly."
            ),
        })

    # 4. Constant-column detection
    for column in data.columns:
        unique_count = int(data[column].nunique(dropna=False))

        if row_count > 0 and unique_count == 1:
            issues.append({
                "type": "constant_column",
                "column": str(column),
                "count": row_count,
                "severity": "low",
                "message": (
                    f"Column '{column}' has only one distinct value."
                ),
                "recommendation": (
                    "Check whether this column provides useful "
                    "information for analysis or model training."
                ),
            })

    # 5. High-cardinality detection
    # Small datasets produce unreliable cardinality warnings.
    minimum_rows = 20

    if row_count >= minimum_rows:
        for column in data.columns:
            unique_count = int(data[column].nunique(dropna=True))

            if unique_count <= 1:
                continue

            unique_ratio = unique_count / row_count

            if unique_ratio >= high_cardinality_threshold:
                issues.append({
                    "type": "high_cardinality",
                    "column": str(column),
                    "count": unique_count,
                    "unique_ratio": round(unique_ratio, 4),
                    "severity": "low",
                    "message": (
                        f"Column '{column}' has a high proportion "
                        "of unique values."
                    ),
                    "recommendation": (
                        "Check whether this column is an identifier "
                        "or a meaningful feature."
                    ),
                })

    # 6. Summarize detected issues
    issue_counts: dict[str, int] = {}

    for issue in issues:
        issue_type = issue["type"]
        issue_counts[issue_type] = (
            issue_counts.get(issue_type, 0) + 1
        )

    return {
        "row_count": row_count,
        "column_count": column_count,
        "total_issues": len(issues),
        "issue_counts": issue_counts,
        "issues": issues,
    }
