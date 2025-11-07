const admin = require('firebase-admin');

let firebaseApp;

try {
  // Check if running in production with service account JSON
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    
    console.log('========================================');
    console.log('Firebase Admin Initialized (Service Account)');
    console.log('========================================');
    console.log(`Project ID: ${serviceAccount.project_id}`);
    console.log('========================================\n');
  } 
  // Development mode - use local file
  else if (require('fs').existsSync('./config/serviceAccountKey.json')) {
    const serviceAccount = require('./serviceAccountKey.json');
    
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    
    console.log('========================================');
    console.log('Firebase Admin Initialized (Local File)');
    console.log('========================================');
    console.log(`Project ID: ${serviceAccount.project_id}`);
    console.log('========================================\n');
  } else {
    console.warn('⚠️  Firebase Admin not initialized - Missing credentials');
    console.warn('Set FIREBASE_SERVICE_ACCOUNT environment variable');
  }
} catch (error) {
  console.error('========================================');
  console.error('Firebase Initialization Error');
  console.error('========================================');
  console.error('Error:', error.message);
  console.error('========================================\n');
}

const getFirebaseApp = () => {
  if (!firebaseApp) {
    throw new Error('Firebase Admin is not initialized');
  }
  return firebaseApp;
};

const sendNotification = async (token, notification, data = {}) => {
  try {
    const app = getFirebaseApp();
    const messaging = admin.messaging(app);
    
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...data,
        clickAction: data.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
      },
      token: token,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'emergency_alerts',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      webpush: {
        notification: {
          icon: '/logo192.png',
          badge: '/badge-72x72.png',
          vibrate: [200, 100, 200],
          requireInteraction: true,
        },
      },
    };

    const response = await messaging.send(message);
    console.log('✅ Notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('❌ Error sending notification:', error.message);
    throw error;
  }
};

const sendMultipleNotifications = async (tokens, notification, data = {}) => {
  try {
    const app = getFirebaseApp();
    const messaging = admin.messaging(app);
    
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...data,
        clickAction: data.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
      },
      tokens: tokens,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'emergency_alerts',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      webpush: {
        notification: {
          icon: '/logo192.png',
          badge: '/badge-72x72.png',
          vibrate: [200, 100, 200],
          requireInteraction: true,
        },
      },
    };

    const response = await messaging.sendEachForMulticast(message);
    console.log(`✅ Sent ${response.successCount} notifications successfully`);
    if (response.failureCount > 0) {
      console.log(`⚠️  ${response.failureCount} notifications failed`);
    }
    return response;
  } catch (error) {
    console.error('❌ Error sending multiple notifications:', error.message);
    throw error;
  }
};

module.exports = {
  getFirebaseApp,
  sendNotification,
  sendMultipleNotifications,
  admin
};