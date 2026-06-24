/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Plus, Minus, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqs: FaqItem[] = [
    {
      question: "What is BharatTalk?",
      answer: "BharatTalk is a modern, mobile-first social video discovery platform inspired by Monkey.app. It allows you to instantly match and video-chat with people around the world based on matching interests, fostering genuine connections."
    },
    {
      question: "Is BharatTalk safe to use?",
      answer: "Yes, user safety is our absolute priority. We deploy continuous automated AI moderation to flag toxic content, alongside a prompt 1-tap blocking and reporting system that instantly isolates bad actors."
    },
    {
      question: "Can I chat anonymously?",
      answer: "Absolutely. You can choose any nickname and profile avatar to protect your identity. We respect your data, never record your conversations, and do not share your private account details."
    },
    {
      question: "Do I need an account to join?",
      answer: "We require a simple, secure social OAuth sign-in (Google, Apple, Phone, or Email). This ensures that our community is made up of real people, preventing spambots and keeping the quality of connections high."
    },
    {
      question: "Is BharatTalk free?",
      answer: "Yes! The core random matching, high-definition video calls, and instant text messaging features are 100% free. We may introduce premium filter preferences in the future, but basic chatting will always remain free."
    }
  ];

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="w-full px-4 py-16 md:px-8 max-w-4xl mx-auto" id="faqs">
      <div className="text-center mb-12">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#10a37f] bg-[#10a37f]/10 rounded-full px-4 py-1.5 mb-3">
          FAQS
        </span>
        <h2 className="text-3xl md:text-5xl font-bold font-display tracking-tight text-white">
          Frequently Asked Questions
        </h2>
        <p className="text-gray-400 mt-4 max-w-md mx-auto text-sm">
          Everything you need to know about BharatTalk, safety, and our matchmaking technology.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = activeIndex === idx;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isOpen 
                  ? "bg-[#171717] border-white/10 shadow-xl" 
                  : "bg-white/[0.03] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
              }`}
            >
              <button
                onClick={() => toggleAccordion(idx)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left text-white font-medium md:text-lg cursor-pointer focus:outline-none"
                id={`faq-btn-${idx}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 shrink-0 ${isOpen ? "text-[#10a37f]" : "text-gray-400"}`}>
                    <HelpCircle className="h-4.5 w-4.5" />
                  </div>
                  <span className="font-display font-semibold text-sm md:text-base leading-snug">
                    {faq.question}
                  </span>
                </div>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/5 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#10a37f]" : "text-gray-400"}`}>
                  {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <div className="px-5 pb-5 pt-1 text-gray-300 text-xs md:text-sm leading-relaxed border-t border-white/5">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
