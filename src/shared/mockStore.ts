// ============================================================================
// Mock Firebase store — uses localStorage + pub/sub to simulate Firestore
// realtime listeners. Drop in the real Firebase SDK calls (commented in
// ./firebase.ts) to switch to production. Public API is intentionally close
// to Firestore so the swap is mechanical.
// ============================================================================

import type {
  Product,
  Order,
  CustomRequest,
  User,
  CartItem,
  CategoryItem,
} from "./types";
import { firebaseConfig, db, auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";

type Listener<T> = (data: T) => void;

const allCollections: any[] = [];

const isFirebaseEnabled = !!firebaseConfig.apiKey;

class Collection<T> {
  private key: string;
  private idField: string;
  private fsColName: string;
  private listeners: Set<Listener<T[]>> = new Set();
  private inMemoryCache: T[] = [];
  private unsubscribeFs: (() => void) | null = null;

  constructor(key: string, seed: T[] = [], idField: string = "id") {
    this.key = key;
    this.idField = idField;
    this.fsColName = key.replace("ccd_", "").replace(/_([a-z])/g, (g) => g[1].toUpperCase());

    // Register collection instance
    allCollections.push(this);

    // Always listen for cross-tab localStorage changes so admin updates
    // appear instantly on the customer tab (and vice versa)
    window.addEventListener("storage", (e) => {
      if (e.key === key) this.emit();
    });

    if (!isFirebaseEnabled) {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(seed));
      }
    } else {
      this.initFirestore(seed);
    }
  }

  setupFirestoreListener() {
    if (!isFirebaseEnabled) return;
    if (this.fsColName === "users") {
      return;
    }

    // Unsubscribe from any existing listener first to avoid duplicates
    if (this.unsubscribeFs) {
      try {
        this.unsubscribeFs();
      } catch (err) {
        console.warn(`Error unsubscribing Firestore listener for ${this.fsColName}:`, err);
      }
      this.unsubscribeFs = null;
    }

    const colRef = collection(db, this.fsColName);

    // Listen for real-time updates from Firestore
    this.unsubscribeFs = onSnapshot(colRef, (snapshot) => {
      const list: T[] = [];
      snapshot.forEach((d) => {
        list.push({ [this.idField]: d.id, ...d.data() } as unknown as T);
      });

      // Sort by createdAt descending to keep newest first (similar to unshift)
      list.sort((a: any, b: any) => {
        const timeA = a.createdAt || 0;
        const timeB = b.createdAt || 0;
        return timeB - timeA;
      });

      this.inMemoryCache = list;
      
      // Update localStorage backup with Firestore data to keep them in sync
      localStorage.setItem(this.key, JSON.stringify(list));
      
      this.emit();
    }, (error) => {
      console.error(`Firestore error on collection ${this.fsColName}:`, error);
    });
  }

  private async initFirestore(seed: T[]) {
    // Initialize in-memory cache with seed data (acts as a starting point)
    this.inMemoryCache = [...seed];

    // Setup the listener
    this.setupFirestoreListener();

    // Seed data if Firestore is empty on first load (e.g. for products)
    if (this.fsColName === "products" && seed.length > 0) {
      try {
        const colRef = collection(db, this.fsColName);
        const querySnapshot = await getDocs(colRef);
        if (querySnapshot.empty) {
          for (const item of seed) {
            const data = { ...item } as any;
            const id = data[this.idField];
            delete data[this.idField];
            await setDoc(doc(db, this.fsColName, id), data);
          }
        }
      } catch (err) {
        console.error(`Failed to seed Firestore ${this.fsColName}:`, err);
      }
    }
  }

  private idOf(x: T): string { return (x as Record<string, unknown>)[this.idField] as string; }

  private allLocalStorage(): T[] {
    try { return JSON.parse(localStorage.getItem(this.key) || "[]") as T[]; }
    catch { return []; }
  }

  all(): T[] {
    const localData = this.allLocalStorage();
    if (isFirebaseEnabled) {
      // Merge Firestore cache with localStorage backup so orders survive
      // Firestore security rule failures or page reloads
      const merged = [...this.inMemoryCache];
      localData.forEach((item: any) => {
        const id = item[this.idField];
        if (!merged.some((x: any) => x[this.idField] === id)) {
          merged.push(item);
        }
      });
      try {
        merged.sort((a: any, b: any) => (b as any).createdAt - (a as any).createdAt);
      } catch {}
      return merged;
    }
    return localData;
  }

  get(id: string): T | undefined {
    return this.all().find((x) => this.idOf(x) === id);
  }

  async add(item: T): Promise<T> {
    const id = (item as any)[this.idField] || Math.random().toString(36).slice(2, 10).toUpperCase();
    (item as any)[this.idField] = id;

    if (isFirebaseEnabled) {
      const data = { ...item } as any;

      // 1. Update inMemoryCache immediately
      const idx = this.inMemoryCache.findIndex((x) => this.idOf(x) === id);
      if (idx !== -1) {
        this.inMemoryCache[idx] = data;
      } else {
        this.inMemoryCache.unshift(data);
      }

      // 2. ALWAYS dual-write to localStorage as persistent backup
      const lsList = this.allLocalStorage();
      const lsIdx = lsList.findIndex((x) => this.idOf(x) === id);
      if (lsIdx !== -1) {
        lsList[lsIdx] = data;
      } else {
        lsList.unshift(data);
      }
      localStorage.setItem(this.key, JSON.stringify(lsList));
      this.emit();

      // 3. Write to Firestore (best-effort, non-blocking UI)
      const docData = { ...data };
      delete docData[this.idField];
      try {
        await setDoc(doc(db, this.fsColName, id), docData);
      } catch (err) {
        console.warn(`[Firestore] setDoc failed for ${this.fsColName}, using localStorage fallback:`, err);
      }
      return data as T;
    } else {
      const list = this.allLocalStorage();
      const idx = list.findIndex((x) => this.idOf(x) === id);
      if (idx !== -1) {
        list[idx] = item;
      } else {
        list.unshift(item);
      }
      localStorage.setItem(this.key, JSON.stringify(list));
      this.emit();
      return item;
    }
  }

  async update(id: string, patch: Partial<T>): Promise<T | undefined> {
    if (isFirebaseEnabled) {
      const docRef = doc(db, this.fsColName, id);
      const updateData = { ...patch } as any;
      delete updateData[this.idField];

      // 1. Update inMemoryCache immediately
      const idx = this.inMemoryCache.findIndex((x) => this.idOf(x) === id);
      if (idx !== -1) {
        this.inMemoryCache[idx] = { ...this.inMemoryCache[idx], ...patch };
      }

      // 2. ALWAYS dual-write to localStorage as persistent backup
      const lsList = this.allLocalStorage();
      const lsIdx = lsList.findIndex((x) => this.idOf(x) === id);
      if (lsIdx !== -1) {
        // Item already in localStorage — update it
        lsList[lsIdx] = { ...lsList[lsIdx], ...patch };
      } else {
        // Item not yet in localStorage (placed before dual-write was enabled)
        // — grab it from inMemoryCache and add it so future reads see it
        const fromCache = this.inMemoryCache.find((x) => this.idOf(x) === id);
        if (fromCache) {
          lsList.unshift({ ...fromCache, ...patch });
        }
      }
      localStorage.setItem(this.key, JSON.stringify(lsList));
      this.emit();

      // 3. Update Firestore (best-effort)
      try {
        await updateDoc(docRef, updateData);
      } catch (err) {
        console.warn(`[Firestore] updateDoc failed for ${this.fsColName}, using localStorage fallback:`, err);
      }
      return this.get(id);
    } else {
      const list = this.allLocalStorage();
      const idx = list.findIndex((x) => this.idOf(x) === id);
      if (idx === -1) return undefined;
      list[idx] = { ...list[idx], ...patch };
      localStorage.setItem(this.key, JSON.stringify(list));
      this.emit();
      return list[idx];
    }
  }

  async remove(id: string): Promise<void> {
    if (isFirebaseEnabled) {
      // Update inMemoryCache immediately
      this.inMemoryCache = this.inMemoryCache.filter((x) => this.idOf(x) !== id);
      // Also remove from localStorage backup
      const lsList = this.allLocalStorage().filter((x) => this.idOf(x) !== id);
      localStorage.setItem(this.key, JSON.stringify(lsList));
      this.emit();

      const docRef = doc(db, this.fsColName, id);
      try { await deleteDoc(docRef); } catch (err) {
        console.warn(`[Firestore] deleteDoc failed for ${this.fsColName}:`, err);
      }
    } else {
      const list = this.allLocalStorage().filter((x) => this.idOf(x) !== id);
      localStorage.setItem(this.key, JSON.stringify(list));
      this.emit();
    }
  }

  /** Subscribe to realtime updates (like Firestore onSnapshot). */
  subscribe(cb: Listener<T[]>): () => void {
    this.listeners.add(cb);
    cb(this.all());
    return () => { this.listeners.delete(cb); };
  }

  private emit() {
    const data = this.all();
    this.listeners.forEach((cb) => cb(data));
  }
}

