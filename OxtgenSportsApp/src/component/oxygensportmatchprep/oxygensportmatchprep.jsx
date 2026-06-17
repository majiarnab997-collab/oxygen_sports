import { useState, useRef, useEffect } from 'react';
import './oxygensportmatchprep.css';

/* ─── Constants ─────────────────────────────────────────── */

const SPORT_OPTIONS = [
  "Cricket", "Football", "Badminton", "Tennis", "Basketball",
  "Swimming", "Athletics", "Boxing", "Volleyball", "Hockey",
];

const FORMAT_OPTIONS = {
  Cricket:    ["Test Match", "ODI", "T20", "T10", "Club Match"],
  Football:   ["League Match", "Cup Match", "Friendly", "Tournament Final"],
  Badminton:  ["Singles", "Doubles", "Mixed Doubles", "Tournament"],
  Tennis:     ["Singles", "Doubles", "Grand Slam", "Club Match"],
  Basketball: ["Full Game", "3x3", "Tournament", "Scrimmage"],
  Swimming:   ["Sprint", "Distance", "Relay", "Open Water"],
  Athletics:  ["Sprint", "Middle Distance", "Long Distance", "Field Event"],
  Boxing:     ["Amateur Bout", "Professional Fight", "Sparring", "Tournament"],
  Volleyball: ["Indoor", "Beach", "Tournament", "Club Match"],
  Hockey:     ["Field Hockey", "Ice Hockey", "Tournament", "League Match"],
};

const LEVEL_OPTIONS = [
  "Beginner", "Intermediate", "Club Level",
  "State Level", "National Level", "Professional",
];

const DUMMY_CHECKLIST = {
  equipment: [
    { item: "Inspect primary equipment for damage or wear", done: false },
    { item: "Check grip/handle condition and replace if needed", done: false },
    { item: "Verify footwear is match-appropriate and well-fitted", done: false },
    { item: "Pack backup equipment and spare parts", done: false },
    { item: "Confirm uniform is clean and regulation-compliant", done: false },
  ],
  warmup: [
    { item: "10-min dynamic stretching routine", done: false },
    { item: "Sport-specific movement drills (15 min)", done: false },
    { item: "Progressive intensity activation — light to moderate", done: false },
    { item: "Skill-specific warm-up with partner or solo", done: false },
    { item: "Cool-down from warm-up 20 min before match", done: false },
  ],
  nutrition: [
    { item: "Pre-match meal 3–4 hrs before (carb-rich, low fat)", done: false },
    { item: "Hydrate with 500ml water 2 hrs before match", done: false },
    { item: "Light snack 60 min before (banana, energy bar)", done: false },
    { item: "Pack electrolyte drinks and snacks for breaks", done: false },
    { item: "Avoid new or unfamiliar foods on match day", done: false },
  ],
  mental: [
    { item: "Review match game plan and opposition analysis", done: false },
    { item: "10-min visualisation — perfect execution moments", done: false },
    { item: "Breathing exercises to manage pre-match nerves", done: false },
    { item: "Positive self-talk affirmations", done: false },
    { item: "Disconnect from social media 2 hrs before", done: false },
  ],
};

const CATEGORY_META = {
  equipment: { icon: "ti-tool",  label: "Equipment",       color: "#0F6E56" },
  warmup:    { icon: "ti-run",   label: "Warm-Up",         color: "#185FA5" },
  nutrition: { icon: "ti-apple", label: "Nutrition",        color: "#BA7517" },
  mental:    { icon: "ti-brain", label: "Mental Readiness", color: "#533AB7" },
};

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
const CATEGORIES    = ["equipment", "warmup", "nutrition", "mental"];

/* ─── StarRating Component ───────────────────────────────── */

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`star-rating__star ${s <= (hover || value) ? "star-rating__star--active" : ""}`}
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
        >
          ★
        </span>
      ))}
    </div>
  );
}

/* ─── ChecklistCategory Component ───────────────────────── */

function ChecklistCategory({ catKey, items, onChange }) {
  const meta = CATEGORY_META[catKey];
  const done = items.filter((i) => i.done).length;
  const pct  = Math.round((done / items.length) * 100);

  return (
    <div className="cat-card">
      <div className="cat-card__header">
        <div className="cat-card__title-group">
          <span
            className="cat-card__icon-wrap"
            style={{ background: meta.color + "18" }}
          >
            <i className={`ti ${meta.icon}`} style={{ color: meta.color }} aria-hidden="true" />
          </span>
          <span className="cat-card__label">{meta.label}</span>
        </div>
        <span className="cat-card__count">{done}/{items.length}</span>
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, background: meta.color }}
        />
      </div>

      {items.map((item, idx) => (
        <label key={idx} className="checklist-item">
          <input
            type="checkbox"
            checked={item.done}
            onChange={() => onChange(catKey, idx)}
            style={{ accentColor: meta.color }}
          />
          <span className={`checklist-item__text ${item.done ? "checklist-item__text--done" : ""}`}>
            {item.item}
          </span>
        </label>
      ))}
    </div>
  );
}

