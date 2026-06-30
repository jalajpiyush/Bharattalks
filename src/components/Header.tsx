/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Video, Menu, X, User, LogOut, Crown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HeaderProps {
  currentView: string;
  setView: (view: "home" | "chat" | "safety" | "about") => void;
  onOpenAuth: () => void;
  user: { email: string; name?: string } | null;
  onSignOut: () => void;
  onOpenPremium: () => void;
}

export default function Header({ currentView, setView, onOpenAuth, user, onSignOut, onOpenPremium }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number>(0);

  useEffect(() => {
    let unsubscribe: () => void;
    import("../lib/aws").then(({ subscribeToOnlineUsersCount }) => {
      unsubscribe = subscribeToOnlineUsersCount((count) => {
        setOnlineCount(count);
      });
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const navItems = [
    { label: "Home", id: "home" as const },
    { label: "Video Chat", id: "chat" as const },
    { label: "Safety", id: "safety" as const },
    { label: "About", id: "about" as const },
  ];

  const handleNavClick = (viewId: "home" | "chat" | "safety" | "about") => {
    if (viewId === "chat") {
      if (!user) {
        onOpenAuth();
      } else {
        window.open("/?view=chat", "_blank");
      }
    } else {
      setView(viewId);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-transparent px-4 py-4 md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl glass-panel-light px-6 py-3.5 shadow-xl backdrop-blur-md">
        
        {/* Logo */}
        <button
          onClick={() => handleNavClick("home")}
          className="flex items-center gap-3 text-xl font-bold font-display tracking-tight hover:opacity-95 cursor-pointer text-white"
          id="btn-logo"
        >
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 shadow-xl border border-white/20 overflow-hidden group">
            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
            
            {/* Cute Swiply Mascot SVG - Authentic Yellow */}
            <svg className="h-8 w-8 drop-shadow-md" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Left Ear */}
              <circle cx="24" cy="50" r="11" fill="#4F8FFF" />
              <circle cx="24" cy="50" r="7" fill="#2A5CBF" />
              
              {/* Right Ear */}
              <circle cx="76" cy="50" r="11" fill="#4F8FFF" />
              <circle cx="76" cy="50" r="7" fill="#2A5CBF" />
              
              {/* Swiply Head */}
              <circle cx="50" cy="50" r="28" fill="#4F8FFF" />
              
              {/* Heart Face */}
              <path d="M 50,38 C 42,28 32,34 33,45 C 34,54 45,61 50,64 C 55,61 66,54 67,45 C 68,34 58,28 50,38 Z" fill="#fff7b2" />
              
              {/* Eyes */}
              <circle cx="45" cy="45" r="3.5" fill="#111827" />
              <circle cx="55" cy="45" r="3.5" fill="#111827" />
              
              {/* Smile */}
              <path d="M 46,52 A 4 4 0 0 0 54,52" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              
              {/* Blush Cheeks */}
              <circle cx="39" cy="49" r="2.5" fill="#f87171" opacity="0.8" />
              <circle cx="61" cy="49" r="2.5" fill="#f87171" opacity="0.8" />
            </svg>

            {/* Micro Sparkle Indicator */}
            <div className="absolute -top-1 -right-1 text-[8px] animate-pulse text-[#fff7b2]">✨</div>
          </div>
          <span className="font-display font-black tracking-tight text-3xl text-white">
            Swiply
          </span>
        </button>

        {/* Real-time online user count indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-extrabold shadow-sm shadow-emerald-500/5 select-none animate-pulse-slow">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>{onlineCount} Online</span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`relative text-sm font-medium transition-colors cursor-pointer hover:text-white ${
                  isActive ? "text-white" : "text-gray-400"
                }`}
                id={`nav-${item.id}`}
              >
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute -bottom-1 left-0 h-0.5 w-full bg-[#4F8FFF]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}

          <button
            onClick={onOpenPremium}
            className="group relative flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-1.5 text-sm font-extrabold text-black shadow-lg shadow-amber-500/20 transition-all hover:scale-105 hover:shadow-amber-500/40"
          >
            <Crown className="h-4 w-4 drop-shadow-sm" />
            <span>VIP Access</span>
            <div className="absolute -right-1 -top-1 animate-pulse text-[10px]">✨</div>
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <div className="flex items-center gap-3 rounded-full bg-white/5 px-4 py-1.5 border border-white/10">
              <User className="h-4 w-4 text-[#4F8FFF]" />
              <span className="text-xs font-medium text-white max-w-[150px] truncate flex items-center gap-1.5">
                {user.name || user.email.split("@")[0]}
                {(localStorage.getItem("swiply_premium") === "true" || localStorage.getItem("monkey_premium") === "true" || localStorage.getItem("bharattalk_premium") === "true") && (
                  <Crown className="h-3.5 w-3.5 text-amber-400 fill-amber-400/20 animate-pulse" title="Premium Active" />
                )}
              </span>
              <button
                onClick={onSignOut}
                className="ml-1 rounded-full p-1 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Sign Out"
                id="btn-signout"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="rounded-full border border-white/10 bg-white/5 px-6 py-2 text-sm font-medium text-white transition-all hover:bg-white/10 hover:border-white/25 shadow-inner cursor-pointer"
              id="btn-signin"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile Hamburger Trigger */}
        <div className="flex items-center gap-2 md:hidden">
          {user && (
            <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 border border-white/5">
              <User className="h-3.5 w-3.5 text-[#4F8FFF]" />
              <span className="text-2xs font-medium text-white max-w-[80px] truncate flex items-center gap-1">
                {user.name || user.email.split("@")[0]}
                {(localStorage.getItem("swiply_premium") === "true" || localStorage.getItem("monkey_premium") === "true" || localStorage.getItem("bharattalk_premium") === "true") && (
                  <Crown className="h-3 w-3 text-amber-400 fill-amber-400/20" />
                )}
              </span>
            </div>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl p-2 text-white hover:bg-white/10 transition-all cursor-pointer"
            id="btn-hamburger"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute left-4 right-4 mt-2 rounded-2xl glass-panel-heavy p-6 shadow-2xl md:hidden border border-white/20"
          >
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-all ${
                    currentView === item.id
                      ? "bg-white/10 text-white border border-white/10"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                  id={`nav-mobile-${item.id}`}
                >
                  {item.label}
                  {currentView === item.id && (
                    <span className="h-2 w-2 rounded-full bg-[#4F8FFF]" />
                  )}
                </button>
              ))}

              <div className="my-2 h-[1px] bg-white/10" />

              <button
                onClick={() => {
                  onOpenPremium();
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-500/20 hover:scale-[1.02] px-4 py-3 text-sm font-extrabold transition-all cursor-pointer"
              >
                <Crown className="h-4 w-4 drop-shadow-sm" />
                VIP Access
              </button>

              {user ? (
                <button
                  onClick={() => {
                    onSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4F8FFF]/15 text-[#4F8FFF] hover:bg-[#4F8FFF]/25 px-4 py-3 text-sm font-semibold transition-all cursor-pointer border border-[#4F8FFF]/25"
                  id="btn-mobile-signout"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              ) : (
                <button
                  onClick={() => {
                    onOpenAuth();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-center rounded-xl bg-[#4F8FFF] text-black shadow-lg shadow-[#4F8FFF]/20 hover:bg-[#2A5CBF] px-4 py-3 text-sm font-semibold transition-all cursor-pointer"
                  id="btn-mobile-signin"
                >
                  Sign In
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
