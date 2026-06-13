import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAllVolunteers, approveVolunteer, rejectVolunteer } from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";

export default function AdminVolunteers() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultStatus = searchParams.get('status') || 'pending';

  const [volunteers, setVolunteers] = useState([]);
  const [filter,     setFilter]     = useState(defaultStatus);
  const [loading,    setLoading]    = useState(true);
  const [err,        setErr]        = useState('');
  const [ok,         setOk]         = useState('');
  const [modal,      setModal]      = useState(null); // { type: 'approve'|'reject', vol }
  const [reason,     setReason]     = useState('');

  const load = (status) => {
    setLoading(true);
    getAllVolunteers(status ? `?status=${status}` : '')
      .then(({ data }) => setVolunteers(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(filter); }, [filter]);

  const handleApprove = async () => {
    try {
      await approveVolunteer(modal.vol.volunteer_id);
      setOk(`${modal.vol.full_name} has been approved as a volunteer.`);
      setModal(null);
      load(filter);
    } catch (err) {
      setErr(err.response?.data?.error || 'Approval failed.');
      setModal(null);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) return;
    try {
      await rejectVolunteer(modal.vol.volunteer_id, { reason });
      setOk(`${modal.vol.full_name}'s application has been rejected.`);
      setModal(null);
      setReason('');
      load(filter);
    } catch (err) {
      setErr(err.response?.data?.error || 'Rejection failed.');
      setModal(null);
    }
  };

  return (
    <DashboardLayout title="Volunteers">

      {err && <Alert type="error">{err}</Alert>}
      {ok  && <Alert type="success">{ok}</Alert>}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['pending','active','rejected','suspended'].map(s => (
          <button key={s}
            className={`btn btn-${filter === s ? 'primary' : 'secondary'} btn-sm`}
            style={{ textTransform: 'capitalize' }}
            onClick={() => setFilter(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className="table-card">
        <div className="table-header">
          <span className="table-title">
            {filter.charAt(0).toUpperCase() + filter.slice(1)} Volunteers ({volunteers.length})
          </span>
        </div>

        {loading ? (
          <p style={{ padding: 20, color: 'var(--muted)', fontSize: 13 }}>Loading...</p>
        ) : volunteers.length === 0 ? (
          <p style={{ padding: 20, color: 'var(--muted)', fontSize: 13 }}>
            No {filter} volunteers found.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Tier</th>
                  <th>Area</th>
                  <th>Docs Complete</th>
                  <th>Status</th>
                  <th>Applied</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {volunteers.map(v => (
                  <tr key={v.volunteer_id}>
                    <td style={{ fontWeight: 600 }}>{v.full_name}</td>
                    <td style={{ textTransform: 'capitalize' }}>
                      {v.tier?.replace('_', ' ')}
                    </td>
                    <td style={{ fontSize: 12 }}>{v.general_area || '—'}</td>
                    <td>
                      <span style={{
                        color: v.is_complete ? 'var(--green)' : 'var(--red)',
                        fontSize: 12, fontWeight: 600,
                      }}>
                        {v.is_complete ? '✓ Complete' : '✗ Incomplete'}
                      </span>
                    </td>
                    <td><Badge status={v.status} /></td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {v.applied_at
                        ? new Date(v.applied_at).toLocaleDateString()
                        : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/admin/volunteers/${v.volunteer_id}`)}>
                          View
                        </button>
                        {v.status === 'pending' && (
                          <>
                            <button className="btn btn-primary btn-sm"
                              style={{ background: 'var(--green)', fontSize: 11 }}
                              onClick={() => setModal({ type: 'approve', vol: v })}>
                              Approve
                            </button>
                            <button className="btn btn-danger btn-sm"
                              style={{ fontSize: 11 }}
                              onClick={() => { setModal({ type: 'reject', vol: v }); setReason(''); }}>
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve modal */}
      <Modal open={modal?.type === 'approve'} onClose={() => setModal(null)}
        title="Approve Volunteer"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleApprove}
              style={{ background: 'var(--green)' }}>
              Confirm Approval
            </Button>
          </>
        }>
        <p style={{ fontSize: 14, color: 'var(--navy)' }}>
          Approve <strong>{modal?.vol?.full_name}</strong> as a volunteer?
          Their role will be upgraded and they will start receiving emergency alerts.
        </p>
      </Modal>

      {/* Reject modal */}
      <Modal open={modal?.type === 'reject'} onClose={() => setModal(null)}
        title="Reject Application"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleReject}
              disabled={!reason.trim()}>
              Confirm Rejection
            </Button>
          </>
        }>
        <p style={{ fontSize: 14, color: 'var(--navy)', marginBottom: 14 }}>
          Reject <strong>{modal?.vol?.full_name}</strong>'s application?
          Please provide a reason.
        </p>
        <textarea
          placeholder="Reason for rejection..."
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          style={{ width: '100%', padding: '10px 12px',
            border: '1.5px solid var(--line)', borderRadius: 'var(--radius-md)',
            fontSize: 13, fontFamily: 'var(--font-base)', resize: 'vertical',
            outline: 'none' }}
        />
      </Modal>

    </DashboardLayout>
  );
}