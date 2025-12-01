package com.interacthub.chat.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.interacthub.chat.model.ChatMessage;
import com.interacthub.chat.service.ChatService;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatService chatService;

    // Handle incoming chat messages
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessage chatMessage) {
        // Save message to database
        ChatMessage savedMessage = chatService.saveMessage(chatMessage);

        // Broadcast to channel subscribers (chat stream)
        messagingTemplate.convertAndSend("/topic/channel." + chatMessage.getChannelId() + ".chat", savedMessage);
    }

    // Handle WebRTC signaling for voice/video calls
    @MessageMapping("/chat.sendSignal")
    public void sendSignal(@Payload String signalData) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> wrapper = mapper.readValue(signalData, java.util.Map.class);
            String channelId = String.valueOf(wrapper.get("channelId"));
            // For backward compatibility, allow either {channelId, signal:{...}} or flat fields
            Object signal = wrapper.get("signal");
            String outbound = signal != null ? mapper.writeValueAsString(signal) : signalData;
            messagingTemplate.convertAndSend("/topic/channel." + channelId + ".signal", outbound);
        } catch (Exception e) {
            System.err.println("Error processing signaling message: " + e.getMessage());
        }
    }

    // Handle video call events
    @MessageMapping("/chat.sendCallEvent")
    public void sendCallEvent(@Payload String callEventData) {
        try {
            // Parse the call event data
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> event = mapper.readValue(callEventData, java.util.Map.class);
            
            String channelId = (String) event.get("channelId");
            String eventType = (String) event.get("type");
            
            // Broadcast call event to channel participants
            messagingTemplate.convertAndSend("/topic/channel." + channelId + ".call", callEventData);
            
            // Log the event
            System.out.println("Video call event: " + eventType + " in channel " + channelId);
        } catch (Exception e) {
            System.err.println("Error processing call event: " + e.getMessage());
        }
    }

    // Handle voice call events
    @MessageMapping("/chat.sendVoiceCallEvent")
    public void sendVoiceCallEvent(@Payload String voiceCallEventData) {
        try {
            // Parse the voice call event data
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> event = mapper.readValue(voiceCallEventData, java.util.Map.class);
            
            String channelId = (String) event.get("channelId");
            String eventType = (String) event.get("type");
            
            // Broadcast voice call event to channel participants
            messagingTemplate.convertAndSend("/topic/channel." + channelId + ".voice-call", voiceCallEventData);
            
            // Log the event
            System.out.println("Voice call event: " + eventType + " in channel " + channelId);
        } catch (Exception e) {
            System.err.println("Error processing voice call event: " + e.getMessage());
        }
    }

    // Handle voice call signaling
    @MessageMapping("/chat.sendVoiceSignal")
    public void sendVoiceSignal(@Payload String voiceSignalData) {
        try {
            // Parse the voice signal data
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> signal = mapper.readValue(voiceSignalData, java.util.Map.class);
            
            String channelId = (String) signal.get("channelId");
            
            // Broadcast voice signaling data to other participants
            messagingTemplate.convertAndSend("/topic/channel." + channelId + ".voice-signal", voiceSignalData);
            
        } catch (Exception e) {
            System.err.println("Error processing voice signal: " + e.getMessage());
        }
    }

    // Handle user joining a channel
    @MessageMapping("/chat.joinChannel")
    public void joinChannel(@Payload String channelId, @Payload Long userId) {
        ChatMessage joinMessage = new ChatMessage();
        joinMessage.setChannelId(channelId);
        joinMessage.setSenderId(userId);
        joinMessage.setContent("joined the channel");
        joinMessage.setType(ChatMessage.MessageType.JOIN);

        chatService.saveMessage(joinMessage);
        messagingTemplate.convertAndSend("/topic/channel." + channelId + ".chat", joinMessage);
    }

    // Handle user leaving a channel
    @MessageMapping("/chat.leaveChannel")
    public void leaveChannel(@Payload String channelId, @Payload Long userId) {
        ChatMessage leaveMessage = new ChatMessage();
        leaveMessage.setChannelId(channelId);
        leaveMessage.setSenderId(userId);
        leaveMessage.setContent("left the channel");
        leaveMessage.setType(ChatMessage.MessageType.LEAVE);

        chatService.saveMessage(leaveMessage);
        messagingTemplate.convertAndSend("/topic/channel." + channelId + ".chat", leaveMessage);
    }

    // Typing indicator broadcast: expects JSON { channelId, userId, userName, isTyping }
    @MessageMapping("/chat.typing")
    public void typing(@Payload String typingPayload) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> data = mapper.readValue(typingPayload, java.util.Map.class);
            String channelId = String.valueOf(data.get("channelId"));
            messagingTemplate.convertAndSend("/topic/channel." + channelId + ".typing", typingPayload);
        } catch (Exception e) {
            System.err.println("Error processing typing indicator: " + e.getMessage());
        }
    }

    // Read receipt broadcast: expects JSON { channelId, messageId, userId, userName }
    @MessageMapping("/chat.readReceipt")
    public void readReceipt(@Payload String receiptPayload) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> data = mapper.readValue(receiptPayload, java.util.Map.class);
            String channelId = String.valueOf(data.get("channelId"));
            messagingTemplate.convertAndSend("/topic/channel." + channelId + ".readReceipt", receiptPayload);
        } catch (Exception e) {
            System.err.println("Error processing read receipt: " + e.getMessage());
        }
    }

    // Presence heartbeat: expects JSON { userId, userName, timestamp }
    @MessageMapping("/presence.heartbeat")
    public void presenceHeartbeat(@Payload String heartbeatPayload) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> data = mapper.readValue(heartbeatPayload, java.util.Map.class);
            String userId = String.valueOf(data.get("userId"));
            java.util.Map<String, Object> status = new java.util.HashMap<>();
            status.put("isOnline", true);
            status.put("lastSeen", data.get("timestamp"));
            status.put("userId", data.get("userId"));
            status.put("userName", data.get("userName"));
            messagingTemplate.convertAndSend("/topic/presence." + userId, mapper.writeValueAsString(status));
        } catch (Exception e) {
            System.err.println("Error processing presence heartbeat: " + e.getMessage());
        }
    }
}
