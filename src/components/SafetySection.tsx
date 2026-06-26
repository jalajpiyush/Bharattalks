/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { ShieldCheck, HeartHandshake, EyeOff, AlertOctagon, UserCheck, CheckCircle2 } from "lucide-react";

export default function SafetySection() {
  const safetyPoints = [
    {
      title: "Automated Frame Classification",
      description: "Our client-side WebGL framework scans video frames locally every 3 seconds, blurring inappropriate content immediately before any packets leave your browser.",
      icon: ShieldCheck,
      color: "text-[#4F8FFF]"
    },
    {
      title: "Decentralized Peer Reporting",
      description: "Immediate 1-tap report buttons trigger localized cooldowns. Accounts receiving 2+ flags in 10 minutes are locked pending human inspection.",
      icon: AlertOctagon,
      color: "text-red-400"
    },
    {
      title: "Real-time Text Filter Engine",
      description: "A server-side regex and keyword check parses text chats to block link sharing, phone numbers, or toxic phrases in less than 50 milliseconds.",
      icon: HeartHandshake,
      color: "text-[#6AA8FF]"
    },
    {
      title: "Data and Privacy Isolation",
      description: "Sign-in parameters are used exclusively for credential check. Peer connections run on secure peer-to-peer tunnels without storing call archives.",
      icon: EyeOff,
      color: "text-[#30D158]"
    }
  ];

  return (
    <section className="w-full px-4 py-16 md:px-8 max-w-7xl mx-auto" id="safety">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
        
        {/* Left Column: List details */}
        <div className="lg:col-span-7 space-y-6">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#4F8FFF] bg-[#4F8FFF]/10 rounded-full px-4 py-1.5">
            Safety First
          </span>

          <h2 className="text-3xl md:text-5xl font-bold font-display tracking-tight text-white leading-tight">
            Your Safety is <br className="hidden md:inline" />
            <span className="bg-gradient-to-r from-[#4F8FFF] to-[#7CB8FF] bg-clip-text text-transparent">
              Our Priority
            </span>
          </h2>

          <p className="text-gray-300 text-sm md:text-base leading-relaxed">
            We are dedicated to building a positive, healthy environment. Swiply leverages bleeding-edge automated technologies combined with human monitoring to keep malicious activities out, letting you enjoy stress-free, delightful connections.
          </p>

          <div className="space-y-4 pt-2">
            {safetyPoints.map((point, idx) => {
              const Icon = point.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="flex items-start gap-3.5 p-4 rounded-2xl glass-panel-light border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 ${point.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm md:text-base font-semibold text-white">
                        {point.title}
                      </h4>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    </div>
                    <p className="text-gray-400 text-xs md:text-sm mt-0.5 leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Technical Transparency Specification block */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-[#121826]/30 via-[#121826]/50 to-[#090D16] border border-[#4F8FFF]/10 space-y-3.5"
          >
            <div className="flex items-center gap-2 text-[#4F8FFF]">
              <span className="w-2 h-2 rounded-full bg-[#4F8FFF] animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono">System Integrity & Transparency Log</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              We stand against ambiguous safety marketing. Our platform enforces high-integrity moderation through standard deterministic rules:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-3xs font-mono text-gray-500 leading-normal uppercase">
              <div className="bg-white/2.5 p-2.5 rounded-xl border border-white/5">
                <span className="text-[#4F8FFF] font-black">01 // VIDEO STREAM INTEGRITY</span>
                <p className="text-[10px] lowercase text-gray-400 mt-1 leading-relaxed">
                  Real-time client-side frame analyzer checks raw media buffers locally. Detected NSFW flags instantly terminate WebRTC signaling channels.
                </p>
              </div>
              <div className="bg-white/2.5 p-2.5 rounded-xl border border-white/5">
                <span className="text-[#6AA8FF] font-black">02 // ANTI-BOT SYNC GATEWAY</span>
                <p className="text-[10px] lowercase text-gray-400 mt-1 leading-relaxed">
                  Verification triggers standard token lookups. Multi-device verification prevents automated farming and keeps matching pools 100% genuine.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Custom Glassmorphism 3D Lock/Shield Illustration */}
        <div className="lg:col-span-5 flex items-center justify-center relative mt-6 lg:mt-0">
          
          {/* Main Shield Layout Card */}
          <div className="relative w-80 h-96 md:w-96 md:h-[450px] rounded-3xl glass-panel border border-white/10 flex flex-col items-center justify-center shadow-2xl overflow-hidden group">
            
            {/* Background glowing rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#4F8FFF]/10 rounded-full blur-3xl group-hover:bg-[#4F8FFF]/15 transition-all duration-700" />
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#4F8FFF]/5 rounded-full blur-2xl" />

            {/* Glowing lock/shield vector ornament */}
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative flex items-center justify-center w-52 h-64 md:w-60 md:h-72"
            >
              {/* Pulsing halo rings */}
              <div className="absolute w-full h-full rounded-full border border-white/5 scale-90 animate-pulse-slow" />
              
              {/* Outer shield outline (SVG for sharp look) */}
              <svg 
                viewBox="0 0 200 240" 
                className="absolute inset-0 w-full h-full text-[#4F8FFF]/20 drop-shadow-[0_0_35px_rgba(79,143,255,0.3)]"
              >
                <path 
                  d="M100 20 C140 20 180 30 180 70 C180 140 130 200 100 220 C70 200 20 140 20 70 C20 30 60 20 100 20 Z" 
                  fill="url(#shieldGrad)" 
                  stroke="rgba(255,255,255,0.2)" 
                  strokeWidth="2.5" 
                />
                <defs>
                  <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4F8FFF" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#6AA8FF" stopOpacity="0.35" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Padlock base */}
              <div className="relative z-10 flex flex-col items-center justify-center">
                
                {/* Padlock arch */}
                <div className="w-16 h-20 border-4 border-b-0 border-white/40 rounded-t-full relative translate-y-3 shadow-inner" />
                
                {/* Padlock body (glowing frosted rectangle) */}
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-[#090D16]/90 via-[#121826] to-[#4F8FFF]/80 border border-white/20 flex items-center justify-center shadow-2xl relative">
                  
                  {/* Glowing keyhole icon */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-5 h-5 rounded-full bg-white animate-pulse" />
                    <div className="w-2.5 h-6 bg-gradient-to-b from-white to-gray-300 rounded-b-md" />
                  </div>

                  {/* Shield reflections */}
                  <div className="absolute top-1 left-2 w-1/2 h-1 bg-white/25 rounded-full" />
                </div>
              </div>

              {/* Floating Shield Badges */}
              <div className="absolute top-8 right-6 bg-[#4F8FFF]/10 backdrop-blur-md border border-[#4F8FFF]/20 rounded-xl px-2.5 py-1 flex items-center gap-1.5 shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-ping" />
                <span className="text-[10px] font-bold text-[#30D158]">SECURE</span>
              </div>

              <div className="absolute bottom-10 left-2 bg-[#4F8FFF]/10 backdrop-blur-md border border-[#4F8FFF]/20 rounded-xl px-2.5 py-1 flex items-center gap-1.5 shadow-lg">
                <span className="text-[10px] font-bold text-[#4F8FFF]">AI MODERATED</span>
              </div>
            </motion.div>

            {/* Core metric badge */}
            <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl px-6 py-2.5 shadow-inner mt-4 text-center">
              <span className="text-gray-400 text-2xs uppercase tracking-wider font-semibold">Uptime Reliability</span>
              <p className="text-white text-lg font-bold font-display mt-0.5">99.9% Operational</p>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
