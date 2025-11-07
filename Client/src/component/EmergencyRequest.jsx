import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './EmergencyRequest.css';
import MapContainer from './Map/MapContainer';

const EmergencyRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    emergencyType: '',
    description: '',
    urgency: 'medium',
    location: '',
    contactNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapLocation, setMapLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' }); // ← ADDED

  const emergencyTypes = [
    'Medical Emergency',
    'Accident',
    'Flood',
    'Fire',
    'Building Collapse',
    'Elderly Assistance',
    'Other'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear message on input change
    if (message.text) setMessage({ type: '', text: '' });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setFormData(prev => ({
        ...prev,
        location: 'Getting location...'
      }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationString = `${latitude}, ${longitude}`;
          console.log(' Location obtained:', locationString);
          setFormData(prev => ({
            ...prev,
            location: locationString
          }));
          setMapLocation({ lat: latitude, lng: longitude });
          setMessage({ type: 'success', text: '✅ Location obtained successfully!' });
          setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        },
        (error) => {
          console.error('Error getting location:', error);
          setMessage({ type: 'error', text: ' Unable to get location. Please enter manually.' });
          setFormData(prev => ({
            ...prev,
            location: ''
          }));
        }
      );
    } else {
      setMessage({ type: 'error', text: 'Geolocation is not supported by your browser.' });
    }
  };

  const handleMapClick = (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    const locationString = `${lat}, ${lng}`;
    
    setFormData({
      ...formData,
      location: locationString
    });
    
    setMapLocation({ lat, lng });
    setShowMap(false);
    
    console.log('Location selected from map:', locationString);
    setMessage({ type: 'success', text: 'Location selected from map!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const resetForm = () => {
    setFormData({
      emergencyType: '',
      description: '',
      urgency: 'medium',
      location: '',
      contactNumber: ''
    });
    setMapLocation(null);
    setShowMap(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    console.log('========================================');
    console.log('Submitting Emergency Request');
    console.log('========================================');
    console.log('Form Data:', formData);
    console.log('Current User:', user);
    console.log('Has Token:', !!user?.token);
    console.log('========================================');

    // Validation
    if (!formData.emergencyType) {
      setMessage({ type: 'error', text: 'Please select an emergency type' });
      setIsSubmitting(false);
      return;
    }

    if (!formData.description) {
      setMessage({ type: 'error', text: 'Please add a description' });
      setIsSubmitting(false);
      return;
    }

    if (!formData.location) {
      setMessage({ type: 'error', text: 'Please provide a location' });
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Sending POST request to /api/emergencies');
      
      const response = await api.post('/emergencies', formData);
      
      console.log('Success Response:', response.data);
      console.log('========================================\n');
      
      setMessage({ type: 'success', text: 'Emergency request submitted successfully! Redirecting...' });
      
      setTimeout(() => {
        resetForm();
        navigate('/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('========================================');
      console.error('EMERGENCY REQUEST FAILED');
      console.error('========================================');
      console.error('Error Object:', error);
      console.error('Response:', error.response);
      console.error('Response Data:', error.response?.data);
      console.error('Response Status:', error.response?.status);
      console.error('Error Message:', error.message);
      console.error('========================================\n');
      
      let errorMessage = 'Failed to submit emergency request.';
      
      if (error.response) {
        errorMessage = error.response.data?.message || 
                      `Server Error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Check if backend is running.';
      } else {
        errorMessage = error.message;
      }
      
      setMessage({ type: 'error', text: `❌ ${errorMessage}` });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="emergency-request">
      <header className="request-header">
        <div>
          <h1>🚨 Request Emergency Assistance</h1>
          <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '16px' }}>
            Fill out the form below to request immediate help
          </p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back to Dashboard
        </button>
      </header>

      <div className="request-content">
        <form onSubmit={handleSubmit} className="emergency-form">
          {/* Form Title */}
          <h2 style={{ 
            marginTop: 0, 
            color: '#fff7f7ff', 
            fontSize: '24px', 
            marginBottom: '25px',
            paddingBottom: '15px',
            borderBottom: '2px solid #eee'
          }}>
            Emergency Details
          </h2>

          {/* Message Display */}
          {message.text && (
            <div style={{
              padding: '15px 20px',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center',
              fontWeight: '600',
              background: message.type === 'error' ? '#fee' : '#efe',
              color: message.type === 'error' ? '#c33' : '#363',
              border: `2px solid ${message.type === 'error' ? '#fcc' : '#cfc'}`
            }}>
              {message.text}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="emergencyType">Emergency Type *</label>
            <select
              id="emergencyType"
              name="emergencyType"
              value={formData.emergencyType}
              onChange={handleChange}
              required
                style={{
                color : 'white',
                backgroundColor:"#13182b"
              }}
            >
              <option value="">Select emergency type</option>
              {emergencyTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="urgency">Urgency Level *</label>
            <div className="urgency-options">
              {['low', 'medium', 'high', 'critical'].map(level => (
                <label key={level} className="urgency-option">
                  <input
                    type="radio"
                    name="urgency"
                    value={level}
                    checked={formData.urgency === level}
                    onChange={handleChange}
                    required
                  />
                  <span className={`urgency-dot ${level}`}></span>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <div className="location-input">
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="Enter your location or use current location"
              />
              <button type="button" onClick={getCurrentLocation} className="location-btn">
                📍 Use Current Location
              </button>
              <button type="button" onClick={() => setShowMap(!showMap)} className="location-btn">
                🗺️ {showMap ? 'Hide Map' : 'Pick on Map'}
              </button>
            </div>
            
            {showMap && (
              <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden' }}>
                <MapContainer
                  center={mapLocation || { lat: 28.6139, lng: 77.2090 }}
                  zoom={13}
                  emergencies={[]}
                  volunteers={[]}
                  onMapClick={handleMapClick}
                  height="400px"
                />
                <p style={{ 
                  fontSize: '12px', 
                  color: '#666', 
                  marginTop: '8px',
                  padding: '8px',
                  background: '#f0f0f0',
                  borderRadius: '4px',
                  textAlign: 'center'
                }}>
                  📍 Click anywhere on the map to select your location
                </p>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="contactNumber">Contact Number</label>
            <input
              type="tel"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="Optional contact number"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Emergency Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              placeholder="Please describe the emergency situation in detail..."
            />
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span style={{ display: 'inline-block', marginRight: '8px' }}>⏳</span>
                  Submitting...
                </>
              ) : (
                '🚨 Request Emergency Help'
              )}
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/dashboard')}
              className="cancel-btn"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmergencyRequest;