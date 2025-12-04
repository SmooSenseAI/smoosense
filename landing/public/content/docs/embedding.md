# Visual embedding workflow

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

### Try yourself
Zoom in and drag around, you can easily find a blue cluster where all the data is in train fold, no testing or validation at all.

![demo](/Table?tablePath=s3://smoosense-demo/datasets/COCO2017/images-emb-2d.parquet&activeTab=Plot&activePlotTab=BalanceMap&columnForGalleryVisual=coco_url&columnForGalleryCaption=fold&bubblePlotXColumn=emb_x&bubblePlotYColumn=emb_y&bubblePlotBreakdownColumn=fold)

## More
Full embedding features (search, clustering etc) are coming.