/* ─── HistoryCard Component ──────────────────────────────── */

function HistoryCard({ entry, onRestore }) {
  return (
    <div className="history-card">
      <div className="history-card__body">
        <div className="history-card__badges">
          <span className="badge badge--sport">{entry.sport}</span>
          <span className="badge badge--format">{entry.format}</span>
        </div>
        <p className="history-card__meta">
          {entry.player} · {entry.level} · {entry.time}
        </p>
        {entry.rating > 0 && (
          <p className="history-card__stars">
            {"★".repeat(entry.rating)}{"☆".repeat(5 - entry.rating)}
          </p>
        )}
      </div>
      <button className="btn-restore" onClick={() => onRestore(entry)}>
        <i className="ti ti-refresh" aria-hidden="true" />
        Restore
      </button>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */

const MatchPreparation = () => {
  const [tab,          setTab]          = useState("generate");
  const [form,         setForm]         = useState({ player: "", sport: "Cricket", format: "T20", level: "Club Level", notes: "" });
  const [loading,      setLoading]      = useState(false);
  const [checklist,    setChecklist]    = useState(null);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [rating,       setRating]       = useState(0);
  const [history,      setHistory]      = useState([]);
  const [copied,       setCopied]       = useState(false);
  const outputRef = useRef(null);

  const formats = FORMAT_OPTIONS[form.sport] || [];

  useEffect(() => {
    const defaultFormat = FORMAT_OPTIONS[form.sport]?.[0] || "";
    setForm((f) => ({ ...f, format: defaultFormat }));
  }, [form.sport]);

  function handleChange(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  /* ── FIX: correct body sent to Flask, correct response parsed ── */
  async function handleGenerate() {
    if (!form.player.trim()) return;
    setLoading(true);
    setChecklist(null);
    setRating(0);

    try {
      const res = await fetch("http://127.0.0.1:5000/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player: form.player,
          sport:  form.sport,
          format: form.format,
          level:  form.level,
          notes:  form.notes,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Generation failed");
      }

      /* Flask returns: { success: true, checklist: { equipment:[...], ... } } */
      const parsed = data.checklist;

      const built = {};
      for (const cat of CATEGORIES) {
        built[cat] = (parsed[cat] || []).map((item) => ({ item, done: false }));
      }

      setChecklist(built);
      setCurrentEntry({
        ...form,
        generation_id: data.generation_id,
        time: new Date().toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }),
      });
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    } catch {
      /* Fallback to dummy data if backend is unreachable */
      const built = {};
      for (const cat of CATEGORIES) {
        built[cat] = DUMMY_CHECKLIST[cat].map((i) => ({ ...i }));
      }
      setChecklist(built);
      setCurrentEntry({
        ...form,
        generation_id: null,
        time: new Date().toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }),
      });
    }

    setLoading(false);
  }

  function handleCheckToggle(cat, idx) {
    setChecklist((prev) => {
      const updated = { ...prev };
      updated[cat]  = updated[cat].map((item, i) =>
        i === idx ? { ...item, done: !item.done } : item
      );
      return updated;
    });
  }

  /* ── Save rating to Flask backend + local history ── */
  async function handleSaveToHistory() {
    if (!currentEntry) return;

    /* Send rating to Flask if we have a generation_id */
    if (currentEntry.generation_id && rating > 0) {
      try {
        await fetch("http://127.0.0.1:5000/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            generation_id: currentEntry.generation_id,
            rating:        rating,
          }),
        });
      } catch {
        /* silent fail — still save locally */
      }
    }

    setHistory((h) => [{ ...currentEntry, rating, checklist, id: Date.now() }, ...h]);
  }

  function handleRestore(entry) {
    setForm({
      player: entry.player,
      sport:  entry.sport,
      format: entry.format,
      level:  entry.level,
      notes:  entry.notes || "",
    });
    setChecklist(entry.checklist);
    setRating(entry.rating);
    setCurrentEntry(entry);
    setTab("generate");
    setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
  }

  function handleCopy() {
    if (!checklist) return;
    const lines = [
      `PRE-MATCH PREPARATION — ${currentEntry?.player || "Player"}`,
      `${currentEntry?.sport} · ${currentEntry?.format} · ${currentEntry?.level}\n`,
    ];
    for (const cat of CATEGORIES) {
      lines.push(`\n${CATEGORY_META[cat].label.toUpperCase()}`);
      checklist[cat].forEach((i, n) => lines.push(`${n + 1}. ${i.item}`));
    }
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleExport() {
    if (!checklist) return;
    const lines = [
      "PRE-MATCH PREPARATION CHECKLIST",
      "Generated by Oxygen Sports\n",
      `Player: ${currentEntry?.player}`,
      `Sport: ${currentEntry?.sport} · ${currentEntry?.format}`,
      `Level: ${currentEntry?.level}`,
      `Date: ${currentEntry?.time}\n`,
    ];
    for (const cat of CATEGORIES) {
      lines.push(`\n${CATEGORY_META[cat].label}`);
      lines.push("─".repeat(30));
      checklist[cat].forEach((i, n) =>
        lines.push(`${n + 1}. [${i.done ? "✓" : " "}] ${i.item}`)
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${currentEntry?.player || "player"}_checklist.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalDone  = checklist ? Object.values(checklist).flat().filter((i) => i.done).length : 0;
  const totalItems = checklist ? Object.values(checklist).flat().length : 0;
  const overallPct = totalItems ? Math.round((totalDone / totalItems) * 100) : 0;

  return (
    <div className="app-wrapper">
      <h2 className="sr-only">AI Match Preparation Checklist Generator for Oxygen Sports</h2>

      {/* Header */}
      <div className="header">
        <div className="header__inner">
          <span className="header__logo">
            <i className="ti ti-trophy" aria-hidden="true" />
          </span>
          <div>
            <h1 className="header__title">Match Preparation Checklist</h1>
            <p className="header__subtitle">Oxygen Sports · AI-powered</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          { id: "generate", label: "Generate",                    icon: "ti-sparkles" },
          { id: "history",  label: `History (${history.length})`, icon: "ti-history"  },
        ].map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? "tab-btn--active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <i className={`ti ${t.icon}`} aria-hidden="true" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Generate Tab ── */}
      {tab === "generate" && (
        <>
          <div className="card form-card">
            <p className="form-section-label">Player details</p>

            <div className="form-grid">
              <div className="form-field">
                <label>Player name *</label>
                <input
                  type="text"
                  placeholder="e.g. Arjun Sharma"
                  value={form.player}
                  onChange={(e) => handleChange("player", e.target.value)}
                />
              </div>
              <div className="form-field">
                <label>Competition level</label>
                <select value={form.level} onChange={(e) => handleChange("level", e.target.value)}>
                  {LEVEL_OPTIONS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>Sport</label>
                <select value={form.sport} onChange={(e) => handleChange("sport", e.target.value)}>
                  {SPORT_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Match format</label>
                <select value={form.format} onChange={(e) => handleChange("format", e.target.value)}>
                  {formats.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>

            <div className="form-field form-notes">
              <label>Additional notes (optional)</label>
              <textarea
                placeholder="e.g. recovering from mild ankle strain, playing in humid conditions..."
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={2}
              />
            </div>

            <button
              className="btn-generate"
              onClick={handleGenerate}
              disabled={loading || !form.player.trim()}
            >
              {loading ? (
                <><i className="ti ti-loader-2" aria-hidden="true" /> Generating checklist...</>
              ) : (
                <><i className="ti ti-sparkles" aria-hidden="true" /> Generate AI Checklist</>
              )}
            </button>
          </div>

          {/* AI Output */}
          {checklist && (
            <div ref={outputRef}>
              <div className="summary-bar">
                <div>
                  <p className="summary-bar__title">{currentEntry?.player}'s checklist</p>
                  <p className="summary-bar__meta">
                    {currentEntry?.sport} · {currentEntry?.format} · {currentEntry?.level}
                  </p>
                </div>
                <span className={`summary-badge ${overallPct === 100 ? "summary-badge--complete" : ""}`}>
                  {totalDone}/{totalItems} done
                </span>
              </div>

              {CATEGORIES.map((cat) => (
                <ChecklistCategory
                  key={cat}
                  catKey={cat}
                  items={checklist[cat]}
                  onChange={handleCheckToggle}
                />
              ))}

              <div className="card rating-card">
                <p className="rating-card__title">Rate this checklist</p>
                <div className="rating-card__row">
                  <StarRating value={rating} onChange={setRating} />
                  {rating > 0 && (
                    <span className="rating-card__label">{RATING_LABELS[rating]}</span>
                  )}
                </div>
              </div>

              <div className="action-row">
                <button className="btn-action" onClick={handleGenerate}>
                  <i className="ti ti-refresh" aria-hidden="true" /> Regenerate
                </button>
                <button
                  className={`btn-action ${copied ? "btn-action--copied" : ""}`}
                  onClick={handleCopy}
                >
                  <i className={`ti ${copied ? "ti-check" : "ti-copy"}`} aria-hidden="true" />
                  {copied ? "Copied!" : "Copy text"}
                </button>
                <button className="btn-action" onClick={handleExport}>
                  <i className="ti ti-download" aria-hidden="true" /> Export .txt
                </button>
                <button className="btn-action btn-action--primary" onClick={handleSaveToHistory}>
                  <i className="ti ti-bookmark" aria-hidden="true" /> Save to history
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── History Tab ── */}
      {tab === "history" && (
        <div>
          {history.length === 0 ? (
            <div className="empty-state">
              <i className="ti ti-history" aria-hidden="true" />
              <p>No saved checklists yet. Generate and save one to see it here.</p>
            </div>
          ) : (
            <div className="history-list">
              {history.map((entry) => (
                <HistoryCard key={entry.id} entry={entry} onRestore={handleRestore} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MatchPreparation;