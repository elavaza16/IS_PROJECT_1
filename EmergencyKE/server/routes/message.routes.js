const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/message.controller');
const { messageLimiter } = require('../middleware/rateLimiter');

router.get('/:incidentId',  verifyToken,               ctrl.getMessages);
router.post('/',            verifyToken, messageLimiter, ctrl.sendMessage);

module.exports = router;