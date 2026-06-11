const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/message.controller');

router.get('/:incidentId',  verifyToken, ctrl.getMessages);
router.post('/',            verifyToken, ctrl.sendMessage);

module.exports = router;