import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Register Service Worker for Firebase notifications
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js', { scope: '/' })
    .then((registration) => {
      console.log('✅ Service Worker registered successfully:', registration.scope);
    })
    .catch((error) => {
      console.error('❌ Service Worker registration failed:', error);
    });
}

// Log environment info
console.log('🚀 ResQConnect Starting...');
console.log('Environment:', import.meta.env.MODE);
console.log('API URL:', import.meta.env.VITE_API_URL);
console.log('Firebase Project:', import.meta.env.VITE_FIREBASE_PROJECT_ID);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);