const fs = require('fs');
let content = fs.readFileSync('src/components/VideoChatArea.tsx', 'utf8');

// 1. Add imports
const imports = `import { ConsoleLogger, LogLevel, DefaultDeviceController, DefaultMeetingSession, MeetingSessionConfiguration } from 'amazon-chime-sdk-js';\n`;
content = content.replace('import { saveUserReport', imports + 'import { saveUserReport');

// 2. Add MeetingSession ref
content = content.replace('const peerConnectionRef = useRef<RTCPeerConnection | null>(null);', 'const meetingSessionRef = useRef<any>(null);\n  const peerConnectionRef = useRef<any>(null); // Legacy\n');

// 3. Update cleanupWebRTC
const cleanupReplacement = `const cleanupWebRTC = () => {
    console.log("WebRTC: Cleaning up peer connection and intervals");
    if (meetingSessionRef.current) {
      meetingSessionRef.current.audioVideo.stop();
      meetingSessionRef.current = null;
    }
`;
content = content.replace(/const cleanupWebRTC = \(\) => \{\n    console.log\("WebRTC: Cleaning up peer connection and intervals"\);\n    if \(peerConnectionRef\.current\) \{\n.*?\n    \}/s, cleanupReplacement);

// 4. Update onMatched to store meeting data
content = content.replace(/setMatchedPartner\(\{ \.\.\.matchData\.partner, peerId: matchData\.partner\.id \}\);/g, `setMatchedPartner({ ...matchData.partner, peerId: matchData.partner.id, meeting: matchData.meeting, attendee: matchData.attendee });`);

// 5. Update initWebRTC
const initWebRTCReplacement = `const initWebRTC = async (currentPartner: Partner, isOfferer: boolean) => {
    try {
      console.log(\`Chime: Initializing MeetingSession. Is Offerer: \${isOfferer}\`);
      setDebugMatchStatus(\`Matched with \${currentPartner.id} (\${isOfferer ? "Offerer" : "Answerer"})\`);
      
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
        console.log(\`Attendee \${attendeeId} present: \${present}\`);
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

      if (localStreamRef.current) {
        const audioTracks = localStreamRef.current.getAudioTracks();
        if (audioTracks.length > 0) {
          await audioVideo.chooseAudioInputDevice(localStreamRef.current);
        }
        const videoTracks = localStreamRef.current.getVideoTracks();
        if (videoTracks.length > 0) {
          await audioVideo.chooseVideoInputDevice(localStreamRef.current);
          audioVideo.startLocalVideoTile();
        }
      }

      audioVideo.start();
      setDebugConnectionState("connected");
      hasRemoteDescriptionRef.current = true;
      if (localVideoRef.current && localStreamRef.current) {
         localVideoRef.current.srcObject = localStreamRef.current;
      }

    } catch (err) {
      console.error("Chime: initWebRTC failed:", err);
      setDebugConnectionState("failed");
    }
  };`;

content = content.replace(/const initWebRTC = async \(currentPartner: Partner, isOfferer: boolean\) => \{[\s\S]*?^\s*};\s*\n/m, initWebRTCReplacement + '\n');

// 6. Fix signals (since Chime handles signaling internally, we can ignore WebRTC signals)
content = content.replace(/if \(signal\.type === "offer"\) \{[\s\S]*?\} else if \(signal\.type === "answer"\) \{[\s\S]*?\} else if \(signal\.type === "candidate"\) \{[\s\S]*?\}/m, `// Chime handles signaling`);

fs.writeFileSync('src/components/VideoChatArea.tsx', content);
