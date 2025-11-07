import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import MapContainer from './Map/MapContainer';
import './VolunteerMap.css';

const VolunteerMap = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { emergencyId } = useParams(); // Get emergency ID from URL
  const [emergencies, setEmergencies] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [focusedEmergency, setFocusedEmergency] = useState(null);

  useEffect(() => {
    getUserLocation();
    fetchEmergencies();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchEmergencies, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle emergency ID from URL parameter
  useEffect(() => {
    console.log('Emergency ID from URL:', emergencyId);
    console.log('Total emergencies loaded:', emergencies.length);
    
    if (emergencyId && emergencies.length > 0) {
      console.log('Focusing on emergency from URL:', emergencyId);
      
      // Try both _id and id fields
      const emergency = emergencies.find(e => e._id === emergencyId || e.id === emergencyId);
      
      if (emergency) {
        console.log('Found emergency:', emergency);
        console.log('Emergency location:', emergency.location);
        console.log('Emergency coordinates:', emergency.location?.coordinates);
        
        setFocusedEmergency(emergency);
        setSelectedMarker(emergency);
        
        // Center map on this emergency
        if (emergency.location?.coordinates) {
          const newCenter = {
            lat: emergency.location.coordinates[1],
            lng: emergency.location.coordinates[0]
          };
          console.log('Setting map center to:', newCenter);
          setUserLocation(newCenter);
        } else {
          console.warn('Emergency has no coordinates');
          // Fall back to default location
          setUserLocation({ lat: 28.6139, lng: 77.2090 });
        }
      } else {
        console.warn('Emergency not found with ID:', emergencyId);
        console.log('Available emergency IDs:', emergencies.map(e => ({ id: e.id, _id: e._id })));
      }
    } else if (emergencyId && emergencies.length === 0) {
      console.log('Waiting for emergencies to load...');
    }
  }, [emergencyId, emergencies]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          // Only set user location if not focusing on specific emergency
          if (!emergencyId) {
            setUserLocation(location);
          }
          console.log('User location obtained:', location);
        },
        (error) => {
          console.error('Error getting location:', error);
          if (!emergencyId) {
            setUserLocation({ lat: 28.6139, lng: 77.2090 });
          }
        }
      );
    } else {
      if (!emergencyId) {
        setUserLocation({ lat: 28.6139, lng: 77.2090 });
      }
    }
  };

  const fetchEmergencies = async () => {
    try {
      console.log('==========================================');
      console.log('Fetching emergencies for map...');
      console.log('==========================================');
      
      const { data } = await api.get('/emergencies');
      
      console.log('API Response received');
      console.log('Total emergencies from API:', data.length);
      
      // Filter active emergencies on frontend
      const activeEmergencies = data.filter(e => 
        ['pending', 'assigned', 'in-progress'].includes(e.status)
      );
      
      console.log('Active emergencies after filter:', activeEmergencies.length);
      
      // Log each emergency's details
      activeEmergencies.forEach((emergency, index) => {
        console.log(`Emergency ${index + 1}:`, {
          id: emergency._id,
          type: emergency.emergencyType,
          status: emergency.status,
          urgency: emergency.urgency,
          hasLocation: !!emergency.location,
          hasCoordinates: !!emergency.location?.coordinates,
          coordinates: emergency.location?.coordinates,
          lat: emergency.location?.coordinates?.[1],
          lng: emergency.location?.coordinates?.[0]
        });
      });
      
      console.log('==========================================\n');
      
      setEmergencies(activeEmergencies);
      setError('');
    } catch (error) {
      console.error('==========================================');
      console.error('Error fetching emergencies:', error);
      console.error('Error response:', error.response?.data);
      console.error('==========================================\n');
      setError('Failed to load emergencies');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerClick = (marker, type) => {
    console.log('Marker clicked:', marker, type);
    setSelectedMarker(marker);
    setFocusedEmergency(marker);
  };

  const handleRespondToEmergency = async (emergencyId) => {
    try {
      await api.put(`/emergencies/${emergencyId}/respond`);
      alert('You have been assigned to this emergency!');
      fetchEmergencies();
      setSelectedMarker(null);
    } catch (error) {
      console.error('Error responding to emergency:', error);
      alert(error.response?.data?.message || 'Failed to respond to emergency');
    }
  };

  if (loading) {
    return (
      <div className="volunteer-map">
        <div style={{ 
          textAlign: 'center', 
          padding: '50px', 
          color: 'white',
          fontSize: '24px'
        }}>
          ⏳ Loading Map...
        </div>
      </div>
    );
  }

  return (
    <div className="volunteer-map">
      <header className="map-header">
        <div>
          <h1>🗺️ Live Emergency Map</h1>
          <p>Real-time tracking of emergencies and volunteers</p>
          {focusedEmergency && (
            <div style={{
              marginTop: '10px',
              padding: '8px 16px',
              background: 'rgba(255, 107, 107, 0.2)',
              border: '2px solid #ff6b6b',
              borderRadius: '8px',
              display: 'inline-block'
            }}>
              <strong>📍 Focused on:</strong> {focusedEmergency.emergencyType} Emergency
            </div>
          )}
        </div>
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back to Dashboard
        </button>
      </header>
      
      {error && (
        <div style={{
          background: '#fee',
          color: '#c33',
          padding: '15px',
          margin: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          border: '2px solid #fcc'
        }}>
          ❌ {error}
          <button 
            onClick={fetchEmergencies}
            style={{
              marginLeft: '10px',
              padding: '8px 16px',
              background: '#c33',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🔄 Retry
          </button>
        </div>
      )}

      <div className="map-content">
        <div className="map-stats">
          <div className="stat-item">
            <span className="stat-number">{emergencies.length}</span>
            <span className="stat-label">Active Emergencies</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{volunteers.length}</span>
            <span className="stat-label">Available Volunteers</span>
          </div>
        </div>

        <div className="map-legend">
          <h3>Legend:</h3>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#f00' }}></span>
            <span>Critical</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#f80' }}></span>
            <span>High</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#ff0' }}></span>
            <span>Medium</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#0f0' }}></span>
            <span>Low</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#36c' }}></span>
            <span>Volunteers</span>
          </div>
        </div>

        <div className="map-container-wrapper">
          {emergencies.length === 0 ? (
            <div style={{
              background: 'white',
              padding: '60px',
              borderRadius: '15px',
              textAlign: 'center',
              height: '600px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '72px', marginBottom: '20px' }}>✅</div>
              <h2 style={{ color: '#333', marginBottom: '10px' }}>No Active Emergencies</h2>
              <p style={{ color: '#666', fontSize: '16px', marginBottom: '30px' }}>
                All emergencies have been resolved or there are no active requests.
              </p>
              <button 
                onClick={fetchEmergencies}
                style={{
                  padding: '14px 28px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => e.target.style.background = '#5568d3'}
                onMouseOut={(e) => e.target.style.background = '#667eea'}
              >
                🔄 Refresh
              </button>
            </div>
          ) : (
            <MapContainer
              center={userLocation || { lat: 28.6139, lng: 77.2090 }}
              zoom={emergencyId ? 15 : 12}
              emergencies={emergencies}
              volunteers={volunteers}
              selectedMarker={selectedMarker}
              onMarkerClick={handleMarkerClick}
              height="600px"
            />
          )}
        </div>

        {selectedMarker && selectedMarker.emergencyType && (
          <div className="emergency-details-panel">
            <h3>🚨 Emergency Details</h3>
            <div className="detail-row">
              <strong>Type:</strong> {selectedMarker.emergencyType}
            </div>
            <div className="detail-row">
              <strong>Urgency:</strong> 
              <span className={`urgency-badge ${selectedMarker.urgency}`}>
                {selectedMarker.urgency?.toUpperCase()}
              </span>
            </div>
            <div className="detail-row">
              <strong>Description:</strong> {selectedMarker.description}
            </div>
            <div className="detail-row">
              <strong>Status:</strong> {selectedMarker.status}
            </div>
            <div className="detail-row">
              <strong>Location:</strong> {selectedMarker.location?.address || 
                `${selectedMarker.location?.coordinates[1]?.toFixed(4)}, ${selectedMarker.location?.coordinates[0]?.toFixed(4)}`}
            </div>
            <div className="detail-row">
              <strong>Reported:</strong> {new Date(selectedMarker.createdAt).toLocaleString()}
            </div>
            {user.userType === 'volunteer' && selectedMarker.status === 'pending' && (
              <button
                onClick={() => handleRespondToEmergency(selectedMarker._id)}
                className="respond-btn-map"
              >
                🚑 Respond to This Emergency
              </button>
            )}
            <button
              onClick={() => setSelectedMarker(null)}
              style={{
                marginTop: '10px',
                padding: '10px 20px',
                background: 'red',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                width: '100%',
                fontWeight: 'bold'
              }}
            >
              ✕ Close
            </button>
          </div>
        )}

        <div className="emergencies-list-sidebar">
          <h3>📋 Emergency List</h3>
          {emergencies.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
              No active emergencies
            </p>
          ) : (
            emergencies.map((emergency) => (
              <div
                key={emergency._id}
                className={`emergency-item ${emergency.urgency} ${
                  focusedEmergency?._id === emergency._id ? 'focused' : ''
                }`}
                onClick={() => {
                  handleMarkerClick(emergency, 'emergency');
                  if (emergency.location?.coordinates) {
                    setUserLocation({
                      lat: emergency.location.coordinates[1],
                      lng: emergency.location.coordinates[0]
                    });
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <h4>{emergency.emergencyType}</h4>
                <p className="urgency-text">{emergency.urgency?.toUpperCase()}</p>
                <p className="time-text">
                  {new Date(emergency.createdAt).toLocaleTimeString()}
                </p>
                <p style={{ fontSize: '12px', marginTop: '5px', color: '#666' }}>
                  <strong>Status:</strong> {emergency.status}
                </p>
              </div>
            ))
          )}
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          color: 'white',
          fontSize: '14px',
          opacity: 0.7,
          gridColumn: '1 / -1'
        }}>
          ⏱️ Auto-refreshing every 10 seconds
        </div>
      </div>
    </div>
  );
};

export default VolunteerMap;