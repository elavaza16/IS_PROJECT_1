const db = require('../config/db');

// ── VOLUNTEERS ────────────────────────────────────────────────

// Get all volunteers with document status
exports.getVolunteers = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? `WHERE v.status = '${status}'` : '';
    const [rows] = await db.query(
      `SELECT * FROM volunteer_document_status ${where}
       ORDER BY volunteer_id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Get volunteers error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get single volunteer with all documents
exports.getVolunteers = async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM volunteer_document_status';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY volunteer_id DESC';

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Get volunteers error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Approve volunteer
exports.approveVolunteer = async (req, res) => {
  const { id } = req.params;
  const admin_id = req.user.id;
  try {
    const [vol] = await db.query(
      'SELECT * FROM volunteers WHERE volunteer_id = ?', [id]
    );
    if (!vol.length)
      return res.status(404).json({ error: 'Volunteer not found.' });

    const old_status = vol[0].status;

    // Update volunteer status
    await db.query(
      `UPDATE volunteers
       SET status = 'active', approved_by = ?, approved_at = NOW()
       WHERE volunteer_id = ?`,
      [admin_id, id]
    );

    // Upgrade user role
    await db.query(
      `UPDATE users SET role = 'volunteer'
       WHERE user_id = ?`,
      [vol[0].user_id]
    );

    // Log status change
    await db.query(
      `INSERT INTO volunteer_status_log
        (volunteer_id, old_status, new_status, reason, changed_by)
       VALUES (?,?,?,?,?)`,
      [id, old_status, 'active', 'Application approved by admin.', admin_id]
    );

    res.json({ message: 'Volunteer approved successfully.' });
  } catch (err) {
    console.error('Approve volunteer error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Reject volunteer
exports.rejectVolunteer = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const admin_id = req.user.id;
  try {
    const [vol] = await db.query(
      'SELECT * FROM volunteers WHERE volunteer_id = ?', [id]
    );
    if (!vol.length)
      return res.status(404).json({ error: 'Volunteer not found.' });

    const old_status = vol[0].status;

    await db.query(
      `UPDATE volunteers SET status = 'rejected' WHERE volunteer_id = ?`, [id]
    );

    await db.query(
      `INSERT INTO volunteer_status_log
        (volunteer_id, old_status, new_status, reason, changed_by)
       VALUES (?,?,?,?,?)`,
      [id, old_status, 'rejected', reason || 'Application rejected by admin.', admin_id]
    );

    res.json({ message: 'Volunteer rejected.' });
  } catch (err) {
    console.error('Reject volunteer error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Suspend volunteer
exports.suspendVolunteer = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const admin_id = req.user.id;
  try {
    const [vol] = await db.query(
      'SELECT * FROM volunteers WHERE volunteer_id = ?', [id]
    );
    if (!vol.length)
      return res.status(404).json({ error: 'Volunteer not found.' });

    await db.query(
      `UPDATE volunteers SET status = 'suspended' WHERE volunteer_id = ?`, [id]
    );

    // Downgrade role back to community_member
    await db.query(
      `UPDATE users SET role = 'community_member' WHERE user_id = ?`,
      [vol[0].user_id]
    );

    await db.query(
      `INSERT INTO volunteer_status_log
        (volunteer_id, old_status, new_status, reason, changed_by)
       VALUES (?,?,?,?,?)`,
      [id, 'active', 'suspended', reason || 'Suspended by admin.', admin_id]
    );

    res.json({ message: 'Volunteer suspended.' });
  } catch (err) {
    console.error('Suspend volunteer error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ── USERS ─────────────────────────────────────────────────────

exports.getUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT user_id, full_name, email, phone, role, county,
              is_email_verified, is_active, created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deactivateUser = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      `UPDATE users SET is_active = 0 WHERE user_id = ?`, [id]
    );
    res.json({ message: 'User deactivated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.activateUser = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      `UPDATE users SET is_active = 1 WHERE user_id = ?`, [id]
    );
    res.json({ message: 'User activated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── INCIDENTS ─────────────────────────────────────────────────

exports.getAllIncidents = async (req, res) => {
  const { status, category } = req.query;
  try {
    let query = `
      SELECT i.*, u.full_name as reporter_name, u.phone as reporter_phone
      FROM incidents i
      JOIN users u ON i.reporter_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (status)   { query += ' AND i.status = ?';   params.push(status);   }
    if (category) { query += ' AND i.category = ?'; params.push(category); }

    query += ' ORDER BY i.reported_at DESC';

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getIncident = async (req, res) => {
  const { id } = req.params;
  try {
    const [incident] = await db.query(
      `SELECT i.*, u.full_name as reporter_name, u.phone as reporter_phone
       FROM incidents i
       JOIN users u ON i.reporter_id = u.user_id
       WHERE i.incident_id = ?`,
      [id]
    );
    if (!incident.length)
      return res.status(404).json({ error: 'Incident not found.' });

    const [logs] = await db.query(
      `SELECT il.*, u.full_name as actor_name
       FROM incident_logs il
       LEFT JOIN users u ON il.performed_by = u.user_id
       WHERE il.incident_id = ?
       ORDER BY il.created_at DESC`,
      [id]
    );

    res.json({ ...incident[0], logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.flagIncident = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const admin_id = req.user.id;
  try {
    await db.query(
      `UPDATE incidents
       SET is_flagged = 1, flagged_reason = ?, flagged_at = NOW(), flagged_by = ?
       WHERE incident_id = ?`,
      [reason, admin_id, id]
    );
    res.json({ message: 'Incident flagged.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── ANALYTICS ─────────────────────────────────────────────────

exports.getAnalytics = async (req, res) => {
  try {
    const [[totals]] = await db.query(
      `SELECT
        COUNT(*) as total_incidents,
        SUM(status = 'resolved')    as resolved,
        SUM(status = 'in_progress') as in_progress,
        SUM(status = 'reported')    as reported,
        SUM(status = 'cancelled')   as cancelled,
        AVG(TIMESTAMPDIFF(MINUTE, reported_at, resolved_at)) as avg_resolution_minutes
       FROM incidents`
    );

    const [by_category] = await db.query(
      `SELECT category, COUNT(*) as count
       FROM incidents GROUP BY category ORDER BY count DESC`
    );

    const [by_day] = await db.query(
      `SELECT DATE(reported_at) as date, COUNT(*) as count
       FROM incidents
       WHERE reported_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(reported_at)
       ORDER BY date ASC`
    );

    const [[vol_totals]] = await db.query(
      `SELECT
        COUNT(*) as total_volunteers,
        SUM(status = 'active')    as active,
        SUM(status = 'pending')   as pending,
        SUM(status = 'suspended') as suspended,
        SUM(status = 'rejected')  as rejected
       FROM volunteers`
    );

    const [[user_totals]] = await db.query(
      `SELECT COUNT(*) as total_users FROM users WHERE role = 'community_member'`
    );

    res.json({
      incidents: { ...totals, by_category, by_day },
      volunteers: vol_totals,
      users: user_totals,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};