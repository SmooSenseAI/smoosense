# API Specifications

This document defines the API contract between the Next.js frontend and the Flask backend.

## Base Configuration
- **Development URL**: `http://localhost:8000`
- **Production**: Bundled with Flask backend in pip package/macOS app
- **Content-Type**: `application/json`
- **SQL Engine**: DuckDB
- **SQL Restrictions**: Read-only queries only

## Authentication
<!-- TODO: Define authentication mechanism -->
- [ ] Authentication method (API keys, tokens, etc.)
- [ ] How credentials are passed (headers, query params, etc.)

## Common Response Format
```json
{
  "status": "error|success",
  "error": "",
  ...
}
```

## File System & Storage APIs
TODO


## SQL Query API

### Execute Read-Only Query
```http
POST /api/query
```

**Request Body:**
```json
{
  "query": string,
}
```

**Response:**
```json
{
  "column_names": [
    "column1", "column2"
  ],
  "error": null,
  "rows": [
    [1, 2],
    [3, 4]
  ],
  "runtime": 0.0004333329999999802,
  "status": "success"
}
```


## Error Handling

### Error Response Example
```json
{
  "success": false,
  "error": {
    "code": 403,
    "message": "Access Deny",
    "details": {
      "file_path": "/path/to/missing/file.csv",
      "storage_type": "filesystem"
    }
  }
}
```

## TODO / Questions

### Data Formats
- [ ] What file formats should be supported? (CSV, JSON, Parquet, Excel, etc.)
- [ ] How to handle different encodings and delimiters?
- [ ] Maximum file size limits?

### S3 Configuration
- [ ] How are S3 credentials configured?
- [ ] Support for different S3-compatible services?
- [ ] How to handle S3 bucket permissions?

### Performance & Caching
- [ ] Should responses be cached?
- [ ] How to handle large datasets (streaming, chunking)?
- [ ] Rate limiting requirements?

### Security
- [ ] Path traversal protection mechanisms?
- [ ] SQL injection prevention (beyond read-only)?
- [ ] File access restrictions and sandboxing?