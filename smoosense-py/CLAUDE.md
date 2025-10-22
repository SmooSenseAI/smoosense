# SmooSense - Claude Code Documentation

## Overview
SmooSense is a web-based application for exploring and analyzing large-scale multi-modal tabular data.
It provides a web interface for working with CSV, Parquet, and other data formats with SQL querying capabilities.

## Architecture
- **CLI Entry Point**: `smoosense/cli.py` - Command-line interface with automatic port selection and browser opening
- **Main App**: `smoosense/app.py` - Core SmooSenseApp Flask application
- **Frontend**: `smoosense/statics` - Bundled next.js files.
- **Database**: `duckdb` based on file systems

## Development Commands

### Installation
Always use `uv` for dependency management.
```bash
# Install dependencies (example)
uv add flask
```

### Running the Application

**For development:**
```bash
# Start development server with rich logging
make dev

# Or directly:
uv run app_dev.py
```

**For production:**
```bash
# Start the web interface (auto-selects port, opens browser)
sense

# Show version
sense --version
```

**Note**: `app_dev.py` is excluded from the package build and only used for local development. It provides enhanced logging with rich formatting.

### Testing
```bash
make test
```

### Linting/Type Checking
```bash
# Run linting (check only)
uv run ruff check

# Run linting with auto-fix
uv run ruff check --fix

# Run formatting (check only)
uv run ruff format --check

# Run formatting (apply changes)
uv run ruff format

# Run type checking
uv run mypy smoosense

# Run all checks
uv run ruff check && uv run ruff format --check && uv run mypy smoosense
```

### Building
```bash
make build
```

## Key Features
- Multi-modal data support (CSV, Parquet, etc.)
- SQL querying capabilities
- Folder browser with configurable root directory

## File Structure
```
smoosense/
├── cli.py              # CLI entry point and main function
├── app.py              # Flask application core
└── ...
app_dev.py              # Development server with rich logging (excluded from package)
pyproject.toml          # Python project configuration
uv.lock                 # Dependency lock file
```

## Development vs Production

- **Development** (`app_dev.py`):
  - Rich logging with colored output and tracebacks
  - Custom formatter showing elapsed time in milliseconds
  - Configured with boto3 session for S3 access
  - Not included in package build

- **Production** (`smoosense/app.py`):
  - Clean Flask application class
  - No logging configuration (left to deployment environment)
  - Importable as a library

