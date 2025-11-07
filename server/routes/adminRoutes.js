const express = require('express');
const {
  getAdminStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllEmergencies,
  deleteEmergency,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected and admin-only
router.use(protect);
router.use(admin);

router.get('/stats', getAdminStats);

router.route('/users')
  .get(getAllUsers);

router.route('/users/:id')
  .put(updateUser)
  .delete(deleteUser);

router.route('/emergencies')
  .get(getAllEmergencies);

router.route('/emergencies/:id')
  .delete(deleteEmergency);

module.exports = router;