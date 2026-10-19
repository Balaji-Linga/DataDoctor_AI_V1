import io
from pathlib import Path
from tempfile import gettempdir
from unittest.mock import patch
import tempfile

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


# --------------------------------------------------
# Health check tests
# --------------------------------------------------

def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "DataDoctor AI API"
    assert data["version"] == "1.0.0"


# --------------------------------------------------
# Analyze endpoint tests
# --------------------------------------------------

def test_analyze_valid_csv(client):
    csv_content = b"Name,Age,Salary\nAlice,30,70000\nBob,25,50000\nCharlie,35,90000\n"
    files = {"file": ("employees.csv", io.BytesIO(csv_content), "text/csv")}

    response = client.post("/api/v1/analyze", files=files)
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "success"

    # Dataset structure
    dataset = data["dataset"]
    assert dataset["file_name"] == "employees.csv"
    assert dataset["row_count"] == 3
    assert dataset["column_count"] == 3
    assert dataset["columns"] == ["Name", "Age", "Salary"]
    assert len(dataset["preview"]) == 3

    # Statistics structure
    stats = data["statistics"]
    assert stats["row_count"] == 3
    assert stats["column_count"] == 3
    assert stats["missing_cells"] == 0
    assert stats["duplicate_rows"] == 0
    assert "Age" in stats["numeric_columns"]
    assert "Salary" in stats["numeric_columns"]
    assert "Name" in stats["non_numeric_columns"]
    assert "Age" in stats["numerical_summary"]
    assert stats["numerical_summary"]["Age"]["mean"] == 30.0

    # Quality report structure
    quality = data["quality_report"]
    assert quality["row_count"] == 3
    assert quality["column_count"] == 3
    assert quality["total_issues"] == 0

    # Cleaning should be None for analyze
    assert data["cleaning"] is None


def test_analyze_missing_file(client):
    response = client.post("/api/v1/analyze")
    assert response.status_code == 400
    assert response.json()["detail"] == "A CSV file is required."


def test_analyze_empty_filename(client):
    files = {"file": ("", io.BytesIO(b"Name,Age\nRavi,25\n"), "text/csv")}
    response = client.post("/api/v1/analyze", files=files)
    assert response.status_code == 400
    assert response.json()["detail"] == "A CSV file is required."


def test_analyze_unsupported_extension(client):
    files = {"file": ("dataset.xlsx", io.BytesIO(b"fake excel"), "application/vnd.ms-excel")}
    response = client.post("/api/v1/analyze", files=files)
    assert response.status_code == 415
    assert response.json()["detail"] == "Unsupported file type. Upload a CSV file."


def test_analyze_empty_csv_file(client):
    files = {"file": ("empty.csv", io.BytesIO(b""), "text/csv")}
    response = client.post("/api/v1/analyze", files=files)
    assert response.status_code == 400
    assert response.json()["detail"] == "The uploaded file is empty."


def test_analyze_invalid_csv_content(client):
    # CSV with empty column names raises ValueError
    files = {"file": ("broken.csv", io.BytesIO(b" , \n1,2\n"), "text/csv")}
    response = client.post("/api/v1/analyze", files=files)
    assert response.status_code == 400
    assert "Unable to process CSV" in response.json()["detail"]


