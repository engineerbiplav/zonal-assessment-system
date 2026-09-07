import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Topbar from "../components/Topbar.jsx";

export default function ResponseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [response, setResponse] = useState(null);

  useEffect(() => {
    api.get(`/responses/${id}`).then(({ data }) => setResponse(data));
  }, [id]);

  const exportDocx = async () => {
    const res = await api.get(`/responses/${id}/export`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${response.respondentName}-${response.position}-response.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
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
          <button className="btn gold" onClick={exportDocx}>Export as .docx</button>
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
