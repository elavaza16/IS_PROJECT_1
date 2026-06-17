import { useState, useEffect } from "react";
import { getMyResponses } from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Badge from "../../components/ui/Badge";

export default function ResponseHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyResponses()
      .then(({ data }) => setHistory(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Response History">
      <div className="table-card">
        <div className="table-header">
          <span className="table-title">All Responses ({history.length})</span>
        </div>
        {loading ? (
          <p style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>Loading...</p>
        ) : history.length === 0 ? (
          <p style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>
            No responses yet.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: 520 }}>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Response Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map(i => (
                  <tr key={i.incident_id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{i.reference_number}</td>
                    <td style={{ textTransform: 'capitalize' }}>{i.category?.replace('_',' ')}</td>
                    <td style={{ textTransform: 'capitalize' }}>{i.severity}</td>
                    <td><Badge status={i.status} /></td>
                    <td>{new Date(i.reported_at).toLocaleDateString()}</td>
                    <td>
                      {i.responded_at
                        ? `${Math.round((new Date(i.responded_at) - new Date(i.reported_at)) / 60000)} min`
                        : '—'}
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