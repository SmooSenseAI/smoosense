import os
import unittest
from unittest import mock

from smoosense.utils.query_backends import (
    build_query_connection_maker_from_env,
    check_permissions,
)


class TestCheckPermissions(unittest.TestCase):
    """Engine-agnostic readonly-query gate."""

    def test_select_allowed(self):
        check_permissions("SELECT * FROM table")

    def test_update_blocked(self):
        with self.assertRaises(PermissionError):
            check_permissions("UPDATE t SET a=1")


class TestBuildFromEnv(unittest.TestCase):
    """Backend selection driven by environment variables."""

    def test_no_env_returns_none(self):
        with mock.patch.dict(os.environ, {}, clear=False):
            for var in (
                "SMOOSENSE_QUERY_BACKEND",
                "SMOOSENSE_FLIGHTSQL_URI",
                "SMOOSENSE_FLIGHTSQL_USERNAME",
                "SMOOSENSE_FLIGHTSQL_PASSWORD",
                "SMOOSENSE_FLIGHTSQL_TOKEN",
                "SMOOSENSE_FLIGHTSQL_HEADERS",
                "SMOOSENSE_FLIGHTSQL_TLS_INSECURE",
            ):
                os.environ.pop(var, None)
            self.assertIsNone(build_query_connection_maker_from_env())

    def test_explicit_duckdb_returns_none(self):
        with mock.patch.dict(os.environ, {"SMOOSENSE_QUERY_BACKEND": "duckdb"}, clear=False):
            self.assertIsNone(build_query_connection_maker_from_env())

    def test_unknown_backend_raises(self):
        with mock.patch.dict(os.environ, {"SMOOSENSE_QUERY_BACKEND": "spanner"}, clear=False):
            with self.assertRaises(ValueError):
                build_query_connection_maker_from_env()

    def test_flightsql_without_uri_raises(self):
        env = {"SMOOSENSE_QUERY_BACKEND": "flightsql"}
        with mock.patch.dict(os.environ, env, clear=False):
            os.environ.pop("SMOOSENSE_FLIGHTSQL_URI", None)
            with self.assertRaises(ValueError):
                build_query_connection_maker_from_env()

    def test_flightsql_with_uri_returns_callable(self):
        try:
            import adbc_driver_flightsql.dbapi  # noqa: F401
        except ImportError:
            self.skipTest("adbc-driver-flightsql is not installed")
        env = {
            "SMOOSENSE_QUERY_BACKEND": "flightsql",
            "SMOOSENSE_FLIGHTSQL_URI": "grpc://localhost:50051",
        }
        with mock.patch.dict(os.environ, env, clear=False):
            maker = build_query_connection_maker_from_env()
            self.assertIsNotNone(maker)
            self.assertTrue(callable(maker))

    def test_invalid_headers_json_raises(self):
        try:
            import adbc_driver_flightsql.dbapi  # noqa: F401
        except ImportError:
            self.skipTest("adbc-driver-flightsql is not installed")
        env = {
            "SMOOSENSE_QUERY_BACKEND": "flightsql",
            "SMOOSENSE_FLIGHTSQL_URI": "grpc://localhost:50051",
            "SMOOSENSE_FLIGHTSQL_HEADERS": "not json",
        }
        with mock.patch.dict(os.environ, env, clear=False):
            with self.assertRaises(ValueError):
                build_query_connection_maker_from_env()


if __name__ == "__main__":
    unittest.main()
