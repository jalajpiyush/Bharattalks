/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Message {
  id: string;
  role: "user" | "model";
  sender: string;
  text: string;
  timestamp: string; // ISO String
  sentiment?: {
    tone: string;
    emoji: string;
  };
}

export interface Partner {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female";
  country: string;
  flag: string;
  interests: string[];
  style: string;
  avatarUrl: string;
  videoUrl?: string;
  status: string;
  bio: string;
  isReal?: boolean;
  peerId?: string;
  webrtcRole?: "offerer" | "answerer";
}

export interface MatchSession {
  status: "idle" | "searching" | "connected" | "disconnected" | "error";
  currentPartner: Partner | null;
  chatHistory: Message[];
  isMuted: boolean;
  isVideoEnabled: boolean;
  userStream: MediaStream | null;
  remoteStream: MediaStream | null;
}
