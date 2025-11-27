import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AlertCircle, Eye, EyeOff, Compass, CheckCircle } from 'lucide-react';
import './Auth.css';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'coordinator'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const user = await api.signup(
        formData.name,
        formData.email,
        formData.password,
        formData.role
      );
      login(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    { value: 'coordinator', label: 'Field Coordinator', desc: 'Manage field operations' },
    { value: 'supervisor', label: 'Supervisor', desc: 'Oversee decisions & teams' },
    { value: 'analyst', label: 'Data Analyst', desc: 'Monitor & analyze data' }
  ];

  return (
    <div className="auth-container">
      <div className="auth-bg-pattern" />
      
      <motion.div 
        className="auth-card auth-card-signup"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <motion.div 
            className="auth-logo"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <Compass size={40} />
          </motion.div>
          <h1>ReliefRoute</h1>
          <p className="auth-subtitle">Join the relief network</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Create Account</h2>
          
          {error && (
            <motion.div 
              className="auth-error"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              className="input"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              className="input"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className="input"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                className="input"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Select Role</label>
            <div className="role-options">
              {roles.map((role) => (
                <label 
                  key={role.value} 
                  className={`role-option ${formData.role === role.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={formData.role === role.value}
                    onChange={handleChange}
                  />
                  <div className="role-content">
                    <span className="role-label">{role.label}</span>
                    <span className="role-desc">{role.desc}</span>
                  </div>
                  {formData.role === role.value && <CheckCircle size={18} className="role-check" />}
                </label>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}

