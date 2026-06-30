/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from "react";
import { 
  Video, VideoOff, Mic, MicOff, Users, SkipForward, AlertOctagon, 
  Sparkles, MessageSquare, MessageSquareOff, Heart, Gift, Smile, Send, Search, RefreshCw, X, ShieldAlert,
  Crown, CreditCard, Check, ShieldCheck, ExternalLink, Coins, Clock, Hash, ChevronDown, Maximize2, Minimize2,
  Ban
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Partner, Message } from "../types";
import { ConsoleLogger, LogLevel, DefaultDeviceController, DefaultMeetingSession, MeetingSessionConfiguration } from 'amazon-chime-sdk-js';
import { saveUserReport, saveUserBlock, enterMatchmakingQueue, leaveMatchmakingQueue, tryToMatchWithSomeone, subscribeToMatchStatus, sendSignal, subscribeToSignals, sendChatMessage, subscribeToChatMessages } from "../lib/aws";
import SquadModeView from "./SquadModeView";

const availableInterests = ["Gaming", "Music", "Coding", "Anime", "Travels", "Art", "EDM", "Cooking", "Coffee"];

const funFilters = [
  { id: "none", name: "Normal", class: "", emoji: "✨" },
  { id: "sepia", name: "Sepia", class: "sepia", emoji: "📜" },
  { id: "grayscale", name: "B&W", class: "grayscale", emoji: "🖤" },
  { id: "blur", name: "Soft Blur", class: "blur-[3px] md:blur-[4px]", emoji: "🌫️" },
  { id: "vintage", name: "Vintage", class: "sepia contrast-125 saturate-150 brightness-95", emoji: "🎞️" },
  { id: "neon", name: "Neon Glow", class: "hue-rotate-90 saturate-200 contrast-110", emoji: "🌈" },
  { id: "invert", name: "Invert", class: "invert", emoji: "🔄" }
];

