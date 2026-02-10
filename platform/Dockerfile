FROM node:18-slim

# Install Python and build dependencies
RUN apt-get update && apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Platform dependencies
COPY platform/package*.json ./platform/
WORKDIR /app/platform
RUN npm install

# Copy shared source code (Python scripts needed by Backend)
WORKDIR /app
COPY src/ ./src/
COPY requirements.txt .

# Install Python deps for assistant
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

# Copy Platform source
WORKDIR /app/platform
COPY platform/ .

# Build NestJS
RUN npm run build

# Env for DB
ENV DATABASE_PATH=/app/data/smart_factory.db

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
