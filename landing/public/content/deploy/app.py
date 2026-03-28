"""
SmooSense deployment entry point.

Set environment variables for S3 and Auth0 as needed.
"""

import os

from smoosense.app import SmooSenseApp

smoosense = SmooSenseApp()

# Flask app object for use with gunicorn:
#   gunicorn "app:app"
app = smoosense.create_app()

if __name__ == "__main__":
    smoosense.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8000")))
