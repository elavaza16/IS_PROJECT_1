const db = require('../config/db');

exports.getMessages = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT m.*, u.full_name as sender_name
       FROM messages m JOIN users u ON m.sender_id = u.user_id
       WHERE m.chat_id = (
         SELECT chat_id FROM chats WHERE incident_id = ?
       )
       ORDER BY m.sent_at ASC`,
      [req.params.incidentId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  const { incident_id, content } = req.body;
  const sender_id = req.user.id;
  const sender_role = req.user.role;

  try {
    const [chat] = await db.query(
      'SELECT chat_id FROM chats WHERE incident_id = ?',
      [incident_id]
    );
    if (!chat.length)
      return res.status(404).json({ error: 'No active chat for this incident.' });

    await db.query(
      `INSERT INTO messages (chat_id, sender_id, sender_role, content)
       VALUES (?,?,?,?)`,
      [chat[0].chat_id, sender_id, sender_role, content]
    );
    res.status(201).json({ message: 'Message sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};