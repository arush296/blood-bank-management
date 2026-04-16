const pool = require('../config/database');
const { REQUEST_STATUSES, ensureWorkflowSchema } = require('../utils/workflow');

const URGENT_URGENCY_LEVELS = new Set(['HIGH', 'CRITICAL', 'VERY_URGENT', 'VERY URGENT']);

const shouldTriggerUrgentNotification = (requestRow) => {
  if (!requestRow) {
    return false;
  }

  const urgency = String(requestRow.urgency_flag || '').toUpperCase().trim();
  const score = Number(requestRow.priority_score || 0);

  return URGENT_URGENCY_LEVELS.has(urgency) || score >= 70;
};

const createDonorNotificationsForRequest = async (client, requestRow) => {
  const bloodGroupNeeded = requestRow.blood_group_needed;
  if (!bloodGroupNeeded) {
    return 0;
  }

  const severity = 'urgent';
  const title = 'Urgent Request Open For Donors';
  const message = `Request #${requestRow.request_id} for ${bloodGroupNeeded} is now approved and open. Urgency: ${requestRow.urgency_flag}.`;

  const result = await client.query(
    `INSERT INTO donor_notification (donor_id, request_id, severity, title, message, metadata)
     SELECT
       d.donor_id,
       $1::int,
       $2::varchar(20),
       $3::varchar(140),
       $4::text,
       jsonb_build_object(
         'request_id', $1::int,
         'blood_group_needed', $5::varchar(5),
         'urgency_flag', $6::varchar(20),
         'units_requested', $7::int,
         'hospital_location', COALESCE($8::text, ''),
         'priority_label', COALESCE($9::text, ''),
         'priority_score', COALESCE($10::int, 0)
       )
     FROM donor d
     WHERE d.blood_group = $5::varchar(5)
     ON CONFLICT (donor_id, request_id) DO NOTHING`,
    [
      requestRow.request_id,
      severity,
      title,
      message,
      requestRow.blood_group_needed,
      requestRow.urgency_flag,
      requestRow.units_requested,
      requestRow.hospital_location,
      requestRow.priority_label,
      requestRow.priority_score
    ]
  );

  return result.rowCount || 0;
};

// Create Approval
const createApproval = async (req, res) => {
  try {
    await ensureWorkflowSchema();
    res.status(400).json({ error: 'Use request verification and match endpoints instead' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create approval' });
  }
};

// Update Approval Status
const updateApprovalStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    await ensureWorkflowSchema();

    const { id } = req.params;
    const { status } = req.body;

    const mappedStatus = status === 'Approved' ? REQUEST_STATUSES.OPEN_FOR_DONORS : status;
    const finalStatus = mappedStatus === 'Rejected' ? REQUEST_STATUSES.REJECTED : mappedStatus;

    if (![REQUEST_STATUSES.OPEN_FOR_DONORS, REQUEST_STATUSES.REJECTED].includes(finalStatus)) {
      return res.status(400).json({ error: 'Status must be OPEN_FOR_DONORS or REJECTED' });
    }

    await client.query('BEGIN');

    const existing = await client.query(
      `SELECT request_id, status, urgency_flag, units_requested, blood_group_needed,
              hospital_location, priority_label, priority_score
       FROM blood_request
       WHERE request_id = $1
       FOR UPDATE`,
      [id]
    );
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Request not found' });
    }

    if (existing.rows[0].status !== REQUEST_STATUSES.PENDING_VERIFICATION) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Only PENDING_VERIFICATION requests can be moderated here' });
    }

    const result = await client.query(
      'UPDATE blood_request SET status = $1 WHERE request_id = $2 RETURNING *',
      [finalStatus, id]
    );

    let notificationsCreated = 0;
    if (finalStatus === REQUEST_STATUSES.OPEN_FOR_DONORS && shouldTriggerUrgentNotification(result.rows[0])) {
      notificationsCreated = await createDonorNotificationsForRequest(client, result.rows[0]);
    }

    await client.query('COMMIT');

    res.json({
      message: 'Request verification updated successfully',
      request: result.rows[0],
      notifications_created: notificationsCreated
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }
    console.error(error);
    res.status(500).json({ error: 'Failed to update approval status' });
  } finally {
    client.release();
  }
};

// Get Approval History
const getApprovalHistory = async (req, res) => {
  try {
    await ensureWorkflowSchema();

    const result = await pool.query(
      `SELECT
         br.request_id AS approval_id,
         br.request_id AS blood_request_id,
         br.status,
         br.urgency_flag,
         br.units_requested,
         br.request_date,
         br.reason,
         br.priority_score,
         br.priority_label,
         br.priority_explanation,
         COALESCE(br.blood_group_needed, r.blood_group_needed) AS blood_group_needed,
         COALESCE(br.hospital_location, r.hospital) AS hospital_location,
         r.name AS recipient_name,
         da_latest.application_id,
         da_latest.application_status,
         d.name AS donor_name,
         d.blood_group AS donor_blood_group,
         d.last_donation_date
       FROM blood_request br
       JOIN recipient r ON br.recipient_id = r.recipient_id
       LEFT JOIN LATERAL (
         SELECT
           da.application_id,
           da.donor_id,
           da.status AS application_status,
           da.updated_at
         FROM donation_application da
         WHERE da.request_id = br.request_id
         ORDER BY
           CASE
             WHEN da.status = 'Accepted' THEN 0
             WHEN da.status = 'Pending' THEN 1
             ELSE 2
           END,
           da.updated_at DESC
         LIMIT 1
       ) da_latest ON TRUE
       LEFT JOIN donor d ON da_latest.donor_id = d.donor_id
       ORDER BY br.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch approval history' });
  }
};

// Issue Blood
const issueBlood = async (req, res) => {
  const client = await pool.connect();
  try {
    await ensureWorkflowSchema();
    const { blood_request_id } = req.body;

    await client.query('BEGIN');

    const existing = await client.query('SELECT request_id, status FROM blood_request WHERE request_id = $1', [blood_request_id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Request not found' });
    }

    if (existing.rows[0].status !== REQUEST_STATUSES.MATCH_APPROVED) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Only MATCH_APPROVED requests can be marked as fulfilled' });
    }

    await client.query(
      'UPDATE blood_request SET status = $1 WHERE request_id = $2',
      [REQUEST_STATUSES.COMPLETED, blood_request_id]
    );

    // Update donor's last donation date based on accepted match for this request.
    const acceptedApplication = await client.query(
      `SELECT donor_id
       FROM donation_application
       WHERE request_id = $1 AND status = 'Accepted'
       ORDER BY updated_at DESC
       LIMIT 1`,
      [blood_request_id]
    );

    if (acceptedApplication.rows.length > 0) {
      await client.query(
        'UPDATE donor SET last_donation_date = CURRENT_DATE WHERE donor_id = $1',
        [acceptedApplication.rows[0].donor_id]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Request marked as fulfilled',
      request_id: blood_request_id,
      status: REQUEST_STATUSES.COMPLETED
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Failed to mark request as fulfilled' });
  } finally {
    client.release();
  }
};

// Get Issue History
const getIssueHistory = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT bi.*, br.urgency_flag, r.name as recipient_name, bs.blood_group
       FROM blood_issue bi
       JOIN blood_request br ON bi.blood_request_id = br.request_id
       JOIN recipient r ON br.recipient_id = r.recipient_id
       JOIN blood_stock bs ON bi.stock_id = bs.stock_id
       ORDER BY bi.issue_date DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch issue history' });
  }
};

module.exports = {
  createApproval,
  updateApprovalStatus,
  getApprovalHistory,
  issueBlood,
  getIssueHistory
};
