import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
// ❌ NO importes analytics directamente aquí

const firebaseConfig = {
  apiKey: "AIzaSyCLneYjAMx8THUXa61WK3DA9vGH2aj6J6k",
  authDomain: "inovacion2-evaluacion3.firebaseapp.com",
  projectId: "inovacion2-evaluacion3",
  storageBucket: "inovacion2-evaluacion3.firebasestorage.app",
  messagingSenderId: "630578561620",
  appId: "1:630578561620:web:06da1f073fd232953223c1",
  measurementId: "G-XDNJ8PD951"
};

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// ✅ Usa Analytics solo en cliente
if (typeof window !== "undefined") {
  import("firebase/analytics").then(({ getAnalytics }) => {
    getAnalytics(app)
  })
}

export { app, auth, db }
