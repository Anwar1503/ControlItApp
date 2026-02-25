# Quick Start Guide - Docker Setup

## One Command to Start Everything

```bash
docker compose up -d
```

That's it! All services will start automatically.

## Access Your Application

After running the compose command, wait 30 seconds for everything to initialize, then:

- **Frontend**: http://localhost (or http://127.0.0.1)
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017 (internal only)

## What Gets Started

The `docker compose up -d` command automatically starts:
1. **MongoDB** - Database (port 27017)
2. **Backend (Flask)** - API server (port 5000)
3. **Frontend (React)** - Web application (port 80)

## Useful Commands

### View logs of all services
```bash
docker compose logs -f
```

### View logs of specific service
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongodb
```

### Stop all services
```bash
docker compose down
```

### Stop and clean up everything (including data volumes)
```bash
docker compose down -v
```

### Restart a service
```bash
docker compose restart backend
```

### Rebuild after code changes
```bash
docker compose build
docker compose up -d
```

## Troubleshooting

### Services not starting?
```bash
# Check service status
docker compose ps

# View error logs
docker compose logs
```

### Can't access frontend?
- Wait 30-60 seconds for services to fully initialize
- Check if port 80 is already in use: `netstat -ano | findstr :80`
- Try: http://localhost instead of http://127.0.0.1

### MongoDB connection error?
```bash
# Restart MongoDB
docker compose restart mongodb
```

### Port already in use?
Edit `docker-compose.yml` and change the port mappings:
```yaml
services:
  frontend:
    ports:
      - "8080:80"    # Use 8080 instead of 80
```

### Need to rebuild everything fresh?
```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

## Important Notes

1. **Email/SMS Configuration**: Update your Gmail credentials in `backend/services/otp_service.py` for OTP emails to work
2. **Data Persistence**: MongoDB data is stored in Docker volume `mongodb_data`, which persists even after containers stop
3. **Port Conflicts**: If ports 80, 5000, or 27017 are in use, modify port mappings in `docker-compose.yml`
4. **Development vs Production**: Update `FLASK_DEBUG` in `docker-compose.yml` for development mode

## For Development

To enable hot-reload during development:
```bash
# Edit docker-compose.yml and change FLASK_ENV to development
FLASK_ENV=development
FLASK_DEBUG=1
```

Then rebuild and restart:
```bash
docker compose up -d --build
```

---

For detailed Docker setup information, see [DOCKER_SETUP.md](DOCKER_SETUP.md)
