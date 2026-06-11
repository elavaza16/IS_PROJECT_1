const db = require('../config/db');

exports.applyVolunteer = async (req, res) => {
  const { tier, general_area, latitude, longitude, declaration_signed } = req.body;
  const user_id = req.user.id;

  try {
    const [existing] = await db.query(
      'SELECT volunteer_id FROM volunteers WHERE user_id = ?', [user_id]
    );
    if (existing.length)
      return res.status(409).json({ error: 'You have already applied.' });

    await db.query(
      `INSERT INTO volunteers
        (user_id, tier, latitude, longitude, declaration_signed, declaration_signed_at)
       VALUES (?,?,?,?,?,NOW())`,
      [user_id, tier, latitude, longitude, declaration_signed ? 1 : 0]
    );
    res.status(201).json({ message: 'Application submitted. Pending admin approval.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT i.*, da.responded_at, da.status as alert_status
       FROM incidents i
       JOIN dispatch_alerts da ON da.incident_id = i.incident_id
       JOIN volunteers v ON da.volunteer_id = v.volunteer_id
       WHERE v.user_id = ?
       ORDER BY i.reported_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};