def test_analyze_oversized_upload(client):
    # 10 MB + 10 bytes exceeds MAX_UPLOAD_SIZE
    large_payload = b"col1\n" + b"1\n" * ((10 * 1024 * 1024) // 2)
    files = {"file": ("large.csv", io.BytesIO(large_payload), "text/csv")}

    response = client.post("/api/v1/analyze", files=files)
    assert response.status_code == 413
    assert response.json()["detail"] == "File exceeds the 10 MB upload limit."


def test_analyze_detects_quality_issues(client):
    # Dataset with missing values, duplicate rows, and outlier
    csv_content = (
        b"Name,Score\n"
        b"Alice,50\n"
        b"Bob,52\n"
        b"Charlie,54\n"
        b"David,51\n"
        b"Eva,53\n"
        b"Frank,500\n"  # outlier
        b"Alice,50\n"   # duplicate row
        b"Grace,\n"     # missing value
    )
    files = {"file": ("dirty.csv", io.BytesIO(csv_content), "text/csv")}

    response = client.post("/api/v1/analyze", files=files)
    assert response.status_code == 200

    report = response.json()["quality_report"]
    assert report["total_issues"] > 0
    issue_types = report["issue_counts"]
    assert "missing_values" in issue_types
    assert "duplicate_rows" in issue_types
    assert "outliers" in issue_types


def test_analyze_custom_preview_rows(client):
    csv_content = b"ID\n1\n2\n3\n4\n5\n"
    files = {"file": ("data.csv", io.BytesIO(csv_content), "text/csv")}
    data = {"preview_rows": 2}

    response = client.post("/api/v1/analyze", files=files, data=data)
    assert response.status_code == 200
    assert len(response.json()["dataset"]["preview"]) == 2


# --------------------------------------------------
# Clean endpoint tests
# --------------------------------------------------

def test_clean_missing_values_mean_and_duplicates(client):
    csv_content = (
        b"Name,Age\n"
        b"Ravi,20.0\n"
        b"Sita,\n"
        b"Ravi,20.0\n"
    )
    files = {"file": ("students.csv", io.BytesIO(csv_content), "text/csv")}
    form_data = {
        "missing_strategy": "mean",
        "drop_duplicates": "true",
    }

    response = client.post("/api/v1/clean", files=files, data=form_data)
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "success"
    assert data["dataset"]["file_name"] == "students.csv"

    cleaning = data["cleaning"]
    assert cleaning is not None
    assert cleaning["report"]["rows_removed"] == 1
    assert cleaning["report"]["duplicate_rows_after"] == 0
    assert cleaning["report"]["missing_cells_after"] == 0

    cleaned_dataset = cleaning["cleaned_dataset"]
    assert cleaned_dataset["row_count"] == 2
    # Verify mean imputation (20.0)
    ages = [record["Age"] for record in cleaned_dataset["records"]]
    assert all(age == 20.0 for age in ages)


def test_clean_missing_values_median(client):
    csv_content = b"ID,Score\n1,10.0\n2,\n3,30.0\n4,100.0\n"
    files = {"file": ("scores.csv", io.BytesIO(csv_content), "text/csv")}
    form_data = {"missing_strategy": "median"}

    response = client.post("/api/v1/clean", files=files, data=form_data)
    assert response.status_code == 200

    scores = [
        record["Score"]
        for record in response.json()["cleaning"]["cleaned_dataset"]["records"]
    ]
    assert 30.0 in scores
    assert response.json()["cleaning"]["report"]["missing_cells_after"] == 0


def test_clean_missing_values_mode(client):
    csv_content = b"ID,City\n1,Vijayawada\n2,\n3,Vijayawada\n4,Guntur\n"
    files = {"file": ("cities.csv", io.BytesIO(csv_content), "text/csv")}
    form_data = {"missing_strategy": "mode"}

    response = client.post("/api/v1/clean", files=files, data=form_data)
    assert response.status_code == 200

    cities = [
        record["City"]
        for record in response.json()["cleaning"]["cleaned_dataset"]["records"]
    ]
    assert cities[1] == "Vijayawada"
    assert response.json()["cleaning"]["report"]["missing_cells_after"] == 0


def test_clean_missing_values_constant_string(client):
    csv_content = b"ID,City\n1,Guntur\n2,\n3,Vijayawada\n"
    files = {"file": ("cities.csv", io.BytesIO(csv_content), "text/csv")}
    form_data = {
        "missing_strategy": "constant",
        "fill_value": "Unknown",
    }

    response = client.post("/api/v1/clean", files=files, data=form_data)
    assert response.status_code == 200

    cities = [
        record["City"]
        for record in response.json()["cleaning"]["cleaned_dataset"]["records"]
    ]
    assert cities[1] == "Unknown"


def test_clean_missing_values_constant_numeric_preserves_type(client):
    csv_content = b"ID,Count\n1,10\n2,\n3,30\n"
    files = {"file": ("counts.csv", io.BytesIO(csv_content), "text/csv")}
    form_data = {
        "missing_strategy": "constant",
        "fill_value": "0",
    }

    response = client.post("/api/v1/clean", files=files, data=form_data)
    assert response.status_code == 200

    counts = [
        record["Count"]
        for record in response.json()["cleaning"]["cleaned_dataset"]["records"]
    ]
    # Should be numeric 0, not string "0"
    assert counts[1] == 0
    assert isinstance(counts[1], (int, float))


def test_clean_drop_missing_rows(client):
    csv_content = b"Name,Age\nRavi,25\nSita,\nBob,30\n"
    files = {"file": ("data.csv", io.BytesIO(csv_content), "text/csv")}
    form_data = {"drop_missing_rows": "true"}

    response = client.post("/api/v1/clean", files=files, data=form_data)
    assert response.status_code == 200

    cleaning = response.json()["cleaning"]
    assert cleaning["report"]["rows_removed"] == 1
    assert cleaning["cleaned_dataset"]["row_count"] == 2


def test_clean_invalid_strategy(client):
    csv_content = b"Name,Age\nRavi,25\n"
    files = {"file": ("data.csv", io.BytesIO(csv_content), "text/csv")}
    form_data = {"missing_strategy": "magic_impute"}

    response = client.post("/api/v1/clean", files=files, data=form_data)
    assert response.status_code == 400
    assert "Unsupported missing_strategy" in response.json()["detail"]


def test_clean_constant_strategy_requires_fill_value(client):
    csv_content = b"Name,Age\nRavi,25\nSita,\n"
    files = {"file": ("data.csv", io.BytesIO(csv_content), "text/csv")}
    form_data = {"missing_strategy": "constant"}

    response = client.post("/api/v1/clean", files=files, data=form_data)
    assert response.status_code == 400
    assert "fill_value must be provided" in response.json()["detail"]


def test_clean_mean_on_text_column_raises_error(client):
    csv_content = b"Name,City\nRavi,\nSita,Guntur\n"
    files = {"file": ("data.csv", io.BytesIO(csv_content), "text/csv")}
    form_data = {"missing_strategy": "mean"}

    response = client.post("/api/v1/clean", files=files, data=form_data)
    assert response.status_code == 400
    assert "requires numeric columns" in response.json()["detail"]


# --------------------------------------------------
# Temporary file cleanup tests
# --------------------------------------------------

def test_temporary_file_cleanup_on_success(client):
    created_temp_files = []
    original_named_temp = tempfile.NamedTemporaryFile

    def spy_named_temporary_file(*args, **kwargs):
        temp_file = original_named_temp(*args, **kwargs)
        created_temp_files.append(temp_file.name)
        return temp_file

    csv_content = b"Name,Age\nRavi,25\n"
    files = {"file": ("sample.csv", io.BytesIO(csv_content), "text/csv")}

    with patch("app.main.NamedTemporaryFile", side_effect=spy_named_temporary_file):
        response = client.post("/api/v1/analyze", files=files)

    assert response.status_code == 200
    assert len(created_temp_files) == 1
    # Verify the temporary file was unlinked and does not exist anymore
    assert not Path(created_temp_files[0]).exists()


def test_temporary_file_cleanup_on_error(client):
    created_temp_files = []
    original_named_temp = tempfile.NamedTemporaryFile

    def spy_named_temporary_file(*args, **kwargs):
        temp_file = original_named_temp(*args, **kwargs)
        created_temp_files.append(temp_file.name)
        return temp_file

    # CSV that will cause an error during cleaning
    csv_content = b"Name,Age\nRavi,25\nSita,\n"
    files = {"file": ("sample.csv", io.BytesIO(csv_content), "text/csv")}
    form_data = {"missing_strategy": "invalid_strat"}

    with patch("app.main.NamedTemporaryFile", side_effect=spy_named_temporary_file):
        response = client.post("/api/v1/clean", files=files, data=form_data)

    assert response.status_code == 400
    assert len(created_temp_files) == 1
    # Verify cleanup occurred even when an error was raised
    assert not Path(created_temp_files[0]).exists()


# --------------------------------------------------
# Source data immutability test
# --------------------------------------------------

def test_uploaded_source_file_never_modified(tmp_path, client):
    source_file = tmp_path / "original_source.csv"
    initial_content = "Name,Age\nRavi,20\nSita,\nRavi,20\n"
    source_file.write_text(initial_content, encoding="utf-8")

    with open(source_file, "rb") as f:
        response = client.post(
            "/api/v1/clean",
            files={"file": ("original_source.csv", f, "text/csv")},
            data={"drop_duplicates": "true", "missing_strategy": "mean"},
        )

    assert response.status_code == 200
    # Original source file must remain completely untouched
    assert source_file.read_text(encoding="utf-8") == initial_content
