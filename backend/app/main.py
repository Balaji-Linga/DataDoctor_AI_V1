
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.pipeline import analyze_dataset


# --------------------------------------------------
# Application configuration
# --------------------------------------------------

app = FastAPI(
    title="DataDoctor AI API",
    description=(
        "Analyze datasets, detect data quality issues, "
        "and optionally clean CSV data."
    ),
    version="1.0.0",
)

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB

ALLOWED_EXTENSIONS = {".csv"}

# Local development origins. Add your deployed frontend URL later.
# Local development and deployed frontend origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "https://datadoctor-ai.netlify.app",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)



# --------------------------------------------------
# Health check
# --------------------------------------------------

@app.get("/health", tags=["System"])
def health_check() -> dict[str, str]:
    return {
        "status": "healthy",
        "service": "DataDoctor AI API",
        "version": "1.0.0",
    }


# --------------------------------------------------
# Shared upload and analysis helper
# --------------------------------------------------

def _parse_fill_value(value: Any) -> Any:
    """Attempt to parse string fill_value into numeric types to preserve column types."""
    if value is None:
        return None
    if isinstance(value, str):
        val = value.strip()
        if not val:
            return None
        try:
            return int(val)
        except ValueError:
            pass
        try:
            return float(val)
        except ValueError:
            pass
        return val
    return value


async def _process_upload(
    file: UploadFile | str | None = None,
    *,
    clean: bool = False,
    missing_strategy: str = "none",
    fill_value: Any = None,
    drop_duplicates: bool = False,
    drop_missing_rows: bool = False,
    preview_rows: int = 10,
) -> dict[str, Any]:
    """Validate an uploaded CSV and run the analysis pipeline."""

    if file is None or isinstance(file, str) or not (file.filename or "").strip():
        raise HTTPException(
            status_code=400,
            detail="A CSV file is required.",
        )

    filename = file.filename or ""

    if Path(filename).suffix.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type. Upload a CSV file.",
        )

    temporary_path: str | None = None

    try:
        # Read at most 10 MB + 1 byte to enforce the upload limit.
        content = await file.read(MAX_UPLOAD_SIZE + 1)

        if not content:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty.",
            )

        if len(content) > MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=413,
                detail="File exceeds the 10 MB upload limit.",
            )

        # Use a temporary file rather than trusting the user's filename.
        with NamedTemporaryFile(
            mode="wb",
            suffix=".csv",
            delete=False,
        ) as temporary_file:
            temporary_file.write(content)
            temporary_path = temporary_file.name

        # Parse fill_value if numeric or empty to preserve data types
        parsed_fill_value = _parse_fill_value(fill_value)

        # The pipeline validates and analyzes the CSV.
        result = analyze_dataset(
            temporary_path,
            clean=clean,
            missing_strategy=missing_strategy,
            fill_value=parsed_fill_value,
            drop_duplicates=drop_duplicates,
            drop_missing_rows=drop_missing_rows,
            preview_rows=preview_rows,
        )

        # Preserve the original uploaded file name in the response
        result["dataset"]["file_name"] = filename
        return result

    except HTTPException:
        raise

    except (ValueError, UnicodeDecodeError) as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to process CSV: {exc}",
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing the dataset: {exc}",
        ) from exc

    finally:
        if temporary_path is not None:
            Path(temporary_path).unlink(missing_ok=True)

        if file is not None:
            await file.close()


# --------------------------------------------------
# Analyze dataset
# --------------------------------------------------

@app.post("/api/v1/analyze", tags=["Dataset"])
async def analyze_uploaded_dataset(
    file: UploadFile | str | None = File(
        default=None,
        description="CSV dataset to analyze",
    ),
    preview_rows: int = Form(
        default=10,
        ge=0,
        le=100,
        description="Number of preview rows to return (0 to 100)",
    ),
) -> dict[str, Any]:
    """Analyze a CSV without applying any cleaning."""

    return await _process_upload(
        file,
        clean=False,
        preview_rows=preview_rows,
    )


# --------------------------------------------------
# Clean dataset
# --------------------------------------------------

@app.post("/api/v1/clean", tags=["Dataset"])
async def clean_uploaded_dataset(
    file: UploadFile | str | None = File(
        default=None,
        description="CSV dataset to clean",
    ),
    missing_strategy: str = Form(
        default="none",
        description="Missing-value strategy: none, mean, median, mode, constant",
    ),
    fill_value: str | None = Form(
        default=None,
        description="Constant fill value when missing_strategy is 'constant'",
    ),
    drop_duplicates: bool = Form(
        default=False,
        description="Whether to drop duplicate rows",
    ),
    drop_missing_rows: bool = Form(
        default=False,
        description="Whether to drop rows that still contain missing values",
    ),
    preview_rows: int = Form(
        default=10,
        ge=0,
        le=100,
        description="Number of preview rows to return (0 to 100)",
    ),
) -> dict[str, Any]:
    """
    Analyze and optionally clean a CSV.

    Strategies: none, mean, median, mode, constant.
    """

    return await _process_upload(
        file,
        clean=True,
        missing_strategy=missing_strategy,
        fill_value=fill_value,
        drop_duplicates=drop_duplicates,
        drop_missing_rows=drop_missing_rows,
        preview_rows=preview_rows,
    )
