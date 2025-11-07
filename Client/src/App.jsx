import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { LoadScriptNext } from '@react-google-maps/api';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './component/LandingPage';
import Login from './component/auth/login/login';
import Register from './component/auth/login/register';
import Dashboard from './component/Dashboard';
import EmergencyRequest from './component/EmergencyRequest';
import QuickEmergencyReport from './component/QuickEmergencyReport';
import VolunteerMap from './component/VolunteerMap';
import AdminPanel from './component/AdminPanel';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Google Maps libraries to load
  const libraries = ['places', 'geometry'];

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <LoadScriptNext 
        googleMapsApiKey={googleMapsApiKey}
        libraries={libraries}
        loadingElement={
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: '#0c0f1d',
            color: 'white'
          }}>
            <h2>Loading ResQConnect...</h2>
          </div>
        }
      >
        <BrowserRouter>
          <AuthProvider>
            <div className="App">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Quick Emergency Report - NO LOGIN REQUIRED */}
                <Route path="/emergency/report" element={<QuickEmergencyReport />} />
                
                {/* Protected Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Detailed Emergency Request - LOGIN REQUIRED (for volunteers) */}
                <Route 
                  path="/emergency" 
                  element={
                    <ProtectedRoute>
                      <EmergencyRequest />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/map/:emergencyId?" 
                  element={
                    <ProtectedRoute>
                      <VolunteerMap />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute>
                      <AdminPanel />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </div>
          </AuthProvider>
        </BrowserRouter>
      </LoadScriptNext>
    </GoogleOAuthProvider>
  );
}

export default App;