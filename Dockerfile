FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app/backend/src

RUN apt-get update \
 && apt-get install -y --no-install-recommends gcc libpq-dev \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Preserve the repo layout so main.py's ../../../frontend path resolution
# in the static-file mounts keeps working.
COPY backend/src/         ./backend/src/
COPY backend/seed_demo.py ./backend/seed_demo.py
COPY frontend/            ./frontend/
COPY legal/               ./legal/
COPY entrypoint.sh        ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 8000

CMD ["./entrypoint.sh"]
