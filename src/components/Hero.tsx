/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Video, KeyRound, Smartphone, Mail, Chrome } from "lucide-react";
import { motion } from "motion/react";

interface HeroProps {
  onStartChatting: () => void;
  onOpenAuth: (method?: "google" | "apple" | "email" | "phone") => void;
  user: { email: string; name?: string; country?: string; avatar?: string; } | null;
}

export default function Hero({ onStartChatting, onOpenAuth, user }: HeroProps) {
  // Real-time live statistics from our server and Firestore DB
  const [stats, setStats] = useState({
    activeUsers: 14,
    registeredUsers: 1240,
    totalOnline: 186
  });

  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      try {
        // Resolve to a fully qualified absolute URL to bypass WebKit iframe relative-resolution bugs
        const statsUrl = new URL("/api/stats/online", window.location.href).href;
        const res = await fetch(statsUrl);
        if (res.ok && active) {
          const data = await res.json();
          setStats({
            activeUsers: data.activeUsers,
            registeredUsers: data.registeredUsers,
            totalOnline: data.totalOnline
          });
        }
      } catch (err) {
        console.error("Failed to fetch online stats:", err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Facepile avatar photos
  const happyUsers = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=80&h=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=80&h=80",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=80&h=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=80&h=80"
  ];

  return (
    <section className="relative w-full px-4 pt-4 pb-16 md:px-8 max-w-7xl mx-auto overflow-hidden min-h-[calc(100vh-80px)] flex flex-col justify-center">
      {/* Repeating background watermarks - exactly like the Swiply App watermark background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 opacity-[0.06] grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-y-16 gap-x-12 p-8 select-none">
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

      {/* Radiant glow spots to keep depth but in purple branding */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-white/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 relative z-10 w-full">
        
        {/* Left Column: Authentic Swiply Login Area */}
        <div className="lg:col-span-5 space-y-8 flex flex-col justify-center">
          
          <div className="space-y-4 text-left">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black font-display tracking-tight text-white leading-[1.05] uppercase">
              Make New <br />
              Friends Face- <br />
              to-Face
            </h1>
          </div>

          {!user ? (
            <div className="space-y-6 max-w-md">
              {/* Google Button - Pill shape, white background, centered */}
              <button
                onClick={() => onOpenAuth("google")}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold text-base py-3.5 px-6 rounded-full shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer"
                id="btn-swiply-google"
              >
                {/* Custom Google Icon */}
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.87-4.53-5.84-4.53z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                Connect with Google
              </button>

              {/* OR Divider with lines */}
              <div className="flex items-center gap-4">
                <div className="h-[1px] flex-1 bg-white/20" />
                <span className="text-xs font-black text-white/50 tracking-widest uppercase">OR</span>
                <div className="h-[1px] flex-1 bg-white/20" />
              </div>

              {/* Circles Row: Facebook, Apple, TikTok, Email */}
              <div className="flex items-center justify-center gap-4 py-1">
                {/* Facebook Button */}
                <button
                  onClick={() => onOpenAuth("google")}
                  className="w-14 h-14 rounded-full bg-[#1877F2] hover:bg-[#166FE5] flex items-center justify-center text-white shadow-md transition-all cursor-pointer hover:scale-110"
                  id="btn-swiply-facebook"
                  title="Connect with Facebook"
                >
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>

                {/* Apple Button */}
                <button
                  onClick={() => onOpenAuth("apple")}
                  className="w-14 h-14 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-black shadow-md transition-all cursor-pointer hover:scale-110"
                  id="btn-swiply-apple"
                  title="Connect with Apple"
                >
                  <span className="text-2xl font-bold leading-none select-none translate-y-[-1px]"></span>
                </button>

                {/* TikTok Button */}
                <button
                  onClick={() => onOpenAuth("phone")}
                  className="w-14 h-14 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-black shadow-md transition-all cursor-pointer hover:scale-110"
                  id="btn-swiply-tiktok"
                  title="Connect with TikTok"
                >
                  {/* Custom TikTok Icon */}
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.52-4.06-1.39-.63-.47-1.18-1.07-1.58-1.78v7.27c-.02 2.39-1.07 4.79-2.95 6.22-1.89 1.44-4.55 1.95-6.86 1.31-2.27-.63-4.26-2.31-5.18-4.5-.93-2.19-.74-4.83.47-6.85 1.2-2 3.44-3.32 5.79-3.43V8.4c-1.22.06-2.42.54-3.32 1.39-.94.88-1.47 2.15-1.51 3.43-.07 1.57.65 3.17 1.88 4.13 1.23.97 2.94 1.25 4.45.82 1.48-.42 2.71-1.6 3.13-3.07.13-.48.18-.98.17-1.48V.02z"/>
                  </svg>
                </button>

                {/* Email/Envelope Button */}
                <button
                  onClick={() => onOpenAuth("email")}
                  className="w-14 h-14 rounded-full bg-[#34B4FF] hover:bg-[#1DA1F2] flex items-center justify-center text-white shadow-md transition-all cursor-pointer hover:scale-110"
                  id="btn-swiply-email"
                  title="Connect with Email"
                >
                  <Mail className="w-6 h-6 fill-transparent stroke-[2.5px]" />
                </button>
              </div>

              {/* Consent checkmarks */}
              <div className="space-y-3 pt-4 text-left border-t border-white/10">
                <p className="text-[11px] text-white/70 font-semibold uppercase tracking-wider">
                  By creating account or logging in, you certify that
                </p>
                
                {/* Checkbox 1 */}
                <label className="flex items-start gap-3 cursor-pointer group select-none">
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="peer sr-only"
                      id="checkbox-age"
                    />
                    <div className="h-5 w-5 rounded bg-white/10 border border-white/20 peer-checked:bg-white peer-checked:border-white transition-all flex items-center justify-center">
                      <svg className="h-3 w-3 text-[#5c4cf4] opacity-0 peer-checked:opacity-100 transition-opacity fill-current" viewBox="0 0 20 20">
                        <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-xs text-white/85 font-medium group-hover:text-white transition-colors">
                    I am at least 18 years old.
                  </span>
                </label>

                {/* Checkbox 2 */}
                <label className="flex items-start gap-3 cursor-pointer group select-none">
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="peer sr-only"
                      id="checkbox-terms"
                    />
                    <div className="h-5 w-5 rounded bg-white/10 border border-white/20 peer-checked:bg-white peer-checked:border-white transition-all flex items-center justify-center">
                      <svg className="h-3 w-3 text-[#5c4cf4] opacity-0 peer-checked:opacity-100 transition-opacity fill-current" viewBox="0 0 20 20">
                        <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-xs text-white/85 font-medium group-hover:text-white transition-colors leading-normal">
                    I have read and agree to the{" "}
                    <a href="#terms" className="underline font-bold hover:text-[#ffe600]">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#privacy" className="underline font-bold hover:text-[#ffe600]">
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>
              </div>
            </div>
          ) : (
            // Logged-in dashboard area: premium match options
            <div className="space-y-6 max-w-md bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-[#f2b305] text-black font-bold flex items-center justify-center text-xl shadow-md border border-white/20">
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-none">Logged in as {user.name || user.email.split("@")[0]}</h3>
                  <p className="text-xs text-[#ffe600] font-mono mt-1">Ready for face-to-face chat</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={onStartChatting}
                  className="w-full bg-[#ffe600] hover:bg-yellow-300 text-black font-black uppercase text-sm tracking-widest py-4.5 rounded-2xl shadow-[0_5px_0_#9d8100] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer border border-yellow-400/20"
                  id="btn-swiply-start-chat"
                >
                  <Video className="h-5 w-5" />
                  Start Matchmaking
                </button>
                
                <p className="text-[10px] text-white/60 text-center font-mono uppercase tracking-wider">
                  Connected via verified Google account
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Replicated Split-screen Video and Banner Ad */}
        <div className="lg:col-span-7 relative flex items-center justify-center w-full">
          
          {/* Main rounded-[32px] split frame - EXACTLY like the screenshot */}
          <div className="relative w-full max-w-[620px] aspect-[4/3] sm:aspect-[1.33] bg-[#090D16] border-[6px] border-white/15 rounded-[32px] shadow-2xl overflow-hidden flex flex-col justify-end group">
            
            {/* The side-by-side videos grid */}
            <div className="absolute inset-0 grid grid-cols-2 gap-[2px] bg-white/10">
              
              {/* Left video preview: Beautiful smiling woman matching reference */}
              <div className="relative h-full w-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?auto=format&fit=crop&q=80&w=600&h=750"
                  alt="Remote match left"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {/* Glowing subtle overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                <div className="absolute top-4 left-4 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-sm">👧</div>
              </div>

              {/* Right video preview: Curly haired stylish boy with necklace */}
              <div className="relative h-full w-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600&h=750"
                  alt="Remote match right"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                <div className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-sm">👦</div>
              </div>

            </div>

            {/* Simulated Live Match Overlay tags */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse" />
              Direct Connection
            </div>

          </div>

          {/* Floating Emoji Bubbles to add visual interest and match the original playful mood */}
          <motion.div
            className="absolute top-1/4 -left-6 z-30 cursor-default"
            animate={{
              y: [-12, 12, -12],
              rotate: [-5, 10, -5]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-5xl filter drop-shadow-lg inline-block hover:scale-125 transition-transform select-none">😍</span>
          </motion.div>

          <motion.div
            className="absolute -top-6 left-1/3 z-30 cursor-default"
            animate={{
              y: [0, -15, 0],
              rotate: [0, -8, 0]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-5xl filter drop-shadow-lg inline-block hover:scale-125 transition-transform select-none">✨</span>
          </motion.div>

          <motion.div
            className="absolute -bottom-6 right-1/4 z-30 cursor-default"
            animate={{
              y: [15, -10, 15],
              rotate: [5, -5, 5]
            }}
            transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-5xl filter drop-shadow-lg inline-block hover:scale-125 transition-transform select-none">🤩</span>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
