const router = require('express').Router();
const { handleUssd } = require('../controllers/ussd.controller');

// No verifyToken — Africa's Talking calls this directly, no JWT involved
router.post('/', handleUssd);

module.exports = router;