import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

// Short icon glyphs per guiding-question category, purely decorative.
const SECTION_ICONS = {
  Membership: "M",
  Leadership: "L",
  Service: "S",
  Communication: "C",
  General: "G",
};

export default function PublicForm() {
  const { token } = useParams();
  const [state, setState] = useState({ loading: true, error: "", data: null });
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [justSaved, setJustSaved] = useState(null); // { submittedAt } shown briefly after a save

  useEffect(() => {
    api
      .get(`/public/form/${token}`)
      .then(({ data }) => {
        setState({ loading: false, error: "", data });
        setAnswers(data.previousAnswers || {});
        if (data.admin?.name) {
          document.title = `Zone Assessment — taken by ${data.admin.name}`;
        }
      })
      .catch((err) => setState({ loading: false, error: err.response?.data?.message || "Unable to load form", data: null }));
  }, [token]);

  const { totalQuestions, answeredCount } = useMemo(() => {
    const sections = state.data?.questionSections || [];
    const total = sections.reduce((sum, s) => sum + s.questions.length, 0);
    const answered = sections.reduce(
      (sum, s) => sum + s.questions.filter((q) => (answers[q.id] || "").trim().length > 0).length,
      0
    );
    return { totalQuestions: total, answeredCount: answered };
  }, [state.data, answers]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post(`/public/form/${token}`, { answers });
      setJustSaved({ submittedAt: data.submittedAt, isComplete: data.isComplete, message: data.message });
      setState((prev) => ({ ...prev, data: { ...prev.data, hasResponded: data.isComplete, respondedAt: data.isComplete ? data.submittedAt : prev.data.respondedAt } }));
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => setJustSaved(null), 5000);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save response");
    } finally {
      setSubmitting(false);
    }
  };

  if (state.loading) {
    return (
      <div className="public-wrap">
        <div className="container" style={{ maxWidth: 560, textAlign: "center" }}>
          <p className="muted">Loading your assessment...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="public-wrap">
        <div className="container" style={{ maxWidth: 480 }}>
          <div className="card gateway-card" style={{ textAlign: "center" }}>
            <div className="gateway-icon-badge" style={{ background: "linear-gradient(135deg,#dc2626,#991b1b)" }}>
              <span style={{ color: "white", fontSize: 24, fontWeight: 700 }}>!</span>
            </div>
            <h2 style={{ marginBottom: 8 }}>Can't open this form</h2>
            <p className="muted">{state.error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { club, contact, admin, hasResponded, respondedAt, questionSections } = state.data;
  const progressPct = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <div className="public-wrap">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="public-header">
          <span className="eyebrow">Zone Assessment</span>
          {club ? (
            <>
              {club.logoUrl && <img src={club.logoUrl} alt={club.name} />}
              <h1>{club.name}</h1>
              <p className="muted" style={{ marginTop: 2 }}>Guiding Question Response</p>
            </>
          ) : (
            <>
              <h1>{contact.position}</h1>
              <p className="muted" style={{ marginTop: 2 }}>Guiding Question Response</p>
            </>
          )}
          {admin?.name && (
            <p className="muted" style={{ marginTop: 2, fontSize: "0.85rem" }}>
              Taken by {admin.name}{admin.title ? `, ${admin.title}` : ""}
            </p>
          )}
          <div className="respondent-chip">
            {contact.photoUrl ? (
              <img className="respondent-photo" src={contact.photoUrl} alt={contact.name} />
            ) : (
              <span className="pos-dot" />
            )}
            <strong>{contact.name}</strong>
            <span className="muted">· {contact.position}</span>
          </div>
        </div>

        {justSaved && (
          <div className={`alert ${justSaved.isComplete ? "success" : "error"}`} style={{ textAlign: "center" }}>
            {justSaved.isComplete
              ? `Saved! All questions answered — your response is complete${justSaved.submittedAt ? ` as of ${new Date(justSaved.submittedAt).toLocaleString()}` : ""}.`
              : justSaved.message || "Your answers were saved, but some questions are still unanswered."}
            {" "}You can keep editing below any time.
          </div>
        )}

        {!justSaved && hasResponded && (
          <div className="alert success" style={{ textAlign: "center" }}>
            You already submitted a response{respondedAt ? ` on ${new Date(respondedAt).toLocaleString()}` : ""}.
            Feel free to update any answer below and submit again.
          </div>
        )}

        <div className="assessment-progress">
          <span className="progress-label">{answeredCount}/{totalQuestions} answered</span>
          <div className="progress-bar">
            <div style={{ width: `${progressPct}%`, transition: "width 0.2s ease" }} />
          </div>
          <span className="progress-label">{progressPct}%</span>
        </div>

        <form onSubmit={submit}>
          {questionSections.map((section) => {
            const sectionAnswered = section.questions.filter((q) => (answers[q.id] || "").trim().length > 0).length;
            return (
              <div className="question-section card" key={section.category}>
                <div className="section-head">
                  <div className="section-icon">{SECTION_ICONS[section.category] || section.category[0]}</div>
                  <div>
                    <h3>{section.category}</h3>
                    {section.description && <p className="section-desc">{section.description}</p>}
                  </div>
                  <span className="section-count">{sectionAnswered}/{section.questions.length}</span>
                </div>
                {section.questions.map((q) => {
                  const isAnswered = (answers[q.id] || "").trim().length > 0;
                  return (
                    <div className="question-block" key={q.id}>
                      <label>
                        {q.text}
                        {isAnswered && <span className="answered-dot" title="Answered" />}
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Type your answer here..."
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}

          <div className="submit-bar">
            <span className="submit-hint">
              {hasResponded
                ? "You can update and re-submit your answers as many times as you need."
                : answeredCount === totalQuestions
                ? "All questions answered — ready to submit."
                : `${totalQuestions - answeredCount} question${totalQuestions - answeredCount === 1 ? "" : "s"} left. You can still submit partial answers.`}
            </span>
            <button className="btn gold" disabled={submitting}>
              {submitting ? "Saving..." : hasResponded ? "Save Changes" : "Submit Response"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
