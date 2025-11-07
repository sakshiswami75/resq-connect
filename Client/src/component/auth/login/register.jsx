import React, { useState } from 'react';
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import '../login/login.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'volunteer', // ← Changed default to 'volunteer'
    contactNumber: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    
    try {
      await register(
        formData.name,
        formData.email,
        formData.password,
        formData.userType,
        formData.contactNumber
      );
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setError('');
    
    try {
      await googleLogin(credentialResponse.credential, formData.userType);
      navigate('/dashboard');
    } catch (error) {
      console.error('Google signup failed:', error);
      setError(error.message || 'Google signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google signup failed. Please try again.');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Create Account</h1>
          <p>Join Emergency Resource Sharing</p>
        </div>

        {/* ← ADD EMERGENCY NOTICE */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 59, 48, 0.1) 0%, rgba(255, 149, 0, 0.1) 100%)',
          border: '2px solid rgba(255, 59, 48, 0.3)',
          borderRadius: '12px',
          padding: '15px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚨</div>
          <p style={{ 
            margin: 0, 
            fontSize: '14px', 
            fontWeight: '600',
            color: '#ff3b30'
          }}>
            Need Emergency Help Right Now?
          </p>
          <p style={{ 
            margin: '8px 0 12px 0', 
            fontSize: '13px',
            color: '#666'
          }}>
            No registration needed for emergency reporting
          </p>
          <button
            type="button"
            onClick={() => navigate('/emergency/report')}
            style={{
              background: 'linear-gradient(135deg, #ff3b30 0%, #e5251a 100%)',
              color: 'white',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(255, 59, 48, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(255, 59, 48, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(255, 59, 48, 0.3)';
            }}
          >
            🚨 Report Emergency (No Login)
          </button>
        </div>
        
        {/* Google Signup */}
        <div className="google-login-wrapper" style={{ marginTop: '20px' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="outline"
            size="large"
            text="signup_with"
            shape="rectangular"
            width="100%"
          />
        </div>

        <div className="divider">
          <span>OR</span>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message" style={{
              backgroundColor: '#fee',
              color: '#c33',
              padding: '10px',
              borderRadius: '5px',
              marginBottom: '15px',
              textAlign: 'center',
              border: '1px solid #fcc'
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="userType">I am a *</label>
            <select
              id="userType"
              name="userType"
              value={formData.userType}
              onChange={handleChange}
              style={{
                color: 'white',
                backgroundColor: "#13182b"
              }}
            >
              <option value="volunteer">Volunteer (Provide Help)</option>
              <option value="user">User (Need Help)</option>
              <option value="admin">Admin/Rescue Team</option>
            </select>
            <small style={{ 
              display: 'block', 
              marginTop: '5px', 
              fontSize: '12px', 
              color: '#666' 
            }}>
              {formData.userType === 'volunteer' && '✓ Get notified of nearby emergencies'}
              {formData.userType === 'user' && '✓ Track your emergency requests'}
              {formData.userType === 'admin' && '✓ Manage all emergencies and users'}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="At least 6 characters"
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Re-enter your password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="contactNumber">
              Contact Number {formData.userType === 'volunteer' && '*'}
            </label>
            <input
              type="tel"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              required={formData.userType === 'volunteer'}
              placeholder={
                formData.userType === 'volunteer' 
                  ? 'Required for volunteers' 
                  : 'Your contact number (optional)'
              }
            />
            {formData.userType === 'volunteer' && (
              <small style={{ 
                display: 'block', 
                marginTop: '5px', 
                fontSize: '12px', 
                color: '#ff9500' 
              }}>
                ⚠️ Required for volunteers to receive emergency calls
              </small>
            )}
          </div>
          
          <button 
            type="submit" 
            className="login-btn"
            disabled={isLoading}
            style={{
              background: formData.userType === 'volunteer' 
                ? 'linear-gradient(135deg, #007aff 0%, #0051d5 100%)' 
                : 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)'
            }}
          >
            {isLoading ? 'Creating Account...' : 
              formData.userType === 'volunteer' ? '🤝 Sign Up as Volunteer' : '📝 Sign Up'
            }
          </button>
        </form>
        
        <div className="login-footer">
          <p>Already have an account? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;