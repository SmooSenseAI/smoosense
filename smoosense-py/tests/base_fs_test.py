import os
import tempfile
import unittest

from flask import Flask

from smoosense.handlers.fs import fs_bp
from smoosense.my_logging import getLogger

logger = getLogger(__name__)


class BaseFSTest(unittest.TestCase):
    """Base test class for file system handler tests."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        self.app = Flask(__name__)
        self.app.register_blueprint(fs_bp)
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

        # Create a temporary directory for testing
        self.temp_dir = tempfile.mkdtemp()

        # Create some test files and directories
        self.test_file = os.path.join(self.temp_dir, "test_file.txt")
        self.test_dir = os.path.join(self.temp_dir, "test_dir")

        with open(self.test_file, "w") as f:
            f.write("test content")

        os.makedirs(self.test_dir, exist_ok=True)

        # Create a hidden file
        self.hidden_file = os.path.join(self.temp_dir, ".hidden_file")
        with open(self.hidden_file, "w") as f:
            f.write("hidden content")

        # Set up application context for all tests
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self):
        """Clean up after each test method."""
        import shutil

        # Pop the application context
        self.app_context.pop()
        shutil.rmtree(self.temp_dir, ignore_errors=True)
