import os
import unittest

from smoosense.app import SmooSenseApp


class TestLocalFolderAccessAutoDetect(unittest.TestCase):
    """When SMOOSENSE_LOCAL_FOLDER_PREFIX is unset, access depends on request host."""

    def setUp(self):
        os.environ.pop("SMOOSENSE_LOCAL_FOLDER_PREFIX", None)
        self.app = SmooSenseApp().create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_local_path_allowed_on_localhost(self):
        response = self.client.get("/api/ls?path=/tmp/foo", headers={"Host": "localhost:8000"})
        self.assertNotEqual(response.status_code, 403)

    def test_local_path_allowed_on_127_0_0_1(self):
        response = self.client.get("/api/ls?path=/tmp/foo", headers={"Host": "127.0.0.1:8000"})
        self.assertNotEqual(response.status_code, 403)

    def test_local_path_blocked_on_remote_host(self):
        response = self.client.get("/api/ls?path=/tmp/foo", headers={"Host": "app.example.com"})
        self.assertEqual(response.status_code, 403)
        data = response.get_json()
        self.assertIn("not allowed", data["error"])

    def test_tilde_path_blocked_on_remote_host(self):
        response = self.client.get("/api/ls?path=~/foo", headers={"Host": "app.example.com"})
        self.assertEqual(response.status_code, 403)

    def test_s3_path_always_allowed(self):
        """S3 paths are never blocked by the local access hook."""
        from unittest.mock import patch

        with patch("smoosense.handlers.fs.S3FileSystem") as mock_s3_class:
            mock_s3_class.return_value.list_one_level.return_value = ([], 0)
            response = self.client.get(
                "/api/ls?path=s3://bucket/key", headers={"Host": "app.example.com"}
            )
        self.assertEqual(response.status_code, 200)

    def test_health_endpoint_not_blocked(self):
        response = self.client.get("/api/health", headers={"Host": "app.example.com"})
        self.assertEqual(response.status_code, 200)


class TestLocalFolderAccessExplicitDeny(unittest.TestCase):
    """When SMOOSENSE_LOCAL_FOLDER_PREFIX="" (empty), all local paths are blocked."""

    def setUp(self):
        os.environ["SMOOSENSE_LOCAL_FOLDER_PREFIX"] = ""
        self.app = SmooSenseApp().create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def tearDown(self):
        os.environ.pop("SMOOSENSE_LOCAL_FOLDER_PREFIX", None)

    def test_ls_local_path_blocked(self):
        response = self.client.get("/api/ls?path=/tmp/foo")
        self.assertEqual(response.status_code, 403)
        data = response.get_json()
        self.assertIn("error", data)
        self.assertIn("not allowed", data["error"])

    def test_ls_tilde_path_blocked(self):
        response = self.client.get("/api/ls?path=~/foo")
        self.assertEqual(response.status_code, 403)

    def test_bare_tilde_blocked(self):
        response = self.client.get("/api/ls?path=~")
        self.assertEqual(response.status_code, 403)

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
    """When SMOOSENSE_LOCAL_FOLDER_PREFIX=/tmp/, only /tmp/* paths are allowed."""

    def setUp(self):
        os.environ["SMOOSENSE_LOCAL_FOLDER_PREFIX"] = "/tmp/"
        self.app = SmooSenseApp().create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def tearDown(self):
        os.environ.pop("SMOOSENSE_LOCAL_FOLDER_PREFIX", None)

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

    def test_bare_tilde_blocked(self):
        response = self.client.get("/api/ls?path=~")
        self.assertEqual(response.status_code, 403)

    def test_s3_path_allowed(self):
        """S3 paths are never blocked by the local access hook."""
        from unittest.mock import patch

        with patch("smoosense.handlers.fs.S3FileSystem") as mock_s3_class:
            mock_s3_class.return_value.list_one_level.return_value = ([], 0)
            response = self.client.get("/api/ls?path=s3://bucket/key")
        self.assertEqual(response.status_code, 200)

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
    """When SMOOSENSE_LOCAL_FOLDER_PREFIX=~/, tilde paths are allowed."""

    def setUp(self):
        os.environ["SMOOSENSE_LOCAL_FOLDER_PREFIX"] = "~/"
        self.app = SmooSenseApp().create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def tearDown(self):
        os.environ.pop("SMOOSENSE_LOCAL_FOLDER_PREFIX", None)

    def test_tilde_path_allowed(self):
        response = self.client.get("/api/ls?path=~/foo")
        self.assertNotEqual(response.status_code, 403)

    def test_absolute_path_blocked(self):
        response = self.client.get("/api/ls?path=/etc/passwd")
        self.assertEqual(response.status_code, 403)


class TestPassoverConfig(unittest.TestCase):
    """SMOOSENSE_LOCAL_FOLDER_PREFIX is reflected in PASSOVER_CONFIG."""

    def test_pattern_in_passover_config_when_set(self):
        os.environ["SMOOSENSE_LOCAL_FOLDER_PREFIX"] = "/mnt/"
        try:
            app = SmooSenseApp().create_app()
            self.assertEqual(app.config["PASSOVER_CONFIG"]["LOCAL_FOLDER_PREFIX"], "/mnt/")
        finally:
            os.environ.pop("SMOOSENSE_LOCAL_FOLDER_PREFIX", None)

    def test_pattern_null_in_passover_config_when_unset(self):
        os.environ.pop("SMOOSENSE_LOCAL_FOLDER_PREFIX", None)
        app = SmooSenseApp().create_app()
        self.assertIsNone(app.config["PASSOVER_CONFIG"]["LOCAL_FOLDER_PREFIX"])


class TestLocalFolderAccessWildcard(unittest.TestCase):
    """When SMOOSENSE_LOCAL_FOLDER_PREFIX=*, all local paths are allowed."""

    def setUp(self):
        os.environ["SMOOSENSE_LOCAL_FOLDER_PREFIX"] = "*"
        self.app = SmooSenseApp().create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def tearDown(self):
        os.environ.pop("SMOOSENSE_LOCAL_FOLDER_PREFIX", None)

    def test_absolute_path_allowed(self):
        response = self.client.get("/api/ls?path=/tmp/foo")
        self.assertNotEqual(response.status_code, 403)

    def test_tilde_path_allowed(self):
        response = self.client.get("/api/ls?path=~/foo")
        self.assertNotEqual(response.status_code, 403)

    def test_bare_tilde_allowed(self):
        response = self.client.get("/api/ls?path=~")
        self.assertNotEqual(response.status_code, 403)


if __name__ == "__main__":
    unittest.main()
