import { useState, useEffect } from "react";
import { getAllUsers, deactivateUser, activateUser } from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";

export default function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [err,     setErr]     = useState('');
  const [ok,      setOk]      = useState('');
  const [modal,   setModal]   = useState(null); // { user, action: 'deactivate' | 'activate' }

  const load = () => {
    getAllUsers()
      .then(({ data }) => setUsers(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleConfirm = async () => {
    const { user, action } = modal;
    try {
      if (action === 'deactivate') {
        await deactivateUser(user.user_id);
        setOk(`${user.full_name}'s account has been deactivated.`);
      } else {
        await activateUser(user.user_id);
        setOk(`${user.full_name}'s account has been reactivated.`);
      }
      setModal(null);
      load();
    } catch (err) {
      setErr(err.response?.data?.error || `Failed to ${action} user.`);
      setModal(null);
    }
  };

  const filtered = users.filter(u =>
    !search ||
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  );

  return (
    <DashboardLayout title="Users">

      {err && <Alert type="error">{err}</Alert>}
      {ok  && <Alert type="success">{ok}</Alert>}

      <div className="table-card">
        <div className="table-header">
          <span className="table-title">All Users ({filtered.length})</span>
          <input
            placeholder="Search name, email or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '7px 12px', border: '1.5px solid var(--line)',
              borderRadius: 'var(--radius-md)', fontSize: 13, outline: 'none',
              width: 240 }}
          />
        </div>

        {loading ? (
          <p style={{ padding: 20, color: 'var(--muted)', fontSize: 13 }}>Loading...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Verified</th>
                  <th>Active</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.user_id}>
                    <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                    <td style={{ fontSize: 12 }}>{u.email}</td>
                    <td style={{ fontSize: 12 }}>{u.phone}</td>
                    <td>
                      <span style={{
                        background: u.role === 'admin' ? '#fef3c7'
                          : u.role === 'volunteer' ? 'var(--green-xlt)' : 'var(--blue-lt)',
                        color: u.role === 'admin' ? '#d97706'
                          : u.role === 'volunteer' ? 'var(--green)' : 'var(--blue)',
                        padding: '2px 10px', borderRadius: 20,
                        fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                      }}>
                        {u.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12,
                        color: u.is_email_verified ? 'var(--green)' : 'var(--muted)' }}>
                        {u.is_email_verified ? '✓ Yes' : '✗ No'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12,
                        color: u.is_active ? 'var(--green)' : 'var(--red)' }}>
                        {u.is_active ? '✓ Yes' : '✗ No'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      {u.role !== 'admin' && (
                        u.is_active ? (
                          <button className="btn btn-danger btn-sm"
                            onClick={() => setModal({ user: u, action: 'deactivate' })}>
                            Deactivate
                          </button>
                        ) : (
                          <button className="btn btn-primary btn-sm"
                            style={{ background: 'var(--green)' }}
                            onClick={() => setModal({ user: u, action: 'activate' })}>
                            Reactivate
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm modal */}
      <Modal open={!!modal} onClose={() => setModal(null)}
        title={modal?.action === 'deactivate' ? 'Deactivate Account' : 'Reactivate Account'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant={modal?.action === 'deactivate' ? 'danger' : 'primary'}
              onClick={handleConfirm}>
              {modal?.action === 'deactivate' ? 'Deactivate' : 'Reactivate'}
            </Button>
          </>
        }>
        <p style={{ fontSize: 14, color: 'var(--navy)' }}>
          {modal?.action === 'deactivate' ? (
            <>
              Are you sure you want to deactivate{' '}
              <strong>{modal?.user?.full_name}</strong>'s account?
              They will not be able to log in until reactivated.
            </>
          ) : (
            <>
              Reactivate <strong>{modal?.user?.full_name}</strong>'s account?
              They will be able to log in again immediately.
            </>
          )}
        </p>
      </Modal>

    </DashboardLayout>
  );
}