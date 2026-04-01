# Blood Bank System - Quick Start Guide

## 🐳 RECOMMENDED: Docker Setup (3 minutes!)

If you have Docker installed, this is the easiest way:

```bash
# Just run this ONE command from project root
docker-compose up --build

# In a NEW terminal, start frontend
cd frontend
npm run dev

# Done! Open http://localhost:3000
```

**See DOCKER_QUICK_START.md for detailed Docker instructions**

---

## Manual Setup (Without Docker) - 5 minutes

If you prefer traditional PostgreSQL installation:

```bash
# Create database
createdb blood_bank_db

# Run schema
cd db
psql blood_bank_db -f schema.sql
cd ..
```

### Step 2: Start Backend (1 min)

```bash
# Terminal 1
cd backend
npm install  # if not done
npm run dev
# Should show: "Server running on port 5000"
```

### Step 3: Start Frontend (1 min)

```bash
# Terminal 2
cd frontend
npm install  # if not done
npm run dev
# Should show: "Local: http://localhost:5173"
```

### Step 4: Test the System (2 min)

1. Open browser to `http://localhost:5173`
2. Click **Register**
3. Choose **Donor** and fill form:
   - Username: `testdonor`
   - Password: `test123456`
   - Name: `John Test`
   - Age: `30`
   - Blood Group: `O+`
   - Email: `test@email.com`
   - Phone: `9999999999`
   - Click Register

4. You should be redirected to Donor Dashboard ✅

### Step 5: Test Admin Features (Optional)

Register as **Admin** (if you have admin creation script):
- Register as **Recipient** to create blood requests
- Login as Admin to approve and issue blood

---

## 📍 Key URLs

| Component | URL |
|-----------|-----|
| Frontend | http://localhost:3000 or http://localhost:5173 |
| Backend | http://localhost:5000 |
| API Health | http://localhost:5000/health |
| Database | localhost:5432 (PostgreSQL) |

## 🔑 Default Test Credentials

After registration, use your credentials to login.

## 🆘 Troubleshooting

**"Cannot connect to database"**
```bash
# Check PostgreSQL is running
brew services list
# Start if needed
brew services start postgresql@14
```

**"Port 5000 already in use"**
```bash
# Edit backend/.env
PORT=5001  # Use different port
```

**"npm: command not found"**
- Install Node.js from nodejs.org

**"psql: command not found"**
- Add PostgreSQL to PATH or use full path: `/usr/local/bin/psql`

---

## 📱 Available Features

### Donor Dashboard
- ✅ View profile
- ✅ View donation history
- ✅ Search blood requests
- ⏳ Donation recording (admin only)

### Recipient Dashboard
- ✅ View profile
- ✅ Create blood request
- ✅ Track request status
- ✅ View request history

### Admin Dashboard
- ✅ Inventory management
- ✅ View blood stock with expiry warnings
- ✅ Blood request approvals
- ✅ System reports & analytics

---

## 📝 Next Steps

1. Explore each dashboard role
2. Create sample data (donors, recipients, requests)
3. Test approval workflow
4. Check admin reports

---

## 💡 Pro Tips

- Use `npm run dev` for both backend and frontend to enable hot reload
- Check browser console (F12) for API errors
- Check terminal for server errors
- Update `.env` files if you change database credentials

---

**Ready? Create an account and start testing! 🎉**
