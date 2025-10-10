# 🚀 Production Deployment Guide - ADAF Dashboard Pro

**Fortune 500 Grade Production Ready System**

## 🎯 **DEPLOYMENT OVERVIEW**

### **Sistema Dual Integrado**
- **ADAF Dashboard Pro** (Puerto 3000) - Dashboard principal
- **LAV-ADAF Sistema** (Puerto 3005) - 30+ agentes cuantitativos
- **Base de datos PostgreSQL** con replicación y backup
- **Redis Cluster** para cache y cola de mensajes
- **Nginx** como reverse proxy y load balancer

---

## 📋 **PRE-DEPLOYMENT CHECKLIST**

### ✅ **Verificaciones Obligatorias**
- [ ] Tests pasando >95% (ver: `motor-del-dash/documentacion/TESTING_COVERAGE_REPORT.md`)
- [ ] Build exitoso sin warnings
- [ ] Variables de entorno configuradas
- [ ] Certificados SSL/TLS preparados
- [ ] Backup de base de datos creado
- [ ] Monitoreo configurado

### ✅ **Infraestructura Mínima**
- **CPU**: 4+ cores per service
- **RAM**: 8GB+ per service  
- **Disk**: 100GB+ SSD storage
- **Network**: 1Gbps+ bandwidth
- **OS**: Linux (Ubuntu 22.04+ recomendado)

---

## 🐳 **DOCKER DEPLOYMENT**

### **Método 1: Deployment Completo con Docker Compose**

#### 1️⃣ **Preparar Variables de Entorno**
```bash
# Copiar y configurar variables
cp .env.example .env.production

# Configurar variables críticas
export NODE_ENV=production
export DATABASE_URL="postgresql://adaf_user:${POSTGRES_PASSWORD}@postgres-primary:5432/adaf_dashboard"
export REDIS_URL="redis://redis-cluster:6379"
export NEXT_PUBLIC_API_URL="https://your-domain.com/api"
```

#### 2️⃣ **Lanzar Stack Completo**
```bash
# Construir y lanzar todos los servicios
docker-compose -f docker-compose.prod.yml up -d

# Verificar estado
docker-compose ps
```

#### 3️⃣ **Verificar Deployment**
```bash
# Health checks
curl https://your-domain.com/api/health
curl https://your-domain.com:3005/api/health

# Ver logs
docker-compose logs -f adaf-dashboard
docker-compose logs -f lav-adaf-system
```

### **Método 2: Kubernetes Deployment (Enterprise)**

#### 1️⃣ **Apply Manifests**
```bash
# Namespace y secrets
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml

# Database y cache
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml

# Aplicaciones
kubectl apply -f k8s/adaf-dashboard.yaml
kubectl apply -f k8s/lav-adaf-system.yaml

# Ingress y servicios
kubectl apply -f k8s/ingress.yaml
```

#### 2️⃣ **Verificar Deployment K8s**
```bash
# Ver pods
kubectl get pods -n adaf-system

# Ver servicios
kubectl get svc -n adaf-system

# Health checks
kubectl exec -it adaf-dashboard-xxx -n adaf-system -- curl localhost:3000/api/health
```

---

## 🔧 **CONFIGURACIÓN DE PRODUCCIÓN**

### **Database Configuration (PostgreSQL)**
```sql
-- Configuraciones críticas para producción
ALTER SYSTEM SET max_connections = '200';
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
ALTER SYSTEM SET random_page_cost = '1.1';
SELECT pg_reload_conf();
```

### **Redis Configuration**
```redis
# /etc/redis/redis.conf
maxmemory 4gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
```

### **Nginx Configuration**
```nginx
# /etc/nginx/sites-available/adaf-dashboard
upstream adaf_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001 backup;
}

upstream lav_backend {
    server 127.0.0.1:3005;
    server 127.0.0.1:3006 backup;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://adaf_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /lav/ {
        proxy_pass http://lav_backend/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📊 **MONITORING Y OBSERVABILIDAD**

### **Prometheus Configuration**
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'adaf-dashboard'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'

  - job_name: 'lav-adaf-system'
    static_configs:
      - targets: ['localhost:3005']
    metrics_path: '/api/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']
```

### **Grafana Dashboards**
```bash
# Importar dashboards predefinidos
curl -X POST \
  http://grafana:3000/api/dashboards/db \
  -H 'Content-Type: application/json' \
  -d @grafana/adaf-dashboard.json
```

### **Alerting Rules**
```yaml
# alerts.yml
groups:
  - name: adaf.rules
    rules:
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High response time detected

      - alert: DatabaseConnectionError
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: Database connection failed
```

---

## 🛡️ **SECURITY CONFIGURATION**

