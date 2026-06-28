const rateLimit = require('express-rate-limit');

const message = (action) => ({
  success: false,
  message: `Too many ${action} attempts. Please try again later.`,
});

// 5 attempts per 15 minutes — covers login and forgot-password
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('login'),
});

// 10 registrations per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('registration'),
});

// 10 incident reports per hour per IP — each report triggers an SMS
const incidentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('incident report'),
});

// 30 messages per minute — prevents chat spam
const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('message'),
});

// 3 volunteer applications per day per IP
const volunteerApplyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: message('volunteer application'),
});

module.exports = {
  authLimiter,
  registerLimiter,
  incidentLimiter,
  messageLimiter,
  volunteerApplyLimiter,
};
