"""Pluggable SQL query backends.

The Flask app exposes a callable ``QueryConnectionMaker`` under
``app.config["QUERY_CONNECTION_MAKER"]``. Every request handler that runs SQL
calls the maker to obtain a fresh DB-API 2.0 cursor (PEP 249), then uses
``cur.execute(query)``, ``cur.description`` and ``cur.fetchall()`` only — the
same surface every Python SQL client exposes. The default backend is the
in-process DuckDB engine; alternative backends only need to satisfy the same
contract.

Use ``build_query_connection_maker_from_env`` to construct the maker that the
``SMOOSENSE_QUERY_BACKEND`` / ``SMOOSENSE_FLIGHTSQL_*`` environment variables
describe, or call ``flightsql_connection_maker`` directly with explicit args.
"""

from __future__ import annotations

import json
import logging
import os
from collections.abc import Callable
from typing import Any

logger = logging.getLogger(__name__)


# A callable returning a fresh DB-API 2.0 cursor (PEP 249). The concrete return
# type is duck-typed across drivers — DuckDB returns a ``DuckDBPyConnection``
# that quacks like a cursor; ``adbc_driver_flightsql`` returns a real Cursor;
# any other DB-API client works as long as the object exposes ``execute``,
# ``description`` and ``fetchall``.
QueryConnectionMaker = Callable[[], Any]


def check_permissions(query: str) -> None:
    """Reject queries containing forbidden top-level keywords.

    Engine-agnostic: pure string matching, applied before the query reaches the
    backend. Keeps the read-only contract regardless of which backend is wired
    up.
    """
    tokens = [w.lower() for w in query.split() if w]
    forbidden = ["copy", "export", "delete", "attach", "update"]
    if any(w in tokens for w in forbidden):
        logger.warning(f"Forbidden query: {query}")
        raise PermissionError("You are only allowed to run readonly queries")


def flightsql_connection_maker(
    uri: str,
    *,
    username: str | None = None,
    password: str | None = None,
    token: str | None = None,
    headers: dict[str, str] | None = None,
    tls_skip_verify: bool = False,
    db_kwargs: dict[str, str] | None = None,
) -> QueryConnectionMaker:
    """Return a maker that yields fresh ADBC Flight SQL cursors.

    ``adbc_driver_flightsql`` is an optional dependency. The import is deferred
    so installations that only use DuckDB don't pay for it.

    ``uri`` is the gRPC endpoint of the Flight SQL service, e.g.
    ``grpc://host:50051`` or ``grpc+tls://host:443``. ``username``/``password``
    triggers Basic auth; ``token`` sets a Bearer token. ``headers`` adds
    arbitrary metadata to every RPC. ``db_kwargs`` is an escape hatch passed
    straight to ``adbc_driver_flightsql.dbapi.connect`` for driver-specific
    options.
    """
    try:
        import adbc_driver_flightsql.dbapi as flight_sql
    except ImportError as exc:
        raise ImportError(
            "Arrow Flight SQL backend requires the optional 'adbc-driver-flightsql' "
            'package. Install with: pip install "smoosense[flightsql]"'
        ) from exc

    options: dict[str, str] = {}
    if username is not None:
        options["username"] = username
    if password is not None:
        options["password"] = password
    if token is not None:
        options["adbc.flight.sql.authorization_header"] = f"Bearer {token}"
    if tls_skip_verify:
        options["adbc.flight.sql.client_option.tls_skip_verify"] = "true"
    for key, value in (headers or {}).items():
        options[f"adbc.flight.sql.rpc.call_header.{key.lower()}"] = value
    if db_kwargs:
        options.update(db_kwargs)

    def maker() -> Any:
        conn = flight_sql.connect(uri, db_kwargs=options or None)
        return conn.cursor()

    return maker


def _parse_bool_env(raw: str | None) -> bool:
    if raw is None:
        return False
    return raw.strip().lower() in ("1", "true", "yes", "on")


def build_query_connection_maker_from_env() -> QueryConnectionMaker | None:
    """Return a maker built from ``SMOOSENSE_*`` env vars, or ``None``.

    Returns ``None`` when no non-default backend is configured, signalling the
    caller to fall back to the in-process DuckDB engine.
    """
    backend = os.environ.get("SMOOSENSE_QUERY_BACKEND", "").strip().lower()
    uri = os.environ.get("SMOOSENSE_FLIGHTSQL_URI", "").strip()

    if backend == "flightsql" or (backend == "" and uri):
        if not uri:
            raise ValueError("SMOOSENSE_QUERY_BACKEND=flightsql requires SMOOSENSE_FLIGHTSQL_URI")
        headers_raw = os.environ.get("SMOOSENSE_FLIGHTSQL_HEADERS")
        headers: dict[str, str] | None = None
        if headers_raw:
            try:
                headers = json.loads(headers_raw)
            except json.JSONDecodeError as exc:
                raise ValueError(
                    "SMOOSENSE_FLIGHTSQL_HEADERS must be a JSON object of string→string"
                ) from exc
            if not isinstance(headers, dict) or not all(
                isinstance(k, str) and isinstance(v, str) for k, v in headers.items()
            ):
                raise ValueError(
                    "SMOOSENSE_FLIGHTSQL_HEADERS must be a JSON object of string→string"
                )
        logger.info(f"Using Arrow Flight SQL query backend at {uri}")
        return flightsql_connection_maker(
            uri,
            username=os.environ.get("SMOOSENSE_FLIGHTSQL_USERNAME") or None,
            password=os.environ.get("SMOOSENSE_FLIGHTSQL_PASSWORD") or None,
            token=os.environ.get("SMOOSENSE_FLIGHTSQL_TOKEN") or None,
            headers=headers,
            tls_skip_verify=_parse_bool_env(os.environ.get("SMOOSENSE_FLIGHTSQL_TLS_INSECURE")),
        )

    if backend not in ("", "duckdb"):
        raise ValueError(
            f"Unknown SMOOSENSE_QUERY_BACKEND={backend!r}. Supported values: 'duckdb', 'flightsql'."
        )

    return None
