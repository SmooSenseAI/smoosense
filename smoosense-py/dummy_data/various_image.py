import os
from pathlib import Path

import pandas as pd
from PIL import Image

PWD = os.path.dirname(os.path.abspath(__file__))


class VariousImageDataGenerator:
    def __init__(self):
        self.output_dir = os.path.join(PWD, "../../data")
        self.images_dir = os.path.join(PWD, "../../data/images")

    def generate(self):
        os.makedirs(self.output_dir, exist_ok=True)

        rows = []
        images_path = Path(self.images_dir)

        for image_file in images_path.glob("*.jpg"):
            # Skip .DS_Store and other non-image files
            if image_file.name.startswith("."):
                continue

            # Read image bytes
            with open(image_file, "rb") as f:
                image_bytes = f.read()

            # Get image dimensions
            img = Image.open(image_file)
            width, height = img.size

            # Get file size
            size = os.path.getsize(image_file)

            # Create row
            row = {
                "filename": image_file.name,
                "image_url": f"https://cdn.smoosense.ai/demo/sizes/{image_file.name}",
                "r2_url": f"s3://smoosense-cdn/demo/sizes/{image_file.name}",
                "s3_url": f"s3://smoosense-demo/images/sizes/{image_file.name}",
                "rel_url": f"./images/{image_file.name}",
                "image_bytes": image_bytes,
                "width": width,
                "height": height,
                "size": size,
            }
            rows.append(row)

        # Create DataFrame and save
        df = pd.DataFrame(rows)
        output_path = os.path.join(self.output_dir, "images.parquet")
        df.to_parquet(output_path, index=False)

        print(f"Generated {len(rows)} rows")
        print(f"Saved to {output_path}")


if __name__ == "__main__":
    generator = VariousImageDataGenerator()
    generator.generate()
