const db = require('../config/db');

exports.applyVolunteer = async (req, res) => {
  const {
    tier, general_area, latitude, longitude,
    declaration_signed, national_id, drivers_licence,
    number_plate, vehicle_insurance, first_aid_cert,
  } = req.body;
  const user_id = req.user.id;

  try {
    const [existing] = await db.query(
      'SELECT volunteer_id FROM volunteers WHERE user_id = ?', [user_id]
    );
    if (existing.length)
      return res.status(409).json({ error: 'You have already applied.' });

    if (!national_id || !first_aid_cert)
      return res.status(400).json({ error: 'National ID and First Aid Certificate are required.' });

    if ((tier === 'driver' || tier === 'both') &&
        (!drivers_licence || !number_plate || !vehicle_insurance))
      return res.status(400).json({ error: 'Vehicle documents are required for driver tier.' });

    const [result] = await db.query(
      `INSERT INTO volunteers
        (user_id, tier, general_area, latitude, longitude,
         declaration_signed, declaration_signed_at)
       VALUES (?,?,?,?,?,?,NOW())`,
      [user_id, tier, general_area, latitude, longitude, declaration_signed ? 1 : 0]
    );
    const volunteer_id = result.insertId;

    const docs = [
      ['national_id',    national_id],
      ['first_aid_cert', first_aid_cert],
    ];

    if (tier === 'driver' || tier === 'both') {
      docs.push(['drivers_licence',   drivers_licence]);
      docs.push(['number_plate',      number_plate]);
      docs.push(['vehicle_insurance', vehicle_insurance]);
    }

    for (const [doc_type, doc_number] of docs) {
      await db.query(
        `INSERT INTO volunteer_documents
          (volunteer_id, document_type, document_number, file_path)
         VALUES (?,?,?,?)`,
        [volunteer_id, doc_type, doc_number, doc_number]
      );
    }

    res.status(201).json({
      message: 'Application submitted successfully. Pending admin approval.'
    });

  } catch (err) {
    console.error('Apply volunteer error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
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
    console.error('Get history error:', err);
    res.status(500).json({ error: err.message });
  }
};