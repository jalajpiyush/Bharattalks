/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Video, Menu, X, User, LogOut, Crown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HeaderProps {
  currentView: string;
  setView: (view: "home" | "chat" | "safety" | "about") => void;
  onOpenAuth: () => void;
  user: { email: string; name?: string } | null;
  onSignOut: () => void;
}

export default function Header({ currentView, setView, onOpenAuth, user, onSignOut }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Home", id: "home" as const },
    { label: "Video Chat", id: "chat" as const },
    { label: "Safety", id: "safety" as const },
    { label: "About", id: "about" as const },
  ];

  const handleNavClick = (viewId: "home" | "chat" | "safety" | "about") => {
    setView(viewId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-transparent px-4 py-4 md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl glass-panel-light px-6 py-3.5 shadow-xl backdrop-blur-md">
        
        {/* Logo */}
        <button
          onClick={() => handleNavClick("home")}
          className="flex items-center gap-2.5 text-xl font-bold font-display tracking-tight hover:opacity-95 cursor-pointer text-white"
          id="btn-logo"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#10a37f] to-[#0fa47f] shadow-lg shadow-[#10a37f]/30">
            <Video className="h-5.5 w-5.5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-white via-white to-gray-200 bg-clip-text text-white">
            Bharat<span className="text-[#10a37f]">Talk</span>
          </span>
        </button>

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
                    className="absolute -bottom-1 left-0 h-0.5 w-full bg-[#10a37f]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <div className="flex items-center gap-3 rounded-full bg-white/5 px-4 py-1.5 border border-white/10">
              <User className="h-4 w-4 text-[#10a37f]" />
              <span className="text-xs font-medium text-white max-w-[150px] truncate flex items-center gap-1.5">
                {user.name || user.email.split("@")[0]}
                {localStorage.getItem("bharattalk_premium") === "true" && (
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
              <User className="h-3.5 w-3.5 text-[#10a37f]" />
              <span className="text-2xs font-medium text-white max-w-[80px] truncate flex items-center gap-1">
                {user.name || user.email.split("@")[0]}
                {localStorage.getItem("bharattalk_premium") === "true" && (
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
                    <span className="h-2 w-2 rounded-full bg-[#10a37f]" />
                  )}
                </button>
              ))}

              <div className="my-2 h-[1px] bg-white/10" />

              {user ? (
                <button
                  onClick={() => {
                    onSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#10a37f]/15 text-[#10a37f] hover:bg-[#10a37f]/25 px-4 py-3 text-sm font-semibold transition-all cursor-pointer border border-[#10a37f]/25"
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
                  className="flex w-full items-center justify-center rounded-xl bg-[#10a37f] text-white shadow-lg shadow-[#10a37f]/20 hover:bg-[#0fa47f] px-4 py-3 text-sm font-semibold transition-all cursor-pointer"
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
