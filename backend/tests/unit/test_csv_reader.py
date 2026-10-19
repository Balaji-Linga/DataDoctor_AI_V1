
import pytest

from app.engines.data_reader.csv_reader import read_csv_file


def test_reads_csv_with_expected_shape(tmp_path):
    csv_file = tmp_path / "sample.csv"
    csv_file.write_text(
        "Name,Age\nRavi,21\nSita,\n",
        encoding="utf-8",
    )

    dataframe = read_csv_file(csv_file)

    assert dataframe.shape == (2, 2)
    assert list(dataframe.columns) == ["Name", "Age"]
    assert dataframe["Age"].isna().sum() == 1


def test_missing_file_raises_error(tmp_path):
    with pytest.raises(FileNotFoundError):
        read_csv_file(tmp_path / "missing.csv")


def test_rejects_unsupported_file_type(tmp_path):
    file_path = tmp_path / "sample.txt"
    file_path.write_text("hello", encoding="utf-8")

    with pytest.raises(ValueError, match="Unsupported file type"):
        read_csv_file(file_path)


def test_rejects_empty_file(tmp_path):
    file_path = tmp_path / "empty.csv"
    file_path.write_text("", encoding="utf-8")

    with pytest.raises(ValueError, match="empty"):
        read_csv_file(file_path)
