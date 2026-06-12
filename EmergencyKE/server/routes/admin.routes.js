const router = require('express').Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/admin.controller');

// All admin routes require admin role
router.use(verifyToken, requireRole('admin'));

// Volunteers
router.get('/volunteers',              ctrl.getVolunteers);
router.get('/volunteers/:id',          ctrl.getVolunteer);
router.patch('/volunteers/:id/approve', ctrl.approveVolunteer);
router.patch('/volunteers/:id/reject',  ctrl.rejectVolunteer);
router.patch('/volunteers/:id/suspend', ctrl.suspendVolunteer);

// Users
router.get('/users',                   ctrl.getUsers);
router.patch('/users/:id/deactivate',  ctrl.deactivateUser);
router.patch('/users/:id/activate',    ctrl.activateUser);

// Incidents
router.get('/incidents',               ctrl.getAllIncidents);
router.get('/incidents/:id',           ctrl.getIncident);
router.patch('/incidents/:id/flag',    ctrl.flagIncident);

// Analytics
router.get('/analytics',               ctrl.getAnalytics);

module.exports = router;