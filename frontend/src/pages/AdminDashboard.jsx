import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { stockAPI, approvalAPI, reportAPI, applicationAPI } from '../api/apiService';
import '../styles/Dashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inventory');
  const [error, setError] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-brand">Blood Bank - Admin Dashboard</div>
        <div className="navbar-menu">
          <span className="user-info">Welcome, Admin {user?.username}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        {error && <div className="error-message">{error}</div>}

        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            Blood Inventory
          </button>
          <button
            className={`tab-btn ${activeTab === 'approvals' ? 'active' : ''}`}
            onClick={() => setActiveTab('approvals')}
          >
            Approvals & Issues
          </button>
          <button
            className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </button>
        </div>

        {activeTab === 'inventory' && <InventoryManagement />}
        {activeTab === 'approvals' && <ApprovalsManagement />}
        {activeTab === 'reports' && <ReportsView />}
      </div>
    </div>
  );
};

const InventoryManagement = () => {
  const [stock, setStock] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddStockForm, setShowAddStockForm] = useState(false);

  const totalUnits = stock.reduce((sum, item) => sum + Number(item.units_available || 0), 0);
  const lowStockGroups = stock.filter((item) => Number(item.units_available) < 5);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const stockResponse = await stockAPI.getAllStock();
      setStock(stockResponse.data);

      const warningsResponse = await stockAPI.getExpiryWarnings();
      setWarnings(warningsResponse.data.warnings);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading inventory...</div>;

  return (
    <div className="tab-content">
      <div className="inventory-header-row">
        <h2>Blood Inventory Management</h2>
      </div>
      {error && <div className="error-message">{error}</div>}

      <div className="inventory-stats-grid">
        <div className="inventory-stat-card">
          <div className="inventory-stat-value">{stock.length}</div>
          <div className="inventory-stat-label">Blood Groups Tracked</div>
        </div>
        <div className="inventory-stat-card">
          <div className="inventory-stat-value">{totalUnits}</div>
          <div className="inventory-stat-label">Total Units Available</div>
        </div>
        <div className="inventory-stat-card warning">
          <div className="inventory-stat-value">{lowStockGroups.length}</div>
          <div className="inventory-stat-label">Low Stock Groups</div>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="alert-section">
          <h3>Expiry Warnings</h3>
          <div className="inventory-warnings-grid">
            {warnings.map(w => (
              <div key={w.stock_id} className="warning-chip">
                <strong>{w.blood_group}</strong>
                <span>{w.units_available} units</span>
                <span>Expires: {new Date(w.expiry_date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="action-buttons">
        <button onClick={() => setShowAddStockForm(!showAddStockForm)} className="action-btn">
          {showAddStockForm ? 'Hide Form' : '+ Add Stock'}
        </button>
      </div>

      {showAddStockForm && (
        <AddStockForm onStockAdded={() => {
          setShowAddStockForm(false);
          fetchInventoryData();
        }} />
      )}

      <h3>Current Stock</h3>
      {stock.length > 0 ? (
        <div className="stock-table">
          <table>
            <thead>
              <tr>
                <th>Blood Group</th>
                <th>Units Available</th>
                <th>Expiry Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stock.map(s => (
                <tr key={s.stock_id} className={s.units_available < 5 ? 'low-stock' : ''}>
                  <td>{s.blood_group}</td>
                  <td>{s.units_available}</td>
                  <td>{new Date(s.expiry_date).toLocaleDateString()}</td>
                  <td>
                    {s.units_available < 5 ? (
                      <span className="status-badge warning">Low Stock</span>
                    ) : (
                      <span className="status-badge ok">Good</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No stock found</p>
      )}
    </div>
  );
};

const AddStockForm = ({ onStockAdded }) => {
  const [formData, setFormData] = useState({
    blood_group: '',
    units: '',
    expiry_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    setLoading(true);

    try {
      await stockAPI.addStock(formData);
      setFormData({ blood_group: '', units: '', expiry_date: '' });
      onStockAdded();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form add-stock-form">
      {error && <div className="error-message">{error}</div>}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="blood_group">Blood Group</label>
          <select
            id="blood_group"
            name="blood_group"
            value={formData.blood_group}
            onChange={handleChange}
            required
          >
            <option value="">Select blood group</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="units">Units</label>
          <input
            type="number"
            id="units"
            name="units"
            value={formData.units}
            onChange={handleChange}
            required
            min="1"
            placeholder="Number of units"
          />
        </div>
        <div className="form-group">
          <label htmlFor="expiry_date">Expiry Date</label>
          <input
            type="date"
            id="expiry_date"
            name="expiry_date"
            value={formData.expiry_date}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Adding...' : 'Add Stock'}
        </button>
      </div>
    </form>
  );
};

const ApprovalsManagement = () => {
  const [requests, setRequests] = useState([]);
  const [applicationsByRequest, setApplicationsByRequest] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('verify');
  const [recordView, setRecordView] = useState('active');
  const [urgencyFilter, setUrgencyFilter] = useState('');

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const response = await approvalAPI.getApprovalHistory();
      setRequests(response.data);

      const requestIdsNeedingApps = response.data
        .filter((r) => r.status === 'DONOR_APPLIED')
        .map((r) => r.blood_request_id);

      const uniqueRequestIds = [...new Set(requestIdsNeedingApps)];
      const appMap = {};

      for (const requestId of uniqueRequestIds) {
        const appResponse = await applicationAPI.getApplicationsForRequest(requestId);
        appMap[requestId] = appResponse.data;
      }

      setApplicationsByRequest(appMap);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (requestId, status) => {
    try {
      await approvalAPI.verifyRequest(requestId, status);
      fetchApprovals();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update verification status');
    }
  };

  const handleMatchModeration = async (applicationId, status) => {
    try {
      await applicationAPI.moderateApplication(applicationId, status);
      fetchApprovals();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update donor match');
    }
  };

  const handleMarkFulfilled = async (requestId) => {
    try {
      await approvalAPI.markFulfilled(requestId);
      fetchApprovals();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark fulfilled');
    }
  };

  if (loading) return <div>Loading approvals...</div>;

  const filteredRequests = requests.filter(
    (r) => !urgencyFilter || r.urgency_flag === urgencyFilter
  );

  const verificationQueue = filteredRequests
    .filter((r) =>
      recordView === 'active' ? r.status === 'PENDING_VERIFICATION' : r.status !== 'PENDING_VERIFICATION'
    )
    .sort((a, b) => {
      const scoreA = Number(a.priority_score || 0);
      const scoreB = Number(b.priority_score || 0);
      if (scoreA !== scoreB) return scoreB - scoreA;
      return new Date(b.request_date) - new Date(a.request_date);
    });

  const matchQueue = filteredRequests.filter((r) => {
    if (recordView === 'active') {
      return r.status === 'DONOR_APPLIED';
    }

    return (
      r.status === 'MATCH_APPROVED' ||
      r.status === 'COMPLETED' ||
      (r.status === 'OPEN_FOR_DONORS' && r.application_status === 'Rejected')
    );
  });

  const fulfillmentQueue = filteredRequests.filter((r) =>
    recordView === 'active' ? r.status === 'MATCH_APPROVED' : r.status === 'COMPLETED'
  );

  return (
    <div className="tab-content">
      <h2>Blood Request Workflow</h2>
      {error && <div className="error-message">{error}</div>}

      <div className="approvals-submenu">
        <button
          className={`approvals-submenu-btn ${activeSubTab === 'verify' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('verify')}
        >
          Verify Requests
        </button>
        <button
          className={`approvals-submenu-btn ${activeSubTab === 'match' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('match')}
        >
          Donor Matches
        </button>
        <button
          className={`approvals-submenu-btn ${activeSubTab === 'fulfill' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('fulfill')}
        >
          Fulfillment
        </button>
      </div>

      <div className="approvals-toolbar">
        <div className="approvals-view-toggle">
          <button
            className={`approvals-view-btn ${recordView === 'active' ? 'active' : ''}`}
            onClick={() => setRecordView('active')}
          >
            Active
          </button>
          <button
            className={`approvals-view-btn ${recordView === 'history' ? 'active' : ''}`}
            onClick={() => setRecordView('history')}
          >
            History
          </button>
        </div>

        <div className="form-group approvals-filter">
          <label>Filter by Urgency</label>
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
          >
            <option value="">All Urgency</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {activeSubTab === 'verify' && (
        <>
          <h3>{recordView === 'active' ? 'Recipient Verification Queue' : 'Verification History'}</h3>
          {verificationQueue.length > 0 ? (
        <div className="approvals-table approvals-priority-table">
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Recipient</th>
                <th>Blood Group</th>
                <th>Units</th>
                <th>Hospital</th>
                <th>Urgency</th>
                <th>Reason</th>
                <th>Priority</th>
                <th>AI Rationale</th>
                <th>Status</th>
                <th className="action-col">Action</th>
              </tr>
            </thead>
            <tbody>
              {verificationQueue.map((request) => (
                <tr key={request.blood_request_id}>
                  <td>{request.blood_request_id}</td>
                  <td>{request.recipient_name}</td>
                  <td>{request.blood_group_needed}</td>
                  <td>{request.units_requested}</td>
                  <td>{request.hospital_location || 'N/A'}</td>
                  <td><span className={`urgency-badge urgency-${request.urgency_flag.toLowerCase()}`}>{request.urgency_flag}</span></td>
                  <td className="reason-cell" title={request.reason || 'No reason provided'}>
                    {request.reason || 'No reason'}
                  </td>
                  <td>
                    <span className="status-badge">
                      {request.priority_label || 'Standard'} ({request.priority_score || 0})
                    </span>
                  </td>
                  <td className="rationale-cell" title={request.priority_explanation || 'No rationale available'}>
                    {request.priority_explanation || 'No rationale'}
                  </td>
                  <td><span className="status-badge">{request.status}</span></td>
                  <td className="action-col">
                    {recordView === 'active' ? (
                      <div className="action-buttons">
                        <button onClick={() => handleVerification(request.blood_request_id, 'OPEN_FOR_DONORS')} className="btn-approve">Approve</button>
                        <button onClick={() => handleVerification(request.blood_request_id, 'REJECTED')} className="btn-reject">Reject</button>
                      </div>
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
            <p>{recordView === 'active' ? 'No requests pending verification.' : 'No past verifications found.'}</p>
          )}
        </>
      )}

      {activeSubTab === 'match' && (
        <>
          <h3>{recordView === 'active' ? 'Donor Match Moderation' : 'Donor Match History'}</h3>
          {matchQueue.length > 0 ? (
        <div className="approvals-table">
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Recipient</th>
                <th>Needed Group</th>
                <th>Donor</th>
                <th>Donor Group</th>
                <th>Last Donation</th>
                <th>Application Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {matchQueue.map((request) => {
                const requestApps = applicationsByRequest[request.blood_request_id] || [];
                return requestApps.length > 0 ? requestApps.map((app) => (
                  <tr key={app.application_id}>
                    <td>{request.blood_request_id}</td>
                    <td>{request.recipient_name}</td>
                    <td>{request.blood_group_needed}</td>
                    <td>{app.donor_name}</td>
                    <td>{app.blood_group}</td>
                    <td>{app.last_donation_date ? new Date(app.last_donation_date).toLocaleDateString() : 'No prior donation'}</td>
                    <td><span className="status-badge">{app.status}</span></td>
                    <td>
                      {recordView === 'active' && app.status === 'Pending' ? (
                        <div className="action-buttons">
                          <button onClick={() => handleMatchModeration(app.application_id, 'Accepted')} className="btn-approve">Approve Match</button>
                          <button onClick={() => handleMatchModeration(app.application_id, 'Rejected')} className="btn-reject">Reject</button>
                        </div>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr key={request.blood_request_id}>
                    <td>{request.blood_request_id}</td>
                    <td>{request.recipient_name}</td>
                    <td>{request.blood_group_needed}</td>
                    <td colSpan="5">No applications found yet</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
          ) : (
            <p>{recordView === 'active' ? 'No donor applications pending moderation.' : 'No past donor matches found.'}</p>
          )}
        </>
      )}

      {activeSubTab === 'fulfill' && (
        <>
          <h3>{recordView === 'active' ? 'Final Fulfillment Sign-off' : 'Fulfillment History'}</h3>
          {fulfillmentQueue.length > 0 ? (
        <div className="approvals-table">
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Recipient</th>
                <th>Blood Group</th>
                <th>Matched Donor</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {fulfillmentQueue.map((request) => (
                <tr key={request.blood_request_id}>
                  <td>{request.blood_request_id}</td>
                  <td>{request.recipient_name}</td>
                  <td>{request.blood_group_needed}</td>
                  <td>{request.donor_name || 'Approved donor'}</td>
                  <td><span className="status-badge">{request.status}</span></td>
                  <td>
                    {recordView === 'active' ? (
                      <button onClick={() => handleMarkFulfilled(request.blood_request_id)} className="btn-approve">Mark as Fulfilled</button>
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
            <p>{recordView === 'active' ? 'No approved matches waiting for fulfillment.' : 'No fulfilled requests found.'}</p>
          )}
        </>
      )}
    </div>
  );
};

const ReportsView = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await reportAPI.getSummary();
      setSummary(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading reports...</div>;

  return (
    <div className="tab-content">
      <h2>Dashboard Reports</h2>
      {error && <div className="error-message">{error}</div>}

      {summary && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{summary.total_donors}</div>
            <div className="stat-label">Total Donors</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{summary.total_recipients}</div>
            <div className="stat-label">Total Recipients</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{summary.total_requests}</div>
            <div className="stat-label">Total Requests</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{summary.fulfilled_requests}</div>
            <div className="stat-label">Fulfilled Requests</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{summary.total_units_issued}</div>
            <div className="stat-label">Units Issued</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{summary.total_stock_available}</div>
            <div className="stat-label">Total Stock Available</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
