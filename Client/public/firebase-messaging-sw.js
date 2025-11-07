// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize Firebase in service worker
// Note: You'll need to replace these with your actual Firebase config
firebase.initializeApp({
  apiKey: "AIzaSyC_h5pwnby9BLN5yq3qOY2ZMg_JrtHHMn4",
  authDomain: "resqconnect-emergency.firebaseapp.com",
  projectId: "resqconnect-emergency",
  storageBucket: "resqconnect-emergency.firebasestorage.app",
  messagingSenderId: "989446555817",
  appId: "1:989446555817:web:030f8f0e290bcc59c141b8"
});


const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'New Emergency Alert';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new emergency notification',
    icon: '/logo192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    tag: payload.data?.emergencyId || 'emergency-notification',
    requireInteraction: true,
    data: {
      url: payload.data?.url || '/',
      emergencyId: payload.data?.emergencyId,
      type: payload.data?.type
    },
    actions: [
      {
        action: 'view',
        title: 'View Details'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    const urlToOpen = event.notification.data.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if there's already a window open
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window if no matching window found
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activated');
});