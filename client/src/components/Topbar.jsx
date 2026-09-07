import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Topbar() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isSuperAdmin = admin?.role === "superadmin";

  const doLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="topbar">
      <div className="topbar-row">
        <div className="brand">
          <span className="dot" />
          Zone Assessment System
        </div>
        <button
          className="nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      <nav className={open ? "open" : ""}>
        {isSuperAdmin ? (
          <Link to="/super-admin" onClick={() => setOpen(false)}>Zonal Heads</Link>
        ) : (
          <>
            <Link to="/dashboard" onClick={() => setOpen(false)}>Clubs</Link>
            <Link to="/zone-leadership" onClick={() => setOpen(false)}>Zone Leadership</Link>
            <Link to="/questions" onClick={() => setOpen(false)}>Questions</Link>
            <Link to="/analytics" onClick={() => setOpen(false)}>Analytics</Link>
          </>
        )}
        <span className="topbar-who">
          {admin?.name} · {admin?.title}
        </span>
        <button className="logout" onClick={doLogout}>
          Logout
        </button>
      </nav>
    </div>
  );
}