export default function VideoChatArea() {
  const [sessionStatus, setSessionStatus] = useState<"idle" | "searching" | "connected" | "disconnected">("idle");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [isRematching, setIsRematching] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (sessionStatus === "connected") {
      setSessionTime(0);
      interval = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    } else {
      setSessionTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const analyzeSentiment = async (messageText: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiUrl}/api/sentiment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: messageText })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error("Failed to analyze sentiment:", err);
    }
    return null;
  };

  const triggerSentimentAnalysis = async (msgId: string, text: string) => {
    const sentiment = await analyzeSentiment(text);
    if (sentiment) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, sentiment }
            : m
        )
      );
    }
  };

  const handleSkipWithAnimation = () => {
    setIsRematching(true);
    setTimeout(() => {
      setIsRematching(false);
      startMatching();
    }, 850);
  };

  // Real-time peer connections & timers
  const [myPeerId] = useState<string>(() => {
    return "client-" + Math.random().toString(36).substring(2, 11) + "-" + Date.now();
  });

  const meetingSessionRef = useRef<any>(null);
  const peerConnectionRef = useRef<any>(null); // Legacy

  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const matchPollIntervalRef = useRef<any>(null); // Now stores AWS unsubscribe function
  const signalPollIntervalRef = useRef<any>(null);
  const chatPollIntervalRef = useRef<any>(null);
  const statusPollIntervalRef = useRef<any>(null);
  const connectionTimeoutRef = useRef<any>(null);

  // WebRTC remote stream state
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // ICE Candidate Queuing to avoid races
  const iceCandidatesQueueRef = useRef<any[]>([]);
  const hasRemoteDescriptionRef = useRef<boolean>(false);

  // Debug Panel Stats Tracking
  const [debugQueueStatus, setDebugQueueStatus] = useState<string>("idle");
  const [debugMatchStatus, setDebugMatchStatus] = useState<string>("Not matched");
  const [debugOfferSent, setDebugOfferSent] = useState<boolean>(false);
  const [debugAnswerReceived, setDebugAnswerReceived] = useState<boolean>(false);
  const [debugIceCandidatesSent, setDebugIceCandidatesSent] = useState<number>(0);
  const [debugIceCandidatesReceived, setDebugIceCandidatesReceived] = useState<number>(0);
  const [webrtcConnectionState, setWebrtcConnectionState] = useState<string>("new");
  const [webrtcIceState, setWebrtcIceState] = useState<string>("new");
  const [webrtcSignalingState, setWebrtcSignalingState] = useState<string>("stable");

  const cleanupWebRTC = () => {
    console.log("WebRTC: Cleaning up peer connection and intervals");
    if (meetingSessionRef.current) {
      meetingSessionRef.current.audioVideo.stop();
      meetingSessionRef.current = null;
    }

    if (matchPollIntervalRef.current) {
      if (typeof matchPollIntervalRef.current === 'function') {
        matchPollIntervalRef.current(); // Unsubscribe AWS
      } else {
        clearInterval(matchPollIntervalRef.current);
      }
      matchPollIntervalRef.current = null;
    }
    if (signalPollIntervalRef.current) {
      if (typeof signalPollIntervalRef.current === 'function') {
        signalPollIntervalRef.current();
      } else {
        clearInterval(signalPollIntervalRef.current);
      }
      signalPollIntervalRef.current = null;
    }
    if (chatPollIntervalRef.current) {
      if (typeof chatPollIntervalRef.current === 'function') {
        chatPollIntervalRef.current();
      } else {
        clearInterval(chatPollIntervalRef.current);
      }
      chatPollIntervalRef.current = null;
    }
    if (statusPollIntervalRef.current) {
      clearInterval(statusPollIntervalRef.current);
      statusPollIntervalRef.current = null;
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    setRemoteStream(null);
    hasRemoteDescriptionRef.current = false;
    iceCandidatesQueueRef.current = [];

    // Reset Debug state
    setDebugQueueStatus("idle");
    setDebugMatchStatus("Not matched");
    setDebugOfferSent(false);
    setDebugAnswerReceived(false);
    setDebugIceCandidatesSent(0);
    setDebugIceCandidatesReceived(0);
    setWebrtcConnectionState("new");
    setWebrtcIceState("new");
    setWebrtcSignalingState("stable");
  };
  
  // Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const activeFilterClass = funFilters.find(f => f.id === selectedFilter)?.class || "";
  const [friendStatus, setFriendStatus] = useState<"add" | "sending" | "friends">("add");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportReason, setReportReason] = useState("harassment");
  const [reportComments, setReportComments] = useState("");
  
  // Blocked users persistent client cache
  const [blockedPeerIds, setBlockedPeerIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("swiply_blocked_peers");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockSubmitting, setBlockSubmitting] = useState(false);
  const [blockSuccess, setBlockSuccess] = useState(false);
  
  const [giftOpen, setGiftOpen] = useState(false);
  
  // Floating emoji effect tracking
  const [floatingGifts, setFloatingGifts] = useState<{ id: number; symbol: string; x: number }[]>([]);

  // Premium & Subscription states
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem("swiply_premium") === "true" || localStorage.getItem("bharattalk_premium") === "true";
  });
  const [genderFilter, setGenderFilter] = useState<"everyone" | "girls" | "boys">("everyone");
  const [smartMatchEnabled, setSmartMatchEnabled] = useState<boolean>(false);
  const [smartMatchLanguage, setSmartMatchLanguage] = useState<string>("everyone");
  const [matchReason, setMatchReason] = useState<string>("");
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState<boolean>(false);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [onlyRealChats, setOnlyRealChats] = useState<boolean>(false);

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
  
  // Monkey.app layout state variables
  const [activeTab, setActiveTab] = useState<"solo" | "squad" | "inbox">("solo");
  const [genderDropdownOpen, setGenderDropdownOpen] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [isViewportFullscreen, setIsViewportFullscreen] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);

  // Friends & Inbox State
  const [friendsList, setFriendsList] = useState<Partner[]>(() => {
    try {
      const saved = localStorage.getItem("swiply_friends");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    const initialFriends: Partner[] = [];
    localStorage.setItem("swiply_friends", JSON.stringify(initialFriends));
    return initialFriends;
  });

  const [friendChats, setFriendChats] = useState<Record<string, Message[]>>(() => {
    try {
      const saved = localStorage.getItem("swiply_friend_chats");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    const seedChats: Record<string, Message[]> = {};
    localStorage.setItem("swiply_friend_chats", JSON.stringify(seedChats));
    return seedChats;
  });

  const [selectedFriendId, setSelectedFriendId] = useState<string>("p1");
  const [friendInputMessage, setFriendInputMessage] = useState("");
  const [isFriendTyping, setIsFriendTyping] = useState(false);

  useEffect(() => {
    if (activeTab === "inbox" && selectedFriendId) {
      setTimeout(() => {
        const container = document.getElementById("friend-messages-container");
        if (container) {
          container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
        }
      }, 80);
    }
  }, [activeTab, selectedFriendId, friendChats, isFriendTyping]);

  const handleSendFriendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!friendInputMessage.trim() || !selectedFriendId) return;

    const friend = friendsList.find(f => f.id === selectedFriendId);
    if (!friend) return;

    const userMsg: Message = {
      id: `friend_m_${Date.now()}`,
      role: "user",
      sender: "You",
      text: friendInputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    const currentChatsForFriend = friendChats[selectedFriendId] || [];
    const updatedChats = {
      ...friendChats,
      [selectedFriendId]: [...currentChatsForFriend, userMsg]
    };

    setFriendChats(updatedChats);
    localStorage.setItem("swiply_friend_chats", JSON.stringify(updatedChats));
    const originalText = friendInputMessage.trim();
    setFriendInputMessage("");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isViewportFullscreen) {
        setIsViewportFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isViewportFullscreen]);
  const [coinsCount, setCoinsCount] = useState(() => {
    const saved = localStorage.getItem("bharattalk_coins");
    return saved ? parseInt(saved, 10) : 50;
  });

  useEffect(() => {
    localStorage.setItem("bharattalk_coins", coinsCount.toString());
  }, [coinsCount]);

  const [coinsAnimation, setCoinsAnimation] = useState(false);
  
  const handleGenderFilterSelect = (mode: "girls" | "boys") => {
    if (isPremium) {
      setGenderFilter(mode);
    } else {
      if (coinsCount >= 10) {
        setGenderFilter(mode);
      } else {
        window.dispatchEvent(new CustomEvent("open-premium-modal"));
      }
    }
  };

  // Video refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize user media on mount
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const initCamera = async () => {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        // Apply initial states
        activeStream.getAudioTracks().forEach((track) => {
          track.enabled = !isMuted;
        });
        activeStream.getVideoTracks().forEach((track) => {
          track.enabled = isVideoEnabled;
        });
        
        setLocalStream(activeStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = activeStream;
        }
      } catch (err) {
        console.warn("Could not acquire webcam or permissions denied.", err);
      }
    };
    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Sync video toggle state
  useEffect(() => {
    const syncVideoState = async () => {
      if (localStream) {
        let videoTracks = localStream.getVideoTracks();
        
        // If tracks exist, just toggle them
        if (videoTracks.length > 0) {
          videoTracks.forEach(track => {
            track.enabled = isVideoEnabled;
            console.log(`WebRTC: Video track ${track.id} enabled=${track.enabled}, readyState=${track.readyState}`);
          });
        } else if (isVideoEnabled) {
          // If no video tracks exist (e.g. stopped externally), re-acquire and replace
          try {
            console.log("WebRTC: Re-acquiring video track...");
            const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const newVideoTrack = newStream.getVideoTracks()[0];
            
            if (newVideoTrack) {
              newVideoTrack.enabled = true;
              localStream.addTrack(newVideoTrack);
              
              if (peerConnectionRef.current) {
                const senders = peerConnectionRef.current.getSenders();
                const sender = senders.find(s => s.track?.kind === "video");
                if (sender) {
                  console.log("WebRTC: Replacing missing video track on RTCPeerConnection");
                  sender.replaceTrack(newVideoTrack);
                } else {
                   peerConnectionRef.current.addTrack(newVideoTrack, localStream);
                }
              }
            }
          } catch (err) {
            console.warn("WebRTC: Failed to re-acquire video track", err);
          }
        }
      }
    };
    syncVideoState();
  }, [isVideoEnabled, localStream]);

  // Sync audio toggle state
  useEffect(() => {
    const syncAudioState = async () => {
      if (localStream) {
        let audioTracks = localStream.getAudioTracks();
        
        if (audioTracks.length > 0) {
          audioTracks.forEach((track) => {
            track.enabled = !isMuted;
            console.log(`WebRTC: Audio track ${track.id} enabled=${track.enabled}, readyState=${track.readyState}`);
          });
        } else if (!isMuted) {
           try {
             console.log("WebRTC: Re-acquiring audio track...");
             const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
             const newAudioTrack = newStream.getAudioTracks()[0];
             
             if (newAudioTrack) {
               newAudioTrack.enabled = true;
               localStream.addTrack(newAudioTrack);
               
               if (peerConnectionRef.current) {
                 const senders = peerConnectionRef.current.getSenders();
                 const sender = senders.find(s => s.track?.kind === "audio");
                 if (sender) {
                   console.log("WebRTC: Replacing missing audio track on RTCPeerConnection");
                   sender.replaceTrack(newAudioTrack);
                 } else {
                    peerConnectionRef.current.addTrack(newAudioTrack, localStream);
                 }
               }
             }
           } catch (err) {
             console.warn("WebRTC: Failed to re-acquire audio track", err);
           }
        }
      }
    };
    syncAudioState();
  }, [isMuted, localStream]);

  // Bind local stream to local video element when stream or video ref updates
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log("WebRTC: Binding local MediaStream to video element");
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, sessionStatus]);

  // Bind remote stream to remote video element when stream or video ref updates
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log("WebRTC: Binding remote MediaStream to video element");
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, sessionStatus]);

  // Cleanup WebRTC and leave active matchmaking lobby when component unmounts
  useEffect(() => {
    return () => {
      cleanupWebRTC();
      leaveMatchmakingQueue(myPeerId).catch(err => console.error("Error leaving lobby on unmount:", err));
    };
  }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const acquireCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      // Apply initial mute state
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
      stream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoEnabled;
      });
      
      if (localStream) {
        stream.getTracks().forEach(track => {
           const existing = localStream.getTracks().find(t => t.kind === track.kind);
           if (existing) {
             localStream.removeTrack(existing);
             existing.stop();
           }
           localStream.addTrack(track);
        });
      } else {
        setLocalStream(stream);
      }
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream || stream;
      }
      if (peerConnectionRef.current) {
        const senders = peerConnectionRef.current.getSenders();
        stream.getTracks().forEach((track) => {
          const sender = senders.find(s => s.track?.kind === track.kind);
          if (sender) {
            sender.replaceTrack(track);
          } else {
            peerConnectionRef.current?.addTrack(track, localStream || stream);
          }
        });
      }
      setIsVideoEnabled(true);
    } catch (err) {
      console.warn("Could not acquire webcam or permissions denied.", err);
    }
  };

  const stopCamera = () => {
    setIsVideoEnabled(false);
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((t) => t !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  // WebRTC ICE Candidates Queue flusher
  const flushIceCandidates = async (pc: RTCPeerConnection) => {
    hasRemoteDescriptionRef.current = true;
    if (iceCandidatesQueueRef.current.length > 0) {
      console.log(`WebRTC: Flushing ${iceCandidatesQueueRef.current.length} queued remote ICE candidates...`);
      for (const candidate of iceCandidatesQueueRef.current) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("WebRTC: Successfully applied queued remote ICE candidate");
        } catch (err) {
          console.warn("WebRTC: Failed to apply queued remote ICE candidate:", err);
        }
      }
      iceCandidatesQueueRef.current = [];
    }
  };

  // Auto recovery on WebRTC failure
  const handleWebRTCFailure = () => {
    console.warn("WebRTC: Connection failure or ice disconnected.");
    if (sessionStatus === "connected" && partner?.isReal) {
      handlePartnerDisconnect();
    }
  };

  // Disconnect handler
  const handlePartnerDisconnect = () => {
    console.log("Matchmaking: Partner disconnected. Resetting state and auto-rematching...");
    const partnerToSkip = partner?.id;
    cleanupWebRTC();
    setPartner(null);
    setMessages([]);

    const notice: Message = {
      id: `notice-${Date.now()}`,
      role: "model",
      sender: "System",
      text: "Partner disconnected. Searching for a new match...",
      timestamp: new Date().toISOString()
    };
    setMessages([notice]);

    // Automatically trigger startMatching for seamless auto recovery!
    startMatching(partnerToSkip);
  };

  const [recentlySkipped, setRecentlySkipped] = useState<string[]>([]);

  // Perform matchmaking
  const startMatching = (skipPartnerId?: string) => {
    if ((genderFilter === "girls" || genderFilter === "boys") && !isPremium) {
      if (coinsCount >= 10) {
        setCoinsCount(prev => prev - 10);
      } else {
        window.dispatchEvent(new CustomEvent("open-premium-modal"));
        return;
      }
    }

    const currentSkipList = [...blockedPeerIds, ...recentlySkipped];
    const partnerToSkip = skipPartnerId || partner?.id;
    if (partnerToSkip && !currentSkipList.includes(partnerToSkip)) {
      currentSkipList.push(partnerToSkip);
      setRecentlySkipped(prev => [...prev, partnerToSkip]);
    }

    cleanupWebRTC();
    setSessionStatus("searching");
    setDebugQueueStatus("Searching/Queued");
    setPartner(null);
    setMessages([]);
    setFriendStatus("add");
    setReportSuccess(false);
    setMatchReason("");

    const joinLobby = async () => {
      try {
        console.log(`Matchmaking: Entering queue for peer ID ${myPeerId}`);
        let userName = "User " + myPeerId.slice(-4).toUpperCase();
        let userAge = 21;
        let userGender = "everyone";
        let userAvatarUrl = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150";

        try {
          const userStr = localStorage.getItem("swiply_user");
          if (userStr) {
            const userObj = JSON.parse(userStr);
            if (userObj.name) userName = userObj.name;
            if (userObj.age) userAge = parseInt(userObj.age);
            if (userObj.gender) userGender = userObj.gender;
            if (userObj.avatar) userAvatarUrl = userObj.avatar;
          }
        } catch (e) {}

        const userData = {
          peerId: myPeerId,
          name: userName,
          age: userAge,
          gender: userGender,
          interests: selectedInterests,
          avatarUrl: userAvatarUrl
        };

        // 1. Enter the queue
        const queueSize = await enterMatchmakingQueue(userData);
        console.log(`Matchmaking: Entered queue. Current queue size: ${queueSize}`);

        // 2. Try to match immediately
        const instantlyMatched = await tryToMatchWithSomeone(myPeerId, genderFilter, currentSkipList);
        
        // Note: if instantlyMatched is true, the snapshot listener we are about to set will trigger 
        // with the matched data. To avoid race conditions, we rely on the snapshot listener for the result.
        
        console.log("Matchmaking: In queue. Listening for matches...");
        
        // 3. Listen for changes to our matchmaking document
        matchPollIntervalRef.current = subscribeToMatchStatus(myPeerId, (matchData) => {
          console.log("Matchmaking: Match found!", matchData);
          
          if (matchPollIntervalRef.current && typeof matchPollIntervalRef.current === 'function') {
             matchPollIntervalRef.current(); // Unsubscribe immediately
             matchPollIntervalRef.current = null;
          }
          
          console.log(`Matchmaking: Room created ${matchData.roomId}. Proceeding to video...`);
          handleMatchedPartner(matchData.partner, matchData.role);
        });

      } catch (err) {
        console.error("Matchmaking: Failed to join lobby:", err);
      }
    };

    const handleMatchedPartner = async (partnerDetails: any, role: "offerer" | "answerer") => {
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      
      const isRealUser = partnerDetails.isReal !== undefined ? partnerDetails.isReal : true;
      const fullPartner: Partner = {
        id: partnerDetails.peerId,
        name: partnerDetails.name || "Real User",
        age: partnerDetails.age || 21,
        gender: partnerDetails.gender || "male",
        country: partnerDetails.country || "India",
        flag: partnerDetails.flag || "🇮🇳",
        interests: partnerDetails.interests || [],
        style: partnerDetails.style || "friendly stranger",
        avatarUrl: partnerDetails.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150",
        videoUrl: partnerDetails.videoUrl || "",
        status: partnerDetails.status || "Excited to connect!",
        bio: partnerDetails.bio || "Online on Swiply",
        isReal: isRealUser,
        peerId: partnerDetails.peerId,
        webrtcRole: role
      };

      setPartner(fullPartner);
      setSessionStatus("connected");
      setDebugQueueStatus("Connected");

      connectionTimeoutRef.current = setTimeout(() => {
        if (peerConnectionRef.current && peerConnectionRef.current.iceConnectionState !== "connected" && peerConnectionRef.current.iceConnectionState !== "completed") {
          console.warn("WebRTC: Connection timeout! Dropping ghost match.");
          handlePartnerDisconnect();
        }
      }, 15000);

      if (isRealUser) {
        // Initialize WebRTC signaling & local/remote tracks
        await initWebRTC(fullPartner, role === "offerer");

        // Start real-time polling for messages & WebRTC signals
        startRealTimePolling(fullPartner.peerId!);
      } else {
        console.log("Matchmaking: Connected to simulated partner, skipping WebRTC initialization.");
      }
    };

    joinLobby();
  };

  const initWebRTC = async (currentPartner: Partner, isOfferer: boolean) => {
    try {
      console.log(`Chime: Initializing MeetingSession. Is Offerer: ${isOfferer}`);
      setDebugMatchStatus(`Matched with ${currentPartner.id} (${isOfferer ? "Offerer" : "Answerer"})`);
      
      const meetingData = (currentPartner as any).meeting;
      const attendeeData = (currentPartner as any).attendee;
      if (!meetingData || !attendeeData) {
        console.error("Missing Chime meeting/attendee data");
        return;
      }

      const logger = new ConsoleLogger('ChimeMeetingLogs', LogLevel.INFO);
      const deviceController = new DefaultDeviceController(logger);
      const configuration = new MeetingSessionConfiguration(meetingData, attendeeData);
      const meetingSession = new DefaultMeetingSession(configuration, logger, deviceController);
      meetingSessionRef.current = meetingSession;

      const audioVideo = meetingSession.audioVideo;

      audioVideo.realtimeSubscribeToAttendeeIdPresence((attendeeId, present) => {
        console.log(`Attendee ${attendeeId} present: ${present}`);
      });

      audioVideo.addObserver({
        videoTileDidUpdate: tileState => {
          if (!tileState.boundAttendeeId || tileState.localTile || tileState.isContent) {
            return;
          }
          if (remoteVideoRef.current) {
            audioVideo.bindVideoElement(tileState.tileId, remoteVideoRef.current);
          }
        },
        videoTileWasRemoved: tileState => {
            console.log("Remote video removed");
        }
      });

      if (localStream) {
        const audioTracks = localStream.getAudioTracks();
        if (audioTracks.length > 0) {
          await (audioVideo as any).chooseAudioInputDevice(localStream);
        }
        const videoTracks = localStream.getVideoTracks();
        if (videoTracks.length > 0) {
          await (audioVideo as any).chooseVideoInputDevice(localStream);
          audioVideo.startLocalVideoTile();
        }
      }

      audioVideo.start();
      hasRemoteDescriptionRef.current = true;
      if (localVideoRef.current && localStream) {
         localVideoRef.current.srcObject = localStream;
      }

    } catch (err) {
      console.error("Chime: initWebRTC failed:", err);
    }
  };

  const startRealTimePolling = (partnerId: string) => {
    console.log(`WebRTC: Initiating real-time handlers for partner ${partnerId}`);

    // Listen for WebRTC signals (SDPs and candidates) via AWS
    signalPollIntervalRef.current = subscribeToSignals(myPeerId, async (senderId, signal) => {
      if (senderId !== partnerId) {
        console.warn(`WebRTC: Ignored signal from non-partner ${senderId}`);
        return;
      }

      const pc = peerConnectionRef.current;
      if (!pc) {
        console.warn("WebRTC: Received signal, but peer connection is uninitialized.");
        return;
      }

      if (signal.type === "offer") {
        console.log("WebRTC: Received SDP Offer. Setting remote description...");
        await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: signal.sdp }));
        await flushIceCandidates(pc);

        console.log("WebRTC: Generating SDP Answer...");
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        console.log("WebRTC: Transmitting SDP Answer to partner...");
        sendSignal(partnerId, { type: "answer", sdp: answer.sdp });
      } else if (signal.type === "answer") {
        console.log("WebRTC: Received SDP Answer. Setting remote description...");
        setDebugAnswerReceived(true);
        await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: signal.sdp }));
        await flushIceCandidates(pc);
      } else if (signal.type === "candidate" && signal.candidate) {
        console.log("WebRTC: Received remote ICE candidate");
        setDebugIceCandidatesReceived((prev) => prev + 1);
        if (pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            console.log("WebRTC: Successfully applied remote ICE candidate");
          } catch (err) {
            console.warn("WebRTC: Failed to apply remote ICE candidate:", err);
          }
        } else {
          console.log("WebRTC: Queueing remote ICE candidate (remote description not set yet)");
          iceCandidatesQueueRef.current.push(signal.candidate);
        }
      }
    });

    // Listen for messages via AWS
    chatPollIntervalRef.current = subscribeToChatMessages(myPeerId, (m: any) => {
      if (m.senderId !== partnerId) return;

      const reactionPrefix = "[REACTION]:";
      if (m.text && m.text.startsWith(reactionPrefix)) {
        const emoji = m.text.slice(reactionPrefix.length).trim();
        if (emoji) {
          triggerGift(emoji);
        }
      } else {
        setMessages((prev) => {
          const msgId = `msg-poll-${Date.now()}-${Math.random()}`;
          triggerSentimentAnalysis(msgId, m.text);
          return [
            ...prev,
            {
              id: msgId,
              role: "model",
              sender: "Partner", // Using 'Partner' directly since partner ref may be stale inside closure
              text: m.text,
              timestamp: m.timestamp || Date.now()
            }
          ];
        });
      }
    });

    // Poll partner status to detect disconnects instantly
    statusPollIntervalRef.current = setInterval(async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "";
        const res = await fetch(`${apiUrl}/api/match/status?peerId=${myPeerId}`);
        const data = await res.json();
        
        // If the server says we are no longer matched, or matched with someone else, or we timed out
        if (data.status === "waiting" || data.status === "idle" || (data.status === "matched" && data.partner.peerId !== partnerId)) {
          console.warn("Matchmaking: Status check detected that partner has left the session.");
          handlePartnerDisconnect();
        }
      } catch (err) {
        console.error("Matchmaking: Active status check failed:", err);
      }
    }, 2000);
  };

  // Handle skip next connection
  const handleSkipNext = () => {
    startMatching();
  };

  // Handle text chat submit
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !partner) return;

    const userText = inputText.trim();
    setInputText("");

    const userMsg: Message = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      sender: "Me",
      text: userText,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    triggerSentimentAnalysis(userMsg.id, userMsg.text);

    try {
      await sendChatMessage(partner.peerId!, myPeerId, { text: userText, timestamp: Date.now() });
    } catch (err) {
      console.error("Failed to transmit real-time text message:", err);
    }
  };

  // Friend Request Action
  const handleAddFriend = () => {
    setFriendStatus("sending");
    setTimeout(() => {
      setFriendStatus("friends");
      if (partner) {
        setFriendsList(prev => {
          if (prev.some(f => f.id === partner.id)) return prev;
          const updated = [...prev, partner];
          localStorage.setItem("swiply_friends", JSON.stringify(updated));
          return updated;
        });

        setFriendChats(prev => {
          if (prev[partner.id]) return prev;
          const updated = {
            ...prev,
            [partner.id]: []
          };
          localStorage.setItem("swiply_friend_chats", JSON.stringify(updated));
          return updated;
        });
      }
    }, 1500);
  };

  // Report Action
  const handleReportSubmit = async () => {
    if (!partner) return;
    setReportSubmitting(true);

    const reportId = `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const reportData = {
      id: reportId,
      reporterEmail: "anonymous@swiply.com",
      reporterPeerId: myPeerId,
      reportedPeerId: partner.id,
      reportedName: partner.name,
      reason: reportReason,
      comments: reportComments || "",
      timestamp: new Date().toISOString()
    };

    try {
      // 1. Save safety report to DynamoDB
      await saveUserReport(reportData);

      // 2. Report triggers auto-blocking on server matchmaking
      const apiUrl = import.meta.env.VITE_API_URL || "";
      await fetch(`${apiUrl}/api/match/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockerPeerId: myPeerId,
          blockedPeerId: partner.id
        })
      });

      // 3. Add to client-side block list
      const updatedBlocks = [...blockedPeerIds, partner.id];
      setBlockedPeerIds(updatedBlocks);
      localStorage.setItem("swiply_blocked_peers", JSON.stringify(updatedBlocks));

    } catch (err) {
      console.error("Failed to persist safety report to DynamoDB:", err);
    } finally {
      setReportSubmitting(false);
      setReportSuccess(true);
      setTimeout(() => {
        setReportOpen(false);
        setReportSuccess(false);
        setReportReason("harassment");
        setReportComments("");
        handleSkipNext(); // Auto skip matched user
      }, 4000);
    }
  };

  // Block Action
  const handleBlockSubmit = async () => {
    if (!partner) return;
    setBlockSubmitting(true);

    const blockId = `blk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const blockData = {
      id: blockId,
      blockerEmail: "anonymous@swiply.com",
      blockerPeerId: myPeerId,
      blockedPeerId: partner.id,
      blockedName: partner.name,
      timestamp: new Date().toISOString()
    };

    try {
      // 1. Save block record to DynamoDB
      await saveUserBlock(blockData);

      // 2. Disconnect and prevent matchmaking on the server
      const apiUrl = import.meta.env.VITE_API_URL || "";
      await fetch(`${apiUrl}/api/match/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockerPeerId: myPeerId,
          blockedPeerId: partner.id
        })
      });

      // 3. Update client-side list of blocked users
      const updatedBlocks = [...blockedPeerIds, partner.id];
      setBlockedPeerIds(updatedBlocks);
      localStorage.setItem("swiply_blocked_peers", JSON.stringify(updatedBlocks));

    } catch (err) {
      console.error("Failed to persist block record in DynamoDB:", err);
    } finally {
      setBlockSubmitting(false);
      setBlockSuccess(true);
      setTimeout(() => {
        setBlockOpen(false);
        setBlockSuccess(false);
        handleSkipNext(); // Auto skip to next partner
      }, 3000);
    }
  };

  // Trigger floating elements (gift bursts)
  const triggerGift = (symbol: string) => {
    const newGift = {
      id: Date.now() + Math.random(),
      symbol,
      x: 30 + Math.random() * 50 // Horizontal percentage
    };
    setFloatingGifts((prev) => [...prev, newGift]);
    // Remove after animation completes
    setTimeout(() => {
      setFloatingGifts((prev) => prev.filter((g) => g.id !== newGift.id));
    }, 4000);
  };

  const sendEmojiReaction = async (emoji: string) => {
    triggerGift(emoji);

    if (!partner) return;

    if (partner.isReal && partner.peerId) {
      try {
        await sendChatMessage(partner.peerId, myPeerId, { text: `[REACTION]:${emoji}`, timestamp: Date.now() });
      } catch (err) {
        console.error("Failed to transmit emoji reaction:", err);
      }
    }
  };

  return (
    <div className={`w-full mx-auto px-4 py-6 transition-all duration-300 ${theaterMode ? "max-w-7xl" : "max-w-6xl"}`} id="video-chat-container">
      
      {/* 1. IDLE State - Match Setup Dashboard */}
      {sessionStatus === "idle" && (
        <div className="w-full max-w-5xl mx-auto py-2 space-y-6">
          
          {/* Top Navigation Pill bar mimicking Monkey.app */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-3xl p-4 backdrop-blur-xl relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-cyan-500/5 pointer-events-none" />
            
            {/* Left side pills */}
            <div className="flex flex-wrap items-center gap-2.5 relative z-10">
              <button 
                type="button"
                onClick={() => alert("Safety Center: Swiply utilizes advanced real-time WebRTC connections, client reports, and blocklists to ensure a secure, respectful dating & friendship community. Maintain high standards!")}
                className="flex items-center gap-2 bg-[#5c4cf4]/10 hover:bg-[#5c4cf4]/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 font-bold text-xs px-4 py-2.5 rounded-full transition-all cursor-pointer shadow-sm shadow-emerald-500/5 animate-pulse-slow"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Safety Lab</span>
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  setTheaterMode(!theaterMode);
                  triggerGift("🎬");
                }}
                className={`flex items-center gap-2 font-bold text-xs px-4 py-2.5 rounded-full transition-all cursor-pointer shadow-sm ${
                  theaterMode 
                    ? "bg-purple-600 border border-purple-400/30 text-white shadow-purple-500/10" 
                    : "bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300"
                }`}
              >
                <Maximize2 className="h-4 w-4" />
                <span>Theater Mode</span>
              </button>

              <div className="flex items-center gap-2">
                <div 
                  className="flex items-center gap-2 bg-white/5 border border-amber-500/30 text-amber-400 font-black text-xs px-4 py-2.5 rounded-full transition-all shadow-md relative overflow-hidden"
                >
                  <Coins className="h-4 w-4 animate-bounce" style={{ animationDuration: '2s' }} />
                  <span>{coinsCount} Coins</span>
                  <AnimatePresence>
                    {coinsAnimation && (
                      <motion.span 
                        initial={{ y: 0, opacity: 1 }}
                        animate={{ y: -25, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute right-2 font-black text-xs text-amber-300 drop-shadow-md"
                      >
                        +10
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    // Simulate watching an ad
                    alert("Simulating Google Ad video... You earned 10 coins!");
                    setCoinsCount(prev => prev + 10);
                    setCoinsAnimation(true);
                    setTimeout(() => setCoinsAnimation(false), 800);
                    triggerGift("🪙");
                  }}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs px-3 py-2.5 rounded-full transition-all cursor-pointer shadow-md"
                >
                  <span>+ Watch Ad</span>
                </button>
              </div>
            </div>

            {/* Right side circle action buttons */}
            <div className="flex items-center gap-2.5 relative z-10">
              <button 
                type="button"
                title="Explore Tag Channels"
                onClick={() => {
                  const tagEl = document.getElementById("interests-section");
                  if (tagEl) {
                    tagEl.scrollIntoView({ behavior: "smooth" });
                    tagEl.classList.add("ring-2", "ring-purple-500", "duration-500");
                    setTimeout(() => tagEl.classList.remove("ring-2", "ring-purple-500"), 2000);
                  }
                }}
                className="h-10 w-10 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 flex items-center justify-center text-white border border-white/10 shadow-md hover:scale-110 active:scale-90 transition-all cursor-pointer font-bold"
              >
                <Hash className="h-4.5 w-4.5" />
              </button>

              <button 
                type="button"
                title="Unlock Swiply VIP"
                onClick={() => window.dispatchEvent(new CustomEvent("open-premium-modal"))}
                className="h-10 w-10 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 flex items-center justify-center text-black border border-white/10 shadow-md hover:scale-110 active:scale-90 transition-all cursor-pointer"
              >
                <Crown className="h-4.5 w-4.5 fill-current" />
              </button>

              <button 
                type="button"
                title="Match History"
                onClick={() => alert("History: You have met 14 friends this week! Expand your profile to view full session recordings.")}
                className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 border border-white/10 shadow-md hover:scale-110 active:scale-90 transition-all cursor-pointer"
              >
                <Clock className="h-4.5 w-4.5" />
              </button>

              <button 
                type="button"
                title="Active Friends Room"
                onClick={() => alert("Your interactive friend invitations room is currently active. Share your link to meet friends directly!")}
                className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 border border-white/10 shadow-md hover:scale-110 active:scale-90 transition-all cursor-pointer"
              >
                <Heart className="h-4.5 w-4.5 fill-current/10" />
              </button>

              <div className="relative group select-none">
                <div 
                  title="Your Swiply Avatar"
                  className={`h-10 w-10 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-base border shadow-md transition-all ${
                    isPremium ? "border-amber-400 ring-2 ring-amber-500/30" : "border-white/20"
                  }`}
                >
                  🧑‍🚀
                </div>
                {isPremium && (
                  <div className="absolute -top-3.5 -right-1.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-[8px] font-black text-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-[0_0_12px_rgba(245,158,11,0.5)] border border-amber-300 animate-bounce" style={{ animationDuration: "3s" }}>
                    <Crown className="h-2 w-2 fill-black/10 text-black" />
                    <span>VIP</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Dual Pane Layout: Grid */}
          {activeTab === "inbox" ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch animate-fadeIn">
              
              {/* Left Column: Selected Friend's Chat Window (Col Span 7) */}
              <div className="md:col-span-7 rounded-[32px] bg-slate-950/75 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col min-h-[460px] md:min-h-[520px]">
                {/* Header info of selected friend */}
                {selectedFriendId ? (() => {
                  const friend = friendsList.find(f => f.id === selectedFriendId);
                  if (!friend) return <div className="flex-1 flex items-center justify-center text-gray-500 font-bold text-sm">Select a friend to start chatting</div>;
                  return (
                    <>
                      <div className="p-4 bg-slate-900/50 border-b border-white/5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img src={friend.avatarUrl} alt={friend.name} className="h-10 w-10 rounded-full object-cover border border-white/10" referrerPolicy="no-referrer" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-white font-black text-sm font-display">{friend.name}</h4>
                              <span className="text-xs">{friend.flag}</span>
                            </div>
                            <p className="text-gray-400 text-[10px] italic leading-tight truncate max-w-xs">{friend.status}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase">Active Chat</span>
                        </div>
                      </div>

                      {/* Messages display */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col scrollbar-thin max-h-[300px] md:max-h-[360px]" id="friend-messages-container">
                        {(!friendChats[selectedFriendId] || friendChats[selectedFriendId].length === 0) ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 text-xs py-10 space-y-1">
                            <MessageSquare className="h-8 w-8 text-white/10 animate-pulse" />
                            <p>No messages yet. Send a friendly wave!</p>
                          </div>
                        ) : (
                          friendChats[selectedFriendId].map((msg) => {
                            const isMe = msg.role === "user";
                            return (
                              <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? "self-end items-end" : "self-start items-start"}`}>
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
                        {isFriendTyping && (
                          <div className="self-start bg-white/5 border border-white/5 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        )}
                      </div>

                      {/* Input form */}
                      <form onSubmit={handleSendFriendMessage} className="p-4 bg-slate-900/50 border-t border-white/5 flex gap-2 items-center">
                        <input
                          type="text"
                          value={friendInputMessage}
                          onChange={(e) => setFriendInputMessage(e.target.value)}
                          placeholder={`Message ${friend.name}...`}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-medium transition-colors"
                        />
                        <button
                          type="submit"
                          disabled={!friendInputMessage.trim()}
                          className="h-9 w-9 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </form>
                    </>
                  );
                })() : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 text-sm p-8 space-y-2">
                    <MessageSquare className="h-10 w-10 text-white/5" />
                    <p className="font-bold">Chat Screen</p>
                    <p className="text-xs text-gray-500 max-w-xs">Select any connected friend from your inbox list to open chat history and send messages!</p>
                  </div>
                )}
              </div>

              {/* Right Column: Friends Inbox List (Col Span 5) */}
              <div className="md:col-span-5 rounded-[32px] bg-[#5c4cf4] border border-white/10 shadow-[0_0_50px_rgba(92,76,244,0.3)] p-6 flex flex-col min-h-[460px] md:min-h-[520px] relative overflow-hidden">
                <div className="absolute -top-12 -left-12 w-40 h-40 bg-white/5 rounded-full blur-xl pointer-events-none animate-pulse" />
                <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-white/5 rounded-full blur-xl pointer-events-none animate-pulse" />

                <div className="relative z-10 flex flex-col h-full flex-1">
                  {/* Top segment */}
                  <div className="pb-4 border-b border-white/10 flex items-center justify-between">
                    <div>
                      <h3 className="text-white text-base font-black font-display tracking-tight flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-yellow-300" />
                        <span>My Friends Inbox</span>
                      </h3>
                      <p className="text-purple-100/75 text-[10px] font-semibold mt-0.5 font-sans">Matched and connected friends</p>
                    </div>
                    <span className="bg-yellow-300 text-black text-[9px] font-black px-2 py-0.5 rounded-full shadow-md font-sans">
                      {friendsList.length} Friends
                    </span>
                  </div>

                  {/* Friends items queue */}
                  <div className="flex-1 overflow-y-auto py-4 space-y-2 scrollbar-thin max-h-[360px]">
                    {friendsList.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center text-purple-100/60 text-xs py-12 space-y-2">
                        <Heart className="h-10 w-10 text-yellow-300 animate-pulse fill-yellow-300/10" />
                        <p className="font-bold text-white">Inbox is empty</p>
                        <p className="max-w-[180px] mx-auto text-[10px]">Start video matching and click 'Add Friend' to start building your connections!</p>
                        <button
                          onClick={() => setActiveTab("solo")}
                          className="mt-3 bg-yellow-300 hover:bg-yellow-200 text-black font-extrabold text-[10px] px-3 py-1.5 rounded-lg uppercase shadow-md transition-all cursor-pointer"
                        >
                          Find Friends Now
                        </button>
                      </div>
                    ) : (
                      friendsList.map((friend) => {
                        const isSelected = selectedFriendId === friend.id;
                        const lastMsg = friendChats[friend.id]?.[friendChats[friend.id].length - 1];
                        return (
                          <button
                            key={friend.id}
                            onClick={() => setSelectedFriendId(friend.id)}
                            className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer relative border ${
                              isSelected
                                ? "bg-white text-black border-transparent shadow-lg scale-[1.02]"
                                : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                            }`}
                          >
                            <div className="relative">
                              <img src={friend.avatarUrl} alt={friend.name} className="h-10 w-10 rounded-full object-cover border border-white/10" referrerPolicy="no-referrer" />
                              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-[#5c4cf4]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className={`font-black text-xs font-display flex items-center gap-1 ${isSelected ? "text-slate-900" : "text-white"}`}>
                                  <span>{friend.name}</span>
                                  <span className="text-xs">{friend.flag}</span>
                                </h4>
                                <span className={`text-[8px] font-semibold ${isSelected ? "text-gray-500" : "text-purple-200"}`}>
                                  {friend.country}
                                </span>
                              </div>
                              <p className={`text-[10px] truncate ${isSelected ? "text-gray-600" : "text-purple-100/80"}`}>
                                {lastMsg ? lastMsg.text : friend.status}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Return button */}
                  <button
                    onClick={() => setActiveTab("solo")}
                    className="w-full bg-white/15 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer text-center mt-auto border border-white/5"
                  >
                    Back to Matchmaking
                  </button>
                </div>
              </div>

            </div>
          ) : activeTab === "squad" ? (
            <SquadModeView
              localStream={localStream}
              localVideoRef={localVideoRef}
              isPremium={isPremium}
              onOpenPremium={() => window.dispatchEvent(new CustomEvent("open-premium-modal"))}
              onBackToSolo={() => setActiveTab("solo")}
              selectedFilter={selectedFilter}
              funFilters={funFilters}
              coinsCount={coinsCount}
              setCoinsCount={setCoinsCount}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              
              {/* Left Card: Camera Preview Display */}
              <div className="rounded-[32px] bg-slate-950/70 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[420px] md:min-h-[480px]">
                
                {/* Camera element */}
                {localStream ? (
                  <div className="absolute inset-0 w-full h-full z-0">
                    <video 
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover transform -scale-x-100 rounded-[32px] transition-all duration-300 ${activeFilterClass}`}
                    />
                    
                    {/* Subtle active camera HUD decoration overlay */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 z-10 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400">Webcam Active</span>
                    </div>

                    {/* Camera Filters Button overlay in Preview */}
                    <div className="absolute top-4 right-4 z-20">
                      <button
                        type="button"
                        onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                        className="flex items-center gap-1.5 rounded-full bg-black/60 hover:bg-black/85 text-white text-xs font-bold px-3 py-1.5 backdrop-blur-md border border-white/10 transition-all shadow-md cursor-pointer hover:scale-105"
                        id="btn-preview-filters-toggle"
                        title="Video Filters"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                        <span>Filters</span>
                      </button>

                      <AnimatePresence>
                        {filterMenuOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-40 cursor-default" 
                              onClick={() => setFilterMenuOpen(false)} 
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: 5 }}
                              className="absolute right-0 mt-2 w-36 rounded-xl bg-black/90 backdrop-blur-lg border border-white/10 p-1 shadow-2xl z-50 space-y-0.5"
                            >
                              <p className="text-[10px] font-extrabold text-gray-400 px-2 py-1 uppercase tracking-wider select-none border-b border-white/5 mb-1 text-center">
                                Select Filter
                              </p>
                              {funFilters.map((filter) => (
                                <button
                                  key={filter.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedFilter(filter.id);
                                    setFilterMenuOpen(false);
                                  }}
                                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                                    selectedFilter === filter.id
                                      ? "bg-purple-500/20 border border-purple-500/30 text-purple-300"
                                      : "text-gray-300 hover:bg-white/5 border border-transparent"
                                  }`}
                                >
                                  <span>{filter.emoji}</span>
                                  <span className="truncate">{filter.name}</span>
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="absolute bottom-4 left-4 z-10">
                      <button 
                        type="button"
                        onClick={stopCamera}
                        className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 shadow-lg transition-colors cursor-pointer"
                      >
                        Turn Off Cam
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6 relative z-10">
                    <div className="relative h-20 w-20 flex items-center justify-center rounded-3xl bg-white/5 border border-white/10 shadow-xl mx-auto text-gray-500">
                      <VideoOff className="h-10 w-10 text-gray-400" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold font-display text-white">Your Camera is Off</h3>
                      <p className="text-gray-400 text-xs max-w-xs mx-auto leading-relaxed">
                        Enable your webcam to preview your stream and instantly match with new friends face-to-face!
                      </p>
                    </div>

                    <button 
                      type="button"
                      onClick={acquireCamera}
                      className="rounded-2xl bg-[#5c4cf4] hover:bg-[#4c3cf3] text-white font-extrabold text-xs px-6 py-3 shadow-lg shadow-[#5c4cf4]/20 transition-all cursor-pointer scale-100 hover:scale-105 active:scale-95"
                    >
                      Enable Webcam Preview
                    </button>
                  </div>
                )}

                {/* Glowing decorative frame orbs */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
              </div>

              {/* Right Card: Matchmaker Controller exactly styled like Monkey.app */}
              <div className="rounded-[32px] bg-[#5c4cf4] border border-white/10 shadow-[0_0_50px_rgba(92,76,244,0.3)] p-8 flex flex-col justify-between text-center relative overflow-hidden min-h-[420px] md:min-h-[480px]">
                
                {/* Aesthetic subtle patterns behind match controls */}
                <div className="absolute -top-12 -left-12 w-40 h-40 bg-white/5 rounded-full blur-xl pointer-events-none animate-pulse" />
                <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-white/5 rounded-full blur-xl pointer-events-none animate-pulse" />
                
                {/* SOLO vs SQUAD vs INBOX Toggle bar */}
                <div className="flex items-center gap-1 bg-[#4734e5] p-1 rounded-2xl w-fit mx-auto relative z-10 border border-white/5">
                  <button 
                    type="button"
                    onClick={() => setActiveTab("solo")}
                    className={`text-2xs font-extrabold uppercase tracking-wider px-5 py-1.5 rounded-xl transition-all cursor-pointer ${
                      activeTab === "solo" 
                        ? "bg-[#ffe600] text-black shadow-sm" 
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    Solo
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActiveTab("inbox")}
                    className={`text-2xs font-extrabold uppercase tracking-wider px-5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                      activeTab === "inbox" 
                        ? "bg-[#ffe600] text-black shadow-sm" 
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <span>Inbox</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActiveTab("squad")}
                    className={`text-2xs font-extrabold uppercase tracking-wider px-5 py-1.5 rounded-xl transition-all cursor-pointer ${
                      activeTab === "squad" 
                        ? "bg-[#ffe600] text-black shadow-sm" 
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    Squad
                  </button>
                </div>

                {/* Central Cute Monkey SVG logo illustration exactly matching monkey.app layout */}
                <div className="my-auto space-y-6 relative z-10">
                  <div className="w-20 h-20 bg-[#3b82f6] rounded-[24px] flex items-center justify-center mx-auto shadow-xl border border-white/10 group hover:rotate-6 transition-all duration-300">
                    <svg viewBox="0 0 100 100" className="w-14 h-14 select-none drop-shadow-md">
                      {/* Face mask and base */}
                      <circle cx="50" cy="50" r="38" fill="#eab308" />
                      {/* Ears */}
                      <circle cx="15" cy="50" r="11" fill="#ca8a04" />
                      <circle cx="85" cy="50" r="11" fill="#ca8a04" />
                      <circle cx="15" cy="50" r="6" fill="#eab308" />
                      <circle cx="85" cy="50" r="6" fill="#eab308" />
                      {/* Heart shaped inner face */}
                      <path d="M28,45 C28,34 44,28 50,37 C56,28 72,34 72,45 C72,62 50,73 50,73 C50,73 28,62 28,45 Z" fill="#fef08a" />
                      {/* Eyes */}
                      <circle cx="41" cy="45" r="3.5" fill="#1e293b" />
                      <circle cx="59" cy="45" r="3.5" fill="#1e293b" />
                      {/* Cute blushing cheeks */}
                      <circle cx="34" cy="51" r="3" fill="#f87171" opacity="0.6" />
                      <circle cx="66" cy="51" r="3" fill="#f87171" opacity="0.6" />
                      {/* Mouth curved smile */}
                      <path d="M43,57 Q50,63 57,57" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none" />
                    </svg>
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="text-3xl font-black tracking-tight text-white font-display">
                      Swiply
                    </h2>
                    <p className="text-purple-100/90 text-xs font-semibold max-w-xs mx-auto">
                      Make new friends face-to-face
                    </p>
                  </div>
                </div>

                {/* Bottom Controllers: Gender Dropdown & Start Matchmaking button */}
                <div className="space-y-3.5 relative z-20">
                  
                  {/* Custom White Dropdown selection button for Gender filter */}
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
                      <ChevronDown className={`h-4 w-4 text-black transition-transform duration-300 ${genderDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {genderDropdownOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full mb-2 left-0 right-0 bg-white text-black rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 text-left"
                        >
                          <button 
                            type="button"
                            onClick={() => {
                              setGenderFilter("everyone");
                              setGenderDropdownOpen(false);
                            }}
                            className="w-full text-xs font-bold px-4 py-3 text-left hover:bg-gray-100 transition-colors flex items-center justify-between border-b border-gray-50"
                          >
                            <span>🌐 Everyone (Both)</span>
                            {genderFilter === "everyone" && <Check className="h-4 w-4 text-purple-600" />}
                          </button>

                          <button 
                            type="button"
                            onClick={() => {
                              handleGenderFilterSelect("girls");
                              setGenderDropdownOpen(false);
                            }}
                            className="w-full text-xs font-bold px-4 py-3 text-left hover:bg-gray-100 transition-colors flex items-center justify-between border-b border-gray-50"
                          >
                            <span className="flex items-center gap-1.5">
                              <span>🙋‍♀️ Girls Only</span>
                              <span className="text-[8px] bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-1.5 py-0.5 rounded font-black tracking-wider uppercase leading-none scale-90">
                                VIP
                              </span>
                            </span>
                            {genderFilter === "girls" && <Check className="h-4 w-4 text-purple-600" />}
                          </button>

                          <button 
                            type="button"
                            onClick={() => {
                              handleGenderFilterSelect("boys");
                              setGenderDropdownOpen(false);
                            }}
                            className="w-full text-xs font-bold px-4 py-3 text-left hover:bg-gray-100 transition-colors flex items-center justify-between"
                          >
                            <span className="flex items-center gap-1.5">
                              <span>🙋‍♂️ Boys Only</span>
                              <span className="text-[8px] bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-1.5 py-0.5 rounded font-black tracking-wider uppercase leading-none scale-90">
                                VIP
                              </span>
                            </span>
                            {genderFilter === "boys" && <Check className="h-4 w-4 text-purple-600" />}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Bright Yellow action button styled exactly like monkey.app with 3D tactile shadow */}
                  <button 
                    type="button"
                    onClick={startMatching}
                    className="w-full bg-[#ffe600] text-black font-black uppercase text-sm tracking-widest py-4.5 rounded-2xl shadow-[0_5px_0_#9d8100] active:translate-y-1 active:shadow-none hover:bg-yellow-300 transition-all flex items-center justify-center gap-2 cursor-pointer border border-yellow-400/10"
                  >
                    <Video className="h-4 w-4" />
                    <span>Start Video Chat</span>
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* Tray 3: Interests selecting box at bottom (Interactive and beautiful) */}
          <div className="rounded-[32px] bg-slate-900/60 border border-white/10 p-6 shadow-xl text-center relative overflow-hidden" id="interests-section">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-cyan-500/5 pointer-events-none" />
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2 justify-center">
                <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-300">Select Interests (Optional Filter)</h3>
              </div>
              <p className="text-[11px] text-gray-400 max-w-md mx-auto">
                Toggle interest tags below. We will preferentially filter and pair you with friends who match your selected vibes!
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {availableInterests.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`text-xs font-semibold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 border-transparent text-white shadow-lg shadow-purple-500/20 scale-105"
                          : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-purple-500/30 hover:text-white"
                      }`}
                    >
                      #{interest}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 2. SEARCHING State - Simple Layout */}
      {sessionStatus === "searching" && (() => {
        let userAvatarUrl = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150";
        try {
          const userStr = localStorage.getItem("swiply_user");
          if (userStr) {
            const userObj = JSON.parse(userStr);
            if (userObj.avatar) userAvatarUrl = userObj.avatar;
          }
        } catch(e) {}
        
        return (
          <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-10 animate-fadeIn">
            {/* Pulse Animation Container */}
            <div className="relative h-56 w-56 flex items-center justify-center mt-8">
              {/* Outer Pulse Rings */}
              <div className="absolute inset-0 rounded-full border-2 border-[#5c4cf4]/30 animate-ping" style={{ animationDuration: '3s' }}></div>
              <div className="absolute inset-6 rounded-full border-2 border-purple-500/20 animate-ping" style={{ animationDuration: '2s' }}></div>
              <div className="absolute inset-10 rounded-full border-2 border-blue-400/20 animate-ping" style={{ animationDuration: '1.5s' }}></div>
              
              {/* Avatar Center */}
              <div className="relative z-10 h-28 w-28 rounded-full overflow-hidden border-4 border-slate-900 shadow-[0_0_40px_rgba(92,76,244,0.6)] ring-4 ring-[#5c4cf4]/50">
                <img 
                  src={userAvatarUrl} 
                  alt="My Avatar" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="space-y-4 max-w-sm mx-auto">
              <h3 className="text-2xl font-black text-white tracking-wide uppercase font-display flex items-center justify-center gap-2">
                <RefreshCw className="h-5 w-5 text-[#5c4cf4] animate-spin" />
                Searching for users...
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed font-medium px-4">
                Scanning the globe for the perfect match. Please hold on while we connect you to an available user.
              </p>
            </div>
            
            <div className="space-y-1 text-center min-h-[24px]">
              {selectedInterests.length > 0 && (
                <p className="text-[#5c4cf4] text-xs font-bold uppercase tracking-widest bg-[#5c4cf4]/10 inline-block px-3 py-1.5 rounded-full border border-[#5c4cf4]/20">
                  {selectedInterests.map(t => `#${t}`).join("  ")}
                </p>
              )}
            </div>

            <button
              onClick={() => {
                cleanupWebRTC();
                leaveMatchmakingQueue(myPeerId).catch(err => console.error("Error leaving lobby on cancel:", err));
                setSessionStatus("idle");
              }}
              className="text-gray-400 hover:text-white text-sm font-bold transition-all cursor-pointer px-6 py-2.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10 uppercase tracking-wider"
              id="btn-cancel-search"
            >
              Cancel Search
            </button>
          </div>
        );
      })()}

      {/* 3. CONNECTED State - Live Split Video Call & Real-time Text chat */}
      {sessionStatus === "connected" && partner && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative">
          
          {/* Floating Emoji animations */}
          <AnimatePresence>
            {floatingGifts.map((gift) => (
              <motion.div
                key={gift.id}
                initial={{ opacity: 0, y: "100%", x: `${gift.x}%` }}
                animate={{ opacity: [0, 1, 1, 0], y: ["100%", "20%", "0%"] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 3.5, ease: "easeOut" }}
                className="absolute bottom-20 z-50 text-5xl pointer-events-none select-none"
              >
                {gift.symbol}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Left panel (Match & User Camera displays) - Column Span based on Theater Mode */}
          <div className={`flex flex-col gap-4 transition-all duration-300 ${theaterMode ? "lg:col-span-12" : "lg:col-span-8"}`}>
            
            {/* Picture-in-Picture Video Calling Display */}
            <div className={`transition-all duration-300 bg-[#0d0d0d] ${
              isViewportFullscreen 
                ? "fixed inset-0 z-[100] w-screen h-screen rounded-none border-none shadow-none" 
                : `relative rounded-[28px] overflow-hidden border border-white/10 shadow-2xl ${
                    theaterMode ? "h-[500px] sm:h-[650px]" : "h-[400px] sm:h-[500px]"
                  }`
            }`}>
              
              {/* Card 1: Match Stream (Real WebRTC or Simulated Video - BIG SCREEN) */}
              <div className="absolute inset-0 w-full h-full z-0">
                {partner.isReal ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="h-full w-full object-cover transition-all duration-700"
                  />
                ) : partner.videoUrl ? (
                  <video
                    src={partner.videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover transition-all duration-700"
                  />
                ) : (
                  <img
                    src={partner.avatarUrl}
                    alt={partner.name}
                    className="h-full w-full object-cover transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                )}

                {/* Status Overlays */}
                <div className="absolute top-4 left-4 flex flex-col sm:flex-row sm:items-center gap-2 z-10">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-sky-500 live-indicator-pulse" />
                    <span className="bg-black/60 backdrop-blur-md text-[10px] font-bold text-white px-3 py-1 rounded-full uppercase tracking-wider border border-white/5">
                      Live Channel
                    </span>
                  </div>
                  
                  {/* Small non-intrusive session timer */}
                  <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/5 text-[10px] font-bold text-cyan-400 px-3 py-1 rounded-full uppercase tracking-wider select-none shadow-md">
                    <Clock className="h-3 w-3 text-cyan-400 animate-pulse" />
                    <span>{formatTime(sessionTime)}</span>
                  </div>

                  <button
                    onClick={() => {
                      setReportReason("harassment");
                      setReportComments("");
                      setReportSubmitting(false);
                      setReportSuccess(false);
                      setReportOpen(true);
                    }}
                    className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/5 hover:border-rose-500/30 text-[10px] font-bold text-gray-300 hover:text-rose-400 px-3 py-1 rounded-full uppercase tracking-wider transition-all cursor-pointer hover:bg-rose-950/40"
                    title="Report partner for inappropriate conduct"
                    id="btn-report-overlay"
                  >
                    <AlertOctagon className="h-3 w-3 text-rose-500 animate-pulse" />
                    <span>Report</span>
                  </button>

                  <button
                    onClick={() => {
                      setBlockSubmitting(false);
                      setBlockSuccess(false);
                      setBlockOpen(true);
                    }}
                    className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/5 hover:border-rose-500/30 text-[10px] font-bold text-gray-300 hover:text-rose-400 px-3 py-1 rounded-full uppercase tracking-wider transition-all cursor-pointer hover:bg-rose-950/40"
                    title="Block this user and prevent matching ever again"
                    id="btn-block-overlay"
                  >
                    <Ban className="h-3 w-3 text-rose-500 animate-pulse" />
                    <span>Block</span>
                  </button>
                </div>

                 {/* Floating Quick Reaction Bar */}
                 <div className="absolute top-4 right-4 z-30 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10 shadow-lg" id="quick-reactions-bar">
                   <span className="text-[10px] text-gray-400 font-bold mr-1.5 select-none hidden sm:inline pl-1">React:</span>
                   {["👋", "🔥", "🚀", "❤️"].map((emoji) => (
                     <button
                       key={emoji}
                       onClick={() => sendEmojiReaction(emoji)}
                       className="text-lg hover:scale-130 active:scale-95 transition-all duration-150 p-1 cursor-pointer hover:bg-white/10 rounded-full"
                       title={`Send ${emoji} reaction`}
                       id={`btn-react-${emoji}`}
                     >
                       {emoji}
                     </button>
                   ))}
                 </div>

                {/* Match Info Panel - Positioned in the bottom-left */}
                <div className="absolute bottom-4 left-4 max-w-[calc(100%-140px-2rem)] sm:max-w-md bg-black/60 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg z-10">
                  {matchReason && (
                    <div className="mb-3 px-2.5 py-1.5 bg-gradient-to-r from-amber-500/20 to-purple-600/20 border border-amber-500/30 rounded-xl flex items-center gap-1.5 animate-pulse">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span className="text-[10px] font-extrabold text-amber-200 tracking-wide line-clamp-1">AI Curated: {matchReason}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-white font-bold text-base font-display flex items-center gap-2">
                        <span>{partner.name}, {partner.age}</span>
                        <span className="text-sm">{partner.flag}</span>
                      </h4>
                      <p className="text-gray-300 text-xs mt-0.5">{partner.country}</p>
                    </div>
                    {/* Filter Overlap Tags */}
                    <div className="flex flex-wrap gap-1 justify-end shrink-0">
                      {partner.interests.slice(0, 2).map((interest, i) => (
                        <span key={i} className="text-[9px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-md px-1.5 py-0.5">
                          #{interest}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-400 text-2xs italic mt-2 line-clamp-1">{partner.status}</p>
                </div>
              </div>

              {/* Prominent floating Skip Button or Immersive Fullscreen Controls Dock */}
              {isViewportFullscreen ? (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-black/85 backdrop-blur-xl border border-white/15 px-5 py-3 rounded-2xl shadow-2xl">
                  {/* Mic mute toggle */}
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isMuted ? "bg-rose-600 border border-rose-400 text-white" : "bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300"
                    }`}
                    title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>

                  {/* Video camera toggle */}
                  <button
                    onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                    className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      !isVideoEnabled ? "bg-rose-600 border border-rose-400 text-white" : "bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300"
                    }`}
                    title={isVideoEnabled ? "Disable Camera" : "Enable Camera"}
                  >
                    {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </button>

                  {/* Skip Button */}
                  <button
                    onClick={handleSkipWithAnimation}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-4 py-2.5 text-xs shadow-lg shadow-purple-500/20 hover:scale-103 transition-all cursor-pointer border border-white/10"
                  >
                    <SkipForward className="h-4 w-4" />
                    <span>Skip</span>
                  </button>

                  <div className="h-6 w-[1px] bg-white/10 mx-1" />

                  {/* Exit Fullscreen button */}
                  <button
                    onClick={() => setIsViewportFullscreen(false)}
                    className="flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2.5 text-xs transition-all cursor-pointer border border-cyan-400/30"
                    title="Exit Fullscreen Viewport"
                    id="btn-fullscreen-dock-exit"
                  >
                    <Minimize2 className="h-4 w-4" />
                    <span>Exit Fullscreen</span>
                  </button>
                </div>
              ) : (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(244, 63, 94, 0.45)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSkipWithAnimation}
                    className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-extrabold px-6 py-3.5 text-xs tracking-wider uppercase shadow-2xl shadow-rose-500/30 border border-white/15 transition-all cursor-pointer hover:border-white/30"
                    id="btn-prominent-skip"
                  >
                    <SkipForward className="h-4 w-4 animate-pulse" />
                    <span>Skip Partner</span>
                  </motion.button>
                </div>
              )}

              {/* Custom Re-match Animation Overlay */}
              <AnimatePresence>
                {isRematching && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-[#07070a]/95 flex flex-col items-center justify-center space-y-4 backdrop-blur-md"
                  >
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full border-4 border-t-rose-500 border-r-purple-500 border-b-cyan-500 border-l-transparent animate-spin" />
                      <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-rose-500/10 animate-ping" />
                    </div>
                    <p className="text-sm font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-purple-300 to-cyan-400 uppercase animate-pulse font-display">
                      Skipping Connection...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Card 2: User Stream (Actual Camera - SMALL SCREEN Overlay) */}
              <div className={`absolute bottom-4 rounded-2xl overflow-hidden bg-[#171717]/95 border border-white/20 shadow-2xl z-20 transition-all duration-300 hover:scale-105 w-32 h-44 sm:w-40 sm:h-52 ${
                theaterMode && isChatVisible ? "right-4 lg:right-[356px]" : "right-4"
              }`}>
                
                {isVideoEnabled && localStream ? (
                  <>
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`h-full w-full object-cover transform -scale-x-100 transition-all duration-300 ${activeFilterClass}`}
                    />

                    {/* Filter Selector Overlay inside User Cam card */}
                    <div className="absolute top-2 right-2 z-30">
                      <button
                        type="button"
                        onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                        className="h-6 w-6 rounded-md bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-all shadow-md cursor-pointer hover:scale-105"
                        id="btn-active-filters-toggle"
                        title="Video Filters"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                      </button>

                      <AnimatePresence>
                        {filterMenuOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-40 cursor-default" 
                              onClick={() => setFilterMenuOpen(false)} 
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: 5 }}
                              className="absolute right-0 mt-1.5 w-28 rounded-lg bg-black/95 backdrop-blur-lg border border-white/10 p-1 shadow-2xl z-50 space-y-0.5"
                            >
                              <p className="text-[8px] font-extrabold text-gray-400 px-1.5 py-0.5 uppercase tracking-wider select-none border-b border-white/5 mb-0.5 text-center">
                                Filters
                              </p>
                              {funFilters.map((filter) => (
                                <button
                                  key={filter.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedFilter(filter.id);
                                    setFilterMenuOpen(false);
                                  }}
                                  className={`w-full text-left px-1.5 py-1 rounded-md text-[9px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                    selectedFilter === filter.id
                                      ? "bg-purple-500/20 border border-purple-500/30 text-purple-300"
                                      : "text-gray-300 hover:bg-white/5 border border-transparent"
                                  }`}
                                >
                                  <span>{filter.emoji}</span>
                                  <span className="truncate">{filter.name}</span>
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                ) : (
                  // Camera disabled / fallback placeholder
                  <div className="h-full w-full flex flex-col items-center justify-center p-3 text-center space-y-2">
                    <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
                      <VideoOff className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-[10px]">Cam Off</p>
                      <button
                        onClick={acquireCamera}
                        className="rounded-lg bg-purple-600 hover:bg-purple-500 text-white px-2 py-1 text-[8px] font-bold mt-1 cursor-pointer transition-colors"
                      >
                        Authorize
                      </button>
                    </div>
                  </div>
                )}

                {/* Overlays */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                  <div className="bg-black/60 backdrop-blur-md text-[8px] font-bold text-white px-2 py-0.5 rounded-md uppercase tracking-wider border border-white/5">
                    Your Cam
                  </div>
                  {isPremium && (
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-[8px] font-bold text-black px-1.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-0.5 shadow-md">
                      <Crown className="h-2.5 w-2.5 fill-black/10" />
                      VIP
                    </div>
                  )}
                </div>

                {/* Controls inside camera preview card */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-10">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      isMuted ? "bg-rose-500/80 text-white" : "bg-black/60 text-white hover:bg-black/80"
                    }`}
                    title={isMuted ? "Unmute Mic" : "Mute Mic"}
                  >
                    {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                    className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      !isVideoEnabled ? "bg-rose-500/80 text-white" : "bg-black/60 text-white hover:bg-black/80"
                    }`}
                    title={isVideoEnabled ? "Disable Camera" : "Enable Camera"}
                  >
                    {isVideoEnabled ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

            </div>

            {/* Action Tray controls underneath screens */}
            <div className="rounded-2xl glass-panel px-6 py-4 border border-white/10 flex flex-wrap items-center justify-between gap-4">
              
              {/* Left tray: Report & Block */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setReportReason("harassment");
                    setReportComments("");
                    setReportSubmitting(false);
                    setReportSuccess(false);
                    setReportOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                  id="btn-report-match"
                >
                  <AlertOctagon className="h-4 w-4" />
                  Report User
                </button>

                <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

                <button
                  onClick={() => {
                    setBlockSubmitting(false);
                    setBlockSuccess(false);
                    setBlockOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                  id="btn-block-match"
                  title="Block this user and skip immediately"
                >
                  <Ban className="h-4 w-4 text-rose-500/80" />
                  Block User
                </button>
              </div>

              {/* Center tray: Next, Gift & Theater Mode */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setGiftOpen(!giftOpen)}
                  className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer"
                  id="btn-gift-menu"
                >
                  <Gift className="h-4 w-4 text-pink-400" />
                  Send Gift
                </button>

                <button
                  onClick={() => setTheaterMode(!theaterMode)}
                  className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                    theaterMode 
                      ? "bg-purple-600 border-purple-400 text-white shadow-md shadow-purple-500/20" 
                      : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                  }`}
                  id="btn-theater-mode-toggle"
                >
                  <Maximize2 className="h-4 w-4" />
                  <span>{theaterMode ? "Normal Screen" : "Theater Mode"}</span>
                </button>

                {theaterMode && (
                  <button
                    onClick={() => setIsChatVisible(!isChatVisible)}
                    className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                      isChatVisible 
                        ? "bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-500/20" 
                        : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                    }`}
                    id="btn-toggle-chat-overlay"
                  >
                    {isChatVisible ? <MessageSquareOff className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                    <span>{isChatVisible ? "Hide Chat" : "Show Chat"}</span>
                  </button>
                )}

                <button
                  onClick={() => setIsViewportFullscreen(!isViewportFullscreen)}
                  className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                    isViewportFullscreen 
                      ? "bg-cyan-600 border-cyan-400 text-white shadow-md shadow-cyan-500/20" 
                      : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                  }`}
                  id="btn-viewport-fullscreen-toggle"
                  title="Toggle Fullscreen Video Viewport"
                >
                  {isViewportFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  <span>{isViewportFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                    isMuted 
                      ? "bg-rose-600 border-rose-400 text-white shadow-md shadow-rose-500/20 animate-pulse" 
                      : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                  }`}
                  id="btn-mic-mute-toggle"
                  title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                >
                  {isMuted ? <MicOff className="h-4 w-4 text-rose-300" /> : <Mic className="h-4 w-4 text-sky-400 animate-pulse" />}
                  <span>{isMuted ? "Mic Muted" : "Mute Mic"}</span>
                </button>

                <button
                  onClick={handleSkipWithAnimation}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-6 py-2.5 text-sm shadow-lg shadow-purple-500/20 hover:scale-103 transition-all cursor-pointer"
                  id="btn-next-match"
                >
                  <SkipForward className="h-4 w-4" />
                  Next Match
                </button>
              </div>

              {/* Right tray: Add friend */}
              <div>
                {friendStatus === "add" && (
                  <button
                    onClick={handleAddFriend}
                    className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer hover:scale-103"
                    id="btn-add-friend"
                  >
                    <Heart className="h-4 w-4 fill-cyan-400/10 text-cyan-400" />
                    Add Friend
                  </button>
                )}
                {friendStatus === "sending" && (
                  <span className="text-xs text-gray-400 font-semibold animate-pulse">
                    Sending request...
                  </span>
                )}
                {friendStatus === "friends" && (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    💚 Friends connected!
                  </span>
                )}
              </div>

            </div>

            {/* Gift Selector catalog popup overlay */}
            <AnimatePresence>
              {giftOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="rounded-2xl glass-panel-heavy p-4 border border-white/15 shadow-2xl flex items-center gap-4 justify-around max-w-sm"
                >
                  <div className="text-center">
                    <button onClick={() => { triggerGift("🌹"); setGiftOpen(false); }} className="text-3xl hover:scale-125 transition-transform block cursor-pointer">🌹</button>
                    <span className="text-[10px] text-gray-400 font-medium">Rose</span>
                  </div>
                  <div className="text-center">
                    <button onClick={() => { triggerGift("👑"); setGiftOpen(false); }} className="text-3xl hover:scale-125 transition-transform block cursor-pointer">👑</button>
                    <span className="text-[10px] text-gray-400 font-medium">Crown</span>
                  </div>
                  <div className="text-center">
                    <button onClick={() => { triggerGift("🔥"); setGiftOpen(false); }} className="text-3xl hover:scale-125 transition-transform block cursor-pointer">🔥</button>
                    <span className="text-[10px] text-gray-400 font-medium">Fire</span>
                  </div>
                  <div className="text-center">
                    <button onClick={() => { triggerGift("🍿"); setGiftOpen(false); }} className="text-3xl hover:scale-125 transition-transform block cursor-pointer">🍿</button>
                    <span className="text-[10px] text-gray-400 font-medium">Popcorn</span>
                  </div>
                  <button onClick={() => setGiftOpen(false)} className="text-gray-400 hover:text-white p-1">
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Right panel (Text Message Chat overlay container) - Column Span based on Theater Mode */}
          <div className={`flex flex-col rounded-[28px] glass-panel border border-white/10 shadow-2xl relative overflow-hidden bg-[#0d0d0d]/50 transition-all duration-300 ${
            theaterMode 
              ? `${isChatVisible ? "lg:absolute lg:top-0 lg:right-0 lg:h-[650px] lg:w-80 lg:z-30 lg:bg-black/85 lg:backdrop-blur-md lg:rounded-r-[28px] lg:rounded-l-none lg:border-l lg:border-white/10 lg:shadow-2xl flex" : "hidden lg:hidden"}`
              : "lg:col-span-4 h-[535px] flex"
          }`}>
            
            {/* Chat header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-black/15">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-bold text-white font-display">Live Chat Room</span>
              </div>
              <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20 uppercase">
                Active
              </span>
            </div>

            {/* Chat messages queue */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="h-10 w-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 mb-2">
                    <Smile className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-gray-500 font-medium">Say hello to {partner.name}! Send a message below.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.role === "user";
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col max-w-[85%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}
                    >
                      <span className="text-[10px] text-gray-400 font-semibold mb-0.5 px-1">{msg.sender}</span>
                      <div className="flex items-center gap-2 w-full">
                        {!isMe && msg.sentiment && (
                          <div 
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 border border-white/5 text-xs shadow-md select-none cursor-help hover:scale-110 transition-transform"
                            title={`Sentiment: ${msg.sentiment.tone}`}
                          >
                            {msg.sentiment.emoji}
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                            isMe
                              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none"
                              : "bg-white/10 text-gray-100 rounded-tl-none border border-white/5"
                          }`}
                        >
                          {msg.text}
                        </div>
                        {isMe && msg.sentiment && (
                          <div 
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 border border-white/5 text-xs shadow-md select-none cursor-help hover:scale-110 transition-transform"
                            title={`Sentiment: ${msg.sentiment.tone}`}
                          >
                            {msg.sentiment.emoji}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex flex-col items-start max-w-[85%] mr-auto">
                  <span className="text-[10px] text-gray-400 font-semibold mb-0.5 px-1">{partner.name}</span>
                  <div className="bg-white/10 rounded-2xl rounded-tl-none px-4 py-3 border border-white/5 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Chat submit box */}
            <form onSubmit={handleSendMessage} className="p-4 bg-black/15 border-t border-white/5 flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                id="chat-input"
              />
              <button
                type="submit"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 transition-all cursor-pointer shadow-md shadow-purple-500/15"
                id="btn-chat-send"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>

          </div>

        </div>
      )}

      {/* Report dialog popup */}
      <AnimatePresence>
        {reportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="w-full max-w-md rounded-[28px] glass-panel-heavy p-6 border border-white/15 shadow-2xl relative"
            >
              {/* Close Button */}
              <button
                onClick={() => !reportSubmitting && !reportSuccess && setReportOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/5 cursor-pointer"
                disabled={reportSubmitting || reportSuccess}
              >
                <X className="h-4 w-4" />
              </button>

              {reportSubmitting ? (
                <div className="space-y-6 py-8 text-center">
                  <div className="h-14 w-14 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="space-y-2">
                    <h4 className="text-white text-base font-bold font-display">Processing Safety Report</h4>
                    <p className="text-gray-400 text-xs leading-relaxed max-w-xs mx-auto animate-pulse">
                      Analyzing WebRTC media streams, capturing metadata, and dispatching report to the live moderation team...
                    </p>
                  </div>
                </div>
              ) : !reportSuccess ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                      <AlertOctagon className="h-5.5 w-5.5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-white text-base font-bold font-display">Report {partner.name}</h4>
                      <p className="text-gray-400 text-2xs">Help keep Swiply safe and respectful.</p>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-1" />

                  {/* Reason Categories */}
                  <div className="space-y-2.5">
                    <label className="block text-2xs font-extrabold text-gray-400 uppercase tracking-widest">
                      Select primary reason
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "harassment", label: "Abuse/Harassment", emoji: "🗣️" },
                        { id: "nudity", label: "Nudity/Sexual", emoji: "🔞" },
                        { id: "spam", label: "Spam/Fake Act", emoji: "⚠️" },
                        { id: "hate", label: "Hate Speech", emoji: "🚫" },
                        { id: "violence", label: "Threat/Violence", emoji: "🔪" },
                        { id: "other", label: "Other concern", emoji: "📝" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setReportReason(item.id)}
                          className={`flex items-center gap-2 px-3 py-2.5 text-left rounded-xl text-2xs font-bold border transition-all cursor-pointer ${
                            reportReason === item.id
                              ? "bg-rose-500/10 border-rose-500/50 text-rose-400"
                              : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:border-white/10 hover:text-white"
                          }`}
                        >
                          <span className="text-xs">{item.emoji}</span>
                          <span className="truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Description */}
                  <div className="space-y-1.5">
                    <label className="block text-2xs font-extrabold text-gray-400 uppercase tracking-widest">
                      Additional Details (Optional)
                    </label>
                    <textarea
                      value={reportComments}
                      onChange={(e) => setReportComments(e.target.value.slice(0, 300))}
                      placeholder="Please provide specific details about what this user did or said..."
                      rows={3}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20 transition-all resize-none"
                    />
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                      <span>Monitored 24/7</span>
                      <span>{reportComments.length}/300 chars</span>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setReportOpen(false)}
                      className="rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 py-2.5 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleReportSubmit}
                      className="rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white py-2.5 text-xs font-bold shadow-lg shadow-rose-500/20 cursor-pointer hover:scale-[1.01] transition-all"
                    >
                      Submit Report
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 py-2 text-center">
                  <div className="h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-bounce border border-emerald-500/30">
                    <span className="text-2xl font-bold">✓</span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-white text-base font-bold font-display">Report Submitted!</h4>
                    <p className="text-gray-300 text-xs leading-relaxed max-w-sm mx-auto">
                      Thank you for reporting. We have flagged <span className="text-rose-400 font-bold">{partner.name}</span> for <span className="text-sky-400 font-bold">{
                        reportReason === "harassment" ? "Abuse/Harassment" :
                        reportReason === "nudity" ? "Nudity/Sexual Content" :
                        reportReason === "spam" ? "Spam/Fake Account" :
                        reportReason === "hate" ? "Hate Speech" :
                        reportReason === "violence" ? "Threats/Violence" : "Other Concerns"
                      }</span>.
                    </p>
                    <p className="text-gray-400 text-2xs leading-relaxed max-w-xs mx-auto">
                      Our live safety engine and human moderation queues are investigating this session. This user has been blacklisted from your matches, and we are skipping you to a new partner.
                    </p>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3.5, ease: "linear" }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-sky-500"
                    />
                  </div>
                  <p className="text-gray-500 text-[10px] animate-pulse">Searching next connection...</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Block dialog popup */}
      <AnimatePresence>
        {blockOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="w-full max-w-md rounded-[28px] glass-panel-heavy p-6 border border-white/15 shadow-2xl relative"
            >
              {/* Close Button */}
              <button
                onClick={() => !blockSubmitting && !blockSuccess && setBlockOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/5 cursor-pointer"
                disabled={blockSubmitting || blockSuccess}
              >
                <X className="h-4 w-4" />
              </button>

              {blockSubmitting ? (
                <div className="space-y-6 py-8 text-center">
                  <div className="h-14 w-14 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="space-y-2">
                    <h4 className="text-white text-base font-bold font-display">Processing Block Request</h4>
                    <p className="text-gray-400 text-xs leading-relaxed max-w-xs mx-auto animate-pulse">
                      Updating matchmaking criteria, logging security parameters, and blacklisting user...
                    </p>
                  </div>
                </div>
              ) : !blockSuccess ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                      <Ban className="h-5.5 w-5.5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-white text-base font-bold font-display">Block {partner.name}?</h4>
                      <p className="text-gray-400 text-2xs">This action will permanently prevent matching again.</p>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-1" />

                  <p className="text-gray-300 text-xs leading-relaxed">
                    Are you sure you want to block <span className="text-rose-400 font-bold">{partner.name}</span>? You will be disconnected instantly, and this user will be completely blacklisted from your account.
                  </p>

                  <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-3 flex gap-2 items-start text-rose-300 text-[11px] leading-relaxed">
                    <AlertOctagon className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                    <span>This action is immediate. They will not be notified that they were blocked, and our moderation system will be logged.</span>
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setBlockOpen(false)}
                      className="rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 py-2.5 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleBlockSubmit}
                      className="rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white py-2.5 text-xs font-bold shadow-lg shadow-rose-500/20 cursor-pointer hover:scale-[1.01] transition-all"
                    >
                      Confirm Block
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 py-2 text-center">
                  <div className="h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-bounce border border-emerald-500/30">
                    <span className="text-2xl font-bold">✓</span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-white text-base font-bold font-display">User Blocked!</h4>
                    <p className="text-gray-300 text-xs leading-relaxed max-w-sm mx-auto">
                      <span className="text-rose-400 font-bold">{partner.name}</span> has been permanently blocked and added to your personal blacklist.
                    </p>
                    <p className="text-gray-400 text-2xs leading-relaxed max-w-xs mx-auto">
                      We are now routing you to a new safe partner. Happy chatting!
                    </p>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2.5, ease: "linear" }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-sky-500"
                    />
                  </div>
                  <p className="text-gray-500 text-[10px] animate-pulse">Sourcing next connection...</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
