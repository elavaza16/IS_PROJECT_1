const db = require('../config/db');
const { notify } = require('../utils/notifications');

// Africa's Talking POSTs inbound SMS here (form-urlencoded):
//   from, to, text, date, id, linkId
// We map `from` (reporter phone) -> their current in_progress incident -> its chat,
// insert the text as a community_member message, and notify the assigned volunteer.
// Reporter -> volunteer is therefore delivered IN-APP (volunteer has the app);
// volunteer -> reporter is delivered by SMS (handled in message.controller.js).
exports.handleInbound = async (req, res) => {
  const { from, text } = req.body;

  try {
    if (!from || !text) {
      // Nothing actionable — still ack so AT doesn't retry.
      return res.status(200).send('OK');
    }

    // Match on the last 9 digits so +2547…, 2547…, and 07… all resolve to the
    // same stored number. Only consider incidents that are actively being handled
    // (in_progress + assigned volunteer + an open chat) — a reply has nowhere to
    // go otherwise (e.g. after the volunteer cancelled and it's back in the queue).
    const [rows] = await db.query(
      `SELECT i.incident_id, i.reference_number, i.reporter_id,
              c.chat_id, vu.user_id AS volunteer_user_id
       FROM incidents i
       JOIN users u   ON i.reporter_id = u.user_id
       JOIN chats c   ON c.incident_id = i.incident_id
       JOIN volunteers v ON i.assigned_volunteer = v.volunteer_id
       JOIN users vu  ON v.user_id = vu.user_id
       WHERE RIGHT(REPLACE(u.phone, '+', ''), 9) = RIGHT(REPLACE(?, '+', ''), 9)
         AND i.status = 'in_progress'
       ORDER BY i.responded_at DESC
       LIMIT 1`,
      [from]
    );

    if (!rows.length) {
      // No active incident for this number — log and ack, don't error.
      console.log(`Inbound SMS from ${from} had no active incident; ignored.`);
      return res.status(200).send('OK');
    }

    const { incident_id, reference_number, reporter_id, chat_id, volunteer_user_id } = rows[0];

    await db.query(
      `INSERT INTO messages (chat_id, sender_id, sender_role, content)
       VALUES (?,?,?,?)`,
      [chat_id, reporter_id, 'community_member', text]
    );

    if (volunteer_user_id) {
      const preview = text.length > 60 ? text.slice(0, 60) + '…' : text;
      notify(volunteer_user_id, 'new_message',
        `New message on ${reference_number}: "${preview}"`, incident_id);
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error('Inbound SMS error:', err);
    // Always ack with 200 so AT doesn't keep retrying a message we can't process.
    return res.status(200).send('OK');
  }
};