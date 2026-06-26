// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

// ── Role definitions ──────────────────────────────────────
// Add emails here to assign roles
const ROLE_MAP = {
  admin: [
    "admin@oxygensports.com",   // ← Admin emails
  ],
  // Everyone else = "player"
};

function getRole(email) {
  if (!email) return "player";
  const e = email.toLowerCase();
  if (ROLE_MAP.admin.includes(e)) return "admin";
  return "player";
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const role = getRole(firebaseUser.email);
        setUser({
          uid:   firebaseUser.uid,
          name:  firebaseUser.displayName || firebaseUser.email.split("@")[0],
          email: firebaseUser.email,
          photo: firebaseUser.photoURL,
          role,                          // "admin" | "player"
          isSuperman: false,
          isAdmin:    role === "admin",
          isPlayer:   true,              // everyone can use player features
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  async function logout() {
    await signOut(auth);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}