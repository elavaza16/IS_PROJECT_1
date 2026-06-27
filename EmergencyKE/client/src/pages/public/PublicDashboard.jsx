import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdOutlineEmergency,
  MdHistory,
  MdVolunteerActivism,
} from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import { getMyIncidents } from "../../services/api";
import API from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Badge from "../../components/ui/Badge";

export default function PublicDashboard() {
  const navigate = useNavigate();
  const { user, loginUser } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [roleUpgraded, setRoleUpgraded] = useState(false);

  useEffect(() => {
    getMyIncidents()
      .then(({ data }) => setIncidents(data))
      .catch(console.error);
  }, []);

  // Check if role has been upgraded since last login
  useEffect(() => {
    API.get('/auth/me')
      .then(({ data }) => {
        if (data.role && data.role !== user?.role) {
          const token = localStorage.getItem('token');
          loginUser(data, token);
          if (data.role === 'volunteer') setRoleUpgraded(true);
        }
      })
      .catch(() => {});
  }, []);

  // Guard against accidental duplicate records from API/state merges.
  const uniqueIncidents = incidents.filter(
    (incident, index, arr) =>
      arr.findIndex((i) => i.incident_id === incident.incident_id) === index,
  );

  const active = uniqueIncidents.find((i) =>
    ["reported", "dispatching", "in_progress"].includes(i.status),
  );

  const activeIncidents = uniqueIncidents.filter((i) =>
    ["reported", "dispatching", "in_progress"].includes(i.status),
  );

  const extraActiveCount = Math.max(activeIncidents.length - 1, 0);

  return (
    <DashboardLayout title="Dashboard">
      {/* Welcome */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)" }}>
          Welcome, {user?.full_name?.split(" ")[0]}
        </h2>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
          Report an emergency or track your active incident below.
        </p>
      </div>

      {/* Role upgrade banner */}
      {roleUpgraded && (
        <div style={{
          background: '#d1fae5', border: '1px solid #6ee7b7',
          borderLeft: '4px solid var(--green)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
        }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#065f46' }}>
              You have been approved as a Volunteer!
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              Your account has been upgraded. Go to your volunteer dashboard.
            </p>
          </div>
          <button className="btn btn-primary btn-sm"
            style={{ background: 'var(--green)', whiteSpace: 'nowrap' }}
            onClick={() => navigate('/volunteer')}>
            Go to Volunteer Dashboard
          </button>
        </div>
      )}

      {/* Active incident banner */}
      {active && (
        <div
          className="public-active-banner"
          style={{
            background: "#ffffff",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-md)",
            padding: "8px 12px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "nowrap",
            gap: 8,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 12, color: "var(--navy)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Active incident{extraActiveCount > 0 ? ` (+${extraActiveCount} more)` : ""}
            </p>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
              {active.category?.replace("_", " ")} — <Badge status={active.status} />
            </p>
          </div>
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            {extraActiveCount > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate("/my-reports?filter=active")}
              >
                View all
              </button>
            )}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate(`/incident/${active.incident_id}`)}
            >
              View current
            </button>
          </div>
        </div>
      )}

      {/* Action cards */}
      <div className="stat-grid">
        <div
          className="stat-card"
          style={{
            cursor: "pointer",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 12,
            border: "2px solid var(--red)",
          }}
          onClick={() => navigate("/report")}
        >
          <div className="stat-icon" style={{ background: "var(--red-xlt)" }}>
            <MdOutlineEmergency size={22} color="var(--red)" />
          </div>
          <div>
            <div className="stat-value" style={{ fontSize: 16 }}>
              Report Emergency
            </div>
            <div className="stat-label">Tap to report an incident now</div>
          </div>
        </div>

        <div
          className="stat-card"
          style={{
            cursor: "pointer",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 12,
          }}
          onClick={() => navigate("/my-reports")}
        >
          <div className="stat-icon" style={{ background: "var(--blue-lt)" }}>
            <MdHistory size={22} color="var(--blue)" />
          </div>
          <div>
            <div className="stat-value" style={{ fontSize: 16 }}>
              My Reports
            </div>
            <div className="stat-label">
              {uniqueIncidents.length} total reports
            </div>
          </div>
        </div>

        {user?.role === "community_member" && (
          <div
            className="stat-card"
            style={{
              cursor: "pointer",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 12,
            }}
            onClick={() => navigate("/apply-volunteer")}
          >
            <div
              className="stat-icon"
              style={{ background: "var(--green-xlt)" }}
            >
              <MdVolunteerActivism size={22} color="var(--green)" />
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: 16 }}>
                Become a Volunteer
              </div>
              <div className="stat-label">
                Apply to join the response network
              </div>
            </div>
          </div>
        )}
      </div>

    </DashboardLayout>
  );
}