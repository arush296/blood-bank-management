require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs/promises');
const path = require('path');
const pool = require('./config/database');
const { ensureWorkflowSchema } = require('./utils/workflow');

// Import routes
const authRoutes = require('./routes/auth');
const donorRoutes = require('./routes/donor');
const recipientRoutes = require('./routes/recipient');
const stockRoutes = require('./routes/stock');
const approvalRoutes = require('./routes/approval');
const reportRoutes = require('./routes/reports');
const applicationRoutes = require('./routes/application');

const app = express();

const initializeDatabase = async () => {
  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  const schemaSql = await fs.readFile(schemaPath, 'utf8');

  // Run base schema statements first so workflow migrations have required tables.
  await pool.query(schemaSql);
  await ensureWorkflowSchema();
};

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/recipients', recipientRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/applications', applicationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Blood Bank API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch((error) => {
    console.error('Database initialization failed:', error.message);
    process.exit(1);
  });
