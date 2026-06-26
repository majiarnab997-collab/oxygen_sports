// src/component/login/Login.jsx
import { useState } from "react";
import "./Login.css";
import { auth, googleProvider, githubProvider } from "../../firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { user } = useAuth(); // if already logged in, don't show login
  const [mode,    setMode]    = useState("login");
  const [form,    setForm]    = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [show,    setShow]    = useState(false);

  // Already logged in — don't render login form
  if (user) return null;

  function handleChange(k, v) { setForm((f) => ({ ...f, [k]: v })); setError(""); }

  function getErrorMessage(code) {
    switch (code) {
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":   return "Incorrect email or password.";
      case "auth/email-already-in-use": return "An account with this email already exists.";
      case "auth/weak-password":        return "Password must be at least 6 characters.";
      case "auth/invalid-email":        return "Please enter a valid email address.";
      case "auth/popup-closed-by-user": return "Sign-in popup was closed. Please try again.";
      case "auth/network-request-failed": return "Network error. Check your internet connection.";
      default: return "Something went wrong. Please try again.";
    }
  }

  /* ── Email/Password ── */
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.email.trim() || !form.password.trim()) { setError("Please fill in all required fields."); return; }
    if (mode === "signup" && !form.name.trim())       { setError("Please enter your name."); return; }
    if (form.password.length < 6)                     { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(cred.user, { displayName: form.name });
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password);
      }
      // AuthContext onAuthStateChanged will handle the rest
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  }

  /* ── Google ── */
  async function handleGoogle() {
    setError(""); setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  }

  /* ── GitHub ── */
  async function handleGithub() {
    setError(""); setLoading(true);
    try {
      await signInWithPopup(auth, githubProvider);
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-blob login-blob--1" />
      <div className="login-blob login-blob--2" />

      <div className="login-container">
        {/* Left panel */}
        <div className="login-left">
          <div className="login-brand">
            <span className="login-brand__logo"><i className="ti ti-trophy" /></span>
            <div>
              <h1 className="login-brand__name">Oxygen Sports</h1>
              <p className="login-brand__tag">AI-POWERED PERFORMANCE</p>
            </div>
          </div>
          <div className="login-hero">
            <h2 className="login-hero__title">
              Win starts<br />before the<br />
              <span className="login-hero__accent">first ball.</span>
            </h2>
            <p className="login-hero__sub">
              Generate AI-tailored pre-match checklists covering equipment,
              warm-up, nutrition, and mental readiness — in seconds.
            </p>
          </div>
          <div className="login-stats">
            {[{val:"10+",label:"Sports covered"},{val:"4",label:"Prep categories"},{val:"100%",label:"AI-personalised"}].map((s) => (
              <div key={s.label} className="login-stat">
                <span className="login-stat__val">{s.val}</span>
                <span className="login-stat__label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — Form */}
        <div className="login-right">
          <div className="login-card">
            <div className="login-toggle">
              <button className={`login-toggle__btn ${mode==="login"?"login-toggle__btn--active":""}`} onClick={()=>{setMode("login");setError("");}}>Sign in</button>
              <button className={`login-toggle__btn ${mode==="signup"?"login-toggle__btn--active":""}`} onClick={()=>{setMode("signup");setError("");}}>Sign up</button>
            </div>

            <h3 className="login-card__title">{mode==="login"?"Welcome back":"Create account"}</h3>
            <p className="login-card__sub">{mode==="login"?"Sign in to access your match preparation.":"Join Oxygen Sports and prepare smarter."}</p>

            <form className="login-form" onSubmit={handleSubmit}>
              {mode==="signup" && (
                <div className="login-field">
                  <label>Full name</label>
                  <div className="login-field__wrap">
                    <i className="ti ti-user login-field__icon" />
                    <input type="text" placeholder="Arnab Maji" value={form.name} onChange={(e)=>handleChange("name",e.target.value)} />
                  </div>
                </div>
              )}

              <div className="login-field">
                <label>Email address</label>
                <div className="login-field__wrap">
                  <i className="ti ti-mail login-field__icon" />
                  <input type="email" placeholder="you@example.com" value={form.email} onChange={(e)=>handleChange("email",e.target.value)} />
                </div>
              </div>

              <div className="login-field">
                <div className="login-field__row">
                  <label>Password</label>
                  {mode==="login" && (
                    <button type="button" className="login-forgot"
                      onClick={()=>setError("Please contact your admin to reset your password.")}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="login-field__wrap">
                  <i className="ti ti-lock login-field__icon" />
                  <input
                    type={show?"text":"password"}
                    placeholder={mode==="signup"?"Min. 6 characters":"Enter your password"}
                    value={form.password}
                    onChange={(e)=>handleChange("password",e.target.value)}
                  />
                  <button type="button" className="login-field__eye" onClick={()=>setShow(s=>!s)}>
                    <i className={`ti ${show?"ti-eye-off":"ti-eye"}`} />
                  </button>
                </div>
              </div>

              {error && (
                <div className="login-error">
                  <i className="ti ti-alert-circle" /> {error}
                </div>
              )}

              <button type="submit" className="login-submit" disabled={loading}>
                {loading
                  ? <><i className="ti ti-loader-2 login-spin" /> {mode==="login"?"Signing in...":"Creating account..."}</>
                  : <>{mode==="login"?"Sign in":"Create account"} <i className="ti ti-arrow-right" /></>
                }
              </button>
            </form>

            <div className="login-divider"><span /><p>or continue with</p><span /></div>

            <div className="login-social">
              <button className="login-social__btn" type="button" onClick={handleGoogle} disabled={loading}>
                <i className="ti ti-brand-google" /> Google
              </button>
              <button className="login-social__btn" type="button" onClick={handleGithub} disabled={loading}>
                <i className="ti ti-brand-github" /> GitHub
              </button>
            </div>

            <p className="login-switch">
              {mode==="login"?"Don't have an account? ":"Already have an account? "}
              <button type="button" className="login-switch__link" onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");}}>
                {mode==="login"?"Sign up":"Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
