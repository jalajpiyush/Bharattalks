import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, getDocFromServer } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import config from "../../firebase-applet-config.json";

// Initialize Firebase
const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
};

export const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Use custom Firestore Database ID if present
export const db = config.firestoreDatabaseId 
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);

// Keep console logs clear for developers
console.log("Swiply Firebase: Client connected to project:", config.projectId);

/**
 * Validates connection to Firestore. Required by firestore guidelines.
 */
export async function testConnection() {
  try {
    await getDoc(doc(db, "test", "connection"));
    console.log("Swiply Firebase: Connection initialized.");
  } catch (error: any) {
    console.warn("Swiply Firebase: Connection initializing in background:", error.message || error);
  }
}

// Perform test connection on startup
testConnection();

export interface UserProfile {
  email: string;
  name: string;
  country: string;
  avatar: string;
  isPremium?: boolean;
  createdAt?: string;
  password?: string;
}

/**
 * Saves or updates a user profile in Firestore under the 'users' collection.
 * Uses email as the document ID for single lookup simplicity.
 */
export async function saveUserProfile(email: string, profile: Partial<UserProfile>): Promise<void> {
  if (!email) return;
  const sanitizedId = email.toLowerCase().trim();
  const docRef = doc(db, "users", sanitizedId);
  
  // Fetch existing if we need to merge fields like isPremium
  let currentProfile: Partial<UserProfile> = {};
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      currentProfile = snap.data() as UserProfile;
    }
  } catch (e) {
    console.error("Firebase: Error reading user profile prior to update:", e);
  }

  const mergedProfile: UserProfile = {
    email: sanitizedId,
    name: profile.name || currentProfile.name || email.split("@")[0],
    country: profile.country || currentProfile.country || "India",
    avatar: profile.avatar || currentProfile.avatar || "🎮",
    isPremium: profile.isPremium !== undefined ? profile.isPremium : (currentProfile.isPremium || false),
    createdAt: currentProfile.createdAt || new Date().toISOString(),
    password: profile.password || currentProfile.password || ""
  };

  try {
    await setDoc(docRef, mergedProfile);
    console.log(`Firebase: User profile saved successfully for: ${sanitizedId}`);
  } catch (error) {
    console.error("Firebase: Error saving user profile:", error);
    throw error;
  }
}

/**
 * Retrieves a user profile from Firestore by email.
 */
export async function getUserProfile(email: string): Promise<UserProfile | null> {
  if (!email) return null;
  const sanitizedId = email.toLowerCase().trim();
  const docRef = doc(db, "users", sanitizedId);
  
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Firebase: Error fetching user profile:", error);
    return null;
  }
}

/**
 * Logs a PayU transaction record in Firestore under the 'payments' collection.
 */
export async function savePaymentRecord(payment: {
  txnid: string;
  amount: string;
  email: string;
  firstname?: string;
  phone?: string;
  plan?: string;
}): Promise<void> {
  const paymentId = payment.txnid;
  const docRef = doc(db, "payments", paymentId);
  
  const paymentRecord = {
    txnid: paymentId,
    amount: payment.amount,
    email: payment.email.toLowerCase().trim(),
    firstname: payment.firstname || "",
    phone: payment.phone || "",
    plan: payment.plan || "monthly",
    timestamp: new Date().toISOString()
  };

  try {
    await setDoc(docRef, paymentRecord);
    console.log(`Firebase: Saved payment record ${paymentId} successfully.`);

    // Also update the corresponding user's premium status in Firestore!
    await saveUserProfile(payment.email, { isPremium: true });
  } catch (error) {
    console.error("Firebase: Error logging payment record:", error);
    throw error;
  }
}
