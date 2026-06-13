import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAllIncidents } from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Badge from "../../components/ui/Badge";

const CATEGORIES = ['road_accident','medical_distress','fire_hazard','security_threat','other'];
const STATUSES   = ['reported','dispatching','in_progress','resolved','cancelled','escalated'];

export default function AdminIncidents() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [incidents, setIncidents] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [status,    setStatus]    = useState(searchParams.get('status') || '');
  const [category,  setCategory]  = useState('');
  const [search,    setSearch]    = useState('');

  const load = () => {
    setLoading(true);
    const params = [];
    if (status)   params.push(`status=${status}`);
    if (category) params.push(`category=${category}`);
    const query = params.length ? `?${params.join('&')}` : '';

    getAllIncidents(query)
      .then(({ data }) => setIncidents(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [status, category]);

  const filtered = incidents.filter(i =>
    !search ||
    i.reference_number?.toLowerCase().includes(search.toLowerCase()) ||
    i.reporter_name?.toLowerCase().includes(search.toLowerCase()) ||
    i.location_text?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Incidents">

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ padding: '8px 12px', border: '1.5px solid var(--line)',
            borderRadius: 'var(--radius-md)', fontSize: 13, outline: 'none',
            background: 'var(--white)' }}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => (
            <option key={s} value={s} style={{ textTransform: 'capitalize' }}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>

        <select value={category} onChange={e => setCategory(e.target.value)}
          style={{ padding: '8px 12px', border: '1.5px solid var(--line)',
            borderRadius: 'var(--radius-md)', fontSize: 13, outline: 'none',
            background: 'var(--white)' }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c.replace('_', ' ')}</option>
          ))}
        </select>

        <input placeholder="Search reference, reporter or location..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px 12px', border: '1.5px solid var(--line)',
            borderRadius: 'var(--radius-md)', fontSize: 13, outline: 'none',
            flex: 1, minWidth: 200 }}
        />
      </div>

      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Incidents ({filtered.length})</span>
        </div>

        {loading ? (
          <p style={{ padding: 20, color: 'var(--muted)', fontSize: 13 }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: 20, color: 'var(--muted)', fontSize: 13 }}>
            No incidents found.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Reporter</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Channel</th>
                  <th>Reported</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(i => (
                  <tr key={i.incident_id}
                    style={{ background: i.is_flagged ? '#fef2f2' : undefined }}>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>
                      {i.reference_number}
                      {i.is_flagged && (
                        <span style={{ color: 'var(--red)', marginLeft: 6,
                          fontSize: 10, fontWeight: 700 }}>⚑ Flagged</span>
                      )}
                    </td>
                    <td style={{ textTransform: 'capitalize', fontSize: 12 }}>
                      {i.category?.replace('_', ' ')}
                    </td>
                    <td style={{ textTransform: 'capitalize', fontSize: 12 }}>
                      {i.severity}
                    </td>
                    <td style={{ fontSize: 12 }}>{i.reporter_name}</td>
                    <td style={{ fontSize: 12, maxWidth: 140,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {i.location_text ||
                        (i.latitude ? `${i.latitude?.toFixed(3)}, ${i.longitude?.toFixed(3)}` : '—')}
                    </td>
                    <td><Badge status={i.status} /></td>
                    <td style={{ fontSize: 11, textTransform: 'uppercase',
                      color: 'var(--muted)' }}>{i.channel}</td>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {new Date(i.reported_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/admin/incidents/${i.incident_id}`)}>
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