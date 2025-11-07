import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './QuickEmergencyReport.css';

const QuickEmergencyReport = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emergencyId, setEmergencyId] = useState(null);
  const [selectedType, setSelectedType] = useState('');
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
  });
  const [locationStatus, setLocationStatus] = useState('detecting');

  // Auto-detect location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      setLocationStatus('detecting');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationStatus('detected');
          console.log('Location detected:', position.coords);
        },
        (error) => {
          console.error('Location error:', error);
          setLocationStatus('failed');
          alert('Please enable location services to report emergency');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationStatus('not-supported');
      alert('Your browser does not support location services');
    }
  }, []);

  const emergencyTypes = [
    { value: 'Medical Emergency', label: '🏥 Medical Emergency', color: '#ff3b30' },
    { value: 'Accident', label: '🚗 Accident', color: '#ff9500' },
    { value: 'Fire', label: '🔥 Fire', color: '#ff5722' },
    { value: 'Flood', label: '🌊 Flood', color: '#2196f3' },
    { value: 'Elderly Assistance', label: '👴 Elderly Assistance', color: '#9c27b0' },
    { value: 'Other', label: '⚠️ Other Emergency', color: '#607d8b' },
  ];

  const handleReport = async () => {
    if (!selectedType) {
      alert('Please select emergency type');
      return;
    }

    if (!location.latitude || !location.longitude) {
      alert('Location is required. Please enable location services.');
      return;
    }

    setLoading(true);

    try {
      // Create quick emergency report without authentication
      const locationString = `${location.latitude}, ${location.longitude}`;
      
      const response = await api.post('/emergencies/quick-report', {
        emergencyType: selectedType,
        location: locationString,
        urgency: 'high', // Default to high for quick reports
        description: `Quick emergency report: ${selectedType}`,
        isQuickReport: true,
      });

      console.log('Emergency reported:', response.data);
      
      setEmergencyId(response.data.emergency._id || response.data.emergency.id);
      setSubmitted(true);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error('Error reporting emergency:', error);
      alert(error.response?.data?.message || 'Failed to report emergency. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="quick-emergency-page">
        <div className="success-container">
          <div className="success-animation">
            <div className="success-icon">✓</div>
            <div className="success-pulse"></div>
          </div>
          
          <h1 className="success-title">Help is On The Way!</h1>
          <p className="success-subtitle">Emergency reported successfully</p>

          <div className="success-info">
            <div className="info-card">
              <div className="info-icon">🚨</div>
              <div className="info-text">
                <h3>Volunteers Alerted</h3>
                <p>Nearby volunteers and admin have been notified</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">📍</div>
              <div className="info-text">
                <h3>Location Shared</h3>
                <p>Your exact location has been shared with responders</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">⚡</div>
              <div className="info-text">
                <h3>Responders Dispatched</h3>
                <p>Help should arrive within minutes</p>
              </div>
            </div>
          </div>

          {emergencyId && (
            <div className="emergency-id">
              <p>Emergency ID:</p>
              <code>{emergencyId}</code>
              <small>Save this for reference</small>
            </div>
          )}

          <div className="critical-hotlines">
            <h3>🚨 Critical Emergency? Call Now:</h3>
            <div className="hotline-grid">
              <a href="tel:100" className="hotline-btn emergency">
                <span>🚨</span>
                <strong>Police</strong>
                <span className="number">100</span>
              </a>
              <a href="tel:102" className="hotline-btn emergency">
                <span>🚑</span>
                <strong>Ambulance</strong>
                <span className="number">102</span>
              </a>
              <a href="tel:101" className="hotline-btn emergency">
                <span>🔥</span>
                <strong>Fire</strong>
                <span className="number">101</span>
              </a>
            </div>
          </div>

          <button onClick={() => navigate('/')} className="btn-home">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quick-emergency-page">
      <div className="quick-report-container">
        <button onClick={() => navigate('/')} className="back-btn">
          ← Back
        </button>

        <div className="report-header">
          <div className="emergency-badge">
            <span className="badge-icon">🚨</span>
            <span className="badge-pulse"></span>
          </div>
          <h1>Emergency Alert</h1>
          <p className="urgent-text">Help will arrive in minutes</p>
        </div>

        {/* Location Status */}
        <div className={`location-status ${locationStatus}`}>
          {locationStatus === 'detecting' && (
            <>
              <div className="location-spinner"></div>
              <span>Detecting your location...</span>
            </>
          )}
          {locationStatus === 'detected' && (
            <>
              <span className="location-icon">✓</span>
              <span>Location detected • Ready to send alert</span>
            </>
          )}
          {locationStatus === 'failed' && (
            <>
              <span className="location-icon">⚠️</span>
              <span>Location required - Please enable GPS</span>
            </>
          )}
        </div>

        {/* Emergency Type Selection */}
        <div className="quick-form">
          <h2>What's the Emergency?</h2>
          <p className="form-subtitle">Select one to alert nearby volunteers</p>
          
          <div className="emergency-types-grid">
            {emergencyTypes.map((type) => (
              <button
                key={type.value}
                className={`emergency-type-btn ${
                  selectedType === type.value ? 'selected' : ''
                }`}
                onClick={() => setSelectedType(type.value)}
                style={{
                  borderColor: selectedType === type.value ? type.color : 'transparent',
                }}
              >
                <span className="type-label">{type.label}</span>
                {selectedType === type.value && (
                  <span className="selected-check">✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Location Display */}
          {location.latitude && location.longitude && (
            <div className="location-display">
              <div className="location-icon-large">📍</div>
              <div className="location-details">
                <strong>Your Location</strong>
                <p>Lat: {location.latitude.toFixed(6)}, Long: {location.longitude.toFixed(6)}</p>
                <small>This will be shared with volunteers and admin</small>
              </div>
            </div>
          )}

          {/* Send Alert Button */}
          <button
            onClick={handleReport}
            className="send-alert-btn"
            disabled={loading || !location.latitude || !selectedType}
          >
            {loading ? (
              <>
                <div className="btn-spinner"></div>
                Sending Alert...
              </>
            ) : (
              <>
                🚨 Send Emergency Alert
              </>
            )}
          </button>

          <p className="instant-note">
            ⚡ Alert sent instantly to all nearby volunteers and admin
          </p>
        </div>

        {/* Emergency Hotlines */}
        <div className="hotlines-section">
          <h3>In Life-Threatening Emergency:</h3>
          <div className="hotline-grid">
            <a href="tel:100" className="hotline-btn">🚨 Police: 100</a>
            <a href="tel:102" className="hotline-btn">🚑 Ambulance: 102</a>
            <a href="tel:101" className="hotline-btn">🔥 Fire: 101</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickEmergencyReport;