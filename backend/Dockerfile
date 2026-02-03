FROM python:3.12-slim

WORKDIR /app
COPY . /app/

# Keep base image patched (notably OpenSSL CVEs flagged by Snyk)
RUN apt-get update \
 && apt-get install --only-upgrade -y openssl libssl3t64 \
 && apt-get dist-upgrade -y \
 && apt-get autoremove -y \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
