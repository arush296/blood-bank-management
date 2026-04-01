import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  registerDonor: (data) => api.post('/auth/register/donor', data),
  registerRecipient: (data) => api.post('/auth/register/recipient', data),
  registerAdmin: (data) => api.post('/auth/register/admin', data),
  login: (data) => api.post('/auth/login', data)
};

// Donor API
export const donorAPI = {
  getProfile: (id) => api.get(`/donors/profile/${id}`),
  getProfileByUserId: (userId) => api.get(`/donors/profile/user/${userId}`),
  updateProfile: (id, data) => api.put(`/donors/profile/${id}`, data),
  searchDonors: (params) => api.get('/donors/search', { params }),
  recordDonation: (donorId, data) => api.post(`/donors/${donorId}/donation`, data),
  getDonationHistory: (id) => api.get(`/donors/${id}/history`),
  getDonationHistoryByUserId: (userId) => api.get(`/donors/history/user/${userId}`)
};

// Recipient API
export const recipientAPI = {
  getProfile: (id) => api.get(`/recipients/profile/${id}`),
  getProfileByUserId: (userId) => api.get(`/recipients/profile/user/${userId}`),
  createBloodRequest: (data) => api.post('/recipients/request', data),
  getRequestStatus: (id) => api.get(`/recipients/request/${id}`),
  searchRequests: (params) => api.get('/recipients/request/search/all', { params }),
  getRequestHistory: (recipientId) => api.get(`/recipients/${recipientId}/request-history`),
  getRequestHistoryByUserId: (userId) => api.get(`/recipients/request-history/user/${userId}`)
};

// Stock API
export const stockAPI = {
  getAllStock: () => api.get('/stock/'),
  getStockByBloodGroup: (bloodGroup) => api.get(`/stock/${bloodGroup}`),
  addStock: (data) => api.post('/stock/add', data),
  reduceStock: (data) => api.post('/stock/reduce', data),
  getExpiryWarnings: () => api.get('/stock/warnings/expiry'),
  getLowStockAlerts: () => api.get('/stock/alerts/low-stock')
};

// Approval API
export const approvalAPI = {
  createApproval: (data) => api.post('/approvals/', data),
  updateApprovalStatus: (id, data) => api.put(`/approvals/${id}`, data),
  verifyRequest: (requestId, status) => api.put(`/approvals/${requestId}`, { status }),
  getApprovalHistory: () => api.get('/approvals/history/all'),
  markFulfilled: (requestId) => api.post('/approvals/issue', { blood_request_id: requestId }),
  issueBlood: (data) => api.post('/approvals/issue', data),
  getIssueHistory: () => api.get('/approvals/issues/history')
};

// Donation Application API
export const applicationAPI = {
  applyToRequest: (data) => api.post('/applications', data),
  getMyApplications: () => api.get('/applications/my'),
  getApplicationsForRequest: (requestId) => api.get(`/applications/request/${requestId}`),
  moderateApplication: (id, status) => api.put(`/applications/${id}`, { status }),
  updateApplicationStatus: (id, data) => api.put(`/applications/${id}`, data)
};

// Reports API
export const reportAPI = {
  getSummary: () => api.get('/reports/summary'),
  getBloodUsage: () => api.get('/reports/blood-usage'),
  getDonorStats: () => api.get('/reports/donor-stats'),
  getRecipientStats: () => api.get('/reports/recipient-stats'),
  getFilteredReports: (params) => api.get('/reports/filtered', { params }),
  getStatusDistribution: () => api.get('/reports/status-distribution')
};

export default api;
