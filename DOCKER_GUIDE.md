# Docker Setup Guide for Blood Bank System

## Why Docker? 🐳

Docker eliminates the headache of manual PostgreSQL installation:

| Without Docker | With Docker |
|---|---|
| Install PostgreSQL | ❌ Already in container |
| Start PostgreSQL service | ❌ `docker-compose up` does it |
| Create database manually | ❌ Auto-created |
| Run SQL schema manually | ❌ Auto-loaded |
| Remember connection details | ❌ Pre-configured |
| Setup takes 10+ minutes | ✅ **Takes 1 minute** |

---

## Installation

### Install Docker

**Mac**: [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
**Windows**: [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
**Linux**: [Docker Engine](https://docs.docker.com/engine/install/)

### Verify Installation

```bash
docker --version
docker-compose --version
```

Both should show version numbers. If not, restart your system or Docker Desktop.

---

## Quick Start (One Command!)

```bash
# From project root directory
docker-compose up --build

# In a NEW terminal window
cd frontend
npm run dev

# Open http://localhost:3000
```

That's it! Everything is running. Go test your system!

---

## What Happens Behind the Scenes

```
docker-compose up --build
    ↓
┌─────────────────────────────────────┐
│ 1. Builds backend Docker image      │
│    - Installs Node.js               │
│    - Installs dependencies          │
│    - Copies code                    │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 2. Starts PostgreSQL container      │
│    - Initializes database           │
│    - Auto-runs schema.sql           │
│    - Auto-runs sample_data.sql      │
│    - Ready on port 5432             │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 3. Starts Backend container         │
│    - Connects to PostgreSQL         │
│    - Starts Node.js server          │
│    - Ready on port 5000             │
└─────────────────────────────────────┘
    ↓
✅ Everything running! Start frontend!
```

---

## File Explanations

### `docker-compose.yml`
Orchestrates two services:

**postgres service**:
- Uses official PostgreSQL 15 image
- Auto-initializes database named `blood_bank_db`
- Auto-runs `schema.sql` (creates all tables)
- Auto-runs `sample_data.sql` (loads test data)
- Persists data in volume (survives restart)
- Healthcheck ensures ready before backend starts

**backend service**:
- Builds from `backend/Dockerfile`
- Runs Node.js with npm start
- Depends on postgres (waits for healthy status)
- Mounts code for hot-reload
- Connects to postgres via network

### `backend/Dockerfile`
```dockerfile
FROM node:18-alpine          # Lightweight Node image
WORKDIR /app                 # Set working directory
COPY package*.json ./        # Copy dependencies
RUN npm install              # Install packages
COPY . .                     # Copy source code
EXPOSE 5000                  # Expose port
CMD ["npm", "run", "dev"]   # Run with auto-reload
```

---

## Common Commands

### Start System
```bash
# First time (builds images)
docker-compose up --build

# Subsequent times (uses cached images)
docker-compose up

# Run in background
docker-compose up -d
```

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs postgres

# Follow logs in real-time
docker-compose logs -f backend

# Last 50 lines
docker-compose logs --tail=50
```

### Stop System
```bash
# Stop containers (keeps data)
docker-compose stop

# Stop and remove containers (keeps data)
docker-compose down

# Stop, remove containers, and clear volume (new start next time)
docker-compose down -v
```

### Execute Commands in Container
```bash
# Connect to PostgreSQL CLI
docker-compose exec postgres psql -U postgres -d blood_bank_db

# Run npm command
docker-compose exec backend npm install axios

# See running containers
docker-compose ps
```

---

## Direct PostgreSQL Access (Optional)

You don't need to access PostgreSQL, but if you want to:

### Using docker-compose (Recommended)
```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d blood_bank_db

# List tables
\dt

# Query data
SELECT * FROM donor;
SELECT * FROM blood_request;

# Exit
\q
```

### Using pgAdmin (GUI)
If you prefer a GUI, add to `docker-compose.yml`:

```yaml
pgadmin:
  image: dpage/pgadmin4
  environment:
    PGADMIN_DEFAULT_EMAIL: admin@example.com
    PGADMIN_DEFAULT_PASSWORD: admin
  ports:
    - "5050:80"
  depends_on:
    - postgres
```

Then visit `http://localhost:5050` and login with `admin@example.com / admin`.

---

## Troubleshooting

### Issue: "Cannot connect to Docker daemon"
**Solution**: Open Docker Desktop application

### Issue: "Port 5432 is already allocated"
**Solution 1**: Stop container using the port
```bash
docker ps  # Find container ID
docker stop CONTAINER_ID
```

**Solution 2**: Use different port in `docker-compose.yml`
```yaml
postgres:
  ports:
    - "5433:5432"  # Changed 5432 → 5433
```

### Issue: "Port 5000 is already allocated"
**Solution**: Same as above, or change in docker-compose.yml:
```yaml
backend:
  ports:
    - "5001:5000"  # Changed 5000 → 5001
```

### Issue: "Exit code 1 when running database"
**Solution**: Restart fresh
```bash
docker-compose down -v
docker-compose up --build
```

### Issue: "Request refused - backend not ready"
**Solution**: Wait a few seconds (postgres needs to initialize)
```bash
# View logs to see progress
docker-compose logs -f postgres
```

### Issue: "Schema not loaded"
**Solution**: Database files must be in correct location
```bash
# Verify files exist
ls db/schema.sql      # Should exist
ls db/sample_data.sql # Should exist

# Restart fresh
docker-compose down -v
docker-compose up --build
```

### Issue: Changes to code not reflecting
**Solution**: The volume mount enables hot-reload. Try:
```bash
# If that doesn't work, rebuild
docker-compose down
docker-compose up --build
```

---

## Docker Best Practices Used

### ✅ What This Setup Does Right
- Uses `alpine` images (lightweight - only 45MB for Node)
- Uses multi-stage build concept (could optimize further)
- Proper healthchecks (waits for database to be ready)
- Volume persistence (data survives restart)
- Network isolation (post and backend communicate securely)
- Environment variables (no hardcoded secrets)
- .dockerignore (keeps images small)

### 🚀 For Production
Would need additional steps:
- Use strong passwords (not "password")
- Don't mount code (copy instead)
- Use Docker Swarm or Kubernetes
- Add monitoring and logging
- Use secrets management system
- Configure backup volumes
- Use proper SSL certificates

---

## Understanding docker-compose.yml

```yaml
version: '3.8'                  # Docker Compose version

services:                       # Define services
  postgres:
    image: postgres:15-alpine   # Use official PostgreSQL image
    container_name: blood_bank_db
    environment:                # Set environment variables
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: blood_bank_db
    ports:
      - "5432:5432"             # Map host:container port
    volumes:                     # Persistent storage
      - postgres_data:/var/lib/postgresql/data
      - ./db/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./db/sample_data.sql:/docker-entrypoint-initdb.d/02-sample_data.sql
    healthcheck:                # Wait for service to be ready
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - blood_bank_network      # Connect to network

  backend:
    build:
      context: ./backend        # Build from this directory
      dockerfile: Dockerfile    # Using this Dockerfile
    container_name: blood_bank_api
    environment:                # Backend configuration
      DB_HOST: postgres         # Use service name (auto-resolves in Docker network)
      DB_PORT: 5432
      # ... other vars ...
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy  # Wait for postgres to be healthy
    volumes:
      - ./backend:/app           # Mount code for hot-reload
      - /app/node_modules        # Don't overwrite dependencies
    networks:
      - blood_bank_network

volumes:                         # Define named volumes
  postgres_data:                 # Persists when containers restart

networks:                        # Define networks
  blood_bank_network:
    driver: bridge              # Allows service-to-service communication
```

---

## Advanced Docker Commands

### View all Docker resources
```bash
docker container ls        # List running containers
docker image ls           # List images
docker volume ls          # List volumes
docker network ls         # List networks
```

### Clean up unused resources
```bash
docker container prune     # Remove stopped containers
docker image prune        # Remove unused images
docker volume prune       # Remove unused volumes
```

### Rebuild everything from scratch
```bash
docker-compose down -v              # Remove everything
docker-compose up --build           # Build fresh
docker volume prune                 # Clean old volumes
```

### View resource usage
```bash
docker stats              # CPU/Memory usage of containers
```

---

## Integration with Development Workflow

### Daily Development
```bash
# Morning: Start system
docker-compose up

# Work on code (hot-reload works)
vim backend/routes/donor.js

# Changes are auto-reflected!
# Test in browser

# Night: Stop system
docker-compose down
```

### Team Sharing
```bash
# Everyone runs same command
docker-compose up --build

# Same PostgreSQL version (15-alpine)
# Same schema
# Same sample data
# Same environment

# No "it works on my machine" problems!
```

### Fresh Start (if database corrupted)
```bash
docker-compose down -v          # Remove volume
docker-compose up --build       # Fresh database
```

---

## Performance Tips

### Speed up rebuilds
```bash
# First build takes time (downloads images)
docker-compose up --build       # ~2-3 minutes first time

# Subsequent builds are faster (cached layers)
docker-compose down -v
docker-compose up --build       # ~10-20 seconds after
```

### Faster PostgreSQL initialization
The volume mount for SQL files auto-runs on container start:
```yaml
volumes:
  - ./db/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql  # Auto-runs
```

Files in `/docker-entrypoint-initdb.d/` automatically execute in alphabetical order.

---

## Next Steps

1. **Install Docker** (5 min)
2. **Run docker-compose** (1 min)
3. **Start frontend** (30 sec)
4. **Test in browser** (1 min)

**Total: ~7 minutes to full working system**

---

## Reference

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Node.js Docker Image](https://hub.docker.com/_/node)

---

**That's it! Docker makes everything simpler!** 🐳✨
