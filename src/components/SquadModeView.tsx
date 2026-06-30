import React, { useState, useEffect, useRef, FormEvent, RefObject } from "react";
import { 
  Users, Video, VideoOff, Mic, MicOff, Plus, Copy, Check, Sparkles, 
  ArrowLeft, RefreshCw, LogOut, Send, Smile, Heart, Play, Ban, Trash2, ShieldAlert, Crown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SquadMember {
  id: string;
  name: string;
  country: string;
  flag: string;
  avatarUrl: string;
  isReady: boolean;
  mic: boolean;
  video: boolean;
  isMe?: boolean;
}

interface SquadOpponent {
  id: string;
  name: string;
  country: string;
  flag: string;
  avatarUrl: string;
  videoUrl: string;
  status: string;
}

interface SquadModeViewProps {
  localStream: MediaStream | null;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  isPremium: boolean;
  onOpenPremium: () => void;
  onBackToSolo: () => void;
  selectedFilter: string;
  funFilters: { id: string; name: string; emoji: string; class: string }[];
  coinsCount?: number;
  setCoinsCount?: React.Dispatch<React.SetStateAction<number>>;
}

export default function SquadModeView({
  localStream,
  localVideoRef,
  isPremium,
  onOpenPremium,
  onBackToSolo,
  selectedFilter,
  funFilters,
  coinsCount = 0,
  setCoinsCount,
}: SquadModeViewProps) {
  // Squad Lobby States
  const [squadStatus, setSquadStatus] = useState<"lobby" | "matching" | "connected">("lobby");
  const [squadCode, setSquadCode] = useState("SQ-8849-IND");
  const [copiedCode, setCopiedCode] = useState(false);
  const [genderFilter, setGenderFilter] = useState<"everyone" | "girls" | "boys">("everyone");
  const [genderDropdownOpen, setGenderDropdownOpen] = useState(false);
  const [searchTime, setSearchTime] = useState(0);

  // Your Squad Members
  const [squadMembers, setSquadMembers] = useState<SquadMember[]>([
    {
      id: "me",
      name: "You (Leader)",
      country: "India",
      flag: "🇮🇳",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150",
      isReady: true,
      mic: true,
      video: true,
      isMe: true
    }
  ]);

  // Friend Invite Database (Fetched from DynamoDB)
  const [availableFriends, setAvailableFriends] = useState<{ id: string; name: string; country: string; flag: string; avatarUrl: string }[]>([]);

  useEffect(() => {
    // Migrated to AWS architecture - mock friends list for prototype
    setAvailableFriends([
       { id: "1", name: "Demo User", country: "India", flag: "🇮🇳", avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150" }
    ]);
  }, []);

  // Matched Opponent Squad List
  const [activeOpponentSquad, setActiveOpponentSquad] = useState<any | null>(null);
  const [messages, setMessages] = useState<{ id: string; role: "user" | "opponent"; sender: string; text: string; timestamp: number }[]>([]);
  const [inputText, setInputText] = useState("");
  const [isOpponentTyping, setIsOpponentTyping] = useState(false);
  const [floatingGifts, setFloatingGifts] = useState<{ id: number; symbol: string; x: number }[]>([]);

  // Sound & Video states per member
  const toggleMyMic = () => {
    setSquadMembers(prev => prev.map(m => m.id === "me" ? { ...m, mic: !m.mic } : m));
  };
  const toggleMyVideo = () => {
    setSquadMembers(prev => prev.map(m => m.id === "me" ? { ...m, video: !m.video } : m));
  };

  // Invite friend to join the squad lobby
  const [invitingId, setInvitingId] = useState<string | null>(null);

  const handleInviteFriend = (friend: typeof availableFriends[0]) => {
    if (squadMembers.length >= 4) {
      alert("Lobby is full! A squad can have a maximum of 4 members.");
      return;
    }
    if (squadMembers.find(m => m.id === friend.id)) {
      return;
    }

    setInvitingId(friend.id);
    setTimeout(() => {
      setSquadMembers(prev => [
        ...prev,
        {
          id: friend.id,
          name: friend.name,
          country: friend.country,
          flag: friend.flag,
          avatarUrl: friend.avatarUrl,
          isReady: false,
          mic: true,
          video: true
        }
      ]);
      setInvitingId(null);

      // Trigger "Ready" transition in 1.5 seconds
      setTimeout(() => {
        setSquadMembers(prev => prev.map(m => m.id === friend.id ? { ...m, isReady: true } : m));
      }, 1500);
    }, 1000);
  };

  const handleRemoveMember = (id: string) => {
    setSquadMembers(prev => prev.filter(m => m.id !== id));
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(squadCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleGenderFilterSelect = (filter: "everyone" | "girls" | "boys") => {
    if (filter === "everyone") {
      setGenderFilter(filter);
    } else if (isPremium) {
      setGenderFilter(filter);
    } else {
      if (coinsCount >= 10) {
        setGenderFilter(filter);
      } else {
        onOpenPremium();
      }
    }
    setGenderDropdownOpen(false);
  };

  // Matchmaking effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (squadStatus === "matching") {
      setSearchTime(0);
      timer = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [squadStatus]);

  const handleStartMatching = () => {
    const notReady = squadMembers.filter(m => !m.isReady);
    if (notReady.length > 0) {
      alert("Please wait for all squad members to be Ready before starting matchmaking!");
      return;
    }

    if ((genderFilter === "girls" || genderFilter === "boys") && !isPremium) {
      if (coinsCount >= 10) {
        if (setCoinsCount) setCoinsCount(prev => prev - 10);
      } else {
        onOpenPremium();
        return;
      }
    }

    setSquadStatus("matching");
  };

  const handleCancelMatching = () => {
    setSquadStatus("lobby");
  };

  const handleSkipMatch = () => {
    if ((genderFilter === "girls" || genderFilter === "boys") && !isPremium) {
      if (coinsCount >= 10) {
        if (setCoinsCount) setCoinsCount(prev => prev - 10);
      } else {
        onOpenPremium();
        return;
      }
    }
    
    setSquadStatus("matching");
    setMessages([]);
  };

  const handleLeaveConnected = () => {
    setSquadStatus("lobby");
    setMessages([]);
  };

  const handleSendSquadMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeOpponentSquad) return;

    const userMsg = {
      id: `msg-user-${Date.now()}`,
      role: "user" as const,
      sender: "You",
      text: inputText.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
  };

  // Handle reaction float animation
  const handleTriggerGift = (symbol: string) => {
    const newGift = {
      id: Date.now() + Math.random(),
      symbol,
      x: 10 + Math.random() * 80 // random percentage horizontal position
    };
    setFloatingGifts(prev => [...prev, newGift]);
    // clean up after animation finishes
    setTimeout(() => {
      setFloatingGifts(prev => prev.filter(g => g.id !== newGift.id));
    }, 2000);
  };

  // Local webcam stream binding for Leader card
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (videoRef.current && localStream && squadMembers.find(m => m.id === "me")?.video) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream, squadStatus, squadMembers]);

  // Apply visual CSS filter in 2x2 grid
  const getFilterClass = () => {
    const filter = funFilters.find(f => f.id === selectedFilter);
    return filter ? filter.class : "";
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col min-h-[calc(100vh-140px)] justify-center" id="squad-mode-pane">
      
      {/* 1. LOBBY VIEW */}
      {squadStatus === "lobby" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch animate-fadeIn">
          
          {/* Left Area: Squad Party Cards Grid (Span 7) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black font-display tracking-tight text-white flex items-center gap-2">
                    <Users className="h-6 w-6 text-yellow-300" />
                    <span>My Squad Lobby</span>
                  </h2>
                  <p className="text-gray-400 text-xs">Assemble your friends to search and matches other squads together!</p>
                </div>
                <button
                  onClick={onBackToSolo}
                  className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-white/5 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Solo Mode</span>
                </button>
              </div>

              {/* Lobby Party Members Display (2x2 Grid) */}
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, idx) => {
                  const member = squadMembers[idx];
                  if (member) {
                    return (
                      <div 
                        key={member.id} 
                        className={`rounded-[28px] border relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-lg transition-all ${
                          member.isMe 
                            ? "bg-slate-950/70 border-purple-500/30 shadow-purple-500/5" 
                            : "bg-slate-900/60 border-white/10"
                        }`}
                      >
                        {/* Live Webcam video overlay or avatar */}
                        {member.isMe && localStream && member.video ? (
                          <div className="absolute inset-0 z-0">
                            <video 
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className={`w-full h-full object-cover transform -scale-x-100 rounded-[28px] ${getFilterClass()}`}
                            />
                            {/* Filter HUD tag inside preview */}
                            {selectedFilter !== "none" && (
                              <div className="absolute top-3.5 right-3.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-[9px] font-bold text-yellow-300">
                                {funFilters.find(f => f.id === selectedFilter)?.emoji} Filter
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 z-0">
                            {member.isMe && !member.video ? (
                              <div className="text-center space-y-2">
                                <div className="h-14 w-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-gray-400">
                                  <VideoOff className="h-6 w-6" />
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Video Off</span>
                              </div>
                            ) : (
                              <div className="text-center space-y-2">
                                <img src={member.avatarUrl} alt={member.name} className="h-16 w-16 rounded-full border-2 border-white/20 object-cover mx-auto" referrerPolicy="no-referrer" />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Top HUD Controls overlay */}
                        <div className="relative z-10 p-3.5 flex justify-between items-center bg-gradient-to-b from-black/60 via-black/10 to-transparent">
                          <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            member.isReady 
                              ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20" 
                              : "bg-amber-400 text-black animate-pulse"
                          }`}>
                            {member.isReady ? "Ready" : "Waiting"}
                          </span>

                          <div className="flex gap-1.5">
                            {member.isMe ? (
                              <>
                                <button 
                                  onClick={toggleMyMic}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${member.mic ? "bg-black/40 text-white" : "bg-rose-500 text-white"}`}
                                >
                                  {member.mic ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
                                </button>
                                <button 
                                  onClick={toggleMyVideo}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${member.video ? "bg-black/40 text-white" : "bg-rose-500 text-white"}`}
                                >
                                  {member.video ? <Video className="h-3 w-3" /> : <VideoOff className="h-3 w-3" />}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="p-1.5 rounded-lg bg-black/40 hover:bg-rose-600/60 text-gray-400 hover:text-white transition-colors cursor-pointer"
                                title="Kick squad member"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Bottom Name card overlay */}
                        <div className="relative z-10 p-3.5 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">{member.flag}</span>
                            <span className="text-white text-xs font-black font-display tracking-wide">{member.name}</span>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div 
                        key={idx}
                        className="rounded-[28px] border border-white/5 bg-slate-900/10 border-dashed min-h-[220px] flex flex-col items-center justify-center p-6 text-center space-y-2 group"
                      >
                        <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:scale-105 group-hover:bg-purple-500/10 transition-all border border-white/5">
                          <Plus className="h-5 w-5" />
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Spot Open</p>
                        <p className="text-[9px] text-gray-600 max-w-[120px]">Invite friends from the squad deck on the right!</p>
                      </div>
                    );
                  }
                })}
              </div>
            </div>

            {/* Quick Tips Box */}
            <div className="mt-4 bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex gap-3 items-start text-xs text-gray-400">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-purple-400" />
              <div>
                <p className="text-gray-300 font-bold">Lobby Rules</p>
                <p className="text-[11px] leading-relaxed mt-0.5">Invite active matches to fill open lobby positions. Once everyone is ready, Swiply matchmaking connects you with online squads globally.</p>
              </div>
            </div>
          </div>

          {/* Right Area: Squad Deck Controls Panel (Span 5) */}
          <div className="lg:col-span-5 rounded-[32px] bg-[#5c4cf4] border border-white/10 shadow-[0_0_50px_rgba(92,76,244,0.3)] p-6 flex flex-col justify-between relative overflow-hidden min-h-[480px]">
            {/* Aesthetic glow layers */}
            <div className="absolute -top-12 -left-12 w-40 h-40 bg-white/5 rounded-full blur-xl pointer-events-none animate-pulse" />
            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-white/5 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full flex-1 justify-between gap-6">
              
              {/* Squad Header segment */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <h3 className="text-white text-lg font-black font-display tracking-tight flex items-center gap-1.5">
                      <span>Squad deck</span>
                      <span className="text-[8px] bg-yellow-300 text-black px-1.5 py-0.5 rounded font-black tracking-widest uppercase">
                        MULTIPLAYER
                      </span>
                    </h3>
                    <p className="text-purple-100/70 text-[10px] font-semibold font-sans mt-0.5">Quick invite deck and setup tools</p>
                  </div>
                  <span className="bg-yellow-300 text-black text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-md font-sans">
                    {squadMembers.length}/4 Members
                  </span>
                </div>

                {/* Invite Link Widget */}
                <div className="bg-black/20 rounded-2xl p-3 border border-white/5 space-y-1.5 text-left">
                  <span className="block text-purple-200 text-[10px] font-bold uppercase tracking-wider">Party Invite Link</span>
                  <div className="flex gap-2 items-center bg-white/5 border border-white/10 rounded-xl p-2">
                    <span className="text-white font-mono text-xs font-bold tracking-wider flex-1 select-all">{squadCode}</span>
                    <button
                      onClick={handleCopyCode}
                      className="px-2.5 py-1 bg-yellow-300 text-black hover:bg-yellow-200 text-[10px] font-extrabold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedCode ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedCode ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                {/* Instant Active Friends Deck */}
                <div className="space-y-2 text-left">
                  <span className="block text-purple-200 text-[10px] font-bold uppercase tracking-wider">Available Online Matches</span>
                  
                  <div className="space-y-1.5 max-h-[170px] overflow-y-auto scrollbar-thin pr-1">
                    {availableFriends.map((friend) => {
                      const isAdded = squadMembers.some(m => m.id === friend.id);
                      return (
                        <div 
                          key={friend.id} 
                          className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                        >
                          <div className="flex items-center gap-2">
                            <img src={friend.avatarUrl} alt={friend.name} className="h-8 w-8 rounded-full object-cover border border-white/10" referrerPolicy="no-referrer" />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-white">{friend.name}</span>
                                <span className="text-[10px]">{friend.flag}</span>
                              </div>
                              <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Online</span>
                              </span>
                            </div>
                          </div>

                          <button
                            disabled={isAdded || invitingId === friend.id}
                            onClick={() => handleInviteFriend(friend)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                              isAdded 
                                ? "bg-white/10 text-white/40 cursor-not-allowed" 
                                : invitingId === friend.id
                                  ? "bg-amber-400 text-black"
                                  : "bg-white text-black hover:bg-gray-100"
                            }`}
                          >
                            {invitingId === friend.id ? "Connecting..." : isAdded ? "In Squad" : "Invite"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Matchmaking Filter Selectors & Match Button */}
              <div className="space-y-3.5">
                
                {/* Gender Dropdown */}
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setGenderDropdownOpen(!genderDropdownOpen)}
                    className="w-full bg-white text-black font-extrabold text-xs py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    <span>
                      {genderFilter === "everyone" && "👫 Both"}
                      {genderFilter === "girls" && "🙋‍♀️ Girls Only (VIP)"}
                      {genderFilter === "boys" && "🙋‍♂️ Boys Only (VIP)"}
                    </span>
                  </button>

                  <AnimatePresence>
                    {genderDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full mb-2 left-0 right-0 bg-white text-black rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 text-left"
                      >
                        <button 
                          type="button"
                          onClick={() => handleGenderFilterSelect("everyone")}
                          className="w-full text-xs font-bold px-4 py-3 text-left hover:bg-gray-100 transition-colors flex items-center justify-between border-b border-gray-50"
                        >
                          <span>🌐 Everyone (Both)</span>
                          {genderFilter === "everyone" && <Check className="h-4 w-4 text-purple-600" />}
                        </button>

                        <button 
                          type="button"
                          onClick={() => handleGenderFilterSelect("girls")}
                          className="w-full text-xs font-bold px-4 py-3 text-left hover:bg-gray-100 transition-colors flex items-center justify-between border-b border-gray-50"
                        >
                          <span className="flex items-center gap-1.5">
                            <span>🙋‍♀️ Girls Only</span>
                            <span className="text-[8px] bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-1.5 py-0.5 rounded font-black tracking-wider uppercase leading-none">VIP</span>
                          </span>
                          {genderFilter === "girls" && <Check className="h-4 w-4 text-purple-600" />}
                        </button>

                        <button 
                          type="button"
                          onClick={() => handleGenderFilterSelect("boys")}
                          className="w-full text-xs font-bold px-4 py-3 text-left hover:bg-gray-100 transition-colors flex items-center justify-between"
                        >
                          <span className="flex items-center gap-1.5">
                            <span>🙋‍♂️ Boys Only</span>
                            <span className="text-[8px] bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-1.5 py-0.5 rounded font-black tracking-wider uppercase leading-none">VIP</span>
                          </span>
                          {genderFilter === "boys" && <Check className="h-4 w-4 text-purple-600" />}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Ultimate Start Match Button */}
                <button
                  type="button"
                  onClick={handleStartMatching}
                  className="w-full rounded-2xl bg-[#ffe600] hover:bg-[#ebd502] text-black font-extrabold text-xs py-4 px-8 uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:scale-101 active:scale-99 transition-all cursor-pointer border border-[#cca100]"
                >
                  <Users className="h-4 w-4 text-black" />
                  <span>Start Squad Match</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 2. MATCHING SCREEN */}
      {squadStatus === "matching" && (
        <div className="flex flex-col items-center justify-center text-center space-y-8 py-16 animate-fadeIn">
          
          {/* Radar animation circle */}
          <div className="relative h-44 w-44 flex items-center justify-center">
            {/* Ripple rings */}
            <div className="absolute inset-0 rounded-full border-2 border-[#5c4cf4]/30 animate-ping" style={{ animationDuration: "3s" }} />
            <div className="absolute inset-4 rounded-full border-2 border-purple-500/20 animate-ping" style={{ animationDuration: "2s" }} />
            <div className="absolute inset-8 rounded-full border-2 border-yellow-400/20 animate-ping" style={{ animationDuration: "1.5s" }} />

            <div className="h-28 w-28 rounded-full bg-[#5c4cf4] text-white flex items-center justify-center shadow-[0_0_50px_rgba(92,76,244,0.4)] border border-white/10 relative z-10">
              <Users className="h-12 w-12 text-yellow-300 animate-pulse" />
            </div>
          </div>

          <div className="space-y-3 max-w-sm">
            <h3 className="text-white text-xl font-black font-display uppercase tracking-wider">Searching Squad Match...</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Finding active online squads matching your lobby's vibes. Matching duration: <span className="text-yellow-400 font-bold">{searchTime}s</span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleCancelMatching}
            className="rounded-xl border border-white/10 hover:border-rose-500/30 bg-white/5 hover:bg-rose-950/20 text-gray-300 hover:text-rose-400 text-xs font-bold px-6 py-2.5 transition-colors cursor-pointer"
          >
            Cancel Matchmaking
          </button>
        </div>
      )}

      {/* 3. CONNECTED / PARTY CHAT GRID VIEW */}
      {squadStatus === "connected" && activeOpponentSquad && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch animate-fadeIn">
          
          {/* Left Panel: 2x2 Webcam / Stream Grid Layout (Col Span 7) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-4">
              
              {/* Box 1: You (Leader live webcam) */}
              <div className="rounded-[24px] bg-slate-950 border border-white/10 relative overflow-hidden min-h-[170px] md:min-h-[220px] flex flex-col justify-between shadow-lg">
                {localStream ? (
                  <video 
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 rounded-[24px] ${getFilterClass()}`}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40">
                    <VideoOff className="h-8 w-8 text-gray-600" />
                  </div>
                )}
                <div className="relative z-10 p-3 bg-gradient-to-b from-black/60 to-transparent flex justify-between">
                  <span className="text-[9px] bg-emerald-500 text-black font-extrabold px-1.5 py-0.5 rounded-full uppercase">Your Stream</span>
                </div>
                <div className="relative z-10 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <span className="text-white font-bold text-xs">You 🇮🇳</span>
                </div>
              </div>

              {/* Box 2: Your Squad Member 1 (Simulated partner in squad) */}
              {squadMembers[1] ? (
                <div className="rounded-[24px] bg-slate-950 border border-white/10 relative overflow-hidden min-h-[170px] md:min-h-[220px] flex flex-col justify-between shadow-lg">
                  {/* Simulate video stream loop or static profile image */}
                  <img src={squadMembers[1].avatarUrl} alt={squadMembers[1].name} className="absolute inset-0 w-full h-full object-cover rounded-[24px]" />
                  <div className="absolute inset-0 bg-black/30" />
                  
                  <div className="relative z-10 p-3 bg-gradient-to-b from-black/60 to-transparent flex justify-between items-center">
                    <span className="text-[9px] bg-purple-500 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase">Squad mate</span>
                    <div className="flex gap-1 bg-black/40 px-1.5 py-0.5 rounded-lg border border-white/10">
                      <Mic className="h-3 w-3 text-emerald-400" />
                      <Video className="h-3 w-3 text-emerald-400" />
                    </div>
                  </div>
                  <div className="relative z-10 p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <span className="text-white font-bold text-xs">{squadMembers[1].name} {squadMembers[1].flag}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-[24px] border border-white/5 bg-slate-950/20 border-dashed flex flex-col items-center justify-center min-h-[170px] md:min-h-[220px] text-center text-gray-500 text-xs">
                  <Users className="h-6 w-6 text-gray-700 animate-pulse" />
                  <span className="text-[10px] mt-1 font-bold text-gray-600 uppercase">Spot Empty</span>
                </div>
              )}

              {/* Box 3: Opponent Squad Member 1 (Live Video loop) */}
              <div className="rounded-[24px] bg-slate-950 border border-white/10 relative overflow-hidden min-h-[170px] md:min-h-[220px] flex flex-col justify-between shadow-lg">
                <video 
                  src={activeOpponentSquad.members[0].videoUrl}
                  autoPlay
                  loop
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover rounded-[24px]"
                />
                <div className="absolute inset-0 bg-black/10" />

                <div className="relative z-10 p-3 bg-gradient-to-b from-black/60 to-transparent flex justify-between items-center">
                  <span className="text-[9px] bg-rose-500 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase">Opponent</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="relative z-10 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-xs">{activeOpponentSquad.members[0].name} {activeOpponentSquad.members[0].flag}</span>
                    <span className="text-[9px] text-gray-300 italic">{activeOpponentSquad.members[0].status}</span>
                  </div>
                </div>
              </div>

              {/* Box 4: Opponent Squad Member 2 (Live Video loop) */}
              <div className="rounded-[24px] bg-slate-950 border border-white/10 relative overflow-hidden min-h-[170px] md:min-h-[220px] flex flex-col justify-between shadow-lg">
                <video 
                  src={activeOpponentSquad.members[1].videoUrl}
                  autoPlay
                  loop
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover rounded-[24px]"
                />
                <div className="absolute inset-0 bg-black/10" />

                <div className="relative z-10 p-3 bg-gradient-to-b from-black/60 to-transparent flex justify-between items-center">
                  <span className="text-[9px] bg-rose-500 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase">Opponent</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="relative z-10 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-xs">{activeOpponentSquad.members[1].name} {activeOpponentSquad.members[1].flag}</span>
                    <span className="text-[9px] text-gray-300 italic">{activeOpponentSquad.members[1].status}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Micro floating gift reaction overlay over streams */}
            <div className="relative h-0 pointer-events-none z-30">
              <div className="absolute bottom-6 left-0 right-0 h-32 overflow-hidden pointer-events-none">
                <AnimatePresence>
                  {floatingGifts.map((gift) => (
                    <motion.div
                      key={gift.id}
                      initial={{ opacity: 0, y: 120, scale: 0.6 }}
                      animate={{ opacity: 1, y: 0, scale: 1.3 }}
                      exit={{ opacity: 0, y: -80 }}
                      transition={{ duration: 1.8, ease: "easeOut" }}
                      className="absolute text-3xl filter drop-shadow-lg"
                      style={{ left: `${gift.x}%` }}
                    >
                      {gift.symbol}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Quick reaction action tray underneath feeds */}
            <div className="rounded-2xl bg-slate-950/40 p-4 border border-white/10 mt-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
                <span className="text-white text-[10px] font-black uppercase tracking-wider select-none">Send Reaction:</span>
                <div className="flex gap-1.5">
                  {["💖", "🔥", "😂", "🤩", "🍻", "🎉"].map((react) => (
                    <button
                      key={react}
                      onClick={() => handleTriggerGift(react)}
                      className="text-sm hover:scale-125 hover:rotate-6 active:scale-95 transition-all cursor-pointer"
                    >
                      {react}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSkipMatch}
                  className="rounded-full bg-yellow-300 hover:bg-yellow-200 text-black font-extrabold text-xs px-5 py-2.5 flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95 uppercase tracking-wider"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Next Squad</span>
                </button>
                
                <button
                  onClick={handleLeaveConnected}
                  className="rounded-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs px-5 py-2.5 flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95 uppercase tracking-wider"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Leave Party</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Active Squad live chat feed (Col Span 5) */}
          <div className="lg:col-span-5 rounded-[32px] bg-slate-950/75 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col min-h-[460px] md:min-h-[500px]">
            {/* Header displaying Opponent Squad info */}
            <div className="p-4 bg-slate-900/50 border-b border-white/5 flex items-center justify-between gap-3 relative">
              <div className="flex items-center gap-2.5">
                <div className="h-8.5 w-8.5 rounded-xl bg-gradient-to-tr from-rose-500/20 to-orange-500/20 flex items-center justify-center border border-rose-500/20">
                  <Users className="h-4.5 w-4.5 text-rose-400" />
                </div>
                <div>
                  <h4 className="text-white font-black text-sm font-display tracking-tight leading-none truncate max-w-[150px]">{activeOpponentSquad.name}</h4>
                  <p className="text-gray-400 text-[10px] font-semibold mt-1">Multiplayer Live session</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[9px] text-rose-400 font-black uppercase tracking-wider">Matched</span>
              </div>
            </div>

            {/* Live Chat messages queue */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 flex flex-col scrollbar-thin max-h-[300px] md:max-h-[360px]" id="squad-chat-history">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 text-xs py-12 space-y-2">
                  <Smile className="h-8 w-8 text-white/5 animate-bounce" />
                  <p className="font-bold text-gray-400">Say hello to opponent squad!</p>
                  <p className="text-[10px] text-gray-500">Send an ice-breaker to start a super fun conversation.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.role === "user";
                  return (
                    <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? "self-end items-end" : "self-start items-start"}`}>
                      {/* Sender Tag */}
                      <span className="text-[9px] text-gray-500 font-bold px-1 mb-0.5">{msg.sender}</span>
                      
                      <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-md ${
                        isMe 
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none" 
                          : "bg-white/5 border border-white/5 text-gray-200 rounded-tl-none"
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[8px] text-gray-500 mt-1 select-none font-medium px-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              {isOpponentTyping && (
                <div className="self-start bg-white/5 border border-white/5 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              )}
            </div>

            {/* Chat form controls */}
            <form onSubmit={handleSendSquadMessage} className="p-4 bg-slate-900/50 border-t border-white/5 flex gap-2 items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Message opponent squad..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-medium transition-colors"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="h-9 w-9 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
