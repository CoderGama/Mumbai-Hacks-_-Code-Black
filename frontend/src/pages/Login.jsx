import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AlertCircle, Eye, EyeOff, Compass } from 'lucide-react';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await api.login(email, password);
      login(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setIsLoading(true);
    try {
      const credentials = role === 'admin' 
        ? { email: 'admin@reliefroute.org', password: 'admin123' }
        : { email: 'coordinator@reliefroute.org', password: 'coord123' };
      
      const user = await api.login(credentials.email, credentials.password);
      login(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-bg-pattern" />
      
      <motion.div 
        className="auth-card"
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
          <p className="auth-subtitle">Relief Before the Need</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Sign In</h2>
          
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
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <button 
            type="submit" 
            className="btn btn-primary btn-lg w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="auth-divider">
            <span>or try demo accounts</span>
          </div>

          <div className="demo-buttons">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => handleDemoLogin('admin')}
              disabled={isLoading}
            >
              Admin Demo
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => handleDemoLogin('coordinator')}
              disabled={isLoading}
            >
              Coordinator Demo
            </button>
          </div>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </motion.div>

      <div className="auth-features">
        <motion.div 
          className="feature"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="feature-icon">🌊</div>
          <h3>Predictive Analytics</h3>
          <p>48-72 hour disaster forecasting</p>
        </motion.div>
        <motion.div 
          className="feature"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="feature-icon">🤖</div>
          <h3>Autonomous Decisions</h3>
          <p>AI-driven resource allocation</p>
        </motion.div>
        <motion.div 
          className="feature"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="feature-icon">🗺️</div>
          <h3>Smart Routing</h3>
          <p>A* optimized supply chains</p>
        </motion.div>
      </div>
    </div>
  );
}

