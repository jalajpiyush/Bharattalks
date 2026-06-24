/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from "react";
import { 
  Video, VideoOff, Mic, MicOff, Users, SkipForward, AlertOctagon, 
  Sparkles, MessageSquare, Heart, Gift, Smile, Send, Search, RefreshCw, X, ShieldAlert,
  Crown, CreditCard, Check, ShieldCheck, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Partner, Message } from "../types";

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

export default function VideoChatArea() {
  const [sessionStatus, setSessionStatus] = useState<"idle" | "searching" | "connected" | "disconnected">("idle");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Real-time peer connections & timers
  const [myPeerId] = useState<string>(() => {
    let id = localStorage.getItem("bharattalk_peer_id");
    if (!id) {
      id = "client-" + Math.random().toString(36).substring(2, 11);
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
  const [friendStatus, setFriendStatus] = useState<"add" | "sending" | "friends">("add");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  
  // Floating emoji effect tracking
  const [floatingGifts, setFloatingGifts] = useState<{ id: number; symbol: string; x: number }[]>([]);

  // Premium & Subscription states
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem("bharattalk_premium") === "true";
  });
  const [genderFilter, setGenderFilter] = useState<"everyone" | "girls" | "boys">("everyone");
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<"monthly" | "yearly">("monthly");
  
  // Checkout & PayU billing states
  const [billingName, setBillingName] = useState(() => {
    try {
      const saved = localStorage.getItem("bharattalk_user");
      if (saved) {
        return JSON.parse(saved).name || "";
      }
    } catch (e) {}
    return "";
  });
  const [billingEmail, setBillingEmail] = useState(() => {
    try {
      const saved = localStorage.getItem("bharattalk_user");
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
        console.log(`WebRTC PayU: Payment success callback detected! TXN: ${txnid}`);
        setIsPremium(true);
        localStorage.setItem("bharattalk_premium", "true");
        setCheckoutSuccess(true);
        setPremiumModalOpen(true);
        
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
          firstname: billingName || "BharatUser",
          email: billingEmail || "user@bharattalk.com",
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
        bio: "Online on BharatTalk",
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
          pc.createDataChannel("bharattalk-data-channel");
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
          setMessages((prev) => {
            const newMsgs = data.messages.map((m: any, idx: number) => ({
              id: `msg-poll-${Date.now()}-${idx}`,
              role: "model",
              sender: partner?.name || "Partner",
              text: m.text,
              timestamp: m.timestamp
            }));
            return [...prev, ...newMsgs];
          });
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
    setReportSuccess(true);
    setTimeout(() => {
      setReportOpen(false);
      handleSkipNext(); // Auto skip blocked user
    }, 2000);
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

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6" id="video-chat-container">
      
      {/* 1. IDLE State - Match Setup Dashboard */}
      {sessionStatus === "idle" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl glass-panel p-8 md:p-12 border border-white/10 shadow-2xl relative overflow-hidden text-center max-w-2xl mx-auto"
        >
          {/* Neon background decorations */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-[#10a37f]/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#10a37f]/5 rounded-full blur-2xl" />

          <div className="relative z-10 space-y-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#10a37f] to-[#0fa47f] text-white shadow-xl mx-auto animate-pulse-slow">
              <Users className="h-8 w-8" />
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold font-display text-white">
                Find Your Match
              </h2>
              <p className="text-gray-300 text-sm max-w-md mx-auto">
                Select your interest tags below and hit start. We'll instantly match you with interesting people who share your vibe!
              </p>
            </div>

            {/* Interest Tags list */}
            <div className="space-y-3">
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider">
                Select Interests (Optional)
              </label>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {availableInterests.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`text-xs font-semibold px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#10a37f] border-transparent text-white shadow-md shadow-[#10a37f]/20 scale-105"
                          : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/10"
                      }`}
                    >
                      #{interest}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gender Talk Selector */}
            <div className="space-y-3 pt-2">
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider">
                Gender Talk Mode (Match Filter)
              </label>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setGenderFilter("everyone")}
                  className={`text-xs font-semibold px-5 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                    genderFilter === "everyone"
                      ? "bg-[#10a37f] border-transparent text-white shadow-md shadow-[#10a37f]/20"
                      : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/10"
                  }`}
                  id="gender-filter-everyone"
                >
                  🌐 Everyone (Free)
                </button>
                
                <button
                  type="button"
                  onClick={() => handleGenderFilterSelect("girls")}
                  className={`text-xs font-semibold px-5 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 relative overflow-hidden ${
                    genderFilter === "girls"
                      ? "bg-gradient-to-r from-amber-500 to-yellow-600 border-transparent text-white shadow-md shadow-amber-500/20 scale-105"
                      : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/10"
                  }`}
                  id="gender-filter-girls"
                >
                  🙋‍♀️ Girls Only
                  <span className="text-[9px] bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-1.5 py-0.5 rounded font-black tracking-wider uppercase leading-none scale-90">
                    VIP
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGenderFilterSelect("boys")}
                  className={`text-xs font-semibold px-5 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 relative overflow-hidden ${
                    genderFilter === "boys"
                      ? "bg-gradient-to-r from-amber-500 to-yellow-600 border-transparent text-white shadow-md shadow-amber-500/20 scale-105"
                      : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:border-white/10"
                  }`}
                  id="gender-filter-boys"
                >
                  🙋‍♂️ Boys Only
                  <span className="text-[9px] bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-1.5 py-0.5 rounded font-black tracking-wider uppercase leading-none scale-90">
                    VIP
                  </span>
                </button>
              </div>

              {isPremium ? (
                <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-1.5 max-w-xs mx-auto animate-pulse">
                  <Crown className="h-4 w-4 fill-amber-400/10 text-amber-400" />
                  <span>VIP Gender Filter Unlocked!</span>
                </div>
              ) : (
                <p className="text-gray-400 text-2xs italic">
                  * Girls Only & Boys Only modes require a premium subscription
                </p>
              )}
            </div>

            {/* Start Button */}
            <div className="pt-4 flex flex-col items-center gap-3">
              <button
                onClick={startMatching}
                className="group flex items-center gap-3 rounded-2xl bg-[#10a37f] hover:bg-[#0fa47f] text-white font-bold text-base md:text-lg px-10 py-4 shadow-xl shadow-[#10a37f]/30 hover:shadow-[#10a37f]/45 transition-all hover:scale-103 cursor-pointer mx-auto"
                id="btn-start-matching"
              >
                <Search className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                Find My Match
              </button>

              {!(new URLSearchParams(window.location.search).get("standalone") === "true") && (
                <a
                  href="/?view=chat&standalone=true"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#10a37f] hover:text-[#0fa47f] font-bold underline transition-all cursor-pointer mt-1"
                  id="link-standalone-match"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Better webcam experience? Open in standalone page ↗
                </a>
              )}
            </div>

            {/* Device testing warning */}
            <div className="flex items-center justify-center gap-2 text-3xs text-gray-500 uppercase tracking-widest font-semibold pt-2">
              <ShieldAlert className="h-4 w-4 text-amber-500/80" />
              Webcam authorization will be requested on matching
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. SEARCHING State - Radar Scan Loop */}
      {sessionStatus === "searching" && (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-8">
          
          {/* Pulsating Glowing Radar */}
          <div className="relative h-48 w-48 flex items-center justify-center">
            
            {/* Concentric expanding ripples */}
            <div className="absolute inset-0 rounded-full border border-[#10a37f]/20 animate-ping" style={{ animationDuration: "2s" }} />
            <div className="absolute inset-4 rounded-full border border-emerald-500/20 animate-ping" style={{ animationDuration: "3s" }} />
            <div className="absolute inset-8 rounded-full border border-teal-500/10 animate-ping" style={{ animationDuration: "4s" }} />

            {/* Central scanning pointer circle */}
            <div className="h-28 w-28 rounded-full bg-gradient-to-tr from-[#10a37f] to-teal-500 opacity-90 border border-white/20 flex items-center justify-center shadow-2xl shadow-emerald-500/20 relative">
              <RefreshCw className="h-10 w-10 text-white animate-spin" style={{ animationDuration: "6s" }} />
            </div>

          </div>

          <div className="space-y-2">
            <h3 className="text-xl md:text-2xl font-bold font-display text-white animate-pulse">
              Searching for matches...
            </h3>
            {selectedInterests.length > 0 ? (
              <p className="text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                Matching with tags: {selectedInterests.map(t => `#${t}`).join(", ")}
              </p>
            ) : (
              <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">
                Sourcing connections globally
              </p>
            )}
          </div>

          <button
            onClick={() => setSessionStatus("idle")}
            className="rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 text-xs font-medium cursor-pointer"
            id="btn-cancel-search"
          >
            Cancel Search
          </button>
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

          {/* Left panel (Match & User Camera displays) - Column Span 8 */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            
            {/* Picture-in-Picture Video Calling Display */}
            <div className="relative rounded-[28px] overflow-hidden border border-white/10 shadow-2xl h-[400px] sm:h-[500px] bg-[#0d0d0d]">
              
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
                <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                  <span className="flex h-2 w-2 rounded-full bg-[#10a37f] live-indicator-pulse" />
                  <span className="bg-black/60 backdrop-blur-md text-[10px] font-bold text-white px-3 py-1 rounded-full uppercase tracking-wider border border-white/5">
                    Live Channel
                  </span>
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
                        <span key={i} className="text-[9px] font-bold text-[#10a37f] bg-[#10a37f]/15 border border-[#10a37f]/20 rounded-md px-1.5 py-0.5">
                          #{interest}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-400 text-2xs italic mt-2 line-clamp-1">{partner.status}</p>
                </div>
              </div>

              {/* Card 2: User Stream (Actual Camera - SMALL SCREEN Overlay) */}
              <div className="absolute bottom-4 right-4 w-32 h-44 sm:w-40 sm:h-52 rounded-2xl overflow-hidden bg-[#171717]/95 border border-white/20 shadow-2xl z-20 transition-all hover:scale-105">
                
                {isVideoEnabled && localStream ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover transform -scale-x-100"
                  />
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
                        className="rounded-lg bg-[#10a37f] hover:bg-[#0fa47f] text-white px-2 py-1 text-[8px] font-bold mt-1 cursor-pointer"
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
                  onClick={() => setReportOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                  id="btn-report-match"
                >
                  <AlertOctagon className="h-4 w-4" />
                  Report User
                </button>
              </div>

              {/* Center tray: Next & Gift */}
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
                  onClick={handleSkipNext}
                  className="flex items-center gap-2 rounded-xl bg-[#10a37f] hover:bg-[#0fa47f] text-white font-bold px-6 py-2.5 text-sm shadow-lg shadow-[#10a37f]/20 hover:scale-103 transition-all cursor-pointer"
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
                    className="flex items-center gap-1.5 text-xs font-bold text-[#10a37f] hover:text-emerald-400 transition-all cursor-pointer"
                    id="btn-add-friend"
                  >
                    <Heart className="h-4 w-4 fill-[#10a37f]/10" />
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

          {/* Right panel (Text Message Chat overlay container) - Column Span 4 */}
          <div className="lg:col-span-4 flex flex-col rounded-[28px] glass-panel border border-white/10 shadow-2xl h-[535px] relative overflow-hidden bg-[#0d0d0d]/50">
            
            {/* Chat header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-black/15">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#10a37f]" />
                <span className="text-sm font-bold text-white font-display">Live Chat Room</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 uppercase">
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
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                          isMe
                            ? "bg-[#10a37f] text-white rounded-tr-none"
                            : "bg-white/10 text-gray-100 rounded-tl-none border border-white/5"
                        }`}
                      >
                        {msg.text}
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
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-[#10a37f] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "300ms" }} />
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
                className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#10a37f] focus:ring-1 focus:ring-[#10a37f] transition-all"
                id="chat-input"
              />
              <button
                type="submit"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#10a37f] text-white hover:bg-[#0fa47f] transition-all cursor-pointer shadow-md shadow-[#10a37f]/15"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl glass-panel-heavy p-6 border border-white/15 shadow-2xl relative text-center"
            >
              {!reportSuccess ? (
                <div className="space-y-6">
                  <div className="h-12 w-12 rounded-full bg-[#10a37f]/20 text-[#10a37f] flex items-center justify-center mx-auto">
                    <AlertOctagon className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-white text-lg font-bold font-display">Report User</h4>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Are you sure you want to flag this user? Reports are monitored immediately by our AI core, and toxic users are isolated and banned permanently.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setReportOpen(false)}
                      className="rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 py-2.5 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReportSubmit}
                      className="rounded-xl bg-[#10a37f] hover:bg-[#0fa47f] text-white py-2.5 text-xs font-bold shadow-md cursor-pointer"
                    >
                      Confirm Report
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto animate-bounce">
                    <span className="text-xl">✅</span>
                  </div>
                  <h4 className="text-white text-base font-bold font-display">Report Submitted!</h4>
                  <p className="text-gray-400 text-xs animate-pulse">Automatically skipping matching actor...</p>
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
                      BharatTalk billing is secure. Cancel anytime from your account settings. Subscriptions renew automatically.
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

      {/* 4. Developer Debug Panel */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-[#0d0d0d]/90 p-5 font-mono text-xs text-gray-400 shadow-2xl relative overflow-hidden" id="developer-debug-panel">
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h4 className="text-white font-bold tracking-wider uppercase text-[10px]">BharatTalk WebRTC Console</h4>
          </div>
          <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded uppercase">
            Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-gray-500 font-bold uppercase text-[9px] tracking-wider">Identity & Queue</p>
            <p><span className="text-gray-400">User Peer ID:</span> <span className="text-emerald-400 font-semibold">{myPeerId}</span></p>
            <p><span className="text-gray-400">Queue Status:</span> <span className="text-amber-400 font-semibold uppercase">{sessionStatus === "searching" ? "Queued" : sessionStatus}</span></p>
            <p><span className="text-gray-400">Selected Tags:</span> <span className="text-teal-400">{selectedInterests.length > 0 ? selectedInterests.join(", ") : "None"}</span></p>
          </div>

          <div className="space-y-1">
            <p className="text-gray-500 font-bold uppercase text-[9px] tracking-wider">WebRTC Peer Connection</p>
            <p><span className="text-gray-400">Match Status:</span> <span className="text-[#10a37f]">{partner ? `${partner.name} (Real: ${partner.isReal ? "Yes" : "No"})` : "Not matched"}</span></p>
            <p>
              <span className="text-gray-400">Connection State:</span>{" "}
              <span className={`font-semibold uppercase ${
                webrtcConnectionState === "connected" ? "text-emerald-400" :
                webrtcConnectionState === "failed" ? "text-red-400" : "text-amber-400"
              }`}>{webrtcConnectionState}</span>
            </p>
            <p><span className="text-gray-400">Signaling State:</span> <span className="text-purple-400 uppercase">{webrtcSignalingState}</span></p>
          </div>

          <div className="space-y-1">
            <p className="text-gray-500 font-bold uppercase text-[9px] tracking-wider">SDP Handshake</p>
            <p><span className="text-gray-400">Offer Sent:</span> <span className={debugOfferSent ? "text-emerald-400 font-bold" : "text-gray-600"}>{debugOfferSent ? "YES" : "NO"}</span></p>
            <p><span className="text-gray-400">Answer Received:</span> <span className={debugAnswerReceived ? "text-emerald-400 font-bold" : "text-gray-600"}>{debugAnswerReceived ? "YES" : "NO"}</span></p>
            <p>
              <span className="text-gray-400">ICE State:</span>{" "}
              <span className={`uppercase ${
                webrtcIceState === "connected" || webrtcIceState === "completed" ? "text-emerald-400" : "text-amber-400"
              }`}>{webrtcIceState}</span>
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-gray-500 font-bold uppercase text-[9px] tracking-wider">Media & Candidates</p>
            <p><span className="text-gray-400">Local Stream:</span> <span className={localStream ? "text-emerald-400" : "text-red-400"}>{localStream ? "Active (Tracks: " + localStream.getTracks().length + ")" : "Inactive"}</span></p>
            <p><span className="text-gray-400">Remote Stream:</span> <span className={remoteStream ? "text-emerald-400" : "text-gray-600"}>{remoteStream ? "Active" : "Inactive"}</span></p>
            <p><span className="text-gray-400">ICE Exchanged:</span> <span className="text-sky-400 font-semibold">Sent: {debugIceCandidatesSent} | Rcvd: {debugIceCandidatesReceived}</span></p>
          </div>
        </div>
      </div>

    </div>
  );
}
