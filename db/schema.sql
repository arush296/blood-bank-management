-- User Table
CREATE TABLE IF NOT EXISTS "user" (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'donor', 'recipient')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Donor Table
CREATE TABLE IF NOT EXISTS donor (
  donor_id SERIAL PRIMARY KEY,
  user_id INT UNIQUE NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  age INT NOT NULL CHECK (age >= 18 AND age <= 65),
  blood_group VARCHAR(5) NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-')),
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  city VARCHAR(100),
  last_donation_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipient Table
CREATE TABLE IF NOT EXISTS recipient (
  recipient_id SERIAL PRIMARY KEY,
  user_id INT UNIQUE NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  blood_group_needed VARCHAR(5) NOT NULL CHECK (blood_group_needed IN ('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-')),
  hospital VARCHAR(100) NOT NULL,
  contact VARCHAR(20) NOT NULL,
  urgency_level VARCHAR(50) NOT NULL CHECK (urgency_level IN ('Low', 'Medium', 'High', 'Critical')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blood Request Table
CREATE TABLE IF NOT EXISTS blood_request (
  request_id SERIAL PRIMARY KEY,
  recipient_id INT NOT NULL REFERENCES recipient(recipient_id) ON DELETE CASCADE,
  units_requested INT NOT NULL CHECK (units_requested > 0),
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  urgency_flag VARCHAR(50) NOT NULL CHECK (urgency_flag IN ('Low', 'Medium', 'High', 'Critical')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Fulfilled', 'Cancelled')) DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blood Stock Table
CREATE TABLE IF NOT EXISTS blood_stock (
  stock_id SERIAL PRIMARY KEY,
  blood_group VARCHAR(5) NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-')),
  units_available INT NOT NULL CHECK (units_available >= 0) DEFAULT 0,
  expiry_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Approval Table
CREATE TABLE IF NOT EXISTS approval (
  approval_id SERIAL PRIMARY KEY,
  blood_request_id INT NOT NULL REFERENCES blood_request(request_id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
  approval_date DATE,
  admin_id INT REFERENCES "user"(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blood Issue Table
CREATE TABLE IF NOT EXISTS blood_issue (
  issue_id SERIAL PRIMARY KEY,
  blood_request_id INT NOT NULL REFERENCES blood_request(request_id) ON DELETE CASCADE,
  stock_id INT NOT NULL REFERENCES blood_stock(stock_id) ON DELETE RESTRICT,
  units_issued INT NOT NULL CHECK (units_issued > 0),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  admin_id INT REFERENCES "user"(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_donor_blood_group ON donor(blood_group);
CREATE INDEX IF NOT EXISTS idx_donor_city ON donor(city);
CREATE INDEX IF NOT EXISTS idx_recipient_blood_group ON recipient(blood_group_needed);
CREATE INDEX IF NOT EXISTS idx_blood_request_status ON blood_request(status);
CREATE INDEX IF NOT EXISTS idx_blood_request_recipient ON blood_request(recipient_id);
CREATE INDEX IF NOT EXISTS idx_blood_request_urgency ON blood_request(urgency_flag);
CREATE INDEX IF NOT EXISTS idx_blood_stock_blood_group ON blood_stock(blood_group);
CREATE INDEX IF NOT EXISTS idx_blood_stock_expiry ON blood_stock(expiry_date);
CREATE INDEX IF NOT EXISTS idx_approval_request ON approval(blood_request_id);
CREATE INDEX IF NOT EXISTS idx_approval_status ON approval(status);
CREATE INDEX IF NOT EXISTS idx_blood_issue_request ON blood_issue(blood_request_id);
CREATE INDEX IF NOT EXISTS idx_blood_issue_stock ON blood_issue(stock_id);
