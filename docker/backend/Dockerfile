FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    tesseract-ocr \
    tesseract-ocr-ara \
    tesseract-ocr-fra \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Dépendances Python
COPY backend/requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Code backend
COPY backend/ .

# Données
COPY backend/data/maliyum_data.json ./data/
COPY backend/data/ompic_companies.json ./data/
COPY backend/data/tax_rates.json ./data/

# Dossiers nécessaires
RUN mkdir -p /app/uploads /app/generated_pdfs /app/data

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/api/health')" || exit 1

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "run:app"]