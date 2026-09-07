import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Topbar from "../components/Topbar.jsx";

export default function ResponseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [response, setResponse] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get(`/responses/${id}`).then(({ data }) => setResponse(data));
  }, [id]);

  const deleteResponse = async () => {
    if (!window.confirm("Delete this response? The president will need to submit again.")) return;
    setDeleting(true);
    try {
      await api.delete(`/responses/${id}`);
      navigate(-1);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete response");
      setDeleting(false);
    }
  };

  if (!response) {
    return (
      <div>
        <Topbar />
        <div className="container">Loading...</div>
      </div>
    );
  }

  let currentCategory = null;

  return (
    <div>
      <Topbar />
      <div className="container">
        <button className="btn secondary small" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
          ← Back
        </button>

        <div className="toolbar">
          <div>
            <h1>{response.respondentName} — {response.position}</h1>
            <p className="muted">
              {response.club.name} (#{response.club.clubNumber}) · Submitted {new Date(response.submittedAt).toLocaleString()}
            </p>
          </div>
          <button className="btn danger" onClick={deleteResponse} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete Response"}
          </button>
        </div>

        {response.answers.map((a) => {
          const newCategory = a.category !== currentCategory;
          currentCategory = a.category;
          return (
            <React.Fragment key={a.questionId}>
              {newCategory && <h3 style={{ marginTop: 24 }}>{a.category}</h3>}
              <div className="card" style={{ marginBottom: 10 }}>
                <strong>{a.question}</strong>
                <p style={{ marginTop: 8, marginBottom: 0 }}>{a.answer || <span className="muted">(no answer provided)</span>}</p>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
