const db = require('../config/db');
const { haversine } = require('../utils/haversine');
const { sendSMS } = require('../utils/sms');

// Generate reference number
const generateRef = () => `INC-${Date.now().toString().slice(-8)}-${Math.floor(Math.random()*100)}`;

exports.reportIncident = async (req, res) => {
  const { category, severity, latitude, longitude, location_text, description, location_source } = req.body;
  const reporter_id = req.user.id;

  try {
    const reference_number = generateRef();
    const [result] = await db.query(
      `INSERT INTO incidents
        (reference_number, reporter_id, category, severity, location_source,
         latitude, longitude, location_text, description)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [reference_number, reporter_id, category, severity,
       location_source || 'web', latitude, longitude, location_text, description]
    );
    const incidentId = result.insertId;

    // Find nearest approved active volunteer excluding reporter
    const [volunteers] = await db.query(
      `SELECT v.volunteer_id, v.latitude, v.longitude, u.phone, u.full_name
       FROM volunteers v JOIN users u ON v.user_id = u.user_id
       WHERE v.status = 'active' AND v.latitude IS NOT NULL
       AND u.user_id != ?`,
      [reporter_id]
    );

    let nearest = null;
    let minDist = Infinity;
    for (const vol of volunteers) {
      if (!latitude || !vol.latitude) continue;
      const dist = haversine(latitude, longitude, vol.latitude, vol.longitude);
      if (dist < minDist) { minDist = dist; nearest = vol; }
    }

    if (nearest) {
      // Create dispatch alert
      await db.query(
        `INSERT INTO dispatch_alerts (incident_id, volunteer_id, radius_km)
         VALUES (?,?,?)`,
        [incidentId, nearest.volunteer_id, Math.ceil(minDist)]
      );

      // Update incident
      await db.query(
        `UPDATE incidents SET assigned_volunteer = ?, status = 'dispatching'
         WHERE incident_id = ?`,
        [nearest.volunteer_id, incidentId]
      );

      // Log it
      await db.query(
        `INSERT INTO incident_logs (incident_id, action, new_value, performed_by)
         VALUES (?, 'dispatched', ?, ?)`,
        [incidentId, nearest.volunteer_id, reporter_id]
      );
    }

    res.status(201).json({
      message: 'Emergency reported successfully.',
      incident_id: incidentId,
      reference_number,
      volunteer_assigned: !!nearest,
    });
  } catch (err) {
    console.error('Report incident error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

exports.getIncidents = async (req, res) => {
  const { status } = req.query;
  try {
    let query = 'SELECT * FROM incidents WHERE 1=1';
    const params = [];
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY reported_at DESC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyIncidents = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM incidents WHERE reporter_id = ?
       ORDER BY reported_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  try {
    await db.query(
      `UPDATE incidents SET status = ?,
       ${status === 'resolved' ? 'resolved_at = NOW(),' : ''}
       updated_at = NOW()
       WHERE incident_id = ?`,
      [status, id]
    );
    await db.query(
      `INSERT INTO incident_logs (incident_id, action, new_value, performed_by)
       VALUES (?, 'status_update', ?, ?)`,
      [id, status, req.user.id]
    );
    res.json({ message: 'Status updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.respondToAlert = async (req, res) => {
  const { response } = req.body;
  const { id } = req.params;
  try {
    await db.query(
      `UPDATE dispatch_alerts SET status = ?, responded_at = NOW()
       WHERE incident_id = ? AND volunteer_id = (
         SELECT volunteer_id FROM volunteers WHERE user_id = ?
       )`,
      [response === 'accepted' ? 'accepted' : 'declined', id, req.user.id]
    );

    if (response === 'accepted') {
      await db.query(
        `UPDATE incidents SET status = 'in_progress', responded_at = NOW()
         WHERE incident_id = ?`,
        [id]
      );

      // Open a chat for this incident
      await db.query(
        `INSERT IGNORE INTO chats (incident_id) VALUES (?)`,
        [id]
      );
    }

    res.json({ message: `Alert ${response}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};