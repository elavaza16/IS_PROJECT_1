const db = require('../config/db');
const { haversine } = require('../utils/haversine');
const { sendSMS } = require('../utils/sms');
const { notify } = require('../utils/notifications');

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

    // ── Duplicate detection ───────────────────────────────────
    let parentIncidentId = null;
    if (latitude && longitude) {
      const [nearby] = await db.query(
        `SELECT incident_id FROM incidents
         WHERE category = ?
         AND incident_id != ?
         AND status NOT IN ('resolved', 'cancelled')
         AND reported_at >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
         AND latitude IS NOT NULL
         AND (
           6371 * ACOS(
             COS(RADIANS(?)) * COS(RADIANS(latitude)) *
             COS(RADIANS(longitude) - RADIANS(?)) +
             SIN(RADIANS(?)) * SIN(RADIANS(latitude))
           )
         ) < 0.5
         ORDER BY reported_at ASC
         LIMIT 1`,
        [category, incidentId, latitude, longitude, latitude]
      );

      if (nearby.length > 0) {
        parentIncidentId = nearby[0].incident_id;
        await db.query(
          `UPDATE incidents
           SET parent_incident_id = ?,
               reporter_count = reporter_count + 1
           WHERE incident_id = ?`,
          [parentIncidentId, incidentId]
        );
        await db.query(
          `UPDATE incidents
           SET reporter_count = reporter_count + 1
           WHERE incident_id = ?`,
          [parentIncidentId]
        );
      }
    }
    // ── End duplicate detection ───────────────────────────────

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
      await db.query(
        `INSERT INTO dispatch_alerts (incident_id, volunteer_id, radius_km)
         VALUES (?,?,?)`,
        [incidentId, nearest.volunteer_id, Math.ceil(minDist)]
      );
      await db.query(
        `UPDATE incidents SET assigned_volunteer = ?, status = 'dispatching'
         WHERE incident_id = ?`,
        [nearest.volunteer_id, incidentId]
      );
      await db.query(
        `INSERT INTO incident_logs (incident_id, action, new_value, performed_by)
         VALUES (?, 'dispatched', ?, ?)`,
        [incidentId, nearest.volunteer_id, reporter_id]
      );
    }

    // ── SMS + in-app notifications ─────────────────────────────
    const [reporterRows] = await db.query(
      'SELECT phone FROM users WHERE user_id = ?', [reporter_id]
    );
    if (reporterRows[0]?.phone) {
      sendSMS(reporterRows[0].phone,
        `EmergencyKE: Your report (${reference_number}) has been received. Help is being dispatched.`
      );
    }
    notify(reporter_id, 'report_received',
      `Your report (${reference_number}) has been received. Help is being dispatched.`, incidentId
    );

    if (nearest && nearest.phone) {
      sendSMS(nearest.phone,
        `EmergencyKE ALERT: New ${category.replace('_',' ')} reported near you. Open the app to respond. Ref: ${reference_number}`
      );
      // Need the volunteer's user_id, not just volunteer_id, for notifications
      const [volUserRow] = await db.query(
        'SELECT user_id FROM volunteers WHERE volunteer_id = ?', [nearest.volunteer_id]
      );
      if (volUserRow[0]) {
        notify(volUserRow[0].user_id, 'new_alert',
          `New ${category.replace('_',' ')} reported near you. Ref: ${reference_number}`, incidentId
        );
      }
    }
    // ── End notifications ─────────────────────────────────────

    res.status(201).json({
      message: 'Emergency reported successfully.',
      incident_id: incidentId,
      reference_number,
      volunteer_assigned: !!nearest,
      is_duplicate: !!parentIncidentId,
      parent_incident_id: parentIncidentId,
    });

  } catch (err) {
    console.error('Report incident error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

exports.getIncidents = async (req, res) => {
  const { status, excludeOwn } = req.query;
  try {
    let query = `
      SELECT i.*, u.full_name as reporter_name
      FROM incidents i
      JOIN users u ON i.reporter_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      // Support comma-separated statuses, e.g. status=reported,dispatching
      const statusList = status.split(',');
      query += ` AND i.status IN (${statusList.map(() => '?').join(',')})`;
      params.push(...statusList);
    }

    if (excludeOwn === 'true') {
      query += ' AND i.reporter_id != ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY i.reported_at DESC';
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

exports.getIncident = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT i.*, u.full_name as reporter_name, u.phone as reporter_phone
       FROM incidents i
       JOIN users u ON i.reporter_id = u.user_id
       WHERE i.incident_id = ?`,
      [id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Incident not found.' });

    const incident = rows[0];

    // Determine if the requesting user is the assigned volunteer (if any)
    let isAssignedToMe = false;
    if (incident.assigned_volunteer) {
      const [volRows] = await db.query(
        'SELECT volunteer_id FROM volunteers WHERE user_id = ?', [req.user.id]
      );
      if (volRows.length && volRows[0].volunteer_id === incident.assigned_volunteer) {
        isAssignedToMe = true;
      }
    }

    res.json({ ...incident, is_assigned_to_me: isAssignedToMe });
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

    if (status === 'resolved') {
      const [rows] = await db.query(
        `SELECT i.reference_number, i.reporter_id, u.phone
         FROM incidents i
         JOIN users u ON i.reporter_id = u.user_id
         WHERE i.incident_id = ?`,
        [id]
      );
      if (rows[0]?.phone) {
        sendSMS(rows[0].phone,
          `EmergencyKE: Your incident (${rows[0].reference_number}) has been marked resolved. Stay safe.`
        );
      }
      if (rows[0]) {
        notify(rows[0].reporter_id, 'incident_resolved',
          `Your incident (${rows[0].reference_number}) has been marked resolved.`, id
        );
      }
    }

    res.json({ message: 'Status updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Volunteer abandons a response — incident returns to the shared queue.
exports.cancelResponse = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      `UPDATE dispatch_alerts SET status = 'cancelled'
       WHERE incident_id = ? AND volunteer_id = (
         SELECT volunteer_id FROM volunteers WHERE user_id = ?
       )`,
      [id, req.user.id]
    );

    await db.query(
      `UPDATE incidents
       SET status = 'reported', assigned_volunteer = NULL,
           responded_at = NULL, updated_at = NOW()
       WHERE incident_id = ?`,
      [id]
    );

    await db.query(
      `INSERT INTO incident_logs (incident_id, action, new_value, performed_by)
       VALUES (?, 'volunteer_cancelled', 'reported', ?)`,
      [id, req.user.id]
    );

    // ── Notify the reporter that their volunteer cancelled ──
    const [cancelInfo] = await db.query(
      `SELECT i.reference_number, i.reporter_id, u.phone
       FROM incidents i
       JOIN users u ON i.reporter_id = u.user_id
       WHERE i.incident_id = ?`,
      [id]
    );
    if (cancelInfo[0]?.phone) {
      sendSMS(cancelInfo[0].phone,
        `EmergencyKE: The volunteer for your report (${cancelInfo[0].reference_number}) had to cancel. ` +
        `Your report is back in the queue and being re-dispatched.`
      );
    }
    if (cancelInfo[0]) {
      notify(cancelInfo[0].reporter_id, 'volunteer_cancelled',
        `The volunteer for your report (${cancelInfo[0].reference_number}) cancelled. It's back in the queue.`, id
      );
    }
    // ── End notification ────────────────────────────────────

    res.json({ message: 'Response cancelled. Incident returned to queue.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Reporter cancels their OWN report (e.g. a false alarm). Terminal — sets the
// incident to 'cancelled', expires any pending alerts, and (if a volunteer had
// already accepted) tells them to stand down. This is distinct from
// cancelResponse above, which is the VOLUNTEER abandoning a response.
exports.cancelIncident = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT status, reporter_id, reference_number, assigned_volunteer
       FROM incidents WHERE incident_id = ?`,
      [id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Incident not found.' });

    const incident = rows[0];

    // Server-verified: only the reporter who created it may cancel it.
    if (incident.reporter_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only cancel your own report.' });
    }

    // Nothing to cancel if it's already finished.
    if (['resolved', 'cancelled'].includes(incident.status)) {
      return res.status(409).json({ error: `This report is already ${incident.status}.` });
    }

    // Expire any alerts still pending out to volunteers.
    await db.query(
      `UPDATE dispatch_alerts SET status = 'expired'
       WHERE incident_id = ? AND status = 'pending'`,
      [id]
    );

    await db.query(
      `UPDATE incidents SET status = 'cancelled', updated_at = NOW()
       WHERE incident_id = ?`,
      [id]
    );

    await db.query(
      `INSERT INTO incident_logs (incident_id, action, new_value, performed_by)
       VALUES (?, 'reporter_cancelled', 'cancelled', ?)`,
      [id, req.user.id]
    );

    // If a volunteer had already accepted, tell them to stand down.
    if (incident.assigned_volunteer) {
      const [volRows] = await db.query(
        `SELECT u.user_id, u.phone FROM volunteers v
         JOIN users u ON v.user_id = u.user_id
         WHERE v.volunteer_id = ?`,
        [incident.assigned_volunteer]
      );
      if (volRows[0]) {
        if (volRows[0].phone) {
          sendSMS(volRows[0].phone,
            `EmergencyKE: The reporter has CANCELLED report ${incident.reference_number}. ` +
            `You can stand down — no response needed.`
          );
        }
        notify(volRows[0].user_id, 'report_cancelled',
          `The reporter cancelled report ${incident.reference_number}. You can stand down.`, id
        );
      }
    }

    res.json({ message: 'Report cancelled.' });
  } catch (err) {
    console.error('Cancel incident error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.respondToAlert = async (req, res) => {
  const { response } = req.body;
  const { id } = req.params;
  try {
    if (response === 'accepted') {
      // Prevent race condition: check if incident is still available
      const [incidentCheck] = await db.query(
        `SELECT status FROM incidents WHERE incident_id = ?`, [id]
      );

      if (!incidentCheck.length) {
        return res.status(404).json({ error: 'Incident not found.' });
      }

      if (['in_progress', 'resolved', 'cancelled'].includes(incidentCheck[0].status)) {
        return res.status(409).json({
          error: 'This incident has already been accepted by another volunteer.'
        });
      }

      const [volRows] = await db.query(
        'SELECT volunteer_id FROM volunteers WHERE user_id = ?', [req.user.id]
      );
      const volunteerId = volRows[0]?.volunteer_id;

      await db.query(
        `UPDATE dispatch_alerts SET status = 'accepted', responded_at = NOW()
         WHERE incident_id = ? AND volunteer_id = ?`,
        [id, volunteerId]
      );

      await db.query(
        `UPDATE incidents
         SET status = 'in_progress', responded_at = NOW(), assigned_volunteer = ?
         WHERE incident_id = ?`,
        [volunteerId, id]
      );

      // Expire every other pending alert for this incident
      await db.query(
        `UPDATE dispatch_alerts SET status = 'expired'
         WHERE incident_id = ? AND volunteer_id != ? AND status = 'pending'`,
        [id, volunteerId]
      );

      await db.query(
        `INSERT IGNORE INTO chats (incident_id) VALUES (?)`,
        [id]
      );

      // ── SMS + in-app notification on acceptance ────────────
      const [rows] = await db.query(
        `SELECT reference_number, reporter_id FROM incidents WHERE incident_id = ?`, [id]
      );
      const [reporterRows] = await db.query(
        `SELECT u.phone FROM incidents i
         JOIN users u ON i.reporter_id = u.user_id
         WHERE i.incident_id = ?`,
        [id]
      );

      // The accepting volunteer is the logged-in user — fetch their contact details
      const [volInfoRows] = await db.query(
        'SELECT full_name, phone FROM users WHERE user_id = ?', [req.user.id]
      );
      const volName  = volInfoRows[0]?.full_name || 'A volunteer';
      const volPhone = volInfoRows[0]?.phone || 'not available';

      if (reporterRows[0]?.phone && rows[0]) {
        sendSMS(reporterRows[0].phone,
          `EmergencyKE: ${volName} has accepted your report (${rows[0].reference_number}) ` +
          `and is on the way. Call them directly: ${volPhone}`
        );
      }
      if (rows[0]) {
        notify(rows[0].reporter_id, 'volunteer_accepted',
          `${volName} has accepted your report (${rows[0].reference_number}) and is on the way.`, id
        );
      }
      // ── End notification ────────────────────────────────────

    } else {
      await db.query(
        `UPDATE dispatch_alerts SET status = 'declined', responded_at = NOW()
         WHERE incident_id = ? AND volunteer_id = (
           SELECT volunteer_id FROM volunteers WHERE user_id = ?
         )`,
        [id, req.user.id]
      );
    }

    res.json({ message: `Alert ${response}.` });
  } catch (err) {
    console.error('Respond to alert error:', err);
    res.status(500).json({ error: err.message });
  }
};