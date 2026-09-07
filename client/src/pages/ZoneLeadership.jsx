import React, { useEffect, useState } from "react";
import api from "../api/axios";
import Topbar from "../components/Topbar.jsx";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function ZoneLeadership() {
  const [entries, setEntries] = useState([]); // [{ role, label, official, hasResponse }]
  const [loading, setLoading] = useState(true);
  const [editRole, setEditRole] = useState(null); // { role, label, official }
  const [viewRole, setViewRole] = useState(null); // { role, label } to view response for

  const load = async () => {
    setLoading(true);
    const { data } = await api.get("/zone-officials");
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const exportDocx = async (role, label) => {
    try {
      const res = await api.get(`/zone-officials/${role}/export`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${label}-response.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(err.response?.data?.message || "No response to export yet");
    }
  };

  return (
    <div>
      <Topbar />
      <div className="container">
        <div className="toolbar">
          <div>
            <h1>Zone Leadership</h1>
            <p className="muted">
              These two roles aren't tied to a club — set up who currently holds each, and they can answer
              (or update) their assessment any time via the universal assessment link.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="muted">Loading...</p>
        ) : (
          <div className="grid grid-2">
            {entries.map(({ role, label, official, hasResponse }) => (
              <div className="card" key={role}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    {official?.photoUrl ? (
                      <img className="avatar round" src={official.photoUrl} alt={official.name} />
                    ) : (
                      <div className="avatar round" />
                    )}
                    <div>
                      <strong>{label}</strong>
                      <div>{official ? official.name : <span className="muted">Not yet set up</span>}</div>
                    </div>
                  </div>
                  {official && (
                    official.hasResponded ? (
                      <span className="badge success">Responded</span>
                    ) : (
                      <span className="badge pending">Pending</span>
                    )
                  )}
                </div>

                {official && (
                  <div style={{ marginTop: 12, fontSize: "0.85rem" }} className="muted">
                    <div>{official.email || "—"} · {official.mobileNo || "—"}</div>
                    <div>DOB: {MONTHS[official.dobMonth - 1]} {official.dobDay}</div>
                  </div>
                )}

                <p className="muted" style={{ marginTop: 12, fontSize: "0.82rem" }}>
                  They can answer or update their response any time via the universal assessment link.
                </p>

                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  <button className="btn small" onClick={() => setEditRole({ role, label, official })}>
                    {official ? "Edit Details" : "Set Up"}
                  </button>
                  {hasResponse && (
                    <>
                      <button className="btn small secondary" onClick={() => setViewRole({ role, label })}>
                        View Response
                      </button>
                      <button className="btn small secondary" onClick={() => exportDocx(role, label)}>
                        Export .docx
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editRole && (
        <ZoneOfficialModal
          role={editRole.role}
          label={editRole.label}
          official={editRole.official}
          onClose={() => setEditRole(null)}
          onSaved={() => { setEditRole(null); load(); }}
        />
      )}

      {viewRole && (
        <ZoneResponseModal
          role={viewRole.role}
          label={viewRole.label}
          onClose={() => setViewRole(null)}
        />
      )}
    </div>
  );
}

function ZoneOfficialModal({ role, label, official, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: official?.name || "",
    mobileNo: official?.mobileNo || "",
    email: official?.email || "",
    dobMonth: official?.dobMonth || "",
    dobDay: official?.dobDay || "",
  });
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append("photo", photo);
      await api.put(`/zone-officials/${role}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{official ? "Edit" : "Set Up"} — {label}</h2>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Full Name</label>
            <input value={form.name} onChange={set("name")} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Mobile No. (optional)</label>
              <input value={form.mobileNo} onChange={set("mobileNo")} />
            </div>
            <div className="form-group">
              <label>Email (optional)</label>
              <input type="email" value={form.email} onChange={set("email")} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date of Birth — Month</label>
              <select value={form.dobMonth} onChange={set("dobMonth")} required>
                <option value="">Select</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Date of Birth — Day</label>
              <input type="number" min="1" max="31" value={form.dobDay} onChange={set("dobDay")} required />
            </div>
          </div>
          <div className="form-group">
            <label>Photo (optional, stored in cloud)</label>
            <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
            <button className="btn gold" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ZoneResponseModal({ role, label, onClose }) {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/zone-officials/${role}/response`)
      .then(({ data }) => setResponse(data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load response"));
  }, [role]);

  let currentCategory = null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <h2>{label}</h2>
        {error && <div className="alert error">{error}</div>}
        {!response && !error && <p className="muted">Loading...</p>}
        {response && (
          <>
            <p className="muted" style={{ marginBottom: 16 }}>
              {response.respondentName} · Submitted {new Date(response.submittedAt).toLocaleString()}
            </p>
            {response.answers.map((a) => {
              const newCategory = a.category !== currentCategory;
              currentCategory = a.category;
              return (
                <React.Fragment key={a.questionId}>
                  {newCategory && <h3 style={{ marginTop: 18 }}>{a.category}</h3>}
                  <div className="card" style={{ marginBottom: 10 }}>
                    <strong>{a.question}</strong>
                    <p style={{ marginTop: 8, marginBottom: 0 }}>
                      {a.answer || <span className="muted">(no answer provided)</span>}
                    </p>
                  </div>
                </React.Fragment>
              );
            })}
          </>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button className="btn secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
