import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdEmail } from "react-icons/md";
import { forgotPassword } from "../../services/api";
import AuthCard from "../../components/layout/AuthCard";
import InputField from "../../components/ui/InputField";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');
  const [done,    setDone]    = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) return setErr('Enter a valid email address.');
    setLoading(true);
    try {
      await forgotPassword({ email });
      setDone(true);
    } catch {
      setErr('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <AuthCard subtitle="Check your email">
      <Alert type="success">
        If that email is registered you will receive a reset link shortly.
        Check your spam folder if you do not see it.
      </Alert>
      <Button variant="primary" onClick={() => navigate('/login')}>
        Back to Login
      </Button>
    </AuthCard>
  );

  return (
    <AuthCard subtitle="Reset your password">
      <Alert type="info">
        Enter your registered email address and we will send you a password reset link.
      </Alert>

      {err && <Alert type="error">{err}</Alert>}

      <form onSubmit={submit} noValidate>
        <InputField
          id="email" label="Email address" type="email"
          placeholder="you@example.com" icon={MdEmail}
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email" autoFocus
        />
        <Button type="submit" variant="primary" loading={loading}>
          Send Reset Link
        </Button>
      </form>

      <p className="auth-footer" style={{ marginTop: 16 }}>
        Remember your password?{' '}
        <button className="btn btn-ghost" onClick={() => navigate('/login')}>
          Sign in
        </button>
      </p>
    </AuthCard>
  );
}