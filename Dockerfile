# Stage 1: Build React Frontend
FROM node:22-alpine as build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies if any (none for now)

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Code
COPY app/ ./app/

# Copy Frontend Build from Stage 1
# We place it inside app/dist so main.py can find it
COPY --from=build /app/dist ./app/dist

# Set Env to indicate Docker
ENV DOCKER_ENV=true

# Expose Port
EXPOSE 80

# Run
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80"]
