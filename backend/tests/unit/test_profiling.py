
import pandas as pd
import pytest

from app.engines.profiling.statistics import calculate_statistics


def test_calculates_basic_dataset_statistics():
    data = pd.DataFrame({
        "Name": ["Ravi", "Sita", "Ravi"],
        "Age": [21, None, 21],
        "Score": [80, 90, 80],
    })

    result = calculate_statistics(data)

    assert result["row_count"] == 3
    assert result["column_count"] == 3
    assert result["missing_cells"] == 1
    assert result["missing_by_column"]["Age"] == 1
    assert result["duplicate_rows"] == 1
    assert "Age" in result["numeric_columns"]
    assert result["numerical_summary"]["Age"]["mean"] == 21.0


def test_clean_dataset_has_no_missing_or_duplicates():
    data = pd.DataFrame({
        "Name": ["Ravi", "Sita"],
        "Age": [21, 22],
    })

    result = calculate_statistics(data)

    assert result["missing_cells"] == 0
    assert result["duplicate_rows"] == 0


def test_empty_dataframe():
    data = pd.DataFrame()

    result = calculate_statistics(data)

    assert result["row_count"] == 0
    assert result["column_count"] == 0
    assert result["missing_cells"] == 0
    assert result["duplicate_rows"] == 0


def test_rejects_non_dataframe_input():
    with pytest.raises(TypeError, match="pandas DataFrame"):
        calculate_statistics([1, 2, 3])
