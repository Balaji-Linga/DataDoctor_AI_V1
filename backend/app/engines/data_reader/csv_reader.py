
from pathlib import Path

import pandas as pd


SUPPORTED_EXTENSIONS = {".csv"}


def read_csv_file(file_path: str | Path) -> pd.DataFrame:
    """Read a CSV dataset after basic file validation."""
    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {path}")

    if not path.is_file():
        raise ValueError("The supplied path is not a file.")

    if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise ValueError("Unsupported file type. Please provide a CSV file.")

    if path.stat().st_size == 0:
        raise ValueError("The CSV file is empty.")

    try:
        dataframe = pd.read_csv(path)
    except (pd.errors.ParserError, UnicodeDecodeError) as exc:
        raise ValueError(f"Unable to parse CSV file: {exc}") from exc

    if len(dataframe.columns) == 0:
        raise ValueError("The CSV file has no columns.")

    if any(
        not isinstance(column, str) or not column.strip()
        for column in dataframe.columns
    ):
        raise ValueError("Column names must not be empty.")

    return dataframe
