import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdOutlineEmergency,
  MdLocationOn,
  MdWarning,
  MdLocalHospital,
  MdDirectionsCar,
  MdLocalFireDepartment,
  MdSecurity,
} from "react-icons/md";
import { reportIncident } from "../../services/api";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";

const CATEGORIES = [
  { value: 'medical_distress', label: 'Medical Emergency', color: '#ef4444', Icon: MdLocalHospital },
  { value: 'road_accident', label: 'Road Accident', color: '#f97316', Icon: MdDirectionsCar },
  { value: 'fire_hazard', label: 'Fire Hazard', color: '#dc2626', Icon: MdLocalFireDepartment },
  { value: 'security_threat', label: 'Security Threat', color: '#7c3aed', Icon: MdSecurity },
  { value: 'other', label: 'Other Emergency', color: '#6b7280', Icon: MdWarning },
];

export default function ReportEmergency() {
  const navigate = useNavigate();
  const [step,     setStep]     = useState(1); // 1=type, 2=location, 3=confirm
  const [form,     setForm]     = useState({
    category: '', severity: 'medium', location_source: 'gps',
    latitude: null, longitude: null, location_text: '', description: ''
  });
  const [loading,  setLoading]  = useState(false);
  const [locating, setLocating] = useState(false);
  const [err,      setErr]      = useState('');
  const selectedCategory = CATEGORIES.find(c => c.value === form.category);

  const getLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({
          ...f,
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
          location_source: 'gps',
        }));
        setLocating(false);
        setStep(3);
      },
      () => {
        setLocating(false);
        setForm(f => ({ ...f, location_source: 'manual' }));
      }
    );
  };

  const submit = async () => {
    setLoading(true);
    try {
      const { data } = await reportIncident(form);
      navigate(`/incident/${data.incident_id}`, {
        state: { justReported: true, reference: data.reference_number }
      });
    } catch (err) {
      setErr(err.response?.data?.error || 'Failed to report. Please try again.');
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Report Emergency">
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, alignItems: 'center' }}>
          {[1,2,3].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: step >= s ? 'var(--red)' : 'var(--line)',
                color: step >= s ? '#fff' : 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
              }}>{s}</div>
              {s < 3 && <div style={{ width: 32, height: 2, background: step > s ? 'var(--red)' : 'var(--line)' }} />}
            </div>
          ))}
          <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>
            {step === 1 ? 'Select type' : step === 2 ? 'Location' : 'Confirm'}
          </span>
        </div>

        {err && <Alert type="error">{err}</Alert>}

        {/* Step 1 — Select category */}
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--navy)' }}>
              What type of emergency?
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.value}
                  style={{
                    padding: '14px 16px', borderRadius: 'var(--radius-md)',
                    border: `2px solid ${form.category === cat.value ? cat.color : 'var(--line)'}`,
                    background: form.category === cat.value ? cat.color + '12' : 'var(--white)',
                    textAlign: 'left', fontSize: 15, fontWeight: 600,
                    color: form.category === cat.value ? cat.color : 'var(--navy)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onClick={() => { setForm(f => ({...f, category: cat.value})); setStep(2); }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <cat.Icon size={18} />
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Location */}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--navy)' }}>
              Where is the emergency?
            </h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              Share your GPS location for faster response, or describe the location manually.
            </p>

            <Button variant="primary" loading={locating} onClick={getLocation}
              style={{ marginBottom: 16 }}>
              <MdLocationOn size={18} /> Use my current location (GPS)
            </Button>

            <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12,
              margin: '12px 0' }}> or describe manually </div>

            <div className="field">
              <label className="field-label">Location description</label>
              <div className="input-wrap">
                <span className="input-icon"><MdLocationOn size={15} /></span>
                <input
                  type="text"
                  placeholder="e.g. Near Kencom, Nairobi CBD"
                  value={form.location_text}
                  onChange={e => setForm(f => ({
                    ...f, location_text: e.target.value, location_source: 'manual'
                  }))}
                />
              </div>
            </div>

            {form.location_text && (
              <Button variant="primary" onClick={() => setStep(3)}
                style={{ marginTop: 12 }}>
                Continue →
              </Button>
            )}

            <button className="btn btn-ghost" style={{ marginTop: 12, display: 'block' }}
              onClick={() => setStep(1)}>
              ← Back
            </button>
          </div>
        )}

        {/* Step 3 — Confirm */}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--navy)' }}>
              Confirm your report
            </h3>

            <div style={{ background: 'var(--grey-lt)', borderRadius: 'var(--radius-md)',
              padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Emergency type</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {selectedCategory && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <selectedCategory.Icon size={15} />
                      {selectedCategory.label}
                    </span>
                  )}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Location</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {form.location_source === 'gps'
                    ? `GPS: ${form.latitude?.toFixed(4)}, ${form.longitude?.toFixed(4)}`
                    : form.location_text}
                </span>
              </div>
            </div>

            {/* Severity */}
            <div className="field" style={{ marginBottom: 20 }}>
              <label className="field-label">Severity</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['low','medium','high'].map(s => (
                  <button key={s}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 'var(--radius-md)',
                      border: `2px solid ${form.severity === s ? 'var(--red)' : 'var(--line)'}`,
                      background: form.severity === s ? 'var(--red-xlt)' : 'var(--white)',
                      fontWeight: 600, fontSize: 13, textTransform: 'capitalize',
                      color: form.severity === s ? 'var(--red)' : 'var(--navy)',
                      cursor: 'pointer',
                    }}
                    onClick={() => setForm(f => ({...f, severity: s}))}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="field" style={{ marginBottom: 20 }}>
              <label className="field-label">
                Additional details <span className="field-hint">optional</span>
              </label>
              <textarea
                placeholder="Describe what is happening..."
                value={form.description}
                onChange={e => setForm(f => ({...f, description: e.target.value}))}
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1.5px solid var(--line)', borderRadius: 'var(--radius-md)',
                  fontSize: 14, fontFamily: 'var(--font-base)', resize: 'vertical',
                  outline: 'none', color: 'var(--navy)',
                }}
              />
            </div>

            <Button type="button" variant="primary" loading={loading} onClick={submit}>
              <MdOutlineEmergency size={18} /> Send Emergency Report
            </Button>

            <button className="btn btn-ghost" style={{ marginTop: 12, display: 'block' }}
              onClick={() => setStep(2)}>
              ← Back
            </button>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}