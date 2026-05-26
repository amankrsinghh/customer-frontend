// ============================================================================
// Firebase configuration template
// ----------------------------------------------------------------------------
// 1. `npm i firebase`  (in BOTH customer-frontend and admin-panel)
// 2. Create a Firebase project at https://console.firebase.google.com
// 3. Enable Authentication (Email/Password) and Firestore
// 4. Copy the web app config into the .env file at the project root
// 5. Restart the dev server.
// ============================================================================

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            ?? "",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        ?? "",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         ?? "",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     ?? "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             ?? "",
};

const hasFirebaseKeys = !!firebaseConfig.apiKey;

export const app  = hasFirebaseKeys ? initializeApp(firebaseConfig) : null as any;
export const auth = hasFirebaseKeys ? getAuth(app) : null as any;
export const db   = hasFirebaseKeys ? getFirestore(app) : null as any;


/**
 * Uncomment when ready to use Firebase. Until then a local mock store is
 * used (see ./mockStore.ts) so the application is fully functional offline.
 *
 * // Suggested Firestore collections:
 * //  - products           (Product[])
 * //  - orders             (Order[])
 * //  - customRequests     (CustomRequest[])
 * //  - users/{uid}        (User profile)
 * //  - users/{uid}/cart   (CartItem[])
 * //  - users/{uid}/wishlist (string[] productIds)
 */
