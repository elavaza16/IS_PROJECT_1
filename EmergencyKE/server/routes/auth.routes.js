const router = require('express').Router();
const {
  register,
  login,
  verifyEmail,
  getMe,
  forgotPassword,
  resetPassword,
} = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');

router.post('/register',        registerLimiter, register);
router.post('/login',           authLimiter,     login);
router.get('/verify-email',     verifyEmail);
router.get('/me',               verifyToken,     getMe);
router.post('/forgot-password', authLimiter,     forgotPassword);
router.post('/reset-password',  authLimiter,     resetPassword);

module.exports = router;