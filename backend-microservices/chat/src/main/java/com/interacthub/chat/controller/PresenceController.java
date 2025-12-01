package com.interacthub.chat.controller;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.interacthub.chat.model.TypingEvent;
import com.interacthub.chat.model.UserPresence;
import com.interacthub.chat.repository.UserPresenceRepository;

@RestController
@RequestMapping("/api/presence")
@CrossOrigin(origins = "http://localhost:3000")
public class PresenceController {
    
    private final UserPresenceRepository presenceRepo;
    private final SimpMessagingTemplate broker;
    
    public PresenceController(UserPresenceRepository presenceRepo, SimpMessagingTemplate broker) {
        this.presenceRepo = presenceRepo;
        this.broker = broker;
    }
    
    // Heartbeat endpoint - client calls every 30 seconds
    @PostMapping("/heartbeat")
    public ResponseEntity<?> heartbeat(@RequestBody Map<String, String> payload) {
        String userId = payload.get("userId");
        String displayName = payload.get("displayName");
        
        UserPresence presence = presenceRepo.findById(userId)
            .orElse(new UserPresence());
        
        presence.setUserId(userId);
        presence.setDisplayName(displayName);
        presence.setStatus("ONLINE");
        presence.setLastHeartbeat(Instant.now());
        
        presenceRepo.save(presence);
        
        // Broadcast presence update
        broker.convertAndSend("/topic/presence", Map.of(
            "userId", userId,
            "status", "ONLINE",
            "displayName", displayName
        ));
        
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
    
    // Get user presence
    @GetMapping("/{userId}")
    public ResponseEntity<UserPresence> getPresence(@PathVariable String userId) {
        return presenceRepo.findById(userId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    // Get all online users
    @GetMapping("/online")
    public List<UserPresence> getOnlineUsers() {
        return presenceRepo.findByStatus("ONLINE");
    }
    
    // Typing indicator
    @MessageMapping("/typing")
    public void typing(TypingEvent event) {
        // Broadcast to room
        broker.convertAndSend("/topic/typing." + event.getRoomId(), event);
    }
    
    // Check for stale connections every minute
    @Scheduled(fixedRate = 60000)
    public void checkStaleConnections() {
        Instant threshold = Instant.now().minusSeconds(90); // 90 seconds = 3 missed heartbeats
        List<UserPresence> staleUsers = presenceRepo.findStaleOnlineUsers(threshold);
        
        for (UserPresence user : staleUsers) {
            user.setStatus("OFFLINE");
            user.setLastSeen(user.getLastHeartbeat());
            presenceRepo.save(user);
            
            // Broadcast offline status
            broker.convertAndSend("/topic/presence", Map.of(
                "userId", user.getUserId(),
                "status", "OFFLINE",
                "lastSeen", user.getLastSeen().toString()
            ));
        }
    }
}
