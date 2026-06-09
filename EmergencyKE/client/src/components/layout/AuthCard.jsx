import { MdOutlineEmergency } from "react-icons/md";

export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-header">
          <div className="auth-logo">
            <MdOutlineEmergency size={24} />
          </div>
          <h1 className="auth-title">EmergencyKE</h1>
          {subtitle && <p className="auth-sub">{subtitle}</p>}
        </div>

        {children}

      </div>
    </div>
  );
}