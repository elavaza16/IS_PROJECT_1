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

router.post('/register',        register);
router.post('/login',           login);
router.get('/verify-email',     verifyEmail);
router.get('/me',               verifyToken, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);

module.exports = router;