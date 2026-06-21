import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdLocationOn, MdRefresh } from "react-icons/md";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Badge from "../../components/ui/Badge";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";

const STATUS_FILTERS = ['', 'reported', 'dispatching', 'in_progress', 'resolved'];

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

export default function VolunteerIncidents() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [incidents,    setIncidents]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [lastUpdated,  setLastUpdated]  = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [visible,      setVisible]      = useState(8);

  const load = () => {
    setLoading(true);
    const query = statusFilter ? `&status=${statusFilter}` : '';
    API.get(`/incidents?excludeOwn=true${query}`)
      .then(({ data }) => {
        setIncidents(Array.isArray(data) ? data : []);
        setLastUpdated(new Date());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setVisible(8);
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [statusFilter]);

  return (
    <DashboardLayout title="Active Incidents">

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map(s => (
            <button key={s}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(s)}
              style={{ fontSize: 11, textTransform: 'capitalize' }}>
              {s === '' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastUpdated && (
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button className="btn btn-secondary btn-sm" onClick={load}>
            <MdRefresh size={14} />
          </button>
        </div>
      </div>

      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
        {loading ? 'Loading…' : `${incidents.length} incident${incidents.length !== 1 ? 's' : ''}`}
      </p>

      {!loading && incidents.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>No incidents found.</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            Refreshes automatically every 15 seconds.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {incidents.slice(0, visible).map(i => {
              const sev = SEV[i.severity] || SEV.low;
              const canRespond = ['reported', 'dispatching', 'in_progress'].includes(i.status)
                && i.reporter_id !== user?.id;
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

                  {/* Reference + location */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 12px',
                    marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontFamily: 'monospace',
                      color: 'var(--muted)' }}>
                      {i.reference_number}
                    </span>
                    {(i.location_text || i.latitude) && (
                      <span style={{ fontSize: 11, color: 'var(--muted)',
                        display: 'flex', alignItems: 'center', gap: 3 }}>
                        <MdLocationOn size={11} />
                        {i.location_text ||
                          `${parseFloat(i.latitude).toFixed(3)}, ${parseFloat(i.longitude).toFixed(3)}`}
                      </span>
                    )}
                  </div>

                  {/* Severity + time + action */}
                  <div style={{ display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                        padding: '2px 8px', borderRadius: 20,
                        background: sev.bg, color: sev.color,
                      }}>
                        {i.severity}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {new Date(i.reported_at).toLocaleString()}
                      </span>
                    </div>
                    {canRespond && (
                      <button className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/volunteer/alert/${i.incident_id}`)}>
                        Respond
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

          {visible < incidents.length && (
            <button
              onClick={() => setVisible(v => v + 8)}
              style={{
                marginTop: 12, width: '100%', padding: '11px',
                background: 'transparent', border: '1px solid var(--line)',
                borderRadius: 'var(--radius-md)', cursor: 'pointer',
                fontSize: 13, color: 'var(--muted)', fontWeight: 500,
              }}>
              Show more · {incidents.length - visible} remaining
            </button>
          )}
        </>
      )}

    </DashboardLayout>
  );
}
