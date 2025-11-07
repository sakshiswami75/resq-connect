const express = require('express');
const {
  getDashboardStats,
  getMyEmergencies,
  getAssignedEmergencies,
  getPublicStats, // ← ADD THIS
} = require('../controllers/dashboardController');
const { protect, volunteerOrAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Public route (no auth required)
router.get('/public-stats', getPublicStats); // ← ADD THIS

// Protected routes
router.get('/stats', protect, getDashboardStats);
router.get('/my-emergencies', protect, getMyEmergencies);
router.get('/assigned-emergencies', protect, volunteerOrAdmin, getAssignedEmergencies);

module.exports = router;