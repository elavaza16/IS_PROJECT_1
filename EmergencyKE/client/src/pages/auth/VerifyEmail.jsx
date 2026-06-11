import { useEffect, useState } from "react";
import { verifyEmail } from "../../services/api";
import { useSearchParams, useNavigate } from "react-router-dom";
import AuthCard from "../../components/layout/AuthCard";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import Spinner from "../../components/ui/Spinner";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const [status,  setStatus]  = useState("verifying");
  const [message, setMessage] = useState("");

 useEffect(() => {
  const token = searchParams.get("token");
  if (!token) { setStatus("error"); setMessage("No token found in link."); return; }

  verifyEmail(token)
    .then(({ data }) => {
      setStatus("success");
      setMessage(data.message);
      setTimeout(() => navigate("/login", {
        state: { message: "Email verified. Please log in." }
      }), 2500);
    })
    .catch((err) => {
      setStatus("error");
      setMessage(err.response?.data?.error || "Verification failed.");
    });
}, []);

  return (
    <AuthCard subtitle="Email Verification">
      {status === "verifying" && (
        <div style={{ textAlign:"center", padding:"24px 0" }}>
          <Spinner size={28} color="var(--red)" />
          <p style={{ marginTop:14, fontSize:13, color:"var(--muted)" }}>
            Verifying your email…
          </p>
        </div>
      )}
      {status === "success" && (
        <>
          <Alert type="success">{message}</Alert>
          <p style={{ fontSize:13, color:"var(--muted)", textAlign:"center" }}>
            Redirecting to login…
          </p>
        </>
      )}
      {status === "error" && (
        <>
          <Alert type="error">{message}</Alert>
          <Button variant="primary" onClick={() => navigate("/register")}>
            Back to Register
          </Button>
        </>
      )}
    </AuthCard>
  );
}