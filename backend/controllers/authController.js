const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const register = async (req, res) => {
  const client = await pool.connect();
  let transactionActive = false;
  try {
    const { username, password, role, name, age, blood_group, phone, email, city, blood_group_needed, hospital, contact, urgency_level } = req.body;

    await client.query('BEGIN');
    transactionActive = true;

    // Check if user already exists
    const userExists = await client.query('SELECT * FROM "user" WHERE username = $1', [username]);
    if (userExists.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await client.query(
      'INSERT INTO "user" (username, password, role) VALUES ($1, $2, $3) RETURNING user_id, username, role',
      [username, hashedPassword, role]
    );

    const userId = userResult.rows[0].user_id;

    // Create profile based on role
    if (role === 'donor') {
      await client.query(
        'INSERT INTO donor (user_id, name, age, blood_group, phone, email, city) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [userId, name, age, blood_group, phone, email, city || null]
      );
    } else if (role === 'recipient') {
      await client.query(
        'INSERT INTO recipient (user_id, name, blood_group_needed, hospital, contact, urgency_level) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, name, blood_group_needed, hospital, contact, urgency_level]
      );
    }

    await client.query('COMMIT');
    transactionActive = false;

    // Generate token
    const jwtExpiry = process.env.JWT_EXPIRY || '7d';
    const token = jwt.sign(
      { user_id: userId, username, role },
      process.env.JWT_SECRET,
      { expiresIn: jwtExpiry }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { user_id: userId, username, role }
    });
  } catch (error) {
    if (transactionActive) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError.message);
      }
    }
    console.error(error);

    if (error.code === '23505') {
      if (error.constraint === 'donor_phone_key') {
        return res.status(400).json({ error: 'Phone number is already registered' });
      }
      if (error.constraint === 'donor_email_key') {
        return res.status(400).json({ error: 'Email is already registered' });
      }
      if (error.constraint === 'recipient_contact_key') {
        return res.status(400).json({ error: 'Contact number is already registered' });
      }
      if (error.constraint === 'user_username_key') {
        return res.status(400).json({ error: 'Username already exists' });
      }
      return res.status(400).json({ error: 'Duplicate value found in registration data' });
    }

    res.status(500).json({ error: 'Registration failed' });
  } finally {
    client.release();
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM "user" WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const jwtExpiry = process.env.JWT_EXPIRY || '7d';
    const token = jwt.sign(
      { user_id: user.user_id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: jwtExpiry }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
};

module.exports = {
  register,
  login
};
