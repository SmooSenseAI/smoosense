# Interactive table viewer for parquet/csv/jsonl etc

## Start in terminal
```bash
sense table /path/to/file.csv          # Open table viewer with given file
```
or open file on S3:

```bash
sense table s3://smoosense-demo/datasets/COCO2017/images-emb-2d.parquet  # Open S3 file
```

## File information for columnar formats
### Parquet row group and compression
When you care about I/O efficiency, query performance or want to optimize data processing, 
you need to pay attention to parquet row groups.
Each group stores a chunk of rows that share the same schema, and within it, each column is stored as a contiguous block.

With one click on Info icon in the top right corner, SmooSense can display parquet row group metadata, compression and writer version etc.

```gallery
height=240px
/images/screenshots/parquet_nyc_taxi_info_dark.png | Parquet info with mostly numeric data
/images/screenshots/parquet_robot_info_dark.png | Parquet info with mostly string data
```

### Lance indices and versions
[Lancedb](https://lancedb.com/) supports data mutation, schema evolution, indexing and version controls.
You can conveniently see these by clicking the Info icon in the top right corner.

```gallery
height=240px
/images/screenshots/lance_indices_tab_dark.png | Display indcies in lance table
/images/screenshots/lance_versions_tab_dark.png | Display versions along with differences in lance table
```




## Gallery
Gallery provides a convenient way to browse visual data, including images, videos, and domain-specific visualization. 

![demo](/Table?tablePath=s3://smoosense-demo/failure-analysis/yolov7-object-detection.parquet&activeTab=Gallery)


## Freeform query
When you need flexibility, SmooSense allows you to write your own SQL query using duckdb and renders the result intelligently.

![demo](/Table?tablePath=s3://smoosense-demo/failure-analysis/yolov7-object-detection.parquet&activeTab=Query)


## Editing and quick labeling
Coming