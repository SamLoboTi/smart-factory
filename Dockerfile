FROM python:3.9-slim

WORKDIR /app

# Install system dependencies if needed (e.g. for numpy/pandas compilation)
# RUN apt-get update && apt-get install -y gcc

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/
COPY run_simulation.py .

# Environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

CMD ["python", "run_simulation.py"]
