import { ref, computed } from "vue";
import {
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider, facebookProvider } from "../firebase";
import { citizenLogin } from "../services/api";

const user = ref<User | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const isAuthenticated = computed(() => !!user.value);

// Escucha cambios de estado de autenticación
onAuthStateChanged(auth, (firebaseUser) => {
  user.value = firebaseUser;
  loading.value = false;

  if (firebaseUser) {
    firebaseUser.getIdToken().then((idToken) => {
      citizenLogin(idToken).then((response) => {
        localStorage.setItem("citizenAccessToken", response.accessToken);
      }).catch(() => {
        localStorage.removeItem("citizenAccessToken");
      });
    });
  } else {
    localStorage.removeItem("citizenAccessToken");
  }
});

/** Inicia sesión con Google */
async function loginWithGoogle(): Promise<void> {
  error.value = null;
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err: any) {
    if (err.code !== "auth/popup-closed-by-user") {
      error.value = err.message ?? "Error al iniciar sesión con Google.";
    }
  }
}

/** Inicia sesión con Facebook */
async function loginWithFacebook(): Promise<void> {
  error.value = null;
  try {
    await signInWithPopup(auth, facebookProvider);
  } catch (err: any) {
    if (err.code !== "auth/popup-closed-by-user") {
      error.value = err.message ?? "Error al iniciar sesión con Facebook.";
    }
  }
}

/** Cierra sesión */
async function logout(): Promise<void> {
  await signOut(auth);
}

export function useCitizenAuth() {
  return { user, loading, error, isAuthenticated, loginWithGoogle, loginWithFacebook, logout };
}
