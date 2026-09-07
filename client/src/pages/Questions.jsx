import React, { useEffect, useState } from "react";
import api from "../api/axios";
import Topbar from "../components/Topbar.jsx";

const TABS = [
  { id: "club", label: "Club President" },
  { id: "zoneChair", label: "Immediate Past Zone Chairperson" },
  { id: "dge", label: "1st Vice District Governor / DGE" },
];

export default function Questions() {
  const [type, setType] = useState("club");
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editQuestion, setEditQuestion] = useState(null); // { id?, type, category, categoryDescription, text }
  const [addingCategory, setAddingCategory] = useState(false);

  const load = async (t) => {
    setLoading(true);
    const { data } = await api.get("/questions", { params: { type: t } });
    setSections(data.sections || []);
    setLoading(false);
  };

  useEffect(() => {
    load(type);
  }, [type]);

  const deleteQuestion = async (id) => {
    if (!window.confirm("Delete this question? This won't affect answers already submitted.")) return;
    await api.delete(`/questions/${id}`);
    load(type);
  };

  return (
    <div>
      <Topbar />
      <div className="container">
        <div className="toolbar">
          <div>
            <h1>Assessment Questions</h1>
            <p className="muted">
              Edit the guiding questions used for each type of assessment. Changes only apply to future
              responses — anything already submitted keeps the wording it was answered with.
            </p>
          </div>
        </div>

        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.id} className={type === t.id ? "active" : ""} onClick={() => setType(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="muted">Loading...</p>
        ) : (
          <>
            {sections.map((section) => (
              <div className="card" key={section.category} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <h3 style={{ marginBottom: 2 }}>{section.category}</h3>
                    {section.description && <p className="muted" style={{ margin: 0 }}>{section.description}</p>}
                  </div>
                  <button
                    className="btn small secondary"
                    onClick={() =>
                      setEditQuestion({
                        type,
                        category: section.category,
                        categoryDescription: section.description || "",
                        text: "",
                      })
                    }
                  >
                    + Add Question
                  </button>
                </div>

                <div style={{ marginTop: 12 }}>
                  {section.questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="question-row"
                    >
                      <span className="question-row-text">{idx + 1}. {q.text}</span>
                      <div className="question-row-actions">
                        <button
                          className="btn small secondary"
                          onClick={() =>
                            setEditQuestion({
                              id: q.id,
                              type,
                              category: section.category,
                              categoryDescription: section.description || "",
                              text: q.text,
                            })
                          }
                        >
                          Edit
                        </button>
                        <button className="btn small danger" onClick={() => deleteQuestion(q.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {section.questions.length === 0 && <p className="muted">No questions in this category yet.</p>}
                </div>
              </div>
            ))}

            <button className="btn secondary" onClick={() => setAddingCategory(true)}>
              + Add New Category
            </button>
          </>
        )}
      </div>

      {editQuestion && (
        <QuestionModal
          question={editQuestion}
          onClose={() => setEditQuestion(null)}
          onSaved={() => {
            setEditQuestion(null);
            load(type);
          }}
        />
      )}

      {addingCategory && (
        <QuestionModal
          question={{ type, category: "", categoryDescription: "", text: "" }}
          newCategory
          onClose={() => setAddingCategory(false)}
          onSaved={() => {
            setAddingCategory(false);
            load(type);
          }}
        />
      )}
    </div>
  );
}

function QuestionModal({ question, newCategory, onClose, onSaved }) {
  const isNew = !question.id;
  const [category, setCategory] = useState(question.category || "");
  const [categoryDescription, setCategoryDescription] = useState(question.categoryDescription || "");
  const [text, setText] = useState(question.text || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (isNew) {
        await api.post("/questions", {
          type: question.type,
          category,
          categoryDescription,
          text,
        });
      } else {
        await api.put(`/questions/${question.id}`, { category, categoryDescription, text });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{isNew ? (newCategory ? "Add Category & Question" : "Add Question") : "Edit Question"}</h2>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Category</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Category Description (optional)</label>
            <input value={categoryDescription} onChange={(e) => setCategoryDescription(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Question Text</label>
            <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} required />
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
