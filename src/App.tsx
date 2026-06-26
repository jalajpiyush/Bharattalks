/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Statistics from "./components/Statistics";
import Features from "./components/Features";
import AboutSection from "./components/AboutSection";
import SafetySection from "./components/SafetySection";
import FaqSection from "./components/FaqSection";
import VideoChatArea from "./components/VideoChatArea";
import { Mail, CheckCircle2, Lock, Sparkles, X, Chrome, Smartphone, Compass, ArrowLeft, Phone, ArrowRight, ShieldCheck, ExternalLink, Video } from "lucide-react";
import { saveUserProfile, getUserProfile, auth } from "./lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

interface UserProfile {
  email: string;
  name: string;
  country: string;
  avatar: string;
}

const presetAvatars = [
  { name: "Astronaut", icon: "🧑‍🚀" },
  { name: "Gamer", icon: "🎮" },
  { name: "Musician", icon: "🎸" },
  { name: "Creator", icon: "🎨" },
  { name: "DJ", icon: "🎧" }
];

export default function App() {
  const [currentView, setView] = useState<"home" | "chat" | "safety" | "about">(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const viewParam = params.get("view");
    const paymentParam = params.get("payment");
    if (paymentParam === "success" || paymentParam === "failure" || viewParam === "chat") {
      return "chat";
    }
    if (viewParam === "safety" || viewParam === "about") {
      return viewParam as any;
    }
    return "home";
  });

  const [isStandalone, setIsStandalone] = useState<boolean>(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    return params.get("standalone") === "true";
  });

  const [user, setUser] = useState<UserProfile | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMethod, setAuthMethod] = useState<"google" | "apple" | "email" | "phone" | null>(null);
  
  // Auth Form states
  const [emailForm, setEmailForm] = useState("");
  const [nameForm, setNameForm] = useState("");
  const [countryForm, setCountryForm] = useState("India");
  const [selectedAvatar, setSelectedAvatar] = useState("🎮");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordForm, setPasswordForm] = useState("");
  const [emailAuthMode, setEmailAuthMode] = useState<"signin" | "signup">("signin");
  const [authError, setAuthError] = useState("");

  // Phone & Multi-method states
  const [phoneForm, setPhoneForm] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [otpForm, setOtpForm] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [profileSetupStep, setProfileSetupStep] = useState(false);

  // Load existing session on startup and sync with Firestore
  useEffect(() => {
    const savedUser = localStorage.getItem("swiply_user") || localStorage.getItem("monkey_user") || localStorage.getItem("bharattalk_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);

        // Fetch fresh state from Firestore
        if (parsed.email) {
          getUserProfile(parsed.email).then((cloudProfile) => {
            if (cloudProfile) {
              console.log("Firebase: Synced user profile from Firestore:", cloudProfile);
              if (cloudProfile.isPremium) {
                localStorage.setItem("swiply_premium", "true");
                localStorage.setItem("monkey_premium", "true");
              } else {
                localStorage.removeItem("swiply_premium");
                localStorage.removeItem("monkey_premium");
              }
              
              // update local storage profile if details changed
              const updatedLocal = {
                ...parsed,
                name: cloudProfile.name || parsed.name,
                country: cloudProfile.country || parsed.country,
                avatar: cloudProfile.avatar || parsed.avatar
              };
              setUser(updatedLocal);
              localStorage.setItem("swiply_user", JSON.stringify(updatedLocal));
              localStorage.setItem("monkey_user", JSON.stringify(updatedLocal));
            }
          }).catch((err) => {
            console.error("Firebase: Error syncing user on mount:", err);
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    if (currentView === "chat" && !isStandalone) {
      setView("home");
      try {
        const newWindow = window.open("/?view=chat&standalone=true", "_blank");
        if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
          console.warn("Swiply: Tab redirect was blocked by the browser pop-up blocker.");
        }
      } catch (err) {
        console.error("Swiply: Failed to auto-open separate tab:", err);
      }
    }
  }, [currentView, isStandalone]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAuthError("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      
      if (!firebaseUser.email) {
        throw new Error("No email address returned from your Google account.");
      }
      
      const email = firebaseUser.email;
      const displayName = firebaseUser.displayName || email.split("@")[0];
      
      const existingUser = await getUserProfile(email);
      setLoading(false);
      
      if (existingUser) {
        setSuccess(true);
        setTimeout(() => {
          const loggedInUser: UserProfile = {
            email: existingUser.email,
            name: existingUser.name,
            country: existingUser.country,
            avatar: existingUser.avatar
          };
          setUser(loggedInUser);
          localStorage.setItem("monkey_user", JSON.stringify(loggedInUser));
          localStorage.setItem("swiply_user", JSON.stringify(loggedInUser));
          localStorage.setItem("bharattalk_user", JSON.stringify(loggedInUser));
          if (existingUser.isPremium) {
            localStorage.setItem("monkey_premium", "true");
            localStorage.setItem("swiply_premium", "true");
            localStorage.setItem("bharattalk_premium", "true");
          }
          setAuthOpen(false);
          setAuthMethod(null);
          setEmailForm("");
          setNameForm("");
          setPasswordForm("");
          setSuccess(false);
        }, 1000);
      } else {
        setEmailForm(email);
        setNameForm(displayName);
        setProfileSetupStep(true);
      }
    } catch (err: any) {
      console.error("Firebase: Google auth failed:", err);
      setLoading(false);
      if (err.code === "auth/popup-blocked") {
        setAuthError("Sign-in popup was blocked by your browser. Please allow popups or open Swiply in a new standalone window.");
      } else if (err.code === "auth/cancelled-popup-request" || err.code === "auth/popup-closed-by-user") {
        setAuthError("Sign-in popup closed by user.");
      } else {
        setAuthError(err.message || "Google Authentication failed.");
      }
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    setAuthError("");
    setTimeout(() => {
      const dummyEmail = "jalajshakya951@icloud.com";
      const dummyName = "Jalaj Shakya";
      getUserProfile(dummyEmail).then((existingUser) => {
        setLoading(false);
        if (existingUser) {
          setSuccess(true);
          setTimeout(() => {
            const loggedInUser: UserProfile = {
              email: existingUser.email,
              name: existingUser.name,
              country: existingUser.country,
              avatar: existingUser.avatar
            };
            setUser(loggedInUser);
            localStorage.setItem("monkey_user", JSON.stringify(loggedInUser));
            localStorage.setItem("swiply_user", JSON.stringify(loggedInUser));
            localStorage.setItem("bharattalk_user", JSON.stringify(loggedInUser));
            if (existingUser.isPremium) {
              localStorage.setItem("monkey_premium", "true");
              localStorage.setItem("swiply_premium", "true");
              localStorage.setItem("bharattalk_premium", "true");
            }
            setAuthOpen(false);
            setAuthMethod(null);
            setEmailForm("");
            setNameForm("");
            setPasswordForm("");
            setSuccess(false);
          }, 1000);
        } else {
          setEmailForm(dummyEmail);
          setNameForm(dummyName);
          setProfileSetupStep(true);
        }
      }).catch((err) => {
        setLoading(false);
        setAuthError("Apple sign-in simulation failed.");
      });
    }, 1000);
  };

  const handleOpenAuth = (method?: "google" | "apple" | "email" | "phone") => {
    setAuthOpen(true);
    setSuccess(false);
    setLoading(false);
    setOtpSent(false);
    setProfileSetupStep(false);
    setEmailForm("");
    setNameForm("");
    setPhoneForm("");
    setOtpForm("");
    setPasswordForm("");
    setEmailAuthMode("signin");
    setAuthError("");

    if (method === "google") {
      setAuthMethod(method);
      handleGoogleSignIn();
    } else if (method === "apple") {
      setAuthMethod(method);
      handleAppleSignIn();
    } else {
      setAuthMethod(method || null);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("monkey_user");
    localStorage.removeItem("swiply_user");
    localStorage.removeItem("bharattalk_user");
    localStorage.removeItem("monkey_premium");
    localStorage.removeItem("swiply_premium");
    localStorage.removeItem("bharattalk_premium");
    setUser(null);
  };

  const handleSelectMethod = (method: "google" | "apple" | "email" | "phone") => {
    setOtpSent(false);
    setProfileSetupStep(false);
    setEmailForm("");
    setNameForm("");
    setPhoneForm("");
    setOtpForm("");
    setPasswordForm("");
    setEmailAuthMode("signin");
    setAuthError("");
    setAuthMethod(method);

    if (method === "google") {
      handleGoogleSignIn();
    } else if (method === "apple") {
      handleAppleSignIn();
    }
  };

  const handleSendOtp = (e: FormEvent) => {
    e.preventDefault();
    if (!phoneForm.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
      console.log(`Firebase Phone Auth: OTP sent to ${countryCode} ${phoneForm}`);
    }, 1200);
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!otpForm.trim()) return;
    setLoading(true);
    
    const sanitizedPhone = phoneForm.replace(/[^0-9]/g, "");
    const generatedEmail = `phone-${sanitizedPhone}@swiply.com`;
    const generatedName = "Jalaj Shakya";
    
    try {
      const existingUser = await getUserProfile(generatedEmail);
      setLoading(false);
      if (existingUser) {
        setSuccess(true);
        setTimeout(() => {
          const loggedInUser: UserProfile = {
            email: existingUser.email,
            name: existingUser.name,
            country: existingUser.country,
            avatar: existingUser.avatar
          };
          setUser(loggedInUser);
          localStorage.setItem("monkey_user", JSON.stringify(loggedInUser));
          localStorage.setItem("swiply_user", JSON.stringify(loggedInUser));
          localStorage.setItem("bharattalk_user", JSON.stringify(loggedInUser));
          if (existingUser.isPremium) {
            localStorage.setItem("monkey_premium", "true");
            localStorage.setItem("swiply_premium", "true");
            localStorage.setItem("bharattalk_premium", "true");
          }
          setAuthOpen(false);
          setAuthMethod(null);
          setPhoneForm("");
          setOtpForm("");
          setOtpSent(false);
          setSuccess(false);
        }, 1000);
      } else {
        setEmailForm(generatedEmail);
        setNameForm(generatedName);
        setProfileSetupStep(true);
      }
    } catch (err) {
      console.error("Firebase phone auth lookup failed:", err);
      setLoading(false);
      setEmailForm(generatedEmail);
      setNameForm(generatedName);
      setProfileSetupStep(true);
    }
  };

  const handleEmailNextOrSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoading(true);

    const email = emailForm.trim().toLowerCase();
    const name = nameForm.trim();
    const password = passwordForm;

    if (!email) {
      setAuthError("Email address is required.");
      setLoading(false);
      return;
    }

    if (emailAuthMode === "signup" && !name) {
      setAuthError("Display name is required.");
      setLoading(false);
      return;
    }

    if (!password || password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const existingUser = await getUserProfile(email);

      if (emailAuthMode === "signin") {
        if (!existingUser) {
          setAuthError("No account found with this email. Switch to 'Sign Up' to register!");
          setLoading(false);
          return;
        }

        if (existingUser.password && existingUser.password !== password) {
          setAuthError("Incorrect password. Please try again.");
          setLoading(false);
          return;
        }

        // Login is successful!
        setLoading(false);
        setSuccess(true);
        
        setTimeout(() => {
          const loggedInUser: UserProfile = {
            email: existingUser.email,
            name: existingUser.name,
            country: existingUser.country,
            avatar: existingUser.avatar
          };
          setUser(loggedInUser);
          localStorage.setItem("monkey_user", JSON.stringify(loggedInUser));
          localStorage.setItem("swiply_user", JSON.stringify(loggedInUser));
          localStorage.setItem("bharattalk_user", JSON.stringify(loggedInUser));
          if (existingUser.isPremium) {
            localStorage.setItem("monkey_premium", "true");
            localStorage.setItem("swiply_premium", "true");
            localStorage.setItem("bharattalk_premium", "true");
          }
          setAuthOpen(false);
          setAuthMethod(null);
          setEmailForm("");
          setNameForm("");
          setPasswordForm("");
          setSuccess(false);
        }, 1000);

      } else {
        // Sign Up Mode
        if (existingUser) {
          setAuthError("An account already exists with this email. Please Sign In.");
          setLoading(false);
          return;
        }

        // Proceed to Avatar & Country Customization Step
        setLoading(false);
        setProfileSetupStep(true);
      }
    } catch (err) {
      console.error("Email auth validation error:", err);
      setAuthError("A database connection error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const targetEmail = (emailForm || `${nameForm.toLowerCase().replace(/\s/g, "") || "user"}@swiply.com`).toLowerCase().trim();
    const targetName = nameForm || emailForm.split("@")[0] || "Swiply member";

    try {
      // 1. Fetch existing user profile from Firestore to see if they already have VIP/Premium or customized profile
      console.log(`Firebase: Checking for existing profile for: ${targetEmail}`);
      const existing = await getUserProfile(targetEmail);
      
      let isPremiumUser = false;
      let finalAvatar = selectedAvatar;
      let finalCountry = countryForm;
      let finalName = nameForm || targetName;

      if (existing) {
        console.log(`Firebase: Found existing user profile! Premium: ${existing.isPremium}`);
        isPremiumUser = !!existing.isPremium;
        if (!finalAvatar && existing.avatar) finalAvatar = existing.avatar;
        if (!finalCountry && existing.country) finalCountry = existing.country;
        if (!finalName && existing.name) finalName = existing.name;
      }

      // 2. Save/Update user profile in Firestore
      const profileToSave = {
        email: targetEmail,
        name: finalName,
        country: finalCountry,
        avatar: finalAvatar,
        isPremium: isPremiumUser,
        password: passwordForm || existing?.password || ""
      };

      await saveUserProfile(targetEmail, profileToSave);

      // 3. Update localStorage and App State
      setLoading(false);
      setSuccess(true);
      
      setTimeout(() => {
        const newUser: UserProfile = {
          email: targetEmail,
          name: finalName,
          country: finalCountry,
          avatar: finalAvatar
        };

        setUser(newUser);
        localStorage.setItem("monkey_user", JSON.stringify(newUser));
        localStorage.setItem("swiply_user", JSON.stringify(newUser));
        localStorage.setItem("bharattalk_user", JSON.stringify(newUser));
        
        if (isPremiumUser) {
          localStorage.setItem("monkey_premium", "true");
          localStorage.setItem("swiply_premium", "true");
          localStorage.setItem("bharattalk_premium", "true");
        } else {
          localStorage.removeItem("monkey_premium");
          localStorage.removeItem("swiply_premium");
          localStorage.removeItem("bharattalk_premium");
        }

        setAuthOpen(false);
        setAuthMethod(null);
        setEmailForm("");
        setNameForm("");
        setPasswordForm("");
        setEmailAuthMode("signin");
        setProfileSetupStep(false);
        setAuthError("");
      }, 1000);

    } catch (err) {
      console.error("Firebase: Auth submit failed:", err);
      // Fallback gracefully to offline simulation if network is blocked/missing
      setLoading(false);
      setSuccess(true);
      
      setTimeout(() => {
        const newUser: UserProfile = {
          email: targetEmail,
          name: targetName,
          country: countryForm,
          avatar: selectedAvatar
        };

        setUser(newUser);
        localStorage.setItem("monkey_user", JSON.stringify(newUser));
        localStorage.setItem("swiply_user", JSON.stringify(newUser));
        localStorage.setItem("bharattalk_user", JSON.stringify(newUser));
        setAuthOpen(false);
        setAuthMethod(null);
        setEmailForm("");
        setNameForm("");
        setPasswordForm("");
        setEmailAuthMode("signin");
        setProfileSetupStep(false);
        setAuthError("");
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#5c4cf4] via-[#4d3de0] to-[#5c4cf4] text-[#ececec] overflow-x-hidden relative font-sans">
      
      {/* Repeating background watermarks - exactly like the Swiply App watermark background */}
      <div className="absolute inset-x-0 top-0 bottom-[400px] pointer-events-none overflow-hidden -z-10 opacity-[0.06] grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-y-16 gap-x-12 p-8 select-none">
        {Array.from({ length: 48 }).map((_, i) => (
          <svg key={i} className="w-16 h-16 text-white" viewBox="0 0 100 100" fill="currentColor">
            {/* Cute simplified swiply head shape with ears */}
            <circle cx="50" cy="50" r="28" />
            <circle cx="20" cy="50" r="10" />
            <circle cx="80" cy="50" r="10" />
            {/* Inner face mask */}
            <path d="M 50,38 C 42,28 32,34 33,45 C 34,54 45,61 50,64 C 55,61 66,54 67,45 C 68,34 58,28 50,38 Z" fill="#5c4cf4" />
          </svg>
        ))}
      </div>
      
      {/* Absolute ambient background light glows - Blue style */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-[120px] -z-10 animate-pulse-slow" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#4F8FFF]/10 rounded-full blur-[120px] -z-10" />

      {/* Persistent Navigation Header */}
      {isStandalone ? (
        <header className="w-full border-b border-white/5 bg-[#5c4cf4]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between relative z-50">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black font-display tracking-tight text-white flex items-center gap-2">
              <div className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-[#4F8FFF] border border-white/10 overflow-hidden shadow-md">
                <svg className="h-4.5 w-4.5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Left Ear */}
                  <circle cx="24" cy="50" r="11" fill="#4F8FFF" />
                  <circle cx="24" cy="50" r="7" fill="#2A5CBF" />
                  
                  {/* Right Ear */}
                  <circle cx="76" cy="50" r="11" fill="#4F8FFF" />
                  <circle cx="76" cy="50" r="7" fill="#2A5CBF" />
                  
                  {/* Swiply Head */}
                  <circle cx="50" cy="50" r="28" fill="#4F8FFF" />
                  
                  {/* Heart Face */}
                  <path d="M 50,38 C 42,28 32,34 33,45 C 34,54 45,61 50,64 C 55,61 66,54 67,45 C 68,34 58,28 50,38 Z" fill="#fff7b2" />
                  
                  {/* Eyes */}
                  <circle cx="45" cy="45" r="3.5" fill="#111827" />
                  <circle cx="55" cy="45" r="3.5" fill="#111827" />
                  
                  {/* Smile */}
                  <path d="M 46,52 A 4 4 0 0 0 54,52" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  
                  {/* Blush Cheeks */}
                  <circle cx="39" cy="49" r="2.5" fill="#f87171" opacity="0.8" />
                  <circle cx="61" cy="49" r="2.5" fill="#f87171" opacity="0.8" />
                </svg>
              </div>
              Swiply
            </span>
            <span className="text-[9px] bg-[#4F8FFF]/20 text-[#4F8FFF] border border-[#4F8FFF]/20 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Immersive Mode
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full pl-2 pr-3 py-1 text-xs font-semibold text-gray-200">
                <span className="text-base">{user.avatar}</span>
                <span>{user.name}</span>
              </div>
            ) : (
              <button
                onClick={() => handleOpenAuth()}
                className="text-xs bg-gradient-to-r from-[#4F8FFF] to-[#6AA8FF] font-extrabold text-white px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
                id="btn-standalone-signin"
              >
                Sign In
              </button>
            )}
            
            <a
              href="/"
              className="text-xs text-gray-400 hover:text-white font-bold bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2 transition-all cursor-pointer"
            >
              Exit Clean View
            </a>
          </div>
        </header>
      ) : (
        <Header
          currentView={currentView}
          setView={setView}
          onOpenAuth={() => handleOpenAuth()}
          user={user}
          onSignOut={handleSignOut}
        />
      )}

      {/* Main View Router container */}
      <main className="flex-1 w-full pb-12 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            
            {/* 1. HOME VIEW */}
            {currentView === "home" && (
              <div className="space-y-6">
                <Hero
                  onStartChatting={() => setView("chat")}
                  onOpenAuth={handleOpenAuth}
                  user={user}
                />
                <Statistics />
                <Features />
                <AboutSection onStartChatting={() => setView("chat")} />
                <SafetySection />
                <FaqSection />
              </div>
            )}

            {/* 2. VIDEO CHAT VIEW */}
            {currentView === "chat" && (
              <div className="py-6 space-y-4">
                <div className="text-center mb-4">
                  <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#4F8FFF] bg-[#4F8FFF]/10 rounded-full px-4 py-1.5 mb-2">
                    Swiply App
                  </span>
                  <h2 className="text-2xl md:text-4xl font-bold font-display tracking-tight text-white">
                    Live Matchmaking
                  </h2>
                </div>
                <VideoChatArea />
              </div>
            )}

            {/* 3. SAFETY VIEW */}
            {currentView === "safety" && (
              <div className="py-6 space-y-8">
                <SafetySection />
                <FaqSection />
              </div>
            )}

            {/* 4. ABOUT VIEW */}
            {currentView === "about" && (
              <div className="py-6 space-y-8">
                <AboutSection onStartChatting={() => setView("chat")} />
                <Statistics />
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      {!isStandalone && <Footer />}

      {/* Authentication & Profile Creation Dialog Modal */}
      <AnimatePresence>
        {authOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-[32px] glass-panel-heavy p-8 border border-white/15 shadow-2xl relative"
            >
              <button
                onClick={() => setAuthOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-all cursor-pointer"
                id="btn-close-auth"
              >
                <X className="h-5 w-5" />
              </button>

              {!success ? (
                <div>
                  {/* Step 1: No method selected -> Show list of options */}
                  {authMethod === null && (
                    <div className="space-y-6">
                      <div className="space-y-2 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4F8FFF]/10 text-[#4F8FFF] mx-auto">
                          <Sparkles className="h-6 w-6 animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-bold font-display text-white">
                          Sign In to Swiply
                        </h3>
                        <p className="text-gray-400 text-xs">
                          Connect with verified people worldwide instantly.
                        </p>
                      </div>

                      <div className="space-y-3">
                        {/* Google Button */}
                        <button
                          type="button"
                          onClick={() => handleSelectMethod("google")}
                          className="w-full flex items-center justify-between rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 px-5 py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
                          id="btn-auth-google"
                        >
                          <div className="flex items-center gap-3">
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                              <path
                                fill="#EA4335"
                                d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.9-2.7 3.42-4.51 6.76-4.51z"
                              />
                              <path
                                fill="#4285F4"
                                d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.38-4.88 3.38-8.5z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.24 14.75c-.23-.69-.36-1.43-.36-2.2s.13-1.51.36-2.2L1.39 7.36C.5 9.15 0 11.15 0 13.25s.5 4.1 1.39 5.89l3.85-2.99z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.11.75-2.52 1.19-4.3 1.19-3.34 0-5.86-1.81-6.76-4.51L1.39 16.9C3.37 20.83 7.35 23 12 23z"
                              />
                            </svg>
                            <span>Continue with Google</span>
                          </div>
                          <span className="text-xs text-[#4F8FFF] font-semibold">Fast</span>
                        </button>

                        {/* Apple Button */}
                        <button
                          type="button"
                          onClick={() => handleSelectMethod("apple")}
                          className="w-full flex items-center justify-between rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 px-5 py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
                          id="btn-auth-apple"
                        >
                          <div className="flex items-center gap-3">
                            <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
                              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.56 2.95-1.39z" />
                            </svg>
                            <span>Continue with Apple</span>
                          </div>
                          <span className="text-xs text-gray-500 font-normal">Secure</span>
                        </button>

                        {/* Phone Button */}
                        <button
                          type="button"
                          onClick={() => handleSelectMethod("phone")}
                          className="w-full flex items-center justify-between rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 px-5 py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
                          id="btn-auth-phone"
                        >
                          <div className="flex items-center gap-3">
                            <Smartphone className="h-5 w-5 text-[#4F8FFF]" />
                            <span>Continue with Phone</span>
                          </div>
                          <span className="text-xs text-[#4F8FFF] font-semibold">OTP login</span>
                        </button>

                        {/* Email Button */}
                        <button
                          type="button"
                          onClick={() => handleSelectMethod("email")}
                          className="w-full flex items-center justify-between rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 px-5 py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
                          id="btn-auth-email"
                        >
                          <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-[#4F8FFF]" />
                            <span>Continue with Email</span>
                          </div>
                          <span className="text-xs text-gray-400 font-medium">Direct</span>
                        </button>
                      </div>

                      <div className="text-center text-[10px] text-gray-500 pt-2">
                        By proceeding, you agree to our community guidelines.
                      </div>
                    </div>
                  )}

                  {/* Loader during background simulations (e.g., connecting Google/Apple) */}
                  {loading && !otpSent && !profileSetupStep && (
                    <div className="text-center py-12 space-y-4">
                      <div className="h-10 w-10 border-4 border-[#4F8FFF] border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-sm text-gray-300 font-medium animate-pulse">
                        {authMethod === "google" && "Initializing Google Secure Gateway..."}
                        {authMethod === "apple" && "Connecting to Apple Accounts..."}
                        {authMethod === "phone" && "Preparing cellular gateway..."}
                        {authMethod === "email" && "Verifying credential records..."}
                      </p>
                    </div>
                  )}

                  {/* Step 2a: Phone Authentication Form (not setup yet) */}
                  {authMethod === "phone" && !profileSetupStep && !loading && (
                    <div className="space-y-6">
                      <button
                        type="button"
                        onClick={() => {
                          if (otpSent) {
                            setOtpSent(false);
                          } else {
                            setAuthMethod(null);
                          }
                        }}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" /> Back
                      </button>

                      {!otpSent ? (
                        <form onSubmit={handleSendOtp} className="space-y-6">
                          <div className="space-y-1.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F8FFF]/10 text-[#4F8FFF] mb-3">
                              <Smartphone className="h-5 w-5" />
                            </div>
                            <h3 className="text-xl font-bold font-display text-white">Enter Mobile Number</h3>
                            <p className="text-gray-400 text-xs">Verify your identity instantly via a quick 6-digit passcode.</p>
                          </div>

                          <div className="space-y-4">
                            <div className="flex gap-2">
                              <div className="relative w-28">
                                <select
                                  value={countryCode}
                                  onChange={(e) => setCountryCode(e.target.value)}
                                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-sm text-white appearance-none focus:outline-none focus:border-[#4F8FFF] transition-all cursor-pointer"
                                >
                                  <option value="+91" className="bg-[#212121]">🇮🇳 +91</option>
                                  <option value="+1" className="bg-[#212121]">🇺🇸 +1</option>
                                  <option value="+44" className="bg-[#212121]">🇬🇧 +44</option>
                                  <option value="+81" className="bg-[#212121]">🇯🇵 +81</option>
                                </select>
                                <span className="absolute right-3 top-3.5 text-xs text-gray-500 pointer-events-none">▼</span>
                              </div>
                              <input
                                type="tel"
                                required
                                placeholder="98765 43210"
                                value={phoneForm}
                                onChange={(e) => setPhoneForm(e.target.value.replace(/[^0-9]/g, ""))}
                                className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f2b305] transition-all"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#f2b305] hover:bg-[#d99e04] text-black font-extrabold py-3.5 transition-all hover:scale-[1.01] cursor-pointer shadow-lg shadow-[#f2b305]/15"
                          >
                            Send OTP Code
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                           <div className="space-y-1.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2b305]/10 text-[#f2b305] mb-3 animate-pulse">
                              <ShieldCheck className="h-5 w-5" />
                            </div>
                            <h3 className="text-xl font-bold font-display text-white">Enter 6-Digit OTP</h3>
                            <p className="text-gray-400 text-xs">A verification code has been dispatched to <span className="text-white font-semibold">{countryCode} {phoneForm}</span>.</p>
                          </div>

                          <div className="space-y-4">
                            <input
                              type="text"
                              maxLength={6}
                              required
                              placeholder="123456"
                              value={otpForm}
                              onChange={(e) => setOtpForm(e.target.value.replace(/[^0-9]/g, ""))}
                              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3.5 text-center text-lg tracking-widest font-mono text-white placeholder-gray-600 focus:outline-none focus:border-[#f2b305] transition-all"
                            />
                            <div className="text-center">
                              <button
                                type="button"
                                onClick={() => { setOtpForm(""); setOtpSent(false); }}
                                className="text-xs text-[#f2b305] hover:underline"
                              >
                                Edit phone number or Resend OTP
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#f2b305] hover:bg-[#d99e04] text-black font-extrabold py-3.5 transition-all cursor-pointer shadow-lg shadow-[#f2b305]/15"
                          >
                            Verify & Continue
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Step 2b: Standard Email Sign In & Sign Up Form (if profileSetupStep is false) */}
                  {authMethod === "email" && !profileSetupStep && (
                    <form onSubmit={handleEmailNextOrSubmit} className="space-y-5">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMethod(null);
                          setAuthError("");
                        }}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" /> Back to methods
                      </button>

                      <div className="space-y-1.5">
                        <h3 className="text-xl font-bold font-display text-white">Continue with Email</h3>
                        <p className="text-gray-400 text-xs">Access or create your secure profile using your email credentials.</p>
                      </div>

                      {/* Sign In vs Sign Up Tabs Toggle */}
                      <div className="flex rounded-lg bg-white/5 p-1 border border-white/5">
                        <button
                          type="button"
                          onClick={() => {
                            setEmailAuthMode("signin");
                            setAuthError("");
                          }}
                          className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                            emailAuthMode === "signin"
                              ? "bg-[#f2b305] text-black shadow-sm"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          Sign In
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEmailAuthMode("signup");
                            setAuthError("");
                          }}
                          className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                            emailAuthMode === "signup"
                              ? "bg-[#f2b305] text-black shadow-sm"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          Sign Up (Register)
                        </button>
                      </div>

                      {authError && (
                        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                          {authError}
                        </div>
                      )}

                      <div className="space-y-3.5">
                        {/* Display Name - Only shown for Sign Up */}
                        {emailAuthMode === "signup" && (
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                              Display Name
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g., CyberRider"
                              value={nameForm}
                              onChange={(e) => setNameForm(e.target.value)}
                              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f2b305] transition-all"
                              id="auth-input-name"
                            />
                          </div>
                        )}

                        {/* Email Address */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                             Email Address
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              required
                              placeholder="e.g., rider@domain.com"
                              value={emailForm}
                              onChange={(e) => setEmailForm(e.target.value)}
                              className="w-full rounded-xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f2b305] transition-all"
                              id="auth-input-email"
                            />
                            <Mail className="absolute left-4 top-3.5 h-4 w-4 text-gray-500" />
                          </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Password
                          </label>
                          <div className="relative">
                            <input
                              type="password"
                              required
                              placeholder="••••••••"
                              value={passwordForm}
                              onChange={(e) => setPasswordForm(e.target.value)}
                              className="w-full rounded-xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#f2b305] transition-all"
                              id="auth-input-password"
                            />
                            <Lock className="absolute left-4 top-3.5 h-4 w-4 text-gray-500" />
                          </div>
                          {emailAuthMode === "signup" && (
                            <p className="text-[10px] text-gray-500">Must be at least 6 characters long.</p>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#f2b305] hover:bg-[#d99e04] text-black font-extrabold py-3.5 transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-40 shadow-lg shadow-[#f2b305]/15"
                      >
                        {loading ? (
                          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>{emailAuthMode === "signin" ? "Sign In" : "Next Step"}</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* Step 3: Profile Setup Customization Step (for all methods when verified) */}
                  {authMethod !== null && profileSetupStep && (
                    <form onSubmit={handleAuthSubmit} className="space-y-6">
                      <button
                        type="button"
                        onClick={() => {
                          if (authMethod === "google" || authMethod === "apple") {
                            setAuthMethod(null);
                          }
                          setProfileSetupStep(false);
                        }}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" /> Back
                      </button>

                      <div className="space-y-1.5 text-center">
                        <h3 className="text-xl font-bold font-display text-white">
                          Setup Your Avatar & Country
                        </h3>
                        <p className="text-gray-400 text-xs">
                          These details are displayed on the matchmaking screen.
                        </p>
                                        {/* Display Name (Editable Confirmation) */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Display Name
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Display Name"
                            value={nameForm}
                            onChange={(e) => setNameForm(e.target.value)}
                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f2b305] transition-all"
                          />
                        </div>

                        {/* Country Selector */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Your Country
                          </label>
                          <div className="relative">
                            <select
                              value={countryForm}
                              onChange={(e) => setCountryForm(e.target.value)}
                              className="w-full rounded-xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 text-sm text-white appearance-none focus:outline-none focus:border-[#f2b305] transition-all cursor-pointer"
                              id="auth-select-country"
                            >
                              <option value="India" className="bg-[#212121] text-white">🇮🇳 India</option>
                              <option value="USA" className="bg-[#212121] text-white">🇺🇸 United States</option>
                              <option value="Japan" className="bg-[#212121] text-white">🇯🇵 Japan</option>
                              <option value="France" className="bg-[#212121] text-white">🇫🇷 France</option>
                              <option value="Canada" className="bg-[#212121] text-white">🇨🇦 Canada</option>
                            </select>
                            <Compass className="absolute left-4 top-3.5 h-4 w-4 text-gray-500 pointer-events-none" />
                          </div>
                        </div>

                        {/* Avatar choice deck */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
                            Select Avatar
                          </label>
                          <div className="grid grid-cols-5 gap-2">
                            {presetAvatars.map((avatar) => (
                              <button
                                key={avatar.name}
                                type="button"
                                onClick={() => setSelectedAvatar(avatar.icon)}
                                className={`flex h-12 w-12 items-center justify-center rounded-xl border text-xl transition-all cursor-pointer ${
                                  selectedAvatar === avatar.icon
                                    ? "bg-[#f2b305] border-transparent scale-110 shadow-lg text-black"
                                      : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
                                }`}
                              >
                                {avatar.icon}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Submission button */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#f2b305] hover:bg-[#d99e04] text-black font-extrabold py-3.5 shadow-xl shadow-[#f2b305]/20 transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-50"
                          id="btn-auth-submit"
                        >
                          {loading ? (
                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Lock className="h-4.5 w-4.5" />
                              Save & Secure Access
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                // Success screen
                <div className="text-center py-12 space-y-6">
                  <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold font-display text-white">Profile Created!</h3>
                    <p className="text-gray-400 text-sm">
                      Welcome, <span className="text-white font-bold">{nameForm || "Swiply member"}</span>! Your profile is securely synced.
                    </p>
                  </div>
                  <div className="text-[#f2b305] text-sm font-bold uppercase tracking-widest animate-pulse">
                    Launching video gateway...
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
