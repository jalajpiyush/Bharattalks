/// <reference types="vite/client" />
import { Amplify } from 'aws-amplify';
import { signInWithRedirect, signOut, getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';

// AWS Amplify Configuration
// Users should replace this with their actual Cognito setup
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
const domain = import.meta.env.VITE_COGNITO_DOMAIN;

if (!userPoolId || !userPoolClientId || !domain) {
  console.warn("Missing Cognito environment variables. Authentication will not work.");
}

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: userPoolId || '',
      userPoolClientId: userPoolClientId || '',
      loginWith: {
        oauth: {
          domain: domain || '',
          scopes: ['userId', 'profile', 'openid'],
          redirectSignIn: [window.location.origin],
          redirectSignOut: [window.location.origin],
          responseType: 'code'
        }
      }
    }
  }
});

// Singleton WebSocket connection for Real-Time Matchmaking & Signaling
class AWSSocket {
  private ws: WebSocket | null = null;
  private messageHandlers: Array<(data: any) => void> = [];
  
  connect(userId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    
    const wsUrl = import.meta.env.VITE_WS_URL;
    if (!wsUrl) {
      throw new Error("Missing VITE_WS_URL environment variable.");
    }
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log("AWS WebSocket: Connected to API Gateway");
      this.send({ type: "register", userId });
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.messageHandlers.forEach(handler => handler(data));
      } catch(e) {}
    };
    
    this.ws.onclose = () => {
      console.log("AWS WebSocket: Disconnected");
      this.ws = null;
    };
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      // Reconnect and send after a short delay
      this.connect(data.userId || "anonymous");
      setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(data));
        }
      }, 500);
    }
  }

  onMessage(handler: (data: any) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }
}

export const awsSocket = new AWSSocket();

// --- Auth Functions ---
export async function signInWithGoogle() {
  await signInWithRedirect({ provider: 'Google' });
  // After redirect, Amplify getCurrentUser will pick up the real session
  const currentUser = await getCurrentUser();
  const attributes = await fetchUserAttributes();
  return { 
    user: { 
      email: attributes.email, 
      displayName: attributes.given_name || attributes.email?.split('@')[0],
      photoURL: attributes.picture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150"
    } 
  };
}

export async function signOutUser() {
  try {
    await signOut();
  } catch(e) {}
}

// --- DynamoDB Backend APIs ---
export async function saveUserProfile(userId: string, profile: any) {
  const apiUrl = import.meta.env.VITE_API_URL || "";
  return fetch(`${apiUrl}/api/db/user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, profile })
  });
}

export async function getUserProfile(userId: string) {
  const apiUrl = import.meta.env.VITE_API_URL || "";
  const res = await fetch(`${apiUrl}/api/db/user/${encodeURIComponent(userId)}`);
  if (res.ok) {
    return await res.json();
  }
  return null;
}

export async function savePaymentRecord(payment: any) {
  const apiUrl = import.meta.env.VITE_API_URL || "";
  return fetch(`${apiUrl}/api/db/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payment)
  });
}

export async function updateUserOnlineStatus(userId: string, isOnline: boolean) {
  // Handled automatically via WebSocket presence now
}

export async function saveUserReport(report: any) {
  const apiUrl = import.meta.env.VITE_API_URL || "";
  return fetch(`${apiUrl}/api/db/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report)
  });
}

export async function saveUserBlock(block: any) {
  const apiUrl = import.meta.env.VITE_API_URL || "";
  return fetch(`${apiUrl}/api/db/block`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(block)
  });
}

// --- Realtime WebSocket APIs ---
export async function enterMatchmakingQueue(userData: any) {
  awsSocket.send({ type: "matchmaking_join", userId: userData.peerId, userData });
  return 1;
}

export async function leaveMatchmakingQueue(peerId: string) {
  awsSocket.send({ type: "matchmaking_leave", userId: peerId });
}

export async function tryToMatchWithSomeone(myPeerId: string, genderFilter: string = "everyone", blockedPeerIds: string[] = []) {
  // Handled by the backend via WebSocket
  return false;
}

export function subscribeToMatchStatus(peerId: string, onMatched: (data: any) => void) {
  return awsSocket.onMessage((data) => {
    if (data.type === "matched") {
      onMatched({
        roomId: data.roomId,
        role: data.role,
        partner: data.partner,
        meeting: data.meeting,
        attendee: data.attendee
      });
    }
  });
}

export function sendSignal(receiverId: string, signal: any) {
  awsSocket.send({ type: "signal", receiverId, signal });
}

export function subscribeToSignals(myPeerId: string, onSignal: (senderId: string, signal: any) => void) {
  return awsSocket.onMessage((data) => {
    if (data.type === "signal") {
      onSignal(data.senderId, data.signal);
    }
  });
}

export async function sendChatMessage(receiverId: string, senderId: string, message: any) {
  awsSocket.send({ type: "chat_message", receiverId, message });
}

export function subscribeToChatMessages(myPeerId: string, onMessage: (message: any) => void) {
  return awsSocket.onMessage((data) => {
    if (data.type === "chat_message") {
      onMessage(data.message);
    }
  });
}

export function subscribeToOnlineUsersCount(onCount: (count: number) => void) {
  const fetchCount = () => {
    awsSocket.send({ type: "get_stats" });
  };
  
  const unsubscribe = awsSocket.onMessage((data) => {
    if (data.type === "stats") {
      onCount(data.onlineUsers || 1240);
    }
  });

  fetchCount();
  const interval = setInterval(fetchCount, 10000);
  
  return () => {
    clearInterval(interval);
    unsubscribe();
  };
}

export const db = {};
export const auth = {};
