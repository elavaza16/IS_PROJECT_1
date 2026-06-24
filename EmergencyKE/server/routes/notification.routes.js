const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/notification.controller');

router.get('/',              verifyToken, ctrl.getNotifications);
router.patch('/:id/read',    verifyToken, ctrl.markAsRead);
router.patch('/read-all',    verifyToken, ctrl.markAllAsRead);

module.exports = router;