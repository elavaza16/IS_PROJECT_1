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

    // Insert volunteer record
    const [result] = await db.query(
      `INSERT INTO volunteers
        (user_id, tier, latitude, longitude, declaration_signed, declaration_signed_at)
       VALUES (?,?,?,?,?,NOW())`,
      [user_id, tier, latitude, longitude, declaration_signed ? 1 : 0]
    );
    const volunteer_id = result.insertId;

    // Insert document records
    const docs = [
      ['national_id',       national_id],
      ['drivers_licence',   drivers_licence],
      ['number_plate',      number_plate],
      ['vehicle_insurance', vehicle_insurance],
      ['first_aid_cert',    first_aid_cert],
    ].filter(([, val]) => val); // only insert if value provided

    for (const [doc_type, file_path] of docs) {
      await db.query(
        `INSERT INTO volunteer_documents (volunteer_id, document_type, file_path)
         VALUES (?,?,?)`,
        [volunteer_id, doc_type, file_path]
      );
    }

    res.status(201).json({
      message: 'Application submitted. Pending admin approval.'
    });
  } catch (err) {
    console.error('Apply volunteer error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
};