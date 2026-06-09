import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MdEmail, MdLock } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import AuthCard from "../../components/layout/AuthCard";
import InputField from "../../components/ui/InputField";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";

export default function Login() {
  const navigate        = useNavigate();
  const location        = useLocation();
  const { loginUser }   = useAuth();

  const [form,       setForm]       = useState({ email: "", password: "" });
  const [loading,    setLoading]    = useState(false);
  const [err,        setErr]        = useState("");
  const [unverified, setUnverified] = useState(false);

  // Success message passed from Register page
  const successMsg = location.state?.message;

  useEffect(() => { setErr(""); setUnverified(false); }, [form]);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return setErr("All fields are required.");
    if (!form.email.includes("@"))     return setErr("Enter a valid email address.");

    setLoading(true);
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        data.error?.includes("verify your email")
          ? setUnverified(true)
          : setErr(data.error || "Login failed.");
        setLoading(false);
        return;
      }

      loginUser(data.user, data.token);
      setTimeout(() => {
        if      (data.user.role === "admin")     navigate("/admin");
        else if (data.user.role === "volunteer") navigate("/volunteer");
        else                                     navigate("/");
      }, 600);

    } catch {
      setErr("Unable to connect to server.");
      setLoading(false);
    }
  };

  return (
    <AuthCard subtitle="Sign in to your account">

      {successMsg && <Alert type="success">{successMsg}</Alert>}
      {err        && <Alert type="error">{err}</Alert>}
      {unverified && (
        <Alert type="warning" title="Email not verified">
          Check your inbox for the verification link.
          Can't find it? Check spam or{" "}
          <button className="btn btn-ghost" style={{ fontSize:13 }}
            onClick={() => navigate("/register")}>
            register again
          </button>
        </Alert>
      )}

      <form onSubmit={submit} noValidate>
        <InputField
          id="email" label="Email address" type="email"
          placeholder="you@example.com" icon={MdEmail}
          value={form.email} onChange={handle}
          autoComplete="email" autoFocus
        />
        <InputField
          id="password" label="Password" type="password"
          placeholder="Enter your password" icon={MdLock}
          value={form.password} onChange={handle}
          autoComplete="current-password"
        />

        <div style={{ textAlign:"right", marginBottom:16 }}>
          <button type="button" className="btn btn-ghost">
            Forgot password?
          </button>
        </div>

        <Button type="submit" variant="primary" loading={loading}>
          Sign in →
        </Button>
      </form>

      <div className="auth-divider">
        <div className="auth-divider-line" />
        <span className="auth-divider-text">No internet access?</span>
        <div className="auth-divider-line" />
      </div>

      <div className="auth-ussd">
        <p className="auth-ussd-title">Dial <strong>*384*911#</strong> to report</p>
        <p className="auth-ussd-sub">Free · Any phone · All Kenyan networks</p>
      </div>

      <p className="auth-footer">
        New to EmergencyKE?{" "}
        <button className="btn btn-ghost"
          onClick={() => navigate("/register")}>
          Create a free account
        </button>
      </p>

    </AuthCard>
  );
}