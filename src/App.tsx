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
import { Mail, CheckCircle2, Lock, Sparkles, X, Chrome, Smartphone, Compass } from "lucide-react";

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

  // Load existing session on startup
  useEffect(() => {
    const savedUser = localStorage.getItem("bharattalk_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleOpenAuth = (method?: "google" | "apple" | "email" | "phone") => {
    setAuthMethod(method || "email");
    setAuthOpen(true);
    setSuccess(false);
    setLoading(false);
  };

  const handleSignOut = () => {
    localStorage.removeItem("bharattalk_user");
    setUser(null);
  };

  const handleAuthSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate database lookup or signup flow
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      
      setTimeout(() => {
        const newUser: UserProfile = {
          email: emailForm || `${nameForm.toLowerCase().replace(/\s/g, "") || "user"}@bharattalk.com`,
          name: nameForm || emailForm.split("@")[0] || "BharatTalker",
          country: countryForm,
          avatar: selectedAvatar
        };

        setUser(newUser);
        localStorage.setItem("bharattalk_user", JSON.stringify(newUser));
        setAuthOpen(false);
        setAuthMethod(null);
        setEmailForm("");
        setNameForm("");
      }, 1500);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0d0d0d] via-[#171717] to-[#0d0d0d] text-[#ececec] overflow-x-hidden relative font-sans">
      
      {/* Absolute ambient background light glows - ChatGPT style */}
      <div className="absolute top-[-100px] left-[-100px] w-80 h-80 bg-[#10a37f]/10 rounded-full blur-[120px] -z-10 animate-pulse-slow" />
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-[#10a37f]/5 rounded-full blur-[120px] -z-10" />

      {/* Persistent Navigation Header */}
      {isStandalone ? (
        <header className="w-full border-b border-white/5 bg-[#121212]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between relative z-50">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black font-display tracking-tight text-white flex items-center gap-1.5">
              <span className="text-[#10a37f] animate-pulse">●</span> BharatTalk
            </span>
            <span className="text-[9px] bg-[#10a37f]/10 text-[#10a37f] border border-[#10a37f]/20 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
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
                className="text-xs bg-[#10a37f] hover:bg-[#0fa47f] font-bold text-white px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
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
                  <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#F43F5E] bg-[#F43F5E]/10 rounded-full px-4 py-1.5 mb-2">
                    BharatTalk App
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
                <form onSubmit={handleAuthSubmit} className="space-y-6">
                  
                  {/* Header info */}
                  <div className="space-y-2 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#10a37f]/10 text-[#10a37f] mx-auto">
                      <Sparkles className="h-6 w-6 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-bold font-display text-white">
                      Create Your Profile
                    </h3>
                    <p className="text-gray-400 text-xs">
                      Join BharatTalk to start matching with friendly strangers.
                    </p>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-4">
                    
                    {/* Display Nickname */}
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
                        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#10a37f] transition-all"
                        id="auth-input-name"
                      />
                    </div>

                    {/* Email credential */}
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
                          className="w-full rounded-xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#10a37f] transition-all"
                          id="auth-input-email"
                        />
                        <Mail className="absolute left-4 top-3.5 h-4 w-4 text-gray-500" />
                      </div>
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
                          className="w-full rounded-xl bg-white/5 border border-white/10 pl-11 pr-4 py-3 text-sm text-white appearance-none focus:outline-none focus:border-[#10a37f] transition-all"
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
                                ? "bg-[#10a37f] border-transparent scale-110 shadow-lg"
                                : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
                            }`}
                          >
                            {avatar.icon}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Submission buttons */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#10a37f] hover:bg-[#0fa47f] text-white font-bold py-3.5 shadow-xl shadow-[#10a37f]/20 transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-50"
                      id="btn-auth-submit"
                    >
                      {loading ? (
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Lock className="h-4.5 w-4.5" />
                          Secure Account Creation
                        </>
                      )}
                    </button>
                  </div>

                  {/* Trust disclaimer */}
                  <div className="text-center text-[10px] text-gray-500">
                    By proceeding, you agree to our community guidelines.
                  </div>

                </form>
              ) : (
                // Success screen
                <div className="text-center py-12 space-y-6">
                  <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold font-display text-white">Profile Created!</h3>
                    <p className="text-gray-400 text-sm">
                      Namaste, <span className="text-white font-bold">{nameForm || "BharatTalker"}</span>! Your profile is securely synced.
                    </p>
                  </div>
                  <div className="text-indigo-400 text-xs font-bold uppercase tracking-widest animate-pulse">
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
