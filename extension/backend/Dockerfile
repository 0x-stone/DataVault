FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    wget \
    unzip \
    gnupg \
    libglib2.0-0 \
    libnss3 \
    libfontconfig1 \
    libxss1 \
    libasound2 \
    libxtst6 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libdrm2 \
    libgbm1 \
    && rm -rf /var/lib/apt/lists/*


RUN pip install --upgrade --quiet playwright unstructured

RUN  playwright install

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . /app/

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]

