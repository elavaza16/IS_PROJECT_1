import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MdLock } from "react-icons/md";
import { resetPassword } from "../../services/api";
import AuthCard from "../../components/layout/AuthCard";
import InputField from "../../components/ui/InputField";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";

export default function ResetPassword() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const token          = searchParams.get('token');

  const [form,    setForm]    = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');
  const [done,    setDone]    = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8)
      return setErr('Password must be at least 8 characters.');
    if (form.password !== form.confirm)
      return setErr('Passwords do not match.');
    if (!token)
      return setErr('Invalid reset link. Please request a new one.');

    setLoading(true);
    try {
      await resetPassword({ token, password: form.password });
      setDone(true);
      setTimeout(() => navigate('/login', {
        state: { message: 'Password reset successfully. Please log in.' }
      }), 2500);
    } catch (err) {
      setErr(err.response?.data?.error || 'Reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return (
    <AuthCard subtitle="Invalid link">
      <Alert type="error">
        This reset link is invalid or has expired.
      </Alert>
      <Button variant="primary" onClick={() => navigate('/forgot-password')}>
        Request a new link
      </Button>
    </AuthCard>
  );

  if (done) return (
    <AuthCard subtitle="Password reset">
      <Alert type="success">
        Password reset successfully. Redirecting to login…
      </Alert>
    </AuthCard>
  );

  return (
    <AuthCard subtitle="Set a new password">

      {err && <Alert type="error">{err}</Alert>}

      <form onSubmit={submit} noValidate>
        <InputField
          id="password" label="New Password" type="password"
          placeholder="Min. 8 characters" icon={MdLock}
          value={form.password} onChange={handle}
          autoComplete="new-password" showStrength autoFocus
        />
        <InputField
          id="confirm" label="Confirm Password" type="password"
          placeholder="Repeat your password" icon={MdLock}
          value={form.confirm} onChange={handle}
          autoComplete="new-password"
          confirmValue={form.password}
        />
        <Button type="submit" variant="primary" loading={loading}>
          Reset Password
        </Button>
      </form>

    </AuthCard>
  );
}