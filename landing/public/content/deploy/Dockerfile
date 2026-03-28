FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir smoosense gunicorn

COPY app.py .

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "1", "--timeout", "120", "app:app"]
