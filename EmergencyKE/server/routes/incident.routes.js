const router = require('express').Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/incident.controller');
const { incidentLimiter } = require('../middleware/rateLimiter');

router.post('/',             verifyToken, incidentLimiter, ctrl.reportIncident);
router.get('/',              verifyToken, ctrl.getIncidents);
router.get('/mine',          verifyToken, ctrl.getMyIncidents);
router.get('/:id',           verifyToken, ctrl.getIncident);
router.patch('/:id/status',  verifyToken, ctrl.updateStatus);

// Reporter cancels their OWN report (false alarm). No role restriction — any
// reporter (community member, volunteer, etc.) may cancel a report they made.
// Ownership is verified inside the controller (reporter_id === req.user.id).
router.patch('/:id/cancel',  verifyToken, ctrl.cancelIncident);

router.patch('/:id/respond',          verifyToken, requireRole('volunteer'), ctrl.respondToAlert);
router.patch('/:id/cancel-response', verifyToken, requireRole('volunteer'), ctrl.cancelResponse);

module.exports = router;