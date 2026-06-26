const express = require('express');
const router = express.Router();
const smsController = require('../controllers/sms.controller');

// Public webhook — Africa's Talking posts inbound SMS here. No auth middleware
// (AT does not send a JWT), exactly like the USSD webhook.
router.post('/inbound', smsController.handleInbound);

module.exports = router;