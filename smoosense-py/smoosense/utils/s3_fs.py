import logging
import os
from typing import Optional
from urllib.parse import urlparse

import boto3
from pydantic import validate_call

from smoosense.utils.models import FSItem

logger = logging.getLogger(__name__)


class S3FileSystem:
    def __init__(self, s3_client: boto3.client):
        self.s3_client = s3_client

    @validate_call()
    def list_one_level(self, key: str, limit: int = 100) -> list[FSItem]:
        # Parse the S3 URL to get bucket and prefix
        parsed = urlparse(key)
        bucket = parsed.netloc
        prefix = parsed.path.lstrip("/")
        if prefix:
            prefix = prefix.rstrip("/") + "/"

        # List objects with the prefix
        paginator = self.s3_client.get_paginator("list_objects_v2")
        items = []

        for page in paginator.paginate(Bucket=bucket, Prefix=prefix, Delimiter="/"):
            # Add common prefixes (directories)
            for prefix_entry in page.get("CommonPrefixes", []):
                items.append(
                    FSItem(
                        name=os.path.basename(prefix_entry["Prefix"].rstrip("/")),
                        size=0,
                        lastModified=0,
                        isDir=True,
                    )
                )

            # Add objects (files)
            for obj in page.get("Contents", []):
                # Skip the directory marker itself
                if obj["Key"] == prefix:
                    continue
                items.append(
                    FSItem(
                        name=os.path.basename(obj["Key"]),
                        size=obj["Size"],
                        lastModified=int(obj["LastModified"].timestamp() * 1000),
                        isDir=False,
                    )
                )

            if len(items) >= limit:
                items = items[:limit]
                break

        return items

    @validate_call
    def sign_get_url(self, url: str, expires_in: int = 3600) -> str:
        # Parse the S3 URL
        parsed = urlparse(url)
        if parsed.scheme in ["http", "https"]:
            return url
        else:
            bucket = parsed.netloc
            key = parsed.path.lstrip("/")
            signed_url: str = self.s3_client.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": bucket,
                    "Key": key,
                    # S3 inconsistently omitting CORS headers for cached presigned responses when no response overrides are used.
                    "ResponseCacheControl": "no-cache",
                    "ResponseContentDisposition": "inline",
                },
                ExpiresIn=expires_in,
            )
            return signed_url

    @validate_call
    def put_file(self, url: str, content: str) -> None:
        parsed = urlparse(url)
        if parsed.scheme == "s3":
            bucket = parsed.netloc
            key = parsed.path.lstrip("/")
            self.s3_client.put_object(Bucket=bucket, Key=key, Body=content)

    @validate_call
    def read_text_file(self, url: str) -> Optional[str]:
        parsed = urlparse(url)
        if parsed.scheme == "s3":
            bucket = parsed.netloc
            key = parsed.path.lstrip("/")
            response = self.s3_client.get_object(Bucket=bucket, Key=key)
            content: str = response["Body"].read().decode("utf-8")
            return content
        return None


if __name__ == "__main__":
    s3_client = boto3.client("s3")
    for item in S3FileSystem(s3_client).list_one_level("s3://sense-table-demo"):
        print(item.model_dump())
