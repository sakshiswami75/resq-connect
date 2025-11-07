import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('API Configuration:', {
  url: API_URL,
  environment: import.meta.env.MODE
});

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      hasAuth: !!token
    });
    
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url
    });

    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network Error: Could not connect to server');
    }

    return Promise.reject(error);
  }
);

// API methods
export const apiMethods = {
  // Auth
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  
  // Emergencies
  reportEmergency: (data) => api.post('/emergencies', data),
  getEmergencies: (params) => api.get('/emergencies', { params }),
  getEmergencyById: (id) => api.get(`/emergencies/${id}`),
  updateEmergency: (id, data) => api.put(`/emergencies/${id}`, data),
  respondToEmergency: (id) => api.post(`/emergencies/${id}/respond`),
  
  // Dashboard
  getDashboardStats: () => api.get('/dashboard/stats'),
  getPublicStats: () => api.get('/dashboard/public-stats'),
  
  // Volunteers
  getVolunteers: () => api.get('/volunteers'),
  updateVolunteerStatus: (data) => api.put('/volunteers/status', data),
  saveFCMToken: (token) => api.post('/volunteers/fcm-token', { fcmToken: token }),
  
  // Notifications
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
};

export default api;