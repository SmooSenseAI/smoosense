# Integration Tests

This directory contains integration tests for the SmooSenseApp using unittest and Playwright.

## Overview

The integration tests verify that:
- The SmooSenseApp server starts correctly
- The homepage loads successfully
- The server responds within reasonable time limits
- The homepage has proper content structure
- Screenshots are captured for debugging/verification

## Prerequisites

Make sure you have the dev dependencies installed:

```bash
# Install all dev dependencies (including Playwright)
uv sync --dev
```

You may also need to install Playwright browsers:

```bash
# Install Playwright browsers
uv run playwright install chromium
```

## Running the Tests

### Run all tests
```bash
# From the smoosense-py directory
uv run python -m unittest discover -s intests -p "test_*.py" -v
```

### Run specific tests
```bash
# Run specific test file
uv run python -m unittest intests.test_homepage -v

# Run specific test method
uv run python -m unittest intests.test_homepage.TestHomepage.test_homepage_loads_successfully -v
```

## Test Structure

### Base Classes
- `base_integration_test.py`: Base test class with server and browser management
  - `BaseIntegrationTest`: Provides server startup/shutdown and browser lifecycle
  - `ServerFixture`: Manages SmooSenseApp server in separate thread

### Test Files
- `test_homepage.py`: Homepage-specific integration tests
  - `test_homepage_loads_successfully()`: Verifies homepage loads and contains expected content
  - `test_homepage_responds_within_reasonable_time()`: Ensures reasonable response times
  - `test_homepage_content_structure()`: Validates page HTML structure
  - `test_server_health_check()`: Basic server health verification

## Class Structure

- `BaseIntegrationTest`: Base unittest.TestCase with server and browser management
  - Automatic server startup/shutdown per test class
  - Browser context management per test method
  - Screenshot capture utilities
  - Shared server instance across all tests in a class

## Screenshots

Test screenshots are automatically saved to `intests/screenshots/` for debugging and verification purposes:

- `homepage_loaded.png`: Screenshot of the loaded homepage
- `homepage_content_structure.png`: Screenshot showing page structure
- `server_health_check.png`: Screenshot from the health check test

## Configuration

- Test server automatically finds and uses a free port to avoid conflicts
- Browser runs in headless mode by default for CI compatibility
- Uses unittest discovery to find and run all test files

## Troubleshooting

If tests fail:

1. **Server startup issues**: Check that all dependencies are installed and there are no port conflicts
2. **Browser issues**: Ensure Playwright browsers are installed (`uv run playwright install chromium`)
3. **Timeout issues**: The server has a 10-second startup timeout; increase if needed
4. **Screenshot issues**: Check that the `screenshots/` directory is writable

## Adding New Tests

To add new integration tests:

1. Create new test files inheriting from `BaseIntegrationTest`
2. Use `self.page` for browser interactions and `self.base_url` for server URL
3. Follow unittest naming conventions (`test_*` methods)
4. Use `self.take_screenshot()` for capturing test evidence
5. Use standard unittest assertions (`self.assertEqual`, `self.assertTrue`, etc.)
6. Update this README if adding new test categories

Example:
```python
from .base_integration_test import BaseIntegrationTest

class TestNewFeature(BaseIntegrationTest):
    def test_new_functionality(self) -> None:
        response = self.page.goto(f"{self.base_url}/new-feature")
        self.assertEqual(response.status, 200)
        self.take_screenshot("new_feature.png")
```

## Notes

- Tests use unittest framework with class-based setup/teardown
- Server runs in a daemon thread and automatically cleans up when tests finish
- The server uses a minimal configuration suitable for testing
- Screenshots are saved with descriptive names for easy identification