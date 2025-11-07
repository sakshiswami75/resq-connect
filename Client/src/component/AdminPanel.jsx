import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LiveTrackingView from './LiveTrackingView';
import api from '../services/api';
import './AdminPanel.css';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmergencies: 0,
    activeVolunteers: 0,
    avgResponseTime: 0
  });
  const [emergencies, setEmergencies] = useState([]);
  const [selectedEmergencyForTracking, setSelectedEmergencyForTracking] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is admin
    if (user?.userType !== 'admin') {
      alert('Access denied. Admin only.');
      navigate('/dashboard');
      return;
    }

    fetchAdminData();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchAdminData, 10000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  const fetchAdminData = async () => {
    try {
      console.log('Fetching admin panel data...');
      
      // Fetch admin stats
      const statsResponse = await api.get('/admin/stats');
      console.log('Stats received:', statsResponse.data);
      setStats(statsResponse.data);

      // Fetch all emergencies
      const emergenciesResponse = await api.get('/admin/emergencies');
      console.log('Emergencies received:', emergenciesResponse.data.length);
      setEmergencies(emergenciesResponse.data);

      // Fetch all users
      const usersResponse = await api.get('/admin/users');
      console.log('Users received:', usersResponse.data.length);
      setUsers(usersResponse.data);

      console.log('==========================================\n');
      
      setError('');
      setLoading(false);
    } catch (error) {
      console.error('==========================================');
      console.error('Error fetching admin data:', error);
      console.error('Error response:', error.response?.data);
      console.error('==========================================\n');
      
      setError(error.response?.data?.message || 'Failed to load admin data');
      setLoading(false);
    }
  };

  const handleDeleteEmergency = async (emergencyId) => {
    if (!window.confirm('Are you sure you want to delete this emergency?')) {
      return;
    }

    try {
      await api.delete(`/admin/emergencies/${emergencyId}`);
      alert('Emergency deleted successfully');
      fetchAdminData();
    } catch (error) {
      console.error('Error deleting emergency:', error);
      alert(error.response?.data?.message || 'Failed to delete emergency');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`);
      alert('User deleted successfully');
      fetchAdminData();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleUpdateEmergencyStatus = async (emergencyId, newStatus) => {
    try {
      await api.put(`/emergencies/${emergencyId}/status`, { status: newStatus });
      alert(`Emergency status updated to ${newStatus}`);
      fetchAdminData();
    } catch (error) {
      console.error('Error updating emergency status:', error);
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const toggleTracking = (emergencyId) => {
    if (selectedEmergencyForTracking === emergencyId) {
      setSelectedEmergencyForTracking(null);
    } else {
      setSelectedEmergencyForTracking(emergencyId);
    }
  };

  if (loading) {
    return (
      <div className="admin-panel">
        <div style={{ 
          textAlign: 'center', 
          padding: '50px', 
          color: 'white',
          fontSize: '24px'
        }}>
          ⏳ Loading Admin Panel...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <div>
          <h1>⚙️ Admin Dashboard</h1>
          <p>Emergency Management System</p>
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
            onClick={fetchAdminData}
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

      <div className="admin-content">
        {/* Statistics Cards */}
        <div className="admin-stats">
          <div className="stat-card">
            <h3>Total Emergencies</h3>
            <div className="stat-number">{stats.totalEmergencies || 0}</div>
            <div className="stat-label">All time</div>
          </div>
          <div className="stat-card">
            <h3>Active Volunteers</h3>
            <div className="stat-number">{stats.activeVolunteers || 0}</div>
            <div className="stat-label">Available now</div>
          </div>
          <div className="stat-card">
            <h3>Avg Response Time</h3>
            <div className="stat-number">{stats.avgResponseTime || 0} min</div>
            <div className="stat-label">Average time</div>
          </div>
          <div className="stat-card">
            <h3>Total Users</h3>
            <div className="stat-number">{users.length}</div>
            <div className="stat-label">Registered users</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'emergencies' ? 'active' : ''}`}
            onClick={() => setActiveTab('emergencies')}
          >
            🚨 Emergencies ({emergencies.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users ({users.length})
          </button>
          <button 
            onClick={fetchAdminData}
            style={{
              marginLeft: 'auto',
              background: '#4caf50',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🔄 Refresh Data
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-section">
              <h2>System Overview</h2>
              
              {/* Emergency Status Breakdown */}
              <div className="breakdown-section">
                <h3>Emergency Status Breakdown</h3>
                <div className="breakdown-grid">
                  <div className="breakdown-card pending">
                    <h4>Pending</h4>
                    <div className="breakdown-number">
                      {emergencies.filter(e => e.status === 'pending').length}
                    </div>
                  </div>
                  <div className="breakdown-card assigned">
                    <h4>Assigned</h4>
                    <div className="breakdown-number">
                      {emergencies.filter(e => e.status === 'assigned').length}
                    </div>
                  </div>
                  <div className="breakdown-card in-progress">
                    <h4>In Progress</h4>
                    <div className="breakdown-number">
                      {emergencies.filter(e => e.status === 'in-progress').length}
                    </div>
                  </div>
                  <div className="breakdown-card resolved">
                    <h4>Resolved</h4>
                    <div className="breakdown-number">
                      {emergencies.filter(e => e.status === 'resolved').length}
                    </div>
                  </div>
                </div>
              </div>

              {/* User Type Breakdown */}
              <div className="breakdown-section">
                <h3>User Type Breakdown</h3>
                <div className="breakdown-grid">
                  <div className="breakdown-card user">
                    <h4>Users</h4>
                    <div className="breakdown-number">
                      {users.filter(u => u.userType === 'user').length}
                    </div>
                  </div>
                  <div className="breakdown-card volunteer">
                    <h4>Volunteers</h4>
                    <div className="breakdown-number">
                      {users.filter(u => u.userType === 'volunteer').length}
                    </div>
                  </div>
                  <div className="breakdown-card admin">
                    <h4>Admins</h4>
                    <div className="breakdown-number">
                      {users.filter(u => u.userType === 'admin').length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="recent-activity">
                <h3>Recent Emergencies</h3>
                {emergencies.slice(0, 5).map(emergency => (
                  <div key={emergency._id} className="activity-item">
                    <div className={`activity-dot ${emergency.status}`}></div>
                    <div className="activity-content">
                      <strong>{emergency.emergencyType}</strong>
                      <span className={`status-badge ${emergency.status}`}>
                        {emergency.status}
                      </span>
                      <p>{new Date(emergency.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emergencies Tab */}
          {activeTab === 'emergencies' && (
            <div className="emergencies-section">
              <h2>All Emergencies</h2>
              
              {/* Emergency Cards with Tracking */}
              <div className="emergency-cards-grid">
                {emergencies.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px',
                    gridColumn: '1 / -1',
                    color: 'white'
                  }}>
                    No emergencies found
                  </div>
                ) : (
                  emergencies.map(emergency => (
                    <div key={emergency._id} className="admin-emergency-card">
                      <div className="emergency-card-header">
                        <div className="emergency-card-title">
                          <h3>{emergency.emergencyType}</h3>
                          <span className={`urgency-badge ${emergency.urgency}`}>
                            {emergency.urgency}
                          </span>
                        </div>
                        <span className={`status-badge ${emergency.status}`}>
                          {emergency.status}
                        </span>
                      </div>

                      <div className="emergency-card-body">
                        <div className="emergency-info-row">
                          <span className="info-label">👤 User:</span>
                          <span className="info-value">{emergency.user?.name || 'Anonymous'}</span>
                        </div>
                        <div className="emergency-info-row">
                          <span className="info-label">📍 Location:</span>
                          <span className="info-value">
                            {emergency.location?.address || 
                             `${emergency.location?.coordinates[1]?.toFixed(4)}, ${emergency.location?.coordinates[0]?.toFixed(4)}`}
                          </span>
                        </div>
                        <div className="emergency-info-row">
                          <span className="info-label">📝 Description:</span>
                          <span className="info-value">{emergency.description || 'N/A'}</span>
                        </div>
                        <div className="emergency-info-row">
                          <span className="info-label">⏰ Created:</span>
                          <span className="info-value">{new Date(emergency.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="emergency-info-row">
                          <span className="info-label">🆔 ID:</span>
                          <span className="info-value" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                            {emergency._id}
                          </span>
                        </div>
                      </div>

                      <div className="emergency-card-actions">
                        <select
                          value={emergency.status}
                          onChange={(e) => handleUpdateEmergencyStatus(emergency._id, e.target.value)}
                          className={`status-select ${emergency.status}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="assigned">Assigned</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="cancelled">Cancelled</option>
                        </select>

                        {/* Track Volunteers Button */}
                        {(emergency.status === 'assigned' || emergency.status === 'in-progress') && (
                          <button
                            onClick={() => toggleTracking(emergency._id)}
                            className={`track-btn ${selectedEmergencyForTracking === emergency._id ? 'active' : ''}`}
                          >
                            {selectedEmergencyForTracking === emergency._id ? (
                              <>📍 Hide Tracking</>
                            ) : (
                              <>📍 Track Volunteers</>
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteEmergency(emergency._id)}
                          className="delete-btn"
                        >
                          🗑️ Delete
                        </button>
                      </div>

                      {/* Live Tracking View */}
                      {selectedEmergencyForTracking === emergency._id && (
                        <div className="admin-tracking-section">
                          <div className="tracking-divider"></div>
                          <LiveTrackingView emergencyId={emergency._id} showMap={true} />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Old Table View (Alternative) */}
              <div className="table-container" style={{ marginTop: '30px', display: 'none' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>User</th>
                      <th>Urgency</th>
                      <th>Status</th>
                      <th>Location</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emergencies.map(emergency => (
                      <tr key={emergency._id}>
                        <td>{emergency._id.slice(-6)}</td>
                        <td>{emergency.emergencyType}</td>
                        <td>{emergency.user?.name || 'Unknown'}</td>
                        <td>
                          <span className={`urgency-badge ${emergency.urgency}`}>
                            {emergency.urgency}
                          </span>
                        </td>
                        <td>
                          <select
                            value={emergency.status}
                            onChange={(e) => handleUpdateEmergencyStatus(emergency._id, e.target.value)}
                            className={`status-select ${emergency.status}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="assigned">Assigned</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td>
                          {emergency.location?.address || 
                           `${emergency.location?.coordinates[1]?.toFixed(3)}, ${emergency.location?.coordinates[0]?.toFixed(3)}`}
                        </td>
                        <td>{new Date(emergency.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            onClick={() => handleDeleteEmergency(emergency._id)}
                            className="delete-btn"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="users-section">
              <h2>All Users</h2>
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Type</th>
                      <th>Contact</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map(userData => (
                        <tr key={userData._id}>
                          <td>{userData._id.slice(-6)}</td>
                          <td>{userData.name}</td>
                          <td>{userData.email}</td>
                          <td>
                            <span className={`user-type-badge ${userData.userType}`}>
                              {userData.userType}
                            </span>
                          </td>
                          <td>{userData.contactNumber || 'N/A'}</td>
                          <td>{new Date(userData.createdAt).toLocaleDateString()}</td>
                          <td>
                            {userData._id !== user._id && (
                              <button
                                onClick={() => handleDeleteUser(userData._id)}
                                className="delete-btn"
                              >
                                🗑️ Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Auto-refresh indicator */}
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          color: 'white',
          fontSize: '14px',
          opacity: 0.7
        }}>
          ⏱️ Auto-refreshing every 10 seconds
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;