const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/volunteer.controller');
const { volunteerApplyLimiter } = require('../middleware/rateLimiter');


router.post('/apply',    verifyToken, volunteerApplyLimiter, ctrl.applyVolunteer);
router.get('/history',   verifyToken,                        ctrl.getHistory);
router.post('/duty',     verifyToken,                        ctrl.toggleDuty);

module.exports = router;