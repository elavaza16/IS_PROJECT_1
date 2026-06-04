import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser: saveUser } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Show success message passed from Register page
  const successMsg = location.state?.message;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser(form);
      saveUser(res.data.user, res.data.token);

      // Redirect based on role
      const role = res.data.user.role;
      if (role === 'admin') navigate('/admin');
      else if (role === 'volunteer') navigate('/volunteer');
      else navigate('/');

    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>EmergencyKE</h1>
        <p style={styles.subtitle}>Community Emergency Response</p>
        <h2 style={styles.heading}>Log In</h2>

        {successMsg && <div style={styles.success}>{successMsg}</div>}
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              name="email"
              type="email"
              placeholder="jane@email.com"
              value={form.email}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              name="password"
              type="password"
              placeholder="Your password"
              value={form.password}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p style={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link to="/register" style={styles.link}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f0f4f8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: 'Arial, sans-serif',
  },
  card: {
    background: '#ffffff',
    borderRadius: 12,
    padding: '36px 32px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  title: { margin: 0, fontSize: 28, fontWeight: 'bold', color: '#c0392b', textAlign: 'center' },
  subtitle: { margin: '4px 0 20px', fontSize: 13, color: '#888', textAlign: 'center' },
  heading: { margin: '0 0 20px', fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', textAlign: 'center' },
  success: {
    background: '#f0fdf4', border: '1px solid #86efac',
    color: '#15803d', borderRadius: 8, padding: '10px 14px',
    marginBottom: 16, fontSize: 13,
  },
  error: {
    background: '#fef2f2', border: '1px solid #fca5a5',
    color: '#b91c1c', borderRadius: 8, padding: '10px 14px',
    marginBottom: 16, fontSize: 13,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: {
    padding: '10px 12px', borderRadius: 8, fontSize: 14,
    border: '1px solid #d1d5db', outline: 'none',
  },
  button: {
    marginTop: 6, padding: '12px', borderRadius: 8,
    background: '#c0392b', color: '#fff', border: 'none',
    fontSize: 15, fontWeight: 'bold', cursor: 'pointer',
  },
  footer: { marginTop: 20, textAlign: 'center', fontSize: 13, color: '#6b7280' },
  link: { color: '#c0392b', fontWeight: '600', textDecoration: 'none' },
};