import { useState, useEffect, createContext, useContext } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  sendEmailVerification,
  GoogleAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import MatchPreparation from "./component/oxygensportsmatchprep/oxygensportmatchprep";
import SupermanDashboard from "./component/superman/SupermanDashboard";
import "./App.css";

/* ─── Firebase Setup ─────────────────────────────────────── */
const firebaseConfig = {
  apiKey:            "AIzaSyBwuNYNZfWCphrOyo6mB2CUI3VECGjRKAo",
  authDomain:        "gen-lang-client-0857236304.firebaseapp.com",
  projectId:         "gen-lang-client-0857236304",
  storageBucket:     "gen-lang-client-0857236304.firebasestorage.app",
  messagingSenderId: "815973574643",
  appId:             "1:815973574643:web:043cce87091dc94c089486",
};

const firebaseApp    = initializeApp(firebaseConfig);
const auth           = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

/* ─── Admin Registration Code ────────────────────────────── */
// Change this secret code to whatever you want
const ADMIN_SECRET_CODE = "OXYGEN2024";

/* ─── Role helpers ───────────────────────────────────────── */
function getRole(email, isAdminRegistered) {
  if (!email) return "player";
  if (isAdminRegistered) return "admin";
  return "player";
}

const db = getFirestore(firebaseApp);

async function createOrUpdateUserRecord(user, role = "player") {
  if (!user?.uid) return;
  try {
    const userRef = doc(db, "users", user.uid);
    const snapshot = await getDoc(userRef);
    const payload = {
      uid: user.uid,
      name: user.displayName || user.email?.split("@")[0] || "",
      email: user.email?.toLowerCase() || "",
      photo: user.photoURL || "",
      provider: user.providerData?.[0]?.providerId || "password",
      role,
      isAdmin: role === "admin",
      updatedAt: serverTimestamp(),
    };
    if (snapshot.exists()) {
      const existing = snapshot.data();
      const finalRole = existing.role === "admin" ? "admin" : role;
      await setDoc(userRef, { ...existing, ...payload, role: finalRole, isAdmin: finalRole === "admin" }, { merge: true });
    } else {
      await setDoc(userRef, { ...payload, createdAt: serverTimestamp() });
    }
  } catch (error) {
    console.error("Failed to write user record:", error);
  }
}

/* ─── Auth Context ───────────────────────────────────────── */
const AuthContext = createContext(null);

function useAuth() { return useContext(AuthContext); }

/* ─── Shared styles ──────────────────────────────────────── */
const BLOBS = (
  <>
    <div style={{position:"fixed",width:500,height:500,background:"#00E5A010",borderRadius:"50%",filter:"blur(90px)",top:-150,left:-100,pointerEvents:"none",zIndex:0}} />
    <div style={{position:"fixed",width:400,height:400,background:"#4F8EF708",borderRadius:"50%",filter:"blur(90px)",bottom:-100,right:-100,pointerEvents:"none",zIndex:0}} />
  </>
);

