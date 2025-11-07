// routes/emergencyRoutes.js
const express = require('express');
const {
  createEmergency,
  getEmergencies,
  getEmergencyById,
  getNearbyEmergencies,
  respondToEmergency,
  updateEmergencyStatus,
  addNote,
  quickReport,
} = require('../controllers/emergencyController');

const {
  updateVolunteerLocation,
  getLiveTracking,
  getRespondingVolunteers,
  stopTracking,
} = require('../controllers/volunteerController');

const { protect, volunteerOrAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// QUICK REPORT - NO AUTHENTICATION REQUIRED
router.post('/quick-report', quickReport);

// AUTHENTICATED ROUTES
router.route('/')
  .get(protect, getEmergencies)
  .post(protect, createEmergency);

router.get('/nearby', protect, volunteerOrAdmin, getNearbyEmergencies);

router.route('/:id')
  .get(protect, getEmergencyById);

router.put('/:id/respond', protect, volunteerOrAdmin, respondToEmergency);
router.put('/:id/status', protect, volunteerOrAdmin, updateEmergencyStatus);
router.post('/:id/notes', protect, addNote);

// --- LIVE TRACKING / VOLUNTEER LOCATION ROUTES ---
// Note: use param name "emergencyId" to match controller's req.params
// GET live tracking for an emergency (volunteer positions, ETA etc.)
router.get('/:emergencyId/live-tracking', protect, getLiveTracking);

// GET responding volunteers (fallback / simpler list)
router.get('/:emergencyId/responding-volunteers', protect, getRespondingVolunteers);

// PUT update volunteer location (used by frontend to send location updates)
// Keep this route under emergencies or volunteers as you prefer; using this path to match your frontend usage.
router.put('/volunteers/location', protect, updateVolunteerLocation);

// Stop tracking for current volunteer
router.put('/volunteers/stop-tracking', protect, stopTracking);

module.exports = router;
