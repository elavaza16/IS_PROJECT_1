import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdOutlineEmergency,
  MdHistory,
  MdVolunteerActivism,
} from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import { getMyIncidents } from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Badge from "../../components/ui/Badge";

export default function PublicDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyIncidents()
      .then(({ data }) => setIncidents(data))
      .catch(console.error)
      .finally(() => setLoading(false));
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

  const recentReports = uniqueIncidents
    .filter((i) => i.incident_id !== active?.incident_id)
    .slice(0, 5);

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

      {/* Active incident banner */}
      {active && (
        <div
          className="public-active-banner"
          style={{
            background: "#fef3c7",
            border: "1px solid #f0d060",
            borderLeft: "4px solid var(--gold)",
            borderRadius: "var(--radius-md)",
            padding: "14px 16px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: "var(--navy)" }}>
              You have an active incident
            </p>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              {active.category?.replace("_", " ")} —{" "}
              <Badge status={active.status} />
            </p>
            {extraActiveCount > 0 && (
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                + {extraActiveCount} more active incident
                {extraActiveCount > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {extraActiveCount > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate("/my-reports?filter=active")}
              >
                View all active
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

      {/* Recent reports */}
      {loading && (
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Loading reports...
        </p>
      )}

      {recentReports.length > 0 && (
        <div className="table-card" style={{ marginTop: 24 }}>
          <div className="table-header">
            <span className="table-title">Recent Reports</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ minWidth: 620 }}>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((i) => (
                  <tr key={i.incident_id}>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>
                      {i.reference_number}
                    </td>
                    <td>{i.category?.replace("_", " ")}</td>
                    <td>
                      <Badge status={i.status} />
                    </td>
                    <td>{new Date(i.reported_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/incident/${i.incident_id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
