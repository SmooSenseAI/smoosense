# RenderType

SmooSense automatically infers and renders data in the most appropriate format for each column. This intelligent rendering system examines your data and chooses the best visualization, making tables intuitive and rich without any configuration.

## How RenderType Works
```codelink
anchor: inferColumnRenderType()
path: smoosense-gui/src/lib/hooks/useRenderType.ts
line: 15
```
When you load a table, SmooSense fetches `ColumnMeta` for each column and infers the most suitable RenderType. This inference happens automatically based on:

1. **ColumnMeta** - Type shortcuts (`isBoolean`, `isNumeric`, `isDatetime`, `isPrimitive`, `isNumericArray`) and DuckDB type
2. **Content patterns** - URLs are identified and classified by file extension or domain
3. **Column naming conventions** - Special column names like `bbox` or `image_mask` trigger specialized renderers

## Supported RenderTypes
```codelink
anchor: RenderType
path: smoosense-gui/src/lib/utils/agGridCellRenderers.tsx
line: 26
```

### Basic Types

| Type | Description | Criteria |
|------|-------------|----------|
| **Text** | Plain text display | Default for strings that don't match other patterns |
| **Number** | Numeric values | All values are numbers or numeric strings |
| **Boolean** | True/false display | All values are boolean |
| **Date** | Date formatting | Matches common date patterns (YYYY-MM-DD, ISO dates, etc.) |
| **Null** | Empty state | Column contains only null/undefined values |

### Media Types

SmooSense renders media directly in table cells, providing instant visual context.

| Type | Description                       | Criteria |
|------|-----------------------------------|----------|
| **ImageUrl** | Inline image preview              | URLs ending in `.jpg`, `.png`, `.gif`, `.webp`, etc. |
| **VideoUrl** | Video player                      | URLs ending in `.mp4`, `.webm`, `.mov`, or YouTube/Vimeo links |
| **AudioUrl** | Audio player with Mel-spectrogram | URLs ending in `.mp3`, `.wav`, `.ogg`, `.flac`, etc. |
| **PdfUrl** | PDF preview                       | URLs ending in `.pdf` |

Supported image formats: `jpg`, `jpeg`, `png`, `gif`, `bmp`, `svg`, `webp`, `tiff`, `tif`, `ico`, `heic`, `heif`

Supported video formats: `mp4`, `avi`, `mov`, `wmv`, `flv`, `webm`, `mkv`, `m4v`, `3gp`, `ogv`

Supported audio formats: `mp3`, `wav`, `ogg`, `flac`, `m4a`, `aac`, `wma`, `opus`

### List Types

Arrays of media URLs are rendered as scrollable galleries within cells.

| Type | Description | Criteria |
|------|-------------|----------|
| **ImageList** | Multiple image thumbnails | Array where all elements are image URLs |
| **VideoList** | Multiple video previews | Array where all elements are video URLs |
| **AudioList** | Multiple audio players | Array where all elements are audio URLs |

### Structured Data Types

| Type | Description | Criteria |
|------|-------------|----------|
| **Json** | Interactive JSON viewer | Objects or arrays (excluding media lists) |
| **HyperLink** | Clickable link | URLs that don't match specific media types |
| **IFrame** | Embedded content | URLs prefixed with `iframe+http://` or `iframe+https://` |

### Embedding
Array of float or double having the same length will be inferred as embedding. 
Similarity search will be triggered when an embedding cell is clicked. 

### Specialized Types

These types handle domain-specific data formats.

| Type | Description | Criteria |
|------|-------------|----------|
| **Bbox** | Bounding box overlay | Column name contains `bbox` and values are 4-element number arrays |
| **ImageMask** | Segmentation mask overlay | Column name contains `image_mask` and values are image URLs |
| **WordScores** | Token-level score visualization | Column name contains `word_score` |
| **HuggingFaceMedia** | Hugging Face dataset media | Hugging Face-specific media format |

## Inferring Logic

