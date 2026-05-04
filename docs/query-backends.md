# Query backends

SmooSense ships with an in-process **DuckDB** SQL engine by default. The same
read-only request handlers (`/api/query`, `/api/umap`) can route through any
**Arrow Flight SQL** service (DataFusion, Ballista, Dremio, Spice, etc.) by
swapping the backend at app construction time.

## Architecture

The Flask app stores a single callable under
`app.config["QUERY_CONNECTION_MAKER"]`. Each request invokes it to obtain a
fresh DB-API 2.0 cursor (PEP 249) and uses only the portable surface:

```python
cur = connection_maker()
cur.execute(query)
column_names = [d[0] for d in cur.description]
rows = cur.fetchall()
```

That contract is satisfied by the DuckDB connection (default), the ADBC Flight
SQL driver, and any other DB-API-compliant Python client.

## Configuration via environment variables

Set on the server process before constructing `SmooSenseApp`. No code changes
required.

| Variable | Purpose |
| --- | --- |
| `SMOOSENSE_QUERY_BACKEND` | `duckdb` (default) or `flightsql`. Inferred as `flightsql` if `SMOOSENSE_FLIGHTSQL_URI` is set. |
| `SMOOSENSE_FLIGHTSQL_URI` | gRPC endpoint, e.g. `grpc://datafusion-svc:50051` or `grpc+tls://host:443`. Required when backend is `flightsql`. |
| `SMOOSENSE_FLIGHTSQL_USERNAME` | Optional Basic-auth username. |
| `SMOOSENSE_FLIGHTSQL_PASSWORD` | Optional Basic-auth password. |
| `SMOOSENSE_FLIGHTSQL_TOKEN` | Optional Bearer token (sent as `Authorization: Bearer <token>`). Mutually exclusive with username/password in practice. |
| `SMOOSENSE_FLIGHTSQL_HEADERS` | Optional JSON object of extra RPC headers, e.g. `{"x-tenant":"abc"}`. |
| `SMOOSENSE_FLIGHTSQL_TLS_INSECURE` | `1` / `true` to disable TLS certificate verification. Test/staging only. |

Install the driver alongside SmooSense:

```bash
pip install "smoosense[flightsql]"
```

## Configuration via the Flask app

For programmatic setups (custom auth, dynamic options, embedded usage),
construct any DB-API maker and pass it to `SmooSenseApp`:

```python
from smoosense.app import SmooSenseApp
from smoosense.utils.query_backends import flightsql_connection_maker

maker = flightsql_connection_maker(
    "grpc+tls://datafusion.internal:443",
    token="…",
    headers={"x-tenant": "research"},
)

SmooSenseApp(query_connection_maker=maker).run()
```

A custom maker just has to be `Callable[[], DBAPICursor]`. Any DB-API client
works — psycopg, pyarrow ADBC for Postgres, etc. — provided the server speaks
SQL the SmooSense handlers can use.

## What the server side has to support

The handlers run plain SQL strings:

- `/api/query` runs whatever the user types after the engine-agnostic
  `check_permissions` filter (rejects `COPY`, `EXPORT`, `DELETE`, `ATTACH`,
  `UPDATE`).
- `/api/umap` issues `SELECT <cols> FROM '<table_path>' [WHERE <cond>]` against
  a file path. DuckDB and DataFusion both accept `FROM '<path>'` directly;
  most other engines need an `ObjectStore` (or equivalent) registered on the
  session, or a `CREATE EXTERNAL TABLE` per dataset. This is server-side
  configuration — SmooSense does not push file paths through the protocol.

## Migration notes

- The Flask config key was renamed from `DUCKDB_CONNECTION_MAKER` to
  `QUERY_CONNECTION_MAKER`. Update any extension that read the old key.
- DuckDB-specific S3 wiring (creds, region, endpoint) only runs when the
  DuckDB backend is selected. Flight SQL services manage their own object
  store credentials server-side.