// ---------- Seed data so the demo looks alive on first load ----------
const SEED_PRODUCTS: Product[] = [
  {
    id: "p1",
    title: "Rose Gold Anarkali",
    description:
      "A breathtaking hand-embroidered Anarkali in soft rose gold tones. Featuring delicate zari work, fitted bodice and a flowing flared silhouette — crafted to make every entrance unforgettable.",
    price: 24999,
    discountPrice: 18999,
    category: "Anarkali",
    sizes: ["S", "M", "L", "XL", "Custom"],
    colors: ["Rose Gold", "Ivory"],
    stock: 8,
    fabric: "Pure Georgette with Zari",
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900",
      "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=900",
    ],
    createdAt: Date.now() - 86400000 * 3,
    featured: true,
  },
  {
    id: "p2",
    title: "Ivory Bridal Lehenga",
    description:
      "Heirloom bridal lehenga in ivory raw silk with intricate gold thread embroidery. Comes with matching dupatta and customizable blouse fit.",
    price: 89999,
    discountPrice: 74999,
    category: "Bridal",
    sizes: ["S", "M", "L", "Custom"],
    colors: ["Ivory", "Champagne"],
    stock: 3,
    fabric: "Raw Silk",
    images: [
      "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=900",
      "https://images.unsplash.com/photo-1617922001439-4a2e6562f328?w=900",
    ],
    createdAt: Date.now() - 86400000 * 5,
    featured: true,
  },
  {
    id: "p3",
    title: "Blush Pink Gown",
    description:
      "Floor-sweeping blush pink evening gown with hand-stitched pearl detailing. The perfect blend of modern silhouette and timeless femininity.",
    price: 18999,
    discountPrice: 14999,
    category: "Gown",
    sizes: ["XS", "S", "M", "L", "Custom"],
    colors: ["Blush", "Mauve"],
    stock: 12,
    fabric: "Satin Crepe",
    images: [
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=900",
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900",
    ],
    createdAt: Date.now() - 86400000 * 1,
    featured: true,
  },
  {
    id: "p4",
    title: "Emerald Silk Saree",
    description:
      "Classic emerald green silk saree with traditional gold border. A timeless drape, hand-finished and customizable to your blouse measurements.",
    price: 15999,
    category: "Saree",
    sizes: ["Free Size"],
    colors: ["Emerald", "Gold"],
    stock: 20,
    fabric: "Kanchipuram Silk",
    images: [
      "https://images.unsplash.com/photo-1610189025157-770a35e08e8e?w=900",
    ],
    createdAt: Date.now() - 86400000 * 7,
  },
  {
    id: "p5",
    title: "Champagne Indo-Western",
    description:
      "Contemporary indo-western set in champagne with cape-style drape. Perfect for cocktail evenings and intimate celebrations.",
    price: 22999,
    discountPrice: 19999,
    category: "Indo-Western",
    sizes: ["S", "M", "L", "Custom"],
    colors: ["Champagne", "Black"],
    stock: 6,
    fabric: "Organza",
    images: [
      "https://images.unsplash.com/photo-1595777216528-071e0127ccbf?w=900",
    ],
    createdAt: Date.now() - 86400000 * 2,
    featured: true,
  },
  {
    id: "p6",
    title: "Wine Velvet Suit",
    description:
      "Royal wine velvet suit set with intricate dori embroidery. Three-piece set with palazzo pants and matching dupatta.",
    price: 12999,
    discountPrice: 9999,
    category: "Suit",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Wine", "Gold"],
    stock: 15,
    fabric: "Velvet",
    images: [
      "https://images.unsplash.com/photo-1591348278863-a8fb3887e2aa?w=900",
    ],
    createdAt: Date.now() - 86400000 * 4,
  },
];

