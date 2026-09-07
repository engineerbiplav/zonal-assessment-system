import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Topbar from "../components/Topbar.jsx";

export default function Dashboard() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const { data } = await api.get("/clubs");
    setClubs(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const exportAll = async () => {
    setExporting(true);
    try {
      const res = await api.get("/responses/export-all", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "zone-assessment-report.docx";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <Topbar />
      <div className="container">
        <div className="toolbar">
          <div>
            <h1>Your Clubs</h1>
            <p className="muted">Clubs under your zone. Click a club to manage its officers and responses.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn secondary" onClick={exportAll} disabled={exporting}>
              {exporting ? "Exporting..." : "Export All Responses (.docx)"}
            </button>
            <button className="btn gold" onClick={() => setShowModal(true)}>
              + Add Club
            </button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <strong>Universal Assessment Link</strong>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              One link for club presidents, the immediate past zone chairperson, and the 1st Vice District
              Governor/DGE — they'll pick their role and confirm their date of birth to reach their questions.
            </p>
          </div>
          <div className="link-box">
            <span>{window.location.origin}/assessment</span>
            <button
              className="btn small secondary"
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/assessment`)}
            >
              Copy
            </button>
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : clubs.length === 0 ? (
          <div className="card">No clubs yet. Add your first club to get started.</div>
        ) : (
          <div className="grid grid-2">
            {clubs.map((club) => (
              <div key={club._id} className="card club-card" onClick={() => navigate(`/clubs/${club._id}`)}>
                {club.logoUrl ? (
                  <img src={club.logoUrl} alt={club.name} />
                ) : (
                  <div className="avatar" />
                )}
                <div>
                  <h3 style={{ marginBottom: 2 }}>{club.name}</h3>
                  <span className="muted">Club #{club.clubNumber}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddClubModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function AddClubModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [clubNumber, setClubNumber] = useState("");
  const [logo, setLogo] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("clubNumber", clubNumber);
      if (logo) fd.append("logo", logo);
      await api.post("/clubs", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create club");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add Club</h2>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Club Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Lions Club of Kathmandu ..." />
          </div>
          <div className="form-group">
            <label>Club Number</label>
            <input value={clubNumber} onChange={(e) => setClubNumber(e.target.value)} required placeholder="e.g. 123456" />
          </div>
          <div className="form-group">
            <label>Logo (stored in cloud)</label>
            <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files[0])} />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
            <button className="btn gold" disabled={saving}>{saving ? "Saving..." : "Create Club"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
