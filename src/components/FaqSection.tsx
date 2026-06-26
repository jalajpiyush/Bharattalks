/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqs: FaqItem[] = [
    {
      question: "What Is Swiply?",
      answer: "Swiply is a modern, social video discovery platform that allows you to instantly match and video-chat with people around the world based on matching interests, fostering genuine face-to-face connections."
    },
    {
      question: "Is Swiply Safe to Use?",
      answer: "Yes, user safety is our absolute priority. We deploy continuous automated AI moderation to flag toxic content, alongside a prompt 1-tap blocking and reporting system that instantly isolates bad actors."
    },
    {
      question: "Can I Use Swiply to Talk to Strangers?",
      answer: "Yes, Swiply is designed specifically to help you discover and talk to new friends from all over the globe, breaking language and location barriers safely and instantly."
    },
    {
      question: "Do I Need an Account to Get Started?",
      answer: "We require a simple, secure social sign-in (Google, Apple, Phone, or Email). This ensures that our community is made up of real, verified people, preventing spambots and keeping the quality of connections high."
    },
    {
      question: "Is Swiply Available on Mobile and Desktop?",
      answer: "Absolutely! Swiply is fully responsive and designed to work beautifully on both mobile devices (phones and tablets) and desktop web browsers, ensuring a seamless chat experience anywhere."
    }
  ];

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="w-full px-4 py-20 md:px-8 max-w-4xl mx-auto" id="faqs">
      {/* FAQ Title block - Exactly matching the second screenshot */}
      <div className="text-center mb-12 select-none">
        <h2 className="text-5xl md:text-7xl font-black font-display tracking-tight text-white uppercase">
          FAQs
        </h2>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = activeIndex === idx;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="rounded-[20px] bg-white/10 hover:bg-white/15 transition-all duration-300 overflow-hidden shadow-md border-none"
            >
              <button
                onClick={() => toggleAccordion(idx)}
                className="flex w-full items-center justify-between gap-6 p-5.5 text-left text-white font-bold md:text-lg cursor-pointer focus:outline-none"
                id={`faq-btn-${idx}`}
              >
                <span className="font-display font-extrabold text-base md:text-lg leading-snug tracking-wide">
                  {faq.question}
                </span>
                
                {/* Arrow indicator matches the white caret right */}
                <div className={`transition-transform duration-300 shrink-0 text-white ${isOpen ? "rotate-90" : ""}`}>
                  <ChevronRight className="h-5 w-5 stroke-[3px]" />
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
                    <div className="px-6 pb-6 pt-1 text-white/90 text-sm md:text-base leading-relaxed border-t border-white/5 font-medium">
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
