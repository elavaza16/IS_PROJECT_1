import { useState, useEffect } from "react";
import { getMyResponses } from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Badge from "../../components/ui/Badge";

const SEV = {
  high:   { color: '#dc2626', bg: '#fef2f2' },
  medium: { color: '#d97706', bg: '#fffbeb' },
  low:    { color: '#16a34a', bg: '#f0fdf4' },
};

const card = {
  background: '#fff',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-md)',
  padding: '14px 16px',
};

export default function ResponseHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(10);

  useEffect(() => {
    getMyResponses()
      .then(({ data }) => setHistory(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Response History">

      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
        {loading ? 'Loading…'
          : `${history.length} response${history.length !== 1 ? 's' : ''}`}
      </p>

      {!loading && history.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>No responses yet.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.slice(0, visible).map(i => {
              const sev = SEV[i.severity] || SEV.low;
              const responseMin = i.responded_at
                ? Math.round((new Date(i.responded_at) - new Date(i.reported_at)) / 60000)
                : null;
              return (
                <div key={i.incident_id} style={card}>

                  {/* Category + status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14,
                      textTransform: 'capitalize', color: 'var(--navy)' }}>
                      {i.category?.replace('_', ' ')}
                    </span>
                    <Badge status={i.status} />
                  </div>

                  {/* Reference + date */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 12px',
                    marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontFamily: 'monospace',
                      color: 'var(--muted)' }}>
                      {i.reference_number}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {new Date(i.reported_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Severity + response time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      padding: '2px 8px', borderRadius: 20,
                      background: sev.bg, color: sev.color,
                    }}>
                      {i.severity}
                    </span>
                    {responseMin !== null && (
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        Response time: {responseMin} min
                      </span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

          {visible < history.length && (
            <button
              onClick={() => setVisible(v => v + 10)}
              style={{
                marginTop: 12, width: '100%', padding: '11px',
                background: 'transparent', border: '1px solid var(--line)',
                borderRadius: 'var(--radius-md)', cursor: 'pointer',
                fontSize: 13, color: 'var(--muted)', fontWeight: 500,
              }}>
              Show more · {history.length - visible} remaining
            </button>
          )}
        </>
      )}

    </DashboardLayout>
  );
}
