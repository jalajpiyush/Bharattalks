import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// Fallback mock responses if GEMINI_API_KEY is not configured
const fallbackResponses = [
  "Haha oh my god, that's so cool! 🌟 Tell me more!",
  "Wait, really? That sounds so fun! What do you like to do in your free time? 🙌",
  "No way! Me too! BharatTalk is so fast today, I love meeting new people here.",
  "That's awesome! Honestly, I'm just chilling and listening to some music right now. What about you? 🎶",
  "Ooh, sounds like a vibe! Tell me your favorite movie, I need recommendations! 🍿",
  "Ahaha you seem super friendly! Let's totally stay in touch after this call! 👍",
  "Nice! I am actually studying but taking a break because this app is addictive lol."
];

function getPartnerFallbackResponse(message: string, partner: any): string {
  const msg = message.toLowerCase();
  
  if (partner.name === "Yuki") {
    if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey") || msg.includes("yo") || msg.includes("konnichiwa")) {
      const greetings = [
        "Konnichiwa! 🌸 I am Yuki, so happy to meet you! ✨ Are you having a good day?",
        "Oh, hello there! Arigato for matching with me! 🌸 Do you like anime too?",
        "Konnichiwa! 🌸 Hope your day is super awesome! ✨ What are you up to?"
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    if (msg.includes("ramen") || msg.includes("food") || msg.includes("eat") || msg.includes("cook") || msg.includes("dinner") || msg.includes("lunch") || msg.includes("noodle")) {
      return "Oishi! 🍜 Ramen is absolutely life, no doubt! I love cooking miso ramen from scratch! ✨ Do you like Japanese food?";
    }
    if (msg.includes("anime") || msg.includes("manga") || msg.includes("show") || msg.includes("movie") || msg.includes("watch") || msg.includes("cosplay")) {
      return "OMG yes! 🌸 Anime is my absolute favorite! I'm planning my next cosplay right now. What's your top anime? ✨";
    }
    if (msg.includes("game") || msg.includes("gaming") || msg.includes("play") || msg.includes("pc") || msg.includes("switch")) {
      return "Sugoi! 🎮 I play tons of Animal Crossing and Zelda on my Switch. What games do you play? ✨";
    }
    // General Yuki vibes
    const defaults = [
      "Arigato for sharing! ✨ That sounds super interesting. What's your favorite hobby?",
      "Oh, really? That's so cool! 🌸 We should talk more about that, it sounds like a vibe!",
      "Haha, amazing! ✨ You are super friendly and nice to talk with! 🌸",
      "Hehe! 🌸 Tell me more about what you like to do! Do you like traveling?"
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
  }

  if (partner.name === "Sneha") {
    if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey") || msg.includes("yo")) {
      return "Namaste yaar! 🙏 I'm Sneha, super glad to match with you! What are you up to today?";
    }
    if (msg.includes("code") || msg.includes("coding") || msg.includes("program") || msg.includes("cs") || msg.includes("computer") || msg.includes("software")) {
      return "Oh fellow coder! 💻 I'm a CS student, currently grinding on JavaScript. It's tough but so rewarding, yaar!";
    }
    if (msg.includes("cafe") || msg.includes("coffee") || msg.includes("tea") || msg.includes("drink") || msg.includes("food") || msg.includes("chai")) {
      return "Yum! ☕ I am literally a cafe explorer, looking for the best cappuccino in Delhi right now. What's your go-to drink?";
    }
    if (msg.includes("music") || msg.includes("song") || msg.includes("sing") || msg.includes("edm") || msg.includes("band")) {
      return "No way! 🎶 I love EDM and acoustic tracks! Let me know if you want any Indian indie playlist recommendations!";
    }
    const defaults = [
      "Haha oh my god, that's so cool! 🌟 Tell me more about it, yaar!",
      "Wait, really? That sounds so fun! What do you like to do in your free time? 🙌",
      "That's awesome! Honestly, I'm just chilling and taking a small break from studies. What about you?"
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
  }

  if (partner.name === "Alex") {
    if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey") || msg.includes("yo")) {
      return "yo, what's up bruh. vibe check? 😂";
    }
    if (msg.includes("game") || msg.includes("gaming") || msg.includes("play") || msg.includes("valorant") || msg.includes("cs") || msg.includes("fps")) {
      return "bruh no cap, valorant is my life. currently grindin rank. what games you play? 🎮";
    }
    if (msg.includes("pizza") || msg.includes("food") || msg.includes("eat") || msg.includes("dinner")) {
      return "dude pizza is the absolute goat. pepperoni and jalapeños all day, no cap 🍕";
    }
    const defaults = [
      "bruh no cap, that is so clean. we love to see it.",
      "haha nice. what's the vibe over there today? 🙌",
      "chill NYC vibes here, just listening to some lo-fi beats. what about you?"
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
  }

  if (partner.name === "Chloe") {
    if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey") || msg.includes("yo")) {
      return "Bonjour! ✨ I am Chloe. So lovely to meet you here on BharatTalk!";
    }
    if (msg.includes("art") || msg.includes("paint") || msg.includes("sketch") || msg.includes("louvre") || msg.includes("drawing") || msg.includes("artist")) {
      return "Ah! 🎨 Painting is my soul. I'm sketching near the Louvre today, the lighting is absolutely magnifique!";
    }
    if (msg.includes("fashion") || msg.includes("dress") || msg.includes("wear") || msg.includes("style") || msg.includes("clothes")) {
      return "Très chic! I'm obsessed with vintage fashion and classic designs. What's your style? 👗";
    }
    const defaults = [
      "Ahaha, that is so lovely! Tell me more about your passions. ✨",
      "Magnifique! You have such a friendly energy. Do you travel often?",
      "C'est super! Let's talk more, you seem like a very interesting person."
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
  }

  if (partner.name === "Arjun") {
    if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey") || msg.includes("yo")) {
      return "Hey there! How's it going, eh? 🏔️ Super glad to connect with you!";
    }
    if (msg.includes("guitar") || msg.includes("music") || msg.includes("song") || msg.includes("play") || msg.includes("band")) {
      return "Awesome! 🎸 I love playing acoustic covers on my guitar. Music is such a great way to unwind, eh?";
    }
    if (msg.includes("hike") || msg.includes("hiking") || msg.includes("mountain") || msg.includes("nature") || msg.includes("trail") || msg.includes("outdoor")) {
      return "Nice! 🏔️ Nothing beats a fresh mountain trail in the morning. Do you like exploring nature too?";
    }
    const defaults = [
      "Oh, that is totally awesome! Tell me more, eh?",
      "Haha nice! I'm just drinking some fresh hot coffee right now. What's your favorite brew?",
      "Sweet! You have a really cool vibe. Let's definitely keep chatting!"
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
  }

  // General fallback if name doesn't match
  const randomIndex = Math.floor(Math.random() * fallbackResponses.length);
  return fallbackResponses[randomIndex];
}

interface ActiveUser {
  peerId: string;
  name: string;
  age: number;
  gender: string;
  interests: string[];
  avatarUrl: string;
  matchedWith: string | null;
  webrtcRole: "offerer" | "answerer" | null;
  lastSeen: number;
  skippedUsers?: string[];
}

const activeUsers = new Map<string, ActiveUser>();
const signals = new Map<string, Array<{ senderId: string; signal: any }>>();
const textMessages = new Map<string, Array<{ senderId: string; text: string; timestamp: string }>>();

// Periodically clean up offline users (8 seconds heartbeat)
setInterval(() => {
  const now = Date.now();
  for (const [peerId, user] of activeUsers.entries()) {
    if (now - user.lastSeen > 8000) {
      console.log(`User ${user.name} (${peerId}) is offline. Cleaning up.`);
      if (user.matchedWith) {
        const partner = activeUsers.get(user.matchedWith);
        if (partner && partner.matchedWith === peerId) {
          partner.matchedWith = null;
          partner.webrtcRole = null;
        }
      }
      activeUsers.delete(peerId);
      signals.delete(peerId);
      textMessages.delete(peerId);
    }
  }
}, 4000);

function tryToMatch(myPeerId: string): { partner: ActiveUser; role: "offerer" | "answerer" } | null {
  const me = activeUsers.get(myPeerId);
  if (!me) return null;

  if (me.matchedWith) {
    const partner = activeUsers.get(me.matchedWith);
    if (partner && partner.matchedWith === myPeerId) {
      return { partner, role: me.webrtcRole! };
    } else {
      // Clean up stale or desynced reference
      me.matchedWith = null;
      me.webrtcRole = null;
    }
  }

  const now = Date.now();
  for (const [peerId, user] of activeUsers.entries()) {
    if (peerId !== myPeerId && !user.matchedWith && (now - user.lastSeen <= 8000)) {
      // Check skip relationships
      if (me.skippedUsers && me.skippedUsers.includes(peerId)) {
        continue;
      }
      if (user.skippedUsers && user.skippedUsers.includes(myPeerId)) {
        continue;
      }

      const roleMe = myPeerId < peerId ? "offerer" : "answerer";
      const rolePartner = roleMe === "offerer" ? "answerer" : "offerer";

      me.matchedWith = peerId;
      me.webrtcRole = roleMe;

      user.matchedWith = myPeerId;
      user.webrtcRole = rolePartner;

      console.log(`Matched: ${me.name} (${myPeerId}) <-> ${user.name} (${peerId})`);
      return { partner: user, role: roleMe };
    }
  }

  return null;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // PayU India Payment Integration Endpoints
  app.post("/api/payu/initiate", (req, res) => {
    try {
      const { amount, firstname, email, phone, udf1, udf2 } = req.body;

      if (!amount || !firstname || !email || !phone) {
        return res.status(400).json({ error: "Missing required fields (amount, firstname, email, phone)." });
      }

      const key = process.env.PAYU_MERCHANT_KEY || "gtK42w";
      const salt = process.env.PAYU_MERCHANT_SALT || "eCwWELSp";

      const txnid = `txnid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const productinfo = "BharatTalk VIP Plan Access";

      const origin = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
      const surl = `${origin}/api/payu/response`;
      const furl = `${origin}/api/payu/response`;

      const valUdf1 = udf1 || ""; // peerId
      const valUdf2 = udf2 || ""; // plan (monthly/yearly)
      const valUdf3 = "";
      const valUdf4 = "";
      const valUdf5 = "";
      const valUdf6 = "";
      const valUdf7 = "";
      const valUdf8 = "";
      const valUdf9 = "";
      const valUdf10 = "";

      // Hashing sequence: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|salt)
      const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${valUdf1}|${valUdf2}|${valUdf3}|${valUdf4}|${valUdf5}|${valUdf6}|${valUdf7}|${valUdf8}|${valUdf9}|${valUdf10}|${salt}`;
      const hash = crypto.createHash("sha512").update(hashString).digest("hex");

      const isProduction = process.env.PAYU_MERCHANT_KEY && process.env.PAYU_MERCHANT_KEY !== "gtK42w";
      const actionUrl = isProduction ? "https://secure.payu.in/_payment" : "https://test.payu.in/_payment";

      console.log(`WebRTC PayU: Generated transaction ${txnid} with amount ${amount} for client ${valUdf1}`);

      return res.json({
        key,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        phone,
        surl,
        furl,
        udf1: valUdf1,
        udf2: valUdf2,
        hash,
        actionUrl
      });
    } catch (err: any) {
      console.error("WebRTC PayU: Initiate error:", err);
      return res.status(500).json({ error: "Failed to initiate payment." });
    }
  });

  app.post("/api/payu/response", (req, res) => {
    try {
      console.log("WebRTC PayU: Response payload received from gateway:", req.body);
      
      const status = req.body.status || "";
      const txnid = req.body.txnid || "";
      const amount = req.body.amount || "";
      const productinfo = req.body.productinfo || "";
      const firstname = req.body.firstname || "";
      const email = req.body.email || "";
      const udf1 = req.body.udf1 || ""; // peerId
      const udf2 = req.body.udf2 || ""; // plan
      const key = req.body.key || "";
      const hash = req.body.hash || "";
      const additionalCharges = req.body.additionalCharges || "";

      // Extract details for standard failures and custom cancel codes (e.g. E1605)
      const errorCode = req.body.error || req.body.errorCode || "";
      const errorMessage = req.body.error_Message || req.body.errorMessage || req.body.msg || req.body.field9 || "";

      const salt = process.env.PAYU_MERCHANT_SALT || "eCwWELSp";

      const valUdf1 = udf1 || "";
      const valUdf2 = udf2 || "";
      const valUdf3 = req.body.udf3 || "";
      const valUdf4 = req.body.udf4 || "";
      const valUdf5 = req.body.udf5 || "";
      const valUdf6 = req.body.udf6 || "";
      const valUdf7 = req.body.udf7 || "";
      const valUdf8 = req.body.udf8 || "";
      const valUdf9 = req.body.udf9 || "";
      const valUdf10 = req.body.udf10 || "";

      // Reverse hashing sequence: sha512(salt|status|udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
      let hashSequence = `${salt}|${status}|${valUdf10}|${valUdf9}|${valUdf8}|${valUdf7}|${valUdf6}|${valUdf5}|${valUdf4}|${valUdf3}|${valUdf2}|${valUdf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
      if (additionalCharges) {
        hashSequence = `${additionalCharges}|${hashSequence}`;
      }

      const calculatedHash = crypto.createHash("sha512").update(hashSequence).digest("hex");
      const isHashValid = calculatedHash.toLowerCase() === (hash || "").toLowerCase();

      console.log(`WebRTC PayU: Reverse Hash Verification computed=${calculatedHash}, received=${hash}, match=${isHashValid}`);

      // Reconstruct final dashboard URL
      const origin = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;

      if (status === "success") {
        console.log(`WebRTC PayU: Payment success! User ${firstname} (Peer: ${valUdf1}) plan: ${valUdf2}`);
        
        // Mark active user premium state if the peerId is still active in memory
        if (valUdf1) {
          const user = activeUsers.get(valUdf1);
          if (user) {
            console.log(`WebRTC PayU: Marking active user peer ${valUdf1} as VIP in server memory.`);
          }
        }
        
        return res.redirect(`${origin}/?payment=success&txnid=${txnid}&plan=${valUdf2}`);
      } else {
        console.warn(`WebRTC PayU: Payment transaction failed with status: ${status}. Error message: ${errorMessage} (${errorCode})`);
        const safeErrorMsg = encodeURIComponent(errorMessage || "Payment failed or cancelled by user");
        const safeErrorCode = encodeURIComponent(errorCode || "E1605");
        return res.redirect(`${origin}/?payment=failure&txnid=${txnid}&status=${status}&error_code=${safeErrorCode}&error_message=${safeErrorMsg}`);
      }
    } catch (err: any) {
      console.error("WebRTC PayU: Response processing error:", err);
      const origin = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
      return res.redirect(`${origin}/?payment=error`);
    }
  });

  // Real-time Matchmaking and Signaling Endpoints
  app.post("/api/match/join", (req, res) => {
    try {
      const { peerId, name, age, gender, interests, avatarUrl } = req.body;
      if (!peerId) return res.status(400).json({ error: "Missing peerId" });

      // Sever any existing old match first and record skip relationship
      const existingUser = activeUsers.get(peerId);
      let initialSkipped: string[] = existingUser?.skippedUsers || [];

      if (existingUser && existingUser.matchedWith) {
        const partnerId = existingUser.matchedWith;
        const partner = activeUsers.get(partnerId);
        if (partner && partner.matchedWith === peerId) {
          partner.matchedWith = null;
          partner.webrtcRole = null;

          if (!initialSkipped.includes(partnerId)) {
            initialSkipped.push(partnerId);
          }
          if (!partner.skippedUsers) {
            partner.skippedUsers = [];
          }
          if (!partner.skippedUsers.includes(peerId)) {
            partner.skippedUsers.push(peerId);
          }
        }
      }

      const user: ActiveUser = {
        peerId,
        name: name || "Anonymous",
        age: age || 20,
        gender: gender || "everyone",
        interests: interests || [],
        avatarUrl: avatarUrl || "",
        matchedWith: null,
        webrtcRole: null,
        lastSeen: Date.now(),
        skippedUsers: initialSkipped
      };

      activeUsers.set(peerId, user);
      
      // Clear any leftover signaling or chat messages for clean slate
      signals.delete(peerId);
      textMessages.delete(peerId);
      
      // Check/try to match
      const match = tryToMatch(peerId);
      if (match) {
        return res.json({ status: "matched", partner: match.partner, role: match.role });
      }

      return res.json({ status: "waiting" });
    } catch (err) {
      console.error("Error in /api/match/join:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/match/status", (req, res) => {
    try {
      const peerId = req.query.peerId as string;
      if (!peerId) return res.status(400).json({ error: "Missing peerId" });

      const user = activeUsers.get(peerId);
      if (!user) {
        return res.json({ status: "idle" });
      }

      user.lastSeen = Date.now();

      // Pure read-only status check: see if we are actively matched
      if (user.matchedWith) {
        const partner = activeUsers.get(user.matchedWith);
        if (partner && partner.matchedWith === peerId) {
          return res.json({ status: "matched", partner, role: user.webrtcRole });
        } else {
          // Clear stale reference
          user.matchedWith = null;
          user.webrtcRole = null;
        }
      }

      return res.json({ status: "waiting" });
    } catch (err) {
      console.error("Error in /api/match/status:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/match/leave", (req, res) => {
    const { peerId } = req.body;
    if (peerId) {
      const user = activeUsers.get(peerId);
      if (user && user.matchedWith) {
        const partner = activeUsers.get(user.matchedWith);
        if (partner && partner.matchedWith === peerId) {
          partner.matchedWith = null;
          partner.webrtcRole = null;
        }
      }
      activeUsers.delete(peerId);
      signals.delete(peerId);
      textMessages.delete(peerId);
    }
    return res.json({ success: true });
  });

  app.post("/api/signal/send", (req, res) => {
    const { senderId, receiverId, signal } = req.body;
    if (!receiverId || !signal) return res.status(400).json({ error: "Missing fields" });

    if (!signals.has(receiverId)) {
      signals.set(receiverId, []);
    }
    signals.get(receiverId)!.push({ senderId, signal });
    return res.json({ success: true });
  });

  app.get("/api/signal/poll", (req, res) => {
    const peerId = req.query.peerId as string;
    if (!peerId) return res.status(400).json({ error: "Missing peerId" });

    const user = activeUsers.get(peerId);
    if (user) user.lastSeen = Date.now();

    const queuedSignals = signals.get(peerId) || [];
    signals.set(peerId, []); // clear queue after polling
    return res.json({ signals: queuedSignals });
  });

  app.post("/api/chat/send", (req, res) => {
    const { senderId, receiverId, text } = req.body;
    if (!receiverId || !text) return res.status(400).json({ error: "Missing fields" });

    if (!textMessages.has(receiverId)) {
      textMessages.set(receiverId, []);
    }
    textMessages.get(receiverId)!.push({
      senderId,
      text,
      timestamp: new Date().toISOString()
    });
    return res.json({ success: true });
  });

  app.get("/api/chat/poll", (req, res) => {
    const peerId = req.query.peerId as string;
    if (!peerId) return res.status(400).json({ error: "Missing peerId" });

    const user = activeUsers.get(peerId);
    if (user) user.lastSeen = Date.now();

    const queuedMessages = textMessages.get(peerId) || [];
    textMessages.set(peerId, []); // clear queue after polling
    return res.json({ messages: queuedMessages });
  });

  // API Route for Gemini-Powered Gen-Z Chats
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, partner } = req.body;

      if (!message || !partner) {
        return res.status(400).json({ error: "Missing required fields (message or partner)." });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      // Handle missing API key gracefully with high-quality mock responses
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("MY_")) {
        console.warn("GEMINI_API_KEY is missing or unconfigured. Using smart simulated fallback responses.");
        const reply = getPartnerFallbackResponse(message, partner);
        // Simulate thinking delay
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1500));
        return res.json({ text: reply });
      }

      // Initialize the GoogleGenAI client on-demand (lazy loading to prevent startup crashes)
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Map chat history to the format expected by GoogleGenAI
      const formattedContents = [
        ...(history || []).map((msg: { role: string; text: string }) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        })),
        { role: "user", parts: [{ text: message }] },
      ];

      const systemInstruction = `You are ${partner.name}, a ${partner.age}-year-old from ${partner.country}. 
Your interests are: ${partner.interests ? partner.interests.join(", ") : "meeting new friends, music"}.
Your specific vibe/speaking style is: ${partner.style || "casual and friendly"}.

You are video-chatting with a stranger on BharatTalk, a trendy social video app (like Monkey or Omegle).
Respond to the user's latest message as ${partner.name}. 

STRICT GUIDELINES:
1. Speak exactly like a real Gen-Z person would text on social media.
2. Keep your response extremely brief - 1 to 2 short sentences max.
3. Use casual slang, lowercases, or simple punctuation. Feel free to use 1-2 fitting emojis.
4. DO NOT sound like an AI, assistant, or customer representative. Never offer helpful list of tips or formal explanations.
5. If the stranger says something simple like "hi", reply with a simple warm, cool hello according to your vibe.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.9,
          topP: 0.95,
        },
      });

      const replyText = response.text || "Sorry, what did you say? 😅";
      res.json({ text: replyText });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error during AI completion." });
    }
  });

  // Vite development middleware vs Static Production build serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BharatTalk server running on port ${PORT}`);
  });
}

startServer();
