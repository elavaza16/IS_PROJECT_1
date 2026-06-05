import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '', confirm_password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      return setError('Passwords do not match.');
    }
    setLoading(true);
    try {
      await registerUser({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      navigate('/login', {
        state: { message: 'Account created successfully. Please log in.' }
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>EmergencyKE</h1>
        <p style={styles.subtitle}>Community Emergency Response</p>
        <h2 style={styles.heading}>Create Account</h2>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input
              name="full_name"
              type="text"
              placeholder="Jane Mwangi"
              value={form.full_name}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

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
            <label style={styles.label}>Phone Number</label>
            <input
              name="phone"
              type="tel"
              placeholder="+254712345678"
              value={form.phone}
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
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Confirm Password</label>
            <input
              name="confirm_password"
              type="password"
              placeholder="Repeat your password"
              value={form.confirm_password}
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>Log in</Link>
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
    transition: 'border 0.2s',
  },
  button: {
    marginTop: 6, padding: '12px', borderRadius: 8,
    background: '#c0392b', color: '#fff', border: 'none',
    fontSize: 15, fontWeight: 'bold', cursor: 'pointer',
  },
  footer: { marginTop: 20, textAlign: 'center', fontSize: 13, color: '#6b7280' },
  link: { color: '#c0392b', fontWeight: '600', textDecoration: 'none' },
};