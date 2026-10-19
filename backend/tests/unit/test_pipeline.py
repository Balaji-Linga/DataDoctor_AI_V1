
import pandas as pd
import pytest

from app.pipeline import analyze_dataset


def test_pipeline_analyzes_csv(tmp_path):
    csv_file = tmp_path / "sample.csv"
    csv_file.write_text(
        "Name,Age\nRavi,21\nSita,22\n",
        encoding="utf-8",
    )

    result = analyze_dataset(csv_file)

    assert result["status"] == "success"
    assert result["dataset"]["row_count"] == 2
    assert result["dataset"]["column_count"] == 2
    assert result["statistics"]["row_count"] == 2
    assert result["quality_report"]["total_issues"] == 0
    assert result["cleaning"] is None


def test_pipeline_detects_quality_issues(tmp_path):
    csv_file = tmp_path / "issues.csv"
    csv_file.write_text(
        "Name,Age\nRavi,21\nSita,\nRavi,21\n",
        encoding="utf-8",
    )

    result = analyze_dataset(csv_file)

    assert result["quality_report"]["total_issues"] > 0
    assert result["quality_report"]["issue_counts"]["missing_values"] == 1
    assert result["quality_report"]["issue_counts"]["duplicate_rows"] == 1


def test_pipeline_can_clean_dataset(tmp_path):
    csv_file = tmp_path / "dirty.csv"
    csv_file.write_text(
        "Name,Age\nRavi,20\nSita,\nRavi,20\n",
        encoding="utf-8",
    )

    result = analyze_dataset(
        csv_file,
        clean=True,
        missing_strategy="constant",
        fill_value="Unknown",
        drop_duplicates=True,
    )

    assert result["cleaning"] is not None
    assert result["cleaning"]["cleaned_dataset"]["row_count"] == 2
    assert result["cleaning"]["report"]["rows_removed"] == 1


def test_pipeline_rejects_missing_file(tmp_path):
    missing_file = tmp_path / "not_found.csv"

    with pytest.raises(FileNotFoundError):
        analyze_dataset(missing_file)


def test_pipeline_rejects_negative_preview_rows(tmp_path):
    csv_file = tmp_path / "sample.csv"
    csv_file.write_text("Age\n21\n", encoding="utf-8")

    with pytest.raises(ValueError, match="preview_rows"):
        analyze_dataset(csv_file, preview_rows=-1)
