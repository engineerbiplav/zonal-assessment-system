import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import Topbar from "../components/Topbar.jsx";

const POSITIONS = ["President", "Secretary", "Treasurer", "Membership Chairperson"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function ClubDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [responses, setResponses] = useState([]);
  const [editContact, setEditContact] = useState(null); // position placeholder or existing contact
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get(`/clubs/${id}`);
    setClub(data.club);
    setContacts(data.contacts);
    const { data: resData } = await api.get(`/responses?club=${id}`);
    setResponses(resData);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const contactFor = (position) => contacts.find((c) => c.position === position);
  const responseFor = (contactId) => responses.find((r) => r.contactPerson === contactId);

  const deleteResponse = async (responseId) => {
    if (!window.confirm("Delete this response? The president will need to submit again.")) return;
    await api.delete(`/responses/${responseId}`);
    load();
  };

  const deleteClub = async () => {
    if (
      !window.confirm(
        `Delete "${club.name}"? This permanently removes its officers, contacts, and all submitted responses.`
      )
    )
      return;
    try {
      await api.delete(`/clubs/${id}`);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete club");
    }
  };

  if (loading || !club) {
    return (
      <div>
        <Topbar />
        <div className="container">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <Topbar />
      <div className="container">
        <button className="btn secondary small" onClick={() => navigate("/dashboard")} style={{ marginBottom: 16 }}>
          ← Back to Clubs
        </button>

        <div
          className="card club-card"
          style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {club.logoUrl ? <img src={club.logoUrl} alt={club.name} /> : <div className="avatar" />}
            <div>
              <h1 style={{ marginBottom: 2 }}>{club.name}</h1>
              <span className="muted">Club #{club.clubNumber}</span>
            </div>
          </div>
          <button className="btn danger small" onClick={deleteClub}>Delete Club</button>
        </div>

        <div className="toolbar">
          <h2>Officers &amp; Contact Persons</h2>
        </div>

        <div className="grid grid-2">
          {POSITIONS.map((position) => {
            const contact = contactFor(position);
            const response = contact ? responseFor(contact._id) : null;
            return (
              <div className="card" key={position}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    {contact?.photoUrl ? (
                      <img className="avatar round" src={contact.photoUrl} alt={contact.name} />
                    ) : (
                      <div className="avatar round" />
                    )}
                    <div>
                      <strong>{position}</strong>
                      <div>{contact ? contact.name : <span className="muted">Not yet added</span>}</div>
                      {contact && <div className="muted">{contact.membershipNo}</div>}
                    </div>
                  </div>
                  {contact && (
                    contact.position === "President" ? (
                      contact.requiresResponse ? (
                        contact.hasResponded ? (
                          <span className="badge success">Responded</span>
                        ) : (
                          <span className="badge pending">Pending</span>
                        )
                      ) : (
                        <span className="badge na">Assessment inactive</span>
                      )
                    ) : (
                      <span className="badge na">Contact Info Only</span>
                    )
                  )}
                </div>

                {contact && (
                  <div style={{ marginTop: 12, fontSize: "0.85rem" }} className="muted">
                    <div>{contact.email} · {contact.mobileNo}</div>
                    <div>DOB: {MONTHS[contact.dobMonth - 1]} {contact.dobDay}{contact.bloodGroup ? ` · ${contact.bloodGroup}` : ""}</div>
                  </div>
                )}

                {contact && contact.position === "President" && contact.requiresResponse && (
                  <p className="muted" style={{ marginTop: 12, fontSize: "0.82rem" }}>
                    They can answer or update their response any time via the universal assessment link.
                  </p>
                )}
                {contact && contact.position !== "President" && (
                  <p className="muted" style={{ marginTop: 12, fontSize: "0.82rem" }}>
                    Only the club president has an online guiding-question assessment. This contact is kept for your records.
                  </p>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                  <button className="btn small" onClick={() => setEditContact(contact || { position, isNew: true })}>
                    {contact ? "Edit Details" : "Add Contact"}
                  </button>
                  {contact && response && (
                    <button className="btn small secondary" onClick={() => navigate(`/responses/${response.id || response._id}`)}>
                      View Response
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <h2 style={{ marginTop: 32 }}>Responses ({responses.length})</h2>
        <div className="card">
          {responses.length === 0 ? (
            <p className="muted">No responses submitted yet.</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Respondent</th>
                    <th>Position</th>
                    <th>Submitted On</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((r) => (
                    <tr key={r._id}>
                      <td>{r.respondentName}</td>
                      <td>{r.position}</td>
                      <td>{new Date(r.submittedAt).toLocaleString()}</td>
                      <td>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <Link to={`/responses/${r._id}`}>View →</Link>
                          <button className="btn small danger" onClick={() => deleteResponse(r._id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editContact && (
        <ContactModal
          clubId={id}
          contact={editContact}
          onClose={() => setEditContact(null)}
          onSaved={() => {
            setEditContact(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ContactModal({ clubId, contact, onClose, onSaved }) {
  const isNew = contact.isNew;
  const [form, setForm] = useState({
    position: contact.position,
    name: contact.name || "",
    membershipNo: contact.membershipNo || "",
    address: contact.address || "",
    mobileNo: contact.mobileNo || "",
    email: contact.email || "",
    dobMonth: contact.dobMonth || "",
    dobDay: contact.dobDay || "",
    bloodGroup: contact.bloodGroup || "",
    requiresResponse: contact.requiresResponse !== undefined ? contact.requiresResponse : true,
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

      if (isNew) {
        await api.post(`/clubs/${clubId}/contacts`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.put(`/contacts/${contact._id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save contact");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{isNew ? "Add" : "Edit"} Contact — {form.position}</h2>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Full Name</label>
            <input value={form.name} onChange={set("name")} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Membership No.</label>
              <input value={form.membershipNo} onChange={set("membershipNo")} required />
            </div>
            <div className="form-group">
              <label>Blood Group (optional)</label>
              <input value={form.bloodGroup} onChange={set("bloodGroup")} placeholder="e.g. O+" />
            </div>
          </div>
          <div className="form-group">
            <label>Address</label>
            <input value={form.address} onChange={set("address")} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Mobile No.</label>
              <input value={form.mobileNo} onChange={set("mobileNo")} required />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={form.email} onChange={set("email")} required />
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
            <label>Photo (stored in cloud)</label>
            <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />
          </div>
          {form.position === "President" ? (
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={form.requiresResponse}
                  onChange={(e) => setForm({ ...form, requiresResponse: e.target.checked })}
                  style={{ width: "auto", marginRight: 8 }}
                />
                Requires online guiding-question response
              </label>
            </div>
          ) : (
            <p className="muted" style={{ fontSize: "0.82rem", marginBottom: 4 }}>
              Only the club president has an online guiding-question assessment. Other officers are kept as contact records only.
            </p>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
            <button className="btn gold" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
