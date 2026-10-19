
import pandas as pd
import pytest

from app.engines.quality_checks.detector import detect_quality_issues


def test_detects_missing_values_and_duplicates():
    data = pd.DataFrame({
        "Name": ["Ravi", "Sita", "Ravi"],
        "Age": [21, None, 21],
    })

    result = detect_quality_issues(data)

    assert result["issue_counts"]["missing_values"] == 1
    assert result["issue_counts"]["duplicate_rows"] == 1


def test_detects_numerical_outliers():
    data = pd.DataFrame({
        "Score": [10, 11, 12, 13, 14, 100],
    })

    result = detect_quality_issues(data)

    outliers = [
        issue for issue in result["issues"]
        if issue["type"] == "outliers"
    ]

    assert len(outliers) == 1
    assert outliers[0]["column"] == "Score"
    assert outliers[0]["count"] == 1


def test_detects_constant_columns():
    data = pd.DataFrame({
        "Name": ["Ravi", "Sita", "Kiran"],
        "Country": ["India", "India", "India"],
    })

    result = detect_quality_issues(data)

    constants = [
        issue for issue in result["issues"]
        if issue["type"] == "constant_column"
    ]

    assert len(constants) == 1
    assert constants[0]["column"] == "Country"


def test_detects_high_cardinality_in_large_dataset():
    data = pd.DataFrame({
        "RecordID": [f"ID{i}" for i in range(30)],
        "Category": ["Food", "Drink"] * 15,
    })

    result = detect_quality_issues(data)

    high_cardinality = [
        issue for issue in result["issues"]
        if issue["type"] == "high_cardinality"
    ]

    assert any(
        issue["column"] == "RecordID"
        for issue in high_cardinality
    )


def test_clean_dataset_has_no_detected_issues():
    data = pd.DataFrame({
        "Age": [20, 21, 22, 23],
        "Score": [70, 75, 80, 85],
    })

    result = detect_quality_issues(data)

    assert result["total_issues"] == 0
    assert result["issues"] == []


def test_empty_dataframe():
    result = detect_quality_issues(pd.DataFrame())

    assert result["row_count"] == 0
    assert result["column_count"] == 0
    assert result["total_issues"] == 0


def test_rejects_non_dataframe_input():
    with pytest.raises(TypeError, match="pandas DataFrame"):
        detect_quality_issues([1, 2, 3])


def test_rejects_invalid_thresholds():
    data = pd.DataFrame({"Score": [10, 20, 30, 40]})

    with pytest.raises(ValueError):
        detect_quality_issues(data, outlier_threshold=0)

    with pytest.raises(ValueError):
        detect_quality_issues(data, high_cardinality_threshold=0)


def test_does_not_modify_original_dataframe():
    data = pd.DataFrame({
        "Score": [10, 11, 12, 13, 14, 100],
        "Age": [20, None, 22, 23, 24, 25],
    })
    original = data.copy(deep=True)

    detect_quality_issues(data)

    pd.testing.assert_frame_equal(data, original)
