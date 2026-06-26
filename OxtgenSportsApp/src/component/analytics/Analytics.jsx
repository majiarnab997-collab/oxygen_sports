import { useState, useEffect } from "react";
import "./Analytics.css";
import API from "../../config/api";

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <span className="stat-card__icon" style={{ background: color + "18" }}>
        <i className={`ti ${icon}`} style={{ color }} />
      </span>
      <div>
        <p className="stat-card__val">{value}</p>
        <p className="stat-card__label">{label}</p>
      </div>
    </div>
  );
}

function BarChart({ data, colorKey }) {
  if (!data || data.length === 0) return <p className="chart-empty">No data yet.</p>;
  const max = Math.max(...data.map((d) => d.count));
  return (
    <div className="bar-chart">
      {data.map((d, i) => (
        <div key={i} className="bar-chart__row">
          <span className="bar-chart__label">{d[colorKey]}</span>
          <div className="bar-chart__track">
            <div className="bar-chart__fill" style={{ width: `${Math.max((d.count / max) * 100, 4)}%` }} />
          </div>
          <span className="bar-chart__count">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

function RatingBar({ distribution }) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  return (
    <div className="rating-dist">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[String(star)] || 0;
        const pct   = total ? Math.round((count / total) * 100) : 0;
        return (
          <div key={star} className="rating-dist__row">
            <span className="rating-dist__star">{"★".repeat(star)}</span>
            <div className="rating-dist__track">
              <div className="rating-dist__fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="rating-dist__count">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Analytics({ onBack }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    fetch(`${API}/analytics`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.analytics); else setError("Failed to load analytics."); })
      .catch(() => setError("Backend not reachable."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div className="analytics-header__left">
          <button className="analytics-back" onClick={onBack}>
            <i className="ti ti-arrow-left" /> Back
          </button>
          <div>
            <h1 className="analytics-title">Analytics Dashboard</h1>
            <p className="analytics-sub">Oxygen Sports · Usage overview</p>
          </div>
        </div>
        <span className="analytics-badge">
          <i className="ti ti-chart-bar" /> Admin View
        </span>
      </div>

      {loading && <div className="analytics-loading"><i className="ti ti-loader-2 spin" /><p>Loading...</p></div>}
      {error   && <div className="analytics-error"><i className="ti ti-alert-circle" /> {error}</div>}

      {data && (
        <>
          <div className="stats-grid">
            <StatCard icon="ti-sparkles"   label="Total generations" value={data.total_generations} color="#00E5A0" />
            <StatCard icon="ti-star"       label="Feedback received" value={data.total_feedback}    color="#FF9F43" />
            <StatCard icon="ti-chart-line" label="Average rating"    value={data.average_rating ? `${data.average_rating} / 5` : "—"} color="#4F8EF7" />
            <StatCard icon="ti-trophy"     label="Sports covered"    value={data.by_sport?.length || 0} color="#A78BFA" />
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3 className="chart-card__title"><i className="ti ti-ball-football" /> By sport</h3>
              <BarChart data={data.by_sport} colorKey="sport" />
            </div>
            <div className="chart-card">
              <h3 className="chart-card__title"><i className="ti ti-trophy" /> By level</h3>
              <BarChart data={data.by_level} colorKey="level" />
            </div>
            <div className="chart-card">
              <h3 className="chart-card__title"><i className="ti ti-star" /> Rating distribution</h3>
              <RatingBar distribution={data.rating_distribution} />
            </div>
            <div className="chart-card">
              <h3 className="chart-card__title"><i className="ti ti-brain" /> AI provider</h3>
              <BarChart data={data.by_ai_provider} colorKey="provider" />
            </div>
          </div>

          <div className="recent-card">
            <h3 className="chart-card__title"><i className="ti ti-clock" /> Recent generations</h3>
            {data.recent_generations.length === 0 ? (
              <p className="chart-empty">No generations yet.</p>
            ) : (
              <table className="recent-table">
                <thead>
                  <tr><th>#</th><th>Player</th><th>Sport</th><th>Format</th><th>Level</th><th>Rating</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {data.recent_generations.map((g) => (
                    <tr key={g.id}>
                      <td>{g.id}</td>
                      <td>{g.player}</td>
                      <td><span className="table-badge">{g.sport}</span></td>
                      <td>{g.format}</td>
                      <td>{g.level}</td>
                      <td>{g.rating ? <span className="table-stars">{"★".repeat(g.rating)}</span> : <span className="table-none">—</span>}</td>
                      <td>{new Date(g.created_at).toLocaleDateString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}