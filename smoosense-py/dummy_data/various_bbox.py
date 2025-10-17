import os
from pathlib import Path

import pandas as pd

PWD = os.path.dirname(os.path.abspath(__file__))


class VariousBboxDataGenerator:
    def __init__(self):
        self.output_dir = os.path.join(PWD, "../../data")

    def generate(self):
        # Create data directory if it doesn't exist
        Path(self.output_dir).mkdir(parents=True, exist_ok=True)

        # Define the bbox coordinates (same for all rows)
        bbox = [300, 50, 400, 730]

        # Create rows for different image URL types
        rows = [
            {"url_type": "relative", "image_url": "./images/square.jpg", "bbox": bbox},
            {
                "url_type": "https",
                "image_url": "https://cdn.smoosense.ai/demo/sizes/square.jpg",
                "bbox": bbox,
            },
            {
                "url_type": "s3",
                "image_url": "s3://smoosense-demo/images/sizes/square.jpg",
                "bbox": bbox,
            },
        ]

        # Create DataFrame and save to parquet
        df = pd.DataFrame(rows)
        output_path = os.path.join(self.output_dir, "various_bbox.parquet")
        df.to_parquet(output_path, index=False)

        print(f"Generated {len(rows)} rows")
        print(f"Saved to {output_path}")


if __name__ == "__main__":
    generator = VariousBboxDataGenerator()
    generator.generate()
