const router = require('express').Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/incident.controller');

router.post('/',             verifyToken, ctrl.reportIncident);
router.get('/',              verifyToken, ctrl.getIncidents);
router.get('/mine',          verifyToken, ctrl.getMyIncidents);
router.get('/:id',           verifyToken, ctrl.getIncident);
router.patch('/:id/status',  verifyToken, ctrl.updateStatus);
router.patch('/:id/respond', verifyToken, requireRole('volunteer'), ctrl.respondToAlert);

module.exports = router;