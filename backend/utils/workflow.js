const pool = require('../config/database');

const REQUEST_STATUSES = {
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  OPEN_FOR_DONORS: 'OPEN_FOR_DONORS',
  REJECTED: 'REJECTED',
  DONOR_APPLIED: 'DONOR_APPLIED',
  MATCH_APPROVED: 'MATCH_APPROVED',
  COMPLETED: 'COMPLETED'
};

const ensureWorkflowSchema = async () => {
  await pool.query(`
    ALTER TABLE blood_request
    ADD COLUMN IF NOT EXISTS blood_group_needed VARCHAR(5),
    ADD COLUMN IF NOT EXISTS hospital_location VARCHAR(120)
  `);

  await pool.query(`
    UPDATE blood_request br
    SET blood_group_needed = r.blood_group_needed
    FROM recipient r
    WHERE br.recipient_id = r.recipient_id
      AND br.blood_group_needed IS NULL
  `);

  await pool.query(`
    UPDATE blood_request br
    SET hospital_location = r.hospital
    FROM recipient r
    WHERE br.recipient_id = r.recipient_id
      AND br.hospital_location IS NULL
  `);

  await pool.query(`
    DO $$
    DECLARE c RECORD;
    BEGIN
      FOR c IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'blood_request'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%status%'
      LOOP
        EXECUTE format('ALTER TABLE blood_request DROP CONSTRAINT %I', c.conname);
      END LOOP;
    END $$;
  `);

  await pool.query(`
    UPDATE blood_request
    SET status = CASE
      WHEN status = 'Pending' THEN 'PENDING_VERIFICATION'
      WHEN status = 'Approved' THEN 'MATCH_APPROVED'
      WHEN status = 'Fulfilled' THEN 'COMPLETED'
      WHEN status = 'Cancelled' THEN 'REJECTED'
      WHEN status = 'Rejected' THEN 'REJECTED'
      ELSE status
    END
  `);

  await pool.query(`
    ALTER TABLE blood_request
    ADD CONSTRAINT blood_request_status_check
    CHECK (
      status IN (
        'PENDING_VERIFICATION',
        'OPEN_FOR_DONORS',
        'REJECTED',
        'DONOR_APPLIED',
        'MATCH_APPROVED',
        'COMPLETED'
      )
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS donation_application (
      application_id SERIAL PRIMARY KEY,
      request_id INT NOT NULL REFERENCES blood_request(request_id) ON DELETE CASCADE,
      donor_id INT NOT NULL REFERENCES donor(donor_id) ON DELETE CASCADE,
      message TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected')),
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (request_id, donor_id)
    )
  `);
};

module.exports = {
  REQUEST_STATUSES,
  ensureWorkflowSchema
};
