import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdEmail, MdLock, MdPhone, MdPerson } from "react-icons/md";
import { HiEye, HiEyeOff } from "react-icons/hi";
import "../styles/Auth.css";

function getStrength(pw) {
  if (!pw) return { level: 0, label: "", color: "var(--line)" };
  let score = 0;
  if (pw.length >= 8)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: "Weak",   color: "#E74C3C" };
  if (score === 2) return { level: 2, label: "Fair",   color: "#F39C12" };
  if (score === 3) return { level: 3, label: "Good",   color: "#1E8449" };
  return              { level: 4, label: "Strong", color: "#1A5276" };
}

const FIELDS = [
  {
    id: "full_name", label: "Full Name",
    type: "text", placeholder: "John Doe",
    icon: MdPerson, autoComplete: "name",
  },
  {
    id: "email", label: "Email Address",
    type: "email", placeholder: "john.doe@example.com",
    icon: MdEmail, autoComplete: "email",
  },
  {
    id: "phone", label: "Phone Number",
    type: "tel", placeholder: "+254712345678",
    icon: MdPhone, autoComplete: "tel",
    hint: "Kenyan number",
  },
];

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", password: "", confirm: ""
  });
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [err,         setErr]         = useState("");
  const [ok,          setOk]          = useState("");

  const strength = getStrength(form.password);

  const handle = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErr("");
  };

  const validate = () => {
    if (!form.full_name.trim())        return "Full name is required.";
    if (!form.email.includes("@"))     return "Enter a valid email address.";
    if (!/^(\+254|0)[17]\d{8}$/.test(form.phone.replace(/\s/g, "")))
                                       return "Enter a valid Kenyan phone number.";
    if (form.password.length < 8)      return "Password must be at least 8 characters.";
    if (form.password !== form.confirm) return "Passwords do not match.";
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) { setErr(error); return; }

    setLoading(true);
    try {
      const res  = await fetch("http://localhost:5000/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          full_name: form.full_name,
          email:     form.email,
          phone:     form.phone,
          password:  form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Registration failed."); setLoading(false); return; }

      setOk("Account created! Redirecting to login…");
      setTimeout(() => navigate("/login", {
        state: { message: "Account created. Please log in." }
      }), 1200);
    } catch {
      setErr("Unable to connect to server.");
      setLoading(false);
    }
  };

  const EyeBtn = ({ show, toggle }) => (
    <button type="button" className="auth-eye"
      onClick={toggle} aria-label={show ? "Hide" : "Show"}>
      {show ? <HiEyeOff size={18} /> : <HiEye size={18} />}
    </button>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">🚨</div>
          <h1 className="auth-title">EmergencyKE</h1>
          <p className="auth-sub">Create your free account</p>
        </div>

        {/* Alerts */}
        {err && <p className="auth-alert error">{err}</p>}
        {ok  && <p className="auth-alert success">{ok}</p>}

        <form onSubmit={submit} noValidate>

          {/* Render the first 3 fields from config array */}
          {FIELDS.map(({ id, label, type, placeholder, icon: Icon, autoComplete, hint }) => (
            <div className="auth-field" key={id}>
              <label htmlFor={id}>
                {label}
                {hint && <span className="auth-hint">{hint}</span>}
              </label>
              <div className="auth-input-wrap">
                <Icon className="auth-icon" />
                <input
                  id={id} name={id} type={type}
                  placeholder={placeholder}
                  value={form[id]}
                  onChange={handle}
                  autoComplete={autoComplete}
                  autoFocus={id === "full_name"}
                />
              </div>
            </div>
          ))}

          {/* Password */}
          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <div className="auth-input-wrap">
              <MdLock className="auth-icon" />
              <input
                id="password" name="password"
                type={showPw ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={form.password} onChange={handle}
                autoComplete="new-password"
              />
              <EyeBtn show={showPw} toggle={() => setShowPw(!showPw)} />
            </div>
            {form.password.length > 0 && (
              <div className="auth-strength">
                {[1,2,3,4].map(i => (
                  <div key={i} className="auth-str-seg"
                    style={{ background: i <= strength.level ? strength.color : "var(--line)" }} />
                ))}
                <span className="auth-str-lbl" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="auth-field">
            <label htmlFor="confirm">Confirm Password</label>
            <div className="auth-input-wrap">
              <MdLock className="auth-icon" />
              <input
                id="confirm" name="confirm"
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat your password"
                value={form.confirm} onChange={handle}
                autoComplete="new-password"
                className={form.confirm && form.confirm !== form.password ? "bad" : ""}
              />
              <EyeBtn show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />
            </div>
            {form.confirm && form.confirm !== form.password && (
              <p className="auth-mismatch">Passwords do not match</p>
            )}
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? <span className="auth-spinner" /> : "Create account →"}
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
          Already have an account?{" "}
          <button type="button" className="auth-link"
            onClick={() => navigate("/login")}>
            Sign in
          </button>
        </p>

      </div>
    </div>
  );
}