/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { Sparkles, MessageCircle, Heart, ShieldCheck, ArrowRight } from "lucide-react";

export default function AboutSection({ onStartChatting }: { onStartChatting: () => void }) {
  // Avatars around the globe
  const floatingUsers = [
    { name: "Priya", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150", delay: 0, x: -110, y: -70 },
    { name: "Kabir", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150", delay: 1, x: 120, y: -50 },
    { name: "Aarav", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150", delay: 2, x: -90, y: 100 },
    { name: "Meera", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150", delay: 1.5, x: 100, y: 80 }
  ];

  return (
    <section className="w-full px-4 py-16 md:px-8 max-w-7xl mx-auto" id="about">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
        
        {/* Left column: Content */}
        <div className="lg:col-span-6 space-y-6">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#4F8FFF] bg-[#4F8FFF]/10 rounded-full px-4 py-1.5">
            About Us
          </span>
          
          <h2 className="text-3xl md:text-5xl font-bold font-display tracking-tight text-white leading-tight">
            Built For Authentic <br className="hidden md:inline" />
            <span className="bg-gradient-to-r from-[#4F8FFF] to-[#7CB8FF] bg-clip-text text-transparent">
              Social Connections
            </span>
          </h2>
          
          <p className="text-gray-300 text-sm md:text-base leading-relaxed">
            In a digital world full of endless scrolling and passive likes, Swiply brings back the thrill of real-time, authentic human connection. We break down geographical barriers, allowing you to discover new friendships and engage in meaningful live conversations instantly.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl glass-panel-light border border-white/5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4F8FFF]/20 text-[#6AA8FF]">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Genuine Bonds</h4>
                <p className="text-gray-400 text-xs mt-0.5">Real conversations that bypass superficial profiles.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl glass-panel-light border border-white/5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#30D158]/20 text-[#30D158]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Safe Environment</h4>
                <p className="text-gray-400 text-xs mt-0.5">Smart system blocks toxic behavior immediately.</p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={onStartChatting}
              className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-[#4F8FFF] to-[#6AA8FF] hover:from-[#6AA8FF] hover:to-[#7CB8FF] text-white px-8 py-3.5 font-semibold text-sm shadow-xl shadow-[#4F8FFF]/20 hover:shadow-[#4F8FFF]/35 transition-all hover:scale-103 cursor-pointer glow-primary"
              id="btn-about-start"
            >
              Start Discovering
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Right column: Interactive Visual (Globe of Connections) */}
        <div className="lg:col-span-6 flex items-center justify-center relative mt-6 lg:mt-0">
          <div className="relative h-80 w-80 md:h-96 md:w-96 flex items-center justify-center rounded-full glass-panel-light border border-white/5 shadow-2xl">
            
            {/* Center Globe (Atmosphere & Grid lines simulation) */}
            <div className="relative h-44 w-44 md:h-56 md:w-56 rounded-full bg-gradient-to-tr from-[#090D16] via-[#121826] to-[#121826]/80 border border-white/10 flex items-center justify-center shadow-2xl shadow-[#4F8FFF]/10 overflow-hidden">
              
              {/* Spinning grid overlay lines */}
              <div className="absolute inset-0 border border-white/5 rounded-full animate-pulse-slow" />
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gradient-to-b from-white/10 via-transparent to-white/10" />
              <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gradient-to-r from-white/10 via-transparent to-white/10" />
              
              {/* Spinning inner orbit wireframe */}
              <div className="absolute h-32 w-32 md:h-40 md:w-40 border border-[#4F8FFF]/10 rounded-full rotate-45 animate-pulse" />
              <div className="absolute h-32 w-32 md:h-40 md:w-40 border border-[#6AA8FF]/10 rounded-full -rotate-45" />

              {/* Central Planet Logo glow */}
              <div className="absolute h-16 w-16 md:h-20 md:w-20 rounded-full bg-[#4F8FFF]/30 blur-xl opacity-25" />
              
              {/* Glowing signal waves */}
              <div className="absolute h-24 w-24 rounded-full border border-white/10 animate-ping opacity-40" style={{ animationDuration: '3s' }} />
              <div className="absolute h-36 w-36 rounded-full border border-[#4F8FFF]/10 animate-ping opacity-30" style={{ animationDuration: '4.5s' }} />
            </div>

            {/* Rotating / Floating Connection nodes around the center globe */}
            {floatingUsers.map((user, idx) => (
              <motion.div
                key={idx}
                className="absolute flex flex-col items-center z-10"
                style={{ x: user.x, y: user.y }}
                animate={{
                  y: [user.y, user.y - 12, user.y],
                }}
                transition={{
                  duration: 4,
                  delay: user.delay,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {/* Connector wire */}
                <svg className="absolute top-1/2 left-1/2 -z-10 h-32 w-32 pointer-events-none" style={{ transform: 'translate(-50%, -50%)' }}>
                  <line 
                    x1="50%" 
                    y1="50%" 
                    x2={user.x > 0 ? "20%" : "80%"} 
                    y2={user.y > 0 ? "20%" : "80%"} 
                    stroke="rgba(79, 143, 255, 0.15)" 
                    strokeWidth="1.5" 
                    strokeDasharray="4 4" 
                  />
                </svg>

                {/* Avatar container */}
                <div className="relative group">
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#4F8FFF] to-[#6AA8FF] opacity-75 blur-xs group-hover:opacity-100 transition duration-300" />
                  <img
                    src={user.img}
                    alt={user.name}
                    className="relative h-12 w-12 md:h-14 md:w-14 rounded-2xl object-cover border-2 border-[#090D16]"
                    referrerPolicy="no-referrer"
                  />
                  {/* Status dot */}
                  <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-[#090D16]" />
                </div>

                {/* Name tag */}
                <span className="mt-1.5 text-3xs font-semibold text-gray-300 bg-[#090D16]/90 px-2 py-0.5 rounded-full border border-white/5">
                  {user.name}
                </span>
              </motion.div>
            ))}

            {/* Floating Emojis or Icons around card */}
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-14 left-14 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-lg"
            >
              <MessageCircle className="h-5 w-5 text-[#4F8FFF]" />
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0], rotate: [0, -5, 0] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-16 right-16 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-lg"
            >
              <Sparkles className="h-5 w-5 text-[#7CB8FF]" />
            </motion.div>

          </div>
        </div>

      </div>
    </section>
  );
}