const SEED_CATEGORIES: CategoryItem[] = [
  { id: "c1", name: "Anarkali", slug: "Anarkali" },
  { id: "c2", name: "Bridal", slug: "Bridal" },
  { id: "c3", name: "Gown", slug: "Gown" },
  { id: "c4", name: "Saree", slug: "Saree" },
  { id: "c5", name: "Indo-Western", slug: "Indo-Western" },
  { id: "c6", name: "Suit", slug: "Suit" },
];

export const categoriesDB     = new Collection<CategoryItem>("ccd_categories", SEED_CATEGORIES);
export const productsDB       = new Collection<Product>("ccd_products", SEED_PRODUCTS);
export const ordersDB         = new Collection<Order>("ccd_orders", []);
export const customRequestsDB = new Collection<CustomRequest>("ccd_custom_requests", []);
export const usersDB          = new Collection<User>("ccd_users", [
  {
    uid: "admin-1",
    email: "tavisha@storelove.com",
    name: "Tavisha Admin",
    role: "admin",
  },
], "uid");
export const settingsDB       = new Collection<any>("ccd_settings", [
  {
    id: "home_hero",
    badgeText: "Made to Measure ✦ Crafted in India",
    title: "Wear the dress",
    italicTitle: "made only for you",
    subtitle: "Heirloom-quality dresses, hand-finished by master artisans and tailored to your exact measurements. From bridal couture to everyday luxury.",
    imageLink: "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=900",
    imageTagline: "Bridal Edit",
    imageTitle: "The Ivory Story",
  },
  {
    id: "store_settings",
    returnWindowDays: 7,
  },
  {
    id: "email_settings",
    confirmSubject: "Order Placed Successfully - {orderId} | Tavishalove Store.",
    confirmGreeting: "Thank you for your order, {customerName}!",
    confirmMessage: "Your custom tailored dress order #{orderId} has been received and is currently being processed by our master artisans. Our designers will reach out on WhatsApp shortly to verify your measurements.",
    statusSubject: "Tailoring Progress Update - {orderId} | Tavishalove Store.",
    statusGreeting: "Great news, {customerName}!",
    statusMessage: "The progress of your custom tailored dress order #{orderId} has been updated to: {status}. Our tailors are detailing your dress to your exact specifications.",
  }
], "id");

