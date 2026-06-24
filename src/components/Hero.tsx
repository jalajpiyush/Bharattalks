/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Video, KeyRound, Smartphone, Mail, Chrome, ExternalLink } from "lucide-react";
import { motion } from "motion/react";

interface HeroProps {
  onStartChatting: () => void;
  onOpenAuth: (method?: "google" | "apple" | "email" | "phone") => void;
  user: { email: string } | null;
}

export default function Hero({ onStartChatting, onOpenAuth, user }: HeroProps) {
  // Facepile avatar photos
  const happyUsers = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=80&h=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=80&h=80",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=80&h=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=80&h=80"
  ];

  return (
    <section className="w-full px-4 pt-4 pb-12 md:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
        
        {/* Left Column: Headline and CTAs */}
        <div className="lg:col-span-5 space-y-6 md:space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#10a37f]/10 border border-[#10a37f]/20 rounded-full text-xs font-bold uppercase tracking-wider text-[#10a37f]">
            <span className="w-2.5 h-2.5 bg-[#10a37f] rounded-full animate-pulse" />
            500,241 Users Online Now
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black font-display tracking-tight text-white leading-[1.1]">
              Meet New <br />
              People <span className="text-[#10a37f]">Instantly.</span>
            </h1>
            <p className="text-gray-300 text-sm sm:text-base md:text-lg font-medium leading-relaxed max-w-md opacity-90">
              Connect with interesting strangers globally through secure, moderated, live video conversations.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onStartChatting}
              className="flex items-center justify-center gap-2.5 rounded-2xl bg-[#10a37f] hover:bg-[#0fa47f] text-white hover:scale-103 shadow-xl shadow-[#10a37f]/20 font-black text-sm md:text-base px-8 py-4 transition-all cursor-pointer"
              id="btn-hero-start"
            >
              <Video className="h-5 w-5" />
              Start Chatting
            </button>

            <a
              href="/?view=chat&standalone=true"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white hover:scale-103 transition-all font-bold text-sm md:text-base px-6 py-4 cursor-pointer"
              id="btn-hero-different-page"
            >
              <ExternalLink className="h-4.5 w-4.5 text-[#10a37f]" />
              <span>Open in Separate Page ↗</span>
            </a>
            
            {!user && (
              <button
                onClick={() => onOpenAuth()}
                className="flex items-center justify-center gap-2.5 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 transition-all font-semibold text-sm md:text-base px-6 py-4 cursor-pointer"
                id="btn-hero-signin"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Stacked Facepile / Happy Users */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex -space-x-3.5 overflow-hidden">
              {happyUsers.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`user-${idx}`}
                  className="inline-block h-10 w-10 rounded-full ring-2 ring-[#0d0d0d] object-cover"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-wide">10M+</span>
              <span className="text-gray-400 text-3xs font-semibold uppercase tracking-wider">Happy Users</span>
            </div>
            
            {/* Swirly arrow indicator */}
            <div className="hidden sm:block ml-2 text-indigo-400">
              <svg className="w-12 h-10 transform -scale-x-100" fill="none" viewBox="0 0 48 32">
                <path d="M4 28 C 12 16, 24 12, 40 4" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" />
                <path d="M34 2 C 38 3, 40 4, 40 4 L 38 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right Column: Live Mockup with Floating Emojis */}
        <div className="lg:col-span-7 relative flex items-center justify-center">
          
          {/* Main frame card wrapper */}
          <div className="relative w-full max-w-[480px] h-[480px] sm:h-[540px] bg-[#171717]/85 backdrop-blur-2xl border border-white/10 rounded-[48px] shadow-2xl p-6 flex flex-col gap-4 overflow-hidden group">
            
            {/* Remote User (The Stranger) */}
            <div className="flex-1 rounded-[32px] relative overflow-hidden flex items-center justify-center border border-white/5 bg-[#110931]">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=550"
                alt="Sneha"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-103"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              <div className="absolute bottom-5 left-5 right-5 text-left">
                <p className="text-xl font-bold text-white leading-none">Sneha, 21</p>
                <p className="text-xs text-[#10a37f] mt-1">🇮🇳 New Delhi, India</p>
              </div>
              <div className="absolute top-4 right-4 px-3 py-1 bg-[#10a37f] rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-md flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Live
              </div>
            </div>

            {/* Bottom Row: Local User Preview + Action Controls */}
            <div className="h-32 sm:h-36 flex gap-4">
              {/* Local User Preview */}
              <div className="w-24 sm:w-28 h-full rounded-[24px] border border-white/10 overflow-hidden relative bg-[#160e34] shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400&h=550"
                  alt="Arjun"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/25" />
                <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] font-bold text-white bg-black/40 backdrop-blur-xs py-0.5">
                  You (Arjun)
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex-1 bg-white/5 backdrop-blur-md rounded-[24px] border border-white/5 p-2 sm:p-4 flex items-center justify-around">
                <button className="w-9 h-9 sm:w-11 sm:h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center cursor-pointer transition-all text-white">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                </button>
                <button onClick={onStartChatting} className="w-11 h-11 sm:w-14 sm:h-14 bg-[#10a37f] hover:bg-[#0fa47f] rounded-full flex items-center justify-center cursor-pointer shadow-lg shadow-[#10a37f]/30 transition-all text-white hover:scale-105">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <button className="w-9 h-9 sm:w-11 sm:h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center cursor-pointer transition-all text-white">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                </button>
              </div>
            </div>

            {/* Floating Feature Tags */}
            <div className="absolute -bottom-2 right-6 hidden sm:flex gap-2">
              <div className="px-3 py-1 bg-white/5 backdrop-blur-md rounded-xl text-[9px] font-bold border border-white/10 uppercase tracking-wider text-[#10a37f] shadow-lg">✨ AI Moderated</div>
              <div className="px-3 py-1 bg-white/5 backdrop-blur-md rounded-xl text-[9px] font-bold border border-white/10 uppercase tracking-wider text-[#10a37f] shadow-lg">🌍 Global Matching</div>
            </div>

          </div>

          {/* Floating Emoji Bubbles (Monkey App vibe) */}
          <motion.div
            className="absolute top-1/2 -left-8 z-30 cursor-default"
            animate={{
              y: [-15, 10, -15],
              rotate: [-5, 10, -5]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-4xl filter drop-shadow-lg inline-block hover:scale-125 transition-transform">😍</span>
          </motion.div>

          <motion.div
            className="absolute -top-6 left-1/3 z-30 cursor-default"
            animate={{
              y: [0, -12, 0],
              rotate: [0, -8, 0]
            }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-4xl filter drop-shadow-lg inline-block hover:scale-125 transition-transform">🤩</span>
          </motion.div>

          <motion.div
            className="absolute -bottom-6 right-1/4 z-30 cursor-default"
            animate={{
              y: [12, -8, 12],
              rotate: [5, -5, 5]
            }}
            transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-4xl filter drop-shadow-lg inline-block hover:scale-125 transition-transform">😀</span>
          </motion.div>

          <motion.div
            className="absolute top-1/4 -right-8 z-30 cursor-default"
            animate={{
              y: [-10, 15, -10],
              rotate: [-10, 5, -10]
            }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-4xl filter drop-shadow-lg inline-block hover:scale-125 transition-transform">👍</span>
          </motion.div>
        </div>

      </div>

      {/* Auth deck at the bottom */}
      <div className="mt-16 w-full rounded-2xl glass-panel p-6 border border-white/10 shadow-xl relative z-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-white font-semibold text-sm tracking-wider uppercase bg-white/5 border border-white/10 px-4 py-1.5 rounded-xl">
            Continue with
          </span>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:flex-wrap">
            <button
              onClick={() => onOpenAuth("google")}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 text-white px-5 py-3 text-xs md:text-sm font-semibold transition-all border border-white/10 cursor-pointer shadow-sm shrink-0"
              id="auth-google"
            >
              <Chrome className="h-4.5 w-4.5 text-[#4285F4]" />
              Google
            </button>
            <button
              onClick={() => onOpenAuth("apple")}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 text-white px-5 py-3 text-xs md:text-sm font-semibold transition-all border border-white/10 cursor-pointer shadow-sm shrink-0"
              id="auth-apple"
            >
              <span className="text-sm font-bold"></span>
              Apple
            </button>
            <button
              onClick={() => onOpenAuth("email")}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 text-white px-5 py-3 text-xs md:text-sm font-semibold transition-all border border-white/10 cursor-pointer shadow-sm shrink-0"
              id="auth-email"
            >
              <Mail className="h-4.5 w-4.5 text-rose-400" />
              Email
            </button>
            <button
              onClick={() => onOpenAuth("phone")}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 text-white px-5 py-3 text-xs md:text-sm font-semibold transition-all border border-white/10 cursor-pointer shadow-sm shrink-0"
              id="auth-phone"
            >
              <Smartphone className="h-4.5 w-4.5 text-emerald-400" />
              Phone
            </button>
          </div>
        </div>
      </div>

    </section>
  );
}
