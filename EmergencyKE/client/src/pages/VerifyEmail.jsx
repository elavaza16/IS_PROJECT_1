import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "../styles/Auth.css";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { setStatus("error"); setMessage("No token found in link."); return; }

    fetch(`http://localhost:5000/api/auth/verify-email?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          setStatus("success");
          setMessage(data.message);
          setTimeout(() => navigate("/login", {
            state: { message: "Email verified. Please log in." }
          }), 2500);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Unable to connect to server.");
      });
  }, []);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: "center" }}>

        <div className="auth-header">
          <div className="auth-logo">🚨</div>
          <h1 className="auth-title">EmergencyKE</h1>
        </div>

        {status === "verifying" && (
          <>
            <span className="auth-spinner"
              style={{ margin: "20px auto", borderColor: "rgba(0,0,0,0.1)", borderTopColor: "#C0392B" }} />
            <p style={{ marginTop: 16, color: "#7F8C8D" }}>Verifying your email…</p>
          </>
        )}

        {status === "success" && (
          <>
            <p className="auth-alert success">{message}</p>
            <p style={{ fontSize: 13, color: "#7F8C8D" }}>Redirecting to login…</p>
          </>
        )}

        {status === "error" && (
          <>
            <p className="auth-alert error">{message}</p>
            <button className="auth-btn" style={{ marginTop: 16 }}
              onClick={() => navigate("/register")}>
              Back to Register
            </button>
          </>
        )}

      </div>
    </div>
  );
}