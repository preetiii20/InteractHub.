# Call Notification & Acceptance Flow - COMPLETE GUIDE ✅

## Overview
This document explains how video and voice calls work, including how notifications are sent and how recipients accept calls.

## Call Flow Architecture

### 1. Caller Side (Initiates Call)
```
User clicks "Start Video/Voice Call"
    ↓
startVideoCall() / startVoiceCall() triggered
    ↓
Toast notification shown: "Calling [recipient name]..."
    ↓
POST /call/start sent to backend with:
  - fromUser: caller email
  - toUser: recipient email
  - callType: VIDEO or VOICE
  - roomId: unique call room ID
    ↓
Frontend shows "Calling..." screen with:
  - Animated phone icon
  - "Waiting for recipient to accept" message
  - Bouncing dots animation
  - "Cancel Call" button
    ↓
Waits for recipient to accept or call to timeout
```

### 2. Recipient Side (Receives Call)
```
Backend receives /call/start request
    ↓
Backend sends WebSocket notification to recipient:
  - type: 'incoming_call'
  - fromUser: caller email
  - callType: VIDEO or VOICE
  - roomId: call room ID
    ↓
Frontend receives notification via WebSocket
    ↓
IncomingCallModal displayed with:
  - Caller's avatar
  - Caller's name
  - Call type (Video/Voice)
  - "Accept" and "Decline" buttons
  - Ringing animation
    ↓
Recipient clicks "Accept" or "Decline"
```

### 3. Call Acceptance Flow
```
Recipient clicks "Accept"
    ↓
POST /call/accept sent to backend with:
  - fromUser: caller email
  - toUser: recipient email
  - callType: VIDEO or VOICE
  - roomId: call room ID
    ↓
Backend sends WebSocket notification back to caller:
  - type: 'call-accepted'
  - roomId: call room ID
    ↓
Caller receives 'call-accepted' event
    ↓
setAutoStart(true) triggered
    ↓
Jitsi iframe loads and call starts
    ↓
Both participants see Jitsi video/voice interface
```

## Key Components

### 1. EnhancedLiveCommunicationHub.jsx
**Responsibilities:**
- Manages call state (outgoing, incoming)
- Sends call start requests to backend
- Listens for incoming call notifications
- Handles call acceptance/decline
- Shows toast notifications

**Key Functions:**
- `startVideoCall()` - Initiates video call
- `startVoiceCall()` - Initiates voice call
- `handleWebSocketMessage()` - Processes incoming notifications
- `showToastNotification()` - Shows call notifications

### 2. JitsiVideoCall.jsx
**Responsibilities:**
- Shows "Calling..." screen while waiting for acceptance
- Displays Jitsi iframe when call is accepted
- Shows participants list
- Handles call end

**States:**
- `autoStart = false` → Shows "Calling..." screen
- `autoStart = true` → Starts Jitsi call
- `isCallActive = true` → Shows Jitsi interface

### 3. VoiceCallComponent.jsx
**Responsibilities:**
- Same as JitsiVideoCall but for voice calls
- Shows audio-only Jitsi interface
- Displays call duration timer
- Shows audio visualization

### 4. IncomingCallModal.jsx
**Responsibilities:**
- Displays incoming call notification
- Shows caller information
- Provides Accept/Decline buttons
- Plays ringing animation

## WebSocket Topics

### Incoming Call Notification
**Topic:** `/topic/user-notifications.{recipientEmail}`
**Message Type:** `incoming_call`
**Payload:**
```json
{
  "type": "incoming_call",
  "fromUser": "caller@example.com",
  "toUser": "recipient@example.com",
  "callType": "VIDEO",
  "roomId": "call_1234567890_caller@example.com"
}
```

### Call Accepted Notification
**Topic:** `/topic/user-notifications.{callerEmail}`
**Message Type:** `call-accepted`
**Payload:**
```json
{
  "type": "call-accepted",
  "roomId": "call_1234567890_caller@example.com",
  "fromUser": "recipient@example.com",
  "toUser": "caller@example.com",
  "callType": "VIDEO"
}
```

