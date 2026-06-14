const db     = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/email');
const { sendPasswordResetEmail } = require('../utils/email');

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

exports.getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT user_id, full_name, email, phone, role, is_active
       FROM users WHERE user_id = ?`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: err.message });
  }
};


// ── FORGOT PASSWORD ──────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
    const [rows] = await db.query(
      'SELECT user_id FROM users WHERE email = ? AND is_active = 1', [email]
    );

    // Always return success even if email not found — prevents email enumeration
    if (!rows.length) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const user_id  = rows[0].user_id;
    const token    = crypto.randomBytes(32).toString('hex');
    const expires  = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate any existing tokens for this user
    await db.query(
      'DELETE FROM password_reset_tokens WHERE user_id = ?', [user_id]
    );

    // Save new token
    await db.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES (?,?,?)`,
      [user_id, token, expires]
    );

    // Send email
    await sendPasswordResetEmail(email, token);

    res.json({ message: 'If that email exists, a reset link has been sent.' });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

// ── RESET PASSWORD ───────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password)
    return res.status(400).json({ error: 'Token and password are required.' });
  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  try {
    const [rows] = await db.query(
      `SELECT prt.*, u.user_id
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.user_id
       WHERE prt.token = ? AND prt.used_at IS NULL`,
      [token]
    );

    if (!rows.length)
      return res.status(400).json({ error: 'Invalid or already used reset link.' });

    const record = rows[0];

    if (new Date() > new Date(record.expires_at))
      return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });

    // Hash new password
    const password_hash = await bcrypt.hash(password, 12);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = ? WHERE user_id = ?',
      [password_hash, record.user_id]
    );

    // Mark token as used
    await db.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE token = ?',
      [token]
    );

    res.json({ message: 'Password reset successfully. You can now log in.' });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};