const db = require('../config/db');

/**
 * Logs an in-app notification for a user.
 * Call this alongside sendSMS() wherever you currently notify someone.
 */
exports.notify = async (recipientId, type, content, incidentId = null) => {
  try {
    await db.query(
      `INSERT INTO notifications (recipient_id, channel, type, content, incident_id)
       VALUES (?, 'in_app', ?, ?, ?)`,
      [recipientId, type, content, incidentId]
    );
  } catch (err) {
    console.error('Notification log error:', err);
    // Never throw — a failed notification log should never break the main flow
  }
};