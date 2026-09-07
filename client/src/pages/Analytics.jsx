import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line,
} from "recharts";
import api from "../api/axios";
import Topbar from "../components/Topbar.jsx";

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/analytics/overview").then(({ data }) => setData(data));
  }, []);

  if (!data) {
    return (
      <div>
        <Topbar />
        <div className="container">Loading...</div>
      </div>
    );
  }

  const { totals, perClub, timeline, recentResponses } = data;

  return (
    <div>
      <Topbar />
      <div className="container">
        <h1>Zone Analytics</h1>
        <p className="muted">Response tracking and form completion across all clubs.</p>

        <div className="grid grid-4" style={{ margin: "20px 0" }}>
          <div className="card stat"><div className="num">{totals.totalClubs}</div><div className="label">Clubs</div></div>
          <div className="card stat"><div className="num">{totals.requiredResponses}</div><div className="label">Responses Required</div></div>
          <div className="card stat"><div className="num">{totals.completedResponses}</div><div className="label">Completed</div></div>
          <div className="card stat"><div className="num">{totals.overallCompletionRate}%</div><div className="label">Completion Rate</div></div>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Completion Rate by Club</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={perClub.map((c) => ({ name: c.clubName.replace("Lions Club of Kathmandu ", ""), rate: c.completionRate }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis unit="%" />
              <Tooltip />
              <Bar dataKey="rate" fill="#00338d" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {timeline.length > 0 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3>Submissions Over Time</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#f0b323" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <h2>Per-Club Breakdown</h2>
        <div className="grid grid-2" style={{ marginBottom: 24 }}>
          {perClub.map((c) => (
            <div className="card" key={c.clubId}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>{c.clubName}</strong>
                <Link to={`/clubs/${c.clubId}`}>Open →</Link>
              </div>
              <div className="muted" style={{ margin: "6px 0 10px" }}>
                {c.completedResponses} / {c.requiredResponses} required responses submitted
              </div>
              <div className="progress-bar"><div style={{ width: `${c.completionRate}%` }} /></div>
              <table style={{ marginTop: 12 }}>
                <tbody>
                  {c.positions.map((p) => (
                    <tr key={p.position}>
                      <td>{p.position}</td>
                      <td>{p.name}</td>
                      <td>
                        {!p.requiresResponse ? (
                          <span className="badge na">N/A</span>
                        ) : p.hasResponded ? (
                          <span className="badge success">Responded {new Date(p.respondedAt).toLocaleDateString()}</span>
                        ) : (
                          <span className="badge pending">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <h2>Recent Submissions</h2>
        <div className="card">
          {recentResponses.length === 0 ? (
            <p className="muted">No submissions yet.</p>
          ) : (
            <table>
              <thead>
                <tr><th>Respondent</th><th>Position</th><th>Submitted</th><th></th></tr>
              </thead>
              <tbody>
                {recentResponses.map((r) => (
                  <tr key={r.id}>
                    <td>{r.respondentName}</td>
                    <td>{r.position}</td>
                    <td>{new Date(r.submittedAt).toLocaleString()}</td>
                    <td><Link to={`/responses/${r.id}`}>View →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
