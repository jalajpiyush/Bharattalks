/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from "react";
import { 
  Video, VideoOff, Mic, MicOff, Users, SkipForward, AlertOctagon, 
  Sparkles, MessageSquare, Heart, Gift, Smile, Send, Search, RefreshCw, X, ShieldAlert,
  Crown, CreditCard, Check, ShieldCheck, ExternalLink, Coins, Clock, Hash, ChevronDown, Maximize2, Minimize2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Partner, Message } from "../types";
import { savePaymentRecord } from "../lib/firebase";

// Simulated matches with custom vibes
const simulatedPartners: Partner[] = [
  {
    id: "p1",
    name: "Sneha",
    age: 21,
    gender: "female",
    country: "India",
    flag: "🇮🇳",
    interests: ["Music", "Travels", "EDM", "Coding"],
    style: "friendly Indian English, uses occasional Hindi slang like 'yaar' or 'Namaste', super polite and happy.",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=350&h=450",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-talking-on-a-video-call-on-laptop-40156-large.mp4",
    status: "Exploring Delhi cafes! ☕️",
    bio: "CS student in Delhi. Love meeting new friends around the world!"
  },
  {
    id: "p2",
    name: "Yuki",
    age: 20,
    gender: "female",
    country: "Japan",
    flag: "🇯🇵",
    interests: ["Anime", "Cooking", "Cosplay", "Gaming"],
    style: "polite, enthusiastic, uses Japanese exclamation markers or emojis like 🌸 ✨, says 'Arigato' and talks about ramen.",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=350&h=450",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-woman-with-glasses-waving-at-laptop-video-call-40159-large.mp4",
    status: "Ramen is life! 🍜",
    bio: "Cosplayer and bakery designer from Kyoto. Let's talk anime!"
  },
  {
    id: "p3",
    name: "Alex",
    age: 22,
    gender: "male",
    country: "USA",
    flag: "🇺🇸",
    interests: ["Gaming", "Coding", "Pizza", "EDM"],
    style: "chill NYC gamer, uses lowercase texting, slang like 'bruh', 'no cap', 'vibe check', very laid back.",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=350&h=450",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-playing-a-video-game-with-headphones-40019-large.mp4",
    status: "Valorant all night 🎮",
    bio: "Software developer from Brooklyn. Chilling and listening to lo-fi."
  },
  {
    id: "p4",
    name: "Chloe",
    age: 23,
    gender: "female",
    country: "France",
    flag: "🇫🇷",
    interests: ["Fashion", "Art", "Travels", "Music"],
    style: "Parisian art student style, elegant, says 'Bonjour', uses words like 'chic', 'magnifique', very artistic.",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=350&h=450",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-waving-at-her-laptop-during-a-video-call-40157-large.mp4",
    status: "Sketching at the Louvre 🎨",
    bio: "Fine arts major in Paris. I paint portraits and collect vintage vinyls."
  },
  {
    id: "p5",
    name: "Arjun",
    age: 22,
    gender: "male",
    country: "Canada",
    flag: "🇨🇦",
    interests: ["Hiking", "Guitar", "Travels", "Coffee"],
    style: "relaxed Canadian outdoorsman, extremely polite, uses 'eh', 'awesome', loves talking about nature and acoustic guitar.",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=350&h=450",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-waving-and-talking-during-a-video-call-40158-large.mp4",
    status: "Mountain trails callin' 🏔️",
    bio: "Environmental science student. Always hiking or playing acoustic jams."
  }
];

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
      const res = await fetch("/api/sentiment", {
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
    let id = localStorage.getItem("swiply_peer_id") || localStorage.getItem("bharattalk_peer_id");
    if (!id) {
      id = "client-" + Math.random().toString(36).substring(2, 11);
      localStorage.setItem("swiply_peer_id", id);
      localStorage.setItem("bharattalk_peer_id", id);
    }
    return id;
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const matchPollIntervalRef = useRef<any>(null);
  const signalPollIntervalRef = useRef<any>(null);
  const chatPollIntervalRef = useRef<any>(null);
  const statusPollIntervalRef = useRef<any>(null);

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
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (matchPollIntervalRef.current) {
      clearInterval(matchPollIntervalRef.current);
      matchPollIntervalRef.current = null;
    }
    if (signalPollIntervalRef.current) {
      clearInterval(signalPollIntervalRef.current);
      signalPollIntervalRef.current = null;
    }
    if (chatPollIntervalRef.current) {
      clearInterval(chatPollIntervalRef.current);
      chatPollIntervalRef.current = null;
    }
    if (statusPollIntervalRef.current) {
      clearInterval(statusPollIntervalRef.current);
      statusPollIntervalRef.current = null;
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
  const [giftOpen, setGiftOpen] = useState(false);
  
  // Floating emoji effect tracking
  const [floatingGifts, setFloatingGifts] = useState<{ id: number; symbol: string; x: number }[]>([]);

  // Premium & Subscription states
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem("swiply_premium") === "true" || localStorage.getItem("bharattalk_premium") === "true";
  });
  const [genderFilter, setGenderFilter] = useState<"everyone" | "girls" | "boys">("everyone");
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<"monthly" | "yearly">("monthly");
  
  // Monkey.app layout state variables
  const [activeTab, setActiveTab] = useState<"solo" | "squad">("solo");
  const [genderDropdownOpen, setGenderDropdownOpen] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [isViewportFullscreen, setIsViewportFullscreen] = useState(false);

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
  const [coinsCount, setCoinsCount] = useState(150);
  const [coinsAnimation, setCoinsAnimation] = useState(false);
  
  // Checkout & PayU billing states
  const [billingName, setBillingName] = useState(() => {
    try {
      const saved = localStorage.getItem("swiply_user") || localStorage.getItem("bharattalk_user");
      if (saved) {
        return JSON.parse(saved).name || "";
      }
    } catch (e) {}
    return "";
  });
  const [billingEmail, setBillingEmail] = useState(() => {
    try {
      const saved = localStorage.getItem("swiply_user") || localStorage.getItem("bharattalk_user");
      if (saved) {
        return JSON.parse(saved).email || "";
      }
    } catch (e) {}
    return "";
  });
  const [billingPhone, setBillingPhone] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Check URL query parameters for PayU redirect callback indicators on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const paymentStatus = params.get("payment");
      const txnid = params.get("txnid");
      const errStatus = params.get("status");

      if (paymentStatus === "success") {
        const email = params.get("email") || "";
        const firstname = params.get("firstname") || "";
        const amount = params.get("amount") || "";
        const plan = params.get("plan") || "monthly";

        console.log(`WebRTC PayU: Payment success callback detected! TXN: ${txnid}`);
        setIsPremium(true);
        localStorage.setItem("swiply_premium", "true");
        localStorage.setItem("bharattalk_premium", "true");
        setCheckoutSuccess(true);
        setPremiumModalOpen(true);
        
        if (email) {
          // Log payment securely in Firestore
          savePaymentRecord({
            txnid: txnid || `tx_${Date.now()}`,
            amount: amount || (plan === "yearly" ? "1999" : "299"),
            email: email,
            firstname: firstname,
            plan: plan
          }).then(() => {
            console.log("Firebase: Payment recorded in Firestore successfully!");
          }).catch((err) => {
            console.error("Firebase: Error logging payment to Firestore:", err);
          });
        }

        // Clear query parameters to restore clean client address bar
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl + "?view=chat");
      } else if (paymentStatus === "failure") {
        const errorMsg = params.get("error_message");
        const errorCode = params.get("error_code");
        let displayMsg = `Transaction was not successful (Status: ${errStatus || "Failed"}).`;
        if (errorMsg) {
          displayMsg = `${errorMsg}${errorCode ? ` (Code: ${errorCode})` : ""}`;
        }
        console.warn(`WebRTC PayU: Payment failure callback detected! Status: ${errStatus || "Failed"}, Msg: ${displayMsg}`);
        setPremiumModalOpen(true);
        setCheckoutSuccess(false);
        setPaymentError(displayMsg);
        
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl + "?view=chat");
      } else if (paymentStatus === "error") {
        setPremiumModalOpen(true);
        setCheckoutSuccess(false);
        setPaymentError("An error occurred during payment verification. Please try again.");
        
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl + "?view=chat");
      }
    }
  }, []);

  const handleGenderFilterSelect = (mode: "girls" | "boys") => {
    if (isPremium) {
      setGenderFilter(mode);
    } else {
      setPremiumModalOpen(true);
    }
  };

  const handleCheckoutSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCheckoutLoading(true);
    setPaymentError(null);

    const price = upgradePlan === "monthly" ? "299" : "1999";

    try {
      console.log("WebRTC PayU: Querying API server to generate payment payload & security hash...");
      const response = await fetch("/api/payu/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: price,
          firstname: billingName || "SwiplyUser",
          email: billingEmail || "user@swiply.com",
          phone: billingPhone || "9999999999",
          udf1: myPeerId, // Sync payment back with this client's Peer ID
          udf2: upgradePlan // monthly or yearly
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to initiate transaction");
      }

      const data = await response.json();
      console.log("WebRTC PayU: Generation success. Initializing browser POST submission...");

      // Build hidden HTML form for redirection-based integration (prevents CORS blocks)
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.actionUrl;

      const params: Record<string, string> = {
        key: data.key,
        txnid: data.txnid,
        amount: data.amount,
        productinfo: data.productinfo,
        firstname: data.firstname,
        email: data.email,
        phone: data.phone,
        surl: data.surl,
        furl: data.furl,
        udf1: data.udf1,
        udf2: data.udf2,
        hash: data.hash,
        service_provider: "payu_paisa"
      };

      Object.entries(params).forEach(([k, v]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = v;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      console.log(`WebRTC PayU: Submitting parameters securely to ${data.actionUrl}`);
      form.submit();
    } catch (err: any) {
      console.error("WebRTC PayU: Initiation error:", err);
      setPaymentError(err.message || "Failed to initiate payment. Please check inputs and retry.");
      setCheckoutLoading(false);
    }
  };

  const handleClosePremiumModal = () => {
    setPremiumModalOpen(false);
    // Reset checkout states for next time if they close it
    setTimeout(() => {
      setCheckoutSuccess(false);
      setCheckoutLoading(false);
      setPaymentError(null);
    }, 300);
  };

  // Video refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize and clean up user media on mount/enable
  useEffect(() => {
    if (isVideoEnabled) {
      acquireCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isVideoEnabled]);

  // Apply microphone mute/unmute status to local stream tracks
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
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
      fetch("/api/match/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peerId: myPeerId })
      }).catch(err => console.error("Error leaving lobby on unmount:", err));
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
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      if (peerConnectionRef.current) {
        stream.getTracks().forEach((track) => {
          peerConnectionRef.current?.addTrack(track, stream);
        });
      }
    } catch (err) {
      console.warn("Could not acquire webcam or permissions denied.", err);
    }
  };

  const stopCamera = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
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
    startMatching();
  };

  // Perform matchmaking
  const startMatching = () => {
    cleanupWebRTC();
    setSessionStatus("searching");
    setDebugQueueStatus("Searching/Queued");
    setPartner(null);
    setMessages([]);
    setFriendStatus("add");
    setReportSuccess(false);

    let searchStartTime = Date.now();
    let fallbackTriggered = false;

    const joinLobby = async () => {
      try {
        console.log(`Matchmaking: Sending join request for peer ID ${myPeerId}`);
        const res = await fetch("/api/match/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            peerId: myPeerId,
            name: "User " + myPeerId.slice(-4).toUpperCase(),
            age: 21,
            gender: "everyone",
            interests: selectedInterests,
            avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150"
          })
        });
        const data = await res.json();
        
        if (data.status === "matched") {
          console.log("Matchmaking: Instantly matched!", data.partner);
          handleMatchedPartner(data.partner, data.role);
        } else {
          console.log("Matchmaking: In queue. Starting match status polling...");
          // Poll matchmaking status every 1.5s
          matchPollIntervalRef.current = setInterval(async () => {
            if (Date.now() - searchStartTime > 30000) {
              if (!fallbackTriggered) {
                fallbackTriggered = true;
                clearInterval(matchPollIntervalRef.current);
                matchPollIntervalRef.current = null;
                triggerSimulatedFallback();
              }
              return;
            }

            try {
              const statusRes = await fetch(`/api/match/status?peerId=${myPeerId}`);
              const statusData = await statusRes.json();
              if (statusData.status === "matched") {
                console.log("Matchmaking: Matched on status poll!", statusData.partner);
                clearInterval(matchPollIntervalRef.current);
                matchPollIntervalRef.current = null;
                handleMatchedPartner(statusData.partner, statusData.role);
              }
            } catch (err) {
              console.error("Matchmaking: Status poll failed:", err);
            }
          }, 1500);
        }
      } catch (err) {
        console.error("Matchmaking: Failed to join lobby:", err);
        triggerSimulatedFallback();
      }
    };

    const handleMatchedPartner = async (partnerDetails: any, role: "offerer" | "answerer") => {
      const fullPartner: Partner = {
        id: partnerDetails.peerId,
        name: partnerDetails.name || "Real User",
        age: partnerDetails.age || 21,
        gender: partnerDetails.gender || "male",
        country: "India",
        flag: "🇮🇳",
        interests: partnerDetails.interests || [],
        style: "friendly stranger",
        avatarUrl: partnerDetails.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150",
        videoUrl: "",
        status: "Excited to connect!",
        bio: "Online on Swiply",
        isReal: true,
        peerId: partnerDetails.peerId
      };

      setPartner(fullPartner);
      setSessionStatus("connected");
      setDebugQueueStatus("Connected");

      // Initialize WebRTC signaling & local/remote tracks
      await initWebRTC(fullPartner.peerId!, role === "offerer");

      // Start real-time polling for messages & WebRTC signals
      startRealTimePolling(fullPartner.peerId!);
    };

    const triggerSimulatedFallback = () => {
      console.log("Matchmaking: Sourcing timed out. Falling back to simulated AI partner.");
      setDebugQueueStatus("Matched (Simulated)");
      let candidates = simulatedPartners;
      if (genderFilter !== "everyone") {
        candidates = candidates.filter((p) => 
          p.gender === (genderFilter === "girls" ? "female" : "male")
        );
      }
      if (selectedInterests.length > 0) {
        const matching = candidates.filter((p) => 
          p.interests.some((tag) => selectedInterests.includes(tag))
        );
        if (matching.length > 0) {
          candidates = matching;
        }
      }
      const matched = candidates[Math.floor(Math.random() * candidates.length)];
      setPartner({ ...matched, isReal: false });
      setSessionStatus("connected");

      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const greetMsg = matched.gender === "female" ? "Hey! How's it going? 👋" : "Yo! Vibe check, what's up? 🙌";
          setMessages([{
            id: `msg-greet-${Date.now()}`,
            role: "model",
            sender: matched.name,
            text: greetMsg,
            timestamp: new Date().toISOString()
          }]);
        }, 1200);
      }, 1000);
    };

    joinLobby();
  };

  const initWebRTC = async (partnerId: string, isOfferer: boolean) => {
    try {
      console.log(`WebRTC: Initializing RTCPeerConnection. Is Offerer: ${isOfferer}`);
      setDebugMatchStatus(`Matched with ${partnerId} (${isOfferer ? "Offerer" : "Answerer"})`);
      
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" }
        ]
      });

      peerConnectionRef.current = pc;
      hasRemoteDescriptionRef.current = false;
      iceCandidatesQueueRef.current = [];

      // Update WebRTC initial state logs
      setWebrtcConnectionState(pc.connectionState);
      setWebrtcIceState(pc.iceConnectionState);
      setWebrtcSignalingState(pc.signalingState);

      pc.onconnectionstatechange = () => {
        console.log(`WebRTC: Connection state changed to: ${pc.connectionState}`);
        setWebrtcConnectionState(pc.connectionState);
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`WebRTC: ICE connection state changed to: ${pc.iceConnectionState}`);
        setWebrtcIceState(pc.iceConnectionState);
        if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
          console.warn("WebRTC: ICE connection failed or disconnected, triggering recovery.");
          handleWebRTCFailure();
        }
      };

      pc.onsignalingstatechange = () => {
        console.log(`WebRTC: Signaling state changed to: ${pc.signalingState}`);
        setWebrtcSignalingState(pc.signalingState);
      };

      // Add local media tracks if available
      if (localStream) {
        console.log("WebRTC: Attaching local media tracks to connection.");
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      } else {
        console.warn("WebRTC: Local stream was empty when peer connection was established.");
      }

      // Handle local ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("WebRTC: Discovered local ICE candidate:", event.candidate.candidate);
          setDebugIceCandidatesSent((prev) => prev + 1);
          fetch("/api/signal/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              senderId: myPeerId,
              receiverId: partnerId,
              signal: { type: "candidate", candidate: event.candidate }
            })
          }).catch(err => console.error("Error sending candidate:", err));
        }
      };

      // Handle remote tracks
      pc.ontrack = (event) => {
        console.log("WebRTC: Remote track received", event.streams);
        if (event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      if (isOfferer) {
        console.log("WebRTC: Client is Offerer. Creating data channel to force connection media lines...");
        try {
          pc.createDataChannel("swiply-data-channel");
        } catch (e) {
          console.warn("WebRTC: Failed to create data channel:", e);
        }

        console.log("WebRTC: Client is Offerer. Generating SDP Offer...");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        setDebugOfferSent(true);

        console.log("WebRTC: Transmitting SDP Offer to partner...");
        await fetch("/api/signal/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: myPeerId,
            receiverId: partnerId,
            signal: { type: "offer", sdp: offer.sdp }
          })
        });
      }
    } catch (err) {
      console.error("WebRTC: initWebRTC failed:", err);
    }
  };

  const startRealTimePolling = (partnerId: string) => {
    console.log(`WebRTC: Initiating real-time handlers for partner ${partnerId}`);

    // Poll signals (SDPs and candidates)
    signalPollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/signal/poll?peerId=${myPeerId}`);
        const data = await res.json();
        for (const sigObj of data.signals) {
          if (sigObj.senderId !== partnerId) {
            console.warn(`WebRTC: Ignored signal from non-partner ${sigObj.senderId}`);
            continue;
          }

          const pc = peerConnectionRef.current;
          if (!pc) {
            console.warn("WebRTC: Received signal, but peer connection is uninitialized.");
            continue;
          }

          const signal = sigObj.signal;
          if (signal.type === "offer") {
            console.log("WebRTC: Received SDP Offer. Setting remote description...");
            await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: signal.sdp }));
            await flushIceCandidates(pc);

            console.log("WebRTC: Generating SDP Answer...");
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            console.log("WebRTC: Transmitting SDP Answer to partner...");
            await fetch("/api/signal/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                senderId: myPeerId,
                receiverId: partnerId,
                signal: { type: "answer", sdp: answer.sdp }
              })
            });
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
        }
      } catch (err) {
        console.error("WebRTC: Signal poll failed:", err);
      }
    }, 1000);

    // Poll messages
    chatPollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/poll?peerId=${myPeerId}`);
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          console.log(`Chat: Polled ${data.messages.length} text messages`);
          
          const reactionPrefix = "[REACTION]:";
          const regularMessages: any[] = [];
          
          data.messages.forEach((m: any) => {
            if (m.text && m.text.startsWith(reactionPrefix)) {
              const emoji = m.text.slice(reactionPrefix.length).trim();
              if (emoji) {
                triggerGift(emoji);
              }
            } else {
              regularMessages.push(m);
            }
          });

          if (regularMessages.length > 0) {
            setMessages((prev) => {
              const newMsgs = regularMessages.map((m: any, idx: number) => {
                const msgId = `msg-poll-${Date.now()}-${idx}`;
                triggerSentimentAnalysis(msgId, m.text);
                return {
                  id: msgId,
                  role: "model",
                  sender: partner?.name || "Partner",
                  text: m.text,
                  timestamp: m.timestamp
                };
              });
              return [...prev, ...newMsgs];
            });
          }
        }
      } catch (err) {
        console.error("Chat message poll failed:", err);
      }
    }, 1000);

    // Poll partner status to detect disconnects instantly
    statusPollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/match/status?peerId=${myPeerId}`);
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

    if (partner.isReal) {
      try {
        await fetch("/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: myPeerId,
            receiverId: partner.peerId,
            text: userText
          })
        });
      } catch (err) {
        console.error("Failed to transmit real-time text message:", err);
      }
      return;
    }

    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: updatedMessages.slice(-6).map((m) => ({
            role: m.role,
            text: m.text
          })),
          partner: partner
        })
      });

      const data = await response.json();
      setIsTyping(false);

      if (data.text) {
        const partnerMsg: Message = {
          id: `msg-partner-${Date.now()}`,
          role: "model",
          sender: partner.name,
          text: data.text,
          timestamp: new Date().toISOString()
        };
        setMessages((prev) => [...prev, partnerMsg]);
        triggerSentimentAnalysis(partnerMsg.id, partnerMsg.text);
      }
    } catch (err) {
      console.error("Failed to generate AI response:", err);
      setIsTyping(false);
    }
  };

  // Friend Request Action
  const handleAddFriend = () => {
    setFriendStatus("sending");
    setTimeout(() => {
      setFriendStatus("friends");
    }, 1500);
  };

  // Report Action
  const handleReportSubmit = () => {
    setReportSubmitting(true);
    // Simulate API request to safety moderation engine
    setTimeout(() => {
      setReportSubmitting(false);
      setReportSuccess(true);
      setTimeout(() => {
        setReportOpen(false);
        setReportSuccess(false);
        setReportReason("harassment");
        setReportComments("");
        handleSkipNext(); // Auto skip matched user
      }, 4000);
    }, 1500);
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

    if (partner.isReal) {
      try {
        await fetch("/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: myPeerId,
            receiverId: partner.peerId,
            text: `[REACTION]:${emoji}`
          })
        });
      } catch (err) {
        console.error("Failed to transmit emoji reaction:", err);
      }
    } else {
      // Simulate AI partner reacting back after a slight delay
      setTimeout(() => {
        const aiEmojis = ["👋", "🔥", "😂", "❤️", "👍", "🎉", "😮"];
        const randomEmoji = aiEmojis[Math.floor(Math.random() * aiEmojis.length)];
        triggerGift(randomEmoji);
      }, 1000 + Math.random() * 1500);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6" id="video-chat-container">
      
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

              <button 
                type="button"
                onClick={() => {
                  setCoinsCount(prev => prev + 10);
                  setCoinsAnimation(true);
                  setTimeout(() => setCoinsAnimation(false), 800);
                  triggerGift("🪙");
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs px-4 py-2.5 rounded-full transition-all cursor-pointer shadow-md relative overflow-hidden"
              >
                <Coins className="h-4 w-4 animate-bounce" style={{ animationDuration: '2s' }} />
                <span>{coinsCount} Coins</span>
                <AnimatePresence>
                  {coinsAnimation && (
                    <motion.span 
                      initial={{ y: 0, opacity: 1 }}
                      animate={{ y: -25, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute right-2 font-black text-xs text-white drop-shadow-md"
                    >
                      +10
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
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
                onClick={() => setPremiumModalOpen(true)}
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

              <div 
                title="Your Swiply Avatar"
                className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-base border border-white/20 shadow-md select-none"
              >
                🧑‍🚀
              </div>
            </div>
          </div>

          {/* Main Dual Pane Layout: Grid */}
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
              
              {/* SOLO vs SQUAD Toggle bar */}
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
                  onClick={() => alert("Squad Mode: SQUAD matchmaking allows you to group up with friends and chat with other groups! This feature is coming soon in the Swiply VIP release.")}
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

      {/* 2. SEARCHING State - Radar Scan Loop */}
      {sessionStatus === "searching" && (
        <div className="flex flex-col items-center justify-center min-h-[420px] text-center space-y-8 relative">
          {/* Ambient background glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />

          {/* Pulsating Glowing Radar */}
          <div className="relative h-48 w-48 flex items-center justify-center">
            
            {/* Concentric expanding ripples in brand colors */}
            <div className="absolute inset-0 rounded-full border border-purple-500/30 animate-ping" style={{ animationDuration: "2.2s" }} />
            <div className="absolute inset-4 rounded-full border border-indigo-500/20 animate-ping" style={{ animationDuration: "2.8s" }} />
            <div className="absolute inset-8 rounded-full border border-cyan-500/15 animate-ping" style={{ animationDuration: "3.5s" }} />

            {/* Central scanning pointer circle */}
            <div className="h-28 w-28 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 opacity-95 border border-white/20 flex items-center justify-center shadow-[0_0_40px_rgba(139,92,246,0.3)] relative">
              <RefreshCw className="h-9 w-9 text-white animate-spin" style={{ animationDuration: "5s" }} />
            </div>

          </div>

          <div className="space-y-2 relative z-10">
            <h3 className="text-xl md:text-2xl font-extrabold font-display text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-indigo-200 animate-pulse">
              Searching for matches...
            </h3>
            {selectedInterests.length > 0 ? (
              <p className="text-cyan-400 text-xs font-bold uppercase tracking-wider bg-cyan-950/30 border border-cyan-500/20 px-3 py-1 rounded-full inline-block">
                Matching with tags: {selectedInterests.map(t => `#${t}`).join(", ")}
              </p>
            ) : (
              <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">
                Sourcing connections globally
              </p>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSessionStatus("idle")}
            className="rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 hover:border-rose-500/30 px-6 py-2.5 text-xs font-semibold cursor-pointer relative z-10 transition-colors"
            id="btn-cancel-search"
          >
            Cancel Search
          </motion.button>
        </div>
      )}

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
                </div>

                {/* Floating Quick Reaction Bar */}
                <div className="absolute top-4 right-4 z-30 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10 shadow-lg" id="quick-reactions-bar">
                  <span className="text-[10px] text-gray-400 font-bold mr-1.5 select-none hidden sm:inline pl-1">React:</span>
                  {["👋", "🔥", "😂", "❤️", "👍", "🎉", "😮"].map((emoji) => (
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
              <div className="absolute bottom-4 right-4 w-32 h-44 sm:w-40 sm:h-52 rounded-2xl overflow-hidden bg-[#171717]/95 border border-white/20 shadow-2xl z-20 transition-all hover:scale-105">
                
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
              
              {/* Left tray: Report */}
              <div>
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
          <div className={`flex flex-col rounded-[28px] glass-panel border border-white/10 shadow-2xl relative overflow-hidden bg-[#0d0d0d]/50 transition-all duration-300 ${theaterMode ? "lg:col-span-12 h-[380px]" : "lg:col-span-4 h-[535px]"}`}>
            
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

      {/* Premium Subscription Modal */}
      <AnimatePresence>
        {premiumModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm overflow-y-auto py-10">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-2xl rounded-3xl bg-[#171717] border border-white/10 shadow-2xl relative overflow-hidden my-auto"
            >
              {/* Top Banner decoration */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />
              
              {/* Close Button */}
              <button
                onClick={handleClosePremiumModal}
                className="absolute top-5 right-5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all cursor-pointer z-10"
                id="btn-close-premium-modal"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-12">
                {/* Left panel: Features list */}
                <div className="md:col-span-5 bg-[#0f0f0f] p-6 md:p-8 flex flex-col justify-between border-r border-white/5">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 shadow-md">
                        <Crown className="h-5 w-5 fill-amber-500/10" />
                      </div>
                      <span className="font-display font-black text-white text-base tracking-wide uppercase">
                        VIP Access
                      </span>
                    </div>

                    <div className="space-y-4 pt-2">
                      <h4 className="text-gray-300 text-xs font-bold uppercase tracking-wider">
                        Unlocked Perks:
                      </h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-start gap-2.5">
                          <div className="h-5 w-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="h-3 w-3" />
                          </div>
                          <p className="text-gray-300 text-xs font-medium leading-relaxed">
                            <strong className="text-white">Gender Filter</strong>: Match 100% girls only or boys only
                          </p>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <div className="h-5 w-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="h-3 w-3" />
                          </div>
                          <p className="text-gray-300 text-xs font-medium leading-relaxed">
                            <strong className="text-white">Unlimited Gifts</strong>: Express appreciation continuously
                          </p>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <div className="h-5 w-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="h-3 w-3" />
                          </div>
                          <p className="text-gray-300 text-xs font-medium leading-relaxed">
                            <strong className="text-white">VIP Badge</strong>: Display a glowing gold crown in Live Chats
                          </p>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <div className="h-5 w-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="h-3 w-3" />
                          </div>
                          <p className="text-gray-300 text-xs font-medium leading-relaxed">
                            <strong className="text-white">HD Video Quality</strong>: Peerless, crystal-clear cam feeds
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-white/5">
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                      Swiply billing is secure. Cancel anytime from your account settings. Subscriptions renew automatically.
                    </p>
                  </div>
                </div>

                {/* Right panel: Checkout / Payment */}
                <div className="md:col-span-7 p-6 md:p-8 flex flex-col justify-between">
                  {!checkoutSuccess ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-white text-xl font-bold font-display tracking-tight">
                          Select Your VIP Plan
                        </h3>
                        <p className="text-gray-400 text-xs">
                          Unlock girls only or boys only talk instantly.
                        </p>
                      </div>

                      {/* Pricing Toggles */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setUpgradePlan("monthly")}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                            upgradePlan === "monthly"
                              ? "bg-amber-500/10 border-amber-500/50 shadow-lg"
                              : "bg-white/[0.02] border-white/5 hover:bg-white/5"
                          }`}
                        >
                          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Monthly
                          </span>
                          <span className="block text-white text-lg font-black mt-1">
                            ₹299<span className="text-xs font-normal text-gray-400">/mo</span>
                          </span>
                          <span className="block text-[9px] text-gray-500 mt-1">
                            Billed monthly
                          </span>
                          {upgradePlan === "monthly" && (
                            <span className="absolute top-3 right-3 h-4.5 w-4.5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px] font-bold">
                              ✓
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setUpgradePlan("yearly")}
                          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                            upgradePlan === "yearly"
                              ? "bg-amber-500/10 border-amber-500/50 shadow-lg"
                              : "bg-white/[0.02] border-white/5 hover:bg-white/5"
                          }`}
                        >
                          <span className="absolute -top-2 right-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-md">
                            Save 45%
                          </span>
                          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                            Yearly
                          </span>
                          <span className="block text-white text-lg font-black mt-1">
                            ₹1,999<span className="text-xs font-normal text-gray-400">/yr</span>
                          </span>
                          <span className="block text-[9px] text-emerald-400 font-semibold mt-1">
                            ₹166 / month equivalent
                          </span>
                          {upgradePlan === "yearly" && (
                            <span className="absolute top-3 right-3 h-4.5 w-4.5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[10px] font-bold">
                              ✓
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Payment Form */}
                      <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/5 pb-1">
                          <CreditCard className="h-4 w-4 text-amber-500" />
                          <span>Secure PayU India Gateway</span>
                        </div>

                        {paymentError && (
                          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs font-medium">
                            ⚠️ {paymentError}
                          </div>
                        )}

                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                              First Name
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Billing First Name"
                              value={billingName}
                              onChange={(e) => setBillingName(e.target.value)}
                              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                              Email Address
                            </label>
                            <input
                              type="email"
                              required
                              placeholder="billing@example.com"
                              value={billingEmail}
                              onChange={(e) => setBillingEmail(e.target.value)}
                              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                              Mobile Number (10 Digits)
                            </label>
                            <input
                              type="tel"
                              required
                              pattern="[0-9]{10}"
                              placeholder="e.g. 9876543210"
                              value={billingPhone}
                              onChange={(e) => setBillingPhone(e.target.value.replace(/[^0-9]/g, ''))}
                              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={checkoutLoading}
                          className="w-full mt-4 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold text-sm py-3.5 shadow-xl shadow-amber-500/10 hover:shadow-amber-500/25 transition-all hover:scale-101 cursor-pointer disabled:opacity-50"
                          id="btn-submit-premium-payment"
                        >
                          {checkoutLoading ? (
                            <div className="flex items-center gap-2">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              <span>Redirecting to PayU...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="h-4.5 w-4.5" />
                              <span>Proceed to PayU India Secure Pay</span>
                            </div>
                          )}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                      <div className="h-16 w-16 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center animate-bounce shadow-lg shadow-amber-500/10">
                        <Crown className="h-9 w-9 fill-amber-500/15" />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-white text-2xl font-black font-display tracking-tight">
                          Congratulations VIP!
                        </h3>
                        <p className="text-gray-300 text-xs max-w-sm mx-auto leading-relaxed">
                          Your premium subscription is now active! You have unlocked the girls & boys only filters, golden badge status, and unlimited gifts.
                        </p>
                      </div>

                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 w-full text-center">
                        <p className="text-emerald-400 text-xs font-semibold">
                          ✓ Payment Authorized & VIP Perks Enabled Successfully!
                        </p>
                      </div>

                      <button
                        onClick={handleClosePremiumModal}
                        className="rounded-2xl bg-white text-black font-bold text-sm px-8 py-3 hover:bg-gray-100 transition-all cursor-pointer shadow-md"
                        id="btn-complete-premium-onboarding"
                      >
                        Let's Talk!
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