/* ─── Spinner ────────────────────────────────────────────── */
function Spinner() {
  return (
    <div style={{minHeight:"100vh",background:"#0A0D12",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,color:"#8A94A8",fontFamily:"Barlow,sans-serif"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.sp{animation:spin .8s linear infinite;display:inline-block;font-size:40px;color:#00E5A0}`}</style>
      <i className="ti ti-loader-2 sp" />
      <p style={{fontSize:14}}>Loading...</p>
    </div>
  );
}

/* ─── Role Selection Page ────────────────────────────────── */
function RoleSelectPage({ onSelect }) {
  const [hovered, setHovered] = useState(null);
  const roles = [
    {
      id:    "player",
      icon:  "ti-run",
      title: "Player",
      desc:  "Generate your personal AI match preparation checklist. Enter match details and get ready to perform.",
      color: "#00E5A0",
      badge: "For athletes",
    },
    {
      id:    "admin",
      icon:  "ti-shield-check",
      title: "Admin",
      desc:  "Manage the platform, view all checklists, and access analytics. Requires an admin registration code.",
      color: "#4F8EF7",
      badge: "Staff only",
    },
  ];

  return (
    <div style={{minHeight:"100vh",background:"#0A0D12",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"Barlow,sans-serif",position:"relative",overflow:"hidden",padding:"2rem"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@600;700;800&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        .role-card{transition:all .25s ease;cursor:pointer;}
        .role-card:hover{transform:translateY(-4px);}
      `}</style>
      {BLOBS}
      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:720,textAlign:"center",animation:"fadeUp .5s ease both"}}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:14,marginBottom:"3rem"}}>
          <span style={{width:52,height:52,borderRadius:14,background:"linear-gradient(135deg,#00E5A0,#00b87a)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 28px #00E5A040"}}>
            <i className="ti ti-trophy" style={{fontSize:26,color:"#0A0D12"}} />
          </span>
          <div style={{textAlign:"left"}}>
            <h1 style={{margin:0,fontFamily:"Barlow Condensed,sans-serif",fontSize:24,fontWeight:700,color:"#F0F4FF",lineHeight:1}}>Oxygen Sports</h1>
            <p style={{margin:"4px 0 0",fontSize:10,fontWeight:600,letterSpacing:2,color:"#00E5A0"}}>AI-POWERED PERFORMANCE</p>
          </div>
        </div>

        {/* Heading */}
        <h2 style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:48,fontWeight:800,color:"#F0F4FF",margin:"0 0 .75rem",lineHeight:1.1}}>
          Who are you<br/><span style={{color:"#00E5A0"}}>signing in as?</span>
        </h2>
        <p style={{fontSize:15,color:"#8A94A8",margin:"0 0 3rem",lineHeight:1.6}}>
          Choose your role to continue. Each role has a dedicated experience.
        </p>

        {/* Role Cards */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:"2rem"}}>
          {roles.map((r, i) => (
            <div
              key={r.id}
              className="role-card"
              onClick={() => onSelect(r.id)}
              onMouseEnter={() => setHovered(r.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: hovered===r.id ? "#161B26" : "#111520",
                border: `1px solid ${hovered===r.id ? r.color+"60" : "#ffffff15"}`,
                borderRadius: 18,
                padding: "2rem 1.75rem",
                textAlign: "left",
                boxShadow: hovered===r.id ? `0 0 32px ${r.color}15` : "none",
                animation: `fadeUp .5s ease ${i*0.1+0.1}s both`,
              }}
            >
              {/* Badge */}
              <span style={{display:"inline-flex",alignItems:"center",gap:6,background:r.color+"18",border:`1px solid ${r.color}30`,color:r.color,fontSize:10,fontWeight:700,letterSpacing:1,padding:"4px 10px",borderRadius:20,textTransform:"uppercase",marginBottom:"1.25rem"}}>
                {r.badge}
              </span>
              {/* Icon */}
              <div style={{width:56,height:56,borderRadius:14,background:r.color+"18",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"1.25rem",border:`1px solid ${r.color}25`}}>
                <i className={`ti ${r.icon}`} style={{fontSize:28,color:r.color}} />
              </div>
              <h3 style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:26,fontWeight:700,color:"#F0F4FF",margin:"0 0 .6rem"}}>{r.title}</h3>
              <p style={{fontSize:13,color:"#8A94A8",margin:"0 0 1.5rem",lineHeight:1.65}}>{r.desc}</p>
              <div style={{display:"flex",alignItems:"center",gap:6,color:r.color,fontSize:13,fontWeight:600}}>
                Continue as {r.title} <i className="ti ti-arrow-right" style={{fontSize:15}} />
              </div>
            </div>
          ))}
        </div>
        <p style={{fontSize:12,color:"#3A4558"}}>
          Not sure? Start as a Player — you can always contact your admin for elevated access.
        </p>
      </div>
    </div>
  );
}

/* ─── Login Page ─────────────────────────────────────────── */
function LoginPage({ roleIntent, onBack }) {
  const isAdminFlow = roleIntent === "admin";
  const [mode,       setMode]    = useState("login");
  const [form,       setForm]    = useState({name:"",email:"",password:"",adminCode:""});
  const [loading,    setLoading] = useState(false);
  const [error,      setError]   = useState("");
  const [show,       setShow]    = useState(false);
  const [showCode,   setShowCode]= useState(false);

  function errMsg(code, fallback) {
    const map = {
      "auth/user-not-found":         "No account exists with this email. Please sign up first.",
      "auth/wrong-password":         "Incorrect password. If you do not have an account, please sign up first.",
      "auth/invalid-credential":     "Incorrect email or password.",
      "auth/email-already-in-use":   "This email is already registered. Please sign in or verify your account.",
      "auth/weak-password":          "Password must be at least 6 characters.",
      "auth/invalid-email":          "Please enter a valid email address.",
      "auth/popup-closed-by-user":   "Popup closed. Please try again.",
      "auth/network-request-failed": "Network error. Check your connection.",
      "auth/too-many-requests":      "Too many requests. Please wait and try again later.",
      "auth/operation-not-allowed":  "Email/password login is disabled in Firebase. Enable Email/Password provider in Firebase console.",
      "firestore/permission-denied": "Unable to save registration data. Check Firebase permissions.",
    };
    return map[code] || fallback || "Something went wrong. Please try again.";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.email.trim() || !form.password.trim()) { setError("Please fill in all fields."); return; }
    if (mode === "signup" && !form.name.trim())    { setError("Please enter your name."); return; }
    if (form.password.length < 6)                    { setError("Password must be at least 6 characters."); return; }

    // Admin code check on signup
    if (isAdminFlow && mode === "signup") {
      if (form.adminCode.trim() !== ADMIN_SECRET_CODE) {
        setError("Invalid admin registration code. Contact your supervisor.");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const c = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(c.user, { displayName: form.name });
        await sendEmailVerification(c.user);
        await createOrUpdateUserRecord(c.user, isAdminFlow ? "admin" : "player");
        if (isAdminFlow) {
          localStorage.setItem(`admin_${c.user.uid}`, "true");
        }
        setError("Account created and signed in. Verification email sent to your address.");
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password);
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError(errMsg(err.code, err.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialLogin(provider) {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      if (!result.user.emailVerified) {
        await signOut(auth);
        setError("Email is not verified. Please verify your account before signing in.");
      } else {
        await createOrUpdateUserRecord(result.user, isAdminFlow ? "player" : "player");
      }
    } catch (err) {
      console.error("Social login error:", err);
      setError(errMsg(err.code, err.message));
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() { return handleSocialLogin(googleProvider); }
  function handleGithub() { return handleSocialLogin(githubProvider); }

  const accentColor = isAdminFlow ? "#4F8EF7" : "#00E5A0";
  const accentDark  = isAdminFlow ? "#3a7be0" : "#00c48a";

  return (
    <div style={{minHeight:"100vh",background:"#0A0D12",display:"flex",alignItems:"stretch",fontFamily:"Barlow,sans-serif",position:"relative",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@600;700;800&display=swap');
        .lf input{width:100%;box-sizing:border-box;background:#1A2030;border:1px solid #ffffff1a;border-radius:10px;color:#F0F4FF;font-size:14px;padding:11px 14px 11px 40px;outline:none;font-family:Barlow,sans-serif;}
        .lf input:focus{border-color:${accentColor};box-shadow:0 0 0 3px ${accentColor}18;}
        .lf input::placeholder{color:#3A4558;}
        @keyframes spin2{to{transform:rotate(360deg)}}.sp2{animation:spin2 .8s linear infinite;display:inline-block;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      {BLOBS}
      
      {/* Left panel */}
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"4rem 3rem 4rem 4rem",position:"relative",zIndex:1}}>
        {/* Back button */}
        <button onClick={onBack} style={{display:"inline-flex",alignItems:"center",gap:6,background:"#111520",border:"1px solid #ffffff18",borderRadius:8,color:"#8A94A8",fontSize:13,fontWeight:600,padding:"8px 14px",cursor:"pointer",fontFamily:"Barlow,sans-serif",marginBottom:"3rem",width:"fit-content"}}>
          <i className="ti ti-arrow-left" /> Choose role
        </button>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:"3rem"}}>
          <span style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${accentColor},${accentDark})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 24px ${accentColor}40`}}>
            <i className={`ti ${isAdminFlow?"ti-shield-check":"ti-trophy"}`} style={{fontSize:24,color:"#0A0D12"}} />
          </span>
          <div>
            <h1 style={{margin:0,fontFamily:"Barlow Condensed,sans-serif",fontSize:22,fontWeight:700,color:"#F0F4FF",lineHeight:1}}>Oxygen Sports</h1>
            <p style={{margin:"4px 0 0",fontSize:10,fontWeight:600,letterSpacing:2,color:accentColor}}>{isAdminFlow?"ADMIN PORTAL":"AI-POWERED PERFORMANCE"}</p>
          </div>
        </div>
        <h2 style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:56,fontWeight:800,lineHeight:1.05,color:"#F0F4FF",margin:"0 0 1.25rem"}}>
          {isAdminFlow ? <>Manage the<br/>platform<br/><span style={{color:accentColor}}>with control.</span></> : <>Win starts<br/>before the<br/><span style={{color:accentColor}}>first ball.</span></>}
        </h2>
        <p style={{fontSize:15,lineHeight:1.7,color:"#8A94A8",maxWidth:380}}>
          {isAdminFlow
            ? "Access the admin dashboard, monitor all player checklists, and review usage analytics across Oxygen Sports."
            : "Generate AI-tailored pre-match checklists covering equipment, warm-up, nutrition, and mental readiness — in seconds."}
        </p>
        {/* Role badge */}
        <div style={{display:"inline-flex",alignItems:"center",gap:8,marginTop:"2rem",background:accentColor+"12",border:`1px solid ${accentColor}30`,borderRadius:10,padding:"10px 16px",width:"fit-content"}}>
          <i className={`ti ${isAdminFlow?"ti-shield-check":"ti-run"}`} style={{color:accentColor,fontSize:16}} />
          <span style={{fontSize:13,fontWeight:600,color:accentColor}}>Signing in as {isAdminFlow?"Admin":"Player"}</span>
        </div>
      </div>

      {/* Right — Card */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem",position:"relative",zIndex:1,minWidth:440}}>
        <div style={{width:"100%",maxWidth:430,background:"#111520",border:"1px solid #ffffff1a",borderRadius:20,padding:"2.5rem 2rem",animation:"fadeUp .4s ease both"}} className="lf">
          {/* Toggle */}
          <div style={{display:"flex",background:"#1A2030",borderRadius:10,padding:4,gap:4,marginBottom:"1.75rem"}}>
            {["login","signup"].map(m=>(              <button key={m} onClick={()=>{setMode(m);setError("");}} style={{flex:1,padding:"9px 0",border:mode===m?`1px solid ${accentColor}40`:"none",borderRadius:7,background:mode===m?"#161B26":"transparent",color:mode===m?accentColor:"#8A94A8",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"Barlow,sans-serif",transition:"all .2s"}}>                {m==="login"?"Sign in":"Sign up"}              </button>            ))}          </div>
          <h3 style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:24,fontWeight:700,color:"#F0F4FF",margin:"0 0 4px"}}>
            {mode==="login" ? "Welcome back" : isAdminFlow ? "Create admin account" : "Create account"}
          </h3>
          <p style={{fontSize:13,color:"#8A94A8",margin:"0 0 1.75rem",lineHeight:1.5}}>
            {mode==="login"
              ? `Sign in to your ${isAdminFlow?"admin":"player"} account.`
              : isAdminFlow
                ? "Register here and verify your email before signing in. Admin accounts also require the registration code."
                : "Register here and verify your email before signing in. You can also continue with Google or GitHub."}
          </p>
          <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:14}}>            {mode==="signup" && (              <div style={{display:"flex",flexDirection:"column",gap:7}}>                <label style={{fontSize:11,fontWeight:600,letterSpacing:.8,textTransform:"uppercase",color:"#8A94A8"}}>Full name</label>                <div style={{position:"relative"}}>                  <i className="ti ti-user" style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,color:"#3A4558",pointerEvents:"none"}} />                  <input type="text" placeholder="Your name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />                </div>              </div>            )}            <div style={{display:"flex",flexDirection:"column",gap:7}}>              <label style={{fontSize:11,fontWeight:600,letterSpacing:.8,textTransform:"uppercase",color:"#8A94A8"}}>Email address</label>              <div style={{position:"relative"}}>                <i className="ti ti-mail" style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,color:"#3A4558",pointerEvents:"none"}} />                <input type="email" placeholder="you@example.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />              </div>            </div>            <div style={{display:"flex",flexDirection:"column",gap:7}}>              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>                <label style={{fontSize:11,fontWeight:600,letterSpacing:.8,textTransform:"uppercase",color:"#8A94A8"}}>Password</label>                {mode==="login" && <button type="button" onClick={()=>setError("Contact your supervisor to reset password.")} style={{background:"none",border:"none",color:accentColor,fontSize:12,cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>Forgot password?</button>}              </div>              <div style={{position:"relative"}}>                <i className="ti ti-lock" style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,color:"#3A4558",pointerEvents:"none"}} />                <input type={show?"text":"password"} placeholder={mode==="signup"?"Min. 6 characters":"Enter your password"} value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} style={{paddingRight:42}} />                <button type="button" onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#3A4558",cursor:"pointer",fontSize:16}}>                  <i className={`ti ${show?"ti-eye-off":"ti-eye"}`} />                </button>              </div>            </div>            {/* Admin code field — only on admin signup */}
            {isAdminFlow && mode==="signup" && (
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                <label style={{fontSize:11,fontWeight:600,letterSpacing:.8,textTransform:"uppercase",color:"#8A94A8"}}>Admin registration code</label>
                <div style={{position:"relative"}}>
                  <i className="ti ti-key" style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,color:"#3A4558",pointerEvents:"none"}} />
                  <input type={showCode?"text":"password"} placeholder="Enter code from supervisor" value={form.adminCode} onChange={e=>setForm(f=>({...f,adminCode:e.target.value}))} style={{paddingRight:42,borderColor:"#4F8EF730"}} />
                  <button type="button" onClick={()=>setShowCode(s=>!s)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#3A4558",cursor:"pointer",fontSize:16}}>
                    <i className={`ti ${showCode?"ti-eye-off":"ti-eye"}`} />
                  </button>
                </div>
                <p style={{fontSize:11,color:"#3A4558",margin:"2px 0 0"}}>This code is provided by the Oxygen Sports supervisor.</p>
              </div>
            )}
            {error && (
              <div style={{display:"flex",alignItems:"center",gap:8,background:"#FF5A5A12",border:"1px solid #FF5A5A30",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#FF5A5A"}}>
                <i className="ti ti-alert-circle" style={{fontSize:16,flexShrink:0}} /> {error}
              </div>
            )}
            <button type="submit" disabled={loading} style={{width:"100%",padding:"13px 0",borderRadius:10,border:"none",background:loading?"#1A2030":`linear-gradient(135deg,${accentColor},${accentDark})`,color:loading?"#3A4558":"#0A0D12",fontFamily:"Barlow Condensed,sans-serif",fontSize:16,fontWeight:700,letterSpacing:.5,textTransform:"uppercase",cursor:loading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all .2s",marginTop:2}}>
              {loading ? <><i className="ti ti-loader-2 sp2" /> {mode==="login"?"Signing in...":"Creating account..."}</> : <>{mode==="login"?"Sign in":"Create account"} <i className="ti ti-arrow-right" /></>}            </button>
          </form>
          {/* Social */}
          <>
            <div style={{display:"flex",alignItems:"center",gap:12,margin:"1.5rem 0"}}>
              <span style={{flex:1,height:1,background:"#ffffff1a"}} />
              <p style={{fontSize:12,color:"#3A4558",whiteSpace:"nowrap",margin:0}}>or continue with</p>
              <span style={{flex:1,height:1,background:"#ffffff1a"}} />
            </div>
            <div style={{display:"flex",gap:10,marginBottom:"1.25rem"}}>
              {[{fn:handleGoogle,icon:"ti-brand-google",label:"Google"},{fn:handleGithub,icon:"ti-brand-github",label:"GitHub"}].map(s=>(
                <button key={s.label} type="button" onClick={s.fn} disabled={loading} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px 0",borderRadius:10,border:"1px solid #ffffff1a",background:"#1A2030",color:"#8A94A8",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"Barlow,sans-serif",transition:"all .2s"}}>
                  <i className={`ti ${s.icon}`} style={{fontSize:17}} /> {s.label}
                </button>
              ))}
            </div>
          </>
          <p style={{textAlign:"center",fontSize:13,color:"#8A94A8",margin:"1rem 0 0"}}>
            {mode==="login"?"Don't have an account? ":"Already have an account? "}
            <button type="button" onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");}} style={{background:"none",border:"none",color:accentColor,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>
              {mode==="login"?"Sign up":"Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Analytics Page ─────────────────────────────────────── */
function AnalyticsPage({ onBack }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(()=>{
    fetch("http://127.0.0.1:5000/api/analytics")
      .then(r=>r.json())
      .then(d=>{ if(d.success) setData(d.analytics); else setError("Failed to load."); })
      .catch(()=>setError("Backend not reachable. Make sure Flask is running."))
      .finally(()=>setLoading(false));
  },[]);

  const statCards = data ? [
    {icon:"ti-sparkles",   label:"Total Generations", val:data.total_generations, color:"#00E5A0"},
    {icon:"ti-star",       label:"Feedback Received",  val:data.total_feedback,    color:"#FF9F43"},
    {icon:"ti-chart-line", label:"Average Rating",     val:data.average_rating?`${data.average_rating}/5`:"—", color:"#4F8EF7"},
    {icon:"ti-trophy",     label:"Sports Covered",     val:data.by_sport?.length||0, color:"#A78BFA"},
  ] : [];

  return (
    <div style={{minHeight:"100vh",background:"#0A0D12",color:"#F0F4FF",fontFamily:"Barlow,sans-serif",padding:"2rem 1.25rem 4rem",maxWidth:1100,margin:"0 auto"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@600;700&display=swap');@keyframes spin3{to{transform:rotate(360deg)}}.sp3{animation:spin3 .8s linear infinite;display:inline-block;}`}</style>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"2rem",flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"#111520",border:"1px solid #ffffff18",borderRadius:8,color:"#8A94A8",fontSize:13,fontWeight:600,padding:"8px 14px",cursor:"pointer",fontFamily:"Barlow,sans-serif"}}>
            <i className="ti ti-arrow-left" /> Back
          </button>
          <div>
            <h1 style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:24,fontWeight:700,color:"#F0F4FF",margin:0}}>Analytics Dashboard</h1>
            <p style={{fontSize:12,color:"#4F8EF7",margin:"2px 0 0",letterSpacing:1}}>Oxygen Sports · Admin View</p>          </div>
        </div>
        <span style={{display:"flex",alignItems:"center",gap:6,background:"#4F8EF718",border:"1px solid #4F8EF740",color:"#4F8EF7",fontSize:12,fontWeight:600,padding:"6px 14px",borderRadius:20}}>
          <i className="ti ti-shield-check" /> Admin View
        </span>
      </div>

      {loading && <div style={{display:"flex",alignItems:"center",gap:10,color:"#8A94A8",fontSize:14,padding:"3rem",justifyContent:"center"}}><i className="ti ti-loader-2 sp3" style={{fontSize:28}} /> Loading analytics...</div>}
      {error   && <div style={{display:"flex",alignItems:"center",gap:8,background:"#FF5A5A12",border:"1px solid #FF5A5A30",borderRadius:10,padding:"14px 18px",fontSize:14,color:"#FF5A5A",marginBottom:"1.5rem"}}><i className="ti ti-alert-circle" /> {error}</div>}
      
      {data && (
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:"1.5rem"}}>
            {statCards.map(s=>(
              <div key={s.label} style={{background:"#111520",border:"1px solid #ffffff10",borderRadius:14,padding:"1.25rem 1.5rem",display:"flex",alignItems:"center",gap:16}}>
                <span style={{width:44,height:44,borderRadius:12,background:s.color+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <i className={`ti ${s.icon}`} style={{fontSize:22,color:s.color}} />
                </span>
                <div>
                  <p style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:26,fontWeight:700,color:"#F0F4FF",margin:0}}>{s.val}</p>
                  <p style={{fontSize:12,color:"#8A94A8",margin:"2px 0 0"}}>{s.label}</p>
                </div>
              </div>
            ))}          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:"1.5rem"}}>
            <div style={{background:"#111520",border:"1px solid #ffffff10",borderRadius:14,padding:"1.5rem"}}>
              <h3 style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:16,fontWeight:700,color:"#F0F4FF",margin:"0 0 1.25rem",display:"flex",alignItems:"center",gap:8}}><i className="ti ti-ball-football" style={{color:"#00E5A0"}} /> By Sport</h3>
              {data.by_sport?.map((s,i)=>{                const max=Math.max(...data.by_sport.map(x=>x.count));                return(<div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>                  <span style={{fontSize:12,color:"#8A94A8",minWidth:100,textAlign:"right"}}>{s.sport}</span>                  <div style={{flex:1,height:8,background:"#1A2030",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",background:"linear-gradient(90deg,#00E5A0,#00b87a)",borderRadius:4,width:`${Math.max((s.count/max)*100,4)}%`}} /></div>                  <span style={{fontSize:12,color:"#8A94A8",minWidth:24}}>{s.count}</span>                </div>);              })}            </div>
            <div style={{background:"#111520",border:"1px solid #ffffff10",borderRadius:14,padding:"1.5rem"}}>
              <h3 style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:16,fontWeight:700,color:"#F0F4FF",margin:"0 0 1.25rem",display:"flex",alignItems:"center",gap:8}}><i className="ti ti-star" style={{color:"#FF9F43"}} /> Rating Distribution</h3>
              {[5,4,3,2,1].map(star=>{                const count=data.rating_distribution?.[String(star)]||0;                const total=Object.values(data.rating_distribution||{}).reduce((a,b)=>a+b,0);                const pct=total?Math.round((count/total)*100):0;                return(<div key={star} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>                  <span style={{fontSize:11,color:"#FF9F43",minWidth:60,letterSpacing:1}}>{ "★".repeat(star) }</span>                  <div style={{flex:1,height:8,background:"#1A2030",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",background:"linear-gradient(90deg,#FF9F43,#e88c30)",borderRadius:4,width:`${pct}%`}} /></div>                  <span style={{fontSize:12,color:"#8A94A8",minWidth:24}}>{count}</span>                </div>);              })}            </div>          </div>
          <div style={{background:"#111520",border:"1px solid #ffffff10",borderRadius:14,padding:"1.5rem",marginBottom:"1.5rem"}}>
            <h3 style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:16,fontWeight:700,color:"#F0F4FF",margin:"0 0 1.25rem",display:"flex",alignItems:"center",gap:8}}><i className="ti ti-user" style={{color:"#A78BFA"}} /> Generations by User</h3>
            {data.by_user?.map((u,i)=>{                const max=Math.max(...data.by_user.map(x=>x.count));                return(<div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>                  <span style={{fontSize:12,color:"#8A94A8",minWidth:100,textAlign:"right"}}>{u.user_email}</span>                  <div style={{flex:1,height:8,background:"#1A2030",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",background:"linear-gradient(90deg,#A78BFA,#7F5CF7)",borderRadius:4,width:`${Math.max((u.count/max)*100,4)}%`}} /></div>                  <span style={{fontSize:12,color:"#8A94A8",minWidth:24}}>{u.count}</span>                </div>);              })}
          </div>

          <div style={{background:"#111520",border:"1px solid #ffffff10",borderRadius:14,padding:"1.5rem",overflowX:"auto"}}>
            <h3 style={{fontFamily:"Barlow Condensed,sans-serif",fontSize:16,fontWeight:700,color:"#F0F4FF",margin:"0 0 1.25rem",display:"flex",alignItems:"center",gap:8}}><i className="ti ti-clock" style={{color:"#00E5A0"}} /> Recent Generations</h3>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr>{["#","Player","Sport","Format","Level","Rating","Date"].map(h=>(<th key={h} style={{textAlign:"left",fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:"#3A4558",padding:"8px 12px",borderBottom:"1px solid #ffffff08"}}>{h}</th>))}</tr></thead>
              <tbody>
                {data.recent_generations?.map(g=>(
                  <tr key={g.id}>
                    <td style={{padding:"12px",color:"#8A94A8",borderBottom:"1px solid #ffffff06"}}>{g.id}</td>
                    <td style={{padding:"12px",color:"#F0F4FF",borderBottom:"1px solid #ffffff06"}}>{g.player}</td>
                    <td style={{padding:"12px",borderBottom:"1px solid #ffffff06"}}><span style={{background:"#00E5A018",color:"#00E5A0",border:"1px solid #00E5A030",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20}}>{g.sport}</span></td>
                    <td style={{padding:"12px",color:"#8A94A8",borderBottom:"1px solid #ffffff06"}}>{g.format}</td>
                    <td style={{padding:"12px",color:"#8A94A8",borderBottom:"1px solid #ffffff06"}}>{g.level}</td>
                    <td style={{padding:"12px",borderBottom:"1px solid #ffffff06"}}>{g.rating?<span style={{color:"#FF9F43"}}>{"★".repeat(g.rating)}</span>:<span style={{color:"#3A4558"}}>—</span>}</td>
                    <td style={{padding:"12px",color:"#8A94A8",borderBottom:"1px solid #ffffff06"}}>{new Date(g.created_at).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
                {data.recent_generations?.length===0 && <tr><td colSpan="7" style={{textAlign:"center",color:"#3A4558",padding:"2rem"}}>No generations yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Main App ───────────────────────────────────────────── */
export default function App() {
  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const [page,         setPage]         = useState("app");
  const [roleIntent,   setRoleIntent]   = useState(null); // "player" | "admin" | null

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, u => {
      if (u) {
        (async () => {
          try {
            const userRef = doc(db, "users", u.uid);
            const snapshot = await getDoc(userRef);
            let role = getRole(u.email, localStorage.getItem(`admin_${u.uid}`) === "true");
            if (snapshot.exists()) {
              const data = snapshot.data();
              role = data.role || role;
            } else {
              await setDoc(userRef, {
                uid: u.uid,
                name: u.displayName || u.email.split("@")[0],
                email: u.email.toLowerCase(),
                photo: u.photoURL || "",
                provider: u.providerData?.[0]?.providerId || "password",
                role,
                isAdmin: role === "admin",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
            setFirebaseUser({
              uid:        u.uid,
              name:       u.displayName || u.email.split("@")[0],
              email:      u.email,
              photo:      u.photoURL,
              role,
              isSuperman: false,
              isAdmin:    role==="admin",
            });
          } catch (error) {
            console.error("Failed to load user record:", error);
            const role = getRole(u.email, localStorage.getItem(`admin_${u.uid}`) === "true");
            setFirebaseUser({
              uid:        u.uid,
              name:       u.displayName || u.email.split("@")[0],
              email:      u.email,
              photo:      u.photoURL,
              role,
              isSuperman: false,
              isAdmin:    role==="admin",
            });
          }
        })();
      } else {
        setFirebaseUser(null);
      }
    });
    return ()=>unsub();
  },[]);

  if (firebaseUser === undefined) return <Spinner />;

  // Not logged in — show role select first, then login
  if (!firebaseUser) {
    if (!roleIntent) return <RoleSelectPage onSelect={setRoleIntent} />;
    return <LoginPage roleIntent={roleIntent} onBack={()=>setRoleIntent(null)} />;
  }

  if (page==="analytics" && firebaseUser.isAdmin) {
    return <AnalyticsPage onBack={()=>setPage("app")} />;
  }

  if (firebaseUser.isAdmin) {
    return <SupermanDashboard
      user={firebaseUser}
      onLogout={()=>{ signOut(auth); setRoleIntent(null); }}
      onBack={()=>setPage("app")}
    />;
  }

  return (
    <MatchPreparation
      user={firebaseUser}
      onLogout={()=>{ signOut(auth); setRoleIntent(null); }}
      onAnalytics={firebaseUser.isAdmin ? ()=>setPage("analytics") : null}
    />
  );
}