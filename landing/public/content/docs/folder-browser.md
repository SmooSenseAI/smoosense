# Browse S3/folders and preview audios, videos, images and tables

<!-- $FEATURE_REQUEST = Need more file formats? <a target=_blank href="https://github.com/SmooSenseAI/smoosense/issues/new?assignees=slinjhu&labels=enhancement&type=Feature&title=Support file format XXX&body=Details:">Submit a feature request</a> -->

## Motivation
Working with multimodal data shouldn't feel like juggling tools.
Yet in practice, we constantly switch between folder explorers and specialized viewers,
and often copy file paths into scripts or command-line tools just to see what's inside a file.
It's distracting and interrupts the creative flow.

When the data lives on S3, everything becomes 10x harder.
Listing folders with AWS CLI is slow and unforgiving: one typo and the whole process stops.
Downloading files to your laptop takes forever, and even then you still need a mix of manual steps just to inspect them.

SmooSense removes all of this overhead.
It brings fast, seamless folder browsing and instant file previews directly to your browser,
letting you navigate and inspect S3 data with zero friction, so you can stay focused on insights, not infrastructure.

## Start in terminal
To browse a folder on your laptop, you can run

```bash
sense folder /path/to/folder               # Browse a specific folder
```
or a shortcut for browsing the current folder:
```bash
sense                                      # Browse current directory
```
You can also browse S3 "folder" from your laptop:
```bash
sense folder s3://smoosense-demo/datasets  # Browse S3 folder
```


## Browse folder structure in a tree view and preview files
FolderBrowser consists of two panels:
- Left panel – displays a tree view of the folder and file hierarchy.
- Right panel – provides a preview of table files or folders containing media assets.

### Folder navigation
If you are tired of doing `aws s3 ls ...`, try the intuitive folder navigation:

