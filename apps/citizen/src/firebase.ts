import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// NOTA: El emulador de Firebase Auth NO soporta signInWithPopup con Google real.
// Activarlo impide que el login con Google funcione en desarrollo.
// Sólo activa el emulador si usas usuarios emulados (sin proveedores OAuth reales).
// if (import.meta.env.DEV) {
//   connectAuthEmulator(auth, "http://localhost:9099");
// }

export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export default app;
