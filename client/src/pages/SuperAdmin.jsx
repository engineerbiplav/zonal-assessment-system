import React, { useEffect, useState } from "react";
import api from "../api/axios";
import Topbar from "../components/Topbar.jsx";

export default function SuperAdmin() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get("/admins");
    setAdmins(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const removeAdmin = async (admin) => {
    if (
      !window.confirm(
        `Delete ${admin.name}'s zonal head account? This permanently removes their clubs, contacts, responses, and questions.`
      )
    )
      return;
    await api.delete(`/admins/${admin.id}`);
    load();
  };

  return (
    <div>
      <Topbar />
      <div className="container">
        <div className="toolbar">
          <div>
            <h1>Zonal Heads</h1>
            <p className="muted">Create and manage the zonal head accounts (like Dibakar Paudel) that run each zone.</p>
          </div>
          <button className="btn gold" onClick={() => setShowModal(true)}>
            + Add Zonal Head
          </button>
        </div>

        {loading ? (
          <p className="muted">Loading...</p>
        ) : admins.length === 0 ? (
          <div className="card">No zonal heads yet. Create the first one to get started.</div>
        ) : (
          <div className="card table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Zone</th>
                  <th>Clubs</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.email}</td>
                    <td>{a.zoneName || "—"}</td>
                    <td>{a.clubCount}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button className="btn small secondary" onClick={() => setEditAdmin(a)}>Edit</button>
                        <button className="btn small danger" onClick={() => removeAdmin(a)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <AdminModal
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
        />
      )}

      {editAdmin && (
        <AdminModal
          admin={editAdmin}
          onClose={() => setEditAdmin(null)}
          onSaved={() => {
            setEditAdmin(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function AdminModal({ admin, onClose, onSaved }) {
  const isNew = !admin;
  const [name, setName] = useState(admin?.name || "");
  const [title, setTitle] = useState(admin?.title || "Zonal Head");
  const [email, setEmail] = useState(admin?.email || "");
  const [zoneName, setZoneName] = useState(admin?.zoneName || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (isNew) {
        await api.post("/admins", { name, title, email, zoneName, password });
      } else {
        const payload = { name, title, zoneName };
        if (password) payload.password = password;
        await api.put(`/admins/${admin.id}`, payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save zonal head");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{isNew ? "Add Zonal Head" : `Edit — ${admin.name}`}</h2>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Dibakar Paudel" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Zonal Head" />
            </div>
            <div className="form-group">
              <label>Zone Name</label>
              <input value={zoneName} onChange={(e) => setZoneName(e.target.value)} placeholder="Zone - Kathmandu" />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!isNew}
            />
          </div>
          <div className="form-group">
            <label>{isNew ? "Password" : "Reset Password (optional)"}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={isNew}
              placeholder={isNew ? "" : "Leave blank to keep current password"}
              minLength={6}
            />
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
