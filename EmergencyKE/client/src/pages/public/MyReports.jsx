import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getMyIncidents } from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Badge from "../../components/ui/Badge";

export default function MyReports() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  const filter = searchParams.get("filter") || "all";

  useEffect(() => {
    getMyIncidents()
      .then(({ data }) => setIncidents(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const uniqueIncidents = useMemo(
    () =>
      incidents.filter(
        (incident, index, arr) =>
          arr.findIndex((i) => i.incident_id === incident.incident_id) ===
          index,
      ),
    [incidents],
  );

  const filteredIncidents = useMemo(() => {
    if (filter !== "active") return uniqueIncidents;
    return uniqueIncidents.filter((incident) =>
      ["reported", "dispatching", "in_progress"].includes(incident.status),
    );
  }, [filter, uniqueIncidents]);

  return (
    <DashboardLayout title="My Reports">
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)" }}>
          Your Reports
        </h2>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
          Track all emergencies you have reported in one place.
        </p>
      </div>

      <div className="table-card">
        <div className="table-header">
          <span className="table-title">
            {filter === "active" ? "Active Reports" : "All Reports"} (
            {filteredIncidents.length})
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSearchParams({})}
              style={{
                fontWeight: filter === "all" ? 700 : 500,
                opacity: filter === "all" ? 1 : 0.8,
              }}
            >
              All
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSearchParams({ filter: "active" })}
              style={{
                fontWeight: filter === "active" ? 700 : 500,
                opacity: filter === "active" ? 1 : 0.8,
              }}
            >
              Active
            </button>
          </div>
        </div>

        {loading ? (
          <p style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>
            Loading reports...
          </p>
        ) : filteredIncidents.length === 0 ? (
          <p style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>
            {filter === "active"
              ? "You currently have no active incidents."
              : "You have not reported any incidents yet."}
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ minWidth: 720 }}>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.map((incident) => (
                  <tr key={incident.incident_id}>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>
                      {incident.reference_number}
                    </td>
                    <td style={{ textTransform: "capitalize" }}>
                      {incident.category?.replace("_", " ")}
                    </td>
                    <td style={{ textTransform: "capitalize" }}>
                      {incident.severity || "-"}
                    </td>
                    <td>
                      <Badge status={incident.status} />
                    </td>
                    <td>
                      {new Date(incident.reported_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() =>
                          navigate(`/incident/${incident.incident_id}`)
                        }
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
