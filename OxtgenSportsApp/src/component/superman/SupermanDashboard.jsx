// src/component/superman/SupermanDashboard.jsx
import { useState, useEffect } from "react";
import "./SupermanDashboard.css";

const API = "http://127.0.0.1:5000/api";

export default function SupermanDashboard({ user, onLogout, onBack }) {
  const [analytics, setAnalytics] = useState(null);
  const [history,   setHistory]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState("overview");

  useEffect(() => {
    Promise.all([
      fetch(`${API}/analytics`).then(r => r.json()),
      fetch(`${API}/history?limit=100`).then(r => r.json()),
    ]).then(([a, h]) => {
      if (a.success) setAnalytics(a.analytics);
      if (h.success) setHistory(h.history);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="superman-page">
      {/* Header */}
      <div className="superman-header">
        <div className="superman-header__left">
          <span className="superman-logo">
            <i className="ti ti-shield-star" />
          </span>
          <div>
            <h1 className="superman-title">Admin Dashboard</h1>
            <p className="superman-sub">Admin access · {user.email}</p>
          </div>
        </div>
        <div className="superman-header__right">
          <button type="button" className="superman-btn superman-btn--ghost" onClick={onBack}>
            <i className="ti ti-layout-dashboard" /> App
          </button>
          <button type="button" className="superman-btn superman-btn--danger" onClick={onLogout}>
            <i className="ti ti-logout" /> Logout
          </button>
        </div>
      </div>

      {/* Role badge */}
      <div className="superman-role-bar">
        <span className="role-badge role-badge--admin"><i className="ti ti-crown" /> Admin Access</span>
        <span className="role-badge role-badge--player"><i className="ti ti-user" /> Player Access</span>
        <span style={{marginLeft:"auto",fontSize:13,color:"#8A94A8"}}>Logged in as: <b style={{color:"#F0F4FF"}}>{user.name}</b></span>
      </div>

      {/* Tabs */}
      <div className="superman-tabs">
        {[
          {id:"overview", label:"Overview",    icon:"ti-chart-bar"},
          {id:"users",    label:"All Users",   icon:"ti-users"},
          {id:"history",  label:"All History", icon:"ti-history"},
        ].map(t => (
          <button type="button" key={t.id} className={`superman-tab ${tab===t.id?"superman-tab--active":""}`} onClick={()=>setTab(t.id)}>
            <i className={`ti ${t.icon}`} /> {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="superman-loading">
          <i className="ti ti-loader-2 spin" /> Loading data...
        </div>
      )}

      {/* Overview Tab */}
      {!loading && tab === "overview" && analytics && (
        <div>
          <div className="superman-stats">
            {[
              {icon:"ti-sparkles",   label:"Total Generations", val:analytics.total_generations, color:"#00E5A0"},
              {icon:"ti-star",       label:"Total Feedback",    val:analytics.total_feedback,    color:"#FF9F43"},
              {icon:"ti-chart-line", label:"Avg Rating",        val:analytics.average_rating ? `${analytics.average_rating}/5` : "—", color:"#4F8EF7"},
              {icon:"ti-ball-football", label:"Sports Used",    val:analytics.by_sport?.length||0, color:"#A78BFA"},
            ].map(s => (
              <div key={s.label} className="superman-stat">
                <span className="superman-stat__icon" style={{background:s.color+"18"}}>
                  <i className={`ti ${s.icon}`} style={{color:s.color}} />
                </span>
                <div>
                  <p className="superman-stat__val">{s.val}</p>
                  <p className="superman-stat__label">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* By Sport */}
          <div className="superman-card">
            <h3 className="superman-card__title"><i className="ti ti-ball-football" /> Generations by Sport</h3>
            {analytics.by_sport?.map((s,i) => {
              const max = Math.max(...analytics.by_sport.map(x=>x.count));
              return (
                <div key={i} className="superman-bar-row">
                  <span className="superman-bar-label">{s.sport}</span>
                  <div className="superman-bar-track">
                    <div className="superman-bar-fill" style={{width:`${(s.count/max)*100}%`}} />
                  </div>
                  <span className="superman-bar-count">{s.count}</span>
                </div>
              );
            })}
          </div>

          {/* Rating distribution */}
          <div className="superman-card">
            <h3 className="superman-card__title"><i className="ti ti-star" /> Rating Distribution</h3>
            {[5,4,3,2,1].map(star => {
              const count = analytics.rating_distribution?.[String(star)] || 0;
              const total = Object.values(analytics.rating_distribution||{}).reduce((a,b)=>a+b,0);
              const pct   = total ? Math.round((count/total)*100) : 0;
              return (
                <div key={star} className="superman-bar-row">
                  <span className="superman-bar-label" style={{color:"#FF9F43"}}>{"★".repeat(star)}</span>
                  <div className="superman-bar-track">
                    <div className="superman-bar-fill superman-bar-fill--orange" style={{width:`${pct}%`}} />
                  </div>
                  <span className="superman-bar-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {!loading && tab === "users" && (
        <div className="superman-card">
          <h3 className="superman-card__title"><i className="ti ti-users" /> All Users (Firebase)</h3>
          <p className="superman-note">
            <i className="ti ti-info-circle" /> To see all users go to:
            <a href="https://console.firebase.google.com/project/gen-lang-client-0857236304/authentication/users"
               target="_blank" rel="noreferrer" className="superman-link">
              Firebase Console → Authentication → Users
            </a>
          </p>

          <div className="superman-roles-info">
            <h4>Current Role Assignments:</h4>
            <table className="superman-table">
              <thead><tr><th>Role</th><th>Access Level</th><th>Features</th></tr></thead>
              <tbody>
                <tr>
                  <td><span className="role-badge role-badge--admin">Admin</span></td>
                  <td>Analytics access</td>
                  <td>Match Prep + Analytics Dashboard</td>
                </tr>
                <tr>
                  <td><span className="role-badge role-badge--player">Player</span></td>
                  <td>Basic access</td>
                  <td>Match Preparation only</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History Tab */}
      {!loading && tab === "history" && (
        <div className="superman-card">
          <h3 className="superman-card__title"><i className="ti ti-history" /> All Generations ({history.length})</h3>
          <div style={{overflowX:"auto"}}>
            <table className="superman-table">
              <thead>
                <tr><th>#</th><th>Player</th><th>User</th><th>Sport</th><th>Format</th><th>Level</th><th>AI</th><th>Rating</th><th>Date</th></tr>
              </thead>
              <tbody>
                {history.map(g => (
                  <tr key={g.id}>
                    <td>{g.id}</td>
                    <td>{g.player}</td>
                    <td style={{color:"#8A94A8"}}>{g.user_email || "Unknown"}</td>
                    <td><span className="role-badge role-badge--player" style={{fontSize:10}}>{g.sport}</span></td>
                    <td>{g.format}</td>
                    <td>{g.level}</td>
                    <td><span style={{color:"#00E5A0",fontSize:11}}>{g.ai_provider}</span></td>
                    <td>{g.rating ? <span style={{color:"#FF9F43"}}>{"★".repeat(g.rating)}</span> : <span style={{color:"#3A4558"}}>—</span>}</td>
                    <td>{new Date(g.created_at).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
                {history.length === 0 && <tr><td colSpan="8" style={{textAlign:"center",color:"#3A4558",padding:"2rem"}}>No generations yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
