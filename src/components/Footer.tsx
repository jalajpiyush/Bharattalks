/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { Video, Send, Instagram, Twitter, MessageSquare } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="w-full bg-[#0d0d0d] border-t border-white/5 px-4 py-12 md:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 lg:grid-cols-5">
          
          {/* Logo & Info column */}
          <div className="md:col-span-1 lg:col-span-2">
            <div className="flex items-center gap-2.5 text-xl font-bold font-display text-white mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#10a37f] to-[#0fa47f] shadow-lg shadow-[#10a37f]/25">
                <Video className="h-5.5 w-5.5 text-white" />
              </div>
              <span>
                Bharat<span className="text-[#10a37f]">Talk</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-6">
              Connecting people, creating memories, building friendships. Instantly connect with live video and secure conversations.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-[#10a37f]/20 hover:border-[#10a37f]/30 transition-all cursor-pointer"
                id="footer-social-instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-[#10a37f]/20 hover:border-[#10a37f]/30 transition-all cursor-pointer"
                id="footer-social-twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-[#10a37f]/20 hover:border-[#10a37f]/30 transition-all cursor-pointer"
                id="footer-social-discord"
              >
                <MessageSquare className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Company column */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Company</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#about-us" className="text-gray-400 hover:text-white transition-colors">About Us</a>
              </li>
              <li>
                <a href="#careers" className="text-gray-400 hover:text-white transition-colors">Careers</a>
              </li>
              <li>
                <a href="#contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</a>
              </li>
              <li>
                <a href="#press" className="text-gray-400 hover:text-white transition-colors">Press Kit</a>
              </li>
            </ul>
          </div>

          {/* Support column */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Support</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#safety-center" className="text-gray-400 hover:text-white transition-colors">Safety Center</a>
              </li>
              <li>
                <a href="#help-center" className="text-gray-400 hover:text-white transition-colors">Help Center</a>
              </li>
              <li>
                <a href="#guidelines" className="text-gray-400 hover:text-white transition-colors">Community Guidelines</a>
              </li>
              <li>
                <a href="#bug-report" className="text-gray-400 hover:text-white transition-colors">Report a Bug</a>
              </li>
            </ul>
          </div>

          {/* Stay Updated / Newsletter Column */}
          <div className="rounded-2xl glass-panel p-5 border border-white/15 shadow-xl max-w-sm">
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-2">Stay Updated</h3>
            <p className="text-gray-400 text-xs mb-4">
              Subscribe to get the latest updates and features.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#10a37f] focus:ring-1 focus:ring-[#10a37f] transition-all"
                  id="newsletter-email"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[#10a37f] text-white hover:bg-[#0fa47f] transition-all cursor-pointer"
                  id="btn-newsletter-submit"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              {subscribed && (
                <p className="text-emerald-400 text-xs font-medium animate-pulse mt-1">
                  Thank you! You've subscribed successfully. ✨
                </p>
              )}
            </form>
          </div>

        </div>

        <div className="my-10 h-[1px] bg-white/10" />

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500">
          <p>© {new Date().getFullYear()} BharatTalk. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a href="#privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-gray-300 transition-colors">Terms of Service</a>
            <a href="#cookie" className="hover:text-gray-300 transition-colors">Cookie Policy</a>
            <a href="#disclaimer" className="hover:text-gray-300 transition-colors">Disclaimer</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
