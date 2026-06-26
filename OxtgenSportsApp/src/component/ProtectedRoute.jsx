// src/component/ProtectedRoute.jsx
// ─────────────────────────────────────────────
// Authorization — blocks access to protected pages
// If not logged in → redirects to Login
// ─────────────────────────────────────────────
import { useAuth } from "../context/AuthContext";
import Login from "./login/Login";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Show loading spinner while Firebase checks session
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0A0D12",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        color: "#8A94A8",
        fontFamily: "Barlow, sans-serif",
      }}>
        <i className="ti ti-loader-2" style={{ fontSize: 36, color: "#00E5A0", animation: "spin 0.8s linear infinite" }} />
        <p style={{ fontSize: 14 }}>Loading...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not logged in → show Login page (Authorization check)
  if (!user) {
    return <Login />;
  }

  // Logged in → show the protected page
  return children;
}
