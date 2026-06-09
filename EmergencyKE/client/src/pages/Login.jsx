import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdEmail, MdLock } from "react-icons/md";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { useAuth } from "../context/AuthContext";
import "../styles/Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const [form,       setForm]       = useState({ email: "", password: "" });
  const [showPw,     setShowPw]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [err,        setErr]        = useState("");
  const [ok,         setOk]         = useState("");
  const [unverified, setUnverified] = useState(false);

  useEffect(() => { setErr(""); setUnverified(false); }, [form]);

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
        if (data.error?.includes("verify your email")) setUnverified(true);
        else setErr(data.error || "Login failed.");
        setLoading(false);
        return;
      }

      loginUser(data.user, data.token);
      setOk("Login successful! Redirecting…");
      setTimeout(() => {
        if      (data.user.role === "admin")     navigate("/admin");
        else if (data.user.role === "volunteer") navigate("/volunteer");
        else                                     navigate("/");
      }, 800);
    } catch {
      setErr("Unable to connect to server.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">🚨</div>
          <h1 className="auth-title">EmergencyKE</h1>
          <p className="auth-sub">Sign in to your account</p>
        </div>

        {/* Alerts */}
        {err && <p className="auth-alert error">{err}</p>}
        {ok  && <p className="auth-alert success">{ok}</p>}

        {/* Unverified warning */}
        {unverified && (
          <div style={{ background:"#FFFBF0", border:"1px solid #f0d060",
            borderLeft:"3px solid #D4AC0D", borderRadius:8,
            padding:"12px 14px", marginBottom:16,
            fontSize:13, color:"#7F8C8D" }}>
            <strong style={{ color:"#1A252F", display:"block", marginBottom:4 }}>
              Email not verified
            </strong>
            Check your inbox for the verification link we sent you.
            Can't find it? Check your spam folder.
            <br />
            <button type="button" className="auth-link"
              style={{ fontSize:13, marginTop:8 }}
              onClick={() => navigate("/register")}>
              Register again to resend the link
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={submit} noValidate>

          <div className="auth-field">
            <label htmlFor="email">Email address</label>
            <div className="auth-input-wrap">
              <MdEmail className="auth-icon" />
              <input
                id="email" type="email" placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                autoComplete="email" autoFocus
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <div className="auth-input-wrap">
              <MdLock className="auth-icon" />
              <input
                id="password" type={showPw ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
              />
              <button type="button" className="auth-eye"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? "Hide" : "Show"}>
                {showPw ? <HiEyeOff size={18} /> : <HiEye size={18} />}
              </button>
            </div>
          </div>

          <div className="auth-meta">
            <button type="button" className="auth-link">Forgot password?</button>
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? <span className="auth-spinner" /> : "Sign in →"}
          </button>

        </form>

        {/* USSD strip */}
        <div className="auth-ussd">
          <div>
            <p className="auth-ussd-title">No internet? Dial <strong>*384*911#</strong></p>
            <p className="auth-ussd-sub">Free · Any phone · All Kenyan networks</p>
          </div>
        </div>

        <p className="auth-footer">
          New to EmergencyKE?{" "}
          <button type="button" className="auth-link"
            onClick={() => navigate("/register")}>
            Create a free account
          </button>
        </p>

      </div>
    </div>
  );
}