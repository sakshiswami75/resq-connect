import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    emergencies: 0,
    volunteers: 0,
    responseTime: 0,
    activeEmergencies: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${API_URL}/dashboard/public-stats`);
        setStats(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats({
          emergencies: 1234,
          volunteers: 567,
          responseTime: 4.2,
          activeEmergencies: 12,
          totalUsers: 850,
        });
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">
            <span className="logo-icon">🚨</span>
            <span className="logo-text">ResQConnect</span>
          </div>
          <div className="nav-buttons">
            <button onClick={() => navigate('/login')} className="nav-btn volunteer-login">
              Volunteer Login
            </button>
            <button onClick={() => navigate('/register')} className="nav-btn volunteer-signup">
              Join as Volunteer
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Prominent SOS */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-main">
            {/* Emergency Alert Badge */}
            <div className="emergency-badge">
              <span className="badge-pulse"></span>
              <span className="badge-text">24/7 Emergency Response</span>
            </div>

            <h1 className="hero-title">
              Every Second Counts in an Emergency
            </h1>
            
            <p className="hero-subtitle">
              Instant emergency reporting without login. Connect with verified volunteers near you in seconds.
            </p>

            {/* PRIMARY SOS BUTTON - MOST PROMINENT */}
            <div className="sos-button-container">
              <button onClick={() => navigate('/emergency/report')} className="btn-sos-primary">
                <span className="sos-icon">🚨</span>
                <span className="sos-text">
                  <span className="sos-main">REPORT EMERGENCY NOW</span>
                  <span className="sos-sub">No Login Required • Instant Help</span>
                </span>
                <span className="sos-arrow">→</span>
              </button>
            </div>

            <div className="trust-indicators">
              <div className="trust-item">
                <span className="trust-icon">⚡</span>
                <span className="trust-text">Instant Response</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">✓</span>
                <span className="trust-text">Verified Volunteers</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">🔒</span>
                <span className="trust-text">100% Free</span>
              </div>
            </div>

            {/* Secondary CTA for Volunteers */}
            <div className="secondary-cta">
              <p className="secondary-text">Want to help others?</p>
              <button onClick={() => navigate('/register')} className="btn-volunteer-secondary">
                Become a Volunteer
              </button>
            </div>

            {/* Live Stats */}
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">
                  {loading ? '...' : `${stats.emergencies.toLocaleString()}+`}
                </div>
                <div className="stat-label">Lives Helped</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">
                  {loading ? '...' : `${stats.volunteers.toLocaleString()}+`}
                </div>
                <div className="stat-label">Active Heroes</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">
                  {loading ? '...' : `${stats.responseTime} min`}
                </div>
                <div className="stat-label">Avg Response</div>
              </div>
            </div>

            {!loading && (
              <div className="live-status">
                <span className="status-dot"></span>
                <span className="status-text">
                  {stats.activeEmergencies} active emergencies • {stats.totalUsers} users online
                </span>
              </div>
            )}
          </div>

          {/* Hero Image Section with Emergency Photos */}
          <div className="hero-images">
            <div className="image-grid">
              <div className="image-card image-large">
                <img 
                  src="https://images.unsplash.com/photo-1582719471137-c3967ffb1c42?w=800&q=80" 
                  alt="Emergency medical response"
                  className="emergency-img"
                />
                <div className="image-overlay">
                  <span className="overlay-text">Medical Emergency</span>
                </div>
              </div>
              <div className="image-card image-small">
                <img 
                  src="https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=400&q=80" 
                  alt="Ambulance response"
                  className="emergency-img"
                />
                <div className="image-overlay">
                  <span className="overlay-text">Rapid Response</span>
                </div>
              </div>
              <div className="image-card image-small">
                <img 
                  src="https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=400&q=80" 
                  alt="First aid assistance"
                  className="emergency-img"
                />
                <div className="image-overlay">
                  <span className="overlay-text">First Aid</span>
                </div>
              </div>
              <div className="image-card image-medium">
                <img 
                  src="https://images.unsplash.com/photo-1571772996211-2f02c9727629?w=600&q=80" 
                  alt="Emergency volunteers"
                  className="emergency-img"
                />
                <div className="image-overlay">
                  <span className="overlay-text">Community Heroes</span>
                </div>
              </div>
            </div>
            <div className="floating-badge">
              <div className="badge-content">
                <span className="badge-icon">✓</span>
                <div className="badge-info">
                  <span className="badge-title">Verified Network</span>
                  <span className="badge-desc">Trusted Volunteers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="emergency-types">
  <div className="container">
    <h2 className="section-title">We Handle All Emergency Types</h2>
    <p className="section-description">Immediate assistance for any crisis situation</p>
    
    <div className="types-grid">
      {/* Medical Emergency */}
      <div className="type-card">
        <div className="type-image">
          <img 
            src="https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=400&h=250" 
            alt="Medical Emergency"
          />
        </div>
        <div className="type-content">
          <div className="type-icon">🏥</div>
          <h3 className="type-title">Medical Emergency</h3>
          <p className="type-description">Heart attacks, injuries, health crises</p>
          {/* <div className="type-volunteers">342 volunteers ready</div> */}
        </div>
      </div>

      {/* Accidents */}
      <div className="type-card">
        <div className="type-image">
          <img 
          src="https://images.pexels.com/photos/163016/crash-test-collision-60-km-h-distraction-163016.jpeg?auto=compress&cs=tinysrgb&w=400&h=250"
          alt="Accidents"
          />
        </div>
        <div className="type-content">
          <div className="type-icon">🚗</div>
          <h3 className="type-title">Accidents</h3>
          <p className="type-description">Road accidents, falls, injuries</p>
          {/* <div className="type-volunteers">289 volunteers ready</div> */}
        </div>
      </div>


      <div className="type-card">
        <div className="type-image">
          <img 
            src="https://images.pexels.com/photos/207353/pexels-photo-207353.jpeg?auto=compress&cs=tinysrgb&w=400&h=250" 
            alt="Fire Emergency"
          />
        </div>
        <div className="type-content">
          <div className="type-icon">🔥</div>
          <h3 className="type-title">Fire</h3>
          <p className="type-description">Fire outbreaks, smoke incidents</p>
          {/* <div className="type-volunteers">156 volunteers ready</div> */}
        </div>
      </div>

      {/* Natural Disasters */}
      <div className="type-card">
        <div className="type-image">
          <img 
            src="https://images.pexels.com/photos/1119974/pexels-photo-1119974.jpeg?auto=compress&cs=tinysrgb&w=400&h=250" 
            alt="Natural Disasters"
          />
        </div>
        <div className="type-content">
          <div className="type-icon">🌊</div>
          <h3 className="type-title">Natural Disasters</h3>
          <p className="type-description">Floods, earthquakes, storms</p>
          {/* <div className="type-volunteers">201 volunteers ready</div> */}
        </div>
      </div>

      {/* Elderly Care */}
      <div className="type-card">
        <div className="type-image">
          <img 
            src="https://images.pexels.com/photos/2050994/pexels-photo-2050994.jpeg?auto=compress&cs=tinysrgb&w=400&h=250" 
            alt="Elderly Care"
          />
        </div>
        <div className="type-content">
          <div className="type-icon">👴</div>
          <h3 className="type-title">Elderly Care</h3>
          <p className="type-description">Senior citizen emergencies</p>
          {/* <div className="type-volunteers">178 volunteers ready</div> */}
        </div>
      </div>

      {/* Other Emergencies */}
      <div className="type-card">
        <div className="type-image">
          <img 
            src="https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg?auto=compress&cs=tinysrgb&w=400&h=250" 
            alt="Other Emergencies"
          />
        </div>
        <div className="type-content">
          <div className="type-icon">⚠️</div>
          <h3 className="type-title">Other Emergencies</h3>
          <p className="type-description">Any urgent help needed</p>
          {/* <div className="type-volunteers">412 volunteers ready</div> */}
        </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-description">Get help in 3 simple steps</p>
          
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-image">
                <img 
                  src="https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&q=80" 
                  alt="Report Emergency"
                />
              </div>
              <h3 className="step-title">Report Emergency</h3>
              <p className="step-description">Click the SOS button, share your location, and describe the emergency. No login needed.</p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-image">
                <img 
                  src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=80" 
                  alt="Instant Notification"
                />
              </div>
              <h3 className="step-title">Instant Alerts</h3>
              <p className="step-description">Nearby verified volunteers receive immediate notifications with your details and location.</p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-image">
                <img 
                  src="https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=400&q=80" 
                  alt="Get Help"
                />
              </div>
              <h3 className="step-title">Get Help</h3>
              <p className="step-description">Track responding volunteers in real-time. Help arrives within minutes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="container">
          <h2 className="section-title">Real Stories, Real Lives Saved</h2>
          <p className="section-description">Hear from people we've helped</p>
          
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-header">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" 
                  alt="Rajesh Kumar"
                  className="testimonial-avatar"
                />
                <div className="testimonial-author">
                  <h4 className="author-name">Rajesh Kumar</h4>
                  <p className="author-role">Emergency Reporter</p>
                </div>
              </div>
              <p className="testimonial-text">
                "My grandmother had a heart attack. I pressed the SOS button without any login - within 3 minutes, a volunteer doctor was at our door. This app literally saved her life!"
              </p>
              <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-header">
                <img 
                  src="https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&q=80" 
                  alt="Dr. Priya Sharma"
                  className="testimonial-avatar"
                />
                <div className="testimonial-author">
                  <h4 className="author-name">Dr. Priya Sharma</h4>
                  <p className="author-role">Verified Volunteer</p>
                </div>
              </div>
              <p className="testimonial-text">
                "As a verified volunteer, I've helped 15 people in my neighborhood. The instant notifications make it easy to respond quickly and save lives. It's incredibly rewarding."
              </p>
              <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-header">
                <img 
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80" 
                  alt="Fire Chief Mehta"
                  className="testimonial-avatar"
                />
                <div className="testimonial-author">
                  <h4 className="author-name">Chief Mehta</h4>
                  <p className="author-role">Emergency Responder</p>
                </div>
              </div>
              <p className="testimonial-text">
                "The no-login emergency reporting is brilliant. In crisis situations, every second counts. This platform removes all barriers to getting immediate help."
              </p>
              <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="cta-content">
          <h2 className="cta-title">Ready When You Need Us</h2>
          <p className="cta-description">24/7 emergency response network at your fingertips</p>
          
          <div className="cta-buttons">
            <button onClick={() => navigate('/emergency/report')} className="btn-cta-primary">
              <span className="cta-icon">🚨</span>
              Report Emergency Now
            </button>
            <button onClick={() => navigate('/register')} className="btn-cta-secondary">
              Join as Volunteer
            </button>
          </div>

          <p className="cta-note">
            <span className="note-icon">✓</span>
            Emergency reporting is 100% free and requires zero registration
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <span className="logo-icon">🚨</span>
                <span className="logo-text">ResQConnect</span>
              </div>
              <p className="footer-desc">Connecting help within seconds. Available 24/7 for all emergencies.</p>
              {stats.emergencies > 0 && (
                <p className="footer-stats">{stats.emergencies.toLocaleString()} lives helped and counting</p>
              )}
            </div>

            <div className="footer-section">
              <h4 className="footer-heading">Quick Actions</h4>
              <ul className="footer-links">
                <li><a onClick={() => navigate('/emergency/report')}>Report Emergency</a></li>
                <li><a onClick={() => navigate('/register')}>Become Volunteer</a></li>
                <li><a onClick={() => navigate('/login')}>Volunteer Login</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4 className="footer-heading">Emergency Hotlines</h4>
              <ul className="footer-links">
                <li>🚨 Police: 100</li>
                <li>🚑 Ambulance: 102</li>
                <li>🔥 Fire: 101</li>
                <li>📞 Disaster: 108</li>
              </ul>
            </div>

            <div className="footer-section">
              <h4 className="footer-heading">Resources</h4>
              <ul className="footer-links">
                <li><a href="#safety">Safety Tips</a></li>
                <li><a href="#first-aid">First Aid Guide</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="#contact">Contact Us</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2024 ResQConnect. All rights reserved. Built with ❤️ for humanity.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;