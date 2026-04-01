# Blood Bank System - Docker Quick Start Guide

## 🐳 Setup with Docker (RECOMMENDED - 3 minutes!)

### Prerequisites
- Docker installed ([Download here](https://www.docker.com/products/docker-desktop))
- That's it! No PostgreSQL CLI needed!

---

## 🚀 Start Everything with One Command

### Option 1: Full Stack with Docker (Backend + PostgreSQL)

```bash
# From project root directory
docker-compose up --build

# You should see output like:
# postgres | database system is ready to accept connections
# blood-bank-api | Server running on port 5000 ✅
```

**That's it! Everything is running:**
- ✅ PostgreSQL database (port 5432)
- ✅ Backend API (port 5000)
- ✅ Database schema auto-loaded
- ✅ Sample data auto-loaded

### Step 2: Start Frontend (NEW TERMINAL)

```bash
cd frontend
npm install  # Only first time
npm run dev

# Should show: http://localhost:3000 or http://localhost:5173
```

### Step 3: Test in Browser
1. Go to `http://localhost:3000`
2. Click **Register**
3. Choose **Donor** and fill form
4. Login and explore! ✅

---

## 🛑 Stop Everything

```bash
# Stop all containers
docker-compose down

# Stop and remove everything (including database)
docker-compose down -v
```

---

## 📊 Docker Commands Cheatsheet

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Stop specific service
docker-compose stop postgres

# Restart
docker-compose restart

# Remove everything and start fresh
docker-compose down -v
docker-compose up --build
```

---

## 🔍 Verify Everything is Running

```bash
# Check API is responding
curl http://localhost:5000/health
# Should return: {"status":"OK","message":"Blood Bank API is running"}

# Check database connection
docker-compose exec postgres psql -U postgres -d blood_bank_db -c "SELECT COUNT(*) FROM \"user\";"
```

---

## 🌳 Access PostgreSQL (Optional)

You don't need CLI, but if you want to connect:

```bash
# Using Docker (no PostgreSQL CLI needed!)
docker-compose exec postgres psql -U postgres -d blood_bank_db

# Then run queries like:
# SELECT * FROM donor;
# SELECT * FROM blood_request;

# Type \q to exit
```

---

## 📝 Environment Already Set Up

Docker automatically configures:
- Database host: `postgres` (inside Docker network)
- Database port: `5432`
- Username: `postgres`
- Password: `password`
- Database name: `blood_bank_db`
- Schema automatically loaded on startup
- Sample data automatically loaded on startup

**No manual setup needed!** ✅

---

## 🆘 Troubleshooting

### "Docker daemon not running"
→ Open Docker Desktop application

### "Port 5432 already in use"
```bash
# Change port in docker-compose.yml
# Change "5432:5432" to "5433:5432" (or any available port)
```

### "Port 5000 already in use"
```bash
# Change port in docker-compose.yml
# Change "5000:5000" to "5001:5000" (or any available port)
```

### "Cannot connect to backend"
```bash
# Check if containers are running
docker-compose ps

# View error logs
docker-compose logs backend
```

### "Schema didn't load"
```bash
# Restart fresh
docker-compose down -v
docker-compose up --build
```

---

## ✨ Advantages of Docker Setup

✅ **No PostgreSQL Installation** - Just Docker
✅ **Auto-loaded Schema** - No manual SQL commands
✅ **Auto-loaded Sample Data** - Ready to test immediately
✅ **Isolated Environment** - Doesn't affect your system
✅ **Easy to Reset** - Just run `docker-compose down -v`
✅ **Works on Mac/Linux/Windows**
✅ **Production-like Setup** - Uses alpine (lightweight)
✅ **Other developers can use same setup**

---

## 📊 What Docker Gives You

```
Before (Manual PostgreSQL):
├── Install PostgreSQL CLI
├── Start PostgreSQL service
├── Create database
├── Run schema.sql manually
├── Load sample data manually
└── Remember how to connect

Now (Docker):
├── Run: docker-compose up --build
└── Done! Everything works!
```

---

## 🎯 Workflow

```bash
# Day 1: Initial setup
docker-compose up --build

# Day 2-N: Just start
docker-compose up

# When done
docker-compose down

# Fresh start if needed
docker-compose down -v
docker-compose up --build
```

---

## 🔄 Switching Between Docker and Manual Setup

Both work! But Docker is recommended:

| Task | Docker | Manual |
|------|--------|--------|
| Setup | `docker-compose up` | PostgreSQL CLI + SQL |
| Database Management | `docker-compose exec postgres psql` | Direct PostgreSQL |
| Reset | `docker-compose down -v` | Manual drop/create |
| Easy for teammates | ✅ Same setup | ❌ Each installs PostgreSQL |

---

## 📚 Next Steps

1. Install Docker if not already (5 min)
2. Run `docker-compose up --build` (3 min)
3. Run frontend in new terminal (1 min)
4. Test in browser (1 min)

**Total: ~10 minutes to full working system!**

---

## ❓ FAQ

**Q: Do I need to install PostgreSQL?**
A: No! Docker handles it all.

**Q: Can I access the database?**
A: Yes! Use `docker-compose exec postgres psql ...` (no CLI needed)

**Q: How do I backup my data?**
A: Docker volumes persist. To keep it: don't run `docker-compose down -v`

**Q: Can I use this in production?**
A: This setup is for development. Production needs: stronger passwords, no volume mounting, proper secrets management.

**Q: What if I prefer manual PostgreSQL?**
A: See QUICK_START.md for manual setup instructions.

---

**Ready? Run: `docker-compose up --build`** 🚀
