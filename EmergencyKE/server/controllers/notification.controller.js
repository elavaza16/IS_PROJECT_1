const db = require('../config/db');

exports.getNotifications = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM notifications
       WHERE recipient_id = ? AND channel = 'in_app' AND is_read = 0
       ORDER BY sent_at DESC
       LIMIT 20`,
      [req.user.id]
    );
    const [[{ unread_count }]] = await db.query(
      `SELECT COUNT(*) as unread_count FROM notifications
       WHERE recipient_id = ? AND channel = 'in_app' AND is_read = 0`,
      [req.user.id]
    );
    res.json({ notifications: rows, unread_count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      `UPDATE notifications SET is_read = 1
       WHERE notification_id = ? AND recipient_id = ?`,
      [id, req.user.id]
    );
    res.json({ message: 'Marked as read.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await db.query(
      `UPDATE notifications SET is_read = 1
       WHERE recipient_id = ? AND is_read = 0`,
      [req.user.id]
    );
    res.json({ message: 'All marked as read.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};