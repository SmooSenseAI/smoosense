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
```bash
# Start the web interface (auto-selects port, opens browser)
sense

# Show version
sense --version
```

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
pyproject.toml          # Python project configuration
uv.lock                 # Dependency lock file
```

