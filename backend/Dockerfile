FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install dependencies first so this layer is cached when only code changes
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Run as a non-root user; /app/data holds the SQLite database
RUN useradd --create-home appuser && mkdir -p /app/data && chown -R appuser /app
USER appuser

ENV DJANGO_DB_PATH=/app/data/db.sqlite3
EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2"]
