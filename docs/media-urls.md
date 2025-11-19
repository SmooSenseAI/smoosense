# Asset URL Handling

This document explains how SmooSense handles asset URLs (images, videos, audio) in data tables.

## Overview

SmooSense supports multiple URL formats for media assets:
- **Absolute URLs**: `http://example.com/image.jpg`, `https://cdn.example.com/video.mp4`
- **Cloud Storage URLs**: `s3://bucket/file.wav`
- **Relative Paths**: `./images/photo.jpg`, `./audio/sound.wav`
- **Absolute Paths**: `/path/to/file.mp3`, `~/home/user/image.png`

## URL Processing Pipeline

### 1. Load data by running a query
`executeQueryAsListOfDict()` @ [useRowData.ts](../smoosense-gui/src/lib/hooks/useRowData.ts)

### 2. Process all cells and resolve media URLs
`fetchProcessedRowDataFunction()` @ [processedRowDataSlice.ts](../smoosense-gui/src/lib/features/processedRowData/processedRowDataSlice.ts)

For **every cell in every row**:
- Check if value needs resolution using `needToResolveMediaUrl()` @ [mediaUrlUtils.ts](../smoosense-gui/src/lib/utils/mediaUrlUtils.ts)
- Resolve it using `resolveAssetUrl()` @ [mediaUrlUtils.ts](../smoosense-gui/src/lib/utils/mediaUrlUtils.ts)


#### Relative Path (local tablePath)
- **Input Example**: `./images/photo.jpg` with tablePath `/data/file.csv`
- **Resolution**: Resolve relative to local `tablePath` directory, proxy through backend
- **Final Output**: `{baseUrl}/api/get-file?path=/data/images/photo.jpg&redirect=false`

#### Relative Path (S3 tablePath)
- **Input Example**: `./images/photo.jpg` with tablePath `s3://bucket/data/file.csv`
- **Resolution**: Resolve relative to S3 `tablePath` directory, proxy through S3 proxy
- **Final Output**: `{baseUrl}/api/s3-proxy?url=s3%3A%2F%2Fbucket%2Fdata%2Fimages%2Fphoto.jpg`

#### Relative Path (HTTP/HTTPS tablePath)
- **Input Example**: `./images/photo.jpg` with tablePath `https://example.com/data/file.csv`
- **Resolution**: Resolve relative to HTTP/HTTPS `tablePath` directory
- **Final Output**: `https://example.com/data/images/photo.jpg`

#### Absolute Path
- **Input Example**: `/home/user/image.png`
- **Resolution**: Proxy through backend API
- **Final Output**: `{baseUrl}/api/get-file?path=/home/user/image.png&redirect=false`

#### Home Path
- **Input Example**: `~/Documents/file.wav`
- **Resolution**: Proxy through backend API
- **Final Output**: `{baseUrl}/api/get-file?path=~/Documents/file.wav&redirect=false`

#### S3 URL (with media extension)
- **Input Example**: `s3://bucket/file.wav`
- **Resolution**: Proxy through backend S3 proxy (only for media files: images, videos, audio)
- **Final Output**: `{baseUrl}/api/s3-proxy?url=s3%3A%2F%2Fbucket%2Ffile.wav`

#### HTTP/HTTPS URL
- **Input Example**: `https://cdn.example.com/image.jpg`
- **Resolution**: No modification
- **Final Output**: `https://cdn.example.com/image.jpg`

### 3. Return processed data
[useProcessedRowData.ts](../smoosense-gui/src/lib/hooks/useProcessedRowData.ts)
- Returns the processed data with all media URLs resolved


## Backend Integration

### File Serving Endpoint
`/api/get-file`
`get_file()` @ [fs.py](../smoosense-py/smoosense/handlers/fs.py)
- Serves local files (relative paths, absolute paths, home paths)
- Accepts `path` parameter with file location

### S3 Proxy Endpoint
`/api/s3-proxy`
`s3_proxy()` @ [fs.py](../smoosense-py/smoosense/handlers/fs.py)
- Proxies S3 URLs through backend
- Accepts `url` parameter with full S3 URL (e.g., `s3://bucket/path/to/file`)

