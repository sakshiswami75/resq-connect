const Emergency = require('../models/Emergency');
const User = require('../models/User');

// @desc    Get admin statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
  try {
    console.log('==========================================');
    console.log('GET /api/admin/stats called');
    console.log('Admin user:', req.user._id);
    console.log('==========================================');

    // Total emergencies
    const totalEmergencies = await Emergency.countDocuments();

    // Active volunteers
    const activeVolunteers = await User.countDocuments({
      userType: 'volunteer',
      isAvailable: true,
    });

    // Calculate average response time
    const resolvedEmergencies = await Emergency.find({
      status: 'resolved',
      responseTime: { $exists: true },
    });

    const avgResponseTime =
      resolvedEmergencies.length > 0
        ? (
            resolvedEmergencies.reduce(
              (sum, emergency) => sum + emergency.responseTime,
              0
            ) / resolvedEmergencies.length
          ).toFixed(1)
        : 0;

    // Emergencies by status
    const emergenciesByStatus = await Emergency.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Emergencies by type
    const emergenciesByType = await Emergency.aggregate([
      {
        $group: {
          _id: '$emergencyType',
          count: { $sum: 1 },
        },
      },
    ]);

    // Emergencies by urgency
    const emergenciesByUrgency = await Emergency.aggregate([
      {
        $group: {
          _id: '$urgency',
          count: { $sum: 1 },
        },
      },
    ]);

    const response = {
      totalEmergencies,
      activeVolunteers,
      avgResponseTime: parseFloat(avgResponseTime),
      emergenciesByStatus,
      emergenciesByType,
      emergenciesByUrgency,
    };

    console.log('Admin stats calculated:', response);
    console.log('==========================================\n');

    res.json(response);
  } catch (error) {
    console.error('Error in getAdminStats:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    console.log('==========================================');
    console.log('GET /api/admin/users called');
    console.log('==========================================');

    const { userType } = req.query;

    let query = {};
    if (userType) {
      query.userType = userType;
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });

    console.log('Users fetched:', users.length);
    console.log('==========================================\n');

    res.json(users);
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    console.log('User updated:', updatedUser._id);

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();

    console.log('User deleted:', req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all emergencies (admin view)
// @route   GET /api/admin/emergencies
// @access  Private/Admin
const getAllEmergencies = async (req, res) => {
  try {
    console.log('==========================================');
    console.log('GET /api/admin/emergencies called');
    console.log('==========================================');

    const emergencies = await Emergency.find()
      .populate('user', 'name email contactNumber')
      .populate('assignedVolunteers', 'name email')
      .sort({ createdAt: -1 });

    console.log('Emergencies fetched:', emergencies.length);
    console.log('==========================================\n');

    res.json(emergencies);
  } catch (error) {
    console.error('Error in getAllEmergencies:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete emergency
// @route   DELETE /api/admin/emergencies/:id
// @access  Private/Admin
const deleteEmergency = async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    await emergency.deleteOne();

    console.log('Emergency deleted:', req.params.id);

    res.json({ message: 'Emergency deleted successfully' });
  } catch (error) {
    console.error('Error deleting emergency:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getAllEmergencies,
  deleteEmergency,
};