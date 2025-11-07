const express = require('express');
const {
  updateVolunteerLocation,
  getLiveTracking,
  getRespondingVolunteers,
  stopTracking,
} = require('../controllers/volunteerController');
const { protect, volunteerOrAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.put('/location', protect, volunteerOrAdmin, updateVolunteerLocation);
router.get('/tracking/:emergencyId', getLiveTracking);
router.get('/responding/:emergencyId', getRespondingVolunteers);
router.put('/stop-tracking', protect, volunteerOrAdmin, stopTracking);

module.exports = router;