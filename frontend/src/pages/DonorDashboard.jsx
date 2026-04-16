import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { donorAPI, recipientAPI, applicationAPI } from '../api/apiService';
import '../styles/Dashboard.css';

const DonorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchDonorData();
  }, []);

  const fetchDonorData = async () => {
    try {
      setLoading(true);
      if (!user?.user_id) {
        throw new Error('User session not found. Please login again.');
      }

      const profileResponse = await donorAPI.getProfileByUserId(user.user_id);
      setProfile(profileResponse.data);

      const historyResponse = await donorAPI.getDonationHistoryByUserId(user.user_id);
      setHistory(historyResponse.data);

      const notificationResponse = await donorAPI.getMyNotifications();
      setNotifications(notificationResponse.data.notifications || []);
      setUnreadCount(notificationResponse.data.unread_count || 0);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await donorAPI.markNotificationRead(notificationId);
      setNotifications((current) =>
        current.map((notification) =>
          notification.notification_id === notificationId
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );
      setUnreadCount((current) => Math.max(current - 1, 0));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark notification as read');
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await donorAPI.markAllNotificationsRead();
      setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark notifications as read');
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
        <div className="navbar-brand">Blood Bank - Donor Dashboard</div>
        <div className="navbar-menu">
          <span className="user-info">Welcome, {user?.username}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        {error && <div className="error-message">{error}</div>}

        {unreadCount > 0 && (
          <div className="urgent-notification-panel">
            <div className="urgent-notification-header">
              <h3>Urgent Alerts for You</h3>
              <button className="btn-approve" onClick={handleMarkAllNotificationsRead}>Mark All Read</button>
            </div>
            <p>You have {unreadCount} urgent approved request{unreadCount > 1 ? 's' : ''} waiting for donor action.</p>

            <div className="urgent-notification-list">
              {notifications
                .filter((notification) => !notification.is_read)
                .slice(0, 4)
                .map((notification) => (
                  <div key={notification.notification_id} className="urgent-notification-item">
                    <div>
                      <strong>{notification.title}</strong>
                      <p>{notification.message}</p>
                      <small>{new Date(notification.created_at).toLocaleString()}</small>
                    </div>
                    <div className="urgent-notification-actions">
                      <button className="btn-approve" onClick={() => setActiveTab('search')}>View Requests</button>
                      <button className="btn-reject" onClick={() => handleMarkNotificationRead(notification.notification_id)}>Dismiss</button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            My Profile
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Donation History
          </button>
          <button
            className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            Search Requests
          </button>
          <button
            className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => setActiveTab('applications')}
          >
            My Applications
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
                <label>Age:</label>
                <span>{profile.age}</span>
              </div>
              <div className="info-group">
                <label>Blood Group:</label>
                <span className="badge">{profile.blood_group}</span>
              </div>
              <div className="info-group">
                <label>Email:</label>
                <span>{profile.email}</span>
              </div>
              <div className="info-group">
                <label>Phone:</label>
                <span>{profile.phone}</span>
              </div>
              <div className="info-group">
                <label>City:</label>
                <span>{profile.city || 'Not specified'}</span>
              </div>
              <div className="info-group">
                <label>Last Donation:</label>
                <span>{profile.last_donation_date ? new Date(profile.last_donation_date).toLocaleDateString() : 'Never'}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && history && (
          <div className="tab-content">
            <h2>Donation History</h2>
            <div className="history-info">
              <p><strong>Last Donation Date:</strong> {history.last_donation_date ? new Date(history.last_donation_date).toLocaleDateString() : 'No donations yet'}</p>
              <p><strong>Total Donations Completed:</strong> {history.total_donations || 0}</p>
            </div>

            {history.donations && history.donations.length > 0 ? (
              <div className="requests-table" style={{ marginTop: '16px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Donation Date</th>
                      <th>Units</th>
                      <th>Recipient</th>
                      <th>Recipient Group</th>
                      <th>Hospital</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.donations.map((donation) => (
                      <tr key={`${donation.request_id}-${donation.match_updated_at}`}>
                        <td>{donation.request_id}</td>
                        <td>{donation.donation_date ? new Date(donation.donation_date).toLocaleDateString() : '-'}</td>
                        <td>{donation.units_donated}</td>
                        <td>{donation.recipient_name}</td>
                        <td>{donation.recipient_blood_group}</td>
                        <td>{donation.hospital_location || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ marginTop: '12px' }}>No completed donations yet.</p>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <SearchRequests bloodGroup={profile?.blood_group} />
        )}

        {activeTab === 'applications' && (
          <MyApplications />
        )}
      </div>
    </div>
  );
};

const SearchRequests = ({ bloodGroup }) => {
  const [requests, setRequests] = useState([]);
  const [filters, setFilters] = useState({
    urgency_flag: ''
  });
  const [loading, setLoading] = useState(false);
  const [applyLoadingId, setApplyLoadingId] = useState(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [applyError, setApplyError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await recipientAPI.searchRequests(filters);
      setRequests(response.data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-section">
      <h2>Search Blood Requests</h2>
      {applyMessage && <div className="success-message">{applyMessage}</div>}
      {applyError && <div className="error-message">{applyError}</div>}
      <form onSubmit={handleSearch}>
        <div className="form-row">
          <div className="form-group">
            <label>Urgency</label>
            <select
              value={filters.urgency_flag}
              onChange={(e) => setFilters({ ...filters, urgency_flag: e.target.value })}
            >
              <option value="">All Urgency</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {requests.length > 0 ? (
        <div className="requests-table">
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Blood Group</th>
                <th>Units Needed</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Urgency</th>
                <th>Reason</th>
                <th>Request Date</th>
                <th>Apply</th>
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
                  <td className="reason-cell" title={req.reason || 'No reason provided'}>{req.reason || 'No reason'}</td>
                  <td>{new Date(req.request_date).toLocaleDateString()}</td>
                  <td>
                    {req.status === 'OPEN_FOR_DONORS' ? (
                      <button
                        className="btn-approve"
                        disabled={applyLoadingId === req.request_id}
                        onClick={async () => {
                          try {
                            setApplyError('');
                            setApplyMessage('');
                            setApplyLoadingId(req.request_id);
                            await applicationAPI.applyToRequest({ request_id: req.request_id });
                            setApplyMessage(`Applied successfully for request #${req.request_id}`);
                          } catch (err) {
                            setApplyError(err.response?.data?.error || 'Failed to apply for request');
                          } finally {
                            setApplyLoadingId(null);
                          }
                        }}
                      >
                        {applyLoadingId === req.request_id ? 'Applying...' : 'Apply'}
                      </button>
                    ) : (
                      <span>-</span>
                    )}
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
  );
};

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationAPI.getMyApplications();
      setApplications(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  if (loading) return <div className="tab-content">Loading applications...</div>;

  return (
    <div className="tab-content">
      <h2>My Donation Applications</h2>
      {error && <div className="error-message">{error}</div>}

      {applications.length > 0 ? (
        <div className="requests-table">
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Recipient</th>
                <th>Hospital</th>
                <th>Blood Group</th>
                <th>Urgency</th>
                <th>Application Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.application_id}>
                  <td>{app.request_id}</td>
                  <td>{app.recipient_name}</td>
                  <td>{app.hospital}</td>
                  <td>{app.blood_group_needed}</td>
                  <td>{app.urgency_flag}</td>
                  <td><span className="status-badge">{app.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No applications yet. Apply from Search Requests tab.</p>
      )}
    </div>
  );
};

export default DonorDashboard;
