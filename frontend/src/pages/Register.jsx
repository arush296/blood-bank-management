import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/apiService';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    age: '',
    blood_group: '',
    phone: '',
    email: '',
    city: '',
    blood_group_needed: '',
    hospital: '',
    contact: '',
    urgency_level: 'Low'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (role === 'donor' && !formData.blood_group) {
      setError('Blood group is required for donors');
      return false;
    }
    if (role === 'recipient' && !formData.blood_group_needed) {
      setError('Blood group needed is required for recipients');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        ...formData,
        role
      };
      delete payload.confirmPassword;

      let response;
      if (role === 'donor') {
        response = await authAPI.registerDonor(payload);
      } else if (role === 'recipient') {
        response = await authAPI.registerRecipient(payload);
      }

      const { token, user } = response.data;
      login(user, token);

      if (user.role === 'donor') {
        navigate('/donor-dashboard');
      } else if (user.role === 'recipient') {
        navigate('/recipient-dashboard');
      }
    } catch (err) {
      const apiError = err.response?.data;
      const validationMessage = apiError?.errors?.[0]?.msg;
      setError(validationMessage || apiError?.error || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (!role) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Blood Bank Management System</h1>
          <h2>Register As</h2>
          <div className="role-selection">
            <button onClick={() => handleRoleSelect('donor')} className="role-btn">
              Donor
            </button>
            <button onClick={() => handleRoleSelect('recipient')} className="role-btn">
              Recipient
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Blood Bank Management System</h1>
        <h2>Register as {role.charAt(0).toUpperCase() + role.slice(1)}</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Common fields */}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Enter username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter full name"
            />
          </div>

          {/* Donor specific fields */}
          {role === 'donor' && (
            <>
              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  min="18"
                  max="65"
                  placeholder="Age (18-65)"
                />
              </div>

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
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="Enter phone number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Enter city (optional)"
                />
              </div>
            </>
          )}

          {/* Recipient specific fields */}
          {role === 'recipient' && (
            <>
              <div className="form-group">
                <label htmlFor="blood_group_needed">Blood Group Needed</label>
                <select
                  id="blood_group_needed"
                  name="blood_group_needed"
                  value={formData.blood_group_needed}
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
                <label htmlFor="hospital">Hospital</label>
                <input
                  type="text"
                  id="hospital"
                  name="hospital"
                  value={formData.hospital}
                  onChange={handleChange}
                  required
                  placeholder="Enter hospital name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact">Contact</label>
                <input
                  type="tel"
                  id="contact"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  required
                  placeholder="Enter contact number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="urgency_level">Urgency Level</label>
                <select
                  id="urgency_level"
                  name="urgency_level"
                  value={formData.urgency_level}
                  onChange={handleChange}
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <button onClick={() => setRole(null)} className="back-btn">
          Back to role selection
        </button>

        <p className="auth-link">
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
