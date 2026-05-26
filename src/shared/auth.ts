import { useEffect, useState } from "react";
import type { User } from "./types";
import { usersDB } from "./mockStore";
import { firebaseConfig, auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updatePassword as fbUpdatePassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const SESSION_KEY = "ccd_session_uid";
const isFirebaseEnabled = !!firebaseConfig.apiKey;

function emitAuthChange() {
  window.dispatchEvent(new Event("ccd:auth"));
}

export function currentUser(): User | null {
  const profileStr = localStorage.getItem("ccd_session_profile");
  if (profileStr) {
    try {
      const u = JSON.parse(profileStr) as User;
      usersDB.add(u).catch(() => {});
      return u;
    } catch {}
  }
  const uid = localStorage.getItem(SESSION_KEY);
  if (!uid) return null;
  return usersDB.get(uid) ?? null;
}

export function useAuth(): User | null {
  const [user, setUser] = useState<User | null>(currentUser());

  useEffect(() => {
    if (!isFirebaseEnabled) {
      const cb = () => setUser(currentUser());
      window.addEventListener("ccd:auth", cb);
      window.addEventListener("storage", cb);
      return () => {
        window.removeEventListener("ccd:auth", cb);
        window.removeEventListener("storage", cb);
      };
    } else {
      // Listen to Firebase Auth state
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          // 1. Instantly set cached profile if available to avoid any flashing "Sign in" state
          const cachedProfileStr = localStorage.getItem("ccd_session_profile");
          if (cachedProfileStr) {
            try {
              const cachedUser = JSON.parse(cachedProfileStr) as User;
              if (cachedUser.uid === fbUser.uid) {
                usersDB.add(cachedUser).catch(() => {});
                setUser(cachedUser);
              }
            } catch {}
          }

          try {
            const userDoc = await getDoc(doc(db, "users", fbUser.uid));
            if (userDoc.exists()) {
              const u = { uid: fbUser.uid, ...userDoc.data() } as User;
              usersDB.add(u).catch(() => {});
              localStorage.setItem(SESSION_KEY, fbUser.uid);
              localStorage.setItem("ccd_session_profile", JSON.stringify(u));
              setUser(u);
            } else {
              const u: User = {
                uid: fbUser.uid,
                email: fbUser.email ?? "",
                name: fbUser.displayName ?? "Customer",
                role: fbUser.email === "tavisha@storelove.com" ? "admin" : "customer",
              };
              await setDoc(doc(db, "users", fbUser.uid), {
                email: u.email,
                name: u.name,
                role: u.role,
              });
              usersDB.add(u).catch(() => {});
              localStorage.setItem(SESSION_KEY, fbUser.uid);
              localStorage.setItem("ccd_session_profile", JSON.stringify(u));
              setUser(u);
            }
          } catch (err) {
            console.error("Error fetching user profile from Firestore:", err);
            // Fallback: If Firestore fetch fails, keep using the cached profile or construct standard fallback from fbUser
            const latestCachedProfileStr = localStorage.getItem("ccd_session_profile");
            if (latestCachedProfileStr) {
              try {
                const cachedUser = JSON.parse(latestCachedProfileStr) as User;
                if (cachedUser.uid === fbUser.uid) {
                  setUser(cachedUser);
                  return;
                }
              } catch {}
            }
            const u: User = {
              uid: fbUser.uid,
              email: fbUser.email ?? "",
              name: fbUser.displayName ?? fbUser.email?.split("@")[0] ?? "Customer",
              role: fbUser.email === "tavisha@storelove.com" ? "admin" : "customer",
            };
            usersDB.add(u).catch(() => {});
            setUser(u);
          }
        } else {
          localStorage.removeItem(SESSION_KEY);
          localStorage.removeItem("ccd_session_profile");
          setUser(null);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  return user;
}

export async function signUp(opts: {
  email: string; password: string; name: string; phone?: string;
}): Promise<User> {
  if (isFirebaseEnabled) {
    const cred = await createUserWithEmailAndPassword(auth, opts.email, opts.password);
    const user: User = {
      uid: cred.user.uid,
      email: opts.email,
      name: opts.name,
      phone: opts.phone,
      role: opts.email === "tavisha@storelove.com" ? "admin" : "customer",
    };
    await setDoc(doc(db, "users", cred.user.uid), {
      email: user.email,
      name: user.name,
      phone: user.phone || "",
      role: user.role,
    });
    usersDB.add(user).catch(() => {});
    localStorage.setItem(SESSION_KEY, user.uid);
    localStorage.setItem("ccd_session_profile", JSON.stringify(user));
    emitAuthChange();
    return user;
  } else {
    const existing = usersDB.all().find((u) => u.email === opts.email);
    if (existing) throw new Error("Account already exists with this email");
    const user: User = {
      uid: "u_" + Date.now(),
      email: opts.email,
      name: opts.name,
      phone: opts.phone,
      role: "customer",
    };
    usersDB.add(user).catch(() => {});
    localStorage.setItem(SESSION_KEY, user.uid);
    localStorage.setItem("ccd_session_profile", JSON.stringify(user));
    const pw = JSON.parse(localStorage.getItem("ccd_pw") || "{}");
    pw[opts.email] = opts.password;
    localStorage.setItem("ccd_pw", JSON.stringify(pw));
    emitAuthChange();
    return user;
  }
}

export async function signIn(email: string, password: string): Promise<User> {
  if (isFirebaseEnabled) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", cred.user.uid));
      let user: User;
      if (userDoc.exists()) {
        user = { uid: cred.user.uid, ...userDoc.data() } as User;
      } else {
        user = {
          uid: cred.user.uid,
          email: email,
          name: cred.user.displayName ?? "Customer",
          role: email === "tavisha@storelove.com" ? "admin" : "customer",
        };
        await setDoc(doc(db, "users", cred.user.uid), {
          email: user.email,
          name: user.name,
          role: user.role,
        });
      }
      usersDB.add(user).catch(() => {});
      localStorage.setItem(SESSION_KEY, user.uid);
      localStorage.setItem("ccd_session_profile", JSON.stringify(user));
      emitAuthChange();
      return user;
    } catch (fbErr: any) {
      if (fbErr.code === "auth/user-not-found" || fbErr.code === "auth/invalid-credential") {
        throw new Error("This email is not registered. Please sign up to create a new account.");
      }
      throw fbErr;
    }
  } else {
    const user = usersDB.all().find((u) => u.email === email);
    if (!user) throw new Error("This email is not registered. Please sign up to create a new account.");
    const pw = JSON.parse(localStorage.getItem("ccd_pw") || "{}");
    const demoAccounts: Record<string, string> = {
      "tavisha@storelove.com": "admin123",
      "demo@tavishalove.com":  "demo1234",
    };
    const expected = pw[email] ?? demoAccounts[email];
    if (expected && expected !== password) throw new Error("Incorrect password");
    localStorage.setItem(SESSION_KEY, user.uid);
    localStorage.setItem("ccd_session_profile", JSON.stringify(user));
    emitAuthChange();
    return user;
  }
}

export async function signOut() {
  if (isFirebaseEnabled) {
    await fbSignOut(auth);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("ccd_session_profile");
    emitAuthChange();
  } else {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("ccd_session_profile");
    emitAuthChange();
  }
}

export async function sendPasswordReset(email: string): Promise<void> {
  if (isFirebaseEnabled) {
    await sendPasswordResetEmail(auth, email);
  } else {
    console.info("[Auth] (mock) Password reset link sent to:", email);
    await new Promise((r) => setTimeout(r, 600));
  }
}

export async function updateAdminPassword(newPassword: string): Promise<void> {
  if (isFirebaseEnabled) {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user found.");
    try {
      await fbUpdatePassword(user, newPassword);
    } catch (err: any) {
      if (err.code === "auth/requires-recent-login") {
        throw new Error("For security reasons, this operation requires recent authentication. Please sign out and sign in again to update your password.");
      }
      throw err;
    }
  } else {
    const email = "tavisha@storelove.com";
    const pw = JSON.parse(localStorage.getItem("ccd_pw") || "{}");
    pw[email] = newPassword;
    localStorage.setItem("ccd_pw", JSON.stringify(pw));
  }
}

/** Ensure demo customer exists so reviewers can log in quickly. */
export function ensureDemoCustomer() {
  if (!usersDB.all().find((u) => u.email === "demo@tavishalove.com")) {
    usersDB.add({
      uid: "u_demo",
      email: "demo@tavishalove.com",
      name: "Aanya Sharma",
      phone: "+91 98765 43210",
      address: "12 Hauz Khas, New Delhi, 110016",
      role: "customer",
    });
  }
}
