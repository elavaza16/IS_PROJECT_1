import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdLocationOn, MdRefresh } from "react-icons/md";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Badge from "../../components/ui/Badge";
import API from "../../services/api";

const STATUS_COLORS = {
  reported:    '#d97706',
  dispatching: '#2563eb',
  in_progress: '#059669',
  resolved:    '#6b7280',
  cancelled:   '#dc2626',
  escalated:   '#7c3aed',
};

export default function VolunteerIncidents() {
  const navigate = useNavigate();
  const [incidents,    setIncidents]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [lastUpdated,  setLastUpdated]  = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const load = () => {
    setLoading(true);
    const query = statusFilter ? `?status=${statusFilter}` : '';
    API.get(`/incidents${query}`)
      .then(({ data }) => {
        setIncidents(Array.isArray(data) ? data : []);
        setLastUpdated(new Date());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [statusFilter]);

  return (
    <DashboardLayout title="Active Incidents">

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>

        {/* Status filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['', 'reported', 'dispatching', 'in_progress', 'resolved'].map(s => (
            <button key={s}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(s)}
              style={{ textTransform: 'capitalize', fontSize: 11 }}>
              {s === '' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            {lastUpdated ? `Updated: ${lastUpdated.toLocaleTimeString()}` : ''}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={load}>
            <MdRefresh size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Count */}
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
        {loading ? 'Loading...' : `${incidents.length} incident${incidents.length !== 1 ? 's' : ''} found`}
      </p>

      {/* List */}
      {!loading && incidents.length === 0 ? (
        <div className="table-card" style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>
            No incidents found.
          </p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
            This page refreshes automatically every 15 seconds.
          </p>
        </div>
      ) : (
        <div className="table-card">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: 680 }}>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Reported</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {incidents.map(i => (
                  <tr key={i.incident_id} style={{
                    borderLeft: `3px solid ${STATUS_COLORS[i.status] || 'var(--line)'}`,
                  }}>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>
                      {i.reference_number}
                    </td>
                    <td style={{ textTransform: 'capitalize', fontWeight: 600,
                      fontSize: 13 }}>
                      {i.category?.replace('_', ' ')}
                    </td>
                    <td>
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
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--muted)',
                      maxWidth: 180, overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MdLocationOn size={12} color="var(--red)" />
                        {i.location_text ||
                          (i.latitude
                            ? `${parseFloat(i.latitude).toFixed(4)}, ${parseFloat(i.longitude).toFixed(4)}`
                            : '—')}
                      </span>
                    </td>
                    <td><Badge status={i.status} /></td>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {new Date(i.reported_at).toLocaleString()}
                    </td>
                    <td>
                      {['reported','dispatching','in_progress'].includes(i.status) && (
                        <button className="btn btn-primary btn-sm"
                          onClick={() => navigate(`/volunteer/alert/${i.incident_id}`)}>
                          Respond
                        </button>
                      )}
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