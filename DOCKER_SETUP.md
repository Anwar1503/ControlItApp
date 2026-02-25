# Docker Setup Guide

## Prerequisites
- Docker Desktop installed (https://www.docker.com/products/docker-desktop)
- Docker Compose (included with Docker Desktop)

## Quick Start

### 1. Build and Start All Services
```bash
docker compose up -d
```

This will:
- Build the backend Flask service
- Build the frontend React service
- Start MongoDB database
- Create a network to connect all services

### 2. Access the Application
- **Frontend**: http://localhost (port 80)
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017

### 3. View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb
```

### 4. Stop All Services
```bash
docker compose down
```

### 5. Stop and Remove Everything (including volumes)
```bash
docker compose down -v
```

## Service Details

### Backend Service (Flask)
- **Port**: 5000
- **Database**: MongoDB (mongodb://admin:password@mongodb:27017/user_database)
- **Features**: 
  - OTP verification (email/SMS)
  - User registration/login
  - PC locking
  - CORS enabled

### Frontend Service (React)
- **Port**: 80
- **Build**: Production-optimized using nginx
- **API Proxy**: Configured to route /api/* requests to backend

### MongoDB Service
- **Port**: 27017
- **Credentials**: admin/password
- **Volume**: mongodb_data (persisted data)

## Environment Configuration

Update environment variables in `docker-compose.yml`:
- `MONGODB_URI`: MongoDB connection string
- `FLASK_ENV`: Set to 'development' for debugging
- `REACT_APP_API_URL`: Backend API URL for frontend

## Production Deployment

For production use:
1. Update credentials in docker-compose.yml
2. Set `FLASK_ENV=production`
3. Configure proper SSL certificates
4. Use environment files (.env) for sensitive data
5. Use Docker secrets for passwords in Swarm mode

## Troubleshooting

### Port Already in Use
If port 80, 5000, or 27017 is already in use:
```yaml
# In docker-compose.yml, change:
ports:
  - "8080:80"    # Use port 8080 instead of 80
  - "5001:5000"  # Use port 5001 instead of 5000
  - "27018:27017" # Use port 27018 instead of 27017
```

### MongoDB Connection Issues
```bash
# Check MongoDB logs
docker compose logs mongodb

# Verify MongoDB is healthy
docker compose ps

# Restart MongoDB
docker compose restart mongodb
```

### Frontend Build Issues
```bash
# Rebuild frontend
docker compose build frontend --no-cache
docker compose up -d frontend
```

### Clear Everything and Start Fresh
```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```
