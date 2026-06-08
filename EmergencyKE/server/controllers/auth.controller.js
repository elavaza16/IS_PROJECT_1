const db     = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/email');

exports.register = async (req, res) => {
  const { full_name, email, phone, password } = req.body;

  if (!full_name || !email || !phone || !password)
    return res.status(400).json({ error: 'All fields are required.' });

  try {
    const [existing] = await db.query(
      'SELECT user_id FROM users WHERE email = ?', [email]
    );
    if (existing.length > 0)
      return res.status(409).json({ error: 'Email is already registered.' });

    const password_hash = await bcrypt.hash(password, 12);

    // Generate verification token — expires in 24 hours
    const token      = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.query(
      `INSERT INTO users
         (full_name, email, phone, password_hash, email_verify_token, token_expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [full_name, email, phone, password_hash, token, expires_at]
    );

    // Send verification email
    await sendVerificationEmail(email, token);

    res.status(201).json({
      message: 'Account created. Please check your email to verify your account.'
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

// ── VERIFY EMAIL ─────────────────────────────────────────────
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Token is missing.' });

  try {
    const [rows] = await db.query(
      `SELECT user_id, token_expires_at
       FROM users
       WHERE email_verify_token = ? AND is_email_verified = 0`,
      [token]
    );

    if (rows.length === 0)
      return res.status(400).json({ error: 'Invalid or already used verification link.' });

    const user = rows[0];

    if (new Date() > new Date(user.token_expires_at))
      return res.status(400).json({ error: 'Verification link has expired. Please register again.' });

    await db.query(
      `UPDATE users
       SET is_email_verified = 1, email_verify_token = NULL, token_expires_at = NULL
       WHERE user_id = ?`,
      [user.user_id]
    );

    res.json({ message: 'Email verified successfully. You can now log in.' });

  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

// ── LOGIN ────────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ?', [email]
    );
    if (rows.length === 0)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const user = rows[0];

    if (!user.is_active)
      return res.status(403).json({ error: 'Account has been deactivated.' });

    // Block login if email not verified
    if (!user.is_email_verified)
      return res.status(403).json({ error: 'Please verify your email before logging in.' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id:        user.user_id,
        full_name: user.full_name,
        email:     user.email,
        role:      user.role,
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};