const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/volunteer.controller');

router.post('/apply',    verifyToken, ctrl.applyVolunteer);
router.get('/history',   verifyToken, ctrl.getHistory);

module.exports = router;