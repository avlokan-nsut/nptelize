FROM python:3.13-slim

WORKDIR /server

RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    zbar-tools \
    libmagic-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

# TODO: add a non root user

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
