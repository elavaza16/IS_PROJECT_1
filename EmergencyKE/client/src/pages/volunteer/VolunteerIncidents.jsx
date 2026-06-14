import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdLocationOn, MdRefresh } from "react-icons/md";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Badge from "../../components/ui/Badge";
import API from "../../services/api";

export default function VolunteerIncidents() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = () => {
    setLoading(true);
    API.get('/incidents?status=dispatching')
      .then(({ data }) => {
        setIncidents(Array.isArray(data) ? data : []);
        setLastUpdated(new Date());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  // Load on mount and poll every 15 seconds
  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <DashboardLayout title="Active Incidents">

      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          {lastUpdated
            ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
            : 'Loading...'}
        </p>
        <button className="btn btn-secondary btn-sm" onClick={load}>
          <MdRefresh size={15} /> Refresh
        </button>
      </div>

      {loading && incidents.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading incidents...</p>
      ) : incidents.length === 0 ? (
        <div className="table-card" style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>
            No active incidents at the moment.
          </p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
            This page refreshes automatically every 15 seconds.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {incidents.map(i => (
            <div key={i.incident_id} className="table-card"
              style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderLeft: `4px solid ${
                  i.severity === 'high'   ? 'var(--red)'   :
                  i.severity === 'medium' ? '#f59e0b'      : 'var(--green)'
                }`,
              }}>
                <div style={{ flex: 1 }}>
                  {/* Category + severity */}
                  <div style={{ display: 'flex', alignItems: 'center',
                    gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14,
                      textTransform: 'capitalize', color: 'var(--navy)' }}>
                      {i.category?.replace('_', ' ')}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                      padding: '2px 8px', borderRadius: 20,
                      background: i.severity === 'high'   ? 'var(--red-xlt)'  :
                                  i.severity === 'medium' ? '#fef3c7'          : 'var(--green-xlt)',
                      color:      i.severity === 'high'   ? 'var(--red)'      :
                                  i.severity === 'medium' ? '#d97706'          : 'var(--green)',
                    }}>
                      {i.severity}
                    </span>
                    <Badge status={i.status} />
                  </div>

                  {/* Location */}
                  <div style={{ display: 'flex', alignItems: 'center',
                    gap: 5, fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                    <MdLocationOn size={13} color="var(--red)" />
                    {i.location_text ||
                      (i.latitude
                        ? `${parseFloat(i.latitude).toFixed(4)}, ${parseFloat(i.longitude).toFixed(4)}`
                        : 'Location not provided')}
                  </div>

                  {/* Reference + time */}
                  <div style={{ display: 'flex', gap: 16, fontSize: 11,
                    color: 'var(--muted)' }}>
                    <span style={{ fontFamily: 'monospace' }}>{i.reference_number}</span>
                    <span>{new Date(i.reported_at).toLocaleString()}</span>
                    {i.reporter_name && <span>Reporter: {i.reporter_name}</span>}
                  </div>
                </div>

                {/* Action */}
                <button className="btn btn-primary btn-sm"
                  style={{ marginLeft: 16, whiteSpace: 'nowrap' }}
                  onClick={() => navigate(`/volunteer/alert/${i.incident_id}`)}>
                  Respond
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </DashboardLayout>
  );
}