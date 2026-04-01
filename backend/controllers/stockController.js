const pool = require('../config/database');

// Get All Blood Stock
const getAllStock = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM blood_stock ORDER BY blood_group'
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch blood stock' });
  }
};

// Get Stock by Blood Group
const getStockByBloodGroup = async (req, res) => {
  try {
    const { blood_group } = req.params;

    const result = await pool.query(
      'SELECT * FROM blood_stock WHERE blood_group = $1',
      [blood_group]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stock not found for this blood group' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch stock' });
  }
};

// Add Stock
const addStock = async (req, res) => {
  try {
    const { blood_group, units, expiry_date } = req.body;

    // Check if stock exists for this blood group
    const existingStock = await pool.query(
      'SELECT * FROM blood_stock WHERE blood_group = $1',
      [blood_group]
    );

    if (existingStock.rows.length === 0) {
      // Create new stock entry
      const result = await pool.query(
        'INSERT INTO blood_stock (blood_group, units_available, expiry_date) VALUES ($1, $2, $3) RETURNING *',
        [blood_group, units, expiry_date]
      );
      return res.status(201).json({
        message: 'Stock added successfully',
        stock: result.rows[0]
      });
    } else {
      // Update existing stock
      const result = await pool.query(
        'UPDATE blood_stock SET units_available = units_available + $1, expiry_date = $2 WHERE blood_group = $3 RETURNING *',
        [units, expiry_date, blood_group]
      );
      return res.json({
        message: 'Stock updated successfully',
        stock: result.rows[0]
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add stock' });
  }
};

// Reduce Stock
const reduceStock = async (req, res) => {
  try {
    const { blood_group, units } = req.body;

    const result = await pool.query(
      'UPDATE blood_stock SET units_available = units_available - $1 WHERE blood_group = $2 AND units_available >= $1 RETURNING *',
      [units, blood_group]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Insufficient stock or blood group not found' });
    }

    res.json({
      message: 'Stock reduced successfully',
      stock: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reduce stock' });
  }
};

// Get Expiry Warnings
const getExpiryWarnings = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get stock expiring within 30 days
    const result = await pool.query(
      `SELECT * FROM blood_stock
       WHERE expiry_date BETWEEN $1 AND CURRENT_DATE + INTERVAL '30 days'
       ORDER BY expiry_date ASC`,
      [today]
    );

    res.json({
      warnings: result.rows,
      urgent: result.rows.filter(s => new Date(s.expiry_date) - new Date(today) < 7)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch expiry warnings' });
  }
};

// Get Low Stock Alerts
const getLowStockAlerts = async (req, res) => {
  try {
    const threshold = 5; // units

    const result = await pool.query(
      'SELECT * FROM blood_stock WHERE units_available < $1',
      [threshold]
    );

    res.json({
      low_stock_alerts: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch low stock alerts' });
  }
};

module.exports = {
  getAllStock,
  getStockByBloodGroup,
  addStock,
  reduceStock,
  getExpiryWarnings,
  getLowStockAlerts
};
