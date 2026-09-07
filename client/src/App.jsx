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

function Protected({ children }) {
  const { admin } = useAuth();
  if (!admin) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/respond/:token" element={<PublicForm />} />
      <Route path="/assessment" element={<AssessmentAccess />} />

      <Route
        path="/dashboard"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      />
      <Route
        path="/clubs/:id"
        element={
          <Protected>
            <ClubDetail />
          </Protected>
        }
      />
      <Route
        path="/zone-leadership"
        element={
          <Protected>
            <ZoneLeadership />
          </Protected>
        }
      />
      <Route
        path="/analytics"
        element={
          <Protected>
            <Analytics />
          </Protected>
        }
      />
      <Route
        path="/responses/:id"
        element={
          <Protected>
            <ResponseDetail />
          </Protected>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
