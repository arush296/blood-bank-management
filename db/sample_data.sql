-- Sample Test Data for Blood Bank System
-- Run this after schema.sql to populate test data

-- Admin User
INSERT INTO "user" (username, password, role) VALUES
('admin', '$2a$10$YourHashedPasswordHere', 'admin');

-- Sample Donors
INSERT INTO "user" (username, password, role) VALUES
('donor1', '$2a$10$YourHashedPasswordHere', 'donor'),
('donor2', '$2a$10$YourHashedPasswordHere', 'donor'),
('donor3', '$2a$10$YourHashedPasswordHere', 'donor');

INSERT INTO donor (user_id, name, age, blood_group, phone, email, city, last_donation_date) VALUES
(2, 'John Smith', 35, 'O+', '9876543210', 'john@email.com', 'Mumbai', CURRENT_DATE - INTERVAL '60 days'),
(3, 'Sarah Johnson', 28, 'A+', '9876543211', 'sarah@email.com', 'Delhi', CURRENT_DATE - INTERVAL '70 days'),
(4, 'Mike Wilson', 42, 'B+', '9876543212', 'mike@email.com', 'Bangalore', NULL);

-- Sample Recipients
INSERT INTO "user" (username, password, role) VALUES
('recipient1', '$2a$10$YourHashedPasswordHere', 'recipient'),
('recipient2', '$2a$10$YourHashedPasswordHere', 'recipient');

INSERT INTO recipient (user_id, name, blood_group_needed, hospital, contact, urgency_level) VALUES
(5, 'Alice Brown', 'O+', 'City Hospital', '9876543220', 'High'),
(6, 'Bob Davis', 'A+', 'Medical Center', '9876543221', 'Critical');

-- Sample Blood Stock
INSERT INTO blood_stock (blood_group, units_available, expiry_date) VALUES
('O+', 15, CURRENT_DATE + INTERVAL '30 days'),
('O-', 8, CURRENT_DATE + INTERVAL '25 days'),
('A+', 12, CURRENT_DATE + INTERVAL '35 days'),
('A-', 5, CURRENT_DATE + INTERVAL '20 days'),
('B+', 10, CURRENT_DATE + INTERVAL '28 days'),
('B-', 3, CURRENT_DATE + INTERVAL '15 days'),
('AB+', 7, CURRENT_DATE + INTERVAL '32 days'),
('AB-', 2, CURRENT_DATE + INTERVAL '10 days');

-- Sample Blood Requests
INSERT INTO blood_request (recipient_id, units_requested, request_date, urgency_flag, status) VALUES
(1, 3, CURRENT_DATE, 'High', 'Pending'),
(2, 5, CURRENT_DATE - INTERVAL '2 days', 'Critical', 'Approved'),
(1, 2, CURRENT_DATE - INTERVAL '5 days', 'Medium', 'Fulfilled');

-- Sample Approvals
INSERT INTO approval (blood_request_id, status, approval_date, admin_id) VALUES
(2, 'Approved', CURRENT_DATE - INTERVAL '2 days', 1),
(3, 'Approved', CURRENT_DATE - INTERVAL '5 days', 1);

-- Sample Blood Issues
INSERT INTO blood_issue (blood_request_id, stock_id, units_issued, issue_date, admin_id) VALUES
(3, 1, 2, CURRENT_DATE - INTERVAL '5 days', 1);

-- Update stock after issue
UPDATE blood_stock SET units_available = 13 WHERE stock_id = 1;

-- Verify data
SELECT 'Users:' as entity, COUNT(*) as count FROM "user"
UNION ALL
SELECT 'Donors', COUNT(*) FROM donor
UNION ALL
SELECT 'Recipients', COUNT(*) FROM recipient
UNION ALL
SELECT 'Blood Requests', COUNT(*) FROM blood_request
UNION ALL
SELECT 'Blood Stock', COUNT(*) FROM blood_stock
UNION ALL
SELECT 'Approvals', COUNT(*) FROM approval
UNION ALL
SELECT 'Blood Issues', COUNT(*) FROM blood_issue;
