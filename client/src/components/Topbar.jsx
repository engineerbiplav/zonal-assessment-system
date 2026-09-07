import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Topbar() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="topbar">
      <div className="brand">
        <span className="dot" />
        Zone Assessment System
      </div>
      <nav style={{ display: "flex", alignItems: "center" }}>
        <Link to="/dashboard">Clubs</Link>
        <Link to="/zone-leadership">Zone Leadership</Link>
        <Link to="/analytics">Analytics</Link>
        <span style={{ marginLeft: 18, opacity: 0.85 }}>
          {admin?.name} · {admin?.title}
        </span>
        <button
          className="logout"
          style={{ marginLeft: 14 }}
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Logout
        </button>
      </nav>
    </div>
  );
}
