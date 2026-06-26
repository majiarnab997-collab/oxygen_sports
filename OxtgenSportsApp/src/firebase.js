// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBwuNYNZfWCphrOyo6mB2CUI3VECGjRKAo",
  authDomain: "gen-lang-client-0857236304.firebaseapp.com",
  projectId: "gen-lang-client-0857236304",
  storageBucket: "gen-lang-client-0857236304.firebasestorage.app",
  messagingSenderId: "815973574643",
  appId: "1:815973574643:web:043cce87091dc94c089486"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
export const db = getFirestore(app);
