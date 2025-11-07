const User = require('../models/User');
const Emergency = require('../models/Emergency');

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
};

const calculateETA = (distanceInKm) => {
  const averageSpeedKmh = 30;
  const timeInHours = distanceInKm / averageSpeedKmh;
  const timeInMinutes = Math.ceil(timeInHours * 60);
  return timeInMinutes;
};

const updateVolunteerLocation = async (req, res) => {
  try {
    const { latitude, longitude, emergencyId } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ 
        message: 'Latitude and longitude are required' 
      });
    }

    console.log('========================================');
    console.log('📍 Updating volunteer location');
    console.log('Volunteer ID:', req.user._id);
    console.log('Location:', latitude, longitude);
    console.log('Emergency ID:', emergencyId);
    console.log('========================================');

    const volunteer = await User.findByIdAndUpdate(
      req.user._id,
      {
        currentLocation: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
          lastUpdated: Date.now(),
        },
        isResponding: emergencyId ? true : false,
        respondingToEmergency: emergencyId || null,
      },
      { new: true }
    );

    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    console.log('✅ Location updated successfully');
    console.log('========================================\n');

    res.json({
      success: true,
      message: 'Location updated successfully',
      location: volunteer.currentLocation,
    });

  } catch (error) {
    console.error('❌ Error updating volunteer location:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update location',
      error: error.message 
    });
  }
};

const getLiveTracking = async (req, res) => {
  try {
    const { emergencyId } = req.params;

    console.log('========================================');
    console.log('📍 Getting live tracking for emergency:', emergencyId);
    console.log('========================================');

    const emergency = await Emergency.findById(emergencyId)
      .populate('user', 'name contactNumber')
      .populate('assignedVolunteers', 'name contactNumber currentLocation isResponding');

    if (!emergency) {
      return res.status(404).json({ 
        success: false,
        message: 'Emergency not found' 
      });
    }

    const respondingVolunteers = await User.find({
      respondingToEmergency: emergencyId,
      isResponding: true,
    }).select('name contactNumber currentLocation isResponding');

    const volunteersWithTracking = respondingVolunteers.map(volunteer => {
      let distance = null;
      let eta = null;
      let lastUpdated = null;

      if (volunteer.currentLocation?.coordinates && 
          emergency.location?.coordinates) {
        
        const volLat = volunteer.currentLocation.coordinates[1];
        const volLng = volunteer.currentLocation.coordinates[0];
        const emgLat = emergency.location.coordinates[1];
        const emgLng = emergency.location.coordinates[0];

        distance = calculateDistance(volLat, volLng, emgLat, emgLng);
        eta = calculateETA(distance);
        lastUpdated = volunteer.currentLocation.lastUpdated;
      }

      return {
        _id: volunteer._id,
        name: volunteer.name,
        contactNumber: volunteer.contactNumber,
        currentLocation: volunteer.currentLocation,
        distance: distance ? distance.toFixed(2) : null,
        eta: eta,
        lastUpdated: lastUpdated,
        isResponding: volunteer.isResponding,
      };
    });

    volunteersWithTracking.sort((a, b) => {
      if (!a.distance) return 1;
      if (!b.distance) return -1;
      return parseFloat(a.distance) - parseFloat(b.distance);
    });

    console.log(`✅ Found ${volunteersWithTracking.length} responding volunteers`);
    volunteersWithTracking.forEach((v, i) => {
      console.log(`  Volunteer ${i + 1}: ${v.name}`);
      console.log(`    Distance: ${v.distance} km`);
      console.log(`    ETA: ${v.eta} minutes`);
    });
    console.log('========================================\n');

    res.json({
      success: true,
      emergency: {
        _id: emergency._id,
        emergencyType: emergency.emergencyType,
        urgency: emergency.urgency,
        status: emergency.status,
        location: emergency.location,
        description: emergency.description,
        createdAt: emergency.createdAt,
      },
      volunteers: volunteersWithTracking,
      totalResponding: volunteersWithTracking.length,
    });

  } catch (error) {
    console.error('❌ Error getting live tracking:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const getRespondingVolunteers = async (req, res) => {
  try {
    const { emergencyId } = req.params;

    console.log('📍 Getting responding volunteers for emergency:', emergencyId);

    const volunteers = await User.find({
      respondingToEmergency: emergencyId,
      isResponding: true,
    }).select('name contactNumber currentLocation isResponding');

    console.log(`✅ Found ${volunteers.length} responding volunteers`);

    res.json({
      success: true,
      volunteers,
    });

  } catch (error) {
    console.error('❌ Error getting responding volunteers:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const stopTracking = async (req, res) => {
  try {
    console.log('🛑 Stopping tracking for volunteer:', req.user._id);

    await User.findByIdAndUpdate(req.user._id, {
      isResponding: false,
      respondingToEmergency: null,
    });

    console.log('✅ Tracking stopped');

    res.json({
      success: true,
      message: 'Tracking stopped successfully',
    });

  } catch (error) {
    console.error('❌ Error stopping tracking:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

module.exports = {
  updateVolunteerLocation,
  getLiveTracking,
  getRespondingVolunteers,
  stopTracking,
};