### **SSL/TLS Setup**
```bash
# Generar certificados con Let's Encrypt
certbot --nginx -d your-domain.com -d lav.your-domain.com

# Renovación automática
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

### **Security Headers**
```nginx
# Agregar a nginx.conf
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header Referrer-Policy strict-origin-when-cross-origin always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'" always;
```

### **Firewall Configuration**
```bash
# UFW configuration
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Fail2ban for additional protection
apt-get install fail2ban
systemctl enable fail2ban
```

---

## 📦 **CI/CD PIPELINE**

### **GitHub Actions Workflow**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test --coverage
      - run: pnpm build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/')
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        run: |
          ssh production-server "cd /opt/adaf && git pull && docker-compose -f docker-compose.prod.yml up -d --build"
```

### **Deployment Scripts**
```bash
#!/bin/bash
# deploy.sh - Script de deployment automatizado

set -e

echo "🚀 Starting ADAF Dashboard Pro deployment..."

# 1. Backup actual
echo "📦 Creating backup..."
./scripts/backup-database.sh

# 2. Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# 3. Build and deploy
echo "🔨 Building and deploying..."
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Health check
echo "🔍 Running health checks..."
sleep 30
curl -f http://localhost:3000/api/health || exit 1
curl -f http://localhost:3005/api/health || exit 1

echo "✅ Deployment completed successfully!"
```

---

## 🔄 **BACKUP Y RECOVERY**

### **Database Backup**
```bash
#!/bin/bash
# backup-database.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/backups/adaf_backup_$DATE.sql"

pg_dump -h postgres-primary -U adaf_user adaf_dashboard > $BACKUP_FILE
gzip $BACKUP_FILE

# Upload to S3 (optional)
aws s3 cp $BACKUP_FILE.gz s3://adaf-backups/database/

echo "Backup completed: $BACKUP_FILE.gz"
```

### **Disaster Recovery Procedure**
```bash
# 1. Stop services
docker-compose -f docker-compose.prod.yml down

# 2. Restore database
gunzip -c /backups/adaf_backup_latest.sql.gz | psql -h postgres-primary -U adaf_user -d adaf_dashboard

# 3. Restart services
docker-compose -f docker-compose.prod.yml up -d

# 4. Verify functionality
./scripts/health-check.sh
```

---

## 📈 **SCALING CONFIGURATION**

### **Horizontal Scaling**
```yaml
# docker-compose.prod.yml - Múltiples instancias
services:
  adaf-dashboard:
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
```

### **Load Balancer Configuration**
```nginx
upstream adaf_cluster {
    least_conn;
    server adaf-1:3000 weight=3;
    server adaf-2:3000 weight=3;
    server adaf-3:3000 weight=2;
}
```

---

## 🔧 **TROUBLESHOOTING**

### **Common Issues**

#### 🔴 **Database Connection Issues**
```bash
# Check connection
docker exec -it adaf_postgres_primary psql -U adaf_user -d adaf_dashboard -c "SELECT version();"

# Reset connections
docker restart adaf_postgres_primary
```

#### 🔴 **Memory Issues**
```bash
# Check memory usage
docker stats
free -h

# Restart services if needed
docker-compose restart
```

#### 🔴 **SSL Certificate Issues**
```bash
# Renew certificates
certbot renew --force-renewal
nginx -s reload
```

---

## 📞 **POST-DEPLOYMENT VERIFICATION**

### **Checklist Final**
- [ ] ✅ Dashboard principal accesible (https://your-domain.com)
- [ ] ✅ LAV-ADAF sistema accesible (https://your-domain.com/lav)
- [ ] ✅ Health checks pasando (`/api/health`)
- [ ] ✅ Base de datos conectada y funcional
- [ ] ✅ Redis cache funcionando
- [ ] ✅ Logs sin errores críticos
- [ ] ✅ Métricas siendo recolectadas
- [ ] ✅ Alertas configuradas y funcionando
- [ ] ✅ Backup automatizado funcionando
- [ ] ✅ SSL/TLS certificados válidos

### **Performance Verification**
```bash
# Load testing
ab -n 1000 -c 10 https://your-domain.com/api/health

# Response time check
curl -w "@curl-format.txt" -o /dev/null https://your-domain.com/
```

---

## 🎯 **MAINTENANCE SCHEDULE**

### **Daily**
- Monitor system health dashboard
- Check log files for errors
- Verify backup completion

### **Weekly**
- Update security patches
- Review performance metrics
- Clean old log files

### **Monthly**
- Full system backup test
- Security audit
- Performance optimization review

---

**🚀 Sistema enterprise completamente preparado para producción con alta disponibilidad, seguridad y escalabilidad.**
