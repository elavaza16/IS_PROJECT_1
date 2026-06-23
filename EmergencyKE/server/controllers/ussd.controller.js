const db = require('../config/db');
const { haversine } = require('../utils/haversine');
const { sendSMS } = require('../utils/sms');

const CATEGORIES = {
  '1': 'medical_distress',
  '2': 'road_accident',
  '3': 'fire_hazard',
  '4': 'security_threat',
  '5': 'other',
};

const generateRef = () => `INC-${Date.now().toString().slice(-8)}-${Math.floor(Math.random()*100)}`;

exports.handleUssd = async (req, res) => {
  const { sessionId, phoneNumber, text } = req.body;

  // text accumulates every input separated by *
  // e.g. "" -> "1" -> "1*2" -> "1*2*Westlands"
  const steps = text === '' ? [] : text.split('*');
  let response = '';

  try {
    if (steps.length === 0) {
      // First request — show main menu
      response =
        `CON Welcome to EmergencyKE\n` +
        `Report an emergency:\n` +
        `1. Medical Emergency\n` +
        `2. Road Accident\n` +
        `3. Fire Hazard\n` +
        `4. Security Threat\n` +
        `5. Other`;

    } else if (steps.length === 1) {
      // Category chosen — ask for location
      if (!CATEGORIES[steps[0]]) {
        response = `END Invalid choice. Please dial again.`;
      } else {
        response =
          `CON Enter your location\n` +
          `(e.g. Westlands, Nairobi):`;
      }

    } else if (steps.length === 2) {
      // Location entered — ask for severity
      response =
        `CON How severe is it?\n` +
        `1. Low\n` +
        `2. Medium\n` +
        `3. High`;

    } else if (steps.length === 3) {
      // Severity chosen — confirm and submit
      const category = CATEGORIES[steps[0]];
      const locationText = steps[1];
      const severityMap = { '1': 'low', '2': 'medium', '3': 'high' };
      const severity = severityMap[steps[2]] || 'medium';

      if (!category) {
        response = `END Session expired. Please dial again.`;
      } else {
        // Find or create a user record for this phone number
        let [users] = await db.query(
          'SELECT user_id FROM users WHERE phone = ?', [phoneNumber]
        );

        let reporterId;
        if (users.length) {
          reporterId = users[0].user_id;
        } else {
          // Create a lightweight USSD-only account — no email/password needed
          const [result] = await db.query(
            `INSERT INTO users (full_name, email, phone, password_hash, role, is_email_verified, is_active)
             VALUES (?,?,?,?,?,1,1)`,
            [`USSD User ${phoneNumber}`, `ussd_${phoneNumber}@emergencyke.local`,
             phoneNumber, 'ussd_no_password', 'community_member']
          );
          reporterId = result.insertId;
        }

        const reference_number = generateRef();

        const [incidentResult] = await db.query(
          `INSERT INTO incidents
            (reference_number, reporter_id, category, severity, location_source, location_text, status)
           VALUES (?,?,?,?,?,?, 'reported')`,
          [reference_number, reporterId, category, severity, 'ussd', locationText]
        );
        const incidentId = incidentResult.insertId;

        // Log the USSD session
        await db.query(
          `INSERT INTO ussd_sessions (at_session_id, phone, user_id, incident_id, is_complete, expires_at)
           VALUES (?,?,?,?,1, DATE_ADD(NOW(), INTERVAL 3 MINUTE))`,
          [sessionId, phoneNumber, reporterId, incidentId]
        );

        // Broadcast to all active volunteers since USSD reports have no
        // GPS coordinates, so proximity matching is not possible
        const [activeVolunteers] = await db.query(
          `SELECT v.volunteer_id, u.phone
           FROM volunteers v
           JOIN users u ON v.user_id = u.user_id
           WHERE v.status = 'active'`
        );

        for (const vol of activeVolunteers) {
          await db.query(
            `INSERT INTO dispatch_alerts (incident_id, volunteer_id, radius_km)
             VALUES (?,?,NULL)`,
            [incidentId, vol.volunteer_id]
          );

          if (vol.phone) {
            sendSMS(vol.phone,
              `EmergencyKE ALERT: ${category.replace('_',' ')} reported at ${locationText}. ` +
              `Reporter: ${phoneNumber}. Ref: ${reference_number}. Open the app to respond.`
            );
          }
        }

        await db.query(
          `INSERT INTO incident_logs (incident_id, action, new_value, performed_by)
           VALUES (?, 'broadcast_dispatched', ?, NULL)`,
          [incidentId, activeVolunteers.length.toString()]
        );

        // Send SMS confirmation to the reporter
        sendSMS(phoneNumber,
          `EmergencyKE: Your report (${reference_number}) has been received. Help is being dispatched.`
        );

        response =
          `END Emergency reported.\n` +
          `Reference: ${reference_number}\n` +
          `Help is on the way. You will receive an SMS update.`;
      }

    } else {
      response = `END Invalid session. Please dial again.`;
    }

  } catch (err) {
    console.error('USSD error:', err);
    response = `END Something went wrong. Please try again later.`;
  }

  res.set('Content-Type', 'text/plain');
  res.send(response);
};