const express = require('express');
const { register, login, getMe, googleAuth, saveFCMToken } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.post('/fcm-token', protect, saveFCMToken); // ← ADD THIS

module.exports = router;