# Exploratory data analysis (EDA) for multimodal data 

<!-- $TABLE_BASE = /Table?tablePath=s3://smoosense-demo/failure-analysis/yolov7-object-detection.parquet -->

Exploring your data shouldn't feel like work.
SmooSense turns EDA into a smooth, visual experience — instantly showing distributions, patterns,
and anomalies across all your tables, images, and embeddings.
No setup, no scripts, no context-switching.
Just open your dataset and start seeing what matters.

When exploration is effortless, insight comes naturally. 
SmooSense removes friction so you can follow your curiosity.
It’s the fastest way to build an accurate mental model of your data.

Whether you’re debugging a model, preparing a dataset, or just trying to understand what you have, SmooSense gives you clarity at a glance. Clean design, instant feedback, and intelligent visualizations let you get answers without wrestling with tools. Explore more, understand deeper, and make better decisions — effortlessly.
## Mini plots of distributions
SmooSense automatically computes and visualizes the distribution of each column directly within the column headers.
These mini-plots are designed to convey key statistical insights at a glance — without overwhelming you.

Some examples:
- The pie chart indicates percentage of null values vs non-null values.
    - ![inline](/images/screenshots/table_header_stats_iou_dark.png) has roughly 75% null values 
    - ![inline](/images/screenshots/table_header_stats_match_type_dark.png) does not have null value. 
- The distribution plots depend on data type.
    - ![inline](/images/screenshots/table_header_stats_match_type_dark.png) is categorical, 
    - ![inline](/images/screenshots/table_header_stats_iou_dark.png) is numerical. 
- Both categorical
    - ![inline](/images/screenshots/table_header_stats_filename_dark.png) has very high cardinality.
    - ![inline](/images/screenshots/table_header_stats_category_name_dark.png) has higher cardinality
    - ![inline](/images/screenshots/table_header_stats_match_type_dark.png) has 3 distinct values.
- Both numerical,
    - ![inline](/images/screenshots/table_header_stats_iou_dark.png) has a distribution around the center.
    - ![inline](/images/screenshots/table_header_stats_confidence_dark.png) has two peaks.

## Look into details and interactively slice-n-dice
Need more detail? Just click any header plot to open a full, interactive visualization. 
From there, you can slice and dice your data directly on the chart—apply a filter, 
and watch every other column instantly reshape its distribution based on your selection. 
It’s an effortless way to explore your data from multiple angles.

```gallery
height=240px
/images/screenshots/table_table_category_name_dark.png | See detailed distribution and filter by categorical values
/images/screenshots/table_table_iou_dark.png | See histogram and filter range by numerical values 
```


## Summarize distributions of all columns
People inspect column distributions whenever they need to trust their data, understand its shape, or make informed decisions. 
It’s a universal step across analytics, ML, science, finance, and operations.

The Summarize tab in SmooSense is built exactly for this workflow:
- Automatically computes and visualizes the distribution of every column, with one-click access to deeper details.
- Shows the percentage of non-null values—crucial for assessing data completeness.
- Displays key stats like approximate distinct counts, min/max values, for quick sanity checks.

The best part is that all distributions update instantly based on your filters.
Once you narrow the dataset to a subset of interest, SmooSense recomputes and shows the conditional distributions in real time, helping you understand patterns, anomalies, and relationships at a glance.

![demo](${TABLE_BASE}&activeTab=Summarize)



## Visual analytics
Visual analytics combines human intuition with computational power, creating an analysis style that is fast, intuitive, and highly exploratory.
SmooSense makes this effortless for multimodal data. 
With SmooSense, you can spot patterns you’d never notice in tables,
catch data-quality issues before they become expensive problems, 
reduce cognitive load, and dramatically accelerate decision-making.

```tabs
--- Bubble plot
Bubble plots are ideal when you want to grasp the shape and structure of extremely large datasets at a glance.
Nearby data points are grouped into compact “bubbles,” where each bubble represents a local cluster and its size reflects data density. 
This reveals high-level patterns—clusters, outliers, imbalances—without overwhelming your screen.

And unlike vibe-coded tools, SmooSense's bubble plot is engineered for scale. 
It can smoothly visualize hundreds of millions of rows, making it perfect for exploring embeddings or any pair of high-volume columns.

SmooSense also adds automatic drill-through for deeper exploration. 
When you spot an interesting region, just draw a selection around it.
SmooSense will fetch a representative random sample from that cluster and instantly show you the underlying visuals (images, videos, metadata, or any multimodal preview).

![demo](${TABLE_BASE}&activeTab=Plot&activePlotTab=BubblePlot&bubblePlotXColumn=iou&bubblePlotYColumn=confidence)

--- Heat map
Heat maps are perfect for revealing relationships, patterns, and anomalies across two categorical columns.
Each cell aggregates values from potentially hundreds of millions of rows, instantly showing you where activity concentrates, where distributions skew, and where unexpected gaps appear.

What makes SmooSense's heat map unique is its table-like design. 
You can sort rows or columns by any value, transpose the axes in a single click, and treat the visualization like an interactive table. 

When you spot an interesting cell, simply click it. 
SmooSense will drill through, fetch a random sample of the underlying records, and show you the actual content (images, audio, video, text, or structured fields). 
This turns the heat map from a static chart into a powerful gateway for understanding the data behind every pattern you see.

![demo](${TABLE_BASE}&activeTab=Plot&activePlotTab=HeatMap&heatmapXColumn=match_type&heatmapYColumn=category_name)

--- Histogram
Histograms with breakdown are one of the fastest ways to understand how values are distributed,
letting you compare multiple subgroups in the same plot. 
Whether you’re examining labels, classes, categories, or any other discrete field, 
you immediately see how different groups contribute across the range: 
where they overlap, where one dominates, and where rare or surprising patterns emerge.

Just like other visualizations in SmooSense, the histogram is fully interactive and supports on-the-fly drill-through. 
Click on any bar, or any subgroup within a bar, and SmooSense instantly fetches a random sample of underlying data points, 
showing you the actual items (images, audio clips, videos, etc.) that shape that distribution.
This makes it a powerful tool for catching distribution shifts, category imbalances, labeling errors, or simply understanding your dataset’s structure at a much deeper level.

![demo](${TABLE_BASE}&activeTab=Plot&activePlotTab=Histogram&histogramBreakdownColumn=match_type&histogramColumn=confidence)


--- Boxplot
Box plots are essential when you want to compare the distributions across different breakdown groups.

SmooSense takes them far beyond the traditional static chart. 
Instead of viewing a single box plot at a time, SmooSense displays box plots and their categorical breakdowns in an interactive table, 
allowing you to sort by any statistic: minimum, maximum, median, average, or standard deviation. 
Patterns that normally hide in raw numbers—long tails, heavy variance, inconsistent categories, or unusual spikes—become immediately visible.

And when you spot something interesting—an extreme upper tail, a compressed distribution, or a suspiciously wide spread—you can drill through with one click.
SmooSense instantly retrieves a random sample from the top or bottom 25% (or any quantile you specify) and shows the underlying multimodal assets such as images, video frames, or audio snippets. 
This makes the box-plot table a powerful tool for identifying anomalies, validating data quality, and understanding how different categories behave, all with smooth, low-friction exploration at scale.

![demo](${TABLE_BASE}&activeTab=Plot&activePlotTab=BoxPlot&boxPlotBreakdownColumn=category_name&boxPlotColumns=iou,confidence&boxPlotSortBy=std)


```

