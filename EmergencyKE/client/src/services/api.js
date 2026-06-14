import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth ──────────────────────────────────────────────────────
export const registerUser  = (data)  => API.post('/auth/register', data);
export const loginUser     = (data)  => API.post('/auth/login', data);
export const verifyEmail   = (token) => API.get(`/auth/verify-email?token=${token}`);

// ── Incidents ─────────────────────────────────────────────────
export const reportIncident = (data)         => API.post('/incidents', data);
export const getIncidents   = ()             => API.get('/incidents');
export const getMyIncidents = ()             => API.get('/incidents/mine');
export const updateStatus   = (id, status)   => API.patch(`/incidents/${id}/status`, { status });

// ── Volunteers ────────────────────────────────────────────────
export const applyVolunteer = (data) => API.post('/volunteers/apply', data);
export const acceptAlert    = (id)   => API.patch(`/incidents/${id}/respond`, { response: 'accepted' });
export const declineAlert   = (id)   => API.patch(`/incidents/${id}/respond`, { response: 'declined' });
export const getMyResponses = ()     => API.get('/volunteers/history');

// ── Messages ──────────────────────────────────────────────────
export const getMessages = (incidentId) => API.get(`/messages/${incidentId}`);
export const sendMessage = (data)       => API.post('/messages', data);

// ── Admin ─────────────────────────────────────────────────────
export const getAllIncidents    = (query = '')  => API.get(`/admin/incidents${query}`);
export const getIncident        = (id)          => API.get(`/admin/incidents/${id}`);
export const flagIncident       = (id, data)    => API.patch(`/admin/incidents/${id}/flag`, data);

export const getAllVolunteers   = (query = '')  => API.get(`/admin/volunteers${query}`);
export const getVolunteer       = (id)          => API.get(`/admin/volunteers/${id}`);
export const approveVolunteer   = (id)          => API.patch(`/admin/volunteers/${id}/approve`);
export const rejectVolunteer    = (id, data)    => API.patch(`/admin/volunteers/${id}/reject`, data);
export const suspendVolunteer   = (id, data)    => API.patch(`/admin/volunteers/${id}/suspend`, data);

export const getAllUsers        = ()             => API.get('/admin/users');
export const deactivateUser     = (id)          => API.patch(`/admin/users/${id}/deactivate`);
export const activateUser       = (id)          => API.patch(`/admin/users/${id}/activate`);

export const getAnalytics       = ()             => API.get('/admin/analytics');



export const forgotPassword = (data)  => API.post('/auth/forgot-password', data);
export const resetPassword  = (data)  => API.post('/auth/reset-password', data);

export default API;