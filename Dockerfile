# Kreator Wideo Nieruchomości — Remotion + Flask
FROM node:20-slim

# Chrome dependencies for Remotion
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv \
    chromium \
    fonts-liberation fonts-noto-color-emoji \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libxcomposite1 libxdamage1 libxrandr2 libgbm1 \
    libpango-1.0-0 libcairo2 libasound2 libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

# Tell Remotion/Puppeteer where Chrome is
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROMIUM_PATH=/usr/bin/chromium

WORKDIR /app

# Node dependencies
COPY package.json package-lock.json ./
RUN npm ci --production

# Python dependencies
COPY requirements.txt ./
RUN python3 -m pip install --no-cache-dir --break-system-packages -r requirements.txt

# App code
COPY . .

# Directories for uploads and renders
RUN mkdir -p public/uploads out

EXPOSE 5558

CMD ["python3", "server.py"]
