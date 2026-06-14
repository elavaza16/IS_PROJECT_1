import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MdOutlineEmergency, MdLocationOn, MdCalendarToday } from "react-icons/md";
import { getMyIncidents } from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Badge from "../../components/ui/Badge";

const SEVERITY_COLORS = {
  high:   { bg: 'var(--red-xlt)',  text: 'var(--red)'   },
  medium: { bg: '#fef3c7',         text: '#d97706'       },
  low:    { bg: 'var(--green-xlt)',text: 'var(--green)'  },
};

export default function MyReports() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [incidents, setIncidents] = useState([]);
  const [loading,   setLoading]   = useState(true);

  const filter = searchParams.get("filter") || "all";

  useEffect(() => {
    getMyIncidents()
      .then(({ data }) => setIncidents(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const unique = useMemo(() =>
    incidents.filter((inc, i, arr) =>
      arr.findIndex(x => x.incident_id === inc.incident_id) === i
    ), [incidents]);

  const filtered = useMemo(() =>
    filter === "active"
      ? unique.filter(i => ['reported','dispatching','in_progress'].includes(i.status))
      : unique,
    [filter, unique]
  );

  return (
    <DashboardLayout title="My Reports">

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          Track all emergencies you have reported.
        </p>
      </div>

      {/* Filter + count */}
      <div style={{ display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>
          {filtered.length} {filter === 'active' ? 'active' : 'total'} report{filtered.length !== 1 ? 's' : ''}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'active'].map(f => (
            <button key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}
              onClick={() => f === 'all' ? setSearchParams({}) : setSearchParams({ filter: f })}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Loading reports...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px',
          background: 'var(--white)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--line)' }}>
          <MdOutlineEmergency size={40} color="var(--line)" />
          <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 12 }}>
            {filter === 'active'
              ? 'No active incidents right now.'
              : 'You have not reported any incidents yet.'}
          </p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }}
            onClick={() => navigate('/report')}>
            Report an Emergency
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(inc => {
            const sev = SEVERITY_COLORS[inc.severity] || SEVERITY_COLORS.medium;
            const isActive = ['reported','dispatching','in_progress'].includes(inc.status);
            return (
              <div key={inc.incident_id}
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--line)',
                  borderLeft: `4px solid ${isActive ? 'var(--red)' : 'var(--line)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  display: 'flex', alignItems: 'flex-start',
                  justifyContent: 'space-between', gap: 12,
                }}>

                {/* Left — details */}
                <div style={{ flex: 1, minWidth: 0 }}>

                  {/* Row 1 — category + severity + status */}
                  <div style={{ display: 'flex', alignItems: 'center',
                    gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14,
                      textTransform: 'capitalize', color: 'var(--navy)' }}>
                      {inc.category?.replace('_', ' ')}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      padding: '2px 8px', borderRadius: 20,
                      background: sev.bg, color: sev.text,
                    }}>
                      {inc.severity}
                    </span>
                    <Badge status={inc.status} />
                  </div>

                  {/* Row 2 — reference */}
                  <div style={{ fontSize: 11, fontFamily: 'monospace',
                    color: 'var(--muted)', marginBottom: 5 }}>
                    {inc.reference_number}
                  </div>

                  {/* Row 3 — location + date */}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {inc.location_text && (
                      <span style={{ display: 'flex', alignItems: 'center',
                        gap: 4, fontSize: 12, color: 'var(--muted)' }}>
                        <MdLocationOn size={13} color="var(--red)" />
                        {inc.location_text}
                      </span>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center',
                      gap: 4, fontSize: 12, color: 'var(--muted)' }}>
                      <MdCalendarToday size={12} />
                      {new Date(inc.reported_at).toLocaleDateString('en-KE', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* Right — action */}
                <button className="btn btn-secondary btn-sm"
                  style={{ flexShrink: 0 }}
                  onClick={() => navigate(`/incident/${inc.incident_id}`)}>
                  View
                </button>

              </div>
            );
          })}
        </div>
      )}

    </DashboardLayout>
  );
}