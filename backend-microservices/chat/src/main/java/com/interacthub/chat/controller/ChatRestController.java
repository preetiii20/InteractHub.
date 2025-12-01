package com.interacthub.chat.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.interacthub.chat.model.Channel;
import com.interacthub.chat.model.Interaction;
import com.interacthub.chat.repository.InteractionRepository;
import com.interacthub.chat.service.ChannelService;
import com.interacthub.chat.service.InteractionService;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/chat")
public class ChatRestController {

    @Autowired private RestTemplate restTemplate;
    @Autowired private ChannelService channelService;
    @Autowired private InteractionService interactionService;
    @Autowired private InteractionRepository interactionRepository;
    @Autowired private SimpMessagingTemplate messagingTemplate; 

    // 1. Admin Visibility: Fetches all interactions (comments/reactions) for Admin history page
    @GetMapping("/interactions/history/all")
    public ResponseEntity<List<Interaction>> getAllInteractionHistory() {
        List<Interaction> interactions = interactionRepository.findAll();
        return ResponseEntity.ok(interactions);
    }
    
    // 2. Admin/Manager Integration: Fetches all users for Recipient Selector
    @GetMapping("/users/all")
    public List<?> getAllChatRecipients() {
        String adminUsersUrl = "http://localhost:8081/api/admin/users/all";
        try {
            ResponseEntity<List> response = restTemplate.getForEntity(adminUsersUrl, List.class);
            System.out.println("✅ Fetched " + (response.getBody() != null ? response.getBody().size() : 0) + " users for chat");
            return response.getBody();
        } catch (Exception e) {
            System.err.println("❌ Error fetching user list for chat: " + e.getMessage());
            return List.of(Map.of("error", "User list unavailable."));
        }
    }

    // 3. Manager Integration: Creates a Project Chat Group
    @PostMapping("/channels/create")
    public ResponseEntity<?> createProjectChannel(@RequestBody Map<String, String> payload) {
        String channelId = payload.get("channelId");
        String channelName = payload.get("channelName");
        
        try {
            Channel newChannel = channelService.createChannel(channelId, channelName, Channel.ChannelType.PROJECT, null);
            
            // Push announcement to relevant dashboards that a new project channel is available
            messagingTemplate.convertAndSend("/topic/system_alerts", 
                Map.of("type", "NEW_PROJECT_CHANNEL", "name", channelName, "id", channelId));
                
            return ResponseEntity.ok(newChannel);
        } catch (RuntimeException e) {
             return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 4. Manager/User Action: Posts live comments/reactions
    @PostMapping("/interactions/post")
    public ResponseEntity<?> postInteraction(@RequestBody Map<String, Object> payload) {
        
        try {
            // Convert payload to Interaction object
            Interaction interaction = new Interaction();
            interaction.setSenderId(((Number) payload.get("senderId")).longValue());
            interaction.setEntityType((String) payload.get("entityType"));
            interaction.setEntityId(((Number) payload.get("entityId")).longValue());
            interaction.setContent((String) payload.get("content"));
            interaction.setType(Interaction.InteractionType.COMMENT); 
            
            // Saves interaction and returns the saved entity
            Interaction savedInteraction = interactionService.saveGeneralInteraction(interaction); 

            // PUSH LIVE UPDATE: Broadcast the comment instantly
            messagingTemplate.convertAndSend("/topic/interactions", 
                Map.of("entityId", savedInteraction.getEntityId(), "content", savedInteraction.getContent()));
            
            return ResponseEntity.ok(Map.of("message", "Interaction saved and broadcasted live."));
        } catch (Exception e) {
             return ResponseEntity.status(500).body(Map.of("error", "Error saving interaction: " + e.getMessage()));
        }
    }

    // 5. Broadcast: New Announcement created (called by Admin Service)
    @PostMapping("/broadcast/announcement")
    public ResponseEntity<?> broadcastNewAnnouncement(@RequestBody Map<String, Object> announcementPayload) {
        try {
            // Push to a common topic consumed by dashboards (e.g., Manager UI toast/listeners)
            messagingTemplate.convertAndSend("/topic/announcements.new", announcementPayload);
            return ResponseEntity.ok(Map.of("message", "Announcement broadcasted."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to broadcast announcement"));
        }
    }

    // 6. Broadcast: New Poll created (called by Admin Service)
    @PostMapping("/broadcast/poll")
    public ResponseEntity<?> broadcastNewPoll(@RequestBody Map<String, Object> pollPayload) {
        try {
            messagingTemplate.convertAndSend("/topic/polls.new", pollPayload);
            return ResponseEntity.ok(Map.of("message", "Poll broadcasted."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to broadcast poll"));
        }
    }
}