/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Users, Globe, MessageSquareCode, Activity } from "lucide-react";
import { motion } from "motion/react";

export default function Statistics() {
  const stats = [
    {
      value: "1.2K+",
      label: "Active Members",
      icon: Users,
      color: "from-[#4F8FFF] to-[#6AA8FF]",
      glowColor: "rgba(79, 143, 255, 0.25)"
    },
    {
      value: "45+",
      label: "Regions Connected",
      icon: Globe,
      color: "from-gray-700 to-gray-800",
      glowColor: "rgba(255, 255, 255, 0.05)"
    },
    {
      value: "1.5K+",
      label: "Daily Video Chats",
      icon: MessageSquareCode,
      color: "from-[#6AA8FF] to-[#7CB8FF]",
      glowColor: "rgba(106, 168, 255, 0.25)"
    },
    {
      value: "99.9%",
      label: "Server Uptime",
      icon: Activity,
      color: "from-[#30D158] to-emerald-600",
      glowColor: "rgba(48, 209, 88, 0.25)"
    }
  ];

  return (
    <section className="w-full px-4 py-8 md:px-8 max-w-7xl mx-auto">
      <div className="rounded-3xl glass-panel p-6 md:p-8 border border-white/5 shadow-2xl relative overflow-hidden">
        {/* Glow element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-[#4F8FFF]/5 rounded-full blur-3xl" />
        
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:divide-x md:divide-white/10 relative z-10">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="flex flex-col items-center justify-center p-4 text-center group"
              >
                <div 
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${stat.color} text-white shadow-xl mb-4 transition-transform duration-300 group-hover:scale-110`}
                  style={{ boxShadow: `0 8px 24px ${stat.glowColor}` }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-3xl md:text-4xl font-bold font-display tracking-tight text-white">
                  {stat.value}
                </span>
                <span className="text-gray-400 text-xs font-medium uppercase tracking-wider mt-1.5">
                  {stat.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
