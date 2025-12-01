package com.interacthub.chat.controller;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.interacthub.chat.model.DirectMessage;
import com.interacthub.chat.model.GroupMessage;
import com.interacthub.chat.model.MessageStatus;
import com.interacthub.chat.repository.DirectMessageRepository;
import com.interacthub.chat.repository.GroupMessageRepository;
import com.interacthub.chat.repository.MessageStatusRepository;

@RestController
@RequestMapping("/api/message-status")
@CrossOrigin(origins = "http://localhost:3000")
public class MessageStatusController {
    
    private final MessageStatusRepository statusRepo;
    private final GroupMessageRepository groupMsgRepo;
    private final DirectMessageRepository directMsgRepo;
    private final SimpMessagingTemplate broker;
    
    public MessageStatusController(
            MessageStatusRepository statusRepo,
            GroupMessageRepository groupMsgRepo,
            DirectMessageRepository directMsgRepo,
            SimpMessagingTemplate broker) {
        this.statusRepo = statusRepo;
        this.groupMsgRepo = groupMsgRepo;
        this.directMsgRepo = directMsgRepo;
        this.broker = broker;
    }
    
    // Mark message as delivered
    @MessageMapping("/message.delivered")
    public void markDelivered(Map<String, Object> payload) {
        Long messageId = ((Number) payload.get("messageId")).longValue();
        String messageType = (String) payload.get("messageType"); // GROUP or DIRECT
        String userId = (String) payload.get("userId");
        String senderId = (String) payload.get("senderId");
        
        // Create status record
        MessageStatus status = new MessageStatus();
        status.setMessageId(messageId);
        status.setMessageType(messageType);
        status.setUserId(userId);
        status.setStatus("DELIVERED");
        status.setTimestamp(Instant.now());
        statusRepo.save(status);
        
        // Update message status
        updateMessageStatus(messageId, messageType, "DELIVERED");
        
        // Notify sender
        broker.convertAndSend("/user/" + senderId + "/queue/status", Map.of(
            "messageId", messageId,
            "status", "DELIVERED",
            "userId", userId
        ));
    }
    
    // Mark message as read
    @MessageMapping("/message.read")
    public void markRead(Map<String, Object> payload) {
        Long messageId = ((Number) payload.get("messageId")).longValue();
        String messageType = (String) payload.get("messageType");
        String userId = (String) payload.get("userId");
        String senderId = (String) payload.get("senderId");
        
        // Create or update status record
        MessageStatus status = new MessageStatus();
        status.setMessageId(messageId);
        status.setMessageType(messageType);
        status.setUserId(userId);
        status.setStatus("READ");
        status.setTimestamp(Instant.now());
        statusRepo.save(status);
        
        // Update message status
        updateMessageStatus(messageId, messageType, "READ");
        
        // Notify sender
        broker.convertAndSend("/user/" + senderId + "/queue/status", Map.of(
            "messageId", messageId,
            "status", "READ",
            "userId", userId
        ));
    }
    
    // Get message info (who read/delivered)
    @GetMapping("/{messageType}/{messageId}")
    public ResponseEntity<Map<String, Object>> getMessageInfo(
            @PathVariable String messageType,
            @PathVariable Long messageId) {
        
        List<MessageStatus> statuses = statusRepo.findByMessageIdAndMessageType(messageId, messageType);
        
        List<MessageStatus> delivered = statuses.stream()
            .filter(s -> "DELIVERED".equals(s.getStatus()))
            .toList();
        
        List<MessageStatus> read = statuses.stream()
            .filter(s -> "READ".equals(s.getStatus()))
            .toList();
        
        return ResponseEntity.ok(Map.of(
            "messageId", messageId,
            "delivered", delivered,
            "read", read
        ));
    }
    
    private void updateMessageStatus(Long messageId, String messageType, String newStatus) {
        if ("GROUP".equals(messageType)) {
            groupMsgRepo.findById(messageId).ifPresent(msg -> {
                // Only upgrade status, never downgrade
                if (shouldUpgradeStatus(msg.getStatus(), newStatus)) {
                    msg.setStatus(newStatus);
                    groupMsgRepo.save(msg);
                }
            });
        } else if ("DIRECT".equals(messageType)) {
            directMsgRepo.findById(messageId).ifPresent(msg -> {
                if (shouldUpgradeStatus(msg.getStatus(), newStatus)) {
                    msg.setStatus(newStatus);
                    directMsgRepo.save(msg);
                }
            });
        }
    }
    
    private boolean shouldUpgradeStatus(String currentStatus, String newStatus) {
        if ("READ".equals(currentStatus)) return false; // Already at highest
        if ("READ".equals(newStatus)) return true;
        if ("DELIVERED".equals(currentStatus)) return false;
        if ("DELIVERED".equals(newStatus)) return true;
        return false;
    }
}
