const Emergency = require('../models/Emergency');
const User = require('../models/User');

// Helper function to get time ago
const getTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' min ago';

  return Math.floor(seconds) + ' sec ago';
};

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    console.log('==========================================');
    console.log('GET /api/dashboard/stats called');
    console.log('User:', req.user._id);
    console.log('==========================================');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Active emergencies
    const activeEmergencies = await Emergency.countDocuments({
      status: { $in: ['pending', 'assigned', 'in-progress'] },
    });

    // Available volunteers
    const availableVolunteers = await User.countDocuments({
      userType: 'volunteer',
      isAvailable: true,
    });

    // Resolved today
    const resolvedToday = await Emergency.countDocuments({
      status: 'resolved',
      resolvedAt: { $gte: today },
    });

    console.log('Stats calculated:', {
      activeEmergencies,
      availableVolunteers,
      resolvedToday
    });

    // Recent emergencies
    const recentEmergencies = await Emergency.find({
      status: { $in: ['pending', 'assigned', 'in-progress'] },
    })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    console.log('Recent emergencies found:', recentEmergencies.length);

    // Format for frontend
    const formattedEmergencies = recentEmergencies.map((emergency) => {
      const formatted = {
        id: emergency._id.toString(),
        type: emergency.emergencyType,
        location: emergency.location.address || 
                  `${emergency.location.coordinates[1]?.toFixed(4)}, ${emergency.location.coordinates[0]?.toFixed(4)}`,
        urgency: emergency.urgency.charAt(0).toUpperCase() + emergency.urgency.slice(1),
        time: getTimeAgo(emergency.createdAt),
        status: emergency.status,
        description: emergency.description,
        coordinates: emergency.location.coordinates,
      };
      
      console.log(`Emergency ${formatted.id}:`, {
        type: formatted.type,
        urgency: formatted.urgency,
        hasCoordinates: !!formatted.coordinates,
        coordinates: formatted.coordinates
      });
      
      return formatted;
    });

    const response = {
      stats: {
        activeEmergencies,
        availableVolunteers,
        resolvedToday,
      },
      emergencies: formattedEmergencies,
    };

    console.log('Sending dashboard response');
    console.log('==========================================\n');

    res.json(response);
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user-specific emergencies
// @route   GET /api/dashboard/my-emergencies
// @access  Private
const getMyEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find({ user: req.user._id })
      .populate('assignedVolunteers', 'name email contactNumber')
      .sort({ createdAt: -1 });

    res.json(emergencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get assigned emergencies (for volunteers)
// @route   GET /api/dashboard/assigned-emergencies
// @access  Private (Volunteer/Admin)
const getAssignedEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find({
      assignedVolunteers: req.user._id,
    })
      .populate('user', 'name email contactNumber')
      .sort({ createdAt: -1 });

    res.json(emergencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get public statistics (no auth required)
// @route   GET /api/dashboard/public-stats
// @access  Public
const getPublicStats = async (req, res) => {
  try {
    console.log('GET /api/dashboard/public-stats called');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total emergencies resolved (all time)
    const totalEmergenciesResolved = await Emergency.countDocuments({
      status: 'resolved',
    });

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
        : 4.2;

    // Active emergencies right now
    const activeEmergencies = await Emergency.countDocuments({
      status: { $in: ['pending', 'assigned', 'in-progress'] },
    });

    // Total users
    const totalUsers = await User.countDocuments();

    const response = {
      emergencies: totalEmergenciesResolved,
      volunteers: activeVolunteers,
      responseTime: parseFloat(avgResponseTime),
      activeEmergencies,
      totalUsers,
    };

    console.log('Public stats:', response);

    res.json(response);
  } catch (error) {
    console.error('Error in getPublicStats:', error);
    res.status(500).json({ message: error.message });
  }
};

// UPDATE module.exports
module.exports = {
  getDashboardStats,
  getMyEmergencies,
  getAssignedEmergencies,
  getPublicStats, 
};