![demo](/FolderBrowser?rootFolder=s3://smoosense-demo/PreviewFiles)


### Preview media files (images, videos, audios, pdf)

${FEATURE_REQUEST}

```tabs
--- Images

SmooSense provides a gallery view that turns any image folder into a visual grid,
helping you rapidly browse, compare, and understand large collections of images without opening them one by one.

![demo](/FolderBrowser?rootFolder=s3://smoosense-demo/PreviewFiles&viewing=image-files)

--- Audio

SmooSense has built-in efficient Mel-spectrogram visualizer for audio files.

A Mel-spectrogram gives users a fast, intuitive way to understand the content of an audio file without listening to it.
By converting sound into a time-frequency heatmap, you
can instantly spot patterns such as speech, music, animal calls, or environmental noise.
Rhythms appear as repeating vertical textures, pitch changes show up as rising or falling curves,
and silence becomes empty space. With a single glance, users can grasp the structure, intensity,
and character of an audio clip, making mel-spectrograms a powerful tool for quickly exploring and comparing large
volumes of audio. For more details, refer to [Understanding the Mel Spectrogram](https://medium.com/analytics-vidhya/understanding-the-mel-spectrogram-fca2afa2ce53)

Try the example below. You may be surprised by how much intuition a Mel-spectrogram gives you before you even listen the audio.

![demo](/FolderBrowser?rootFolder=s3://smoosense-demo/PreviewFiles&viewing=audio-files)

--- Video

You can play all the videos in the page at the same time to get a quick sense of their content.

![demo](/FolderBrowser?rootFolder=s3://smoosense-demo/PreviewFiles&viewing=video-files)

--- 3D models

Preview 3d models right inside folder browser.

![demo](/FolderBrowser?rootFolder=s3://smoosense-demo/PreviewFiles&viewing=model3d)

--- PDF

You can play all the videos in the page at the same time to get a quick sense of their content.

![demo](/FolderBrowser?rootFolder=s3://smoosense-demo/PreviewFiles&viewing=media/example.pdf)

--- Mixed

You can also preview multimedia files with mixed types.

![demo](/FolderBrowser?rootFolder=s3://smoosense-demo/PreviewFiles&viewing=media)
```

### Preview data files (json, yaml)

${FEATURE_REQUEST}

```tabs
--- JSON

SmooSense integrates an interactive, tree-view JSON previewer designed to make complex data structures easy to understand at a glance.
Instead of staring at raw text, you can visually explore the hierarchy of any JSON field:
- Expand or collapse dictionaries to reveal nested keys layer by layer.
- Handle large arrays effortlessly. SmooSense displays the array's total length and shows only the first 100 items, so you get context without overwhelming the UI.
- Search across keys and values using simple keyword queries, making it easy to locate the information you care about even inside large or deeply nested structures.

This gives you an intuitive, high-level understanding of your JSON data instantly, without downloading files or writing ad-hoc scripts just to inspect structure.

![demo](/FolderBrowser?rootFolder=s3://smoosense-demo/PreviewFiles/data-files&viewing=captions_val2017.json)

--- YAML
YAML is human friendly and easy to write. It is often used to store configuration.
When the config is related to data you might want to store it with your data, and conveniently read it in one place. 

![demo](/FolderBrowser?rootFolder=s3://smoosense-demo/PreviewFiles/data-files&viewing=logging_config.yaml)

```

### Preview table files (parquet, csv, jsonl)

${FEATURE_REQUEST}

```tabs
--- Parquet

Parquet is a columnar, metadata-rich file format designed for efficient analytic workloads.
Parquet stores schema information, column statistics, and row-group metadata directly in its footer.
When you want to preview a Parquet file, such as listing columns, data types, row counts, or min/max values,
you don't need to download or read the full file.
We only needs to fetch the last few kilobytes of the object from S3, where the metadata and column statistics are stored.
This makes it possible to inspect very large Parquet files almost instantly,
because the preview is based entirely on pre-computed metadata rather than scanning the actual data.

In the example below, you are previewing a huge `7.9 GB` parquet file, with 100 million rows and more than 100 columns.

![demo](/FolderBrowser?rootFolder=s3://smoosense-demo/PreviewFiles/table-files&viewing=ClickBench-100M.parquet)

--- CSV

CSV files are not columnar, and they contain no pre-computed metadata or statistics.
Yet it is still possible to preview large CSV files stored on S3 efficiently.
SmooSense includes a built-in CSV previewer that reads only the first few kilobytes of the file and extracts just the first 10 rows.
This lightweight fetch avoids downloading the entire file, even when the file is hundreds of megabytes.
With just a quick partial read, you immediately see the column names, the general structure,
and example values, giving you a fast and frictionless sense of what the data contains before performing any deeper operations.

In the example below, you are previewing a large `812 MB` csv file.

![demo](/FolderBrowser?rootFolder=s3://smoosense-demo/PreviewFiles/table-files&viewing=OpenVid-1M.csv)

--- CSV.GZ
A csv.gz file is simply a CSV file that has been compressed using Gzip.
Gzip often reduces CSV size by 5×–20× or more, especially if the CSV contains repeated strings.

![demo](/FolderBrowser?rootFolder=s3://smoosense-demo/PreviewFiles/table-files&viewing=amazon-berkeley-images.csv.gz)

--- JSONL
JSONL (JSON Lines) is a line-delimited JSON format where each line is one independent JSON object.

It’s basically "newline-separated JSON objects".

![demo](/FolderBrowser?rootFolder=s3://smoosense-demo/PreviewFiles/table-files&viewing=licenses.jsonl)
```


### Preview text files and code scripts (markdown, python)

${FEATURE_REQUEST}

```tabs
--- Markdown
Markdown offers a format that’s easy for humans to write and for LLMs to interpret. 
It’s a natural choice for maintaining data documentation and sharing it seamlessly with AI systems.

![demo](/FolderBrowser?rootFolder=s3://smoosense-demo/PreviewFiles&viewing=readme.md)

--- Python
SmooSense also provides integrated source-code viewing. Why store code alongside data files? 
Because today, much of data transformation and feature engineering can be reliably generated by AI coding tools, 
leaving humans primarily to review and validate the results. 
Keeping the scripts together with the data ensures that transformations are fully traceable and easy to reference in the future.

![demo](/FolderBrowser?rootFolder=s3://smoosense-demo/PreviewFiles&viewing=compute_embeddings.py)

```