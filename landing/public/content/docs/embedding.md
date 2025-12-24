# Visual embedding workflow
SmooSense uses [LanceDB](https://lancedb.com/) as its storage engine for embeddings and vector indexes.

LanceDB is an innovative columnar storage format built specifically for AI and vector-search workloads. 
It offers **near-zero cost at idle** while being able to **scale up rapidly under spiky or bursty query loads**, 
making it well suited for interactive and exploratory AI use cases.

## Compute or ingest embedding
To work with embedding, please install SmooSense with embedding feature

```bash
uv tool install -U "smoosense[emb]"
```

### From images
Run `sense-images ./images/*.jpg`. It will run a Python script that computes OpenAI Clip and Facebook Dino v2
embedding, creates a Lance table, builds vector index and opens it in your web browser. 

### From videos
Run `sense-videos ./videos/**/*.mp4`. It will run a Python script that computes OpenAI clip embedding for the first 
frame of the video, creates a Lance table, builds vector index and opens it in your web browser.

### From parquet files
We also provide a CIL tool to convert parquet files to lance. 
It will also detect columns having a equal-size float/double arrays, convert to pyarrow FixedSizeListArray, and build vector index in the lance file.

```bash
parquet-to-lance --help

Usage: parquet-to-lance [OPTIONS] PARQUET_PATH LANCE_PATH

  Convert a Parquet file to Lance format.

  PARQUET_PATH: Input Parquet file
  LANCE_PATH:   Output Lance table path
                • Parent directory = database
                • Basename = table name
                • Example: /db/my_table.lance → db=/db, table=my_table

  Features:
    ✦ Converts float[]/double[] to fixed-size arrays
    ✦ Builds vector index for embeddings (dim > 10)
    ✦ Appends as new version if table exists

  Examples:
    parquet-to-lance data.parquet ./my_db/my_table.lance
    parquet-to-lance emb.parquet /data/lance_db/embeddings
```

## Similarity search with embedding
SmooSense integrated vector search with [Lance index](https://docs.lancedb.com/indexing/vector-index).
When a vector index is found, you can run vector search with a single click.

![](/images/emb/emb-search.jpg)

Try yourself: [link](https://demo.smoosense.ai/Table?tablePath=s3%3A%2F%2Fsmoosense-demo%2Fembedding%2Fphotos%2Fimages_table.lance)

## Interactive UMAP visualization
[UMAP](https://umap-learn.readthedocs.io/) (Uniform Manifold Approximation and Projection) reduces high-dimensional embeddings
to 2D coordinates for visualization while preserving the structure of your data.

SmooSense computes UMAP projections on-the-fly from your embedding columns and renders them as interactive scatter plots.

### Features
- **Hover preview**: Hover over any point to see the image, audio, or video preview
- **Lasso selection**: Draw a lasso to select multiple points and view them in a gallery
- **Color by category**: Use a categorical column to color points by group (creates separate traces with legend)
- **Color by value**: Use a numerical column to color points by continuous value (uses color scale)
- **SQL filtering**: Filter data with SQL conditions before computing UMAP
- **Adjustable parameters**: Fine-tune `n_neighbors` and `min_dist` to control the projection

### Parameters
| Parameter | Range | Description |
|-----------|-------|-------------|
| `n_neighbors` | 2-100 | Controls local vs global structure. Low values (2-15) create tight clusters; high values (50-100) preserve global relationships |
| `min_dist` | 0-1 | Controls point density. Low values (0-0.1) pack points tightly; high values (0.5-1) spread them out |

### Performance
- UMAP computation runs in parallel using all CPU cores
- For large datasets (>1,000 rows), SmooSense automatically samples to keep visualization responsive
- Results include runtime and sampling info in the status bar

### Try UMAP visualization yourself
Explore image embeddings with UMAP visualization. Note that this demo only shows the interactive visualization. 
For full functionality please run SmooSense on your computer.   

```tabs
--- Images
![demo](/example/emb-images)

--- Audio
![demo](/example/emb-audio)
```


## Balance map
People turn to semantic balance analysis using embeddings when they need to understand whether their dataset is fair,
representative, and structurally complete: not just in terms of raw counts, but in terms of meaning. 
Traditional distributions can show how many samples fall into each category, but only embeddings reveal deeper patterns: 
whether certain concepts dominate, whether clusters are missing or underrepresented, 
whether two groups that "look balanced" numerically are actually very different semantically. 
This is crucial in ML, robotics, recommendation systems, audio/vision datasets, and any scenario where meaningful coverage matters more than labels alone. 

BalanceMap in SmooSense makes this effortless by visualizing embedding space as bubble plots, computes relative ratio, and colorize by the level of imbalance. 

### Ratio-based color encoding for balance
Color isn't determined by raw counts, but by relative balance across breakdowns (e.g., training/validation/test splits).
This is because groups of the breakdown inherently have different size.
Image below shows the distribution of fold.
If we colorize by counts, then you will only see information from training fold.

<img src="/images/emb/fold-distribution.jpg" width="400px" alt="fold-distribution" />

For each bubble, we compute the ratio of samples of that bubble within its breakdown group:

$$\text{ratio} = \frac{\text{count of points in bubble}}{\text{count of total points in that group}}$$

We then compare these ratios across groups:
```gallery
maxColumns=2 height=300px
/images/emb/example-balance.jpg | Example of good balance. When ratios are equal, the bubble is colored with neutral gray, indicating balance. Hovering on bubble will show detailed counts and ratios.
/images/emb/example-imbalance.jpg | Example of imbalance. When ratios differ, the color shifts toward the dominant group, making imbalances immediately visible.
```

### Try BalanceMap yourself
Zoom in and drag around, you can easily find a blue cluster where all the data is in train fold, no testing or validation at all.

![demo](/Table?tablePath=s3://smoosense-demo/datasets/COCO2017/images-emb-2d.parquet&activeTab=Plot&activePlotTab=BalanceMap&columnForGalleryVisual=coco_url&columnForGalleryCaption=fold&bubblePlotXColumn=emb_x&bubblePlotYColumn=emb_y&bubblePlotBreakdownColumn=fold)

## More
Full embedding features (search, clustering etc) are coming.
