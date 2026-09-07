import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ClubDetail from "./pages/ClubDetail.jsx";
import ZoneLeadership from "./pages/ZoneLeadership.jsx";
import Analytics from "./pages/Analytics.jsx";
import ResponseDetail from "./pages/ResponseDetail.jsx";
import PublicForm from "./pages/PublicForm.jsx";
import AssessmentAccess from "./pages/AssessmentAccess.jsx";
import Questions from "./pages/Questions.jsx";
import SuperAdmin from "./pages/SuperAdmin.jsx";

const homeFor = (admin) => (admin?.role === "superadmin" ? "/super-admin" : "/dashboard");

// `roles`, when given, restricts the route to admins with one of those
// roles — anyone else logged in gets bounced to their own home page instead
// of just being kicked to /login.
function Protected({ children, roles }) {
  const { admin } = useAuth();
  if (!admin) return <Navigate to="/login" replace />;
  const role = admin.role || "zonalhead";
  if (roles && !roles.includes(role)) {
    return <Navigate to={homeFor(admin)} replace />;
  }
  return children;
}

export default function App() {
  const { admin } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/respond/:token" element={<PublicForm />} />
      <Route path="/assessment/:zoneSlug" element={<AssessmentAccess />} />
      <Route
        path="/assessment"
        element={
          <div className="public-wrap">
            <div className="container" style={{ maxWidth: 520, textAlign: "center" }}>
              <p className="muted">
                This link is missing your zone. Please use the specific assessment link your zonal head shared
                with you.
              </p>
            </div>
          </div>
        }
      />

      <Route
        path="/dashboard"
        element={
          <Protected roles={["zonalhead"]}>
            <Dashboard />
          </Protected>
        }
      />
      <Route
        path="/clubs/:id"
        element={
          <Protected roles={["zonalhead"]}>
            <ClubDetail />
          </Protected>
        }
      />
      <Route
        path="/zone-leadership"
        element={
          <Protected roles={["zonalhead"]}>
            <ZoneLeadership />
          </Protected>
        }
      />
      <Route
        path="/questions"
        element={
          <Protected roles={["zonalhead"]}>
            <Questions />
          </Protected>
        }
      />
      <Route
        path="/analytics"
        element={
          <Protected roles={["zonalhead"]}>
            <Analytics />
          </Protected>
        }
      />
      <Route
        path="/responses/:id"
        element={
          <Protected roles={["zonalhead"]}>
            <ResponseDetail />
          </Protected>
        }
      />

      <Route
        path="/super-admin"
        element={
          <Protected roles={["superadmin"]}>
            <SuperAdmin />
          </Protected>
        }
      />

      <Route path="/" element={<Navigate to={admin ? homeFor(admin) : "/login"} replace />} />
      <Route path="*" element={<Navigate to={admin ? homeFor(admin) : "/login"} replace />} />
    </Routes>
  );
}
