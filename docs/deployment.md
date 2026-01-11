# SambungChat Deployment Guide

**Version:** 0.1.0
**Last Updated:** January 11, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Bare Metal Deployment](#bare-metal-deployment)
6. [Environment Configuration](#environment-configuration)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Overview

SambungChat is designed for **easy self-hosting** on any infrastructure. This guide covers:

- **Docker Compose**: Simple single-server deployment
- **Kubernetes**: Scalable cloud deployment
- **Bare Metal**: Direct server deployment

---

## Prerequisites

### Minimum Requirements

| Resource    | Minimum               | Recommended      |
| ----------- | --------------------- | ---------------- |
| **CPU**     | 2 cores               | 4+ cores         |
| **RAM**     | 2 GB                  | 4+ GB            |
| **Storage** | 20 GB                 | 50+ GB SSD       |
| **OS**      | Linux (Ubuntu 22.04+) | Any Linux distro |

### Software Requirements

- Docker >= 24.0 (for Docker deployment)
- Kubernetes >= 1.25 (for K8s deployment)
- Node.js >= 20 OR Bun >= 1.2 (for bare metal)
- PostgreSQL >= 15 (can run in Docker)

---

## Docker Deployment

### Quick Start

1. **Clone repository**

```bash
git clone https://github.com/sambunghub/sambung-chat.git
cd sambung-chat
```

2. **Create environment file**

```bash
cp .env.example .env
nano .env
```

3. **Start services**

```bash
docker-compose up -d
```

4. **Access application**

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: sambungchat-db
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - '${POSTGRES_PORT:-5432}:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  # Backend API
  backend:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
    container_name: sambungchat-backend
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      PORT: 3000
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
      BETTER_AUTH_URL: ${PUBLIC_URL}
      CORS_ORIGIN: ${PUBLIC_URL}
    ports:
      - '3000:3000'
    depends_on:
      - postgres
    restart: unless-stopped

  # Frontend (optional - can serve static files)
  frontend:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    container_name: sambungchat-frontend
    environment:
      PUBLIC_SERVER_URL: ${PUBLIC_URL}
    ports:
      - '5173:5173'
    restart: unless-stopped

volumes:
  postgres_data:
```

### Production Dockerfile

**apps/server/Dockerfile:**

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS install
COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/
COPY packages/*/package.json ./packages/*/
RUN bun install --frozen-lockfile

# Build
FROM base AS build
COPY --from=install /app /app
COPY . .
RUN bun run build

# Production image
FROM base AS release
COPY --from=build /app/apps/server/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/*/node_modules ./packages/*/node_modules

EXPOSE 3000
CMD ["bun", "run", "start"]
```

---

## Kubernetes Deployment

### Namespace

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: sambungchat
```

### ConfigMap

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: sambungchat-config
  namespace: sambungchat
data:
  POSTGRES_DB: sambungchat
  POSTGRES_USER: postgres
  POSTGRES_PORT: '5432'
```

### Secret

```yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: sambungchat-secret
  namespace: sambungchat
type: Opaque
data:
  POSTGRES_PASSWORD: cGFzc3dvcmQ= # base64 encoded
  BETTER_AUTH_SECRET: eW91ci1zZWNyZXQ=
```

### PostgreSQL Deployment

```yaml
# postgres.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: sambungchat
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          env:
            - name: POSTGRES_DB
              valueFrom:
                configMapKeyRef:
                  name: sambungchat-config
                  key: POSTGRES_DB
            - name: POSTGRES_USER
              valueFrom:
                configMapKeyRef:
                  name: sambungchat-config
                  key: POSTGRES_USER
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: sambungchat-secret
                  key: POSTGRES_PASSWORD
          ports:
            - containerPort: 5432
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
    - metadata:
        name: postgres-data
      spec:
        accessModes: ['ReadWriteOnce']
        resources:
          requests:
            storage: 20Gi

---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: sambungchat
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
  clusterIP: None
```

### Backend Deployment

```yaml
# backend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: sambungchat
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          image: sambungchat/backend:latest
          env:
            - name: DATABASE_URL
              value: postgresql://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@postgres:5432/$(POSTGRES_DB)
              valueFrom:
                configMapKeyRef:
                  name: sambungchat-config
                  key: POSTGRES_USER
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: sambungchat-secret
                  key: POSTGRES_PASSWORD
            - name: BETTER_AUTH_SECRET
              valueFrom:
                secretKeyRef:
                  name: sambungchat-secret
                  key: BETTER_AUTH_SECRET
          ports:
            - containerPort: 3000
          livenessProbe:
            httpGet:
              path: /rpc/healthCheck
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /rpc/healthCheck
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: sambungchat
spec:
  selector:
    app: backend
  ports:
    - port: 3000
  type: ClusterIP
```

### Ingress

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sambungchat-ingress
  namespace: sambungchat
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-body-size: '10m'
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - chat.yourdomain.com
      secretName: sambungchat-tls
  rules:
    - host: chat.yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 3000
```

### Deploy to Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check status
kubectl get all -n sambungchat

# View logs
kubectl logs -f deployment/backend -n sambungchat
```

---

## Bare Metal Deployment

### System Setup

1. **Install dependencies**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (or Bun)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2
```

2. **Create database**

```bash
sudo -u postgres psql
CREATE DATABASE sambungchat;
CREATE USER sambungchat WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE sambungchat TO sambungchat;
\q
```

3. **Clone and setup**

```bash
# Clone repository
git clone https://github.com/sambunghub/sambung-chat.git
cd sambung-chat

# Install dependencies
bun install

# Setup environment
cp .env.example .env
nano .env

# Build application
bun run build

# Push database schema
bun run db:push
```

4. **Run with PM2**

```bash
# Start backend
pm2 start apps/server/dist/index.js --name sambungchat-backend

# Start frontend (optional - can serve with nginx)
pm2 start "bun run dev:web" --name sambungchat-frontend

# Save PM2 config
pm2 save
pm2 startup
```

5. **Configure Nginx**

```nginx
# /etc/nginx/sites-available/sambungchat
server {
    listen 80;
    server_name chat.yourdomain.com;

    # Frontend (static files)
    location / {
        root /path/to/sambung-chat/apps/web/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /rpc {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

6. **Enable site**

```bash
sudo ln -s /etc/nginx/sites-available/sambungchat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

7. **SSL with Certbot**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d chat.yourdomain.com
```

---

## Environment Configuration

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=https://yourdomain.com

# CORS
CORS_ORIGIN=https://yourdomain.com

# Frontend
PUBLIC_SERVER_URL=https://yourdomain.com
```

### Optional Variables

```bash
# AI Provider Keys (stored in DB, can also be set here)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Email (future)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-password

# Redis (future - for caching)
REDIS_URL=redis://localhost:6379
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check API health
curl https://yourdomain.com/rpc/healthCheck

# Check database connection
psql $DATABASE_URL -c "SELECT 1"
```

### Logs

```bash
# Docker logs
docker-compose logs -f backend

# Kubernetes logs
kubectl logs -f deployment/backend -n sambungchat

# PM2 logs
pm2 logs sambungchat-backend
```

### Backups

#### Database Backup

```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
mkdir -p $BACKUP_DIR

pg_dump $DATABASE_URL > "$BACKUP_DIR/sambungchat_$DATE.sql"

# Keep last 7 days
find $BACKUP_DIR -name "sambungchat_*.sql" -mtime +7 -delete
```

#### Restore

```bash
psql $DATABASE_URL < /backups/postgres/sambungchat_20260111_120000.sql
```

### Updates

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
bun install

# Rebuild
bun run build

# Run migrations
bun run db:migrate

# Restart services
pm2 restart all
# or
kubectl rollout restart deployment/backend -n sambungchat
```

---

## Troubleshooting

### Database Connection Issues

**Problem**: `connection refused` or `timeout`

**Solutions**:

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U postgres -h localhost -p 5432

# Check firewall
sudo ufw allow 5432/tcp
```

### High Memory Usage

**Problem**: Application using too much memory

**Solutions**:

```bash
# Check memory usage
free -h

# Limit Node.js memory
NODE_OPTIONS="--max-old-space-size=512m" bun run dev

# For Docker, add to docker-compose.yml:
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

### Slow Performance

**Problem**: Application is slow

**Solutions**:

```bash
# Check database query performance
bun run db:studio

# Enable query logging in Drizzle

# Add indexes to slow columns

# Use caching (Redis) for frequently accessed data
```

---

## Security Best Practices

1. **Use HTTPS** in production
2. **Set secure cookies** (httpOnly, secure, sameSite)
3. **Rotate secrets** regularly
4. **Limit database permissions**
5. **Keep dependencies updated**
6. **Monitor logs** for suspicious activity
7. **Backup regularly**
8. **Use firewall** to restrict access

---

**"Sambung: Connect any AI model. Self-hosted. Privacy-first. Open-source forever."**
