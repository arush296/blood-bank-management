const pool = require('../config/database');
const { REQUEST_STATUSES, ensureWorkflowSchema } = require('../utils/workflow');
const { calculateRequestPriority } = require('../utils/requestPriority');

// Get Recipient Profile
const getRecipientProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM recipient WHERE recipient_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch recipient profile' });
  }
};

// Get Recipient Profile by User ID
const getRecipientProfileByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM recipient WHERE user_id = $1',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient profile not found for this user' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch recipient profile' });
  }
};

// Create Blood Request
const createBloodRequest = async (req, res) => {
  const client = await pool.connect();
  let transactionActive = false;
  try {
    await ensureWorkflowSchema();

    const {
      recipient_id,
      units_requested,
      urgency_flag,
      blood_group_needed,
      hospital_location,
      reason
    } = req.body;

    const ownerCheck = await client.query(
      'SELECT recipient_id, blood_group_needed FROM recipient WHERE user_id = $1',
      [req.user.user_id]
    );
    if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].recipient_id !== Number(recipient_id)) {
      return res.status(403).json({ error: 'You can only create requests for your own profile' });
    }

    const registeredBloodGroup = ownerCheck.rows[0].blood_group_needed;
    if (blood_group_needed && blood_group_needed !== registeredBloodGroup) {
      return res.status(400).json({
        error: `You can only request your registered blood group (${registeredBloodGroup})`
      });
    }

    const stockResult = await client.query(
      `SELECT COALESCE(SUM(units_available), 0) AS total_units
       FROM blood_stock
       WHERE blood_group = $1
         AND expiry_date >= CURRENT_DATE`,
      [registeredBloodGroup]
    );

    const availableUnits = Number(stockResult.rows[0]?.total_units || 0);
    const priority = calculateRequestPriority({
      urgencyFlag: urgency_flag,
      unitsRequested: units_requested,
      bloodGroupNeeded: registeredBloodGroup,
      availableUnits,
      reason
    });

    await client.query('BEGIN');
    transactionActive = true;

    const result = await client.query(
      `INSERT INTO blood_request
       (recipient_id, units_requested, request_date, urgency_flag, status, blood_group_needed, hospital_location, reason, priority_score, priority_label, priority_breakdown, priority_explanation)
       VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11)
       RETURNING *`,
      [
        recipient_id,
        units_requested,
        urgency_flag,
        REQUEST_STATUSES.PENDING_VERIFICATION,
        registeredBloodGroup,
        hospital_location,
        reason,
        priority.priorityScore,
        priority.priorityLabel,
        JSON.stringify(priority.priorityBreakdown),
        priority.priorityExplanation
      ]
    );

    await client.query('COMMIT');
    transactionActive = false;

    res.status(201).json({
      message: 'Blood request created successfully',
      request: result.rows[0],
      priority: {
        score: priority.priorityScore,
        label: priority.priorityLabel,
        explanation: priority.priorityExplanation,
        breakdown: priority.priorityBreakdown
      }
    });
  } catch (error) {
    if (transactionActive) {
      await client.query('ROLLBACK');
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to create blood request' });
  } finally {
    client.release();
  }
};

// Get Blood Request Status
const getBloodRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM blood_request WHERE request_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch request status' });
  }
};

// Search Blood Requests
const searchBloodRequests = async (req, res) => {
  try {
    await ensureWorkflowSchema();

    const { status, urgency_flag, recipient_id, blood_group } = req.query;
    let query = `SELECT br.*, r.blood_group_needed, r.name AS recipient_name
                 FROM blood_request br
                 JOIN recipient r ON br.recipient_id = r.recipient_id
                 WHERE 1=1`;
    const values = [];

    // Donors should only see requests that match their own blood group.
    if (req.user?.role === 'donor') {
      const donorResult = await pool.query(
        'SELECT blood_group FROM donor WHERE user_id = $1',
        [req.user.user_id]
      );

      if (donorResult.rows.length === 0) {
        return res.status(404).json({ error: 'Donor profile not found for this user' });
      }

      query += ' AND r.blood_group_needed = $' + (values.length + 1);
      values.push(donorResult.rows[0].blood_group);
      query += ' AND br.status = $' + (values.length + 1);
      values.push(REQUEST_STATUSES.OPEN_FOR_DONORS);
    } else if (blood_group) {
      query += ' AND r.blood_group_needed = $' + (values.length + 1);
      values.push(blood_group);
    }

    if (status && req.user?.role !== 'donor') {
      query += ' AND br.status = $' + (values.length + 1);
      values.push(status);
    }

    if (urgency_flag) {
      query += ' AND br.urgency_flag = $' + (values.length + 1);
      values.push(urgency_flag);
    }

    if (recipient_id) {
      query += ' AND br.recipient_id = $' + (values.length + 1);
      values.push(recipient_id);
    }

    if (req.user?.role === 'donor') {
      query += ' ORDER BY COALESCE(br.priority_score, 0) DESC, br.request_date DESC';
    } else {
      query += ' ORDER BY br.request_date DESC';
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Search failed' });
  }
};

// Get Request History
const getRequestHistory = async (req, res) => {
  try {
    await ensureWorkflowSchema();

    const { recipient_id } = req.params;

    const result = await pool.query(
      `SELECT br.*, r.name as recipient_name,
              COALESCE(br.blood_group_needed, r.blood_group_needed) as blood_group_needed,
              COALESCE(br.hospital_location, r.hospital) as hospital_location
       FROM blood_request br
       JOIN recipient r ON br.recipient_id = r.recipient_id
       WHERE br.recipient_id = $1
       ORDER BY br.request_date DESC`,
      [recipient_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch request history' });
  }
};

// Get Request History by User ID
const getRequestHistoryByUserId = async (req, res) => {
  try {
    await ensureWorkflowSchema();

    const { user_id } = req.params;

    const result = await pool.query(
      `SELECT br.*, r.name as recipient_name,
              COALESCE(br.blood_group_needed, r.blood_group_needed) as blood_group_needed,
              COALESCE(br.hospital_location, r.hospital) as hospital_location
       FROM blood_request br
       JOIN recipient r ON br.recipient_id = r.recipient_id
       WHERE r.user_id = $1
       ORDER BY br.request_date DESC`,
      [user_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch request history' });
  }
};

module.exports = {
  getRecipientProfile,
  getRecipientProfileByUserId,
  createBloodRequest,
  getBloodRequestStatus,
  searchBloodRequests,
  getRequestHistory,
  getRequestHistoryByUserId
};
