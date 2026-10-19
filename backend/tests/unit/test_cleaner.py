
import pandas as pd
import pytest

from app.engines.cleaning.cleaner import clean_dataset


def test_fills_missing_values_with_mean():
    data = pd.DataFrame({"Age": [20.0, None, 30.0]})

    result = clean_dataset(data, missing_strategy="mean")

    assert result["cleaned_data"]["Age"].tolist() == [20.0, 25.0, 30.0]
    assert result["report"]["missing_cells_after"] == 0


def test_fills_missing_values_with_median():
    data = pd.DataFrame({"Score": [10.0, None, 30.0, 100.0]})

    result = clean_dataset(data, missing_strategy="median")

    assert result["cleaned_data"]["Score"].tolist() == [
        10.0, 30.0, 30.0, 100.0
    ]


def test_fills_missing_values_with_mode():
    data = pd.DataFrame({
        "City": ["Vijayawada", None, "Vijayawada", "Guntur"]
    })

    result = clean_dataset(data, missing_strategy="mode")

    assert result["cleaned_data"]["City"].isna().sum() == 0
    assert result["cleaned_data"]["City"].iloc[1] == "Vijayawada"


def test_fills_missing_values_with_constant():
    data = pd.DataFrame({"City": ["Guntur", None, "Vijayawada"]})

    result = clean_dataset(
        data,
        missing_strategy="constant",
        fill_value="Unknown",
    )

    assert result["cleaned_data"]["City"].iloc[1] == "Unknown"


def test_drops_duplicate_rows():
    data = pd.DataFrame({
        "Name": ["Ravi", "Sita", "Ravi"],
        "Age": [21, 22, 21],
    })

    result = clean_dataset(data, drop_duplicates=True)

    assert len(result["cleaned_data"]) == 2
    assert result["report"]["rows_removed"] == 1


def test_drops_rows_with_missing_values():
    data = pd.DataFrame({
        "Name": ["Ravi", None, "Sita"],
        "Age": [21, 22, 23],
    })

    result = clean_dataset(data, drop_missing_rows=True)

    assert len(result["cleaned_data"]) == 2
    assert result["cleaned_data"].isna().sum().sum() == 0


def test_does_not_modify_original_dataframe():
    data = pd.DataFrame({
        "Age": [20.0, None, 30.0],
        "Name": ["Ravi", "Sita", "Ravi"],
    })
    original = data.copy(deep=True)

    clean_dataset(
        data,
        missing_strategy="mean",
        drop_duplicates=True,
    )

    pd.testing.assert_frame_equal(data, original)


def test_rejects_invalid_strategy():
    data = pd.DataFrame({"Age": [20, None]})

    with pytest.raises(ValueError, match="Unsupported"):
        clean_dataset(data, missing_strategy="invalid")


def test_constant_strategy_requires_fill_value():
    data = pd.DataFrame({"Age": [20, None]})

    with pytest.raises(ValueError, match="fill_value"):
        clean_dataset(data, missing_strategy="constant")


def test_mean_rejects_text_columns_with_missing_values():
    data = pd.DataFrame({"City": ["Guntur", None]})

    with pytest.raises(ValueError, match="not numeric"):
        clean_dataset(data, missing_strategy="mean")


def test_empty_dataframe():
    result = clean_dataset(pd.DataFrame())

    assert result["cleaned_data"].empty
    assert result["report"]["rows_before"] == 0
    assert result["report"]["rows_after"] == 0
