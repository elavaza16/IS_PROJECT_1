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
  { id:"full_name", label:"Full Name",     type:"text",  placeholder:"Jane Mwangi",      icon:MdPerson, autoComplete:"name"  },
  { id:"email",     label:"Email Address", type:"email", placeholder:"jane@example.com", icon:MdEmail,  autoComplete:"email" },
  { id:"phone",     label:"Phone Number",  type:"tel",   placeholder:"+254712345678",    icon:MdPhone,  autoComplete:"tel", hint:"Kenyan number" },
];

export default function Register() {
  const navigate = useNavigate();

  const [form,           setForm]           = useState({ full_name:"", email:"", phone:"", password:"", confirm:"" });
  const [showPw,         setShowPw]         = useState(false);
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [err,            setErr]            = useState("");
  const [registered,     setRegistered]     = useState(false);
  const [registeredEmail,setRegisteredEmail]= useState("");

  const strength = getStrength(form.password);

  const handle = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErr("");
  };

  const validate = () => {
    if (!form.full_name.trim())         return "Full name is required.";
    if (!form.email.includes("@"))      return "Enter a valid email address.";
    if (!/^(\+254|0)[17]\d{8}$/.test(form.phone.replace(/\s/g,"")))
                                        return "Enter a valid Kenyan phone number.";
    if (form.password.length < 8)       return "Password must be at least 8 characters.";
    if (form.password !== form.confirm) return "Passwords do not match.";
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) { setErr(error); return; }

    setLoading(true);
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
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

      setRegisteredEmail(form.email);
      setRegistered(true);
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

  // ── Check email screen ───────────────────────────────────
  if (registered) return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign:"center" }}>

        <div className="auth-header">
          <div className="auth-logo">🚨</div>
          <h1 className="auth-title">EmergencyKE</h1>
        </div>

        <p className="auth-alert success">Account created successfully!</p>

        <div style={{ background:"#f8fafc", border:"1px solid #e5e8e8",
          borderRadius:10, padding:"20px 18px", marginBottom:20, textAlign:"left" }}>
          <p style={{ fontWeight:700, fontSize:15, marginBottom:8, color:"#1A252F" }}>
            Check your email to continue
          </p>
          <p style={{ fontSize:13, color:"#7F8C8D", lineHeight:1.6 }}>
            We sent a verification link to:
          </p>
          <p style={{ fontSize:14, fontWeight:600, color:"#C0392B",
            margin:"8px 0 12px", wordBreak:"break-all" }}>
            {registeredEmail}
          </p>
          <p style={{ fontSize:13, color:"#7F8C8D", lineHeight:1.6 }}>
            Click the link in that email to activate your account.
            The link expires in <strong>24 hours</strong>.
          </p>
        </div>

        <div style={{ background:"#FFFBF0", border:"1px solid #f0d060",
          borderLeft:"3px solid #D4AC0D", borderRadius:8,
          padding:"12px 14px", marginBottom:20,
          fontSize:13, color:"#7F8C8D", textAlign:"left" }}>
          <strong style={{ color:"#1A252F" }}>Did not receive it?</strong><br />
          Check your spam folder. Still nothing?{" "}
          <button type="button" className="auth-link" style={{ fontSize:13 }}
            onClick={() => navigate("/register")}>
            Try registering again
          </button>
        </div>

        <button className="auth-btn" onClick={() => navigate("/login")}>
          Go to Login
        </button>

      </div>
    </div>
  );

  // ── Registration form ────────────────────────────────────
  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-header">
          <div className="auth-logo">🚨</div>
          <h1 className="auth-title">EmergencyKE</h1>
          <p className="auth-sub">Create your free account</p>
        </div>

        {err && <p className="auth-alert error">{err}</p>}

        <form onSubmit={submit} noValidate>

          {FIELDS.map(({ id, label, type, placeholder, icon:Icon, autoComplete, hint }) => (
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
                  value={form[id]} onChange={handle}
                  autoComplete={autoComplete}
                  autoFocus={id === "full_name"}
                />
              </div>
            </div>
          ))}

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