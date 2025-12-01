package com.interacthub.chat.controller;

import com.interacthub.chat.model.SignalMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/chat/call")
@CrossOrigin(origins = "http://localhost:3000")
public class CallController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @PostMapping("/start")
    public ResponseEntity<?> startCall(@RequestBody CallRequest request) {
        try {
            // Generate a unique room ID for the call
            String roomId = (request.getRoomId() != null && !request.getRoomId().isBlank())
                    ? request.getRoomId()
                    : ("call_" + System.currentTimeMillis() + "_" + request.getFromUser());
            
            Map<String, Object> response = new HashMap<>();
            response.put("roomId", roomId);
            response.put("status", "call_initiated");
            response.put("message", "Call room created successfully");
            
            // Notify the target user about the incoming call
            Map<String, Object> callNotification = new HashMap<>();
            callNotification.put("type", "incoming_call");
            callNotification.put("roomId", roomId);
            callNotification.put("fromUser", request.getFromUser());
            callNotification.put("callType", request.getCallType());
            callNotification.put("timestamp", System.currentTimeMillis());
            
            // Primary: user-destination (requires user session principal configured as email)
            messagingTemplate.convertAndSend("/user/" + request.getToUser() + "/queue/notify", callNotification);
            // Fallback: public topic per user-id so unauthenticated/simple clients can subscribe
            messagingTemplate.convertAndSend("/topic/notify." + request.getToUser(), callNotification);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to start call: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/offer")
    public ResponseEntity<?> handleOffer(@RequestBody SignalData offer) {
        try {
            SignalMessage signalMessage = new SignalMessage();
            signalMessage.setRoomId(offer.getRoomId());
            signalMessage.setFromName(offer.getFromUser());
            signalMessage.setToName(offer.getToUser());
            signalMessage.setType("offer");
            signalMessage.setSdp(offer.getSdp());
            signalMessage.setMedia(offer.getMedia());
            
            // Relay the offer to the target user
            messagingTemplate.convertAndSend("/queue/signal." + offer.getRoomId(), signalMessage);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "offer_sent");
            response.put("message", "WebRTC offer sent successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to handle offer: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/answer")
    public ResponseEntity<?> handleAnswer(@RequestBody SignalData answer) {
        try {
            SignalMessage signalMessage = new SignalMessage();
            signalMessage.setRoomId(answer.getRoomId());
            signalMessage.setFromName(answer.getFromUser());
            signalMessage.setToName(answer.getToUser());
            signalMessage.setType("answer");
            signalMessage.setSdp(answer.getSdp());
            signalMessage.setMedia(answer.getMedia());
            
            // Relay the answer to the caller
            messagingTemplate.convertAndSend("/queue/signal." + answer.getRoomId(), signalMessage);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "answer_sent");
            response.put("message", "WebRTC answer sent successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to handle answer: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/candidate")
    public ResponseEntity<?> handleCandidate(@RequestBody SignalData candidate) {
        try {
            SignalMessage signalMessage = new SignalMessage();
            signalMessage.setRoomId(candidate.getRoomId());
            signalMessage.setFromName(candidate.getFromUser());
            signalMessage.setToName(candidate.getToUser());
            signalMessage.setType("candidate");
            signalMessage.setCandidate(candidate.getCandidate());
            
            // Relay the ICE candidate
            messagingTemplate.convertAndSend("/queue/signal." + candidate.getRoomId(), signalMessage);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "candidate_sent");
            response.put("message", "ICE candidate sent successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to handle candidate: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/end")
    public ResponseEntity<?> endCall(@RequestBody CallEndRequest request) {
        try {
            SignalMessage signalMessage = new SignalMessage();
            signalMessage.setRoomId(request.getRoomId());
            signalMessage.setFromName(request.getFromUser());
            signalMessage.setToName(request.getToUser());
            signalMessage.setType("hangup");
            
            // Notify all participants that the call has ended
            messagingTemplate.convertAndSend("/queue/signal." + request.getRoomId(), signalMessage);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "call_ended");
            response.put("message", "Call ended successfully");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to end call: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // DTOs for request/response
    public static class CallRequest {
        private String fromUser;
        private String toUser;
        private String callType; // "voice" or "video"
        private String roomId;   // optional shared room

        public String getFromUser() { return fromUser; }
        public void setFromUser(String fromUser) { this.fromUser = fromUser; }
        public String getToUser() { return toUser; }
        public void setToUser(String toUser) { this.toUser = toUser; }
        public String getCallType() { return callType; }
        public void setCallType(String callType) { this.callType = callType; }
        public String getRoomId() { return roomId; }
        public void setRoomId(String roomId) { this.roomId = roomId; }
    }

    public static class SignalData {
        private String roomId;
        private String fromUser;
        private String toUser;
        private String sdp;
        private String candidate;
        private String media;

        public String getRoomId() { return roomId; }
        public void setRoomId(String roomId) { this.roomId = roomId; }
        public String getFromUser() { return fromUser; }
        public void setFromUser(String fromUser) { this.fromUser = fromUser; }
        public String getToUser() { return toUser; }
        public void setToUser(String toUser) { this.toUser = toUser; }
        public String getSdp() { return sdp; }
        public void setSdp(String sdp) { this.sdp = sdp; }
        public String getCandidate() { return candidate; }
        public void setCandidate(String candidate) { this.candidate = candidate; }
        public String getMedia() { return media; }
        public void setMedia(String media) { this.media = media; }
    }

    public static class CallEndRequest {
        private String roomId;
        private String fromUser;
        private String toUser;

        public String getRoomId() { return roomId; }
        public void setRoomId(String roomId) { this.roomId = roomId; }
        public String getFromUser() { return fromUser; }
        public void setFromUser(String fromUser) { this.fromUser = fromUser; }
        public String getToUser() { return toUser; }
        public void setToUser(String toUser) { this.toUser = toUser; }
    }
}
