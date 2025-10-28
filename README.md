# ![SmooSense](https://cdn.smoosense.ai/SmooSense-dark.svg)

[**Landing Page**](https://smoosense.ai) | [**Read Docs**](https://smoosense.ai/docs) | [![License](https://img.shields.io/github/license/SmooSenseAI/smoosense)](https://github.com/SmooSenseAI/smoosense/blob/main/LICENSE) | [![CI Status](https://github.com/SmooSenseAI/smoosense/actions/workflows/ci.yml/badge.svg)](https://github.com/SmooSenseAI/smoosense/actions/workflows/ci.yml) | [![Latest version](https://img.shields.io/pypi/v/smoosense?label=pypi-latest)](https://pypi.org/project/smoosense/) | [![Downloads](https://static.pepy.tech/personalized-badge/smoosense?period=total&units=international_system&left_color=black&right_color=MAGENTA&left_text=downloads)](https://pepy.tech/project/smoosense)

SmooSense is a web-based application for exploring and analyzing large-scale multi-modal tabular data. 
It provides an intuitive interface for working with CSV, Parquet, and other data formats with powerful SQL querying capabilities.


## Feature highlights
- Natively visualize multimodal data (images, videos, json, bbox, image mask, 3d assets etc)
- Effortlessly look at distribution. Automatic drill-through from statistics to random samples.
- Graphical and interactive slice-n-dice of your dataset.
- Large scale support for 100 million rows on your laptop.
- Easy to integrate; SmooSense directly work with table file (parquet, csv, jsonl, etc)
- Low cost. Free and open source to use on your laptop. Compute efficient when deployed.

Read more: <https://smoosense.ai>

## How to use
### CLI
Install [uv](https://docs.astral.sh/uv/#highlights), and then
```bash
uv tool install -U smoosense
```
In terminal, `cd` into the folder containing your data files, and then run `sense`

### Jupyter Notebook
```bash
pip install -U "smoosense[jupyter]"
```
Inside Jupyter notebook:
```python
from smoosense.widget import Sense
import pandas as pd
import numpy as np

df = pd.DataFrame(np.random.randn(500, 5), columns=["a", "b", "c", "d", "e"])

Sense(df)  # Displays automatically in Jupyter
```

## License

SmooSense Python SDK is licensed under **Apache 2.0**.

This is a permissive open source license that allows you to:
- ✅ Use SmooSense for any purpose, including commercial use
- ✅ Modify and distribute the software
- ✅ Use it in proprietary software
- ✅ Deploy it in production environments
- ✅ Include it as a dependency in your projects

See the full [LICENSE](LICENSE) file for complete terms and conditions.
