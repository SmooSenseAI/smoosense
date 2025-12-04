# Jupyter Notebook Installation

Install Smoosense for Jupyter Notebook:

```bash
pip install -U "smoosense[jupyter]"
```

## Usage

Use Smoosense in your Jupyter notebooks:

```python
import pandas as pd

# Example parquet file hosted online
url = 'https://cdn.smoosense.ai/datasets/COCO/bbox.parquet'
df = pd.read_parquet(url)

from smoosense.widget import Sense

Sense(df)
```

## Configure your data and/or authentication
Follow [Doc/Configuration](/docs/configuration/) to set up image/video urls and authentication.