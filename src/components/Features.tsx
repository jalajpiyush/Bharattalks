/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Video, Globe, Shield, Sparkles, MessageSquare, Tags } from "lucide-react";
import { motion } from "motion/react";

export default function Features() {
  const features = [
    {
      title: "Instant Video Chat",
      description: "Start face-to-face conversations in seconds with responsive lightning-fast matchmaking.",
      icon: Video,
      color: "from-[#4F8FFF] to-[#6AA8FF]",
      glowColor: "rgba(79, 143, 255, 0.25)",
    },
    {
      title: "Global Connections",
      description: "Meet exciting people from different countries, cultures, and linguistic backgrounds.",
      icon: Globe,
      color: "from-[#121826] to-[#090D16]",
      glowColor: "rgba(255, 255, 255, 0.05)",
    },
    {
      title: "Safe & Secure",
      description: "Real-time AI moderation, secure WebRTC connection protocols, and robust reporting logs.",
      icon: Shield,
      color: "from-[#4F8FFF] to-[#7CB8FF]",
      glowColor: "rgba(79, 143, 255, 0.25)",
    },
    {
      title: "Smart Matching",
      description: "Instantly pair with users who share matching interests and social preferences.",
      icon: Sparkles,
      color: "from-[#6AA8FF] to-[#7CB8FF]",
      glowColor: "rgba(106, 168, 255, 0.25)",
    },
    {
      title: "Real-Time Messaging",
      description: "Send text messages, express emojis, and funny chat cues instantly while connected.",
      icon: MessageSquare,
      color: "from-gray-600 to-gray-700",
      glowColor: "rgba(255, 255, 255, 0.05)",
    },
    {
      title: "Interest Filters",
      description: "Filter matches by specific tags, hobbies, languages, and geographic regions.",
      icon: Tags,
      color: "from-[#4F8FFF] to-[#6AA8FF]",
      glowColor: "rgba(79, 143, 255, 0.25)",
    },
  ];

  return (
    <section className="w-full px-4 py-16 md:px-8 max-w-7xl mx-auto" id="features">
      <div className="text-center mb-12">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#4F8FFF] bg-[#4F8FFF]/10 rounded-full px-4 py-1.5 mb-3">
          Features
        </span>
        <h2 className="text-3xl md:text-5xl font-bold font-display tracking-tight text-white">
          Why Swiply?
        </h2>
        <p className="text-gray-400 mt-4 max-w-xl mx-auto text-sm md:text-base">
          Our platform brings you a premium, safe, and lightning-fast social discovery experience engineered for meaningful conversations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative overflow-hidden rounded-3xl glass-panel p-8 shadow-xl transition-all duration-300 border border-white/5 hover:border-[#4F8FFF]/20 group"
            >
              {/* Card light reflection flare */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              {/* Bottom background subtle glow */}
              <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-[#4F8FFF]/5 rounded-full blur-2xl group-hover:bg-[#4F8FFF]/15 transition-all duration-300" />

              <div 
                className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr ${feature.color} text-white shadow-lg mb-6 group-hover:rotate-6 transition-all duration-300`}
                style={{ boxShadow: `0 8px 24px ${feature.glowColor}` }}
              >
                <Icon className="h-7 w-7" />
              </div>

              <h3 className="text-xl font-bold font-display text-white mb-3 group-hover:text-[#4F8FFF] transition-colors duration-300">
                {feature.title}
              </h3>
              
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