### Call Ended Notification
**Topic:** `/topic/call.{roomId}`
**Message Type:** `call-ended`
**Payload:**
```json
{
  "type": "call-ended",
  "roomId": "call_1234567890_caller@example.com",
  "fromUser": "caller@example.com",
  "timestamp": 1234567890
}
```

## Testing Instructions

### Test 1: Basic Call Initiation
1. Open 2 browser tabs (same browser, Chrome recommended)
2. Login as User A in Tab 1, User B in Tab 2
3. In Tab 1, select User B from conversations
4. Click "📹 Video Call" button
5. **Expected in Tab 1:** "Calling..." screen appears with cancel button
6. **Expected in Tab 2:** IncomingCallModal appears with User A's info

### Test 2: Call Acceptance
1. Follow Test 1 steps
2. In Tab 2, click "✓ Accept" button
3. **Expected in Tab 1:** Jitsi video interface loads
4. **Expected in Tab 2:** Jitsi video interface loads
5. Both should see each other's video

### Test 3: Call Decline
1. Follow Test 1 steps
2. In Tab 2, click "✕ Decline" button
3. **Expected in Tab 1:** Alert shows "Call declined by recipient"
4. **Expected in Tab 1:** Returns to chat view

### Test 4: Call Cancellation
1. Follow Test 1 steps
2. In Tab 1, click "Cancel Call" button
3. **Expected in Tab 1:** Returns to chat view
4. **Expected in Tab 2:** IncomingCallModal disappears

### Test 5: Voice Call
1. Repeat Test 1-2 but click "📞 Voice Call" instead
2. **Expected:** Same flow but with audio-only interface
3. **Expected:** Call duration timer visible
4. **Expected:** Audio visualization bars animated

### Test 6: Call End Broadcast
1. Complete a call (both participants connected)
2. In Tab 1, click "End Call"
3. **Expected in Tab 1:** Returns to chat view
4. **Expected in Tab 2:** Call automatically ends with notification

## Troubleshooting

### Issue: Recipient doesn't see incoming call notification
**Possible Causes:**
1. Backend not sending WebSocket notification
2. WebSocket connection not established
3. Recipient not subscribed to correct topic

**Solution:**
- Check browser console for WebSocket connection status
- Verify backend is sending notification to correct topic
- Check that recipient's email is correct in the notification

### Issue: Call doesn't start after acceptance
**Possible Causes:**
1. `autoStart` not being set to true
2. Jitsi iframe not loading
3. Room ID mismatch

**Solution:**
- Check console for "Call accepted event received" message
- Verify Jitsi iframe is loading (check network tab)
- Ensure room IDs match between caller and recipient

### Issue: Toast notification not showing
**Possible Causes:**
1. `showToastNotification` not being called
2. Notification state not updating
3. CSS not displaying notification

**Solution:**
- Check console for notification logs
- Verify notification state in React DevTools
- Check CSS for notification display styles

## Future Enhancements

1. **Call Timeout** - Auto-decline call after 30 seconds
2. **Missed Call Notification** - Show missed calls in history
3. **Call Recording** - Record calls for later playback
4. **Call Transfer** - Transfer call to another participant
5. **Conference Calls** - Support 3+ participants
6. **Call History** - Show past calls with duration
7. **Do Not Disturb** - Allow users to disable incoming calls
8. **Call Waiting** - Handle multiple incoming calls

## API Endpoints Required

### Backend Endpoints
1. `POST /call/start` - Initiate a call
2. `POST /call/accept` - Accept incoming call
3. `POST /call/decline` - Decline incoming call
4. `POST /call/end` - End active call

### WebSocket Topics
1. `/topic/user-notifications.{email}` - User notifications
2. `/topic/call.{roomId}` - Call-specific events
3. `/topic/notify.{email}` - General notifications

## Notes
- All calls use Jitsi Meet (free, open-source)
- No backend token generation needed
- WebSocket used for real-time notifications
- Call room IDs are unique per call
- Participants list updates in real-time
- Call end broadcasts to all participants
