import { useState } from "react";
import { registerUser } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { MdEmail, MdLock, MdPhone, MdPerson } from "react-icons/md";
import AuthCard from "../../components/layout/AuthCard";
import InputField from "../../components/ui/InputField";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";


const FIELDS = [
  { id:"full_name", label:"Full Name",     type:"text",  placeholder:"Jane Mwangi",      icon:MdPerson, autoComplete:"name",  autoFocus:true  },
  { id:"email",     label:"Email Address", type:"email", placeholder:"jane@example.com", icon:MdEmail,  autoComplete:"email"                  },
  { id:"phone",     label:"Phone Number",  type:"tel",   placeholder:"+254712345678",    icon:MdPhone,  autoComplete:"tel",   hint:"Kenyan number" },
];

const validate = (form) => {
  if (!form.full_name.trim())         return "Full name is required.";
  if (!form.email.includes("@"))      return "Enter a valid email address.";
  if (!/^(\+254|0)[17]\d{8}$/.test(form.phone.replace(/\s/g,"")))
                                      return "Enter a valid Kenyan phone number.";
  if (form.password.length < 8)       return "Password must be at least 8 characters.";
  if (form.password !== form.confirm) return "Passwords do not match.";
  return null;
};

export default function Register() {
  const navigate = useNavigate();

  const [form,    setForm]    = useState({ full_name:"", email:"", phone:"", password:"", confirm:"" });
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");
  const [done,    setDone]    = useState(false);

  const handle = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setErr(""); };

const submit = async (e) => {
  e.preventDefault();
  const error = validate(form);
  if (error) { setErr(error); return; }

  setLoading(true);
  try {
    await registerUser({
      full_name: form.full_name,
      email:     form.email,
      phone:     form.phone,
      password:  form.password,
    });
    setDone(true);
  } catch (err) {
    setErr(err.response?.data?.error || "Registration failed.");
    setLoading(false);
  }
};

  // ── Check email screen ───────────────────────────────────
  if (done) return (
    <AuthCard subtitle="One more step">
      <Alert type="success">Account created successfully!</Alert>

      <div style={{ background:"var(--grey-lt)", border:"1px solid var(--line)",
        borderRadius:"var(--radius-md)", padding:16, marginBottom:16 }}>
        <p style={{ fontWeight:700, fontSize:14, marginBottom:6 }}>
          Check your email to continue
        </p>
        <p style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6 }}>
          We sent a verification link to:
        </p>
        <p style={{ fontSize:14, fontWeight:600, color:"var(--red)",
          margin:"6px 0 10px", wordBreak:"break-all" }}>
          {form.email}
        </p>
        <p style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6 }}>
          Click the link to activate your account.
          It expires in <strong>24 hours</strong>.
        </p>
      </div>

      <Alert type="warning">
        <strong>Did not receive it?</strong> Check spam or{" "}
        <button className="btn btn-ghost" style={{ fontSize:13 }}
          onClick={() => { setDone(false); setForm({ full_name:"", email:"", phone:"", password:"", confirm:"" }); }}>
          try again
        </button>
      </Alert>

      <Button variant="primary" onClick={() => navigate("/login")}>
        Go to Login
      </Button>
    </AuthCard>
  );

  // ── Registration form ────────────────────────────────────
  return (
    <AuthCard subtitle="Create your free account">

      {err && <Alert type="error">{err}</Alert>}

      <form onSubmit={submit} noValidate>

        {FIELDS.map(f => (
          <InputField key={f.id} {...f}
            value={form[f.id]} onChange={handle}
          />
        ))}

        <InputField
          id="password" label="Password" type="password"
          placeholder="Min. 8 characters" icon={MdLock}
          value={form.password} onChange={handle}
          autoComplete="new-password" showStrength
        />

        <InputField
          id="confirm" label="Confirm Password" type="password"
          placeholder="Repeat your password" icon={MdLock}
          value={form.confirm} onChange={handle}
          autoComplete="new-password"
          confirmValue={form.password}
        />

        <Button type="submit" variant="primary" loading={loading}>
          Create account →
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
        Already have an account?{" "}
        <button className="btn btn-ghost" onClick={() => navigate("/login")}>
          Sign in
        </button>
      </p>

    </AuthCard>
  );
}