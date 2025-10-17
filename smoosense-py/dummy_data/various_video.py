import os
from pathlib import Path

import pandas as pd

PWD = os.path.dirname(os.path.abspath(__file__))


class VariousVideoDataGenerator:
    def __init__(self):
        self.output_dir = os.path.join(PWD, "../../data")
        self.videos_dir = os.path.join(PWD, "../../data/videos")

    def generate(self):
        os.makedirs(self.output_dir, exist_ok=True)

        rows = []
        videos_path = Path(self.videos_dir)

        for video_file in videos_path.glob("*.mp4"):
            # Skip .DS_Store and other non-image files
            if video_file.name.startswith("."):
                continue

            # Get file size
            size = os.path.getsize(video_file)

            # Create row
            row = {
                "filename": video_file.name,
                "video_url": f"https://cdn.smoosense.ai/demo/videos/{video_file.name}",
                "r2_url": f"s3://smoosense-cdn/demo/videos/{video_file.name}",
                "s3_url": f"s3://smoosense-demo/videos/{video_file.name}",
                "rel_url": f"./videos/{video_file.name}",
                "size": size,
            }
            rows.append(row)

        # Create DataFrame and save
        df = pd.DataFrame(rows)
        output_path = os.path.join(self.output_dir, "videos.parquet")
        df.to_parquet(output_path, index=False)

        print(f"Generated {len(rows)} rows")
        print(f"Saved to {output_path}")


if __name__ == "__main__":
    generator = VariousVideoDataGenerator()
    generator.generate()
