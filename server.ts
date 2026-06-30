import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";
import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

dotenv.config();

// Initialize AWS DynamoDB
const ddbConfig: any = { region: process.env.AWS_REGION || "ap-south-1" };
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  ddbConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  };
}
const ddbClient = new DynamoDBClient(ddbConfig);
const docClient = DynamoDBDocumentClient.from(ddbClient);

async function ensureTable(tableName: string, pk: string) {
  try {
    await ddbClient.send(new DescribeTableCommand({ TableName: tableName }));
  } catch (err: any) {
    if (err.name === "ResourceNotFoundException") {
      console.log(`Creating DynamoDB table ${tableName}...`);
      await ddbClient.send(new CreateTableCommand({
        TableName: tableName,
        KeySchema: [{ AttributeName: pk, KeyType: "HASH" }],
        AttributeDefinitions: [{ AttributeName: pk, AttributeType: "S" }],
        BillingMode: "PAY_PER_REQUEST"
      }));
    }
  }
}

if (process.env.AWS_ACCESS_KEY_ID) {
  Promise.all([
    ensureTable("swiply_users", "userId"),
    ensureTable("swiply_payments", "txnid"),
    ensureTable("swiply_reports", "id"),
    ensureTable("swiply_blocks", "id"),
    ensureTable("swiply_queue", "userId"),
    ensureTable("swiply_rooms", "roomId")
  ]).then(() => console.log("Swiply Server: Connected to AWS DynamoDB successfully."))
    .catch(err => console.log("Swiply Server: Error verifying DynamoDB tables:", err));
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

// Legacy activeUsers Map removed in migration to AWS WebSocket Matchmaking


let cachedRegisteredCount = 1240;

async function updateRegisteredCount() {
  if (!process.env.AWS_ACCESS_KEY_ID) return;
  try {
    const data = await ddbClient.send(new DescribeTableCommand({ TableName: "swiply_users" }));
    const dbCount = data.Table?.ItemCount;
    if (dbCount !== undefined && dbCount > 0) {
      cachedRegisteredCount = dbCount; // True real users count
    }
  } catch (dbErr: any) {
    const errMsg = dbErr?.message || String(dbErr);
    console.log("Swiply Server: Using cached registered count:", errMsg);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Run first update and schedule periodic background updates every 60 seconds
  updateRegisteredCount();
  setInterval(updateRegisteredCount, 60000);

  // Statistics and presence real data endpoint


  // PayU India Payment Integration Endpoints
  app.post("/api/payu/initiate", (req, res) => {
    try {
      const { amount, firstname, userId, phone, udf1, udf2 } = req.body;

      if (!amount || !firstname || !userId || !phone) {
        return res.status(400).json({ error: "Missing required fields (amount, firstname, userId, phone)." });
      }

      const key = process.env.PAYU_MERCHANT_KEY || "gtK42w";
      const salt = process.env.PAYU_MERCHANT_SALT || "eCwWELSp";

      const txnid = `txnid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const productinfo = "Swiply VIP Plan Access";

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

      // Hashing sequence: sha512(key|txnid|amount|productinfo|firstname|userId|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|salt)
      const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${userId}|${valUdf1}|${valUdf2}|${valUdf3}|${valUdf4}|${valUdf5}|${valUdf6}|${valUdf7}|${valUdf8}|${valUdf9}|${valUdf10}|${salt}`;
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
        userId,
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
      const userId = req.body.userId || "";
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

      // Reverse hashing sequence: sha512(salt|status|udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|userId|firstname|productinfo|amount|txnid|key)
      let hashSequence = `${salt}|${status}|${valUdf10}|${valUdf9}|${valUdf8}|${valUdf7}|${valUdf6}|${valUdf5}|${valUdf4}|${valUdf3}|${valUdf2}|${valUdf1}|${userId}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
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
        
        const safeEmail = encodeURIComponent(userId || "");
        const safeFirstname = encodeURIComponent(firstname || "");
        const safeAmount = encodeURIComponent(amount || "");
        return res.redirect(`${origin}/?payment=success&txnid=${txnid}&plan=${valUdf2}&userId=${safeEmail}&firstname=${safeFirstname}&amount=${safeAmount}`);
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

  app.get("/api/match/status", async (req, res) => {
    try {
      const peerId = req.query.peerId as string;
      if (!peerId) return res.status(400).json({ error: "Missing peerId" });

      const getRes = await docClient.send(new GetCommand({
        TableName: "swiply_users",
        Key: { userId: peerId }
      }));

      const user = getRes.Item;
      if (!user) {
        return res.json({ status: "idle" });
      }

      if (user.roomId) {
        return res.json({ 
          status: "matched", 
          partner: { peerId: user.roomId.replace(peerId, '').replace('_', '') },
          role: "answerer" 
        });
      } else if (user.searching) {
        return res.json({ status: "waiting" });
      } else {
        return res.json({ status: "idle" });
      }
    } catch (err: any) {
      console.error("Error in /api/match/status:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/match/block", async (req, res) => {
    try {
      const { blockerPeerId, blockedPeerId } = req.body;
      if (!blockerPeerId || !blockedPeerId) {
        return res.status(400).json({ error: "Missing blockerPeerId or blockedPeerId" });
      }

      try {
        await docClient.send(new DeleteCommand({ TableName: "swiply_queue", Key: { userId: blockerPeerId } }));
        await docClient.send(new DeleteCommand({ TableName: "swiply_queue", Key: { userId: blockedPeerId } }));
        await docClient.send(new PutCommand({ TableName: "swiply_users", Item: { userId: blockerPeerId, searching: false, roomId: null } }));
        await docClient.send(new PutCommand({ TableName: "swiply_users", Item: { userId: blockedPeerId, searching: false, roomId: null } }));
      } catch (e) {
        console.error("Error updating DynamoDB on block:", e);
      }

      return res.json({ success: true });
    } catch (err) {
      console.error("Error in /api/match/block:", err);
      return res.status(500).json({ error: "Failed to block user" });
    }
  });

  // API Route for AI-driven Sentiment Analysis
  app.post("/api/sentiment", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Missing required text field." });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      // High-quality fallback if API key is missing or unconfigured
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("MY_")) {
        const lowerText = text.toLowerCase();
        let tone = "neutral";
        let emoji = "💬";

        if (lowerText.includes("love") || lowerText.includes("❤️") || lowerText.includes("sweet") || lowerText.includes("cute")) {
          tone = "affectionate";
          emoji = "💖";
        } else if (lowerText.includes("hello") || lowerText.includes("hi") || lowerText.includes("hey") || lowerText.includes("👋") || lowerText.includes("sup")) {
          tone = "friendly";
          emoji = "👋";
        } else if (lowerText.includes("lol") || lowerText.includes("haha") || lowerText.includes("funny") || lowerText.includes("😂") || lowerText.includes("xd")) {
          tone = "playful";
          emoji = "😂";
        } else if (lowerText.includes("sad") || lowerText.includes("sorry") || lowerText.includes("cry") || lowerText.includes("😢") || lowerText.includes("hurt")) {
          tone = "sad";
          emoji = "😢";
        } else if (lowerText.includes("wow") || lowerText.includes("cool") || lowerText.includes("awesome") || lowerText.includes("omg") || lowerText.includes("excited")) {
          tone = "excited";
          emoji = "🤩";
        } else if (lowerText.includes("no") || lowerText.includes("stop") || lowerText.includes("hate") || lowerText.includes("angry") || lowerText.includes("worst")) {
          tone = "annoyed";
          emoji = "😒";
        } else if (lowerText.includes("?") || lowerText.includes("why") || lowerText.includes("how") || lowerText.includes("who")) {
          tone = "curious";
          emoji = "🤔";
        }

        return res.json({ tone, emoji });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze the sentiment/tone of this chat message in a standard casual video call context: "${text}".
Return a JSON object with:
- "tone": one-word description of tone (e.g. "friendly", "playful", "excited", "curious", "sarcastic", "sad", "annoyed", "neutral", "chill")
- "emoji": single matching emoji (e.g. "👋", "😂", "🤩", "🤔", "😏", "😢", "😒", "💬", "😎")

STRICT GUIDELINES:
1. Return ONLY raw JSON matching the schema. No markdown formatting.`,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      let jsonStr = response.text.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
      }
      
      const result = JSON.parse(jsonStr);
      return res.json({
        tone: result.tone || "neutral",
        emoji: result.emoji || "💬"
      });
    } catch (error) {
      console.error("Sentiment analysis error:", error);
      return res.json({ tone: "neutral", emoji: "💬" });
    }
  });

  // API Route for Gemini-Powered Gen-Z Chats
  // DB Routes (DynamoDB API Proxy) with in-memory fallback
  app.post("/api/db/user", async (req, res) => {
    try {
      const { userId, profile } = req.body;
      if (!userId) return res.status(400).json({ error: "Missing userId" });
      const sanitizedId = userId.toLowerCase().trim();
      
      let currentProfile: any = {};
      try {
        const getRes = await docClient.send(new GetCommand({
          TableName: "swiply_users",
          Key: { userId: sanitizedId }
        }));
        if (getRes.Item) currentProfile = getRes.Item;
      } catch (e) {}
      
      const mergedProfile = {
        userId: sanitizedId,
        name: profile.name || currentProfile.name || userId.split("@")[0],
        country: profile.country || currentProfile.country || "India",
        avatar: profile.avatar || currentProfile.avatar || "🎮",
        isPremium: profile.isPremium !== undefined ? profile.isPremium : (currentProfile.isPremium || false),
        createdAt: currentProfile.createdAt || new Date().toISOString(),
        password: profile.password || currentProfile.password || ""
      };

      await docClient.send(new PutCommand({
        TableName: "swiply_users",
        Item: mergedProfile
      }));
      return res.json({ success: true, profile: mergedProfile });
    } catch (err: any) {
      console.error("DB error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/db/user/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const sanitizedId = userId.toLowerCase().trim();
      const getRes = await docClient.send(new GetCommand({
        TableName: "swiply_users",
        Key: { userId: sanitizedId }
      }));
      if (getRes.Item) {
        return res.json(getRes.Item);
      }
      return res.status(404).json({ error: "Not found" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/db/payment", async (req, res) => {
    try {
      const payment = req.body;
      const paymentId = payment.txnid;
      const paymentRecord = {
        txnid: paymentId,
        amount: payment.amount,
        userId: payment.userId.toLowerCase().trim(),
        firstname: payment.firstname || "",
        phone: payment.phone || "",
        plan: payment.plan || "monthly",
        timestamp: new Date().toISOString()
      };
      
      await docClient.send(new PutCommand({
        TableName: "swiply_payments",
        Item: paymentRecord
      }));
      
      const userIdId = paymentRecord.userId;
      let currentProfile: any = {};
      try {
        const getRes = await docClient.send(new GetCommand({
          TableName: "swiply_users",
          Key: { userId: userIdId }
        }));
        if (getRes.Item) currentProfile = getRes.Item;
      } catch (e) {}
      
      currentProfile.isPremium = true;
      currentProfile.userId = userIdId;

      await docClient.send(new PutCommand({
        TableName: "swiply_users",
        Item: currentProfile
      }));
      
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/db/report", async (req, res) => {
    try {
      await docClient.send(new PutCommand({
        TableName: "swiply_reports",
        Item: req.body
      }));
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/db/block", async (req, res) => {
    try {
      await docClient.send(new PutCommand({
        TableName: "swiply_blocks",
        Item: req.body
      }));
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
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

  const httpServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Swiply server running on port ${PORT}`);
  });
}

startServer();
