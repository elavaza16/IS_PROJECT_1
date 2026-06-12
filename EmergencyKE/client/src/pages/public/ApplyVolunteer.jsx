import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdLocationOn } from "react-icons/md";
import { applyVolunteer } from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";

export default function ApplyVolunteer() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    tier: '', general_area: '', latitude: null,
    longitude: null, declaration_signed: false
  });
  const [loading,  setLoading]  = useState(false);
  const [locating, setLocating] = useState(false);
  const [err,      setErr]      = useState('');
  const [ok,       setOk]       = useState('');

  const getLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({
          ...f,
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.tier)               return setErr('Please select your volunteer tier.');
    if (!form.declaration_signed) return setErr('You must agree to the declaration.');

    setLoading(true);
    try {
      await applyVolunteer(form);
      setOk('Application submitted! You will be notified once an admin reviews it.');
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setErr(err.response?.data?.error || 'Application failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Apply to Become a Volunteer">
      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        {err && <Alert type="error">{err}</Alert>}
        {ok  && <Alert type="success">{ok}</Alert>}

        <div style={{ background: 'var(--blue-lt)', border: '1px solid #AED6F1',
          borderLeft: '3px solid var(--blue)', borderRadius: 'var(--radius-md)',
          padding: '12px 14px', marginBottom: 24, fontSize: 13, color: '#1A5276' }}>
          <strong>Important:</strong> As a volunteer you will respond to emergency
          alerts near your location. Your application will be reviewed by an admin
          before activation.
        </div>

        <form onSubmit={submit}>

          {/* Tier */}
          <div className="field">
            <label className="field-label">Volunteer Tier</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { value: 'first_responder', label: 'First Responder', desc: 'Provide first aid at the scene' },
                { value: 'driver',          label: 'Driver',           desc: 'Transport victims to hospital' },
                { value: 'both',            label: 'Both',             desc: 'First aid and transport' },
              ].map(t => (
                <button key={t.value} type="button"
                  style={{
                    padding: '12px 14px', borderRadius: 'var(--radius-md)', textAlign: 'left',
                    border: `2px solid ${form.tier === t.value ? 'var(--green)' : 'var(--line)'}`,
                    background: form.tier === t.value ? 'var(--green-xlt)' : 'var(--white)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setForm(f => ({...f, tier: t.value}))}>
                  <div style={{ fontWeight: 700, fontSize: 14,
                    color: form.tier === t.value ? 'var(--green)' : 'var(--navy)' }}>
                    {t.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    {t.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Area */}
          <div className="field">
            <label className="field-label">General Area</label>
            <div className="input-wrap">
              <span className="input-icon"><MdLocationOn size={15} /></span>
              <input type="text" placeholder="e.g. Westlands, Nairobi"
                value={form.general_area}
                onChange={e => setForm(f => ({...f, general_area: e.target.value}))}
              />
            </div>
          </div>

          {/* GPS */}
          <div className="field">
            <label className="field-label">Your Location (for proximity matching)</label>
            <Button variant="secondary" loading={locating} onClick={getLocation} type="button">
              <MdLocationOn size={16} />
              {form.latitude ? `GPS captured: ${form.latitude.toFixed(4)}, ${form.longitude.toFixed(4)}`
                : 'Capture my GPS location'}
            </Button>
          </div>

          {/* Declaration */}
          <div style={{ background: 'var(--grey-lt)', borderRadius: 'var(--radius-md)',
            padding: 16, marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--navy)', marginBottom: 12, lineHeight: 1.6 }}>
              I declare that I am willing to respond to emergency alerts in my area,
              that I have the physical ability to assist in emergencies, and that I
              understand my role as a community volunteer first responder.
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10,
              cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              <input type="checkbox"
                checked={form.declaration_signed}
                onChange={e => setForm(f => ({...f, declaration_signed: e.target.checked}))}
                style={{ accentColor: 'var(--red)', width: 16, height: 16 }}
              />
              I agree to the above declaration
            </label>
          </div>

          <Button type="submit" variant="primary" loading={loading}>
            Submit Application
          </Button>

        </form>
      </div>
    </DashboardLayout>
  );
}