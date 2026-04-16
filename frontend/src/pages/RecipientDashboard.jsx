import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { recipientAPI, applicationAPI } from '../api/apiService';
import '../styles/Dashboard.css';

const RecipientDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  useEffect(() => {
    fetchRecipientData();
  }, []);

  const fetchRecipientData = async () => {
    try {
      setLoading(true);
      if (!user?.user_id) {
        throw new Error('User session not found. Please login again.');
      }

      const profileResponse = await recipientAPI.getProfileByUserId(user.user_id);
      setProfile(profileResponse.data);

      const requestsResponse = await recipientAPI.getRequestHistoryByUserId(user.user_id);
      setRequests(requestsResponse.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div className="dashboard-container"><p>Loading...</p></div>;

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-brand">Blood Bank - Recipient Dashboard</div>
        <div className="navbar-menu">
          <span className="user-info">Welcome, {user?.username}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        {error && <div className="error-message">{error}</div>}

        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            My Profile
          </button>
          <button
            className={`tab-btn ${activeTab === 'request' ? 'active' : ''}`}
            onClick={() => setActiveTab('request')}
          >
            Blood Request
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Request History
          </button>
        </div>

        {activeTab === 'profile' && profile && (
          <div className="tab-content">
            <h2>My Profile</h2>
            <div className="profile-info">
              <div className="info-group">
                <label>Name:</label>
                <span>{profile.name}</span>
              </div>
              <div className="info-group">
                <label>Blood Group Needed:</label>
                <span className="badge">{profile.blood_group_needed}</span>
              </div>
              <div className="info-group">
                <label>Hospital:</label>
                <span>{profile.hospital}</span>
              </div>
              <div className="info-group">
                <label>Contact:</label>
                <span>{profile.contact}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'request' && (
          <BloodRequestForm
            recipientId={profile?.recipient_id}
            defaultBloodGroup={profile?.blood_group_needed}
            defaultHospital={profile?.hospital}
            onRequestCreated={() => {
            setActiveTab('history');
            fetchRecipientData();
            }}
          />
        )}

        {activeTab === 'history' && (
          <div className="tab-content">
            <h2>Request History</h2>
            {requests.length > 0 ? (
              <div className="requests-table">
                <table>
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Blood Group</th>
                      <th>Units Requested</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Urgency</th>
                      <th>Request Date</th>
                      <th>Applicants</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(req => (
                      <tr key={req.request_id}>
                        <td>{req.request_id}</td>
                        <td>{req.blood_group_needed}</td>
                        <td>{req.units_requested}</td>
                        <td>
                          <span className="status-badge">
                            {req.priority_label || 'Standard'} ({req.priority_score || 0})
                          </span>
                        </td>
                        <td><span className="status-badge">{req.status}</span></td>
                        <td><span className={`urgency-badge urgency-${req.urgency_flag.toLowerCase()}`}>{req.urgency_flag}</span></td>
                        <td>{new Date(req.request_date).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="btn-approve"
                            onClick={() => setSelectedRequestId(req.request_id)}
                          >
                            View Applicants
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No requests found</p>
            )}
          </div>
        )}

        {activeTab === 'history' && selectedRequestId && (
          <RequestApplications
            requestId={selectedRequestId}
            onClose={() => setSelectedRequestId(null)}
          />
        )}
      </div>
    </div>
  );
};

const RequestApplications = ({ requestId, onClose }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationAPI.getApplicationsForRequest(requestId);
      setApplications(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch applicants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [requestId]);

  return (
    <div className="tab-content" style={{ marginTop: '20px' }}>
      <h3>Applicants for Request #{requestId}</h3>
      {error && <div className="error-message">{error}</div>}
      <button className="back-btn" onClick={onClose}>Close</button>

      {loading ? (
        <p>Loading applicants...</p>
      ) : applications.length > 0 ? (
        <div className="requests-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Age</th>
                <th>Blood Group</th>
                <th>Phone</th>
                <th>City</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.application_id}>
                  <td>{app.donor_name}</td>
                  <td>{app.age}</td>
                  <td>{app.blood_group}</td>
                  <td>{app.phone}</td>
                  <td>{app.city || 'N/A'}</td>
                  <td><span className="status-badge">{app.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No donor applications yet for this request.</p>
      )}
    </div>
  );
};

const BloodRequestForm = ({ recipientId, defaultBloodGroup, defaultHospital, onRequestCreated }) => {
  const [formData, setFormData] = useState({
    recipient_id: recipientId,
    units_requested: '',
    urgency_flag: 'Medium',
    blood_group_needed: defaultBloodGroup || '',
    hospital_location: defaultHospital || '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      recipient_id: recipientId,
      blood_group_needed: defaultBloodGroup || prev.blood_group_needed,
      hospital_location: defaultHospital || prev.hospital_location
    }));
  }, [recipientId, defaultBloodGroup, defaultHospital]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await recipientAPI.createBloodRequest(formData);
      setSuccess('Blood request created successfully!');
      setFormData({
        recipient_id: recipientId,
        units_requested: '',
        urgency_flag: 'Medium',
        blood_group_needed: defaultBloodGroup || '',
        hospital_location: defaultHospital || '',
        reason: ''
      });
      setTimeout(() => {
        onRequestCreated();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-content">
      <h2>Create Blood Request</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="blood_group_needed">Blood Group Needed</label>
          <input
            type="text"
            id="blood_group_needed"
            name="blood_group_needed"
            value={formData.blood_group_needed}
            readOnly
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="hospital_location">Hospital Location</label>
          <input
            type="text"
            id="hospital_location"
            name="hospital_location"
            value={formData.hospital_location}
            onChange={handleChange}
            required
            placeholder="Enter hospital location"
          />
        </div>

        <div className="form-group">
          <label htmlFor="units_requested">Units Requested</label>
          <input
            type="number"
            id="units_requested"
            name="units_requested"
            value={formData.units_requested}
            onChange={handleChange}
            required
            min="1"
            placeholder="Enter number of units needed"
          />
        </div>

        <div className="form-group">
          <label htmlFor="urgency_flag">Urgency Level</label>
          <select
            id="urgency_flag"
            name="urgency_flag"
            value={formData.urgency_flag}
            onChange={handleChange}
            required
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="reason">Reason for Request</label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            required
            minLength={10}
            maxLength={500}
            rows={4}
            placeholder="Explain the medical need (e.g. emergency surgery tomorrow, ICU support, accident case)."
          />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Creating Request...' : 'Create Request'}
        </button>
      </form>
    </div>
  );
};

export default RecipientDashboard;