// ---------- Cart & wishlist live per-user in localStorage ----------
const cartKey = (uid: string) => `ccd_cart_${uid}`;
const wishKey = (uid: string) => `ccd_wish_${uid}`;

export function getCart(uid: string): CartItem[] {
  try { return JSON.parse(localStorage.getItem(cartKey(uid)) || "[]"); }
  catch { return []; }
}
export function setCart(uid: string, items: CartItem[]) {
  localStorage.setItem(cartKey(uid), JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("ccd:cart", { detail: { uid } }));
}
export function onCartChange(uid: string, cb: (items: CartItem[]) => void) {
  const handler = () => cb(getCart(uid));
  window.addEventListener("ccd:cart", handler);
  window.addEventListener("storage", handler);
  cb(getCart(uid));
  return () => {
    window.removeEventListener("ccd:cart", handler);
    window.removeEventListener("storage", handler);
  };
}

export function getWishlist(uid: string): string[] {
  try { return JSON.parse(localStorage.getItem(wishKey(uid)) || "[]"); }
  catch { return []; }
}
export function setWishlist(uid: string, ids: string[]) {
  localStorage.setItem(wishKey(uid), JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent("ccd:wish", { detail: { uid } }));
}
export function onWishlistChange(uid: string, cb: (ids: string[]) => void) {
  const handler = () => cb(getWishlist(uid));
  window.addEventListener("ccd:wish", handler);
  window.addEventListener("storage", handler);
  cb(getWishlist(uid));
  return () => {
    window.removeEventListener("ccd:wish", handler);
    window.removeEventListener("storage", handler);
  };
}

// ---------- Order placement ----------
export async function placeOrder(o: Order): Promise<Order> {
  await ordersDB.add(o);
  return o;
}

// Utility to make short ids
export const uid = () => Math.random().toString(36).slice(2, 10).toUpperCase();

// Re-establish Firestore listeners when the user authentication state changes
if (isFirebaseEnabled && auth) {
  onAuthStateChanged(auth, () => {
    allCollections.forEach((col) => {
      col.setupFirestoreListener();
    });
  });
}
