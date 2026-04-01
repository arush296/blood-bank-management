const pool = require('../config/database');

// Get System Summary Statistics
const getSummary = async (req, res) => {
  try {
    const stats = {};

    // Total donors
    const donorCount = await pool.query('SELECT COUNT(*) FROM donor');
    stats.total_donors = parseInt(donorCount.rows[0].count);

    // Total recipients
    const recipientCount = await pool.query('SELECT COUNT(*) FROM recipient');
    stats.total_recipients = parseInt(recipientCount.rows[0].count);

    // Total blood requests
    const requestCount = await pool.query('SELECT COUNT(*) FROM blood_request');
    stats.total_requests = parseInt(requestCount.rows[0].count);

    // Fulfilled requests
    const fulfilledCount = await pool.query(
      "SELECT COUNT(*) FROM blood_request WHERE status = 'Fulfilled'"
    );
    stats.fulfilled_requests = parseInt(fulfilledCount.rows[0].count);

    // Total units issued
    const unitsIssued = await pool.query('SELECT SUM(units_issued) FROM blood_issue');
    stats.total_units_issued = parseInt(unitsIssued.rows[0].sum) || 0;

    // Total stock available
    const totalStock = await pool.query('SELECT SUM(units_available) FROM blood_stock');
    stats.total_stock_available = parseInt(totalStock.rows[0].sum) || 0;

    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
};

// Get Blood Usage Analytics
const getBloodUsage = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT bs.blood_group, bs.units_available as current_stock,
              COALESCE(SUM(bi.units_issued), 0) as units_issued
       FROM blood_stock bs
       LEFT JOIN blood_issue bi ON bs.blood_group = (SELECT blood_group FROM blood_stock WHERE stock_id = bi.stock_id)
       GROUP BY bs.blood_group, bs.units_available
       ORDER BY bs.blood_group`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch blood usage data' });
  }
};

// Get Donor Statistics
const getDonorStats = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT blood_group, COUNT(*) as donor_count, AVG(age) as avg_age
       FROM donor
       GROUP BY blood_group
       ORDER BY blood_group`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch donor statistics' });
  }
};

// Get Recipient Statistics
const getRecipientStats = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT blood_group_needed, urgency_level, COUNT(*) as count
       FROM recipient
       GROUP BY blood_group_needed, urgency_level
       ORDER BY blood_group_needed, urgency_level`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch recipient statistics' });
  }
};

// Get Filtered Reports
const getFilteredReports = async (req, res) => {
  try {
    const { from_date, to_date, blood_group, status } = req.query;

    let query = `SELECT br.*, r.name as recipient_name, r.blood_group_needed, a.status as approval_status
                 FROM blood_request br
                 JOIN recipient r ON br.recipient_id = r.recipient_id
                 LEFT JOIN approval a ON br.request_id = a.blood_request_id
                 WHERE 1=1`;
    const values = [];

    if (from_date) {
      query += ' AND br.request_date >= $' + (values.length + 1);
      values.push(from_date);
    }

    if (to_date) {
      query += ' AND br.request_date <= $' + (values.length + 1);
      values.push(to_date);
    }

    if (blood_group) {
      query += ' AND r.blood_group_needed = $' + (values.length + 1);
      values.push(blood_group);
    }

    if (status) {
      query += ' AND br.status = $' + (values.length + 1);
      values.push(status);
    }

    query += ' ORDER BY br.request_date DESC';

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch filtered reports' });
  }
};

// Get Request Status Distribution
const getRequestStatusDistribution = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT status, COUNT(*) as count
       FROM blood_request
       GROUP BY status
       ORDER BY status`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch request status distribution' });
  }
};

module.exports = {
  getSummary,
  getBloodUsage,
  getDonorStats,
  getRecipientStats,
  getFilteredReports,
  getRequestStatusDistribution
};
