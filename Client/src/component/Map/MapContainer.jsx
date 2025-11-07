import React from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';

const MapContainer = ({ 
  center = { lat: 28.6139, lng: 77.2090 },
  zoom = 12,
  emergencies = [],
  volunteers = [],
  onMapClick,
  selectedMarker,
  onMarkerClick,
  height = '600px'
}) => {
  const mapStyles = {
    height: height,
    width: '100%',
    borderRadius: '10px'
  };

  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: true,
    fullscreenControl: true,
  };

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  console.log('MapContainer rendering...');
  console.log('Center:', center);
  console.log('Emergencies count:', emergencies?.length);
  console.log('API Key loaded:', !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <div style={{ 
        padding: '40px', 
        background: '#fee', 
        color: '#c00', 
        borderRadius: '10px',
        textAlign: 'center'
      }}>
        <h3>❌ Google Maps API Key Missing</h3>
        <p>Please add VITE_GOOGLE_MAPS_API_KEY to your .env file</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ 
        padding: '40px', 
        background: '#fee', 
        color: '#c00', 
        borderRadius: '10px',
        textAlign: 'center'
      }}>
        <h3>❌ Error Loading Google Maps</h3>
        <p>{loadError.message}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ 
        height: height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f0f0f0',
        borderRadius: '10px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '15px' }}>🗺️</div>
          <div style={{ fontSize: '18px', color: '#666' }}>Loading map...</div>
        </div>
      </div>
    );
  }

  const getEmergencyIconUrl = (urgency) => {
    const colorMap = {
      critical: 'red',
      high: 'orange',
      medium: 'yellow',
      low: 'green',
    };
    const color = colorMap[urgency?.toLowerCase()] || 'red';
    return `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`;
  };

  return (
    <GoogleMap
      mapContainerStyle={mapStyles}
      zoom={zoom}
      center={center}
      options={mapOptions}
      onClick={onMapClick}
      onLoad={() => console.log('Map instance loaded')}
    >
      {/* Emergency Markers */}
      {emergencies && emergencies.length > 0 && emergencies.map((emergency) => {
        // Validate location data
        if (!emergency.location || !emergency.location.coordinates || 
            emergency.location.coordinates.length < 2) {
          console.warn('Invalid emergency location:', emergency._id);
          return null;
        }

        const lat = emergency.location.coordinates[1];
        const lng = emergency.location.coordinates[0];

        if (typeof lat !== 'number' || typeof lng !== 'number' || 
            isNaN(lat) || isNaN(lng)) {
          console.warn('Invalid coordinates:', { lat, lng, id: emergency._id });
          return null;
        }

        console.log(`Placing marker: ${emergency.emergencyType} at [${lat}, ${lng}]`);

        return (
          <Marker
            key={`emergency-${emergency._id}`}
            position={{ lat, lng }}
            icon={{
              url: getEmergencyIconUrl(emergency.urgency),
              scaledSize: new window.google.maps.Size(40, 40)
            }}
            onClick={() => onMarkerClick && onMarkerClick(emergency, 'emergency')}
            title={`${emergency.emergencyType} - ${emergency.urgency}`}
          />
        );
      })}

      {/* InfoWindow - Rendered separately with position prop */}
      {selectedMarker && selectedMarker.location?.coordinates && (
        <InfoWindow 
          position={{
            lat: selectedMarker.location.coordinates[1],
            lng: selectedMarker.location.coordinates[0]
          }}
          onCloseClick={() => onMarkerClick && onMarkerClick(null)}
        >
          <div style={{ padding: '12px', maxWidth: '280px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#c33', fontSize: '16px' }}>
              🚨 {selectedMarker.emergencyType}
            </h4>
            <p style={{ margin: '8px 0', fontSize: '13px' }}>
              <strong>Urgency:</strong> 
              <span style={{
                marginLeft: '8px',
                padding: '3px 10px',
                borderRadius: '4px',
                background: selectedMarker.urgency === 'critical' ? '#f44' : 
                           selectedMarker.urgency === 'high' ? '#f80' : 
                           selectedMarker.urgency === 'medium' ? '#fc0' : '#4c4',
                color: selectedMarker.urgency === 'medium' ? '#000' : '#fff',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                {selectedMarker.urgency?.toUpperCase()}
              </span>
            </p>
            <p style={{ margin: '8px 0', fontSize: '13px' }}>
              <strong>Status:</strong> {selectedMarker.status}
            </p>
            <p style={{ margin: '8px 0', fontSize: '13px' }}>
              <strong>Description:</strong> {selectedMarker.description}
            </p>
            <p style={{ margin: '8px 0', fontSize: '11px', color: '#666' }}>
              📅 {new Date(selectedMarker.createdAt).toLocaleString()}
            </p>
          </div>
        </InfoWindow>
      )}

      {/* Volunteer Markers */}
      {volunteers && volunteers.length > 0 && volunteers.map((volunteer) => {
        if (!volunteer.location || !volunteer.location.coordinates || 
            volunteer.location.coordinates.length < 2) {
          return null;
        }

        return (
          <Marker
            key={`volunteer-${volunteer._id}`}
            position={{
              lat: volunteer.location.coordinates[1],
              lng: volunteer.location.coordinates[0]
            }}
            icon={{
              url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new window.google.maps.Size(32, 32)
            }}
            onClick={() => onMarkerClick && onMarkerClick(volunteer, 'volunteer')}
            title={`Volunteer: ${volunteer.name}`}
          />
        );
      })}

      {/* User's current location marker */}
      {center.lat !== 28.6139 && center.lng !== 77.2090 && (
        <Marker
          position={center}
          icon={{
            url: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png',
            scaledSize: new window.google.maps.Size(32, 32)
          }}
          title="Your Location"
        />
      )}
    </GoogleMap>
  );
};

export default MapContainer;