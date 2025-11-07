// src/component/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import NotificationBell from '../component/NotificationBell';
import LiveTrackingView from '../component/LiveTrackingView';
import './Dashboard.css';
import { onMessageListener } from '../config/firebase';

const DEBUG = import.meta.env.DEV || false; // true in dev, false in production

// Simple Modal component (self-contained)
const Modal = ({ children, onClose, title }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: '900px',
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: '12px',
          background: '#0f1724',
          padding: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ margin: 0 }}>{title || 'Tracking Map'}</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' }}>✕</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Data state
  const [emergencies, setEmergencies] = useState([]);
  const [stats, setStats] = useState({
    activeEmergencies: 0,
    availableVolunteers: 0,
    resolvedToday: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tracking and UI state
  const [trackingEmergencies, setTrackingEmergencies] = useState([]);
  const [selectedEmergencyForTracking, setSelectedEmergencyForTracking] = useState(null);

  // Modal state for map viewing
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Refs for optimizations & cleanup
  const prevDataRef = useRef({ emergencies: null, stats: null });
  const intervalRef = useRef(null);
  const isPageVisibleRef = useRef(true);

  useEffect(() => {
    // initial fetch
    fetchDashboardData();

    // auto-refresh interval that respects page visibility
    intervalRef.current = setInterval(() => {
      if (isPageVisibleRef.current) {
        fetchDashboardData();
      } else if (DEBUG) {
        console.debug('Tab hidden — skipping dashboard fetch');
      }
    }, 10000);

    // visibility change listener
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden;
      if (DEBUG) console.debug('Page visibility changed. Visible:', isPageVisibleRef.current);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  useEffect(() => {
    // Firebase on-message listener for realtime notifications
    const unsubPromise = onMessageListener()
      .then((payload) => {
        if (DEBUG) console.log('🔔 Notification received in dashboard:', payload);

        if (Notification && Notification.permission === 'granted') {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: '/emergency-icon.png',
            tag: payload.data?.emergencyId,
            requireInteraction: true,
          });
        }

        // fetch fresh data on notification
        fetchDashboardData();
      })
      .catch((err) => {
        if (DEBUG) console.error('Notification listener error:', err);
      });

    // no explicit unsubscribe available if onMessageListener returns a promise — keep defensive
    return () => {
      // nothing to cleanup here unless your onMessageListener returns an unsubscribe function
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      if (DEBUG) {
        console.log('==========================================');
        console.log('🔄 Fetching dashboard data...');
        console.log('==========================================');
      }

      const { data } = await api.get('/dashboard/stats');

      if (DEBUG) {
        console.log('✅ Dashboard data received');
        console.log('📊 Stats:', data.stats);
        console.log('📦 Emergencies count:', data.emergencies?.length);
        data.emergencies?.forEach((emergency, index) => {
          console.log(`Dashboard Emergency ${index + 1}:`, {
            id: emergency.id,
            type: emergency.type,
            urgency: emergency.urgency,
            status: emergency.status,
            location: emergency.location,
            time: emergency.time
          });
        });
        console.log('==========================================\n');
      }

      // Lightweight deep-compare via JSON.stringify (acceptable for small arrays)
      const newEmergencies = data.emergencies || [];
      const newStats = data.stats || { activeEmergencies: 0, availableVolunteers: 0, resolvedToday: 0 };

      const prevEmergenciesStr = JSON.stringify(prevDataRef.current.emergencies || []);
      const newEmergenciesStr = JSON.stringify(newEmergencies);
      const prevStatsStr = JSON.stringify(prevDataRef.current.stats || {});
      const newStatsStr = JSON.stringify(newStats);

      if (prevEmergenciesStr !== newEmergenciesStr) {
        setEmergencies(newEmergencies);
        prevDataRef.current.emergencies = newEmergencies;
      } else if (DEBUG) {
        console.debug('No change in emergencies — skipping setState');
      }

      if (prevStatsStr !== newStatsStr) {
        setStats(newStats);
        prevDataRef.current.stats = newStats;
      } else if (DEBUG) {
        console.debug('No change in stats — skipping setState');
      }

      setLoading(false);
      setError('');
    } catch (err) {
      console.error('==========================================');
      console.error('❌ Error fetching dashboard data:', err);
      console.error('Error response:', err.response?.data);
      console.error('==========================================\n');

      setError('Failed to load dashboard data');
      setLoading(false);

      setEmergencies([]);
      setStats({ activeEmergencies: 0, availableVolunteers: 0, resolvedToday: 0 });
    }
  };

  const handleLogout = () => {
    // Stop all tracking geolocation watchers before logout
    trackingEmergencies.forEach(emergencyId => {
      const watchId = localStorage.getItem(`tracking_${emergencyId}`);
      if (watchId) {
        try {
          navigator.geolocation.clearWatch(parseInt(watchId));
        } catch (e) {
          // ignore
        }
        localStorage.removeItem(`tracking_${emergencyId}`);
      }
    });

    logout();
    setTimeout(() => navigate('/', { replace: true }), 0);
  };

  const handleEmergencyAction = async (emergencyId, action) => {
    if (action === 'respond' && user.userType === 'volunteer') {
      try {
        if (DEBUG) console.log('🚑 Volunteer responding to emergency:', emergencyId);

        await api.put(`/emergencies/${emergencyId}/respond`);

        alert('✅ You have been assigned to this emergency! Location tracking started.');

        // Auto-start location tracking
        startAutoTracking(emergencyId);

        fetchDashboardData();
      } catch (err) {
        console.error('Error responding to emergency:', err);
        alert(err.response?.data?.message || 'Failed to respond to emergency');
      }
    } else if (action === 'view') {
      // open the map modal for focused viewing
      const emergencyObj = emergencies.find(e => e.id === emergencyId) || { id: emergencyId, location: '0,0' };
      setSelectedEmergencyForTracking(emergencyObj);
      setIsMapModalOpen(true);
    }
  };

  const startAutoTracking = (emergencyId) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (DEBUG) console.log('✅ Location permission granted');

        if (!trackingEmergencies.includes(emergencyId)) {
          setTrackingEmergencies(prev => [...prev, emergencyId]);
        }

        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;

            if (DEBUG) console.log('📍 Sending location update:', { latitude, longitude, emergencyId });

            api.put('/volunteers/location', {
              latitude,
              longitude,
              emergencyId,
            }).then(() => {
              if (DEBUG) console.log('✅ Location sent to server');
            }).catch((err) => {
              console.error('❌ Failed to send location:', err);
            });
          },
          (error) => {
            console.error('❌ Location tracking error:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        );

        // keep watch id as string (localStorage only stores strings)
        localStorage.setItem(`tracking_${emergencyId}`, String(watchId));

        if (DEBUG) console.log('✅ Auto-tracking started with watchId:', watchId);
      },
      (error) => {
        console.error('❌ Location permission denied:', error);
        alert('Please enable location services to respond to emergencies');
      }
    );
  };

  const stopTracking = async (emergencyId) => {
    if (DEBUG) console.log('🛑 Stopping tracking for emergency:', emergencyId);

    const watchId = localStorage.getItem(`tracking_${emergencyId}`);
    if (watchId) {
      try {
        navigator.geolocation.clearWatch(parseInt(watchId));
      } catch (e) {
        // ignore
      }
      localStorage.removeItem(`tracking_${emergencyId}`);
    }

    setTrackingEmergencies(prev => prev.filter(id => id !== emergencyId));

    try {
      await api.put('/volunteers/stop-tracking');
      if (DEBUG) console.log('✅ Tracking stopped on server');
    } catch (err) {
      console.error('❌ Failed to stop tracking on server:', err);
    }
  };

  // cleanup watchers if component unmounts
  useEffect(() => {
    return () => {
      trackingEmergencies.forEach(emergencyId => {
        const watchId = localStorage.getItem(`tracking_${emergencyId}`);
        if (watchId) {
          try {
            navigator.geolocation.clearWatch(parseInt(watchId));
          } catch (e) {}
          localStorage.removeItem(`tracking_${emergencyId}`);
        }
      });
    };
  }, [trackingEmergencies]);

  // UI handlers
  const handleToggleTrackModal = (emergency) => {
    if (!emergency) {
      setSelectedEmergencyForTracking(null);
      setIsMapModalOpen(false);
      return;
    }
    setSelectedEmergencyForTracking(emergency);
    setIsMapModalOpen(true);
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-state">
          ⏳ Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>ResQConnect</h1>
          <div className="user-info">
            <NotificationBell />
            <span>Welcome, {user?.name || user?.email}</span>
            <span className={`user-type-badge ${user?.userType}`}>
              {user?.userType?.toUpperCase()}
            </span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        {error && (
          <div className="error-state">
            ❌ {error}
            <button onClick={fetchDashboardData} className="retry-btn">
              🔄 Retry
            </button>
          </div>
        )}

        {trackingEmergencies.length > 0 && user.userType === 'volunteer' && (
          <div className="active-tracking-banner">
            <div className="tracking-pulse"></div>
            <div className="tracking-info">
              <strong>🚨 Active Tracking:</strong> You are being tracked for {trackingEmergencies.length} emergency(ies)
            </div>
          </div>
        )}

        <div className="quick-actions">
          {user.userType === 'user' && (
            <Link to="/emergency" className="action-btn primary">
              🚨 Request Emergency Help
            </Link>
          )}
          <Link to="/map" className="action-btn secondary">
            🗺️ View Live Map
          </Link>
          {user.userType === 'admin' && (
            <Link to="/admin" className="action-btn secondary">
              ⚙️ Admin Panel
            </Link>
          )}
          <button
            onClick={() => { if (document.hidden) { alert('Tab is hidden — cannot refresh right now.'); } else fetchDashboardData(); }}
            className="action-btn secondary"
            style={{ background: 'linear-gradient(135deg, #4caf50, #2e7d32)' }}
          >
            🔄 Refresh Data
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Active Emergencies</h3>
            <div className="stat-number">{stats.activeEmergencies}</div>
            <div className="stat-label">Needs assistance now</div>
          </div>
          <div className="stat-card">
            <h3>Available Volunteers</h3>
            <div className="stat-number">{stats.availableVolunteers}</div>
            <div className="stat-label">Ready to help</div>
          </div>
          <div className="stat-card">
            <h3>Resolved Today</h3>
            <div className="stat-number">{stats.resolvedToday}</div>
            <div className="stat-label">Successfully helped</div>
          </div>
        </div>

        <div className="emergencies-section">
          <h2>Recent Emergency Requests</h2>

          {emergencies.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
              <h3>No Active Emergencies</h3>
              <p>All clear! No emergencies at the moment.</p>
            </div>
          ) : (
            <div className="emergencies-list">
              {emergencies.map(emergency => (
                <div key={emergency.id} className={`emergency-card ${emergency.urgency?.toLowerCase()}`}>
                  <div className="emergency-info">
                    <h4>
                      {emergency.type} Emergency
                      <span className={`urgency-badge ${emergency.urgency?.toLowerCase()}`}>
                        {emergency.urgency}
                      </span>
                    </h4>
                    <p><strong>Location:</strong> {emergency.location}</p>
                    <p><strong>Status:</strong> {emergency.status}</p>
                    <p><strong>Time:</strong> {emergency.time}</p>
                    {emergency.description && (
                      <p><strong>Details:</strong> {emergency.description}</p>
                    )}

                    {trackingEmergencies.includes(emergency.id) && (
                      <div className="tracking-active-indicator">
                        <div className="tracking-dot"></div>
                        <span>📍 Location tracking active</span>
                      </div>
                    )}
                  </div>

                  <div className="emergency-actions">
                    {user.userType === 'volunteer' && emergency.status === 'pending' && (
                      <button
                        onClick={() => handleEmergencyAction(emergency.id, 'respond')}
                        className="respond-btn"
                      >
                        🚑 Respond
                      </button>
                    )}

                    {trackingEmergencies.includes(emergency.id) && user.userType === 'volunteer' && (
                      <button
                        onClick={() => stopTracking(emergency.id)}
                        className="stop-tracking-btn"
                      >
                        🛑 Stop Tracking
                      </button>
                    )}

                    <button
                      onClick={() => handleEmergencyAction(emergency.id, 'view')}
                      className="view-btn"
                    >
                      📍 View on Map
                    </button>

                    {(emergency.status === 'assigned' || emergency.status === 'in-progress') && (
                      <button
                        onClick={() => {
                          // toggle inline selection (but we open modal by default)
                          if (selectedEmergencyForTracking?.id === emergency.id) {
                            setSelectedEmergencyForTracking(null);
                            setIsMapModalOpen(false);
                          } else {
                            setSelectedEmergencyForTracking(emergency);
                            setIsMapModalOpen(true);
                          }
                        }}
                        className="track-btn"
                      >
                        {selectedEmergencyForTracking?.id === emergency.id ? '📍 Hide Tracking' : '📍 Track Volunteers'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="auto-refresh">
          ⏱️ Auto-refreshing every 10 seconds
        </div>
      </div>

      {/* Map Modal */}
      {isMapModalOpen && selectedEmergencyForTracking && (
        <Modal
          title={`Tracking: ${selectedEmergencyForTracking.type || 'Emergency'}`}
          onClose={() => { setIsMapModalOpen(false); setSelectedEmergencyForTracking(null); }}
        >
          <div style={{ height: '70vh' }}>
            <LiveTrackingView emergency={selectedEmergencyForTracking} showMap={true} />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