### URL Classification
```codelink
anchor: inferUrlType
path: smoosense-gui/src/lib/utils/renderTypeUtils.ts
line: 36
```

When a string is identified as a URL, SmooSense classifies it based on:

1. **File extension** - The extension in the URL path determines the media type
2. **Domain patterns** - `youtube.com`, `youtu.be`, and `vimeo.com` are treated as video URLs
3. **IFrame prefix** - URLs prefixed with `iframe+http://` or `iframe+https://` are rendered in iframes

### Date Inference

SmooSense recognizes these date formats:
- `YYYY-MM-DD` (e.g., `2024-01-15`)
- ISO 8601 with time (e.g., `2024-01-15T10:30:00`)
- `MM/DD/YYYY` or `M/D/YYYY` (e.g., `01/15/2024`)
- `MM-DD-YYYY` or `M-D-YYYY` (e.g., `01-15-2024`)

### Column Name Conventions

Certain column names trigger specialized rendering:

- **`*bbox*`** - Enables bounding box visualization when values are `[x, y, width, height]` arrays
- **`*image_mask*`** - Enables mask overlay on an associated `image_url` column
- **`*word_score*`** - Enables word-level score visualization


## Media URL Resolution

SmooSense automatically resolves media URLs to make them viewable in the browser. This allows you to use relative paths, local file paths, and S3 URLs directly in your data.

```codelink
anchor: needToResolveMediaUrl()
path: smoosense-gui/src/lib/utils/mediaUrlUtils.ts
line: 12

anchor: resolveAssetUrl()
path: smoosense-gui/src/lib/utils/mediaUrlUtils.ts
line: 117
```

### Supported URL Formats

| Format | Example | Resolution |
|--------|---------|------------|
| **Relative Path** | `./images/photo.jpg` | Resolved relative to the table file location |
| **Absolute Path** | `/home/user/image.png` | Proxied through backend API |
| **Home Path** | `~/Documents/file.wav` | Proxied through backend API |
| **S3 URL** | `s3://bucket/file.wav` | Proxied through backend S3 proxy |
| **HTTP/HTTPS URL** | `https://cdn.example.com/image.jpg` | Used directly (no modification) |

Resolution Examples:

- Relative path with local table:
  - Input: `./images/photo.jpg` with tablePath `/data/file.csv`
  - Output: `/api/get-file?path=/data/images/photo.jpg`

- Relative path with S3 table:
  - Input: `./images/photo.jpg` with tablePath `s3://bucket/data/file.csv`
  - Output: `/api/s3-proxy?url=s3://bucket/data/images/photo.jpg`

- Relative path with HTTP table:
  - Input: `./images/photo.jpg` with tablePath `https://example.com/data/file.csv`
  - Output: `https://example.com/data/images/photo.jpg`

### Serving media assets in backend

#### File Serving Endpoint

URL: `/api/get-file`

Serves local files (relative paths, absolute paths, home paths). Accepts `path` parameter with file location.

```codelink
anchor: get_file()
path: smoosense-py/smoosense/handlers/fs.py
line: 53
```

#### S3 Proxy Endpoint

URL: `/api/s3-proxy`

Proxies S3 URLs and redirects to a signed URL with temporary one-time credential contained. Accepts `url` parameter with full S3 URL (e.g., `s3://bucket/path/to/file`).

```codelink
anchor: proxy()
path: smoosense-py/smoosense/handlers/s3.py
line: 18
```

### When URLs Are Resolved

A URL is resolved only when all of these conditions are met:
1. The value is a string
2. It starts with `./`, `/`, `~/`, or `s3://`
3. It has a media file extension (image, video, audio, or PDF)

HTTP/HTTPS URLs are used directly without modification.



## Performance Considerations

- Media content is loaded lazily as cells scroll into view
- Embeddings numbers are not displayed since they make no sense to human anyway.
- Large JSON objects are collapsed by default with expandable views
- List types show limited previews with "show more" functionality
