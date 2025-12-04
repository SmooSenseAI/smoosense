# Multimodal visualization

## Built-in visualizations
SmooSense infers the best way of displaying visual contents based on the column name, type and sample values. 

### URL
A column will be inferred as URL if it is string type and has nonnull sample values starting with `http://`, `https://`, `s3://` or `./`

### ImageUrl, VideoUrl, PdfUrl, AudioUrl
URL columns have specific rendering based on their file name extension.

### Bbox
To visualize bounding box:

- Save the bounding box as list of float or integers.
- Make sure the column name contains `bbox`
- Make sure there is another column named `image_url` as the background image.

## Plug in your own visualization

If the built-in visualization is not enough, you can serve your own visualizer as an API, and integrate into SmooSense using iframe.
Strings starting with `iframe+https://` or `iframe+http://` will be recognized as iframe url. 

Here we show several examples:

### Bounding box

```
https://cdn.smoosense.ai/viz-bbox.html?
image=https://cdn.smoosense.ai/000000130579.jpg
&bboxes='[{"bbox":[176,187,64,57],"label":"GT"},{"bbox":[162,183,107,68],"label":"pred"}]'
&name=baseball glove
&autorange=true
```

<iframe width=500 height=300 src='https://cdn.smoosense.ai/viz-bbox.html?%20image=https://cdn.smoosense.ai/000000130579.jpg%20&bboxes=%27[{%22bbox%22:[176,187,64,57],%22label%22:%22GT%22},{%22bbox%22:[162,183,107,68],%22label%22:%22pred%22}]%27%20&name=baseball%20glove&autorange=true'>
</iframe>

### Robot motion using SmooViz
We will be open-sourcing a library for lightweight visualization of robot motion. Here is an example:

```
https://viz-robot-cdn.smoosense.ai/single.html?
modelName=unitree_g1
&dataUrl=https://viz-robot-cdn.smoosense.ai/unitree_g1/example.json
```

<iframe width=500 height=300 src="https://viz-robot-cdn.smoosense.ai/single.html?modelName=unitree_g1&dataUrl=https://viz-robot-cdn.smoosense.ai/unitree_g1/example.json">
</iframe>
