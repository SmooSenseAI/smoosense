import os
import unittest
from unittest.mock import patch

from flask import Flask

from smoosense.app import SmooSenseApp


def make_app(pattern: str | None) -> Flask:
    """Create a test Flask app with the given local folder pattern."""
    env = {}
    if pattern is not None:
        env["SMOOSENSE_LOCAL_FOLDER_PATTERN"] = pattern
    with patch.dict(os.environ, env, clear=False):
        # Remove the key if pattern is None so it is truly unset
        if pattern is None:
            os.environ.pop("SMOOSENSE_LOCAL_FOLDER_PATTERN", None)
        app = SmooSenseApp().create_app()
    app.config["TESTING"] = True
    return app


class TestLocalFolderAccessDisabled(unittest.TestCase):
    """When SMOOSENSE_LOCAL_FOLDER_PATTERN is unset, local paths are blocked."""

    def setUp(self):
        os.environ.pop("SMOOSENSE_LOCAL_FOLDER_PATTERN", None)
        self.app = SmooSenseApp().create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_ls_local_path_blocked(self):
        response = self.client.get("/api/ls?path=/tmp/foo")
        self.assertEqual(response.status_code, 403)
        data = response.get_json()
        self.assertIn("error", data)
        self.assertIn("not allowed", data["error"])

    def test_ls_tilde_path_blocked(self):
        response = self.client.get("/api/ls?path=~/foo")
        self.assertEqual(response.status_code, 403)

    def test_ls_s3_path_allowed(self):
        # S3 paths must not be blocked by the hook.
        # The endpoint may return 403 for other reasons (e.g. S3 AccessDenied),
        # but the hook's 403 always contains "not allowed" in the error message.
        response = self.client.get("/api/ls?path=s3://bucket/key")
        if response.status_code == 403:
            data = response.get_json()
            self.assertNotIn("not allowed", data.get("error", ""), "Hook should not block S3 paths")

    def test_typeahead_local_path_blocked(self):
        response = self.client.get("/api/typeahead?path=/tmp/foo")
        self.assertEqual(response.status_code, 403)

    def test_get_file_local_path_blocked(self):
        response = self.client.get("/api/get-file?path=/tmp/foo.txt")
        self.assertEqual(response.status_code, 403)

    def test_upload_local_path_blocked(self):
        response = self.client.post(
            "/api/upload?path=/tmp/foo.txt",
            json={"content": "hello"},
        )
        self.assertEqual(response.status_code, 403)

    def test_health_endpoint_not_blocked(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)


class TestLocalFolderAccessWithPattern(unittest.TestCase):
    """When SMOOSENSE_LOCAL_FOLDER_PATTERN=/tmp/, only /tmp/* paths are allowed."""

    def setUp(self):
        os.environ["SMOOSENSE_LOCAL_FOLDER_PATTERN"] = "/tmp/"
        self.app = SmooSenseApp().create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def tearDown(self):
        os.environ.pop("SMOOSENSE_LOCAL_FOLDER_PATTERN", None)

    def test_allowed_path_passes_hook(self):
        # /tmp/foo starts with /tmp/ — hook should not block it
        # (endpoint may still return 404/500, but not 403 from the hook)
        response = self.client.get("/api/ls?path=/tmp/foo")
        self.assertNotEqual(response.status_code, 403)

    def test_disallowed_path_blocked(self):
        response = self.client.get("/api/ls?path=/etc/passwd")
        self.assertEqual(response.status_code, 403)
        data = response.get_json()
        self.assertIn("error", data)
        self.assertIn("not allowed", data["error"])

    def test_tilde_path_blocked_when_pattern_is_absolute(self):
        response = self.client.get("/api/ls?path=~/foo")
        self.assertEqual(response.status_code, 403)

    def test_s3_path_allowed(self):
        # S3 paths must not be blocked by the hook.
        # The endpoint may return 403 for other reasons (e.g. S3 AccessDenied),
        # but the hook's 403 always contains "not allowed" in the error message.
        response = self.client.get("/api/ls?path=s3://bucket/key")
        if response.status_code == 403:
            data = response.get_json()
            self.assertNotIn("not allowed", data.get("error", ""), "Hook should not block S3 paths")

    def test_upload_allowed_path_passes_hook(self):
        response = self.client.post(
            "/api/upload?path=/tmp/foo.txt",
            json={"content": "hello"},
        )
        self.assertNotEqual(response.status_code, 403)

    def test_upload_disallowed_path_blocked(self):
        response = self.client.post(
            "/api/upload?path=/etc/foo.txt",
            json={"content": "hello"},
        )
        self.assertEqual(response.status_code, 403)


class TestLocalFolderAccessTildePattern(unittest.TestCase):
    """When SMOOSENSE_LOCAL_FOLDER_PATTERN=~/, tilde paths are allowed."""

    def setUp(self):
        os.environ["SMOOSENSE_LOCAL_FOLDER_PATTERN"] = "~/"
        self.app = SmooSenseApp().create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def tearDown(self):
        os.environ.pop("SMOOSENSE_LOCAL_FOLDER_PATTERN", None)

    def test_tilde_path_allowed(self):
        response = self.client.get("/api/ls?path=~/foo")
        self.assertNotEqual(response.status_code, 403)

    def test_absolute_path_blocked(self):
        response = self.client.get("/api/ls?path=/etc/passwd")
        self.assertEqual(response.status_code, 403)


class TestPassoverConfig(unittest.TestCase):
    """SMOOSENSE_LOCAL_FOLDER_PATTERN is reflected in PASSOVER_CONFIG."""

    def test_pattern_in_passover_config_when_set(self):
        os.environ["SMOOSENSE_LOCAL_FOLDER_PATTERN"] = "/mnt/"
        try:
            app = SmooSenseApp().create_app()
            self.assertEqual(app.config["PASSOVER_CONFIG"]["LOCAL_FOLDER_PATTERN"], "/mnt/")
        finally:
            os.environ.pop("SMOOSENSE_LOCAL_FOLDER_PATTERN", None)

    def test_pattern_null_in_passover_config_when_unset(self):
        os.environ.pop("SMOOSENSE_LOCAL_FOLDER_PATTERN", None)
        app = SmooSenseApp().create_app()
        self.assertIsNone(app.config["PASSOVER_CONFIG"]["LOCAL_FOLDER_PATTERN"])


if __name__ == "__main__":
    unittest.main()
