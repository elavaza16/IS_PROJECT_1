import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdOutlineEmergency, MdHistory, MdLocationOn } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import { getMyResponses } from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Badge from "../../components/ui/Badge";
import API from "../../services/api";

export default function VolunteerDashboard() {
  const navigate       = useNavigate();
  const { user }       = useAuth();
  const [alerts,    setAlerts]    = useState([]);
  const [history,   setHistory]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  // Poll for new alerts every 10 seconds
  useEffect(() => {
    const load = () => {
      API.get('/incidents?assigned=me&status=dispatching')
        .then(({ data }) => setAlerts(Array.isArray(data) ? data : []))
        .catch(() => {});
    };
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    getMyResponses()
      .then(({ data }) => setHistory(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = history.filter(i => i.status === 'in_progress');
  const resolved = history.filter(i => i.status === 'resolved');

  return (
    <DashboardLayout title="Volunteer Dashboard">

      {/* Stats */}
      <div className="stat-grid">
        {[
          { label: 'Pending Alerts',   value: alerts.length,   color: '#f59e0b', bg: '#fef3c7' },
          { label: 'Active Incidents', value: active.length,   color: '#10b981', bg: '#d1fae5' },
          { label: 'Total Responses',  value: history.length,  color: '#3b82f6', bg: '#dbeafe' },
          { label: 'Resolved',         value: resolved.length, color: '#8b5cf6', bg: '#ede9fe' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>
              <MdOutlineEmergency size={22} color={s.color} />
            </div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Incoming alerts */}
      {alerts.length > 0 && (
        <div className="table-card" style={{ marginTop: 24 }}>
          <div className="table-header">
            <span className="table-title">🚨 Incoming Alerts</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Updates every 10 seconds</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {alerts.map(alert => (
              <div key={alert.incident_id}
                style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#fff9f9' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--red)',
                    marginBottom: 4 }}>
                    {alert.category?.replace('_',' ')}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex',
                    alignItems: 'center', gap: 4 }}>
                    <MdLocationOn size={13} />
                    {alert.location_text || (alert.latitude ? `${parseFloat(alert.latitude).toFixed(4)}, ${parseFloat(alert.longitude).toFixed(4)}` : '—')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {new Date(alert.reported_at).toLocaleTimeString()}
                  </div>
                </div>
                <button className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/volunteer/alert/${alert.incident_id}`)}>
                  Respond
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active incidents */}
      {active.length > 0 && (
        <div className="table-card" style={{ marginTop: 24 }}>
          <div className="table-header">
            <span className="table-title">Active Incidents</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Type</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {active.map(i => (
                <tr key={i.incident_id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{i.reference_number}</td>
                  <td>{i.category?.replace('_',' ')}</td>
                  <td><Badge status={i.status} /></td>
                  <td>
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/volunteer/alert/${i.incident_id}`)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent history */}
      {history.length > 0 && (
        <div className="table-card" style={{ marginTop: 24 }}>
          <div className="table-header">
            <span className="table-title">Response History</span>
            <button className="btn btn-ghost btn-sm"
              onClick={() => navigate('/volunteer/history')}>
              View all
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0,5).map(i => (
                <tr key={i.incident_id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{i.reference_number}</td>
                  <td>{i.category?.replace('_',' ')}</td>
                  <td><Badge status={i.status} /></td>
                  <td>{new Date(i.reported_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </DashboardLayout>
  );
}